import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, Calculator, Plus, Trash2, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

// ACA affordability threshold 2026 (estimated)
const ACA_THRESHOLD_PCT = 9.02;

function ModelCard({ model, onDelete }) {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (data) => base44.entities.ContributionModel.update(model.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contribution-models"] }),
  });

  const [ee, setEe] = useState(model.ee_contribution_pct ?? 80);
  const [dep, setDep] = useState(model.dep_contribution_pct ?? 50);

  // Compute metrics
  const totalPremium = model.total_monthly_premium || 0;
  const avgEEPremium = totalPremium / (model.total_ee_count || 1);
  const employerPaysEE = (ee / 100) * avgEEPremium;
  const employeePaysEE = avgEEPremium - employerPaysEE;
  const totalEmployerCost = employerPaysEE * (model.total_ee_count || 0);

  // ACA affordability check: employee cost must be < 9.02% of household income
  // Use $60k median as proxy
  const medianAnnualIncome = 60000;
  const affordabilityMax = (medianAnnualIncome * (ACA_THRESHOLD_PCT / 100)) / 12;
  const acaSafe = employeePaysEE <= affordabilityMax;

  const handleSave = () => {
    update.mutate({
      ee_contribution_pct: ee,
      dep_contribution_pct: dep,
      total_monthly_employer_cost: totalEmployerCost,
      total_monthly_employee_cost: employeePaysEE * (model.total_ee_count || 0),
      aca_affordability_flag: !acaSafe,
    });
  };

  return (
    <Card className="border-2 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{model.name}</CardTitle>
          <div className="flex items-center gap-2">
            {acaSafe ? (
              <Badge className="bg-green-100 text-green-700 text-[10px]"><CheckCircle className="w-3 h-3 mr-1" />ACA Safe</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 text-[10px]"><AlertCircle className="w-3 h-3 mr-1" />ACA Risk</Badge>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(model.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground capitalize">{model.strategy?.replace(/_/g, " ")} strategy</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* EE Contribution Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs">Employer pays EE premium</Label>
            <span className="text-sm font-bold text-primary">{ee}%</span>
          </div>
          <Slider value={[ee]} onValueChange={([v]) => setEe(v)} min={0} max={100} step={5} className="mb-1" />
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>0%</span><span>50%</span><span>100%</span></div>
        </div>

        {/* Dep Contribution Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs">Employer pays Dependent premium</Label>
            <span className="text-sm font-bold text-primary">{dep}%</span>
          </div>
          <Slider value={[dep]} onValueChange={([v]) => setDep(v)} min={0} max={100} step={5} className="mb-1" />
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>0%</span><span>50%</span><span>100%</span></div>
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-[10px] text-muted-foreground mb-1">Employer/mo</p>
            <p className="text-lg font-bold text-blue-700">${totalEmployerCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <p className="text-[10px] text-muted-foreground mb-1">Avg EE cost/mo</p>
            <p className="text-lg font-bold">${employeePaysEE.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        {!acaSafe && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">Employee cost exceeds ACA affordability threshold ({ACA_THRESHOLD_PCT}% of income). Consider increasing EE contribution.</p>
          </div>
        )}

        <Button size="sm" className="w-full" onClick={handleSave} disabled={update.isPending}>
          <Calculator className="w-3.5 h-3.5 mr-1.5" />{update.isPending ? "Saving..." : "Save Model"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateModelModal({ scenarios, onClose, onCreated }) {
  const [form, setForm] = useState({ name: "Model A", scenario_id: "", strategy: "percentage", ee_contribution_pct: 80, dep_contribution_pct: 50 });
  const create = useMutation({
    mutationFn: () => base44.entities.ContributionModel.create({ ...form, case_id: scenarios.find(s => s.id === form.scenario_id)?.case_id || "" }),
    onSuccess: () => { onCreated(); onClose(); },
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>New Contribution Model</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="mt-1.5" /></div>
          <div>
            <Label>Quote Scenario</Label>
            <Select value={form.scenario_id} onValueChange={v => set("scenario_id", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select scenario..." /></SelectTrigger>
              <SelectContent>{scenarios.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Strategy</Label>
            <Select value={form.strategy} onValueChange={v => set("strategy", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage of Premium</SelectItem>
                <SelectItem value="flat_dollar">Flat Dollar</SelectItem>
                <SelectItem value="defined_contribution">Defined Contribution</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={() => create.mutate()} disabled={!form.scenario_id || create.isPending}>{create.isPending ? "Creating..." : "Create"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ContributionModeling() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["contribution-models"],
    queryFn: () => base44.entities.ContributionModel.list("-created_date", 50),
  });

  const { data: scenarios = [] } = useQuery({
    queryKey: ["scenarios-all"],
    queryFn: () => base44.entities.QuoteScenario.list("-created_date", 100),
  });

  const deleteModel = useMutation({
    mutationFn: (id) => base44.entities.ContributionModel.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contribution-models"] }),
  });

  const acaFlags = models.filter(m => m.aca_affordability_flag);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contribution Modeling"
        description={`Model employer contribution strategies with ACA affordability analysis`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Model
          </Button>
        }
      />

      {acaFlags.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-700">{acaFlags.length} model(s) flagged for ACA affordability risk</p>
            <p className="text-xs text-red-600 mt-0.5">Employee contributions may exceed the {ACA_THRESHOLD_PCT}% income threshold. Review and adjust employer contributions.</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : models.length === 0 ? (
        <EmptyState icon={Calculator} title="No Contribution Models" description="Create a model to analyze employer contribution strategies and ACA affordability" actionLabel="New Model" onAction={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(m => (
            <ModelCard key={m.id} model={m} onDelete={(id) => deleteModel.mutate(id)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModelModal
          scenarios={scenarios}
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["contribution-models"] })}
        />
      )}
    </div>
  );
}