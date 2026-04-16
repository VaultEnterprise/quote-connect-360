import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase, Plus, Download, Trash2,
  Users, Layers, Flag, AlertTriangle, FileWarning, ShieldAlert, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { CaseListSkeleton } from "@/components/shared/LoadingSkeleton";
import CaseListCard from "@/components/cases/CaseListCard";
import CasePipelineView from "@/components/cases/CasePipelineView";
import BulkActionsBar from "@/components/shared/BulkActionsBar";
import BulkAssignModal from "@/components/cases/BulkAssignModal";
import BulkStageModal from "@/components/cases/BulkStageModal";
import BulkPriorityModal from "@/components/cases/BulkPriorityModal";
import ActiveFilterChips from "@/components/cases/ActiveFilterChips";
import CasesFilterBar from "@/components/cases/CasesFilterBar";
import BulkStageAdvanceModal from "@/components/cases/BulkStageAdvanceModal";
import CasesCommandCenter from "@/components/cases/CasesCommandCenter";
import CasesSystemSignals from "@/components/cases/CasesSystemSignals";
import CasesOperationalTable from "@/components/cases/CasesOperationalTable";
import { exportToCSV } from "@/utils/export-import";
import { CASE_PRIORITY_ORDER, getCaseWorkflowSignals } from "@/components/cases/caseWorkflow";
import { buildPlatformDependencyRegistry } from "@/components/platform/platformDependencyRegistry";
import { buildRateDependencySummary } from "@/components/rates/rateGovernanceEngine";

const STAGE_OPTIONS = [
  { value: "all",                      label: "All Stages" },
  { value: "draft",                    label: "Draft" },
  { value: "census_in_progress",       label: "Census In Progress" },
  { value: "census_validated",         label: "Census Validated" },
  { value: "ready_for_quote",          label: "Ready for Quote" },
  { value: "quoting",                  label: "Quoting" },
  { value: "proposal_ready",           label: "Proposal Ready" },
  { value: "employer_review",          label: "Employer Review" },
  { value: "approved_for_enrollment",  label: "Approved for Enrollment" },
  { value: "enrollment_open",          label: "Enrollment Open" },
  { value: "enrollment_complete",      label: "Enrollment Complete" },
  { value: "install_in_progress",      label: "Install In Progress" },
  { value: "active",                   label: "Active" },
  { value: "renewal_pending",          label: "Renewal Pending" },
  { value: "closed",                   label: "Closed" },
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest First" },
  { value: "created_asc",  label: "Oldest First" },
  { value: "employer_asc", label: "Employer A–Z" },
  { value: "priority",     label: "Priority" },
  { value: "effective",    label: "Effective Date" },
  { value: "sla_risk",     label: "SLA Risk" },
];

const OPERATIONAL_OPTIONS = [
  { value: "all", label: "All Operational" },
  { value: "open", label: "Open Cases" },
  { value: "sla_risk", label: "SLA Risk" },
  { value: "critical_blockers", label: "Critical Blockers" },
  { value: "stalled", label: "Stalled" },
  { value: "rate_gaps", label: "Rate Gaps" },
];

export default function Cases() {
  const queryClient = useQueryClient();
  const [search, setSearch]             = useState("");
  const [stageFilter, setStageFilter]   = useState("all");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [sortBy, setSortBy]             = useState("created_desc");
  const [viewMode, setViewMode]         = useState("list");
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [bulkAction, setBulkAction]     = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStageModal, setShowStageModal]   = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showStageAdvanceModal, setShowStageAdvanceModal] = useState(false);
  const [operationalPreset, setOperationalPreset] = useState("all");

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["cases-page-tasks"],
    queryFn: () => base44.entities.CaseTask.list("-created_date", 500),
  });

  const { data: censusVersions = [] } = useQuery({
    queryKey: ["cases-page-census"],
    queryFn: () => base44.entities.CensusVersion.list("-created_date", 500),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["cases-page-scenarios"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 500),
  });

  const { data: enrollmentWindows = [] } = useQuery({
    queryKey: ["cases-page-enrollment"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 500),
  });

  const { data: renewals = [] } = useQuery({
    queryKey: ["cases-page-renewals"],
    queryFn: () => base44.entities.RenewalCycle.list("-created_date", 500),
  });

  const { data: exceptions = [] } = useQuery({
    queryKey: ["cases-page-exceptions"],
    queryFn: () => base44.entities.ExceptionItem.list("-created_date", 500),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["cases-page-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 500),
  });

  const { data: rateTables = [] } = useQuery({
    queryKey: ["cases-page-rate-tables"],
    queryFn: () => base44.entities.PlanRateTable.list("-created_date", 1000),
  });

  const { data: scenarioPlans = [] } = useQuery({
    queryKey: ["cases-page-scenario-plans"],
    queryFn: () => base44.entities.ScenarioPlan.list("-created_date", 1000),
  });

  const { data: employeeEnrollments = [] } = useQuery({
    queryKey: ["cases-page-employee-enrollments"],
    queryFn: () => base44.entities.EmployeeEnrollment.list("-created_date", 1000),
  });

  const caseRelations = useMemo(() => {
    const relationMap = {};
    cases.forEach((item) => {
      relationMap[item.id] = {
        tasks: tasks.filter((task) => task.case_id === item.id),
        censusVersions: censusVersions.filter((version) => version.case_id === item.id),
        scenarios: scenarios.filter((scenario) => scenario.case_id === item.id),
        enrollmentWindows: enrollmentWindows.filter((window) => window.case_id === item.id),
        renewals: renewals.filter((renewal) => renewal.case_id === item.id),
        exceptions: exceptions.filter((exception) => exception.case_id === item.id),
      };
    });
    return relationMap;
  }, [cases, tasks, censusVersions, scenarios, enrollmentWindows, renewals, exceptions]);

  const rateSummary = useMemo(() => buildRateDependencySummary({
    plans,
    rateTables,
    scenarioPlans,
    quoteScenarios: scenarios,
    employeeEnrollments,
    renewals,
  }), [plans, rateTables, scenarioPlans, scenarios, employeeEnrollments, renewals]);

  const plansMissingRateIds = useMemo(() => new Set(
    plans
      .filter((plan) => !rateTables.some((table) => table.plan_id === plan.id))
      .map((plan) => plan.id)
  ), [plans, rateTables]);

  const enrichedCases = useMemo(() => {
    return cases.map((item) => {
      const related = caseRelations[item.id] || {
        tasks: [], censusVersions: [], scenarios: [], enrollmentWindows: [], renewals: [], exceptions: [],
      };
      const signals = getCaseWorkflowSignals({ caseData: item, ...related });
      const caseScenarioPlanIds = scenarioPlans
        .filter((plan) => plan.case_id === item.id)
        .map((plan) => plan.plan_id);
      const hasRateGap = caseScenarioPlanIds.some((planId) => plansMissingRateIds.has(planId));
      const systemIssues = [
        signals.censusIssues.length > 0 && { label: "Census", icon: FileWarning, tone: "text-amber-700 border-amber-200 bg-amber-50" },
        (signals.erroredQuotes.length > 0 || signals.expiringQuotes.length > 0) && { label: "Quotes", icon: AlertTriangle, tone: "text-red-700 border-red-200 bg-red-50" },
        signals.enrollmentBlocked && { label: "Enrollment", icon: ShieldAlert, tone: "text-amber-700 border-amber-200 bg-amber-50" },
        signals.renewalAtRisk && { label: "Renewal", icon: RefreshCw, tone: "text-red-700 border-red-200 bg-red-50" },
        hasRateGap && { label: "Rates", icon: AlertTriangle, tone: "text-red-700 border-red-200 bg-red-50" },
      ].filter(Boolean);

      return {
        ...item,
        related,
        signals,
        escalated: signals.criticalExceptions.length > 0 || signals.urgentTasks.length > 0 || hasRateGap,
        systemIssues,
        hasRateGap,
        staleDays: signals.staleDays,
        slaRisk: signals.slaRisk,
        slaLabel: signals.slaRisk ? "At risk" : "On track",
      };
    });
  }, [cases, caseRelations, scenarioPlans, plansMissingRateIds]);

  const filtered = useMemo(() => {
    let result = enrichedCases.filter((c) => {
      const matchSearch = !search ||
        c.employer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.case_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.assigned_to?.toLowerCase().includes(search.toLowerCase());
      const matchStage    = stageFilter    === "all" || c.stage     === stageFilter;
      const matchType     = typeFilter     === "all" || c.case_type === typeFilter;
      const matchPriority = priorityFilter === "all" || c.priority  === priorityFilter;
      const matchAssignee = assignedToFilter === "all" ? true : assignedToFilter === "unassigned" ? !c.assigned_to : c.assigned_to === assignedToFilter;

      const matchOperationalPreset = operationalPreset === "all"
        || (operationalPreset === "open" && !["closed", "renewed"].includes(c.stage))
        || (operationalPreset === "sla_risk" && c.slaRisk)
        || (operationalPreset === "critical_blockers" && (c.signals.criticalExceptions.length > 0 || c.signals.blockedTasks.length > 0))
        || (operationalPreset === "stalled" && c.staleDays !== null && c.staleDays > 7)
        || (operationalPreset === "rate_gaps" && c.hasRateGap);

      return matchSearch && matchStage && matchType && matchPriority && matchAssignee && matchOperationalPreset;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "created_asc")  return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === "created_desc") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "employer_asc") return (a.employer_name || "").localeCompare(b.employer_name || "");
      if (sortBy === "priority")     return (CASE_PRIORITY_ORDER[a.priority] ?? 2) - (CASE_PRIORITY_ORDER[b.priority] ?? 2);
      if (sortBy === "effective")    return new Date(a.effective_date || 0) - new Date(b.effective_date || 0);
      if (sortBy === "sla_risk")     return Number(b.slaRisk) - Number(a.slaRisk);
      return 0;
    });

    return result;
  }, [enrichedCases, search, stageFilter, typeFilter, priorityFilter, assignedToFilter, sortBy, operationalPreset]);

  const activeFilters = [stageFilter, typeFilter, priorityFilter, assignedToFilter, operationalPreset].filter(f => f !== "all").length;
  const clearFilters  = () => { setStageFilter("all"); setTypeFilter("all"); setPriorityFilter("all"); setAssignedToFilter("all"); setOperationalPreset("all"); setSearch(""); };

  const handleLoadPreset = (filters) => {
    if (filters.search !== undefined) setSearch(filters.search || "");
    if (filters.stageFilter !== undefined) setStageFilter(filters.stageFilter);
    if (filters.typeFilter !== undefined) setTypeFilter(filters.typeFilter);
    if (filters.priorityFilter !== undefined) setPriorityFilter(filters.priorityFilter);
    if (filters.assignedToFilter !== undefined) setAssignedToFilter(filters.assignedToFilter);
    if (filters.operationalPreset !== undefined) setOperationalPreset(filters.operationalPreset);
  };

  const handleCommandFilter = (filters) => {
    if (filters.stageFilter) setStageFilter(filters.stageFilter);
    if (filters.priorityFilter) setPriorityFilter(filters.priorityFilter);
    if (filters.operationalPreset) setOperationalPreset(filters.operationalPreset);
  };

  // Bulk operations
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleBulkExport = () => {
    const selectedCases = filtered.filter(c => selectedIds.has(c.id));
    const columns = ["id", "case_number", "employer_name", "case_type", "stage", "priority", "assigned_to", "effective_date"];
    exportToCSV(selectedCases, "cases-export.csv", columns);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} case(s)? This cannot be undone.`)) return;
    setBulkAction("deleting");
    try {
      for (const id of selectedIds) {
        await base44.entities.BenefitCase.delete(id);
      }
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setSelectedIds(new Set());
    } finally {
      setBulkAction(null);
    }
  };

  const handleBulkSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    setSelectedIds(new Set());
  };

  const commandMetrics = useMemo(() => ({
    openCount: enrichedCases.filter((item) => !["closed", "renewed"].includes(item.stage)).length,
    closedCount: enrichedCases.filter((item) => item.stage === "closed").length,
    urgentCount: enrichedCases.filter((item) => item.priority === "urgent").length,
    stalledCount: enrichedCases.filter((item) => item.staleDays !== null && item.staleDays > 7 && !["active", "closed", "renewed"].includes(item.stage)).length,
    unassignedCount: enrichedCases.filter((item) => !item.assigned_to).length,
    slaRiskCount: enrichedCases.filter((item) => item.slaRisk).length,
    rateGapCount: enrichedCases.filter((item) => item.hasRateGap).length,
    criticalIssueCount: enrichedCases.filter((item) => item.signals.criticalExceptions.length > 0 || item.signals.blockedTasks.length > 0 || item.hasRateGap).length,
    totalIssueCount: enrichedCases.reduce((sum, item) => sum + item.systemIssues.length + item.signals.openExceptions.length, 0),
    escalatedCount: enrichedCases.filter((item) => item.escalated).length,
  }), [enrichedCases]);

  const registry = useMemo(() => buildPlatformDependencyRegistry({
    cases,
    tasks,
    censusVersions,
    scenarios,
    enrollments: enrollmentWindows,
    renewals,
    exceptions,
    plans,
    rateTables,
    scenarioPlans,
    employeeEnrollments,
  }), [cases, tasks, censusVersions, scenarios, enrollmentWindows, renewals, exceptions, plans, rateTables, scenarioPlans, employeeEnrollments]);

  const systemSignals = useMemo(() => ({
    censusIssueCount: registry.systemSummary.censusIssues,
    quoteFailureCount: registry.systemSummary.quoteFailures + rateSummary.quotedPlansWithoutRates,
    enrollmentBlockerCount: registry.systemSummary.enrollmentBlockers,
    renewalRiskCount: registry.systemSummary.renewalRisk,
  }), [registry, rateSummary]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cases"
        description={`${cases.length} total benefit cases`}
        actions={
          <Link to="/cases/new">
            <Button className="rounded-xl shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> New Case
            </Button>
          </Link>
        }
      />

      {cases.length > 0 && (
        <>
          <CasesCommandCenter metrics={commandMetrics} onFilter={handleCommandFilter} />
          <CasesSystemSignals signals={systemSignals} />
        </>
      )}

      <CasesFilterBar
        cases={cases}
        search={search}
        setSearch={setSearch}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assignedToFilter={assignedToFilter}
        setAssignedToFilter={setAssignedToFilter}
        operationalPreset={operationalPreset}
        setOperationalPreset={setOperationalPreset}
        sortBy={sortBy}
        setSortBy={setSortBy}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleLoadPreset={handleLoadPreset}
        STAGE_OPTIONS={STAGE_OPTIONS}
        OPERATIONAL_OPTIONS={OPERATIONAL_OPTIONS}
        SORT_OPTIONS={SORT_OPTIONS}
      />

      {(activeFilters > 0 || search) && (
        <ActiveFilterChips
          filteredCount={filtered.length}
          totalCount={cases.length}
          search={search}
          stageFilter={stageFilter}
          typeFilter={typeFilter}
          priorityFilter={priorityFilter}
          assignedToFilter={assignedToFilter}
          operationalPreset={operationalPreset}
          stageOptions={STAGE_OPTIONS}
          operationalOptions={OPERATIONAL_OPTIONS}
          onClearSearch={() => setSearch("")}
          onClearStage={() => setStageFilter("all")}
          onClearType={() => setTypeFilter("all")}
          onClearPriority={() => setPriorityFilter("all")}
          onClearAssigned={() => setAssignedToFilter("all")}
          onClearOperational={() => setOperationalPreset("all")}
          onClearAll={clearFilters}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <CaseListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No cases found"
          description={search || activeFilters > 0 ? "Try adjusting your filters" : "Create your first benefit case to get started"}
          actionLabel={!search && activeFilters === 0 ? "Create Case" : undefined}
          onAction={!search && activeFilters === 0 ? () => window.location.href = "/cases/new" : undefined}
        />
      ) : viewMode === "pipeline" ? (
        <CasePipelineView cases={filtered} />
      ) : (
        <div className="space-y-4 pb-20">
          <CasesOperationalTable cases={filtered.slice(0, 12)} />
          <div className="space-y-3">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.has(c.id)}
                  onCheckedChange={() => toggleSelect(c.id)}
                  className="h-4 w-4 rounded-md border-border/70 shadow-sm"
                />
                <div className="flex-1">
                  <CaseListCard c={c} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          totalCount={filtered.length}
          allSelected={selectedIds.size === filtered.length}
          onSelectAll={toggleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "Assign",
              icon: Users,
              onClick: () => setShowAssignModal(true),
            },
            {
              label: "Stage",
              icon: Layers,
              onClick: () => setShowStageModal(true),
            },
            {
              label: "Priority",
              icon: Flag,
              onClick: () => setShowPriorityModal(true),
            },
            {
              label: "Advance Stage",
              icon: Layers,
              onClick: () => setShowStageAdvanceModal(true),
            },
            {
              label: "Export",
              icon: Download,
              onClick: handleBulkExport,
            },
            {
              label: "Delete",
              icon: Trash2,
              variant: "destructive",
              onClick: handleBulkDelete,
            },
          ]}
        />
      )}

      {/* Bulk Action Modals */}
      <BulkAssignModal
        isOpen={showAssignModal}
        caseIds={Array.from(selectedIds)}
        onClose={() => setShowAssignModal(false)}
        onSuccess={handleBulkSuccess}
      />
      <BulkStageModal
        isOpen={showStageModal}
        caseIds={Array.from(selectedIds)}
        onClose={() => setShowStageModal(false)}
        onSuccess={handleBulkSuccess}
      />
      <BulkPriorityModal
        isOpen={showPriorityModal}
        caseIds={Array.from(selectedIds)}
        onClose={() => setShowPriorityModal(false)}
        onSuccess={handleBulkSuccess}
      />
      <BulkStageAdvanceModal
        isOpen={showStageAdvanceModal}
        caseIds={Array.from(selectedIds)}
        onClose={() => setShowStageAdvanceModal(false)}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}