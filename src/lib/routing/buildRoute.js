import { validateWritePayload } from "@/validation/appContracts";
import { ROUTE_CONTEXT_KEYS, ROUTE_PARAM_SCHEMAS } from "@/contracts/routes/routeParamSchemas";

export function buildRoute(routeKey, params = {}) {
  const schema = ROUTE_PARAM_SCHEMAS[routeKey];
  if (!schema) throw new Error(`Unknown route contract: ${routeKey}`);

  const validatedParams = validateWritePayload(
    params,
    ROUTE_CONTEXT_KEYS,
    `${routeKey} route params`,
    schema.required || []
  );

  const path = schema.path(validatedParams);
  const query = new URLSearchParams();

  (schema.queryKeys || []).forEach((key) => {
    if (validatedParams[key]) query.set(key, validatedParams[key]);
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}