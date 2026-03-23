import React, { useMemo, useState } from "react";
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock,
  FileSignature, Users, Calendar, AlertCircle, X, Search,
  TrendingUp, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO, differenceInDays } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

export default function EmployeeComplianceTab({ enrollments, windows, plans, cases, isLoading, onNavigate }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeIssue, setActiveIssue] = useState("all");

  const windowMap = useMemo(() => Object.fromEntries(windows.map(w => [w.id, w])), [windows]);
  const planMap = useMemo(() => Object.fromEntries(plans.map(p => [p.id, p])), [plans]);
  const caseMap = useMemo(() => Object.fromEntries(cases.map(c => [c.id, c])), [cases]);

  // ── Compliance Issue Detection ──────────────────────────────────────────
  const issues = useMemo(() => {
    const list = [];

    enrollments.forEach(e => {
      const win = windowMap[e.enrollment_window_id];

      // 1. Completed enrollment but no DocuSign
      if (e.status === "completed" && (!e.docusign_status || e.docusign_status === "not_sent")) {
        list.push({
          id: e.id + "_ds",
          type: "missing_docusign",
          severity: "high",
          enrollment: e,
          message: "Completed enrollment has no DocuSign sent",
          action: "Send DocuSign",
          tab: "docusign",
        });
      }

      // 2. DocuSign declined
      if (e.docusign_status === "declined") {
        list.push({
          id: e.id + "_dsd",
          type: "docusign_declined",
          severity: "high",
          enrollment: e,
          message: `DocuSign declined${e.docusign_declined_reason ? `: "${e.docusign_declined_reason}"` : ""}`,
          action: "Resend DocuSign",
          tab: "docusign",
        });
      }

      // 3. Invited but window is closed/finalized
      if (["invited","started"].includes(e.status) && win && ["closed","finalized"].includes(win.status)) {
        list.push({
          id: e.id + "_ow",
          type: "overdue_window",
          severity: "high",
          enrollment: e,
          message: `Enrollment window "${win.employer_name}" has closed but employee hasn't completed`,
          action: "Review",
          tab: "status",
        });
      }

      // 4. No coverage tier selected on completed enrollment
      if (e.status === "completed" && !e.coverage_tier) {
        list.push({
          id: e.id + "_nct",
          type: "missing_coverage_tier",
          severity: "medium",
          enrollment: e,
          message: "Completed enrollment is missing coverage tier selection",
          action: "Edit",
          tab: "roster",
        });
      }

      // 5. No plan selected on completed enrollment
      if (e.status === "completed" && !e.selected_plan_id && !e.selected_plan_name) {
        list.push({
          id: e.id + "_np",
          type: "missing_plan",
          severity: "medium",
          enrollment: e,
          message: "Completed enrollment has no plan selected",
          action: "Edit",
          tab: "roster",
        });
      }

      // 6. No effective date
      if (["completed","waived"].includes(e.status) && !e.effective_date) {
        list.push({
          id: e.id + "_ned",
          type: "missing_effective_date",
          severity: "medium",
          enrollment: e,
          message: "Missing effective date on finalized enrollment",
          action: "Edit",
          tab: "roster",
        });
      }

      // 7. Waived with no reason
      if (e.status === "waived" && !e.waiver_reason) {
        list.push({
          id: e.id + "_wr",
          type: "missing_waiver_reason",
          severity: "low",
          enrollment: e,
          message: "Coverage waived without documented reason",
          action: "Add Reason",
          tab: "roster",
        });
      }

      // 8. DocuSign sent > 14 days ago and not signed
      if (e.docusign_status === "sent" && e.docusign_sent_at) {
        const daysSinceSent = differenceInDays(new Date(), new Date(e.docusign_sent_at));
        if (daysSinceSent > 14) {
          list.push({
            id: e.id + "_dsold",
            type: "docusign_stale",
            severity: "medium",
            enrollment: e,
            message: `DocuSign sent ${daysSinceSent} days ago and not yet signed`,
            action: "Resend",
            tab: "docusign",
          });
        }
      }
    });

    return list;
  }, [enrollments, windowMap]);

  const filtered = useMemo(() => {
    let result = issues;
    if (activeIssue !== "all") result = result.filter(i => i.type === activeIssue);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.enrollment.employee_name?.toLowerCase().includes(q) ||
        i.enrollment.employee_email?.toLowerCase().includes(q) ||
        i.message.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.severity] - order[b.severity];
    });
  }, [issues, activeIssue, search]);

  const issueTypeCounts = useMemo(() => {
    return issues.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {});
  }, [issues]);

  const severityCounts = useMemo(() => ({
    high: issues.filter(i => i.severity === "high").length,
    medium: issues.filter(i => i.severity === "medium").length,
    low: issues.filter(i => i.severity === "low").length,
  }), [issues]);

  // Fix: send docusign
  const sendDocuSign = useMutation({
    mutationFn: (enrollment) => base44.functions.invoke("sendDocuSignEnvelope", {
      enrollment_id: enrollment.id,
      employee_email: enrollment.employee_email,
      employee_name: enrollment.employee_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "DocuSign sent" });
    },
    onError: () => toast({ title: "Failed to send DocuSign", variant: "destructive" }),
  });

  const exportIssues = () => {
    const rows = [["Employee","Email","Issue Type","Severity","Message","Recommended Action"]];
    issues.forEach(i => rows.push([
      i.enrollment.employee_name || "",
      i.enrollment.employee_email || "",
      i.type.replace(/_/g, " "),
      i.severity,
      i.message,
      i.action,
    ]));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "compliance_issues.csv"; a.click();
    URL.revokeObjectURL(a.href);
  };

  const ISSUE_TYPE_LABELS = {
    missing_docusign: "Missing DocuSign",
    docusign_declined: "DocuSign Declined",
    overdue_window: "Window Closed (Incomplete)",
    missing_coverage_tier: "No Coverage Tier",
    missing_plan: "No Plan Selected",
    missing_effective_date: "No Effective Date",
    missing_waiver_reason: "Waiver Missing Reason",
    docusign_stale: "Stale DocuSign",
  };

  if (isLoading) return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {/* Health Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className={`rounded-xl border p-4 ${issues.length === 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-2">
            {issues.length === 0 ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <div>
              <p className={`text-xl font-bold ${issues.length === 0 ? "text-emerald-600" : "text-red-600"}`}>{issues.length}</p>
              <p className="text-xs text-muted-foreground">Total Issues</p>
            </div>
          </div>
          {issues.length === 0 && <p className="text-xs text-emerald-700 mt-1.5 font-medium">All compliance checks passed!</p>}
        </div>
        {[
          { label: "High Severity", value: severityCounts.high, color: severityCounts.high > 0 ? "text-red-600" : "text-emerald-600", bg: severityCounts.high > 0 ? "bg-red-50" : "bg-emerald-50" },
          { label: "Medium Severity", value: severityCounts.medium, color: severityCounts.medium > 0 ? "text-amber-600" : "text-emerald-600", bg: severityCounts.medium > 0 ? "bg-amber-50" : "bg-emerald-50" },
          { label: "Low Severity", value: severityCounts.low, color: "text-slate-600", bg: "bg-slate-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Compliance Score */}
      {enrollments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Compliance Score</span>
              <span className={`text-lg font-bold ${
                issues.length === 0 ? "text-emerald-600" :
                issues.length <= 3 ? "text-amber-600" : "text-red-600"
              }`}>{Math.max(0, Math.round(100 - (issues.length / enrollments.length) * 100))}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${issues.length === 0 ? "bg-emerald-500" : issues.length <= 5 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${Math.max(0, 100 - (issues.length / enrollments.length) * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Based on {enrollments.length} enrollments with {issues.length} detected issues</p>
          </CardContent>
        </Card>
      )}

      {/* Issue Type Breakdown */}
      {Object.keys(issueTypeCounts).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeIssue === "all" ? "bg-foreground text-background" : "bg-card hover:bg-muted"}`}
            onClick={() => setActiveIssue("all")}>
            All Issues ({issues.length})
          </button>
          {Object.entries(issueTypeCounts).map(([type, count]) => (
            <button key={type}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${activeIssue === type ? "bg-foreground text-background" : "bg-card hover:bg-muted"}`}
              onClick={() => setActiveIssue(activeIssue === type ? "all" : type)}>
              {ISSUE_TYPE_LABELS[type] || type} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8 text-xs" />
        </div>
        {search && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSearch("")}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
        {issues.length > 0 && (
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 ml-auto" onClick={exportIssues}>
            <Download className="w-3 h-3" /> Export Issues
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{filtered.length} issues</span>
      </div>

      {/* Issues List */}
      {issues.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No compliance issues detected"
          description="All employee enrollments are in good standing. Issues will appear here when detected." />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No issues match your search.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(issue => (
            <div key={issue.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
              issue.severity === "high" ? "border-red-200 bg-red-50/30" :
              issue.severity === "medium" ? "border-amber-200 bg-amber-50/30" :
              "border-slate-200 bg-slate-50/30"
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {issue.severity === "high" && <AlertTriangle className="w-4 h-4 text-red-600" />}
                {issue.severity === "medium" && <AlertCircle className="w-4 h-4 text-amber-600" />}
                {issue.severity === "low" && <Clock className="w-4 h-4 text-slate-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">{issue.enrollment.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{issue.enrollment.employee_email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge className={`text-[9px] capitalize ${
                      issue.severity === "high" ? "bg-red-100 text-red-700" :
                      issue.severity === "medium" ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{issue.severity}</Badge>
                    <Badge variant="outline" className="text-[9px]">{ISSUE_TYPE_LABELS[issue.type] || issue.type}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{issue.message}</p>
              </div>
              <div className="flex-shrink-0">
                {issue.type === "missing_docusign" || issue.type === "docusign_declined" || issue.type === "docusign_stale" ? (
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => sendDocuSign.mutate(issue.enrollment)} disabled={sendDocuSign.isPending}>
                    <FileSignature className="w-3 h-3" /> {issue.action}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 text-xs"
                    onClick={() => onNavigate && onNavigate(issue.tab)}>
                    {issue.action}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compliance Checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "All completed enrollments have DocuSign sent", check: enrollments.filter(e => e.status === "completed" && (!e.docusign_status || e.docusign_status === "not_sent")).length === 0 },
              { label: "No DocuSign envelopes declined", check: enrollments.filter(e => e.docusign_status === "declined").length === 0 },
              { label: "All completed enrollments have a coverage tier", check: enrollments.filter(e => e.status === "completed" && !e.coverage_tier).length === 0 },
              { label: "All completed enrollments have a plan selected", check: enrollments.filter(e => e.status === "completed" && !e.selected_plan_id && !e.selected_plan_name).length === 0 },
              { label: "All waivers have documented reasons", check: enrollments.filter(e => e.status === "waived" && !e.waiver_reason).length === 0 },
              { label: "No employees stuck in closed windows", check: (() => {
                const closedWindows = new Set(windows.filter(w => ["closed","finalized"].includes(w.status)).map(w => w.id));
                return enrollments.filter(e => ["invited","started"].includes(e.status) && closedWindows.has(e.enrollment_window_id)).length === 0;
              })() },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                {item.check ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                )}
                <span className={item.check ? "text-muted-foreground" : "text-foreground font-medium"}>{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}