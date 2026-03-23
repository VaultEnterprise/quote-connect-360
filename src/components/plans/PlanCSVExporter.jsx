import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PlanCSVExporter({ plans }) {
  const { toast } = useToast();

  const handleExport = () => {
    const csv = [
      ["Plan Name", "Carrier", "Type", "Network", "State", "Effective", "Deductible (Ind)", "Deductible (Fam)", "OOP Max (Ind)", "OOP Max (Fam)", "Copay PCP", "Copay Spec", "Copay ER", "Coinsurance", "HSA Eligible", "Status"].join(","),
      ...plans.map((p) =>
        [
          `"${p.plan_name}"`,
          p.carrier,
          p.plan_type,
          p.network_type,
          p.state,
          p.effective_date?.substring(0, 10) || "",
          p.deductible_individual || "",
          p.deductible_family || "",
          p.oop_max_individual || "",
          p.oop_max_family || "",
          p.copay_pcp || "",
          p.copay_specialist || "",
          p.copay_er || "",
          p.coinsurance || "",
          p.hsa_eligible ? "Yes" : "No",
          p.status,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-catalog-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: "Exported", description: `${plans.length} plans exported to CSV` });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="gap-1.5 text-xs h-8"
      disabled={plans.length === 0}
    >
      <FileDown className="w-3.5 h-3.5" /> Export CSV
    </Button>
  );
}