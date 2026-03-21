import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";

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
    expires_at: proposal?.expires_at || "",
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
        employer_name: selectedCase?.employer_name || "",
        effective_date: selectedCase?.effective_date || "",
        plan_summary: scenarioPlans.map(sp => ({ plan_name: sp.plan_name, carrier: sp.carrier, plan_type: sp.plan_type, network_type: sp.network_type })),
        total_monthly_premium: selectedScenario?.total_monthly_premium || null,
        employer_monthly_cost: selectedScenario?.employer_monthly_cost || null,
        employee_avg_cost: selectedScenario?.employee_monthly_cost_avg || null,
        version: proposal?.version || 1,
        status: "draft",
      };
      return isEdit ? base44.entities.Proposal.update(proposal.id, payload) : base44.entities.Proposal.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["proposals"] }); onClose(); },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Proposal" : "New Proposal"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div><Label>Proposal Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1.5" placeholder="e.g. 2026 Benefit Options for ABC Corp" /></div>
          <div>
            <Label>Case <span className="text-destructive">*</span></Label>
            <Select value={form.case_id} onValueChange={v => { set("case_id", v); set("scenario_id", ""); }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select case..." /></SelectTrigger>
              <SelectContent>{cases.map(c => <SelectItem key={c.id} value={c.id}>{c.employer_name} — {c.case_number || c.id.slice(-6)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {form.case_id && (
            <div>
              <Label>Quote Scenario</Label>
              <Select value={form.scenario_id} onValueChange={v => set("scenario_id", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select scenario..." /></SelectTrigger>
                <SelectContent>{scenarios.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Cover Message / Note to Employer</Label><Textarea value={form.cover_message} onChange={e => set("cover_message", e.target.value)} className="mt-1.5" placeholder="Add a personalized message to include with the proposal..." rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Broker Name</Label><Input value={form.broker_name} onChange={e => set("broker_name", e.target.value)} className="mt-1.5" /></div>
            <div><Label>Broker Email</Label><Input value={form.broker_email} onChange={e => set("broker_email", e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label>Expires On</Label><Input type="date" value={form.expires_at} onChange={e => set("expires_at", e.target.value)} className="mt-1.5" /></div>
          {scenarioPlans.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/40 border">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Plans in this proposal ({scenarioPlans.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {scenarioPlans.map(sp => <span key={sp.id} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{sp.plan_name}</span>)}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.title || !form.case_id || save.isPending}>{save.isPending ? "Saving..." : isEdit ? "Save" : "Create Proposal"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}