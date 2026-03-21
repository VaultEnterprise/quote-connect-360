import React from "react";
import { DollarSign, Users, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

export default function ContributionKPIBar({ models }) {
  if (!models.length) return null;

  const totalEmployer = models.reduce((s, m) => s + (m.total_monthly_employer_cost || 0), 0);
  const totalEmployee = models.reduce((s, m) => s + (m.total_monthly_employee_cost || 0), 0);
  const acaRisk = models.filter(m => m.aca_affordability_flag).length;
  const acaSafe = models.length - acaRisk;
  const avgEECost = models.length > 0 ? models.reduce((s, m) => s + (m.avg_employee_cost_ee_only || 0), 0) / models.length : 0;

  const stats = [
    {
      label: "Total Employer Cost/mo",
      value: `$${totalEmployer.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: `$${(totalEmployer * 12 / 1000).toFixed(0)}k/yr across all models`,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/5",
    },
    {
      label: "Avg EE Cost/mo",
      value: `$${avgEECost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      sub: `$${(avgEECost * 12).toFixed(0)}/yr per employee`,
      icon: Users,
      color: "text-foreground",
      bg: "bg-muted",
    },
    {
      label: "ACA Compliant",
      value: `${acaSafe}/${models.length}`,
      sub: acaRisk > 0 ? `${acaRisk} model(s) at risk` : "All models compliant",
      icon: acaRisk > 0 ? AlertCircle : CheckCircle2,
      color: acaRisk > 0 ? "text-red-600" : "text-emerald-600",
      bg: acaRisk > 0 ? "bg-red-50" : "bg-emerald-50",
    },
    {
      label: "Models Created",
      value: models.length,
      sub: "Active contribution models",
      icon: TrendingUp,
      color: "text-foreground",
      bg: "bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
        <div key={label} className={`rounded-xl border p-4 ${bg}`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
          </div>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  );
}