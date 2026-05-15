// runtime/commands/index.ts
// Command constant definitions

export const CENSUS_COMMANDS = {
  UPLOAD_CENSUS: "upload_census",
  VALIDATE_CENSUS: "validate_census",
  CREATE_CENSUS_VERSION: "create_census_version",
};

export const QUOTE_COMMANDS = {
  BUILD_QUOTE_REQUEST: "build_quote_request",
  RUN_QUOTE_SCENARIO: "run_quote_scenario",
  GENERATE_QUOTE_COMPARISON: "generate_quote_comparison",
};

export const PROPOSAL_COMMANDS = {
  CREATE_PROPOSAL_VERSION: "create_proposal_version",
  APPROVE_PROPOSAL_VERSION: "approve_proposal_version",
  RELEASE_PROPOSAL: "release_proposal",
};

export const ENROLLMENT_COMMANDS = {
  OPEN_ENROLLMENT: "open_enrollment",
  INVITE_ELIGIBLE_MEMBERS: "invite_eligible_members",
  FINALIZE_ENROLLMENT: "finalize_enrollment",
};

export const INSTALL_COMMANDS = {
  BUILD_CARRIER_PACK: "build_carrier_pack",
  BUILD_TPA_PACK: "build_tpa_pack",
  BUILD_PAYROLL_PACK: "build_payroll_pack",
  BUILD_BILLING_PACK: "build_billing_pack",
  RECONCILE_INSTALL: "reconcile_install",
};

export const RENEWAL_COMMANDS = {
  CLONE_RENEWAL_BASELINE: "clone_renewal_baseline",
  CALCULATE_RENEWAL_DELTA: "calculate_renewal_delta",
  GENERATE_RENEWAL_RECOMMENDATIONS: "generate_renewal_recommendations",
  LAUNCH_RENEWAL_WORKFLOW: "launch_renewal_workflow",
};

export const ALL_COMMANDS = {
  ...CENSUS_COMMANDS,
  ...QUOTE_COMMANDS,
  ...PROPOSAL_COMMANDS,
  ...ENROLLMENT_COMMANDS,
  ...INSTALL_COMMANDS,
  ...RENEWAL_COMMANDS,
};