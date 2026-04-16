import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function QuickCreateCaseModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ employer_name: "", case_type: "new_business", priority: "normal", employee_count: "" });

  const handleCreate = async () => {
    if (!form.employer_name.trim()) return;
    setLoading(true);
    try {
      await base44.entities.BenefitCase.create({
        employer_name: form.employer_name,
        case_type: form.case_type,
        priority: form.priority,
        employee_count: form.employee_count ? parseInt(form.employee_count) : null,
        stage: "draft",
        agency_id: "",
        employer_group_id: "",
      });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      setForm({ employer_name: "", case_type: "new_business", priority: "normal", employee_count: "" });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create New Case</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Employer Name *</label>
            <Input placeholder="Acme Corp" value={form.employer_name} onChange={(e) => setForm({...form, employer_name: e.target.value})} className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Case Type</label>
              <Select value={form.case_type} onValueChange={(v) => setForm({...form, case_type: v})}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_business">New Business</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="mid_year_change">Mid-Year Change</SelectItem>
                  <SelectItem value="takeover">Takeover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm({...form, priority: v})}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Employee Count</label>
            <Input type="number" placeholder="100" value={form.employee_count} onChange={(e) => setForm({...form, employee_count: e.target.value})} className="h-9" />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={loading || !form.employer_name.trim()} className="flex-1">{loading ? "Creating..." : "Create"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}