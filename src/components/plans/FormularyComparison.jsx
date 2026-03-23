import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PillIcon } from "lucide-react";

export default function FormularyComparison({ plans }) {
  const [selectedPlans, setSelectedPlans] = useState(plans.slice(0, 2).map((p) => p.id));

  const comparePlans = plans.filter((p) => selectedPlans.includes(p.id));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <PillIcon className="w-4 h-4" /> Formulary & Pharmacy Tiers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {plans.slice(0, 6).map((p) => (
            <button
              key={p.id}
              onClick={() =>
                setSelectedPlans((prev) =>
                  prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                )
              }
              className={`text-xs p-2 rounded-lg border transition-all ${
                selectedPlans.includes(p.id)
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-muted hover:border-primary"
              }`}
            >
              {p.carrier}
            </button>
          ))}
        </div>

        {comparePlans.length > 0 && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
            <p className="text-xs font-medium">Rx Tier Copays</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-[10px] font-semibold text-blue-900">Tier 1 (Generic)</div>
              <div className="text-[10px] font-semibold text-blue-900">Tier 2 (Preferred)</div>
              <div className="text-[10px] font-semibold text-blue-900">Tier 3 (Non-Preferred)</div>
              <div className="text-[10px] font-semibold text-blue-900">Tier 4 (Specialty)</div>
              {comparePlans.map((p) => (
                <React.Fragment key={p.id}>
                  <div className="text-[10px] text-blue-800">${p.rx_tier1 || "—"}</div>
                  <div className="text-[10px] text-blue-800">${p.rx_tier2 || "—"}</div>
                  <div className="text-[10px] text-blue-800">${p.rx_tier3 || "—"}</div>
                  <div className="text-[10px] text-blue-800">${p.rx_tier4 || "—"}</div>
                </React.Fragment>
              ))}
            </div>
            <p className="text-[10px] text-blue-600 italic">
              Note: Visit carrier websites for current formularies
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}