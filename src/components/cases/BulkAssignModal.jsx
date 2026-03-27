import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { assignCase } from "@/services/cases/caseOps";
import { toast } from "@/components/ui/use-toast";

export default function BulkAssignModal({ isOpen, caseIds, onClose, onSuccess }) {
  const [assignee, setAssignee] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: users = [] } = useQuery({ queryKey: ["bulk-assign-users"], queryFn: () => base44.entities.User.list() });

  const handleAssign = async () => {
    if (!assignee) return;
    setLoading(true);
    try {
      const selectedCases = await Promise.all(caseIds.map((id) => base44.entities.BenefitCase.filter({ id }).then((rows) => rows[0])));
      const nextUser = users.find((user) => user.email === assignee) || { email: assignee };
      for (const caseRecord of selectedCases.filter(Boolean)) {
        await assignCase(caseRecord, nextUser, "Bulk assignment");
      }
      onSuccess?.();
      onClose();
      toast({ title: "Assignment updated.", description: `${caseIds.length} case(s) were reassigned.` });
    } catch (error) {
      toast({ title: "Bulk assign failed", description: error.message || "The selected cases could not be reassigned.", variant: "destructive" });
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
              {users.map((user) => <SelectItem key={user.id} value={user.email}>{user.full_name || user.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={loading || assignee === ""}>
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}