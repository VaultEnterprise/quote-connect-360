import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Zap, Brain, TrendingUp, Shield, Star, ChevronRight, Play,
  CheckCircle, XCircle, AlertTriangle, Sparkles, Target, DollarSign,
  Users, ArrowRight, BarChart3, RefreshCw, Info, Award, Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

const RISK_TIER_CONFIG = {
  preferred: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", label: "Preferred Risk", bar: "bg-emerald-500" },
  standard: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "Standard Risk", bar: "bg-blue-500" },
  elevated: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", label: "Elevated Risk", bar: "bg-amber-500" },
  high: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700", label: "High Risk", bar: "bg-red-500" },
};

const IMPACT_COLORS = { positive: "text-emerald-600", negative: "text-red-500", neutral: "text-muted-foreground" };
const IMPACT_ICONS = { positive: "↑", negative: "↓", neutral: "→" };

const PLAN_TYPE_COLORS = {
  dental: "bg-blue-100 text-blue-700",
  vision: "bg-purple-100 text-purple-700",
  life: "bg-green-100 text-green-700",
  std: "bg-orange-100 text-orange-700",
  ltd: "bg-red-100 text-red-700",
  voluntary: "bg-pink-100 text-pink-700",
};

function RiskGauge({ score }) {
  const tier = score < 30 ? "preferred" : score < 55 ? "standard" : score < 75 ? "elevated" : "high";
  const cfg = RISK_TIER_CONFIG[tier];
  const pct = score;
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className={`w-28 h-28 rounded-full border-4 ${cfg.border} flex items-center justify-center ${cfg.bg} relative`}>
        <div className="text-center">
          <p className={`text-3xl font-black ${cfg.color}`}>{score}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Risk Score</p>
        </div>
      </div>
      <Badge className={`${cfg.badge} font-semibold`}>{cfg.label}</Badge>
      <div className="w-full max-w-48">
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 rounded-full relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-foreground rounded-full shadow-sm transition-all"
            style={{ left: `calc(${pct}% - 6px)` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>Low Risk</span><span>High Risk</span>
        </div>
      </div>
    </div>
  );
}

function RunPanel({ cases, scenarios, onRun, isRunning }) {
  const [caseId, setCaseId] = useState("");
  const [scenarioId, setScenarioId] = useState("");
  const [mode, setMode] = useState("guided");
  const [stage, setStage] = useState("post_quote");

  const caseScenariosFiltered = scenarios.filter(s => !caseId || s.case_id === caseId);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-4 h-4 text-primary" /> Run PolicyMatchAI
        </CardTitle>
        <p className="text-xs text-muted-foreground">Select a case and trigger the optimization engine</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Case</label>
          <Select value={caseId} onValueChange={v => { setCaseId(v); setScenarioId(""); }}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select case…" /></SelectTrigger>
            <SelectContent>{cases.map(c => <SelectItem key={c.id} value={c.id}>{c.employer_name} — {c.case_number || c.id.slice(-6)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Quote Scenario (optional)</label>
          <Select value={scenarioId} onValueChange={setScenarioId}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Any scenario…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific scenario</SelectItem>
              {caseScenariosFiltered.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Mode</label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="guided">Guided</SelectItem>
                <SelectItem value="full_auto">Full Auto</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Stage</label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_quote">Pre-Quote</SelectItem>
                <SelectItem value="post_quote">Post-Quote</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
                <SelectItem value="mid_year">Mid-Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
          disabled={!caseId || isRunning}
          onClick={() => onRun({ case_id: caseId, scenario_id: scenarioId === "none" ? "" : scenarioId, mode, trigger_stage: stage })}
        >
          {isRunning ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Analyzing…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" />Run Optimization</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function ResultCard({ result, onAccept, onDecline }) {
  const tier = result.risk_tier || "standard";
  const cfg = RISK_TIER_CONFIG[tier] || RISK_TIER_CONFIG.standard;
  const isAccepted = result.status === "accepted";
  const isDeclined = result.status === "declined";

  const radarData = (result.risk_factors || []).slice(0, 6).map(f => ({
    factor: f.factor?.split(" ").slice(0, 2).join(" ") || "Factor",
    value: f.impact === "positive" ? Math.round((1 - f.weight) * 100) : Math.round(f.weight * 100),
  }));

  return (
    <Card className={`border-2 ${cfg.border} overflow-hidden`}>
      {/* Header band */}
      <div className={`px-5 py-3 ${cfg.bg} border-b ${cfg.border} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3">
          <Brain className={`w-5 h-5 ${cfg.color}`} />
          <div>
            <p className="text-sm font-bold">{result.employer_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{result.trigger_stage?.replace(/_/g, " ")} · {result.mode?.replace(/_/g, " ")} mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAccepted && <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>}
          {isDeclined && <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>}
          {!isAccepted && !isDeclined && <Badge className={cfg.badge}><Zap className="w-3 h-3 mr-1" />Optimized</Badge>}
          <span className="text-xs text-muted-foreground">{format(new Date(result.created_date), "MMM d, h:mm a")}</span>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Risk Score */}
          <div className="flex flex-col items-center">
            <RiskGauge score={result.risk_score || 50} />
            <div className="w-full mt-3 space-y-1.5">
              {(result.risk_factors || []).slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className={`font-bold w-3 ${IMPACT_COLORS[f.impact]}`}>{IMPACT_ICONS[f.impact]}</span>
                  <span className="flex-1 text-muted-foreground truncate">{f.factor}</span>
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${f.impact === "positive" ? "bg-emerald-500" : f.impact === "negative" ? "bg-red-400" : "bg-blue-400"}`} style={{ width: `${(f.weight || 0.5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Optimization Output */}
          <div className="lg:col-span-2 space-y-4">
            {/* Summary */}
            <div className="p-3 rounded-xl bg-muted/50 border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Optimization Summary</p>
              <p className="text-sm leading-relaxed">{result.recommendation_summary}</p>
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`text-center p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                <p className={`text-xl font-black ${cfg.color}`}>{result.risk_score || "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Risk Score</p>
              </div>
              <div className="text-center p-3 rounded-xl border bg-muted/30">
                <p className={`text-xl font-black ${result.cost_delta_pmpm <= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {result.cost_delta_pmpm != null ? `${result.cost_delta_pmpm > 0 ? "+" : ""}$${result.cost_delta_pmpm.toFixed(0)}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">PMPM Delta</p>
              </div>
              <div className="text-center p-3 rounded-xl border bg-muted/30">
                <p className="text-xl font-black text-primary">{result.value_score || "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Value Score</p>
              </div>
            </div>

            {/* Optimized Plan */}
            {result.optimized_plan_name && (
              <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary/20 bg-primary/5">
                <Shield className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Optimized Medical Plan</p>
                  <p className="text-sm font-bold">{result.optimized_plan_name}</p>
                </div>
                <Award className="w-5 h-5 text-amber-500 ml-auto" />
              </div>
            )}

            {/* Enhancements */}
            {result.enhancements?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Automatic Enhancements
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.enhancements.map((e, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border">
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${PLAN_TYPE_COLORS[e.plan_type] || "bg-gray-100 text-gray-700"}`}>{e.plan_type}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{e.plan_name || e.plan_type}</p>
                        <p className="text-[10px] text-muted-foreground">{e.value_gain}</p>
                      </div>
                      <span className={`text-[10px] font-bold flex-shrink-0 ${e.cost_delta_pmpm <= 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {e.cost_delta_pmpm != null ? `${e.cost_delta_pmpm > 0 ? "+" : ""}$${e.cost_delta_pmpm.toFixed(0)}/mo` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Broker talking points */}
            {result.optimization_rationale && (
              <details className="group">
                <summary className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1.5 list-none">
                  <Info className="w-3.5 h-3.5" /> Optimization Rationale <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2 pl-5">{result.optimization_rationale}</p>
              </details>
            )}

            {/* Actions */}
            {!isAccepted && !isDeclined && (
              <div className="flex gap-3 pt-1 border-t">
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => onAccept(result.id)}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accept Optimization
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-muted-foreground" onClick={() => onDecline(result.id)}>
                  <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
                </Button>
                <Link to={`/cases/${result.case_id}`}>
                  <Button size="sm" variant="ghost" className="text-xs">
                    <ArrowRight className="w-3.5 h-3.5 mr-1" /> Case
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PolicyMatchAIPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeResult, setActiveResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [tab, setTab] = useState("run");

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 100),
  });

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["policymatch-results"],
    queryFn: () => base44.entities.PolicyMatchResult.list("-created_date", 50),
  });

  const updateResult = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PolicyMatchResult.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["policymatch-results"] }),
  });

  const handleRun = async (params) => {
    setIsRunning(true);
    setTab("results");
    try {
      const res = await base44.functions.invoke("policyMatchAI", params);
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ["policymatch-results"] });
      setActiveResult(res.data);
      toast({
        title: "PolicyMatchAI Complete",
        description: `${res.data.risk_tier?.toUpperCase()} risk profile — ${res.data.enhancements?.length || 0} enhancements identified`,
      });
    } catch (e) {
      toast({ title: "Analysis Failed", description: e.message, variant: "destructive" });
      setTab("run");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAccept = (id) => {
    updateResult.mutate({ id, data: { status: "accepted", accepted_at: new Date().toISOString() } });
    toast({ title: "Optimization Accepted", description: "The policy bundle has been applied." });
  };

  const handleDecline = (id) => {
    updateResult.mutate({ id, data: { status: "declined", declined_at: new Date().toISOString() } });
  };

  // Stats
  const totalRuns = results.length;
  const accepted = results.filter(r => r.status === "accepted").length;
  const preferred = results.filter(r => r.risk_tier === "preferred").length;
  const avgValue = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.value_score || 0), 0) / results.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">PolicyMatch<span className="text-primary">AI</span></h1>
            <p className="text-xs text-muted-foreground">Intelligent Risk-Based Policy Optimization Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1">
            <Zap className="w-3 h-3 mr-1.5" />Powered by AI
          </Badge>
        </div>
      </div>

      {/* Value Prop Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Target, label: "Low-Risk Groups", desc: "Automatically upgraded with enhanced coverage + ancillary bundles", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
          { icon: BarChart3, label: "Carrier Alignment", desc: "Improved loss ratios through intelligent risk segmentation", color: "text-blue-600 bg-blue-50 border-blue-200" },
          { icon: Award, label: "Zero-Friction Close", desc: "Turn the purchase decision into: 'Why wouldn\'t I take this?'", color: "text-purple-600 bg-purple-50 border-purple-200" },
        ].map(v => (
          <div key={v.label} className={`flex items-start gap-3 p-4 rounded-xl border ${v.color}`}>
            <v.icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">{v.label}</p>
              <p className="text-xs opacity-80 mt-0.5">{v.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      {totalRuns > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Analyses", value: totalRuns, color: "text-foreground" },
            { label: "Accepted", value: accepted, color: "text-emerald-600" },
            { label: "Preferred Risk", value: preferred, color: "text-blue-600" },
            { label: "Avg Value Score", value: `${avgValue}/100`, color: "text-primary" },
          ].map(m => (
            <Card key={m.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="run" className="flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5" /> Run Engine
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Results
            {results.length > 0 && <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-white">{results.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="how" className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> How It Works
          </TabsTrigger>
        </TabsList>

        {/* Run Tab */}
        <TabsContent value="run" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RunPanel cases={cases} scenarios={scenarios} onRun={handleRun} isRunning={isRunning} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Recent Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No analyses yet. Run the engine to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {results.slice(0, 6).map(r => {
                      const cfg = RISK_TIER_CONFIG[r.risk_tier] || RISK_TIER_CONFIG.standard;
                      return (
                        <button key={r.id} onClick={() => { setActiveResult(r); setTab("results"); }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 text-left transition-colors">
                          <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-xs font-black ${cfg.color}`}>{r.risk_score || "?"}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.employer_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{r.trigger_stage?.replace(/_/g, " ")} · {format(new Date(r.created_date), "MMM d")}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge className={`text-[10px] ${cfg.badge}`}>{cfg.label}</Badge>
                            {r.status === "accepted" && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-4 space-y-4">
          {isRunning && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Analyzing risk profile…</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Evaluating census data, plan options, and carrier constraints</p>
                  <div className="mt-2 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {results.length === 0 && !isRunning ? (
            <div className="text-center py-16">
              <Brain className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-lg font-semibold">No optimization results yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Run the engine on a case to generate AI-powered policy optimization</p>
              <Button onClick={() => setTab("run")}><Play className="w-4 h-4 mr-2" />Run First Analysis</Button>
            </div>
          ) : (
            results.map(r => (
              <ResultCard key={r.id} result={r} onAccept={handleAccept} onDecline={handleDecline} />
            ))
          )}
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="how" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[
              {
                step: "1", title: "Multi-Source Risk Scoring", icon: Target, color: "bg-blue-100 text-blue-600",
                items: ["Demographic & eligibility data", "Smoker/behavioral indicators", "Coverage tier distribution", "Employer group dynamics", "Census health profile signals"],
              },
              {
                step: "2", title: "Policy Matching Engine", icon: Brain, color: "bg-purple-100 text-purple-600",
                items: ["Evaluates all available medical plans", "Considers all ancillary products", "Analyzes contribution structures", "Checks participation constraints", "Computes optimal cost-value ratio"],
              },
              {
                step: "3", title: "Automatic Enhancement", icon: Sparkles, color: "bg-emerald-100 text-emerald-600",
                items: ["Low-risk groups automatically upgraded", "Dental, vision, life, LTD added", "$0–$10 PMPM net cost impact", "System-driven, not manual", "Documented rationale generated"],
              },
              {
                step: "4", title: "Closed-Loop Outcome", icon: RefreshCw, color: "bg-amber-100 text-amber-600",
                items: ["Broker reviews or auto-accepts", "Policy routes to Vault products", "Risk pools stay controlled", "Renewal re-optimization triggered", "Lifetime value per member increases"],
              },
            ].map(s => (
              <Card key={s.step}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">Step {s.step}</p>
                      <p className="text-sm font-bold">{s.title}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {s.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mode comparison */}
          <Card className="mt-6">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Operational Modes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { mode: "Full Auto", desc: "System selects and binds optimal policy automatically. Ideal for high-confidence, low-risk segments.", badge: "bg-emerald-100 text-emerald-700" },
                  { mode: "Guided", desc: "System presents ranked options with clear advantages. Broker or employer selects from optimized set.", badge: "bg-blue-100 text-blue-700" },
                  { mode: "Hybrid", desc: "Automatic upgrades applied. Final selection remains user-controlled. Best of both worlds.", badge: "bg-purple-100 text-purple-700" },
                ].map(m => (
                  <div key={m.mode} className="p-4 rounded-xl border">
                    <Badge className={`${m.badge} mb-2`}>{m.mode}</Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}