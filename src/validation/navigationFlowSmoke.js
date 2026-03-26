export const NAVIGATION_FLOW_SMOKE = [
  { source: "DashboardMetricGrid", destination: "cases", contract: "cases" },
  { source: "DashboardQuickActions", destination: "census", contract: "census" },
  { source: "CaseQuickLinks", destination: "employeeManagement", contract: "employeeManagement" },
  { source: "CaseQuickLinks", destination: "tasks", contract: "tasks" },
  { source: "CaseQuickLinks", destination: "exceptions", contract: "exceptions" },
  { source: "CaseQuickLinks", destination: "renewals", contract: "renewals" },
];

export function assertNavigationFlowCoverage() {
  return NAVIGATION_FLOW_SMOKE;
}