/**
 * MGA Phase 2 — Impersonation Control
 * lib/mga/impersonationControl.js
 *
 * Implements final support/impersonation policy:
 *   - Standard support impersonation is read-only only.
 *   - Write-capable impersonation is DISABLED BY DEFAULT.
 *   - Break-glass governance is a placeholder — not yet activatable.
 *   - Every impersonation session is fully logged.
 *
 * PHASE 2 CONSTRAINT: Inert until called by Phase 3 services.
 * Break-glass mode cannot be activated until explicitly implemented and approved.
 *
 * @see docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md Section 6
 */

/**
 * BREAK_GLASS_ENABLED — Global flag. Must remain false until break-glass
 * governance workflow is explicitly implemented and approved.
 */
const BREAK_GLASS_ENABLED = false;

/**
 * WRITE_ACTIONS — Actions that are never allowed in read-only impersonation mode.
 */
const WRITE_ACTIONS = [
  'create', 'edit', 'update', 'delete', 'approve', 'transmit',
  'retry', 'upload', 'import', 'manage_users', 'manage_settings',
  'administer_quarantine',
];

/**
 * validateImpersonationRequest — Check whether an impersonation session
 * is valid for the requested action.
 *
 * @param {Object} params
 * @param {string} params.real_actor_email — platform admin performing the impersonation
 * @param {string} params.impersonated_actor_email — user being acted as
 * @param {string} params.session_mode — "read_only" | "break_glass_write"
 * @param {string} params.action — requested operation action
 * @param {string|null} params.break_glass_approval_id — required for break_glass_write
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateImpersonationRequest(params) {
  const { session_mode, action, break_glass_approval_id } = params;

  // Only read_only mode is valid in Phase 2 (and by default indefinitely)
  if (session_mode === 'break_glass_write') {
    if (!BREAK_GLASS_ENABLED) {
      return {
        valid: false,
        reason: 'BREAK_GLASS_NOT_AUTHORIZED',
        message: 'Write-capable support access is disabled. Break-glass governance has not been implemented.',
      };
    }
    // Break-glass mode: would require approval ID, reason, expiry check
    // This path is unreachable while BREAK_GLASS_ENABLED = false
    if (!break_glass_approval_id) {
      return {
        valid: false,
        reason: 'BREAK_GLASS_NOT_AUTHORIZED',
        message: 'Break-glass approval ID is required for write-capable support access.',
      };
    }
  }

  // Read-only mode: deny any write action
  if (WRITE_ACTIONS.includes(action)) {
    return {
      valid: false,
      reason: 'IMPERSONATION_WRITE_DENIED',
      message: 'Write operations are not permitted in support viewing mode.',
    };
  }

  return { valid: true, reason: null };
}

/**
 * buildSessionRecord — Construct the full impersonation session record structure.
 * Phase 3+ services that implement impersonation sessions must persist this structure.
 *
 * @param {Object} params
 * @returns {ImpersonationSessionRecord}
 */
export function buildSessionRecord(params) {
  return {
    real_actor_email: params.real_actor_email,
    impersonated_actor_email: params.impersonated_actor_email,
    effective_mga_id: params.effective_mga_id,
    effective_master_group_ids: params.effective_master_group_ids || [],
    reason: params.reason || null,
    session_mode: params.session_mode || 'read_only',
    start_time: new Date().toISOString(),
    end_time: null,
    actions_viewed: [],
    actions_attempted: [],
    actions_completed: [],
    session_outcome: 'clean',
    break_glass_approval_id: params.break_glass_approval_id || null,
  };
}

/**
 * recordSessionAction — Add an action record to an impersonation session.
 * Called during active impersonation to track every operation.
 *
 * @param {ImpersonationSessionRecord} session
 * @param {Object} actionRecord
 * @param {"viewed"|"attempted"|"completed"} category
 * @returns {ImpersonationSessionRecord}
 */
export function recordSessionAction(session, actionRecord, category) {
  const enriched = {
    ...actionRecord,
    timestamp: new Date().toISOString(),
  };

  const updated = { ...session };

  if (category === 'viewed') {
    updated.actions_viewed = [...(session.actions_viewed || []), enriched];
  } else if (category === 'attempted') {
    updated.actions_attempted = [...(session.actions_attempted || []), enriched];
    // Track if write was attempted in read-only session
    if (WRITE_ACTIONS.includes(actionRecord.action) && session.session_mode === 'read_only') {
      updated.session_outcome = 'write_attempted';
    }
  } else if (category === 'completed') {
    updated.actions_completed = [...(session.actions_completed || []), enriched];
    if (WRITE_ACTIONS.includes(actionRecord.action)) {
      updated.session_outcome = 'write_completed';
    }
  }

  return updated;
}

/**
 * closeSession — Mark the session as ended and return the final record.
 *
 * @param {ImpersonationSessionRecord} session
 * @returns {ImpersonationSessionRecord}
 */
export function closeSession(session) {
  return {
    ...session,
    end_time: new Date().toISOString(),
  };
}

export default {
  validateImpersonationRequest,
  buildSessionRecord,
  recordSessionAction,
  closeSession,
  BREAK_GLASS_ENABLED,
  WRITE_ACTIONS,
};