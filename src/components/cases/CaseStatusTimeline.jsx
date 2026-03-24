import React from "react";
import { Badge } from "@/components/ui/badge";

const STAGES = [
  "draft", "census_in_progress", "census_validated", "ready_for_quote",
  "quoting", "proposal_ready", "employer_review", "approved_for_enrollment",
  "enrollment_open", "enrollment_complete", "install_in_progress", "active"
];

export default function CaseStatusTimeline({ stage }) {
  const currentIdx = STAGES.indexOf(stage) || 0;
  const progress = Math.round((currentIdx / STAGES.length) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground capitalize">{stage?.replace(/_/g, " ") || "Draft"}</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between px-1">
        {STAGES.slice(0, 4).map((s, i) => (
          <div key={s} className={`text-[10px] ${i <= currentIdx ? "font-bold text-primary" : "text-muted-foreground"}`}>
            {s.split("_")[0][0]}
          </div>
        ))}
        <span className="text-[10px] text-muted-foreground">...</span>
        {STAGES.slice(-3).map((s, i) => (
          <div key={s} className={`text-[10px] ${STAGES.indexOf(stage) >= STAGES.length - 3 - (2 - i) ? "font-bold text-primary" : "text-muted-foreground"}`}>
            {s.split("_")[0][0]}
          </div>
        ))}
      </div>
    </div>
  );
}