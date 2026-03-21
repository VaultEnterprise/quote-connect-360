import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  FileText, Plus, Send, Eye, CheckCircle, XCircle, Clock, Star,
  Download, Copy, ExternalLink, Search, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import ProposalModal from "@/components/proposals/ProposalModal";
import ProposalViewModal from "@/components/proposals/ProposalViewModal";
import { format } from "date-fns";

const STATUS_ICONS = {
  draft: Clock,
  sent: Send,
  viewed: Eye,
  approved: CheckCircle,
  rejected: XCircle,
  expired: Clock,
};

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function ProposalBuilder() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [viewing, setViewing] = useState(null);

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["proposals"],
    queryFn: () => base44.entities.Proposal.list("-created_date", 100),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Proposal.update(id, {
      status,
      ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}),
      ...(status === "approved" ? { approved_at: new Date().toISOString() } : {}),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });

  const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));

  const filtered = proposals.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.employer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const metrics = {
    total: proposals.length,
    sent: proposals.filter(p => ["sent", "viewed"].includes(p.status)).length,
    approved: proposals.filter(p => p.status === "approved").length,
    pending: proposals.filter(p => ["draft"].includes(p.status)).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposal Builder"
        description="Create, send, and track client proposals"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Proposal
          </Button>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: metrics.total, color: "text-foreground" },
          { label: "Drafts", value: metrics.pending, color: "text-muted-foreground" },
          { label: "Sent/Viewed", value: metrics.sent, color: "text-blue-600" },
          { label: "Approved", value: metrics.approved, color: "text-green-600" },
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
          <Input placeholder="Search proposals..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["draft","sent","viewed","approved","rejected","expired"].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No Proposals Yet" description="Create your first proposal to send to an employer" actionLabel="New Proposal" onAction={() => setShowCreate(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map(p => {
            const StatusIcon = STATUS_ICONS[p.status] || Clock;
            const relatedCase = caseMap[p.case_id];
            return (
              <Card key={p.id} className="hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{p.title}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                            <StatusIcon className="w-3 h-3" />{p.status}
                          </span>
                          <span className="text-xs text-muted-foreground">v{p.version || 1}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>{p.employer_name || relatedCase?.employer_name || "—"}</span>
                          {p.effective_date && <span>Eff. {format(new Date(p.effective_date), "MMM d, yyyy")}</span>}
                          {p.total_monthly_premium && <span className="font-medium text-foreground">${p.total_monthly_premium.toLocaleString()}/mo total</span>}
                          {p.employer_monthly_cost && <span>${p.employer_monthly_cost.toLocaleString()}/mo employer</span>}
                          {p.sent_at && <span>Sent {format(new Date(p.sent_at), "MMM d")}</span>}
                          {p.viewed_at && <span className="text-purple-600">Viewed {format(new Date(p.viewed_at), "MMM d")}</span>}
                        </div>
                        {p.plan_summary?.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {p.plan_summary.slice(0, 4).map((plan, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{plan.plan_name || plan.name}</Badge>
                            ))}
                            {p.plan_summary.length > 4 && <span className="text-xs text-muted-foreground">+{p.plan_summary.length - 4} more</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {relatedCase && (
                        <Link to={`/cases/${p.case_id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Open Case">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => setViewing(p)}>
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      {p.status === "draft" && (
                        <Button size="sm" className="text-xs" onClick={() => updateStatus.mutate({ id: p.id, status: "sent" })}>
                          <Send className="w-3 h-3 mr-1" /> Send
                        </Button>
                      )}
                      {p.status === "sent" && (
                        <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus.mutate({ id: p.id, status: "approved" })}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Mark Approved
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && <ProposalModal open={showCreate} onClose={() => setShowCreate(false)} />}
      {viewing && <ProposalViewModal proposal={viewing} open={!!viewing} onClose={() => setViewing(null)} onStatusChange={(id, status) => updateStatus.mutate({ id, status })} />}
    </div>
  );
}