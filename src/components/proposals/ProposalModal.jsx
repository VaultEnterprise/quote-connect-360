import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import {AlertTriangle,  Info } from "lucide-react";

export default function ProposalModal({ open, onClose, proposal }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEdit = !!proposal;

  const [form, setForm] = useState({
    title: proposal?.title || "",
    case_id: proposal?.case_id || "",
    scenario_id: proposal?.scenario_id || "",
    cover_message: proposal?.cover_message || "",
    broker_name: proposal?.broker_name || user?.full_name || "",
    broker_email: proposal?.broker_email || user?.email || "",
    agency_name: proposal?.agency_name || "",
    expires_at: proposal?.expires_at ? proposal.expires_at.split("T")[0] : "",
    notes: proposal?.notes || "",
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios-for-case", form.case_id],
    queryFn: () => base44.entities.QuoteScenario.filter({ case_id: form.case_id }),
    enabled: !!form.case_id,
  });

  const { data: scenarioPlans = [] } = useQuery({
    queryKey: ["scenario-plans-proposal", form.scenario_id],
    queryFn: () => base44.entities.ScenarioPlan.filter({ scenario_id: form.scenario_id }),
    enabled: !!form.scenario_id,
  });

  const selectedCase = cases.find(c => c.id === form.case_id);
  const selectedScenario = scenarios.find(s => s.id === form.scenario_id);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        employer_name: selectedCase?.employer_name || proposal?.employer_name || "",
        effective_date: selectedCase?.effective_date || proposal?.effective_date || "",
        plan_summary: scenarioPlans.map(sp => ({
          plan_name: sp.plan_name,
          carrier: sp.carrier,
          plan_type: sp.plan_type,
          network_type: sp.network_type,
        })),
        total_monthly_premium: selectedScenario?.total_monthly_premium || proposal?.total_monthly_premium || null,
        employer_monthly_cost: selectedScenario?.employer_monthly_cost || proposal?.employer_monthly_cost || null,
        employee_avg_cost: selectedScenario?.employee_monthly_cost_avg || proposal?.employee_avg_cost || null,
        contribution_summary: selectedScenario ? {
          strategy: selectedScenario.contribution_strategy,
          ee_pct: selectedScenario.employer_contribution_ee,
          dep_pct: selectedScenario.employer_contribution_dep,
        } : proposal?.contribution_summary || null,
        // Increment version on edits that re-link a scenario
        version: isEdit && form.scenario_id !== proposal?.scenario_id
          ? (proposal.version || 1) + 1
          : (proposal?.version || 1),
        status: isEdit ? proposal.status : "draft",
      };
      return isEdit
        ? base44.entities.Proposal.update(proposal.id, payload)
        : base44.entities.Proposal.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      onClose();
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* PROPOSAL_LOCK — warn if editing a sent proposal */}
        {proposal?.status === 'sent' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Warning:</strong> This proposal has already been sent.
              Editing it will change what the employer sees. Consider creating a new version instead.
            </p>
          </div>
        )}
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Proposal — v${proposal.version || 1}` : "New Proposal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">

          <div>
            <Label>Proposal Title <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              className="mt-1.5"
              placeholder="e.g. 2026 Benefit Options for ABC Corp"
            />
          </div>

          <div>
            <Label>Case <span className="text-destructive">*</span></Label>
            <Select value={form.case_id} onValueChange={v => { set("case_id", v); set("scenario_id", ""); }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select case..." /></SelectTrigger>
              <SelectContent>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.employer_name} — {c.case_number || c.id.slice(-6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.case_id && (
            <div>
              <Label>Quote Scenario</Label>
              <Select value={form.scenario_id} onValueChange={v => set("scenario_id", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select scenario..." /></SelectTrigger>
                <SelectContent>
                  {scenarios.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {isEdit && form.scenario_id !== proposal?.scenario_id && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Changing the scenario will increment the version number.
                </p>
              )}
            </div>
          )}

          {scenarioPlans.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/40 border">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Plans in this scenario ({scenarioPlans.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {scenarioPlans.map(sp => (
                  <span key={sp.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {sp.plan_name}
                  </span>
                ))}
              </div>
              {selectedScenario?.total_monthly_premium && (
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total/mo</p>
                    <p className="text-sm font-bold">${selectedScenario.total_monthly_premium.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Employer/mo</p>
                    <p className="text-sm font-bold">${(selectedScenario.employer_monthly_cost || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Avg EE/mo</p>
                    <p className="text-sm font-bold">${(selectedScenario.employee_monthly_cost_avg || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <Label>Cover Message</Label>
            <Textarea
              value={form.cover_message}
              onChange={e => set("cover_message", e.target.value)}
              className="mt-1.5"
              placeholder="Add a personalized note to the employer..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Broker Name</Label>
              <Input value={form.broker_name} onChange={e => set("broker_name", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Broker Email</Label>
              <Input value={form.broker_email} onChange={e => set("broker_email", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label>Agency Name</Label>
            <Input value={form.agency_name} onChange={e => set("agency_name", e.target.value)} className="mt-1.5" placeholder="Your agency name" />
          </div>

          <div>
            <Label>Proposal Expiry Date</Label>
            <Input type="date" value={form.expires_at} onChange={e => set("expires_at", e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label>Internal Notes</Label>
            <Textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              className="mt-1.5"
              placeholder="Internal notes (not shown to employer)..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!form.title || !form.case_id || save.isPending}
          >
            {save.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}