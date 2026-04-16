import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

function FilterChip({ label, onClear, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted ${className}`}
    >
      <span className="truncate max-w-[180px]">{label}</span>
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted/80">
        <X className="w-3 h-3" />
      </span>
    </button>
  );
}

export default function ActiveFilterChips({
  filteredCount,
  totalCount,
  search,
  stageFilter,
  typeFilter,
  priorityFilter,
  assignedToFilter,
  operationalPreset,
  stageOptions,
  operationalOptions,
  onClearSearch,
  onClearStage,
  onClearType,
  onClearPriority,
  onClearAssigned,
  onClearOperational,
  onClearAll,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm">
      <span className="text-xs font-medium text-muted-foreground">{filteredCount} of {totalCount} cases</span>

      {search && <FilterChip label={`Search: ${search}`} onClear={onClearSearch} />}

      {stageFilter !== "all" && (
        <FilterChip
          label={stageOptions.find((opt) => opt.value === stageFilter)?.label}
          onClear={onClearStage}
        />
      )}

      {typeFilter !== "all" && (
        <FilterChip label={typeFilter.replace(/_/g, " ")} onClear={onClearType} />
      )}

      {priorityFilter !== "all" && (
        <FilterChip label={priorityFilter} onClear={onClearPriority} />
      )}

      {assignedToFilter !== "all" && (
        <FilterChip
          label={assignedToFilter === "unassigned" ? "Unassigned" : assignedToFilter.split("@")[0]}
          onClear={onClearAssigned}
        />
      )}

      {operationalPreset !== "all" && (
        <FilterChip
          label={operationalOptions.find((opt) => opt.value === operationalPreset)?.label}
          onClear={onClearOperational}
          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
        />
      )}

      <Button variant="ghost" size="sm" className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClearAll}>
        <X className="w-3 h-3 mr-1" /> Clear filters
      </Button>
    </div>
  );
}