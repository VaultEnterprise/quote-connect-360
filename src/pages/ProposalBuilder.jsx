import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, LayoutGrid, List, Search, Filter, AlertTriangle, ArrowUpDown } from "lucide-react";
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
import { isAfter, addDays, parseISO } from "date-fns";

export default function ProposalBuilder() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employerFilter, setEmployerFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // "list" | "pipeline"
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [sortBy, setSortBy] = useState("created_desc");

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

  const employers = useMemo(() => {
    const names = [...new Set(proposals.map(p => p.employer_name).filter(Boolean))];
    return names.sort();
  }, [proposals]);

  const filtered = useMemo(() => {
    const result = proposals.filter(p => {
      const matchSearch = !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.employer_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.broker_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      const matchEmployer = employerFilter === "all" || p.employer_name === employerFilter;
      const matchExpiring = !showExpiringOnly || expiringSoon.some(e => e.id === p.id);
      return matchSearch && matchStatus && matchEmployer && matchExpiring;
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
  }, [proposals, search, statusFilter, employerFilter, showExpiringOnly, expiringSoon, sortBy]);

  const handleCloseEdit = () => { setEditing(null); setShowCreate(false); };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposal Builder"
        description="Create, send, and track client benefit proposals"
        actions={
          <div className="flex items-center gap-2">
            {expiringSoon.length > 0 && (
              <button
                onClick={() => setShowExpiringOnly(v => !v)}
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
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Proposal
            </Button>
          </div>
        }
      />

      {/* KPI Bar */}
      <ProposalKPIBar proposals={proposals} />

      {/* View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode("pipeline")}
            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === "pipeline" ? "bg-primary text-white" : "hover:bg-muted"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
          </button>
        </div>

        {viewMode === "list" && (
          <>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search proposals..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {["draft","sent","viewed","approved","rejected","expired"].map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {employers.length > 0 && (
              <Select value={employerFilter} onValueChange={setEmployerFilter}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All Employers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employers</SelectItem>
                  {employers.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 h-9">
                <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_desc">Newest First</SelectItem>
                <SelectItem value="created_asc">Oldest First</SelectItem>
                <SelectItem value="expiry_asc">Expiry (Soonest)</SelectItem>
                <SelectItem value="value_desc">Value (Highest)</SelectItem>
                <SelectItem value="sent_desc">Recently Sent</SelectItem>
              </SelectContent>
            </Select>

            {(search || statusFilter !== "all" || employerFilter !== "all" || showExpiringOnly) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-muted-foreground"
                onClick={() => { setSearch(""); setStatusFilter("all"); setEmployerFilter("all"); setShowExpiringOnly(false); }}
              >
                Clear filters
              </Button>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {viewMode === "list" && (
            <span className="text-xs text-muted-foreground">{filtered.length} proposal{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

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
          actionLabel={proposals.length === 0 ? "New Proposal" : undefined}
          onAction={proposals.length === 0 ? () => setShowCreate(true) : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onView={setViewing}
              onEdit={setEditing}
              onReject={setRejecting}
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