import React from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LIFECYCLE_STAGES = [
  { key: "draft", label: "Draft", description: "Case setup", order: 0 },
  { key: "census_in_progress", label: "Census", description: "Employee data", order: 1 },
  { key: "census_validated", label: "Validated", description: "Data reviewed", order: 1.5 },
  { key: "ready_for_quote", label: "Quoting", description: "Getting quotes", order: 2 },
  { key: "proposal_ready", label: "Proposal", description: "Review & approve", order: 3 },
  { key: "enrollment_open", label: "Enrollment", description: "Employee selection", order: 4 },
  { key: "active", label: "Active", description: "Coverage active", order: 5 },
];

export default function CaseLifecycleStatus({ stage, targetCloseDate }) {
  const currentStageIndex = LIFECYCLE_STAGES.findIndex(s => s.key === stage);
  const daysRemaining = targetCloseDate
    ? Math.ceil((new Date(targetCloseDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Case Lifecycle</p>
          {daysRemaining !== null && (
            <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
              {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d remaining`}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {LIFECYCLE_STAGES.map((s, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;
            return (
              <div key={s.key} className="flex items-start gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : isCurrent ? (
                  <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCurrent ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}