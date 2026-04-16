import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export default function RecommendationBreakdown({ scenario, previousScenario }) {
  if (!scenario) return null;

  const score = scenario.recommendation_score || 0;
  const confidence = scenario.confidence_level || "medium";
  const disruption = scenario.disruption_score || 0;

  // Score breakdown (mock calculation)
  const scoreBreakdown = {
    cost: Math.round(score * 0.4),
    coverage: Math.round(score * 0.3),
    risk: Math.round(score * 0.2),
    network: Math.round(score * 0.1),
  };

  const totalPremium = scenario.total_monthly_premium || 0;
  const previousPremium = previousScenario?.total_monthly_premium || 0;
  const premiumChange = previousPremium ? ((totalPremium - previousPremium) / previousPremium) * 100 : 0;

  const confidenceBadge = {
    high: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      {/* Recommendation Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{score}</div>
              <p className="text-xs text-muted-foreground">Overall Score</p>
            </div>
            <div className="text-center">
              <Badge className={confidenceBadge[confidence]}>{confidence} Confidence</Badge>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{disruption}</div>
              <p className="text-xs text-muted-foreground">Disruption</p>
            </div>
            <div className="text-center">
              {scenario.is_recommended && (
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
              )}
              {!scenario.is_recommended && (
                <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <p className="text-sm font-semibold">Score Breakdown</p>
          
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Cost</span>
                <span className="font-semibold">{scoreBreakdown.cost}/40</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${(scoreBreakdown.cost / 40) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Coverage</span>
                <span className="font-semibold">{scoreBreakdown.coverage}/30</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="bg-green-500 h-full" style={{ width: `${(scoreBreakdown.coverage / 30) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Risk</span>
                <span className="font-semibold">{scoreBreakdown.risk}/20</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: `${(scoreBreakdown.risk / 20) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Network</span>
                <span className="font-semibold">{scoreBreakdown.network}/10</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${(scoreBreakdown.network / 10) * 100}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI Comparison */}
      {previousScenario && (
        <Card>
          <CardContent className="pt-6 space-y-2">
            <p className="text-sm font-semibold">Cost Change vs. Previous</p>
            <div className={`flex items-center gap-2 p-2 rounded-lg ${premiumChange > 0 ? "bg-red-50" : "bg-green-50"}`}>
              <TrendingUp className={`w-4 h-4 ${premiumChange > 0 ? "text-red-600" : "text-green-600"}`} />
              <div>
                <p className={`text-sm font-semibold ${premiumChange > 0 ? "text-red-700" : "text-green-700"}`}>
                  {premiumChange > 0 ? "+" : ""}{premiumChange.toFixed(1)}% ({premiumChange > 0 ? "higher" : "lower"})
                </p>
                <p className="text-xs text-muted-foreground">
                  ${previousPremium.toLocaleString()} → ${totalPremium.toLocaleString()}/month
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Reason */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-semibold mb-2">Why This Recommendation?</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li>✓ Balances cost and coverage effectively</li>
            <li>✓ Favorable employer/employee cost share</li>
            <li>✓ Lower disruption for enrollment</li>
            {scenario.is_recommended && <li>✓ Broker recommended</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}