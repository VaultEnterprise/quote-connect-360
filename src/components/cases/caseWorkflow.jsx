export const CASE_STAGE_ORDER = [
  "draft",
  "census_in_progress",
  "census_validated",
  "ready_for_quote",
  "quoting",
  "proposal_ready",
  "employer_review",
  "approved_for_enrollment",
  "enrollment_open",
  "enrollment_complete",
  "install_in_progress",
  "active",
  "renewal_pending",
  "renewed",
  "closed",
];

export const CASE_STAGE_LABELS = {
  draft: "Draft",
  census_in_progress: "Census In Progress",
  census_validated: "Census Validated",
  ready_for_quote: "TxQuote",
  quoting: "Quoting",
  proposal_ready: "Proposal Ready",
  employer_review: "Employer Review",
  approved_for_enrollment: "Approved for Enrollment",
  enrollment_open: "Enrollment Open",
  enrollment_complete: "Enrollment Complete",
  install_in_progress: "Install In Progress",
  active: "Active",
  renewal_pending: "Renewal Pending",
  renewed: "Renewed",
  closed: "Closed",
};

export const CASE_PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export const CASE_BULK_STAGE_OPTIONS = CASE_STAGE_ORDER.filter((stage) => !["renewed"].includes(stage));

export function getCaseStageLabel(stage) {
  return CASE_STAGE_LABELS[stage] || stage?.replace(/_/g, " ") || "Unknown";
}

export function getCaseStageIndex(stage) {
  return CASE_STAGE_ORDER.indexOf(stage);
}

export function getNextCaseStage(stage) {
  const currentIndex = getCaseStageIndex(stage);
  if (currentIndex < 0 || currentIndex >= CASE_STAGE_ORDER.length - 1) return null;
  return CASE_STAGE_ORDER[currentIndex + 1];
}

export function getCaseWorkflowSignals({ caseData, censusVersions = [], scenarios = [], enrollmentWindows = [], tasks = [], renewals = [], exceptions = [] }) {
  const latestEnrollment = enrollmentWindows[0];
  const latestRenewal = renewals[0];
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
  const overdueTasks = openTasks.filter((task) => task.due_date && new Date(task.due_date) < new Date());
  const urgentTasks = openTasks.filter((task) => task.priority === "urgent");
  const blockedTasks = openTasks.filter((task) => task.status === "blocked");
  const openExceptions = exceptions.filter((item) => !["resolved", "dismissed"].includes(item.status));
  const criticalExceptions = openExceptions.filter((item) => item.severity === "critical");
  const validatedCensus = censusVersions.some((version) => version.status === "validated");
  const censusIssues = censusVersions.filter((version) => ["has_issues"].includes(version.status));
  const completedQuotes = scenarios.filter((scenario) => scenario.status === "completed");
  const erroredQuotes = scenarios.filter((scenario) => scenario.status === "error");
  const expiringQuotes = scenarios.filter((scenario) => scenario.expires_at && new Date(scenario.expires_at) < new Date());
  const enrollmentActive = latestEnrollment && ["open", "closing_soon"].includes(latestEnrollment.status);
  const enrollmentBlocked = latestEnrollment && ["closed"].includes(latestEnrollment.status) && caseData?.stage !== "active";
  const renewalAtRisk = latestRenewal && latestRenewal.renewal_date && new Date(latestRenewal.renewal_date) < new Date() && latestRenewal.status !== "completed";
  const staleDays = caseData?.last_activity_date ? Math.floor((Date.now() - new Date(caseData.last_activity_date).getTime()) / 86400000) : null;

  return {
    openTasks,
    overdueTasks,
    urgentTasks,
    blockedTasks,
    openExceptions,
    criticalExceptions,
    validatedCensus,
    censusIssues,
    completedQuotes,
    erroredQuotes,
    expiringQuotes,
    latestEnrollment,
    enrollmentActive,
    enrollmentBlocked,
    latestRenewal,
    renewalAtRisk,
    staleDays,
    slaRisk: overdueTasks.length > 0 || criticalExceptions.length > 0 || renewalAtRisk || (staleDays !== null && staleDays > 7),
  };
}

export function getStageRequirements(nextStage, context) {
  const {
    caseData,
    validatedCensus,
    completedQuotes,
    latestEnrollment,
    openTasks,
    criticalExceptions,
  } = context;

  const requirementsByStage = {
    census_in_progress: [
      { label: "Effective date is set", met: !!caseData?.effective_date },
    ],
    census_validated: [
      { label: "Census uploaded and validated", met: validatedCensus },
    ],
    ready_for_quote: [
      { label: "Census validated", met: validatedCensus },
    ],
    quoting: [
      { label: "Census validated", met: validatedCensus },
    ],
    proposal_ready: [
      { label: "At least one completed quote scenario exists", met: completedQuotes.length > 0 },
    ],
    employer_review: [
      { label: "At least one completed quote scenario exists", met: completedQuotes.length > 0 },
    ],
    approved_for_enrollment: [
      { label: "No critical exceptions remain open", met: criticalExceptions.length === 0 },
    ],
    enrollment_open: [
      { label: "Enrollment window exists", met: !!latestEnrollment },
    ],
    enrollment_complete: [
      { label: "Enrollment window has been finalized or closed", met: !!latestEnrollment && ["closed", "finalized"].includes(latestEnrollment.status) },
    ],
    install_in_progress: [
      { label: "Enrollment completed", met: caseData?.enrollment_status === "completed" || (!!latestEnrollment && latestEnrollment.status === "finalized") },
    ],
    active: [
      { label: "No open operational tasks remain", met: openTasks.length === 0 },
    ],
    renewal_pending: [
      { label: "Case is active before entering renewal flow", met: caseData?.stage === "active" || caseData?.stage === "install_in_progress" },
    ],
    renewed: [
      { label: "Renewal workflow completed", met: caseData?.stage === "renewal_pending" },
    ],
    closed: [
      { label: "No open operational tasks remain", met: openTasks.length === 0 },
      { label: "No critical exceptions remain open", met: criticalExceptions.length === 0 },
    ],
  };

  return requirementsByStage[nextStage] || [];
}

export function canBulkMoveCase(currentStage, targetStage) {
  const currentIndex = getCaseStageIndex(currentStage);
  const targetIndex = getCaseStageIndex(targetStage);
  if (currentIndex < 0 || targetIndex < 0) return false;
  if (currentStage === targetStage) return false;
  return Math.abs(targetIndex - currentIndex) <= 1 || targetStage === "closed";
}