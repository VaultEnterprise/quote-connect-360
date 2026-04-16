import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { validateQuoteScenarioForm } from "@/components/quotes/quoteGovernanceEngine";

const PRODUCTS = ["medical", "dental", "vision", "life", "std", "ltd", "accident", "critical_illness"];
const CARRIERS = ["Anthem", "Blue Cross", "Cigna", "UnitedHealthcare", "Kaiser", "Aetna", "Humana", "Delta Dental", "MetLife", "VSP", "Principal", "Sun Life", "Guardian"];

export default function QuoteScenarioModal({ caseId, scenario, open, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!scenario;

  const { data: caseRecords = [] } = useQuery({
    queryKey: ["quote-scenario-case", caseId],
    queryFn: () => caseId ? base44.entities.BenefitCase.filter({ id: caseId }) : Promise.resolve([]),
    enabled: !!caseId,
  });

  const { data: censusVersions = [] } = useQuery({
    queryKey: ["quote-scenario-census", caseId],
    queryFn: () => caseId ? base44.entities.CensusVersion.filter({ case_id: caseId }) : Promise.resolve([]),
    enabled: !!caseId,
  });

  const caseRecord = caseRecords[0];
  const latestCensus = useMemo(() => [...censusVersions].sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0))[0], [censusVersions]);
  const [form, setForm] = useState({
    name: scenario?.name || "",
    products_included: scenario?.products_included || ["medical"],
    carriers_included: scenario?.carriers_included || [],
    effective_date: scenario?.effective_date || "",
    contribution_strategy: scenario?.contribution_strategy || "percentage",
    employer_contribution_ee: scenario?.employer_contribution_ee ?? 75,
    employer_contribution_dep: scenario?.employer_contribution_dep ?? 50,
    total_monthly_premium: scenario?.total_monthly_premium || "",
    employer_monthly_cost: scenario?.employer_monthly_cost || "",
    plan_count: scenario?.plan_count || "",
    is_recommended: scenario?.is_recommended || false,
    notes: scenario?.notes || "",
  });

  const validation = validateQuoteScenarioForm({ form, caseRecord, latestCensus });

  const save = useMutation({
    mutationFn: async () => {
      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }

      const payload = {
        ...form,
        census_version_id: latestCensus?.id,
        total_monthly_premium: Number(form.total_monthly_premium) || undefined,
        employer_monthly_cost: Number(form.employer_monthly_cost) || undefined,
        employee_monthly_cost_avg: form.total_monthly_premium && form.employer_monthly_cost
          ? Math.max(0, Number(form.total_monthly_premium) - Number(form.employer_monthly_cost))
          : scenario?.employee_monthly_cost_avg,
        plan_count: Number(form.plan_count) || undefined,
      };

      if (isEdit) {
        return base44.entities.QuoteScenario.update(scenario.id, payload);
      }

      return base44.entities.QuoteScenario.create({ ...payload, case_id: caseId, status: "draft" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote-scenarios", caseId] });
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      onClose();
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleProduct = (p) => setForm(prev => ({ ...prev, products_included: prev.products_included.includes(p) ? prev.products_included.filter(x => x !== p) : [...prev.products_included, p] }));
  const toggleCarrier = (c) => setForm(prev => ({ ...prev, carriers_included: prev.carriers_included.includes(c) ? prev.carriers_included.filter(x => x !== c) : [...prev.carriers_included, c] }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Scenario" : "New Quote Scenario"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <Label>Scenario Name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1.5" placeholder="e.g. Scenario A — Anthem PPO + HMO" />
            {latestCensus && (
              <p className="text-xs text-muted-foreground mt-2">Using census version {latestCensus.version_number} for pricing traceability.</p>
            )}
            {!validation.isValid && (
              <p className="text-xs text-destructive mt-2">{validation.errors[0]}</p>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Products Included</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCTS.map(p => (
                <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={form.products_included.includes(p)} onCheckedChange={() => toggleProduct(p)} />
                  <span className="text-sm capitalize">{p.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Carriers</Label>
            <div className="flex flex-wrap gap-2">
              {CARRIERS.map(c => (
                <label key={c} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={form.carriers_included.includes(c)} onCheckedChange={() => toggleCarrier(c)} />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Contribution Strategy</Label>
              <Select value={form.contribution_strategy} onValueChange={v => set("contribution_strategy", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="flat_dollar">Flat Dollar</SelectItem>
                  <SelectItem value="defined_contribution">Defined Contribution</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employer Contribution (EE) {form.contribution_strategy === "percentage" ? "%" : "$"}</Label>
              <Input type="number" value={form.employer_contribution_ee} onChange={e => set("employer_contribution_ee", Number(e.target.value))} className="mt-1.5" />
            </div>
            <div>
              <Label>Employer Contribution (Dep) {form.contribution_strategy === "percentage" ? "%" : "$"}</Label>
              <Input type="number" value={form.employer_contribution_dep} onChange={e => set("employer_contribution_dep", Number(e.target.value))} className="mt-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Total Monthly Premium ($)</Label>
              <Input type="number" value={form.total_monthly_premium} onChange={e => set("total_monthly_premium", e.target.value)} className="mt-1.5" placeholder="0.00" />
            </div>
            <div>
              <Label>Employer Monthly Cost ($)</Label>
              <Input type="number" value={form.employer_monthly_cost} onChange={e => set("employer_monthly_cost", e.target.value)} className="mt-1.5" placeholder="0.00" />
            </div>
            <div>
              <Label>Plan Count</Label>
              <Input type="number" value={form.plan_count} onChange={e => set("plan_count", e.target.value)} className="mt-1.5" placeholder="0" />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} className="mt-1.5" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={form.is_recommended} onCheckedChange={v => set("is_recommended", v)} />
            <span className="text-sm font-medium">Mark as recommended scenario</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>
            {save.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Scenario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}