import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileDown, Mail } from "lucide-react";

export default function PolicyMatchBulkActions({ selectedCount, results, onBulkAction }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const selectedResults = results.filter(r => r.selected);
    const csv = [
      ["Employer", "Risk Score", "Risk Tier", "Cost PMPM", "Value Score", "Status", "Stage", "Enhancements"],
      ...selectedResults.map(r => [
        r.employer_name,
        r.risk_score,
        r.risk_tier,
        r.cost_delta_pmpm?.toFixed(2) || "",
        r.value_score,
        r.status,
        r.trigger_stage,
        r.enhancements?.length || 0
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy-match-results_${new Date().getTime()}.csv`;
    a.click();
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
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
            <Mail className="w-3 h-3" /> Send to Broker
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}