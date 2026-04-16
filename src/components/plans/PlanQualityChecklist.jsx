import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function PlanQualityChecklist({ plans }) {
  const issues = [];

  // Check for missing rate tables
  const plansWithoutRates = plans.filter(p => !p.rate_tables || p.rate_tables.length === 0);
  if (plansWithoutRates.length > 0) {
    issues.push({
      severity: "high",
      title: "Missing Rate Tables",
      desc: `${plansWithoutRates.length} plan${plansWithoutRates.length !== 1 ? "s" : ""} need rate tables to be quoted.`,
      count: plansWithoutRates.length
    });
  }

  // Check for incomplete medical plans
  const incompleteMedical = plans.filter(p =>
    p.plan_type === "medical" &&
    (!p.deductible_individual || !p.oop_max_individual)
  );
  if (incompleteMedical.length > 0) {
    issues.push({
      severity: "medium",
      title: "Incomplete Medical Plans",
      desc: `${incompleteMedical.length} medical plan${incompleteMedical.length !== 1 ? "s" : ""} missing deductible/OOP data.`,
      count: incompleteMedical.length
    });
  }

  // Check for plans without carrier
  const noCarrier = plans.filter(p => !p.carrier);
  if (noCarrier.length > 0) {
    issues.push({
      severity: "low",
      title: "Missing Carrier Info",
      desc: `${noCarrier.length} plan${noCarrier.length !== 1 ? "s" : ""} don't specify a carrier.`,
      count: noCarrier.length
    });
  }

  if (issues.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">Plan Library Healthy</p>
            <p className="text-xs text-green-600">All {plans.length} plans are properly configured.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Quality Issues ({issues.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.map((issue, i) => (
          <div key={i} className={`p-3 rounded-lg border ${
            issue.severity === "high"
              ? "bg-red-50 border-red-200"
              : issue.severity === "medium"
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${
                  issue.severity === "high"
                    ? "text-red-700"
                    : issue.severity === "medium"
                      ? "text-amber-700"
                      : "text-blue-700"
                }`}>
                  {issue.title}
                </p>
                <p className={`text-[10px] mt-0.5 ${
                  issue.severity === "high"
                    ? "text-red-600"
                    : issue.severity === "medium"
                      ? "text-amber-600"
                      : "text-blue-600"
                }`}>
                  {issue.desc}
                </p>
              </div>
              <Badge className={
                issue.severity === "high"
                  ? "bg-red-100 text-red-700 border-red-200 border text-[9px] py-0 flex-shrink-0"
                  : issue.severity === "medium"
                    ? "bg-amber-100 text-amber-700 border-amber-200 border text-[9px] py-0 flex-shrink-0"
                    : "bg-blue-100 text-blue-700 border-blue-200 border text-[9px] py-0 flex-shrink-0"
              }>
                {issue.count}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}