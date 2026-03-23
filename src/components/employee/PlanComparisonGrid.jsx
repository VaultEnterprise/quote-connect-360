import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, TrendingDown, AlertCircle } from "lucide-react";

/**
 * PlanComparisonGrid
 * Side-by-side plan comparison with visual cost breakdown and selection.
 * Shows key metrics: deductible, OOP max, copays, and estimated cost impact.
 */
export default function PlanComparisonGrid({ plans, selectedPlan, onSelect, onCompare }) {
  const [expandedPlan, setExpandedPlan] = useState(null);

  if (!plans || plans.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No plans available in this category</p>
        </CardContent>
      </Card>
    );
  }

  // Determine which plan has best value (lowest OOP max)
  const bestValuePlan = plans.reduce((best, p) => 
    (!best || (p.oop_max_individual || 0) < (best.oop_max_individual || 0)) ? p : best
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => {
        const isSelected = selectedPlan?.id === plan.id;
        const isBestValue = bestValuePlan?.id === plan.id && plans.length > 1;

        return (
          <div key={plan.id} className="relative">
            {/* Best value badge */}
            {isBestValue && (
              <div className="absolute -top-3 right-4 z-10">
                <Badge className="bg-green-600 text-white gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Best Value
                </Badge>
              </div>
            )}

            <Card
              className={`cursor-pointer transition-all h-full ${
                isSelected
                  ? "ring-2 ring-primary border-primary"
                  : "hover:border-primary/50 hover:shadow-md"
              }`}
              onClick={() => onSelect(plan)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2">{plan.plan_name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{plan.carrier}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  )}
                </div>

                {/* Network type badge */}
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {plan.network_type || "PPO"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key metrics grid */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Deductible (Ind.)</p>
                    <p className="font-semibold">
                      ${(plan.deductible_individual || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">OOP Max (Ind.)</p>
                    <p className="font-semibold">
                      ${(plan.oop_max_individual || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">PCP Copay</p>
                    <p className="font-semibold">
                      ${plan.copay_pcp || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">ER Copay</p>
                    <p className="font-semibold">
                      ${plan.copay_er || "N/A"}
                    </p>
                  </div>
                </div>

                {/* HSA indicator */}
                {plan.hsa_eligible && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-green-700">HSA-Eligible HDHP</span>
                  </div>
                )}

                {/* Expandable details */}
                <button
                  className="w-full text-xs text-primary hover:underline py-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPlan(expandedPlan === plan.id ? null : plan.id);
                  }}
                >
                  {expandedPlan === plan.id ? "Hide Details" : "View Details"}
                </button>

                {expandedPlan === plan.id && (
                  <div className="pt-2 border-t space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coinsurance:</span>
                      <span className="font-medium">{plan.coinsurance || "N/A"}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Specialist Copay:</span>
                      <span className="font-medium">${plan.copay_specialist || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rx Tier 1:</span>
                      <span className="font-medium">${plan.rx_tier1 || "N/A"}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(plan);
                    }}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                  {plans.length > 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompare?.(plan);
                      }}
                    >
                      Compare
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}