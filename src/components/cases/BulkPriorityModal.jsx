import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "lucide-react";

export default function BulkPriorityModal({ isOpen, caseIds, onClose, onSuccess }) {
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!priority) return;
    setLoading(true);
    try {
      for (const id of caseIds) {
        await base44.entities.BenefitCase.update(id, { priority });
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
          <DialogTitle>Update Priority for {caseIds.length} Case{caseIds.length !== 1 ? "s" : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">🔴 Urgent</SelectItem>
              <SelectItem value="high">🟠 High</SelectItem>
              <SelectItem value="normal">🟡 Normal</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={!priority || loading}>
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            Update Priority
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}