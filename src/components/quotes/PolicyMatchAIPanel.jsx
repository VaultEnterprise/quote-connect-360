import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, CheckCircle, AlertTriangle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";

export default function PolicyMatchAIPanel({ scenario, caseId }) {
  const [running, setRunning] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: matchResults } = useQuery({
    queryKey: ["policy-match", scenario.id],
    queryFn: () => base44.entities.PolicyMatchResult.filter({ scenario_id: scenario.id }),
    enabled: !!scenario.id,
  });

  const runPolicyMatch = useMutation({
    mutationFn: async () => {
      setRunning(true);
      const res = await base44.functions.invoke("policyMatchAI", {
        scenario_id: scenario.id,
        case_id: caseId,
      });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy-match"] });
      toast({ title: "AI analysis complete", description: "Policy match analysis finished" });
      setRunning(false);
    },
    onError: (error) => {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
      setRunning(false);
    },
  });

  const latestMatch = matchResults && matchResults[0];

  return (
    <div className="space-y-4">
      {/* Action Button */}
      <Button
        onClick={() => runPolicyMatch.mutate()}
        disabled={running || runPolicyMatch.isPending}
        className="w-full"
      >
        {running || runPolicyMatch.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing with AI...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" /> Run AI Policy Match
          </>
        )}
      </Button>

      {/* Results */}
      {latestMatch ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{latestMatch.optimized_plan_name || "AI Recommendation"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{latestMatch.recommendation_summary}</p>
                </div>
                <Badge className={
                  latestMatch.gradient_ai_risk_tier === "preferred" ? "bg-green-100 text-green-700" :
                  latestMatch.gradient_ai_risk_tier === "standard" ? "bg-blue-100 text-blue-700" :
                  latestMatch.gradient_ai_risk_tier === "elevated" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }>
                  {latestMatch.gradient_ai_risk_tier || "standard"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded bg-blue-50 border border-blue-200">
                  <p className="text-[10px] text-blue-600 font-medium">Risk Score</p>
                  <p className="text-lg font-bold text-blue-700">{latestMatch.risk_score || "—"}/100</p>
                </div>
                <div className="p-2 rounded bg-green-50 border border-green-200">
                  <p className="text-[10px] text-green-600 font-medium">Value Score</p>
                  <p className="text-lg font-bold text-green-700">{latestMatch.value_score || "—"}/100</p>
                </div>
              </div>

              {latestMatch.cost_delta_pmpm !== undefined && (
                <div className={`p-3 rounded-lg border ${latestMatch.cost_delta_pmpm < 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <p className={`text-xs font-medium ${latestMatch.cost_delta_pmpm < 0 ? "text-green-700" : "text-red-700"}`}>
                    Cost Impact
                  </p>
                  <p className={`text-lg font-bold ${latestMatch.cost_delta_pmpm < 0 ? "text-green-700" : "text-red-700"}`}>
                    {latestMatch.cost_delta_pmpm < 0 ? "−" : "+"}${Math.abs(latestMatch.cost_delta_pmpm).toLocaleString()} PMPM
                  </p>
                </div>
              )}

              {latestMatch.broker_talking_points && latestMatch.broker_talking_points.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Broker Talking Points</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {latestMatch.broker_talking_points.slice(0, 3).map((point, i) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison to Base Plan */}
          {latestMatch.base_plan_name && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-semibold mb-3">vs. Current Plan</p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Current:</span>
                    <span className="font-medium">{latestMatch.base_plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recommended:</span>
                    <span className="font-medium">{latestMatch.optimized_plan_name}</span>
                  </div>
                  {latestMatch.base_monthly_cost && latestMatch.optimized_monthly_cost && (
                    <div className="flex justify-between border-t pt-2">
                      <span>Monthly Cost Change:</span>
                      <span className={`font-bold ${(latestMatch.optimized_monthly_cost - latestMatch.base_monthly_cost) < 0 ? "text-green-600" : "text-red-600"}`}>
                        {(latestMatch.optimized_monthly_cost - latestMatch.base_monthly_cost) < 0 ? "−" : "+"}
                        ${Math.abs(latestMatch.optimized_monthly_cost - latestMatch.base_monthly_cost).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last Analysis */}
          {latestMatch.status && (
            <div className="text-xs text-muted-foreground text-center">
              Analysis status: <Badge variant="outline" className="capitalize">{latestMatch.status}</Badge>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              No AI analysis yet. Click "Run AI Policy Match" to analyze this scenario.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}