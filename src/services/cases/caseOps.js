import { base44 } from "@/api/base44Client";
import { createValidatedEntityRecord, updateValidatedEntityRecord } from "@/services/entities/validatedEntityWrites";

export const CASE_TRANSITIONS = {
  draft: ["census_in_progress", "closed"],
  census_in_progress: ["census_validated", "closed"],
  census_validated: ["ready_for_quote", "closed"],
  ready_for_quote: ["quoting", "closed"],
  quoting: ["proposal_ready", "closed"],
  proposal_ready: ["employer_review", "closed"],
  employer_review: ["approved_for_enrollment", "closed"],
  approved_for_enrollment: ["enrollment_open", "closed"],
  enrollment_open: ["enrollment_complete", "closed"],
  enrollment_complete: ["install_in_progress", "closed"],
  install_in_progress: ["active", "closed"],
  active: ["renewal_pending", "closed"],
  renewal_pending: ["renewed", "closed"],
  renewed: ["closed"],
  closed: ["draft"],
};

export async function validateCaseRecord(caseRecord, context = {}) {
  const results = [];
  const add = (severity, code, message, fieldCode = "", details = {}) => {
    results.push({
      case_id: caseRecord.id,
      severity,
      code,
      field_code: fieldCode,
      message,
      details_json: details,
      created_at: new Date().toISOString(),
    });
  };

  if (!caseRecord.employer_name?.trim()) add("error", "EMPLOYER_NAME_REQUIRED", "Employer name is required.", "employer_name");
  if (!caseRecord.case_type) add("error", "CASE_TYPE_REQUIRED", "Case type is required.", "case_type");
  if (!caseRecord.priority) add("error", "PRIORITY_REQUIRED", "Priority is required.", "priority");
  if (!caseRecord.agency_id) add("warning", "AGENCY_MISSING", "This case is not linked to an agency.", "agency_id");
  if (!caseRecord.employer_group_id) add("warning", "EMPLOYER_GROUP_MISSING", "This case is not linked to an employer group.", "employer_group_id");
  if (["census_in_progress", "census_validated", "ready_for_quote", "quoting", "proposal_ready", "employer_review", "approved_for_enrollment", "enrollment_open", "enrollment_complete", "install_in_progress", "active"].includes(caseRecord.stage) && !caseRecord.effective_date) {
    add("error", "EFFECTIVE_DATE_REQUIRED", "Effective date is required for this case stage.", "effective_date");
  }
  if (caseRecord.target_close_date && caseRecord.effective_date && new Date(caseRecord.target_close_date) > new Date(caseRecord.effective_date)) {
    add("warning", "TARGET_CLOSE_AFTER_EFFECTIVE", "Target close date is after the effective date.", "target_close_date");
  }
  if (["proposal_ready", "employer_review", "approved_for_enrollment"].includes(caseRecord.stage) && context.quoteCount === 0) {
    add("error", "QUOTE_REQUIRED", "At least one quote scenario is required before this stage.", "quote_status");
  }
  if (caseRecord.stage === "closed" && !caseRecord.closed_reason) {
    add("error", "CLOSE_REASON_REQUIRED", "A close reason is required before the case can be closed.", "closed_reason");
  }
  if (caseRecord.stage === "closed" && !caseRecord.resolution_summary && !caseRecord.notes) {
    add("warning", "RESOLUTION_SUMMARY_RECOMMENDED", "Add a resolution summary or notes before closing the case.", "resolution_summary");
  }
  return results;
}

export async function replaceCaseValidationResults(caseRecord, context = {}) {
  const existing = await base44.entities.CaseValidationResult.filter({ case_id: caseRecord.id }, "-created_date", 200);
  await Promise.all(existing.map((item) => base44.entities.CaseValidationResult.delete(item.id)));
  const nextResults = await validateCaseRecord(caseRecord, context);
  if (nextResults.length) {
    await Promise.all(nextResults.map((item) => createValidatedEntityRecord("CaseValidationResult", item, ["case_id", "severity", "code", "message"])));
  }
  return nextResults;
}

export async function createCaseAuditEvent(caseId, eventType, eventSummary, eventDetailsJson = {}) {
  const me = await base44.auth.me();
  await createValidatedEntityRecord("CaseAuditEvent", {
    case_id: caseId,
    event_type: eventType,
    actor_user_id: me?.id || "",
    actor_email: me?.email || "",
    actor_type: "user",
    event_time: new Date().toISOString(),
    event_summary: eventSummary,
    event_details_json: eventDetailsJson,
  }, ["case_id", "event_type", "event_time", "event_summary"]);

  await createValidatedEntityRecord("ActivityLog", {
    case_id: caseId,
    actor_email: me?.email || "",
    actor_name: me?.full_name || me?.email || "System",
    action: eventSummary,
    detail: eventDetailsJson?.detail || "",
    old_value: eventDetailsJson?.old_value || "",
    new_value: eventDetailsJson?.new_value || "",
    entity_type: eventDetailsJson?.entity_type || "BenefitCase",
    entity_id: eventDetailsJson?.entity_id || caseId,
  }, ["case_id", "action"]);
}

export function isTransitionAllowed(fromStage, toStage) {
  return (CASE_TRANSITIONS[fromStage] || []).includes(toStage);
}

export async function transitionCase(caseRecord, toStage, options = {}) {
  if (!isTransitionAllowed(caseRecord.stage, toStage)) {
    throw new Error("The selected action is blocked by the current case status.");
  }

  const context = options.context || {};
  if (toStage === "closed") {
    if (!options.reason) throw new Error("The case could not be closed because a close reason is required.");
    if (context.openTaskCount > 0) throw new Error("The case could not be closed because open tasks still exist.");
  }

  const nextPayload = {
    stage: toStage,
    last_activity_date: new Date().toISOString(),
  };

  if (toStage === "closed") {
    nextPayload.closed_reason = options.reason;
    nextPayload.closed_date = new Date().toISOString().split("T")[0];
    nextPayload.closed_by = options.actorEmail || "";
    nextPayload.resolution_summary = options.resolutionSummary || caseRecord.resolution_summary || "";
  }

  if (options.reason && toStage !== "closed") {
    nextPayload.notes = options.reason;
  }

  const updated = await updateValidatedEntityRecord("BenefitCase", caseRecord.id, nextPayload);
  const me = await base44.auth.me();

  await createValidatedEntityRecord("CaseStatusHistory", {
    case_id: caseRecord.id,
    from_status: caseRecord.stage,
    to_status: toStage,
    changed_by_user_id: me?.id || "",
    changed_by_email: me?.email || "",
    changed_at: new Date().toISOString(),
    reason: options.reason || "",
    details_json: { resolution_summary: options.resolutionSummary || "" },
  }, ["case_id", "to_status", "changed_at"]);

  await createCaseAuditEvent(caseRecord.id, "status_transition", `Case moved to ${toStage.replace(/_/g, " ")}`, {
    detail: options.reason || "",
    old_value: caseRecord.stage,
    new_value: toStage,
  });

  return updated;
}

export async function assignCase(caseRecord, assignedUser, assignmentReason = "") {
  const me = await base44.auth.me();
  const nextAssignedEmail = assignedUser?.email || "";
  const updated = await updateValidatedEntityRecord("BenefitCase", caseRecord.id, {
    assigned_to: nextAssignedEmail,
    last_activity_date: new Date().toISOString(),
  });

  const activeAssignments = await base44.entities.CaseAssignment.filter({ case_id: caseRecord.id, is_active: true }, "-created_date", 50);
  await Promise.all(activeAssignments.map((item) => updateValidatedEntityRecord("CaseAssignment", item.id, { is_active: false, unassigned_at: new Date().toISOString() })));

  await createValidatedEntityRecord("CaseAssignment", {
    case_id: caseRecord.id,
    assigned_user_id: assignedUser?.id || "",
    assigned_user_email: nextAssignedEmail,
    assigned_by_user_id: me?.id || "",
    assigned_by_email: me?.email || "",
    assigned_at: new Date().toISOString(),
    assignment_reason: assignmentReason,
    is_active: true,
  }, ["case_id", "assigned_at"]);

  await createCaseAuditEvent(caseRecord.id, "assignment", nextAssignedEmail ? "Assignment updated." : "Case unassigned.", {
    detail: assignmentReason,
    old_value: caseRecord.assigned_to || "",
    new_value: nextAssignedEmail,
  });

  return updated;
}

export async function addCaseNote(caseId, body, noteType = "note") {
  const me = await base44.auth.me();
  const note = await createValidatedEntityRecord("CaseNote", {
    case_id: caseId,
    tenant_id: "default",
    note_type: noteType,
    body,
    is_internal: true,
    created_by_user_id: me?.id || "",
    updated_at: new Date().toISOString(),
  }, ["case_id", "body"]);

  await createCaseAuditEvent(caseId, "note_added", "Note added.", {
    detail: body,
    entity_type: "CaseNote",
    entity_id: note.id,
  });

  return note;
}