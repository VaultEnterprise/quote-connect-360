import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, CheckCircle } from "lucide-react";

/**
 * PlanCompareModal
 * Side-by-side plan comparison overlay.
 *
 * Props:
 *   plan1        — BenefitPlan
 *   plan2        — BenefitPlan
 *   onClose      — () => void
 *   onSelectPlan — (plan) => void
 */
export default function PlanCompareModal({ plan1, plan2, onClose, onSelectPlan }) {
  if (!plan1 || !plan2) return null;

  const COMPARISON_FIELDS = [
    { label: "Carrier", key: "carrier" },
    { label: "Network Type", key: "network_type" },
    { label: "Deductible (Individual)", key: "deductible_individual", format: "currency" },
    { label: "Deductible (Family)", key: "deductible_family", format: "currency" },
    { label: "PCP Copay", key: "copay_pcp", format: "currency" },
    { label: "Specialist Copay", key: "copay_specialist", format: "currency" },
    { label: "ER Copay", key: "copay_er", format: "currency" },
    { label: "Coinsurance", key: "coinsurance", format: "percent" },
    { label: "OOP Max (Individual)", key: "oop_max_individual", format: "currency" },
    { label: "OOP Max (Family)", key: "oop_max_family", format: "currency" },
    { label: "Generic Rx", key: "rx_tier1", format: "currency" },
    { label: "Brand Rx", key: "rx_tier2", format: "currency" },
    { label: "Specialty Rx", key: "rx_tier3", format: "currency" },
    { label: "HSA Eligible", key: "hsa_eligible", format: "boolean" },
  ];

  const formatValue = (value, format) => {
    if (value === undefined || value === null) return "—";
    if (format === "currency") return `$${value.toLocaleString()}`;
    if (format === "percent") return `${value}%`;
    if (format === "boolean") return value ? "Yes" : "No";
    return value;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <Card className="w-full max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between border-b sticky top-0 bg-background">
          <CardTitle>Compare Plans</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b">
                  <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground w-40">Feature</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground min-w-48">
                    <div className="space-y-1">
                      <p>{plan1.plan_name}</p>
                      <p className="text-xs text-muted-foreground">{plan1.carrier}</p>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground min-w-48">
                    <div className="space-y-1">
                      <p>{plan2.plan_name}</p>
                      <p className="text-xs text-muted-foreground">{plan2.carrier}</p>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {COMPARISON_FIELDS.map((field, i) => {
                  const val1 = plan1[field.key];
                  const val2 = plan2[field.key];
                  if (val1 === undefined && val2 === undefined) return null;

                  const formatted1 = formatValue(val1, field.format);
                  const formatted2 = formatValue(val2, field.format);
                  const isBetter1 = field.format === "currency" ? val1 < val2 : val1 > val2;

                  return (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium text-muted-foreground sticky left-0 bg-background">
                        {field.label}
                      </td>
                      <td className={`px-4 py-3 text-sm ${isBetter1 && val1 !== undefined && val2 !== undefined ? "bg-green-50 text-green-800" : ""}`}>
                        <div className="flex items-center gap-2">
                          {formatted1}
                          {isBetter1 && val1 !== undefined && val2 !== undefined && (
                            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Better
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm ${!isBetter1 && val2 !== undefined && val1 !== undefined ? "bg-green-50 text-green-800" : ""}`}>
                        <div className="flex items-center gap-2">
                          {formatted2}
                          {!isBetter1 && val2 !== undefined && val1 !== undefined && (
                            <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Better
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t flex gap-2 sticky bottom-0 bg-background">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button className="flex-1 gap-2" onClick={() => { onSelectPlan(plan1); onClose(); }}>
              <CheckCircle className="w-4 h-4" /> Choose {plan1.plan_name}
            </Button>
            <Button className="flex-1 gap-2" onClick={() => { onSelectPlan(plan2); onClose(); }}>
              <CheckCircle className="w-4 h-4" /> Choose {plan2.plan_name}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}