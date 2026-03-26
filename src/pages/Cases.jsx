import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, Plus, Search, Filter, X, LayoutList, Columns, TrendingUp, Clock, AlertTriangle, CheckCircle, ArrowUpDown, Download, Trash2, Users, Layers, Flag, Eye, Keyboard, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { CaseListSkeleton } from "@/components/shared/LoadingSkeleton";
import CaseListCard from "@/components/cases/CaseListCard";
import CasePipelineView from "@/components/cases/CasePipelineView";
import BulkActionsBar from "@/components/shared/BulkActionsBar";
import BulkAssignModal from "@/components/cases/BulkAssignModal";
import BulkStageModal from "@/components/cases/BulkStageModal";
import BulkPriorityModal from "@/components/cases/BulkPriorityModal";
import SavedFiltersPanel from "@/components/cases/SavedFiltersPanel";
import AssignedUserFilter from "@/components/cases/AssignedUserFilter";
import BulkStageAdvanceModal from "@/components/cases/BulkStageAdvanceModal";
import DateRangeFilter from "@/components/cases/DateRangeFilter";
import LastActivityFilter from "@/components/cases/LastActivityFilter";
import EmployeeCountFilter from "@/components/cases/EmployeeCountFilter";
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
import SeedDataButton from "@/components/cases/SeedDataButton";
import { exportToCSV } from "@/utils/export-import";

const STAGE_OPTIONS = [
  { value: "all", label: "All Stages" },
  { value: "draft", label: "Draft" },
  { value: "census_in_progress", label: "Census In Progress" },
  { value: "census_validated", label: "Census Validated" },
  { value: "ready_for_quote", label: "Ready for Quote" },
  { value: "quoting", label: "Quoting" },
  { value: "proposal_ready", label: "Proposal Ready" },
  { value: "employer_review", label: "Employer Review" },
  { value: "approved_for_enrollment", label: "Approved for Enrollment" },
  { value: "enrollment_open", label: "Enrollment Open" },
  { value: "enrollment_complete", label: "Enrollment Complete" },
  { value: "install_in_progress", label: "Install In Progress" },
  { value: "active", label: "Active" },
  { value: "renewal_pending", label: "Renewal Pending" },
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest First" },
  { value: "created_asc", label: "Oldest First" },
  { value: "employer_asc", label: "Employer A–Z" },
  { value: "priority", label: "Priority" },
  { value: "effective", label: "Effective Date" },
];

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export default function Cases() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");
  const [viewMode, setViewMode] = useState("list");
  const [dateFilter, setDateFilter] = useState(null);
  const [activityFilter, setActivityFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showStageAdvanceModal, setShowStageAdvanceModal] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showAssignDueDate, setShowAssignDueDate] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  const { data: censusMembers = [] } = useQuery({
    queryKey: ["case-census-members"],
    queryFn: () => base44.entities.CensusMember.list("-created_date", 500),
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setShowQuickCreate(true); }
      if (e.key === "e" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleBulkExport(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = useMemo(() => {
    let result = cases.filter((c) => {
      const matchSearch = !search || c.employer_name?.toLowerCase().includes(search.toLowerCase()) || c.case_number?.toLowerCase().includes(search.toLowerCase()) || c.assigned_to?.toLowerCase().includes(search.toLowerCase());
      const matchStage = stageFilter === "all" || c.stage === stageFilter;
      const matchType = typeFilter === "all" || c.case_type === typeFilter;
      const matchPriority = priorityFilter === "all" || c.priority === priorityFilter;
      const matchAssignee = assignedToFilter === "all" ? true : assignedToFilter === "unassigned" ? !c.assigned_to : c.assigned_to === assignedToFilter;
      const matchDate = !dateFilter || (c.effective_date && new Date(c.effective_date) >= dateFilter.start && new Date(c.effective_date) <= dateFilter.end);
      const matchActivity = activityFilter === "all" || (activityFilter === "none" ? !c.last_activity_date : c.last_activity_date);
      const matchEmployee = !employeeFilter || (c.employee_count && c.employee_count >= employeeFilter.min && c.employee_count <= employeeFilter.max);
      return matchSearch && matchStage && matchType && matchPriority && matchAssignee && matchDate && matchActivity && matchEmployee;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "created_asc") return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === "created_desc") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "employer_asc") return (a.employer_name || "").localeCompare(b.employer_name || "");
      if (sortBy === "priority") return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      if (sortBy === "effective") return new Date(a.effective_date || 0) - new Date(b.effective_date || 0);
      return 0;
    });

    return result;
  }, [cases, search, stageFilter, typeFilter, priorityFilter, assignedToFilter, sortBy, dateFilter, activityFilter, employeeFilter]);

  const employeePreviewByCase = useMemo(() => {
    return censusMembers.reduce((acc, member) => {
      if (!member.case_id) return acc;
      if (!acc[member.case_id]) acc[member.case_id] = [];
      if (acc[member.case_id].length < 4) acc[member.case_id].push(member);
      return acc;
    }, {});
  }, [censusMembers]);

  const employeeCountByCase = useMemo(() => {
    return censusMembers.reduce((acc, member) => {
      if (!member.case_id) return acc;
      acc[member.case_id] = (acc[member.case_id] || 0) + 1;
      return acc;
    }, {});
  }, [censusMembers]);

  const activeFilters = [stageFilter, typeFilter, priorityFilter, assignedToFilter, dateFilter, employeeFilter].filter(f => f !== "all" && f !== null).length;
  const clearFilters = () => { setStageFilter("all"); setTypeFilter("all"); setPriorityFilter("all"); setAssignedToFilter("all"); setDateFilter(null); setActivityFilter("all"); setEmployeeFilter(null); setSearch(""); };

  const handleLoadPreset = (filters) => {
    if (filters.search !== undefined) setSearch(filters.search || "");
    if (filters.stageFilter !== undefined) setStageFilter(filters.stageFilter);
    if (filters.typeFilter !== undefined) setTypeFilter(filters.typeFilter);
    if (filters.priorityFilter !== undefined) setPriorityFilter(filters.priorityFilter);
    if (filters.assignedToFilter !== undefined) setAssignedToFilter(filters.assignedToFilter);
  };

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

  const urgentCount = cases.filter(c => c.priority === "urgent").length;
  const activeCount = cases.filter(c => c.stage === "active").length;
  const stalledCount = cases.filter(c => {
    if (!c.last_activity_date) return false;
    const days = (Date.now() - new Date(c.last_activity_date).getTime()) / 86400000;
    return days > 7 && c.stage !== "active" && c.stage !== "closed";
  }).length;
  const enrollOpen = cases.filter(c => c.stage === "enrollment_open").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cases"
        description={`${cases.length} total benefit cases`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <SeedDataButton />
            <Button size="sm" variant="outline" onClick={() => setShowAnalytics(!showAnalytics)} className="gap-1">
              <Eye className="w-3.5 h-3.5" /> {showAnalytics ? "Hide" : "Show"} Analytics
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowQuickCreate(true)} className="gap-1">
              <Keyboard className="w-3.5 h-3.5" /> Quick Create
            </Button>
            <Link to="/cases/new">
              <Button className="shadow-sm gap-1">
                <Plus className="w-4 h-4" /> New Case
              </Button>
            </Link>
          </div>
        }
      />

      {showAnalytics && cases.length > 0 && (
        <div className="space-y-3">
          <KPITrendsPanel cases={filtered} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CycleTimeAnalytics cases={filtered} />
            <RiskAlerts cases={filtered} />
            <TeamWorkloadHeatmap cases={filtered} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RevenueForecast cases={filtered} />
            <RenewalPipelineView cases={filtered} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AgingReport cases={filtered} />
            <ActivityFeed cases={filtered} />
          </div>
        </div>
      )}

      {cases.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Cases", value: activeCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", filter: () => setStageFilter("active") },
            { label: "Enrollment Open", value: enrollOpen, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", filter: () => setStageFilter("enrollment_open") },
            { label: "Urgent Priority", value: urgentCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100", filter: () => setPriorityFilter("urgent") },
            { label: "Stalled (7+ days)", value: stalledCount, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", filter: null },
          ].map(kpi => (
            <Card key={kpi.label} className={`border ${kpi.border} ${kpi.bg} ${kpi.filter ? "cursor-pointer hover:shadow-sm transition-shadow" : ""}`} onClick={kpi.filter || undefined}>
              <CardContent className="p-3 flex items-center gap-3">
                <kpi.icon className={`w-4 h-4 ${kpi.color} flex-shrink-0`} />
                <div>
                  <p className={`text-xl font-bold leading-none ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employer, case #, or assignee..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-44 h-9">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {STAGE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Case Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="new_business">New Business</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="mid_year_change">Mid-Year Change</SelectItem>
              <SelectItem value="takeover">Takeover</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <AssignedUserFilter cases={cases} value={assignedToFilter} onChange={setAssignedToFilter} />
          <DateRangeFilter type="effective" value={dateFilter} onChange={setDateFilter} />
          <LastActivityFilter value={activityFilter} onChange={setActivityFilter} />
          <EmployeeCountFilter value={employeeFilter} onChange={setEmployeeFilter} />

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-9">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex rounded-md border overflow-hidden flex-shrink-0">
            <button className={`px-3 h-9 flex items-center gap-1.5 text-xs transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`} onClick={() => setViewMode("list")}>
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
            <button className={`px-3 h-9 flex items-center gap-1.5 text-xs transition-colors ${viewMode === "pipeline" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`} onClick={() => setViewMode("pipeline")}>
              <Columns className="w-3.5 h-3.5" /> Pipeline
            </button>
          </div>

          <SavedFiltersPanel currentFilters={{ search, stageFilter, typeFilter, priorityFilter, assignedToFilter }} onLoadPreset={handleLoadPreset} />
        </div>

        {(activeFilters > 0 || search) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filtered.length} of {cases.length} cases</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={clearFilters}>
              <X className="w-3 h-3 mr-1" /> Clear filters
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <CaseListSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No cases found" description={search || activeFilters > 0 ? "Try adjusting your filters" : "Create your first benefit case to get started"} actionLabel={!search && activeFilters === 0 ? "Create Case" : undefined} onAction={!search && activeFilters === 0 ? () => window.location.href = "/cases/new" : undefined} />
      ) : viewMode === "pipeline" ? (
        <CasePipelineView cases={filtered} />
      ) : (
        <div className="space-y-2 pb-20">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 rounded border border-input" />
              <div className="flex-1">
                <CaseListCard c={c} employees={employeePreviewByCase[c.id] || []} employeeCount={employeeCountByCase[c.id] || 0} />
              </div>
            </div>
          ))}
        </div>
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
            { label: "Delete", icon: Trash2, variant: "destructive", onClick: handleBulkDelete },
          ]}
        />
      )}

      <BulkAssignModal isOpen={showAssignModal} caseIds={Array.from(selectedIds)} onClose={() => setShowAssignModal(false)} onSuccess={handleBulkSuccess} />
      <BulkStageModal isOpen={showStageModal} caseIds={Array.from(selectedIds)} onClose={() => setShowStageModal(false)} onSuccess={handleBulkSuccess} />
      <BulkPriorityModal isOpen={showPriorityModal} caseIds={Array.from(selectedIds)} onClose={() => setShowPriorityModal(false)} onSuccess={handleBulkSuccess} />
      <BulkStageAdvanceModal isOpen={showStageAdvanceModal} caseIds={Array.from(selectedIds)} onClose={() => setShowStageAdvanceModal(false)} onSuccess={handleBulkSuccess} />
      <BulkAssignWithDueDate isOpen={showAssignDueDate} caseIds={Array.from(selectedIds)} onClose={() => setShowAssignDueDate(false)} onSuccess={handleBulkSuccess} />
      <QuickCreateCaseModal isOpen={showQuickCreate} onClose={() => setShowQuickCreate(false)} />
    </div>
  );
}