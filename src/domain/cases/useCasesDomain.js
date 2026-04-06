import { filterCases, getCaseKpis } from "@/services/cases/casesDomain";
import { getCaseRelationshipMaps } from "@/domain/cases/useCaseRelationships";

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
  };
}