/**
 * Gate 6D — Export Delivery History & Tracking
 * Fail-closed backend function. Action-routed. Mirrors Gate 6C mgaReportExport.js auth chain.
 *
 * Feature flag: MGA_EXPORT_HISTORY_ENABLED = false (disabled by default)
 * Authorization chain: flag → auth → scope → permission → action dispatch → audit
 *
 * Step 5 of Gate 6D Implementation Work Order.
 *
 * DO NOT ACTIVATE until operator approval is obtained.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Gate 6D Feature Flag ─────────────────────────────────────────────────────
// Default: false. Set true only after explicit operator approval + redeploy.
const MGA_EXPORT_HISTORY_ENABLED = false;

// ─── Authorized roles for history access ─────────────────────────────────────
const HISTORY_VIEW_ROLES   = ['admin', 'platform_super_admin', 'mga_admin', 'mga_manager'];
const HISTORY_AUDIT_ROLES  = ['admin', 'platform_super_admin', 'mga_admin'];
const HISTORY_RETRY_ROLES  = ['admin', 'platform_super_admin', 'mga_admin'];
const HISTORY_CANCEL_ROLES = ['admin', 'platform_super_admin', 'mga_admin'];

// ─── Standard fail-closed error responses ────────────────────────────────────
const ERRORS = {
  FEATURE_DISABLED: () => Response.json(
    { error: 'FEATURE_DISABLED', message: 'Export history is not enabled.' },
    { status: 503 }
  ),
  UNAUTHORIZED: () => Response.json(
    { error: 'UNAUTHORIZED', message: 'Authentication required.' },
    { status: 401 }
  ),
  FORBIDDEN: (reason) => Response.json(
    { error: 'FORBIDDEN', message: reason || 'Access denied.' },
    { status: 403 }
  ),
  NOT_FOUND: () => Response.json(
    { error: 'NOT_FOUND', message: 'Export history record not found.' },
    { status: 404 }
  ),
  BAD_REQUEST: (msg) => Response.json(
    { error: 'BAD_REQUEST', message: msg || 'Invalid request.' },
    { status: 400 }
  ),
  DEFERRED: (action) => Response.json(
    { error: 'DEFERRED', message: `Action '${action}' is not yet available.` },
    { status: 501 }
  ),
  INTERNAL: () => Response.json(
    { error: 'INTERNAL_ERROR', message: 'An error occurred processing your request.' },
    { status: 500 }
  ),
};

// ─── Audit logging (non-blocking) ────────────────────────────────────────────
async function auditLog(base44, action, detail, actorEmail, actorRole, mgaId, correlationId, outcome) {
  try {
    await base44.asServiceRole.entities.ActivityLog.create({
      action,
      detail,
      master_general_agent_id: mgaId || null,
      actor_email: actorEmail || null,
      actor_role: actorRole || null,
      correlation_id: correlationId || null,
      entity_type: 'ExportHistory',
      outcome: outcome || 'success',
    });
  } catch (_) { /* non-blocking */ }
}

// ─── Correlation ID generator ─────────────────────────────────────────────────
function generateCorrelationId() {
  return `gh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Permission helpers ───────────────────────────────────────────────────────
function hasRole(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}

// ─── Safe payload allowlist ───────────────────────────────────────────────────
const ALLOWED_FIELDS = new Set([
  'export_request_id', 'report_type', 'format', 'status',
  'requested_by_user_id', 'requested_by_role',
  'requested_at', 'generated_at', 'downloaded_at', 'expires_at',
  'record_count', 'failure_reason_code', 'artifact_available',
]);

function applySafePayload(record) {
  if (!record || typeof record !== 'object') return {};
  const safe = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in record) safe[key] = record[key];
  }
  return safe;
}

function applySafePayloadList(records) {
  if (!Array.isArray(records)) return [];
  return records.map(applySafePayload);
}

// ─── MGA Scope resolution ─────────────────────────────────────────────────────
async function resolveMgaScope(base44, user, requestedMgaId) {
  // Platform admins may query any MGA; MGA users scoped to their own
  const platformAdmin = ['admin', 'platform_super_admin'].includes(user.role);

  if (platformAdmin) {
    if (!requestedMgaId) return { error: 'mga_id is required.' };
    return { mgaId: requestedMgaId };
  }

  // MGA-scoped user: resolve from MasterGeneralAgentUser
  try {
    const mgaUsers = await base44.asServiceRole.entities.MasterGeneralAgentUser.filter({
      user_email: user.email,
    });
    if (!mgaUsers || mgaUsers.length === 0) return { error: 'No MGA scope found for user.' };
    const mgaId = mgaUsers[0].master_general_agent_id;
    // If a specific MGA was requested, it must match the user's own MGA
    if (requestedMgaId && requestedMgaId !== mgaId) {
      return { error: 'Requested MGA is outside your scope.' };
    }
    return { mgaId };
  } catch (_) {
    return { error: 'Failed to resolve MGA scope.' };
  }
}

// ─── Action handlers ──────────────────────────────────────────────────────────

async function handleListExportHistory(base44, user, body, mgaId, correlationId) {
  if (!hasRole(user.role, HISTORY_VIEW_ROLES)) {
    await auditLog(base44, 'history_permission_denied',
      `Permission denied for listExportHistory. Role: ${user.role}.`,
      user.email, user.role, mgaId, correlationId, 'blocked');
    return ERRORS.FORBIDDEN('Insufficient permissions to view export history.');
  }

  const { filters = {} } = body;
  const query = { master_general_agent_id: mgaId, action: 'export_requested' };
  if (filters.date_from) query['created_date'] = { $gte: filters.date_from };

  const limit = Math.min(filters.limit || 25, 100);
  const skip  = ((filters.page || 1) - 1) * limit;

  const anchorEvents = await base44.asServiceRole.entities.ActivityLog.filter(
    query, '-created_date', limit, skip
  );

  const records = (anchorEvents || []).map(e => applySafePayload({
    export_request_id:    e.correlation_id || e.id,
    report_type:          extractField(e.detail, 'report_type'),
    format:               extractField(e.detail, 'format'),
    status:               'completed', // simplified; full join in service layer
    requested_by_user_id: e.actor_email,
    requested_by_role:    e.actor_role,
    requested_at:         e.created_date,
    generated_at:         null,
    downloaded_at:        null,
    expires_at:           null,
    record_count:         null,
    failure_reason_code:  null,
    artifact_available:   false,
  }));

  await auditLog(base44, 'history_list_requested',
    `History list returned ${records.length} records.`,
    user.email, user.role, mgaId, correlationId, 'success');

  return Response.json({ records, total: records.length });
}

async function handleGetExportHistoryDetail(base44, user, body, mgaId, correlationId) {
  if (!hasRole(user.role, HISTORY_VIEW_ROLES)) {
    await auditLog(base44, 'history_permission_denied',
      `Permission denied for getExportHistoryDetail. Role: ${user.role}.`,
      user.email, user.role, mgaId, correlationId, 'blocked');
    return ERRORS.FORBIDDEN('Insufficient permissions to view export history.');
  }

  const { export_request_id } = body;
  if (!export_request_id) return ERRORS.BAD_REQUEST('export_request_id is required.');

  const events = await base44.asServiceRole.entities.ActivityLog.filter({
    master_general_agent_id: mgaId,
    correlation_id: export_request_id,
  });

  if (!events || events.length === 0) return ERRORS.NOT_FOUND();

  const root = events.find(e => e.action === 'export_requested') || events[0];
  const record = applySafePayload({
    export_request_id:    export_request_id,
    report_type:          extractField(root.detail, 'report_type'),
    format:               extractField(root.detail, 'format'),
    status:               deriveStatus(events),
    requested_by_user_id: root.actor_email,
    requested_by_role:    root.actor_role,
    requested_at:         root.created_date,
    generated_at:         events.find(e => e.action === 'export_generation_completed')?.created_date || null,
    downloaded_at:        events.find(e => e.action === 'export_download_completed')?.created_date || null,
    expires_at:           null,
    record_count:         null,
    failure_reason_code:  events.find(e => e.action === 'export_generation_failed')
      ? extractField(events.find(e => e.action === 'export_generation_failed').detail, 'failure_reason_code') || 'UNKNOWN_ERROR'
      : null,
    artifact_available:   false,
  });

  await auditLog(base44, 'history_detail_requested',
    `Detail requested for export_request_id: ${export_request_id}.`,
    user.email, user.role, mgaId, correlationId, 'success');

  return Response.json({ record });
}

async function handleGetExportAuditTrail(base44, user, body, mgaId, correlationId) {
  if (!hasRole(user.role, HISTORY_AUDIT_ROLES)) {
    await auditLog(base44, 'history_permission_denied',
      `Permission denied for getExportAuditTrail. Role: ${user.role}.`,
      user.email, user.role, mgaId, correlationId, 'blocked');
    return ERRORS.FORBIDDEN('Insufficient permissions to view audit trail.');
  }

  const { export_request_id } = body;
  if (!export_request_id) return ERRORS.BAD_REQUEST('export_request_id is required.');

  const events = await base44.asServiceRole.entities.ActivityLog.filter({
    master_general_agent_id: mgaId,
    correlation_id: export_request_id,
  }, 'created_date');

  if (!events || events.length === 0) return ERRORS.NOT_FOUND();

  const trail = events.map(e => ({
    action:     e.action,
    actor:      e.actor_email || null,
    actor_role: e.actor_role || null,
    outcome:    e.outcome || null,
    timestamp:  e.created_date || null,
  }));

  await auditLog(base44, 'history_audit_trail_requested',
    `Audit trail requested for export_request_id: ${export_request_id}.`,
    user.email, user.role, mgaId, correlationId, 'success');

  return Response.json({ trail });
}

async function handleRetryExport(base44, user, body, mgaId, correlationId) {
  // Deferred — not yet approved for activation
  await auditLog(base44, 'history_retry_requested',
    `Retry requested (deferred) for export_request_id: ${body.export_request_id}.`,
    user.email, user.role, mgaId, correlationId, 'blocked');
  return ERRORS.DEFERRED('retryExport');
}

async function handleCancelExport(base44, user, body, mgaId, correlationId) {
  // Deferred — not yet approved for activation
  await auditLog(base44, 'history_cancel_requested',
    `Cancel requested (deferred) for export_request_id: ${body.export_request_id}.`,
    user.email, user.role, mgaId, correlationId, 'blocked');
  return ERRORS.DEFERRED('cancelExport');
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

function extractField(detail, key) {
  if (!detail || typeof detail !== 'string') return null;
  const match = detail.match(new RegExp(`"?${key}"?:\\s*"?([^",}\\]]+)"?`));
  return match ? match[1].trim() : null;
}

function deriveStatus(events) {
  if (events.some(e => e.action === 'export_generation_completed')) return 'completed';
  if (events.some(e => e.action === 'export_generation_failed'))    return 'failed';
  return 'processing';
}

// ─── Main Deno handler ────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    // Step 1 — Feature flag (checked before any auth)
    if (!MGA_EXPORT_HISTORY_ENABLED) {
      return ERRORS.FEATURE_DISABLED();
    }

    // Step 2 — Authentication
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return ERRORS.UNAUTHORIZED();

    // Step 3 — Correlation ID
    const correlationId = generateCorrelationId();

    // Parse body
    const body = await req.json().catch(() => ({}));
    const { action, mga_id: requestedMgaId } = body;

    if (!action) return ERRORS.BAD_REQUEST('action is required.');

    // Step 4 — MGA Scope resolution + validation
    const { mgaId, error: scopeError } = await resolveMgaScope(base44, user, requestedMgaId);
    if (scopeError) {
      await auditLog(base44, 'history_scope_denied', scopeError,
        user.email, user.role, requestedMgaId, correlationId, 'blocked');
      return ERRORS.FORBIDDEN(scopeError);
    }

    // Step 5 — Role check (coarse; action handlers perform fine-grained checks)
    const allHistoryRoles = ['admin', 'platform_super_admin', 'mga_admin', 'mga_manager'];
    if (!hasRole(user.role, allHistoryRoles)) {
      await auditLog(base44, 'history_permission_denied',
        `Role '${user.role}' has no history permissions.`,
        user.email, user.role, mgaId, correlationId, 'blocked');
      return ERRORS.FORBIDDEN('Your role does not have access to export history.');
    }

    // Step 6 — Action dispatch
    switch (action) {
      case 'listExportHistory':
        return await handleListExportHistory(base44, user, body, mgaId, correlationId);
      case 'getExportHistoryDetail':
        return await handleGetExportHistoryDetail(base44, user, body, mgaId, correlationId);
      case 'getExportAuditTrail':
        return await handleGetExportAuditTrail(base44, user, body, mgaId, correlationId);
      case 'retryExport':
        return await handleRetryExport(base44, user, body, mgaId, correlationId);
      case 'cancelExport':
        return await handleCancelExport(base44, user, body, mgaId, correlationId);
      default:
        return ERRORS.BAD_REQUEST(`Unknown action: ${action}`);
    }

  } catch (error) {
    return ERRORS.INTERNAL();
  }
});