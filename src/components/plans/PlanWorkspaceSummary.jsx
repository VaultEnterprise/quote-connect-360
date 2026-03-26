import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PlanWorkspaceSummary({ plan, schedules }) {
  const totalRows = schedules.reduce((sum, schedule) => sum + (schedule.row_count || 0), 0);
  const activeSchedules = schedules.filter((schedule) => schedule.is_active).length;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{plan.plan_type?.toUpperCase()}</Badge>
          {plan.network_type && <Badge variant="outline">{plan.network_type}</Badge>}
          {plan.hsa_eligible && <Badge variant="outline" className="border-green-300 text-green-700">HSA Eligible</Badge>}
          {plan.state && <Badge variant="outline">{plan.state}</Badge>}
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{plan.plan_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{plan.carrier}{plan.plan_code ? ` · ${plan.plan_code}` : ""}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Effective date</p>
            <p className="text-sm font-semibold mt-1">{plan.effective_date || "—"}</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Rate schedules</p>
            <p className="text-sm font-semibold mt-1">{schedules.length} total · {activeSchedules} active</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Imported rate rows</p>
            <p className="text-sm font-semibold mt-1">{totalRows}</p>
          </div>
        </div>

        {plan.notes && (
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm leading-relaxed">{plan.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}