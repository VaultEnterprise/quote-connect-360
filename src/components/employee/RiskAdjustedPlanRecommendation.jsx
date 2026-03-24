import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Zap } from 'lucide-react';

export default function RiskAdjustedPlanRecommendation({ member, plans = [] }) {
  const recommendation = useMemo(() => {
    if (!member?.gradient_ai_data || plans.length === 0) return null;

    const risk = member.gradient_ai_data;
    const predictedCost = risk.predicted_annual_claims || 0;

    // Score plans based on member risk profile
    const scored = plans.map(plan => {
      let score = 0;

      // Favor plans with lower OOP max for high-risk members
      if (risk.risk_tier === 'high' || risk.risk_tier === 'elevated') {
        score += 100 / (plan.oop_max_individual || 10000);
      }

      // Favor plans with lower copays for frequent users
      if (predictedCost > 5000) {
        score += 50 / (plan.copay_pcp || 30);
      }

      // Bonus for predictable cost structures
      if (plan.hsa_eligible && risk.risk_tier === 'standard') {
        score += 20;
      }

      return { ...plan, score, recommendationReason: getRecommendationReason(risk, plan) };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }, [member, plans]);

  const getRecommendationReason = (risk, plan) => {
    if (risk.risk_tier === 'high' && plan.oop_max_individual < 7500) {
      return 'Low out-of-pocket max for your risk profile';
    }
    if (risk.predicted_annual_claims > 5000 && plan.copay_pcp < 25) {
      return 'Lower copays for frequent care usage';
    }
    if (plan.hsa_eligible && risk.risk_tier === 'standard') {
      return 'HSA-eligible with good savings potential';
    }
    return 'Strong fit based on your profile';
  };

  if (!recommendation || recommendation.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground text-sm">
        No recommendations available.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {member?.gradient_ai_data && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-900">Your Risk Profile</p>
              <p className="text-xs text-purple-800 mt-1">
                Tier: <strong>{member.gradient_ai_data.risk_tier}</strong> | 
                Predicted Annual Cost: <strong>${member.gradient_ai_data.predicted_annual_claims || 0}</strong>
              </p>
            </div>
          </div>
        </Card>
      )}

      {recommendation.map((plan, idx) => (
        <Card key={plan.id} className="p-4 border-l-4" style={{ borderLeftColor: idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#9ca3af' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm">{plan.plan_name}</p>
              <p className="text-xs text-muted-foreground">{plan.carrier} • {plan.network_type}</p>
            </div>
            {idx === 0 && <Badge className="bg-green-100 text-green-800">Best Match</Badge>}
          </div>

          <div className="space-y-1 text-xs mb-3 pb-3 border-b">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deductible</span>
              <strong>${plan.deductible_individual}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">OOP Max</span>
              <strong>${plan.oop_max_individual}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PCP Copay</span>
              <strong>${plan.copay_pcp}</strong>
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Zap className="w-3 h-3 text-amber-500" />
            {plan.recommendationReason}
          </p>
        </Card>
      ))}
    </div>
  );
}