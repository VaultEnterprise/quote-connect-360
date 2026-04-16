import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RatesIssuesPanel({ issues, onSelectRow }) {
  return (
    <>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No operational issues detected in the current scope.</p>
      ) : issues.map((issue) => (
        <>
          <div>
          </div>
          <Badge variant="outline" className="capitalize">{issue.severity}</Badge>
          <div className="mt-2 space-y-1">
            {issue.rows.slice(0, 3).map((row) => (
            ))}
          </div>
        </>
      ))}
    </>
  );
}