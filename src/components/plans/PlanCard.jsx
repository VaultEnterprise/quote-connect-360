import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Archive, ChevronDown, ChevronUp, DollarSign, Calendar, MapPin } from "lucide-react";
import RateTableEditor from "./RateTableEditor";
import RateTableEditor from "./RateTableEditor";

const TYPE_COLORS = {
  medical: "bg-blue-100 text-blue-700",
  dental: "bg-emerald-100 text-emerald-700",
  vision: "bg-purple-100 text-purple-700",
  life: "bg-amber-100 text-amber-700",
  std: "bg-orange-100 text-orange-700",
  ltd: "bg-red-100 text-red-700",
  voluntary: "bg-pink-100 text-pink-700",
};

export default function PlanCard({ plan, zipCount = 0, onEdit, onArchive }) {
  const navigate = useNavigate();
  const [showRates, setShowRates] = useState(false);

  const { data: rateTables = [] } = useQuery({
    queryKey: ["rate-tables", plan.id],
    queryFn: () => base44.entities.PlanRateTable.filter({ plan_id: plan.id }),
    enabled: showRates,
  });

  const primaryRate = rateTables[0];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/plans/${plan.id}`)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`text-[10px] font-semibold ${TYPE_COLORS[plan.plan_type] || "bg-gray-100 text-gray-700"}`}>
                {plan.plan_type?.toUpperCase()}
              </Badge>
              {plan.network_type && <Badge variant="outline" className="text-[10px]">{plan.network_type}</Badge>}
              {plan.hsa_eligible && <Badge variant="outline" className="text-[10px] border-green-300 text-green-700">HSA</Badge>}
            </div>
            <p className="text-sm font-semibold leading-tight">{plan.plan_name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.carrier}{plan.plan_code ? ` · ${plan.plan_code}` : ""}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(plan); }}>
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onArchive(); }}>
              <Archive className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-3 space-y-2">
        {/* Key benefits */}
        {plan.plan_type === "medical" && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {plan.deductible_individual != null && <span className="text-muted-foreground">Ded: <span className="text-foreground font-medium">${plan.deductible_individual.toLocaleString()}</span></span>}
            {plan.oop_max_individual != null && <span className="text-muted-foreground">OOP Max: <span className="text-foreground font-medium">${plan.oop_max_individual.toLocaleString()}</span></span>}
            {plan.copay_pcp != null && <span className="text-muted-foreground">PCP: <span className="text-foreground font-medium">${plan.copay_pcp}</span></span>}
            {plan.coinsurance != null && <span className="text-muted-foreground">Coins: <span className="text-foreground font-medium">{plan.coinsurance}%</span></span>}
          </div>
        )}

        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            ZIP Coverage
          </div>
          <p className="text-muted-foreground">Imported ZIP codes: <span className="text-foreground font-medium">{zipCount}</span></p>
        </div>

        {(plan.effective_date || plan.policy_expiration_date) && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Policy Dates
            </div>
            {plan.effective_date && <p className="text-muted-foreground">Effective: <span className="text-foreground font-medium">{plan.effective_date}</span></p>}
            {plan.policy_expiration_date && <p className="text-muted-foreground">Expires: <span className="text-foreground font-medium">{plan.policy_expiration_date}</span></p>}
          </div>
        )}

        {/* Rate preview */}
        {!showRates && primaryRate == null && (
          <p className="text-xs text-muted-foreground italic">No rate table</p>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs text-muted-foreground hover:text-foreground justify-between px-2"
          onClick={(e) => { e.stopPropagation(); setShowRates(!showRates); }}
        >
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Rate Table</span>
          {showRates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>

        {showRates && (
          <div onClick={(e) => e.stopPropagation()}>
            <RateTableEditor planId={plan.id} rateTables={rateTables} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}