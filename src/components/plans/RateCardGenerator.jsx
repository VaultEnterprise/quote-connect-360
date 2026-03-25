import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Printer, FileText } from "lucide-react";

function fmt(v) { return v != null ? `$${Number(v).toFixed(2)}` : "—"; }

export default function RateCardGenerator({ plans }) {
  const [planId, setPlanId] = useState("");
  const plan = plans.find(p => p.id === planId);

  const { data: stateRates = [] } = useQuery({
    queryKey: ["rate-card-states", planId],
    queryFn: () => base44.entities.PlanRateByState.filter({ plan_id: planId }),
    enabled: !!planId,
  });

  const { data: ageBands = [] } = useQuery({
    queryKey: ["rate-card-bands", planId],
    queryFn: () => base44.entities.AgeBandedRate.filter({ plan_id: planId }),
    enabled: !!planId,
  });

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap no-print">
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select plan..." /></SelectTrigger>
          <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name} — {p.carrier}</SelectItem>)}</SelectContent>
        </Select>
        {planId && (
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print Rate Card
          </Button>
        )}
      </div>

      {!planId && (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground text-sm"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />Select a plan to generate its printable rate card.</CardContent></Card>
      )}

      {plan && (
        <div className="space-y-4" id="rate-card-print">
          {/* Header */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Official Rate Card</p>
                  <CardTitle className="text-2xl">{plan.plan_name}</CardTitle>
                  <p className="text-muted-foreground text-sm mt-1">{plan.carrier} · {plan.network_type} · {plan.plan_type?.toUpperCase()}</p>
                </div>
                <div className="text-right space-y-1">
                  {plan.effective_date && <Badge variant="outline">Effective: {plan.effective_date}</Badge>}
                  {plan.hsa_eligible && <div><Badge className="bg-green-100 text-green-700">HSA Eligible</Badge></div>}
                  <p className="text-xs text-muted-foreground">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Benefit Summary */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Plan Benefits</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                {[
                  { label: "Individual Deductible", val: fmt(plan.deductible_individual) },
                  { label: "Family Deductible", val: fmt(plan.deductible_family) },
                  { label: "Individual OOP Max", val: fmt(plan.oop_max_individual) },
                  { label: "Family OOP Max", val: fmt(plan.oop_max_family) },
                  { label: "PCP Copay", val: fmt(plan.copay_pcp) },
                  { label: "Specialist Copay", val: fmt(plan.copay_specialist) },
                  { label: "ER Copay", val: fmt(plan.copay_er) },
                  { label: "Urgent Care", val: fmt(plan.copay_urgent_care) },
                  { label: "Generic RX", val: fmt(plan.rx_generic) },
                  { label: "Brand RX", val: fmt(plan.rx_brand) },
                  { label: "Specialty RX", val: fmt(plan.rx_specialty) },
                  { label: "Coinsurance", val: plan.coinsurance ? `${plan.coinsurance}%` : "—" },
                ].map(item => (
                  <div key={item.label} className="p-2 border rounded-lg">
                    <p className="text-xs text-muted-foreground leading-tight mb-1">{item.label}</p>
                    <p className="font-bold text-base">{item.val}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Composite Rates by State */}
          {stateRates.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Composite Rates by State</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted text-xs">
                      <th className="text-left p-2 rounded-tl">State</th>
                      <th className="text-center p-2">Effective Date</th>
                      <th className="text-right p-2">EE Only</th>
                      <th className="text-right p-2">EE + Spouse</th>
                      <th className="text-right p-2">EE + Child(ren)</th>
                      <th className="text-right p-2 rounded-tr">Family</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stateRates.map((r, i) => (
                      <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                        <td className="p-2 font-medium">{r.state}</td>
                        <td className="p-2 text-center text-muted-foreground">{r.effective_date || "—"}</td>
                        <td className="p-2 text-right">{fmt(r.ee_only)}</td>
                        <td className="p-2 text-right">{fmt(r.ee_spouse)}</td>
                        <td className="p-2 text-right">{fmt(r.ee_children)}</td>
                        <td className="p-2 text-right font-medium">{fmt(r.family)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Age-Banded Rates */}
          {ageBands.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Age-Banded Rates</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted text-xs">
                      <th className="text-left p-2">Age Band</th>
                      <th className="text-center p-2">State</th>
                      <th className="text-right p-2">EE Rate</th>
                      <th className="text-right p-2">ES Rate</th>
                      <th className="text-right p-2">EC Rate</th>
                      <th className="text-right p-2">Family Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ageBands.slice(0, 30).map((b, i) => (
                      <tr key={b.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                        <td className="p-2">{b.age_min}–{b.age_max}</td>
                        <td className="p-2 text-center text-muted-foreground">{b.state}</td>
                        <td className="p-2 text-right">{fmt(b.ee_rate)}</td>
                        <td className="p-2 text-right">{fmt(b.es_rate)}</td>
                        <td className="p-2 text-right">{fmt(b.ec_rate)}</td>
                        <td className="p-2 text-right">{fmt(b.family_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>This rate card is generated for informational purposes. Rates are subject to change and must be verified with the carrier before quoting.</p>
          </div>
        </div>
      )}
    </div>
  );
}