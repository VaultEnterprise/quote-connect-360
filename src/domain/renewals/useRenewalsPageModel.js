import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteManyEntityRecords, updateManyValidatedEntityRecords } from "@/services/entities/validatedEntityWrites";

export default function useRenewalsPageModel({
  caseScope,
  employerScope,
  searchQuery,
  filterStatus,
  filterUrgency,
  filterAssignee,
  filterRateDirection,
  filterOverdue,
  sortBy,
  selectedIds,
  selectedRenewal,
}) {
  const queryClient = useQueryClient();

  const { data: renewals = [] } = useQuery({
    queryKey: ["renewals-all"],
    queryFn: () => base44.entities.RenewalCycle.list("-renewal_date", 100),
  });

  const { data: censusMembers = [] } = useQuery({
    queryKey: ["renewal-census", selectedRenewal?.case_id],
    queryFn: () =>
      selectedRenewal?.case_id
        ? base44.entities.CensusMember.filter({ case_id: selectedRenewal.case_id }, "-created_date", 500)
        : Promise.resolve([]),
    enabled: !!selectedRenewal?.case_id,
  });

  const invalidateRenewals = () => {
    queryClient.invalidateQueries({ queryKey: ["renewals-all"] });
  };

  const bulkStatusUpdate = useMutation({
    mutationFn: ({ ids, status }) =>
      updateManyValidatedEntityRecords(
        "RenewalCycle",
        ids.map((id) => ({
          id,
          payload: { status },
        }))
      ),
    onSuccess: invalidateRenewals,
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids) => deleteManyEntityRecords("RenewalCycle", ids),
    onSuccess: invalidateRenewals,
  });

  return useMemo(() => {
    const now = new Date();
    const uniqueAssignees = [...new Set(renewals.map((renewal) => renewal.assigned_to).filter(Boolean))].sort();

    const filtered = renewals.filter((renewal) => {
      if (caseScope && renewal.case_id !== caseScope) return false;
      if (employerScope && renewal.employer_group_id !== employerScope) return false;
      if (searchQuery && !renewal.employer_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus !== "all" && renewal.status !== filterStatus) return false;
      if (filterAssignee !== "all" && renewal.assigned_to !== filterAssignee) return false;

      if (filterOverdue) {
        const renewalDate = renewal.renewal_date ? new Date(renewal.renewal_date) : null;
        if (!renewalDate || renewalDate >= now || renewal.status === "completed") return false;
      } else if (filterUrgency !== "all" && renewal.renewal_date) {
        const daysUntil = Math.ceil((new Date(renewal.renewal_date) - now) / (1000 * 60 * 60 * 24));
        if (filterUrgency === "30" && daysUntil > 30) return false;
        if (filterUrgency === "60" && daysUntil > 60) return false;
        if (filterUrgency === "90" && daysUntil > 90) return false;
      }

      if (filterRateDirection !== "all") {
        if (filterRateDirection === "increases" && (!renewal.rate_change_percent || renewal.rate_change_percent <= 0)) return false;
        if (filterRateDirection === "decreases" && (!renewal.rate_change_percent || renewal.rate_change_percent >= 0)) return false;
        if (filterRateDirection === "flat" && renewal.rate_change_percent !== 0) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "employer") return (a.employer_name || "").localeCompare(b.employer_name || "");
      if (sortBy === "rate_change") return Math.abs(b.rate_change_percent || 0) - Math.abs(a.rate_change_percent || 0);
      if (sortBy === "disruption") return (b.disruption_score || 0) - (a.disruption_score || 0);
      if (sortBy === "premium") return (b.current_premium || 0) - (a.current_premium || 0);
      const aDate = a.renewal_date ? new Date(a.renewal_date) : new Date(8640000000000000);
      const bDate = b.renewal_date ? new Date(b.renewal_date) : new Date(8640000000000000);
      return aDate - bDate;
    });

    const activeFilterCount = [
      searchQuery,
      filterStatus !== "all",
      filterUrgency !== "all",
      filterAssignee !== "all",
      filterRateDirection !== "all",
      filterOverdue,
    ].filter(Boolean).length;

    return {
      renewals,
      filtered,
      sorted,
      censusMembers,
      uniqueAssignees,
      activeFilterCount,
      bulkStatusUpdate,
      bulkDelete,
      clearSelectionRecommended: !selectedIds.length,
    };
  }, [
    renewals,
    censusMembers,
    caseScope,
    employerScope,
    searchQuery,
    filterStatus,
    filterUrgency,
    filterAssignee,
    filterRateDirection,
    filterOverdue,
    sortBy,
    bulkStatusUpdate,
    bulkDelete,
    selectedIds.length,
  ]);
}