import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const fields = [
  ["Rate Set", "rate_set_name"],
  ["Linked Plan", "linkedPlanName"],
  ["Carrier", "carrier"],
  ["Rate Model", "rate_type"],
  ["Effective Date", "effective_date"],
  ["End Date", "end_date"],
  ["Version Status", "versionStatus"],
  ["Readiness", "readinessStatus"],
  ["Tier Summary", "coverageTierSummary"],
  ["Assignments", "scopeType"],
  ["Contribution Linkage", "contributionLinkageStatus"],
  ["Quote Usage", "quoteUsageCount"],
  ["Enrollment Usage", "enrollmentUsageCount"],
];

export default function RateComparisonModal({ open, onClose, rows }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Rate Comparison</DialogTitle>
        </DialogHeader>
        {rows.length < 2 ? (
          <p className="text-sm text-muted-foreground">Select two rate sets to compare.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left">Field</th>
                  {rows.map((row) => <th key={row.id} className="p-2 text-left">{row.rate_set_name || row.linkedPlanName}</th>)}
                </tr>
              </thead>
              <tbody>
                {fields.map(([label, key]) => (
                  <tr key={key} className="border-b border-border last:border-0">
                    <td className="p-2 font-medium text-muted-foreground">{label}</td>
                    {rows.map((row) => <td key={row.id} className="p-2">{row[key] ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}