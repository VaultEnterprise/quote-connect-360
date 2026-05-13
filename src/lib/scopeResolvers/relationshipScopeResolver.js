/**
 * Relationship-Aware Scope Resolver
 * 
 * Enhances core scope resolution with MGA/Broker relationship context.
 * Determines whether an MGA may access a record based on:
 * - Explicit active BrokerMGARelationship
 * - Record classification (direct_broker_owned vs. mga_affiliated)
 * - Relationship scope definition
 * - Relationship status (ACTIVE only)
 * 
 * Gate 7A-3 Phase 7A-3.2
 * Backward-compatible with Gate 7A-0 scope resolution
 */

import { base44 } from '@/api/base44Client';

const RECORD_CLASSIFICATIONS = {
  DIRECT_BROKER_OWNED: 'direct_broker_owned',
  MGA_AFFILIATED: 'mga_affiliated'
};

const RELATIONSHIP_STATES_ALLOWED = ['ACTIVE'];
const VISIBILITY_REQUIRED = true;

class RelationshipScopeResolver {
  /**
   * Determine if MGA user can access a record via relationship scope
   * 
   * @param {string} user_email — MGA user email
   * @param {string} user_mga_id — MGA ID for user
   * @param {object} record — Record to evaluate (must include broker_agency_id, relationship_id)
   * @param {string} requested_action — read | create | update | delete
   * @returns {object} { allowed: boolean, reason: string, relationship_id?: string }
   */
  async canMGAAccessRecord(user_email, user_mga_id, record, requested_action) {
    // Step 1: Classify record
    const recordClassification = this._classifyRecord(record);

    // Step 2: Direct broker-owned records always denied to MGA
    if (recordClassification === RECORD_CLASSIFICATIONS.DIRECT_BROKER_OWNED) {
      return {
        allowed: false,
        reason: 'DENY_DIRECT_BROKER_OWNED',
        detail: 'Record is direct broker-owned; MGA access denied'
      };
    }

    // Step 3: MGA-affiliated records require valid relationship
    if (recordClassification === RECORD_CLASSIFICATIONS.MGA_AFFILIATED) {
      if (!record.relationship_id) {
        return {
          allowed: false,
          reason: 'DENY_MISSING_RELATIONSHIP_ID',
          detail: 'MGA-affiliated record missing relationship_id'
        };
      }

      // Step 4: Validate relationship exists, is ACTIVE, and user's MGA owns it
      const relationship = await this._validateRelationship(
        record.relationship_id,
        user_mga_id
      );

      if (!relationship.valid) {
        return {
          allowed: false,
          reason: relationship.reason,
          detail: relationship.detail
        };
      }

      // Step 5: Check scope definition for requested action
      const scopeAllows = this._evaluateScope(
        relationship.scope_definition,
        requested_action
      );

      if (!scopeAllows) {
        return {
          allowed: false,
          reason: 'DENY_ACTION_NOT_IN_SCOPE',
          detail: `Action '${requested_action}' not in relationship scope`
        };
      }

      return {
        allowed: true,
        reason: 'ALLOW_RELATIONSHIP_SCOPE',
        relationship_id: record.relationship_id
      };
    }

    // Step 6: Unknown classification
    return {
      allowed: false,
      reason: 'DENY_UNKNOWN_CLASSIFICATION',
      detail: 'Record classification unknown'
    };
  }

  /**
   * Determine broker user's direct access (backward-compatible)
   * Broker sees only their own direct_broker_owned records
   * 
   * @param {string} user_email
   * @param {string} user_broker_id
   * @param {object} record
   * @returns {object} { allowed: boolean, reason: string }
   */
  async canBrokerAccessRecord(user_email, user_broker_id, record) {
    const recordClassification = this._classifyRecord(record);

    // Broker can see only their own direct-broker-owned records
    if (recordClassification === RECORD_CLASSIFICATIONS.DIRECT_BROKER_OWNED) {
      if (record.broker_agency_id === user_broker_id) {
        return {
          allowed: true,
          reason: 'ALLOW_BROKER_DIRECT_OWNERSHIP'
        };
      }

      return {
        allowed: false,
        reason: 'DENY_NOT_BROKER_OWNER',
        detail: `Broker ${user_broker_id} does not own record`
      };
    }

    // Broker cannot see mga_affiliated records (those are MGA's domain)
    if (recordClassification === RECORD_CLASSIFICATIONS.MGA_AFFILIATED) {
      return {
        allowed: false,
        reason: 'DENY_BROKER_CANNOT_SEE_MGA_AFFILIATED',
        detail: 'Broker cannot access MGA-affiliated records'
      };
    }

    return {
      allowed: false,
      reason: 'DENY_UNKNOWN_CLASSIFICATION'
    };
  }

  /**
   * Classify a record as direct_broker_owned or mga_affiliated
   * @private
   * @param {object} record
   * @returns {string} classification
   */
  _classifyRecord(record) {
    if (!record) return null;

    // MGA-affiliated: has relationship_id
    if (record.relationship_id) {
      return RECORD_CLASSIFICATIONS.MGA_AFFILIATED;
    }

    // Direct broker-owned: no relationship_id, has broker_agency_id
    if (record.broker_agency_id && !record.relationship_id) {
      return RECORD_CLASSIFICATIONS.DIRECT_BROKER_OWNED;
    }

    return null;
  }

  /**
   * Validate relationship exists, is ACTIVE, and belongs to MGA
   * @private
   * @param {string} relationship_id
   * @param {string} user_mga_id
   * @returns {object} { valid: boolean, reason: string, detail: string, scope_definition?: object }
   */
  async _validateRelationship(relationship_id, user_mga_id) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);

    // Relationship doesn't exist
    if (!relationship) {
      return {
        valid: false,
        reason: 'DENY_RELATIONSHIP_NOT_FOUND',
        detail: `Relationship ${relationship_id} not found`
      };
    }

    // Relationship not owned by this MGA
    if (relationship.master_general_agent_id !== user_mga_id) {
      return {
        valid: false,
        reason: 'DENY_RELATIONSHIP_NOT_OWNED',
        detail: `Relationship not owned by MGA ${user_mga_id}`
      };
    }

    // Relationship not ACTIVE
    if (!RELATIONSHIP_STATES_ALLOWED.includes(relationship.relationship_status)) {
      const reason = {
        'PROPOSED': 'DENY_RELATIONSHIP_NOT_ACCEPTED',
        'AWAITING_ACCEPTANCE': 'DENY_RELATIONSHIP_AWAITING_ACCEPTANCE',
        'SUSPENDED': 'DENY_RELATIONSHIP_SUSPENDED',
        'TERMINATED': 'DENY_RELATIONSHIP_TERMINATED',
        'SCOPE_CHANGE_REQUESTED': 'DENY_RELATIONSHIP_SCOPE_CHANGE_PENDING'
      }[relationship.relationship_status] || 'DENY_RELATIONSHIP_INACTIVE';

      return {
        valid: false,
        reason,
        detail: `Relationship status is ${relationship.relationship_status}; only ACTIVE allowed`
      };
    }

    // Relationship visibility not active (explicitly turned off)
    if (relationship.visibility_active !== VISIBILITY_REQUIRED) {
      return {
        valid: false,
        reason: 'DENY_RELATIONSHIP_VISIBILITY_INACTIVE',
        detail: 'Relationship visibility is disabled'
      };
    }

    // Relationship is valid
    return {
      valid: true,
      scope_definition: relationship.scope_definition || {}
    };
  }

  /**
   * Evaluate if requested action is within scope definition
   * @private
   * @param {object} scope_definition
   * @param {string} action — read | create | update | delete
   * @returns {boolean}
   */
  _evaluateScope(scope_definition, action) {
    if (!scope_definition) return false;

    const allowedOps = scope_definition.allowed_operations || [];
    const deniedOps = scope_definition.denied_operations || [];

    // Wildcard denied for safety
    if (allowedOps.includes('*')) {
      return false;
    }

    // Action explicitly denied
    if (deniedOps.includes(action)) {
      return false;
    }

    // Action explicitly allowed
    if (allowedOps.includes(action)) {
      return true;
    }

    return false;
  }

  /**
   * Check if relationship is active and visible
   * @param {string} relationship_id
   * @param {string} user_mga_id
   * @returns {boolean}
   */
  async isRelationshipActiveAndVisible(relationship_id, user_mga_id) {
    const validation = await this._validateRelationship(relationship_id, user_mga_id);
    return validation.valid;
  }
}

export default new RelationshipScopeResolver();