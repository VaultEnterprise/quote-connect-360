import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProposalQualityScore({ proposals }) {
  const issues = [];

  // Missing cover message
  const noCoverMsg = proposals.filter(p => !p.cover_message && p.status !== "draft");
  if (noCoverMsg.length > 0) {
    issues.push({
      severity: "medium",
      title: "Missing Cover Messages",
      desc: `${noCoverMsg.length} sent proposal${noCoverMsg.length !== 1 ? "s" : ""} lack personalized cover text.`,
      count: noCoverMsg.length
    });
  }

  // No effective date
  const noEffective = proposals.filter(p => !p.effective_date && ["sent", "approved"].includes(p.status));
  if (noEffective.length > 0) {
    issues.push({
      severity: "high",
      title: "Missing Effective Dates",
      desc: `${noEffective.length} proposal${noEffective.length !== 1 ? "s" : ""} missing effective dates.`,
      count: noEffective.length
    });
  }

  // Stale drafts
  const staleDrafts = proposals.filter(p => {
    if (p.status !== "draft") return false;
    const created = new Date(p.created_date);
    const now = new Date();
    return (now - created) > (30 * 24 * 60 * 60 * 1000); // 30 days
  });
  if (staleDrafts.length > 0) {
    issues.push({
      severity: "low",
      title: "Stale Drafts",
      desc: `${staleDrafts.length} draft${staleDrafts.length !== 1 ? "s" : ""} haven't been sent in 30+ days.`,
      count: staleDrafts.length
    });
  }

  const qualityScore = proposals.length > 0 ? Math.round(((proposals.filter(p => p.effective_date && p.cover_message).length / proposals.length) * 100)) : 0;

  if (issues.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">High Quality Proposals</p>
            <p className="text-xs text-green-600">All {proposals.length} proposals are complete and well-formatted.</p>
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
            <AlertCircle className="w-4 h-4 text-amber-600" /> Quality Issues ({issues.length})
          </span>
          <span className="text-lg font-black text-amber-600">{qualityScore}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-[10px] text-amber-700 font-semibold mb-1">Completion Score</p>
          <Progress value={qualityScore} className="h-2" />
        </div>
        {issues.map((issue, i) => (
          <div key={i} className={`p-3 rounded-lg ${
            issue.severity === "high" ? "bg-red-50 border border-red-200" :
            issue.severity === "medium" ? "bg-amber-50 border border-amber-200" :
            "bg-blue-50 border border-blue-200"
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${
                  issue.severity === "high" ? "text-red-900" :
                  issue.severity === "medium" ? "text-amber-900" :
                  "text-blue-900"
                }`}>{issue.title}</p>
                <p className={`text-[10px] mt-0.5 ${
                  issue.severity === "high" ? "text-red-700" :
                  issue.severity === "medium" ? "text-amber-700" :
                  "text-blue-700"
                }`}>{issue.desc}</p>
              </div>
              <Badge className={`${
                issue.severity === "high" ? "bg-red-100 text-red-700 border-red-200" :
                issue.severity === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                "bg-blue-100 text-blue-700 border-blue-200"
              } border text-[9px] py-0 flex-shrink-0`}>
                {issue.count}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}