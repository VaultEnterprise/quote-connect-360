import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calculator, Plus, AlertCircle, Download, Search, SlidersHorizontal, BarChart3, LayoutGrid, GitCompare, Info, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

import ContributionModelCard from "@/components/contributions/ContributionModelCard";
import ContributionComparePanel from "@/components/contributions/ContributionComparePanel";
import ContributionKPIBar from "@/components/contributions/ContributionKPIBar";
import CreateModelModal from "@/components/contributions/CreateModelModal";

const ACA_THRESHOLD_PCT = 9.02;

function exportToCSV(models, cases, scenarios) {
  const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));
  const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s]));
  const headers = [
    "Model Name", "Case", "Scenario", "Strategy",
    "EE Contribution %", "Dep Contribution %", "EE Flat $",
    "Employee Count", "Total Monthly Premium",
    "Employer Monthly Cost", "Employee Monthly Cost (avg/EE)",
    "Annual Employer Cost", "ACA Compliant", "ACA % of Income",
    "Notes"
  ];
  const MEDIAN = 60000;
  const rows = models.map(m => {
    const c = caseMap[m.case_id];
    const s = scenarioMap[m.scenario_id];
    const totalPremium = m.total_monthly_premium || 0;
    const eeCount = m.total_ee_count || 0;
    const avgPremiumPerEE = eeCount > 0 ? totalPremium / eeCount : 0;
    const employerMonthly = m.strategy === "percentage"
      ? avgPremiumPerEE * ((m.ee_contribution_pct ?? 80) / 100) * eeCount
      : (m.ee_contribution_flat ?? 0) * eeCount;
    const avgEECost = eeCount > 0 ? Math.max(0, totalPremium - employerMonthly) / eeCount : 0;
    const acaPct = avgEECost > 0 ? ((avgEECost * 12) / MEDIAN) * 100 : 0;
    return [
      m.name,
      c?.employer_name || "",
      s?.name || "",
      m.strategy || "",
      m.ee_contribution_pct ?? "",
      m.dep_contribution_pct ?? "",
      m.ee_contribution_flat ?? "",
      eeCount || "",
      totalPremium || "",
      employerMonthly.toFixed(2),
      avgEECost.toFixed(2),
      (employerMonthly * 12).toFixed(2),
      !m.aca_affordability_flag ? "Yes" : "No",
      acaPct.toFixed(2) + "%",
      m.notes || "",
    ];
  });

  const csvContent = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "contribution_models.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function ContributionModeling() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // grid | compare
  const [search, setSearch] = useState("");
  const [filterCase, setFilterCase] = useState("all");
  const [filterStrategy, setFilterStrategy] = useState("all");
  const [filterAca, setFilterAca] = useState("all");
  const [compareIds, setCompareIds] = useState(new Set());

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["contribution-models"],
    queryFn: () => base44.entities.ContributionModel.list("-created_date", 100),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 200),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["benefit-cases-all"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 200),
  });

  const deleteModel = useMutation({
    mutationFn: (id) => base44.entities.ContributionModel.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contribution-models"] }),
  });

  // Lookup maps
  const caseMap = useMemo(() => Object.fromEntries(cases.map(c => [c.id, c])), [cases]);
  const scenarioMap = useMemo(() => Object.fromEntries(scenarios.map(s => [s.id, s])), [scenarios]);

  // Unique cases that have models
  const casesWithModels = useMemo(() => {
    const ids = [...new Set(models.map(m => m.case_id).filter(Boolean))];
    return ids.map(id => caseMap[id]).filter(Boolean);
  }, [models, caseMap]);

  // Filter
  const filtered = useMemo(() => models.filter(m => {
    const c = caseMap[m.case_id];
    const matchSearch = !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      c?.employer_name?.toLowerCase().includes(search.toLowerCase());
    const matchCase = filterCase === "all" || m.case_id === filterCase;
    const matchStrategy = filterStrategy === "all" || m.strategy === filterStrategy;
    const matchAca = filterAca === "all" ||
      (filterAca === "safe" && !m.aca_affordability_flag) ||
      (filterAca === "risk" && m.aca_affordability_flag);
    return matchSearch && matchCase && matchStrategy && matchAca;
  }), [models, search, filterCase, filterStrategy, filterAca, caseMap]);

  // Group by case_id
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(m => {
      const key = m.case_id || "__unlinked__";
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [filtered]);

  // ACA alerts
  const acaFlags = models.filter(m => m.aca_affordability_flag);

  // Compare mode selection
  const toggleCompare = (id) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const modelsToCompare = models.filter(m => compareIds.has(m.id));

  const hasFilters = search || filterCase !== "all" || filterStrategy !== "all" || filterAca !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contribution Modeling"
        description="Model employer contribution strategies, run ACA affordability analysis, and compare options side-by-side"
        actions={
          <div className="flex gap-2">
            {models.length > 0 && (
              <Button variant="outline" onClick={() => exportToCSV(models, cases, scenarios)}>
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Model
            </Button>
          </div>
        }
      />

      {/* ACA Risk Banner */}
      {acaFlags.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{acaFlags.length} model(s) flagged for ACA affordability risk</p>
            <p className="text-xs text-red-600 mt-0.5">
              Employee contributions exceed the {ACA_THRESHOLD_PCT}% income threshold. Review and increase employer contributions for these models.
            </p>
          </div>
        </div>
      )}

      {/* KPI Bar */}
      {models.length > 0 && <ContributionKPIBar models={models} />}

      {/* ACA Reference Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">ACA Affordability Safe Harbor 2026:</span> Employee contribution for self-only coverage must not exceed {ACA_THRESHOLD_PCT}% of household income.
          Monthly maximum at $60k median income: <span className="font-semibold">${((60000 * (ACA_THRESHOLD_PCT / 100)) / 12).toFixed(0)}/mo</span>.
          Employers with 50+ FTEs (ALEs) are subject to the employer mandate.
        </div>
      </div>

      {/* Controls row */}
      {models.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search models or employers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
          </div>

          {/* Filters */}
          <Select value={filterCase} onValueChange={setFilterCase}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Cases" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              {casesWithModels.map(c => <SelectItem key={c.id} value={c.id}>{c.employer_name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterStrategy} onValueChange={setFilterStrategy}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Strategies" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strategies</SelectItem>
              <SelectItem value="percentage">% of Premium</SelectItem>
              <SelectItem value="flat_dollar">Flat Dollar</SelectItem>
              <SelectItem value="defined_contribution">Defined Contribution</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterAca} onValueChange={setFilterAca}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="ACA Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ACA</SelectItem>
              <SelectItem value="safe">ACA Safe</SelectItem>
              <SelectItem value="risk">ACA Risk</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => { setSearch(""); setFilterCase("all"); setFilterStrategy("all"); setFilterAca("all"); }}>
              Clear
            </Button>
          )}

          {/* View toggle */}
          <div className="flex gap-1 ml-auto border rounded-lg p-1">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button variant={viewMode === "compare" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("compare")}>
              <GitCompare className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          icon={Calculator}
          title="No Contribution Models Yet"
          description="Create contribution models to analyze employer strategies, run ACA affordability checks, and compare options side-by-side across cases."
          actionLabel="Create First Model"
          onAction={() => setShowCreate(true)}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Filter} title="No models match your filters" actionLabel="Clear Filters" onAction={() => { setSearch(""); setFilterCase("all"); setFilterStrategy("all"); setFilterAca("all"); }} />
      ) : viewMode === "compare" ? (
        /* ── Compare View ── */
        <div className="space-y-6">
          <div className="p-3 rounded-lg border bg-muted/30 text-sm text-muted-foreground flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <span>Select models to include in the comparison table by clicking them below. All visible models are shown in the table.</span>
          </div>
          <ContributionComparePanel models={filtered} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(m => (
              <ContributionModelCard
                key={m.id} model={m}
                onDelete={(id) => deleteModel.mutate(id)}
                caseName={caseMap[m.case_id]?.employer_name}
                scenarioName={scenarioMap[m.scenario_id]?.name}
                compareMode={true}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── Grid View grouped by case ── */
        <div className="space-y-8">
          {Object.entries(grouped).map(([caseId, caseModels]) => {
            const c = caseMap[caseId];
            return (
              <div key={caseId} className="space-y-3">
                {/* Case header */}
                <div className="flex items-center gap-3 pb-1 border-b">
                  <div>
                    <p className="font-semibold text-sm">{c?.employer_name || "Unlinked Models"}</p>
                    {c && <p className="text-xs text-muted-foreground">{c.case_number} · {c.stage?.replace(/_/g, " ")}</p>}
                  </div>
                  <Badge variant="secondary" className="text-xs ml-auto">{caseModels.length} model{caseModels.length !== 1 ? "s" : ""}</Badge>
                  {caseModels.length >= 2 && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setViewMode("compare")}>
                      <GitCompare className="w-3 h-3 mr-1.5" /> Compare
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {caseModels.map(m => (
                    <ContributionModelCard
                      key={m.id} model={m}
                      onDelete={(id) => deleteModel.mutate(id)}
                      caseName={c?.employer_name}
                      scenarioName={scenarioMap[m.scenario_id]?.name}
                      compareMode={false}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateModelModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          cases={cases}
          scenarios={scenarios}
        />
      )}
    </div>
  );
}