import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateManyValidatedEntityRecords, updateValidatedEntityRecord } from "@/services/entities/validatedEntityWrites";

export default function useExceptionsPageModel({
  caseScope,
  search,
  severityFilter,
  categoryFilter,
  statusFilter,
  sortBy,
  showMyOnly,
  userEmail,
  selectedIds,
}) {
  const queryClient = useQueryClient();

  const { data: exceptions = [] } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.ExceptionItem.list("-created_date", 500),
  });

  const invalidateExceptions = () => {
    queryClient.invalidateQueries({ queryKey: ["exceptions"] });
  };

  const dismiss = useMutation({
    mutationFn: (id) => updateValidatedEntityRecord("ExceptionItem", id, { status: "dismissed" }),
    onSuccess: invalidateExceptions,
  });

  const assignToMe = useMutation({
    mutationFn: (id) => updateValidatedEntityRecord("ExceptionItem", id, { assigned_to: userEmail }),
    onSuccess: invalidateExceptions,
  });

  const bulkResolve = useMutation({
    mutationFn: () =>
      updateManyValidatedEntityRecords(
        "ExceptionItem",
        [...selectedIds].map((id) => ({
          id,
          payload: { status: "resolved", resolved_at: new Date().toISOString() },
        }))
      ),
    onSuccess: invalidateExceptions,
  });

  const bulkDismiss = useMutation({
    mutationFn: () =>
      updateManyValidatedEntityRecords(
        "ExceptionItem",
        [...selectedIds].map((id) => ({
          id,
          payload: { status: "dismissed" },
        }))
      ),
    onSuccess: invalidateExceptions,
  });

  const bulkAssign = useMutation({
    mutationFn: ({ ids, email }) =>
      updateManyValidatedEntityRecords(
        "ExceptionItem",
        ids.map((id) => ({
          id,
          payload: { assigned_to: email },
        }))
      ),
    onSuccess: invalidateExceptions,
  });

  return useMemo(() => {
    const filtered = exceptions.filter((exception) => {
      const matchesCase = !caseScope || exception.case_id === caseScope;
      const matchesSearch =
        !search ||
        exception.title?.toLowerCase().includes(search.toLowerCase()) ||
        exception.employer_name?.toLowerCase().includes(search.toLowerCase());
      const matchesSeverity = severityFilter === "all" || exception.severity === severityFilter;
      const matchesCategory = categoryFilter === "all" || exception.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && !["resolved", "dismissed"].includes(exception.status)) ||
        exception.status === statusFilter;
      const matchesMine = !showMyOnly || exception.assigned_to === userEmail;
      return matchesCase && matchesSearch && matchesSeverity && matchesCategory && matchesStatus && matchesMine;
    });

    const sorted = [...filtered];
    if (sortBy === "severity") {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      sorted.sort((a, b) => (order[a.severity] || 4) - (order[b.severity] || 4));
    } else if (sortBy === "due_date") {
      sorted.sort((a, b) => {
        if (!a.due_by) return 1;
        if (!b.due_by) return -1;
        return new Date(a.due_by) - new Date(b.due_by);
      });
    } else {
      sorted.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return {
      exceptions,
      sorted,
      openCount: exceptions.filter((exception) => !["resolved", "dismissed"].includes(exception.status)).length,
      dismiss,
      assignToMe,
      bulkResolve,
      bulkDismiss,
      bulkAssign,
    };
  }, [exceptions, caseScope, search, severityFilter, categoryFilter, statusFilter, showMyOnly, userEmail, sortBy, dismiss, assignToMe, bulkResolve, bulkDismiss, bulkAssign]);
}