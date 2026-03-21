import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Heart, Shield, Eye, Zap, DollarSign } from "lucide-react";
import { format } from "date-fns";

const PLAN_TYPE_INFO = {
  medical:   { icon: Heart,   label: "Medical",  color: "text-blue-600" },
  dental:    { icon: Shield,  label: "Dental",   color: "text-emerald-600" },
  vision:    { icon: Eye,     label: "Vision",   color: "text-purple-600" },
  life:      { icon: Zap,     label: "Life",     color: "text-red-600" },
  std:       { icon: Zap,     label: "Short-term Disability", color: "text-orange-600" },
  ltd:       { icon: Zap,     label: "Long-term Disability",  color: "text-amber-600" },
  voluntary: { icon: Zap,     label: "Voluntary", color: "text-pink-600" },
};

function PlanCard({ plan, selected, onSelect, onCompare, monthly_cost, isMedical, onDetail }) {
  const TypeIcon = PLAN_TYPE_INFO[plan.plan_type]?.icon || Zap;

  return (
    <button
      onClick={() => onSelect(plan)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
      }`}
    >
      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{plan.plan_name}</p>
              {plan.hsa_eligible && (
                <Badge className="bg-green-100 text-green-700 text-[10px]">HSA Eligible</Badge>
              )}
              {plan.network_type && (
                <Badge variant="outline" className="text-[10px]">{plan.network_type}</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.carrier}</p>
          </div>
          {selected && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />}
        </div>

        {/* Cost highlight for medical */}
        {isMedical && monthly_cost !== undefined && (
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-baseline gap-1">
              <DollarSign className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-sm font-bold text-primary">${monthly_cost.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">/month (your cost)</span>
            </div>
          </div>
        )}

        {/* Key benefits grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
          {plan.deductible_individual !== undefined && (
            <div className="text-center p-1.5 rounded bg-muted/40">
              <p className="text-muted-foreground">Deductible</p>
              <p className="font-semibold">${plan.deductible_individual.toLocaleString()}</p>
            </div>
          )}
          {plan.copay_pcp !== undefined && (
            <div className="text-center p-1.5 rounded bg-muted/40">
              <p className="text-muted-foreground">PCP Copay</p>
              <p className="font-semibold">${plan.copay_pcp}</p>
            </div>
          )}
          {plan.copay_specialist !== undefined && (
            <div className="text-center p-1.5 rounded bg-muted/40">
              <p className="text-muted-foreground">Specialist</p>
              <p className="font-semibold">${plan.copay_specialist}</p>
            </div>
          )}
          {plan.copay_er !== undefined && (
            <div className="text-center p-1.5 rounded bg-muted/40">
              <p className="text-muted-foreground">ER Copay</p>
              <p className="font-semibold">${plan.copay_er}</p>
            </div>
          )}
          {plan.oop_max_individual !== undefined && (
            <div className="text-center p-1.5 rounded bg-muted/40">
              <p className="text-muted-foreground">OOP Max</p>
              <p className="font-semibold">${plan.oop_max_individual.toLocaleString()}</p>
            </div>
          )}
          {plan.coinsurance !== undefined && (
            <div className="text-center p-1.5 rounded bg-muted/40">
              <p className="text-muted-foreground">Coinsurance</p>
              <p className="font-semibold">{plan.coinsurance}%</p>
            </div>
          )}
        </div>

        {/* Rx tiers for medical */}
        {isMedical && (plan.rx_tier1 !== undefined || plan.rx_tier2 !== undefined) && (
          <div className="text-[10px] text-muted-foreground space-y-0.5">
            <p className="font-medium">Rx Copays:</p>
            <div className="flex gap-1 flex-wrap">
              {plan.rx_tier1 !== undefined && <span className="px-2 py-0.5 rounded bg-muted">Generic ${plan.rx_tier1}</span>}
              {plan.rx_tier2 !== undefined && <span className="px-2 py-0.5 rounded bg-muted">Brand ${plan.rx_tier2}</span>}
              {plan.rx_tier3 !== undefined && <span className="px-2 py-0.5 rounded bg-muted">Specialty ${plan.rx_tier3}</span>}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={e => { e.stopPropagation(); onDetail?.(plan); }}
          >
            View Details
          </Button>
          {isMedical && selected && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={e => { e.stopPropagation(); onCompare?.(plan); }}
            >
              Compare
            </Button>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * PlanSelectionStep
 * Multi-product plan selection with cost, full benefits, and compare mode.
 *
 * Props:
 *   selectedPlans — { [plan_type]: Plan }
 *   onSelect      — (plan) => void
 *   onCompare     — (plan) => void (optional)
 *   effectiveDate — string | null
 */
export default function PlanSelectionStep({ selectedPlans, onSelect, onCompare, effectiveDate }) {
  const [detailPlan, setDetailPlan] = useState(null);

  const { data: allPlans = [] } = useQuery({
    queryKey: ["plans-active-all"],
    queryFn: () => base44.entities.BenefitPlan.filter({ status: "active" }, "-created_date", 100),
  });

  const { data: rateData = {} } = useQuery({
    queryKey: ["rate-tables"],
    queryFn: async () => {
      const tables = await base44.entities.PlanRateTable.list("-created_date", 100);
      return tables.reduce((acc, t) => { acc[t.plan_id] = t; return acc; }, {});
    },
  });

  // Group by plan_type
  const grouped = allPlans.reduce((acc, plan) => {
    const type = plan.plan_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(plan);
    return acc;
  }, {});

  // Available product types (show all, not just medical)
  const productTypes = Object.keys(grouped).filter(t => grouped[t].length > 0);
  const [activeTab, setActiveTab] = useState(productTypes[0] || "medical");

  const getEmployeeCost = (plan) => {
    const rate = rateData[plan.id];
    if (!rate?.ee_rate) return undefined;
    // Simplified: just show rate; in real app, apply contribution
    return Math.round(rate.ee_rate);
  };

  const isMultiProduct = productTypes.length > 1;

  return (
    <div className="space-y-4">
      {effectiveDate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 text-sm">
            <p className="text-blue-700">
              <strong>Coverage Effective Date:</strong> {format(new Date(effectiveDate), "MMMM d, yyyy")}
            </p>
          </CardContent>
        </Card>
      )}

      {isMultiProduct ? (
        /* Multi-product tabs */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 w-full overflow-x-auto">
            {productTypes.map(type => {
              const Info = PLAN_TYPE_INFO[type];
              const Icon = Info?.icon;
              const label = Info?.label || type;
              const selected = selectedPlans[type];
              return (
                <TabsTrigger key={type} value={type} className="gap-1.5 flex-shrink-0">
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                  {selected && <span className="text-[10px] font-bold text-primary ml-1">✓</span>}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {productTypes.map(type => (
            <TabsContent key={type} value={type} className="mt-4 space-y-3">
              {grouped[type].map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlans[type]?.id === plan.id}
                  onSelect={() => onSelect(plan)}
                  onCompare={onCompare}
                  monthly_cost={type === "medical" ? getEmployeeCost(plan) : undefined}
                  isMedical={type === "medical"}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        /* Single product — no tabs needed */
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {grouped[activeTab]?.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlans[activeTab]?.id === plan.id}
                onSelect={() => onSelect(plan)}
                onCompare={onCompare}
                monthly_cost={getEmployeeCost(plan)}
                isMedical={true}
              />
            )) || <p className="text-sm text-muted-foreground">No plans available.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}