import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Copy, Download, X, CheckSquare, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * BulkActionsBar
 * Reusable bulk actions UI for list pages.
 * Handles multi-select, bulk operations, and contextual actions.
 */
export default function BulkActionsBar({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll = () => {},
  onClearSelection = () => {},
  actions = [], // [{ label, icon, onClick, color? }]
  onExport = null,
  allSelected = false,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/70 bg-background/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80 animate-in slide-in-from-bottom-2">
      <div className="mx-auto flex max-w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-sm">
        {/* Left: Selection Info */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="rounded-xl text-xs"
          >
            {allSelected ? (
              <>
                <CheckSquare className="w-4 h-4 mr-1" />
                Deselect all {totalCount}
              </>
            ) : (
              <>
                <Square className="w-4 h-4 mr-1" />
                Select all {totalCount}
              </>
            )}
          </Button>
          <Badge variant="secondary" className="rounded-full border-border/70 px-3 py-1 text-xs font-semibold shadow-sm">
            {selectedCount} selected {totalCount > selectedCount && `of ${totalCount}`}
          </Badge>
        </div>

        {/* Center: Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant || "outline"}
              size="sm"
              onClick={() => action.onClick(selectedCount)}
              className="rounded-xl text-xs"
            >
              {action.icon && <action.icon className="w-3.5 h-3.5 mr-1.5" />}
              {action.label}
            </Button>
          ))}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(selectedCount)}
              className="rounded-xl text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          )}
        </div>

        {/* Right: Close */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}