import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingDown, TrendingUp } from "lucide-react";

const COVERAGE_TIERS = [
  { key: "ee", label: "Employee Only" },
  { key: "es", label: "Employee + Spouse" },
  { key: "ec", label: "Employee + Children" },
  { key: "fam", label: "Family" },
];

function fmt(n) { return `$${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function PlanCostCalculator({ plans }) {
  const [planId, setPlanId] = useState("");
  const [tier, setTier] = useState("ee");
  const [empContribPct, setEmpContribPct] = useState([80]);
  const [salary, setSalary] = useState("");
  const [visitsPCP, setVisitsPCP] = useState(4);
  const [visitsSpec, setVisitsSpec] = useState(2);
  const [rxMonths, setRxMonths] = useState(3);

  const plan = plans.find(p => p.id === planId);

  const calc = useMemo(() => {
    if (!plan) return null;
    // Monthly premium estimate from state rates — fallback to 0 since we don't have live data
    const monthlyPremium = tier === "ee" ? (plan.ee_monthly_premium || 450) : tier === "es" ? (plan.es_monthly_premium || 820) : tier === "ec" ? (plan.ec_monthly_premium || 750) : (plan.fam_monthly_premium || 1100);
    const empMonthly = monthlyPremium * (empContribPct[0] / 100);
    const eeMonthly = monthlyPremium - empMonthly;
    const pcpCost = visitsPCP * (plan.copay_pcp || 30);
    const specCost = visitsSpec * (plan.copay_specialist || 60);
    const rxCost = rxMonths * (plan.rx_generic || 15);
    const estAnnualOOP = Math.min(pcpCost + specCost + rxCost, plan.oop_max_individual || 9000);
    const annualEECost = eeMonthly * 12 + estAnnualOOP;
    const pctOfSalary = salary ? (annualEECost / parseFloat(salary)) * 100 : null;
    return { monthlyPremium, empMonthly, eeMonthly, pcpCost, specCost, rxCost, estAnnualOOP, annualEECost, pctOfSalary };
  }, [plan, tier, empContribPct, salary, visitsPCP, visitsSpec, rxMonths]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium block mb-1.5">Plan</label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger><SelectValue placeholder="Select plan..." /></SelectTrigger>
            <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name} — {p.carrier}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5">Coverage Tier</label>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{COVERAGE_TIERS.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {plan && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Inputs */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" />Your Usage Estimate</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium flex justify-between"><span>Employer Contribution</span><span className="text-primary">{empContribPct[0]}%</span></label>
                <Slider value={empContribPct} onValueChange={setEmpContribPct} min={0} max={100} step={5} className="mt-2" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Annual Salary (optional)</label>
                <Input type="number" placeholder="e.g. 65000" value={salary} onChange={e => setSalary(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium flex justify-between"><span>PCP Visits / Year</span><span>{visitsPCP}</span></label>
                <Slider value={[visitsPCP]} onValueChange={v => setVisitsPCP(v[0])} min={0} max={20} step={1} className="mt-2" />
              </div>
              <div>
                <label className="text-xs font-medium flex justify-between"><span>Specialist Visits / Year</span><span>{visitsSpec}</span></label>
                <Slider value={[visitsSpec]} onValueChange={v => setVisitsSpec(v[0])} min={0} max={12} step={1} className="mt-2" />
              </div>
              <div>
                <label className="text-xs font-medium flex justify-between"><span>Generic RX Months / Year</span><span>{rxMonths}</span></label>
                <Slider value={[rxMonths]} onValueChange={v => setRxMonths(v[0])} min={0} max={12} step={1} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {calc && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Estimated Annual Cost</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center py-2">
                  <p className="text-4xl font-bold text-primary">{fmt(calc.annualEECost)}</p>
                  <p className="text-xs text-muted-foreground">Your estimated total out-of-pocket</p>
                  {calc.pctOfSalary != null && (
                    <Badge className="mt-1 bg-primary/10 text-primary">{calc.pctOfSalary.toFixed(1)}% of salary</Badge>
                  )}
                </div>
                <div className="space-y-1.5 text-sm">
                  {[
                    { label: "Total Monthly Premium", val: fmt(calc.monthlyPremium) },
                    { label: `Employer Pays (${empContribPct[0]}%)`, val: fmt(calc.empMonthly), sub: true },
                    { label: "Your Monthly Premium", val: fmt(calc.eeMonthly), highlight: true },
                    { label: "Est. PCP Copays", val: fmt(calc.pcpCost) },
                    { label: "Est. Specialist Copays", val: fmt(calc.specCost) },
                    { label: "Est. RX Cost", val: fmt(calc.rxCost) },
                    { label: "Est. Annual OOP Cost", val: fmt(calc.estAnnualOOP), highlight: true },
                  ].map((row, i) => (
                    <div key={i} className={`flex justify-between ${row.highlight ? "font-semibold text-primary border-t pt-1.5" : row.sub ? "text-muted-foreground text-xs pl-3" : ""}`}>
                      <span>{row.label}</span><span>{row.val}</span>
                    </div>
                  ))}
                </div>
                <div className={`flex items-center gap-1.5 text-xs p-2 rounded mt-2 ${calc.estAnnualOOP > (plan.oop_max_individual || 9000) * 0.5 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
                  {calc.estAnnualOOP > (plan.oop_max_individual || 9000) * 0.5 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  OOP max safety: {fmt(plan.oop_max_individual)} individual
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!plan && (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground text-sm">Select a plan to estimate your costs.</CardContent></Card>
      )}
    </div>
  );
}