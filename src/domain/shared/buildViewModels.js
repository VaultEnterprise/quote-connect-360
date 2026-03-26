import { assertCaseCardViewModels } from "@/validation/viewModelValidator";

export function buildCaseCardViewModels(cases, caseMetaById, employeePreviewByCase, employeeCountByCase) {
  const viewModels = (cases || []).map((item) => ({
    id: item.id,
    caseId: item.id,
    employerId: item.employer_group_id || "",
    employerName: item.employer_name || "Unnamed Employer",
    caseNumber: item.case_number || "",
    stage: item.stage || "draft",
    priority: item.priority || "normal",
    effectiveDate: item.effective_date || "",
    employeeCount: employeeCountByCase[item.id] || 0,
    employeePreview: employeePreviewByCase[item.id] || [],
    meta: caseMetaById[item.id] || {
      quoteCount: 0,
      proposalCount: 0,
      taskCount: 0,
      openTaskCount: 0,
      exceptionCount: 0,
      documentCount: 0,
      enrollmentCount: 0,
    },
    record: item,
  }));

  assertCaseCardViewModels(viewModels);
  return viewModels;
}