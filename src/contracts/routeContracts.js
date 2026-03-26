import { validateWritePayload } from "@/validation/appContracts";

export const ROUTE_CONTEXT_KEYS = ["caseId", "employerId", "employeeId", "taskId", "exceptionId", "renewalId"];

export const ROUTE_CONTRACTS = {
  caseDetail: { path: ({ caseId }) => `/cases/${caseId}`, queryKeys: [] },
  census: { path: () => "/census", queryKeys: ["caseId", "employerId"] },
  quotes: { path: () => "/quotes", queryKeys: ["caseId", "employerId"] },
  proposals: { path: () => "/proposals", queryKeys: ["caseId", "employerId"] },
  enrollment: { path: () => "/enrollment", queryKeys: ["caseId", "employerId"] },
  employers: { path: () => "/employers", queryKeys: ["employerId", "caseId"] },
  employeeManagement: { path: () => "/employee-management", queryKeys: ["caseId", "employerId", "employeeId"] },
  tasks: { path: () => "/tasks", queryKeys: ["caseId", "taskId"] },
  exceptions: { path: () => "/exceptions", queryKeys: ["caseId", "exceptionId"] },
  renewals: { path: () => "/renewals", queryKeys: ["caseId", "employerId", "renewalId"] },
};

export function getCaseRouteContext(caseData) {
  return {
    caseId: caseData?.id || undefined,
    employerId: caseData?.employer_group_id || undefined,
  };
}

export function getRouteContext(search = window.location.search) {
  const params = new URLSearchParams(search);
  return ROUTE_CONTEXT_KEYS.reduce((accumulator, key) => {
    const value = params.get(key);
    if (value) accumulator[key] = value;
    return accumulator;
  }, {});
}

export function buildRoute(routeKey, params = {}) {
  const contract = ROUTE_CONTRACTS[routeKey];
  if (!contract) throw new Error(`Unknown route contract: ${routeKey}`);

  const validatedParams = validateWritePayload(params, ROUTE_CONTEXT_KEYS, `${routeKey} route params`);
  const query = new URLSearchParams();

  contract.queryKeys.forEach((key) => {
    if (validatedParams[key]) query.set(key, validatedParams[key]);
  });

  const path = contract.path(validatedParams);
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}