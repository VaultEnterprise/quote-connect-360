import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RatesDependencyPanel({ summary }) {
  const items = [
    { label: "Plans without rates", value: summary.plansWithoutRates },
    { label: "Quoted plans blocked", value: summary.quotedPlansWithoutRates },
    { label: "Quote consumers", value: summary.quotedScenarios },
    { label: "Enrollment consumers", value: summary.enrollmentDependencies },
    { label: "Renewal consumers", value: summary.renewalDependencies },
  ];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pricing Dependency Trace</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-semibold tracking-tight">{item.value}</span>
              {item.label.includes("without") || item.label.includes("blocked") ? (
                item.value > 0 ? <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">Attention</Badge> : <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">Healthy</Badge>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}