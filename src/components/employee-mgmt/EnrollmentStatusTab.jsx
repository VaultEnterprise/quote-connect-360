import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, Filter,
  Search, Send, RefreshCw, ChevronRight, Users, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

export default function EnrollmentStatusTab({ enrollments, windows, plans, isLoading }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [windowFilter, setWindowFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const windowMap = useMemo(() => Object.fromEntries(windows.map(w => [w.id, w])), [windows]);
  const planMap = useMemo(() => Object.fromEntries(plans.map(p => [p.id, p])), [plans]);

  const filtered = useMemo(() => enrollments.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      e.employee_name?.toLowerCase().includes(q) ||
      e.employee_email?.toLowerCase().includes(q) ||
      e.employer_name?.toLowerCase().includes(q) ||
      e.selected_plan_name?.toLowerCase().includes(q);
    const matchWindow = windowFilter === "all" || e.enrollment_window_id === windowFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchWindow && matchStatus;
  }), [enrollments, search, windowFilter, statusFilter]);

  // Group by window
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const key = e.enrollment_window_id || "__none__";
      if (!map[key]) map[key] = [];
      map[key].push(e);
    });
    return Object.entries(map).map(([wid, emps]) => ({
      window: windowMap[wid],
      windowId: wid,
      employees: emps,
      enrolled: emps.filter(e => e.status === "completed").length,
      waived: emps.filter(e => e.status === "waived").length,
      pending: emps.filter(e => ["invited","started"].includes(e.status)).length,
    }));
  }, [filtered, windowMap]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.EmployeeEnrollment.update(id, {
      status,
      ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "Status updated" });
    },
  });

  const resendInvite = useMutation({
    mutationFn: (e) => base44.functions.invoke("sendEnrollmentInvite", {
      enrollment_id: e.id, employee_email: e.employee_email, employee_name: e.employee_name,
    }),
    onSuccess: () => toast({ title: "Invite resent" }),
    onError: () => toast({ title: "Failed to resend", variant: "destructive" }),
  });

  const pendingList = enrollments.filter(e => e.status === "invited");
  const bulkResend = useMutation({
    mutationFn: () => Promise.all(pendingList.map(e =>
      base44.functions.invoke("sendEnrollmentInvite", {
        enrollment_id: e.id, employee_email: e.employee_email, employee_name: e.employee_name,
      })
    )),
    onSuccess: () => toast({ title: `Resent ${pendingList.length} invites` }),
    onError: () => toast({ title: "Some invites failed", variant: "destructive" }),
  });

  if (isLoading) return <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Action banner for pending invites */}
      {pendingList.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{pendingList.length}</strong> employee{pendingList.length !== 1 ? "s" : ""} invited but not yet started enrollment
            </p>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 h-8 text-xs gap-1.5 flex-shrink-0"
            onClick={() => bulkResend.mutate()} disabled={bulkResend.isPending}>
            <Send className="w-3.5 h-3.5" />
            {bulkResend.isPending ? "Sending…" : "Resend All Invites"}
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search employees, plans, employers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
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
            {windows.map(w => <SelectItem key={w.id} value={w.id}>{w.employer_name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all" || windowFilter !== "all") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); setWindowFilter("all"); }}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} records</span>
      </div>

      {/* Grouped by window */}
      {grouped.length === 0 ? (
        <EmptyState icon={Users} title="No enrollment records" description="Employee enrollment records will appear here once employees are invited." />
      ) : (
        <div className="space-y-4">
          {grouped.map(({ window: win, windowId, employees, enrolled, waived, pending }) => {
            const total = win?.total_eligible || employees.length || 1;
            const pct = Math.round((enrolled / total) * 100);

            return (
              <Card key={windowId}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{win?.employer_name || "Unknown Window"}</CardTitle>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        {win?.start_date && <span>{win.start_date} — {win.end_date}</span>}
                        <Badge variant="outline" className="text-[10px]">{win?.status || "unknown"}</Badge>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${pct >= 75 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-destructive"}`}>{pct}%</p>
                      <p className="text-xs text-muted-foreground">participation</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 space-y-1">
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                      <div className="bg-green-500 h-full" style={{ width: `${Math.round((enrolled / total) * 100)}%` }} />
                      <div className="bg-slate-300 h-full" style={{ width: `${Math.round((waived / total) * 100)}%` }} />
                      <div className="bg-amber-300 h-full" style={{ width: `${Math.round((pending / total) * 100)}%` }} />
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span className="text-green-600 font-medium">{enrolled} enrolled</span>
                      <span>{waived} waived</span>
                      <span className="text-amber-600">{pending} pending</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1.5">
                    {employees.map(e => {
                      const plan = planMap[e.selected_plan_id];
                      return (
                        <div key={e.id} className="flex items-center gap-3 py-2 px-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                          {/* Status icon */}
                          <div className="flex-shrink-0">
                            {e.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {e.status === "invited" && <Clock className="w-4 h-4 text-amber-500" />}
                            {e.status === "started" && <RefreshCw className="w-4 h-4 text-blue-500" />}
                            {e.status === "waived" && <XCircle className="w-4 h-4 text-slate-400" />}
                          </div>

                          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                            <div>
                              <p className="font-medium truncate">{e.employee_name}</p>
                              <p className="text-muted-foreground truncate">{e.employee_email}</p>
                            </div>
                            <div>
                              {(e.selected_plan_name || plan?.plan_name) && (
                                <p className="font-medium text-primary truncate">{e.selected_plan_name || plan.plan_name}</p>
                              )}
                              {e.coverage_tier && <p className="text-muted-foreground capitalize">{e.coverage_tier.replace(/_/g, " ")}</p>}
                            </div>
                            <div className="text-muted-foreground">
                              {e.status === "completed" && e.completed_at && (
                                <p>Completed {format(new Date(e.completed_at), "MMM d, yyyy")}</p>
                              )}
                              {e.status === "waived" && e.waiver_reason && (
                                <p>Waiver: {e.waiver_reason}</p>
                              )}
                              {e.dependents?.length > 0 && <p>{e.dependents.length} dependent{e.dependents.length !== 1 ? "s" : ""}</p>}
                            </div>
                          </div>

                          {/* Quick actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {["invited", "started"].includes(e.status) && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"
                                onClick={() => resendInvite.mutate(e)} disabled={resendInvite.isPending}>
                                <Send className="w-3 h-3" /> Resend
                              </Button>
                            )}
                            {e.status !== "completed" && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-green-600"
                                onClick={() => updateStatus.mutate({ id: e.id, status: "completed" })}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
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