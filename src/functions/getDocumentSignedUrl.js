/**
 * Get Document Signed URL (Gate 6L-B.2)
 * 
 * Generates time-limited signed URL for private document download.
 * Validates access before generating URL. URL expires in 300 seconds.
 * Audit logs signed URL generation.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// @ts-ignore - Deno globals
const { Deno } = globalThis;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { documentId, override_reason } = payload;

    // Fetch document
    let document;
    try {
      document = await base44.entities.Document.get(documentId);
    } catch (e) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    // Validate access
    const accessValid = await validateDocumentAccess(base44, user, document, override_reason);
    if (!accessValid.allowed) {
      await recordAuditEvent(base44, {
        event_type: 'document_download_denied',
        entity_id: documentId,
        actor_email: user.email,
        actor_role: user.role,
        reason_code: accessValid.reason,
        timestamp: new Date().toISOString()
      });
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate signed URL
    const signedUrlResult = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: document.file_uri,
      expires_in: 300 // 5 minutes
    });

    // Audit log
    await recordAuditEvent(base44, {
      event_type: 'document_signed_url_generated',
      entity_id: documentId,
      actor_email: user.email,
      actor_role: user.role,
      detail: `Signed URL generated for: ${document.name}`,
      expires_in: 300,
      override_applied: accessValid.override_applied || false,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      signed_url: signedUrlResult.signed_url,
      expires_in: 300,
      document_name: document.name
    });
  } catch (error) {
    console.error('Signed URL error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function validateDocumentAccess(base44, user, document, overrideReason) {
  // Direct broker documents: MGA denied
  if (document.document_classification === 'direct_broker_owned') {
    if (user.role.startsWith('mga_')) {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_SCOPE_DENY_MGA_DIRECT' };
    }
  }

  // MGA-affiliated: validate relationship
  if (document.document_classification === 'mga_affiliated') {
    if (user.role.startsWith('mga_')) {
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

      if (relationship.relationship_status !== 'ACTIVE') {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_ACTIVE' };
      }

      if (!relationship.visibility_active) {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_VISIBILITY_INACTIVE' };
      }

      if (relationship.master_general_agent_id !== user.master_general_agent_id) {
        return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_OWNED' };
      }
    }
  }

  // Broker owner check
  if (user.role.startsWith('broker_')) {
    if (document.broker_agency_id && document.broker_agency_id !== user.broker_agency_id) {
      // Platform admin can override
      if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
        const reason = overrideReason?.trim();
        if (!reason) {
          return { allowed: false, reason: 'DENY_OVERRIDE_MISSING_REASON' };
        }
        return { allowed: true, override_applied: true };
      }
      return { allowed: false, reason: 'DENY_NOT_BROKER_OWNER' };
    }
  }

  return { allowed: true };
}

async function recordAuditEvent(base44, eventData) {
  try {
    await base44.entities.AuditEvent.create({
      event_type: eventData.event_type,
      entity_id: eventData.entity_id,
      actor_email: eventData.actor_email,
      actor_role: eventData.actor_role,
      detail: eventData.detail || '',
      outcome: eventData.reason_code ? 'blocked' : 'success',
      reason_code: eventData.reason_code,
      expires_in: eventData.expires_in,
      override_applied: eventData.override_applied,
      timestamp: eventData.timestamp
    });
  } catch (e) {
    console.error('Failed to record audit event:', e.message);
  }
}