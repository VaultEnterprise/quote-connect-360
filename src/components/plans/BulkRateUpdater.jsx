import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function BulkRateUpdater({ plans }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedPlans, setSelectedPlans] = useState([]);
  const [rateAdjustment, setRateAdjustment] = useState("0");
  const [adjustmentType, setAdjustmentType] = useState("percentage");

  const applyBulkUpdate = useMutation({
    mutationFn: async () => {
      for (const planId of selectedPlans) {
        await base44.functions.invoke("bulkUpdateRates", {
          plan_id: planId,
          adjustment: parseFloat(rateAdjustment),
          adjustment_type: adjustmentType,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
      toast({ title: `Updated ${selectedPlans.length} plans` });
      setSelectedPlans([]);
      setRateAdjustment("0");
    },
  });

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4" /> Bulk Rate Update
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-medium">Select plans to update:</p>
          <div className="flex flex-wrap gap-2">
            {plans.slice(0, 8).map((p) => (
              <button
                key={p.id}
                onClick={() =>
                  setSelectedPlans((prev) =>
                    prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                  )
                }
                className={`text-xs px-2 py-1 rounded-lg border transition-all ${
                  selectedPlans.includes(p.id)
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white border-muted hover:border-purple-400"
                }`}
              >
                {p.carrier}
              </button>
            ))}
          </div>
          {selectedPlans.length > 0 && (
            <Badge className="text-xs">{selectedPlans.length} selected</Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Rate change"
            value={rateAdjustment}
            onChange={(e) => setRateAdjustment(e.target.value)}
            className="h-8 text-xs flex-1"
          />
          <select
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value)}
            className="h-8 text-xs rounded border border-input px-2"
          >
            <option value="percentage">%</option>
            <option value="flat">$</option>
          </select>
        </div>

        <Button
          onClick={() => applyBulkUpdate.mutate()}
          disabled={selectedPlans.length === 0 || applyBulkUpdate.isPending}
          className="w-full h-7 text-xs"
        >
          {applyBulkUpdate.isPending ? "Updating…" : "Apply to Selected"}
        </Button>
      </CardContent>
    </Card>
  );
}