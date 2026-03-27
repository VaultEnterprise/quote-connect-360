import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { assignCase, replaceCaseValidationResults, transitionCase } from "@/services/cases/caseOps";
import { toast } from "@/components/ui/use-toast";

export default function CaseOperationsBar({ caseData, tasks = [], scenarios = [] }) {
  const queryClient = useQueryClient();
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeEmail, setAssigneeEmail] = useState(caseData?.assigned_to || "");
  const [assignmentReason, setAssignmentReason] = useState("");
  const [nextStage, setNextStage] = useState(caseData?.stage || "draft");
  const [statusReason, setStatusReason] = useState("");
  const [resolutionSummary, setResolutionSummary] = useState(caseData?.resolution_summary || "");

  const { data: users = [] } = useQuery({
    queryKey: ["case-op-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const transitionOptions = useMemo(() => {
    const map = {
      draft: ["census_in_progress", "closed"],
      census_in_progress: ["census_validated", "closed"],
      census_validated: ["ready_for_quote", "closed"],
      ready_for_quote: ["quoting", "closed"],
      quoting: ["proposal_ready", "closed"],
      proposal_ready: ["employer_review", "closed"],
      employer_review: ["approved_for_enrollment", "closed"],
      approved_for_enrollment: ["enrollment_open", "closed"],
      enrollment_open: ["enrollment_complete", "closed"],
      enrollment_complete: ["install_in_progress", "closed"],
      install_in_progress: ["active", "closed"],
      active: ["renewal_pending", "closed"],
      renewal_pending: ["renewed", "closed"],
      renewed: ["closed"],
      closed: ["draft"],
    };
    return map[caseData?.stage] || [];
  }, [caseData?.stage]);

  const validateMutation = useMutation({
    mutationFn: async () => {
      const currentDocs = await base44.entities.Document.filter({ case_id: caseData.id }, "-created_date", 200);
      return replaceCaseValidationResults(caseData, {
        quoteCount: scenarios.length,
        openTaskCount: tasks.filter((item) => !["completed", "cancelled"].includes(item.status)).length,
        documentCount: currentDocs.length,
      });
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["case-validation-results", caseData.id] });
      const errors = results.filter((item) => item.severity === "error").length;
      const warnings = results.filter((item) => item.severity === "warning").length;
      toast({ title: "Validation complete.", description: `This case has ${errors} errors and ${warnings} warnings.` });
    },
    onError: (error) => toast({ title: "Validation failed", description: error.message || "Validation could not be completed.", variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const nextUser = users.find((user) => user.email === assigneeEmail) || { email: assigneeEmail };
      return assignCase(caseData, nextUser, assignmentReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["activity", caseData.id] });
      setAssignmentOpen(false);
      toast({ title: "Assignment updated.", description: "The case assignee was updated successfully." });
    },
    onError: (error) => toast({ title: "Assignment failed", description: error.message || "The assignee could not be updated.", variant: "destructive" }),
  });

  const transitionMutation = useMutation({
    mutationFn: () => transitionCase(caseData, nextStage, {
      reason: statusReason,
      resolutionSummary,
      actorEmail: caseData.assigned_to,
      context: {
        openTaskCount: tasks.filter((item) => !["completed", "cancelled"].includes(item.status)).length,
        quoteCount: scenarios.length,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["activity", caseData.id] });
      queryClient.invalidateQueries({ queryKey: ["case-validation-results", caseData.id] });
      setStatusOpen(false);
      toast({ title: "Status updated", description: `The case was moved to ${nextStage.replace(/_/g, " ")}.` });
    },
    onError: (error) => toast({ title: "Action blocked", description: error.message || "The selected action is blocked by the current case status.", variant: "destructive" }),
  });

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => validateMutation.mutate()} disabled={validateMutation.isPending}>
        {validateMutation.isPending ? "Validating..." : "Validate"}
      </Button>
      <Button variant="outline" onClick={() => setAssignmentOpen(true)}>
        {caseData?.assigned_to ? "Reassign" : "Assign"}
      </Button>
      <Button onClick={() => setStatusOpen(true)} disabled={transitionOptions.length === 0}>
        {caseData?.stage === "closed" ? "Reopen" : "Process"}
      </Button>

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{caseData?.assigned_to ? "Reassign case" : "Assign case"}</DialogTitle>
            <DialogDescription>
              {caseData?.assigned_to ? `This case is already assigned to ${caseData.assigned_to}. Continue?` : "Assign this case to a user."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={assigneeEmail || "__unassigned__"} onValueChange={(value) => setAssigneeEmail(value === "__unassigned__" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">Unassigned</SelectItem>
                {users.map((user) => <SelectItem key={user.id} value={user.email}>{user.full_name || user.email}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea value={assignmentReason} onChange={(event) => setAssignmentReason(event.target.value)} placeholder="Assignment reason (optional)" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentOpen(false)}>Cancel</Button>
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>{assignMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{caseData?.stage === "closed" ? "Reopen case" : "Process case"}</DialogTitle>
            <DialogDescription>
              {caseData?.stage === "closed"
                ? "Reopening this case will return it to active workflow. Continue?"
                : "Select the next legal case status and provide context if needed."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={nextStage} onValueChange={setNextStage}>
              <SelectTrigger><SelectValue placeholder="Select next status" /></SelectTrigger>
              <SelectContent>
                {transitionOptions.map((option) => <SelectItem key={option} value={option}>{option.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder={nextStage === "closed" ? "Close reason" : "Reason (optional)"} />
            <Textarea value={resolutionSummary} onChange={(event) => setResolutionSummary(event.target.value)} placeholder="Resolution summary (required for close if notes are missing)" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button onClick={() => transitionMutation.mutate()} disabled={transitionMutation.isPending || !nextStage}>{transitionMutation.isPending ? "Processing..." : nextStage === "closed" ? "Close" : caseData?.stage === "closed" ? "Reopen" : "Execute"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}