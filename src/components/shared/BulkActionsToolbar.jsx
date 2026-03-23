import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Trash2, Copy, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function BulkActionsToolbar({
  selectedCount = 0,
  selectedIds = [],
  allSelected = false,
  totalCount = 0,
  onSelectAll = () => {},
  onClearSelection = () => {},
  onBulkAction = () => {},
  actions = [], // [{ label, icon, handler, danger: bool }, ...]
  showSelectAll = true,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 bg-primary/5 border-b border-primary/10 px-4 py-3 rounded-t-lg">
      {showSelectAll && (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) =>
              checked ? onSelectAll() : onClearSelection()
            }
          />
          <span className="text-sm font-medium text-muted-foreground">
            {selectedCount} selected
            {allSelected && totalCount > selectedCount && ` (of ${totalCount})`}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 ml-auto">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.danger ? "destructive" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => action.handler(selectedIds)}
          >
            {action.icon && <action.icon className="w-4 h-4" />}
            {action.label}
          </Button>
        ))}

        {actions.length === 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Actions <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Assign</DropdownMenuItem>
              <DropdownMenuItem>Change Status</DropdownMenuItem>
              <DropdownMenuItem>Change Priority</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}