import {
  buildCaseMetaById,
  buildEmployeeCountByCase,
  buildEmployeePreviewByCase,
} from "@/services/cases/casesDomain";

export function getCaseRelationshipMaps({
  censusMembers,
  quoteScenarios,
  proposals,
  caseTasks,
  exceptionItems,
  enrollmentWindows,
  documents,
}) {
  return {
    employeePreviewByCase: buildEmployeePreviewByCase(censusMembers || []),
    employeeCountByCase: buildEmployeeCountByCase(censusMembers || []),
    caseMetaById: buildCaseMetaById(
      quoteScenarios || [],
      proposals || [],
      caseTasks || [],
      exceptionItems || [],
      enrollmentWindows || [],
      documents || []
    ),
  };
}