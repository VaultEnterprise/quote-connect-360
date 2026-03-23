import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TEMPLATES = {
  aetna: { carrier: "Aetna", network: "PPO", deductible_ind: 1500, deductible_fam: 3000, oop_max_ind: 4500, oop_max_fam: 9000, copay_pcp: 25, copay_specialist: 45, copay_er: 150 },
  anthem: { carrier: "Anthem", network: "PPO", deductible_ind: 1000, deductible_fam: 2000, oop_max_ind: 5000, oop_max_fam: 10000, copay_pcp: 30, copay_specialist: 50, copay_er: 250 },
  cigna: { carrier: "Cigna", network: "HMO", deductible_ind: 500, deductible_fam: 1500, oop_max_ind: 3000, oop_max_fam: 6000, copay_pcp: 20, copay_specialist: 35, copay_er: 100 },
  uhc: { carrier: "UnitedHealthcare", network: "PPO", deductible_ind: 1250, deductible_fam: 2500, oop_max_ind: 4000, oop_max_fam: 8000, copay_pcp: 25, copay_specialist: 45, copay_er: 200 },
};

export default function PlanTemplateLibrary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createFromTemplate = useMutation({
    mutationFn: async (template) => {
      const planName = prompt("Enter plan name:", `${template.carrier} PPO`);
      if (!planName) return;

      const planCode = prompt("Enter plan code:", `${template.carrier.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(7)}`);
      if (!planCode) return;

      await base44.entities.BenefitPlan.create({
        plan_name: planName,
        plan_code: planCode,
        carrier: template.carrier,
        network_type: template.network,
        plan_type: "medical",
        state: "CA",
        deductible_individual: template.deductible_ind,
        deductible_family: template.deductible_fam,
        oop_max_individual: template.oop_max_ind,
        oop_max_family: template.oop_max_fam,
        copay_pcp: template.copay_pcp,
        copay_specialist: template.copay_specialist,
        copay_er: template.copay_er,
        status: "active",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
      toast({ title: "Plan created from template" });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Plan Templates by Carrier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => createFromTemplate.mutate(template)}
              className="p-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left"
              disabled={createFromTemplate.isPending}
            >
              <p className="font-medium text-xs">{template.carrier}</p>
              <p className="text-[10px] text-muted-foreground">{template.network}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-5 w-full text-[10px]"
                onClick={(e) => {
                  e.stopPropagation();
                  createFromTemplate.mutate(template);
                }}
              >
                <Copy className="w-2.5 h-2.5 mr-1" /> Create
              </Button>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}