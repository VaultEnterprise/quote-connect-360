/**
 * Document Access Service (Gate 6L-B.2)
 * 
 * Enforces role permission + document classification + relationship scope for document access.
 * All denials audited. Safe payloads only. Platform admin override with mandatory audit reason.
 * 
 * Three-layer enforcement:
 * 1. Permission layer (permissionResolver)
 * 2. Scope layer (relationship scope validation)
 * 3. Contract layer (access service with safe payload)
 */

import { base44 } from '@/api/base44Client';
import permissionResolver from '@/lib/permissionResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class DocumentAccessService {
  /**
   * Get single document with access control
   */
  async getDocument(user, documentId, options = {}) {
    const actionName = 'read_document';

    let document;
    try {
      document = await base44.entities.Document.get(documentId);
    } catch (e) {
      return {
        allowed: false,
        reason: 'DOCUMENT_NOT_FOUND',
        document: null
      };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      document
    );

    if (!permissionDecision.allowed) {
      if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
        const overrideReason = options.override_reason?.trim();
        if (!overrideReason) {
          await this._auditDenial(user, actionName, document, 'DENY_OVERRIDE_MISSING_REASON');
          return {
            allowed: false,
            reason: 'DENY_OVERRIDE_MISSING_REASON',
            document: null
          };
        }

        await this._auditOverride(user, actionName, document, overrideReason);
        return {
          allowed: true,
          document: this._safeDocumentPayload(document),
          override_applied: true
        };
      }

      await this._auditDenial(user, actionName, document, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        document: null
      };
    }

    // Additional scope check for MGA users
    if (user.role.startsWith('mga_')) {
      const scopeDecision = await this._validateMGAScope(user, document);
      if (!scopeDecision.allowed) {
        await this._auditDenial(user, actionName, document, scopeDecision.reason);
        return {
          allowed: false,
          reason: scopeDecision.reason,
          document: null
        };
      }
    }

    // Direct broker documents are never visible to MGA
    if (user.role.startsWith('mga_') && document.document_classification === 'direct_broker_owned') {
      await this._auditDenial(user, actionName, document, 'DENY_RELATIONSHIP_SCOPE_DENY_MGA_DIRECT');
      return {
        allowed: false,
        reason: 'DENY_RELATIONSHIP_SCOPE_DENY_MGA_DIRECT',
        document: null
      };
    }

    return {
      allowed: true,
      document: this._safeDocumentPayload(document)
    };
  }

  /**
   * List documents with access control
   */
  async listDocuments(user, filters = {}) {
    let allDocuments;
    try {
      allDocuments = await base44.entities.Document.list();
    } catch (e) {
      return {
        documents: [],
        allowed: 0,
        denied: 0,
        error: e.message
      };
    }

    const allowed = [];
    const denied = [];

    for (const doc of allDocuments) {
      const decision = await this.getDocument(user, doc.id);
      if (decision.allowed) {
        allowed.push(decision.document);
      } else {
        denied.push(doc.id);
      }
    }

    return {
      documents: allowed,
      allowed: allowed.length,
      denied: denied.length
    };
  }

  /**
   * Validate document upload authorization
   */
  async validateUpload(user, metadata = {}) {
    const actionName = 'upload_document';

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      metadata
    );

    if (!permissionDecision.allowed) {
      return { allowed: false, reason: permissionDecision.reason };
    }

    // MGA users cannot upload documents
    if (user.role.startsWith('mga_')) {
      return { allowed: false, reason: 'DENY_MGA_CANNOT_UPLOAD' };
    }

    return { allowed: true };
  }

  /**
   * Validate document download authorization
   */
  async validateDownload(user, documentId) {
    const decision = await this.getDocument(user, documentId);
    return {
      allowed: decision.allowed,
      reason: decision.reason
    };
  }

  /**
   * Validate document delete authorization
   */
  async validateDelete(user, documentId) {
    const actionName = 'delete_document';

    let document;
    try {
      document = await base44.entities.Document.get(documentId);
    } catch (e) {
      return { allowed: false, reason: 'DOCUMENT_NOT_FOUND' };
    }

    const permissionDecision = await permissionResolver.resolvePermission(
      user,
      actionName,
      document
    );

    if (!permissionDecision.allowed) {
      return { allowed: false, reason: permissionDecision.reason };
    }

    // MGA users cannot delete
    if (user.role.startsWith('mga_')) {
      return { allowed: false, reason: 'DENY_MGA_CANNOT_DELETE' };
    }

    // Broker can only delete own
    if (user.role.startsWith('broker_')) {
      if (document.broker_agency_id !== user.broker_agency_id) {
        return { allowed: false, reason: 'DENY_NOT_BROKER_OWNER' };
      }
    }

    return { allowed: true };
  }

  /**
   * MGA scope validation (relationship must be ACTIVE)
   * @private
   */
  async _validateMGAScope(user, document) {
    // Direct broker documents denied to MGA
    if (document.document_classification === 'direct_broker_owned') {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_SCOPE_DENY_MGA_DIRECT' };
    }

    // MGA-affiliated documents require active relationship
    if (document.document_classification === 'mga_affiliated') {
      if (!document.mga_relationship_id) {
        return { allowed: false, reason: 'DENY_MISSING_RELATIONSHIP' };
      }

      let relationship;
      try {
        relationship = await base44.entities.BrokerMGARelationship.get(document.mga_relationship_id);
      } catch (e) {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_FOUND' };
      }

      if (!relationship) {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_FOUND' };
      }

      // Check relationship is ACTIVE
      if (relationship.relationship_status !== 'ACTIVE') {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_ACTIVE' };
      }

      // Check visibility is active
      if (!relationship.visibility_active) {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_VISIBILITY_INACTIVE' };
      }

      // Verify MGA owns relationship
      if (relationship.master_general_agent_id !== user.master_general_agent_id) {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_OWNED' };
      }
    }

    return { allowed: true };
  }

  /**
   * Audit denied access
   * @private
   */
  async _auditDenial(user, action, doc, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'document_access_denied',
        entity_id: doc?.id || 'UNKNOWN',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Document access denied: ${reason}`,
        outcome: 'blocked',
        reason_code: reason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit document denial:', e.message);
    }
  }

  /**
   * Audit platform admin override
   * @private
   */
  async _auditOverride(user, action, doc, overrideReason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'document_access_override',
        entity_id: doc?.id || 'UNKNOWN',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Document access override by ${user.role}: ${overrideReason}`,
        outcome: 'override',
        reason_code: 'PLATFORM_ADMIN_OVERRIDE',
        override_reason: overrideReason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to audit document override:', e.message);
    }
  }

  /**
   * Return safe document payload (no private metadata)
   * @private
   */
  _safeDocumentPayload(doc) {
    return {
      id: doc.id,
      name: doc.name,
      document_type: doc.document_type,
      document_classification: doc.document_classification,
      uploaded_by: doc.uploaded_by,
      uploaded_date: doc.created_date,
      notes: doc.notes,
      relationship_id: doc.mga_relationship_id || undefined,
      relationship_status: doc.relationship_status || undefined,
      visibility_scope: doc.visibility_scope
    };
  }
}

export default new DocumentAccessService();