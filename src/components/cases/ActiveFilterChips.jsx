import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

function FilterChip({ label, onClear, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted ${className}`}
    >
      {label}
      <X className="w-3 h-3" />
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
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{filteredCount} of {totalCount} cases</span>

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

      <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={onClearAll}>
        <X className="w-3 h-3 mr-1" /> Clear filters
      </Button>
    </div>
  );
}