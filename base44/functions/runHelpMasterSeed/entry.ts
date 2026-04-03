import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// ─── SEED DATA ───────────────────────────────────────────────────────────────

const MODULES = [
  { module_code: "MOD-ADM",      module_name: "Administration",      module_description: "Administrative tools and governance functions",              route_base: "/admin",     icon_name: "settings",    sort_order: 10, is_active: true, is_system_defined: true },
  { module_code: "MOD-HELP",     module_name: "Help Center",         module_description: "End-user help manual, contextual help, and HelpAI",          route_base: "/help",      icon_name: "help-circle", sort_order: 20, is_active: true, is_system_defined: true },
  { module_code: "MOD-EMP",      module_name: "Employee Management", module_description: "Employee and subscriber profile, maintenance, and actions",   route_base: "/employees", icon_name: "users",       sort_order: 30, is_active: true, is_system_defined: true },
  { module_code: "MOD-CLAIMS",   module_name: "Claims",              module_description: "Claims processing, review, status, and reporting",            route_base: "/claims",    icon_name: "file-text",   sort_order: 40, is_active: true, is_system_defined: true },
  { module_code: "MOD-RENEWAL",  module_name: "Renewal",             module_description: "Renewal workflows, review, approval, and lifecycle tracking", route_base: "/renewals",  icon_name: "refresh-cw",  sort_order: 50, is_active: true, is_system_defined: true },
  { module_code: "MOD-SETTINGS", module_name: "Settings",            module_description: "Configuration, controls, integrations, and user preferences", route_base: "/settings",  icon_name: "sliders",     sort_order: 60, is_active: true, is_system_defined: true },
];

const PAGES = [
  { page_code: "PG-ADM-HELP-DASHBOARD",        module_code: "MOD-ADM",      page_name: "Help Dashboard",        page_label: "Help Dashboard",        route_path: "/admin/help/dashboard",             page_type: "dashboard",       sort_order: 10, is_help_enabled: true, is_active: true },
  { page_code: "PG-ADM-HELP-TARGET-REGISTRY",  module_code: "MOD-ADM",      page_name: "Help Target Registry",  page_label: "Help Target Registry",  route_path: "/admin/help/targets",               page_type: "admin_page",      sort_order: 20, is_help_enabled: true, is_active: true },
  { page_code: "PG-ADM-HELP-CONTENT-EDITOR",   module_code: "MOD-ADM",      page_name: "Help Content Editor",   page_label: "Help Content Editor",   route_path: "/admin/help/content/:helpTargetId", page_type: "admin_page",      sort_order: 30, is_help_enabled: true, is_active: true },
  { page_code: "PG-ADM-HELP-MANUAL-MANAGER",   module_code: "MOD-ADM",      page_name: "Help Manual Manager",   page_label: "Help Manual Manager",   route_path: "/admin/help/manual",                page_type: "admin_page",      sort_order: 40, is_help_enabled: true, is_active: true },
  { page_code: "PG-ADM-HELP-COVERAGE",         module_code: "MOD-ADM",      page_name: "Help Coverage Report",  page_label: "Help Coverage Report",  route_path: "/admin/help/coverage",              page_type: "report_page",     sort_order: 50, is_help_enabled: true, is_active: true },
  { page_code: "PG-ADM-HELP-AI-REVIEW",        module_code: "MOD-ADM",      page_name: "HelpAI Review Queue",   page_label: "HelpAI Review Queue",   route_path: "/admin/help/ai-review",             page_type: "admin_page",      sort_order: 60, is_help_enabled: true, is_active: true },
  { page_code: "PG-ADM-HELP-SEARCH-ANALYTICS", module_code: "MOD-ADM",      page_name: "Help Search Analytics", page_label: "Help Search Analytics", route_path: "/admin/help/analytics",             page_type: "dashboard",       sort_order: 70, is_help_enabled: true, is_active: true },
  { page_code: "PG-USR-HELP-MANUAL",           module_code: "MOD-HELP",     page_name: "Help Manual",           page_label: "Help Manual",           route_path: "/help/manual",                      page_type: "manual_page",     sort_order: 10, is_help_enabled: true, is_active: true },
  { page_code: "PG-EMP-DETAIL",                module_code: "MOD-EMP",      page_name: "Employee Detail",       page_label: "Employee Detail",       route_path: "/employees/:employeeId",            page_type: "standard_screen", sort_order: 10, is_help_enabled: true, is_active: true },
  { page_code: "PG-CLAIMS-LIST",               module_code: "MOD-CLAIMS",   page_name: "Claims List",           page_label: "Claims List",           route_path: "/claims",                           page_type: "standard_screen", sort_order: 10, is_help_enabled: true, is_active: true },
  { page_code: "PG-RENEWAL-CASE-DETAIL",       module_code: "MOD-RENEWAL",  page_name: "Renewal Case Detail",   page_label: "Renewal Case Detail",   route_path: "/renewals/:renewalCaseId",          page_type: "standard_screen", sort_order: 10, is_help_enabled: true, is_active: true },
  { page_code: "PG-SETTINGS-NOTIFICATIONS",    module_code: "MOD-SETTINGS", page_name: "Notification Settings", page_label: "Notification Settings", route_path: "/settings/notifications",           page_type: "settings_page",   sort_order: 10, is_help_enabled: true, is_active: true },
];

const SECTIONS = [
  { section_code: "SEC-ADM-HELP-DASHBOARD-KPIS",           page_code: "PG-ADM-HELP-DASHBOARD",       parent_section_code: null, section_name: "KPI Cards",             section_label: "KPI Cards",             section_type: "summary_section", section_path: "/admin/help/dashboard/kpis",           sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-DASHBOARD-MODULE-COVERAGE", page_code: "PG-ADM-HELP-DASHBOARD",       parent_section_code: null, section_name: "Coverage by Module",    section_label: "Coverage by Module",    section_type: "grid",            section_path: "/admin/help/dashboard/module-coverage", sort_order: 20, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-TARGETS-FILTERS",           page_code: "PG-ADM-HELP-TARGET-REGISTRY", parent_section_code: null, section_name: "Target Filters",        section_label: "Target Filters",        section_type: "filter_section",  section_path: "/admin/help/targets/filters",          sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-TARGETS-GRID",              page_code: "PG-ADM-HELP-TARGET-REGISTRY", parent_section_code: null, section_name: "Target Registry Grid",  section_label: "Target Registry Grid",  section_type: "grid",            section_path: "/admin/help/targets/grid",             sort_order: 20, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-CONTENT-TARGET-SUMMARY",    page_code: "PG-ADM-HELP-CONTENT-EDITOR",  parent_section_code: null, section_name: "Target Summary",        section_label: "Target Summary",        section_type: "summary_section", section_path: "/admin/help/content/target-summary",   sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-CONTENT-FORM",              page_code: "PG-ADM-HELP-CONTENT-EDITOR",  parent_section_code: null, section_name: "Help Content Form",     section_label: "Help Content Form",     section_type: "form_section",    section_path: "/admin/help/content/form",             sort_order: 20, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-CONTENT-PREVIEW",           page_code: "PG-ADM-HELP-CONTENT-EDITOR",  parent_section_code: null, section_name: "Preview Panel",         section_label: "Preview Panel",         section_type: "tab",             section_path: "/admin/help/content/preview",          sort_order: 30, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-CONTENT-VERSIONS",          page_code: "PG-ADM-HELP-CONTENT-EDITOR",  parent_section_code: null, section_name: "Version History",       section_label: "Version History",       section_type: "grid",            section_path: "/admin/help/content/versions",         sort_order: 40, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-MANUAL-TREE",               page_code: "PG-ADM-HELP-MANUAL-MANAGER",  parent_section_code: null, section_name: "Topic Tree",            section_label: "Topic Tree",            section_type: "sidebar_section", section_path: "/admin/help/manual/tree",              sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-ADM-HELP-MANUAL-FORM",               page_code: "PG-ADM-HELP-MANUAL-MANAGER",  parent_section_code: null, section_name: "Topic Editor",          section_label: "Topic Editor",          section_type: "form_section",    section_path: "/admin/help/manual/form",              sort_order: 20, is_help_enabled: true, is_active: true },
  { section_code: "SEC-USR-HELP-MANUAL-SEARCH",             page_code: "PG-USR-HELP-MANUAL",          parent_section_code: null, section_name: "Help Search",           section_label: "Help Search",           section_type: "filter_section",  section_path: "/help/manual/search",                  sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-USR-HELP-MANUAL-CONTENT",            page_code: "PG-USR-HELP-MANUAL",          parent_section_code: null, section_name: "Help Topic Content",    section_label: "Help Topic Content",    section_type: "card",            section_path: "/help/manual/content",                 sort_order: 20, is_help_enabled: true, is_active: true },
  { section_code: "SEC-EMP-DETAIL-HEADER",                  page_code: "PG-EMP-DETAIL",               parent_section_code: null, section_name: "Employee Header",       section_label: "Employee Header",       section_type: "toolbar",         section_path: "/employees/:employeeId/header",        sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-EMP-DETAIL-PERSONAL",                page_code: "PG-EMP-DETAIL",               parent_section_code: null, section_name: "Personal Information",  section_label: "Personal Information",  section_type: "form_section",    section_path: "/employees/:employeeId/personal",      sort_order: 20, is_help_enabled: true, is_active: true },
  { section_code: "SEC-CLAIMS-LIST-FILTERS",                page_code: "PG-CLAIMS-LIST",              parent_section_code: null, section_name: "Claim Filters",         section_label: "Claim Filters",         section_type: "filter_section",  section_path: "/claims/filters",                      sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-CLAIMS-LIST-GRID",                   page_code: "PG-CLAIMS-LIST",              parent_section_code: null, section_name: "Claims Grid",           section_label: "Claims Grid",           section_type: "grid",            section_path: "/claims/grid",                         sort_order: 20, is_help_enabled: true, is_active: true },
  { section_code: "SEC-RENEWAL-CASE-APPROVAL",              page_code: "PG-RENEWAL-CASE-DETAIL",      parent_section_code: null, section_name: "Approval Section",      section_label: "Approval Section",      section_type: "form_section",    section_path: "/renewals/:renewalCaseId/approval",    sort_order: 10, is_help_enabled: true, is_active: true },
  { section_code: "SEC-SETTINGS-NOTIFICATIONS-GENERAL",     page_code: "PG-SETTINGS-NOTIFICATIONS",   parent_section_code: null, section_name: "General Notifications", section_label: "General Notifications", section_type: "form_section",    section_path: "/settings/notifications/general",      sort_order: 10, is_help_enabled: true, is_active: true },
];

// columns: [target_code, page_code, section_code, type, name, label, component_key,
//           field_name, control_name, action_code, workflow_code, grid_code,
//           grid_column_code, path, keywords, role_scope, sort, help_enabled, required_coverage]
const INVENTORY = [
  ["CRD-ADM-HELP-DASHBOARD-KPI-TOTAL-TARGETS",         "PG-ADM-HELP-DASHBOARD",       "SEC-ADM-HELP-DASHBOARD-KPIS",          "widget", "Total Help Targets Card",       "Total Help Targets",       "help.dashboard.kpi.totalTargets",          null,              "cardTotalTargets",    null,               null,                  null,       null, "/admin/help/dashboard/kpis/totalTargets",           "total targets, registry, help coverage",  ["super_admin","admin","help_admin"],                                         10,  true, true],
  ["BTN-ADM-HELP-DASHBOARD-VIEW-COVERAGE",             "PG-ADM-HELP-DASHBOARD",       "SEC-ADM-HELP-DASHBOARD-KPIS",          "button", "View Coverage Report",          "View Coverage Report",     "help.dashboard.actions.viewCoverage",      null,              "btnViewCoverage",     "viewCoverage",     null,                  null,       null, "/admin/help/dashboard/actions/viewCoverage",        "coverage report, navigate, report",       ["super_admin","admin","help_admin"],                                         20,  true, true],
  ["FLD-ADM-HELP-TARGETS-FILTER-MODULE",               "PG-ADM-HELP-TARGET-REGISTRY", "SEC-ADM-HELP-TARGETS-FILTERS",         "field",  "Module Filter",                 "Module",                   "help.targets.filters.module",              "moduleFilter",    "selectModule",        null,               null,                  null,       null, "/admin/help/targets/filters/module",                "module filter, target filter",            ["super_admin","admin","help_admin"],                                         10,  true, true],
  ["GRID-ADM-HELP-TARGETS-REGISTRY",                   "PG-ADM-HELP-TARGET-REGISTRY", "SEC-ADM-HELP-TARGETS-GRID",            "grid",   "Registry Grid",                 "Target Registry Grid",     "help.targets.registry.grid",               null,              "gridTargetRegistry",  null,               null,                  "TREG",     null, "/admin/help/targets/grid",                          "target registry, help targets",           ["super_admin","admin","help_admin"],                                         20,  true, true],
  ["FLD-ADM-HELP-CONTENT-HELP-TITLE",                  "PG-ADM-HELP-CONTENT-EDITOR",  "SEC-ADM-HELP-CONTENT-FORM",            "field",  "Help Title",                    "Help Title",               "help.content.form.helpTitle",              "help_title",      "txtHelpTitle",        null,               null,                  null,       null, "/admin/help/content/form/helpTitle",                "help title, heading",                     ["super_admin","admin","help_admin","content_editor"],                        10,  true, true],
  ["FLD-ADM-HELP-CONTENT-DETAILED-HELP",               "PG-ADM-HELP-CONTENT-EDITOR",  "SEC-ADM-HELP-CONTENT-FORM",            "field",  "Detailed Help Text",            "Detailed Help",            "help.content.form.detailedHelp",           "detailed_help_text","txtDetailedHelp",   null,               null,                  null,       null, "/admin/help/content/form/detailedHelp",             "detailed help, main help text",           ["super_admin","admin","help_admin","content_editor"],                        20,  true, true],
  ["BTN-ADM-HELP-CONTENT-SAVE-DRAFT",                  "PG-ADM-HELP-CONTENT-EDITOR",  "SEC-ADM-HELP-CONTENT-FORM",            "button", "Save Draft",                    "Save Draft",               "help.content.form.saveDraft",              null,              "btnSaveDraft",        "saveDraft",        null,                  null,       null, "/admin/help/content/form/saveDraft",                "save draft, draft",                       ["super_admin","admin","help_admin","content_editor"],                        30,  true, true],
  ["FLD-USR-HELP-MANUAL-SEARCH",                       "PG-USR-HELP-MANUAL",          "SEC-USR-HELP-MANUAL-SEARCH",           "field",  "Help Search",                   "Search Help",              "help.manual.search.input",                 "searchText",      "txtHelpSearch",       null,               null,                  null,       null, "/help/manual/search/input",                         "help search, manual search",              ["super_admin","admin","help_admin","client_admin","client_user","read_only"], 10,  true, true],
  ["BTN-USR-HELP-MANUAL-ASK-AI",                       "PG-USR-HELP-MANUAL",          "SEC-USR-HELP-MANUAL-CONTENT",          "button", "Ask HelpAI Button",             "Ask HelpAI",               "help.manual.content.askAi",                null,              "btnAskHelpAi",        "askHelpAi",        null,                  null,       null, "/help/manual/content/askAi",                        "ask ai, HelpAI",                          ["super_admin","admin","help_admin","client_admin","client_user","read_only"], 20,  true, true],
  ["BTN-EMP-DETAIL-HEADER-SAVE",                       "PG-EMP-DETAIL",               "SEC-EMP-DETAIL-HEADER",                "button", "Save Employee",                 "Save",                     "employee.detail.header.save",              null,              "btnSaveEmployee",     "saveEmployee",     null,                  null,       null, "/employees/:employeeId/header/save",                "save, employee save",                     ["super_admin","admin","client_admin"],                                       10,  true, true],
  ["FLD-EMP-DETAIL-PERSONAL-FIRST-NAME",               "PG-EMP-DETAIL",               "SEC-EMP-DETAIL-PERSONAL",              "field",  "First Name",                    "First Name",               "employee.personal.firstName",              "first_name",      "txtFirstName",        null,               null,                  null,       null, "/employees/:employeeId/personal/firstName",         "first name, given name",                  ["super_admin","admin","client_admin"],                                       20,  true, true],
  ["FLD-CLAIMS-LIST-FILTER-STATUS",                    "PG-CLAIMS-LIST",              "SEC-CLAIMS-LIST-FILTERS",              "field",  "Claim Status Filter",           "Claim Status",             "claims.list.filters.status",               "claim_status",    "selectClaimStatus",   null,               null,                  null,       null, "/claims/filters/status",                            "claim status filter",                     ["super_admin","admin","client_admin","client_user"],                         10,  true, true],
  ["GRID-CLAIMS-LIST-GRID",                            "PG-CLAIMS-LIST",              "SEC-CLAIMS-LIST-GRID",                 "grid",   "Claims Grid",                   "Claims Grid",              "claims.list.grid",                         null,              "gridClaims",          null,               null,                  "CLMGRID",  null, "/claims/grid",                                      "claims grid, claims list",                ["super_admin","admin","client_admin","client_user"],                         20,  true, true],
  ["BTN-RENEWAL-CASE-APPROVAL-SUBMIT",                 "PG-RENEWAL-CASE-DETAIL",      "SEC-RENEWAL-CASE-APPROVAL",            "button", "Submit for Approval",           "Submit for Approval",      "renewal.case.approval.submit",             null,              "btnSubmitApproval",   "submitForApproval","WF-RENEWAL-APPROVAL", null,       null, "/renewals/:renewalCaseId/approval/submit",          "submit for approval",                     ["super_admin","admin","client_admin"],                                       10,  true, true],
  ["FLD-SETTINGS-NOTIFICATIONS-GENERAL-ENABLE-EMAIL",  "PG-SETTINGS-NOTIFICATIONS",   "SEC-SETTINGS-NOTIFICATIONS-GENERAL",   "toggle", "Enable Email Notifications",    "Enable Email Notifications","settings.notifications.general.emailEnabled","email_enabled", "toggleEmailEnabled",  null,               null,                  null,       null, "/settings/notifications/general/emailEnabled",      "email notifications, enable email",       ["super_admin","admin"],                                                      10,  true, true],
  ["CMP-GLOBAL-CONTEXT-HELP-MODAL",                    "PG-USR-HELP-MANUAL",          null,                                   "modal",  "Contextual Help Modal",         "Contextual Help Modal",    "global.contextHelp.modal",                 null,              "contextHelpModal",    null,               null,                  null,       null, "/global/context-help/modal",                        "contextual help, help modal, popup",      ["super_admin","admin","help_admin","client_admin","client_user","read_only"], 900, true, true],
  ["CMP-GLOBAL-HELP-AI-LAUNCHER",                      "PG-USR-HELP-MANUAL",          null,                                   "widget", "Global HelpAI Launcher",        "HelpAI",                   "global.helpAi.launcher",                   null,              "globalHelpAiLauncher",null,               null,                  null,       null, "/global/help-ai/launcher",                          "HelpAI, AI help, search assistant",       ["super_admin","admin","help_admin","client_admin","client_user","read_only"], 910, true, true],
];

const TEMPLATES = {
  field:       { applies_to: ["field","toggle","radio_option","select_option"],
    help_title: "{target_label}", short_help_text: "This field is used to capture or display {target_label}.",
    detailed_help_text: "Use this field to enter, review, or update {target_label}. This information supports the current page process and may affect related records, validations, reporting, or downstream workflow behavior. Users should provide accurate and complete information based on the intended business purpose of the field.",
    feature_capabilities_text: "This field supports data entry, review, and controlled validation within the current screen.",
    process_meaning_text: "The value in this field contributes to the current process step and may influence how related actions, statuses, calculations, or workflow transitions behave.",
    expected_user_action_text: "Review the current value and enter or select the correct information before saving or continuing.",
    allowed_values_text: "Allowed values depend on field configuration, validation rules, and available options on this screen.",
    examples_text: "Provide a valid value appropriate to the label and process context of this field.",
    dependency_notes_text: "Changes to this field may affect dependent validations, visibility logic, workflow routing, saved records, or reporting outputs.",
    warnings_text: "Do not enter incomplete, invalid, or placeholder data unless explicitly permitted by the business process.",
    validation_notes_text: "This field may enforce required-entry rules, formatting checks, or business validation constraints.",
    related_topics_text: "See related help for this section, page process, and save or submit actions.",
    search_keywords: "{search_keywords}, {target_label}, field, entry, input" },
  button:      { applies_to: ["button","action","link"],
    help_title: "{target_label}", short_help_text: "This action allows the user to {target_label}.",
    detailed_help_text: "Use this action to perform the {target_label} step within the current page or workflow. Selecting this action may save data, trigger validations, open another screen, update status, or move the process to the next stage depending on configuration and permissions.",
    feature_capabilities_text: "This action supports controlled workflow progression and page-level user operations.",
    process_meaning_text: "This action is part of the current task flow and may affect status, completion state, approvals, routing, or saved data.",
    expected_user_action_text: "Confirm that all required information is complete and correct before using this action.",
    allowed_values_text: "Not applicable unless this action opens a selection or decision path.",
    examples_text: "Use this action when the current page data has been reviewed and you are ready to proceed with the intended task.",
    dependency_notes_text: "This action may depend on permissions, required fields, workflow state, or completion of prior steps.",
    warnings_text: "Using this action may trigger permanent or workflow-impacting changes depending on system rules.",
    validation_notes_text: "The system may block this action until required validations pass.",
    related_topics_text: "See related help for required fields, current status, and next-step workflow behavior.",
    search_keywords: "{search_keywords}, {target_label}, action, button, workflow" },
  grid:        { applies_to: ["grid"],
    help_title: "{target_label}", short_help_text: "This grid displays a list of records related to the current page or process.",
    detailed_help_text: "Use this grid to review, sort, filter, and interact with records associated with the current module or workflow. The grid may display statuses, identifiers, dates, values, or action controls depending on configuration.",
    feature_capabilities_text: "This grid supports list review, record scanning, row-level actions, sorting, filtering, and navigation.",
    process_meaning_text: "The records shown here represent items relevant to the current process, reporting view, or administrative task.",
    expected_user_action_text: "Review the displayed rows and use filters, sorting, or row actions to locate and manage the needed record.",
    allowed_values_text: "Not applicable at the grid level, but individual columns or row actions may have constrained values.",
    examples_text: "Use this grid to locate a specific record, compare statuses, or open a detail view.",
    dependency_notes_text: "Displayed rows depend on permissions, filters, query results, and current application state.",
    warnings_text: "Not all records may be visible if filters, role restrictions, or pagination are applied.",
    validation_notes_text: "Grid actions may trigger validations at the row or record level.",
    related_topics_text: "See related help for filters, columns, and row-level actions.",
    search_keywords: "{search_keywords}, {target_label}, grid, table, list, records" },
  grid_column: { applies_to: ["grid_column"],
    help_title: "{target_label}", short_help_text: "This column shows {target_label} for each record in the grid.",
    detailed_help_text: "Use this column to review the {target_label} value for each listed record. This information helps users compare records, understand status, and decide what action to take next.",
    feature_capabilities_text: "This column provides row-level visibility into an important data point within the grid.",
    process_meaning_text: "The value shown in this column contributes to understanding the current record or its status in the process.",
    expected_user_action_text: "Review this column when comparing rows or locating the correct record.",
    allowed_values_text: "Allowed values depend on the underlying record and business logic.",
    examples_text: "Use this column to identify the correct record or confirm a record state.",
    dependency_notes_text: "Column values may change when source records, statuses, or workflow results are updated.",
    warnings_text: "Values may be abbreviated, formatted, or role-limited depending on grid configuration.",
    validation_notes_text: "This is typically display-only unless inline editing is enabled.",
    related_topics_text: "See related help for the parent grid and related row actions.",
    search_keywords: "{search_keywords}, {target_label}, column, grid column" },
  widget:      { applies_to: ["widget","badge","status"],
    help_title: "{target_label}", short_help_text: "This item summarizes an important metric or status.",
    detailed_help_text: "Use this item to quickly review the current value, count, percentage, or status relevant to this page. It is intended to help users understand overall system state, progress, workload, or completion at a glance.",
    feature_capabilities_text: "This element provides summarized operational visibility.",
    process_meaning_text: "The value shown here reflects a current measurement or status related to the page, module, or process.",
    expected_user_action_text: "Review this item to understand the current situation and determine whether further action is needed.",
    allowed_values_text: "Values are system-calculated or status-driven.", examples_text: "Use this summary to identify missing work, coverage gaps, or exception states.",
    dependency_notes_text: "The displayed value depends on underlying records, filters, calculations, and current system data.",
    warnings_text: "Summary values may change as data is updated or filtered.", validation_notes_text: "This item is typically read-only.",
    related_topics_text: "See related help for linked reports, grids, and source processes.",
    search_keywords: "{search_keywords}, {target_label}, metric, widget, KPI, status" },
  section:     { applies_to: ["section","tab","modal","process_step"],
    help_title: "{target_label}", short_help_text: "This section groups related information and actions for the current page.",
    detailed_help_text: "Use this section to review and complete the related fields, actions, and process steps grouped here. This section is intended to organize the workflow logically and help users focus on one part of the process at a time.",
    feature_capabilities_text: "This section provides structured access to related controls, data, or workflow activities.",
    process_meaning_text: "This section represents an identifiable part of the overall page process or business flow.",
    expected_user_action_text: "Complete or review the fields and actions in this section as required by the current task.",
    allowed_values_text: "Not applicable at the section level, but child fields and actions may have constraints.",
    examples_text: "Use this section when working on the portion of the page identified by its label and contents.",
    dependency_notes_text: "Completion of this section may affect downstream workflow, save behavior, or page readiness.",
    warnings_text: "Do not assume this section is complete unless all required child items are reviewed.",
    validation_notes_text: "Validation may occur at the field, action, or page level for content within this section.",
    related_topics_text: "See related help for child fields, actions, and page-level workflow.",
    search_keywords: "{search_keywords}, {target_label}, section, tab, panel, workflow area" },
};

const MANUAL_TOPICS = [
  { topic_code: "TOP-HELP-MOD-HELP-OVERVIEW",    module_code: "MOD-HELP", topic_title: "Help Center Overview",           topic_summary: "Overview of contextual help, help manual, and HelpAI",   topic_body: "The Help Center provides in-page help, full manual topics, and HelpAI search assistance throughout the application.", topic_type: "module_guide", language_code: "en", search_keywords: "help center, overview, manual, HelpAI",          sort_order: 10, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-MOD-ADM-HELP-OVERVIEW", module_code: "MOD-ADM",  topic_title: "Admin Help Management Overview", topic_summary: "Overview of help governance and content administration", topic_body: "The Admin Help Management area allows administrators to manage help coverage, edit help content, review HelpAI gaps, and maintain manual topics.", topic_type: "module_guide", language_code: "en", search_keywords: "admin help, help management, content editor",     sort_order: 20, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-PG-USR-HELP-MANUAL",    module_code: "MOD-HELP", topic_title: "Using the Help Manual",          topic_summary: "How to browse, search, and use the Help Manual",         topic_body: "The Help Manual allows users to browse by module and topic, search for answers, and navigate to related help content.", topic_type: "page_guide",   language_code: "en", search_keywords: "help manual, search, browse topics",             sort_order: 30, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-FAQ-CONTEXTUAL-HELP",   module_code: "MOD-HELP", topic_title: "How Contextual Help Works",      topic_summary: "Explanation of the question mark help experience",       topic_body: "Contextual help is available beside help-enabled items. Clicking the question mark opens detailed help for that specific feature or field.", topic_type: "faq", language_code: "en", search_keywords: "contextual help, question mark, popup",          sort_order: 40, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-FAQ-HELPAI",            module_code: "MOD-HELP", topic_title: "How HelpAI Works",               topic_summary: "Explanation of governed HelpAI behavior",                topic_body: "HelpAI answers questions using approved help content and related manual topics. It should not invent unsupported system behavior.", topic_type: "faq", language_code: "en", search_keywords: "HelpAI, AI help, governed help",                 sort_order: 50, is_active: true, is_published: true, is_system_generated: true, review_required: false },
];

const TOPIC_TARGET_MAPS = [
  { topic_code: "TOP-HELP-MOD-HELP-OVERVIEW",   target_code: "FLD-USR-HELP-MANUAL-SEARCH" },
  { topic_code: "TOP-HELP-MOD-HELP-OVERVIEW",   target_code: "BTN-USR-HELP-MANUAL-ASK-AI" },
  { topic_code: "TOP-HELP-PG-USR-HELP-MANUAL",  target_code: "FLD-USR-HELP-MANUAL-SEARCH" },
  { topic_code: "TOP-HELP-FAQ-CONTEXTUAL-HELP", target_code: "CMP-GLOBAL-CONTEXT-HELP-MODAL" },
  { topic_code: "TOP-HELP-FAQ-HELPAI",          target_code: "CMP-GLOBAL-HELP-AI-LAUNCHER" },
];

// ─── TEMPLATE ENGINE ─────────────────────────────────────────────────────────

function findTemplate(targetType) {
  for (const tpl of Object.values(TEMPLATES)) {
    if (tpl.applies_to.includes(targetType)) return tpl;
  }
  return TEMPLATES.field;
}

function applyTokens(str, label, name, keywords) {
  return str
    .replace(/\{target_label\}/g, label)
    .replace(/\{target_name\}/g, name)
    .replace(/\{search_keywords\}/g, keywords || label);
}

function generateContent(item) {
  const label = item.target_label || item.target_name;
  const tpl = findTemplate(item.target_type);
  const kw = item.search_keywords || label;
  const t = (s) => applyTokens(s, label, item.target_name, kw).replace(/\s+/g, " ").trim();
  return {
    content_source_type: "system_generated", content_status: "draft",
    version_no: 1, language_code: "en",
    help_title: t(tpl.help_title), short_help_text: t(tpl.short_help_text),
    detailed_help_text: t(tpl.detailed_help_text),
    feature_capabilities_text: t(tpl.feature_capabilities_text),
    process_meaning_text: t(tpl.process_meaning_text),
    expected_user_action_text: t(tpl.expected_user_action_text),
    allowed_values_text: t(tpl.allowed_values_text), examples_text: t(tpl.examples_text),
    dependency_notes_text: t(tpl.dependency_notes_text), warnings_text: t(tpl.warnings_text),
    validation_notes_text: t(tpl.validation_notes_text), related_topics_text: t(tpl.related_topics_text),
    search_keywords: t(tpl.search_keywords), source_confidence_score: 0.7,
    is_primary: true, is_active: true, review_required: true,
  };
}

// ─── SEED EXECUTION SERVICE ───────────────────────────────────────────────────
// Mirrors SeedExecutionService + SeedLogger from the adapter pack

class SeedExecutor {
  constructor(db, seedRunId) {
    this.db = db;
    this.seedRunId = seedRunId;
    this.stepsCompleted = 0;
    this.stepsFailed = 0;
    this.stepLog = [];
  }

  async runStep(stepName, action, meta = {}) {
    const started = Date.now();
    const stepRecord = {
      seed_run_id: this.seedRunId,
      seed_name: "help_system_master_seed",
      step_name: stepName,
      table_name: meta.tableName || null,
      action_type: meta.actionType || "start",
      status: "running",
      records_attempted: meta.recordsAttempted || null,
      step_started_at: new Date().toISOString(),
    };

    // Create step log entry
    let stepEntry;
    try { stepEntry = await this.db.SeedRunStep.create(stepRecord); } catch (_) {}

    try {
      const result = await action();
      const duration = Date.now() - started;
      this.stepsCompleted++;

      const update = {
        status: "completed",
        records_written: meta.recordsAttempted || null,
        records_skipped: meta.recordsSkipped || null,
        duration_ms: duration,
        step_finished_at: new Date().toISOString(),
      };
      if (meta.details) update.details = meta.details;
      if (stepEntry?.id) {
        try { await this.db.SeedRunStep.update(stepEntry.id, update); } catch (_) {}
      }
      this.stepLog.push({ step: stepName, status: "completed", duration_ms: duration, ...meta });
      return result;
    } catch (error) {
      const duration = Date.now() - started;
      this.stepsFailed++;
      const errMsg = error?.message || "Unknown error";
      if (stepEntry?.id) {
        try { await this.db.SeedRunStep.update(stepEntry.id, { status: "failed", error_message: errMsg, duration_ms: duration, step_finished_at: new Date().toISOString() }); } catch (_) {}
      }
      this.stepLog.push({ step: stepName, status: "failed", error: errMsg, duration_ms: duration });
      throw error;
    }
  }
}

// ─── UPSERT HELPER ────────────────────────────────────────────────────────────

async function bulkUpsertByCode(entitySDK, codeKey, records) {
  const existing = await entitySDK.list("-created_date", 2000);
  const existingByCode = Object.fromEntries(existing.map(r => [r[codeKey], r]));
  const toCreate = records.filter(r => !existingByCode[r[codeKey]]);
  const BATCH = 25;
  for (let i = 0; i < toCreate.length; i += BATCH) {
    await entitySDK.bulkCreate(toCreate.slice(i, i + BATCH));
  }
  const all = await entitySDK.list("-created_date", 2000);
  return Object.fromEntries(all.map(r => [r[codeKey], r]));
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const seedSecret = Deno.env.get("SEED_SECRET");
  if (!seedSecret || req.headers.get("x-seed-secret") !== seedSecret) {
    return Response.json({ error: "Unauthorized: set SEED_SECRET and pass X-Seed-Secret header." }, { status: 401 });
  }
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const db = base44.asServiceRole.entities;
  const now = new Date().toISOString();
  const seedName = "help_system_master_seed";
  const seedStarted = Date.now();

  // ── Create SeedRun record ─────────────────────────────────────────────────
  let seedRun;
  try { seedRun = await db.SeedRun.create({ seed_name: seedName, started_at: now, status: "running" }); } catch (_) {}

  const executor = new SeedExecutor(db, seedRun?.id || "local");

  try {
    const pageModuleCodeByPageCode = Object.fromEntries(PAGES.map(p => [p.page_code, p.module_code]));

    // ── STEP 1: MODULES ───────────────────────────────────────────────────
    const moduleByCode = await executor.runStep("upsert_help_modules",
      () => bulkUpsertByCode(db.HelpModule, "module_code", MODULES),
      { tableName: "HelpModule", actionType: "upsert", recordsAttempted: MODULES.length }
    );

    // ── STEP 2: PAGES ─────────────────────────────────────────────────────
    const pagesWithIds = PAGES.map(p => ({ ...p, is_system_defined: true, help_module_id: moduleByCode[p.module_code]?.id || null }));
    const pageByCode = await executor.runStep("upsert_help_pages",
      () => bulkUpsertByCode(db.HelpPage, "page_code", pagesWithIds),
      { tableName: "HelpPage", actionType: "upsert", recordsAttempted: PAGES.length }
    );

    // ── STEP 3: SECTIONS ──────────────────────────────────────────────────
    const sectionsWithIds = SECTIONS.map(s => ({
      ...s, is_system_defined: true,
      help_page_id: pageByCode[s.page_code]?.id || null,
      parent_section_id: null,
    }));
    const sectionByCode = await executor.runStep("upsert_help_sections",
      () => bulkUpsertByCode(db.HelpSection, "section_code", sectionsWithIds),
      { tableName: "HelpSection", actionType: "upsert", recordsAttempted: SECTIONS.length }
    );

    // ── STEP 4: TARGETS ───────────────────────────────────────────────────
    const targetRecords = INVENTORY.map(row => {
      const [target_code, page_code, section_code, target_type, target_name, target_label,
        component_key, field_name, control_name, action_code, workflow_code,
        grid_code, grid_column_code, target_path, search_keywords, role_scope,
        sort_order, is_help_enabled, is_required_for_coverage] = row;
      const moduleCode = pageModuleCodeByPageCode[page_code];
      return {
        target_code, target_type, target_name, target_label,
        module_code: moduleCode || null, page_code, section_code: section_code || null,
        help_module_id: moduleByCode[moduleCode]?.id || null,
        help_page_id: pageByCode[page_code]?.id || null,
        help_section_id: section_code ? sectionByCode[section_code]?.id || null : null,
        parent_help_target_id: null,
        component_key: component_key || null, field_name: field_name || null,
        control_name: control_name || null, action_code: action_code || null,
        workflow_code: workflow_code || null, grid_code: grid_code || null,
        grid_column_code: grid_column_code || null, target_path: target_path || null,
        search_keywords: search_keywords || null,
        role_scope: Array.isArray(role_scope) ? role_scope.join(", ") : (role_scope || "all"),
        sort_order: sort_order || 0,
        is_help_enabled: is_help_enabled !== false,
        is_required_for_coverage: is_required_for_coverage !== false,
        is_system_generated: true, is_active: true,
      };
    });
    const targetByCode = await executor.runStep("upsert_help_targets",
      () => bulkUpsertByCode(db.HelpTarget, "target_code", targetRecords),
      { tableName: "HelpTarget", actionType: "upsert", recordsAttempted: INVENTORY.length }
    );

    // ── STEP 5: MANUAL TOPICS ─────────────────────────────────────────────
    const topicsWithIds = MANUAL_TOPICS.map(t => ({
      ...t, help_module_id: moduleByCode[t.module_code]?.id || null,
      published_at: t.is_published ? now : null,
    }));
    const topicByCode = await executor.runStep("upsert_help_manual_topics",
      () => bulkUpsertByCode(db.HelpManualTopic, "topic_code", topicsWithIds),
      { tableName: "HelpManualTopic", actionType: "upsert", recordsAttempted: MANUAL_TOPICS.length }
    );

    // ── STEP 6: TOPIC TARGET MAPS ─────────────────────────────────────────
    await executor.runStep("upsert_help_manual_topic_target_maps",
      async () => {
        let existingMaps = [];
        try { existingMaps = await db.HelpManualTopicTargetMap.list("-created_date", 500); } catch (_) {}
        const mapKeys = new Set(existingMaps.map(m => `${m.help_manual_topic_id}__${m.help_target_id}`));
        const newMaps = TOPIC_TARGET_MAPS
          .map(m => ({ topic: topicByCode[m.topic_code], target: targetByCode[m.target_code], ...m }))
          .filter(m => m.topic && m.target && !mapKeys.has(`${m.topic.id}__${m.target.id}`))
          .map(m => ({ help_manual_topic_id: m.topic.id, topic_code: m.topic_code, help_target_id: m.target.id, target_code: m.target_code }));
        if (newMaps.length) {
          try { await db.HelpManualTopicTargetMap.bulkCreate(newMaps); } catch (_) {}
        }
        return newMaps;
      },
      { tableName: "HelpManualTopicTargetMap", actionType: "upsert", recordsAttempted: TOPIC_TARGET_MAPS.length }
    );

    // ── STEP 7: GENERATE + UPSERT HELP CONTENTS ───────────────────────────
    const generatedContentRows = await executor.runStep("generate_help_contents",
      async () => {
        const existingContents = await db.HelpContent.list("-created_date", 2000);
        const existingByTargetCode = Object.fromEntries(existingContents.map(c => [c.help_target_code, c]));
        const toCreate = [];
        for (const row of INVENTORY) {
          const [target_code, page_code, , target_type, target_name, target_label, , , , , , , , , search_keywords, role_scope] = row;
          if (existingByTargetCode[target_code]) continue;
          const target = targetByCode[target_code];
          if (!target) continue;
          const generated = generateContent({ target_code, page_code, target_type, target_name, target_label, search_keywords, role_scope });
          const pg = pageByCode[page_code];
          toCreate.push({
            help_target_id: target.id, help_target_code: target_code,
            module_code: pg?.module_code || null, page_code,
            role_visibility: Array.isArray(role_scope) ? role_scope.join(", ") : (role_scope || "all"),
            ...generated, approved_by: null, approved_at: null, last_updated_by: null, view_count: 0,
          });
        }
        const BATCH = 25;
        for (let i = 0; i < toCreate.length; i += BATCH) {
          await db.HelpContent.bulkCreate(toCreate.slice(i, i + BATCH));
        }
        return toCreate;
      },
      { tableName: "HelpContent", actionType: "generate", recordsAttempted: INVENTORY.length }
    );

    // ── STEP 8: HELP CONTENT VERSIONS ─────────────────────────────────────
    await executor.runStep("upsert_help_content_versions",
      async () => {
        const allContents = await db.HelpContent.list("-created_date", 2000);
        const existingVersions = await db.HelpContentVersion.list("-created_date", 2000);
        const versionedIds = new Set(existingVersions.map(v => v.help_content_id));
        const newVersions = allContents
          .filter(c => !versionedIds.has(c.id))
          .map(c => ({
            help_content_id: c.id, help_target_code: c.help_target_code,
            version_no: 1, change_type: "create",
            snapshot_payload: { help_title: c.help_title, short_help_text: c.short_help_text, detailed_help_text: c.detailed_help_text, content_status: c.content_status, content_source_type: c.content_source_type },
            change_summary: "Initial system-generated help content", changed_by: null,
          }));
        const BATCH = 25;
        for (let i = 0; i < newVersions.length; i += BATCH) {
          await db.HelpContentVersion.bulkCreate(newVersions.slice(i, i + BATCH));
        }
        return newVersions;
      },
      { tableName: "HelpContentVersion", actionType: "upsert", recordsAttempted: generatedContentRows.length }
    );

    // ── STEP 9: AI TRAINING QUEUE ─────────────────────────────────────────
    await executor.runStep("upsert_help_ai_training_queue",
      async () => {
        const allContents = await db.HelpContent.list("-created_date", 2000);
        const existingQueue = await db.HelpAITrainingQueue.list("-created_date", 2000);
        const queuedIds = new Set(existingQueue.map(q => q.source_entity_id));
        const queueItems = [];
        for (const c of allContents) {
          if (!queuedIds.has(c.id)) queueItems.push({ source_entity_type: "HelpContent", source_entity_id: c.id, source_target_code: c.help_target_code, change_reason: "initial seed", queue_status: "queued", attempt_count: 0, queued_at: now });
        }
        for (const t of Object.values(topicByCode)) {
          if (t.is_published && !queuedIds.has(t.id)) queueItems.push({ source_entity_type: "HelpManualTopic", source_entity_id: t.id, source_target_code: null, change_reason: "initial seed", queue_status: "queued", attempt_count: 0, queued_at: now });
        }
        const BATCH = 25;
        for (let i = 0; i < queueItems.length; i += BATCH) {
          await db.HelpAITrainingQueue.bulkCreate(queueItems.slice(i, i + BATCH));
        }
        return queueItems;
      },
      { tableName: "HelpAITrainingQueue", actionType: "upsert" }
    );

    // ── Finalize SeedRun as completed ─────────────────────────────────────
    const totalMs = Date.now() - seedStarted;
    if (seedRun?.id) {
      try {
        await db.SeedRun.update(seedRun.id, {
          status: "completed", finished_at: new Date().toISOString(),
          steps_completed: executor.stepsCompleted, steps_failed: executor.stepsFailed,
          total_duration_ms: totalMs,
        });
      } catch (_) {}
    }

    return Response.json({
      success: true,
      seed_run_id: seedRun?.id || null,
      seed_name: seedName,
      status: "completed",
      steps_completed: executor.stepsCompleted,
      steps_failed: executor.stepsFailed,
      total_duration_ms: totalMs,
      step_log: executor.stepLog,
    });

  } catch (error) {
    const totalMs = Date.now() - seedStarted;
    if (seedRun?.id) {
      try {
        await db.SeedRun.update(seedRun.id, {
          status: "failed", finished_at: new Date().toISOString(),
          steps_completed: executor.stepsCompleted, steps_failed: executor.stepsFailed,
          total_duration_ms: totalMs, error_message: error?.message || "Unknown error",
        });
      } catch (_) {}
    }
    return Response.json({
      success: false,
      seed_run_id: seedRun?.id || null,
      status: "failed",
      error: error?.message || "Unknown error",
      steps_completed: executor.stepsCompleted,
      steps_failed: executor.stepsFailed,
      step_log: executor.stepLog,
    }, { status: 500 });
  }
});