import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast, isThisWeek, isToday, isTomorrow } from "date-fns";
import { deleteManyEntityRecords, updateManyValidatedEntityRecords, updateValidatedEntityRecord } from "@/services/entities/validatedEntityWrites";

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

function buildTaskGroups(filtered, groupBy) {
  if (groupBy === "priority") {
    const map = { urgent: [], high: [], normal: [], low: [] };
    filtered.forEach((task) => {
      const priority = task.priority || "normal";
      (map[priority] = map[priority] || []).push(task);
    });
    return [
      { key: "urgent", label: "Urgent", tasks: map.urgent, accent: "text-destructive" },
      { key: "high", label: "High Priority", tasks: map.high, accent: "text-orange-600" },
      { key: "normal", label: "Normal", tasks: map.normal, accent: "text-foreground" },
      { key: "low", label: "Low Priority", tasks: map.low, accent: "text-muted-foreground" },
    ].filter((group) => group.tasks.length > 0);
  }

  if (groupBy === "case") {
    const map = {};
    filtered.forEach((task) => {
      const key = task.employer_name || "No Case";
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return Object.entries(map)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([label, tasks]) => ({ key: label, label, tasks, accent: "text-foreground" }));
  }

  if (groupBy === "status") {
    const order = ["pending", "in_progress", "blocked", "completed", "cancelled"];
    const map = {};
    filtered.forEach((task) => {
      (map[task.status] = map[task.status] || []).push(task);
    });
    return order
      .filter((status) => map[status]?.length > 0)
      .map((status) => ({
        key: status,
        label: status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
        tasks: map[status],
        accent: "text-foreground",
      }));
  }

  const overdue = [];
  const today = [];
  const tomorrow = [];
  const thisWeek = [];
  const later = [];
  const noDue = [];

  filtered.forEach((task) => {
    if (!task.due_date) {
      noDue.push(task);
      return;
    }

    const dueDate = new Date(task.due_date);
    if (isPast(dueDate) && !isToday(dueDate) && task.status !== "completed") overdue.push(task);
    else if (isToday(dueDate)) today.push(task);
    else if (isTomorrow(dueDate)) tomorrow.push(task);
    else if (isThisWeek(dueDate, { weekStartsOn: 1 })) thisWeek.push(task);
    else later.push(task);
  });

  return [
    { key: "overdue", label: "Overdue", tasks: overdue, accent: "text-destructive" },
    { key: "today", label: "Today", tasks: today, accent: "text-orange-600" },
    { key: "tomorrow", label: "Tomorrow", tasks: tomorrow, accent: "text-amber-600" },
    { key: "thisWeek", label: "This Week", tasks: thisWeek, accent: "text-blue-600" },
    { key: "later", label: "Later", tasks: later, accent: "text-foreground" },
    { key: "noDue", label: "No Due Date", tasks: noDue, accent: "text-muted-foreground" },
  ].filter((group) => group.tasks.length > 0);
}

export default function useTasksPageModel({
  caseScope,
  search,
  statusFilter,
  priorityFilter,
  typeFilter,
  assigneeFilter,
  myTasksOnly,
  groupBy,
  selectedIds,
}) {
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks-all"],
    queryFn: () => base44.entities.CaseTask.list("-created_date", 200),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ["tasks-all"] });
    queryClient.invalidateQueries({ queryKey: ["tasks-pending"] });
  };

  const toggleStatus = useMutation({
    mutationFn: (task) => {
      const nextStatus = task.status === "completed" ? "pending" : task.status === "pending" ? "in_progress" : "completed";
      return updateValidatedEntityRecord("CaseTask", task.id, {
        status: nextStatus,
        completed_at: nextStatus === "completed" ? new Date().toISOString() : null,
      });
    },
    onSuccess: invalidateTasks,
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.CaseTask.delete(id),
    onSuccess: invalidateTasks,
  });

  const bulkComplete = useMutation({
    mutationFn: () =>
      updateManyValidatedEntityRecords(
        "CaseTask",
        selectedIds.map((id) => ({
          id,
          payload: { status: "completed", completed_at: new Date().toISOString() },
        }))
      ),
    onSuccess: invalidateTasks,
  });

  const bulkDelete = useMutation({
    mutationFn: () => deleteManyEntityRecords("CaseTask", selectedIds),
    onSuccess: invalidateTasks,
  });

  return useMemo(() => {
    const assignees = Array.from(new Set(tasks.map((task) => task.assigned_to).filter(Boolean))).sort();

    const filtered = tasks
      .filter((task) => {
        const matchesCase = !caseScope || task.case_id === caseScope;
        const matchesSearch =
          !search ||
          task.title?.toLowerCase().includes(search.toLowerCase()) ||
          task.employer_name?.toLowerCase().includes(search.toLowerCase()) ||
          task.assigned_to?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && !["completed", "cancelled"].includes(task.status)) ||
          task.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
        const matchesType = typeFilter === "all" || task.task_type === typeFilter;
        const matchesAssignee = assigneeFilter === "all" || task.assigned_to === assigneeFilter;
        const matchesMine = !myTasksOnly || (currentUser?.email && task.assigned_to === currentUser.email);
        return matchesCase && matchesSearch && matchesStatus && matchesPriority && matchesType && matchesAssignee && matchesMine;
      })
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));

    const activeTasks = tasks.filter((task) => !["completed", "cancelled"].includes(task.status));
    const overdueTasks = tasks.filter(
      (task) => task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== "completed"
    );
    const completedToday = tasks.filter(
      (task) => task.status === "completed" && task.completed_at && isToday(new Date(task.completed_at))
    );
    const dueTodayCount = tasks.filter((task) => task.due_date && isToday(new Date(task.due_date))).length;

    return {
      currentUser,
      tasks,
      cases,
      isLoading,
      assignees,
      filtered,
      groups: buildTaskGroups(filtered, groupBy),
      activeTasks,
      overdueTasks,
      completedToday,
      dueTodayCount,
      toggleStatus,
      deleteTask,
      bulkComplete,
      bulkDelete,
      lastGroupedAt: format(new Date(), "HH:mm"),
    };
  }, [
    tasks,
    cases,
    isLoading,
    caseScope,
    search,
    statusFilter,
    priorityFilter,
    typeFilter,
    assigneeFilter,
    myTasksOnly,
    currentUser,
    groupBy,
    toggleStatus,
    deleteTask,
    bulkComplete,
    bulkDelete,
  ]);
}