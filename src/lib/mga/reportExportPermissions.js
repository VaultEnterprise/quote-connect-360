/**
 * MGA Gate 6C — Report Export Permission Keys
 * Centralized permission catalog for all export operations.
 * 
 * Permission keys are abstract; grants are resolved in permissionResolver.js
 * based on user role and MGA scope.
 */

// Permission key constants
export const EXPORT_PERMISSIONS = {
  VIEW: 'mga.reports.view',           // Can access report export UI
  EXPORT: 'mga.reports.export',       // Can initiate any export
  EXPORT_CSV: 'mga.reports.export_csv',   // Can export to CSV
  EXPORT_XLSX: 'mga.reports.export_xlsx', // Can export to XLSX
  EXPORT_PDF: 'mga.reports.export_pdf',   // Can export to PDF
  AUDIT: 'mga.reports.audit',         // Can export audit activity log
};

/**
 * Role-to-Permission Mapping
 * Defines which roles have which export permissions.
 * Enforced in permissionResolver.js.
 */
export const ROLE_PERMISSION_MAP = {
  mga_admin: [
    EXPORT_PERMISSIONS.VIEW,
    EXPORT_PERMISSIONS.EXPORT,
    EXPORT_PERMISSIONS.EXPORT_CSV,
    EXPORT_PERMISSIONS.EXPORT_XLSX,
    EXPORT_PERMISSIONS.EXPORT_PDF,
    EXPORT_PERMISSIONS.AUDIT,
  ],
  mga_manager: [
    EXPORT_PERMISSIONS.VIEW,
    EXPORT_PERMISSIONS.EXPORT,
    EXPORT_PERMISSIONS.EXPORT_CSV,
    EXPORT_PERMISSIONS.EXPORT_XLSX,
    EXPORT_PERMISSIONS.EXPORT_PDF,
    // Note: mga_manager does NOT have AUDIT permission
  ],
  mga_user: [],
  mga_read_only: [],
  platform_super_admin: [
    EXPORT_PERMISSIONS.VIEW,
    EXPORT_PERMISSIONS.EXPORT,
    EXPORT_PERMISSIONS.EXPORT_CSV,
    EXPORT_PERMISSIONS.EXPORT_XLSX,
    EXPORT_PERMISSIONS.EXPORT_PDF,
    EXPORT_PERMISSIONS.AUDIT,
  ],
  admin: [
    EXPORT_PERMISSIONS.VIEW,
    EXPORT_PERMISSIONS.EXPORT,
    EXPORT_PERMISSIONS.EXPORT_CSV,
    EXPORT_PERMISSIONS.EXPORT_XLSX,
    EXPORT_PERMISSIONS.EXPORT_PDF,
    EXPORT_PERMISSIONS.AUDIT,
  ],
};

/**
 * Get all permissions for a given role.
 * @param {string} role - User role
 * @returns {Array<string>} Array of permission keys
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSION_MAP[role] || [];
}

/**
 * Check if a role has a specific permission.
 * @param {string} role - User role
 * @param {string} permission - Permission key to check
 * @returns {boolean} True if role has permission
 */
export function hasPermission(role, permission) {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}