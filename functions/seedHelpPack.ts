import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// ─── SEED DATA ───────────────────────────────────────────────────────────────

const MODULES = [
  { module_code: "MOD-ADM",     module_name: "Administration",       module_description: "Administrative tools and governance functions",                          route_base: "/admin",       icon_name: "settings",    sort_order: 10, is_active: true, is_system_defined: true },
  { module_code: "MOD-HELP",    module_name: "Help Center",          module_description: "End-user help manual, contextual help, and HelpAI",                     route_base: "/help",        icon_name: "help-circle", sort_order: 20, is_active: true, is_system_defined: true },
  { module_code: "MOD-EMP",     module_name: "Employee Management",  module_description: "Employee and subscriber profile, maintenance, and actions",              route_base: "/employees",   icon_name: "users",       sort_order: 30, is_active: true, is_system_defined: true },
  { module_code: "MOD-CLAIMS",  module_name: "Claims",               module_description: "Claims processing, review, status, and reporting",                      route_base: "/claims",      icon_name: "file-text",   sort_order: 40, is_active: true, is_system_defined: true },
  { module_code: "MOD-RENEWAL", module_name: "Renewal",              module_description: "Renewal workflows, review, approval, and lifecycle tracking",            route_base: "/renewals",    icon_name: "refresh-cw",  sort_order: 50, is_active: true, is_system_defined: true },
  { module_code: "MOD-SETTINGS",module_name: "Settings",             module_description: "Configuration, controls, integrations, and user preferences",            route_base: "/settings",    icon_name: "sliders",     sort_order: 60, is_active: true, is_system_defined: true },
];

const PAGES = [
  { page_code: "PG-ADM-HELP-DASHBOARD",        module_code: "MOD-ADM",      page_name: "Help Dashboard",          page_label: "Help Dashboard",          route_path: "/admin/help/dashboard",              page_type: "dashboard",       sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-ADM-HELP-TARGET-REGISTRY",  module_code: "MOD-ADM",      page_name: "Help Target Registry",    page_label: "Help Target Registry",    route_path: "/admin/help/targets",                page_type: "admin_page",      sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-ADM-HELP-CONTENT-EDITOR",   module_code: "MOD-ADM",      page_name: "Help Content Editor",     page_label: "Help Content Editor",     route_path: "/admin/help/content/:helpTargetId",  page_type: "admin_page",      sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-ADM-HELP-MANUAL-MANAGER",   module_code: "MOD-ADM",      page_name: "Help Manual Manager",     page_label: "Help Manual Manager",     route_path: "/admin/help/manual",                 page_type: "admin_page",      sort_order: 40, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-ADM-HELP-COVERAGE",         module_code: "MOD-ADM",      page_name: "Help Coverage Report",    page_label: "Help Coverage Report",    route_path: "/admin/help/coverage",               page_type: "report_page",     sort_order: 50, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-ADM-HELP-AI-REVIEW",        module_code: "MOD-ADM",      page_name: "HelpAI Review Queue",     page_label: "HelpAI Review Queue",     route_path: "/admin/help/ai-review",              page_type: "admin_page",      sort_order: 60, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-ADM-HELP-SEARCH-ANALYTICS", module_code: "MOD-ADM",      page_name: "Help Search Analytics",   page_label: "Help Search Analytics",   route_path: "/admin/help/analytics",              page_type: "dashboard",       sort_order: 70, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-USR-HELP-MANUAL",           module_code: "MOD-HELP",     page_name: "Help Manual",             page_label: "Help Manual",             route_path: "/help/manual",                       page_type: "manual_page",     sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-EMP-DETAIL",                module_code: "MOD-EMP",      page_name: "Employee Detail",         page_label: "Employee Detail",         route_path: "/employees/:employeeId",             page_type: "standard_screen", sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-CLAIMS-LIST",               module_code: "MOD-CLAIMS",   page_name: "Claims List",             page_label: "Claims List",             route_path: "/claims",                            page_type: "standard_screen", sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-RENEWAL-CASE-DETAIL",       module_code: "MOD-RENEWAL",  page_name: "Renewal Case Detail",     page_label: "Renewal Case Detail",     route_path: "/renewals/:renewalCaseId",           page_type: "standard_screen", sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { page_code: "PG-SETTINGS-NOTIFICATIONS",    module_code: "MOD-SETTINGS", page_name: "Notification Settings",   page_label: "Notification Settings",   route_path: "/settings/notifications",            page_type: "settings_page",   sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
];

const SECTIONS = [
  // Help Dashboard
  { section_code: "SEC-ADM-HELP-DASHBOARD-KPIS",               page_code: "PG-ADM-HELP-DASHBOARD",        section_name: "KPI Cards",              section_label: "KPI Cards",              section_type: "summary_section",  section_path: "/admin/help/dashboard/kpis",                  sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-DASHBOARD-MODULE-COVERAGE",    page_code: "PG-ADM-HELP-DASHBOARD",        section_name: "Coverage by Module",     section_label: "Coverage by Module",     section_type: "grid",             section_path: "/admin/help/dashboard/module-coverage",       sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-DASHBOARD-RECENT-UPDATES",     page_code: "PG-ADM-HELP-DASHBOARD",        section_name: "Recent Help Updates",    section_label: "Recent Help Updates",    section_type: "grid",             section_path: "/admin/help/dashboard/recent-updates",        sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-DASHBOARD-AI-EXCEPTIONS",      page_code: "PG-ADM-HELP-DASHBOARD",        section_name: "HelpAI Exceptions",      section_label: "HelpAI Exceptions",      section_type: "grid",             section_path: "/admin/help/dashboard/ai-exceptions",         sort_order: 40, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Target Registry
  { section_code: "SEC-ADM-HELP-TARGETS-FILTERS",              page_code: "PG-ADM-HELP-TARGET-REGISTRY",  section_name: "Target Filters",         section_label: "Target Filters",         section_type: "filter_section",   section_path: "/admin/help/targets/filters",                 sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-TARGETS-GRID",                 page_code: "PG-ADM-HELP-TARGET-REGISTRY",  section_name: "Target Registry Grid",   section_label: "Target Registry Grid",   section_type: "grid",             section_path: "/admin/help/targets/grid",                    sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-TARGETS-DETAIL",               page_code: "PG-ADM-HELP-TARGET-REGISTRY",  section_name: "Target Detail Drawer",   section_label: "Target Detail Drawer",   section_type: "sidebar_section",  section_path: "/admin/help/targets/detail",                  sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Content Editor
  { section_code: "SEC-ADM-HELP-CONTENT-TARGET-SUMMARY",       page_code: "PG-ADM-HELP-CONTENT-EDITOR",   section_name: "Target Summary",         section_label: "Target Summary",         section_type: "summary_section",  section_path: "/admin/help/content/target-summary",          sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-CONTENT-BASELINE",             page_code: "PG-ADM-HELP-CONTENT-EDITOR",   section_name: "Generated Baseline",     section_label: "Generated Baseline",     section_type: "card",             section_path: "/admin/help/content/baseline",                sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-CONTENT-FORM",                 page_code: "PG-ADM-HELP-CONTENT-EDITOR",   section_name: "Help Content Form",      section_label: "Help Content Form",      section_type: "form_section",     section_path: "/admin/help/content/form",                    sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-CONTENT-PREVIEW",              page_code: "PG-ADM-HELP-CONTENT-EDITOR",   section_name: "Preview Panel",          section_label: "Preview Panel",          section_type: "tab",              section_path: "/admin/help/content/preview",                 sort_order: 40, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-CONTENT-VERSIONS",             page_code: "PG-ADM-HELP-CONTENT-EDITOR",   section_name: "Version History",        section_label: "Version History",        section_type: "grid",             section_path: "/admin/help/content/versions",                sort_order: 50, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Manual Manager
  { section_code: "SEC-ADM-HELP-MANUAL-TREE",                  page_code: "PG-ADM-HELP-MANUAL-MANAGER",   section_name: "Topic Tree",             section_label: "Topic Tree",             section_type: "sidebar_section",  section_path: "/admin/help/manual/tree",                     sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-MANUAL-FORM",                  page_code: "PG-ADM-HELP-MANUAL-MANAGER",   section_name: "Topic Editor",           section_label: "Topic Editor",           section_type: "form_section",     section_path: "/admin/help/manual/form",                     sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-MANUAL-TARGET-MAP",            page_code: "PG-ADM-HELP-MANUAL-MANAGER",   section_name: "Related Target Mapper",  section_label: "Related Target Mapper",  section_type: "grid",             section_path: "/admin/help/manual/target-map",               sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Coverage Report
  { section_code: "SEC-ADM-HELP-COVERAGE-SUMMARY",             page_code: "PG-ADM-HELP-COVERAGE",         section_name: "Coverage Summary",       section_label: "Coverage Summary",       section_type: "summary_section",  section_path: "/admin/help/coverage/summary",                sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-COVERAGE-MODULE",              page_code: "PG-ADM-HELP-COVERAGE",         section_name: "Coverage by Module",     section_label: "Coverage by Module",     section_type: "grid",             section_path: "/admin/help/coverage/module",                 sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-COVERAGE-PAGE",                page_code: "PG-ADM-HELP-COVERAGE",         section_name: "Coverage by Page",       section_label: "Coverage by Page",       section_type: "grid",             section_path: "/admin/help/coverage/page",                   sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-COVERAGE-MISSING",             page_code: "PG-ADM-HELP-COVERAGE",         section_name: "Missing Targets",        section_label: "Missing Targets",        section_type: "grid",             section_path: "/admin/help/coverage/missing",                sort_order: 40, is_help_enabled: true, is_active: true, is_system_defined: true },
  // AI Review Queue
  { section_code: "SEC-ADM-HELP-AI-REVIEW-FILTERS",            page_code: "PG-ADM-HELP-AI-REVIEW",        section_name: "Review Filters",         section_label: "Review Filters",         section_type: "filter_section",   section_path: "/admin/help/ai-review/filters",               sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-AI-REVIEW-GRID",               page_code: "PG-ADM-HELP-AI-REVIEW",        section_name: "Review Queue Grid",      section_label: "Review Queue Grid",      section_type: "grid",             section_path: "/admin/help/ai-review/grid",                  sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-AI-REVIEW-DETAIL",             page_code: "PG-ADM-HELP-AI-REVIEW",        section_name: "Review Detail",          section_label: "Review Detail",          section_type: "card",             section_path: "/admin/help/ai-review/detail",                sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Search Analytics
  { section_code: "SEC-ADM-HELP-ANALYTICS-TOP-SEARCHES",       page_code: "PG-ADM-HELP-SEARCH-ANALYTICS", section_name: "Top Searches",           section_label: "Top Searches",           section_type: "grid",             section_path: "/admin/help/analytics/top-searches",          sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-ANALYTICS-ZERO-RESULTS",       page_code: "PG-ADM-HELP-SEARCH-ANALYTICS", section_name: "Zero Result Searches",   section_label: "Zero Result Searches",   section_type: "grid",             section_path: "/admin/help/analytics/zero-results",          sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-ANALYTICS-TOPICS",             page_code: "PG-ADM-HELP-SEARCH-ANALYTICS", section_name: "Most Viewed Topics",     section_label: "Most Viewed Topics",     section_type: "grid",             section_path: "/admin/help/analytics/topics",                sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-ADM-HELP-ANALYTICS-TARGETS",            page_code: "PG-ADM-HELP-SEARCH-ANALYTICS", section_name: "Most Opened Targets",    section_label: "Most Opened Targets",    section_type: "grid",             section_path: "/admin/help/analytics/targets",               sort_order: 40, is_help_enabled: true, is_active: true, is_system_defined: true },
  // User Help Manual
  { section_code: "SEC-USR-HELP-MANUAL-NAV",                   page_code: "PG-USR-HELP-MANUAL",           section_name: "Help Navigation",        section_label: "Help Navigation",        section_type: "sidebar_section",  section_path: "/help/manual/nav",                            sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-USR-HELP-MANUAL-SEARCH",                page_code: "PG-USR-HELP-MANUAL",           section_name: "Help Search",            section_label: "Help Search",            section_type: "filter_section",   section_path: "/help/manual/search",                         sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-USR-HELP-MANUAL-CONTENT",               page_code: "PG-USR-HELP-MANUAL",           section_name: "Help Topic Content",     section_label: "Help Topic Content",     section_type: "card",             section_path: "/help/manual/content",                        sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-USR-HELP-MANUAL-RELATED",               page_code: "PG-USR-HELP-MANUAL",           section_name: "Related Topics",         section_label: "Related Topics",         section_type: "card",             section_path: "/help/manual/related",                        sort_order: 40, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Employee Detail
  { section_code: "SEC-EMP-DETAIL-HEADER",                     page_code: "PG-EMP-DETAIL",                section_name: "Employee Header",        section_label: "Employee Header",        section_type: "toolbar",          section_path: "/employees/:employeeId/header",               sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-EMP-DETAIL-PERSONAL",                   page_code: "PG-EMP-DETAIL",                section_name: "Personal Information",   section_label: "Personal Information",   section_type: "form_section",     section_path: "/employees/:employeeId/personal",             sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-EMP-DETAIL-EMPLOYMENT",                 page_code: "PG-EMP-DETAIL",                section_name: "Employment Information", section_label: "Employment Information", section_type: "form_section",     section_path: "/employees/:employeeId/employment",           sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Claims List
  { section_code: "SEC-CLAIMS-LIST-FILTERS",                   page_code: "PG-CLAIMS-LIST",               section_name: "Claim Filters",          section_label: "Claim Filters",          section_type: "filter_section",   section_path: "/claims/filters",                             sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-CLAIMS-LIST-GRID",                      page_code: "PG-CLAIMS-LIST",               section_name: "Claims Grid",            section_label: "Claims Grid",            section_type: "grid",             section_path: "/claims/grid",                                sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Renewal Case Detail
  { section_code: "SEC-RENEWAL-CASE-HEADER",                   page_code: "PG-RENEWAL-CASE-DETAIL",       section_name: "Renewal Header",         section_label: "Renewal Header",         section_type: "toolbar",          section_path: "/renewals/:renewalCaseId/header",             sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-RENEWAL-CASE-SUMMARY",                  page_code: "PG-RENEWAL-CASE-DETAIL",       section_name: "Renewal Summary",        section_label: "Renewal Summary",        section_type: "summary_section",  section_path: "/renewals/:renewalCaseId/summary",            sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-RENEWAL-CASE-APPROVAL",                 page_code: "PG-RENEWAL-CASE-DETAIL",       section_name: "Approval Section",       section_label: "Approval Section",       section_type: "form_section",     section_path: "/renewals/:renewalCaseId/approval",           sort_order: 30, is_help_enabled: true, is_active: true, is_system_defined: true },
  // Notification Settings
  { section_code: "SEC-SETTINGS-NOTIFICATIONS-GENERAL",        page_code: "PG-SETTINGS-NOTIFICATIONS",    section_name: "General Notifications",  section_label: "General Notifications",  section_type: "form_section",     section_path: "/settings/notifications/general",             sort_order: 10, is_help_enabled: true, is_active: true, is_system_defined: true },
  { section_code: "SEC-SETTINGS-NOTIFICATIONS-CHANNELS",       page_code: "PG-SETTINGS-NOTIFICATIONS",    section_name: "Channel Settings",       section_label: "Channel Settings",       section_type: "form_section",     section_path: "/settings/notifications/channels",            sort_order: 20, is_help_enabled: true, is_active: true, is_system_defined: true },
];

// Screen inventory: [target_code, page_code, section_code, target_type, target_name, target_label, component_key, field_name, control_name, action_code, workflow_code, grid_code, grid_column_code, target_path, search_keywords, role_scope, sort_order, is_help_enabled, is_required_for_coverage]
const INVENTORY = [
  // Help Dashboard KPIs
  ["CRD-ADM-HELP-DASHBOARD-KPI-TOTAL-TARGETS",        "PG-ADM-HELP-DASHBOARD","SEC-ADM-HELP-DASHBOARD-KPIS",           "widget",     "Total Help Targets Card",     "Total Help Targets",      "help.dashboard.kpi.totalTargets",          null,"cardTotalTargets",null,null,null,null,"/admin/help/dashboard/kpis/totalTargets","total targets, registry, help coverage","all",10,true,true],
  ["CRD-ADM-HELP-DASHBOARD-KPI-COVERAGE",             "PG-ADM-HELP-DASHBOARD","SEC-ADM-HELP-DASHBOARD-KPIS",           "widget",     "Coverage Card",               "Active Help Coverage %",  "help.dashboard.kpi.coveragePercent",       null,"cardCoverage",null,null,null,null,"/admin/help/dashboard/kpis/coverage","coverage, completion, active help","all",20,true,true],
  ["CRD-ADM-HELP-DASHBOARD-KPI-MISSING",              "PG-ADM-HELP-DASHBOARD","SEC-ADM-HELP-DASHBOARD-KPIS",           "widget",     "Missing Help Card",           "Missing Help Count",      "help.dashboard.kpi.missingHelp",           null,"cardMissingHelp",null,null,null,null,"/admin/help/dashboard/kpis/missing","missing help, incomplete, uncovered","all",30,true,true],
  ["BTN-ADM-HELP-DASHBOARD-VIEW-COVERAGE",            "PG-ADM-HELP-DASHBOARD","SEC-ADM-HELP-DASHBOARD-KPIS",           "button",     "View Coverage Report",        "View Coverage Report",    "help.dashboard.actions.viewCoverage",      null,"btnViewCoverage","viewCoverage",null,null,null,"/admin/help/dashboard/actions/viewCoverage","coverage report, navigate, report","all",40,true,true],
  ["GRID-ADM-HELP-DASHBOARD-MODULE-COVERAGE",         "PG-ADM-HELP-DASHBOARD","SEC-ADM-HELP-DASHBOARD-MODULE-COVERAGE","grid",       "Coverage by Module Grid",     "Coverage by Module",      "help.dashboard.moduleCoverageGrid",        null,"gridModuleCoverage",null,null,"MODCOV",null,"/admin/help/dashboard/module-coverage/grid","module coverage, coverage grid","all",50,true,true],
  ["COL-ADM-HELP-DASHBOARD-MODULE-COVERAGE-NAME",     "PG-ADM-HELP-DASHBOARD","SEC-ADM-HELP-DASHBOARD-MODULE-COVERAGE","grid_column","Module Name Column",          "Module Name",             "help.dashboard.moduleCoverageGrid.name",   null,"colModuleName",null,null,"MODCOV","name","/admin/help/dashboard/module-coverage/name","module name, column","all",60,true,true],
  ["COL-ADM-HELP-DASHBOARD-MODULE-COVERAGE-PERCENT",  "PG-ADM-HELP-DASHBOARD","SEC-ADM-HELP-DASHBOARD-MODULE-COVERAGE","grid_column","Coverage Percent Column",     "Coverage %",              "help.dashboard.moduleCoverageGrid.percent",null,"colCoveragePercent",null,null,"MODCOV","coverage_percent","/admin/help/dashboard/module-coverage/coveragePercent","coverage percent, completion rate","all",70,true,true],
  // Target Registry
  ["FLD-ADM-HELP-TARGETS-FILTER-MODULE",              "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-FILTERS","field",      "Module Filter",               "Module",                  "help.targets.filters.module",              "moduleFilter","selectModule",null,null,null,null,"/admin/help/targets/filters/module","module filter, target filter","all",10,true,true],
  ["FLD-ADM-HELP-TARGETS-FILTER-PAGE",                "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-FILTERS","field",      "Page Filter",                 "Page",                    "help.targets.filters.page",                "pageFilter","selectPage",null,null,null,null,"/admin/help/targets/filters/page","page filter, screen filter","all",20,true,true],
  ["FLD-ADM-HELP-TARGETS-FILTER-TYPE",                "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-FILTERS","field",      "Target Type Filter",          "Target Type",             "help.targets.filters.type",                "targetTypeFilter","selectTargetType",null,null,null,null,"/admin/help/targets/filters/type","target type filter","all",30,true,true],
  ["BTN-ADM-HELP-TARGETS-APPLY-FILTERS",              "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-FILTERS","button",     "Apply Filters",               "Apply Filters",           "help.targets.filters.apply",               null,"btnApplyFilters","applyFilters",null,null,null,"/admin/help/targets/filters/apply","apply filters, search","all",40,true,true],
  ["GRID-ADM-HELP-TARGETS-REGISTRY",                  "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-GRID",  "grid",       "Registry Grid",               "Target Registry Grid",    "help.targets.registry.grid",               null,"gridTargetRegistry",null,null,"TREG",null,"/admin/help/targets/grid","target registry, help targets","all",50,true,true],
  ["COL-ADM-HELP-TARGETS-REGISTRY-TARGET-CODE",       "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-GRID",  "grid_column","Target Code Column",          "Target Code",             "help.targets.registry.grid.targetCode",    null,"colTargetCode",null,null,"TREG","target_code","/admin/help/targets/grid/targetCode","target code, identifier","all",60,true,true],
  ["COL-ADM-HELP-TARGETS-REGISTRY-TYPE",              "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-GRID",  "grid_column","Target Type Column",          "Target Type",             "help.targets.registry.grid.targetType",    null,"colTargetType",null,null,"TREG","target_type","/admin/help/targets/grid/targetType","target type, component type","all",70,true,true],
  ["BTN-ADM-HELP-TARGETS-ROW-EDIT",                   "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-GRID",  "action",     "Edit Help Action",            "Edit Help",               "help.targets.registry.row.edit",           null,"actEditHelp","editHelp",null,"TREG",null,"/admin/help/targets/grid/actions/editHelp","edit help, open editor","all",80,true,true],
  ["BTN-ADM-HELP-TARGETS-ROW-CREATE",                 "PG-ADM-HELP-TARGET-REGISTRY","SEC-ADM-HELP-TARGETS-GRID",  "action",     "Create Help Action",          "Create Help",             "help.targets.registry.row.create",         null,"actCreateHelp","createHelp",null,"TREG",null,"/admin/help/targets/grid/actions/createHelp","create help, new help","all",90,true,true],
  // Content Editor
  ["FLD-ADM-HELP-CONTENT-TARGET-CODE",                "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-TARGET-SUMMARY","field","Target Code",              "Target Code",             "help.content.targetSummary.targetCode",    "targetCode","txtTargetCode",null,null,null,null,"/admin/help/content/target-summary/targetCode","target code, identifier","all",10,true,true],
  ["FLD-ADM-HELP-CONTENT-HELP-TITLE",                 "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","field",          "Help Title",              "Help Title",              "help.content.form.helpTitle",              "help_title","txtHelpTitle",null,null,null,null,"/admin/help/content/form/helpTitle","help title, heading","all",20,true,true],
  ["FLD-ADM-HELP-CONTENT-SHORT-HELP",                 "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","field",          "Short Help Text",         "Short Help",              "help.content.form.shortHelp",              "short_help_text","txtShortHelp",null,null,null,null,"/admin/help/content/form/shortHelp","short help, summary","all",30,true,true],
  ["FLD-ADM-HELP-CONTENT-DETAILED-HELP",              "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","field",          "Detailed Help Text",      "Detailed Help",           "help.content.form.detailedHelp",           "detailed_help_text","txtDetailedHelp",null,null,null,null,"/admin/help/content/form/detailedHelp","detailed help, main help text","all",40,true,true],
  ["FLD-ADM-HELP-CONTENT-CAPABILITIES",               "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","field",          "Feature Capabilities",    "Feature Capabilities",    "help.content.form.featureCapabilities",    "feature_capabilities_text","txtCapabilities",null,null,null,null,"/admin/help/content/form/capabilities","capabilities, feature details","all",50,true,true],
  ["FLD-ADM-HELP-CONTENT-EXPECTED-ACTION",            "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","field",          "Expected User Action",    "Expected User Action",    "help.content.form.expectedAction",         "expected_user_action_text","txtExpectedAction",null,null,null,null,"/admin/help/content/form/expectedAction","expected action, user action","all",60,true,true],
  ["FLD-ADM-HELP-CONTENT-ALLOWED-VALUES",             "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","field",          "Allowed Values",          "Allowed Values",          "help.content.form.allowedValues",          "allowed_values_text","txtAllowedValues",null,null,null,null,"/admin/help/content/form/allowedValues","allowed values, valid values","all",70,true,true],
  ["FLD-ADM-HELP-CONTENT-WARNINGS",                   "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","field",          "Warnings",                "Warnings",                "help.content.form.warnings",               "warnings_text","txtWarnings",null,null,null,null,"/admin/help/content/form/warnings","warnings, caution","all",80,true,true],
  ["BTN-ADM-HELP-CONTENT-SAVE-DRAFT",                 "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","button",         "Save Draft",              "Save Draft",              "help.content.form.saveDraft",              null,"btnSaveDraft","saveDraft",null,null,null,"/admin/help/content/form/saveDraft","save draft, draft","all",90,true,true],
  ["BTN-ADM-HELP-CONTENT-ACTIVATE",                   "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-FORM","button",         "Activate Help",           "Activate",                "help.content.form.activate",               null,"btnActivate","activate",null,null,null,"/admin/help/content/form/activate","activate help, publish","all",100,true,true],
  ["TAB-ADM-HELP-CONTENT-PREVIEW-MODAL",              "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-PREVIEW","tab",         "Modal Preview Tab",       "Contextual Help Preview", "help.content.preview.modalTab",            null,"tabModalPreview",null,null,null,null,"/admin/help/content/preview/modal","modal preview, contextual preview","all",110,true,true],
  ["TAB-ADM-HELP-CONTENT-PREVIEW-MANUAL",             "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-PREVIEW","tab",         "Manual Preview Tab",      "Help Manual Preview",     "help.content.preview.manualTab",           null,"tabManualPreview",null,null,null,null,"/admin/help/content/preview/manual","manual preview","all",120,true,true],
  ["GRID-ADM-HELP-CONTENT-VERSIONS",                  "PG-ADM-HELP-CONTENT-EDITOR","SEC-ADM-HELP-CONTENT-VERSIONS","grid",       "Version History Grid",    "Version History",         "help.content.versions.grid",               null,"gridVersionHistory",null,null,"VERS",null,"/admin/help/content/versions/grid","versions, history, audit","all",130,true,true],
  // Manual Manager
  ["GRID-ADM-HELP-MANUAL-TREE",                       "PG-ADM-HELP-MANUAL-MANAGER","SEC-ADM-HELP-MANUAL-TREE",   "grid",       "Topic Tree",              "Topic Tree",              "help.manual.tree.grid",                    null,"treeTopics",null,null,"TOPTREE",null,"/admin/help/manual/tree","topic tree, manual topics","all",10,true,true],
  ["FLD-ADM-HELP-MANUAL-TOPIC-CODE",                  "PG-ADM-HELP-MANUAL-MANAGER","SEC-ADM-HELP-MANUAL-FORM",   "field",      "Topic Code",              "Topic Code",              "help.manual.form.topicCode",               "topic_code","txtTopicCode",null,null,null,null,"/admin/help/manual/form/topicCode","topic code, manual code","all",20,true,true],
  ["FLD-ADM-HELP-MANUAL-TOPIC-TITLE",                 "PG-ADM-HELP-MANUAL-MANAGER","SEC-ADM-HELP-MANUAL-FORM",   "field",      "Topic Title",             "Topic Title",             "help.manual.form.topicTitle",              "topic_title","txtTopicTitle",null,null,null,null,"/admin/help/manual/form/topicTitle","topic title, manual title","all",30,true,true],
  ["FLD-ADM-HELP-MANUAL-TOPIC-BODY",                  "PG-ADM-HELP-MANUAL-MANAGER","SEC-ADM-HELP-MANUAL-FORM",   "field",      "Topic Body",              "Topic Body",              "help.manual.form.topicBody",               "topic_body","txtTopicBody",null,null,null,null,"/admin/help/manual/form/topicBody","topic body, long help","all",40,true,true],
  ["BTN-ADM-HELP-MANUAL-PUBLISH",                     "PG-ADM-HELP-MANUAL-MANAGER","SEC-ADM-HELP-MANUAL-FORM",   "button",     "Publish Topic",           "Publish",                 "help.manual.form.publish",                 null,"btnPublish","publish",null,null,null,"/admin/help/manual/form/publish","publish manual topic","all",50,true,true],
  ["GRID-ADM-HELP-MANUAL-TARGET-MAP",                 "PG-ADM-HELP-MANUAL-MANAGER","SEC-ADM-HELP-MANUAL-TARGET-MAP","grid",    "Related Target Mapper",   "Related Targets",         "help.manual.targetMap.grid",               null,"gridTargetMap",null,null,"TMAP",null,"/admin/help/manual/target-map/grid","related targets, mappings","all",60,true,true],
  // Coverage Report
  ["CRD-ADM-HELP-COVERAGE-TOTAL",                     "PG-ADM-HELP-COVERAGE","SEC-ADM-HELP-COVERAGE-SUMMARY","widget",        "Total Targets Card",      "Total Targets",           "help.coverage.summary.totalTargets",       null,"cardTotalTargets",null,null,null,null,"/admin/help/coverage/summary/totalTargets","total targets, total count","all",10,true,true],
  ["CRD-ADM-HELP-COVERAGE-COVERED",                   "PG-ADM-HELP-COVERAGE","SEC-ADM-HELP-COVERAGE-SUMMARY","widget",        "Covered Targets Card",    "Covered Targets",         "help.coverage.summary.coveredTargets",     null,"cardCoveredTargets",null,null,null,null,"/admin/help/coverage/summary/coveredTargets","covered targets","all",20,true,true],
  ["GRID-ADM-HELP-COVERAGE-MODULE",                   "PG-ADM-HELP-COVERAGE","SEC-ADM-HELP-COVERAGE-MODULE","grid",          "Coverage by Module Grid", "Coverage by Module",      "help.coverage.module.grid",                null,"gridCoverageByModule",null,null,"MODCOV2",null,"/admin/help/coverage/module/grid","coverage by module","all",30,true,true],
  ["GRID-ADM-HELP-COVERAGE-PAGE",                     "PG-ADM-HELP-COVERAGE","SEC-ADM-HELP-COVERAGE-PAGE","grid",            "Coverage by Page Grid",   "Coverage by Page",        "help.coverage.page.grid",                  null,"gridCoverageByPage",null,null,"PAGECOV",null,"/admin/help/coverage/page/grid","coverage by page","all",40,true,true],
  ["GRID-ADM-HELP-COVERAGE-MISSING",                  "PG-ADM-HELP-COVERAGE","SEC-ADM-HELP-COVERAGE-MISSING","grid",         "Missing Targets Grid",    "Missing Targets",         "help.coverage.missing.grid",               null,"gridMissingTargets",null,null,"MISS",null,"/admin/help/coverage/missing/grid","missing targets, missing help","all",50,true,true],
  ["BTN-ADM-HELP-COVERAGE-EXPORT",                    "PG-ADM-HELP-COVERAGE","SEC-ADM-HELP-COVERAGE-MISSING","button",       "Export Missing Help",     "Export Missing Help",     "help.coverage.missing.export",             null,"btnExportMissing","exportMissing",null,"MISS",null,"/admin/help/coverage/missing/export","export missing, download missing help","all",60,true,true],
  // AI Review Queue
  ["FLD-ADM-HELP-AI-REVIEW-STATUS-FILTER",            "PG-ADM-HELP-AI-REVIEW","SEC-ADM-HELP-AI-REVIEW-FILTERS","field",      "Answer Status Filter",    "Answer Status",           "help.aiReview.filters.status",             "answerStatusFilter","selectAnswerStatus",null,null,null,null,"/admin/help/ai-review/filters/status","answer status, AI status","all",10,true,true],
  ["FLD-ADM-HELP-AI-REVIEW-CONFIDENCE-FILTER",        "PG-ADM-HELP-AI-REVIEW","SEC-ADM-HELP-AI-REVIEW-FILTERS","field",      "Confidence Filter",       "Confidence Score",        "help.aiReview.filters.confidence",         "confidenceFilter","rangeConfidence",null,null,null,null,"/admin/help/ai-review/filters/confidence","confidence filter","all",20,true,true],
  ["GRID-ADM-HELP-AI-REVIEW-GRID",                    "PG-ADM-HELP-AI-REVIEW","SEC-ADM-HELP-AI-REVIEW-GRID","grid",          "Review Queue Grid",       "Review Queue",            "help.aiReview.grid",                       null,"gridAiReview",null,null,"AIREV",null,"/admin/help/ai-review/grid","AI review queue, AI questions","all",30,true,true],
  ["FLD-ADM-HELP-AI-REVIEW-QUESTION",                 "PG-ADM-HELP-AI-REVIEW","SEC-ADM-HELP-AI-REVIEW-DETAIL","field",       "Question Text",           "Question",                "help.aiReview.detail.question",            "question_text","txtQuestion",null,null,null,null,"/admin/help/ai-review/detail/question","question, user question","all",40,true,true],
  ["FLD-ADM-HELP-AI-REVIEW-ANSWER",                   "PG-ADM-HELP-AI-REVIEW","SEC-ADM-HELP-AI-REVIEW-DETAIL","field",       "Answer Text",             "Answer",                  "help.aiReview.detail.answer",              "answer_text","txtAnswer",null,null,null,null,"/admin/help/ai-review/detail/answer","answer, AI answer","all",50,true,true],
  ["BTN-ADM-HELP-AI-REVIEW-MARK-RESOLVED",            "PG-ADM-HELP-AI-REVIEW","SEC-ADM-HELP-AI-REVIEW-DETAIL","button",      "Mark Resolved",           "Mark Resolved",           "help.aiReview.detail.resolve",             null,"btnMarkResolved","markResolved",null,null,null,"/admin/help/ai-review/detail/resolve","resolved, close issue","all",60,true,true],
  ["BTN-ADM-HELP-AI-REVIEW-CREATE-HELP",              "PG-ADM-HELP-AI-REVIEW","SEC-ADM-HELP-AI-REVIEW-DETAIL","button",      "Create Help from Question","Create Help",            "help.aiReview.detail.createHelp",          null,"btnCreateHelp","createHelpFromQuestion",null,null,null,"/admin/help/ai-review/detail/createHelp","create help from AI question","all",70,true,true],
  // Search Analytics
  ["GRID-ADM-HELP-ANALYTICS-TOP-SEARCHES",            "PG-ADM-HELP-SEARCH-ANALYTICS","SEC-ADM-HELP-ANALYTICS-TOP-SEARCHES","grid","Top Searches Grid",     "Top Searches",            "help.analytics.topSearches.grid",          null,"gridTopSearches",null,null,"TOPSEARCH",null,"/admin/help/analytics/top-searches/grid","top searches, popular searches","all",10,true,true],
  ["GRID-ADM-HELP-ANALYTICS-ZERO-RESULTS",            "PG-ADM-HELP-SEARCH-ANALYTICS","SEC-ADM-HELP-ANALYTICS-ZERO-RESULTS","grid","Zero Result Grid",     "Zero Result Searches",    "help.analytics.zeroResults.grid",          null,"gridZeroResults",null,null,"ZERORES",null,"/admin/help/analytics/zero-results/grid","zero results, failed search","all",20,true,true],
  ["GRID-ADM-HELP-ANALYTICS-TOPICS",                  "PG-ADM-HELP-SEARCH-ANALYTICS","SEC-ADM-HELP-ANALYTICS-TOPICS","grid",       "Most Viewed Topics Grid","Most Viewed Topics",     "help.analytics.topics.grid",               null,"gridTopTopics",null,null,"TOPICS",null,"/admin/help/analytics/topics/grid","most viewed topics","all",30,true,true],
  ["GRID-ADM-HELP-ANALYTICS-TARGETS",                 "PG-ADM-HELP-SEARCH-ANALYTICS","SEC-ADM-HELP-ANALYTICS-TARGETS","grid",      "Most Opened Targets Grid","Most Opened Targets",   "help.analytics.targets.grid",              null,"gridTopTargets",null,null,"TOPTARGETS",null,"/admin/help/analytics/targets/grid","most opened targets","all",40,true,true],
  // User Help Manual
  ["FLD-USR-HELP-MANUAL-SEARCH",                      "PG-USR-HELP-MANUAL","SEC-USR-HELP-MANUAL-SEARCH",  "field",          "Help Search",             "Search Help",             "help.manual.search.input",                 "searchText","txtHelpSearch",null,null,null,null,"/help/manual/search/input","help search, manual search","all",10,true,true],
  ["GRID-USR-HELP-MANUAL-NAV",                        "PG-USR-HELP-MANUAL","SEC-USR-HELP-MANUAL-NAV",    "grid",           "Help Navigation Tree",    "Help Navigation",         "help.manual.nav.tree",                     null,"navTree",null,null,"HNAV",null,"/help/manual/nav/tree","navigation, help topics","all",20,true,true],
  ["FLD-USR-HELP-MANUAL-TOPIC-TITLE",                 "PG-USR-HELP-MANUAL","SEC-USR-HELP-MANUAL-CONTENT","field",          "Topic Title",             "Topic Title",             "help.manual.content.topicTitle",           "topic_title","txtTopicTitle",null,null,null,null,"/help/manual/content/topicTitle","topic title","all",30,true,true],
  ["BTN-USR-HELP-MANUAL-ASK-AI",                      "PG-USR-HELP-MANUAL","SEC-USR-HELP-MANUAL-CONTENT","button",         "Ask HelpAI Button",       "Ask HelpAI",              "help.manual.content.askAi",                null,"btnAskHelpAi","askHelpAi",null,null,null,"/help/manual/content/askAi","ask AI, HelpAI","all",40,true,true],
  ["GRID-USR-HELP-MANUAL-RELATED",                    "PG-USR-HELP-MANUAL","SEC-USR-HELP-MANUAL-RELATED","grid",           "Related Topics Grid",     "Related Topics",          "help.manual.related.grid",                 null,"gridRelatedTopics",null,null,"RELTOP",null,"/help/manual/related/grid","related topics","all",50,true,true],
  // Employee Detail
  ["BTN-EMP-DETAIL-HEADER-SAVE",                      "PG-EMP-DETAIL","SEC-EMP-DETAIL-HEADER",    "button","Save Employee",          "Save",                    "employee.detail.header.save",              null,"btnSaveEmployee","saveEmployee",null,null,null,"/employees/:employeeId/header/save","save, employee save","all",10,true,true],
  ["BTN-EMP-DETAIL-HEADER-CANCEL",                    "PG-EMP-DETAIL","SEC-EMP-DETAIL-HEADER",    "button","Cancel Changes",         "Cancel",                  "employee.detail.header.cancel",            null,"btnCancelEmployee","cancelEmployee",null,null,null,"/employees/:employeeId/header/cancel","cancel, discard","all",20,true,true],
  ["FLD-EMP-DETAIL-PERSONAL-FIRST-NAME",              "PG-EMP-DETAIL","SEC-EMP-DETAIL-PERSONAL",  "field", "First Name",             "First Name",              "employee.personal.firstName",              "first_name","txtFirstName",null,null,null,null,"/employees/:employeeId/personal/firstName","first name, given name","all",30,true,true],
  ["FLD-EMP-DETAIL-PERSONAL-LAST-NAME",               "PG-EMP-DETAIL","SEC-EMP-DETAIL-PERSONAL",  "field", "Last Name",              "Last Name",               "employee.personal.lastName",               "last_name","txtLastName",null,null,null,null,"/employees/:employeeId/personal/lastName","last name, surname","all",40,true,true],
  ["FLD-EMP-DETAIL-PERSONAL-EMAIL",                   "PG-EMP-DETAIL","SEC-EMP-DETAIL-PERSONAL",  "field", "Email Address",          "Email",                   "employee.personal.email",                  "email","txtEmail",null,null,null,null,"/employees/:employeeId/personal/email","email, email address","all",50,true,true],
  ["FLD-EMP-DETAIL-EMPLOYMENT-STATUS",                "PG-EMP-DETAIL","SEC-EMP-DETAIL-EMPLOYMENT","field", "Employment Status",      "Employment Status",       "employee.employment.status",               "employment_status","selectEmploymentStatus",null,null,null,null,"/employees/:employeeId/employment/status","employment status, active, terminated","all",60,true,true],
  // Claims List
  ["FLD-CLAIMS-LIST-FILTER-STATUS",                   "PG-CLAIMS-LIST","SEC-CLAIMS-LIST-FILTERS","field",       "Claim Status Filter",  "Claim Status",            "claims.list.filters.status",               "claim_status","selectClaimStatus",null,null,null,null,"/claims/filters/status","claim status filter","all",10,true,true],
  ["FLD-CLAIMS-LIST-FILTER-MEMBER",                   "PG-CLAIMS-LIST","SEC-CLAIMS-LIST-FILTERS","field",       "Member Filter",        "Member",                  "claims.list.filters.member",               "member_search","txtMemberSearch",null,null,null,null,"/claims/filters/member","member search, subscriber","all",20,true,true],
  ["GRID-CLAIMS-LIST-GRID",                           "PG-CLAIMS-LIST","SEC-CLAIMS-LIST-GRID",   "grid",        "Claims Grid",          "Claims Grid",             "claims.list.grid",                         null,"gridClaims",null,null,"CLMGRID",null,"/claims/grid","claims grid, claims list","all",30,true,true],
  ["COL-CLAIMS-LIST-GRID-CLAIM-NUMBER",               "PG-CLAIMS-LIST","SEC-CLAIMS-LIST-GRID",   "grid_column", "Claim Number Column",  "Claim Number",            "claims.list.grid.claimNumber",             null,"colClaimNumber",null,null,"CLMGRID","claim_number","/claims/grid/claimNumber","claim number","all",40,true,true],
  ["COL-CLAIMS-LIST-GRID-STATUS",                     "PG-CLAIMS-LIST","SEC-CLAIMS-LIST-GRID",   "grid_column", "Status Column",        "Status",                  "claims.list.grid.status",                  null,"colStatus",null,null,"CLMGRID","status","/claims/grid/status","status column, claim status","all",50,true,true],
  ["ACT-CLAIMS-LIST-GRID-VIEW-DETAIL",                "PG-CLAIMS-LIST","SEC-CLAIMS-LIST-GRID",   "action",      "View Claim Detail",    "View Detail",             "claims.list.grid.actions.viewDetail",      null,"actViewClaimDetail","viewClaimDetail",null,"CLMGRID",null,"/claims/grid/actions/viewDetail","view detail, open claim","all",60,true,true],
  // Renewal Case Detail
  ["BTN-RENEWAL-CASE-HEADER-SAVE",                    "PG-RENEWAL-CASE-DETAIL","SEC-RENEWAL-CASE-HEADER","button",   "Save Renewal Case",    "Save",                    "renewal.case.header.save",                 null,"btnSaveRenewal","saveRenewalCase",null,null,null,"/renewals/:renewalCaseId/header/save","save renewal, case save","all",10,true,true],
  ["FLD-RENEWAL-CASE-SUMMARY-STATUS",                 "PG-RENEWAL-CASE-DETAIL","SEC-RENEWAL-CASE-SUMMARY","field",  "Renewal Status",       "Renewal Status",          "renewal.case.summary.status",              "renewal_status","txtRenewalStatus",null,null,null,null,"/renewals/:renewalCaseId/summary/status","renewal status","all",20,true,true],
  ["FLD-RENEWAL-CASE-APPROVAL-DECISION",              "PG-RENEWAL-CASE-DETAIL","SEC-RENEWAL-CASE-APPROVAL","field", "Approval Decision",    "Approval Decision",       "renewal.case.approval.decision",           "approval_decision","selectDecision",null,"WF-RENEWAL-APPROVAL",null,null,"/renewals/:renewalCaseId/approval/decision","approval decision","all",30,true,true],
  ["BTN-RENEWAL-CASE-APPROVAL-SUBMIT",                "PG-RENEWAL-CASE-DETAIL","SEC-RENEWAL-CASE-APPROVAL","button","Submit for Approval",  "Submit for Approval",     "renewal.case.approval.submit",             null,"btnSubmitApproval","submitForApproval","WF-RENEWAL-APPROVAL",null,null,"/renewals/:renewalCaseId/approval/submit","submit for approval","all",40,true,true],
  // Notification Settings
  ["FLD-SETTINGS-NOTIFICATIONS-GENERAL-ENABLE-EMAIL", "PG-SETTINGS-NOTIFICATIONS","SEC-SETTINGS-NOTIFICATIONS-GENERAL","toggle","Enable Email Notifications","Enable Email Notifications","settings.notifications.general.emailEnabled","email_enabled","toggleEmailEnabled",null,null,null,null,"/settings/notifications/general/emailEnabled","email notifications, enable email","all",10,true,true],
  ["FLD-SETTINGS-NOTIFICATIONS-GENERAL-ENABLE-SMS",   "PG-SETTINGS-NOTIFICATIONS","SEC-SETTINGS-NOTIFICATIONS-GENERAL","toggle","Enable SMS Notifications","Enable SMS Notifications","settings.notifications.general.smsEnabled","sms_enabled","toggleSmsEnabled",null,null,null,null,"/settings/notifications/general/smsEnabled","sms notifications, enable SMS","all",20,true,true],
  ["FLD-SETTINGS-NOTIFICATIONS-CHANNELS-FROM-EMAIL",  "PG-SETTINGS-NOTIFICATIONS","SEC-SETTINGS-NOTIFICATIONS-CHANNELS","field","From Email Address","From Email Address","settings.notifications.channels.fromEmail","from_email","txtFromEmail",null,null,null,null,"/settings/notifications/channels/fromEmail","from email, sender email","all",30,true,true],
  ["BTN-SETTINGS-NOTIFICATIONS-SAVE",                 "PG-SETTINGS-NOTIFICATIONS","SEC-SETTINGS-NOTIFICATIONS-CHANNELS","button","Save Notification Settings","Save","settings.notifications.channels.save",null,"btnSaveSettings","saveNotificationSettings",null,null,null,"/settings/notifications/channels/save","save notification settings","all",40,true,true],
  // Global component targets
  ["CMP-GLOBAL-CONTEXT-HELP-MODAL", "PG-USR-HELP-MANUAL",null,"modal", "Contextual Help Modal","Contextual Help Modal","global.contextHelp.modal",null,null,null,null,null,null,"/global/context-help/modal","contextual help, help modal, popup","all",900,true,true],
  ["CMP-GLOBAL-HELP-AI-LAUNCHER",   "PG-USR-HELP-MANUAL",null,"widget","Global HelpAI Launcher","HelpAI","global.helpAi.launcher",null,null,null,null,null,null,"/global/help-ai/launcher","HelpAI, AI help, search assistant","all",910,true,true],
];

const MANUAL_TOPICS = [
  { topic_code: "TOP-HELP-MOD-HELP-OVERVIEW",    module_code: "MOD-HELP", topic_title: "Help Center Overview",           topic_summary: "Overview of contextual help, help manual, and HelpAI",          topic_body: "The Help Center provides in-page help, full manual topics, and HelpAI search assistance throughout the application. Users can access contextual help by clicking the question mark icon beside any help-enabled item. The Help Manual provides comprehensive topic guides. HelpAI answers questions using approved help content.",  topic_type: "module_guide", language_code: "en", search_keywords: "help center, overview, manual, HelpAI",                  sort_order: 10, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-MOD-ADM-HELP-OVERVIEW",module_code: "MOD-ADM",  topic_title: "Admin Help Management Overview", topic_summary: "Overview of help governance and content administration",          topic_body: "The Admin Help Management area allows administrators to manage help coverage, edit help content, review HelpAI gaps, and maintain manual topics. Use the Help Dashboard to monitor coverage KPIs. Use the Target Registry to browse all registered help targets. Use the Help Content Editor to write and activate help entries.",topic_type: "module_guide", language_code: "en", search_keywords: "admin help, help management, content editor",             sort_order: 20, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-PG-USR-HELP-MANUAL",   module_code: "MOD-HELP", topic_title: "Using the Help Manual",          topic_summary: "How to browse, search, and use the Help Manual",                 topic_body: "The Help Manual allows users to browse by module and topic, search for answers, and navigate to related help content. Use the navigation tree on the left to browse by topic. Use the search bar to find answers quickly. Click Ask HelpAI for AI-powered answers based on approved help content.",                                      topic_type: "page_guide",   language_code: "en", search_keywords: "help manual, search, browse topics",                     sort_order: 30, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-PG-ADM-HELP-CONTENT",  module_code: "MOD-ADM",  topic_title: "Using the Help Content Editor",  topic_summary: "How admins create and maintain detailed help",                   topic_body: "The Help Content Editor allows authorized users to write, preview, activate, and improve help content tied to specific targets. Select a help target from the registry, review the AI-generated baseline, then edit and activate the content. Use the Preview panel to see how the content will appear to end users.",                  topic_type: "page_guide",   language_code: "en", search_keywords: "help content editor, admin help, edit help",             sort_order: 40, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-FAQ-CONTEXTUAL-HELP",  module_code: "MOD-HELP", topic_title: "How Contextual Help Works",      topic_summary: "Explanation of the question mark help experience",               topic_body: "Contextual help is available beside help-enabled items. Clicking the question mark opens detailed help for that specific feature or field. The modal shows a title, short summary, detailed explanation, and related topics. You can also click 'Open Help Manual' for full documentation or 'Ask HelpAI' for AI-powered answers.", topic_type: "faq",          language_code: "en", search_keywords: "contextual help, question mark, popup",                  sort_order: 50, is_active: true, is_published: true, is_system_generated: true, review_required: false },
  { topic_code: "TOP-HELP-FAQ-HELPAI",           module_code: "MOD-HELP", topic_title: "How HelpAI Works",               topic_summary: "Explanation of governed HelpAI behavior",                        topic_body: "HelpAI answers questions using approved help content and related manual topics. It should not invent unsupported system behavior. Answers include a confidence score and source references. Low-confidence answers are flagged for admin review. Unanswered questions are queued for content improvement.",                                topic_type: "faq",          language_code: "en", search_keywords: "HelpAI, AI help, governed help",                         sort_order: 60, is_active: true, is_published: true, is_system_generated: true, review_required: false },
];

const TOPIC_TARGET_MAPS = [
  { topic_code: "TOP-HELP-MOD-HELP-OVERVIEW",    target_code: "FLD-USR-HELP-MANUAL-SEARCH" },
  { topic_code: "TOP-HELP-MOD-HELP-OVERVIEW",    target_code: "BTN-USR-HELP-MANUAL-ASK-AI" },
  { topic_code: "TOP-HELP-PG-USR-HELP-MANUAL",   target_code: "GRID-USR-HELP-MANUAL-NAV" },
  { topic_code: "TOP-HELP-PG-USR-HELP-MANUAL",   target_code: "FLD-USR-HELP-MANUAL-TOPIC-TITLE" },
  { topic_code: "TOP-HELP-PG-ADM-HELP-CONTENT",  target_code: "FLD-ADM-HELP-CONTENT-HELP-TITLE" },
  { topic_code: "TOP-HELP-PG-ADM-HELP-CONTENT",  target_code: "FLD-ADM-HELP-CONTENT-DETAILED-HELP" },
  { topic_code: "TOP-HELP-PG-ADM-HELP-CONTENT",  target_code: "BTN-ADM-HELP-CONTENT-SAVE-DRAFT" },
  { topic_code: "TOP-HELP-FAQ-CONTEXTUAL-HELP",   target_code: "CMP-GLOBAL-CONTEXT-HELP-MODAL" },
  { topic_code: "TOP-HELP-FAQ-HELPAI",            target_code: "CMP-GLOBAL-HELP-AI-LAUNCHER" },
];

// ─── TEMPLATE ENGINE ─────────────────────────────────────────────────────────

function getTemplate(target_type) {
  const fieldTypes = ["field","toggle","radio_option","select_option"];
  const buttonTypes = ["button","action","link"];
  const gridTypes = ["grid"];
  const colTypes = ["grid_column"];
  const widgetTypes = ["widget","badge","status"];
  const sectionTypes = ["section","tab","modal","process_step"];

  if (fieldTypes.includes(target_type)) return "field";
  if (buttonTypes.includes(target_type)) return "button";
  if (gridTypes.includes(target_type)) return "grid";
  if (colTypes.includes(target_type)) return "grid_column";
  if (widgetTypes.includes(target_type)) return "widget";
  if (sectionTypes.includes(target_type)) return "section";
  return "field";
}

function generateContent(target) {
  const l = target.target_label;
  const kw = target.search_keywords || "";
  const tpl = getTemplate(target.target_type);

  const templates = {
    field: {
      help_title: l,
      short_help_text: `This field is used to capture or display ${l}.`,
      detailed_help_text: `Use this field to enter, review, or update ${l}. This information supports the current page process and may affect related records, validations, reporting, or downstream workflow behavior. Users should provide accurate and complete information based on the intended business purpose of the field.`,
      feature_capabilities_text: `This field supports data entry, review, and controlled validation within the current screen.`,
      process_meaning_text: `The value in this field contributes to the current process step and may influence how related actions, statuses, calculations, or workflow transitions behave.`,
      expected_user_action_text: `Review the current value and enter or select the correct information before saving or continuing.`,
      allowed_values_text: `Allowed values depend on field configuration, validation rules, and available options on this screen.`,
      examples_text: `Provide a valid value appropriate to the label and process context of this field.`,
      dependency_notes_text: `Changes to this field may affect dependent validations, visibility logic, workflow routing, saved records, or reporting outputs.`,
      warnings_text: `Do not enter incomplete, invalid, or placeholder data unless explicitly permitted by the business process.`,
      validation_notes_text: `This field may enforce required-entry rules, formatting checks, or business validation constraints.`,
      related_topics_text: `See related help for this section, page process, and save/submit actions.`,
      search_keywords: `${kw}, ${l}, field, entry, input`,
    },
    button: {
      help_title: l,
      short_help_text: `This action allows the user to ${l}.`,
      detailed_help_text: `Use this action to perform the ${l} step within the current page or workflow. Selecting this action may save data, trigger validations, open another screen, update status, or move the process to the next stage depending on configuration and permissions.`,
      feature_capabilities_text: `This action supports controlled workflow progression and page-level user operations.`,
      process_meaning_text: `This action is part of the current task flow and may affect status, completion state, approvals, routing, or saved data.`,
      expected_user_action_text: `Confirm that all required information is complete and correct before using this action.`,
      allowed_values_text: `Not applicable unless this action opens a selection or decision path.`,
      examples_text: `Use this action when the current page data has been reviewed and you are ready to proceed with the intended task.`,
      dependency_notes_text: `This action may depend on permissions, required fields, workflow state, or completion of prior steps.`,
      warnings_text: `Using this action may trigger permanent or workflow-impacting changes depending on system rules.`,
      validation_notes_text: `The system may block this action until required validations pass.`,
      related_topics_text: `See related help for required fields, current status, and next-step workflow behavior.`,
      search_keywords: `${kw}, ${l}, action, button, workflow`,
    },
    grid: {
      help_title: l,
      short_help_text: `This grid displays a list of records related to the current page or process.`,
      detailed_help_text: `Use this grid to review, sort, filter, and interact with records associated with the current module or workflow. The grid may display statuses, identifiers, dates, values, or action controls depending on configuration.`,
      feature_capabilities_text: `This grid supports list review, record scanning, row-level actions, sorting, filtering, and navigation.`,
      process_meaning_text: `The records shown here represent items relevant to the current process, reporting view, or administrative task.`,
      expected_user_action_text: `Review the displayed rows and use filters, sorting, or row actions to locate and manage the needed record.`,
      allowed_values_text: `Not applicable at the grid level, but individual columns or row actions may have constrained values.`,
      examples_text: `Use this grid to locate a specific record, compare statuses, or open a detail view.`,
      dependency_notes_text: `Displayed rows depend on permissions, filters, query results, and current application state.`,
      warnings_text: `Not all records may be visible if filters, role restrictions, or pagination are applied.`,
      validation_notes_text: `Grid actions may trigger validations at the row or record level.`,
      related_topics_text: `See related help for filters, columns, and row-level actions.`,
      search_keywords: `${kw}, ${l}, grid, table, list, records`,
    },
    grid_column: {
      help_title: l,
      short_help_text: `This column shows ${l} for each record in the grid.`,
      detailed_help_text: `Use this column to review the ${l} value for each listed record. This information helps users compare records, understand status, and decide what action to take next.`,
      feature_capabilities_text: `This column provides row-level visibility into an important data point within the grid.`,
      process_meaning_text: `The value shown in this column contributes to understanding the current record or its status in the process.`,
      expected_user_action_text: `Review this column when comparing rows or locating the correct record.`,
      allowed_values_text: `Allowed values depend on the underlying record and business logic.`,
      examples_text: `Use this column to identify the correct record or confirm a record state.`,
      dependency_notes_text: `Column values may change when source records, statuses, or workflow results are updated.`,
      warnings_text: `Values may be abbreviated, formatted, or role-limited depending on grid configuration.`,
      validation_notes_text: `This is typically display-only unless inline editing is enabled.`,
      related_topics_text: `See related help for the parent grid and related row actions.`,
      search_keywords: `${kw}, ${l}, column, grid column`,
    },
    widget: {
      help_title: l,
      short_help_text: `This item summarizes an important metric or status.`,
      detailed_help_text: `Use this item to quickly review the current value, count, percentage, or status relevant to this page. It is intended to help users understand overall system state, progress, workload, or completion at a glance.`,
      feature_capabilities_text: `This element provides summarized operational visibility.`,
      process_meaning_text: `The value shown here reflects a current measurement or status related to the page, module, or process.`,
      expected_user_action_text: `Review this item to understand the current situation and determine whether further action is needed.`,
      allowed_values_text: `Values are system-calculated or status-driven.`,
      examples_text: `Use this summary to identify missing work, coverage gaps, or exception states.`,
      dependency_notes_text: `The displayed value depends on underlying records, filters, calculations, and current system data.`,
      warnings_text: `Summary values may change as data is updated or filtered.`,
      validation_notes_text: `This item is typically read-only.`,
      related_topics_text: `See related help for linked reports, grids, and source processes.`,
      search_keywords: `${kw}, ${l}, metric, widget, KPI, status`,
    },
    section: {
      help_title: l,
      short_help_text: `This section groups related information and actions for the current page.`,
      detailed_help_text: `Use this section to review and complete the related fields, actions, and process steps grouped here. This section is intended to organize the workflow logically and help users focus on one part of the process at a time.`,
      feature_capabilities_text: `This section provides structured access to related controls, data, or workflow activities.`,
      process_meaning_text: `This section represents an identifiable part of the overall page process or business flow.`,
      expected_user_action_text: `Complete or review the fields and actions in this section as required by the current task.`,
      allowed_values_text: `Not applicable at the section level, but child fields and actions may have constraints.`,
      examples_text: `Use this section when working on the portion of the page identified by its label and contents.`,
      dependency_notes_text: `Completion of this section may affect downstream workflow, save behavior, or page readiness.`,
      warnings_text: `Do not assume this section is complete unless all required child items are reviewed.`,
      validation_notes_text: `Validation may occur at the field, action, or page level for content within this section.`,
      related_topics_text: `See related help for child fields, actions, and page-level workflow.`,
      search_keywords: `${kw}, ${l}, section, tab, panel, workflow area`,
    },
  };

  return templates[tpl] || templates.field;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }

  const stats = {
    modules: { created: 0, skipped: 0 },
    pages: { created: 0, skipped: 0 },
    sections: { created: 0, skipped: 0 },
    targets: { created: 0, skipped: 0 },
    contents: { created: 0, skipped: 0 },
    manual_topics: { created: 0, skipped: 0 },
    topic_maps: { created: 0, skipped: 0 },
    ai_queue: { created: 0, skipped: 0 },
  };

  // ─── 1. MODULES ──────────────────────────────────────────────────────────
  const existingModules = await base44.asServiceRole.entities.HelpModule.list();
  const existingModuleCodes = new Set(existingModules.map(m => m.module_code));
  const newModules = MODULES.filter(m => !existingModuleCodes.has(m.module_code));
  if (newModules.length > 0) await base44.asServiceRole.entities.HelpModule.bulkCreate(newModules);
  stats.modules.created = newModules.length;
  stats.modules.skipped = MODULES.length - newModules.length;

  // ─── 2. PAGES ────────────────────────────────────────────────────────────
  const allModules = await base44.asServiceRole.entities.HelpModule.list();
  const moduleByCode = Object.fromEntries(allModules.map(m => [m.module_code, m]));

  const existingPages = await base44.asServiceRole.entities.HelpPage.list();
  const existingPageCodes = new Set(existingPages.map(p => p.page_code));
  const newPages = PAGES.filter(p => !existingPageCodes.has(p.page_code)).map(pg => ({
    ...pg, help_module_id: moduleByCode[pg.module_code]?.id || null,
  }));
  if (newPages.length > 0) await base44.asServiceRole.entities.HelpPage.bulkCreate(newPages);
  stats.pages.created = newPages.length;
  stats.pages.skipped = PAGES.length - newPages.length;

  // ─── 3. SECTIONS ─────────────────────────────────────────────────────────
  const allPages = await base44.asServiceRole.entities.HelpPage.list();
  const pageByCode = Object.fromEntries(allPages.map(p => [p.page_code, p]));

  const existingSections = await base44.asServiceRole.entities.HelpSection.list();
  const existingSectionCodes = new Set(existingSections.map(s => s.section_code));
  const newSections = SECTIONS.filter(s => !existingSectionCodes.has(s.section_code)).map(sec => ({
    ...sec, help_page_id: pageByCode[sec.page_code]?.id || null,
  }));
  if (newSections.length > 0) await base44.asServiceRole.entities.HelpSection.bulkCreate(newSections);
  stats.sections.created = newSections.length;
  stats.sections.skipped = SECTIONS.length - newSections.length;

  // ─── 4. TARGETS ──────────────────────────────────────────────────────────
  const allSections = await base44.asServiceRole.entities.HelpSection.list();
  const sectionByCode = Object.fromEntries(allSections.map(s => [s.section_code, s]));

  const existingTargets = await base44.asServiceRole.entities.HelpTarget.list();
  const existingTargetCodes = new Set(existingTargets.map(t => t.target_code));

  const newTargetRecords = [];
  for (const row of INVENTORY) {
    const [target_code, page_code, section_code, target_type, target_name, target_label,
      component_key, field_name, control_name, action_code, workflow_code, grid_code,
      grid_column_code, target_path, search_keywords, role_scope, sort_order,
      is_help_enabled, is_required_for_coverage] = row;
    if (existingTargetCodes.has(target_code)) { stats.targets.skipped++; continue; }
    const pg = pageByCode[page_code];
    const sec = section_code ? sectionByCode[section_code] : null;
    newTargetRecords.push({
      target_code, target_type, target_name, target_label,
      module_code: pg?.module_code || null, page_code,
      section_code: section_code || null,
      help_module_id: pg ? (moduleByCode[pg.module_code]?.id || null) : null,
      help_page_id: pg?.id || null, help_section_id: sec?.id || null,
      component_key: component_key || null, field_name: field_name || null,
      control_name: control_name || null, action_code: action_code || null,
      workflow_code: workflow_code || null, grid_code: grid_code || null,
      grid_column_code: grid_column_code || null, target_path: target_path || null,
      search_keywords: search_keywords || null, role_scope: role_scope || "all",
      sort_order: sort_order || 0, is_help_enabled: is_help_enabled !== false,
      is_required_for_coverage: is_required_for_coverage !== false,
      is_system_generated: true, is_active: true,
    });
  }
  // Bulk create in batches of 25
  const BATCH = 25;
  for (let i = 0; i < newTargetRecords.length; i += BATCH) {
    await base44.asServiceRole.entities.HelpTarget.bulkCreate(newTargetRecords.slice(i, i + BATCH));
  }
  stats.targets.created = newTargetRecords.length;

  // ─── 5. HELP CONTENTS ────────────────────────────────────────────────────
  const allTargets = await base44.asServiceRole.entities.HelpTarget.list();
  const existingContents = await base44.asServiceRole.entities.HelpContent.list();
  const existingContentTargetCodes = new Set(existingContents.map(c => c.help_target_code));

  const newContents = [];
  for (const target of allTargets) {
    if (!target.is_active) continue;
    if (existingContentTargetCodes.has(target.target_code)) { stats.contents.skipped++; continue; }
    const generated = generateContent(target);
    newContents.push({
      help_target_id: target.id, help_target_code: target.target_code,
      module_code: target.module_code || null, page_code: target.page_code || null,
      content_source_type: "system_generated", content_status: "draft",
      version_no: 1, language_code: "en", ...generated,
      role_visibility: target.role_scope || "all", source_confidence_score: 0.7,
      is_primary: true, is_active: true, review_required: true,
      approved_by: null, approved_at: null, last_updated_by: null, view_count: 0,
    });
  }
  for (let i = 0; i < newContents.length; i += BATCH) {
    await base44.asServiceRole.entities.HelpContent.bulkCreate(newContents.slice(i, i + BATCH));
  }
  stats.contents.created = newContents.length;

  // ─── 6. MANUAL TOPICS ────────────────────────────────────────────────────
  const existingTopics = await base44.asServiceRole.entities.HelpManualTopic.list();
  const existingTopicCodes = new Set(existingTopics.map(t => t.topic_code));
  const newTopics = MANUAL_TOPICS.filter(t => !existingTopicCodes.has(t.topic_code)).map(topic => ({
    ...topic, help_module_id: moduleByCode[topic.module_code]?.id || null,
  }));
  if (newTopics.length > 0) await base44.asServiceRole.entities.HelpManualTopic.bulkCreate(newTopics);
  stats.manual_topics.created = newTopics.length;
  stats.manual_topics.skipped = MANUAL_TOPICS.length - newTopics.length;

  // ─── 7. TOPIC TARGET MAPS ────────────────────────────────────────────────
  const allTopics = await base44.asServiceRole.entities.HelpManualTopic.list();
  const topicByCode = Object.fromEntries(allTopics.map(t => [t.topic_code, t]));
  const targetByCode = Object.fromEntries(allTargets.map(t => [t.target_code, t]));

  let existingMaps = [];
  try { existingMaps = await base44.asServiceRole.entities.HelpManualTopicTargetMap.list(); } catch (_) {}
  const existingMapKeys = new Set(existingMaps.map(m => `${m.help_manual_topic_id}__${m.help_target_id}`));

  const newMaps = [];
  for (const map of TOPIC_TARGET_MAPS) {
    const topic = topicByCode[map.topic_code];
    const target = targetByCode[map.target_code];
    if (!topic || !target) { stats.topic_maps.skipped++; continue; }
    if (existingMapKeys.has(`${topic.id}__${target.id}`)) { stats.topic_maps.skipped++; continue; }
    newMaps.push({ help_manual_topic_id: topic.id, topic_code: map.topic_code, help_target_id: target.id, target_code: map.target_code });
  }
  if (newMaps.length > 0) {
    try { await base44.asServiceRole.entities.HelpManualTopicTargetMap.bulkCreate(newMaps); stats.topic_maps.created = newMaps.length; }
    catch (_) { stats.topic_maps.skipped += newMaps.length; }
  }

  // ─── 8. AI TRAINING QUEUE ────────────────────────────────────────────────
  const allContents = await base44.asServiceRole.entities.HelpContent.list();
  const existingQueue = await base44.asServiceRole.entities.HelpAITrainingQueue.list();
  const queuedIds = new Set(existingQueue.map(q => q.source_entity_id));

  const queueItems = [];
  for (const c of allContents) {
    if (queuedIds.has(c.id)) { stats.ai_queue.skipped++; continue; }
    queueItems.push({ source_entity_type: "HelpContent", source_entity_id: c.id, source_target_code: c.help_target_code, change_reason: "initial seed", queue_status: "queued", attempt_count: 0, queued_at: new Date().toISOString() });
  }
  const allTopicsFinal = await base44.asServiceRole.entities.HelpManualTopic.list();
  for (const t of allTopicsFinal) {
    if (!t.is_published) continue;
    if (queuedIds.has(t.id)) { stats.ai_queue.skipped++; continue; }
    queueItems.push({ source_entity_type: "HelpManualTopic", source_entity_id: t.id, source_target_code: null, change_reason: "initial seed", queue_status: "queued", attempt_count: 0, queued_at: new Date().toISOString() });
  }
  for (let i = 0; i < queueItems.length; i += BATCH) {
    await base44.asServiceRole.entities.HelpAITrainingQueue.bulkCreate(queueItems.slice(i, i + BATCH));
  }
  stats.ai_queue.created = queueItems.length;

  return Response.json({
    success: true,
    stats,
    totals: {
      modules: stats.modules.created + stats.modules.skipped,
      pages: stats.pages.created + stats.pages.skipped,
      sections: stats.sections.created + stats.sections.skipped,
      targets: stats.targets.created + stats.targets.skipped,
      contents: stats.contents.created + stats.contents.skipped,
      manual_topics: stats.manual_topics.created + stats.manual_topics.skipped,
      topic_maps: stats.topic_maps.created + stats.topic_maps.skipped,
      ai_queue: stats.ai_queue.created + stats.ai_queue.skipped,
    }
  });
});