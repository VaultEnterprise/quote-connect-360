import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CreateProposalFromScenario({ scenario, open, onClose }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: caseData } = useQuery({
    queryKey: ["case", scenario?.case_id],
    queryFn: () => base44.entities.BenefitCase.filter({ id: scenario.case_id }).then(r => r[0]),
    enabled: !!scenario?.case_id,
  });

  const [form, setForm] = useState({
    title: `${scenario?.name || "Proposal"} — Proposal`,
    cover_message: "",
    broker_name: "",
    broker_email: "",
  });

  const create = useMutation({
    mutationFn: () => base44.entities.Proposal.create({
      case_id: scenario.case_id,
      scenario_id: scenario.id,
      title: form.title,
      cover_message: form.cover_message,
      broker_name: form.broker_name,
      broker_email: form.broker_email,
      employer_name: caseData?.employer_name,
      effective_date: scenario.effective_date,
      total_monthly_premium: scenario.total_monthly_premium,
      employer_monthly_cost: scenario.employer_monthly_cost,
      employee_avg_cost: scenario.employee_monthly_cost_avg,
      status: "draft",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      toast({ title: "Proposal created", description: "Draft proposal created. Go to Proposals to finalize and send." });
      onClose();
      navigate("/proposals");
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-4 h-4" /> Create Proposal from Scenario
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            Creates a proposal draft linked to <span className="font-medium text-foreground">"{scenario?.name}"</span>.
          </p>
          <div>
            <Label>Proposal Title <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Broker Name</Label>
              <Input value={form.broker_name} onChange={e => set("broker_name", e.target.value)} className="mt-1.5" placeholder="Your name" />
            </div>
            <div>
              <Label>Broker Email</Label>
              <Input type="email" value={form.broker_email} onChange={e => set("broker_email", e.target.value)} className="mt-1.5" placeholder="you@agency.com" />
            </div>
          </div>
          <div>
            <Label>Cover Message (optional)</Label>
            <Textarea value={form.cover_message} onChange={e => set("cover_message", e.target.value)} rows={3} className="mt-1.5" placeholder="Dear [Employer],&#10;Please find your benefits proposal attached..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>
            {create.isPending ? "Creating..." : "Create Proposal →"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}