/**
 * Gate 6D — Export Delivery History & Tracking
 * Audit event taxonomy and non-blocking logging helpers.
 * Mirrors Gate 6C reportExportAudit.js pattern exactly.
 *
 * Step 4 of Gate 6D Implementation Work Order.
 */

import { base44 } from '@/api/base44Client';

// ─── Audit Event Constants ────────────────────────────────────────────────────

export const HISTORY_AUDIT_EVENTS = {
  LIST_REQUESTED:        'history_list_requested',
  DETAIL_REQUESTED:      'history_detail_requested',
  AUDIT_TRAIL_REQUESTED: 'history_audit_trail_requested',
  SCOPE_DENIED:          'history_scope_denied',
  PERMISSION_DENIED:     'history_permission_denied',
  RETRY_REQUESTED:       'history_retry_requested',
  CANCEL_REQUESTED:      'history_cancel_requested',
};

// ─── Sensitive Keyword Redaction ──────────────────────────────────────────────

const SENSITIVE_PATTERNS = [
  /password/gi,
  /token/gi,
  /secret/gi,
  /ssn/gi,
  /date_of_birth/gi,
  /private_url/gi,
  /signed_url/gi,
  /file_uri/gi,
  /access_key/gi,
];

function sanitizeDetail(detail) {
  if (!detail || typeof detail !== 'string') return detail;
  let sanitized = detail;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

// ─── Core Non-Blocking Log Function ──────────────────────────────────────────

/**
 * Writes an audit entry to ActivityLog.
 * NON-BLOCKING — failure to log does not abort the history response.
 */
async function logHistoryEvent({ action, detail, mgaId, actorEmail, actorRole, correlationId, outcome }) {
  try {
    await base44.entities.ActivityLog.create({
      action,
      detail: sanitizeDetail(detail),
      master_general_agent_id: mgaId || null,
      actor_email: actorEmail || null,
      actor_role: actorRole || null,
      correlation_id: correlationId || null,
      entity_type: 'ExportHistory',
      outcome: outcome || 'success',
    });
  } catch (_err) {
    // Non-blocking — log silently; do not propagate
  }
}

// ─── Specific Audit Helpers ───────────────────────────────────────────────────

export async function auditHistoryListRequested({ mgaId, actorEmail, actorRole, correlationId, filters, recordCount }) {
  await logHistoryEvent({
    action: HISTORY_AUDIT_EVENTS.LIST_REQUESTED,
    detail: `History list requested. Filters: ${JSON.stringify(filters || {})}. Records returned: ${recordCount ?? 0}.`,
    mgaId, actorEmail, actorRole, correlationId, outcome: 'success',
  });
}

export async function auditHistoryDetailRequested({ mgaId, actorEmail, actorRole, correlationId, exportRequestId }) {
  await logHistoryEvent({
    action: HISTORY_AUDIT_EVENTS.DETAIL_REQUESTED,
    detail: `History detail requested for export_request_id: ${exportRequestId}.`,
    mgaId, actorEmail, actorRole, correlationId, outcome: 'success',
  });
}

export async function auditHistoryAuditTrailRequested({ mgaId, actorEmail, actorRole, correlationId, exportRequestId }) {
  await logHistoryEvent({
    action: HISTORY_AUDIT_EVENTS.AUDIT_TRAIL_REQUESTED,
    detail: `Audit trail requested for export_request_id: ${exportRequestId}.`,
    mgaId, actorEmail, actorRole, correlationId, outcome: 'success',
  });
}

export async function auditHistoryScopeDenied({ mgaId, actorEmail, actorRole, correlationId, attemptedScope, reason }) {
  await logHistoryEvent({
    action: HISTORY_AUDIT_EVENTS.SCOPE_DENIED,
    detail: `Scope denied. Attempted scope: ${JSON.stringify(attemptedScope || {})}. Reason: ${reason}.`,
    mgaId, actorEmail, actorRole, correlationId, outcome: 'blocked',
  });
}

export async function auditHistoryPermissionDenied({ mgaId, actorEmail, actorRole, correlationId, requiredPermission }) {
  await logHistoryEvent({
    action: HISTORY_AUDIT_EVENTS.PERMISSION_DENIED,
    detail: `Permission denied. Required: ${requiredPermission}. Actor role: ${actorRole}.`,
    mgaId, actorEmail, actorRole, correlationId, outcome: 'blocked',
  });
}

export async function auditHistoryRetryRequested({ mgaId, actorEmail, actorRole, correlationId, exportRequestId, outcome }) {
  await logHistoryEvent({
    action: HISTORY_AUDIT_EVENTS.RETRY_REQUESTED,
    detail: `Retry requested for export_request_id: ${exportRequestId}.`,
    mgaId, actorEmail, actorRole, correlationId, outcome: outcome || 'success',
  });
}

export async function auditHistoryCancelRequested({ mgaId, actorEmail, actorRole, correlationId, exportRequestId, outcome }) {
  await logHistoryEvent({
    action: HISTORY_AUDIT_EVENTS.CANCEL_REQUESTED,
    detail: `Cancel requested for export_request_id: ${exportRequestId}.`,
    mgaId, actorEmail, actorRole, correlationId, outcome: outcome || 'success',
  });
}