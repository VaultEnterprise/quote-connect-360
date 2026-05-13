/**
 * Broker Workspace Feature Flags — Phase 7A-2.7
 * 
 * Centralized feature flag configuration for broker workspace.
 * All flags default false and remain false during Phase 7A-2.7.
 * Parent dependency: BROKER_WORKSPACE_ENABLED must be true for any action to execute.
 */

/**
 * Get all broker workspace feature flags.
 */
export function getBrokerWorkspaceFlags() {
  return {
    // Parent workspace flag (required for all broker actions)
    BROKER_WORKSPACE_ENABLED: false,

    // Individual action flags (all require parent flag true)
    BROKER_EMPLOYER_CREATE_ENABLED: false,
    BROKER_CASE_CREATE_ENABLED: false,
    BROKER_CENSUS_UPLOAD_ENABLED: false,
    BROKER_TASKS_ENABLED: false,
    BROKER_DOCUMENTS_ENABLED: false,
    BROKER_SETTINGS_ENABLED: false,

    // Feature-specific behavior flags
    BROKER_QUOTE_CREATION_ENABLED: false, // Deferred to Gate 7A-4
    BROKER_PROPOSAL_CREATION_ENABLED: false, // Deferred to Gate 7A-4
    BROKER_BENEFITS_ADMIN_ENABLED: false, // Deferred to Gate 7A-5/7A-6
  };
}

/**
 * Check if parent workspace flag is enabled.
 * All broker actions depend on this flag.
 */
export function isWorkspaceEnabled() {
  const flags = getBrokerWorkspaceFlags();
  return flags.BROKER_WORKSPACE_ENABLED === true;
}

/**
 * Check if specific action is enabled.
 * Requires both parent workspace flag and action-specific flag.
 */
export function isActionEnabled(actionFlag) {
  const flags = getBrokerWorkspaceFlags();

  // Parent dependency: workspace must be enabled
  if (!flags.BROKER_WORKSPACE_ENABLED) {
    return false;
  }

  // Action-specific flag must be enabled
  return flags[actionFlag] === true;
}

/**
 * Get feature flag status for display/debugging.
 */
export function getFeatureFlagStatus() {
  const flags = getBrokerWorkspaceFlags();

  return {
    workspace: {
      enabled: flags.BROKER_WORKSPACE_ENABLED,
      description: 'Parent feature gate for entire broker workspace',
    },
    actions: {
      employer_create: {
        enabled: flags.BROKER_EMPLOYER_CREATE_ENABLED,
        parent_enabled: flags.BROKER_WORKSPACE_ENABLED,
        can_execute: isActionEnabled('BROKER_EMPLOYER_CREATE_ENABLED'),
      },
      case_create: {
        enabled: flags.BROKER_CASE_CREATE_ENABLED,
        parent_enabled: flags.BROKER_WORKSPACE_ENABLED,
        can_execute: isActionEnabled('BROKER_CASE_CREATE_ENABLED'),
      },
      census_upload: {
        enabled: flags.BROKER_CENSUS_UPLOAD_ENABLED,
        parent_enabled: flags.BROKER_WORKSPACE_ENABLED,
        can_execute: isActionEnabled('BROKER_CENSUS_UPLOAD_ENABLED'),
      },
      tasks: {
        enabled: flags.BROKER_TASKS_ENABLED,
        parent_enabled: flags.BROKER_WORKSPACE_ENABLED,
        can_execute: isActionEnabled('BROKER_TASKS_ENABLED'),
      },
      documents: {
        enabled: flags.BROKER_DOCUMENTS_ENABLED,
        parent_enabled: flags.BROKER_WORKSPACE_ENABLED,
        can_execute: isActionEnabled('BROKER_DOCUMENTS_ENABLED'),
      },
      settings: {
        enabled: flags.BROKER_SETTINGS_ENABLED,
        parent_enabled: flags.BROKER_WORKSPACE_ENABLED,
        can_execute: isActionEnabled('BROKER_SETTINGS_ENABLED'),
      },
    },
    deferred: {
      quote_creation: {
        enabled: flags.BROKER_QUOTE_CREATION_ENABLED,
        gate: 'Gate 7A-4 (Quote Connect 360 Channel-Aware Wrapper)',
      },
      proposal_creation: {
        enabled: flags.BROKER_PROPOSAL_CREATION_ENABLED,
        gate: 'Gate 7A-4 (Quote Connect 360 Channel-Aware Wrapper)',
      },
      benefits_admin: {
        enabled: flags.BROKER_BENEFITS_ADMIN_ENABLED,
        gate: 'Gate 7A-5/7A-6 (Benefits Admin Bridge)',
      },
    },
  };
}