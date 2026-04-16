import { differenceInDays, format, startOfMonth, subMonths } from "date-fns";
import { CASE_STAGE_GROUPS } from "@/contracts/workflowRegistry";
import { filterByWindow, filterCasesForDashboard, getComparisonMeta } from "@/utils/dashboardControls";

export function getDashboardScopedData({ cases, tasks, enrollments, renewals, scenarios, exceptions, proposals, filters, user, windowBounds }) {
  const caseDateValue = (item) => item.last_activity_date || item.updated_date || item.created_date || item.effective_date;
  const currentCases = filterCasesForDashboard(filterByWindow(cases, caseDateValue, windowBounds), filters, user);
  const previousCases = filterCasesForDashboard(filterByWindow(cases, caseDateValue, { start: windowBounds.previousStart, end: windowBounds.previousEnd }), filters, user);
  const currentCaseIds = new Set(currentCases.map((item) => item.id));
  const previousCaseIds = new Set(previousCases.map((item) => item.id));

  const scopeLinked = (items, getDateValue, currentIds, previousIds) => ({
    current: filterByWindow(items, getDateValue, windowBounds).filter((item) => !item.case_id || currentIds.has(item.case_id)),
    previous: filterByWindow(items, getDateValue, { start: windowBounds.previousStart, end: windowBounds.previousEnd }).filter((item) => !item.case_id || previousIds.has(item.case_id)),
  });

  const scopedTasks = scopeLinked(tasks, (item) => item.created_date || item.due_date, currentCaseIds, previousCaseIds);
  const scopedEnrollments = scopeLinked(enrollments, (item) => item.start_date || item.created_date, currentCaseIds, previousCaseIds);
  const scopedRenewals = scopeLinked(renewals, (item) => item.renewal_date || item.created_date, currentCaseIds, previousCaseIds);
  const scopedScenarios = scopeLinked(scenarios, (item) => item.created_date || item.quoted_at, currentCaseIds, previousCaseIds);
  const scopedExceptions = scopeLinked(exceptions, (item) => item.created_date || item.due_by, currentCaseIds, previousCaseIds);
  const scopedProposals = scopeLinked(proposals, (item) => item.created_date || item.sent_at, currentCaseIds, previousCaseIds);

  return {
    currentCases,
    previousCases,
    currentTasks: scopedTasks.current,
    previousTasks: scopedTasks.previous,
    currentEnrollments: scopedEnrollments.current,
    previousEnrollments: scopedEnrollments.previous,
    currentRenewals: scopedRenewals.current,
    previousRenewals: scopedRenewals.previous,
    currentScenarios: scopedScenarios.current,
    previousScenarios: scopedScenarios.previous,
    currentExceptions: scopedExceptions.current,
    previousExceptions: scopedExceptions.previous,
    currentProposals: scopedProposals.current,
    previousProposals: scopedProposals.previous,
  };
}

export function getDashboardSummaryMetrics(scopedData) {
  const activeCases = scopedData.currentCases.filter((item) => !["closed", "renewed"].includes(item.stage));
  const previousActiveCases = scopedData.previousCases.filter((item) => !["closed", "renewed"].includes(item.stage));
  const quotingCases = scopedData.currentCases.filter((item) => ["ready_for_quote", "quoting"].includes(item.stage));
  const previousQuotingCases = scopedData.previousCases.filter((item) => ["ready_for_quote", "quoting"].includes(item.stage));
  const enrollmentOpen = scopedData.currentEnrollments.filter((item) => ["open", "closing_soon"].includes(item.status));
  const previousEnrollmentOpen = scopedData.previousEnrollments.filter((item) => ["open", "closing_soon"].includes(item.status));
  const overdueTasks = scopedData.currentTasks.filter((item) => item.due_date && new Date(item.due_date) < new Date());
  const previousOverdueTasks = scopedData.previousTasks.filter((item) => item.due_date && new Date(item.due_date) < new Date());
  const openExceptions = scopedData.currentExceptions.filter((item) => !["resolved", "dismissed"].includes(item.status));
  const previousOpenExceptions = scopedData.previousExceptions.filter((item) => !["resolved", "dismissed"].includes(item.status));
  const totalPremium = scopedData.currentScenarios.filter((item) => item.status === "completed" && item.total_monthly_premium).reduce((sum, item) => sum + item.total_monthly_premium, 0);
  const previousTotalPremium = scopedData.previousScenarios.filter((item) => item.status === "completed" && item.total_monthly_premium).reduce((sum, item) => sum + item.total_monthly_premium, 0);

  return {
    activeCases,
    quotingCases,
    enrollmentOpen,
    overdueTasks,
    openExceptions,
    totalPremium,
    comparisons: {
      activeCases: getComparisonMeta(activeCases.length, previousActiveCases.length, true),
      quotingCases: getComparisonMeta(quotingCases.length, previousQuotingCases.length, true),
      enrollmentOpen: getComparisonMeta(enrollmentOpen.length, previousEnrollmentOpen.length, true),
      overdueTasks: getComparisonMeta(overdueTasks.length, previousOverdueTasks.length, false),
      totalPremium: getComparisonMeta(totalPremium, previousTotalPremium, true),
      openExceptions: getComparisonMeta(openExceptions.length, previousOpenExceptions.length, false),
    },
  };
}

export function getDashboardCharts(currentCases) {
  const pipelineData = CASE_STAGE_GROUPS.map((group) => ({
    name: group.label,
    count: currentCases.filter((item) => group.match(item.stage)).length,
    color: group.color,
  })).filter((group) => group.count > 0);

  const typeData = [
    { name: "New Business", value: currentCases.filter((item) => item.case_type === "new_business").length },
    { name: "Renewal", value: currentCases.filter((item) => item.case_type === "renewal").length },
    { name: "Mid-Year", value: currentCases.filter((item) => item.case_type === "mid_year_change").length },
    { name: "Takeover", value: currentCases.filter((item) => item.case_type === "takeover").length },
  ].filter((item) => item.value > 0);

  const monthlyData = [...Array(6)].map((_, index) => {
    const month = subMonths(new Date(), 5 - index);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(month, -1));

    return {
      name: format(month, "MMM"),
      cases: currentCases.filter((item) => {
        const date = new Date(item.created_date);
        return !Number.isNaN(date.getTime()) && date >= start && date < end;
      }).length,
    };
  });

  const upcomingRenewals = (renewals) => renewals.filter((item) => item.renewal_date && differenceInDays(new Date(item.renewal_date), new Date()) <= 90 && differenceInDays(new Date(item.renewal_date), new Date()) >= 0).length;

  return { pipelineData, typeData, monthlyData, upcomingRenewals };
}