import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileSignature, Send, CheckCircle2, XCircle, Clock,
  AlertTriangle, RefreshCw, Search, Filter, X, ExternalLink,
  Download, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

const DS_STATUS_CONFIG = {
  not_sent:  { label: "Not Sent",  color: "bg-slate-100 text-slate-600", icon: Clock },
  sent:      { label: "Sent",      color: "bg-blue-100 text-blue-700",   icon: Send },
  delivered: { label: "Delivered", color: "bg-indigo-100 text-indigo-700", icon: Eye },
  completed: { label: "Signed",    color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  declined:  { label: "Declined",  color: "bg-red-100 text-red-700",     icon: XCircle },
  voided:    { label: "Voided",    color: "bg-slate-100 text-slate-500", icon: XCircle },
};

export default function DocuSignManagementTab({ enrollments, isLoading }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Only enrollments that have been through DocuSign (completed or have envelope)
  const dsEnrollments = useMemo(() => enrollments.filter(e =>
    e.status === "completed" || e.docusign_envelope_id || e.docusign_status
  ), [enrollments]);

  const filtered = useMemo(() => dsEnrollments.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      e.employee_name?.toLowerCase().includes(q) ||
      e.employee_email?.toLowerCase().includes(q) ||
      e.employer_name?.toLowerCase().includes(q) ||
      e.docusign_envelope_id?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || (e.docusign_status || "not_sent") === statusFilter;
    return matchSearch && matchStatus;
  }), [dsEnrollments, search, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: dsEnrollments.length,
    not_sent: dsEnrollments.filter(e => !e.docusign_status || e.docusign_status === "not_sent").length,
    pending: dsEnrollments.filter(e => ["sent","delivered"].includes(e.docusign_status)).length,
    completed: dsEnrollments.filter(e => e.docusign_status === "completed").length,
    declined: dsEnrollments.filter(e => e.docusign_status === "declined").length,
  }), [dsEnrollments]);

  const sendEnvelope = useMutation({
    mutationFn: (enrollment) => base44.functions.invoke("sendDocuSignEnvelope", {
      enrollment_id: enrollment.id,
      employee_email: enrollment.employee_email,
      employee_name: enrollment.employee_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "DocuSign envelope sent" });
    },
    onError: (e) => toast({ title: "Failed to send envelope", description: "DocuSign may not be configured.", variant: "destructive" }),
  });

  const voidEnvelope = useMutation({
    mutationFn: (id) => base44.entities.EmployeeEnrollment.update(id, {
      docusign_status: "voided",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "Envelope voided" });
    },
  });

  const resendEnvelope = useMutation({
    mutationFn: (enrollment) => base44.functions.invoke("sendDocuSignEnvelope", {
      enrollment_id: enrollment.id,
      employee_email: enrollment.employee_email,
      employee_name: enrollment.employee_name,
      resend: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "Envelope resent" });
    },
    onError: () => toast({ title: "Failed to resend", variant: "destructive" }),
  });

  // Bulk send to all completed enrollments with no envelope
  const needsSigning = enrollments.filter(e => e.status === "completed" && (!e.docusign_status || e.docusign_status === "not_sent"));
  const bulkSend = useMutation({
    mutationFn: () => Promise.allSettled(needsSigning.map(e =>
      base44.functions.invoke("sendDocuSignEnvelope", {
        enrollment_id: e.id, employee_email: e.employee_email, employee_name: e.employee_name,
      })
    )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: `Sent ${needsSigning.length} envelopes` });
    },
    onError: () => toast({ title: "Some envelopes failed", variant: "destructive" }),
  });

  if (isLoading) return <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Total Enrollments", value: stats.total, color: "text-foreground", bg: "bg-muted/40" },
          { label: "Not Sent", value: stats.not_sent, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Pending Signature", value: stats.pending, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Signed", value: stats.completed, color: "text-green-600", bg: "bg-green-50" },
          { label: "Declined", value: stats.declined, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bulk action banner */}
      {needsSigning.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>{needsSigning.length}</strong> completed enrollment{needsSigning.length !== 1 ? "s" : ""} awaiting DocuSign
            </p>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs gap-1.5 flex-shrink-0"
            onClick={() => bulkSend.mutate()} disabled={bulkSend.isPending}>
            <Send className="w-3.5 h-3.5" />
            {bulkSend.isPending ? "Sending…" : "Send All Envelopes"}
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, email, envelope ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="DocuSign Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All DocuSign Status</SelectItem>
            {Object.entries(DS_STATUS_CONFIG).map(([v, cfg]) => (
              <SelectItem key={v} value={v}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} records</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={FileSignature} title="No DocuSign records"
          description="Completed employee enrollments will appear here with their DocuSign signature status."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map(e => {
            const dsStatus = e.docusign_status || "not_sent";
            const cfg = DS_STATUS_CONFIG[dsStatus] || DS_STATUS_CONFIG.not_sent;
            const StatusIcon = cfg.icon;
            return (
              <div key={e.id} className="flex items-center gap-3 p-3.5 rounded-xl border bg-card hover:shadow-sm transition-all">
                <StatusIcon className={`w-4 h-4 flex-shrink-0 ${
                  dsStatus === "completed" ? "text-green-500" :
                  dsStatus === "declined" ? "text-red-500" :
                  dsStatus === "sent" || dsStatus === "delivered" ? "text-blue-500" :
                  "text-muted-foreground"
                }`} />

                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 text-xs">
                  <div>
                    <p className="font-medium truncate">{e.employee_name}</p>
                    <p className="text-muted-foreground truncate">{e.employee_email}</p>
                    <p className="text-muted-foreground">{e.employer_name}</p>
                  </div>
                  <div>
                    <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    {e.docusign_envelope_id && (
                      <p className="text-muted-foreground mt-0.5 font-mono text-[10px]">ID: {e.docusign_envelope_id.slice(0, 16)}…</p>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {e.docusign_sent_at && <p>Sent: {format(new Date(e.docusign_sent_at), "MMM d, yyyy")}</p>}
                    {e.docusign_signed_at && <p className="text-green-600 font-medium">Signed: {format(new Date(e.docusign_signed_at), "MMM d, yyyy")}</p>}
                    {e.docusign_declined_reason && <p className="text-red-600">Reason: {e.docusign_declined_reason}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {dsStatus === "not_sent" && (
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={() => sendEnvelope.mutate(e)} disabled={sendEnvelope.isPending}>
                      <Send className="w-3 h-3" /> Send
                    </Button>
                  )}
                  {["sent","delivered"].includes(dsStatus) && (
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => resendEnvelope.mutate(e)} disabled={resendEnvelope.isPending}>
                      <RefreshCw className="w-3 h-3" /> Resend
                    </Button>
                  )}
                  {["sent","delivered"].includes(dsStatus) && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => { if (confirm("Void this envelope?")) voidEnvelope.mutate(e.id); }}>
                      Void
                    </Button>
                  )}
                  {e.docusign_document_url && dsStatus === "completed" && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                      <a href={e.docusign_document_url} target="_blank" rel="noreferrer">
                        <Download className="w-3 h-3" /> Doc
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}