import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PlansIssuesPanel({ plans, onSelectPlan }) {
  const issuePlans = plans.filter((plan) => plan.issues?.length > 0).slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Missing requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {issuePlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plan issues detected in the current scope.</p>
        ) : issuePlans.map((plan) => (
          <button key={plan.id} onClick={() => onSelectPlan(plan)} className="block w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/40">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{plan.plan_name}</p>
                <p className="text-xs text-muted-foreground">{plan.carrier}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{plan.issues.length} issues</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {plan.issues.slice(0, 3).map((issue) => (
                <Badge key={issue} variant="secondary" className="text-[10px]">{issue}</Badge>
              ))}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}