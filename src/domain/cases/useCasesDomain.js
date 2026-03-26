import { filterCases, getCaseKpis } from "@/services/cases/casesDomain";
import { getCaseRelationshipMaps } from "@/domain/cases/useCaseRelationships";
import { buildCaseCardViewModels } from "@/domain/shared/buildViewModels";

export function getCasesPageModel({
  cases,
  censusMembers,
  currentUser,
  quoteScenarios,
  proposals,
  caseTasks,
  exceptionItems,
  enrollmentWindows,
  documents,
  filters,
}) {
  const relationshipMaps = getCaseRelationshipMaps({
    censusMembers,
    quoteScenarios,
    proposals,
    caseTasks,
    exceptionItems,
    enrollmentWindows,
    documents,
  });

  const filteredCases = filterCases(cases || [], filters || {}, currentUser);

  return {
    filteredCases,
    ...relationshipMaps,
    kpis: getCaseKpis(cases || []),
    caseCardViewModels: buildCaseCardViewModels(
      filteredCases,
      relationshipMaps.caseMetaById,
      relationshipMaps.employeePreviewByCase,
      relationshipMaps.employeeCountByCase
    ),
  };
}