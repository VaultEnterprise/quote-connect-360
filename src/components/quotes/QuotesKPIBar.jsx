import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, AlertTriangle, DollarSign, TrendingUp, Zap } from "lucide-react";
import { isAfter, addDays, parseISO } from "date-fns";

export default function QuotesKPIBar({ scenarios }) {
  const now = new Date();

  const completed = scenarios.filter(s => s.status === "completed");

  const expiringSoon = scenarios.filter(s => {
    if (!s.expires_at || ["expired"].includes(s.status)) return false;
    const exp = parseISO(s.expires_at);
    return isAfter(exp, now) && !isAfter(exp, addDays(now, 14));
  });

  const totalActivePremium = completed.reduce((sum, s) => sum + (s.total_monthly_premium || 0), 0);
  const avgEmployerCost = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.employer_monthly_cost || 0), 0) / completed.length)
    : 0;
  const recommended = scenarios.filter(s => s.is_recommended).length;

  const metrics = [
    {
      label: "Total Scenarios",
      value: scenarios.length,
      icon: FileText,
      color: "text-foreground",
      bg: "bg-muted/40",
    },
    {
      label: "Completed",
      value: completed.length,
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Pending Calc",
      value: scenarios.filter(s => s.status === "draft").length,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Expiring ≤14d",
      value: expiringSoon.length,
      icon: AlertTriangle,
      color: expiringSoon.length > 0 ? "text-orange-600" : "text-muted-foreground",
      bg: expiringSoon.length > 0 ? "bg-orange-50" : "bg-muted/40",
    },
    {
      label: "Completed Premium/mo",
      value: totalActivePremium > 0 ? `$${(totalActivePremium / 1000).toFixed(0)}k` : "—",
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/5",
    },
    {
      label: "Avg Employer/mo",
      value: avgEmployerCost > 0 ? `$${avgEmployerCost.toLocaleString()}` : "—",
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Recommended",
      value: recommended,
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50",
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