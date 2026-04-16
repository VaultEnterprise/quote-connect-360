import React, { useCallback, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Layers, Flag, Download, Trash2, Calendar, Briefcase } from "lucide-react";
import { useLocation } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { CaseListSkeleton } from "@/components/shared/LoadingSkeleton";
import CasePipelineView from "@/components/cases/CasePipelineView";
import BulkActionsBar from "@/components/shared/BulkActionsBar";
import BulkAssignModal from "@/components/cases/BulkAssignModal";
import BulkStageModal from "@/components/cases/BulkStageModal";
import BulkPriorityModal from "@/components/cases/BulkPriorityModal";
import BulkStageAdvanceModal from "@/components/cases/BulkStageAdvanceModal";
import QuickCreateCaseModal from "@/components/cases/QuickCreateCaseModal";
import BulkAssignWithDueDate from "@/components/cases/BulkAssignWithDueDate";
import KPITrendsPanel from "@/components/cases/KPITrendsPanel";
import CycleTimeAnalytics from "@/components/cases/CycleTimeAnalytics";
import TeamWorkloadHeatmap from "@/components/cases/TeamWorkloadHeatmap";
import RiskAlerts from "@/components/cases/RiskAlerts";
import AgingReport from "@/components/cases/AgingReport";
import RevenueForecast from "@/components/cases/RevenueForecast";
import RenewalPipelineView from "@/components/cases/RenewalPipelineView";
import ActivityFeed from "@/components/cases/ActivityFeed";
import CasesToolbar from "@/components/cases/CasesToolbar";
import CasesSummaryBar from "@/components/cases/CasesSummaryBar";
import CasesList from "@/components/cases/CasesList";
import { getCasesPageModel } from "@/domain/cases/useCasesDomain";
import { resolveRouteContext } from "@/lib/routing/resolveRouteContext";
import { exportToCSV } from "@/utils/export-import";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

const DEFAULT_FILTER_STATE = {
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

export default function Cases() {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const listScoped = (entity, sort, limit = 200) =>
    currentUser?.role === "admin"
      ? base44.entities[entity].list(sort, limit)
      : base44.entities[entity].filter({ assigned_to: currentUser?.email }, sort, limit);

  const { data: cases = [], isLoading } = useQuery({ queryKey: ["cases", currentUser?.email, currentUser?.role], enabled: !!currentUser, queryFn: () => listScoped("BenefitCase", "-created_date", 200) });
  const { data: censusMembers = [] } = useQuery({ queryKey: ["case-census-members"], queryFn: () => base44.entities.CensusMember.list("-created_date", 200) });
  const { data: quoteScenarios = [] } = useQuery({ queryKey: ["cases-related", "quotes", currentUser?.email, currentUser?.role], enabled: !!currentUser, queryFn: () => listScoped("QuoteScenario", "-created_date", 200) });
  const { data: proposals = [] } = useQuery({ queryKey: ["cases-related", "proposals", currentUser?.email, currentUser?.role], enabled: !!currentUser, queryFn: () => listScoped("Proposal", "-created_date", 200) });
  const { data: caseTasks = [] } = useQuery({ queryKey: ["cases-related", "tasks", currentUser?.email, currentUser?.role], enabled: !!currentUser, queryFn: () => currentUser?.role === "admin" ? base44.entities.CaseTask.list("-created_date", 200) : base44.entities.CaseTask.filter({ assigned_to: currentUser?.email }, "-created_date", 200) });
  const { data: exceptionItems = [] } = useQuery({ queryKey: ["cases-related", "exceptions", currentUser?.email, currentUser?.role], enabled: !!currentUser, queryFn: () => listScoped("ExceptionItem", "-created_date", 200) });
  const { data: enrollmentWindows = [] } = useQuery({ queryKey: ["cases-related", "enrollment-windows", currentUser?.email, currentUser?.role], enabled: !!currentUser, queryFn: () => listScoped("EnrollmentWindow", "-created_date", 300) });
  const { data: documents = [] } = useQuery({ queryKey: ["cases-related", "documents"], queryFn: () => base44.entities.Document.list("-created_date", 200) });

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

  const casePageModel = useMemo(() => getCasesPageModel({
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

  const filtered = casePageModel.filteredCases;
  const employeePreviewByCase = casePageModel.employeePreviewByCase;
  const employeeCountByCase = casePageModel.employeeCountByCase;
  const caseMetaById = casePageModel.caseMetaById;
  const kpis = casePageModel.kpis;

  const activeFilters = [filters.quickView, filters.stageFilter, filters.stageGroup, filters.typeFilter, filters.priorityFilter, filters.assignedToFilter, filters.dateFilter, filters.employeeFilter].filter((item) => item !== "all" && item !== null).length;
  const clearFilters = () => setFilters(DEFAULT_FILTER_STATE);
  const setFilterState = (nextState) => setFilters((current) => ({ ...current, ...nextState }));

  const toggleSelectAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map((item) => item.id)));
  const toggleSelect = (id) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleBulkExport = useCallback(() => exportToCSV(filtered.filter((item) => selectedIds.has(item.id)), "cases-export.csv", ["id", "case_number", "employer_name", "case_type", "stage", "priority", "assigned_to", "effective_date"]), [filtered, selectedIds]);
  const handleFilteredExport = useCallback(() => exportToCSV(filtered, "filtered-cases.csv", ["id", "case_number", "employer_name", "case_type", "stage", "priority", "assigned_to", "effective_date", "target_close_date"]), [filtered]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "n" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); setShowQuickCreate(true); }
      if (event.key === "e" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); handleFilteredExport(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFilteredExport]);

  const handleBulkDelete = async () => {
    setBulkAction("deleting");
    for (const id of selectedIds) await base44.entities.BenefitCase.delete(id);
    await queryClient.invalidateQueries({ queryKey: ["cases"] });
    setSelectedIds(new Set());
    setBulkAction(null);
    setShowDeleteConfirm(false);
  };

  const handleBulkSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["cases"] });
    setSelectedIds(new Set());
  };

  const handleLoadPreset = (presetFilters) => setFilters((current) => ({ ...current, ...presetFilters, search: presetFilters.search || current.search }));

  return (
    <div className="space-y-5">
      <PageHeader title="Cases" description={`${cases.length} total benefit cases`} />

      {showAnalytics && cases.length > 0 && (
        <div className="space-y-3">
          <KPITrendsPanel cases={filtered} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><CycleTimeAnalytics cases={filtered} /><RiskAlerts cases={filtered} /><TeamWorkloadHeatmap cases={filtered} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><RevenueForecast cases={filtered} /><RenewalPipelineView cases={filtered} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><AgingReport cases={filtered} /><ActivityFeed cases={filtered} /></div>
        </div>
      )}

      {cases.length > 0 && <CasesSummaryBar kpis={kpis} onStageFilter={(value) => setFilterState({ stageFilter: value })} onPriorityFilter={(value) => setFilterState({ priorityFilter: value })} />}

      <CasesToolbar
        state={filters}
        cases={cases}
        currentUser={currentUser}
        filteredCount={filtered.length}
        totalCount={cases.length}
        activeFilters={activeFilters}
        setState={setFilterState}
        clearFilters={clearFilters}
        onExport={handleFilteredExport}
        onToggleAnalytics={() => setShowAnalytics((current) => !current)}
        showAnalytics={showAnalytics}
        onQuickCreate={() => setShowQuickCreate(true)}
        onLoadPreset={handleLoadPreset}
      />

      {isLoading ? (
        <CaseListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No cases found" description={filters.search || activeFilters > 0 ? "Try adjusting your filters" : "Create your first benefit case to get started"} actionLabel={!filters.search && activeFilters === 0 ? "Create Case" : undefined} onAction={!filters.search && activeFilters === 0 ? () => window.location.href = "/cases/new" : undefined} />
      ) : filters.viewMode === "pipeline" ? (
        <CasePipelineView cases={filtered} />
      ) : (
        <CasesList
          cases={filtered}
          selectedIds={selectedIds}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelect={toggleSelect}
          employeePreviewByCase={employeePreviewByCase}
          employeeCountByCase={employeeCountByCase}
          caseMetaById={caseMetaById}
        />
      )}

      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          totalCount={filtered.length}
          allSelected={selectedIds.size === filtered.length}
          onSelectAll={toggleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            { label: "Assign", icon: Users, onClick: () => setShowAssignModal(true) },
            { label: "Stage", icon: Layers, onClick: () => setShowStageModal(true) },
            { label: "Priority", icon: Flag, onClick: () => setShowPriorityModal(true) },
            { label: "Advance Stage", icon: Layers, onClick: () => setShowStageAdvanceModal(true) },
            { label: "Assign + Due Date", icon: Calendar, onClick: () => setShowAssignDueDate(true) },
            { label: "Export", icon: Download, onClick: handleBulkExport },
            { label: "Delete", icon: Trash2, variant: "destructive", onClick: () => {
              if (currentUser?.role !== "admin") return;
              setShowDeleteConfirm(true);
            } },
          ]}
        />
      )}

      <BulkAssignModal isOpen={showAssignModal} caseIds={Array.from(selectedIds)} onClose={() => setShowAssignModal(false)} onSuccess={handleBulkSuccess} />
      <BulkStageModal isOpen={showStageModal} caseIds={Array.from(selectedIds)} onClose={() => setShowStageModal(false)} onSuccess={handleBulkSuccess} />
      <BulkPriorityModal isOpen={showPriorityModal} caseIds={Array.from(selectedIds)} onClose={() => setShowPriorityModal(false)} onSuccess={handleBulkSuccess} />
      <BulkStageAdvanceModal isOpen={showStageAdvanceModal} caseIds={Array.from(selectedIds)} cases={cases} onClose={() => setShowStageAdvanceModal(false)} onSuccess={handleBulkSuccess} />
      <BulkAssignWithDueDate isOpen={showAssignDueDate} caseIds={Array.from(selectedIds)} onClose={() => setShowAssignDueDate(false)} onSuccess={handleBulkSuccess} />
      <QuickCreateCaseModal isOpen={showQuickCreate} onClose={() => setShowQuickCreate(false)} />
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={setShowDeleteConfirm}
        onConfirm={handleBulkDelete}
        title="Delete cases?"
        description={`Permanently delete ${selectedIds.size} selected case(s)? This cannot be undone.`}
        confirmLabel={bulkAction === "deleting" ? "Deleting..." : "Delete cases"}
        destructive
      />
    </div>
  );
}