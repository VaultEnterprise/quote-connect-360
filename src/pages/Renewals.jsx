import React, { useState } from "react";
import useRenewalsPageModel from "@/domain/renewals/useRenewalsPageModel";
import { downloadCsv } from "@/utils/downloadCsv";
import { RefreshCw, LayoutGrid, List, Plus, Download, X, SortAsc, CalendarDays, Users, XCircle, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

import RenewalKPIBar from "@/components/renewals/RenewalKPIBar";
import RateDistributionChart from "@/components/renewals/RateDistributionChart";
import RenewalCard from "@/components/renewals/RenewalCard";
import RenewalPipelineView from "@/components/renewals/RenewalPipelineView";
import RenewalDetailModal from "@/components/renewals/RenewalDetailModal";
import CreateRenewalModal from "@/components/renewals/CreateRenewalModal";
import RenewalRiskForecast from "@/components/renewals/RenewalRiskForecast";
import RenewalCalendarView from "@/components/renewals/RenewalCalendarView";
import RenewalWorkloadBar from "@/components/renewals/RenewalWorkloadBar";
import useRouteContext from "@/hooks/useRouteContext";

const SORT_OPTIONS = [
  { value: "urgency", label: "Urgency (Soonest)" },
  { value: "employer", label: "Employer Name" },
  { value: "rate_change", label: "Rate Change %" },
  { value: "disruption", label: "Disruption Score" },
  { value: "premium", label: "Premium (Highest)" },
];

export default function Renewals() {
  const routeContext = useRouteContext("renewals");
  const caseScope = routeContext.caseId || "";
  const employerScope = routeContext.employerId || "";
  const [selectedRenewal, setSelectedRenewal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterRateDirection, setFilterRateDirection] = useState("all");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [sortBy, setSortBy] = useState("urgency");
  const [kpiFilter, setKpiFilter] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { renewals, filtered, sorted, censusMembers, uniqueAssignees, activeFilterCount, bulkStatusUpdate, bulkDelete } = useRenewalsPageModel({
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
  });

  const handleKpiClick = (key, value) => {
    if (kpiFilter?.key === key && kpiFilter?.value === value) {
      setKpiFilter(null);
      if (key === "overdue") setFilterOverdue(false);
      if (key === "urgency") setFilterUrgency("all");
      if (key === "rateDirection") setFilterRateDirection("all");
      if (key === "status") setFilterStatus("all");
    } else {
      setKpiFilter({ key, value });
      if (key === "overdue") setFilterOverdue(true);
      if (key === "urgency") setFilterUrgency(value);
      if (key === "rateDirection") setFilterRateDirection(value);
      if (key === "status") setFilterStatus(value);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery(""); setFilterStatus("all"); setFilterUrgency("all");
    setFilterAssignee("all"); setFilterRateDirection("all"); setFilterOverdue(false);
    setKpiFilter(null);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleExportCSV = () => {
    downloadCsv("renewals.csv", [
      ["Employer", "Status", "Renewal Date", "Current Premium", "Renewal Premium", "Rate Change %", "Disruption Score", "Recommendation", "Assigned To"],
      ...filtered.map((renewal) => [
        renewal.employer_name || "",
        renewal.status || "",
        renewal.renewal_date || "",
        renewal.current_premium || "",
        renewal.renewal_premium || "",
        renewal.rate_change_percent || "",
        renewal.disruption_score || "",
        renewal.recommendation || "",
        renewal.assigned_to || "",
      ]),
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader title="Renewals" description={`${renewals.length} total · ${sorted.length} shown`} />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Renewal
          </Button>
        </div>
      </div>

      {/* KPI Bar — clickable */}
      <RenewalKPIBar renewals={renewals} onFilterClick={handleKpiClick} activeFilter={kpiFilter} />

      {/* Rate distribution chart */}
      <RateDistributionChart renewals={renewals} />

      {/* Workload bar */}
      <RenewalWorkloadBar
        renewals={renewals}
        onFilterAssignee={(v) => setFilterAssignee(v)}
        activeAssignee={filterAssignee}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap bg-muted/30 p-3 rounded-lg border">
        <div className="relative">
          <Input
            placeholder="Search employer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 h-8 pr-7"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setKpiFilter(null); }}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pre_renewal">Pre-Renewal</SelectItem>
            <SelectItem value="marketed">Marketed</SelectItem>
            <SelectItem value="options_prepared">Options Prepared</SelectItem>
            <SelectItem value="employer_review">Employer Review</SelectItem>
            <SelectItem value="decision_made">Decision Made</SelectItem>
            <SelectItem value="install_renewal">Installing</SelectItem>
            <SelectItem value="active_renewal">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterUrgency} onValueChange={v => { setFilterUrgency(v); setFilterOverdue(false); setKpiFilter(null); }}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Urgency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="30">Within 30 days</SelectItem>
            <SelectItem value="60">Within 60 days</SelectItem>
            <SelectItem value="90">Within 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Assignee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {uniqueAssignees.map(a => <SelectItem key={a} value={a}>{a.split("@")[0]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterRateDirection} onValueChange={v => { setFilterRateDirection(v); setKpiFilter(null); }}>
          <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Rate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rate Changes</SelectItem>
            <SelectItem value="increases">Rate Increases</SelectItem>
            <SelectItem value="decreases">Rate Decreases</SelectItem>
            <SelectItem value="flat">Flat (0%)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SortAsc className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearAllFilters}>
            <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
          </Button>
        )}

        {/* View mode toggle */}
        <div className="flex items-center border rounded-md overflow-hidden">
          {[
            { mode: "list", icon: List },
            { mode: "pipeline", icon: LayoutGrid },
            { mode: "calendar", icon: CalendarDays },
          ].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2 py-1.5 transition-colors ${viewMode === mode ? "bg-primary text-white" : "hover:bg-muted"}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips */}
      {(filterOverdue || kpiFilter) && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          {filterOverdue && (
            <Badge className="bg-red-100 text-red-700 cursor-pointer" onClick={() => { setFilterOverdue(false); setKpiFilter(null); }}>
              Past Due <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">{selectedIds.length} selected</span>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Select onValueChange={v => bulkStatusUpdate.mutate({ ids: selectedIds, status: v })}>
              <SelectTrigger className="h-7 text-xs w-44"><SelectValue placeholder="Change status to…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_renewal">Pre-Renewal</SelectItem>
                <SelectItem value="marketed">Marketed</SelectItem>
                <SelectItem value="options_prepared">Options Prepared</SelectItem>
                <SelectItem value="employer_review">Employer Review</SelectItem>
                <SelectItem value="decision_made">Decision Made</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-7 text-xs text-destructive border-destructive/20"
              onClick={() => { if (confirm(`Delete ${selectedIds.length} renewals?`)) bulkDelete.mutate(selectedIds); }}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Result count */}
      <p className="text-xs text-muted-foreground -mt-2">{sorted.length} renewal{sorted.length !== 1 ? "s" : ""} shown</p>

      {/* Content */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No Renewals"
          description={renewals.length === 0
            ? "Renewal cycles will appear here as cases approach their renewal dates."
            : "No renewals match your current filters."}
          actionLabel={renewals.length === 0 ? "New Renewal" : "Clear Filters"}
          onAction={renewals.length === 0 ? () => setShowCreateModal(true) : clearAllFilters}
        />
      ) : viewMode === "pipeline" ? (
        <RenewalPipelineView renewals={sorted} onSelect={setSelectedRenewal} onEdit={setSelectedRenewal} />
      ) : viewMode === "calendar" ? (
        <RenewalCalendarView renewals={renewals} onSelect={setSelectedRenewal} />
      ) : (
        <div className="space-y-2">
          {sorted.map(renewal => (
            <RenewalCard
              key={renewal.id}
              renewal={renewal}
              onClick={() => setSelectedRenewal(renewal)}
              onEdit={() => setSelectedRenewal(renewal)}
              isSelected={selectedIds.includes(renewal.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedRenewal && (
        <RenewalDetailModal
          renewal={selectedRenewal}
          open={!!selectedRenewal}
          onClose={() => setSelectedRenewal(null)}
        />
      )}

      {/* Risk Forecast floating panel */}
      {selectedRenewal && censusMembers.length > 0 && (
        <div className="fixed bottom-6 right-6 w-96 max-h-96 overflow-hidden rounded-lg shadow-lg bg-background border z-50">
          <RenewalRiskForecast renewal={selectedRenewal} census={censusMembers} />
        </div>
      )}

      <CreateRenewalModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}