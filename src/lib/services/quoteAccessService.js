/**
 * Quote Access Service
 * 
 * Enforces role permission + broker ownership/relationship scope for quote access.
 * All denials audited. Safe payloads only.
 * 
 * Gate 7A-3 Phase 7A-3.4
 */

import { base44 } from '@/api/base44Client';
import permissionResolver from '@/lib/permissionResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class QuoteAccessService {
  /**
   * Get quote with access control
   * @param {object} user
   * @param {string} quoteId
   * @param {object} options — { override_reason?: string }
   * @returns {object} { quote: {...safe_fields}, allowed: boolean, reason?: string }
   */
  async getQuote(user, quoteId, options = {}) {
    const actionName = 'read_quote';

    let quoteRecord;
    try {
      quoteRecord = await base44.entities.QuoteScenario.get(quoteId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'QUOTE_NOT_FOUND',
        quote: null
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      quoteRecord
    );

    if (!permissionDecision.allowed) {
      if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
        const overrideReason = options.override_reason?.trim();
        if (!overrideReason) {
          await this._auditDenial(user, actionName, quoteRecord, 'DENY_OVERRIDE_MISSING_REASON');
          return {
            allowed: false,
            reason: 'DENY_OVERRIDE_MISSING_REASON',
            quote: null
          };
        }

        await this._auditOverride(user, actionName, quoteRecord, overrideReason);
        return {
          allowed: true,
          quote: this._safeQuotePayload(quoteRecord),
          override_applied: true
        };
      }

      await this._auditDenial(user, actionName, quoteRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        quote: null
      };
    }

    return {
      allowed: true,
      quote: this._safeQuotePayload(quoteRecord)
    };
  }

  /**
   * List quotes with access control
   * @param {object} user
   * @returns {object} { quotes: [], allowed: number, denied: number }
   */
  async listQuotes(user) {
    let allQuotes;
    try {
      allQuotes = await base44.entities.QuoteScenario.list();
    } catch (e) {
      return {
        quotes: [],
        allowed: 0,
        denied: 0,
        error: e.message
      };
    }

    const allowed = [];
    const denied = [];

    for (const quoteRecord of allQuotes) {
      const permissionDecision = await permissionResolver.resolvePermission(
        user,
        'read_quote',
        quoteRecord
      );

      if (permissionDecision.allowed) {
        allowed.push(this._safeQuotePayload(quoteRecord));
      } else {
        denied.push(quoteRecord.id);
        await this._auditDenial(user, 'read_quote', quoteRecord, permissionDecision.reason);
      }
    }

    return {
      quotes: allowed,
      allowed: allowed.length,
      denied: denied.length
    };
  }

  /**
   * Create quote with access control
   * @param {object} user
   * @param {object} quoteData
   * @returns {object} { quote: {...}, allowed: boolean, reason?: string }
   */
  async createQuote(user, quoteData) {
    const actionName = 'create_quote';

    const rolePerms = permissionResolver.getActionsByRole(user.role) || [];
    if (!rolePerms.includes(actionName)) {
      await this._auditDenial(user, actionName, null, 'DENY_ROLE_LACKS_PERMISSION');
      return {
        allowed: false,
        reason: 'DENY_ROLE_LACKS_PERMISSION',
        quote: null
      };
    }

    if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
      const newQuote = await base44.entities.QuoteScenario.create(quoteData);
      return {
        allowed: true,
        quote: this._safeQuotePayload(newQuote)
      };
    }

    if (['broker_user', 'broker_admin'].includes(user.role)) {
      if (quoteData.broker_agency_id !== user.broker_agency_id) {
        await this._auditDenial(user, actionName, quoteData, 'DENY_NOT_BROKER_OWNER');
        return {
          allowed: false,
          reason: 'DENY_NOT_BROKER_OWNER',
          quote: null
        };
      }

      const newQuote = await base44.entities.QuoteScenario.create(quoteData);
      return {
        allowed: true,
        quote: this._safeQuotePayload(newQuote)
      };
    }

    if (['mga_user', 'mga_admin'].includes(user.role)) {
      if (!quoteData.relationship_id) {
        await this._auditDenial(user, actionName, quoteData, 'DENY_MISSING_RELATIONSHIP');
        return {
          allowed: false,
          reason: 'DENY_MISSING_RELATIONSHIP',
          quote: null
        };
      }

      const newQuote = await base44.entities.QuoteScenario.create(quoteData);
      return {
        allowed: true,
        quote: this._safeQuotePayload(newQuote)
      };
    }

    return {
      allowed: false,
      reason: 'DENY_INVALID_ROLE',
      quote: null
    };
  }

  /**
   * Update quote with access control
   * @param {object} user
   * @param {string} quoteId
   * @param {object} updates
   * @returns {object} { quote: {...}, allowed: boolean, reason?: string }
   */
  async updateQuote(user, quoteId, updates) {
    const actionName = 'update_quote';

    let quoteRecord;
    try {
      quoteRecord = await base44.entities.QuoteScenario.get(quoteId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'QUOTE_NOT_FOUND',
        quote: null
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      quoteRecord
    );

    if (!permissionDecision.allowed) {
      await this._auditDenial(user, actionName, quoteRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        quote: null
      };
    }

    const updated = await base44.entities.QuoteScenario.update(quoteId, updates);
    return {
      allowed: true,
      quote: this._safeQuotePayload(updated)
    };
  }

  /**
   * Audit denied access
   * @private
   */
  async _auditDenial(user, action, record, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'quote_access_denied',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Quote access denied: ${reason}`,
        outcome: 'blocked',
        reason_code: reason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit quote denial:', e.message);
    }
  }

  /**
   * Audit platform admin override
   * @private
   */
  async _auditOverride(user, action, record, overrideReason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'quote_access_override',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Quote access override by ${user.role}: ${overrideReason}`,
        outcome: 'override',
        reason_code: 'PLATFORM_ADMIN_OVERRIDE',
        override_reason: overrideReason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit quote override:', e.message);
    }
  }

  /**
   * Return safe quote payload (no internals)
   * @private
   */
  _safeQuotePayload(quoteRecord) {
    return {
      id: quoteRecord.id,
      case_id: quoteRecord.case_id,
      name: quoteRecord.name,
      status: quoteRecord.status,
      total_monthly_premium: quoteRecord.total_monthly_premium,
      employer_monthly_cost: quoteRecord.employer_monthly_cost,
      employee_monthly_cost_avg: quoteRecord.employee_monthly_cost_avg,
      is_recommended: quoteRecord.is_recommended,
      quoted_at: quoteRecord.quoted_at,
      expires_at: quoteRecord.expires_at,
      broker_agency_id: quoteRecord.broker_agency_id,
      relationship_id: quoteRecord.relationship_id || undefined
    };
  }
}

export default new QuoteAccessService();