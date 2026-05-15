import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

const ROW = ({ label, values, prefix = "", suffix = "", highlight = false }) => (
  <tr className={highlight ? "bg-muted/30" : ""}>
    <td className="py-2 px-3 text-xs text-muted-foreground font-medium whitespace-nowrap w-40">{label}</td>
    {values.map((v, i) => (
      <td key={i} className="py-2 px-3 text-xs text-center font-medium">
        {v != null && v !== "" ? `${prefix}${typeof v === "number" ? v.toLocaleString() : v}${suffix}` : <span className="text-muted-foreground">—</span>}
      </td>
    ))}
  </tr>
);

export default function PlanCompareDrawer({ plans, open, onClose, onBack }) {
  if (!plans?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>Plan Comparison</DialogTitle>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground w-40">Feature</th>
                {plans.map(p => (
                  <th key={p.id} className="py-2 px-3 text-center min-w-36">
                    <p className="text-sm font-semibold leading-tight">{p.plan_name}</p>
                    <p className="text-xs text-muted-foreground">{p.carrier}</p>
                    <div className="flex gap-1 justify-center mt-1 flex-wrap">
                      {p.network_type && <Badge variant="outline" className="text-[10px]">{p.network_type}</Badge>}
                      {p.hsa_eligible && <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">HSA</Badge>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <ROW label="Plan Type" values={plans.map(p => p.plan_type?.toUpperCase())} highlight />
              <ROW label="Indiv. Deductible" values={plans.map(p => p.deductible_individual)} prefix="$" />
              <ROW label="Family Deductible" values={plans.map(p => p.deductible_family)} prefix="$" />
              <ROW label="Indiv. OOP Max" values={plans.map(p => p.oop_max_individual)} prefix="$" highlight />
              <ROW label="Family OOP Max" values={plans.map(p => p.oop_max_family)} prefix="$" />
              <ROW label="PCP Copay" values={plans.map(p => p.copay_pcp)} prefix="$" />
              <ROW label="Specialist Copay" values={plans.map(p => p.copay_specialist)} prefix="$" highlight />
              <ROW label="ER Copay" values={plans.map(p => p.copay_er)} prefix="$" />
              <ROW label="Coinsurance" values={plans.map(p => p.coinsurance)} suffix="%" highlight />
              <ROW label="Rx Tier 1" values={plans.map(p => p.rx_tier1)} prefix="$" />
              <ROW label="Rx Tier 2" values={plans.map(p => p.rx_tier2)} prefix="$" />
              <ROW label="Rx Tier 3" values={plans.map(p => p.rx_tier3)} prefix="$" highlight />
              <ROW label="Rx Tier 4" values={plans.map(p => p.rx_tier4)} prefix="$" />
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}