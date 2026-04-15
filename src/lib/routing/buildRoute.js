import { validateWritePayload } from "@/validation/appContracts";
import { ROUTE_PARAM_SCHEMAS } from "@/contracts/routes/routeParamSchemas";
import { getRouteContractKeys } from "@/lib/routing/getRouteContractKeys";

export function buildRoute(routeKey, params = {}) {
  const schema = ROUTE_PARAM_SCHEMAS[routeKey];
  if (!schema) throw new Error(`Unknown route contract: ${routeKey}`);

  const validatedParams = validateWritePayload(
    params,
    getRouteContractKeys(schema),
    `${routeKey} route params`,
    schema.required || []
  );

  const path = schema.path(validatedParams);
  const query = new URLSearchParams();

  (schema.queryKeys || []).forEach((key) => {
    if (!validatedParams[key]) return;
    const queryKey = routeKey === "employerPortal" && key === "employerId" ? "employer_id" : key;
    query.set(queryKey, validatedParams[key]);
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}