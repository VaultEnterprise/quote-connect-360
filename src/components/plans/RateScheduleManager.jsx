import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, CheckCircle, AlertTriangle, Clock, Archive, Copy, Edit2, X } from "lucide-react";
import { toast } from "sonner";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const STATUS_BADGE = {
  valid:        "bg-green-100 text-green-700",
  has_errors:   "bg-red-100 text-red-700",
  has_warnings: "bg-amber-100 text-amber-700",
  pending:      "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = {
  plan_id: "", schedule_name: "", effective_date: "", termination_date: "",
  rating_basis: "age_band_area_tier", tobacco_mode: "none",
  plan_year: new Date().getFullYear() + 1,
  market_segment: "small_group", funding_type: "fully_insured",
  rating_model: "area_age_band_tier", tobacco_rating_flag: false,
  version_number: 1, state_scope: [], notes: "",
};

export default function RateScheduleManager({ plans, schedules, defaultPlanId }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, plan_id: defaultPlanId || "" });
  const [filterPlan, setFilterPlan] = useState(defaultPlanId || "all");
  const [stateInput, setStateInput] = useState("");

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, plan_id: defaultPlanId || "" });
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditId(s.id);
    setForm({
      plan_id: s.plan_id, schedule_name: s.schedule_name, effective_date: s.effective_date || "",
      termination_date: s.termination_date || "", rating_basis: s.rating_basis || "age_band_area_tier",
      tobacco_mode: s.tobacco_mode || "none", plan_year: s.plan_year || new Date().getFullYear() + 1,
      market_segment: s.market_segment || "small_group", funding_type: s.funding_type || "fully_insured",
      rating_model: s.rating_model || "area_age_band_tier", tobacco_rating_flag: !!s.tobacco_rating_flag,
      version_number: s.version_number || 1, state_scope: s.state_scope || [], notes: s.notes || "",
    });
    setShowForm(true);
  };

  const openClone = (s) => {
    setEditId(null);
    setForm({
      plan_id: s.plan_id, schedule_name: `${s.schedule_name} (Copy)`, effective_date: "",
      termination_date: "", rating_basis: s.rating_basis || "age_band_area_tier",
      tobacco_mode: s.tobacco_mode || "none", plan_year: s.plan_year || new Date().getFullYear() + 1,
      market_segment: s.market_segment || "small_group", funding_type: s.funding_type || "fully_insured",
      rating_model: s.rating_model || "area_age_band_tier", tobacco_rating_flag: !!s.tobacco_rating_flag,
      version_number: (s.version_number || 1) + 1, state_scope: s.state_scope || [], notes: s.notes || "",
    });
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form, uploaded_by: user?.email, plan_year: Number(form.plan_year), version_number: Number(form.version_number) };
      if (editId) return base44.entities.PlanRateSchedule.update(editId, payload);
      return base44.entities.PlanRateSchedule.create({ ...payload, validation_status: "pending", is_active: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-rate-schedules"] });
      toast.success(editId ? "Rate schedule updated" : "Rate schedule created");
      setShowForm(false);
      setForm({ ...EMPTY_FORM, plan_id: defaultPlanId || "" });
      setEditId(null);
    },
    onError: (error) => {
      toast.error(error.message || "Could not save the rate schedule");
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PlanRateSchedule.update(id, { is_active: !is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plan-rate-schedules"] }),
  });

  const addStateScope = () => {
    const s = stateInput.toUpperCase().trim();
    if (!s || form.state_scope.includes(s)) { setStateInput(""); return; }
    upd("state_scope", [...form.state_scope, s]);
    setStateInput("");
  };

  const removeStateScope = (s) => upd("state_scope", form.state_scope.filter(x => x !== s));

  const filtered = filterPlan === "all" ? schedules : schedules.filter(s => s.plan_id === filterPlan);
  const showPlanFilter = !defaultPlanId;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between flex-wrap">
        {showPlanFilter && (
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="w-56 h-8 text-xs"><SelectValue placeholder="Filter by plan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" onClick={openCreate} className="gap-1.5 ml-auto"><Plus className="w-3.5 h-3.5" />New Schedule</Button>
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
                      <Badge className={`text-xs ${STATUS_BADGE[s.validation_status] || STATUS_BADGE.pending}`}>
                        <ValidationIcon className="w-3 h-3 mr-1" />{s.validation_status || "pending"}
                      </Badge>
                      {!s.is_active && <Badge variant="outline" className="text-xs">Archived</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan?.plan_name || "Unknown plan"} · {s.rating_basis} · v{s.version_number} · {s.plan_year}
                      {s.tobacco_mode && s.tobacco_mode !== "none" && ` · Tobacco: ${s.tobacco_mode}`}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Effective: {s.effective_date || "—"}</span>
                      {s.termination_date && <span>Ends: {s.termination_date}</span>}
                      {s.row_count != null && <span>{s.row_count} rate rows</span>}
                      <span>{s.market_segment} · {s.funding_type}</span>
                    </div>
                    {s.state_scope?.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {s.state_scope.map(st => <Badge key={st} variant="outline" className="text-[10px] h-4 px-1">{st}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openEdit(s)}>
                      <Edit2 className="w-3 h-3" />Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openClone(s)}>
                      <Copy className="w-3 h-3" />Clone
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => toggleActive.mutate({ id: s.id, is_active: s.is_active })}>
                      <Archive className="w-3 h-3" />{s.is_active ? "Archive" : "Restore"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditId(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Rate Schedule" : "New Rate Schedule"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {!defaultPlanId && (
              <div>
                <label className="text-xs font-medium block mb-1">Plan <span className="text-destructive">*</span></label>
                <Select value={form.plan_id} onValueChange={v => upd("plan_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Select plan..." /></SelectTrigger>
                  <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name} — {p.carrier}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium block mb-1">Schedule Name <span className="text-destructive">*</span></label><Input value={form.schedule_name} onChange={e => upd("schedule_name", e.target.value)} placeholder="2026 Base Rates" /></div>
              <div><label className="text-xs font-medium block mb-1">Plan Year</label><Input type="number" value={form.plan_year} onChange={e => upd("plan_year", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium block mb-1">Effective Date <span className="text-destructive">*</span></label><Input type="date" value={form.effective_date} onChange={e => upd("effective_date", e.target.value)} /></div>
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
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium block mb-1">Version #</label><Input type="number" value={form.version_number} onChange={e => upd("version_number", e.target.value)} min={1} /></div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="trf" checked={!!form.tobacco_rating_flag} onChange={e => upd("tobacco_rating_flag", e.target.checked)} className="w-4 h-4" />
                <label htmlFor="trf" className="text-xs font-medium">Tobacco Rating Flag</label>
              </div>
            </div>

            {/* State Scope */}
            <div>
              <label className="text-xs font-medium block mb-1">State Scope <span className="text-muted-foreground">(leave empty = all states)</span></label>
              <div className="flex gap-2 mb-1.5">
                <Select value={stateInput} onValueChange={v => setStateInput(v)}>
                  <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue placeholder="Add state..." /></SelectTrigger>
                  <SelectContent>{US_STATES.filter(s => !form.state_scope.includes(s)).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addStateScope} disabled={!stateInput}>Add</Button>
              </div>
              {form.state_scope.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.state_scope.map(s => (
                    <Badge key={s} variant="outline" className="text-xs gap-1">
                      {s}
                      <button onClick={() => removeStateScope(s)} className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div><label className="text-xs font-medium block mb-1">Notes</label><Input value={form.notes} onChange={e => upd("notes", e.target.value)} placeholder="Optional notes" /></div>

            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!(form.plan_id || defaultPlanId) || !form.schedule_name || !form.effective_date || saveMutation.isPending}>
              {editId ? "Save Changes" : "Create Schedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}