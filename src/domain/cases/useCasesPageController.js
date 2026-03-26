import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCasesPageModel } from "@/domain/cases/useCasesDomain";
import { resolveRouteContext } from "@/lib/routing/resolveRouteContext";
import { exportToCSV } from "@/utils/export-import";
import { assertBlockingValidationGate } from "@/validation/blockingValidationGate";

export const DEFAULT_FILTER_STATE = {
  search: "",
  stageFilter: "all",
  typeFilter: "all",
  priorityFilter: "all",
  assignedToFilter: "all",
  sortBy: "created_desc",
  viewMode: "list",
  dateFilter: null,
  activityFilter: "all",
  employeeFilter: null,
  quickView: "all",
  stageGroup: "all",
};

export function useCasesPageController() {
  useMemo(() => {
    assertBlockingValidationGate({ pageKey: "Cases", routeKey: "cases" });
    return true;
  }, []);

  const queryClient = useQueryClient();
  const location = useLocation();
  const [filters, setFilters] = useState(DEFAULT_FILTER_STATE);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showStageAdvanceModal, setShowStageAdvanceModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showAssignDueDate, setShowAssignDueDate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: cases = [], isLoading } = useQuery({ queryKey: ["cases"], queryFn: () => base44.entities.BenefitCase.list("-created_date", 200) });
  const { data: censusMembers = [] } = useQuery({ queryKey: ["case-census-members"], queryFn: () => base44.entities.CensusMember.list("-created_date", 500) });
  const { data: currentUser } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: quoteScenarios = [] } = useQuery({ queryKey: ["cases-related", "quotes"], queryFn: () => base44.entities.QuoteScenario.list("-created_date", 500) });
  const { data: proposals = [] } = useQuery({ queryKey: ["cases-related", "proposals"], queryFn: () => base44.entities.Proposal.list("-created_date", 500) });
  const { data: caseTasks = [] } = useQuery({ queryKey: ["cases-related", "tasks"], queryFn: () => base44.entities.CaseTask.list("-created_date", 500) });
  const { data: exceptionItems = [] } = useQuery({ queryKey: ["cases-related", "exceptions"], queryFn: () => base44.entities.ExceptionItem.list("-created_date", 500) });
  const { data: enrollmentWindows = [] } = useQuery({ queryKey: ["cases-related", "enrollment-windows"], queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 300) });
  const { data: documents = [] } = useQuery({ queryKey: ["cases-related", "documents"], queryFn: () => base44.entities.Document.list("-created_date", 500) });

  const routeFilters = useMemo(() => resolveRouteContext("cases", location.search), [location.search]);

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      stageFilter: routeFilters.stageFilter || DEFAULT_FILTER_STATE.stageFilter,
      priorityFilter: routeFilters.priorityFilter || DEFAULT_FILTER_STATE.priorityFilter,
      quickView: routeFilters.quickView || DEFAULT_FILTER_STATE.quickView,
      stageGroup: routeFilters.stageGroup || DEFAULT_FILTER_STATE.stageGroup,
    }));
  }, [routeFilters]);

  const pageModel = useMemo(() => getCasesPageModel({
    cases,
    censusMembers,
    currentUser,
    quoteScenarios,
    proposals,
    caseTasks,
    exceptionItems,
    enrollmentWindows,
    documents,
    filters,
  }), [cases, censusMembers, currentUser, quoteScenarios, proposals, caseTasks, exceptionItems, enrollmentWindows, documents, filters]);

  const filtered = pageModel.filteredCases;
  const activeFilters = [filters.quickView, filters.stageFilter, filters.stageGroup, filters.typeFilter, filters.priorityFilter, filters.assignedToFilter, filters.dateFilter, filters.employeeFilter].filter((item) => item !== "all" && item !== null).length;

  const handleFilteredExport = () => exportToCSV(filtered, "filtered-cases.csv", ["id", "case_number", "employer_name", "case_type", "stage", "priority", "assigned_to", "effective_date", "target_close_date"]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "n" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setShowQuickCreate(true);
      }
      if (event.key === "e" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleFilteredExport();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filtered]);

  const setFilterState = (nextState) => setFilters((current) => ({ ...current, ...nextState }));
  const clearFilters = () => setFilters(DEFAULT_FILTER_STATE);
  const selectedCaseIds = Array.from(selectedIds);

  const toggleSelectAll = () => setSelectedIds((current) => current.size === filtered.length ? new Set() : new Set(filtered.map((item) => item.id)));
  const toggleSelect = (id) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleBulkExport = () => exportToCSV(
    filtered.filter((item) => selectedIds.has(item.id)),
    "cases-export.csv",
    ["id", "case_number", "employer_name", "case_type", "stage", "priority", "assigned_to", "effective_date"]
  );

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} case(s)? This cannot be undone.`)) return;
    setBulkAction("deleting");
    for (const id of selectedIds) {
      await base44.entities.BenefitCase.delete(id);
    }
    await queryClient.invalidateQueries({ queryKey: ["cases"] });
    setSelectedIds(new Set());
    setBulkAction(null);
  };

  const handleBulkSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cases"] });
    setSelectedIds(new Set());
  };

  const handleLoadPreset = (presetFilters) => setFilters((current) => ({ ...current, ...presetFilters, search: presetFilters.search || current.search }));

  return {
    isLoading,
    cases,
    currentUser,
    filters,
    activeFilters,
    filtered,
    bulkAction,
    selectedIds,
    selectedCaseIds,
    showAnalytics,
    showAssignModal,
    showStageModal,
    showPriorityModal,
    showStageAdvanceModal,
    showQuickCreate,
    showAssignDueDate,
    setFilterState,
    clearFilters,
    toggleSelectAll,
    toggleSelect,
    handleBulkExport,
    handleFilteredExport,
    handleBulkDelete,
    clearSelection: () => setSelectedIds(new Set()),
    handleBulkSuccess,
    handleLoadPreset,
    setShowAnalytics,
    setShowAssignModal,
    setShowStageModal,
    setShowPriorityModal,
    setShowStageAdvanceModal,
    setShowQuickCreate,
    setShowAssignDueDate,
    ...pageModel,
  };
}