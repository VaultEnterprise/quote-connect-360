import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Filter, Plus, Mail, CheckCircle2, Clock, AlertTriangle,
  UserX, RefreshCw, Download, Pencil, Trash2, ChevronDown, ChevronUp,
  Send, X, Eye, User, ExternalLink, Users
} from "lucide-react";
import EmployeeDetailDrawer from "@/components/employee-mgmt/EmployeeDetailDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";

const STATUS_COLORS = {
  invited:   "bg-amber-100 text-amber-700 border-amber-200",
  started:   "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  waived:    "bg-slate-100 text-slate-600 border-slate-200",
};

function AddEmployeeModal({ open, onClose, windows, cases }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    employee_name: "", employee_email: "", employer_name: "",
    enrollment_window_id: "", case_id: "", effective_date: "",
    date_of_birth: "", status: "invited",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const create = useMutation({
    mutationFn: () => {
      const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
      return base44.entities.EmployeeEnrollment.create({ ...form, access_token: token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "Employee added", description: `${form.employee_name} has been added.` });
      onClose();
    },
  });

  const selectedWindow = windows.find(w => w.id === form.enrollment_window_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Employee to Enrollment</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input value={form.employee_name} onChange={e => set("employee_name", e.target.value)} className="mt-1.5" placeholder="Jane Smith" />
            </div>
            <div>
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={form.employee_email} onChange={e => set("employee_email", e.target.value)} className="mt-1.5" placeholder="jane@company.com" />
            </div>
          </div>
          <div>
            <Label>Enrollment Window</Label>
            <Select value={form.enrollment_window_id} onValueChange={v => {
              const w = windows.find(x => x.id === v);
              set("enrollment_window_id", v);
              if (w) { set("case_id", w.case_id || ""); set("employer_name", w.employer_name || ""); }
            }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select window..." /></SelectTrigger>
              <SelectContent>
                {windows.map(w => <SelectItem key={w.id} value={w.id}>{w.employer_name} — {w.status}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Initial Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="invited">Invited</SelectItem>
                <SelectItem value="started">Started</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!form.employee_name || !form.employee_email || create.isPending}>
            {create.isPending ? "Adding..." : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditEmployeeModal({ enrollment, open, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    employee_name: enrollment?.employee_name || "",
    employee_email: enrollment?.employee_email || "",
    status: enrollment?.status || "invited",
    coverage_tier: enrollment?.coverage_tier || "",
    effective_date: enrollment?.effective_date || "",
    date_of_birth: enrollment?.date_of_birth || "",
    employer_name: enrollment?.employer_name || "",
    waiver_reason: enrollment?.waiver_reason || "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: () => base44.entities.EmployeeEnrollment.update(enrollment.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "Saved", description: "Employee record updated." });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Employee Record</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full Name</Label>
              <Input value={form.employee_name} onChange={e => set("employee_name", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.employee_email} onChange={e => set("employee_email", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["invited","started","completed","waived"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Coverage Tier</Label>
              <Select value={form.coverage_tier} onValueChange={v => set("coverage_tier", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select tier..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee_only">Employee Only</SelectItem>
                  <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                  <SelectItem value="employee_children">Employee + Children</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          {form.status === "waived" && (
            <div>
              <Label>Waiver Reason</Label>
              <Input value={form.waiver_reason} onChange={e => set("waiver_reason", e.target.value)} className="mt-1.5" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeeRosterTab({ enrollments, windows, cases, plans, isLoading, currentUser, onNavigate }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [windowFilter, setWindowFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewingDetail, setViewingDetail] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const windowMap = useMemo(() => Object.fromEntries(windows.map(w => [w.id, w])), [windows]);
  const planMap = useMemo(() => Object.fromEntries(plans.map(p => [p.id, p])), [plans]);

  const filtered = useMemo(() => enrollments.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      e.employee_name?.toLowerCase().includes(q) ||
      e.employee_email?.toLowerCase().includes(q) ||
      e.employer_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchWindow = windowFilter === "all" || e.enrollment_window_id === windowFilter;
    return matchSearch && matchStatus && matchWindow;
  }), [enrollments, search, statusFilter, windowFilter]);

  const deleteEnrollment = useMutation({
    mutationFn: (id) => base44.entities.EmployeeEnrollment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "Employee removed" });
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: (status) => Promise.all([...selectedIds].map(id =>
      base44.entities.EmployeeEnrollment.update(id, { status })
    )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      setSelectedIds(new Set());
      toast({ title: "Bulk update applied" });
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (enrollment) => {
      await base44.functions.invoke("sendEnrollmentInvite", {
        enrollment_id: enrollment.id,
        employee_email: enrollment.employee_email,
        employee_name: enrollment.employee_name,
      });
    },
    onSuccess: () => toast({ title: "Invite resent" }),
    onError: () => toast({ title: "Failed to send invite", variant: "destructive" }),
  });

  const exportCSV = () => {
    const rows = [
      ["Name","Email","Employer","Status","Coverage Tier","Plan","Effective Date","Completed At","Dependents","DocuSign Status"],
      ...filtered.map(e => [
        e.employee_name || "",
        e.employee_email || "",
        e.employer_name || "",
        e.status || "",
        e.coverage_tier?.replace(/_/g, " ") || "",
        e.selected_plan_name || planMap[e.selected_plan_id]?.plan_name || "",
        e.effective_date || "",
        e.completed_at ? format(new Date(e.completed_at), "MM/dd/yyyy") : "",
        e.dependents?.length || 0,
        e.docusign_status || "not_sent",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "employee_roster.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(e => e.id)));

  const stats = useMemo(() => ({
    total: enrollments.length,
    invited: enrollments.filter(e => e.status === "invited").length,
    started: enrollments.filter(e => e.status === "started").length,
    completed: enrollments.filter(e => e.status === "completed").length,
    waived: enrollments.filter(e => e.status === "waived").length,
  }), [enrollments]);

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground", bg: "bg-muted/40" },
          { label: "Invited", value: stats.invited, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Started", value: stats.started, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Enrolled", value: stats.completed, color: "text-green-600", bg: "bg-green-50" },
          { label: "Waived", value: stats.waived, color: "text-slate-500", bg: "bg-slate-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg} cursor-pointer hover:shadow-sm`}
            onClick={() => setStatusFilter(s.label === "Total" ? "all" : s.label === "Invited" ? "invited" : s.label === "Started" ? "started" : s.label === "Enrolled" ? "completed" : "waived")}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap items-start sm:items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, email, employer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="started">Started</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={windowFilter} onValueChange={setWindowFilter}>
          <SelectTrigger className="w-52 h-9"><SelectValue placeholder="All Windows" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Windows</SelectItem>
            {windows.map(w => <SelectItem key={w.id} value={w.id}>{w.employer_name} ({w.status})</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all" || windowFilter !== "all") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); setWindowFilter("all"); }}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Employee
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/5 border border-primary/20 flex-wrap">
          <span className="text-xs font-medium text-primary">{selectedIds.size} selected</span>
          <Select onValueChange={v => bulkUpdateStatus.mutate(v)}>
            <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="Change status…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="invited">Mark Invited</SelectItem>
              <SelectItem value="started">Mark Started</SelectItem>
              <SelectItem value="completed">Mark Completed</SelectItem>
              <SelectItem value="waived">Mark Waived</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSelectedIds(new Set())}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      )}

      {/* Select all row */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
          <span className="text-xs text-muted-foreground">{filtered.length} employee{filtered.length !== 1 ? "s" : ""} shown</span>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No employees found"
          description={enrollments.length === 0 ? "Add employees to an enrollment window to get started" : "Try adjusting your filters"}
          actionLabel={enrollments.length === 0 ? "Add Employee" : undefined}
          onAction={enrollments.length === 0 ? () => setShowAdd(true) : undefined}
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-3 px-4 py-2.5 bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
            <div className="w-4" />
            <div>Employee</div>
            <div>Employer / Window</div>
            <div className="text-center">Status</div>
            <div className="text-center">Coverage</div>
            <div className="text-center">DocuSign</div>
            <div />
          </div>

          {filtered.map(e => {
            const win = windowMap[e.enrollment_window_id];
            const plan = planMap[e.selected_plan_id];
            const isSelected = selectedIds.has(e.id);

            return (
              <div key={e.id} className={`grid grid-cols-[auto_1fr_1fr_auto_auto_auto_auto] gap-3 px-4 py-3 items-center border-b last:border-0 hover:bg-muted/20 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(e.id)} />

                {/* Employee info */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{e.employee_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.employee_email}</p>
                  {e.date_of_birth && <p className="text-[10px] text-muted-foreground">DOB: {e.date_of_birth}</p>}
                  {e.dependents?.length > 0 && (
                    <span className="text-[10px] text-blue-600">{e.dependents.length} dependent{e.dependents.length !== 1 ? "s" : ""}</span>
                  )}
                </div>

                {/* Employer / window */}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{e.employer_name || "—"}</p>
                  {win && <p className="text-[10px] text-muted-foreground">{win.employer_name} · {win.status}</p>}
                  {e.effective_date && <p className="text-[10px] text-muted-foreground">Eff. {e.effective_date}</p>}
                </div>

                {/* Status */}
                <div className="text-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[e.status] || "bg-muted text-muted-foreground"}`}>
                    {e.status}
                  </span>
                  {e.completed_at && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">{format(new Date(e.completed_at), "MM/dd/yy")}</p>
                  )}
                </div>

                {/* Coverage */}
                <div className="text-center min-w-[90px]">
                  {e.coverage_tier ? (
                    <p className="text-[10px] text-muted-foreground capitalize leading-snug">{e.coverage_tier.replace(/_/g, " ")}</p>
                  ) : <span className="text-[10px] text-muted-foreground">—</span>}
                  {(e.selected_plan_name || plan?.plan_name) && (
                    <p className="text-[10px] text-primary font-medium truncate max-w-[90px]">{e.selected_plan_name || plan.plan_name}</p>
                  )}
                </div>

                {/* DocuSign */}
                <div className="text-center">
                  {e.docusign_status && e.docusign_status !== "not_sent" ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      e.docusign_status === "completed" ? "bg-green-100 text-green-700" :
                      e.docusign_status === "sent" ? "bg-blue-100 text-blue-700" :
                      e.docusign_status === "declined" ? "bg-red-100 text-red-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{e.docusign_status}</span>
                  ) : <span className="text-[10px] text-muted-foreground">—</span>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {["invited", "started"].includes(e.status) && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Resend invite"
                      onClick={() => resendInvite.mutate(e)} disabled={resendInvite.isPending}>
                      <Send className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="View Details"
                    onClick={() => setViewingDetail(e)}>
                    <Eye className="w-3 h-3 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit"
                    onClick={() => setEditing(e)}>
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete"
                    onClick={() => { if (confirm(`Remove ${e.employee_name}?`)) deleteEnrollment.mutate(e.id); }}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddEmployeeModal open={showAdd} onClose={() => setShowAdd(false)} windows={windows} cases={cases} />}
      {editing && <EditEmployeeModal enrollment={editing} open={!!editing} onClose={() => setEditing(null)} />}
    </div>
  );
}