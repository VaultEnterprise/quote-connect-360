import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CoverageTierComparison({ plans }) {
  const [selectedPlans, setSelectedPlans] = useState(plans.slice(0, 2).map((p) => p.id));

  const comparePlans = plans.filter((p) => selectedPlans.includes(p.id));

  const tiers = ["employee_only", "employee_spouse", "employee_children", "family"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Coverage Tier Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {plans.slice(0, 8).map((p) => (
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">Tier</th>
                  {comparePlans.map((p) => (
                    <th key={p.id} className="text-left py-2 px-2 font-medium">
                      {p.carrier}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {["EE", "EE+Spouse", "EE+Child", "Family"].map((tierLabel, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-2">{tierLabel}</td>
                    {comparePlans.map((p) => (
                      <td key={p.id} className="py-2 px-2">
                        <Badge variant="outline" className="text-[9px]">
                          Deductible: ${
                            idx === 0 ? p.deductible_individual : p.deductible_family || "—"
                          }
                        </Badge>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}