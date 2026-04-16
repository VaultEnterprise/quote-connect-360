import React from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RenewalRiskForecast({ renewal, census }) {
  if (!renewal || !census || census.length === 0) return null;

  // Calculate cohort risk metrics
  const totalMembers = census.length;
  const analyzedMembers = census.filter(m => m.gradient_ai_data).length;
  
  if (analyzedMembers === 0) return null;

  const avgRiskScore = census
    .filter(m => m.gradient_ai_data?.risk_score)
    .reduce((sum, m) => sum + m.gradient_ai_data.risk_score, 0) / analyzedMembers;

  const riskDistribution = {
    preferred: census.filter(m => m.gradient_ai_data?.risk_tier === 'preferred').length,
    standard: census.filter(m => m.gradient_ai_data?.risk_tier === 'standard').length,
    elevated: census.filter(m => m.gradient_ai_data?.risk_tier === 'elevated').length,
    high: census.filter(m => m.gradient_ai_data?.risk_tier === 'high').length
  };

  const totalPredictedClaims = census
    .filter(m => m.gradient_ai_data?.predicted_annual_claims)
    .reduce((sum, m) => sum + m.gradient_ai_data.predicted_annual_claims, 0);

  const pmpm = totalPredictedClaims / (totalMembers * 12) || 0;

  // Predict rate change
  const currentPremium = renewal.current_premium || renewal.renewal_premium || 0;
  const predictedAnnualClaims = totalPredictedClaims;
  const adminFactor = 1.15; // 15% admin/margin
  const predictedPremium = predictedAnnualClaims * adminFactor;
  const rateChange = currentPremium > 0 
    ? ((predictedPremium - currentPremium) / currentPremium) * 100 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">Risk-Based Renewal Forecast</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Cohort Health */}
        <div className="p-3 rounded bg-muted">
          <p className="text-xs font-semibold mb-2">Cohort Health</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Avg Risk Score</p>
              <p className="font-semibold">{Math.round(avgRiskScore)}/100</p>
            </div>
            <div>
              <p className="text-muted-foreground">PMPM Cost</p>
              <p className="font-semibold">${Math.round(pmpm)}</p>
            </div>
          </div>
        </div>

        {/* Risk Composition */}
        <div>
          <p className="text-xs font-semibold mb-2">Member Risk Composition</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preferred ({riskDistribution.preferred})</span>
              <Badge className="bg-green-100 text-green-800 text-xs">{Math.round((riskDistribution.preferred / totalMembers) * 100)}%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Standard ({riskDistribution.standard})</span>
              <Badge className="bg-blue-100 text-blue-800 text-xs">{Math.round((riskDistribution.standard / totalMembers) * 100)}%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Elevated ({riskDistribution.elevated})</span>
              <Badge className="bg-orange-100 text-orange-800 text-xs">{Math.round((riskDistribution.elevated / totalMembers) * 100)}%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">High ({riskDistribution.high})</span>
              <Badge variant="destructive" className="text-xs">{Math.round((riskDistribution.high / totalMembers) * 100)}%</Badge>
            </div>
          </div>
        </div>

        {/* Rate Forecast */}
        <div className="p-3 rounded bg-muted border border-border">
          <p className="text-xs font-semibold mb-2">Renewal Rate Forecast</p>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">
              Predicted Annual Claims: <strong>${Math.round(predictedAnnualClaims / 1000)}K</strong>
            </p>
            <p className="text-muted-foreground">
              Estimated Premium (with admin): <strong>${Math.round(predictedPremium / 1000)}K</strong>
            </p>
            <p className={`font-semibold ${rateChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              Projected Rate Change: {rateChange >= 0 ? '+' : ''}{Math.round(rateChange)}%
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Based on GradientAI risk profiles and predicted claims costs.
        </p>
      </CardContent>
    </Card>
  );
}