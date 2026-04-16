import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PlanPreviewDrawer({ plan, open, onClose, onEdit, onClone, onArchive }) {
  if (!plan) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{plan.plan_name}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge>{plan.plan_type}</Badge>
            <Badge variant="outline">{plan.status}</Badge>
            <Badge variant="outline">{plan.readinessStatus}</Badge>
            <Badge variant="outline">{plan.versionLabel}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Carrier" value={plan.carrier} />
            <InfoRow label="Plan Code" value={plan.plan_code || "—"} />
            <InfoRow label="Effective Date" value={plan.effective_date || "—"} />
            <InfoRow label="State" value={plan.state || "—"} />
            <InfoRow label="Rate Status" value={plan.rateSummary?.hasRates ? "Ready" : "Missing"} />
            <InfoRow label="Usage" value={`${plan.totalUsageCount || 0} downstream`} />
            <InfoRow label="Readiness Score" value={`${plan.readinessScore}%`} />
            <InfoRow label="Updated By" value={plan.updatedByLabel} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operational readiness</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant={plan.rateSummary?.hasRates ? "default" : "secondary"}>Rates {plan.rateSummary?.hasRates ? "ready" : "missing"}</Badge>
              <Badge variant={plan.assignmentStatus === "assigned" ? "default" : "secondary"}>Assignments {plan.assignmentStatus}</Badge>
              <Badge variant={plan.documentStatus === "attached" ? "default" : "secondary"}>Documents {plan.documentStatus}</Badge>
              <Badge variant={plan.contributionStatus === "configured" ? "default" : "secondary"}>Contributions {plan.contributionStatus}</Badge>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issues</p>
            {plan.issues?.length ? (
              <div className="flex flex-wrap gap-2">
                {plan.issues.map((issue) => <Badge key={issue} variant="secondary">{issue}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No issues found.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button size="sm" onClick={() => onEdit(plan)}>Edit</Button>
            <Button size="sm" variant="outline" onClick={() => onClone(plan)}>Clone</Button>
            <Button size="sm" variant="outline" onClick={() => onArchive(plan)}>Archive</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  );
}