/**
 * Employer Access Service
 * 
 * Enforces role permission + broker ownership/relationship scope for employer access.
 * All denials audited. Safe payloads only.
 * 
 * Gate 7A-3 Phase 7A-3.4
 */

import { base44 } from '@/api/base44Client';
import permissionResolver from '@/lib/permissionResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class EmployerAccessService {
  /**
   * Get employer with access control
   * @param {object} user
   * @param {string} employerId
   * @returns {object} { employer: {...safe_fields}, allowed: boolean, reason?: string }
   */
  async getEmployer(user, employerId) {
    const actionName = 'read_employer';

    let employerRecord;
    try {
      employerRecord = await base44.entities.EmployerGroup.get(employerId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'EMPLOYER_NOT_FOUND',
        employer: null
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      employerRecord
    );

    if (!permissionDecision.allowed) {
      await this._auditDenial(user, actionName, employerRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        employer: null
      };
    }

    return {
      allowed: true,
      employer: this._safeEmployerPayload(employerRecord)
    };
  }

  /**
   * List employers with access control
   * @param {object} user
   * @returns {object} { employers: [], allowed: number, denied: number }
   */
  async listEmployers(user) {
    let allEmployers;
    try {
      allEmployers = await base44.entities.EmployerGroup.list();
    } catch (e) {
      return {
        employers: [],
        allowed: 0,
        denied: 0,
        error: e.message
      };
    }

    const allowed = [];
    const denied = [];

    for (const employerRecord of allEmployers) {
      const permissionDecision = await permissionResolver.resolvePermission(
        user,
        'read_employer',
        employerRecord
      );

      if (permissionDecision.allowed) {
        allowed.push(this._safeEmployerPayload(employerRecord));
      } else {
        denied.push(employerRecord.id);
        await this._auditDenial(user, 'read_employer', employerRecord, permissionDecision.reason);
      }
    }

    return {
      employers: allowed,
      allowed: allowed.length,
      denied: denied.length
    };
  }

  /**
   * Audit denied access
   * @private
   */
  async _auditDenial(user, action, record, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'employer_access_denied',
        entity_id: record?.id || 'UNKNOWN',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Employer access denied: ${reason}`,
        outcome: 'blocked',
        reason_code: reason
      });
    } catch (e) {
      console.error('Failed to audit employer denial:', e.message);
    }
  }

  /**
   * Return safe employer payload (no internals)
   * @private
   */
  _safeEmployerPayload(employerRecord) {
    return {
      id: employerRecord.id,
      name: employerRecord.name,
      dba_name: employerRecord.dba_name,
      ein: employerRecord.ein,
      industry: employerRecord.industry,
      address: employerRecord.address,
      city: employerRecord.city,
      state: employerRecord.state,
      zip: employerRecord.zip,
      phone: employerRecord.phone,
      website: employerRecord.website,
      employee_count: employerRecord.employee_count,
      eligible_count: employerRecord.eligible_count,
      effective_date: employerRecord.effective_date,
      renewal_date: employerRecord.renewal_date,
      status: employerRecord.status,
      primary_contact_name: employerRecord.primary_contact_name,
      primary_contact_email: employerRecord.primary_contact_email,
      broker_agency_id: employerRecord.broker_agency_id,
      relationship_id: employerRecord.relationship_id || undefined
    };
  }
}

export default new EmployerAccessService();