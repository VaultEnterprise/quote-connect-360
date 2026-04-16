import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Copy } from "lucide-react";

export default function CloneScenarioDialog({ scenario, open, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState(`${scenario?.name || "Scenario"} (Copy)`);

  const clone = useMutation({
    mutationFn: async () => {
      const { id, created_date, updated_date, created_by, quoted_at, ...rest } = scenario;
      return base44.entities.QuoteScenario.create({
        ...rest,
        name,
        status: "draft",
        is_recommended: false,
        total_monthly_premium: undefined,
        employer_monthly_cost: undefined,
        employee_monthly_cost_avg: undefined,
        quoted_at: undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
      toast({ title: "Scenario cloned", description: `"${name}" created as a draft.` });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-4 h-4" /> Clone Scenario
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            Creates a copy of <span className="font-medium text-foreground">"{scenario?.name}"</span> as a new draft. Rates will need to be recalculated.
          </p>
          <div>
            <Label>New Scenario Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" autoFocus />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => clone.mutate()} disabled={!name.trim() || clone.isPending}>
            {clone.isPending ? "Cloning..." : "Clone Scenario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}