import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateValidatedEntityRecord, createValidatedEntityRecord } from "@/services/entities/validatedEntityWrites";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function CaseEditModal({ caseData, open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employer_name: caseData?.employer_name || "",
    effective_date: caseData?.effective_date || "",
    target_close_date: caseData?.target_close_date || "",
    priority: caseData?.priority || "normal",
    assigned_to: caseData?.assigned_to || "",
    employee_count: caseData?.employee_count || "",
    notes: caseData?.notes || "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      employer_name: caseData?.employer_name || "",
      effective_date: caseData?.effective_date || "",
      target_close_date: caseData?.target_close_date || "",
      priority: caseData?.priority || "normal",
      assigned_to: caseData?.assigned_to || "",
      employee_count: caseData?.employee_count || "",
      notes: caseData?.notes || "",
    });
    setError("");
  }, [caseData?.id, open]);

  const update = useMutation({
    mutationFn: async () => {
      if (!form.employer_name.trim()) {
        throw new Error("Employer name is required.");
      }
      if (!form.effective_date) {
        throw new Error("Effective date is required.");
      }

      const previous = caseData || {};
      const payload = {
        ...form,
        assigned_to: form.assigned_to || undefined,
        employee_count: form.employee_count ? Number(form.employee_count) : undefined,
        last_activity_date: new Date().toISOString(),
      };

      const result = await updateValidatedEntityRecord("BenefitCase", caseData.id, payload);

      const changedFields = Object.entries(payload).filter(([key, value]) => {
        const before = previous[key] ?? "";
        const after = value ?? "";
        return String(before) !== String(after);
      });

      await Promise.all(changedFields.map(([key, value]) =>
        createValidatedEntityRecord("ActivityLog", {
          case_id: caseData.id,
          actor_email: previous.assigned_to || undefined,
          actor_name: "Case Update",
          action: "Case updated",
          detail: `${key.replace(/_/g, " ")} updated`,
          entity_type: "BenefitCase",
          entity_id: caseData.id,
          old_value: previous[key] != null ? String(previous[key]) : "",
          new_value: value != null ? String(value) : "",
        }, ["case_id", "action"])
      ));

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["activity", caseData.id] });
      onClose();
    },
    onError: (err) => {
      setError(err.message || "Unable to save case.");
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {error && <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>}
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => update.mutate()} disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}