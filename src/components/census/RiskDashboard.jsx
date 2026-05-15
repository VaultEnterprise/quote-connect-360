import React from "react";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function RiskDashboard({ censusVersionId, caseId }) {
  const { data: members = [] } = useQuery({
    queryKey: ["census-members", censusVersionId],
    queryFn: () => base44.entities.CensusMember.filter({ census_version_id: censusVersionId }, '', 10000)
  });

  if (members.length === 0) {
    return null;
  }

  // Calculate risk distribution
  const riskDistribution = {
    preferred: members.filter(m => m.gradient_ai_data?.risk_tier === 'preferred').length,
    standard: members.filter(m => m.gradient_ai_data?.risk_tier === 'standard').length,
    elevated: members.filter(m => m.gradient_ai_data?.risk_tier === 'elevated').length,
    high: members.filter(m => m.gradient_ai_data?.risk_tier === 'high').length
  };

  const analyzed = members.filter(m => m.gradient_ai_data).length;
  const avgRiskScore = members
    .filter(m => m.gradient_ai_data?.risk_score)
    .reduce((sum, m) => sum + m.gradient_ai_data.risk_score, 0) / (analyzed || 1);
  
  const totalPredictedClaims = members
    .filter(m => m.gradient_ai_data?.predicted_annual_claims)
    .reduce((sum, m) => sum + m.gradient_ai_data.predicted_annual_claims, 0);

  const highRiskMembers = members.filter(m => m.gradient_ai_data?.risk_tier === 'high');

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Analyzed</p>
            <p className="text-lg font-semibold">{analyzed}</p>
            <p className="text-xs text-muted-foreground">{Math.round((analyzed / members.length) * 100)}% of {members.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Avg Risk Score</p>
            <p className="text-lg font-semibold">{Math.round(avgRiskScore)}</p>
            <p className="text-xs text-muted-foreground">0-100 scale</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Predicted Claims</p>
            <p className="text-lg font-semibold">${(totalPredictedClaims / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">Annual</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">High Risk</p>
            <p className="text-lg font-semibold text-destructive">{riskDistribution.high}</p>
            <p className="text-xs text-muted-foreground">{Math.round((riskDistribution.high / analyzed) * 100)}% flagged</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Risk Tier Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-green-100 text-green-800">Preferred</Badge>
            <div className="flex-1 h-2 bg-gray-200 rounded mx-3">
              <div className="h-full bg-green-500 rounded" style={{ width: `${(riskDistribution.preferred / analyzed) * 100}%` }}></div>
            </div>
            <span className="text-sm font-semibold w-12 text-right">{riskDistribution.preferred}</span>
          </div>

          <div className="flex items-center justify-between">
            <Badge className="bg-blue-100 text-blue-800">Standard</Badge>
            <div className="flex-1 h-2 bg-gray-200 rounded mx-3">
              <div className="h-full bg-blue-500 rounded" style={{ width: `${(riskDistribution.standard / analyzed) * 100}%` }}></div>
            </div>
            <span className="text-sm font-semibold w-12 text-right">{riskDistribution.standard}</span>
          </div>

          <div className="flex items-center justify-between">
            <Badge className="bg-orange-100 text-orange-800">Elevated</Badge>
            <div className="flex-1 h-2 bg-gray-200 rounded mx-3">
              <div className="h-full bg-orange-500 rounded" style={{ width: `${(riskDistribution.elevated / analyzed) * 100}%` }}></div>
            </div>
            <span className="text-sm font-semibold w-12 text-right">{riskDistribution.elevated}</span>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="destructive">High</Badge>
            <div className="flex-1 h-2 bg-gray-200 rounded mx-3">
              <div className="h-full bg-red-500 rounded" style={{ width: `${(riskDistribution.high / analyzed) * 100}%` }}></div>
            </div>
            <span className="text-sm font-semibold w-12 text-right">{riskDistribution.high}</span>
          </div>
        </CardContent>
      </Card>

      {/* High Risk Members */}
      {highRiskMembers.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <CardTitle className="text-sm">High Risk Members ({highRiskMembers.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
              {highRiskMembers.slice(0, 10).map(member => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded bg-background/50">
                  <span className="font-medium">{member.first_name} {member.last_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Score: {member.gradient_ai_data.risk_score}</span>
                    <Badge variant="destructive" className="text-xs">High</Badge>
                  </div>
                </div>
              ))}
              {highRiskMembers.length > 10 && (
                <p className="text-muted-foreground text-center py-2">+{highRiskMembers.length - 10} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}