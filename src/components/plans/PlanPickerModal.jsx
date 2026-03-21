import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, CheckCircle2, ArrowRightLeft } from "lucide-react";
import PlanCompareDrawer from "./PlanCompareDrawer";

export default function PlanPickerModal({ open, onClose, scenarioId, caseId, alreadyAddedPlanIds = [] }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [selected, setSelected] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [activeTab, setActiveTab] = useState("medical");

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.filter({ status: "active" }, "plan_name", 200),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const creates = selected.map(plan => base44.entities.ScenarioPlan.create({
        scenario_id: scenarioId,
        case_id: caseId,
        plan_id: plan.id,
        plan_name: plan.plan_name,
        carrier: plan.carrier,
        plan_type: plan.plan_type,
        network_type: plan.network_type,
        employer_contribution_ee: 100,
        employer_contribution_dep: 50,
        contribution_type: "percentage",
      }));
      return Promise.all(creates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenario-plans", scenarioId] });
      onClose();
    },
  });

  const filterPlans = (list) => list.filter(p => {
    if (alreadyAddedPlanIds.includes(p.id)) return false;
    const matchSearch = !search || p.plan_name?.toLowerCase().includes(search.toLowerCase()) || p.carrier?.toLowerCase().includes(search.toLowerCase());
    const matchCarrier = carrierFilter === "all" || p.carrier === carrierFilter;
    const matchNetwork = networkFilter === "all" || p.network_type === networkFilter;
    return matchSearch && matchCarrier && matchNetwork;
  });

  const medicalPlans = filterPlans(plans.filter(p => p.plan_type === "medical"));
  const ancillaryPlans = filterPlans(plans.filter(p => p.plan_type !== "medical"));
  const carriers = [...new Set(plans.map(p => p.carrier).filter(Boolean))].sort();

  const toggle = (plan) => {
    setSelected(prev => prev.find(p => p.id === plan.id) ? prev.filter(p => p.id !== plan.id) : [...prev, plan]);
  };
  const isSelected = (id) => selected.some(p => p.id === id);

  const PlanRow = ({ plan }) => (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected(plan.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"}`}
      onClick={() => toggle(plan)}
    >
      <Checkbox checked={isSelected(plan.id)} className="mt-0.5" onCheckedChange={() => toggle(plan)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{plan.plan_name}</span>
          {plan.network_type && <Badge variant="outline" className="text-[10px]">{plan.network_type}</Badge>}
          {plan.hsa_eligible && <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">HSA</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{plan.carrier}{plan.plan_code ? ` · ${plan.plan_code}` : ""}</p>
        {plan.plan_type === "medical" && (
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            {plan.deductible_individual != null && <span>Ded: ${plan.deductible_individual?.toLocaleString()}</span>}
            {plan.oop_max_individual != null && <span>OOP: ${plan.oop_max_individual?.toLocaleString()}</span>}
            {plan.copay_pcp != null && <span>PCP: ${plan.copay_pcp}</span>}
            {plan.coinsurance != null && <span>Coins: {plan.coinsurance}%</span>}
          </div>
        )}
      </div>
      {isSelected(plan.id) && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
    </div>
  );

  return (
    <>
      <Dialog open={open && !showCompare} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Plans to Scenario</DialogTitle>
          </DialogHeader>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search plans..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8 text-sm" />
            </div>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Carrier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                {carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Network" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {["HMO","PPO","EPO","HDHP","POS"].map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="medical">Medical ({medicalPlans.length})</TabsTrigger>
              <TabsTrigger value="ancillary">Ancillary ({ancillaryPlans.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="medical" className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
              {isLoading ? <div className="text-sm text-muted-foreground py-4 text-center">Loading plans...</div>
                : medicalPlans.length === 0 ? <div className="text-sm text-muted-foreground py-8 text-center">No medical plans found. Add plans to your library first.</div>
                : medicalPlans.map(p => <PlanRow key={p.id} plan={p} />)}
            </TabsContent>
            <TabsContent value="ancillary" className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
              {isLoading ? <div className="text-sm text-muted-foreground py-4 text-center">Loading plans...</div>
                : ancillaryPlans.length === 0 ? <div className="text-sm text-muted-foreground py-8 text-center">No ancillary plans found.</div>
                : ancillaryPlans.map(p => <PlanRow key={p.id} plan={p} />)}
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <span className="text-xs text-muted-foreground">{selected.length} plan(s) selected</span>
            <div className="flex gap-2">
              {selected.length >= 2 && (
                <Button variant="outline" size="sm" onClick={() => setShowCompare(true)}>
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> Compare
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" disabled={selected.length === 0 || addMutation.isPending} onClick={() => addMutation.mutate()}>
                {addMutation.isPending ? "Adding..." : `Add ${selected.length || ""} Plan${selected.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showCompare && (
        <PlanCompareDrawer plans={selected} open={showCompare} onClose={() => setShowCompare(false)} onBack={() => setShowCompare(false)} />
      )}
    </>
  );
}