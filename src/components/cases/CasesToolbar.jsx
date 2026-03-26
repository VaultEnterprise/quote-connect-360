import React from "react";
import { ArrowUpDown, Columns, Download, Eye, Filter, Keyboard, LayoutList, Plus, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SavedFiltersPanel from "@/components/cases/SavedFiltersPanel";
import AssignedUserFilter from "@/components/cases/AssignedUserFilter";
import DateRangeFilter from "@/components/cases/DateRangeFilter";
import LastActivityFilter from "@/components/cases/LastActivityFilter";
import EmployeeCountFilter from "@/components/cases/EmployeeCountFilter";
import SeedDataButton from "@/components/cases/SeedDataButton";
import { SORT_OPTIONS } from "@/services/cases/casesDomain";
import { STAGE_OPTIONS } from "@/contracts/workflowRegistry";

export default function CasesToolbar({
  state,
  cases,
  currentUser,
  filteredCount,
  totalCount,
  activeFilters,
  setState,
  clearFilters,
  onExport,
  onToggleAnalytics,
  showAnalytics,
  onQuickCreate,
  onLoadPreset,
}) {
  const quickViews = [
    { value: "all", label: "All Cases" },
    currentUser?.email ? { value: "my_cases", label: "My Cases" } : null,
    { value: "unassigned", label: "Unassigned" },
    { value: "stalled", label: "Stalled" },
    { value: "ready_for_quote", label: "Ready for Quote" },
    { value: "employer_review", label: "Employer Review" },
    { value: "enrollment_open", label: "Enrollment Open" },
    { value: "renewals", label: "Renewals / 60 Days" },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <SeedDataButton />
        <Button size="sm" variant="outline" onClick={onExport} className="gap-1"><Download className="w-3.5 h-3.5" /> Export Filtered</Button>
        <Button size="sm" variant="outline" onClick={onToggleAnalytics} className="gap-1"><Eye className="w-3.5 h-3.5" /> {showAnalytics ? "Hide" : "Show"} Analytics</Button>
        <Button size="sm" variant="outline" onClick={onQuickCreate} className="gap-1"><Keyboard className="w-3.5 h-3.5" /> Quick Create</Button>
        <Link to="/cases/new"><Button className="shadow-sm gap-1"><Plus className="w-4 h-4" /> New Case</Button></Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickViews.map((view) => (
          <Button key={view.value} size="sm" variant={state.quickView === view.value ? "default" : "outline"} className="h-8 text-xs" onClick={() => setState({ quickView: view.value })}>
            {view.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search employer, case #, or assignee..." value={state.search} onChange={(e) => setState({ search: e.target.value })} className="pl-10 h-9" />
          </div>

          <Select value={state.stageFilter} onValueChange={(value) => setState({ stageFilter: value })}>
            <SelectTrigger className="w-44 h-9"><Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>{STAGE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>

          <Select value={state.typeFilter} onValueChange={(value) => setState({ typeFilter: value })}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Case Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="new_business">New Business</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="mid_year_change">Mid-Year Change</SelectItem>
              <SelectItem value="takeover">Takeover</SelectItem>
            </SelectContent>
          </Select>

          <Select value={state.priorityFilter} onValueChange={(value) => setState({ priorityFilter: value })}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <AssignedUserFilter cases={cases} value={state.assignedToFilter} onChange={(value) => setState({ assignedToFilter: value })} />
          <DateRangeFilter type="effective" value={state.dateFilter} onChange={(value) => setState({ dateFilter: value })} />
          <LastActivityFilter value={state.activityFilter} onChange={(value) => setState({ activityFilter: value })} />
          <EmployeeCountFilter value={state.employeeFilter} onChange={(value) => setState({ employeeFilter: value })} />

          <Select value={state.sortBy} onValueChange={(value) => setState({ sortBy: value })}>
            <SelectTrigger className="w-40 h-9"><ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>{SORT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>

          <div className="flex rounded-md border overflow-hidden flex-shrink-0">
            <button className={`px-3 h-9 flex items-center gap-1.5 text-xs transition-colors ${state.viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`} onClick={() => setState({ viewMode: "list" })}><LayoutList className="w-3.5 h-3.5" /> List</button>
            <button className={`px-3 h-9 flex items-center gap-1.5 text-xs transition-colors ${state.viewMode === "pipeline" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`} onClick={() => setState({ viewMode: "pipeline" })}><Columns className="w-3.5 h-3.5" /> Pipeline</button>
          </div>

          <SavedFiltersPanel currentFilters={{ search: state.search, stageFilter: state.stageFilter, typeFilter: state.typeFilter, priorityFilter: state.priorityFilter, assignedToFilter: state.assignedToFilter }} onLoadPreset={onLoadPreset} />
        </div>

        {(activeFilters > 0 || state.search) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filteredCount} of {totalCount} cases</span>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={clearFilters}><X className="w-3 h-3 mr-1" /> Clear filters</Button>
          </div>
        )}
      </div>
    </div>
  );
}