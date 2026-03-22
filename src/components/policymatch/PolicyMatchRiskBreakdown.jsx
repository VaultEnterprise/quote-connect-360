import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export default function PolicyMatchRiskBreakdown({ result }) {
  const [expandedFactor, setExpandedFactor] = useState(null);

  if (!result.risk_factors || result.risk_factors.length === 0) return null;

  const positiveFactors = result.risk_factors.filter(f => f.impact === "positive");
  const negativeFactors = result.risk_factors.filter(f => f.impact === "negative");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Risk Factor Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {positiveFactors.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-emerald-700 mb-2">✓ Positive Factors ({positiveFactors.length})</p>
            <div className="space-y-1.5">
              {positiveFactors.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setExpandedFactor(expandedFactor === `pos-${i}` ? null : `pos-${i}`)}
                  className="cursor-pointer p-2 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-emerald-900">{f.factor}</p>
                      <p className="text-[10px] text-emerald-700">{f.detail || f.factor}</p>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-emerald-600 flex-shrink-0 transition-transform ${expandedFactor === `pos-${i}` ? "rotate-90" : ""}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {negativeFactors.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-red-700 mb-2">⚠ Risk Factors ({negativeFactors.length})</p>
            <div className="space-y-1.5">
              {negativeFactors.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setExpandedFactor(expandedFactor === `neg-${i}` ? null : `neg-${i}`)}
                  className="cursor-pointer p-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-red-900">{f.factor}</p>
                      <p className="text-[10px] text-red-700">{f.detail || f.factor}</p>
                    </div>
                    <ChevronRight className={`w-3 h-3 text-red-600 flex-shrink-0 transition-transform ${expandedFactor === `neg-${i}` ? "rotate-90" : ""}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}