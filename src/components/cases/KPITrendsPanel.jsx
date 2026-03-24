import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, Calendar, Users } from "lucide-react";
import { differenceInDays } from "date-fns";

export default function KPITrendsPanel({ cases }) {
  const kpis = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);

    const active = cases.filter(c => c.stage === "active").length;
    const activeWeek = cases.filter(c => c.stage === "active" && new Date(c.created_date) > weekAgo).length;
    const urgent = cases.filter(c => c.priority === "urgent").length;
    const urgentWeek = cases.filter(c => c.priority === "urgent" && new Date(c.created_date) > weekAgo).length;
    const stalled = cases.filter(c => c.last_activity_date && differenceInDays(now, new Date(c.last_activity_date)) > 7 && !["active", "closed"].includes(c.stage)).length;
    const atRisk = cases.filter(c => c.effective_date && differenceInDays(new Date(c.effective_date), now) >= 0 && differenceInDays(new Date(c.effective_date), now) < 14).length;

    return { active, activeWeek, urgent, urgentWeek, stalled, atRisk };
  }, [cases]);

  const formatDelta = (current, previous) => current > previous ? `+${current - previous}` : current < previous ? `${current - previous}` : "→";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Active</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-lg font-bold">{kpis.active}</p>
          <p className="text-xs text-muted-foreground">{formatDelta(kpis.active, kpis.activeWeek)} week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Urgent</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-lg font-bold text-red-600">{kpis.urgent}</p>
          <p className="text-xs text-muted-foreground">{formatDelta(kpis.urgent, kpis.urgentWeek)} week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-amber-600" /> At Risk</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-lg font-bold text-amber-600">{kpis.atRisk}</p>
          <p className="text-xs text-muted-foreground">Deadline warning</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Stalled</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-lg font-bold text-amber-700">{kpis.stalled}</p>
          <p className="text-xs text-muted-foreground">7+ days idle</p>
        </CardContent>
      </Card>
    </div>
  );
}