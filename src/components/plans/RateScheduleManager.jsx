import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckCircle, AlertTriangle, Clock, Archive } from "lucide-react";
import { toast } from "sonner";

const STATUS_BADGE = {
  valid: "bg-green-100 text-green-700",
  has_errors: "bg-red-100 text-red-700",
  has_warnings: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = {
  plan_id: "", schedule_name: "", effective_date: "", termination_date: "",
  rating_basis: "age_band_area_tier", tobacco_mode: "none", plan_year: new Date().getFullYear() + 1,
  market_segment: "small_group", funding_type: "fully_insured", rating_model: "area_age_band_tier",
  tobacco_rating_flag: false, version_number: 1, notes: "",
};

export default function RateScheduleManager({ plans, schedules }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterPlan, setFilterPlan] = useState("all");

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const createMutation = useMutation({
    mutationFn: () => base44.entities.PlanRateSchedule.create({ ...form, uploaded_by: user?.email, validation_status: "pending", is_active: true, plan_year: Number(form.plan_year), version_number: Number(form.version_number) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plan-rate-schedules"] }); toast.success("Rate schedule created"); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PlanRateSchedule.update(id, { is_active: !is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-rate-schedules"] }),
  });

  const filtered = filterPlan === "all" ? schedules : schedules.filter(s => s.plan_id === filterPlan);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        <Select value={filterPlan} onValueChange={setFilterPlan}>
          <SelectTrigger className="w-56 h-8 text-xs"><SelectValue placeholder="Filter by plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5"><Plus className="w-3.5 h-3.5" />New Schedule</Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground text-sm">No rate schedules yet. Create one to begin loading rate detail rows.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => {
            const plan = plans.find(p => p.id === s.plan_id);
            const ValidationIcon = s.validation_status === "valid" ? CheckCircle : s.validation_status === "has_errors" ? AlertTriangle : Clock;
            return (
              <Card key={s.id} className={s.is_active ? "" : "opacity-60"}>
                <CardContent className="p-4 flex items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{s.schedule_name}</span>
                      <Badge className={`text-xs ${STATUS_BADGE[s.validation_status]}`}>
                        <ValidationIcon className="w-3 h-3 mr-1" />{s.validation_status}
                      </Badge>
                      {!s.is_active && <Badge variant="outline" className="text-xs">Archived</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{plan?.plan_name || "Unknown plan"} · {s.rating_basis} · v{s.version_number} · {s.plan_year}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Effective: {s.effective_date || "—"}</span>
                      {s.termination_date && <span>Ends: {s.termination_date}</span>}
                      {s.row_count != null && <span>{s.row_count} rate rows</span>}
                      <span>{s.market_segment} · {s.funding_type}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => toggleActive.mutate({ id: s.id, is_active: s.is_active })}>
                    <Archive className="w-3 h-3" />{s.is_active ? "Archive" : "Restore"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Rate Schedule</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium block mb-1">Plan <span className="text-destructive">*</span></label>
              <Select value={form.plan_id} onValueChange={v => upd("plan_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select plan..." /></SelectTrigger>
                <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name} — {p.carrier}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium block mb-1">Schedule Name</label><Input value={form.schedule_name} onChange={e => upd("schedule_name", e.target.value)} placeholder="2026 Base Rates" /></div>
              <div><label className="text-xs font-medium block mb-1">Plan Year</label><Input type="number" value={form.plan_year} onChange={e => upd("plan_year", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium block mb-1">Effective Date</label><Input type="date" value={form.effective_date} onChange={e => upd("effective_date", e.target.value)} /></div>
              <div><label className="text-xs font-medium block mb-1">Termination Date</label><Input type="date" value={form.termination_date} onChange={e => upd("termination_date", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Rating Basis</label>
                <Select value={form.rating_basis} onValueChange={v => upd("rating_basis", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="age_band_area_tier">Age Band + Area + Tier</SelectItem>
                    <SelectItem value="composite_area_tier">Composite + Area + Tier</SelectItem>
                    <SelectItem value="age_band_only">Age Band Only</SelectItem>
                    <SelectItem value="composite_only">Composite Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Tobacco Mode</label>
                <Select value={form.tobacco_mode} onValueChange={v => upd("tobacco_mode", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="surcharge">Surcharge</SelectItem>
                    <SelectItem value="separate_rate">Separate Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Market Segment</label>
                <Select value={form.market_segment} onValueChange={v => upd("market_segment", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small_group">Small Group</SelectItem>
                    <SelectItem value="large_group">Large Group</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Funding Type</label>
                <Select value={form.funding_type} onValueChange={v => upd("funding_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully_insured">Fully Insured</SelectItem>
                    <SelectItem value="self_funded">Self-Funded</SelectItem>
                    <SelectItem value="level_funded">Level Funded</SelectItem>
                    <SelectItem value="reference_based">Reference-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs font-medium block mb-1">Version #</label><Input type="number" value={form.version_number} onChange={e => upd("version_number", e.target.value)} min={1} /></div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.plan_id || !form.schedule_name || !form.effective_date || createMutation.isPending}>
              Create Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}