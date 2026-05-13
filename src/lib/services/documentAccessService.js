/**
 * Document Access Service
 * 
 * Enforces role permission + broker ownership/relationship scope for document access.
 * All denials audited. Safe payloads only.
 * 
 * Gate 7A-3 Phase 7A-3.4
 */

import { base44 } from '@/api/base44Client';
import permissionResolver from '@/lib/permissionResolver.js';
import { auditWriter } from '@/lib/auditWriter.js';

class DocumentAccessService {
  /**
   * Get document with access control
   * @param {object} user
   * @param {string} documentId
   * @returns {object} { document: {...safe_fields}, allowed: boolean, reason?: string }
   */
  async getDocument(user, documentId) {
    const actionName = 'read_document';

    let documentRecord;
    try {
      documentRecord = await base44.entities.Document.get(documentId);
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
      documentRecord
    );

    if (!permissionDecision.allowed) {
      await this._auditDenial(user, actionName, documentRecord, permissionDecision.reason);
      return {
        allowed: false,
        reason: permissionDecision.reason,
        document: null
      };
    }

    return {
      allowed: true,
      document: this._safeDocumentPayload(documentRecord)
    };
  }

  /**
   * List documents with access control
   * @param {object} user
   * @returns {object} { documents: [], allowed: number, denied: number }
   */
  async listDocuments(user) {
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

    for (const documentRecord of allDocuments) {
      const permissionDecision = await permissionResolver.resolvePermission(
        user,
        'read_document',
        documentRecord
      );

      if (permissionDecision.allowed) {
        allowed.push(this._safeDocumentPayload(documentRecord));
      } else {
        denied.push(documentRecord.id);
        await this._auditDenial(user, 'read_document', documentRecord, permissionDecision.reason);
      }
    }

    return {
      documents: allowed,
      allowed: allowed.length,
      denied: denied.length
    };
  }

  /**
   * Create document with access control
   * @param {object} user
   * @param {object} documentData
   * @returns {object} { document: {...}, allowed: boolean, reason?: string }
   */
  async createDocument(user, documentData) {
    const actionName = 'create_document';

    const rolePerms = permissionResolver.getActionsByRole(user.role) || [];
    if (!rolePerms.includes(actionName)) {
      await this._auditDenial(user, actionName, null, 'DENY_ROLE_LACKS_PERMISSION');
      return {
        allowed: false,
        reason: 'DENY_ROLE_LACKS_PERMISSION',
        document: null
      };
    }

    if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
      const newDocument = await base44.entities.Document.create(documentData);
      return {
        allowed: true,
        document: this._safeDocumentPayload(newDocument)
      };
    }

    if (['broker_user', 'broker_admin'].includes(user.role)) {
      if (documentData.broker_agency_id !== user.broker_agency_id) {
        await this._auditDenial(user, actionName, documentData, 'DENY_NOT_BROKER_OWNER');
        return {
          allowed: false,
          reason: 'DENY_NOT_BROKER_OWNER',
          document: null
        };
      }

      const newDocument = await base44.entities.Document.create(documentData);
      return {
        allowed: true,
        document: this._safeDocumentPayload(newDocument)
      };
    }

    if (['mga_user', 'mga_admin'].includes(user.role)) {
      if (!documentData.relationship_id) {
        await this._auditDenial(user, actionName, documentData, 'DENY_MISSING_RELATIONSHIP');
        return {
          allowed: false,
          reason: 'DENY_MISSING_RELATIONSHIP',
          document: null
        };
      }

      const newDocument = await base44.entities.Document.create(documentData);
      return {
        allowed: true,
        document: this._safeDocumentPayload(newDocument)
      };
    }

    return {
      allowed: false,
      reason: 'DENY_INVALID_ROLE',
      document: null
    };
  }

  /**
   * Audit denied access
   * @private
   */
  async _auditDenial(user, action, record, reason) {
    try {
      await auditWriter.recordEvent({
        event_type: 'document_access_denied',
        entity_id: record?.id || 'NEW_RECORD',
        actor_email: user.email,
        actor_role: user.role,
        action,
        detail: `Document access denied: ${reason}`,
        outcome: 'blocked',
        reason_code: reason
      });
    } catch (e) {
      console.error('Failed to audit document denial:', e.message);
    }
  }

  /**
   * Return safe document payload (no internals)
   * @private
   */
  _safeDocumentPayload(documentRecord) {
    return {
      id: documentRecord.id,
      case_id: documentRecord.case_id,
      employer_group_id: documentRecord.employer_group_id,
      name: documentRecord.name,
      document_type: documentRecord.document_type,
      file_name: documentRecord.file_name,
      file_size: documentRecord.file_size,
      uploaded_by: documentRecord.uploaded_by,
      employer_name: documentRecord.employer_name,
      broker_agency_id: documentRecord.broker_agency_id,
      relationship_id: documentRecord.relationship_id || undefined
    };
  }
}

export default new DocumentAccessService();