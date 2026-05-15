/**
 * MGA Phase 2 — Canonical Error Model
 * lib/mga/errorModel.js
 *
 * Defines all canonical error codes, HTTP status mappings, user-facing messages,
 * and 403/404 masking rules for the MGA authorization system.
 *
 * PHASE 2 CONSTRAINT: Inert until referenced by Phase 3 services via scopeGate.
 *
 * 403/404 masking rule:
 *   - Authenticated users with no permission or cross-scope access: 403 Forbidden.
 *   - Records that do not exist within the actor's allowed scope search space: 404 Not Found.
 *     (Prevents revealing existence of records in other MGAs.)
 *   - Unauthenticated: 401 Unauthorized.
 *   - Quarantined target (to MGA user): 403 Forbidden (no indication of quarantine status).
 *
 * @see docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md Section 7
 */

export const errorModel = {
  UNAUTHENTICATED: {
    reason_code: 'UNAUTHENTICATED',
    http_status: 401,
    user_message: 'Authentication required.',
    security_event: false,
    quarantine: false,
    allowed: false,
  },

  MISSING_MEMBERSHIP: {
    reason_code: 'MISSING_MEMBERSHIP',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },

  CONFLICTING_MEMBERSHIP: {
    reason_code: 'CONFLICTING_MEMBERSHIP',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },

  CROSS_MGA_VIOLATION: {
    reason_code: 'CROSS_MGA_VIOLATION',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },

  PERMISSION_DENIED: {
    reason_code: 'PERMISSION_DENIED',
    http_status: 403,
    user_message: 'You do not have permission for this action.',
    security_event: false,
    quarantine: false,
    allowed: false,
  },

  UNKNOWN_PERMISSION: {
    reason_code: 'UNKNOWN_PERMISSION',
    http_status: 403,
    user_message: 'You do not have permission for this action.',
    security_event: false,
    quarantine: false,
    allowed: false,
  },

  SCOPE_PENDING_MIGRATION: {
    reason_code: 'SCOPE_PENDING_MIGRATION',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,  // logs as migration-state violation
    quarantine: false,
    allowed: false,
    // NOTE: This code fires when the target entity type is in the P1 gap list.
    // It indicates that the entity's scope field has not yet been propagated.
    // Phase 3 services targeting these entities are BLOCKED until the mini-pass resolves them.
  },

  STALE_SCOPE: {
    reason_code: 'STALE_SCOPE',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,  // logs as migration-state violation
    quarantine: false,
    allowed: false,
  },

  QUARANTINE_DENIED: {
    reason_code: 'QUARANTINE_DENIED',
    http_status: 403,
    // Intentionally generic — do not reveal that the record is quarantined
    user_message: 'Access denied.',
    security_event: false,
    quarantine: true,
    allowed: false,
  },

  QUARANTINE_VISIBLE: {
    reason_code: 'QUARANTINE_VISIBLE',
    http_status: 200,
    user_message: null,
    security_event: true,  // platform compliance access always audited
    quarantine: true,
    allowed: true,
  },

  NOT_FOUND_IN_SCOPE: {
    reason_code: 'NOT_FOUND_IN_SCOPE',
    // 404 masking: cross-scope records appear as not found to avoid revealing existence
    http_status: 404,
    user_message: 'Record not found.',
    security_event: false,
    quarantine: false,
    allowed: false,
  },

  CONFLICTING_PARENT_CHAIN: {
    reason_code: 'CONFLICTING_PARENT_CHAIN',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,
    quarantine: true,  // triggers quarantine candidate flag
    allowed: false,
  },

  ORPHANED_RECORD: {
    reason_code: 'ORPHANED_RECORD',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,
    quarantine: true,  // triggers quarantine candidate flag
    allowed: false,
  },

  CLIENT_SCOPE_MISMATCH: {
    reason_code: 'CLIENT_SCOPE_MISMATCH',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },

  IMPERSONATION_WRITE_DENIED: {
    reason_code: 'IMPERSONATION_WRITE_DENIED',
    http_status: 403,
    user_message: 'Write operations are not permitted in support viewing mode.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },

  BREAK_GLASS_NOT_AUTHORIZED: {
    reason_code: 'BREAK_GLASS_NOT_AUTHORIZED',
    http_status: 403,
    user_message: 'This operation requires elevated authorization.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },

  SUPPORT_SCOPE_EXCEEDED: {
    reason_code: 'SUPPORT_SCOPE_EXCEEDED',
    http_status: 403,
    user_message: 'Access denied.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },

  MALFORMED_TARGET: {
    reason_code: 'MALFORMED_TARGET',
    http_status: 400,
    user_message: 'The request target is invalid.',
    security_event: false,
    quarantine: false,
    allowed: false,
  },

  UNSUPPORTED_OPERATION: {
    reason_code: 'UNSUPPORTED_OPERATION',
    http_status: 400,
    user_message: 'This operation is not supported.',
    security_event: false,
    quarantine: false,
    allowed: false,
  },

  ASYNC_SCOPE_DRIFT: {
    reason_code: 'ASYNC_SCOPE_DRIFT',
    http_status: 500,  // internal job failure; not returned to users
    user_message: 'Job execution failed due to scope change.',
    security_event: true,
    quarantine: false,
    allowed: false,
  },
};

/**
 * getByCode — Look up error definition by reason code.
 * Returns null if code is unknown.
 */
export function getByCode(reasonCode) {
  return Object.values(errorModel).find((e) => e.reason_code === reasonCode) || null;
}

export default { errorModel, getByCode };