import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildScenarioOperationalSummary } from "./quoteEngine";

export default function ScenarioDecisionPanel({ scenario, caseRecord, censusStats, scenarioPlans }) {
  const summary = buildScenarioOperationalSummary({ scenario, caseRecord, censusStats, scenarioPlans });

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Decision Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Case: {summary.downstreamStatus.caseStage.replace(/_/g, " ")}</Badge>
          <Badge variant="outline">Quote: {summary.downstreamStatus.quoteStatus.replace(/_/g, " ")}</Badge>
          <Badge variant="outline">Enrollment: {summary.downstreamStatus.enrollmentStatus.replace(/_/g, " ")}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Census dependency</p>
            <p className="mt-2 text-sm font-medium">{summary.missingCensus ? "Missing eligible census" : "Connected"}</p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Plan assignment</p>
            <p className="mt-2 text-sm font-medium">{summary.missingPlanAssignments ? "No plans attached" : `${scenarioPlans.length} plans linked`}</p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">Downstream readiness</p>
            <p className="mt-2 text-sm font-medium">{summary.readyForEnrollment ? "Ready for handoff" : "Not ready yet"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}