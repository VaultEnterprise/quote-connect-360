import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RatesIssuesPanel({ issues, onSelectRow }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground">Rate readiness issues</h3>
      </div>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No operational issues detected in the current scope.</p>
      ) : issues.map((issue) => (
        <div key={issue.title}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{issue.title}</p>
              <p className="text-xs text-muted-foreground">{issue.count} affected records</p>
            </div>
            <Badge variant="outline" className="capitalize">{issue.severity}</Badge>
          </div>
          <div className="mt-2 space-y-1">
            {issue.rows.slice(0, 3).map((row) => (
              <button key={row.id} onClick={() => onSelectRow(row)} className="block text-left text-xs text-primary hover:underline">{row.rate_set_name || row.linkedPlanName}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}