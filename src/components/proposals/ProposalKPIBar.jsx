import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Send, Eye, CheckCircle, XCircle, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { isAfter, addDays, parseISO } from "date-fns";

export default function ProposalKPIBar({ proposals }) {
  const now = new Date();
  const active = proposals.filter(p => !["rejected"].includes(p.status));

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

  const totalApprovedValue = proposals
    .filter(p => p.status === "approved" && p.total_monthly_premium)
    .reduce((sum, p) => sum + (p.total_monthly_premium || 0), 0);

  const conversionRate = (counts.sent + counts.viewed + counts.approved + counts.rejected) > 0
    ? Math.round((counts.approved / (counts.sent + counts.viewed + counts.approved + counts.rejected)) * 100)
    : 0;

  const metrics = [
    {
      label: "Draft",
      value: counts.draft,
      icon: FileText,
      color: "text-muted-foreground",
      bg: "bg-muted/40",
    },
    {
      label: "Sent / Viewed",
      value: counts.sent + counts.viewed,
      icon: Send,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Approved",
      value: counts.approved,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Rejected",
      value: counts.rejected,
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Expiring ≤7 days",
      value: expiringSoon,
      icon: AlertTriangle,
      color: expiringSoon > 0 ? "text-amber-600" : "text-muted-foreground",
      bg: expiringSoon > 0 ? "bg-amber-50" : "bg-muted/40",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: conversionRate >= 50 ? "text-green-600" : "text-muted-foreground",
      bg: "bg-muted/40",
    },
    {
      label: "Approved Value/mo",
      value: totalApprovedValue > 0 ? `$${(totalApprovedValue / 1000).toFixed(0)}k` : "—",
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/5",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {metrics.map(m => {
        const Icon = m.icon;
        return (
          <Card key={m.label} className="border">
            <CardContent className="p-3 flex flex-col items-center text-center gap-1">
              <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{m.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}