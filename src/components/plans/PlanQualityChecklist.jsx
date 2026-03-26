import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

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

  return null;
}