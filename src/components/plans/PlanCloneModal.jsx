import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function PlanCloneModal({ plan, open, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState(`${plan?.plan_name} (Copy)`);
  const [newCode, setNewCode] = useState(`${plan?.plan_code}-copy`);
  const [cloneRates, setCloneRates] = useState(true);

  const clonePlan = useMutation({
    mutationFn: async () => {
      const created = await base44.entities.BenefitPlan.create({
        ...plan,
        id: undefined,
        plan_name: newName,
        plan_code: newCode,
        created_date: undefined,
        updated_date: undefined,
      });

      if (cloneRates) {
        const rateTables = await base44.entities.PlanRateTable.filter({ plan_id: plan.id });
        for (const rt of rateTables) {
          await base44.entities.PlanRateTable.create({
            ...rt,
            id: undefined,
            plan_id: created.id,
            created_date: undefined,
            updated_date: undefined,
          });
        }
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
      toast({ title: "Plan cloned successfully" });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Clone Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">New Plan Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">New Plan Code</Label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="mt-1 h-8 text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={cloneRates}
              onChange={(e) => setCloneRates(e.target.checked)}
              className="w-3 h-3"
            />
            Clone rate tables
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button
            onClick={() => clonePlan.mutate()}
            disabled={clonePlan.isPending}
            className="h-8 text-xs"
          >
            {clonePlan.isPending ? "Cloning…" : "Clone Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}