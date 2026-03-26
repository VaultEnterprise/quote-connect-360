import { buildRoute } from "@/lib/routing/buildRoute";

export function buildDeepLinkSmokeMatrix() {
  return [
    { key: "dashboard", route: buildRoute("dashboard", { viewMode: "executive", dateRange: "last_30_days", stage: "quoting" }) },
    { key: "cases-stage", route: buildRoute("cases", { stageFilter: "active" }) },
    { key: "cases-group", route: buildRoute("cases", { stageGroup: "quoting" }) },
    { key: "census-case", route: buildRoute("census", { caseId: "example-case", employerId: "example-employer" }) },
    { key: "tasks-case", route: buildRoute("tasks", { caseId: "example-case", taskId: "example-task" }) },
    { key: "exceptions-case", route: buildRoute("exceptions", { caseId: "example-case", exceptionId: "example-exception" }) },
    { key: "renewals-case", route: buildRoute("renewals", { caseId: "example-case", employerId: "example-employer" }) },
  ];
}

export function assertDeepLinkSmokeCoverage() {
  const matrix = buildDeepLinkSmokeMatrix();
  matrix.forEach(({ key, route }) => {
    if (!route || typeof route !== "string" || !route.startsWith("/")) {
      throw new Error(`Deep link smoke generation failed for ${key}`);
    }
  });
  return matrix;
}