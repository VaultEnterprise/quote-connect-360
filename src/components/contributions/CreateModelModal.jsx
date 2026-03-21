import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { DollarSign, Info } from "lucide-react";

const STRATEGY_INFO = {
  percentage: "Employer pays a fixed % of each employee's premium. Most common approach.",
  flat_dollar: "Employer contributes a flat dollar amount per employee regardless of plan choice.",
  defined_contribution: "Employer sets a defined budget per employee; they choose plans within that budget.",
  custom: "Complex multi-class rules configured per employee class or tier.",
};

export default function CreateModelModal({ open, onClose, cases, scenarios }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "Model A",
    case_id: "",
    scenario_id: "",
    strategy: "percentage",
    ee_contribution_pct: 80,
    dep_contribution_pct: 50,
    ee_contribution_flat: 0,
    dep_contribution_flat: 0,
    total_ee_count: "",
    total_monthly_premium: "",
    notes: "",
    aca_affordability_threshold: 9.02,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Filter scenarios by selected case
  const filteredScenarios = form.case_id
    ? scenarios.filter(s => s.case_id === form.case_id)
    : scenarios;

  // Auto-populate from scenario
  const handleScenarioSelect = (id) => {
    set("scenario_id", id);
    const s = scenarios.find(sc => sc.id === id);
    if (s) {
      if (s.total_monthly_premium) set("total_monthly_premium", s.total_monthly_premium);
      if (s.employer_contribution_ee) set("ee_contribution_pct", s.employer_contribution_ee);
      if (s.employer_contribution_dep) set("dep_contribution_pct", s.employer_contribution_dep);
    }
  };

  const handleCaseSelect = (caseId) => {
    set("case_id", caseId);
    set("scenario_id", "");
    const c = cases.find(c => c.id === caseId);
    if (c?.employee_count) set("total_ee_count", c.employee_count);
  };

  const createMutation = useMutation({
    mutationFn: () => base44.entities.ContributionModel.create({
      ...form,
      total_ee_count: form.total_ee_count ? Number(form.total_ee_count) : undefined,
      total_monthly_premium: form.total_monthly_premium ? Number(form.total_monthly_premium) : undefined,
      ee_contribution_pct: Number(form.ee_contribution_pct),
      dep_contribution_pct: Number(form.dep_contribution_pct),
      ee_contribution_flat: Number(form.ee_contribution_flat),
      dep_contribution_flat: Number(form.dep_contribution_flat),
      aca_affordability_flag: false,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contribution-models"] });
      onClose();
    },
  });

  const isValid = form.name && form.case_id && form.scenario_id;
  const isPercentage = ["percentage"].includes(form.strategy);
  const isFlat = ["flat_dollar", "defined_contribution"].includes(form.strategy);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Contribution Model</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Name */}
          <div>
            <Label>Model Name *</Label>
            <Input className="mt-1.5" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. 80/50 PPO Option" />
          </div>

          {/* Case */}
          <div>
            <Label>Case *</Label>
            <Select value={form.case_id} onValueChange={handleCaseSelect}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select a case..." /></SelectTrigger>
              <SelectContent>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.employer_name} — {c.case_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scenario */}
          <div>
            <Label>Quote Scenario *</Label>
            <Select value={form.scenario_id} onValueChange={handleScenarioSelect} disabled={!form.case_id}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder={form.case_id ? "Select scenario..." : "Select a case first"} /></SelectTrigger>
              <SelectContent>
                {filteredScenarios.length === 0 ? (
                  <SelectItem value="_none" disabled>No scenarios for this case</SelectItem>
                ) : filteredScenarios.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Employee Count */}
            <div>
              <Label>Employee Count</Label>
              <Input className="mt-1.5" type="number" min={1} value={form.total_ee_count} onChange={e => set("total_ee_count", e.target.value)} placeholder="e.g. 45" />
            </div>
            {/* Monthly Premium */}
            <div>
              <Label>Total Monthly Premium ($)</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input className="pl-8" type="number" min={0} value={form.total_monthly_premium} onChange={e => set("total_monthly_premium", e.target.value)} placeholder="e.g. 18500" />
              </div>
            </div>
          </div>

          {/* Strategy */}
          <div>
            <Label>Contribution Strategy *</Label>
            <Select value={form.strategy} onValueChange={v => set("strategy", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage of Premium</SelectItem>
                <SelectItem value="flat_dollar">Flat Dollar Amount</SelectItem>
                <SelectItem value="defined_contribution">Defined Contribution (ICHRA/QSEHRA)</SelectItem>
                <SelectItem value="custom">Custom / Multi-class</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-start gap-1.5">
              <Info className="w-3 h-3 mt-0.5 shrink-0" />
              {STRATEGY_INFO[form.strategy]}
            </p>
          </div>

          {/* Percentage inputs */}
          {isPercentage && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Employer pays EE premium</Label>
                  <span className="text-sm font-bold text-primary">{form.ee_contribution_pct}%</span>
                </div>
                <Slider
                  value={[form.ee_contribution_pct]} min={0} max={100} step={5}
                  onValueChange={([v]) => set("ee_contribution_pct", v)}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Employer pays Dependent premium</Label>
                  <span className="text-sm font-bold text-primary">{form.dep_contribution_pct}%</span>
                </div>
                <Slider
                  value={[form.dep_contribution_pct]} min={0} max={100} step={5}
                  onValueChange={([v]) => set("dep_contribution_pct", v)}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
              </div>
            </div>
          )}

          {/* Flat dollar inputs */}
          {isFlat && (
            <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg border">
              <div>
                <Label className="text-sm">EE flat amount/mo</Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input className="pl-8" type="number" min={0} value={form.ee_contribution_flat} onChange={e => set("ee_contribution_flat", Number(e.target.value))} placeholder="0" />
                </div>
              </div>
              <div>
                <Label className="text-sm">Dependent flat amount/mo</Label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input className="pl-8" type="number" min={0} value={form.dep_contribution_flat} onChange={e => set("dep_contribution_flat", Number(e.target.value))} placeholder="0" />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1.5" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Rationale, assumptions, HR notes..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!isValid || createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Model"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}