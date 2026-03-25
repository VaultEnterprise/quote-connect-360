import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";

function scoreSimilarity(ref, candidate) {
  if (ref.id === candidate.id) return -1;
  if (candidate.status !== "active") return -1;
  let score = 0;
  if (ref.plan_type === candidate.plan_type) score += 30;
  if (ref.network_type === candidate.network_type) score += 25;
  if (ref.carrier === candidate.carrier) score += 15;
  // Deductible proximity (within 20%)
  if (ref.deductible_individual && candidate.deductible_individual) {
    const pct = Math.abs(ref.deductible_individual - candidate.deductible_individual) / ref.deductible_individual;
    if (pct < 0.1) score += 20;
    else if (pct < 0.2) score += 10;
  }
  // OOP proximity
  if (ref.oop_max_individual && candidate.oop_max_individual) {
    const pct = Math.abs(ref.oop_max_individual - candidate.oop_max_individual) / ref.oop_max_individual;
    if (pct < 0.15) score += 10;
  }
  return score;
}

const MATCH_LABELS = [
  { min: 70, label: "Excellent Match", color: "bg-green-100 text-green-700" },
  { min: 50, label: "Good Match", color: "bg-blue-100 text-blue-700" },
  { min: 30, label: "Similar", color: "bg-amber-100 text-amber-700" },
];

export default function PlanRecommendationEngine({ referencePlan, allPlans, onSelectPlan }) {
  const recommendations = useMemo(() => {
    if (!referencePlan || !allPlans.length) return [];
    return allPlans
      .map(p => ({ ...p, score: scoreSimilarity(referencePlan, p) }))
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [referencePlan, allPlans]);

  if (!referencePlan) return null;

  const getLabel = (score) => MATCH_LABELS.find(l => score >= l.min) || { label: "Possible Alternative", color: "bg-gray-100 text-gray-600" };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Similar to: {referencePlan.plan_name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-3">No similar plans found in library.</p>
        ) : (
          <div className="space-y-2">
            {recommendations.map(p => {
              const { label, color } = getLabel(p.score);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:border-primary/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-xs truncate">{p.plan_name}</span>
                      <Badge className={`text-xs h-4 px-1 ${color}`}>{label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.carrier} · {p.network_type} · {p.plan_type?.toUpperCase()}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      {p.deductible_individual && <span>Ded: ${p.deductible_individual.toLocaleString()}</span>}
                      {p.copay_pcp && <span>PCP: ${p.copay_pcp}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{p.score}%</span>
                    {onSelectPlan && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onSelectPlan(p)}>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}