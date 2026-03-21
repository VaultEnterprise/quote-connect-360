import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save, Trash2 } from "lucide-react";

const DEFAULT_COMPOSITE = { ee_rate: "", es_rate: "", ec_rate: "", fam_rate: "" };

export default function RateTableEditor({ planId, rateTables }) {
  const queryClient = useQueryClient();
  const existing = rateTables[0];
  const [rateType, setRateType] = useState(existing?.rate_type || "composite");
  const [composite, setComposite] = useState({
    ee_rate: existing?.ee_rate ?? "",
    es_rate: existing?.es_rate ?? "",
    ec_rate: existing?.ec_rate ?? "",
    fam_rate: existing?.fam_rate ?? "",
  });
  const [ageBanded, setAgeBanded] = useState(existing?.age_banded_rates || []);
  const [effectiveDate, setEffectiveDate] = useState(existing?.effective_date || "");
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        plan_id: planId,
        rate_type: rateType,
        effective_date: effectiveDate || undefined,
        ...(rateType === "composite" ? {
          ee_rate: parseFloat(composite.ee_rate) || 0,
          es_rate: parseFloat(composite.es_rate) || 0,
          ec_rate: parseFloat(composite.ec_rate) || 0,
          fam_rate: parseFloat(composite.fam_rate) || 0,
        } : {
          age_banded_rates: ageBanded.map(r => ({ age: Number(r.age), rate: parseFloat(r.rate) })),
        }),
      };
      if (existing?.id) return base44.entities.PlanRateTable.update(existing.id, payload);
      return base44.entities.PlanRateTable.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-tables", planId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.PlanRateTable.delete(existing.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rate-tables", planId] }),
  });

  const addAgeBandRow = () => setAgeBanded([...ageBanded, { age: "", rate: "" }]);
  const updateRow = (i, field, val) => setAgeBanded(ageBanded.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const removeRow = (i) => setAgeBanded(ageBanded.filter((_, idx) => idx !== i));

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Select value={rateType} onValueChange={setRateType}>
          <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="composite">Composite</SelectItem>
            <SelectItem value="age_banded">Age Banded</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className="h-7 text-xs w-36" placeholder="Effective date" />
      </div>

      {rateType === "composite" ? (
        <div className="grid grid-cols-2 gap-2">
          {[["ee_rate","EE Only"],["es_rate","EE + Spouse"],["ec_rate","EE + Child"],["fam_rate","Family"]].map(([key,label]) => (
            <div key={key}>
              <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  className="h-7 text-xs pl-5"
                  value={composite[key]}
                  onChange={e => setComposite({ ...composite, [key]: e.target.value })}
                  placeholder="0.00"
                  type="number"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] text-muted-foreground px-1">
            <span>Age</span><span>Monthly Rate</span><span />
          </div>
          {ageBanded.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <Input className="h-7 text-xs" value={row.age} onChange={e => updateRow(i, "age", e.target.value)} placeholder="Age" type="number" />
              <Input className="h-7 text-xs" value={row.rate} onChange={e => updateRow(i, "rate", e.target.value)} placeholder="$0.00" type="number" />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeRow(i)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="h-7 text-xs w-full" onClick={addAgeBandRow}>
            <Plus className="w-3 h-3 mr-1" /> Add Row
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-3 h-3 mr-1" /> {saved ? "Saved!" : saveMutation.isPending ? "Saving..." : "Save Rates"}
        </Button>
        {existing?.id && (
          <Button variant="outline" size="sm" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}