import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function RiskAlerts({ cases }) {
  const risks = useMemo(() => {
    const alerts = [];
    const now = new Date();
    cases.forEach(c => {
      if (c.effective_date) {
        const daysUntil = differenceInDays(new Date(c.effective_date), now);
        if (daysUntil < 0) alerts.push({ case: c, type: "overdue", message: `${c.employer_name} ${Math.abs(daysUntil)}d overdue`, severity: "critical" });
        else if (daysUntil < 7) alerts.push({ case: c, type: "deadline", message: `${c.employer_name} effective in ${daysUntil}d`, severity: "high" });
        else if (daysUntil < 14) alerts.push({ case: c, type: "approaching", message: `${c.employer_name} approaching (${daysUntil}d)`, severity: "medium" });
      }
      if (c.last_activity_date && differenceInDays(now, new Date(c.last_activity_date)) > 14 && !["active", "closed"].includes(c.stage)) {
        alerts.push({ case: c, type: "stalled", message: `${c.employer_name} stalled ${differenceInDays(now, new Date(c.last_activity_date))}d`, severity: "medium" });
      }
    });
    return alerts.sort((a, b) => ({ critical: 0, high: 1, medium: 2 }[a.severity] - { critical: 0, high: 1, medium: 2 }[b.severity])).slice(0, 5);
  }, [cases]);

  const colorMap = { critical: "bg-red-50 border-red-200 text-red-700", high: "bg-orange-50 border-orange-200 text-orange-700", medium: "bg-amber-50 border-amber-200 text-amber-700" };

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-600" /> Risk Alerts</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {risks.length === 0 ? <p className="text-xs text-muted-foreground">No active risks</p> : risks.map((a, i) => <div key={i} className={`p-2 rounded border text-xs font-medium ${colorMap[a.severity]}`}>{a.message}</div>)}
      </CardContent>
    </Card>
  );
}