import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const defaultViews = [
  { key: "all", label: "All Plans" },
  { key: "active", label: "Active Plans" },
  { key: "medical", label: "Medical Plans" },
  { key: "missing_rates", label: "Plans Missing Rates" },
  { key: "expiring", label: "Plans Expiring Soon" },
];

export default function SavedViewsDropdown({ onSelect }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">Saved Views</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {defaultViews.map((view) => (
          <DropdownMenuItem key={view.key} onClick={() => onSelect(view.key)}>{view.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}