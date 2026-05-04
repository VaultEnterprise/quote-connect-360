/**
 * MGA Phase 2 — Audit Decision Foundation
 * lib/mga/auditDecision.js
 *
 * Builds and records authorization decision audit metadata.
 * Every protected operation produces an AuditRecord even if the record is not
 * always written to MasterGeneralAgentActivityLog (see write rules below).
 *
 * Write rules:
 *   - Material operations (create, update, delete, transmit, etc.): WRITE
 *   - Platform super admin reads: WRITE
 *   - Cross-MGA and security events: WRITE
 *   - Permission denied (no security event): NO WRITE
 *   - Quarantine denied (MGA user, standard): NO WRITE (security roles can query quarantine queue)
 *   - Role/settings changes: WRITE (governance)
 *   - MGA lifecycle events: WRITE (governance)
 *
 * PHASE 2 CONSTRAINT: Inert until called by Phase 3 services.
 *
 * @see docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md Section 8
 */

import { base44 } from '@/api/base44Client';

/**
 * SENSITIVE_FIELDS — Fields that must be redacted in before/after values.
 * Format preserved; value replaced with "[REDACTED]".
 */
const SENSITIVE_FIELDS = [
  'tax_id_ein',
  'banking_setup_status',
  'rules',                   // commission rules object
  'commission_model',
  'override_model',
];

/**
 * MATERIAL_WRITE_ACTIONS — Actions that always require an audit write.
 */
const MATERIAL_WRITE_ACTIONS = [
  'create', 'edit', 'update', 'delete', 'approve', 'transmit',
  'retry', 'upload', 'import', 'manage_users', 'manage_settings',
  'administer_quarantine',
];

/**
 * build — Construct an AuditRecord from a gate decision and operation result.
 * Returns the record; does not write it. Call record() to write.
 *
 * @param {GateDecision} gateDecision
 * @param {Object} operationResult — { outcome: "success"|"failed"|"blocked", before?: any, after?: any, case_id?: string }
 * @param {string} [idempotencyKey]
 * @returns {AuditRecord}
 */
export function build(gateDecision, operationResult = {}, idempotencyKey = null) {
  const beforeValue = operationResult.before
    ? JSON.stringify(redact(operationResult.before))
    : null;
  const afterValue = operationResult.after
    ? JSON.stringify(redact(operationResult.after))
    : null;

  const isOperational = !gateDecision.security_event && !gateDecision.governance_event;

  return {
    // Actor fields
    master_general_agent_id: gateDecision.effective_mga_id !== 'platform_scope'
      ? gateDecision.effective_mga_id
      : null,
    master_group_id: gateDecision.effective_master_group_id || null,
    case_id: operationResult.case_id || null,
    entity_type: gateDecision.target_entity_type,
    entity_id: gateDecision.target_entity_id,
    actor_email: gateDecision.real_actor_email || gateDecision.actor_email,
    actor_role: gateDecision.actor_role || 'platform_super_admin',
    real_actor_email: gateDecision.real_actor_email || null,
    impersonated_actor_email: gateDecision.impersonated_actor_email || null,

    // Action fields
    action: `${gateDecision.target_entity_type || 'unknown'}.${gateDecision.reason_code === 'ALLOWED' ? gateDecision.required_permission?.split(':')?.[1] : gateDecision.reason_code}`,
    action_category: gateDecision.security_event
      ? 'security'
      : gateDecision.governance_event
      ? 'governance'
      : 'operational',
    outcome: operationResult.outcome || (gateDecision.allowed ? 'success' : 'blocked'),

    // Value fields
    before_value: beforeValue,
    after_value: afterValue,
    detail: operationResult.detail || null,

    // Tracing fields
    correlation_id: gateDecision.correlation_id,
    idempotency_key: idempotencyKey,
    request_channel: 'api', // refined per-call in Phase 3 services

    // Classification flags
    security_event_flag: gateDecision.security_event,
    governance_event_flag: gateDecision.governance_event,
  };
}

/**
 * record — Write an audit record to MasterGeneralAgentActivityLog if required.
 * Evaluates write rules; silently skips writes that are not required.
 *
 * @param {GateDecision} gateDecision
 * @param {Object} operationResult
 * @param {string} [idempotencyKey]
 * @returns {Promise<void>}
 */
export async function record(gateDecision, operationResult = {}, idempotencyKey = null) {
  const shouldWrite = _shouldWriteAudit(gateDecision, operationResult);
  if (!shouldWrite) return;

  const auditRecord = build(gateDecision, operationResult, idempotencyKey);

  // Fire-and-forget — audit failure must not block the operation
  try {
    await base44.entities.MasterGeneralAgentActivityLog.create(auditRecord);
  } catch {
    // Audit write failure is non-blocking but should be monitored
    console.error('[MGA Audit] Failed to write audit record:', gateDecision.correlation_id);
  }
}

/**
 * _shouldWriteAudit — Determine if this decision requires an audit write.
 */
function _shouldWriteAudit(gateDecision, operationResult) {
  // Always write security and governance events
  if (gateDecision.security_event) return true;
  if (gateDecision.governance_event) return true;

  // Always write platform super admin actions
  if (gateDecision.actor_role === 'platform_super_admin') return true;

  // Always write impersonation session actions
  if (gateDecision.actor_type === 'support_impersonation') return true;

  // Write material operations that succeeded
  if (gateDecision.allowed) {
    const action = gateDecision.required_permission?.split(':')?.[1];
    if (MATERIAL_WRITE_ACTIONS.includes(action)) return true;
  }

  // Do not write for standard permission denials with no security event
  // Do not write for standard in-scope reads by MGA users
  return false;
}

/**
 * redact — Replace sensitive field values with "[REDACTED]".
 * Preserves object structure; only replaces values at top level and one level deep.
 *
 * @param {Object|any} value
 * @returns {Object|any}
 */
export function redact(value) {
  if (!value || typeof value !== 'object') return value;
  const result = { ...value };
  for (const field of SENSITIVE_FIELDS) {
    if (field in result) {
      result[field] = '[REDACTED]';
    }
  }
  return result;
}

export default { build, record, redact };