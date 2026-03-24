import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function BulkAssignWithDueDate({ isOpen, caseIds, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (isOpen) base44.entities.User.list().then(u => setUsers(u)).catch(() => {});
  }, [isOpen]);

  const handleAssign = async () => {
    if (!assignee) return;
    setLoading(true);
    try {
      for (const id of caseIds) {
        await base44.entities.BenefitCase.update(id, {
          assigned_to: assignee,
          ...(dueDate && { target_close_date: dueDate }),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Assign {caseIds.length} Cases</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Assignee *</label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Due Date (Optional)</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleAssign} disabled={loading || !assignee} className="flex-1">{loading ? "Assigning..." : "Assign"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}