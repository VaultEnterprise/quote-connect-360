import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function RateImpactWarningModal({ open, onClose, row, onConfirm }) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Downstream impact warning</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>This action affects downstream usage for {row.rate_set_name || row.linkedPlanName}.</p>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p>Impacted quotes: {row.quoteUsageCount}</p>
            <p>Impacted enrollments: {row.enrollmentUsageCount}</p>
            <p>Impacted plan: {row.linkedPlanName}</p>
            <p>Impacted scope: {row.scopeType}</p>
          </div>
          <p>Safe alternatives: clone a new version, activate a future version, or keep the current assignment active.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onConfirm(row)}>Continue</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}