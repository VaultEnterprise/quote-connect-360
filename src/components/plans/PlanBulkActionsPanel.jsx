import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Trash2, FileDown } from "lucide-react";

export default function PlanBulkActionsPanel({ selectedCount, plans, onBulkAction }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const selectedPlans = plans.filter(p => p.selected);
    const csv = [
      ["Plan Name", "Carrier", "Type", "Network", "Deductible", "OOP Max", "Code"],
      ...selectedPlans.map(p => [
        p.plan_name,
        p.carrier,
        p.plan_type,
        p.network_type,
        p.deductible_individual || "",
        p.oop_max_individual || "",
        p.plan_code || ""
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plans_${new Date().getTime()}.csv`;
    a.click();
    setLoading(false);
  };

  const handleArchive = async () => {
    setLoading(true);
    await onBulkAction("archive");
    setLoading(false);
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{selectedCount} selected</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={handleExport} disabled={loading}>
            <FileDown className="w-3 h-3" /> Export CSV
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1 text-destructive hover:text-destructive" onClick={handleArchive} disabled={loading}>
            <Trash2 className="w-3 h-3" /> Archive Selected
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}