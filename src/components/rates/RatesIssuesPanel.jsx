import React from "react";
import { Badge } from "@/components/ui/badge";

export default function RatesIssuesPanel({ issues }) {
  return (
    <>
      {issues.length === 0 ? (
        <p className="text-sm text-muted-foreground">No operational issues detected in the current scope.</p>
      ) : (
        issues.map((issue, index) => (
          <div key={`${issue.severity}-${index}`} className="mb-3 last:mb-0">
            <Badge variant="outline" className="capitalize">
              {issue.severity}
            </Badge>
          </div>
        ))
      )}
    </>
  );
}