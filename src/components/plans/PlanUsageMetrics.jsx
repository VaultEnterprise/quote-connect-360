import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export default function PlanUsageMetrics({ plans }) {
  const { data: scenarioPlanLinks = [] } = useQuery({
    queryKey: ["scenario-plans"],
    queryFn: () => base44.entities.ScenarioPlan.list("-created_date", 500),
  });

  const usageMap = useMemo(() => {
    const map = {};
    scenarioPlanLinks.forEach((sp) => {
      map[sp.plan_id] = (map[sp.plan_id] || 0) + 1;
    });
    return map;
  }, [scenarioPlanLinks]);

  const topUsed = useMemo(
    () =>
      plans
        .map((p) => ({ ...p, usageCount: usageMap[p.id] || 0 }))
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5),
    [plans, usageMap]
  );

  const unused = useMemo(
    () => plans.filter((p) => !usageMap[p.id] || usageMap[p.id] === 0),
    [plans, usageMap]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Plan Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium mb-1">Top Plans by Usage</p>
          {topUsed.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs mb-1">
              <span className="truncate">{p.plan_name}</span>
              <Badge variant="secondary" className="text-[10px]">
                {p.usageCount} scenarios
              </Badge>
            </div>
          ))}
        </div>

        {unused.length > 0 && (
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-medium text-amber-900 mb-1">
              {unused.length} unused plans
            </p>
            <p className="text-[10px] text-amber-800">Consider archiving inactive plans</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}