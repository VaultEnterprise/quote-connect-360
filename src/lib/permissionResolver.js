/**
 * Centralized Permission Resolver
 * 
 * Enforces all Gate 7A-0 permission namespaces and rules.
 * All permissions default to false (fail-closed) and are gated behind feature flags.
 * Permissions are checked AFTER scope validation (scope failure = masked 404, permission failure = 403).
 * 
 * Permission Namespaces:
 * - platform_broker.* — Platform oversight of broker signups and relationships
 * - broker_agency.* — Broker agency self-management
 * - broker_direct.* — Broker direct business book operations
 * - broker_mga.* — Broker MGA-affiliated operations (requires active relationship)
 * - quote_delegation.* — Quote delegation operations (disabled during Gate 7A-0)
 * - benefits_admin.* — Benefits admin operations (disabled during Gate 7A-0)
 * 
 * All permissions inactive and fail-closed during Gate 7A-0.
 */

/**
 * Permission Namespace Registry
 * All permissions default to false (inactive/fail-closed).
 */
export const PERMISSIONS = {
  // Platform Broker Management
  platform_broker: {
    view: false,
    create: false,
    approve: false,
    reject: false,
    request_more_info: false,
    suspend: false,
    reactivate: false,
    view_book: false,
    manage_compliance: false,
    view_audit: false
  },

  // Broker Agency Self-Management
  broker_agency: {
    view: false,
    update: false,
    invite_user: false,
    manage_users: false,
    manage_permissions: false,
    manage_compliance: false,
    view_audit: false,
    view_as: false
  },

  // Broker Direct Business Book
  broker_direct: {
    employer: {
      create: false,
      view: false
    },
    case: {
      create: false,
      manage: false
    },
    census: {
      upload: false
    },
    quote: {
      create: false,
      manage: false
    },
    proposal: {
      create: false,
      manage: false
    },
    benefits_setup: {
      start: false
    },
    renewal: {
      manage: false
    },
    report: {
      view: false
    }
  },

  // Broker MGA-Affiliated Operations
  broker_mga: {
    employer: {
      view: false
    },
    case: {
      create: false,
      manage: false
    },
    quote: {
      create: false,
      submit_to_mga: false
    },
    proposal: {
      create: false
    },
    benefits_setup: {
      request: false
    },
    renewal: {
      manage: false
    }
  },

  // Quote Delegation (Disabled during Gate 7A-0)
  quote_delegation: {
    view: false,
    create: false,
    assign: false,
    reassign: false,
    cancel: false,
    archive: false,
    accept: false,
    decline: false,
    complete: false,
    take_over: false,
    request_review: false,
    submit_to_mga: false,
    submit_to_platform: false,
    approve: false,
    view_audit: false,
    override_assignment_blocker: false
  },

  // Benefits Admin (Disabled during Gate 7A-0)
  benefits_admin: {
    view: false,
    create_case: false,
    start_setup_from_quote: false,
    view_quote_package: false,
    validate_quote_package: false,
    manage_setup: false,
    approve_go_live: false,
    view_audit: false
  }
};

/**
 * Check if user has a specific permission.
 * Resolves permission from namespace hierarchy.
 * Returns false if permission doesn't exist or is inactive.
 * 
 * @param {string} permissionPath - Dot-path to permission (e.g., 'platform_broker.view', 'broker_direct.case.create')
 * @param {Object} scopeProfile - Actor's scope profile (from scopeResolver)
 * @param {string} userRole - User's role (for role-based permission evaluation)
 * @returns {boolean} Whether user has permission
 */
export const hasPermission = (permissionPath, scopeProfile, userRole) => {
  const parts = permissionPath.split('.');
  let current = PERMISSIONS;

  // Navigate to permission in namespace
  for (const part of parts) {
    if (!current.hasOwnProperty(part)) {
      return false; // Permission doesn't exist
    }
    current = current[part];
  }

  // Permission value is boolean; all false during Gate 7A-0
  const permissionValue = current;

  if (permissionValue !== true) {
    return false; // Permission is inactive
  }

  // Enforce role-based restrictions (even if permission is true in future)
  return evaluateRolePermission(permissionPath, userRole, scopeProfile);
};

/**
 * Evaluate whether role has permission to perform action.
 * Enforces role-to-permission mapping (broker, MGA, admin, etc.).
 * Called only if permission is active (during Gate 7A-0, all return false).
 * 
 * @param {string} permissionPath - Permission path
 * @param {string} userRole - User role
 * @param {Object} scopeProfile - Actor's scope profile
 * @returns {boolean} Whether role has permission
 */
export const evaluateRolePermission = (permissionPath, userRole, scopeProfile) => {
  // Platform admins have all permissions
  if (userRole === 'admin' || userRole === 'platform_super_admin') {
    return true;
  }

  // Broker admins have broker_agency and broker_direct permissions
  if (userRole === 'broker_admin' || userRole === 'broker_manager') {
    if (permissionPath.startsWith('broker_agency.') || permissionPath.startsWith('broker_direct.')) {
      return true;
    }
  }

  // MGA admins have broker_mga permissions
  if (userRole === 'mga_admin' || userRole === 'mga_manager') {
    if (permissionPath.startsWith('broker_mga.')) {
      return true;
    }
  }

  // Default: no permission
  return false;
};

/**
 * Assert that actor has permission to perform action.
 * Called AFTER scope check (scope already valid at this point).
 * Returns { permitted: boolean, error?: string, status?: number }
 * - permitted=true, status=200: Permission granted
 * - permitted=false, error='Forbidden', status=403: Permission denied
 * 
 * @param {string} permissionPath - Permission path (e.g., 'broker_direct.case.create')
 * @param {Object} scopeProfile - Actor's scope profile
 * @param {string} userRole - User's role
 * @returns {Object} { permitted: boolean, error?: string, status?: number }
 */
export const assertPermission = (permissionPath, scopeProfile, userRole) => {
  const permitted = hasPermission(permissionPath, scopeProfile, userRole);

  if (permitted) {
    return { permitted: true, status: 200 };
  }

  // Permission denied (within valid scope, so return 403, not 404)
  return { permitted: false, error: 'Forbidden', status: 403 };
};

/**
 * Get all active permissions for a user.
 * Used for permission serialization in auth response.
 * During Gate 7A-0, returns empty array (all permissions inactive).
 * 
 * @param {Object} scopeProfile - Actor's scope profile
 * @param {string} userRole - User's role
 * @returns {Array<string>} List of active permission paths
 */
export const getActivePermissions = (scopeProfile, userRole) => {
  const active = [];

  // Recursively find all active permissions
  const findActivePermissions = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === true) {
        // Permission is true; check role
        if (evaluateRolePermission(path, userRole, scopeProfile)) {
          active.push(path);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested namespace; recurse
        findActivePermissions(value, path);
      }
    }
  };

  findActivePermissions(PERMISSIONS);
  return active;
};

/**
 * Get all permissions in a namespace (for display/audit).
 * Returns full list including inactive permissions.
 * Used for permission matrix documentation and testing.
 * 
 * @param {string} namespacePath - Namespace path (e.g., 'platform_broker', 'broker_direct.case')
 * @returns {Array<Object>} List of permissions with their status
 */
export const getNamespacePermissions = (namespacePath = null) => {
  const result = [];

  const flattenPermissions = (obj, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'boolean') {
        result.push({
          path,
          active: value
        });
      } else if (typeof value === 'object' && value !== null) {
        flattenPermissions(value, path);
      }
    }
  };

  if (namespacePath) {
    // Get specific namespace
    const parts = namespacePath.split('.');
    let current = PERMISSIONS;
    for (const part of parts) {
      if (current.hasOwnProperty(part)) {
        current = current[part];
      } else {
        return []; // Namespace not found
      }
    }
    flattenPermissions(current, namespacePath);
  } else {
    // Get all permissions
    flattenPermissions(PERMISSIONS);
  }

  return result;
};

/**
 * Check if permission is feature-flag gated.
 * Used to determine whether permission should be evaluated or skipped.
 * During Gate 7A-0, all permissions are gated behind disabled flags.
 * 
 * @param {string} permissionPath - Permission path
 * @returns {Object} { gated: boolean, requiredFlags: Array<string> }
 */
export const getPermissionGating = (permissionPath) => {
  // Map permissions to their required feature flags
  const gatingMap = {
    'platform_broker.': ['BROKER_PLATFORM_RELATIONSHIP_ENABLED'],
    'broker_agency.': ['FIRST_CLASS_BROKER_MODEL_ENABLED'],
    'broker_direct.': ['FIRST_CLASS_BROKER_MODEL_ENABLED'],
    'broker_mga.': ['FIRST_CLASS_BROKER_MODEL_ENABLED', 'BROKER_MGA_RELATIONSHIP_ENABLED'],
    'quote_delegation.': ['QUOTE_CHANNEL_WRAPPER_ENABLED', 'QUOTE_DELEGATION_ENABLED'],
    'benefits_admin.': ['BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED']
  };

  for (const [prefix, flags] of Object.entries(gatingMap)) {
    if (permissionPath.startsWith(prefix)) {
      return { gated: true, requiredFlags: flags };
    }
  }

  return { gated: false, requiredFlags: [] };
};

/**
 * Validate permission against feature flags.
 * Returns false if any required flag is not enabled.
 * Used by assertPermission to gate permission evaluation.
 * 
 * @param {string} permissionPath - Permission path
 * @param {Object} featureFlags - Current feature flag state
 * @returns {boolean} Whether permission's required flags are all enabled
 */
export const isPermissionGateOpen = (permissionPath, featureFlags) => {
  const gating = getPermissionGating(permissionPath);

  if (!gating.gated) {
    return true; // No gating required
  }

  // All required flags must be true
  return gating.requiredFlags.every((flag) => featureFlags[flag] === true);
};