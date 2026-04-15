import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";

export default function ComplianceAlerts({ cases = [], scenarios = [] }) {
  const alerts = [];

  // Check for ACA affordability issues (contribution models should flag these)
  const affordabilityIssues = scenarios.filter(s => s.status === "completed" && s.total_monthly_premium && s.employer_monthly_cost && (s.employer_monthly_cost / s.total_monthly_premium) < 0.05);
  
  if (affordabilityIssues.length > 0) {
    alerts.push({
      id: "aca",
      title: "ACA Affordability Risk",
      message: `${affordabilityIssues.length} scenario(s) below 9.5% threshold`,
      severity: "high"
    });
  }

  // Check for stalled cases (no activity > 30 days)
  const now = new Date();
  const stalledCases = cases.filter(c => {
    const lastActivity = new Date(c.last_activity_date || c.created_date);
    return (now - lastActivity) / (1000 * 60 * 60 * 24) > 30 && !["closed", "renewed"].includes(c.stage);
  });

  if (stalledCases.length > 0) {
    alerts.push({
      id: "stalled",
      title: "Stalled Cases",
      message: `${stalledCases.length} case(s) inactive 30+ days`,
      severity: "medium"
    });
  }

  // Check for missing census in active cases
  const noCensus = cases.filter(c => ["census_in_progress", "ready_for_quote", "quoting"].includes(c.stage) && c.census_status === "not_started");
  if (noCensus.length > 0) {
    alerts.push({
      id: "census",
      title: "Missing Census Data",
      message: `${noCensus.length} case(s) need census upload`,
      severity: "high"
    });
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">All systems compliant ✓</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Compliance Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-white border border-amber-100">
              <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.severity === "high" ? "text-red-500" : "text-amber-600"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.message}</p>
              </div>
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${a.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                {a.severity}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}