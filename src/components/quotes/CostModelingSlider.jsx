import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

// ACA affordability threshold for 2024: employee contribution <= 9.02% of household income
// We approximate against a $60k salary baseline
const ACA_THRESHOLD_PCT = 9.02;
const BASELINE_MONTHLY_INCOME = 60000 / 12;

function fmt$(n) { return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`; }

export default function CostModelingSlider({ scenarios }) {
  // Per-scenario contribution overrides: { [scenarioId]: { ee: number, dep: number } }
  const [overrides, setOverrides] = useState({});

  const getContrib = (s, type) => {
    if (overrides[s.id]?.[type] !== undefined) return overrides[s.id][type];
    return type === "ee" ? (s.employer_contribution_ee ?? 80) : (s.employer_contribution_dep ?? 50);
  };

  const setContrib = (scenarioId, type, value) => {
    setOverrides(prev => ({
      ...prev,
      [scenarioId]: { ...prev[scenarioId], [type]: value },
    }));
  };

  const modeled = useMemo(() => {
    return scenarios.map(s => {
      const totalPremium = s.total_monthly_premium || 0;
      const eeContribPct = getContrib(s, "ee");
      const depContribPct = getContrib(s, "dep");

      // Rough split: assume ~60% of premium is EE-only, 40% is dependents
      const eePortion = totalPremium * 0.6;
      const depPortion = totalPremium * 0.4;

      const employerCost = (eePortion * eeContribPct / 100) + (depPortion * depContribPct / 100);
      const employeeCost = totalPremium - employerCost;
      // ACA affordability: employee EE-only premium <= 9.02% of W-2 wages
      const eeOnlyMonthly = eePortion * (1 - eeContribPct / 100);
      const affordabilityPct = BASELINE_MONTHLY_INCOME > 0 ? (eeOnlyMonthly / BASELINE_MONTHLY_INCOME) * 100 : 0;
      const acaCompliant = affordabilityPct <= ACA_THRESHOLD_PCT;

      return { s, totalPremium, employerCost, employeeCost, eeContribPct, depContribPct, acaCompliant, affordabilityPct };
    });
  }, [scenarios, overrides]);

  if (!scenarios || scenarios.length === 0) return null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-foreground">Live Cost Modeling</span>
        <span className="text-[10px] text-muted-foreground">Adjust employer contribution % and see costs update in real-time</span>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${scenarios.length}, minmax(0,1fr))` }}>
        {modeled.map(({ s, totalPremium, employerCost, employeeCost, eeContribPct, depContribPct, acaCompliant, affordabilityPct }) => (
          <div key={s.id} className="space-y-3 p-3 border rounded-lg bg-muted/20">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold truncate">{s.name}</p>
              {totalPremium > 0 && (
                acaCompliant
                  ? <Badge className="text-[9px] bg-green-100 text-green-700 border-green-200 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />ACA OK</Badge>
                  : <Badge className="text-[9px] bg-red-100 text-red-700 border-red-200 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />ACA Risk</Badge>
              )}
            </div>

            {totalPremium === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">No premium data — run calculation first</p>
            ) : (
              <>
                {/* EE Contribution */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Employer pays (EE)</span>
                    <span className="font-semibold text-foreground">{eeContribPct}%</span>
                  </div>
                  <Slider
                    min={0} max={100} step={1}
                    value={[eeContribPct]}
                    onValueChange={([v]) => setContrib(s.id, "ee", v)}
                    className="w-full"
                  />
                </div>

                {/* Dep Contribution */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Employer pays (Dep)</span>
                    <span className="font-semibold text-foreground">{depContribPct}%</span>
                  </div>
                  <Slider
                    min={0} max={100} step={1}
                    value={[depContribPct]}
                    onValueChange={([v]) => setContrib(s.id, "dep", v)}
                    className="w-full"
                  />
                </div>

                {/* Cost Breakdown */}
                <div className="pt-1 border-t space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Total premium</span>
                    <span className="font-semibold">{fmt$(totalPremium)}/mo</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Employer cost</span>
                    <span className="font-semibold text-primary">{fmt$(employerCost)}/mo</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Employee share</span>
                    <span className="font-semibold text-orange-600">{fmt$(employeeCost)}/mo</span>
                  </div>

                  {/* Cost share bar */}
                  <div className="mt-1.5">
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                      <div className="bg-primary transition-all duration-200" style={{ width: `${eeContribPct}%` }} />
                      <div className="bg-orange-400/60 flex-1" />
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                      <span>Employer {eeContribPct}%</span>
                      <span>Employee {100 - eeContribPct}%</span>
                    </div>
                  </div>

                  {/* ACA affordability detail */}
                  <div className={`text-[9px] mt-1 ${acaCompliant ? "text-green-700" : "text-red-600"}`}>
                    EE-only est. {affordabilityPct.toFixed(1)}% of income (ACA threshold: {ACA_THRESHOLD_PCT}%)
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}