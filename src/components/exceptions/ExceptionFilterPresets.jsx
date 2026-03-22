import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Plus, Trash2, Star } from "lucide-react";

const DEFAULT_PRESETS = [
  { id: "p1", name: "Critical Now", filters: { severity: "critical", status: "open" }, icon: "🔴", count: 3 },
  { id: "p2", name: "My Overdue", filters: { assigned_to: "me", overdue: true }, icon: "⏰", count: 2 },
  { id: "p3", name: "Carrier Issues", filters: { category: "carrier", status: "open" }, icon: "🏥", count: 5 },
  { id: "p4", name: "Waiting on Us", filters: { status: "in_progress", assigned_to: "me" }, icon: "👤", count: 1 },
  { id: "p5", name: "This Week", filters: { created_after: "7d_ago", status: "open" }, icon: "📅", count: 8 },
];

export default function ExceptionFilterPresets({ onSelectPreset }) {
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [saved, setSaved] = useState(false);

  const addPreset = (name) => {
    const newPreset = {
      id: `p${presets.length + 1}`,
      name,
      filters: {},
      icon: "⭐",
      count: 0
    };
    setPresets(prev => [...prev, newPreset]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Filters</p>
        {saved && <span className="text-[9px] text-green-600 flex items-center gap-1"><Star className="w-2.5 h-2.5 fill-green-600" /> Saved</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectPreset(p.filters)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group text-left text-xs"
          >
            <span className="text-sm">{p.icon}</span>
            <span className="font-medium">{p.name}</span>
            <Badge variant="outline" className="text-[8px] py-0 ml-auto">{p.count}</Badge>
            <button
              onClick={e => { e.stopPropagation(); setPresets(prev => prev.filter(x => x.id !== p.id)); }}
              className="hidden group-hover:block opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
            </button>
          </button>
        ))}
        <button
          onClick={() => addPreset("New Preset")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors text-xs">
          <Plus className="w-3 h-3" /> Save Filter
        </button>
      </div>
    </div>
  );
}