import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "lucide-react";

export default function BulkAssignModal({ isOpen, caseIds, onClose, onSuccess }) {
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["bulk-assign-users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen,
  });

  const assignableUsers = useMemo(() => users.filter((user) => !!user.email), [users]);

  const handleAssign = async () => {
    setLoading(true);
    try {
      const normalizedAssignee = assignee === "__unassigned__" ? null : assignee;
      for (const id of caseIds) {
        await base44.entities.BenefitCase.update(id, { assigned_to: normalizedAssignee });
      }
      onSuccess?.();
      onClose();
      setAssignee("");
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
              <SelectItem value="__unassigned__">Unassigned</SelectItem>
              {assignableUsers.map((user) => (
                <SelectItem key={user.id} value={user.email}>{user.full_name || user.email}</SelectItem>
              ))}
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