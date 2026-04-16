import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

const TYPE_COLORS = {
  medical: "bg-blue-100 text-blue-700",
  dental: "bg-emerald-100 text-emerald-700",
  vision: "bg-purple-100 text-purple-700",
  life: "bg-amber-100 text-amber-700",
  std: "bg-orange-100 text-orange-700",
  ltd: "bg-red-100 text-red-700",
  voluntary: "bg-pink-100 text-pink-700",
};

export default function ScenarioPlanList({ scenarioId, caseId }) {
  const queryClient = useQueryClient();

  const { data: scenarioPlans = [] } = useQuery({
    queryKey: ["scenario-plans", scenarioId],
    queryFn: () => base44.entities.ScenarioPlan.filter({ scenario_id: scenarioId }),
    enabled: !!scenarioId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.ScenarioPlan.update(id, data);
      await base44.entities.QuoteScenario.update(scenarioId, { status: "draft" });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenario-plans", scenarioId] });
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.ScenarioPlan.delete(id);
      await base44.entities.QuoteScenario.update(scenarioId, { status: "draft" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenario-plans", scenarioId] });
      queryClient.invalidateQueries({ queryKey: ["scenarios-all"] });
    },
  });

  if (scenarioPlans.length === 0) return (
    <p className="text-xs text-muted-foreground mt-2 px-1">No plans added yet. Click "+ Plans" to add from the library.</p>
  );

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <p className="text-xs font-medium text-muted-foreground mb-2">{scenarioPlans.length} plan(s) in scenario</p>
      {scenarioPlans.map(sp => (
        <div key={sp.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold">{sp.plan_name}</span>
              {sp.plan_type && <Badge className={`text-[10px] ${TYPE_COLORS[sp.plan_type] || "bg-gray-100 text-gray-700"}`}>{sp.plan_type?.toUpperCase()}</Badge>}
              {sp.network_type && <Badge variant="outline" className="text-[10px]">{sp.network_type}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{sp.carrier}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">EE Contrib</p>
              <div className="flex items-center gap-1">
                <Input
                  className="h-6 w-16 text-xs text-center px-1"
                  value={sp.employer_contribution_ee ?? ""}
                  onChange={e => updateMutation.mutate({ id: sp.id, data: { employer_contribution_ee: parseFloat(e.target.value) || 0 } })}
                  type="number"
                />
                <span className="text-xs text-muted-foreground">{sp.contribution_type === "flat_dollar" ? "$" : "%"}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Dep Contrib</p>
              <div className="flex items-center gap-1">
                <Input
                  className="h-6 w-16 text-xs text-center px-1"
                  value={sp.employer_contribution_dep ?? ""}
                  onChange={e => updateMutation.mutate({ id: sp.id, data: { employer_contribution_dep: parseFloat(e.target.value) || 0 } })}
                  type="number"
                />
                <span className="text-xs text-muted-foreground">{sp.contribution_type === "flat_dollar" ? "$" : "%"}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(sp.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}