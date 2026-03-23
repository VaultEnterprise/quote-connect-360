import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search, TrendingUp, AlertCircle, Sparkles, Eye, MessageSquare, BarChart2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PageHeader from "@/components/shared/PageHeader";

const PAGE_LABEL = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", GENERAL:"General",
};

export default function HelpSearchAnalytics() {
  const { user } = useAuth();

  const { data: searchLogs = [] } = useQuery({
    queryKey: ["help-analytics-search"],
    queryFn: () => base44.entities.HelpSearchLog.list("-created_date", 500),
  });

  const { data: aiLogs = [] } = useQuery({
    queryKey: ["help-analytics-ai"],
    queryFn: () => base44.entities.HelpAIQuestionLog.list("-created_date", 500),
  });

  });

  const { data: contents = [] } = useQuery({
    queryKey: ["help-analytics-contents"],
    queryFn: () => base44.entities.HelpContent.filter({ status: "active" }, "-view_count", 100),
  });

  if (user?.role !== "admin") return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Admin access required.</p></div>;

  // Top search terms
  const termFreq = useMemo(() => {
    const freq = {};
    for (const s of searchLogs) {
      const t = (s.search_text || "").toLowerCase().trim();
      if (t && t.length > 2) freq[t] = (freq[t] || 0) + 1;
    }
    return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 20);
  }, [searchLogs]);

  // Zero-result searches
  const zeroResults = useMemo(() =>
    searchLogs.filter(s => (s.result_count || 0) === 0).map(s => s.search_text).filter(Boolean),
  [searchLogs]);
  const uniqueZero = [...new Set(zeroResults)].slice(0, 15);

  // HelpAI by page
  const aiByPage = useMemo(() => {
    const byPage = {};
    for (const log of aiLogs) {
      const p = log.page_code || "GENERAL";
      if (!byPage[p]) byPage[p] = { page: p, questions: 0, lowConf: 0, avgConf: 0, total: 0 };
      byPage[p].questions++;
      byPage[p].total += (log.confidence_score || 0);
      if ((log.confidence_score || 0) < 0.4) byPage[p].lowConf++;
    }
    return Object.values(byPage).map(p => ({
      ...p,
      avgConf: p.questions > 0 ? Math.round((p.total / p.questions) * 100) : 0,
    })).sort((a,b) => b.questions - a.questions);
  }, [aiLogs]);

  // Most viewed content
  const topViewed = [...contents].filter(c => (c.view_count||0) > 0).sort((a,b) => (b.view_count||0) - (a.view_count||0)).slice(0, 10);

  // Confidence distribution
  const confBuckets = { "90-100%": 0, "70-89%": 0, "50-69%": 0, "30-49%": 0, "<30%": 0 };
  for (const l of aiLogs) {
    const c = (l.answer_confidence || 0) * 100;
    if (c >= 90) confBuckets["90-100%"]++;
    else if (c >= 70) confBuckets["70-89%"]++;
    else if (c >= 50) confBuckets["50-69%"]++;
    else if (c >= 30) confBuckets["30-49%"]++;
    else confBuckets["<30%"]++;
  }
  const confChartData = Object.entries(confBuckets).map(([range, count]) => ({ range, count }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Search Analytics"
        description="Usage patterns, search behavior, and HelpAI performance metrics"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Searches", value: searchLogs.length, icon: Search, color: "text-primary" },
          { label: "HelpAI Questions", value: aiLogs.length, icon: Sparkles, color: "text-purple-600" },
          { label: "Zero-Result Searches", value: uniqueZero.length, icon: AlertCircle, color: "text-red-600" },
          { label: "Total Help Views", value: contents.reduce((acc, c) => acc + (c.view_count || 0), 0), icon: Eye, color: "text-emerald-600" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 text-center">
              <k.icon className={`w-5 h-5 mx-auto mb-1 ${k.color}`} />
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top search terms */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" /> Top Search Terms</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-72 overflow-y-auto">
            {termFreq.length === 0 ? <p className="text-xs text-muted-foreground">No data yet.</p> : termFreq.map(([term, count], i) => (
              <div key={term} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-4 text-right">{i+1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs">{term}</span>
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </div>
                  <Progress value={(count / (termFreq[0]?.[1] || 1)) * 100} className="h-1" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Zero-result searches */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Zero-Result Searches ({uniqueZero.length})</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">These searches returned no results — consider adding help content for these topics.</p>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {uniqueZero.length === 0 ? <p className="text-xs text-muted-foreground">None — great coverage!</p> : uniqueZero.map((term, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50">
                  <span className="text-xs text-amber-700 bg-amber-50 px-1.5 rounded">gap</span>
                  <span className="text-xs">{term}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HelpAI by page */}
      {aiByPage.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4 text-purple-500" /> HelpAI Usage by Page</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aiByPage.map(p => (
                <div key={p.page} className="flex items-center gap-3">
                  <span className="text-xs font-medium w-28 truncate">{PAGE_LABEL[p.page] || p.page}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(p.questions / (aiByPage[0]?.questions || 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{p.questions} Q · {p.avgConf}% avg</span>
                  {p.lowConf > 0 && <Badge className="text-[8px] bg-amber-100 text-amber-700">{p.lowConf} low</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Confidence distribution */}
      {aiLogs.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart2 className="w-4 h-4" /> HelpAI Confidence Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={confChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Most viewed help */}
      {topViewed.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Eye className="w-4 h-4" /> Most Viewed Help Content</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topViewed.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground w-4 text-right">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{c.help_title}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{c.help_target_code}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px]">{c.view_count} views</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}