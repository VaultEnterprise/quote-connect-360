import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";

/**
 * RenewalKPIBar
 * Enhanced KPI metrics with rate distribution, urgency, and decision tracking.
 *
 * Props:
 *   renewals — RenewalCycle[]
 */
export default function RenewalKPIBar({ renewals }) {
  // Due this month
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dueThisMonth = renewals.filter(r => {
    if (!r.renewal_date) return false;
    const d = new Date(r.renewal_date);
    return d <= monthEnd && d >= now;
  }).length;

  // Rate changes
  const rateIncreases = renewals.filter(r => r.rate_change_percent && r.rate_change_percent > 0).length;
  const rateDecreases = renewals.filter(r => r.rate_change_percent && r.rate_change_percent < 0).length;

  // Awaiting decision
  const awaitingDecision = renewals.filter(r => r.status === "employer_review").length;

  // Premium at risk (sum of current premium on active renewals)
  const premiumAtRisk = renewals
    .filter(r => !["completed", "terminated"].includes(r.status))
    .reduce((sum, r) => sum + (r.current_premium || 0), 0);

  const metrics = [
    { label: "Due This Month", value: dueThisMonth, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Rate Increases", value: rateIncreases, icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
    { label: "Rate Decreases", value: rateDecreases, icon: TrendingDown, color: "text-green-600", bg: "bg-green-50" },
    { label: "Awaiting Decision", value: awaitingDecision, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Premium at Risk", value: `$${(premiumAtRisk / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <Card key={i} className={`${m.bg} border-0`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                  <p className={`text-lg font-bold ${m.color} mt-0.5`}>{m.value}</p>
                </div>
                <Icon className={`w-4 h-4 ${m.color} flex-shrink-0`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}