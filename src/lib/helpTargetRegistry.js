/**
 * HELP TARGET REGISTRY
 * Master client-side inventory. Uses spec-canonical field names.
 * target_type uses the full enum from spec section 2.3.
 */

export const HELP_TARGETS = [
  // ─── DASHBOARD ────────────────────────────────────────────────────────────────
  { target_code:"DASHBOARD.PAGE",             module_code:"DASHBOARD", page_code:"DASHBOARD", section_code:"",           target_type:"page",          target_label:"Dashboard Page",              target_path:"/" },
  { target_code:"DASHBOARD.KPI.ACTIVE_CASES", module_code:"DASHBOARD", page_code:"DASHBOARD", section_code:"KPI_BAR",    target_type:"card",          target_label:"Active Cases KPI",            target_path:"/" },
  { target_code:"DASHBOARD.KPI.ENROLLMENTS",  module_code:"DASHBOARD", page_code:"DASHBOARD", section_code:"KPI_BAR",    target_type:"card",          target_label:"Open Enrollments KPI",        target_path:"/" },
  { target_code:"DASHBOARD.KPI.RENEWALS",     module_code:"DASHBOARD", page_code:"DASHBOARD", section_code:"KPI_BAR",    target_type:"card",          target_label:"Upcoming Renewals KPI",       target_path:"/" },
  { target_code:"DASHBOARD.PIPELINE",         module_code:"DASHBOARD", page_code:"DASHBOARD", section_code:"PIPELINE",   target_type:"section",       target_label:"Case Pipeline View",          target_path:"/" },
  { target_code:"DASHBOARD.QUICK_ACTIONS",    module_code:"DASHBOARD", page_code:"DASHBOARD", section_code:"ACTIONS",    target_type:"action",        target_label:"Quick Actions Panel",         target_path:"/" },
  { target_code:"DASHBOARD.PRIORITIES",       module_code:"DASHBOARD", page_code:"DASHBOARD", section_code:"PRIORITIES", target_type:"section",       target_label:"Today's Priorities",          target_path:"/" },

  // ─── CASES ────────────────────────────────────────────────────────────────────
  { target_code:"CASES.PAGE",                 module_code:"CASES", page_code:"CASES", section_code:"",                   target_type:"page",          target_label:"Cases List Page",             target_path:"/cases" },
  { target_code:"CASES.STAGE_FILTER",         module_code:"CASES", page_code:"CASES", section_code:"FILTERS",            target_type:"filter",        target_label:"Stage Filter",                target_path:"/cases" },
  { target_code:"CASES.CASE_CARD",            module_code:"CASES", page_code:"CASES", section_code:"LIST",               target_type:"card",          target_label:"Case Card",                   target_path:"/cases" },
  { target_code:"CASES.NEW_CASE_BTN",         module_code:"CASES", page_code:"CASES", section_code:"HEADER",             target_type:"button",        target_label:"New Case Button",             target_path:"/cases" },
  { target_code:"CASES.DETAIL.PAGE",          module_code:"CASES", page_code:"CASE_DETAIL", section_code:"",             target_type:"page",          target_label:"Case Detail Page",            target_path:"/cases/:id" },
  { target_code:"CASES.DETAIL.STAGE",         module_code:"CASES", page_code:"CASE_DETAIL", section_code:"INFO",         target_type:"status",        target_label:"Case Stage",                  target_path:"/cases/:id" },
  { target_code:"CASES.DETAIL.CENSUS_TAB",    module_code:"CASES", page_code:"CASE_DETAIL", section_code:"TABS",         target_type:"tab",           target_label:"Census Tab",                  target_path:"/cases/:id" },
  { target_code:"CASES.DETAIL.QUOTES_TAB",    module_code:"CASES", page_code:"CASE_DETAIL", section_code:"TABS",         target_type:"tab",           target_label:"Quotes Tab",                  target_path:"/cases/:id" },
  { target_code:"CASES.DETAIL.TASKS_TAB",     module_code:"CASES", page_code:"CASE_DETAIL", section_code:"TABS",         target_type:"tab",           target_label:"Tasks Tab",                   target_path:"/cases/:id" },
  { target_code:"CASES.DETAIL.DOCS_TAB",      module_code:"CASES", page_code:"CASE_DETAIL", section_code:"TABS",         target_type:"tab",           target_label:"Documents Tab",               target_path:"/cases/:id" },
  { target_code:"CASES.DETAIL.ADVANCE_BTN",   module_code:"CASES", page_code:"CASE_DETAIL", section_code:"HEADER",       target_type:"button",        target_label:"Advance Stage Button",        target_path:"/cases/:id" },
  { target_code:"CASES.STAGES.DRAFT",         module_code:"CASES", page_code:"CASE_DETAIL", section_code:"LIFECYCLE",    target_type:"workflow_step", target_label:"Draft Stage",                 target_path:"/cases/:id" },
  { target_code:"CASES.STAGES.CENSUS",        module_code:"CASES", page_code:"CASE_DETAIL", section_code:"LIFECYCLE",    target_type:"workflow_step", target_label:"Census In Progress Stage",    target_path:"/cases/:id" },
  { target_code:"CASES.STAGES.QUOTING",       module_code:"CASES", page_code:"CASE_DETAIL", section_code:"LIFECYCLE",    target_type:"workflow_step", target_label:"Quoting Stage",               target_path:"/cases/:id" },
  { target_code:"CASES.STAGES.PROPOSAL",      module_code:"CASES", page_code:"CASE_DETAIL", section_code:"LIFECYCLE",    target_type:"workflow_step", target_label:"Proposal Ready Stage",        target_path:"/cases/:id" },
  { target_code:"CASES.STAGES.ENROLLMENT",    module_code:"CASES", page_code:"CASE_DETAIL", section_code:"LIFECYCLE",    target_type:"workflow_step", target_label:"Enrollment Open Stage",       target_path:"/cases/:id" },
  { target_code:"CASES.STAGES.ACTIVE",        module_code:"CASES", page_code:"CASE_DETAIL", section_code:"LIFECYCLE",    target_type:"workflow_step", target_label:"Active Stage",                target_path:"/cases/:id" },

  // ─── CENSUS ───────────────────────────────────────────────────────────────────
  { target_code:"CENSUS.PAGE",                module_code:"CENSUS", page_code:"CENSUS", section_code:"",                 target_type:"page",          target_label:"Census Page",                 target_path:"/census" },
  { target_code:"CENSUS.UPLOAD_BTN",          module_code:"CENSUS", page_code:"CENSUS", section_code:"HEADER",           target_type:"button",        target_label:"Upload Census Button",        target_path:"/census" },
  { target_code:"CENSUS.VALIDATION",          module_code:"CENSUS", page_code:"CENSUS", section_code:"VALIDATION",       target_type:"section",       target_label:"Census Validation Panel",     target_path:"/census" },
  { target_code:"CENSUS.MEMBER_TABLE",        module_code:"CENSUS", page_code:"CENSUS", section_code:"MEMBERS",          target_type:"grid",          target_label:"Census Member Table",         target_path:"/census" },
  { target_code:"CENSUS.GRADIENT_AI",         module_code:"CENSUS", page_code:"CENSUS", section_code:"RISK",             target_type:"section",       target_label:"GradientAI Risk Analysis",    target_path:"/census" },

  // ─── QUOTES ───────────────────────────────────────────────────────────────────
  { target_code:"QUOTES.PAGE",                module_code:"QUOTES", page_code:"QUOTES", section_code:"",                  target_type:"page",          target_label:"Quotes Page",                target_path:"/quotes" },
  { target_code:"QUOTES.SCENARIO_CARD",       module_code:"QUOTES", page_code:"QUOTES", section_code:"SCENARIOS",         target_type:"card",          target_label:"Quote Scenario Card",        target_path:"/quotes" },
  { target_code:"QUOTES.NEW_SCENARIO",        module_code:"QUOTES", page_code:"QUOTES", section_code:"HEADER",            target_type:"button",        target_label:"New Scenario Button",        target_path:"/quotes" },
  { target_code:"QUOTES.CONTRIBUTION",        module_code:"QUOTES", page_code:"QUOTES", section_code:"CONTRIBUTION",      target_type:"section",       target_label:"Contribution Strategy",      target_path:"/quotes" },
  { target_code:"QUOTES.KPI_TOTAL_PREMIUM",   module_code:"QUOTES", page_code:"QUOTES", section_code:"KPI",               target_type:"card",          target_label:"Total Monthly Premium KPI",  target_path:"/quotes" },

  // ─── PROPOSALS ────────────────────────────────────────────────────────────────
  { target_code:"PROPOSALS.PAGE",             module_code:"PROPOSALS", page_code:"PROPOSALS", section_code:"",            target_type:"page",          target_label:"Proposal Builder Page",      target_path:"/proposals" },
  { target_code:"PROPOSALS.STATUS.DRAFT",     module_code:"PROPOSALS", page_code:"PROPOSALS", section_code:"STATUS",      target_type:"status",        target_label:"Proposal Draft Status",      target_path:"/proposals" },
  { target_code:"PROPOSALS.STATUS.SENT",      module_code:"PROPOSALS", page_code:"PROPOSALS", section_code:"STATUS",      target_type:"status",        target_label:"Proposal Sent Status",       target_path:"/proposals" },
  { target_code:"PROPOSALS.STATUS.APPROVED",  module_code:"PROPOSALS", page_code:"PROPOSALS", section_code:"STATUS",      target_type:"status",        target_label:"Proposal Approved Status",   target_path:"/proposals" },
  { target_code:"PROPOSALS.SEND_BTN",         module_code:"PROPOSALS", page_code:"PROPOSALS", section_code:"ACTIONS",     target_type:"button",        target_label:"Send Proposal Button",       target_path:"/proposals" },

  // ─── ENROLLMENT ───────────────────────────────────────────────────────────────
  { target_code:"ENROLLMENT.PAGE",            module_code:"ENROLLMENT", page_code:"ENROLLMENT", section_code:"",          target_type:"page",          target_label:"Enrollment Page",            target_path:"/enrollment" },
  { target_code:"ENROLLMENT.WINDOW",          module_code:"ENROLLMENT", page_code:"ENROLLMENT", section_code:"WINDOWS",   target_type:"card",          target_label:"Enrollment Window Card",     target_path:"/enrollment" },
  { target_code:"ENROLLMENT.PARTICIPATION",   module_code:"ENROLLMENT", page_code:"ENROLLMENT", section_code:"METRICS",   target_type:"card",          target_label:"Participation Rate",         target_path:"/enrollment" },
  { target_code:"ENROLLMENT.MEMBER_TABLE",    module_code:"ENROLLMENT", page_code:"ENROLLMENT", section_code:"MEMBERS",   target_type:"grid",          target_label:"Enrollment Member Table",    target_path:"/enrollment" },
  { target_code:"ENROLLMENT.STATUS.OPEN",     module_code:"ENROLLMENT", page_code:"ENROLLMENT", section_code:"STATUS",    target_type:"status",        target_label:"Enrollment Open Status",     target_path:"/enrollment" },
  { target_code:"ENROLLMENT.STATUS.CLOSED",   module_code:"ENROLLMENT", page_code:"ENROLLMENT", section_code:"STATUS",    target_type:"status",        target_label:"Enrollment Closed Status",   target_path:"/enrollment" },

  // ─── RENEWALS ─────────────────────────────────────────────────────────────────
  { target_code:"RENEWALS.PAGE",              module_code:"RENEWALS", page_code:"RENEWALS", section_code:"",              target_type:"page",          target_label:"Renewals Page",              target_path:"/renewals" },
  { target_code:"RENEWALS.PIPELINE",          module_code:"RENEWALS", page_code:"RENEWALS", section_code:"PIPELINE",      target_type:"section",       target_label:"Renewal Pipeline",           target_path:"/renewals" },
  { target_code:"RENEWALS.DISRUPTION_SCORE",  module_code:"RENEWALS", page_code:"RENEWALS", section_code:"CARD",          target_type:"field",         target_label:"Disruption Score",           target_path:"/renewals" },
  { target_code:"RENEWALS.RATE_CHANGE",       module_code:"RENEWALS", page_code:"RENEWALS", section_code:"CARD",          target_type:"field",         target_label:"Rate Change %",              target_path:"/renewals" },

  // ─── PLANS ────────────────────────────────────────────────────────────────────
  { target_code:"PLANS.PAGE",                 module_code:"PLANS", page_code:"PLANS", section_code:"",                    target_type:"page",          target_label:"Plan Library Page",          target_path:"/plans" },
  { target_code:"PLANS.CARD",                 module_code:"PLANS", page_code:"PLANS", section_code:"LIST",                target_type:"card",          target_label:"Plan Card",                  target_path:"/plans" },
  { target_code:"PLANS.COMPARE",              module_code:"PLANS", page_code:"PLANS", section_code:"TOOLS",               target_type:"action",        target_label:"Plan Comparison Tool",       target_path:"/plans" },
  { target_code:"PLANS.NETWORK_TYPE",         module_code:"PLANS", page_code:"PLANS", section_code:"CARD",                target_type:"field",         target_label:"Network Type Field",         target_path:"/plans" },
  { target_code:"PLANS.DEDUCTIBLE",           module_code:"PLANS", page_code:"PLANS", section_code:"CARD",                target_type:"field",         target_label:"Deductible Field",           target_path:"/plans" },
  { target_code:"PLANS.OOP_MAX",              module_code:"PLANS", page_code:"PLANS", section_code:"CARD",                target_type:"field",         target_label:"Out-of-Pocket Maximum",      target_path:"/plans" },
  { target_code:"PLANS.HSA_ELIGIBLE",         module_code:"PLANS", page_code:"PLANS", section_code:"CARD",                target_type:"toggle",        target_label:"HSA Eligible Flag",          target_path:"/plans" },

  // ─── POLICYMATCH AI ───────────────────────────────────────────────────────────
  { target_code:"POLICYMATCH.PAGE",           module_code:"POLICYMATCH", page_code:"POLICYMATCH", section_code:"",        target_type:"page",          target_label:"PolicyMatchAI Page",         target_path:"/policymatch" },
  { target_code:"POLICYMATCH.RISK_TIER",      module_code:"POLICYMATCH", page_code:"POLICYMATCH", section_code:"RESULTS", target_type:"badge",         target_label:"Risk Tier",                  target_path:"/policymatch" },
  { target_code:"POLICYMATCH.RISK_SCORE",     module_code:"POLICYMATCH", page_code:"POLICYMATCH", section_code:"RESULTS", target_type:"field",         target_label:"Risk Score",                 target_path:"/policymatch" },
  { target_code:"POLICYMATCH.VALUE_SCORE",    module_code:"POLICYMATCH", page_code:"POLICYMATCH", section_code:"RESULTS", target_type:"field",         target_label:"Value Score",                target_path:"/policymatch" },

  // ─── EMPLOYERS ────────────────────────────────────────────────────────────────
  { target_code:"EMPLOYERS.PAGE",             module_code:"EMPLOYERS", page_code:"EMPLOYERS", section_code:"",            target_type:"page",          target_label:"Employer Groups Page",       target_path:"/employers" },
  { target_code:"EMPLOYERS.STATUS",           module_code:"EMPLOYERS", page_code:"EMPLOYERS", section_code:"CARD",        target_type:"status",        target_label:"Employer Status",            target_path:"/employers" },

  // ─── TASKS ────────────────────────────────────────────────────────────────────
  { target_code:"TASKS.PAGE",                 module_code:"TASKS", page_code:"TASKS", section_code:"",                    target_type:"page",          target_label:"Tasks Page",                 target_path:"/tasks" },
  { target_code:"TASKS.PRIORITY",             module_code:"TASKS", page_code:"TASKS", section_code:"CARD",                target_type:"badge",         target_label:"Task Priority",              target_path:"/tasks" },
  { target_code:"TASKS.STATUS",               module_code:"TASKS", page_code:"TASKS", section_code:"CARD",                target_type:"status",        target_label:"Task Status",                target_path:"/tasks" },

  // ─── CONTRIBUTIONS ────────────────────────────────────────────────────────────
  { target_code:"CONTRIBUTIONS.PAGE",         module_code:"CONTRIBUTIONS", page_code:"CONTRIBUTIONS", section_code:"",   target_type:"page",          target_label:"Contribution Modeling Page", target_path:"/contributions" },
  { target_code:"CONTRIBUTIONS.STRATEGY",     module_code:"CONTRIBUTIONS", page_code:"CONTRIBUTIONS", section_code:"",   target_type:"select_option", target_label:"Contribution Strategy",      target_path:"/contributions" },
  { target_code:"CONTRIBUTIONS.ACA_FLAG",     module_code:"CONTRIBUTIONS", page_code:"CONTRIBUTIONS", section_code:"",   target_type:"badge",         target_label:"ACA Affordability Flag",     target_path:"/contributions" },

  // ─── EXCEPTIONS ───────────────────────────────────────────────────────────────
  { target_code:"EXCEPTIONS.PAGE",            module_code:"EXCEPTIONS", page_code:"EXCEPTIONS", section_code:"",         target_type:"page",          target_label:"Exception Queue Page",       target_path:"/exceptions" },
  { target_code:"EXCEPTIONS.SEVERITY",        module_code:"EXCEPTIONS", page_code:"EXCEPTIONS", section_code:"CARD",     target_type:"badge",         target_label:"Exception Severity",         target_path:"/exceptions" },
  { target_code:"EXCEPTIONS.STATUS",          module_code:"EXCEPTIONS", page_code:"EXCEPTIONS", section_code:"CARD",     target_type:"status",        target_label:"Exception Status",           target_path:"/exceptions" },

  // ─── SETTINGS ─────────────────────────────────────────────────────────────────
  { target_code:"SETTINGS.PAGE",              module_code:"SETTINGS", page_code:"SETTINGS", section_code:"",             target_type:"page",          target_label:"Settings Page",              target_path:"/settings" },
  { target_code:"SETTINGS.ORGANIZATION",      module_code:"SETTINGS", page_code:"SETTINGS", section_code:"ORG",          target_type:"section",       target_label:"Organization Settings",      target_path:"/settings" },
  { target_code:"SETTINGS.INTEGRATIONS",      module_code:"SETTINGS", page_code:"SETTINGS", section_code:"INTEGRATIONS", target_type:"section",       target_label:"API Integrations",           target_path:"/settings" },
  { target_code:"SETTINGS.FEATURES",          module_code:"SETTINGS", page_code:"SETTINGS", section_code:"FEATURES",     target_type:"section",       target_label:"Feature Toggles",            target_path:"/settings" },
  { target_code:"SETTINGS.TEAM",              module_code:"SETTINGS", page_code:"SETTINGS", section_code:"TEAM",         target_type:"section",       target_label:"Team Management",            target_path:"/settings" },

  // ─── EMPLOYEE PORTAL ──────────────────────────────────────────────────────────
  { target_code:"EE_PORTAL.PAGE",             module_code:"PORTALS", page_code:"EE_PORTAL", section_code:"",             target_type:"page",          target_label:"Employee Portal Page",       target_path:"/employee-portal" },
  { target_code:"EE_PORTAL.PLAN_SELECTION",   module_code:"PORTALS", page_code:"EE_PORTAL", section_code:"ENROLLMENT",   target_type:"section",       target_label:"Plan Selection Step",        target_path:"/employee-portal" },
  { target_code:"EE_PORTAL.COVERAGE_TIER",    module_code:"PORTALS", page_code:"EE_PORTAL", section_code:"ENROLLMENT",   target_type:"radio_option",  target_label:"Coverage Tier Selection",    target_path:"/employee-portal" },
  { target_code:"EE_PORTAL.WAIVER",           module_code:"PORTALS", page_code:"EE_PORTAL", section_code:"ENROLLMENT",   target_type:"action",        target_label:"Waive Coverage Action",      target_path:"/employee-portal" },

  // ─── EMPLOYER PORTAL ──────────────────────────────────────────────────────────
  { target_code:"ER_PORTAL.PAGE",             module_code:"PORTALS", page_code:"ER_PORTAL", section_code:"",             target_type:"page",          target_label:"Employer Portal Page",       target_path:"/employer-portal" },
  { target_code:"ER_PORTAL.PROPOSAL_REVIEW",  module_code:"PORTALS", page_code:"ER_PORTAL", section_code:"PROPOSALS",    target_type:"section",       target_label:"Proposal Review Panel",      target_path:"/employer-portal" },
];

export const HELP_TARGET_MAP = HELP_TARGETS.reduce((acc, t) => {
  acc[t.target_code] = t;
  return acc;
}, {});

export const MODULES = [...new Set(HELP_TARGETS.map(t => t.module_code))];
export const getTargetsByPage = (page_code) => HELP_TARGETS.filter(t => t.page_code === page_code);
export const getTargetsByModule = (module_code) => HELP_TARGETS.filter(t => t.module_code === module_code);

// Coverage rule: target counts as covered when content_status === 'active' && is_active === true
export const isCovered = (content) => content?.content_status === 'active' && content?.is_active !== false;
export const isDraftOnly = (content) => content?.content_status === 'draft';