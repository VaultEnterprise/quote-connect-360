import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Send, Eye, CheckCircle, XCircle, AlertTriangle, TrendingUp, DollarSign, Clock } from "lucide-react";
import { isAfter, addDays, parseISO, differenceInDays } from "date-fns";

export default function ProposalKPIBar({ proposals, onFilterClick, activeFilter }) {
  const now = new Date();

  const counts = {
    draft: proposals.filter(p => p.status === "draft").length,
    sent: proposals.filter(p => p.status === "sent").length,
    viewed: proposals.filter(p => p.status === "viewed").length,
    approved: proposals.filter(p => p.status === "approved").length,
    rejected: proposals.filter(p => p.status === "rejected").length,
    expired: proposals.filter(p => p.status === "expired").length,
  };

  const expiringSoon = proposals.filter(p => {
    if (!p.expires_at || ["approved", "rejected", "expired"].includes(p.status)) return false;
    const expiry = parseISO(p.expires_at);
    return isAfter(expiry, now) && !isAfter(expiry, addDays(now, 7));
  }).length;

  // Stale = sent/viewed for >7 days with no action
  const stale = proposals.filter(p => {
    if (!["sent", "viewed"].includes(p.status)) return false;
    const ref = p.viewed_at || p.sent_at;
    if (!ref) return false;
    return differenceInDays(now, parseISO(ref)) > 7;
  }).length;

  const totalApprovedValue = proposals
    .filter(p => p.status === "approved" && p.total_monthly_premium)
    .reduce((sum, p) => sum + (p.total_monthly_premium || 0), 0);

  const conversionRate = (counts.sent + counts.viewed + counts.approved + counts.rejected) > 0
    ? Math.round((counts.approved / (counts.sent + counts.viewed + counts.approved + counts.rejected)) * 100)
    : 0;

  // Avg days to close (draft→approved)
  const closedWithDates = proposals.filter(p => p.status === "approved" && p.approved_at && p.created_date);
  const avgDaysToClose = closedWithDates.length > 0
    ? Math.round(closedWithDates.reduce((sum, p) => sum + differenceInDays(parseISO(p.approved_at), parseISO(p.created_date)), 0) / closedWithDates.length)
    : null;

  const metrics = [
    { label: "Draft",           value: counts.draft,   icon: FileText,       color: "text-muted-foreground", bg: "bg-muted/40",   filterKey: "status", filterVal: "draft" },
    { label: "Sent",            value: counts.sent,    icon: Send,           color: "text-blue-600",         bg: "bg-blue-50",    filterKey: "status", filterVal: "sent" },
    { label: "Viewed",          value: counts.viewed,  icon: Eye,            color: "text-purple-600",       bg: "bg-purple-50",  filterKey: "status", filterVal: "viewed" },
    { label: "Approved",        value: counts.approved,icon: CheckCircle,    color: "text-green-600",        bg: "bg-green-50",   filterKey: "status", filterVal: "approved" },
    { label: "Rejected",        value: counts.rejected,icon: XCircle,        color: "text-red-600",          bg: "bg-red-50",     filterKey: "status", filterVal: "rejected" },
    { label: "Expiring ≤7d",    value: expiringSoon,   icon: AlertTriangle,  color: expiringSoon > 0 ? "text-amber-600" : "text-muted-foreground", bg: expiringSoon > 0 ? "bg-amber-50" : "bg-muted/40", filterKey: "expiring", filterVal: "soon" },
    { label: "Stale",           value: stale,          icon: Clock,          color: stale > 0 ? "text-orange-600" : "text-muted-foreground", bg: stale > 0 ? "bg-orange-50" : "bg-muted/40", filterKey: "stale", filterVal: "true" },
    { label: "Conversion",      value: `${conversionRate}%`, icon: TrendingUp, color: conversionRate >= 50 ? "text-green-600" : "text-muted-foreground", bg: "bg-muted/40", filterKey: null },
    { label: avgDaysToClose !== null ? `${avgDaysToClose}d avg close` : "Avg Close", value: avgDaysToClose !== null ? avgDaysToClose : "—", icon: Clock, color: "text-primary", bg: "bg-primary/5", filterKey: null },
    { label: "Approved Value",  value: totalApprovedValue > 0 ? `$${(totalApprovedValue / 1000).toFixed(0)}k` : "—", icon: DollarSign, color: "text-primary", bg: "bg-primary/5", filterKey: null },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
      {metrics.map(m => {
        const Icon = m.icon;
        const isActive = activeFilter?.key === m.filterKey && activeFilter?.value === m.filterVal;
        const isClickable = !!m.filterKey;
        return (
          <Card
            key={m.label}
            className={`border transition-all ${isClickable ? "cursor-pointer hover:shadow-md hover:border-primary/30" : ""} ${isActive ? "ring-2 ring-primary border-primary/30 bg-primary/5" : ""}`}
            onClick={() => isClickable && onFilterClick?.(m.filterKey, m.filterVal)}
          >
            <CardContent className="p-3 flex flex-col items-center text-center gap-1">
              <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{m.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}