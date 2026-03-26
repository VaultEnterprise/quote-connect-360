export const ROUTE_CONTEXT_KEYS = [
  "caseId",
  "employerId",
  "employeeId",
  "taskId",
  "exceptionId",
  "renewalId",
  "stageFilter",
  "priorityFilter",
  "quickView",
  "stageGroup",
];

export const ROUTE_PARAM_SCHEMAS = {
  caseDetail: {
    path: ({ caseId }) => `/cases/${caseId}`,
    required: ["caseId"],
    queryKeys: [],
  },
  cases: {
    path: () => "/cases",
    required: [],
    queryKeys: ["stageFilter", "priorityFilter", "quickView", "stageGroup"],
  },
  census: {
    path: () => "/census",
    required: [],
    queryKeys: ["caseId", "employerId"],
  },
  quotes: {
    path: () => "/quotes",
    required: [],
    queryKeys: ["caseId", "employerId"],
  },
  proposals: {
    path: () => "/proposals",
    required: [],
    queryKeys: ["caseId", "employerId"],
  },
  enrollment: {
    path: () => "/enrollment",
    required: [],
    queryKeys: ["caseId", "employerId"],
  },
  employers: {
    path: () => "/employers",
    required: [],
    queryKeys: ["employerId", "caseId"],
  },
  employeeManagement: {
    path: () => "/employee-management",
    required: [],
    queryKeys: ["caseId", "employerId", "employeeId"],
  },
  tasks: {
    path: () => "/tasks",
    required: [],
    queryKeys: ["caseId", "taskId"],
  },
  exceptions: {
    path: () => "/exceptions",
    required: [],
    queryKeys: ["caseId", "exceptionId"],
  },
  renewals: {
    path: () => "/renewals",
    required: [],
    queryKeys: ["caseId", "employerId", "renewalId"],
  },
};