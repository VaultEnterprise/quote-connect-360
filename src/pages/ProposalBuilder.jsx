import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText, Plus, LayoutGrid, List, Search, AlertTriangle, ArrowUpDown,
  Download, CheckSquare, X, XCircle, Clock, RefreshCw, SortAsc
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
import { isAfter, addDays, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";

export default function ProposalBuilder() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employerFilter, setEmployerFilter] = useState("all");
  const [brokerFilter, setBrokerFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all"); // "all"|"7d"|"30d"|"90d"
  const [viewMode, setViewMode] = useState("list");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [sortBy, setSortBy] = useState("created_desc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [kpiFilter, setKpiFilter] = useState(null);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 200),
  });

  const now = new Date();

  const expiringSoon = proposals.filter(p => {
    if (!p.expires_at || ["approved", "rejected", "expired"].includes(p.status)) return false;
    const exp = parseISO(p.expires_at);
    return isAfter(exp, now) && !isAfter(exp, addDays(now, 7));
  });

  const overdueProposals = proposals.filter(p => {
    if (!p.expires_at || ["approved", "rejected", "expired"].includes(p.status)) return false;
    return !isAfter(parseISO(p.expires_at), now);
  });

  const staleProposals = proposals.filter(p => {
    if (!["sent", "viewed"].includes(p.status)) return false;
    const sentDate = p.sent_at ? parseISO(p.sent_at) : null;
    return sentDate && !isAfter(sentDate, subDays(now, 7));
  });

  const employers = useMemo(() => {
    const names = [...new Set(proposals.map(p => p.employer_name).filter(Boolean))];
    return names.sort();
  }, [proposals]);

  const brokers = useMemo(() => {
    const names = [...new Set(proposals.map(p => p.broker_name).filter(Boolean))];
    return names.sort();
  }, [proposals]);

  // KPI click handler
  const handleKpiClick = (key, value) => {
    if (kpiFilter?.key === key) {
      setKpiFilter(null);
      setStatusFilter("all");
      setShowExpiringOnly(false);
    } else {
      setKpiFilter({ key, value });
      if (key === "status") setStatusFilter(value);
      if (key === "expiring") setShowExpiringOnly(true);
      if (key === "stale") { setStatusFilter("all"); }
    }
  };

  const filtered = useMemo(() => {
    const result = proposals.filter(p => {
      const matchSearch = !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.employer_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.broker_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchEmployer = employerFilter === "all" || p.employer_name === employerFilter;
      const matchBroker = brokerFilter === "all" || p.broker_name === brokerFilter;
      const matchExpiring = !showExpiringOnly || expiringSoon.some(e => e.id === p.id);

      let matchDate = true;
      if (dateRangeFilter !== "all" && p.created_date) {
        const days = parseInt(dateRangeFilter);
        matchDate = isAfter(parseISO(p.created_date), subDays(now, days));
      }

      // Stale KPI filter
      let matchKpi = true;
      if (kpiFilter?.key === "stale") {
        matchKpi = staleProposals.some(s => s.id === p.id);
      }

      return matchSearch && matchStatus && matchEmployer && matchBroker && matchExpiring && matchDate && matchKpi;
    });

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "created_desc": return new Date(b.created_date) - new Date(a.created_date);
        case "created_asc":  return new Date(a.created_date) - new Date(b.created_date);
        case "expiry_asc":   return (a.expires_at ? new Date(a.expires_at) : Infinity) - (b.expires_at ? new Date(b.expires_at) : Infinity);
        case "value_desc":   return (b.total_monthly_premium || 0) - (a.total_monthly_premium || 0);
        case "sent_desc":    return new Date(b.sent_at || 0) - new Date(a.sent_at || 0);
        case "employer":     return (a.employer_name || "").localeCompare(b.employer_name || "");
        default: return 0;
      }
    });
  }, [proposals, search, statusFilter, employerFilter, brokerFilter, showExpiringOnly, expiringSoon, sortBy, dateRangeFilter, kpiFilter, staleProposals]);

  const activeFilterCount = [
    search,
    statusFilter !== "all",
    employerFilter !== "all",
    brokerFilter !== "all",
    dateRangeFilter !== "all",
    showExpiringOnly,
    kpiFilter,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch(""); setStatusFilter("all"); setEmployerFilter("all");
    setBrokerFilter("all"); setDateRangeFilter("all");
    setShowExpiringOnly(false); setKpiFilter(null);
  };

  // Bulk actions
  const bulkStatusUpdate = useMutation({
    mutationFn: ({ ids, status, extra = {} }) =>
      Promise.all(ids.map(id => base44.entities.Proposal.update(id, { status, ...extra }))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposals"] }); setSelectedIds([]); },
  });

  const bulkDelete = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.Proposal.delete(id))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposals"] }); setSelectedIds([]); },
  });

  const markAllExpired = useMutation({
    mutationFn: () => Promise.all(overdueProposals.map(p => base44.entities.Proposal.update(p.id, { status: "expired" }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(p => p.id));

  const handleExportCSV = () => {
    const rows = [
      ["Title", "Employer", "Status", "Broker", "Effective Date", "Total Premium/mo", "Employer Cost/mo", "Sent At", "Approved At", "Expires At", "Version"],
      ...filtered.map(p => [
        p.title || "", p.employer_name || "", p.status || "", p.broker_name || "",
        p.effective_date || "", p.total_monthly_premium || "", p.employer_monthly_cost || "",
        p.sent_at || "", p.approved_at || "", p.expires_at || "", p.version || 1,
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "proposals.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseEdit = () => { setEditing(null); setShowCreate(false); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PageHeader
          title="Proposal Builder"
          description="Create, send, and track client benefit proposals"
        />
        <div className="flex items-center gap-2 flex-wrap">
          {overdueProposals.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
              onClick={() => markAllExpired.mutate()}
              disabled={markAllExpired.isPending}
            >
              <Clock className="w-3.5 h-3.5" />
              Mark {overdueProposals.length} overdue as expired
            </Button>
          )}
          {expiringSoon.length > 0 && (
            <button
              onClick={() => handleKpiClick("expiring", "expiring")}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                showExpiringOnly
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {expiringSoon.length} expiring soon
            </button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Proposal
          </Button>
        </div>
      </div>

      {/* KPI Bar — clickable */}
      <ProposalKPIBar
        proposals={proposals}
        onFilterClick={handleKpiClick}
        activeFilter={kpiFilter}
        staleCount={staleProposals.length}
      />

      {/* Alert banner: stale proposals */}
      {staleProposals.length > 0 && !kpiFilter && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{staleProposals.length}</strong> proposal{staleProposals.length !== 1 ? "s" : ""} have been in "sent" or "viewed" for over 7 days without a response. Consider sending a reminder.</span>
          <button className="ml-auto text-xs underline hover:no-underline flex-shrink-0" onClick={() => handleKpiClick("stale", "stale")}>
            Show these
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-wrap bg-muted/30 p-3 rounded-lg border">
        {/* View toggle */}
        <div className="flex items-center border rounded-lg overflow-hidden flex-shrink-0">
          {[{ mode: "list", icon: List }, { mode: "pipeline", icon: LayoutGrid }].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${viewMode === mode ? "bg-primary text-white" : "hover:bg-muted"}`}
            >
              <Icon className="w-3.5 h-3.5" /> {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 w-44 text-xs"
          />
        </div>

        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setKpiFilter(null); }}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
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

        {brokers.length > 1 && (
          <Select value={brokerFilter} onValueChange={setBrokerFilter}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All Brokers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brokers</SelectItem>
              {brokers.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <ArrowUpDown className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Newest First</SelectItem>
            <SelectItem value="created_asc">Oldest First</SelectItem>
            <SelectItem value="expiry_asc">Expiry (Soonest)</SelectItem>
            <SelectItem value="value_desc">Value (Highest)</SelectItem>
            <SelectItem value="sent_desc">Recently Sent</SelectItem>
            <SelectItem value="employer">Employer A→Z</SelectItem>
          </SelectContent>
        </Select>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground gap-1" onClick={clearAllFilters}>
            <X className="w-3.5 h-3.5" /> Clear ({activeFilterCount})
          </Button>
        )}

        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} proposal{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20 flex-wrap">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">{selectedIds.length} selected</span>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Select onValueChange={v => bulkStatusUpdate.mutate({ ids: selectedIds, status: v, extra: v === "sent" ? { sent_at: new Date().toISOString() } : v === "approved" ? { approved_at: new Date().toISOString() } : {} })}>
              <SelectTrigger className="h-7 text-xs w-44"><SelectValue placeholder="Change status to…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-7 text-xs text-destructive border-destructive/20"
              onClick={() => { if (window.confirm(`Delete ${selectedIds.length} proposals?`)) bulkDelete.mutate(selectedIds); }}>
              <XCircle className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}

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
        <div className="space-y-2">
          {/* Select all row */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={toggleSelectAll}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {selectedIds.length === filtered.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          {filtered.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onView={setViewing}
              onEdit={setEditing}
              onReject={setRejecting}
              isSelected={selectedIds.includes(p.id)}
              onToggleSelect={toggleSelect}
              staleProposalIds={staleProposals.map(s => s.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(showCreate || editing) && (
        <ProposalModal
          open={showCreate || !!editing}
          onClose={handleCloseEdit}
          proposal={editing || undefined}
        />
      )}
      {viewing && (
        <ProposalViewModal
          proposal={viewing}
          open={!!viewing}
          onClose={() => setViewing(null)}
          onEdit={(p) => { setViewing(null); setEditing(p); }}
          onReject={(p) => { setViewing(null); setRejecting(p); }}
        />
      )}
      {rejecting && (
        <RejectProposalModal
          proposal={rejecting}
          open={!!rejecting}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}