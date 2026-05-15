import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PolicyMatchQualityScore({ results }) {
  const criticalIssues = [];
  const warnings = [];

  // Missing risk scores
  const noRiskScore = results.filter(r => !r.risk_score && r.status === "optimized");
  if (noRiskScore.length > 0) {
    criticalIssues.push({
      title: "Missing Risk Scores",
      desc: `${noRiskScore.length} optimized result${noRiskScore.length !== 1 ? "s" : ""} lack risk assessment.`,
      count: noRiskScore.length
    });
  }

  // Missing recommendations
  const noSummary = results.filter(r => !r.recommendation_summary && r.status === "optimized");
  if (noSummary.length > 0) {
    warnings.push({
      title: "Missing Rationale",
      desc: `${noSummary.length} result${noSummary.length !== 1 ? "s" : ""} need optimization summaries.`,
      count: noSummary.length
    });
  }

  // High risk with low value
  const risky = results.filter(r => (r.risk_score || 0) > 70 && (r.value_score || 0) < 40);
  if (risky.length > 0) {
    warnings.push({
      title: "High Risk, Low Value",
      desc: `${risky.length} result${risky.length !== 1 ? "s" : ""} may need review before acceptance.`,
      count: risky.length
    });
  }

  const qualityScore = results.length > 0 ? Math.round(((results.filter(r => r.risk_score && r.recommendation_summary).length / results.length) * 100)) : 0;

  const allIssues = [...criticalIssues, ...warnings];

  if (allIssues.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">High Quality Results</p>
            <p className="text-xs text-green-600">All {results.length} results are complete and well-optimized.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" /> Quality Issues ({allIssues.length})
          </span>
          <span className="text-lg font-black text-amber-600">{qualityScore}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-[10px] text-amber-700 font-semibold mb-1">Completion Score</p>
          <Progress value={qualityScore} className="h-2" />
        </div>
        {allIssues.map((issue, i) => (
          <div key={i} className="p-3 rounded-lg bg-white border border-amber-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-900">{issue.title}</p>
                <p className="text-[10px] text-amber-700 mt-0.5">{issue.desc}</p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-[9px] py-0 flex-shrink-0">
                {issue.count}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}