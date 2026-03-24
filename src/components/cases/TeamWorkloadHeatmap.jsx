import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TeamWorkloadHeatmap({ cases }) {
  const workload = useMemo(() => {
    const map = {};
    cases.forEach(c => {
      if (c.assigned_to) {
        if (!map[c.assigned_to]) map[c.assigned_to] = { total: 0, urgent: 0, stalled: 0 };
        map[c.assigned_to].total++;
        if (c.priority === "urgent") map[c.assigned_to].urgent++;
        if (c.last_activity_date && (Date.now() - new Date(c.last_activity_date)) / 86400000 > 7 && !["active", "closed"].includes(c.stage)) map[c.assigned_to].stalled++;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [cases]);

  const getColor = (count, max) => {
    const ratio = count / max;
    if (ratio > 0.75) return "bg-red-50 border-red-200";
    if (ratio > 0.5) return "bg-amber-50 border-amber-200";
    return "bg-green-50 border-green-200";
  };

  const maxLoad = Math.max(...workload.map(([, w]) => w.total), 1);

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">Team Workload</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {workload.length === 0 ? (
          <p className="text-xs text-muted-foreground">No assigned cases</p>
        ) : (
          workload.map(([email, w]) => (
            <div key={email} className={`p-2 rounded border ${getColor(w.total, maxLoad)}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium">{email.split("@")[0]}</span>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[10px] py-0 h-4">{w.total}</Badge>
                  {w.urgent > 0 && <Badge className="text-[10px] py-0 h-4 bg-red-100 text-red-700">{w.urgent}u</Badge>}
                  {w.stalled > 0 && <Badge className="text-[10px] py-0 h-4 bg-amber-100 text-amber-700">{w.stalled}s</Badge>}
                </div>
              </div>
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(w.total / maxLoad) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}