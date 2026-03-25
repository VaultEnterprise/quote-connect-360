import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_BRACKETS = [
  { age_min: 0, age_max: 14 }, { age_min: 15, age_max: 24 },
  { age_min: 25, age_max: 34 }, { age_min: 35, age_max: 44 },
  { age_min: 45, age_max: 54 }, { age_min: 55, age_max: 64 }, { age_min: 65, age_max: 99 }
];

export default function AgeBandedRateEditor({ planId, rateStateId, state }) {
  const qc = useQueryClient();
  const [newRow, setNewRow] = useState({ age_min: "", age_max: "", ee_rate: "", es_rate: "", ec_rate: "", family_rate: "", tobacco_surcharge: "" });
  const [showAdd, setShowAdd] = useState(false);

  const { data: bands = [], isLoading } = useQuery({
    queryKey: ["age-bands", planId, state],
    queryFn: () => base44.entities.AgeBandedRate.filter({ plan_id: planId, state }),
    enabled: !!planId && !!state,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AgeBandedRate.create({ ...data, plan_id: planId, state, plan_rate_state_id: rateStateId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["age-bands", planId, state] }); setNewRow({ age_min: "", age_max: "", ee_rate: "", es_rate: "", ec_rate: "", family_rate: "", tobacco_surcharge: "" }); setShowAdd(false); toast.success("Age band added"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AgeBandedRate.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["age-bands", planId, state] }),
  });

  // Overlap validation
  const hasOverlap = useMemo(() => {
    const sorted = [...bands].sort((a, b) => a.age_min - b.age_min);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].age_min <= sorted[i-1].age_max) return true;
    }
    return false;
  }, [bands]);

  const loadDefaults = async () => {
    const existing = bands.map(b => b.age_min);
    const toAdd = DEFAULT_BRACKETS.filter(b => !existing.includes(b.age_min));
    for (const b of toAdd) {
      await base44.entities.AgeBandedRate.create({ ...b, ee_rate: 0, es_rate: 0, ec_rate: 0, family_rate: 0, plan_id: planId, state, plan_rate_state_id: rateStateId });
    }
    qc.invalidateQueries({ queryKey: ["age-bands", planId, state] });
    toast.success("Default age brackets loaded");
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Age-Banded Rates — {state}
            {hasOverlap && <Badge className="bg-red-100 text-red-700 text-xs"><AlertCircle className="w-3 h-3 mr-1" />Overlap Detected</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            {bands.length === 0 && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={loadDefaults}>Load Defaults</Button>}
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-3 h-3" /> Add Band
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-20 rounded bg-muted animate-pulse" />
        ) : bands.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">No age bands defined. Load defaults or add manually.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2 font-medium">Age Range</th>
                  <th className="text-right py-2 pr-2 font-medium">EE Rate</th>
                  <th className="text-right py-2 pr-2 font-medium">EE+Sp</th>
                  <th className="text-right py-2 pr-2 font-medium">EE+Ch</th>
                  <th className="text-right py-2 pr-2 font-medium">Family</th>
                  <th className="text-right py-2 pr-2 font-medium">Tobacco</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {[...bands].sort((a, b) => a.age_min - b.age_min).map((b, i, arr) => {
                  const prevMax = i > 0 ? arr[i-1].age_max : null;
                  const overlap = prevMax !== null && b.age_min <= prevMax;
                  return (
                    <tr key={b.id} className={`border-b ${overlap ? "bg-red-50" : ""}`}>
                      <td className="py-1.5 pr-2 font-medium">{b.age_min}–{b.age_max}</td>
                      <td className="py-1.5 pr-2 text-right">${parseFloat(b.ee_rate || 0).toFixed(2)}</td>
                      <td className="py-1.5 pr-2 text-right">${parseFloat(b.es_rate || 0).toFixed(2)}</td>
                      <td className="py-1.5 pr-2 text-right">${parseFloat(b.ec_rate || 0).toFixed(2)}</td>
                      <td className="py-1.5 pr-2 text-right">${parseFloat(b.family_rate || 0).toFixed(2)}</td>
                      <td className="py-1.5 pr-2 text-right">{b.tobacco_surcharge ? `+$${b.tobacco_surcharge}` : "—"}</td>
                      <td className="py-1.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(b.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showAdd && (
          <div className="mt-3 border rounded-lg p-3 space-y-3 bg-muted/30">
            <p className="text-xs font-medium">New Age Band</p>
            <div className="grid grid-cols-3 gap-2">
              {[["age_min","Age Min"],["age_max","Age Max"],["ee_rate","EE Rate ($)"],["es_rate","EE+Sp ($)"],["ec_rate","EE+Ch ($)"],["family_rate","Family ($)"],["tobacco_surcharge","Tobacco (+$)"]].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                  <Input type="number" step="0.01" value={newRow[key]} onChange={e => setNewRow({...newRow, [key]: e.target.value})} className="h-7 text-xs" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => createMutation.mutate(newRow)} disabled={!newRow.age_min || !newRow.age_max || createMutation.isPending}>
                <Save className="w-3 h-3" /> Add
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}