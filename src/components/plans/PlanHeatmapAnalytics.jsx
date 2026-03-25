import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp } from "lucide-react";

const US_REGIONS = {
  "Northeast": ["ME","NH","VT","MA","RI","CT","NY","NJ","PA"],
  "Southeast": ["MD","DE","DC","VA","WV","NC","SC","GA","FL","AL","MS","TN","KY","AR"],
  "Midwest": ["OH","IN","IL","MI","WI","MN","IA","MO","ND","SD","NE","KS"],
  "Southwest": ["TX","OK","NM","AZ"],
  "West": ["CO","UT","WY","MT","ID","WA","OR","CA","NV"],
  "Non-Contiguous": ["AK","HI"],
};

function getHeatColor(intensity) {
  if (intensity === 0) return "bg-muted text-muted-foreground";
  if (intensity < 0.25) return "bg-blue-100 text-blue-700";
  if (intensity < 0.5) return "bg-blue-300 text-blue-800";
  if (intensity < 0.75) return "bg-blue-500 text-white";
  return "bg-blue-700 text-white";
}

export default function PlanHeatmapAnalytics({ plans }) {
  const { data: stateRates = [] } = useQuery({
    queryKey: ["all-state-rates"],
    queryFn: () => base44.entities.PlanRateByState.list("-created_date", 200),
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ["plan-usage-analytics"],
    queryFn: () => base44.entities.PlanUsageAnalytics.list("-period_date", 100),
  });

  const stateCounts = useMemo(() => {
    const counts = {};
    stateRates.forEach(r => { counts[r.state] = (counts[r.state] || 0) + 1; });
    return counts;
  }, [stateRates]);

  const maxCount = Math.max(...Object.values(stateCounts), 1);

  const regionData = useMemo(() => Object.entries(US_REGIONS).map(([region, states]) => {
    const total = states.reduce((s, st) => s + (stateCounts[st] || 0), 0);
    const topState = states.reduce((best, st) => (stateCounts[st] || 0) > (stateCounts[best] || 0) ? st : best, states[0]);
    return { region, total, topState, states };
  }).sort((a, b) => b.total - a.total), [stateCounts]);

  const carrierByState = useMemo(() => {
    const map = {};
    stateRates.forEach(r => {
      const plan = plans.find(p => p.id === r.plan_id);
      if (!plan) return;
      if (!map[r.state]) map[r.state] = {};
      map[r.state][plan.carrier] = (map[r.state][plan.carrier] || 0) + 1;
    });
    return map;
  }, [stateRates, plans]);

  const topStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);

  return (
    <div className="space-y-4">
      {/* Regional overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {regionData.map(r => (
          <Card key={r.region}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold">{r.region}</p>
                  <p className="text-xs text-muted-foreground">{r.states.length} states</p>
                </div>
                <Badge className="bg-primary/10 text-primary text-xs">{r.total} rates</Badge>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((r.total / Math.max(...regionData.map(x => x.total), 1)) * 100, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* State heatmap grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Rate Coverage by State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {Object.entries(US_REGIONS).flatMap(([, states]) => states).map(st => {
              const count = stateCounts[st] || 0;
              const intensity = count / maxCount;
              return (
                <div key={st} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium cursor-default transition-all hover:scale-110 ${getHeatColor(intensity)}`} title={`${st}: ${count} rate table(s)`}>
                  {st}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Coverage:</span>
            {[0, 0.25, 0.5, 0.75, 1].map(v => (
              <div key={v} className={`w-5 h-3 rounded ${getHeatColor(v)}`} />
            ))}
            <span className="text-xs text-muted-foreground">None → High</span>
          </div>
        </CardContent>
      </Card>

      {/* Top states table */}
      {topStates.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Top States by Rate Volume</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topStates.map(([state, count]) => {
                const topCarrier = Object.entries(carrierByState[state] || {}).sort((a, b) => b[1] - a[1])[0];
                return (
                  <div key={state} className="flex items-center gap-3">
                    <span className="text-xs font-bold w-8 flex-shrink-0">{state}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(count / topStates[0][1]) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium w-6 text-right">{count}</span>
                    {topCarrier && <span className="text-xs text-muted-foreground w-24 truncate">{topCarrier[0]}</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}