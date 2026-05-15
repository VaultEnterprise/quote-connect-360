import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RiskAdjustedPlanRecommendation({ enrollment, member }) {
  if (!enrollment || !member) return null;

  const gradientData = member.gradient_ai_data;
  if (!gradientData) return null;

  const getRiskColor = (tier) => {
    switch (tier) {
      case 'preferred':
        return 'text-green-600';
      case 'standard':
        return 'text-blue-600';
      case 'elevated':
        return 'text-orange-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (tier) => {
    switch (tier) {
      case 'preferred':
        return 'bg-green-100 text-green-800';
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'elevated':
        return 'bg-orange-100 text-orange-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecommendation = (tier) => {
    switch (tier) {
      case 'preferred':
        return {
          title: 'Low Risk Profile',
          description: 'You qualify for our most cost-effective plans with excellent coverage.',
          icon: CheckCircle2
        };
      case 'standard':
        return {
          title: 'Standard Risk Profile',
          description: 'Standard plans offer a good balance of coverage and cost.',
          icon: CheckCircle2
        };
      case 'elevated':
        return {
          title: 'Elevated Risk Profile',
          description: 'Enhanced coverage recommended given your health factors. Consider plans with lower deductibles.',
          icon: AlertCircle
        };
      case 'high':
        return {
          title: 'High Risk Profile',
          description: 'Comprehensive coverage strongly recommended. We suggest plans with maximum coverage and lower out-of-pocket costs.',
          icon: AlertCircle
        };
      default:
        return {
          title: 'Standard Recommendation',
          description: 'Select from available plans based on your needs.',
          icon: CheckCircle2
        };
    }
  };

  const recommendation = getRecommendation(gradientData.risk_tier);
  const Icon = recommendation.icon;

  return (
    <Card className={gradientData.risk_tier === 'high' || gradientData.risk_tier === 'elevated' ? 'border-orange-200 bg-orange-50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${getRiskColor(gradientData.risk_tier)}`} />
            <CardTitle className="text-sm">{recommendation.title}</CardTitle>
          </div>
          <Badge className={getRiskBadgeVariant(gradientData.risk_tier)}>
            {gradientData.risk_tier.charAt(0).toUpperCase() + gradientData.risk_tier.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{recommendation.description}</p>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Risk Score</p>
            <p className={`text-lg font-semibold ${getRiskColor(gradientData.risk_tier)}`}>
              {gradientData.risk_score}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Predicted Annual Claims</p>
            <p className="text-lg font-semibold">
              ${Math.round(gradientData.predicted_annual_claims / 1000)}K
            </p>
          </div>
        </div>

        {gradientData.risk_factors && (
          <div className="pt-2 border-t">
            <p className="text-xs font-semibold mb-2">Risk Factors</p>
            <div className="space-y-1">
              {gradientData.risk_factors.slice(0, 3).map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{factor.factor}</span>
                  <span className="font-medium">{Math.round(factor.weight * 100)}% weight</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}