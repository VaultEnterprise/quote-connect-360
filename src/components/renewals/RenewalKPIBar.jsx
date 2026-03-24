import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, XCircle } from "lucide-react";

/**
 * RenewalKPIBar
 * Clickable KPI tiles that apply a filter to the renewal list.
 *
 * Props:
 *   renewals     — RenewalCycle[]
 *   onFilterClick — (filterKey, filterValue) => void
 *   activeFilter  — { key, value } | null
 */
export default function RenewalKPIBar({ renewals, onFilterClick, activeFilter }) {
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const dueThisMonth = renewals.filter(r => {
    if (!r.renewal_date) return false;
    const d = new Date(r.renewal_date);
    return d <= monthEnd && d >= now;
  }).length;

  const pastDue = renewals.filter(r => {
    if (!r.renewal_date || ["completed"].includes(r.status)) return false;
    return new Date(r.renewal_date) < now;
  }).length;

  const rateIncreases = renewals.filter(r => r.rate_change_percent && r.rate_change_percent > 0).length;
  const awaitingDecision = renewals.filter(r => r.status === "employer_review").length;

  const premiumAtRisk = renewals
    .filter(r => !["completed"].includes(r.status))
    .reduce((sum, r) => sum + (r.current_premium || 0), 0);

  const metrics = [
    { label: "Past Due", value: pastDue, icon: XCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", filterKey: "overdue", filterValue: "overdue" },
    { label: "Due This Month", value: dueThisMonth, icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", filterKey: "urgency", filterValue: "30" },
    { label: "Rate Increases", value: rateIncreases, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100", filterKey: "rateDirection", filterValue: "increases" },
    { label: "Awaiting Decision", value: awaitingDecision, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", filterKey: "status", filterValue: "employer_review" },
    { label: "Premium at Risk", value: `$${(premiumAtRisk / 1000).toFixed(0)}K`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", filterKey: null, filterValue: null },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        const isActive = activeFilter?.key === m.filterKey && activeFilter?.value === m.filterValue;
        const isClickable = !!m.filterKey;
        return (
          <Card
            key={i}
            className={`${m.bg} border ${m.border} transition-all ${isClickable ? "cursor-pointer hover:shadow-md" : ""} ${isActive ? "ring-2 ring-offset-1 ring-primary/40 shadow-md" : ""}`}
            onClick={() => isClickable && onFilterClick?.(m.filterKey, m.filterValue)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                  <p className={`text-xl font-bold ${m.color} mt-0.5`}>{m.value}</p>
                  {isClickable && <p className="text-[10px] text-muted-foreground mt-0.5">{isActive ? "Click to clear" : "Click to filter"}</p>}
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