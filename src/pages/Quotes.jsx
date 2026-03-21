import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileText, DollarSign, Calendar, Star, Filter, Search,
  Calculator, CheckCircle, Clock, XCircle, Zap, ArrowRight, Plus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function Quotes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [calculating, setCalculating] = useState(null);

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 100),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));

  const updateScenario = useMutation({
    mutationFn: ({ id, data }) => base44.entities.QuoteScenario.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["scenarios-all"] }),
  });

  const handleCalculate = async (scenario) => {
    setCalculating(scenario.id);
    try {
      await base44.entities.QuoteScenario.update(scenario.id, { status: "running" });
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      const res = await base44.functions.invoke("calculateQuoteRates", { scenario_id: scenario.id });
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Rates calculated", description: `$${res.data.total_monthly_premium?.toLocaleString()}/mo total premium across ${res.data.plan_results?.length} plans` });
    } catch (e) {
      await base44.entities.QuoteScenario.update(scenario.id, { status: "error" });
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Calculation failed", description: e.message, variant: "destructive" });
    } finally {
      setCalculating(null);
    }
  };

  const filtered = scenarios.filter(s => {
    const relatedCase = caseMap[s.case_id];
    const q = search.toLowerCase();
    const matchSearch = !search || s.name?.toLowerCase().includes(q) || relatedCase?.employer_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Metrics
  const completed = scenarios.filter(s => s.status === "completed").length;
  const totalPremium = scenarios.filter(s => s.total_monthly_premium).reduce((sum, s) => sum + (s.total_monthly_premium || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="View, calculate, and manage quote scenarios"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Scenarios", value: scenarios.length, color: "text-foreground" },
          { label: "Completed", value: completed, color: "text-green-600" },
          { label: "Pending Calc", value: scenarios.filter(s => s.status === "draft").length, color: "text-amber-600" },
          { label: "Total Premium/mo", value: totalPremium > 0 ? `$${(totalPremium / 1000).toFixed(0)}k` : "—", color: "text-primary" },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search scenarios or employers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No Quote Scenarios" description="Quote scenarios are created within individual cases" />
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const relatedCase = caseMap[s.case_id];
            const isCalc = calculating === s.id;
            return (
              <Card key={s.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{s.name}</p>
                          <StatusBadge status={s.status} />
                          {s.is_recommended && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">
                              <Star className="w-2.5 h-2.5 mr-0.5" /> Recommended
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground">{relatedCase?.employer_name || "Unknown"}</span>
                          {s.total_monthly_premium && (
                            <span className="flex items-center gap-0.5 text-primary font-semibold">
                              <DollarSign className="w-3 h-3" />{s.total_monthly_premium.toLocaleString()}/mo total
                            </span>
                          )}
                          {s.employer_monthly_cost && <span>${s.employer_monthly_cost.toLocaleString()}/mo employer</span>}
                          {s.employee_monthly_cost_avg && <span>~${s.employee_monthly_cost_avg.toFixed(0)}/mo avg EE</span>}
                          {s.plan_count && <span>{s.plan_count} plans</span>}
                          {s.quoted_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(s.quoted_at), "MMM d, yyyy")}
                            </span>
                          )}
                          {s.expires_at && <span className="text-orange-500">Exp. {format(new Date(s.expires_at), "MMM d")}</span>}
                        </div>
                        {s.carriers_included?.length > 0 && (
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {s.carriers_included.map((c, i) => <Badge key={i} variant="outline" className="text-[10px]">{c}</Badge>)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Mark Recommended */}
                      <Button
                        variant="ghost" size="icon" className={`h-7 w-7 ${s.is_recommended ? "text-amber-500" : "text-muted-foreground"}`}
                        title={s.is_recommended ? "Remove recommendation" : "Mark as recommended"}
                        onClick={() => updateScenario.mutate({ id: s.id, data: { is_recommended: !s.is_recommended } })}
                      >
                        <Star className="w-3.5 h-3.5" fill={s.is_recommended ? "currentColor" : "none"} />
                      </Button>

                      {/* Mark Expired */}
                      {s.status !== "expired" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-orange-500"
                          title="Mark as expired"
                          onClick={() => updateScenario.mutate({ id: s.id, data: { status: "expired" } })}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {/* Calculate */}
                      {["draft", "error"].includes(s.status) && (
                        <Button size="sm" className="text-xs h-7" onClick={() => handleCalculate(s)} disabled={isCalc}>
                          {isCalc ? (
                            <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin mr-1.5" />Calculating…</>
                          ) : (
                            <><Calculator className="w-3 h-3 mr-1.5" />Calculate Rates</>
                          )}
                        </Button>
                      )}

                      {/* Open Case */}
                      <Link to={`/cases/${s.case_id}`}>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <ArrowRight className="w-3 h-3 mr-1" /> Case
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}