import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardSecondaryMetrics({ summary, currentEnrollments, upcomingRenewalsCount }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Monthly Premium (completed)</p><p className="text-xl font-bold text-primary">{summary.totalPremium > 0 ? `$${(summary.totalPremium / 1000).toFixed(0)}k` : "—"}</p><p className={`text-xs mt-1 ${summary.comparisons.totalPremium.trend === "up" ? "text-green-600" : summary.comparisons.totalPremium.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>{summary.comparisons.totalPremium.label}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Open Exceptions</p><p className={`text-xl font-bold ${summary.openExceptions.length > 0 ? "text-destructive" : "text-foreground"}`}>{summary.openExceptions.length}</p><p className={`text-xs mt-1 ${summary.comparisons.openExceptions.trend === "up" ? "text-green-600" : summary.comparisons.openExceptions.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>{summary.comparisons.openExceptions.label}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Upcoming Renewals (90d)</p><p className="text-xl font-bold text-amber-600">{upcomingRenewalsCount(currentRenewals)}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Avg Enrollment Rate</p><p className="text-xl font-bold text-green-600">{(() => {
        const active = currentEnrollments.filter((item) => item.total_eligible > 0 && item.enrolled_count > 0);
        if (active.length === 0) return "—";
        const avg = Math.round(active.reduce((sum, item) => {
          const rate = item.participation_rate ?? Math.round((item.enrolled_count / item.total_eligible) * 100);
          return sum + rate;
        }, 0) / active.length);
        return `${avg}%`;
      })()}</p></CardContent></Card>
    </div>
  );
}