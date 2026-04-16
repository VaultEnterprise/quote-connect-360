import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildQuoteReadiness } from "@/components/quotes/quoteGovernanceEngine";

export default function QuoteDependencyPanel({ scenarios, cases, censusVersions, enrollments, renewals }) {
  const withoutCensus = scenarios.filter((scenario) => !censusVersions.some((version) => version.case_id === scenario.case_id));
  const withoutPlans = scenarios.filter((scenario) => !scenario.plan_count);
  const errored = scenarios.filter((scenario) => scenario.status === "error");
  const downstreamCases = cases.filter((item) => item.quote_status === "completed");
  const notReadyForEnrollment = scenarios.filter((scenario) => {
    const caseRecord = cases.find((item) => item.id === scenario.case_id);
    const readiness = buildQuoteReadiness({ scenario, caseRecord, censusVersions, enrollments, renewals });
    return scenario.status === "approved" && !readiness.checks.enrollmentCompatible;
  });

  const issues = [
    { label: "No census input", value: withoutCensus.length },
    { label: "No rated plans", value: withoutPlans.length },
    { label: "Calculation errors", value: errored.length },
    { label: "Blocked approvals", value: notReadyForEnrollment.length },
    { label: "Enrollment handoffs", value: enrollments.length },
    { label: "Renewal dependencies", value: renewals.length },
    { label: "Case outputs", value: downstreamCases.length },
  ];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Pricing Dependency Trace</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {issues.map((issue) => (
          <div key={issue.label} className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{issue.label}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl font-semibold tracking-tight">{issue.value}</span>
              {issue.value > 0 && issue.label !== "Enrollment handoffs" && issue.label !== "Renewal dependencies" && issue.label !== "Case outputs" && (
                <Badge variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">Attention</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}