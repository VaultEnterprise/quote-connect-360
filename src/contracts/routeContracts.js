import { ROUTE_PARAM_SCHEMAS, ROUTE_CONTEXT_KEYS } from "@/contracts/routes/routeParamSchemas";
import { buildRoute } from "@/lib/routing/buildRoute";
import { getSharedRouteContext } from "@/lib/routing/resolveRouteContext";

export const ROUTE_CONTRACTS = ROUTE_PARAM_SCHEMAS;
export { buildRoute, ROUTE_CONTEXT_KEYS };

export function getCaseRouteContext(caseData) {
  return {
    caseId: caseData?.id || undefined,
    employerId: caseData?.employer_group_id || undefined,
  };
}

export function getRouteContext(search = window.location.search) {
  return getSharedRouteContext(search);
}