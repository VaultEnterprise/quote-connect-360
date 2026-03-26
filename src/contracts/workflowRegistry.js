export const STAGE_ORDER = [
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

export const STAGE_LABELS = {
  draft: "Draft",
  census_in_progress: "Census In Progress",
  census_validated: "Census Validated",
  ready_for_quote: "Ready for Quote",
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

export const STAGE_OPTIONS = [{ value: "all", label: "All Stages" }, ...STAGE_ORDER.map((value) => ({ value, label: STAGE_LABELS[value] }))];

export const CASE_STAGE_GROUPS = [
  { key: "draft", label: "Draft", color: "#94a3b8", match: (stage) => stage === "draft" },
  { key: "census", label: "Census", color: "#60a5fa", match: (stage) => stage?.includes("census") },
  { key: "quoting", label: "Quoting", color: "#f59e0b", match: (stage) => ["ready_for_quote", "quoting"].includes(stage) },
  { key: "proposal", label: "Proposal", color: "#a78bfa", match: (stage) => ["proposal_ready", "employer_review"].includes(stage) },
  { key: "enrollment", label: "Enrollment", color: "#34d399", match: (stage) => stage?.includes("enrollment") },
  { key: "active", label: "Active", color: "#10b981", match: (stage) => ["install_in_progress", "active", "renewal_pending"].includes(stage) },
];

export function getNextStage(stage) {
  const currentIndex = STAGE_ORDER.indexOf(stage || "draft");
  if (currentIndex < 0 || currentIndex >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[currentIndex + 1];
}

export function getNextStageLabel(stage) {
  const nextStage = getNextStage(stage);
  return nextStage ? STAGE_LABELS[nextStage] : null;
}

export function getCaseNextStep(caseData, meta = {}) {
  switch (caseData?.stage) {
    case "draft": return "Start census collection";
    case "census_in_progress": return "Validate the census";
    case "census_validated": return "Prepare the quote request";
    case "ready_for_quote": return "Launch quoting";
    case "quoting": return meta.quoteCount > 0 ? "Review quote scenarios" : "Create the first quote scenario";
    case "proposal_ready": return meta.proposalCount > 0 ? "Send the proposal" : "Build the proposal";
    case "employer_review": return "Follow up with the employer";
    case "approved_for_enrollment": return meta.enrollmentCount > 0 ? "Invite employees" : "Create the enrollment window";
    case "enrollment_open": return "Track elections and reminders";
    case "enrollment_complete": return "Finalize enrollment";
    case "install_in_progress": return "Complete carrier install";
    case "renewal_pending": return "Prepare the renewal strategy";
    case "active": return "Monitor tasks and renewal timing";
    default: return "Review the case details";
  }
}

export function getCaseBlocker(caseData, meta = {}) {
  if (!caseData?.effective_date) return "Missing effective date";
  if (["census_validated", "ready_for_quote", "quoting"].includes(caseData.stage) && caseData.census_status !== "validated") {
    return "Census is not validated";
  }
  if (["proposal_ready", "employer_review", "approved_for_enrollment"].includes(caseData.stage) && caseData.quote_status !== "completed" && !meta.quoteCount) {
    return "Quotes are not completed";
  }
  if (["approved_for_enrollment", "enrollment_open", "enrollment_complete", "install_in_progress"].includes(caseData.stage) && !meta.enrollmentCount) {
    return "Enrollment window has not been created";
  }
  if (meta.exceptionCount > 0) return `${meta.exceptionCount} open exception${meta.exceptionCount === 1 ? "" : "s"}`;
  if (meta.openTaskCount > 0) return `${meta.openTaskCount} open task${meta.openTaskCount === 1 ? "" : "s"}`;
  return null;
}