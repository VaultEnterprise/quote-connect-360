import { validateWritePayload } from "@/validation/appContracts";
import { ROUTE_PARAM_SCHEMAS } from "@/contracts/routes/routeParamSchemas";
import { resolveRouteContext } from "@/lib/routing/resolveRouteContext";

export function validateRouteParams(routeKey, params = {}) {
  const schema = ROUTE_PARAM_SCHEMAS[routeKey];
  if (!schema) throw new Error(`Unknown route contract: ${routeKey}`);
  return validateWritePayload(params, schema.queryKeys || [], `${routeKey} route params`);
}

export function validateRouteSearch(routeKey, search) {
  return resolveRouteContext(routeKey, search);
}

export function assertRouteContract(routeKey) {
  if (!ROUTE_PARAM_SCHEMAS[routeKey]) throw new Error(`Missing route contract: ${routeKey}`);
  return true;
}