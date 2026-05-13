/**
 * Case Access Service
 * 
 * Enforces role permission + broker ownership/relationship scope for case access.
 * All denials audited. Safe payloads only.
 * 
 * Gate 7A-3 Phase 7A-3.4
 */

import { base44 } from '@/api/base44Client';
import permissionResolver from '@/lib/permissionResolver.js';
import relationshipScopeResolver from '@/lib/scopeResolvers/relationshipScopeResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class CaseAccessService {
  /**
   * Get case with access control
   * @param {object} user — { email, role, broker_agency_id?, mga_id? }
   * @param {string} caseId
   * @param {object} options — { override_reason?: string }
   * @returns {object} { case: {...safe_fields}, allowed: boolean, reason?: string }
   */
  async getCase(user, caseId, options = {}) {
    const actionName = 'read_case';

    // Step 1: Retrieve case
    let caseRecord;
    try {
      caseRecord = await base44.entities.BenefitCase.get(caseId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'CASE_NOT_FOUND',
        case: null
      };
    }

    // Step 2: Evaluate permission
    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      caseRecord
    );

    if (!permissionDecision.allowed) {
      // Step 2a: Check for platform override
      if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
        const overrideReason = options.override_reason?.trim();
        if (!overrideReason) {
          await this._auditDenial(user, actionName, caseRecord, 'DENY_OVERRIDE_MISSING_REASON');
          return {
            allowed: false,
            reason: 'DENY_OVERRIDE_MISSING_REASON',
            case: null
          };
        }

        // Override approved with audit reason
        await this._auditOverride(user, actionName, caseRecord, overrideReason);
        return {
          allowed: true,
          case: this._safeCasePayload(caseRecord),
          override_applied: true
        };
      }

      await this._auditDenial(user, actionName, caseRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        reason_detail: permissionDecision.reason_detail,
        case: null
      };
    }

    // Step 3: Return safe payload
    return {
      allowed: true,
      case: this._safeCasePayload(caseRecord)
    };
  }

  /**
   * List cases with access control
   * @param {object} user
   * @returns {object} { cases: [], allowed: number, denied: number }
   */
  async listCases(user) {
    let allCases;
    try {
      allCases = await base44.entities.BenefitCase.list();
    } catch (e) {
      return {
        cases: [],
        allowed: 0,
        denied: 0,
        error: e.message
      };
    }

    const allowed = [];
    const denied = [];

    for (const caseRecord of allCases) {
      const permissionDecision = await permissionResolver.resolvePermission(
        user,
        'read_case',
        caseRecord
      );

      if (permissionDecision.allowed) {
        allowed.push(this._safeCasePayload(caseRecord));
      } else {
        denied.push(caseRecord.id);
        await this._auditDenial(user, 'read_case', caseRecord, permissionDecision.reason);
      }
    }

    return {
      cases: allowed,
      allowed: allowed.length,
      denied: denied.length
    };
  }

  /**
   * Create case with access control
   * @param {object} user
   * @param {object} caseData
   * @returns {object} { case: {...}, allowed: boolean, reason?: string }
   */
  async createCase(user, caseData) {
    const actionName = 'create_case';

    // Step 1: Check role permission (no specific record context yet)
    const rolePerms = permissionResolver.getActionsByRole(user.role) || [];
    if (!rolePerms.includes(actionName)) {
      await this._auditDenial(user, actionName, null, 'DENY_ROLE_LACKS_PERMISSION');
      return {
        allowed: false,
        reason: 'DENY_ROLE_LACKS_PERMISSION',
        case: null
      };
    }

    // Step 2: Platform admin override
    if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
      const newCase = await base44.entities.BenefitCase.create(caseData);
      return {
        allowed: true,
        case: this._safeCasePayload(newCase)
      };
    }

    // Step 3: Broker user: verify broker_agency_id matches
    if (['broker_user', 'broker_admin'].includes(user.role)) {
      if (caseData.broker_agency_id !== user.broker_agency_id) {
        await this._auditDenial(user, actionName, caseData, 'DENY_NOT_BROKER_OWNER');
        return {
          allowed: false,
          reason: 'DENY_NOT_BROKER_OWNER',
          case: null
        };
      }

      const newCase = await base44.entities.BenefitCase.create(caseData);
      return {
        allowed: true,
        case: this._safeCasePayload(newCase)
      };
    }

    // Step 4: MGA user: verify relationship scope
    if (['mga_user', 'mga_admin'].includes(user.role)) {
      if (!caseData.relationship_id) {
        await this._auditDenial(user, actionName, caseData, 'DENY_MISSING_RELATIONSHIP');
        return {
          allowed: false,
          reason: 'DENY_MISSING_RELATIONSHIP',
          case: null
        };
      }

      const scopeCheck = await this._checkRelationshipScope(
        user,
        caseData.relationship_id,
        actionName
      );

      if (!scopeCheck.allowed) {
        await this._auditDenial(user, actionName, caseData, scopeCheck.reason);
        return {
          allowed: false,
          reason: scopeCheck.reason,
          case: null
        };
      }

      const newCase = await base44.entities.BenefitCase.create(caseData);
      return {
        allowed: true,
        case: this._safeCasePayload(newCase)
      };
    }

    return {
      allowed: false,
      reason: 'DENY_INVALID_ROLE',
      case: null
    };
  }

  /**
   * Update case with access control
   * @param {object} user
   * @param {string} caseId
   * @param {object} updates
   * @returns {object} { case: {...}, allowed: boolean, reason?: string }
   */
  async updateCase(user, caseId, updates) {
    const actionName = 'update_case';

    // Step 1: Retrieve case
    let caseRecord;
    try {
      caseRecord = await base44.entities.BenefitCase.get(caseId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'CASE_NOT_FOUND',
        case: null
      };
    }

    // Step 2: Evaluate permission
    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      caseRecord
    );

    if (!permissionDecision.allowed) {
      await this._auditDenial(user, actionName, caseRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        case: null
      };
    }

    // Step 3: Update and return safe payload
    const updated = await base44.entities.BenefitCase.update(caseId, updates);
    return {
      allowed: true,
      case: this._safeCasePayload(updated)
    };
  }

  /**
   * Delete case with access control
   * @param {object} user
   * @param {string} caseId
   * @returns {object} { allowed: boolean, reason?: string }
   */
  async deleteCase(user, caseId) {
    const actionName = 'delete_case';

    let caseRecord;
    try {
      caseRecord = await base44.entities.BenefitCase.get(caseId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'CASE_NOT_FOUND'
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      caseRecord
    );

    if (!permissionDecision.allowed) {
      await this._auditDenial(user, actionName, caseRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason
      };
    }

    await base44.entities.BenefitCase.delete(caseId);
    return { allowed: true };
  }

  /**
   * Check relationship scope for MGA access
   * @private
   */
  async _checkRelationshipScope(user, relationshipId, action) {
    const relationship = await base44.entities.BrokerMGARelationship.get(relationshipId);

    if (!relationship) {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_FOUND' };
    }

    if (relationship.master_general_agent_id !== user.mga_id) {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_OWNED' };
    }

    if (relationship.relationship_status !== 'ACTIVE') {
      return { allowed: false, reason: `DENY_RELATIONSHIP_${relationship.relationship_status}` };
    }

    if (!relationship.visibility_active) {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_VISIBILITY_INACTIVE' };
    }

    const scope = relationship.scope_definition || {};
    const allowed = scope.allowed_operations && scope.allowed_operations.includes(action);

    if (!allowed) {
      return { allowed: false, reason: 'DENY_ACTION_NOT_IN_SCOPE' };
    }

    return { allowed: true };
  }

  /**
   * Audit denied access
   * @private
   */
  async _auditDenial(user, action, record, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'case_access_denied',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Case access denied: ${reason}`,
        outcome: 'blocked',
        reason_code: reason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit case denial:', e.message);
    }
  }

  /**
   * Audit platform admin override
   * @private
   */
  async _auditOverride(user, action, record, overrideReason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'case_access_override',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Case access override by ${user.role}: ${overrideReason}`,
        outcome: 'override',
        reason_code: 'PLATFORM_ADMIN_OVERRIDE',
        override_reason: overrideReason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit case override:', e.message);
    }
  }

  /**
   * Return safe case payload (no internals)
   * @private
   */
  _safeCasePayload(caseRecord) {
    return {
      id: caseRecord.id,
      case_number: caseRecord.case_number,
      case_type: caseRecord.case_type,
      stage: caseRecord.stage,
      employer_name: caseRecord.employer_name,
      employee_count: caseRecord.employee_count,
      effective_date: caseRecord.effective_date,
      status: caseRecord.status,
      assigned_to: caseRecord.assigned_to,
      last_activity_date: caseRecord.last_activity_date,
      target_close_date: caseRecord.target_close_date,
      broker_agency_id: caseRecord.broker_agency_id,
      relationship_id: caseRecord.relationship_id || undefined
    };
  }
}

export default new CaseAccessService();