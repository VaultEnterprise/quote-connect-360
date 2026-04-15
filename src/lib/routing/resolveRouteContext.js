import { validateWritePayload } from "@/validation/appContracts";
import { ROUTE_CONTEXT_KEYS, ROUTE_PARAM_SCHEMAS } from "@/contracts/routes/routeParamSchemas";

function getSearchString(search) {
  if (typeof search === "string") return search;
  if (typeof window !== "undefined") return window.location.search;
  return "";
}

export function resolveRouteContext(routeKey, search) {
  const schema = ROUTE_PARAM_SCHEMAS[routeKey];
  if (!schema) throw new Error(`Unknown route contract: ${routeKey}`);

  const params = new URLSearchParams(getSearchString(search));
  const parsed = (schema.queryKeys || []).reduce((accumulator, key) => {
    const queryKey = routeKey === "employerPortal" && key === "employerId" ? "employer_id" : key;
    const value = params.get(queryKey);
    if (value) accumulator[key] = value;
    return accumulator;
  }, {});

  return validateWritePayload(parsed, schema.queryKeys || [], `${routeKey} route context`);
}

export function getSharedRouteContext(search) {
  const params = new URLSearchParams(getSearchString(search));
  return ROUTE_CONTEXT_KEYS.reduce((accumulator, key) => {
    const value = params.get(key);
    if (value) accumulator[key] = value;
    return accumulator;
  }, {});
}