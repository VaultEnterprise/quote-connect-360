import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export function QuickCreateCase({ employer, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCase = useMutation({
    mutationFn: async (caseData) => {
      return await base44.entities.BenefitCase.create(caseData);
    },
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      toast({ title: "Case created successfully" });
      navigate(`/cases/${newCase.id}`);
      if (onClose) onClose();
    },
  });

  const handleCreate = () => {
    const caseData = {
      agency_id: employer.agency_id,
      employer_group_id: employer.id,
      employer_name: employer.name,
      employee_count: employer.employee_count,
      case_type: "new_business",
      stage: "draft",
      priority: "normal",
      effective_date: employer.effective_date || new Date().toISOString().split("T")[0],
    };
    createCase.mutate(caseData);
  };

  return (
    <Button size="sm" onClick={handleCreate} disabled={createCase.isPending}>
      <Plus className="w-4 h-4 mr-1" />
      {createCase.isPending ? "Creating..." : "New Case"}
    </Button>
  );
}