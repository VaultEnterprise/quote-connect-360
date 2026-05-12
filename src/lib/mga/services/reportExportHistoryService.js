/**
 * Gate 6D — Export Delivery History & Tracking
 * History query service using Gate 6C ActivityLog audit events as source of truth.
 * Enforces MGA scope on every query and response record.
 * Never returns signed URLs, file URIs, or exported content.
 *
 * Step 6 of Gate 6D Implementation Work Order.
 */

import { base44 } from '@/api/base44Client';
import { applySafePayloadPolicy, applySafePayloadPolicyToList } from '@/lib/mga/reportExportHistoryPayloadPolicy';

// ─── Export-related audit event action names (Gate 6C) ────────────────────────

const EXPORT_ACTION_TYPES = [
  'export_requested',
  'export_generation_started',
  'export_generation_completed',
  'export_generation_failed',
  'export_download_started',
  'export_download_completed',
  'export_scope_denied',
  'export_permission_denied',
  'export_feature_disabled',
];

// Artifact TTL in milliseconds (default: 24 hours)
const ARTIFACT_TTL_MS = 24 * 60 * 60 * 1000;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function parseDetailField(detail, key) {
  if (!detail || typeof detail !== 'string') return null;
  const match = detail.match(new RegExp(`"?${key}"?:\\s*"?([^",}\\]]+)"?`));
  return match ? match[1].trim() : null;
}

function computeExpiresAt(generatedAt) {
  if (!generatedAt) return null;
  return new Date(new Date(generatedAt).getTime() + ARTIFACT_TTL_MS).toISOString();
}

function computeArtifactAvailable(expiresAt, status) {
  if (!expiresAt || status !== 'completed') return false;
  return new Date(expiresAt) > new Date();
}

/**
 * Collapses multiple ActivityLog events (sharing correlation_id) into a single
 * unified history record using only the safe payload fields.
 */
function buildHistoryRecord(events) {
  // Anchor on the 'export_requested' event
  const root = events.find(e => e.action === 'export_requested') || events[0];
  if (!root) return null;

  const completedEvent  = events.find(e => e.action === 'export_generation_completed');
  const failedEvent     = events.find(e => e.action === 'export_generation_failed');
  const downloadedEvent = events.find(e => e.action === 'export_download_completed');

  const report_type     = parseDetailField(root.detail, 'report_type') || 'unknown';
  const format          = parseDetailField(root.detail, 'format') || 'unknown';
  const record_count    = completedEvent
    ? parseInt(parseDetailField(completedEvent.detail, 'record_count'), 10) || null
    : null;
  const failure_reason  = failedEvent
    ? (parseDetailField(failedEvent.detail, 'failure_reason_code') || 'UNKNOWN_ERROR')
    : null;

  let status = 'processing';
  if (completedEvent) status = 'completed';
  else if (failedEvent) status = 'failed';

  const generated_at  = completedEvent?.created_date || null;
  const downloaded_at = downloadedEvent?.created_date || null;
  const expires_at    = computeExpiresAt(generated_at);

  const raw = {
    export_request_id:    root.correlation_id || root.id,
    report_type,
    format,
    status,
    requested_by_user_id: root.actor_email || null,
    requested_by_role:    root.actor_role || null,
    requested_at:         root.created_date || null,
    generated_at,
    downloaded_at,
    expires_at,
    record_count:         isNaN(record_count) ? null : record_count,
    failure_reason_code:  failure_reason,
    artifact_available:   computeArtifactAvailable(expires_at, status),
  };

  return applySafePayloadPolicy(raw);
}

// ─── Public Service Functions ─────────────────────────────────────────────────

/**
 * Lists export history for a given MGA scope.
 * Scope validation is expected to have already been performed by the backend function.
 *
 * @param {object} params
 * @param {string} params.mgaId - Validated MGA ID
 * @param {object} [params.filters] - Optional: report_type, status, date_from, date_to, page, limit
 * @returns {Promise<{ records: object[], total: number }>}
 */
export async function listExportHistory({ mgaId, filters = {} }) {
  const { report_type, status, date_from, date_to, page = 1, limit = 25 } = filters;

  const query = {
    master_general_agent_id: mgaId,
    action: { $in: ['export_requested'] }, // anchor events only
  };

  if (date_from) query.created_date = { ...(query.created_date || {}), $gte: date_from };
  if (date_to)   query.created_date = { ...(query.created_date || {}), $lte: date_to };

  const skip = (Math.max(1, page) - 1) * limit;
  const anchorEvents = await base44.entities.ActivityLog.filter(query, '-created_date', limit, skip);

  if (!anchorEvents || anchorEvents.length === 0) return { records: [], total: 0 };

  // Gather all correlation IDs and fetch related events
  const correlationIds = anchorEvents
    .map(e => e.correlation_id)
    .filter(Boolean);

  let allRelatedEvents = [];
  if (correlationIds.length > 0) {
    allRelatedEvents = await base44.entities.ActivityLog.filter({
      master_general_agent_id: mgaId,
      correlation_id: { $in: correlationIds },
    });
  }

  // Group events by correlation_id
  const grouped = {};
  for (const anchor of anchorEvents) {
    const cid = anchor.correlation_id || anchor.id;
    grouped[cid] = [anchor];
  }
  for (const ev of allRelatedEvents) {
    const cid = ev.correlation_id;
    if (cid && grouped[cid] && ev.id !== grouped[cid][0].id) {
      grouped[cid].push(ev);
    }
  }

  let records = Object.values(grouped)
    .map(buildHistoryRecord)
    .filter(Boolean);

  // Apply optional post-query filters
  if (report_type) records = records.filter(r => r.report_type === report_type);
  if (status)      records = records.filter(r => r.status === status);

  return { records: applySafePayloadPolicyToList(records), total: records.length };
}

/**
 * Returns full metadata for a single export history record.
 * Re-validates that the record belongs to the requesting MGA scope.
 *
 * @param {object} params
 * @param {string} params.mgaId - Validated MGA ID
 * @param {string} params.exportRequestId - correlation_id of the export request
 * @returns {Promise<object|null>}
 */
export async function getExportHistoryDetail({ mgaId, exportRequestId }) {
  const events = await base44.entities.ActivityLog.filter({
    master_general_agent_id: mgaId,
    correlation_id: exportRequestId,
  });

  if (!events || events.length === 0) return null;

  // Re-validate every event belongs to this MGA (defense in depth)
  const scoped = events.filter(e => e.master_general_agent_id === mgaId);
  if (scoped.length === 0) return null;

  const record = buildHistoryRecord(scoped);
  return record ? applySafePayloadPolicy(record) : null;
}

/**
 * Returns the audit trail for a single export request.
 * Strips sensitive fields from each audit event detail.
 * Requires history.audit permission (enforced by backend function).
 *
 * @param {object} params
 * @param {string} params.mgaId - Validated MGA ID
 * @param {string} params.exportRequestId - correlation_id
 * @returns {Promise<object[]>}
 */
export async function getExportAuditTrail({ mgaId, exportRequestId }) {
  const events = await base44.entities.ActivityLog.filter({
    master_general_agent_id: mgaId,
    correlation_id: exportRequestId,
  }, 'created_date');

  if (!events || events.length === 0) return [];

  // Re-validate scope; return only safe audit fields
  return events
    .filter(e => e.master_general_agent_id === mgaId)
    .map(e => ({
      action:     e.action,
      actor:      e.actor_email || null,
      actor_role: e.actor_role || null,
      outcome:    e.outcome || null,
      timestamp:  e.created_date || null,
      // detail intentionally excluded — may contain structured data
    }));
}