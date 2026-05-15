import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import CensusErrorSummary from "@/components/census/CensusErrorSummary";
import CensusImportTimeline from "@/components/census/CensusImportTimeline";

export default function CensusImportStatusPanel({ job, onReprocess, reprocessing, events = [] }) {
  if (!job) return null;

  const progress = job.status === "completed" || job.status === "reprocessed"
    ? 100
    : job.status === "processing"
      ? 55
      : job.status === "uploaded" || job.status === "queued"
        ? 15
        : job.status === "failed"
          ? 100
          : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Census Import Status</CardTitle>
          <Button variant="outline" size="sm" onClick={onReprocess} disabled={reprocessing}>
            {reprocessing ? "Reprocessing..." : "Reprocess"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{job.source_file_name}</span>
            <span className="font-medium capitalize">{job.status}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><p className="text-muted-foreground">Rows</p><p className="font-semibold">{job.row_count || 0}</p></div>
          <div><p className="text-muted-foreground">Employees</p><p className="font-semibold">{job.employee_count || 0}</p></div>
          <div><p className="text-muted-foreground">Dependents</p><p className="font-semibold">{job.dependent_count || 0}</p></div>
          <div><p className="text-muted-foreground">Critical Errors</p><p className="font-semibold text-destructive">{job.critical_error_count || 0}</p></div>
          <div><p className="text-muted-foreground">Warnings</p><p className="font-semibold">{job.warning_count || 0}</p></div>
          <div><p className="text-muted-foreground">Last Processed</p><p className="font-semibold">{job.last_processed_at ? new Date(job.last_processed_at).toLocaleString() : "—"}</p></div>
        </div>

        {job.failure_reason && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {job.failure_reason}
          </div>
        )}

        <CensusErrorSummary job={job} />
        <CensusImportTimeline events={events} />
      </CardContent>
    </Card>
  );
}