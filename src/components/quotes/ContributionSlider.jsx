import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function ContributionSlider({ scenario, open, onClose }) {
  const [eeContribution, setEeContribution] = useState(scenario?.employer_contribution_ee ?? 80);
  const [depContribution, setDepContribution] = useState(scenario?.employer_contribution_dep ?? 50);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    setEeContribution(scenario?.employer_contribution_ee ?? 80);
    setDepContribution(scenario?.employer_contribution_dep ?? 50);
  }, [scenario?.id, scenario?.employer_contribution_ee, scenario?.employer_contribution_dep]);

  const totalPremium = scenario?.total_monthly_premium || 0;

  const calculations = useMemo(() => {
    const empRate = eeContribution / 100;
    const depRate = depContribution / 100;
    const avgEmpCost = totalPremium * empRate;
    const avgDepCost = totalPremium * depRate;
    const employeeAvgCost = totalPremium * (1 - empRate);

    // ACA affordability check (9.12% of household income)
    const avgHouseholdIncome = 55000; // Mock
    const acaThreshold = (avgHouseholdIncome * 0.0912) / 12;
    const isACAAffordable = employeeAvgCost <= acaThreshold;

    return {
      employerCostEE: avgEmpCost,
      employerCostDep: avgDepCost,
      employeeAvgCost,
      acaThreshold,
      isACAAffordable,
    };
  }, [eeContribution, depContribution, totalPremium]);

  const saveContribution = useMutation({
    mutationFn: async () => {
      await base44.entities.QuoteScenario.update(scenario.id, {
        employer_contribution_ee: eeContribution,
        employer_contribution_dep: depContribution,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Contribution model updated" });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contribution Modeling: {scenario.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* EE Contribution Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Employer pays {eeContribution}% for Employee</label>
              <span className="text-sm font-bold text-primary">${calculations.employerCostEE.toLocaleString()}/mo</span>
            </div>
            <Slider
              value={[eeContribution]}
              onValueChange={(val) => setEeContribution(val[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Employee pays {100 - eeContribution}% (~${(totalPremium * (1 - eeContribution / 100)).toLocaleString()}/mo)</span>
            </div>
          </div>

          {/* Dependent Contribution Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">Employer pays {depContribution}% for Dependents</label>
              <span className="text-sm font-bold text-primary">${calculations.employerCostDep.toLocaleString()}/mo</span>
            </div>
            <Slider
              value={[depContribution]}
              onValueChange={(val) => setDepContribution(val[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Dependent pays {100 - depContribution}%</span>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="border-t pt-6">
            <p className="text-sm font-semibold mb-3">Impact Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Total Monthly Premium</p>
                  <p className="text-lg font-bold">${totalPremium.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Employee Avg Cost</p>
                  <p className="text-lg font-bold">${calculations.employeeAvgCost.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ACA Affordability Check */}
          <div className={`p-3 rounded-lg border ${calculations.isACAAffordable ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-start gap-2">
              {!calculations.isACAAffordable && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
              <div>
                <p className={`text-xs font-semibold ${calculations.isACAAffordable ? "text-green-700" : "text-red-700"}`}>
                  ACA Affordability Check
                </p>
                <p className="text-xs mt-1" style={{ color: calculations.isACAAffordable ? "#166534" : "#991b1b" }}>
                  {calculations.isACAAffordable
                    ? `✓ Plan is ACA affordable (${calculations.employeeAvgCost.toLocaleString()} < ${calculations.acaThreshold.toLocaleString()} threshold)`
                    : `✗ Plan may not be ACA affordable (${calculations.employeeAvgCost.toLocaleString()} > ${calculations.acaThreshold.toLocaleString()} threshold)`}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison to Current */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">Current Model</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
              <p>EE: {scenario.employer_contribution_ee ?? 0}% → {eeContribution}%</p>
              <p>Dep: {scenario.employer_contribution_dep ?? 0}% → {depContribution}%</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveContribution.mutate()} disabled={saveContribution.isPending}>
            Save Contribution Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}