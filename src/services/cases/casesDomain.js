import { CASE_STAGE_GROUPS } from "@/contracts/workflowRegistry";

export const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest First" },
  { value: "created_asc", label: "Oldest First" },
  { value: "employer_asc", label: "Employer A–Z" },
  { value: "priority", label: "Priority" },
  { value: "effective", label: "Effective Date" },
];

export const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export function filterCases(cases, filters, currentUser) {
  const filtered = cases.filter((item) => {
    const searchTerm = filters.search?.toLowerCase() || "";
    const matchSearch = !searchTerm || item.employer_name?.toLowerCase().includes(searchTerm) || item.case_number?.toLowerCase().includes(searchTerm) || item.assigned_to?.toLowerCase().includes(searchTerm);
    const matchStage = filters.stageFilter === "all" || item.stage === filters.stageFilter;
    const matchType = filters.typeFilter === "all" || item.case_type === filters.typeFilter;
    const matchPriority = filters.priorityFilter === "all" || item.priority === filters.priorityFilter;
    const matchAssignee = filters.assignedToFilter === "all" ? true : filters.assignedToFilter === "unassigned" ? !item.assigned_to : item.assigned_to === filters.assignedToFilter;
    const matchDate = !filters.dateFilter || (item.effective_date && new Date(item.effective_date) >= filters.dateFilter.start && new Date(item.effective_date) <= filters.dateFilter.end);
    const matchActivity = filters.activityFilter === "all" || (filters.activityFilter === "none" ? !item.last_activity_date : item.last_activity_date);
    const matchEmployee = !filters.employeeFilter || (item.employee_count && item.employee_count >= filters.employeeFilter.min && item.employee_count <= filters.employeeFilter.max);
    const daysSinceActivity = item.last_activity_date ? (Date.now() - new Date(item.last_activity_date).getTime()) / 86400000 : null;
    const daysUntilEffective = item.effective_date ? Math.ceil((new Date(item.effective_date).getTime() - Date.now()) / 86400000) : null;
    const matchQuickView =
      filters.quickView === "all" ||
      (filters.quickView === "my_cases" && currentUser?.email && item.assigned_to === currentUser.email) ||
      (filters.quickView === "unassigned" && !item.assigned_to) ||
      (filters.quickView === "stalled" && daysSinceActivity !== null && daysSinceActivity > 7 && !["active", "closed"].includes(item.stage)) ||
      (filters.quickView === "ready_for_quote" && item.stage === "ready_for_quote") ||
      (filters.quickView === "employer_review" && item.stage === "employer_review") ||
      (filters.quickView === "enrollment_open" && item.stage === "enrollment_open") ||
      (filters.quickView === "renewals" && (item.case_type === "renewal" || (daysUntilEffective !== null && daysUntilEffective >= 0 && daysUntilEffective <= 60)));
    const stageGroup = CASE_STAGE_GROUPS.find((group) => group.key === filters.stageGroup);
    const matchStageGroup = filters.stageGroup === "all" || !filters.stageGroup ? true : stageGroup?.match(item.stage);

    return matchSearch && matchStage && matchType && matchPriority && matchAssignee && matchDate && matchActivity && matchEmployee && matchQuickView && matchStageGroup;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sortBy === "created_asc") return new Date(a.created_date) - new Date(b.created_date);
    if (filters.sortBy === "created_desc") return new Date(b.created_date) - new Date(a.created_date);
    if (filters.sortBy === "employer_asc") return (a.employer_name || "").localeCompare(b.employer_name || "");
    if (filters.sortBy === "priority") return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    if (filters.sortBy === "effective") return new Date(a.effective_date || 0) - new Date(b.effective_date || 0);
    return 0;
  });
}

export function buildEmployeePreviewByCase(censusMembers) {
  return censusMembers.reduce((accumulator, member) => {
    if (!member.case_id) return accumulator;
    if (!accumulator[member.case_id]) accumulator[member.case_id] = [];
    if (accumulator[member.case_id].length < 4) accumulator[member.case_id].push(member);
    return accumulator;
  }, {});
}

export function buildEmployeeCountByCase(censusMembers) {
  return censusMembers.reduce((accumulator, member) => {
    if (!member.case_id) return accumulator;
    accumulator[member.case_id] = (accumulator[member.case_id] || 0) + 1;
    return accumulator;
  }, {});
}

export function buildCaseMetaById(quoteScenarios, proposals, caseTasks, exceptionItems, enrollmentWindows, documents) {
  const meta = {};
  const ensure = (caseId) => {
    if (!caseId) return null;
    if (!meta[caseId]) {
      meta[caseId] = {
        quoteCount: 0,
        proposalCount: 0,
        taskCount: 0,
        openTaskCount: 0,
        exceptionCount: 0,
        documentCount: 0,
        enrollmentCount: 0,
      };
    }
    return meta[caseId];
  };

  quoteScenarios.forEach((item) => { const entry = ensure(item.case_id); if (entry) entry.quoteCount += 1; });
  proposals.forEach((item) => { const entry = ensure(item.case_id); if (entry) entry.proposalCount += 1; });
  caseTasks.forEach((item) => {
    const entry = ensure(item.case_id);
    if (!entry) return;
    entry.taskCount += 1;
    if (!["completed", "cancelled"].includes(item.status)) entry.openTaskCount += 1;
  });
  exceptionItems.forEach((item) => {
    const entry = ensure(item.case_id);
    if (entry && !["resolved", "dismissed"].includes(item.status)) entry.exceptionCount += 1;
  });
  enrollmentWindows.forEach((item) => { const entry = ensure(item.case_id); if (entry) entry.enrollmentCount += 1; });
  documents.forEach((item) => { const entry = ensure(item.case_id); if (entry) entry.documentCount += 1; });

  return meta;
}

export function getCaseKpis(cases) {
  return {
    urgentCount: cases.filter((item) => item.priority === "urgent").length,
    activeCount: cases.filter((item) => item.stage === "active").length,
    stalledCount: cases.filter((item) => {
      if (!item.last_activity_date) return false;
      const days = (Date.now() - new Date(item.last_activity_date).getTime()) / 86400000;
      return days > 7 && item.stage !== "active" && item.stage !== "closed";
    }).length,
    enrollOpen: cases.filter((item) => item.stage === "enrollment_open").length,
  };
}