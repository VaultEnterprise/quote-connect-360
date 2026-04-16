import { STAGE_ORDER, STAGE_LABELS, STAGE_OPTIONS } from "@/contracts/workflow/stageDefinitions";
import { CASE_STAGE_GROUPS } from "@/contracts/workflow/statusMappings";
import { getAllowedTransitions } from "@/lib/workflow/getAllowedTransitions";

export { STAGE_ORDER, STAGE_LABELS, STAGE_OPTIONS, CASE_STAGE_GROUPS };

export function getNextStage(stage) {
  const [nextStage] = getAllowedTransitions(stage);
  return nextStage || null;
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