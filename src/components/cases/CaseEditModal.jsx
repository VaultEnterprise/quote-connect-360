import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { assignCase, createCaseAuditEvent, replaceCaseValidationResults } from "@/services/cases/caseOps";

export default function CaseEditModal({ caseData, open, onClose }) {
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [form, setForm] = useState({
    employer_name: caseData?.employer_name || "",
    effective_date: caseData?.effective_date || "",
    target_close_date: caseData?.target_close_date || "",
    priority: caseData?.priority || "normal",
    assigned_to: caseData?.assigned_to || "",
    employee_count: caseData?.employee_count || "",
    notes: caseData?.notes || "",
  });

  const initialForm = useMemo(() => ({
    employer_name: caseData?.employer_name || "",
    effective_date: caseData?.effective_date || "",
    target_close_date: caseData?.target_close_date || "",
    priority: caseData?.priority || "normal",
    assigned_to: caseData?.assigned_to || "",
    employee_count: caseData?.employee_count || "",
    notes: caseData?.notes || "",
  }), [caseData]);

  useEffect(() => {
    setForm(initialForm);
    setHasUnsavedChanges(false);
  }, [initialForm]);

  const { data: users = [] } = useQuery({
    queryKey: ["case-edit-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const update = useMutation({
    mutationFn: async () => {
      const nextPayload = {
        ...form,
        employee_count: form.employee_count ? Number(form.employee_count) : undefined,
        last_activity_date: new Date().toISOString(),
      };
      const updated = await base44.entities.BenefitCase.update(caseData.id, nextPayload);
      if (caseData.assigned_to !== form.assigned_to) {
        const assignedUser = users.find((user) => user.email === form.assigned_to) || { email: form.assigned_to };
        await assignCase(caseData, assignedUser, "Assignment updated from case edit.");
      }
      await replaceCaseValidationResults({ ...caseData, ...nextPayload }, {});
      await createCaseAuditEvent(caseData.id, "case_updated", "Case updated successfully.", {
        detail: "Case fields were updated.",
        old_value: caseData.assigned_to || "",
        new_value: form.assigned_to || "",
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["activity", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["case-validation-results", caseData.id] });
      setHasUnsavedChanges(false);
      toast({ title: "Case updated successfully.", description: "Your changes were saved." });
      onClose();
    },
    onError: (error) => {
      toast({ title: "Save failed", description: error.message || "The case could not be updated.", variant: "destructive" });
    },
  });

  const set = (k, v) => {
    setHasUnsavedChanges(true);
    setForm(p => ({ ...p, [k]: v }));
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen && hasUnsavedChanges && !window.confirm("This case has unsaved changes. Leave without saving?")) return;
      onClose();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
          <DialogDescription>Save changes only after required fields are complete.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Employer Name</Label>
            <Input value={form.employer_name} onChange={e => set("employer_name", e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Target Close Date</Label>
              <Input type="date" value={form.target_close_date} onChange={e => set("target_close_date", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employee Count</Label>
              <Input type="number" value={form.employee_count} onChange={e => set("employee_count", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Assigned To</Label>
            <Input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} placeholder="Email" className="mt-1.5" />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            if (hasUnsavedChanges && !window.confirm("This case has unsaved changes. Leave without saving?")) return;
            onClose();
          }}>Cancel</Button>
          <Button onClick={() => update.mutate()} disabled={update.isPending || !form.employer_name.trim()}>
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}