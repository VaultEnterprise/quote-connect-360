import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle, AlertCircle, Info, Zap, Search, Filter,
  CheckCircle, Clock, User, ExternalLink, Plus, RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

const SEVERITY_CONFIG = {
  critical: { color: "bg-red-100 text-red-700 border-red-200", icon: Zap, border: "border-l-red-500" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle, border: "border-l-orange-400" },
  medium: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, border: "border-l-amber-400" },
  low: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Info, border: "border-l-blue-400" },
};

const CATEGORY_COLORS = {
  census: "bg-purple-100 text-purple-700",
  quote: "bg-blue-100 text-blue-700",
  enrollment: "bg-emerald-100 text-emerald-700",
  carrier: "bg-orange-100 text-orange-700",
  document: "bg-gray-100 text-gray-700",
  billing: "bg-red-100 text-red-700",
  system: "bg-slate-100 text-slate-700",
};

function ResolveModal({ exception, open, onClose }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const resolve = useMutation({
    mutationFn: () => base44.entities.ExceptionItem.update(exception.id, {
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolution_notes: notes,
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exceptions"] }); onClose(); },
  });
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Resolve Exception</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm font-medium">{exception.title}</p>
          <div>
            <Label>Resolution Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1.5" placeholder="Describe how this was resolved..." rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => resolve.mutate()} disabled={resolve.isPending} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" /> Mark Resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateExceptionModal({ open, onClose, caseContext }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "system",
    severity: "medium",
    suggested_action: "",
    case_id: caseContext?.case_id || "",
    employer_name: caseContext?.employer_name || "",
    assigned_to: "",
    due_by: "",
    entity_type: "",
    entity_id: "",
  });

  const { data: activeCases = [] } = useQuery({
    queryKey: ["active-cases-for-exception"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 50),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () => base44.entities.ExceptionItem.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exceptions"] }); onClose(); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Log Exception</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{["census","quote","enrollment","carrier","document","billing","system"].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select value={form.severity} onValueChange={v => set("severity", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{["low","medium","high","critical"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Related Case (optional)</Label>
            <Select value={form.case_id} onValueChange={v => {
              const c = activeCases.find(x => x.id === v);
              set("case_id", v);
              if (c) set("employer_name", c.employer_name);
            }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select case..." /></SelectTrigger>
              <SelectContent>{activeCases.map(c => <SelectItem key={c.id} value={c.id}>{c.employer_name} • {c.case_number || c.id.slice(-6)}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="mt-1.5" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Assigned To (email)</Label>
              <Input type="email" value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} className="mt-1.5" placeholder="user@example.com" />
            </div>
            <div>
              <Label>Due By</Label>
              <Input type="date" value={form.due_by} onChange={e => set("due_by", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Suggested Action</Label>
            <Input value={form.suggested_action} onChange={e => set("suggested_action", e.target.value)} className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Entity Type (optional)</Label>
              <Input value={form.entity_type} onChange={e => set("entity_type", e.target.value)} className="mt-1.5" placeholder="e.g., QuoteScenario" />
            </div>
            <div>
              <Label>Entity ID</Label>
              <Input value={form.entity_id} onChange={e => set("entity_id", e.target.value)} className="mt-1.5" placeholder="ID of related entity" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>{create.isPending ? "Saving..." : "Log Exception"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ExceptionQueue() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [resolving, setResolving] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: exceptions = [], isLoading } = useQuery({
    queryKey: ["exceptions"],
    queryFn: () => base44.entities.ExceptionItem.list("-created_date", 200),
  });

  const dismiss = useMutation({
    mutationFn: (id) => base44.entities.ExceptionItem.update(id, { status: "dismissed" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exceptions"] }),
  });

  const filtered = exceptions.filter(e => {
    const matchSearch = !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.employer_name?.toLowerCase().includes(search.toLowerCase());
    const matchSev = severityFilter === "all" || e.severity === severityFilter;
    const matchCat = categoryFilter === "all" || e.category === categoryFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "open" && !["resolved","dismissed"].includes(e.status)) || e.status === statusFilter;
    return matchSearch && matchSev && matchCat && matchStatus;
  });

  const critical = exceptions.filter(e => e.severity === "critical" && !["resolved","dismissed"].includes(e.status));
  const openCount = exceptions.filter(e => !["resolved","dismissed"].includes(e.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exception Queue"
        description={`${openCount} open exception${openCount !== 1 ? "s" : ""}${critical.length > 0 ? ` • ${critical.length} critical` : ""}`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Log Exception
          </Button>
        }
      />

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Critical", count: exceptions.filter(e => e.severity === "critical" && !["resolved","dismissed"].includes(e.status)).length, color: "text-red-600 bg-red-50 border-red-200" },
          { label: "High", count: exceptions.filter(e => e.severity === "high" && !["resolved","dismissed"].includes(e.status)).length, color: "text-orange-600 bg-orange-50 border-orange-200" },
          { label: "Medium", count: exceptions.filter(e => e.severity === "medium" && !["resolved","dismissed"].includes(e.status)).length, color: "text-amber-600 bg-amber-50 border-amber-200" },
          { label: "Resolved Today", count: exceptions.filter(e => e.resolved_at && new Date(e.resolved_at).toDateString() === new Date().toDateString()).length, color: "text-green-600 bg-green-50 border-green-200" },
        ].map(m => (
          <Card key={m.label} className={`border ${m.color}`}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{m.count}</p>
              <p className="text-xs font-medium mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search exceptions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {["critical","high","medium","low"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["census","quote","enrollment","carrier","document","billing","system"].map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CheckCircle} title={statusFilter === "open" ? "No Open Exceptions" : "No Exceptions Found"} description="All clear! No exceptions match your current filters." />
      ) : (
        <div className="space-y-2">
          {filtered.map(ex => {
            const sev = SEVERITY_CONFIG[ex.severity] || SEVERITY_CONFIG.medium;
            const SevIcon = sev.icon;
            return (
              <Card key={ex.id} className={`border-l-4 ${sev.border}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <SevIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ex.severity === "critical" ? "text-red-600" : ex.severity === "high" ? "text-orange-500" : ex.severity === "medium" ? "text-amber-500" : "text-blue-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold">{ex.title}</p>
                          <Badge className={`text-[10px] ${sev.color}`}>{ex.severity}</Badge>
                          <Badge className={`text-[10px] ${CATEGORY_COLORS[ex.category] || "bg-gray-100 text-gray-700"}`}>{ex.category}</Badge>
                          {ex.status !== "new" && <Badge variant="outline" className="text-[10px] capitalize">{ex.status?.replace(/_/g, " ")}</Badge>}
                        </div>
                        {ex.description && <p className="text-xs text-muted-foreground mt-1">{ex.description}</p>}
                        {ex.suggested_action && (
                          <p className="text-xs text-primary mt-1 font-medium">→ {ex.suggested_action}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          {ex.employer_name && <span>{ex.employer_name}</span>}
                          {ex.assigned_to && <span className="flex items-center gap-1"><User className="w-3 h-3" />{ex.assigned_to}</span>}
                          {ex.due_by && <span className={`flex items-center gap-1 ${new Date(ex.due_by) < new Date() ? "text-destructive font-medium" : ""}`}><Clock className="w-3 h-3" />Due {format(new Date(ex.due_by), "MMM d")}</span>}
                          <span>{format(new Date(ex.created_date), "MMM d, h:mm a")}</span>
                          {ex.case_id && <Link to={`/cases/${ex.case_id}`} className="flex items-center gap-1 hover:text-primary"><ExternalLink className="w-3 h-3" />View Case</Link>}
                        </div>
                        {ex.resolution_notes && <p className="text-xs text-green-600 mt-1 font-medium">✓ {ex.resolution_notes}</p>}
                      </div>
                    </div>
                    {!["resolved","dismissed"].includes(ex.status) && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setResolving(ex)}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => dismiss.mutate(ex.id)}>
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {resolving && <ResolveModal exception={resolving} open={!!resolving} onClose={() => setResolving(null)} />}
      {showCreate && <CreateExceptionModal open={showCreate} onClose={() => setShowCreate(false)} />}
    </div>
  );
}