import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import {
  User, Mail, Calendar, Heart, FileSignature, CheckCircle2,
  Clock, XCircle, Edit2, Save, X, ExternalLink, Briefcase,
  ClipboardCheck, Send, Users, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  invited:   "bg-amber-100 text-amber-700 border-amber-200",
  started:   "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  waived:    "bg-slate-100 text-slate-600 border-slate-200",
};

const DS_COLORS = {
  not_sent:  "bg-slate-100 text-slate-500",
  sent:      "bg-blue-100 text-blue-700",
  delivered: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  declined:  "bg-red-100 text-red-700",
  voided:    "bg-slate-100 text-slate-400",
};

export default function EmployeeDetailDrawer({ enrollment, window: win, plan, open, onClose, onEdit }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    employee_name: enrollment?.employee_name || "",
    employee_email: enrollment?.employee_email || "",
    status: enrollment?.status || "invited",
    coverage_tier: enrollment?.coverage_tier || "",
    effective_date: enrollment?.effective_date || "",
    date_of_birth: enrollment?.date_of_birth || "",
    waiver_reason: enrollment?.waiver_reason || "",
    employer_name: enrollment?.employer_name || "",
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: () => base44.entities.EmployeeEnrollment.update(enrollment.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "Employee updated successfully" });
      setIsEditing(false);
    },
  });

  const resendInvite = useMutation({
    mutationFn: () => base44.functions.invoke("sendEnrollmentInvite", {
      enrollment_id: enrollment.id,
      employee_email: enrollment.employee_email,
      employee_name: enrollment.employee_name,
    }),
    onSuccess: () => toast({ title: "Invite resent", description: `Email sent to ${enrollment.employee_email}` }),
    onError: () => toast({ title: "Failed to resend", variant: "destructive" }),
  });

  const sendDocuSign = useMutation({
    mutationFn: () => base44.functions.invoke("sendDocuSignEnvelope", {
      enrollment_id: enrollment.id,
      employee_email: enrollment.employee_email,
      employee_name: enrollment.employee_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-employee-enrollments"] });
      toast({ title: "DocuSign envelope sent" });
    },
    onError: () => toast({ title: "Failed to send DocuSign", variant: "destructive" }),
  });

  if (!enrollment) return null;
  const dsStatus = enrollment.docusign_status || "not_sent";

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle className="text-lg">{enrollment.employee_name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{enrollment.employee_email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[enrollment.status] || "bg-muted"}`}>
                  {enrollment.status}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${DS_COLORS[dsStatus]}`}>
                  DocuSign: {dsStatus.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              {!isEditing ? (
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => save.mutate()} disabled={save.isPending}>
                    <Save className="w-3.5 h-3.5" /> {save.isPending ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 py-5">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {["invited","started"].includes(enrollment.status) && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => resendInvite.mutate()} disabled={resendInvite.isPending}>
                <Send className="w-3.5 h-3.5" /> Resend Invite
              </Button>
            )}
            {enrollment.status === "completed" && dsStatus === "not_sent" && (
              <Button size="sm" className="gap-1.5 h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => sendDocuSign.mutate()} disabled={sendDocuSign.isPending}>
                <FileSignature className="w-3.5 h-3.5" /> Send DocuSign
              </Button>
            )}
            {enrollment.docusign_document_url && dsStatus === "completed" && (
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" asChild>
                <a href={enrollment.docusign_document_url} target="_blank" rel="noreferrer">
                  <FileSignature className="w-3.5 h-3.5" /> View Signed Doc
                </a>
              </Button>
            )}
          </div>

          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><User className="w-4 h-4" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Full Name</Label><Input value={form.employee_name} onChange={e => set("employee_name", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  <div><Label className="text-xs">Email</Label><Input type="email" value={form.employee_email} onChange={e => set("employee_email", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  <div><Label className="text-xs">Employer</Label><Input value={form.employer_name} onChange={e => set("employer_name", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-xs text-muted-foreground">Name</span><p className="font-medium">{enrollment.employee_name}</p></div>
                  <div><span className="text-xs text-muted-foreground">Email</span><p className="font-medium truncate">{enrollment.employee_email}</p></div>
                  <div><span className="text-xs text-muted-foreground">Date of Birth</span><p>{enrollment.date_of_birth || "—"}</p></div>
                  <div><span className="text-xs text-muted-foreground">Employer</span><p>{enrollment.employer_name || "—"}</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollment Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" /> Enrollment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={v => set("status", v)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["invited","started","completed","waived"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Coverage Tier</Label>
                    <Select value={form.coverage_tier} onValueChange={v => set("coverage_tier", v)}>
                      <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee_only">Employee Only</SelectItem>
                        <SelectItem value="employee_spouse">Employee + Spouse</SelectItem>
                        <SelectItem value="employee_children">Employee + Children</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Effective Date</Label><Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  {form.status === "waived" && (
                    <div className="col-span-2"><Label className="text-xs">Waiver Reason</Label><Input value={form.waiver_reason} onChange={e => set("waiver_reason", e.target.value)} className="mt-1 h-8 text-sm" /></div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-xs text-muted-foreground">Status</span>
                    <p className="capitalize font-medium">{enrollment.status}</p>
                  </div>
                  <div><span className="text-xs text-muted-foreground">Coverage Tier</span>
                    <p className="capitalize">{enrollment.coverage_tier?.replace(/_/g, " ") || "—"}</p>
                  </div>
                  <div><span className="text-xs text-muted-foreground">Selected Plan</span>
                    <p className="text-primary font-medium">{enrollment.selected_plan_name || plan?.plan_name || "—"}</p>
                  </div>
                  <div><span className="text-xs text-muted-foreground">Effective Date</span>
                    <p>{enrollment.effective_date || "—"}</p>
                  </div>
                  {enrollment.completed_at && (
                    <div><span className="text-xs text-muted-foreground">Completed</span>
                      <p>{format(new Date(enrollment.completed_at), "MMM d, yyyy")}</p>
                    </div>
                  )}
                  {enrollment.waiver_reason && (
                    <div className="col-span-2"><span className="text-xs text-muted-foreground">Waiver Reason</span>
                      <p className="text-slate-600">{enrollment.waiver_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enrollment Window Link */}
          {win && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Enrollment Window</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{win.employer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {win.start_date} — {win.end_date} · <span className="capitalize font-medium">{win.status}</span>
                    </p>
                  </div>
                  <Link to="/enrollment">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                      <ExternalLink className="w-3 h-3" /> View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dependents */}
          {enrollment.dependents?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5"><Users className="w-4 h-4" /> Dependents ({enrollment.dependents.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {enrollment.dependents.map((dep, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/40 text-sm">
                    <div>
                      <p className="font-medium">{dep.name || dep.first_name + " " + dep.last_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{dep.relationship || dep.type} {dep.date_of_birth && `· DOB: ${dep.date_of_birth}`}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* DocuSign Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5"><FileSignature className="w-4 h-4" /> DocuSign Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DS_COLORS[dsStatus]}`}>{dsStatus.replace(/_/g, " ")}</span>
                </div>
                {enrollment.docusign_envelope_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Envelope ID</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{enrollment.docusign_envelope_id.slice(0, 20)}…</span>
                  </div>
                )}
                {enrollment.docusign_sent_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Sent</span>
                    <span className="text-xs">{format(new Date(enrollment.docusign_sent_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                )}
                {enrollment.docusign_signed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Signed</span>
                    <span className="text-xs text-green-600 font-medium">{format(new Date(enrollment.docusign_signed_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                )}
                {enrollment.docusign_declined_reason && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-2">
                    <p className="text-xs text-red-600 font-medium">Declined: {enrollment.docusign_declined_reason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}