import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ensureTxQuoteWorkspace, buildReadinessSummary, computeParticipationPercent } from "@/components/cases/txQuoteEngine";
import TxQuoteDestinationProgressCard from "@/components/cases/TxQuoteDestinationProgressCard";

function SectionCard({ title, children, action }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function TxQuoteWorkspace({ open, onClose, caseData, censusVersions = [] }) {
  const queryClient = useQueryClient();

  const workspaceQuery = useQuery({
    queryKey: ["txquote-workspace", caseData?.id],
    enabled: open && !!caseData?.id,
    queryFn: async () => {
      const txQuoteCase = await ensureTxQuoteWorkspace(caseData, censusVersions);
      const [employerProfile, currentPlan, contribution, claims, destinations, supportingDocuments, readinessResults, submissions, contacts] = await Promise.all([
        base44.entities.TxQuoteEmployerProfile.filter({ txquote_case_id: txQuoteCase.id }, "-created_date", 1).then((items) => items[0] || null),
        base44.entities.TxQuoteCurrentPlanInfo.filter({ txquote_case_id: txQuoteCase.id }, "-created_date", 1).then((items) => items[0] || null),
        base44.entities.TxQuoteContributionStrategy.filter({ txquote_case_id: txQuoteCase.id }, "-created_date", 1).then((items) => items[0] || null),
        base44.entities.TxQuoteClaimsRequirement.filter({ txquote_case_id: txQuoteCase.id }, "-created_date", 1).then((items) => items[0] || null),
        base44.entities.TxQuoteDestination.filter({ txquote_case_id: txQuoteCase.id }, "destination_code", 20),
        base44.entities.TxQuoteSupportingDocument.filter({ txquote_case_id: txQuoteCase.id }, "-created_date", 100),
        base44.entities.TxQuoteReadinessResult.filter({ txquote_case_id: txQuoteCase.id }, "-created_date", 200),
        base44.entities.TxQuoteSubmissionLog.filter({ txquote_case_id: txQuoteCase.id }, "-created_date", 200),
        base44.entities.TxQuoteDestinationContact.list("destination_code", 50),
      ]);
      return { txQuoteCase, employerProfile, currentPlan, contribution, claims, destinations, supportingDocuments, readinessResults, submissions, contacts };
    },
  });

  const data = workspaceQuery.data;
  const summary = useMemo(() => buildReadinessSummary(data || {}), [data]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["txquote-workspace", caseData?.id] });

  const saveEmployer = useMutation({
    mutationFn: (payload) => base44.entities.TxQuoteEmployerProfile.update(data.employerProfile.id, payload),
    onSuccess: refresh,
  });
  const saveCurrentPlan = useMutation({
    mutationFn: (payload) => base44.entities.TxQuoteCurrentPlanInfo.update(data.currentPlan.id, payload),
    onSuccess: refresh,
  });
  const saveContribution = useMutation({
    mutationFn: (payload) => base44.entities.TxQuoteContributionStrategy.update(data.contribution.id, payload),
    onSuccess: refresh,
  });
  const saveClaims = useMutation({
    mutationFn: (payload) => base44.entities.TxQuoteClaimsRequirement.update(data.claims.id, payload),
    onSuccess: refresh,
  });
  const validateMutation = useMutation({
    mutationFn: () => base44.functions.invoke("validateTxQuote", { txQuoteCaseId: data.txQuoteCase.id }),
    onSuccess: refresh,
  });
  const sendMutation = useMutation({
    mutationFn: () => base44.functions.invoke("sendTxQuoteV2", { txQuoteCaseId: data.txQuoteCase.id }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["txquote-workspace", caseData?.id] }),
        queryClient.invalidateQueries({ queryKey: ["case", caseData?.id] }),
        queryClient.invalidateQueries({ queryKey: ["activity", caseData?.id] }),
      ]);
    },
  });
  const resendMutation = useMutation({
    mutationFn: (destinationCode) => base44.functions.invoke("sendTxQuoteV2", { txQuoteCaseId: data.txQuoteCase.id, destinationCode }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["txquote-workspace", caseData?.id] }),
        queryClient.invalidateQueries({ queryKey: ["case", caseData?.id] }),
        queryClient.invalidateQueries({ queryKey: ["activity", caseData?.id] }),
      ]);
    },
  });

  const handleDestinationToggle = async (destination, checked) => {
    const defaultTo = data.contacts.find((item) => item.destination_code === destination.destination_code && item.contact_type === "to" && item.is_default && item.is_active);
    const defaultCc = data.contacts.find((item) => item.destination_code === destination.destination_code && item.contact_type === "cc" && item.is_default && item.is_active);
    await base44.entities.TxQuoteDestination.update(destination.id, {
      is_selected: !!checked,
      email_to: defaultTo?.email || destination.email_to,
      email_cc: defaultCc?.email || destination.email_cc,
    });
    refresh();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>TxQuote Workspace</DialogTitle>
          <DialogDescription>Complete missing level-funded quote requirements, validate readiness, and send to Triad, SUS, and AST.</DialogDescription>
        </DialogHeader>

        {!data ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading TxQuote workspace...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-4">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Readiness</p><p className="text-2xl font-semibold">{summary.score}%</p><Badge className="mt-2" variant={summary.status === "ready" ? "default" : "secondary"}>{summary.status}</Badge></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Missing Errors</p><p className="text-2xl font-semibold">{summary.errorCount}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Conditional Items</p><p className="text-2xl font-semibold">{summary.conditionalCount}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Destinations Selected</p><p className="text-2xl font-semibold">{summary.selectedDestinationCount}</p></CardContent></Card>
            </div>

            <SectionCard title="A — Quote Destinations" action={<Button variant="outline" size="sm" onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>{validateMutation.isPending ? "Validating..." : "Validate"}</Button>}>
              <div className="grid gap-3 md:grid-cols-3">
                {data.destinations.map((destination) => (
                  <div key={destination.id} className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{destination.destination_name}</p>
                        <p className="text-xs text-muted-foreground">{destination.destination_code}</p>
                      </div>
                      <Checkbox checked={destination.is_selected} onCheckedChange={(checked) => handleDestinationToggle(destination, checked)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">Readiness: {destination.readiness_status}</Badge>
                      <Badge variant={destination.sent_status === "sent" ? "default" : destination.sent_status === "failed" ? "destructive" : "secondary"}>Send: {destination.sent_status}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground">To:</span> {destination.email_to || "Not set"}</div>
                      <div><span className="text-muted-foreground">CC:</span> {destination.email_cc || "—"}</div>
                      <div><span className="text-muted-foreground">Sent:</span> {destination.sent_at ? new Date(destination.sent_at).toLocaleString() : "Not yet"}</div>
                    </div>
                    {(destination.sent_status === "sent" || destination.sent_status === "failed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resendMutation.mutate(destination.destination_code)}
                        disabled={resendMutation.isPending}
                      >
                        {resendMutation.isPending ? "Resending..." : `Resend to ${destination.destination_code}`}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-4 lg:grid-cols-2">
              <SectionCard title="B — Employer Profile">
                <div className="grid gap-3 md:grid-cols-2">
                  <div><Label>Legal Company Name</Label><Input defaultValue={data.employerProfile?.legal_company_name || ""} onBlur={(e) => saveEmployer.mutate({ legal_company_name: e.target.value })} /></div>
                  <div><Label>DBA Name</Label><Input defaultValue={data.employerProfile?.dba_name || ""} onBlur={(e) => saveEmployer.mutate({ dba_name: e.target.value })} /></div>
                  <div><Label>Primary Contact Name</Label><Input defaultValue={data.employerProfile?.primary_contact_name || ""} onBlur={(e) => saveEmployer.mutate({ primary_contact_name: e.target.value })} /></div>
                  <div><Label>Primary Contact Email</Label><Input defaultValue={data.employerProfile?.primary_contact_email || ""} onBlur={(e) => saveEmployer.mutate({ primary_contact_email: e.target.value })} /></div>
                  <div><Label>Eligible Employee Count</Label><Input type="number" defaultValue={data.employerProfile?.eligible_employee_count ?? ""} onBlur={(e) => saveEmployer.mutate({ eligible_employee_count: Number(e.target.value || 0) })} /></div>
                  <div><Label>Enrolling Employee Count</Label><Input type="number" defaultValue={data.employerProfile?.enrolling_employee_count ?? ""} onBlur={(e) => {
                    const enrolling = Number(e.target.value || 0);
                    saveEmployer.mutate({ enrolling_employee_count: enrolling });
                    saveContribution.mutate({ participation_percent: computeParticipationPercent(data.employerProfile?.eligible_employee_count, enrolling, data.contribution?.valid_waiver_count) });
                  }} /></div>
                </div>
              </SectionCard>

              <SectionCard title="C — Current Plan Info">
                <div className="grid gap-3 md:grid-cols-2">
                  <div><Label>Current Carrier</Label><Input defaultValue={data.currentPlan?.current_carrier || ""} onBlur={(e) => saveCurrentPlan.mutate({ current_carrier: e.target.value })} /></div>
                  <div><Label>Current Plan Name</Label><Input defaultValue={data.currentPlan?.current_plan_name || ""} onBlur={(e) => saveCurrentPlan.mutate({ current_plan_name: e.target.value })} /></div>
                  <div><Label>Renewal Date</Label><Input type="date" defaultValue={data.currentPlan?.renewal_date || ""} onBlur={(e) => saveCurrentPlan.mutate({ renewal_date: e.target.value })} /></div>
                  <div><Label>Network Type</Label><Input defaultValue={data.currentPlan?.network_type || ""} onBlur={(e) => saveCurrentPlan.mutate({ network_type: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Plan Design Notes</Label><Textarea defaultValue={data.currentPlan?.current_plan_design_notes || ""} onBlur={(e) => saveCurrentPlan.mutate({ current_plan_design_notes: e.target.value })} /></div>
                </div>
              </SectionCard>

              <SectionCard title="D — Contribution Strategy">
                <div className="grid gap-3 md:grid-cols-2">
                  <div><Label>Contribution Type</Label><Input defaultValue={data.contribution?.employer_contribution_type || ""} onBlur={(e) => saveContribution.mutate({ employer_contribution_type: e.target.value })} /></div>
                  <div><Label>EE % Contribution</Label><Input type="number" defaultValue={data.contribution?.contribution_percent_employee_only ?? ""} onBlur={(e) => saveContribution.mutate({ contribution_percent_employee_only: Number(e.target.value || 0) })} /></div>
                  <div><Label>Family % Contribution</Label><Input type="number" defaultValue={data.contribution?.contribution_percent_family ?? ""} onBlur={(e) => saveContribution.mutate({ contribution_percent_family: Number(e.target.value || 0) })} /></div>
                  <div><Label>Valid Waivers</Label><Input type="number" defaultValue={data.contribution?.valid_waiver_count ?? ""} onBlur={(e) => {
                    const waivers = Number(e.target.value || 0);
                    saveContribution.mutate({
                      valid_waiver_count: waivers,
                      participation_percent: computeParticipationPercent(data.employerProfile?.eligible_employee_count, data.employerProfile?.enrolling_employee_count, waivers),
                    });
                  }} /></div>
                  <div><Label>Participation %</Label><Input value={data.contribution?.participation_percent ?? 0} readOnly /></div>
                  <div className="md:col-span-2"><Label>Notes</Label><Textarea defaultValue={data.contribution?.contribution_notes || ""} onBlur={(e) => saveContribution.mutate({ contribution_notes: e.target.value })} /></div>
                </div>
              </SectionCard>

              <SectionCard title="E — Claims & Underwriting">
                <div className="grid gap-3 md:grid-cols-2">
                  <div><Label>Total Enrolled Count</Label><Input type="number" defaultValue={data.claims?.total_enrolled_count ?? ""} onBlur={(e) => saveClaims.mutate({ total_enrolled_count: Number(e.target.value || 0) })} /></div>
                  <div><Label>Claims Months Required</Label><Input type="number" defaultValue={data.claims?.claims_months_required ?? ""} onBlur={(e) => saveClaims.mutate({ claims_months_required: Number(e.target.value || 0) })} /></div>
                  <div className="flex items-center gap-2 pt-7"><Checkbox checked={!!data.claims?.claims_received} onCheckedChange={(checked) => saveClaims.mutate({ claims_received: !!checked })} /><Label>Claims Received</Label></div>
                  <div className="md:col-span-2"><Label>Underwriting Notes</Label><Textarea defaultValue={data.claims?.underwriting_risk_notes || ""} onBlur={(e) => saveClaims.mutate({ underwriting_risk_notes: e.target.value })} /></div>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="F — Destination Progress">
              <div className="grid gap-3 md:grid-cols-3 mb-4">
                {data.destinations.filter((destination) => destination.is_selected).map((destination) => (
                  <TxQuoteDestinationProgressCard
                    key={destination.id}
                    destination={destination}
                    readinessResults={data.readinessResults}
                  />
                ))}
              </div>
              {data.destinations.filter((destination) => destination.is_selected).length === 0 && (
                <p className="text-sm text-muted-foreground mb-4">Select one or more destinations to see destination-level progress.</p>
              )}
            </SectionCard>

            <SectionCard title="G — Readiness Results">
              <div className="space-y-2">
                {data.readinessResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Run validation to see readiness checks.</p>
                ) : data.readinessResults.map((result) => (
                  <div key={result.id} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{result.validator_name}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{result.field_path || "General"}{result.destination_code ? ` • ${result.destination_code}` : ""}</p>
                    </div>
                    <Badge variant={result.status === "fail" ? "destructive" : "secondary"}>{result.severity} / {result.status}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="H — Submission History">
              <div className="space-y-2">
                {data.submissions.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : data.submissions.map((submission) => (
                  <div key={submission.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{submission.destination_code} • {submission.delivery_status}</p>
                      <p className="text-sm text-muted-foreground">{submission.subject_line}</p>
                      <p className="text-xs text-muted-foreground mt-1">{submission.sent_at ? new Date(submission.sent_at).toLocaleString() : ""}</p>
                    </div>
                    <Badge variant={submission.delivery_status === "sent" ? "default" : "destructive"}>{submission.delivery_status}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button variant="outline" onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>{validateMutation.isPending ? "Validating..." : "Validate Readiness"}</Button>
              <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending || summary.status !== "ready"}>{sendMutation.isPending ? "Sending..." : "Send TxQuote"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}