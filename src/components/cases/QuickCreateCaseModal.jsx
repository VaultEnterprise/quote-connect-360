import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { createCaseAuditEvent, replaceCaseValidationResults } from "@/services/cases/caseOps";

export default function QuickCreateCaseModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { data: agencies = [] } = useQuery({ queryKey: ["quick-case-agencies"], queryFn: () => base44.entities.Agency.list("name", 200) });
  const { data: employers = [] } = useQuery({ queryKey: ["quick-case-employers"], queryFn: () => base44.entities.EmployerGroup.list("name", 500) });
  const [form, setForm] = useState({ employer_name: "", case_type: "new_business", priority: "normal", employee_count: "" });

  const handleCreate = async () => {
    if (!form.employer_name.trim()) return;
    setLoading(true);
    try {
      const matchedEmployer = employers.find((item) => item.name?.toLowerCase() === form.employer_name.trim().toLowerCase());
      const created = await base44.entities.BenefitCase.create({
        employer_name: form.employer_name.trim(),
        case_type: form.case_type,
        priority: form.priority,
        employee_count: form.employee_count ? parseInt(form.employee_count) : null,
        stage: "draft",
        agency_id: matchedEmployer?.agency_id || agencies[0]?.id || "",
        employer_group_id: matchedEmployer?.id || "",
        last_activity_date: new Date().toISOString(),
      });
      await replaceCaseValidationResults(created, {});
      await createCaseAuditEvent(created.id, "case_created", "Case created successfully.", { detail: "Quick create flow" });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["case-validation-results", created.id] });
      setForm({ employer_name: "", case_type: "new_business", priority: "normal", employee_count: "" });
      toast({ title: "Case created successfully.", description: "The new case is now available in the queue." });
      onClose();
    } catch (error) {
      toast({ title: "Create case failed", description: error.message || "The case could not be created.", variant: "destructive" });
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