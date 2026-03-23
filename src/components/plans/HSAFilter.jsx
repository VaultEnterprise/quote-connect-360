import React from "react";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

export default function HSAFilter({ plans, onFilterChange }) {
  const hsaEligible = plans.filter((p) => p.hsa_eligible);

  return (
    <button
      onClick={() => onFilterChange("hsa")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs hover:border-primary hover:bg-primary/5 transition-all"
    >
      <Heart className="w-3.5 h-3.5" />
      <span>HSA Plans</span>
      {hsaEligible.length > 0 && <Badge variant="secondary" className="text-[10px]">{hsaEligible.length}</Badge>}
    </button>
  );
}