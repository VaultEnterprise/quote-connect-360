import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { format } from "date-fns";

export default function ProposalComparisonMatrix({ proposals }) {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleProposal = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev.slice(-2), id]);
  };

  const selectedProposals = proposals.filter(p => selectedIds.includes(p.id));

  if (selectedProposals.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Select up to 3 proposals to compare details.
        </CardContent>
      </Card>
    );
  }

  const comparisonFields = [
    { label: "Title", key: "title" },
    { label: "Employer", key: "employer_name" },
    { label: "Status", key: "status", format: (v) => v?.charAt(0).toUpperCase() + v?.slice(1) },
    { label: "Total Premium/mo", key: "total_monthly_premium", format: (v) => v ? `$${v.toLocaleString()}` : "—" },
    { label: "Employer Cost/mo", key: "employer_monthly_cost", format: (v) => v ? `$${v.toLocaleString()}` : "—" },
    { label: "Avg EE Cost", key: "employee_avg_cost", format: (v) => v ? `$${v.toLocaleString()}` : "—" },
    { label: "Broker", key: "broker_name" },
    { label: "Effective Date", key: "effective_date", format: (v) => v ? format(new Date(v), "MMM d, yyyy") : "—" },
    { label: "Sent", key: "sent_at", format: (v) => v ? format(new Date(v), "MMM d") : "—" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Proposal Comparison ({selectedProposals.length}/3)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-semibold">Metric</th>
              {selectedProposals.map(p => (
                <th key={p.id} className="text-left p-2 font-semibold">
                  <div className="flex items-center gap-1 justify-between">
                    <div className="truncate max-w-32">{p.title}</div>
                    <button onClick={() => toggleProposal(p.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonFields.map(field => (
              <tr key={field.key} className="border-b border-border last:border-0">
                <td className="p-2 font-medium text-muted-foreground">{field.label}</td>
                {selectedProposals.map(p => (
                  <td key={p.id} className="p-2">
                    {field.format ? field.format(p[field.key]) : p[field.key] || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}