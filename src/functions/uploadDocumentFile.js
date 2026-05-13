/**
 * Upload Document File (Gate 6L-B.2)
 * 
 * Handles private file upload with validation, access control, and audit logging.
 * All files stored as private (UploadPrivateFile), not public URLs.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { decode } from 'https://deno.land/std@0.208.0/encoding/base64.ts';

// @ts-ignore - Deno globals
const { Deno } = globalThis;
import { classifyDocument, determineVisibilityScope } from 'TODO_IMPORT_PATH'; // Will be imported from lib at build time

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const BLOCKED_MIME_PATTERNS = ['application/x-', 'script', 'executable'];

function validateFileUpload(filename, fileSize, mimeType) {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return { allowed: false, reason: 'FILE_TOO_LARGE' };
  }

  // Check MIME type whitelist
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { allowed: false, reason: 'FILE_TYPE_NOT_ALLOWED', mime: mimeType };
  }

  // Check for dangerous patterns
  for (const pattern of BLOCKED_MIME_PATTERNS) {
    if (mimeType.includes(pattern)) {
      return { allowed: false, reason: 'FILE_TYPE_DANGEROUS' };
    }
  }

  return { allowed: true };
}

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
    const { file_base64, filename, file_size, file_mime_type, document_type, notes, case_id, broker_agency_id, mga_relationship_id } = payload;

    // Validate file
    const validation = validateFileUpload(filename, file_size, file_mime_type);
    if (!validation.allowed) {
      await recordAuditEvent(base44, {
        event_type: 'document_upload_failed',
        actor_email: user.email,
        actor_role: user.role,
        reason: validation.reason,
        file_name: filename,
        timestamp: new Date().toISOString()
      });
      return Response.json({ error: validation.reason }, { status: 400 });
    }

    // Upload to private storage
    const file = decode(file_base64);
    const uploadResult = await base44.integrations.Core.UploadPrivateFile({ file });
    const file_uri = uploadResult.file_uri;

    // Create document record
    const classification = classifyDocument({
      broker_agency_id,
      mga_relationship_id,
      creator_role: user.role
    });

    const visibilityScope = determineVisibilityScope({
      broker_agency_id,
      mga_relationship_id
    });

    const documentRecord = await base44.entities.Document.create({
      broker_agency_id,
      mga_relationship_id,
      case_id,
      name: filename,
      document_type: document_type || 'other',
      file_uri,
      file_name: filename,
      file_size,
      file_mime_type,
      notes,
      uploaded_by: user.email,
      document_classification: classification,
      visibility_scope: visibilityScope,
      visibility_active: true
    });

    // Audit log success
    await recordAuditEvent(base44, {
      event_type: 'document_upload_successful',
      entity_id: documentRecord.id,
      actor_email: user.email,
      actor_role: user.role,
      detail: `Document uploaded: ${filename}`,
      file_name: filename,
      file_size,
      timestamp: new Date().toISOString()
    });

    // Return safe payload (no file_uri, storage internals, or sensitive metadata)
    return Response.json({
      document_id: documentRecord.id,
      name: documentRecord.name,
      classification,
      visibility_scope: visibilityScope
    });
  } catch (error) {
    console.error('Upload error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function recordAuditEvent(base44, eventData) {
  try {
    await base44.entities.AuditEvent.create({
      event_type: eventData.event_type,
      entity_id: eventData.entity_id,
      actor_email: eventData.actor_email,
      actor_role: eventData.actor_role,
      detail: eventData.detail || '',
      outcome: eventData.reason ? 'failed' : 'success',
      reason_code: eventData.reason,
      file_name: eventData.file_name,
      file_size: eventData.file_size,
      timestamp: eventData.timestamp
    });
  } catch (e) {
    console.error('Failed to record audit event:', e.message);
  }
}