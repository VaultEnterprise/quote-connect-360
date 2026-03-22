import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Send, Eye, CheckCircle, XCircle, AlertTriangle, TrendingUp, DollarSign, Clock } from "lucide-react";
import { isAfter, addDays, parseISO, subDays } from "date-fns";
import { cn } from "@/lib/utils";

export default function ProposalKPIBar({ proposals, onFilterClick, activeFilter, staleCount = 0 }) {
  const now = new Date();

  const counts = {
    draft:    proposals.filter(p => p.status === "draft").length,
    sent:     proposals.filter(p => p.status === "sent").length,
    viewed:   proposals.filter(p => p.status === "viewed").length,
    approved: proposals.filter(p => p.status === "approved").length,
    rejected: proposals.filter(p => p.status === "rejected").length,
    expired:  proposals.filter(p => p.status === "expired").length,
  };

  const expiringSoon = proposals.filter(p => {
    if (!p.expires_at || ["approved","rejected","expired"].includes(p.status)) return false;
    const expiry = parseISO(p.expires_at);
    return isAfter(expiry, now) && !isAfter(expiry, addDays(now, 7));
  }).length;

  const totalApprovedValue = proposals
    .filter(p => p.status === "approved" && p.total_monthly_premium)
    .reduce((sum, p) => sum + (p.total_monthly_premium || 0), 0);

  const conversionRate = (counts.sent + counts.viewed + counts.approved + counts.rejected) > 0
    ? Math.round((counts.approved / (counts.sent + counts.viewed + counts.approved + counts.rejected)) * 100)
    : 0;

  const avgDaysToClose = (() => {
    const closed = proposals.filter(p => p.status === "approved" && p.sent_at && p.approved_at);
    if (!closed.length) return null;
    const total = closed.reduce((s, p) => {
      const diff = (new Date(p.approved_at) - new Date(p.sent_at)) / (1000 * 60 * 60 * 24);
      return s + diff;
    }, 0);
    return Math.round(total / closed.length);
  })();

  const metrics = [
    { key: "status", value: "draft",    label: "Draft",         display: counts.draft,    icon: FileText,    color: "text-muted-foreground", bg: "bg-muted/40" },
    { key: "status", value: "sent",     label: "Sent",          display: counts.sent,     icon: Send,        color: "text-blue-600",         bg: "bg-blue-50" },
    { key: "status", value: "viewed",   label: "Viewed",        display: counts.viewed,   icon: Eye,         color: "text-purple-600",       bg: "bg-purple-50" },
    { key: "status", value: "approved", label: "Approved",      display: counts.approved, icon: CheckCircle, color: "text-green-600",        bg: "bg-green-50" },
    { key: "status", value: "rejected", label: "Rejected",      display: counts.rejected, icon: XCircle,     color: "text-red-600",          bg: "bg-red-50" },
    { key: "expiring", value: "expiring", label: "Expiring ≤7d", display: expiringSoon, icon: AlertTriangle, color: expiringSoon > 0 ? "text-amber-600" : "text-muted-foreground", bg: expiringSoon > 0 ? "bg-amber-50" : "bg-muted/40" },
    { key: "stale",  value: "stale",   label: "Stale (7d+)",   display: staleCount,      icon: Clock,       color: staleCount > 0 ? "text-orange-600" : "text-muted-foreground", bg: staleCount > 0 ? "bg-orange-50" : "bg-muted/40" },
    { key: "conversion", value: null,  label: "Conversion",    display: `${conversionRate}%`, icon: TrendingUp, color: conversionRate >= 50 ? "text-green-600" : "text-muted-foreground", bg: "bg-muted/40", nonClickable: true },
    { key: "avgDays", value: null,     label: "Avg Days Close", display: avgDaysToClose !== null ? `${avgDaysToClose}d` : "—", icon: Clock, color: "text-muted-foreground", bg: "bg-muted/40", nonClickable: true },
    { key: "value",  value: null,      label: "Approved Value", display: totalApprovedValue > 0 ? `$${(totalApprovedValue / 1000).toFixed(0)}k` : "—", icon: DollarSign, color: "text-primary", bg: "bg-primary/5", nonClickable: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
      {metrics.map(m => {
        const Icon = m.icon;
        const isActive = activeFilter?.key === m.key && activeFilter?.value === m.value;
        const clickable = !m.nonClickable && onFilterClick;
        return (
          <Card
            key={`${m.key}-${m.value}`}
            className={cn(
              "border transition-all",
              clickable && "cursor-pointer hover:shadow-md hover:border-primary/30",
              isActive && "ring-2 ring-primary/40 border-primary/30 shadow-md"
            )}
            onClick={clickable ? () => onFilterClick(m.key, m.value) : undefined}
          >
            <CardContent className="p-2.5 flex flex-col items-center text-center gap-1">
              <div className={`w-7 h-7 rounded-md ${m.bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
              <p className={`text-lg font-bold leading-tight ${m.color}`}>{m.display}</p>
              <p className="text-[9px] text-muted-foreground leading-tight">{m.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}