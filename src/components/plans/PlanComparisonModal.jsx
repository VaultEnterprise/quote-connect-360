import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlanComparisonTool from "@/components/plans/PlanComparisonTool";

export default function PlanComparisonModal({ open, onClose, plans }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Compare Plans</DialogTitle>
        </DialogHeader>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Select plans from the grid to compare them here.</p>
        ) : (
          <PlanComparisonTool plans={plans} medical={plans.every((plan) => plan.plan_type === "medical")} enableSelection={false} />
        )}
      </DialogContent>
    </Dialog>
  );
}