import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wallet, ShieldCheck } from "lucide-react";
import { computeScenarioContributionView, formatCurrency, getScenarioCensusStats } from "./quoteEngine";

export default function QuoteScenarioInsights({ scenario, censusMembers = [] }) {
  const censusStats = getScenarioCensusStats(censusMembers);
  const summary = computeScenarioContributionView({ scenario, censusStats });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Eligible census</p>
          </div>
          <p className="text-lg font-semibold">{summary.employeeCount}</p>
          <p className="text-xs text-muted-foreground">{summary.dependentCount} with dependents</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Cost share</p>
          </div>
          <p className="text-lg font-semibold">{formatCurrency(summary.employerMonthlyCost)}/mo</p>
          <p className="text-xs text-muted-foreground">Employer {summary.employerPct}% • Employee {summary.employeePct}%</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Scenario state</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{scenario.status}</Badge>
            {scenario.approval_status && scenario.approval_status !== "none" && (
              <Badge className="capitalize">{scenario.approval_status}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{scenario.plan_count || 0} rated plans • {scenario.carriers_included?.length || 0} carriers</p>
        </CardContent>
      </Card>
    </div>
  );
}