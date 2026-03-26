import { buildRoute } from "@/lib/routing/buildRoute";

export const NAVIGATION_FLOW_SMOKE = [
  { source: "DashboardMetricGrid.activeCases", destination: "cases", params: { stageFilter: "active" } },
  { source: "DashboardMetricGrid.quotingCases", destination: "cases", params: { stageGroup: "quoting" } },
  { source: "DashboardMetricGrid.enrollmentOpen", destination: "cases", params: { stageFilter: "enrollment_open" } },
  { source: "DashboardMetricGrid.overdueTasks", destination: "tasks", params: {} },
  { source: "DashboardQuickActions.census", destination: "census", params: {} },
  { source: "DashboardQuickActions.enrollment", destination: "enrollment", params: {} },
  { source: "DashboardQuickActions.employers", destination: "employers", params: {} },
  { source: "DashboardQuickActions.quotes", destination: "quotes", params: {} },
  { source: "DashboardQuickActions.renewals", destination: "renewals", params: {} },
  { source: "CaseQuickLinks.case", destination: "caseDetail", params: { caseId: "example-case" } },
  { source: "CaseQuickLinks.census", destination: "census", params: { caseId: "example-case", employerId: "example-employer" } },
  { source: "CaseQuickLinks.quotes", destination: "quotes", params: { caseId: "example-case", employerId: "example-employer" } },
  { source: "CaseQuickLinks.proposals", destination: "proposals", params: { caseId: "example-case", employerId: "example-employer" } },
  { source: "CaseQuickLinks.enrollment", destination: "enrollment", params: { caseId: "example-case", employerId: "example-employer" } },
  { source: "CaseQuickLinks.employers", destination: "employers", params: { caseId: "example-case", employerId: "example-employer" } },
  { source: "CaseQuickLinks.employeeManagement", destination: "employeeManagement", params: { caseId: "example-case", employerId: "example-employer", employeeId: "example-employee" } },
  { source: "CaseQuickLinks.tasks", destination: "tasks", params: { caseId: "example-case", taskId: "example-task" } },
  { source: "CaseQuickLinks.exceptions", destination: "exceptions", params: { caseId: "example-case", exceptionId: "example-exception" } },
  { source: "CaseQuickLinks.renewals", destination: "renewals", params: { caseId: "example-case", employerId: "example-employer", renewalId: "example-renewal" } },
  { source: "Employers.caseLink", destination: "caseDetail", params: { caseId: "example-case" } },
];

export function assertNavigationFlowCoverage() {
  NAVIGATION_FLOW_SMOKE.forEach(({ source, destination, params }) => {
    const route = buildRoute(destination, params || {});
    if (!route || typeof route !== "string" || !route.startsWith("/")) {
      throw new Error(`Navigation flow invalid for ${source} -> ${destination}`);
    }
  });
  return NAVIGATION_FLOW_SMOKE;
}