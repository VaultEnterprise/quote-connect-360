import React from "react";
import { Search, Filter, LayoutList, Columns, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssignedUserFilter from "@/components/cases/AssignedUserFilter";
import SavedFiltersPanel from "@/components/cases/SavedFiltersPanel";

export default function CasesFilterBar({
  cases,
  search,
  setSearch,
  stageFilter,
  setStageFilter,
  typeFilter,
  setTypeFilter,
  priorityFilter,
  setPriorityFilter,
  assignedToFilter,
  setAssignedToFilter,
  operationalPreset,
  setOperationalPreset,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  handleLoadPreset,
  STAGE_OPTIONS,
  OPERATIONAL_OPTIONS,
  SORT_OPTIONS,
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:flex-wrap xl:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search employer, case #, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-xl border-border/70 bg-background pl-10 shadow-sm"
            />
          </div>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-9 w-44 rounded-xl border-border/70 bg-background shadow-sm">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 shadow-lg">
              {STAGE_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-40 rounded-xl border-border/70 bg-background shadow-sm">
              <SelectValue placeholder="Case Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 shadow-lg">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="new_business">New Business</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="mid_year_change">Mid-Year Change</SelectItem>
              <SelectItem value="takeover">Takeover</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/70 bg-background shadow-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 shadow-lg">
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <AssignedUserFilter cases={cases} value={assignedToFilter} onChange={setAssignedToFilter} />

          <Select value={operationalPreset} onValueChange={setOperationalPreset}>
            <SelectTrigger className="h-9 w-44 rounded-xl border-border/70 bg-background shadow-sm">
              <SelectValue placeholder="Operational" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 shadow-lg">
              {OPERATIONAL_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-40 rounded-xl border-border/70 bg-background shadow-sm">
              <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 shadow-lg">
              {SORT_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted/30 p-1 shadow-sm">
            <button
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/80"}`}
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-3.5 w-3.5" /> List
            </button>
            <button
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${viewMode === "pipeline" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/80"}`}
              onClick={() => setViewMode("pipeline")}
            >
              <Columns className="h-3.5 w-3.5" /> Pipeline
            </button>
          </div>

          <SavedFiltersPanel
            currentFilters={{ search, stageFilter, typeFilter, priorityFilter, assignedToFilter, operationalPreset }}
            onLoadPreset={handleLoadPreset}
          />
        </div>
      </div>
    </div>
  );
}