import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PLAN_TYPES = ["medical","dental","vision","life","std","ltd","voluntary"];
const NETWORK_TYPES = ["HMO","PPO","EPO","HDHP","POS","indemnity","other"];
const CARRIERS = ["Aetna","Anthem","BlueCross BlueShield","Cigna","Humana","Kaiser","UnitedHealthcare","Other"];

export default function PlanFormModal({ plan, open, onClose, defaultType = "medical" }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    plan_type: plan?.plan_type || defaultType,
    carrier: plan?.carrier || "",
    plan_name: plan?.plan_name || "",
    plan_code: plan?.plan_code || "",
    network_type: plan?.network_type || "",
    state: plan?.state || "",
    effective_date: plan?.effective_date || "",
    deductible_individual: plan?.deductible_individual ?? "",
    deductible_family: plan?.deductible_family ?? "",
    oop_max_individual: plan?.oop_max_individual ?? "",
    oop_max_family: plan?.oop_max_family ?? "",
    copay_pcp: plan?.copay_pcp ?? "",
    copay_specialist: plan?.copay_specialist ?? "",
    copay_er: plan?.copay_er ?? "",
    coinsurance: plan?.coinsurance ?? "",
    rx_tier1: plan?.rx_tier1 ?? "",
    rx_tier2: plan?.rx_tier2 ?? "",
    rx_tier3: plan?.rx_tier3 ?? "",
    rx_tier4: plan?.rx_tier4 ?? "",
    hsa_eligible: plan?.hsa_eligible || false,
    notes: plan?.notes || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const numFields = ["deductible_individual","deductible_family","oop_max_individual","oop_max_family","copay_pcp","copay_specialist","copay_er","coinsurance","rx_tier1","rx_tier2","rx_tier3","rx_tier4"];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form };
      numFields.forEach(k => { if (payload[k] !== "") payload[k] = parseFloat(payload[k]); else delete payload[k]; });
      if (plan?.id) return base44.entities.BenefitPlan.update(plan.id, payload);
      return base44.entities.BenefitPlan.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
      onClose();
    },
  });

  const isMedical = form.plan_type === "medical";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Add Plan to Library"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Plan Details</TabsTrigger>
            {isMedical && <TabsTrigger value="benefits" className="flex-1">Benefits</TabsTrigger>}
            <TabsTrigger value="rx" className="flex-1">Rx / Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan Type *</Label>
                <Select value={form.plan_type} onValueChange={v => set("plan_type", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLAN_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t.toUpperCase()}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Carrier *</Label>
                <Input
                  className="mt-1"
                  value={form.carrier}
                  onChange={e => set("carrier", e.target.value)}
                  placeholder="Select or type carrier name"
                  list="carrier-options"
                />
                <datalist id="carrier-options">
                  {CARRIERS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="col-span-2">
                <Label>Plan Name *</Label>
                <Input className="mt-1" value={form.plan_name} onChange={e => set("plan_name", e.target.value)} placeholder="e.g. Gold PPO 1000" />
              </div>
              <div>
                <Label>Plan Code</Label>
                <Input className="mt-1" value={form.plan_code} onChange={e => set("plan_code", e.target.value)} placeholder="e.g. MED-G-1000" />
              </div>
              {isMedical && (
                <div>
                  <Label>Network Type</Label>
                  <Select value={form.network_type} onValueChange={v => set("network_type", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select network" /></SelectTrigger>
                    <SelectContent>{NETWORK_TYPES.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>State</Label>
                <Input className="mt-1" value={form.state} onChange={e => set("state", e.target.value)} placeholder="e.g. CA" maxLength={2} />
              </div>
              <div>
                <Label>Effective Date</Label>
                <Input className="mt-1" type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} />
              </div>
              {isMedical && (
                <div className="col-span-2 flex items-center gap-3">
                  <Switch checked={form.hsa_eligible} onCheckedChange={v => set("hsa_eligible", v)} id="hsa" />
                  <Label htmlFor="hsa" className="cursor-pointer">HSA Eligible</Label>
                </div>
              )}
            </div>
          </TabsContent>

          {isMedical && (
            <TabsContent value="benefits" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["deductible_individual","Individual Deductible","$"],
                  ["deductible_family","Family Deductible","$"],
                  ["oop_max_individual","Individual OOP Max","$"],
                  ["oop_max_family","Family OOP Max","$"],
                  ["copay_pcp","PCP Copay","$"],
                  ["copay_specialist","Specialist Copay","$"],
                  ["copay_er","ER Copay","$"],
                  ["coinsurance","Coinsurance","%"],
                ].map(([key, label, prefix]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
                      <Input className="pl-6" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="0" type="number" />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="rx" className="space-y-4 mt-4">
            {isMedical && (
              <div className="grid grid-cols-2 gap-3">
                {[["rx_tier1","Tier 1 (Generic)"],["rx_tier2","Tier 2 (Preferred Brand)"],["rx_tier3","Tier 3 (Non-Preferred)"],["rx_tier4","Tier 4 (Specialty)"]].map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input className="pl-6" value={form[key]} onChange={e => set(key, e.target.value)} placeholder="0" type="number" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any additional plan notes..." rows={4} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.plan_name || !form.carrier}>
            {saveMutation.isPending ? "Saving..." : plan ? "Save Changes" : "Add to Library"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}