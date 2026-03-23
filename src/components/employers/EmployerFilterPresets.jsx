import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const PRESETS = [
  { label: "Active", key: "active", filter: { status: "active" } },
  { label: "Prospects", key: "prospects", filter: { status: "prospect" } },
  { label: "Renewing Soon", key: "renewing", filter: { renewing: true } },
  { label: "By Employee Count", key: "employees", filter: { byEmployees: true } },
];

export default function EmployerFilterPresets({ activePreset, onApplyPreset, onClear }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map(p => (
        <Button
          key={p.key}
          variant={activePreset?.key === p.key ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => onApplyPreset(p)}
        >
          {p.label}
        </Button>
      ))}
      {activePreset && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={onClear}
        >
          <X className="w-3 h-3 mr-1" /> Clear
        </Button>
      )}
    </div>
  );
}