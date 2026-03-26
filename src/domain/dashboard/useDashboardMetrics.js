import { buildDashboardOptions, getDateRangeWindow } from "@/utils/dashboardControls";
import {
  getDashboardCharts,
  getDashboardScopedData,
  getDashboardSummaryMetrics,
} from "@/services/dashboard/dashboardMetrics";

export function getDashboardPageModel({
  cases,
  tasks,
  enrollments,
  renewals,
  scenarios,
  exceptions,
  proposals,
  agencies,
  filters,
  user,
}) {
  const windowBounds = getDateRangeWindow(filters?.dateRange);
  const scopedData = getDashboardScopedData({
    cases: cases || [],
    tasks: tasks || [],
    enrollments: enrollments || [],
    renewals: renewals || [],
    scenarios: scenarios || [],
    exceptions: exceptions || [],
    proposals: proposals || [],
    filters,
    user,
    windowBounds,
  });

  return {
    options: buildDashboardOptions(cases || [], agencies || []),
    windowBounds,
    scopedData,
    summary: getDashboardSummaryMetrics(scopedData),
    charts: getDashboardCharts(scopedData.currentCases),
  };
}