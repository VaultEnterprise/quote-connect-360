import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function QuotePipelinePanel({ scenarios = [] }) {
  const buckets = [
    { key: "draft", label: "Draft" },
    { key: "running", label: "Running" },
    { key: "reviewed", label: "Reviewed" },
    { key: "approved", label: "Approved" },
    { key: "converted_to_enrollment", label: "Converted" },
  ];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quote Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {buckets.map((bucket) => {
          const count = scenarios.filter((scenario) => scenario.status === bucket.key).length;
          return (
            <div key={bucket.key} className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{bucket.label}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-2xl font-semibold tracking-tight">{count}</span>
                {count > 0 ? <Badge variant="outline" className="text-[10px]">Active</Badge> : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}