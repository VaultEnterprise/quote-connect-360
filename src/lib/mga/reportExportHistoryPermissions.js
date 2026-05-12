/**
 * Gate 6D — Export Delivery History & Tracking
 * Permission key definitions and role-to-permission mappings.
 * Flag: MGA_EXPORT_HISTORY_ENABLED = false (inactive by default)
 *
 * Steps 2 of Gate 6D Implementation Work Order.
 */

// ─── Permission Key Constants ─────────────────────────────────────────────────

export const HISTORY_PERMISSIONS = {
  VIEW:   'mga.reports.history.view',    // View export history list and detail
  AUDIT:  'mga.reports.history.audit',   // View full audit trail for an export
  RETRY:  'mga.reports.history.retry',   // Retry a failed export (deferred)
  CANCEL: 'mga.reports.history.cancel',  // Cancel an in-progress export (deferred)
};

// ─── Role → Permission Mapping ───────────────────────────────────────────────

const ROLE_HISTORY_PERMISSIONS = {
  admin: [
    HISTORY_PERMISSIONS.VIEW,
    HISTORY_PERMISSIONS.AUDIT,
    HISTORY_PERMISSIONS.RETRY,
    HISTORY_PERMISSIONS.CANCEL,
  ],
  platform_super_admin: [
    HISTORY_PERMISSIONS.VIEW,
    HISTORY_PERMISSIONS.AUDIT,
    HISTORY_PERMISSIONS.RETRY,
    HISTORY_PERMISSIONS.CANCEL,
  ],
  mga_admin: [
    HISTORY_PERMISSIONS.VIEW,
    HISTORY_PERMISSIONS.AUDIT,
    HISTORY_PERMISSIONS.RETRY,
    HISTORY_PERMISSIONS.CANCEL,
  ],
  mga_manager: [
    HISTORY_PERMISSIONS.VIEW,
    // mga_manager: no audit, no retry, no cancel
  ],
  // mga_user, mga_read_only: no history permissions
  mga_user: [],
  mga_read_only: [],
};

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Returns the set of history permissions granted to a role.
 * Unknown roles receive no permissions (fail-closed).
 */
export function getHistoryPermissionsForRole(role) {
  return ROLE_HISTORY_PERMISSIONS[role] || [];
}

/**
 * Returns true if the given role has the specified history permission key.
 */
export function hasHistoryPermission(role, permissionKey) {
  const granted = getHistoryPermissionsForRole(role);
  return granted.includes(permissionKey);
}