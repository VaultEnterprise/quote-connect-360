import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, Filter } from "lucide-react";
import PlanComparisonGrid from "./PlanComparisonGrid";

/**
 * PlanSelectionEnhanced
 * Improved plan selection with categorized view, filtering, and comparison guidance.
 * Displays medical, dental, vision plans with cost breakdowns and recommendations.
 */
export default function PlanSelectionEnhanced({
  plans = {},
  selectedPlans = {},
  onSelect,
  onCompare,
  effectiveDate,
}) {
  const [filterNetwork, setFilterNetwork] = useState("all");
  const [showAllPlans, setShowAllPlans] = useState(false);

  // Group plans by type with filtering
  const groupedPlans = useMemo(() => {
    const groups = {};
    
    Object.entries(plans).forEach(([type, planList]) => {
      let filtered = planList || [];
      
      if (filterNetwork !== "all") {
        filtered = filtered.filter(p => p.network_type === filterNetwork);
      }
      
      if (filtered.length > 0) {
        groups[type] = filtered;
      }
    });
    
    return groups;
  }, [plans, filterNetwork]);

  // Network types present in plans
  const availableNetworks = useMemo(() => {
    const networks = new Set();
    Object.values(plans).forEach(planList => {
      planList?.forEach(p => {
        if (p.network_type) networks.add(p.network_type);
      });
    });
    return Array.from(networks);
  }, [plans]);

  const PLAN_LABELS = {
    medical: "Medical",
    dental: "Dental",
    vision: "Vision",
    voluntary: "Voluntary",
  };

  return (
    <div className="space-y-6">
      {/* Plan selection guidance */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900">How to choose plans</p>
            <p className="text-xs text-blue-800 mt-1">
              Medical is required. Dental and vision are optional. Compare plans by deductible, copay, and out-of-pocket costs. HSA-eligible plans help you save pre-tax dollars.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Network filter (if multiple networks available) */}
      {availableNetworks.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground">Filter by network:</p>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={filterNetwork === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterNetwork("all")}
            >
              All Networks
            </Badge>
            {availableNetworks.map(network => (
              <Badge
                key={network}
                variant={filterNetwork === network ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterNetwork(network)}
              >
                {network}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Plan categories */}
      {Object.entries(groupedPlans).map(([planType, planList]) => {
        const selected = selectedPlans[planType];
        const isRequired = planType === "medical";
        const showLimited = !showAllPlans && planList.length > 3;

        return (
          <div key={planType} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                {PLAN_LABELS[planType]}
                {isRequired && (
                  <Badge variant="secondary" className="text-xs">
                    Required
                  </Badge>
                )}
              </h3>
              {!selected && isRequired && (
                <span className="text-xs text-destructive font-medium">
                  Please select
                </span>
              )}
            </div>

            {/* Validation warning */}
            {!selected && isRequired && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  Medical plan is required to complete enrollment.
                </p>
              </div>
            )}

            {/* Plan grid */}
            <PlanComparisonGrid
              plans={showLimited ? planList.slice(0, 3) : planList}
              selectedPlan={selected}
              onSelect={(plan) => onSelect(plan)}
              onCompare={(plan) => onCompare?.(plan)}
            />

            {/* Show more button */}
            {showLimited && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAllPlans(true)}
              >
                Show all {planList.length} plans
              </Button>
            )}
          </div>
        );
      })}

      {/* No plans message */}
      {Object.keys(groupedPlans).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No plans found matching your filter. Try a different network.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}