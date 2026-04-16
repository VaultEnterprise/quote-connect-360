import { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, Search, Filter, GitCompare, ChevronDown, ChevronUp,
  AlertTriangle, SortAsc, X, XCircle, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import QuotesKPIBar from "@/components/quotes/QuotesKPIBar";
import ScenarioCard from "@/components/quotes/ScenarioCard";
import ScenarioCompare from "@/components/quotes/ScenarioCompare";
import NewScenarioFromQuotes from "@/components/quotes/NewScenarioFromQuotes";
import QuoteScenarioModal from "@/components/quotes/QuoteScenarioModal";
import ScenarioDetailModal from "@/components/quotes/ScenarioDetailModal";
import ApprovalModal from "@/components/quotes/ApprovalModal";
import ContributionSlider from "@/components/quotes/ContributionSlider";
import SavedViewsPanel from "@/components/quotes/SavedViewsPanel";
import { useToast } from "@/components/ui/use-toast";
import { parseISO, isAfter, addDays } from "date-fns";
import useRouteContext from "@/hooks/useRouteContext";
import { useAuth } from "@/lib/AuthContext";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function Quotes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const routeContext = useRouteContext();
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [caseFilter, setCaseFilter] = useState(routeContext.caseId || "all");
  const [sortBy, setSortBy] = useState("created_date");
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [showNewScenario, setShowNewScenario] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [calculating, setCalculating] = useState(null);
  const [collapsedCases, setCollapsedCases] = useState({});
  const [groupByCaseMode, setGroupByCaseMode] = useState(true);
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [bulkCalculating, setBulkCalculating] = useState(false);
  const [scenarioDetailModal, setScenarioDetailModal] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);
  const [contributionModal, setContributionModal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["scenarios-all", currentUser?.email, currentUser?.role],
    enabled: !!currentUser,
    queryFn: () => currentUser?.role === "admin"
      ? base44.entities.QuoteScenario.list("-created_date", 200)
      : base44.entities.QuoteScenario.filter({ assigned_to: currentUser?.email }, "-created_date", 200),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases", currentUser?.email, currentUser?.role],
    enabled: !!currentUser,
    queryFn: () => currentUser?.role === "admin"
      ? base44.entities.BenefitCase.list("-created_date", 100)
      : base44.entities.BenefitCase.filter({ assigned_to: currentUser?.email }, "-created_date", 100),
  });

  const caseMap = useMemo(() => Object.fromEntries(cases.map(c => [c.id, c])), [cases]);

  const now = new Date();
  const expiringSoon = useMemo(() => scenarios.filter(s => {
    if (!s.expires_at || s.status === "expired") return false;
    const exp = parseISO(s.expires_at);
    return isAfter(exp, now) && !isAfter(exp, addDays(now, 14));
  }), [scenarios]);

  const employers = useMemo(() => {
    const map = {};
    scenarios.forEach(s => {
      const c = caseMap[s.case_id];
      if (c?.employer_name) map[s.case_id] = c.employer_name;
    });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [scenarios, caseMap]);

  const allCarriers = useMemo(() => {
    const set = new Set();
    scenarios.forEach(s => s.carriers_included?.forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [scenarios]);

  const filtered = useMemo(() => {
    let result = scenarios.filter(s => {
      const c = caseMap[s.case_id];
      const q = search.toLowerCase();
      const matchSearch = !search ||
        s.name?.toLowerCase().includes(q) ||
        c?.employer_name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchCase = caseFilter === "all" || s.case_id === caseFilter;
      const matchExpiring = !showExpiringOnly || expiringSoon.some(e => e.id === s.id);
      const matchCarrier = carrierFilter === "all" || s.carriers_included?.includes(carrierFilter);
      return matchSearch && matchStatus && matchCase && matchExpiring && matchCarrier;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "premium") return (b.total_monthly_premium || 0) - (a.total_monthly_premium || 0);
      if (sortBy === "expiry") {
        if (!a.expires_at && !b.expires_at) return 0;
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return parseISO(a.expires_at) - parseISO(b.expires_at);
      }
      if (sortBy === "score") return (b.recommendation_score || 0) - (a.recommendation_score || 0);
      return new Date(b.created_date) - new Date(a.created_date);
    });

    return result;
  }, [scenarios, search, statusFilter, caseFilter, showExpiringOnly, sortBy, caseMap, expiringSoon, carrierFilter]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(s => {
      const key = s.case_id || "unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return Object.entries(groups).map(([caseId, items]) => ({
      caseId,
      caseName: caseMap[caseId]?.employer_name || "Unknown Employer",
      caseNumber: caseMap[caseId]?.case_number || caseId.slice(-6),
      stage: caseMap[caseId]?.stage,
      items,
    }));
  }, [filtered, caseMap]);

  const handleCalculate = async (scenario) => {
    setCalculating(scenario.id);
    try {
      await base44.entities.QuoteScenario.update(scenario.id, { status: "running" });
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      const res = await base44.functions.invoke("calculateQuoteRates", { scenario_id: scenario.id });
      if (res.data?.error) throw new Error(res.data.error);
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({
        title: "Rates calculated",
        description: `$${res.data.total_monthly_premium?.toLocaleString()}/mo across ${res.data.plan_results?.length || 0} plans`,
      });
    } catch (e) {
      await base44.entities.QuoteScenario.update(scenario.id, { status: "error" });
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Calculation failed", description: e.message, variant: "destructive" });
    } finally {
      setCalculating(null);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selectedScenarios = scenarios.filter(s => selectedIds.includes(s.id));

  const toggleCase = (caseId) => {
    setCollapsedCases(prev => ({ ...prev, [caseId]: !prev[caseId] }));
  };

  const activeFilters = [
    search && { label: `"${search}"`, clear: () => setSearch("") },
    statusFilter !== "all" && { label: statusFilter, clear: () => setStatusFilter("all") },
    caseFilter !== "all" && { label: employers.find(e => e.id === caseFilter)?.name, clear: () => setCaseFilter("all") },
    showExpiringOnly && { label: "Expiring soon", clear: () => setShowExpiringOnly(false) },
    carrierFilter !== "all" && { label: carrierFilter, clear: () => setCarrierFilter("all") },
  ].filter(Boolean);

  const draftScenarios = filtered.filter(s => s.status === "draft");

  const handleCalculateAllDrafts = async () => {
    if (!draftScenarios.length) return;
    setBulkCalculating(true);
    let success = 0, fail = 0;
    for (const s of draftScenarios) {
      try {
        await base44.entities.QuoteScenario.update(s.id, { status: "running" });
        const res = await base44.functions.invoke("calculateQuoteRates", { scenario_id: s.id });
        if (res.data?.error) throw new Error(res.data.error);
        success++;
      } catch {
        await base44.entities.QuoteScenario.update(s.id, { status: "error" });
        fail++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
    setBulkCalculating(false);
    toast?.({ title: `Bulk calculation complete`, description: `${success} succeeded, ${fail} failed.` });
  };

  const handleBulkExpire = async () => {
    await Promise.all(selectedIds.map(id => base44.entities.QuoteScenario.update(id, { status: "expired" })));
    queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
    setSelectedIds([]);
    toast?.({ title: `${selectedIds.length} scenarios marked expired` });
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.length;
    await Promise.all(selectedIds.map(id => base44.entities.QuoteScenario.delete(id)));
    queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
    setSelectedIds([]);
    setShowDeleteConfirm(false);
    toast?.({ title: `${count} scenarios deleted` });
  };

  const handleBulkExportCSV = () => {
    const headers = ["Name", "Status", "Employer", "Premium", "Employer Cost", "Employee Cost", "Plans", "Carriers", "Score", "Recommended"];
    const rows = selectedScenarios.map(s => [
      s.name,
      s.status,
      caseMap[s.case_id]?.employer_name || "",
      s.total_monthly_premium || "",
      s.employer_monthly_cost || "",
      s.employee_monthly_cost_avg || "",
      s.plan_count || "",
      s.carriers_included?.join(";") || "",
      s.recommendation_score || "",
      s.is_recommended ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scenarios-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast?.({ title: "Export started" });
  };

  const handleLoadPreset = (filters = {}) => {
    if (filters.search !== undefined) setSearch(filters.search || "");
    if (filters.statusFilter !== undefined) setStatusFilter(filters.statusFilter || "all");
    if (filters.caseFilter !== undefined) setCaseFilter(filters.caseFilter || "all");
    if (filters.carrierFilter !== undefined) setCarrierFilter(filters.carrierFilter || "all");
    if (filters.showExpiringOnly !== undefined) setShowExpiringOnly(Boolean(filters.showExpiringOnly));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setShowNewScenario(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIds.length >= 2) {
        e.preventDefault();
        setCompareMode(true);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedIds]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="View, calculate, and compare quote scenarios"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {expiringSoon.length > 0 && (
              <button
                onClick={() => setShowExpiringOnly(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  showExpiringOnly
                    ? "bg-orange-100 text-orange-700 border-orange-300"
                    : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {expiringSoon.length} expiring soon
              </button>
            )}

            <SavedViewsPanel
              currentFilters={{ search, statusFilter, caseFilter, carrierFilter, showExpiringOnly }}
              onLoadPreset={handleLoadPreset}
            />

            <Button onClick={() => setShowNewScenario(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Scenario
            </Button>
          </div>
        }
      />

      <QuotesKPIBar scenarios={scenarios} />

      {compareMode && selectedScenarios.length >= 2 && (
        <ScenarioCompare
          scenarios={selectedScenarios}
          onClose={() => { setCompareMode(false); setSelectedIds([]); }}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setGroupByCaseMode(true)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${groupByCaseMode ? "bg-primary text-white" : "hover:bg-muted"}`}
          >
            By Case
          </button>
          <button
            onClick={() => setGroupByCaseMode(false)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${!groupByCaseMode ? "bg-primary text-white" : "hover:bg-muted"}`}
          >
            All
          </button>
        </div>

        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search scenarios..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9">
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

        {employers.length > 0 && (
          <Select value={caseFilter} onValueChange={setCaseFilter}>
            <SelectTrigger className="w-44 h-9"><SelectValue placeholder="All Employers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employers</SelectItem>
              {employers.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 h-9">
            <SortAsc className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_date">Newest First</SelectItem>
            <SelectItem value="premium">Highest Premium</SelectItem>
            <SelectItem value="expiry">Expiry Date</SelectItem>
            <SelectItem value="score">Rec. Score</SelectItem>
          </SelectContent>
        </Select>

        {allCarriers.length > 0 && (
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Carriers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {allCarriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {activeFilters.length > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-xs text-muted-foreground" onClick={() => { setSearch(""); setStatusFilter("all"); setCaseFilter("all"); setShowExpiringOnly(false); setCarrierFilter("all"); }}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear all
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} scenario{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap -mt-2">
          {activeFilters.map((f, i) => (
            <button
              key={i}
              onClick={f.clear}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {f.label} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs font-medium text-primary">{selectedIds.length} selected</span>
          <div className="flex items-center gap-1.5 ml-auto">
            {selectedIds.length >= 2 && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCompareMode(v => !v)}>
                <GitCompare className="w-3.5 h-3.5 mr-1.5" /> Compare
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleBulkExportCSV}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50" onClick={handleBulkExpire}>
              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Mark Expired
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setShowDeleteConfirm(true)}>
              Delete Selected
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}

      {draftScenarios.length > 1 && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-xs text-amber-800 font-medium">{draftScenarios.length} scenarios waiting to be calculated</span>
          <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700" onClick={handleCalculateAllDrafts} disabled={bulkCalculating}>
            {bulkCalculating ? "Calculating all…" : `Calculate All (${draftScenarios.length})`}
          </Button>
        </div>
      )}

      {!compareMode && selectedIds.length > 0 && selectedIds.length < 2 && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
          Select {2 - selectedIds.length} more scenario{2 - selectedIds.length !== 1 ? "s" : ""} to enable comparison (max 4).
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Quote Scenarios"
          description={scenarios.length === 0 ? "Create a new scenario to start quoting" : "No scenarios match your current filters"}
          actionLabel={scenarios.length === 0 ? "New Scenario" : undefined}
          onAction={scenarios.length === 0 ? () => setShowNewScenario(true) : undefined}
        />
      ) : groupByCaseMode ? (
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.caseId} className="border rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
                onClick={() => toggleCase(group.caseId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm font-semibold">{group.caseName}</span>
                  <span className="text-xs text-muted-foreground"># {group.caseNumber}</span>
                  {group.stage && (
                    <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full capitalize">
                      {group.stage.replace(/_/g, " ")}
                    </span>
                  )}
                  <Badge variant="outline" className="text-[10px]">{group.items.length} scenario{group.items.length !== 1 ? "s" : ""}</Badge>
                  {group.items.some(s => s.is_recommended) && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      ✓ {group.items.find(s => s.is_recommended)?.name}
                    </span>
                  )}
                </div>
                {collapsedCases[group.caseId] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
              </button>

              {!collapsedCases[group.caseId] && (
                <div className="p-3 space-y-2 bg-card">
                  {group.items.map(s => (
                    <ScenarioCard
                      key={s.id}
                      scenario={s}
                      isSelected={selectedIds.includes(s.id)}
                      onToggleSelect={toggleSelect}
                      onEdit={setEditingScenario}
                      onShowDetails={() => setScenarioDetailModal(s)}
                      onApproval={() => setApprovalModal(s)}
                      onContribution={() => setContributionModal(s)}
                      calculating={calculating}
                      onCalculate={handleCalculate}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              isSelected={selectedIds.includes(s.id)}
              onToggleSelect={toggleSelect}
              onEdit={setEditingScenario}
              onShowDetails={() => setScenarioDetailModal(s)}
              onApproval={() => setApprovalModal(s)}
              onContribution={() => setContributionModal(s)}
              calculating={calculating}
              onCalculate={handleCalculate}
            />
          ))}
        </div>
      )}

      {showNewScenario && (
        <NewScenarioFromQuotes open={showNewScenario} onClose={() => setShowNewScenario(false)} />
      )}
      {editingScenario && (
        <QuoteScenarioModal
          caseId={editingScenario.case_id}
          scenario={editingScenario}
          open={!!editingScenario}
          onClose={() => setEditingScenario(null)}
        />
      )}
      {scenarioDetailModal && (
        <ScenarioDetailModal
          scenario={scenarioDetailModal}
          open={!!scenarioDetailModal}
          onClose={() => setScenarioDetailModal(null)}
        />
      )}
      {approvalModal && (
        <ApprovalModal
          scenario={approvalModal}
          open={!!approvalModal}
          onClose={() => setApprovalModal(null)}
        />
      )}
      {contributionModal && (
        <ContributionSlider
          scenario={contributionModal}
          open={!!contributionModal}
          onClose={() => setContributionModal(null)}
        />
      )}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={setShowDeleteConfirm}
        onConfirm={handleBulkDelete}
        title="Delete quote scenarios?"
        description={`Permanently delete ${selectedIds.length} selected scenario(s)? This cannot be undone.`}
        confirmLabel="Delete scenarios"
        destructive
      />
    </div>
  );
}