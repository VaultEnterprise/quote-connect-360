import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

export default function CycleTimeAnalytics({ cases }) {
  const analytics = useMemo(() => {
    const stageMap = {};
    cases.forEach(c => {
      const stage = c.stage || "draft";
      if (!stageMap[stage]) stageMap[stage] = [];
      stageMap[stage].push(c);
    });

    const cycleByStage = Object.entries(stageMap).map(([stage, stageCases]) => {
      const durations = stageCases.map(c => {
        if (!c.created_date) return 0;
        return differenceInDays(new Date(), new Date(c.created_date));
      });
      const avg = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
      return { stage, avg, count: stageCases.length };
    }).sort((a, b) => b.avg - a.avg);

    return cycleByStage;
  }, [cases]);

  const maxAvg = Math.max(...analytics.map(a => a.avg), 1);

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm">Cycle Time by Stage</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {analytics.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data</p>
        ) : (
          analytics.map(({ stage, avg, count }) => (
            <div key={stage}>
              <div className="flex justify-between text-xs mb-1">
                <span className="capitalize font-medium">{stage.replace(/_/g, " ")}</span>
                <Badge variant="secondary" className="text-[10px] py-0 h-4">{avg}d avg ({count})</Badge>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 transition-all" style={{ width: `${(avg / maxAvg) * 100}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}