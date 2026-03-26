import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useExceptionsPageModel from "@/domain/exceptions/useExceptionsPageModel";
import { createValidatedEntityRecord, updateValidatedEntityRecord } from "@/services/entities/validatedEntityWrites";
import { AlertTriangle, Search, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { differenceInDays } from "date-fns";

// Exception components
import ExceptionKPIBar from "@/components/exceptions/ExceptionKPIBar";
import ExceptionCard from "@/components/exceptions/ExceptionCard";
import ExceptionDetailDrawer from "@/components/exceptions/ExceptionDetailDrawer";
import ExceptionAnalyticsDashboard from "@/components/exceptions/ExceptionAnalyticsDashboard";
import ExceptionAutomationRules from "@/components/exceptions/ExceptionAutomationRules";
import ExceptionTriageAssistant from "@/components/exceptions/ExceptionTriageAssistant";
import ExceptionWorkflowBoard from "@/components/exceptions/ExceptionWorkflowBoard";
import ExceptionCommentThread from "@/components/exceptions/ExceptionCommentThread";
import ExceptionBulkActionsPanel from "@/components/exceptions/ExceptionBulkActionsPanel";
import ExceptionNotificationSettings from "@/components/exceptions/ExceptionNotificationSettings";
import ExceptionFilterPresets from "@/components/exceptions/ExceptionFilterPresets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useRouteContext from "@/hooks/useRouteContext";

function ResolveModal({ exception, open, onClose }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const resolve = useMutation({
    mutationFn: () => updateValidatedEntityRecord("ExceptionItem", exception.id, {
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
          <p className="text-sm font-medium">{exception?.title}</p>
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
    mutationFn: () => createValidatedEntityRecord("ExceptionItem", form, ["title", "category", "severity"]),
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
  const { user } = useAuth();
  const routeContext = useRouteContext();
  const caseScope = routeContext.caseId || "";

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("open");
  const [sortBy, setSortBy] = useState("created");
  const [showMyOnly, setShowMyOnly] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [resolving, setResolving] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [detailException, setDetailException] = useState(null);

  const { exceptions, sorted, openCount, dismiss, assignToMe, bulkResolve, bulkDismiss, bulkAssign } = useExceptionsPageModel({
    caseScope,
    search,
    severityFilter,
    categoryFilter,
    statusFilter,
    sortBy,
    showMyOnly,
    userEmail: user?.email,
    selectedIds,
  });

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="Exception Queue"
          description={`${openCount} open exception${openCount !== 1 ? "s" : ""}`}
        />
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List View</SelectItem>
              <SelectItem value="board">Workflow Board</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Log Exception
          </Button>
        </div>
      </div>

      {/* View-specific content */}
      {viewMode === "list" && (
        <>
          {/* KPI Bar */}
          <ExceptionKPIBar exceptions={exceptions} />

          {/* Quick filter presets */}
          <ExceptionFilterPresets onSelectPreset={(filters) => {}} />

          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap bg-muted/30 p-3 rounded-lg">
        <Input
          placeholder="Search by title or employer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48 h-8"
        />

        {/* Category chips */}
        <div className="flex items-center gap-1.5">
          {["census", "quote", "enrollment", "carrier", "document", "billing", "system"].map(cat => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs capitalize"
              onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Status, Severity, Sort dropdowns */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="triaged">Triaged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_external">Waiting External</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            {["critical","high","medium","low"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="severity">Severity</SelectItem>
            <SelectItem value="due_date">Due Date</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showMyOnly ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setShowMyOnly(!showMyOnly)}
        >
          My Exceptions
        </Button>
      </div>

          {/* Bulk actions */}
          {selectedIds.size > 0 && (
            <ExceptionBulkActionsPanel
              selectedCount={selectedIds.size}
              onAction={(action, params) => {
                if (action === "assign") {
                  bulkAssign.mutate({ ids: [...selectedIds], email: params.email });
                } else if (action === "status" && params?.status === "dismissed") {
                  bulkDismiss.mutate();
                } else if (action === "status") {
                  bulkResolve.mutate();
                }
                setSelectedIds(new Set());
              }}
            />
          )}

          {/* Exception list */}
          {sorted.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title={statusFilter === "open" ? "No Open Exceptions" : "No Exceptions Found"}
              description="All clear! No exceptions match your current filters."
            />
          ) : (
            <div className="space-y-2">
              {sorted.map(ex => (
                <ExceptionCard
                  key={ex.id}
                  exception={ex}
                  selected={selectedIds.has(ex.id)}
                  onToggleSelect={toggleSelect}
                  onResolve={setResolving}
                  onDismiss={(id) => dismiss.mutate(id)}
                  onAssignToMe={(id) => assignToMe.mutate(id)}
                  onDetail={setDetailException}
                  currentUserEmail={user?.email}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Workflow Board View */}
      {viewMode === "board" && (
        <>
          <ExceptionWorkflowBoard exceptions={exceptions} />
        </>
      )}

      {/* Analytics View */}
      {viewMode === "analytics" && (
        <>
          <ExceptionAnalyticsDashboard exceptions={exceptions} />
          <ExceptionAutomationRules />
        </>
      )}

      {/* Settings View */}
      {viewMode === "settings" && (
        <>
          <Tabs defaultValue="automation">
            <TabsList>
              <TabsTrigger value="automation">Automation Rules</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="automation" className="mt-4">
              <ExceptionAutomationRules />
            </TabsContent>
            <TabsContent value="notifications" className="mt-4">
              <ExceptionNotificationSettings />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modals & Drawers */}
      {resolving && <ResolveModal exception={resolving} open={!!resolving} onClose={() => setResolving(null)} />}
      <CreateExceptionModal open={showCreate} onClose={() => setShowCreate(false)} />
      {detailException && (
        <div className="fixed inset-0 z-50">
          <ExceptionDetailDrawer
            exception={detailException}
            open={!!detailException}
            onClose={() => setDetailException(null)}
          />
          {/* Additional panels in drawer */}
          {detailException && (
            <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-border overflow-y-auto p-4 space-y-6 hidden lg:block">
              <ExceptionTriageAssistant exception={detailException} />
              <ExceptionCommentThread />
            </div>
          )}
        </div>
      )}
    </div>
  );
}