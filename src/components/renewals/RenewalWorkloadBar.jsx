import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

/**
 * RenewalWorkloadBar
 * Shows a breakdown of open renewals per assigned broker.
 *
 * Props:
 *   renewals       — RenewalCycle[]
 *   onFilterAssignee — (email) => void
 *   activeAssignee   — string | "all"
 */
export default function RenewalWorkloadBar({ renewals, onFilterAssignee, activeAssignee }) {
  // Count open renewals per assignee
  const open = renewals.filter(r => r.status !== "completed");
  const counts = {};
  open.forEach(r => {
    const key = r.assigned_to || "Unassigned";
    counts[key] = (counts[key] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;

  if (sorted.length === 0) return null;

  return (
    <Card className="border bg-card">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workload by Broker</p>
        </div>
        <div className="space-y-2">
          {sorted.map(([assignee, count]) => {
            const label = assignee === "Unassigned" ? "Unassigned" : assignee.split("@")[0];
            const isActive = activeAssignee === assignee;
            return (
              <button
                key={assignee}
                onClick={() => onFilterAssignee?.(isActive ? "all" : assignee)}
                className={`w-full text-left group transition-all rounded px-1 py-0.5 ${isActive ? "bg-primary/10" : "hover:bg-muted/50"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-medium truncate ${isActive ? "text-primary" : ""}`}>{label}</span>
                  <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{count}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isActive ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/60"}`}
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}