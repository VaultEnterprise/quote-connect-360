import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Lock, AlertTriangle, Plus, Save, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const emptyForm = { ee_only: "", ee_spouse: "", ee_children: "", family: "", prior_year_ee: "", rate_type: "composite", effective_date: "", regulatory_notes: "" };

export default function MultiStateRateEditor({ planId, planName }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedState, setSelectedState] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newState, setNewState] = useState("CA");
  const [form, setForm] = useState(emptyForm);

  const { data: stateRates = [], isLoading } = useQuery({
    queryKey: ["plan-rates-by-state", planId],
    queryFn: () => base44.entities.PlanRateByState.filter({ plan_id: planId }),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["rate-variance-alerts", planId],
    queryFn: () => base44.entities.RateVarianceAlert.filter({ plan_id: planId }),
  });

  const current = useMemo(() => stateRates.find(r => r.state === selectedState), [stateRates, selectedState]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (current) {
        return base44.entities.PlanRateByState.update(current.id, data);
      } else {
        return base44.entities.PlanRateByState.create({ plan_id: planId, state: newState, ...data });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-rates-by-state", planId] });
      toast.success("Rates saved");
      setShowAddDialog(false);
      checkVariance();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanRateByState.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plan-rates-by-state", planId] }); setSelectedState(null); },
  });

  const checkVariance = async () => {
    stateRates.forEach(async (r) => {
      if (r.prior_year_ee && r.ee_only) {
        const pct = ((r.ee_only - r.prior_year_ee) / r.prior_year_ee) * 100;
        if (Math.abs(pct) > 10) {
          const existing = alerts.find(a => a.state === r.state);
          const alertData = {
            plan_id: planId, state: r.state, alert_type: "increase_threshold",
            variance_percent: parseFloat(pct.toFixed(1)),
            severity: pct > 20 ? "critical" : pct > 15 ? "high" : "medium",
            alert_message: `Rate ${pct > 0 ? "increase" : "decrease"} of ${Math.abs(pct).toFixed(1)}% YoY for ${r.state}`,
            affected_tiers: ["EE"]
          };
          if (!existing) await base44.entities.RateVarianceAlert.create(alertData);
          else await base44.entities.RateVarianceAlert.update(existing.id, alertData);
          qc.invalidateQueries({ queryKey: ["rate-variance-alerts", planId] });
        }
      }
    });
  };

  const startEdit = (rate) => {
    setSelectedState(rate.state);
    setForm({ ee_only: rate.ee_only || "", ee_spouse: rate.ee_spouse || "", ee_children: rate.ee_children || "", family: rate.family || "", prior_year_ee: rate.prior_year_ee || "", rate_type: rate.rate_type || "composite", effective_date: rate.effective_date || "", regulatory_notes: rate.regulatory_notes || "" });
  };

  const statesAdded = stateRates.map(r => r.state);
  const statesAvailable = US_STATES.filter(s => !statesAdded.includes(s));

  const getVariancePct = (r) => {
    if (!r.prior_year_ee || !r.ee_only) return null;
    return (((r.ee_only - r.prior_year_ee) / r.prior_year_ee) * 100).toFixed(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Multi-State Rate Tables</h3>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)} className="gap-1 h-7 text-xs">
          <Plus className="w-3 h-3" /> Add State
        </Button>
      </div>

      {/* Variance Alerts Banner */}
      {alerts.filter(a => !a.is_reviewed).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">{alerts.filter(a => !a.is_reviewed).length} Rate Variance Alert(s)</p>
            {alerts.filter(a => !a.is_reviewed).map(a => (
              <p key={a.id} className="text-amber-700 text-xs">{a.alert_message}</p>
            ))}
          </div>
        </div>
      )}

      {/* State Rate Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[...Array(3)].map((_,i) => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}</div>
      ) : stateRates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">No state rates added yet. Click "Add State" to begin.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {stateRates.map(r => {
            const variance = getVariancePct(r);
            const alert = alerts.find(a => a.state === r.state);
            return (
              <Card key={r.id} className={`cursor-pointer border-2 transition-all ${selectedState === r.state ? "border-primary" : "border-border hover:border-primary/40"}`} onClick={() => startEdit(r)}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">{r.state}</span>
                      {r.is_locked && <Lock className="w-3 h-3 text-blue-500" />}
                      <Badge variant="outline" className="text-xs h-4 px-1">{r.rate_type === "age_banded" ? "Age-Band" : "Composite"}</Badge>
                    </div>
                    {alert && !alert.is_reviewed && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div><span className="text-muted-foreground">EE: </span><span className="font-medium">${r.ee_only || 0}</span></div>
                    <div><span className="text-muted-foreground">ES: </span><span className="font-medium">${r.ee_spouse || 0}</span></div>
                    <div><span className="text-muted-foreground">EC: </span><span className="font-medium">${r.ee_children || 0}</span></div>
                    <div><span className="text-muted-foreground">FAM: </span><span className="font-medium">${r.family || 0}</span></div>
                  </div>
                  {variance !== null && (
                    <div className={`mt-2 text-xs flex items-center gap-1 ${parseFloat(variance) > 0 ? "text-red-600" : "text-green-600"}`}>
                      {parseFloat(variance) > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      YoY: {variance > 0 ? "+" : ""}{variance}%
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inline Edit Panel */}
      {selectedState && current && (
        <Card className="border-primary/40">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Editing: {selectedState} Rates</CardTitle>
            <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs gap-1" onClick={() => deleteMutation.mutate(current.id)}>
              <Trash2 className="w-3 h-3" /> Remove
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[["ee_only","EE Only"],["ee_spouse","EE+Spouse"],["ee_children","EE+Children"],["family","Family"],["prior_year_ee","Prior Year EE (for YoY)"],["effective_date","Effective Date"]].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium mb-1 block">{label}</label>
                  <Input type={key === "effective_date" ? "date" : "number"} step="0.01" value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="h-8 text-xs" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Regulatory Notes</label>
              <Input value={form.regulatory_notes} onChange={e => setForm({...form, regulatory_notes: e.target.value})} className="h-8 text-xs" placeholder="State-specific compliance notes..." />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="gap-1">
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedState(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add State Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add State Rate Table</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">State</label>
              <Select value={newState} onValueChange={setNewState}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statesAvailable.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Rating Type</label>
              <Select value={form.rate_type} onValueChange={v => setForm({...form, rate_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="composite">Composite (Tier-Based)</SelectItem>
                  <SelectItem value="age_banded">Age-Banded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["ee_only","EE Only ($)"],["ee_spouse","EE+Spouse ($)"],["ee_children","EE+Children ($)"],["family","Family ($)"]].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs font-medium mb-1 block">{label}</label>
                  <Input type="number" step="0.01" value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="h-8 text-xs" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Effective Date</label>
              <Input type="date" value={form.effective_date} onChange={e => setForm({...form, effective_date: e.target.value})} className="h-8 text-xs" />
            </div>
            <Button className="w-full" onClick={() => { saveMutation.mutate({ ...form, state: newState }); }} disabled={saveMutation.isPending}>
              Add Rate Table
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}