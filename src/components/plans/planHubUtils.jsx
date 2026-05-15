import { differenceInDays, isAfter, isBefore } from "date-fns";
import { summarizeRatePlan } from "@/components/rates/rateGovernanceEngine";

export function buildPlanHubData({ plans = [], rateTables = [], scenarioPlans = [], quoteScenarios = [], employeeEnrollments = [], enrollments = [], proposals = [] }) {
  const rateTablesByPlan = rateTables.reduce((acc, table) => {
    acc[table.plan_id] = acc[table.plan_id] || [];
    acc[table.plan_id].push(table);
    return acc;
  }, {});

  const scenarioUsageByPlan = scenarioPlans.reduce((acc, item) => {
    acc[item.plan_id] = acc[item.plan_id] || [];
    acc[item.plan_id].push(item);
    return acc;
  }, {});

  const enrollmentUsageByPlan = employeeEnrollments.reduce((acc, item) => {
    if (!item.selected_plan_id) return acc;
    acc[item.selected_plan_id] = acc[item.selected_plan_id] || [];
    acc[item.selected_plan_id].push(item);
    return acc;
  }, {});

  const now = new Date();

  const enrichedPlans = plans.map((plan) => {
    const rates = rateTablesByPlan[plan.id] || [];
    const rateSummary = summarizeRatePlan(plan, rates);
    const quotesUsingPlan = scenarioUsageByPlan[plan.id] || [];
    const enrollmentsUsingPlan = enrollmentUsageByPlan[plan.id] || [];
    const futureRates = rates.filter((rate) => rate.effective_date && isAfter(new Date(rate.effective_date), now));
    const pastRates = rates.filter((rate) => rate.effective_date && isBefore(new Date(rate.effective_date), now));
    const activeRate = rateSummary.latest || null;
    const effectiveDate = plan.effective_date ? new Date(plan.effective_date) : null;
    const expiresSoon = effectiveDate ? differenceInDays(effectiveDate, now) >= 0 && differenceInDays(effectiveDate, now) <= 30 : false;
    const futureEffective = effectiveDate ? isAfter(effectiveDate, now) : false;

    const issues = [];
    if (!rateSummary.hasRates) issues.push("Missing rates");
    if (!plan.effective_date) issues.push("Missing effective date");
    if (!plan.state) issues.push("Missing state");
    if (!plan.plan_code) issues.push("Missing plan code");
    if (plan.plan_type === "medical" && !plan.network_type) issues.push("Missing network type");
    if ((quotesUsingPlan.length > 0 || enrollmentsUsingPlan.length > 0) && !rateSummary.hasRates) issues.push("Used downstream without rates");

    const readinessStatus = plan.status === "archived"
      ? "archived"
      : issues.length > 2
        ? "incomplete"
        : issues.length > 0
          ? "needs_review"
          : futureEffective
            ? "ready_to_publish"
            : "active";

    const readinessScore = Math.max(0, 100 - (issues.length * 20) - (futureEffective ? 5 : 0));

    return {
      ...plan,
      issues,
      readinessStatus,
      readinessScore,
      rateSummary,
      quotesUsingCount: quotesUsingPlan.length,
      enrollmentsUsingCount: enrollmentsUsingPlan.length,
      totalUsageCount: quotesUsingPlan.length + enrollmentsUsingPlan.length,
      futureRateCount: futureRates.length,
      historicalRateCount: pastRates.length,
      activeRate,
      hasActiveUsage: quotesUsingPlan.length > 0 || enrollmentsUsingPlan.length > 0,
      futureEffective,
      expiresSoon,
      versionLabel: futureRates.length > 0 ? "Future version available" : activeRate ? "Current version set" : "No version",
      contributionStatus: quotesUsingPlan.length > 0 ? "configured" : "not_linked",
      assignmentStatus: quotesUsingPlan.length > 0 || enrollmentsUsingPlan.length > 0 ? "assigned" : "unassigned",
      documentStatus: plan.notes ? "attached" : "missing",
      complianceStatus: plan.plan_type === "medical" ? (plan.hsa_eligible ? "hsa_ready" : "standard") : "not_applicable",
      updatedByLabel: plan.created_by || "System",
    };
  });

  const summary = {
    totalPlans: enrichedPlans.length,
    activePlans: enrichedPlans.filter((plan) => plan.status === "active").length,
    draftPlans: enrichedPlans.filter((plan) => plan.readinessStatus === "incomplete").length,
    needsReview: enrichedPlans.filter((plan) => plan.readinessStatus === "needs_review").length,
    missingRates: enrichedPlans.filter((plan) => !plan.rateSummary.hasRates).length,
    missingAssignments: enrichedPlans.filter((plan) => plan.assignmentStatus === "unassigned").length,
    missingDocuments: enrichedPlans.filter((plan) => plan.documentStatus === "missing").length,
    expiringSoon: enrichedPlans.filter((plan) => plan.expiresSoon).length,
    futureEffective: enrichedPlans.filter((plan) => plan.futureEffective).length,
  };

  return { enrichedPlans, summary };
}

export function exportPlansCSV(plans = []) {
  const headers = [
    "Plan Name",
    "Plan Type",
    "Carrier",
    "Status",
    "Readiness",
    "Effective Date",
    "Plan Code",
    "State",
    "Rate Status",
    "Usage Count",
    "Last Updated",
  ];

  const rows = plans.map((plan) => [
    plan.plan_name,
    plan.plan_type,
    plan.carrier,
    plan.status,
    plan.readinessStatus,
    plan.effective_date || "",
    plan.plan_code || "",
    plan.state || "",
    plan.rateSummary?.hasRates ? "Ready" : "Missing",
    plan.totalUsageCount || 0,
    plan.updated_date || plan.created_date || "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((value) => `"${value ?? ""}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plans-hub-export.csv";
  link.click();
  URL.revokeObjectURL(url);
}