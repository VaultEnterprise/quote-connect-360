import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileDown, Mail, Send } from "lucide-react";

export default function ProposalBulkActions({ selectedCount, proposals, onBulkAction }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const selectedProposals = proposals.filter(p => p.selected);
    const csv = [
      ["Title", "Employer", "Status", "Value", "Broker", "Sent Date"],
      ...selectedProposals.map(p => [
        p.title,
        p.employer_name,
        p.status,
        p.total_monthly_premium || "",
        p.broker_name,
        p.sent_at || ""
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proposals_${new Date().getTime()}.csv`;
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
            <Send className="w-3 h-3" /> Send Reminder
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
            <Mail className="w-3 h-3" /> Email Brokers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}