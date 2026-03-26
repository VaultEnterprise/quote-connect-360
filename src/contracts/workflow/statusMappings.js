export const CASE_STAGE_GROUPS = [
  { key: "draft", label: "Draft", color: "#94a3b8", bgClass: "bg-slate-100", textClass: "text-slate-600", match: (stage) => stage === "draft" },
  { key: "census", label: "Census", color: "#60a5fa", bgClass: "bg-blue-100", textClass: "text-blue-700", match: (stage) => stage?.includes("census") },
  { key: "quoting", label: "Quoting", color: "#f59e0b", bgClass: "bg-amber-100", textClass: "text-amber-700", match: (stage) => ["ready_for_quote", "quoting"].includes(stage) },
  { key: "proposal", label: "Proposal", color: "#a78bfa", bgClass: "bg-purple-100", textClass: "text-purple-700", match: (stage) => ["proposal_ready", "employer_review"].includes(stage) },
  { key: "enrollment", label: "Enrollment", color: "#34d399", bgClass: "bg-emerald-100", textClass: "text-emerald-700", match: (stage) => stage?.includes("enrollment") },
  { key: "active", label: "Active", color: "#10b981", bgClass: "bg-green-100", textClass: "text-green-700", match: (stage) => ["install_in_progress", "active", "renewal_pending"].includes(stage) },
];

export const STATUS_MAPPINGS = {
  caseStageGroups: CASE_STAGE_GROUPS,
};