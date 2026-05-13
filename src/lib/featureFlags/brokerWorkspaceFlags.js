/**
 * Broker Workspace Feature Flags — Phase 7A-2.8
 * 
 * Centralized feature flag configuration for broker workspace.
 * All flags default false and remain false during Phase 7A-2.8.
 * Parent dependency enforcement: BROKER_WORKSPACE_ENABLED must be true for any child flag to execute.
 */

/**
 * Get all broker workspace feature flags with full dependency metadata.
 */
export function getBrokerWorkspaceFlags() {
  return {
    // ===== PARENT GATE FLAG (required for entire broker workspace) =====
    BROKER_WORKSPACE_ENABLED: {
      value: false,
      description: 'Parent feature gate for entire broker workspace',
      parent: null,
      children: [
        'BROKER_DIRECT_BOOK_ENABLED',
        'BROKER_QUOTE_ACCESS_ENABLED',
        'BROKER_PROPOSAL_ACCESS_ENABLED',
        'BROKER_TASKS_ENABLED',
        'BROKER_DOCUMENTS_ENABLED',
        'BROKER_REPORTS_ENABLED',
        'BROKER_SETTINGS_ENABLED',
      ],
      gate: 'Gate 7A-2',
      phase: '7A-2.x (pending activation)',
    },

    // ===== DIRECT BOOK SUB-GATE (required for direct book business actions) =====
    BROKER_DIRECT_BOOK_ENABLED: {
      value: false,
      description: 'Enable direct book (standalone broker) channel functionality',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [
        'BROKER_EMPLOYER_CREATE_ENABLED',
        'BROKER_CASE_CREATE_ENABLED',
        'BROKER_CENSUS_UPLOAD_ENABLED',
      ],
      gate: 'Gate 7A-2',
      phase: '7A-2.x (pending activation)',
    },

    // ===== DIRECT BOOK BUSINESS ACTIONS (require parent flags + BROKER_DIRECT_BOOK_ENABLED) =====
    BROKER_EMPLOYER_CREATE_ENABLED: {
      value: false,
      description: 'Enable employer creation for direct book',
      parent: ['BROKER_WORKSPACE_ENABLED', 'BROKER_DIRECT_BOOK_ENABLED'],
      children: [],
      gate: 'Gate 7A-2',
      phase: '7A-2.7 (contract layer)',
    },

    BROKER_CASE_CREATE_ENABLED: {
      value: false,
      description: 'Enable case creation for direct book',
      parent: ['BROKER_WORKSPACE_ENABLED', 'BROKER_DIRECT_BOOK_ENABLED'],
      children: [],
      gate: 'Gate 7A-2',
      phase: '7A-2.7 (contract layer)',
    },

    BROKER_CENSUS_UPLOAD_ENABLED: {
      value: false,
      description: 'Enable census upload for direct book',
      parent: ['BROKER_WORKSPACE_ENABLED', 'BROKER_DIRECT_BOOK_ENABLED'],
      children: [],
      gate: 'Gate 7A-2',
      phase: '7A-2.7 (contract layer)',
    },

    // ===== READ-ONLY ACCESS FLAGS (require parent BROKER_WORKSPACE_ENABLED only) =====
    BROKER_QUOTE_ACCESS_ENABLED: {
      value: false,
      description: 'Enable read-only quote visibility (no QuoteWorkspaceWrapper)',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      restrictions: ['No quote creation', 'No quote editing', 'No quote submission'],
      gate: 'Gate 7A-2',
      phase: '7A-2.x (pending activation)',
    },

    BROKER_PROPOSAL_ACCESS_ENABLED: {
      value: false,
      description: 'Enable read-only proposal visibility (no creation/editing)',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      restrictions: ['No proposal creation', 'No proposal editing'],
      gate: 'Gate 7A-2',
      phase: '7A-2.x (pending activation)',
    },

    // ===== WORKSPACE SUPPORT FLAGS (require parent BROKER_WORKSPACE_ENABLED only) =====
    BROKER_TASKS_ENABLED: {
      value: false,
      description: 'Enable task management for broker',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      gate: 'Gate 7A-2',
      phase: '7A-2.7 (contract layer)',
    },

    BROKER_DOCUMENTS_ENABLED: {
      value: false,
      description: 'Enable document upload for broker',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      gate: 'Gate 7A-2',
      phase: '7A-2.7 (contract layer)',
    },

    BROKER_REPORTS_ENABLED: {
      value: false,
      description: 'Enable broker reporting and analytics',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      gate: 'Gate 7A-2',
      phase: '7A-2.x (pending activation)',
    },

    BROKER_SETTINGS_ENABLED: {
      value: false,
      description: 'Enable broker agency profile settings management',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      gate: 'Gate 7A-2',
      phase: '7A-2.7 (contract layer)',
    },

    // ===== DEFERRED/BLOCKING FLAGS (must remain false; explicitly deferred to future gates) =====
    BROKER_QUOTE_CREATION_ENABLED: {
      value: false,
      description: 'Enable quote creation (DEFERRED — do not enable)',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      restrictions: ['DEFERRED to Gate 7A-4 (Quote Connect 360 Channel-Aware Wrapper)'],
      gate: 'Gate 7A-4',
      phase: 'Not started (deferred)',
      must_remain: false,
    },

    BROKER_PROPOSAL_CREATION_ENABLED: {
      value: false,
      description: 'Enable proposal creation (DEFERRED — do not enable)',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      restrictions: ['DEFERRED to Gate 7A-4 (Quote Connect 360 Channel-Aware Wrapper)'],
      gate: 'Gate 7A-4',
      phase: 'Not started (deferred)',
      must_remain: false,
    },

    BROKER_BENEFITS_ADMIN_ENABLED: {
      value: false,
      description: 'Enable benefits admin setup (DEFERRED — do not enable)',
      parent: 'BROKER_WORKSPACE_ENABLED',
      children: [],
      restrictions: ['DEFERRED to Gate 7A-5/7A-6 (Benefits Admin Bridge & Foundation)'],
      gate: 'Gate 7A-5/7A-6',
      phase: 'Not started (deferred)',
      must_remain: false,
    },
  };
}

/**
 * Check if parent workspace flag is enabled.
 * All broker actions depend on this flag.
 */
export function isWorkspaceEnabled() {
  const flags = getBrokerWorkspaceFlags();
  return flags.BROKER_WORKSPACE_ENABLED.value === true;
}

/**
 * Check if direct book flag is enabled.
 * Direct book actions require both workspace and direct book flags.
 */
export function isDirectBookEnabled() {
  const flags = getBrokerWorkspaceFlags();
  return flags.BROKER_WORKSPACE_ENABLED.value === true && 
         flags.BROKER_DIRECT_BOOK_ENABLED.value === true;
}

/**
 * Check if specific action is enabled.
 * Validates parent dependencies.
 */
export function isActionEnabled(actionFlag) {
  const flags = getBrokerWorkspaceFlags();
  const flagConfig = flags[actionFlag];

  if (!flagConfig) {
    return false;
  }

  // Check if flag itself is enabled
  if (!flagConfig.value) {
    return false;
  }

  // Validate parent dependencies
  const parents = Array.isArray(flagConfig.parent) ? flagConfig.parent : [flagConfig.parent];
  
  for (const parentFlag of parents) {
    if (!parentFlag) continue; // No parent (root flag)
    
    const parentConfig = flags[parentFlag];
    if (!parentConfig || !parentConfig.value) {
      return false;
    }
  }

  return true;
}

/**
 * Validate feature flag dependency tree.
 * Ensures no circular dependencies and all parents are satisfied.
 */
export function validateFeatureFlagDependencies() {
  const flags = getBrokerWorkspaceFlags();
  const errors = [];
  const visited = new Set();

  function validateFlag(flagName, path = []) {
    if (visited.has(flagName)) {
      return; // Already validated
    }

    visited.add(flagName);
    const flagConfig = flags[flagName];

    if (!flagConfig) {
      errors.push(`Flag ${flagName} not found in registry`);
      return;
    }

    // Check for circular dependencies
    if (path.includes(flagName)) {
      errors.push(`Circular dependency detected: ${path.join(' -> ')} -> ${flagName}`);
      return;
    }

    // Validate parents exist and are not null when required
    const parents = Array.isArray(flagConfig.parent) ? flagConfig.parent : [flagConfig.parent];
    
    for (const parentFlag of parents) {
      if (parentFlag && !flags[parentFlag]) {
        errors.push(`Parent flag ${parentFlag} referenced by ${flagName} not found`);
      }
    }

    // Recursively validate children
    if (flagConfig.children) {
      for (const childFlag of flagConfig.children) {
        validateFlag(childFlag, [...path, flagName]);
      }
    }
  }

  // Start validation from root
  validateFlag('BROKER_WORKSPACE_ENABLED');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get feature flag status for display/debugging.
 */
export function getFeatureFlagStatus() {
  const flags = getBrokerWorkspaceFlags();
  const validation = validateFeatureFlagDependencies();

  return {
    validation,
    workspace_parent: {
      flag: 'BROKER_WORKSPACE_ENABLED',
      enabled: flags.BROKER_WORKSPACE_ENABLED.value,
      description: flags.BROKER_WORKSPACE_ENABLED.description,
    },
    direct_book_gate: {
      flag: 'BROKER_DIRECT_BOOK_ENABLED',
      enabled: flags.BROKER_DIRECT_BOOK_ENABLED.value,
      description: flags.BROKER_DIRECT_BOOK_ENABLED.description,
      parent_enabled: flags.BROKER_WORKSPACE_ENABLED.value,
      can_execute: isDirectBookEnabled(),
    },
    business_actions: {
      employer_create: {
        flag: 'BROKER_EMPLOYER_CREATE_ENABLED',
        enabled: flags.BROKER_EMPLOYER_CREATE_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_EMPLOYER_CREATE_ENABLED'),
        parents: ['BROKER_WORKSPACE_ENABLED', 'BROKER_DIRECT_BOOK_ENABLED'],
      },
      case_create: {
        flag: 'BROKER_CASE_CREATE_ENABLED',
        enabled: flags.BROKER_CASE_CREATE_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_CASE_CREATE_ENABLED'),
        parents: ['BROKER_WORKSPACE_ENABLED', 'BROKER_DIRECT_BOOK_ENABLED'],
      },
      census_upload: {
        flag: 'BROKER_CENSUS_UPLOAD_ENABLED',
        enabled: flags.BROKER_CENSUS_UPLOAD_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_CENSUS_UPLOAD_ENABLED'),
        parents: ['BROKER_WORKSPACE_ENABLED', 'BROKER_DIRECT_BOOK_ENABLED'],
      },
      tasks: {
        flag: 'BROKER_TASKS_ENABLED',
        enabled: flags.BROKER_TASKS_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_TASKS_ENABLED'),
        parents: ['BROKER_WORKSPACE_ENABLED'],
      },
      documents: {
        flag: 'BROKER_DOCUMENTS_ENABLED',
        enabled: flags.BROKER_DOCUMENTS_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_DOCUMENTS_ENABLED'),
        parents: ['BROKER_WORKSPACE_ENABLED'],
      },
      settings: {
        flag: 'BROKER_SETTINGS_ENABLED',
        enabled: flags.BROKER_SETTINGS_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_SETTINGS_ENABLED'),
        parents: ['BROKER_WORKSPACE_ENABLED'],
      },
    },
    read_only_access: {
      quote_access: {
        flag: 'BROKER_QUOTE_ACCESS_ENABLED',
        enabled: flags.BROKER_QUOTE_ACCESS_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_QUOTE_ACCESS_ENABLED'),
        restrictions: flags.BROKER_QUOTE_ACCESS_ENABLED.restrictions,
      },
      proposal_access: {
        flag: 'BROKER_PROPOSAL_ACCESS_ENABLED',
        enabled: flags.BROKER_PROPOSAL_ACCESS_ENABLED.value,
        parents_satisfied: isActionEnabled('BROKER_PROPOSAL_ACCESS_ENABLED'),
        restrictions: flags.BROKER_PROPOSAL_ACCESS_ENABLED.restrictions,
      },
    },
    deferred_blocking: {
      quote_creation: {
        flag: 'BROKER_QUOTE_CREATION_ENABLED',
        enabled: flags.BROKER_QUOTE_CREATION_ENABLED.value,
        gate: flags.BROKER_QUOTE_CREATION_ENABLED.gate,
        must_remain_false: flags.BROKER_QUOTE_CREATION_ENABLED.must_remain,
      },
      proposal_creation: {
        flag: 'BROKER_PROPOSAL_CREATION_ENABLED',
        enabled: flags.BROKER_PROPOSAL_CREATION_ENABLED.value,
        gate: flags.BROKER_PROPOSAL_CREATION_ENABLED.gate,
        must_remain_false: flags.BROKER_PROPOSAL_CREATION_ENABLED.must_remain,
      },
      benefits_admin: {
        flag: 'BROKER_BENEFITS_ADMIN_ENABLED',
        enabled: flags.BROKER_BENEFITS_ADMIN_ENABLED.value,
        gate: flags.BROKER_BENEFITS_ADMIN_ENABLED.gate,
        must_remain_false: flags.BROKER_BENEFITS_ADMIN_ENABLED.must_remain,
      },
    },
  };
}