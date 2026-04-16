import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CensusReadinessPanel({ readiness }) {
  if (!readiness) return null;

  const items = [
    { label: "Quotes", ready: readiness.quoteReady, note: readiness.quoteReady ? "Validated population ready for pricing" : "Validation or error remediation required" },
    { label: "Enrollment", ready: readiness.enrollmentReady, note: readiness.enrollmentReady ? "Eligible employee population available" : "No validated eligible members" },
    { label: "Renewals", ready: readiness.renewalReady, note: readiness.renewalReady ? "Snapshot exists for renewal carry-forward" : "No census snapshot available" },
    { label: "Dashboard", ready: readiness.dashboardHealthy, note: readiness.dashboardHealthy ? "Counts and quality metrics can be trusted" : "Errors will distort rollups" },
  ];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Downstream Readiness</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{item.label}</p>
              <Badge variant="outline" className={item.ready ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"}>
                {item.ready ? "Ready" : "Blocked"}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{item.note}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}