import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertTriangle, Clock, XCircle, CheckCircle } from "lucide-react";
import { differenceInDays, format, parseISO, isValid } from "date-fns";

function getDateStatus(plan) {
  const today = new Date();
  const alerts = [];

  if (plan.effective_date) {
    const eff = parseISO(plan.effective_date);
    if (isValid(eff)) {
      const daysToEff = differenceInDays(eff, today);
      if (daysToEff > 0 && daysToEff <= 30) alerts.push({ type: "activation", days: daysToEff, label: `Activates in ${daysToEff} day(s)`, severity: daysToEff <= 7 ? "critical" : "warning", date: format(eff, "MMM d, yyyy") });
    }
  }

  if (plan.policy_expiration_date) {
    const term = parseISO(plan.policy_expiration_date);
    if (isValid(term)) {
      const daysToTerm = differenceInDays(term, today);
      if (daysToTerm >= 0 && daysToTerm <= 90) alerts.push({ type: "expiration", days: daysToTerm, label: `Expires in ${daysToTerm} day(s)`, severity: daysToTerm <= 14 ? "critical" : daysToTerm <= 30 ? "high" : "warning", date: format(term, "MMM d, yyyy") });
      if (daysToTerm < 0) alerts.push({ type: "expired", days: Math.abs(daysToTerm), label: `Expired ${Math.abs(daysToTerm)} day(s) ago`, severity: "critical", date: format(term, "MMM d, yyyy") });
    }
  }

  return alerts;
}

const SEVERITY_STYLES = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

const SEVERITY_ICONS = {
  critical: XCircle,
  high: AlertTriangle,
  warning: Clock,
};

export default function PlanEffectiveDateManager({ plans }) {
  const allAlerts = useMemo(() => {
    const items = [];
    plans.forEach(p => {
      const alerts = getDateStatus(p);
      alerts.forEach(a => items.push({ ...a, planName: p.plan_name, carrier: p.carrier, planId: p.id }));
    });
    return items.sort((a, b) => {
      const order = { critical: 0, high: 1, warning: 2 };
      return (order[a.severity] || 3) - (order[b.severity] || 3);
    });
  }, [plans]);

  if (allAlerts.length === 0) return null;

  return (
    <Card className="border-amber-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <CardTitle className="text-sm text-amber-800">Policy Date Alerts</CardTitle>
          <Badge className="bg-amber-100 text-amber-700 ml-auto">{allAlerts.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {allAlerts.map((alert, i) => {
          const Icon = SEVERITY_ICONS[alert.severity] || AlertTriangle;
          return (
            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs ${SEVERITY_STYLES[alert.severity]}`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{alert.planName}</p>
                <p className="opacity-80">{alert.carrier} · {alert.label} ({alert.date})</p>
              </div>
              <Badge className={`text-xs h-5 px-1.5 flex-shrink-0 ${SEVERITY_STYLES[alert.severity]}`}>{alert.severity}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}