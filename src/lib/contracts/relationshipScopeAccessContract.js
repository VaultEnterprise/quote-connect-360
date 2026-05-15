/**
 * RelationshipScopeAccessContract
 * 
 * Immutable interface for relationship-scoped access decisions.
 * All denials are auditable.
 * 
 * Gate 7A-3 Phase 7A-3.2
 */

import relationshipScopeResolver from '@/lib/scopeResolvers/relationshipScopeResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class RelationshipScopeAccessContract {
  /**
   * Check MGA access to a record with audit logging
   * @param {object} request - { user_email, user_mga_id, record, requested_action }
   * @returns {object} { allowed, reason, detail, relationship_id }
   */
  async evaluateRelationshipScopedAccess(request) {
    const { user_email, user_mga_id, record, requested_action } = request;

    // Evaluate access
    const decision = await relationshipScopeResolver.canMGAAccessRecord(
      user_email,
      user_mga_id,
      record,
      requested_action
    );

    // Log denied access attempts
    if (!decision.allowed) {
      await auditWriter.recordEvent({
        event_type: 'relationship_scope_access_denied',
        entity_type: record.entity_type || 'UNKNOWN',
        entity_id: record.id || 'UNKNOWN',
        actor_email: user_email,
        actor_role: 'mga_user',
        action: requested_action,
        detail: `Access denied: ${decision.reason}. ${decision.detail}`,
        outcome: 'blocked',
        reason_code: decision.reason,
        relationship_id: record.relationship_id || null
      });
    }

    return decision;
  }

  /**
   * Check broker access to a record with audit logging
   * @param {object} request - { user_email, user_broker_id, record }
   * @returns {object} { allowed, reason, detail }
   */
  async evaluateBrokerDirectAccess(request) {
    const { user_email, user_broker_id, record } = request;

    const decision = await relationshipScopeResolver.canBrokerAccessRecord(
      user_email,
      user_broker_id,
      record
    );

    // Log denied access attempts
    if (!decision.allowed) {
      await auditWriter.recordEvent({
        event_type: 'broker_direct_access_denied',
        entity_type: record.entity_type || 'UNKNOWN',
        entity_id: record.id || 'UNKNOWN',
        actor_email: user_email,
        actor_role: 'broker_user',
        action: 'read',
        detail: `Access denied: ${decision.reason}. ${decision.detail}`,
        outcome: 'blocked',
        reason_code: decision.reason
      });
    }

    return decision;
  }

  /**
   * Batch check access for multiple records
   * @param {object} request - { user_email, user_id, user_role, records, requested_action }
   * @returns {object} { allowed_records, denied_records, denied_details }
   */
  async evaluateBatchAccess(request) {
    const { user_email, user_id, user_role, records, requested_action } = request;

    const allowed = [];
    const denied = [];
    const deniedDetails = [];

    for (const record of records) {
      let decision;

      if (user_role === 'mga_user' || user_role === 'mga_admin') {
        decision = await relationshipScopeResolver.canMGAAccessRecord(
          user_email,
          user_id,
          record,
          requested_action
        );
      } else if (user_role === 'broker_user' || user_role === 'broker_admin') {
        decision = await relationshipScopeResolver.canBrokerAccessRecord(
          user_email,
          user_id,
          record
        );
      } else {
        decision = { allowed: false, reason: 'DENY_INVALID_ROLE' };
      }

      if (decision.allowed) {
        allowed.push(record.id);
      } else {
        denied.push(record.id);
        deniedDetails.push({
          record_id: record.id,
          reason: decision.reason,
          detail: decision.detail
        });

        // Audit denied access
        await auditWriter.recordEvent({
          event_type: 'scope_access_denied',
          entity_id: record.id,
          actor_email: user_email,
          actor_role: user_role,
          action: requested_action,
          detail: `Batch access denied: ${decision.reason}`,
          outcome: 'blocked'
        });
      }
    }

    return {
      allowed_records: allowed,
      denied_records: denied,
      denied_details: deniedDetails
    };
  }

  /**
   * Get access decision reason string (human-readable)
   * @param {string} reason_code
   * @returns {string}
   */
  getAccessDenialMessage(reason_code) {
    const messages = {
      'DENY_DIRECT_BROKER_OWNED': 'Record is broker-owned; MGA access not permitted',
      'DENY_MISSING_RELATIONSHIP_ID': 'MGA-affiliated record missing relationship reference',
      'DENY_RELATIONSHIP_NOT_FOUND': 'Relationship does not exist',
      'DENY_RELATIONSHIP_NOT_OWNED': 'Relationship not associated with your MGA',
      'DENY_RELATIONSHIP_NOT_ACCEPTED': 'Relationship pending acceptance',
      'DENY_RELATIONSHIP_AWAITING_ACCEPTANCE': 'Relationship awaiting acceptance',
      'DENY_RELATIONSHIP_SUSPENDED': 'Relationship is suspended',
      'DENY_RELATIONSHIP_TERMINATED': 'Relationship has been terminated',
      'DENY_RELATIONSHIP_SCOPE_CHANGE_PENDING': 'Relationship scope change pending approval',
      'DENY_RELATIONSHIP_INACTIVE': 'Relationship is inactive',
      'DENY_RELATIONSHIP_VISIBILITY_INACTIVE': 'Relationship visibility is disabled',
      'DENY_ACTION_NOT_IN_SCOPE': 'Requested action is not permitted under relationship scope',
      'DENY_UNKNOWN_CLASSIFICATION': 'Record type unknown',
      'DENY_NOT_BROKER_OWNER': 'You do not own this record',
      'DENY_BROKER_CANNOT_SEE_MGA_AFFILIATED': 'This is an MGA-affiliated record',
      'DENY_INVALID_ROLE': 'Invalid user role for access evaluation'
    };

    return messages[reason_code] || 'Access denied';
  }
}

export default new RelationshipScopeAccessContract();