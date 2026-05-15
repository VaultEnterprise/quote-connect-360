import { differenceInDays, isAfter, isBefore, isValid } from "date-fns";

const ACTIVE_WINDOW_DAYS = 30;

const READINESS_LABELS = {
  Draft: "Draft",
  Incomplete: "Incomplete",
  NeedsReview: "Needs Review",
  ReadyToPublish: "Ready to Publish",
  Active: "Active",
  Superseded: "Superseded",
  Archived: "Archived",
};

export function buildRatesHubData({
  rateTables = [],
  plans = [],
  assignments = [],
  masterGroups = [],
  tenants = [],
  scenarioPlans = [],
  quoteScenarios = [],
  employeeEnrollments = [],
  enrollmentWindows = [],
}) {
  const now = new Date();
  const planMap = indexById(plans);
  const masterGroupMap = indexById(masterGroups);
  const tenantMap = indexById(tenants);
  const assignmentsByRate = assignments.reduce((acc, item) => {
    acc[item.rate_table_id] = acc[item.rate_table_id] || [];
    acc[item.rate_table_id].push(item);
    return acc;
  }, {});
  const scenarioUsageByPlan = scenarioPlans.reduce((acc, item) => {
    acc[item.rate_table_id] = acc[item.rate_table_id] || [];
    acc[item.rate_table_id].push(item);
    return acc;
  }, {});
  const enrollmentUsageByPlan = employeeEnrollments.reduce((acc, item) => {
    if (!item.selected_plan_id) return acc;
    acc[item.selected_plan_id] = acc[item.selected_plan_id] || [];
    return acc;
  }, {});

  const rows = rateTables.map((rate) => {
    const linkedPlan = planMap[rate.plan_id] || null;
    const linkedAssignments = assignmentsByRate[rate.id] || [];
    const effectiveDate = rate.effective_date ? new Date(rate.effective_date) : null;
    const endDate = rate.end_date ? new Date(rate.end_date) : null;
    const hasValidEffectiveDate = effectiveDate && isValid(effectiveDate);
    const hasValidEndDate = !endDate || isValid(endDate);
    const hasInvalidDateWindow = !!(hasValidEffectiveDate && hasValidEndDate && endDate && endDate < effectiveDate);
    const futureEffective = !!(hasValidEffectiveDate && isAfter(effectiveDate, now));
    const expired = !!(hasValidEndDate && endDate && isBefore(endDate, now));
    const expiringSoon = !!(hasValidEndDate && endDate && differenceInDays(endDate, now) >= 0 && differenceInDays(endDate, now) <= ACTIVE_WINDOW_DAYS);
    const activeNow = !!(hasValidEffectiveDate && !futureEffective && !expired);
    const hasTierData = rate.rate_type === "age_banded"
      ? Array.isArray(rate.age_banded_rates) && rate.age_banded_rates.length > 0
      : [rate.ee_rate, rate.es_rate, rate.ec_rate, rate.fam_rate].some((value) => value === 0 || !!value);
    const linkedPlanInactive = linkedPlan && linkedPlan.status !== "active";
    const assignmentSummary = summarizeAssignments(linkedAssignments, masterGroupMap, tenantMap);
    const quoteUsageCount = (scenarioUsageByPlan[rate.id] || []).length;
    const enrollmentUsageCount = enrollmentUsageByPlan[rate.plan_id]?.length || 0;
    const missingAssignments = assignmentSummary.totalAssignments === 0;
    const missingContributionLinkage = quoteUsageCount > 0 && !rate.contribution_model_id;
    const issueList = [];

    if (!rate.effective_date) issueList.push("Missing effective date");
    if (!rate.rate_type) issueList.push("Missing rate model");
    if (!rate.plan_id) issueList.push("Missing linked plan");
    if (!hasTierData) issueList.push("Missing tier definitions");
    if (hasInvalidDateWindow) issueList.push("Invalid effective date window");
    if (linkedPlanInactive) issueList.push("Linked plan inactive");
    if (missingAssignments) issueList.push("Missing assignments");
    if (missingContributionLinkage) issueList.push("Missing contribution linkage");
    if (quoteUsageCount > 0 && !hasTierData) issueList.push("Quote use without readiness");
    if (expiringSoon) issueList.push("Expiring soon");

    let readinessStatus = READINESS_LABELS.Draft;
    if (rate.status === "archived") readinessStatus = READINESS_LABELS.Archived;
    else if (rate.status === "superseded") readinessStatus = READINESS_LABELS.Superseded;
    else if (activeNow && issueList.length === 0) readinessStatus = READINESS_LABELS.Active;
    else if (!rate.effective_date || !rate.rate_type || !hasTierData || hasInvalidDateWindow || !rate.plan_id || missingAssignments) readinessStatus = READINESS_LABELS.Incomplete;
    else if (issueList.length > 0) readinessStatus = READINESS_LABELS.NeedsReview;
    else if (futureEffective) readinessStatus = READINESS_LABELS.ReadyToPublish;

    const scopeType = assignmentSummary.scopeType;

    return {
      ...rate,
      linkedPlan,
      linkedPlanName: linkedPlan?.plan_name || "Unlinked",
      planType: linkedPlan?.plan_type || "unknown",
      carrier: linkedPlan?.carrier || "Unknown",
      assignmentSummary,
      masterGroupCount: assignmentSummary.masterGroupCount,
      tenantAssignmentCount: assignmentSummary.tenantCount,
      scopeType,
      quoteUsageCount,
      enrollmentUsageCount,
      downstreamDependencyExists: quoteUsageCount > 0 || enrollmentUsageCount > 0,
      issueList,
      issueCount: issueList.length,
      readinessStatus,
      activeNow,
      futureEffective,
      expired,
      expiringSoon,
      missingAssignments,
      missingContributionLinkage,
      missingTiers: !hasTierData,
      invalidDates: hasInvalidDateWindow,
      linkedPlanInactive,
      versionStatus: futureEffective ? "future" : activeNow ? "current" : expired ? "expired" : "draft",
      coverageTierSummary: rate.rate_type === "age_banded" ? `${rate.age_banded_rates?.length || 0} age rows` : buildCompositeTierSummary(rate),
      contributionLinkageStatus: rate.contribution_model_id ? "linked" : "missing",
      quoteUsageStatus: quoteUsageCount > 0 ? "in_use" : "none",
      enrollmentUsageStatus: enrollmentUsageCount > 0 ? "in_use" : "none",
      readinessScore: Math.max(0, 100 - (issueList.length * 15) - (futureEffective ? 5 : 0)),
    };
  });

  const summary = {
    totalRateSets: rows.length,
    activeRateSets: rows.filter((row) => row.readinessStatus === READINESS_LABELS.Active).length,
    draftRateSets: rows.filter((row) => row.readinessStatus === READINESS_LABELS.Draft).length,
    futureEffectiveRateSets: rows.filter((row) => row.futureEffective).length,
    ratesNeedingReview: rows.filter((row) => row.readinessStatus === READINESS_LABELS.NeedsReview).length,
    incompleteRateSets: rows.filter((row) => row.readinessStatus === READINESS_LABELS.Incomplete).length,
    expiringSoonRateSets: rows.filter((row) => row.expiringSoon).length,
    ratesInActiveQuoteUse: rows.filter((row) => row.quoteUsageCount > 0).length,
    ratesWithMissingAssignments: rows.filter((row) => row.missingAssignments).length,
    ratesWithMissingContributionLinkage: rows.filter((row) => row.missingContributionLinkage).length,
  };

  const issues = [
    makeIssue("Missing tier definitions", "high", rows.filter((row) => row.missingTiers)),
    makeIssue("Missing contribution linkage", "medium", rows.filter((row) => row.missingContributionLinkage)),
    makeIssue("Invalid effective date windows", "high", rows.filter((row) => row.invalidDates)),
    makeIssue("Linked inactive plans", "medium", rows.filter((row) => row.linkedPlanInactive)),
    makeIssue("Missing assignments", "high", rows.filter((row) => row.missingAssignments)),
    makeIssue("Rates in quote use but not readiness-complete", "critical", rows.filter((row) => row.quoteUsageCount > 0 && [READINESS_LABELS.Incomplete, READINESS_LABELS.NeedsReview].includes(row.readinessStatus))),
    makeIssue("Rates expiring soon", "medium", rows.filter((row) => row.expiringSoon)),
    makeIssue("Broken downstream references", "critical", rows.filter((row) => row.downstreamDependencyExists && !row.linkedPlan)),
  ].filter((issue) => issue.count > 0);

  return { rows, summary, issues, masterGroupMap, tenantMap, enrollmentWindows, quoteScenarios };
}

function indexById(items = []) {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

function summarizeAssignments(assignments = [], masterGroupMap, tenantMap) {
  const masterGroupIds = [...new Set(assignments.map((item) => item.master_group_id).filter(Boolean))];
  const tenantIds = [...new Set(assignments.map((item) => item.tenant_id).filter(Boolean))];
  const hasGlobal = assignments.some((item) => item.assignment_type === "global");
  return {
    totalAssignments: assignments.length,
    hasGlobal,
    masterGroupCount: masterGroupIds.length,
    tenantCount: tenantIds.length,
    masterGroups: masterGroupIds.map((id) => masterGroupMap[id]?.name).filter(Boolean),
    tenants: tenantIds.map((id) => tenantMap[id]?.name).filter(Boolean),
    scopeType: hasGlobal ? "global" : tenantIds.length > 0 ? "tenant" : masterGroupIds.length > 0 ? "master_group" : "unassigned",
  };
}

function buildCompositeTierSummary(rate) {
  const count = [rate.ee_rate, rate.es_rate, rate.ec_rate, rate.fam_rate].filter((value) => value === 0 || !!value).length;
  return `${count} composite tiers`;
}

function makeIssue(title, severity, rows) {
  return {
    title,
    severity,
    count: rows.length,
    rows,
  };
}

export function applyRateCardFilter(key, setFilters) {
  const reset = {
    readinessStatus: "all",
    expiringSoon: false,
    futureEffective: false,
    quoteUsage: "all",
    missingAssignments: false,
    missingContributionLinkage: false,
  };

  if (key === "total") return setFilters((prev) => ({ ...prev, ...reset }));
  if (key === "active") return setFilters((prev) => ({ ...prev, ...reset, readinessStatus: "Active" }));
  if (key === "draft") return setFilters((prev) => ({ ...prev, ...reset, readinessStatus: "Draft" }));
  if (key === "future") return setFilters((prev) => ({ ...prev, ...reset, futureEffective: true }));
  if (key === "review") return setFilters((prev) => ({ ...prev, ...reset, readinessStatus: "NeedsReview" }));
  if (key === "incomplete") return setFilters((prev) => ({ ...prev, ...reset, readinessStatus: "Incomplete" }));
  if (key === "expiring") return setFilters((prev) => ({ ...prev, ...reset, expiringSoon: true }));
  if (key === "quotes") return setFilters((prev) => ({ ...prev, ...reset, quoteUsage: "in_use" }));
  if (key === "assignments") return setFilters((prev) => ({ ...prev, ...reset, missingAssignments: true }));
  if (key === "contributions") return setFilters((prev) => ({ ...prev, ...reset, missingContributionLinkage: true }));
}

export function getRateActionAvailability(row) {
  return {
    canArchive: !row.downstreamDependencyExists,
    archiveReason: row.downstreamDependencyExists ? "Blocked because this rate set is already used downstream." : "",
    canActivate: row.futureEffective && !row.invalidDates,
    activateReason: row.futureEffective ? (row.invalidDates ? "Fix date conflicts before activation." : "") : "Only future-effective versions can be activated.",
    canAssign: row.status !== "archived",
    assignReason: row.status === "archived" ? "Archived rate sets cannot be assigned." : "",
    canCompare: true,
    canClone: true,
    canExport: true,
  };
}