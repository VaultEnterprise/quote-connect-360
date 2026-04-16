import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmployerDependencyPanel({ controlPlane }) {
  if (!controlPlane) return null;

  const checks = [
    { label: "Census alignment", pass: controlPlane.readiness.censusAligned },
    { label: "Quote alignment", pass: controlPlane.readiness.quoteAligned },
    { label: "Enrollment alignment", pass: controlPlane.readiness.enrollmentAligned },
    { label: "Renewal alignment", pass: controlPlane.readiness.renewalAligned },
    { label: "Integration alignment", pass: controlPlane.readiness.integrationsAligned },
  ];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Employer Dependency Trace</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {checks.map((check) => (
          <div key={check.label} className="rounded-2xl border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{check.label}</p>
              <Badge variant="outline" className={check.pass ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"}>
                {check.pass ? "Healthy" : "Risk"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}