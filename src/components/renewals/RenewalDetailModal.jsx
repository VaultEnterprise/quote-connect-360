import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const STATUSES = [
  { value: "pre_renewal", label: "Pre-Renewal" },
  { value: "marketed", label: "Marketed" },
  { value: "options_prepared", label: "Options Prepared" },
  { value: "employer_review", label: "Employer Review" },
  { value: "decision_made", label: "Decision Made" },
  { value: "install_renewal", label: "Installing Renewal" },
  { value: "active_renewal", label: "Active Renewal" },
  { value: "completed", label: "Completed" },
];

export default function RenewalDetailModal({ renewal, open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    status: renewal?.status || "pre_renewal",
    renewal_premium: renewal?.renewal_premium || "",
    rate_change_percent: renewal?.rate_change_percent || "",
    disruption_score: renewal?.disruption_score || "",
    recommendation: renewal?.recommendation || "",
    decision: renewal?.decision || "",
    decision_date: renewal?.decision_date || "",
    notes: renewal?.notes || "",
    assigned_to: renewal?.assigned_to || "",
  });

  const save = useMutation({
    mutationFn: () => base44.entities.RenewalCycle.update(renewal.id, {
      ...form,
      renewal_premium: form.renewal_premium ? Number(form.renewal_premium) : undefined,
      rate_change_percent: form.rate_change_percent ? Number(form.rate_change_percent) : undefined,
      disruption_score: form.disruption_score ? Number(form.disruption_score) : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["renewals-all"] });
      onClose();
    },
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const rateChange = Number(form.rate_change_percent);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Renewal — {renewal?.employer_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Rate comparison */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Current Premium</p>
              <p className="text-lg font-bold">{renewal?.current_premium ? `$${renewal.current_premium.toLocaleString()}` : "—"}</p>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              {rateChange > 0 ? <TrendingUp className="w-6 h-6 text-destructive" /> : rateChange < 0 ? <TrendingDown className="w-6 h-6 text-green-500" /> : <Minus className="w-5 h-5 text-muted-foreground" />}
              <p className={`text-sm font-semibold mt-1 ${rateChange > 0 ? "text-destructive" : rateChange < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                {rateChange > 0 ? "+" : ""}{rateChange || "—"}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Renewal Premium</p>
              <p className="text-lg font-bold">{form.renewal_premium ? `$${Number(form.renewal_premium).toLocaleString()}` : "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Recommendation</Label>
              <Select value={form.recommendation} onValueChange={v => set("recommendation", v)}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="renew_as_is">Renew As-Is</SelectItem>
                  <SelectItem value="renew_with_changes">Renew With Changes</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="terminate">Terminate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Renewal Premium ($)</Label>
              <Input type="number" value={form.renewal_premium} onChange={e => set("renewal_premium", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Rate Change (%)</Label>
              <Input type="number" step="0.1" value={form.rate_change_percent} onChange={e => set("rate_change_percent", e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Disruption Score</Label>
              <Input type="number" min="0" max="100" value={form.disruption_score} onChange={e => set("disruption_score", e.target.value)} className="mt-1.5" placeholder="0–100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Decision</Label>
              <Input value={form.decision} onChange={e => set("decision", e.target.value)} className="mt-1.5" placeholder="Employer's decision" />
            </div>
            <div>
              <Label>Decision Date</Label>
              <Input type="date" value={form.decision_date} onChange={e => set("decision_date", e.target.value)} className="mt-1.5" />
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
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}