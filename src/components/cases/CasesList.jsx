import React from "react";
import { Button } from "@/components/ui/button";
import CaseEnhancedCard from "@/components/cases/CaseEnhancedCard";

export default function CasesList({ cases, selectedIds, onToggleSelectAll, onToggleSelect, employeePreviewByCase, employeeCountByCase, caseMetaById }) {
  return (
    <div className="space-y-2 pb-20">
      <div className="flex items-center justify-between gap-3 px-1">
        <span className="text-xs text-muted-foreground">{cases.length} visible case{cases.length === 1 ? "" : "s"}</span>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onToggleSelectAll}>
          {selectedIds.size === cases.length ? "Deselect all visible" : "Select all visible"}
        </Button>
      </div>
      {cases.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => onToggleSelect(item.id)} className="w-4 h-4 rounded border border-input" />
          <div className="flex-1">
            <CaseEnhancedCard
              c={item}
              employees={employeePreviewByCase[item.id] || []}
              employeeCount={employeeCountByCase[item.id] || 0}
              meta={caseMetaById[item.id] || {}}
            />
          </div>
        </div>
      ))}
    </div>
  );
}