import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ShieldCheck, AlertCircle, CheckCircle2, Clock, TrendingUp,
  BookOpen, Sparkles, Eye, Camera, ExternalLink, Target, FileText
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

export default function HelpDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [snapshotting, setSnapshotting] = useState(false);

  const { data: contents = [] } = useQuery({
    queryKey: ["help-dash-contents"],
    queryFn: () => base44.entities.HelpContent.list("-updated_date", 500),
  });

  const { data: aiLogs = [] } = useQuery({
    queryKey: ["help-dash-ailogs"],
    queryFn: () => base44.entities.HelpAIQuestionLog.list("-created_date", 100),
  });

  const { data: searchLogs = [] } = useQuery({
    queryKey: ["help-dash-searchlogs"],
    queryFn: () => base44.entities.HelpSearchLog.list("-created_date", 200),
  });

  const { data: snapshots = [] } = useQuery({
    queryKey: ["help-dash-snapshots"],
    queryFn: () => base44.entities.HelpCoverageSnapshot.list("-created_date", 10),
  });

  if (user?.role !== "admin") {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Admin access required.</p></div>;
  }

  // Compute live stats
  const contentMap = contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {});
  const total = HELP_TARGETS.length;
  const activeCount = HELP_TARGETS.filter(t => contentMap[t.target_code]?.status === "active").length;
  const missingCount = HELP_TARGETS.filter(t => !contentMap[t.target_code]).length;
  const draftCount = contents.filter(c => c.status === "draft").length;
  const reviewCount = contents.filter(c => c.status === "review_required").length;
  const coveragePct = Math.round((activeCount / total) * 100);

  const lowConfidenceAI = aiLogs.filter(l => (l.answer_confidence || 0) < 0.4 && !l.reviewed_by_admin);
  const unanswered = aiLogs.filter(l => !l.answer_text);

  // Top searched terms
  const termFreq = {};
  for (const s of searchLogs) {
    const t = (s.search_text || "").toLowerCase().trim();
    if (t) termFreq[t] = (termFreq[t] || 0) + 1;
  }
  const topTerms = Object.entries(termFreq).sort((a,b) => b[1]-a[1]).slice(0, 8);

  // Most viewed content
  const topViewed = [...contents].sort((a,b) => (b.view_count||0) - (a.view_count||0)).slice(0, 5);

  // Recently updated
  const recentUpdated = [...contents].sort((a,b) => new Date(b.updated_date||0) - new Date(a.updated_date||0)).slice(0, 5);

  // Lowest coverage modules
  const modCoverage = MODULES.map(mod => {
    const modTargets = HELP_TARGETS.filter(t => t.module_code === mod);
    const modActive = modTargets.filter(t => contentMap[t.target_code]?.status === "active").length;
    return { mod, total: modTargets.length, active: modActive, pct: Math.round((modActive / modTargets.length) * 100) };
  }).sort((a,b) => a.pct - b.pct).slice(0, 5);

  const takeSnapshot = async () => {
    setSnapshotting(true);
    try {
      await base44.functions.invoke("generateCoverageSnapshot", {});
      queryClient.invalidateQueries({ queryKey: ["help-dash-snapshots"] });
    } finally {
      setSnapshotting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Governance Dashboard"
        description="Platform-wide help coverage, quality, and HelpAI performance"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={takeSnapshot} disabled={snapshotting} className="gap-1">
              <Camera className="w-3.5 h-3.5" /> {snapshotting ? "Snapshotting…" : "Take Snapshot"}
            </Button>
            <Link to="/help-admin"><Button size="sm" className="gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Manage Help</Button></Link>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Total Targets", value: total, color: "text-foreground", icon: Target },
          { label: "Active Coverage", value: `${coveragePct}%`, color: "text-emerald-600", icon: CheckCircle2 },
          { label: "With Active Help", value: activeCount, color: "text-emerald-600", icon: ShieldCheck },
          { label: "Missing Help", value: missingCount, color: "text-red-600", icon: AlertCircle },
          { label: "Draft Only", value: draftCount, color: "text-amber-600", icon: Clock },
          { label: "Review Required", value: reviewCount, color: "text-orange-600", icon: Eye },
          { label: "AI Low Confidence", value: lowConfidenceAI.length, color: "text-purple-600", icon: Sparkles },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 text-center space-y-1">
              <kpi.icon className={`w-5 h-5 mx-auto ${kpi.color}`} />
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coverage bar */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Overall Help Coverage</span>
            <span className={`font-bold ${coveragePct >= 80 ? "text-emerald-600" : coveragePct >= 50 ? "text-amber-600" : "text-red-600"}`}>{coveragePct}%</span>
          </div>
          <Progress value={coveragePct} className="h-3" />
          <p className="text-xs text-muted-foreground">{activeCount} of {total} targets have active help content</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Modules with lowest coverage */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Lowest Coverage Modules</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {modCoverage.map(m => (
              <div key={m.mod} className="flex items-center gap-2">
                <span className="text-xs w-24 truncate font-medium">{MODULE_LABELS[m.mod] || m.mod}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full">
                  <div className={`h-full rounded-full ${m.pct >= 80 ? "bg-emerald-500" : m.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${m.pct}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-12 text-right">{m.active}/{m.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Review queue */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> HelpAI Review Queue</CardTitle>
              {lowConfidenceAI.length > 0 && <Badge className="text-[9px] bg-amber-100 text-amber-700">{lowConfidenceAI.length} pending</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowConfidenceAI.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1" />
                <p className="text-xs text-muted-foreground">No pending review items</p>
              </div>
            ) : (
              <>
                {lowConfidenceAI.slice(0, 4).map(log => (
                  <div key={log.id} className="flex items-start gap-2 py-1 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{log.question_text}</p>
                      <p className="text-[10px] text-muted-foreground">{log.page_code} · {Math.round((log.answer_confidence || 0) * 100)}% confidence</p>
                    </div>
                  </div>
                ))}
                <Link to="/help-admin?tab=ai_review">
                  <Button size="sm" variant="link" className="text-xs p-0 h-auto">View all {lowConfidenceAI.length} →</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top search terms */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Top Help Searches</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {topTerms.length === 0 ? (
              <p className="text-xs text-muted-foreground">No search data yet.</p>
            ) : (
              topTerms.map(([term, count]) => (
                <div key={term} className="flex items-center justify-between">
                  <span className="text-xs truncate max-w-[70%]">{term}</span>
                  <Badge variant="outline" className="text-[9px]">{count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most viewed help */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Eye className="w-4 h-4" /> Most Viewed Help Content</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topViewed.filter(c => (c.view_count||0) > 0).length === 0 ? (
              <p className="text-xs text-muted-foreground">No views recorded yet.</p>
            ) : (
              topViewed.filter(c => (c.view_count||0) > 0).map(c => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.help_title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.help_target_code}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] ml-2">{c.view_count} views</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recently updated */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Recently Updated</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recentUpdated.map(c => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.help_title}</p>
                  <p className="text-[10px] text-muted-foreground">{c.last_updated_by || "system"} · v{c.version_no || 1}</p>
                </div>
                <Badge
                  className={`text-[9px] ml-2 ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : c.status === "draft" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}
                >
                  {c.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Coverage snapshots trend */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Coverage History</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {snapshots.map(s => (
                <div key={s.id} className="flex-shrink-0 text-center px-3 py-2 bg-muted/50 rounded-lg min-w-[80px]">
                  <p className={`text-lg font-bold ${s.coverage_pct >= 80 ? "text-emerald-600" : s.coverage_pct >= 50 ? "text-amber-600" : "text-red-600"}`}>{s.coverage_pct}%</p>
                  <p className="text-[9px] text-muted-foreground">{s.snapshot_date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}