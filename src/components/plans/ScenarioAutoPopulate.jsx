import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ScenarioAutoPopulate({ selectedPlans = [], open, onClose }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [caseId, setCaseId] = useState("");
  const [mode, setMode] = useState("individual"); // individual | bulk_comparison

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-for-scenario"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 50),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!caseId) throw new Error("Select a case");
      if (mode === "individual") {
        // Create one scenario per plan
        for (const plan of selectedPlans) {
          const scenario = await base44.entities.QuoteScenario.create({
            case_id: caseId,
            name: `${plan.plan_name} Scenario`,
            description: `Auto-generated from Plan Library — ${plan.carrier} ${plan.network_type}`,
            products_included: [plan.plan_type],
            carriers_included: [plan.carrier],
            status: "draft",
          });
          await base44.entities.ScenarioPlan.create({
            scenario_id: scenario.id, case_id: caseId, plan_id: plan.id,
            plan_name: plan.plan_name, carrier: plan.carrier,
            plan_type: plan.plan_type, network_type: plan.network_type,
            employer_contribution_ee: 100, employer_contribution_dep: 50,
          });
        }
      } else {
        // Bulk comparison — single scenario with all plans
        const scenario = await base44.entities.QuoteScenario.create({
          case_id: caseId,
          name: `Comparison: ${selectedPlans.map(p => p.carrier).filter((v,i,a) => a.indexOf(v) === i).join(" vs ")}`,
          description: `Bulk comparison of ${selectedPlans.length} plans from Plan Library`,
          products_included: [...new Set(selectedPlans.map(p => p.plan_type))],
          carriers_included: [...new Set(selectedPlans.map(p => p.carrier))],
          status: "draft",
        });
        for (const plan of selectedPlans) {
          await base44.entities.ScenarioPlan.create({
            scenario_id: scenario.id, case_id: caseId, plan_id: plan.id,
            plan_name: plan.plan_name, carrier: plan.carrier, plan_type: plan.plan_type,
          });
        }
      }
      qc.invalidateQueries({ queryKey: ["quote-scenarios"] });
    },
    onSuccess: () => { toast.success(`${mode === "bulk_comparison" ? "1 comparison" : selectedPlans.length} scenario(s) created`); onClose(); },
  });

  const selectedCase = cases.find(c => c.id === caseId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Scenario Auto-Populate
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Plans summary */}
          <div>
            <p className="text-xs font-medium mb-2">Selected Plans ({selectedPlans.length})</p>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {selectedPlans.map(p => (
                <Badge key={p.id} variant="outline" className="text-xs">{p.plan_name}</Badge>
              ))}
            </div>
          </div>

          {/* Case selector */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Target Case</label>
            <Select value={caseId} onValueChange={setCaseId}>
              <SelectTrigger><SelectValue placeholder="Select a case..." /></SelectTrigger>
              <SelectContent>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.employer_name || c.case_number} — {c.case_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode */}
          <div>
            <label className="text-xs font-medium mb-1.5 block">Generation Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setMode("individual")} className={`p-2.5 rounded-lg border text-xs text-left transition-all ${mode === "individual" ? "border-primary bg-primary/5" : "border-border"}`}>
                <p className="font-medium">Individual</p>
                <p className="text-muted-foreground">1 scenario per plan</p>
              </button>
              <button onClick={() => setMode("bulk_comparison")} className={`p-2.5 rounded-lg border text-xs text-left transition-all ${mode === "bulk_comparison" ? "border-primary bg-primary/5" : "border-border"}`}>
                <p className="font-medium">Bulk Comparison</p>
                <p className="text-muted-foreground">All plans in 1 scenario</p>
              </button>
            </div>
          </div>

          <Button className="w-full gap-2" onClick={() => createMutation.mutate()} disabled={!caseId || selectedPlans.length === 0 || createMutation.isPending}>
            <Zap className="w-3.5 h-3.5" />
            {mode === "individual" ? `Create ${selectedPlans.length} Scenario(s)` : "Create Comparison Scenario"}
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}