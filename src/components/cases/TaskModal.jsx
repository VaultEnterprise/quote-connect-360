import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function TaskModal({ caseId, employerName, task, open, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    task_type: task?.task_type || "action_required",
    priority: task?.priority || "normal",
    assigned_to: task?.assigned_to || "",
    due_date: task?.due_date || "",
    status: task?.status || "pending",
  });

  const save = useMutation({
    mutationFn: () => isEdit
      ? base44.entities.CaseTask.update(task.id, form)
      : base44.entities.CaseTask.create({ ...form, case_id: caseId, employer_name: employerName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-tasks", caseId] });
      queryClient.invalidateQueries({ queryKey: ["tasks-all"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-pending"] });
      onClose();
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1.5" placeholder="Task title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={form.task_type} onValueChange={v => set("task_type", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="action_required">Action Required</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assigned To</Label>
              <Input value={form.assigned_to} onChange={e => set("assigned_to", e.target.value)} placeholder="Email" className="mt-1.5" />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="mt-1.5" />
            </div>
          </div>
          {isEdit && (
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!form.title || save.isPending}>
            {save.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}