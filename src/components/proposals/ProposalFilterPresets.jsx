import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const DEFAULT_PRESETS = [
  { id: "1", name: "Ready to Send", icon: "📤", filters: { status: "draft" } },
  { id: "2", name: "Pending Review", icon: "👁️", filters: { status: "sent" } },
  { id: "3", name: "Awaiting Action", icon: "⏳", filters: { status: "viewed" } },
  { id: "4", name: "Approved", icon: "✅", filters: { status: "approved" } },
  { id: "5", name: "High Value", icon: "💎", filters: { minValue: 5000 } },
];

/**
 * UNWIRED COMPONENT: ProposalFilterPresets
 * Status: Partially integrated — onSelectPreset callback is stubbed in ProposalBuilder
 * TODO: Connect to ProposalBuilder filter logic to actually apply selected preset filters
 * Usage: Called in ProposalBuilder line 275 but does not update filters on click
 */
export default function ProposalFilterPresets({ onSelectPreset }) {
   const [presets, setPresets] = useState(DEFAULT_PRESETS);

  const removePreset = (id) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Filters</p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectPreset(p.filters)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group text-left text-xs"
          >
            <span>{p.icon}</span>
            <span className="font-medium">{p.name}</span>
            <button
              onClick={e => { e.stopPropagation(); removePreset(p.id); }}
              className="hidden group-hover:block opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
            </button>
          </button>
        ))}
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors text-xs">
          <Plus className="w-3 h-3" /> Save Filter
        </button>
      </div>
    </div>
  );
}