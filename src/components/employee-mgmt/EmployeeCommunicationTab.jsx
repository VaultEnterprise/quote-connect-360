import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Send, Mail, Users, CheckCircle2, Clock, AlertTriangle,
  MessageSquare, RefreshCw, X, Search, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

const QUICK_TEMPLATES = [
  {
    id: "enrollment_reminder",
    label: "Enrollment Reminder",
    subject: "Action Required: Complete Your Benefits Enrollment",
    body: "Dear {employee_name},\n\nThis is a friendly reminder that your benefits enrollment deadline is approaching. Please log in to the Employee Portal to complete your enrollment selections.\n\nIf you have any questions, please contact your HR administrator.\n\nBest regards,\nHR Team",
    targetStatus: ["invited"],
  },
  {
    id: "enrollment_open",
    label: "Enrollment Now Open",
    subject: "Your Benefits Enrollment is Now Open",
    body: "Dear {employee_name},\n\nGreat news! Open enrollment for your benefits is now available. You have until {end_date} to make your selections.\n\nPlease visit the Employee Portal to review your options and enroll.\n\nBest regards,\nHR Team",
    targetStatus: ["invited", "started"],
  },
  {
    id: "docusign_reminder",
    label: "DocuSign Reminder",
    subject: "Please Sign Your Benefits Enrollment Documents",
    body: "Dear {employee_name},\n\nYour benefits enrollment is complete, but we still need your signature on the enrollment documents. Please check your email for a DocuSign request.\n\nIf you haven't received it, please contact HR.\n\nBest regards,\nHR Team",
    targetStatus: ["completed"],
  },
  {
    id: "waiver_followup",
    label: "Waiver Follow-Up",
    subject: "Benefits Coverage Waiver Confirmation",
    body: "Dear {employee_name},\n\nWe have received your benefits coverage waiver. If your circumstances change during the year, please contact HR about a qualifying life event.\n\nBest regards,\nHR Team",
    targetStatus: ["waived"],
  },
];

export default function EmployeeCommunicationTab({ enrollments, windows, isLoading }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [targetFilter, setTargetFilter] = useState("invited");
  const [windowFilter, setWindowFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [sentLog, setSentLog] = useState([]);

  const windowMap = useMemo(() => Object.fromEntries(windows.map(w => [w.id, w])), [windows]);

  const filteredEmployees = useMemo(() => enrollments.filter(e => {
    const statusMatch = targetFilter === "all" || e.status === targetFilter;
    const windowMatch = windowFilter === "all" || e.enrollment_window_id === windowFilter;
    return statusMatch && windowMatch;
  }), [enrollments, targetFilter, windowFilter]);

  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelectedIds(selectedIds.size === filteredEmployees.length ? new Set() : new Set(filteredEmployees.map(e => e.id)));

  const applyTemplate = (tmpl) => {
    setSelectedTemplate(tmpl.id);
    setCustomSubject(tmpl.subject);
    setCustomBody(tmpl.body);
    if (tmpl.targetStatus?.length === 1) setTargetFilter(tmpl.targetStatus[0]);
  };

  const sendBulkInvites = async () => {
    if (selectedIds.size === 0) { toast({ title: "Select at least one employee", variant: "destructive" }); return; }
    setSending(true);
    const targets = enrollments.filter(e => selectedIds.has(e.id));
    let successCount = 0;
    let failCount = 0;

    for (const e of targets) {
      try {
        await base44.functions.invoke("sendEnrollmentInvite", {
          enrollment_id: e.id,
          employee_email: e.employee_email,
          employee_name: e.employee_name,
        });
        successCount++;
        setSentLog(prev => [...prev, { name: e.employee_name, email: e.employee_email, status: "sent", time: new Date() }]);
      } catch {
        failCount++;
        setSentLog(prev => [...prev, { name: e.employee_name, email: e.employee_email, status: "failed", time: new Date() }]);
      }
    }

    setSending(false);
    setSelectedIds(new Set());
    toast({
      title: `Sent ${successCount} invites`,
      description: failCount > 0 ? `${failCount} failed to send` : "All invites delivered",
      variant: failCount > 0 ? "destructive" : "default",
    });
  };

  const sendCustomEmail = async () => {
    if (!customSubject || !customBody) { toast({ title: "Subject and body required", variant: "destructive" }); return; }
    if (selectedIds.size === 0) { toast({ title: "Select at least one employee", variant: "destructive" }); return; }

    setSending(true);
    const targets = enrollments.filter(e => selectedIds.has(e.id));
    let successCount = 0;

    for (const e of targets) {
      const body = customBody.replace(/{employee_name}/g, e.employee_name || "").replace(/{employee_email}/g, e.employee_email || "");
      try {
        await base44.integrations.Core.SendEmail({
          to: e.employee_email,
          subject: customSubject,
          body,
        });
        successCount++;
        setSentLog(prev => [...prev, { name: e.employee_name, email: e.employee_email, status: "sent", time: new Date(), subject: customSubject }]);
      } catch {
        setSentLog(prev => [...prev, { name: e.employee_name, email: e.employee_email, status: "failed", time: new Date() }]);
      }
    }
    setSending(false);
    setSelectedIds(new Set());
    toast({ title: `Email sent to ${successCount} employees` });
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Invited (Need Action)", value: enrollments.filter(e => e.status === "invited").length, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "In Progress", value: enrollments.filter(e => e.status === "started").length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", value: enrollments.filter(e => e.status === "completed").length, color: "text-green-600", bg: "bg-green-50" },
          { label: "Emails Sent (Session)", value: sentLog.filter(l => l.status === "sent").length, color: "text-primary", bg: "bg-primary/5" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Compose / Templates */}
        <div className="space-y-4">
          {/* Quick Templates */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Quick Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {QUICK_TEMPLATES.map(tmpl => (
                <button key={tmpl.id}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all hover:border-primary/50 ${selectedTemplate === tmpl.id ? "border-primary bg-primary/5" : "bg-card"}`}
                  onClick={() => applyTemplate(tmpl)}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold">{tmpl.label}</span>
                    {selectedTemplate === tmpl.id && <Badge className="text-[9px] bg-primary/10 text-primary">Selected</Badge>}
                  </div>
                  <p className="text-muted-foreground line-clamp-1">{tmpl.subject}</p>
                  <div className="flex gap-1 mt-1.5">
                    {tmpl.targetStatus.map(s => (
                      <span key={s} className="text-[9px] bg-muted px-1.5 py-0.5 rounded capitalize">{s}</span>
                    ))}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Compose */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Mail className="w-4 h-4" /> Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Subject</Label>
                <Input value={customSubject} onChange={e => setCustomSubject(e.target.value)} className="mt-1.5 h-8 text-sm" placeholder="Email subject..." />
              </div>
              <div>
                <Label className="text-xs">Message Body</Label>
                <Textarea value={customBody} onChange={e => setCustomBody(e.target.value)} className="mt-1.5 text-xs h-40" placeholder="Use {employee_name} for personalization..." />
              </div>
              <p className="text-[10px] text-muted-foreground">Variables: {"{employee_name}"}, {"{employee_email}"}</p>
              <div className="flex gap-2">
                <Button size="sm" className="gap-1.5 flex-1" onClick={sendCustomEmail} disabled={sending || selectedIds.size === 0 || !customSubject || !customBody}>
                  <Mail className="w-3.5 h-3.5" />
                  {sending ? "Sending..." : `Send to ${selectedIds.size} Employee${selectedIds.size !== 1 ? "s" : ""}`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><Send className="w-4 h-4 text-blue-600" /> Bulk Enrollment Invites</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Send/resend enrollment portal invites with access tokens to selected employees.</p>
              <Button size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={sendBulkInvites} disabled={sending || selectedIds.size === 0}>
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending..." : `Send Invites to ${selectedIds.size} Employee${selectedIds.size !== 1 ? "s" : ""}`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Employee Selection */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> Select Recipients</span>
                <span className="text-xs text-muted-foreground font-normal">{selectedIds.size} selected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Select value={targetFilter} onValueChange={setTargetFilter}>
                  <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="invited">Invited</SelectItem>
                    <SelectItem value="started">Started</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={windowFilter} onValueChange={setWindowFilter}>
                  <SelectTrigger className="h-7 w-44 text-xs"><SelectValue placeholder="All Windows" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Windows</SelectItem>
                    {windows.map(w => <SelectItem key={w.id} value={w.id}>{w.employer_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Select all */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0} onCheckedChange={toggleAll} />
                <span>Select all {filteredEmployees.length} shown</span>
              </div>

              {/* Employee list */}
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No employees match filters</p>
                ) : filteredEmployees.map(e => {
                  const win = windowMap[e.enrollment_window_id];
                  return (
                    <div key={e.id}
                      className={`flex items-center gap-2.5 py-2 px-3 rounded-lg border cursor-pointer transition-colors ${selectedIds.has(e.id) ? "bg-primary/5 border-primary/20" : "bg-card border-transparent hover:bg-muted/40 hover:border-border"}`}
                      onClick={() => toggleSelect(e.id)}>
                      <Checkbox checked={selectedIds.has(e.id)} onCheckedChange={() => toggleSelect(e.id)} onClick={ev => ev.stopPropagation()} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{e.employee_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{e.employee_email}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold capitalize flex-shrink-0 ${
                        e.status === "invited" ? "bg-amber-100 text-amber-700" :
                        e.status === "started" ? "bg-blue-100 text-blue-700" :
                        e.status === "completed" ? "bg-green-100 text-green-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{e.status}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sent Log */}
      {sentLog.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Session Activity Log</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSentLog([])}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          </CardHeader>
          <CardContent className="max-h-48 overflow-y-auto space-y-1">
            {[...sentLog].reverse().map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-xs py-1.5 px-3 rounded-lg bg-muted/40">
                {log.status === "sent" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-destructive flex-shrink-0" />}
                <span className="font-medium">{log.name}</span>
                <span className="text-muted-foreground">{log.email}</span>
                {log.subject && <span className="text-muted-foreground italic truncate">{log.subject}</span>}
                <span className="text-muted-foreground ml-auto flex-shrink-0">{format(log.time, "h:mm a")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}