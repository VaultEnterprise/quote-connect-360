/**
 * Census Access Service
 * 
 * Enforces role permission + broker ownership/relationship scope for census access.
 * All denials audited. Safe payloads only.
 * 
 * Gate 7A-3 Phase 7A-3.4
 */

import { base44 } from '@/api/base44Client';
import permissionResolver from '@/lib/permissionResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class CensusAccessService {
  /**
   * Get census version with access control
   * @param {object} user
   * @param {string} censusId
   * @param {object} options — { override_reason?: string }
   * @returns {object} { census: {...safe_fields}, allowed: boolean, reason?: string }
   */
  async getCensus(user, censusId, options = {}) {
    const actionName = 'read_census';

    let censusRecord;
    try {
      censusRecord = await base44.entities.CensusVersion.get(censusId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'CENSUS_NOT_FOUND',
        census: null
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      censusRecord
    );

    if (!permissionDecision.allowed) {
      if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
        const overrideReason = options.override_reason?.trim();
        if (!overrideReason) {
          await this._auditDenial(user, actionName, censusRecord, 'DENY_OVERRIDE_MISSING_REASON');
          return {
            allowed: false,
            reason: 'DENY_OVERRIDE_MISSING_REASON',
            census: null
          };
        }

        await this._auditOverride(user, actionName, censusRecord, overrideReason);
        return {
          allowed: true,
          census: this._safeCensusPayload(censusRecord),
          override_applied: true
        };
      }

      await this._auditDenial(user, actionName, censusRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        census: null
      };
    }

    return {
      allowed: true,
      census: this._safeCensusPayload(censusRecord)
    };
  }

  /**
   * List census versions with access control
   * @param {object} user
   * @returns {object} { census: [], allowed: number, denied: number }
   */
  async listCensus(user) {
    let allCensus;
    try {
      allCensus = await base44.entities.CensusVersion.list();
    } catch (e) {
      return {
        census: [],
        allowed: 0,
        denied: 0,
        error: e.message
      };
    }

    const allowed = [];
    const denied = [];

    for (const censusRecord of allCensus) {
      const permissionDecision = await permissionResolver.resolvePermission(
        user,
        'read_census',
        censusRecord
      );

      if (permissionDecision.allowed) {
        allowed.push(this._safeCensusPayload(censusRecord));
      } else {
        denied.push(censusRecord.id);
        await this._auditDenial(user, 'read_census', censusRecord, permissionDecision.reason);
      }
    }

    return {
      census: allowed,
      allowed: allowed.length,
      denied: denied.length
    };
  }

  /**
   * Create census version with access control
   * @param {object} user
   * @param {object} censusData
   * @returns {object} { census: {...}, allowed: boolean, reason?: string }
   */
  async createCensus(user, censusData) {
    const actionName = 'create_census';

    const rolePerms = permissionResolver.getActionsByRole(user.role) || [];
    if (!rolePerms.includes(actionName)) {
      await this._auditDenial(user, actionName, null, 'DENY_ROLE_LACKS_PERMISSION');
      return {
        allowed: false,
        reason: 'DENY_ROLE_LACKS_PERMISSION',
        census: null
      };
    }

    if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
      const newCensus = await base44.entities.CensusVersion.create(censusData);
      return {
        allowed: true,
        census: this._safeCensusPayload(newCensus)
      };
    }

    if (['broker_user', 'broker_admin'].includes(user.role)) {
      if (censusData.broker_agency_id !== user.broker_agency_id) {
        await this._auditDenial(user, actionName, censusData, 'DENY_NOT_BROKER_OWNER');
        return {
          allowed: false,
          reason: 'DENY_NOT_BROKER_OWNER',
          census: null
        };
      }

      const newCensus = await base44.entities.CensusVersion.create(censusData);
      return {
        allowed: true,
        census: this._safeCensusPayload(newCensus)
      };
    }

    if (['mga_user', 'mga_admin'].includes(user.role)) {
      if (!censusData.relationship_id) {
        await this._auditDenial(user, actionName, censusData, 'DENY_MISSING_RELATIONSHIP');
        return {
          allowed: false,
          reason: 'DENY_MISSING_RELATIONSHIP',
          census: null
        };
      }

      const newCensus = await base44.entities.CensusVersion.create(censusData);
      return {
        allowed: true,
        census: this._safeCensusPayload(newCensus)
      };
    }

    return {
      allowed: false,
      reason: 'DENY_INVALID_ROLE',
      census: null
    };
  }

  /**
   * Audit denied access
   * @private
   */
  async _auditDenial(user, action, record, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'census_access_denied',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Census access denied: ${reason}`,
        outcome: 'blocked',
        reason_code: reason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit census denial:', e.message);
    }
  }

  /**
   * Audit platform admin override
   * @private
   */
  async _auditOverride(user, action, record, overrideReason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'census_access_override',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Census access override by ${user.role}: ${overrideReason}`,
        outcome: 'override',
        reason_code: 'PLATFORM_ADMIN_OVERRIDE',
        override_reason: overrideReason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit census override:', e.message);
    }
  }

  /**
   * Return safe census payload (no internals)
   * @private
   */
  _safeCensusPayload(censusRecord) {
    return {
      id: censusRecord.id,
      case_id: censusRecord.case_id,
      version_number: censusRecord.version_number,
      file_name: censusRecord.file_name,
      status: censusRecord.status,
      total_employees: censusRecord.total_employees,
      total_dependents: censusRecord.total_dependents,
      eligible_employees: censusRecord.eligible_employees,
      validation_errors: censusRecord.validation_errors,
      validation_warnings: censusRecord.validation_warnings,
      uploaded_by: censusRecord.uploaded_by,
      validated_at: censusRecord.validated_at,
      broker_agency_id: censusRecord.broker_agency_id,
      relationship_id: censusRecord.relationship_id || undefined
    };
  }
}

export default new CensusAccessService();