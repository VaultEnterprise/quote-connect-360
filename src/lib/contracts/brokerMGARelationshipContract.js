/**
 * BrokerMGARelationshipContract
 * 
 * Provides immutable interface for MGA/Broker relationship lifecycle management.
 * All operations are auditable. No implicit visibility changes.
 * Broker Agencies remain first-class; MGA affiliation is optional.
 * 
 * Gate 7A-3 Implementation Phase 7A-3.1
 */

import { base44 } from '@/api/base44Client';

export const RELATIONSHIP_STATES = {
  PROPOSED: 'PROPOSED',
  AWAITING_ACCEPTANCE: 'AWAITING_ACCEPTANCE',
  ACTIVE: 'ACTIVE',
  SCOPE_CHANGE_REQUESTED: 'SCOPE_CHANGE_REQUESTED',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED'
};

export const RELATIONSHIP_STATES_TERMINAL = ['TERMINATED'];
export const RELATIONSHIP_STATES_ACTIVE = ['ACTIVE'];

class BrokerMGARelationshipContract {
  /**
   * Propose a new MGA/Broker relationship
   * @param {string} broker_agency_id
   * @param {string} master_general_agent_id
   * @param {string} operational_scope - 'limited' | 'full' | 'custom'
   * @param {object} scope_definition - allowed_operations, denied_operations, read_only_operations
   * @param {string} proposed_by_email
   * @param {string} proposed_by_role - 'platform_admin' | 'mga_admin' | 'broker_admin'
   * @returns {object} relationship record
   */
  async proposeBrokerMGARelationship(
    broker_agency_id,
    master_general_agent_id,
    operational_scope,
    scope_definition,
    proposed_by_email,
    proposed_by_role
  ) {
    if (!broker_agency_id || !master_general_agent_id) {
      throw new Error('broker_agency_id and master_general_agent_id required');
    }

    if (!['limited', 'full', 'custom'].includes(operational_scope)) {
      throw new Error('Invalid operational_scope');
    }

    if (!['platform_admin', 'mga_admin', 'broker_admin'].includes(proposed_by_role)) {
      throw new Error('Invalid proposed_by_role');
    }

    const relationship = await base44.entities.BrokerMGARelationship.create({
      broker_agency_id,
      master_general_agent_id,
      relationship_status: RELATIONSHIP_STATES.PROPOSED,
      operational_scope,
      scope_definition,
      proposed_by_email,
      proposed_by_role,
      proposed_date: new Date().toISOString(),
      visibility_active: false,
      audit_correlation_id: this._generateCorrelationId()
    });

    return relationship;
  }

  /**
   * Accept a proposed relationship
   * @param {string} relationship_id
   * @param {string} accepted_by_email
   * @returns {object} updated relationship (status: ACTIVE)
   */
  async acceptBrokerMGARelationship(relationship_id, accepted_by_email) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);

    if (!relationship) {
      throw new Error('Relationship not found');
    }

    if (relationship.relationship_status !== RELATIONSHIP_STATES.PROPOSED) {
      throw new Error(`Cannot accept relationship in ${relationship.relationship_status} state`);
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: RELATIONSHIP_STATES.ACTIVE,
      accepted_by_email,
      accepted_date: new Date().toISOString(),
      visibility_active: true,
      effective_date: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Request a scope change
   * @param {string} relationship_id
   * @param {object} new_scope_definition
   * @param {string} requested_by_email
   * @returns {object} updated relationship (status: SCOPE_CHANGE_REQUESTED)
   */
  async requestScopeChange(relationship_id, new_scope_definition, requested_by_email) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);

    if (!relationship) {
      throw new Error('Relationship not found');
    }

    if (relationship.relationship_status !== RELATIONSHIP_STATES.ACTIVE) {
      throw new Error('Can only request scope change on ACTIVE relationships');
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: RELATIONSHIP_STATES.SCOPE_CHANGE_REQUESTED,
      scope_change_requested_date: new Date().toISOString(),
      scope_change_requested_by: requested_by_email,
      scope_change_proposed_definition: new_scope_definition
    });

    return updated;
  }

  /**
   * Accept a scope change request
   * @param {string} relationship_id
   * @param {string} approved_by_email
   * @returns {object} updated relationship (status: ACTIVE with new scope)
   */
  async acceptScopeChange(relationship_id, approved_by_email) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);

    if (!relationship) {
      throw new Error('Relationship not found');
    }

    if (relationship.relationship_status !== RELATIONSHIP_STATES.SCOPE_CHANGE_REQUESTED) {
      throw new Error('Relationship not in SCOPE_CHANGE_REQUESTED state');
    }

    if (!relationship.scope_change_proposed_definition) {
      throw new Error('No proposed scope definition found');
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: RELATIONSHIP_STATES.ACTIVE,
      scope_definition: relationship.scope_change_proposed_definition,
      scope_change_proposed_definition: null,
      scope_change_requested_date: null,
      scope_change_requested_by: null
    });

    return updated;
  }

  /**
   * Suspend a relationship (temporary pause)
   * @param {string} relationship_id
   * @param {string} suspended_by_email
   * @param {string} reason
   * @returns {object} updated relationship (status: SUSPENDED)
   */
  async suspendBrokerMGARelationship(relationship_id, suspended_by_email, reason) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);

    if (!relationship) {
      throw new Error('Relationship not found');
    }

    if (relationship.relationship_status !== RELATIONSHIP_STATES.ACTIVE) {
      throw new Error('Can only suspend ACTIVE relationships');
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: RELATIONSHIP_STATES.SUSPENDED,
      status_reason: reason,
      visibility_active: false
    });

    return updated;
  }

  /**
   * Resume a suspended relationship
   * @param {string} relationship_id
   * @param {string} resumed_by_email
   * @returns {object} updated relationship (status: ACTIVE)
   */
  async resumeBrokerMGARelationship(relationship_id, resumed_by_email) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);

    if (!relationship) {
      throw new Error('Relationship not found');
    }

    if (relationship.relationship_status !== RELATIONSHIP_STATES.SUSPENDED) {
      throw new Error('Can only resume SUSPENDED relationships');
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: RELATIONSHIP_STATES.ACTIVE,
      status_reason: null,
      visibility_active: true
    });

    return updated;
  }

  /**
   * Terminate a relationship (permanent end)
   * Stops future visibility; historical records preserved
   * @param {string} relationship_id
   * @param {string} terminated_by_email
   * @param {string} reason
   * @returns {object} updated relationship (status: TERMINATED, visibility_active: false)
   */
  async terminateBrokerMGARelationship(relationship_id, terminated_by_email, reason) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);

    if (!relationship) {
      throw new Error('Relationship not found');
    }

    if (RELATIONSHIP_STATES_TERMINAL.includes(relationship.relationship_status)) {
      throw new Error(`Cannot terminate relationship in ${relationship.relationship_status} state`);
    }

    const updated = await base44.entities.BrokerMGARelationship.update(relationship_id, {
      relationship_status: RELATIONSHIP_STATES.TERMINATED,
      status_reason: reason,
      termination_date: new Date().toISOString(),
      visibility_active: false
    });

    return updated;
  }

  /**
   * List all relationships for a broker
   * @param {string} broker_agency_id
   * @param {object} filters - { status, created_after, created_before }
   * @returns {array} relationships
   */
  async listBrokerRelationships(broker_agency_id, filters = {}) {
    const query = { broker_agency_id };

    if (filters.status) {
      query.relationship_status = filters.status;
    }

    const relationships = await base44.entities.BrokerMGARelationship.list();
    let results = relationships.filter(r => r.broker_agency_id === broker_agency_id);

    if (filters.status) {
      results = results.filter(r => r.relationship_status === filters.status);
    }

    return results;
  }

  /**
   * List all relationships for an MGA
   * @param {string} master_general_agent_id
   * @param {object} filters - { status }
   * @returns {array} relationships
   */
  async listMGARelationships(master_general_agent_id, filters = {}) {
    const relationships = await base44.entities.BrokerMGARelationship.list();
    let results = relationships.filter(r => r.master_general_agent_id === master_general_agent_id);

    if (filters.status) {
      results = results.filter(r => r.relationship_status === filters.status);
    }

    return results;
  }

  /**
   * Get a specific relationship
   * @param {string} relationship_id
   * @returns {object} relationship
   */
  async getRelationship(relationship_id) {
    return await base44.entities.BrokerMGARelationship.get(relationship_id);
  }

  /**
   * Get scope definition for a relationship
   * @param {string} relationship_id
   * @returns {object} scope_definition
   */
  async getRelationshipScope(relationship_id) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);
    if (!relationship) {
      throw new Error('Relationship not found');
    }
    return {
      operational_scope: relationship.operational_scope,
      scope_definition: relationship.scope_definition
    };
  }

  /**
   * Validate relationship is active and visible
   * @param {string} relationship_id
   * @returns {boolean}
   */
  async isRelationshipActive(relationship_id) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationship_id);
    if (!relationship) return false;
    return relationship.relationship_status === RELATIONSHIP_STATES.ACTIVE && relationship.visibility_active === true;
  }

  /**
   * Generate correlation ID for audit trail linking
   * @private
   * @returns {string}
   */
  _generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new BrokerMGARelationshipContract();