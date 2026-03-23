import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, AlertCircle, Clock, MessageSquare, TrendingUp,
  Sparkles, BookOpen, ShieldAlert
} from "lucide-react";
import { HELP_TARGETS } from "@/lib/helpTargetRegistry";

export default function HelpConsoleKPIBar({ contentMap, aiLogs = [], topics = [], onNavigate }) {
  const total = HELP_TARGETS.length;
  const active = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "active").length;
  const missing = HELP_TARGETS.filter(t => !contentMap[t.target_code]).length;
  const draft = Object.values(contentMap).filter(c => c.content_status === "draft").length;
  const reviewNeeded = Object.values(contentMap).filter(c => c.content_status === "review_required").length;
  const coveragePct = total > 0 ? Math.round((active / total) * 100) : 0;

  const pendingAI = aiLogs.filter(l => l.requires_admin_review && !l.reviewed_by_admin).length;
  const unanswered = aiLogs.filter(l => l.answer_status === "unanswered").length;
  const publishedTopics = topics.filter(t => t.is_published).length;

  const health = coveragePct >= 90 && pendingAI === 0 ? "excellent"
    : coveragePct >= 70 && pendingAI < 5 ? "good"
    : coveragePct >= 50 ? "fair"
    : "poor";
  const healthConfig = {
    excellent: { label: "Excellent", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    good: { label: "Good", color: "bg-blue-100 text-blue-700 border-blue-200" },
    fair: { label: "Fair", color: "bg-amber-100 text-amber-700 border-amber-200" },
    poor: { label: "Needs Attention", color: "bg-red-100 text-red-700 border-red-200" },
  };

  const kpis = [
    {
      label: "Coverage",
      value: `${coveragePct}%`,
      sub: `${active} of ${total} targets`,
      icon: TrendingUp,
      color: coveragePct >= 80 ? "text-emerald-600" : coveragePct >= 60 ? "text-amber-600" : "text-red-600",
      bg: coveragePct >= 80 ? "bg-emerald-50" : coveragePct >= 60 ? "bg-amber-50" : "bg-red-50",
      tab: "coverage",
    },
    {
      label: "Missing Help",
      value: missing,
      sub: "targets without content",
      icon: AlertCircle,
      color: missing > 20 ? "text-red-600" : missing > 5 ? "text-amber-600" : "text-emerald-600",
      bg: missing > 20 ? "bg-red-50" : missing > 5 ? "bg-amber-50" : "bg-emerald-50",
      tab: "coverage",
    },
    {
      label: "Draft / Review",
      value: draft + reviewNeeded,
      sub: `${draft} draft · ${reviewNeeded} needs review`,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      tab: "coverage",
    },
    {
      label: "AI Review Queue",
      value: pendingAI,
      sub: `${unanswered} unanswered questions`,
      icon: MessageSquare,
      color: pendingAI > 0 ? "text-red-600" : "text-emerald-600",
      bg: pendingAI > 0 ? "bg-red-50" : "bg-emerald-50",
      tab: "ai_review",
    },
    {
      label: "Manual Topics",
      value: publishedTopics,
      sub: `of ${topics.length} total published`,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
      tab: "manual",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Health banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border bg-card gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Help System Health</span>
          <Badge className={`text-[10px] border ${healthConfig[health].color}`}>{healthConfig[health].label}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {missing > 0 && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
              onClick={() => onNavigate("bulk_ai")}>
              <Sparkles className="w-3 h-3" /> Generate {missing} Missing
            </Button>
          )}
          {pendingAI > 0 && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => onNavigate("ai_review")}>
              <MessageSquare className="w-3 h-3" /> Review {pendingAI} AI Flags
            </Button>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label}
            className={`rounded-xl border p-3 cursor-pointer hover:shadow-sm transition-all ${kpi.bg}`}
            onClick={() => onNavigate(kpi.tab)}>
            <div className="flex items-center justify-between mb-1">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs font-medium text-foreground">{kpi.label}</p>
            <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}