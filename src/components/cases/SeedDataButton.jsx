import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SeedDataButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => base44.functions.invoke("seedLogicalData", {}),
    onSuccess: (response) => {
      queryClient.invalidateQueries();
      toast.success(response.data?.message || "Seed data added.");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.error || error.message || "Could not add seed data.");
    },
  });

  const handleClick = () => {
    if (!window.confirm("Add the logical seed data to this app? Existing seed records will be kept.")) return;
    mutation.mutate();
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={mutation.isPending} className="gap-1">
      {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
      {mutation.isPending ? "Adding Seed Data..." : "Add Seed Data"}
    </Button>
  );
}