import { validateWritePayload } from "@/validation/appContracts";
import { ROUTE_CONTEXT_KEYS, ROUTE_PARAM_SCHEMAS } from "@/contracts/routes/routeParamSchemas";

export function resolveRouteContext(routeKey, search = window.location.search) {
  const schema = ROUTE_PARAM_SCHEMAS[routeKey];
  if (!schema) throw new Error(`Unknown route contract: ${routeKey}`);

  const params = new URLSearchParams(search);
  const parsed = (schema.queryKeys || []).reduce((accumulator, key) => {
    const value = params.get(key);
    if (value) accumulator[key] = value;
    return accumulator;
  }, {});

  return validateWritePayload(parsed, schema.queryKeys || [], `${routeKey} route context`);
}

export function getSharedRouteContext(search = window.location.search) {
  const params = new URLSearchParams(search);
  return ROUTE_CONTEXT_KEYS.reduce((accumulator, key) => {
    const value = params.get(key);
    if (value) accumulator[key] = value;
    return accumulator;
  }, {});
}