import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RatePreviewDrawer({ row, open, onClose, actions }) {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{row.rate_set_name || row.linkedPlanName}</SheetTitle>
        </SheetHeader>
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge>{row.rate_type}</Badge>
            <Badge variant="outline">{row.readinessStatus}</Badge>
            <Badge variant="outline">{row.scopeType}</Badge>
            <Badge variant="outline">{row.versionStatus}</Badge>
          </div>
          <InfoGrid row={row} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assignments</p>
            <p className="text-sm text-muted-foreground">Master Groups: {row.assignmentSummary.masterGroups.join(", ") || "—"}</p>
            <p className="text-sm text-muted-foreground">Tenants: {row.assignmentSummary.tenants.join(", ") || "—"}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issues</p>
            <div className="flex flex-wrap gap-2">
              {row.issueList.length ? row.issueList.map((issue) => <Badge key={issue} variant="secondary">{issue}</Badge>) : <span className="text-sm text-muted-foreground">No issues</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button size="sm" onClick={() => actions.onBuilder(row)}>Open Builder</Button>
            <Button size="sm" variant="outline" onClick={() => actions.onCompare(row)}>Compare</Button>
            <Button size="sm" variant="outline" onClick={() => actions.onAssign(row)}>Assign</Button>
            <Button size="sm" variant="outline" onClick={() => actions.onClone(row)}>Clone</Button>
            <Button size="sm" variant="outline" onClick={() => actions.onActivate(row)}>Activate Version</Button>
            <Button size="sm" variant="outline" onClick={() => actions.onArchive(row)}>Archive</Button>
            <Button size="sm" variant="outline" onClick={() => actions.onExport(row)}>Export</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoGrid({ row }) {
  const items = [
    ["Linked Plan", row.linkedPlanName],
    ["Carrier", row.carrier],
    ["Plan Type", row.planType],
    ["Effective Date", row.effective_date || "—"],
    ["End Date", row.end_date || "—"],
    ["Tier Summary", row.coverageTierSummary],
    ["Contribution Linkage", row.contributionLinkageStatus],
    ["Quote Usage", row.quoteUsageCount],
    ["Enrollment Usage", row.enrollmentUsageCount],
    ["Readiness Score", `${row.readinessScore}%`],
  ];

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 font-medium text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}