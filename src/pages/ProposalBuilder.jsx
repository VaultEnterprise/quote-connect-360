import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, LayoutGrid, List, Search, Filter, AlertTriangle,
  ArrowUpDown, Download, X, CheckSquare, XCircle, Clock, AlertOctagon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ProposalModal from "@/components/proposals/ProposalModal";
import ProposalViewModal from "@/components/proposals/ProposalViewModal";
import ProposalCard from "@/components/proposals/ProposalCard";
import ProposalKPIBar from "@/components/proposals/ProposalKPIBar";
import ProposalPipelineView from "@/components/proposals/ProposalPipelineView";
import RejectProposalModal from "@/components/proposals/RejectProposalModal";
import ProposalAnalyticsDashboard from "@/components/proposals/ProposalAnalyticsDashboard";
import ProposalFilterPresets from "@/components/proposals/ProposalFilterPresets";
import ProposalBulkActions from "@/components/proposals/ProposalBulkActions";
import ProposalQualityScore from "@/components/proposals/ProposalQualityScore";
import ProposalComparisonMatrix from "@/components/proposals/ProposalComparisonMatrix";
import ProposalHistoryTimeline from "@/components/proposals/ProposalHistoryTimeline";
import ProposalApprovalTrend from "@/components/proposals/ProposalApprovalTrend";
import ProposalWorkflowSuggestions from "@/components/proposals/ProposalWorkflowSuggestions";
import ProposalDetailExpanded from "@/components/proposals/ProposalDetailExpanded";
import { isAfter, addDays, parseISO, differenceInDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import useRouteContext from "@/hooks/useRouteContext";

const DATE_RANGE_OPTIONS = [
  { value: "all",      label: "All Time" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "last_90",  label: "Last 90 Days" },
  { value: "last_180", label: "Last 180 Days" },
];

export default function ProposalBuilder() {
  const queryClient = useQueryClient();
  const routeContext = useRouteContext();
  const caseScope = routeContext.caseId || "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employerFilter, setEmployerFilter] = useState("all");
  const [brokerFilter, setBrokerFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [sortBy, setSortBy] = useState("created_desc");
  const [viewMode2, setViewMode2] = useState("list"); // "list", "analytics", "guide"
  const [expandedProposalId, setExpandedProposalId] = useState(null);

  // KPI click filter
  const [kpiFilter, setKpiFilter] = useState(null);

  // Bulk select
  const [selectedIds, setSelectedIds] = useState([]);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 200),
  });

  const now = new Date();

  const expiringSoon = proposals.filter(p => {
    if (!p.expires_at || ["approved","rejected","expired"].includes(p.status)) return false;
    const exp = parseISO(p.expires_at);
    return isAfter(exp, now) && !isAfter(exp, addDays(now, 7));
  });

  const overdueProposals = proposals.filter(p => {
    if (!p.expires_at || ["approved","rejected","expired"].includes(p.status)) return false;
    return !isAfter(parseISO(p.expires_at), now);
  });

  const employers = useMemo(() => {
    return [...new Set(proposals.map(p => p.employer_name).filter(Boolean))].sort();
  }, [proposals]);

  const brokers = useMemo(() => {
    return [...new Set(proposals.map(p => p.broker_name).filter(Boolean))].sort();
  }, [proposals]);

  // KPI click handler
  const handleKpiClick = (key, value) => {
    if (kpiFilter?.key === key && kpiFilter?.value === value) {
      setKpiFilter(null);
      setStatusFilter("all");
      setShowExpiringOnly(false);
    } else {
      setKpiFilter({ key, value });
      if (key === "status") { setStatusFilter(value); }
      if (key === "expiring") { setShowExpiringOnly(true); setStatusFilter("all"); }
      if (key === "stale") { setStatusFilter("all"); }
    }
  };

  const filtered = useMemo(() => {
    const result = proposals.filter(p => {
      if (caseScope && p.case_id !== caseScope) return false;
      if (search && !p.title?.toLowerCase().includes(search.toLowerCase()) &&
          !p.employer_name?.toLowerCase().includes(search.toLowerCase()) &&
          !p.broker_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (employerFilter !== "all" && p.employer_name !== employerFilter) return false;
      if (brokerFilter !== "all" && p.broker_name !== brokerFilter) return false;
      if (showExpiringOnly && !expiringSoon.some(e => e.id === p.id)) return false;

      // KPI stale filter
      if (kpiFilter?.key === "stale") {
        const ref = p.viewed_at || p.sent_at;
        if (!["sent","viewed"].includes(p.status) || !ref || differenceInDays(now, parseISO(ref)) <= 7) return false;
      }

      // Date range filter
      if (dateRange !== "all" && p.created_date) {
        const created = parseISO(p.created_date);
        if (dateRange === "this_month" && (created < startOfMonth(now) || created > endOfMonth(now))) return false;
        if (dateRange === "last_month") {
          const lastM = subMonths(now, 1);
          if (created < startOfMonth(lastM) || created > endOfMonth(lastM)) return false;
        }
        if (dateRange === "last_90" && differenceInDays(now, created) > 90) return false;
        if (dateRange === "last_180" && differenceInDays(now, created) > 180) return false;
      }

      return true;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "created_desc": return new Date(b.created_date) - new Date(a.created_date);
        case "created_asc":  return new Date(a.created_date) - new Date(b.created_date);
        case "expiry_asc":   return (a.expires_at ? new Date(a.expires_at) : Infinity) - (b.expires_at ? new Date(b.expires_at) : Infinity);
        case "value_desc":   return (b.total_monthly_premium || 0) - (a.total_monthly_premium || 0);
        case "sent_desc":    return new Date(b.sent_at || 0) - new Date(a.sent_at || 0);
        default: return 0;
      }
    });
  }, [proposals, caseScope, search, statusFilter, employerFilter, brokerFilter, showExpiringOnly, expiringSoon, sortBy, dateRange, kpiFilter]);

  const handleCloseEdit = () => { setEditing(null); setShowCreate(false); };

  const clearAllFilters = () => {
    setSearch(""); setStatusFilter("all"); setEmployerFilter("all"); setBrokerFilter("all");
    setShowExpiringOnly(false); setDateRange("all"); setKpiFilter(null);
  };

  const activeFilterCount = [
    search, statusFilter !== "all", employerFilter !== "all",
    brokerFilter !== "all", showExpiringOnly, dateRange !== "all",
  ].filter(Boolean).length;

  // Bulk actions
  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(filtered.map(p => p.id));
  const clearSelection = () => setSelectedIds([]);

  const bulkStatusUpdate = useMutation({
    mutationFn: ({ ids, status }) => Promise.all(ids.map(id => base44.entities.Proposal.update(id, { status }))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposals"] }); setSelectedIds([]); },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids) => {
      if (currentUser?.role !== "admin") {
        alert("Only administrators can delete proposals.");
        return;
      }
      if (!window.confirm(`Permanently delete ${ids.length} proposal(s)? This cannot be undone.`)) return;
      return Promise.all(ids.map(id => base44.entities.Proposal.delete(id)));
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposals"] }); setSelectedIds([]); },
  });

  const markAllExpired = useMutation({
    mutationFn: () => Promise.all(overdueProposals.map(p => base44.entities.Proposal.update(p.id, { status: "expired" }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const handleExportCSV = () => {
    const rows = [
      ["Title","Employer","Status","Version","Broker","Effective Date","Total Premium/mo","Employer Cost/mo","Avg EE Cost","Sent At","Viewed At","Approved At","Expires At","Created"],
      ...filtered.map(p => [
        p.title || "", p.employer_name || "", p.status || "", p.version || 1,
        p.broker_name || "", p.effective_date || "",
        p.total_monthly_premium || "", p.employer_monthly_cost || "",
        p.employee_avg_cost || "", p.sent_at || "", p.viewed_at || "",
        p.approved_at || "", p.expires_at || "", p.created_date || "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "proposals.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
         <PageHeader
           title="Proposals"
           description="Create, send, and track client benefit proposals"
         />
        <div className="flex items-center gap-2 flex-wrap">
          {expiringSoon.length > 0 && (
            <button
              onClick={() => handleKpiClick("expiring", "soon")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                kpiFilter?.key === "expiring"
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {expiringSoon.length} expiring soon
            </button>
          )}
          {overdueProposals.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
              onClick={() => { if (confirm(`Mark ${overdueProposals.length} overdue proposals as expired?`)) markAllExpired.mutate(); }}
              disabled={markAllExpired.isPending}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              Mark {overdueProposals.length} Expired
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Proposal
          </Button>
        </div>
      </div>

      {/* View mode toggle */}
      <div className="flex items-center gap-2">
        <Select value={viewMode2} onValueChange={setViewMode2}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="list">List View</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="guide">Workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Analytics View */}
      {viewMode2 === "analytics" && (
        <div className="space-y-4">
          <ProposalAnalyticsDashboard proposals={proposals} />
          <ProposalApprovalTrend proposals={proposals} />
          <ProposalQualityScore proposals={proposals} />
          <ProposalHistoryTimeline proposals={proposals} />
        </div>
      )}

      {/* Workflow View */}
      {viewMode2 === "guide" && (
        <div className="space-y-4">
          <ProposalWorkflowSuggestions proposals={proposals} />
          <ProposalQualityScore proposals={proposals} />
          <ProposalComparisonMatrix proposals={proposals} />
        </div>
      )}

      {/* List View */}
      {viewMode2 === "list" && (
        <>
          {/* KPI Bar — clickable */}
          <ProposalKPIBar proposals={proposals} onFilterClick={handleKpiClick} activeFilter={kpiFilter} />

          {/* Quick filter presets */}
          <ProposalFilterPresets onSelectPreset={() => {}} />

          {/* Quality score */}
          <ProposalQualityScore proposals={filtered} />

          {/* Comparison matrix */}
          <ProposalComparisonMatrix proposals={filtered} />

          {/* View + Filter Bar */}
          <div className="flex items-center gap-2 flex-wrap bg-muted/30 p-3 rounded-lg border">
        {/* View toggle */}
        <div className="flex items-center border rounded-md overflow-hidden">
          {[{ mode: "list", icon: List }, { mode: "pipeline", icon: LayoutGrid }].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === mode ? "bg-primary text-white" : "hover:bg-muted"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline capitalize">{mode}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-44 text-xs"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setKpiFilter(v !== "all" ? { key: "status", value: v } : null); }}>
          <SelectTrigger className="w-36 h-8 text-xs"><Filter className="w-3 h-3 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["draft","sent","viewed","approved","rejected","expired"].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {employers.length > 0 && (
          <Select value={employerFilter} onValueChange={setEmployerFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Employers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employers</SelectItem>
              {employers.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {brokers.length > 0 && (
          <Select value={brokerFilter} onValueChange={setBrokerFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All Brokers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brokers</SelectItem>
              {brokers.map(b => <SelectItem key={b} value={b}>{b.split(" ")[0] || b}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 h-8 text-xs"><ArrowUpDown className="w-3 h-3 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Newest First</SelectItem>
            <SelectItem value="created_asc">Oldest First</SelectItem>
            <SelectItem value="expiry_asc">Expiry (Soonest)</SelectItem>
            <SelectItem value="value_desc">Value (Highest)</SelectItem>
            <SelectItem value="sent_desc">Recently Sent</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearAllFilters}>
            <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
          </Button>
        )}

        <span className="text-xs text-muted-foreground">{filtered.length} proposal{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Bulk select bar */}
      {viewMode === "list" && filtered.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={selectedIds.length === filtered.length ? clearSelection : selectAll} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
            <CheckSquare className="w-3.5 h-3.5" />
            {selectedIds.length === filtered.length && filtered.length > 0 ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

          {/* Bulk action bar */}
          {selectedIds.length > 0 && <ProposalBulkActions selectedCount={selectedIds.length} proposals={filtered} />}

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : viewMode === "pipeline" ? (
            proposals.length === 0 ? (
              <EmptyState icon={FileText} title="No Proposals Yet" description="Create your first proposal to start tracking the pipeline" actionLabel="New Proposal" onAction={() => setShowCreate(true)} />
            ) : (
              <ProposalPipelineView proposals={proposals} onView={setViewing} />
            )
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={proposals.length === 0 ? "No Proposals Yet" : "No Proposals Match"}
              description={proposals.length === 0 ? "Create your first proposal to send to an employer" : "Try adjusting your filters"}
              actionLabel={proposals.length === 0 ? "New Proposal" : "Clear Filters"}
              onAction={proposals.length === 0 ? () => setShowCreate(true) : clearAllFilters}
            />
          ) : (
            <div className="space-y-2.5">
              {filtered.map(p => (
                <div key={p.id}>
                  <ProposalCard
                    proposal={p}
                    onView={setViewing}
                    onEdit={setEditing}
                    onReject={setRejecting}
                    isSelected={selectedIds.includes(p.id)}
                    onToggleSelect={toggleSelect}
                  />
                  {expandedProposalId === p.id && <ProposalDetailExpanded proposal={p} />}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {(showCreate || editing) && (
        <ProposalModal open={showCreate || !!editing} onClose={handleCloseEdit} proposal={editing || undefined} />
      )}
      {viewing && (
        <ProposalViewModal
          proposal={viewing} open={!!viewing} onClose={() => setViewing(null)}
          onEdit={(p) => { setViewing(null); setEditing(p); }}
          onReject={(p) => { setViewing(null); setRejecting(p); }}
        />
      )}
      {rejecting && (
        <RejectProposalModal proposal={rejecting} open={!!rejecting} onClose={() => setRejecting(null)} />
      )}
    </div>
  );
}