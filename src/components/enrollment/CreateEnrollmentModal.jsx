import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateEnrollmentModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    case_id: "",
    start_date: "",
    end_date: "",
    effective_date: "",
    total_eligible: "",
    status: "scheduled",
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const activeCases = cases.filter(c =>
    ["approved_for_enrollment", "enrollment_open", "quoting", "proposal_ready", "employer_review"].includes(c.stage)
  );

  const selectedCase = cases.find(c => c.id === form.case_id);

  const create = useMutation({
    mutationFn: async () => {
      const enrollment = await base44.entities.EnrollmentWindow.create({
        ...form,
        total_eligible: form.total_eligible ? Number(form.total_eligible) : undefined,
        employer_name: selectedCase?.employer_name || "",
      });
      await base44.entities.BenefitCase.update(form.case_id, {
        enrollment_status: form.status === "open" ? "open" : "not_started",
        stage: form.status === "open" ? "enrollment_open" : "approved_for_enrollment",
      });
      return enrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments-all"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments-active-count"] });
      onClose();
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const isValid = form.case_id && form.start_date && form.end_date;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Enrollment Window</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Case <span className="text-destructive">*</span></Label>
            <Select value={form.case_id} onValueChange={v => set("case_id", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select case..." /></SelectTrigger>
              <SelectContent>
                {activeCases.length === 0 && (
                  <SelectItem value="_none" disabled>No eligible cases</SelectItem>
                )}
                {activeCases.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.employer_name} — {c.case_number || c.id.slice(-6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>End Date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Effective Date</Label>
              <Input type="date" value={form.effective_date} onChange={e => set("effective_date", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Total Eligible</Label>
              <Input type="number" min="1" value={form.total_eligible} onChange={e => set("total_eligible", e.target.value)} className="mt-1.5" placeholder="e.g. 42" />
            </div>
          </div>

          <div>
            <Label>Initial Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="open">Open (Immediate)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!isValid || create.isPending}>
            {create.isPending ? "Creating..." : "Create Enrollment Window"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}