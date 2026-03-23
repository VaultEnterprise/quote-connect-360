import React, { useState, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase, Plus, Search, Filter, X, LayoutList, Columns,
  TrendingUp, Clock, AlertTriangle, CheckCircle, ArrowUpDown, Download
} from "lucide-react";
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
import BulkActionsToolbar from "@/components/shared/BulkActionsToolbar";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { exportToCSV, generateFilename } from "@/utils/exportHelpers";

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
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest First" },
  { value: "created_asc",  label: "Oldest First" },
  { value: "employer_asc", label: "Employer A–Z" },
  { value: "priority",     label: "Priority" },
  { value: "effective",    label: "Effective Date" },
];

const PRIORITY_ORDER = { urgent: 0, high: 1, normal: 2, low: 3 };

export default function Cases() {
  const [search, setSearch]             = useState("");
  const [stageFilter, setStageFilter]   = useState("all");
  const [typeFilter, setTypeFilter]     = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy]             = useState("created_desc");
  const [viewMode, setViewMode]         = useState("list"); // "list" | "pipeline"
  const [selectedIds, setSelectedIds]   = useState([]);
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  // Real-time updates on case changes
  useRealtimeSubscription("BenefitCase", () => refetch(), { debounce: 1000 });

  const filtered = useMemo(() => {
    let result = cases.filter((c) => {
      const matchSearch = !search ||
        c.employer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.case_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.assigned_to?.toLowerCase().includes(search.toLowerCase());
      const matchStage    = stageFilter    === "all" || c.stage     === stageFilter;
      const matchType     = typeFilter     === "all" || c.case_type === typeFilter;
      const matchPriority = priorityFilter === "all" || c.priority  === priorityFilter;
      return matchSearch && matchStage && matchType && matchPriority;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "created_asc")  return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === "created_desc") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "employer_asc") return (a.employer_name || "").localeCompare(b.employer_name || "");
      if (sortBy === "priority")     return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      if (sortBy === "effective")    return new Date(a.effective_date || 0) - new Date(b.effective_date || 0);
      return 0;
    });

    return result;
  }, [cases, search, stageFilter, typeFilter, priorityFilter, sortBy]);

  const activeFilters = [stageFilter, typeFilter, priorityFilter].filter(f => f !== "all").length;
  const clearFilters  = () => { setStageFilter("all"); setTypeFilter("all"); setPriorityFilter("all"); setSearch(""); setSelectedIds([]); };

  // Bulk actions handlers
  const handleSelectCase = useCallback((id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(filtered.map(c => c.id));
  }, [filtered]);

  const handleExportSelected = useCallback(() => {
    const toExport = filtered.filter(c => selectedIds.includes(c.id));
    exportToCSV(
      toExport.map(c => ({
        "Case #": c.case_number,
        Employer: c.employer_name,
        Type: c.case_type,
        Stage: c.stage,
        Priority: c.priority,
        "Assigned To": c.assigned_to,
        "Effective Date": c.effective_date,
        Status: c.enrollment_status,
      })),
      generateFilename("cases_export")
    );
    setSelectedIds([]);
  }, [filtered, selectedIds]);

  // KPI counts
  const urgentCount  = cases.filter(c => c.priority === "urgent").length;
  const activeCount  = cases.filter(c => c.stage === "active").length;
  const stalledCount = cases.filter(c => {
    if (!c.last_activity_date) return false;
    const days = (Date.now() - new Date(c.last_activity_date).getTime()) / 86400000;
    return days > 7 && c.stage !== "active" && c.stage !== "closed";
  }).length;
  const enrollOpen   = cases.filter(c => c.stage === "enrollment_open").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cases"
        description={`${cases.length} total benefit cases`}
        actions={
          <Link to="/cases/new">
            <Button className="shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> New Case
            </Button>
          </Link>
        }
      />

      {/* KPI Summary Strip */}
      {cases.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Active Cases",     value: activeCount,  icon: CheckCircle,    color: "text-emerald-600", bg: "bg-emerald-50",  border: "border-emerald-100", filter: () => setStageFilter("active") },
            { label: "Enrollment Open",  value: enrollOpen,   icon: Clock,          color: "text-blue-600",   bg: "bg-blue-50",     border: "border-blue-100",   filter: () => setStageFilter("enrollment_open") },
            { label: "Urgent Priority",  value: urgentCount,  icon: AlertTriangle,  color: "text-red-600",    bg: "bg-red-50",      border: "border-red-100",    filter: () => setPriorityFilter("urgent") },
            { label: "Stalled (7+ days)",value: stalledCount, icon: TrendingUp,     color: "text-amber-600",  bg: "bg-amber-50",    border: "border-amber-100",  filter: null },
          ].map(kpi => (
            <Card
              key={kpi.label}
              className={`border ${kpi.border} ${kpi.bg} ${kpi.filter ? "cursor-pointer hover:shadow-sm transition-shadow" : ""}`}
              onClick={kpi.filter || undefined}
            >
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

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          allSelected={selectedIds.length === filtered.length && filtered.length > 0}
          totalCount={filtered.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds([])}
          actions={[
            {
              label: "Export",
              icon: Download,
              handler: handleExportSelected,
            },
          ]}
        />
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employer, case #, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9"
            />
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-9">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex rounded-md border overflow-hidden flex-shrink-0">
            <button
              className={`px-3 h-9 flex items-center gap-1.5 text-xs transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="w-3.5 h-3.5" /> List
            </button>
            <button
              className={`px-3 h-9 flex items-center gap-1.5 text-xs transition-colors ${viewMode === "pipeline" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}
              onClick={() => setViewMode("pipeline")}
            >
              <Columns className="w-3.5 h-3.5" /> Pipeline
            </button>
          </div>
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
        <div className="space-y-2">
          {filtered.map(c => <CaseListCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}