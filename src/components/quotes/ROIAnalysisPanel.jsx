import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function ROIAnalysisPanel({ scenario, currentScenario, caseData }) {
  const calculations = useMemo(() => {
    const currentTotal = currentScenario?.total_monthly_premium || 0;
    const newTotal = scenario.total_monthly_premium || 0;
    const difference = newTotal - currentTotal;
    const percentChange = currentTotal > 0 ? (difference / currentTotal) * 100 : 0;

    const currentEECost = currentScenario?.employee_monthly_cost_avg || 0;
    const newEECost = scenario.employee_monthly_cost_avg || 0;
    const eeDifference = newEECost - currentEECost;

    return {
      totalDifference: difference,
      percentChange,
      eeDifference,
      currentTotal,
      newTotal,
      currentEECost,
      newEECost,
    };
  }, [scenario, currentScenario]);

  const employeeCount = caseData?.employee_count || 100;
  const annualImpact = calculations.totalDifference * 12;
  const announcementChallenge = calculations.percentChange > 5 ? "HIGH" : calculations.percentChange > 2 ? "MEDIUM" : "LOW";

  return (
    <div className="space-y-4">
      {/* Headline Numbers */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Monthly Change</p>
            <div className="flex items-baseline gap-2">
              {calculations.totalDifference > 0 ? (
                <TrendingUp className="w-5 h-5 text-red-600" />
              ) : (
                <TrendingDown className="w-5 h-5 text-green-600" />
              )}
              <p className={`text-xl font-bold ${calculations.totalDifference > 0 ? "text-red-600" : "text-green-600"}`}>
                {calculations.totalDifference > 0 ? "+" : ""}${Math.abs(calculations.totalDifference).toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {calculations.percentChange > 0 ? "+" : ""}{calculations.percentChange.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Annual Impact</p>
            <p className={`text-xl font-bold ${annualImpact > 0 ? "text-red-600" : "text-green-600"}`}>
              {annualImpact > 0 ? "+" : ""}${Math.abs(annualImpact).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1">Employee Impact</p>
            <p className={`text-xl font-bold ${calculations.eeDifference > 0 ? "text-red-600" : "text-green-600"}`}>
              {calculations.eeDifference > 0 ? "+" : ""}${Math.abs(calculations.eeDifference).toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">per employee/mo</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm font-semibold">Scenario Comparison</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border">
              <span className="text-xs font-medium">Total Monthly Premium</span>
              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    ${calculations.currentTotal.toLocaleString()}
                  </span>
                  <span className="font-semibold">${calculations.newTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border">
              <span className="text-xs font-medium">Avg Employee Cost</span>
              <div className="text-right">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    ${calculations.currentEECost.toLocaleString()}
                  </span>
                  <span className="font-semibold">${calculations.newEECost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcement Challenge */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
              announcementChallenge === "HIGH" ? "text-red-600" :
              announcementChallenge === "MEDIUM" ? "text-amber-600" :
              "text-green-600"
            }`} />
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Announcement Challenge</p>
              <Badge className={
                announcementChallenge === "HIGH" ? "bg-red-100 text-red-700" :
                announcementChallenge === "MEDIUM" ? "bg-amber-100 text-amber-700" :
                "bg-green-100 text-green-700"
              }>
                {announcementChallenge} Risk
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                {announcementChallenge === "HIGH" && "Significant rate increase may face employee resistance. Consider enhanced communication."}
                {announcementChallenge === "MEDIUM" && "Moderate rate increase. Plan for standard communication strategy."}
                {announcementChallenge === "LOW" && "Minimal or no increase. This scenario is easy to announce."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Employee Breakdown */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-semibold mb-3">Per Employee Breakdown ({employeeCount} employees)</p>
          <div className="text-xs space-y-2 text-muted-foreground">
            <div className="flex justify-between">
              <span>Total annual change:</span>
              <span className="font-semibold">${(Math.abs(annualImpact) / employeeCount).toLocaleString()}/employee</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly change per employee:</span>
              <span className="font-semibold">${(Math.abs(calculations.totalDifference) / employeeCount).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}