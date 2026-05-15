/**
 * Relationship-Permission Contract
 * 
 * Immutable interface for relationship-aware permission enforcement.
 * All permission denials are auditable.
 * Platform admin overrides are fully logged.
 * 
 * Gate 7A-3 Phase 7A-3.3
 */

import { base44 } from '@/api/base44Client';
import permissionResolver, { PERMISSION_ACTIONS } from '@/lib/permissionResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class RelationshipPermissionContract {
  /**
   * Evaluate permission for user action on record
   * Combines role permission + relationship/ownership scope
   * Logs all denials and platform overrides
   * 
   * @param {object} request - { user, action, record, override_reason? }
   * @returns {object} { allowed, reason, reason_detail, relationship_id? }
   */
  async evaluatePermission(request) {
    const { user, action, record, override_reason } = request;

    // Resolve permission (role + scope/ownership)
    const decision = await permissionResolver.resolvePermission(
      user,
      action,
      record
    );

    // If allowed, return immediately (no audit needed for success)
    if (decision.allowed) {
      return decision;
    }

    // If denied, audit the failure
    await this._auditPermissionDenial(user, action, record, decision);

    // Check if platform admin override requested
    if (override_reason && permissionResolver.canPerformAdminOverride(user)) {
      await this._auditAdminOverride(user, action, record, override_reason);
      return {
        allowed: true,
        reason: 'ALLOW_PLATFORM_ADMIN_OVERRIDE',
        override_applied: true,
        override_reason
      };
    }

    return decision;
  }

  /**
   * Batch evaluate permissions
   * @param {object} request - { user, action, records }
   * @returns {object} { allowed_records, denied_records, details }
   */
  async evaluateBatchPermissions(request) {
    const { user, action, records } = request;

    const results = await permissionResolver.resolveBatchPermissions(
      user,
      action,
      records
    );

    // Audit all denials
    for (const detail of results.details) {
      await this._auditPermissionDenial(
        user,
        action,
        { id: detail.record_id },
        detail
      );
    }

    return {
      allowed_records: results.allowed,
      denied_records: results.denied,
      denial_details: results.details
    };
  }

  /**
   * Get safe permission response (no sensitive data)
   * @param {object} decision
   * @returns {object}
   */
  getSafePermissionResponse(decision) {
    return {
      allowed: decision.allowed,
      reason: decision.reason,
      // Only include reason_detail if useful to user (not internals)
      reason_detail: this._sanitizeReasonDetail(decision.reason_detail),
      scope_failure: decision.scope_failure || false
    };
  }

  /**
   * Get user-facing message for permission denial
   * @param {string} reason
   * @returns {string}
   */
  getPermissionDenialMessage(reason) {
    const messages = {
      'DENY_ROLE_LACKS_PERMISSION': 'Your role does not have permission for this action',
      'DENY_INVALID_ROLE': 'Invalid user role',
      'DENY_RELATIONSHIP_SCOPE_DENY_DIRECT_BROKER_OWNED': 'This is a direct broker record; MGA access denied',
      'DENY_RELATIONSHIP_SCOPE_DENY_RELATIONSHIP_NOT_FOUND': 'Relationship not found',
      'DENY_RELATIONSHIP_SCOPE_DENY_RELATIONSHIP_NOT_OWNED': 'Relationship not associated with your MGA',
      'DENY_RELATIONSHIP_SCOPE_DENY_RELATIONSHIP_NOT_ACCEPTED': 'Relationship pending acceptance',
      'DENY_RELATIONSHIP_SCOPE_DENY_RELATIONSHIP_SUSPENDED': 'Relationship is suspended',
      'DENY_RELATIONSHIP_SCOPE_DENY_RELATIONSHIP_TERMINATED': 'Relationship has been terminated',
      'DENY_RELATIONSHIP_SCOPE_DENY_RELATIONSHIP_SCOPE_CHANGE_PENDING': 'Relationship scope change pending',
      'DENY_RELATIONSHIP_SCOPE_DENY_RELATIONSHIP_VISIBILITY_INACTIVE': 'Relationship visibility disabled',
      'DENY_RELATIONSHIP_SCOPE_DENY_ACTION_NOT_IN_SCOPE': 'Action not permitted under relationship scope',
      'DENY_BROKER_SCOPE_DENY_NOT_BROKER_OWNER': 'You do not own this record',
      'DENY_BROKER_SCOPE_DENY_BROKER_CANNOT_SEE_MGA_AFFILIATED': 'This is an MGA-affiliated record'
    };

    return messages[reason] || 'Access denied';
  }

  /**
   * Check if user requires relationship scope for action
   * @param {string} role
   * @param {string} action
   * @returns {boolean}
   */
  requiresRelationshipScope(role, action) {
    return permissionResolver.requiresRelationshipScope(role);
  }

  /**
   * Check if user requires direct ownership for action
   * @param {string} role
   * @param {string} action
   * @returns {boolean}
   */
  requiresDirectOwnership(role, action) {
    return permissionResolver.requiresDirectOwnership(role);
  }

  /**
   * Audit permission denial
   * @private
   */
  async _auditPermissionDenial(user, action, record, decision) {
    try {
      await auditWriter.recordEvent({
        event_type: 'permission_denied',
        entity_id: record.id || 'UNKNOWN',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Permission denied: ${decision.reason}. ${decision.reason_detail || ''}`,
        outcome: 'blocked',
        reason_code: decision.reason,
        scope_failure: decision.scope_failure || false
      });
    } catch (e) {
      console.error('Failed to audit permission denial:', e.message);
    }
  }

  /**
   * Audit platform admin override
   * @private
   */
  async _auditAdminOverride(user, action, record, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'admin_permission_override',
        entity_id: record.id || 'UNKNOWN',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Admin override applied. Reason: ${reason}`,
        outcome: 'success',
        reason_code: 'ADMIN_OVERRIDE_APPLIED'
      });
    } catch (e) {
      console.error('Failed to audit admin override:', e.message);
    }
  }

  /**
   * Sanitize reason detail for user response
   * @private
   */
  _sanitizeReasonDetail(detail) {
    if (!detail) return undefined;
    // Remove internal details; keep only user-facing info
    if (detail.includes('broker_tax_id') || detail.includes('commission')) {
      return 'Access denied';
    }
    return detail;
  }
}

export default new RelationshipPermissionContract();