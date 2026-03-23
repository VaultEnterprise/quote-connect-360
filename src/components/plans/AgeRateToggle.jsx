import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Layers } from "lucide-react";

export default function AgeRateToggle({ plan }) {
  const [rateType, setRateType] = useState("composite");

  const { data: rateTables = [] } = useQuery({
    queryKey: ["rate-tables", plan?.id],
    queryFn: () => base44.entities.PlanRateTable.filter({ plan_id: plan?.id }, "effective_date", 50),
  });

  const compositeRates = rateTables.filter((rt) => rt.rate_type === "composite");
  const ageBandedRates = rateTables.filter((rt) => rt.rate_type === "age_banded");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="w-4 h-4" /> Rate Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={rateType === "composite" ? "default" : "outline"}
            onClick={() => setRateType("composite")}
            className="h-7 text-xs flex-1"
          >
            Composite ({compositeRates.length})
          </Button>
          <Button
            size="sm"
            variant={rateType === "age_banded" ? "default" : "outline"}
            onClick={() => setRateType("age_banded")}
            className="h-7 text-xs flex-1"
          >
            Age-Banded ({ageBandedRates.length})
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          {rateType === "composite" ? (
            <p>Single rate for all employee ages within tier</p>
          ) : (
            <p>Rates vary by age within tier (18-64)</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}