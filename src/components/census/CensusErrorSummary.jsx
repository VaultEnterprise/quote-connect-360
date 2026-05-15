import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CensusErrorSummary({ job }) {
  if (!job) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Error Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground">Critical</p>
          <p className="text-lg font-semibold text-destructive">{job.critical_error_count || 0}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground">Warnings</p>
          <p className="text-lg font-semibold">{job.warning_count || 0}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground">Info</p>
          <p className="text-lg font-semibold">{job.informational_count || 0}</p>
        </div>
      </CardContent>
    </Card>
  );
}