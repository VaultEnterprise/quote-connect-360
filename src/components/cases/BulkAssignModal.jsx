import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "lucide-react";

export default function BulkAssignModal({ isOpen, caseIds, onClose, onSuccess }) {
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!assignee) return;
    setLoading(true);
    try {
      for (const id of caseIds) {
        await base44.entities.BenefitCase.update(id, { assigned_to: assignee });
      }
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign {caseIds.length} Case{caseIds.length !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john@example.com">John Broker</SelectItem>
              <SelectItem value="jane@example.com">Jane Broker</SelectItem>
              <SelectItem value="mike@example.com">Mike Manager</SelectItem>
              <SelectItem value={null}>Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!assignee || loading}>
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}