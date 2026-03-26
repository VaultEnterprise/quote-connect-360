export function getRouteContractKeys(schema = {}) {
  return [...new Set([...(schema.required || []), ...(schema.queryKeys || [])])];
}