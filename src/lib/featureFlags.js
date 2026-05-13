/**
 * Feature Flag Registry — Gate 7A-0 First-Class Broker Model
 * 
 * All flags default to false (fail-closed).
 * No flags are enabled during Gate 7A-0 implementation.
 * Child flags require parent flags to be enabled.
 * 
 * Document: docs/GATE_7A_0_FEATURE_FLAG_REGISTRY.json
 */

// Gate 7A-0 Specific Flags
export const FIRST_CLASS_BROKER_MODEL_ENABLED = false;
export const DISTRIBUTION_CHANNEL_CONTEXT_ENABLED = false;
export const BROKER_PLATFORM_RELATIONSHIP_ENABLED = false;
export const BROKER_MGA_RELATIONSHIP_ENABLED = false;
export const BROKER_SCOPE_ACCESS_GRANT_ENABLED = false;

// Program-Level Flags
export const BROKER_SIGNUP_ENABLED = false;
export const BROKER_ONBOARDING_ENABLED = false;
export const BROKER_WORKSPACE_ENABLED = false;
export const QUOTE_CHANNEL_WRAPPER_ENABLED = false;
export const QUOTE_DELEGATION_ENABLED = false;
export const BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED = false;
export const BENEFITS_ADMIN_CASE_SHELL_ENABLED = false;

/**
 * Feature Flag Dependency Resolver
 * Validates that child flags cannot be true unless parent flags are enabled.
 */
export const featureFlagDependencies = {
  BROKER_SIGNUP_ENABLED: [
    'FIRST_CLASS_BROKER_MODEL_ENABLED',
    'BROKER_PLATFORM_RELATIONSHIP_ENABLED'
  ],
  BROKER_ONBOARDING_ENABLED: [
    'BROKER_SIGNUP_ENABLED'
  ],
  BROKER_WORKSPACE_ENABLED: [
    'FIRST_CLASS_BROKER_MODEL_ENABLED',
    'DISTRIBUTION_CHANNEL_CONTEXT_ENABLED'
  ],
  BROKER_MGA_RELATIONSHIP_ENABLED: [
    'FIRST_CLASS_BROKER_MODEL_ENABLED',
    'DISTRIBUTION_CHANNEL_CONTEXT_ENABLED'
  ],
  QUOTE_CHANNEL_WRAPPER_ENABLED: [
    'FIRST_CLASS_BROKER_MODEL_ENABLED',
    'DISTRIBUTION_CHANNEL_CONTEXT_ENABLED'
  ],
  QUOTE_DELEGATION_ENABLED: [
    'QUOTE_CHANNEL_WRAPPER_ENABLED'
  ],
  BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED: [
    'QUOTE_CHANNEL_WRAPPER_ENABLED',
    'DISTRIBUTION_CHANNEL_CONTEXT_ENABLED'
  ],
  BENEFITS_ADMIN_CASE_SHELL_ENABLED: [] // Remains permanently disabled during Gate 7A-0
};

/**
 * Fail-Closed Behavior
 * All protected backend actions require their corresponding flag to be enabled.
 * If disabled, all operations return 403 Forbidden or fail-closed response.
 */
export const isFlagEnabled = (flagName) => {
  const flagValue = eval(flagName); // Runtime flag resolution
  return flagValue === true;
};

/**
 * Validate flag dependencies
 * Returns false if a flag is enabled but its parent dependencies are not.
 */
export const validateFlagDependencies = (flags) => {
  for (const [flag, dependencies] of Object.entries(featureFlagDependencies)) {
    if (flags[flag] === true) {
      for (const parentFlag of dependencies) {
        if (flags[parentFlag] !== true) {
          console.error(
            `Feature flag dependency violation: ${flag} requires ${parentFlag} to be enabled`
          );
          return false;
        }
      }
    }
  }
  return true;
};

/**
 * Current Flag Status
 * Returns all flags with their current values (all false during Gate 7A-0).
 */
export const getCurrentFlagStatus = () => ({
  // Gate 7A-0 Specific Flags
  FIRST_CLASS_BROKER_MODEL_ENABLED,
  DISTRIBUTION_CHANNEL_CONTEXT_ENABLED,
  BROKER_PLATFORM_RELATIONSHIP_ENABLED,
  BROKER_MGA_RELATIONSHIP_ENABLED,
  BROKER_SCOPE_ACCESS_GRANT_ENABLED,
  // Program-Level Flags
  BROKER_SIGNUP_ENABLED,
  BROKER_ONBOARDING_ENABLED,
  BROKER_WORKSPACE_ENABLED,
  QUOTE_CHANNEL_WRAPPER_ENABLED,
  QUOTE_DELEGATION_ENABLED,
  BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED,
  BENEFITS_ADMIN_CASE_SHELL_ENABLED
});