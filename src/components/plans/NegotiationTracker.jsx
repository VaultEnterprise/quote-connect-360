import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, DollarSign, TrendingDown, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-600",
  expired: "bg-gray-100 text-gray-600",
};

export default function NegotiationTracker({ plans }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ carrier: "", plan_id: "", current_rate: "", target_rate: "", status: "open", notes: "" });

  const { data: logs = [] } = useQuery({
    queryKey: ["negotiation-audit-logs"],
    queryFn: () => base44.entities.PlanAuditLog.filter({ action: "rate_changed" }),
  });

  // Use CarrierPerformance as RFP storage (reuse entity with notes)
  const { data: negotiations = [] } = useQuery({
    queryKey: ["carrier-negotiations"],
    queryFn: () => base44.entities.CarrierPerformance.list("-created_date", 50),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CarrierPerformance.create({
        carrier_name: form.carrier,
        notes: JSON.stringify({ type: "negotiation", plan_id: form.plan_id, current_rate: parseFloat(form.current_rate), target_rate: parseFloat(form.target_rate), status: form.status, notes: form.notes, created_by: user?.email }),
        account_manager: user?.email,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["carrier-negotiations"] }); toast.success("Negotiation added"); setShowForm(false); setForm({ carrier: "", plan_id: "", current_rate: "", target_rate: "", status: "open", notes: "" }); },
  });

  // Parse negotiation records from notes field
  const items = negotiations.flatMap(n => {
    try {
      const parsed = JSON.parse(n.notes || "{}");
      if (parsed.type !== "negotiation") return [];
      const plan = plans.find(p => p.id === parsed.plan_id);
      const savings = parsed.current_rate && parsed.target_rate ? parsed.current_rate - parsed.target_rate : null;
      const pctSaving = savings && parsed.current_rate ? ((savings / parsed.current_rate) * 100).toFixed(1) : null;
      return [{ ...n, ...parsed, plan, savings, pctSaving }];
    } catch { return []; }
  });

  const totalSavings = items.filter(i => i.status === "won" && i.savings > 0).reduce((s, i) => s + i.savings, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Active RFPs", val: items.filter(i => ["open","in_progress"].includes(i.status)).length, icon: Clock },
            { label: "Won", val: items.filter(i => i.status === "won").length, icon: CheckCircle },
            { label: "Rate Savings Won", val: totalSavings > 0 ? `$${totalSavings.toFixed(2)}/mo` : "—", icon: DollarSign },
          ].map(kpi => (
            <div key={kpi.label} className="flex items-center gap-2 p-2 rounded-lg border bg-card text-sm">
              <kpi.icon className="w-4 h-4 text-primary" />
              <div><p className="font-bold text-base leading-none">{kpi.val}</p><p className="text-xs text-muted-foreground">{kpi.label}</p></div>
            </div>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" />Log Negotiation</Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground text-sm">No negotiations logged yet. Track carrier rate negotiations and RFP outcomes.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm">{item.carrier_name}</span>
                      {item.plan && <span className="text-xs text-muted-foreground">· {item.plan.plan_name}</span>}
                      <Badge className={`text-xs h-4 px-1.5 ${STATUS_STYLES[item.status] || STATUS_STYLES.open}`}>{item.status?.replace("_", " ")}</Badge>
                    </div>
                    {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {item.current_rate && <p className="text-xs text-muted-foreground">Current: <span className="font-medium">${item.current_rate}</span></p>}
                    {item.target_rate && <p className="text-xs text-muted-foreground">Target: <span className="font-medium text-primary">${item.target_rate}</span></p>}
                    {item.pctSaving && (
                      <div className="flex items-center gap-1 justify-end text-xs text-green-600 mt-0.5">
                        <TrendingDown className="w-3 h-3" /> {item.pctSaving}% saving
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent rate change audit log */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Recent Rate Changes (Audit)</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {logs.slice(0, 5).map(l => (
              <div key={l.id} className="flex items-center gap-2 text-xs text-muted-foreground border-b pb-1 last:border-0">
                <span className="text-foreground font-medium">{l.actor_email}</span>
                <span>·</span>
                <span>{l.description}</span>
                <span className="ml-auto">{l.created_date ? format(new Date(l.created_date), "MMM d") : ""}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Rate Negotiation</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Input placeholder="Carrier name" value={form.carrier} onChange={e => setForm(p => ({ ...p, carrier: e.target.value }))} />
            <Select value={form.plan_id} onValueChange={v => setForm(p => ({ ...p, plan_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Related plan (optional)" /></SelectTrigger>
              <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Current rate $" value={form.current_rate} onChange={e => setForm(p => ({ ...p, current_rate: e.target.value }))} />
              <Input type="number" placeholder="Target rate $" value={form.target_rate} onChange={e => setForm(p => ({ ...p, target_rate: e.target.value }))} />
            </div>
            <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["open","in_progress","won","lost","expired"].map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="h-20 text-sm" />
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.carrier || createMutation.isPending}>Save Negotiation</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}