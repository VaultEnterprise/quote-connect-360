import React from "react";
import { Search, Filter, SortAsc, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QuoteControlCenter({
  groupByCaseMode,
  setGroupByCaseMode,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  caseFilter,
  setCaseFilter,
  employers,
  sortBy,
  setSortBy,
  allCarriers,
  carrierFilter,
  setCarrierFilter,
  activeFilters,
  clearAll,
  filteredCount,
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex items-center overflow-hidden rounded-xl border border-border/70 bg-muted/30 p-1 shadow-sm">
            <button
              onClick={() => setGroupByCaseMode(true)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${groupByCaseMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/80"}`}
            >
              By Case
            </button>
            <button
              onClick={() => setGroupByCaseMode(false)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${!groupByCaseMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/80"}`}
            >
              All
            </button>
          </div>

          <div className="relative min-w-48 flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search scenarios..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 rounded-xl border-border/70 bg-background pl-10 shadow-sm" />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border/70 bg-background shadow-sm">
              <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 shadow-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="converted_to_enrollment">Converted</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          {employers.length > 0 && (
            <Select value={caseFilter} onValueChange={setCaseFilter}>
              <SelectTrigger className="h-9 w-44 rounded-xl border-border/70 bg-background shadow-sm">
                <SelectValue placeholder="All Employers" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 shadow-lg">
                <SelectItem value="all">All Employers</SelectItem>
                {employers.map((employer) => <SelectItem key={employer.id} value={employer.id}>{employer.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-40 rounded-xl border-border/70 bg-background shadow-sm">
              <SortAsc className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/70 shadow-lg">
              <SelectItem value="created_date">Newest First</SelectItem>
              <SelectItem value="premium">Highest Premium</SelectItem>
              <SelectItem value="expiry">Expiry Date</SelectItem>
              <SelectItem value="score">Rec. Score</SelectItem>
            </SelectContent>
          </Select>

          {allCarriers.length > 0 && (
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="h-9 w-40 rounded-xl border-border/70 bg-background shadow-sm">
                <SelectValue placeholder="All Carriers" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/70 shadow-lg">
                <SelectItem value="all">All Carriers</SelectItem>
                {allCarriers.map((carrier) => <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={clearAll}>
              <X className="mr-1 h-3.5 w-3.5" /> Clear all
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">{filteredCount} scenarios</span>
        </div>
      </div>
    </div>
  );
}