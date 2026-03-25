import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, Trash2, AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

const AGE_BANDS = ["Under25","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60-64","65+"];
const TIERS = ["EE","ES","EC","FAM"];
const TIER_LABELS = { EE: "Single / EE Only", ES: "EE + Spouse", EC: "EE + Child(ren)", FAM: "Family" };

function parseCSVRates(text, scheduleId, planId) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g,"_"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",");
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j]?.trim(); });
    // Normalize tier
    const rawTier = row.tier_code || row.tier || row.coverage_tier || "";
    const tierMap = { "single":"EE","ee":"EE","employee":"EE","ee+sp":"ES","ee+spouse":"ES","ee+ch":"EC","ee+children":"EC","ee+ch(ren)":"EC","family":"FAM","fam":"FAM" };
    const normalizedTier = tierMap[rawTier.toLowerCase()] || rawTier.toUpperCase();
    if (!TIERS.includes(normalizedTier)) continue;

    rows.push({
      rate_schedule_id: scheduleId,
      plan_id: planId,
      rating_area_code: row.rating_area_code || row.area_code || row.area || "",
      age_band_code: row.age_band_code || row.age_band || row.age || "",
      tier_code: normalizedTier,
      tier_label_raw: rawTier,
      monthly_rate: parseFloat(row.monthly_rate || row.rate || 0),
      tobacco_flag: row.tobacco_flag === "true" || row.tobacco_flag === "1",
      is_active: true,
    });
  }
  return rows;
}

export default function RateDetailGrid({ plans, schedules }) {
  const qc = useQueryClient();
  const [scheduleId, setScheduleId] = useState("");
  const [newRow, setNewRow] = useState({ rating_area_code: "", age_band_code: "", tier_code: "EE", monthly_rate: "", tobacco_flag: false, effective_date: "", termination_date: "" });
  const [csvText, setCsvText] = useState("");
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [areaFilter, setAreaFilter] = useState("all");
  const [editRowId, setEditRowId] = useState(null);
  const [editRate, setEditRate] = useState("");

  const schedule = schedules.find(s => s.id === scheduleId);
  const plan = plans.find(p => p.id === schedule?.plan_id);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["rate-detail", scheduleId],
    queryFn: () => base44.entities.PlanRateDetail.filter({ rate_schedule_id: scheduleId }),
    enabled: !!scheduleId,
  });

  const addMutation = useMutation({
    mutationFn: () => base44.entities.PlanRateDetail.create({
      ...newRow, rate_schedule_id: scheduleId, plan_id: schedule?.plan_id,
      monthly_rate: parseFloat(newRow.monthly_rate), annual_rate: parseFloat(newRow.monthly_rate) * 12, is_active: true,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rate-detail", scheduleId] }); setNewRow({ rating_area_code: "", age_band_code: "", tier_code: "EE", monthly_rate: "" }); toast.success("Rate row added"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanRateDetail.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-detail", scheduleId] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, monthly_rate }) => base44.entities.PlanRateDetail.update(id, { monthly_rate: parseFloat(monthly_rate), annual_rate: parseFloat(monthly_rate) * 12 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rate-detail", scheduleId] }); setEditRowId(null); toast.success("Rate updated"); },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const rows = parseCSVRates(csvText, scheduleId, schedule?.plan_id);
      if (!rows.length) throw new Error("No valid rows parsed from CSV");
      const res = await base44.functions.invoke("planRatingEngine", {
        action: "importRateRows",
        rows,
        rateScheduleId: scheduleId,
        planId: schedule?.plan_id,
        sourceFileName: "manual_csv_import",
      });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["rate-detail", scheduleId] });
      qc.invalidateQueries({ queryKey: ["import-runs"] });
      const msg = `${data.success} rows imported · ${data.errors} errors · Run ID: ${data.run_id?.slice(-6)}`;
      if (data.errors > 0) toast.warning(msg);
      else toast.success(`${data.success} rate rows imported`);
      setCsvText(""); setShowCsvImport(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const exportCSV = () => {
    const header = "rating_area_code,age_band_code,tier_code,tier_label,monthly_rate,tobacco_flag";
    const rows = rates.map(r => `${r.rating_area_code},${r.age_band_code},${r.tier_code},"${TIER_LABELS[r.tier_code] || r.tier_code}",${r.monthly_rate},${r.tobacco_flag || false}`);
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rate_detail_${scheduleId}.csv`; a.click();
  };

  const allAreas = [...new Set(rates.map(r => r.rating_area_code))].sort();
  const byArea = rates.reduce((m, r) => { if (!m[r.rating_area_code]) m[r.rating_area_code] = []; m[r.rating_area_code].push(r); return m; }, {});
  const filteredByArea = areaFilter === "all" ? byArea : Object.fromEntries(Object.entries(byArea).filter(([k]) => k === areaFilter));

  // Completeness check per area: each area+band combo should have all 4 tiers
  const completenessWarnings = [];
  Object.entries(byArea).forEach(([area, rows]) => {
    const bands = [...new Set(rows.map(r => r.age_band_code))];
    bands.forEach(band => {
      const tiers = rows.filter(r => r.age_band_code === band).map(r => r.tier_code);
      const missing = TIERS.filter(t => !tiers.includes(t));
      if (missing.length) completenessWarnings.push(`${area} / ${band}: missing tiers ${missing.join(", ")}`);
    });
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={scheduleId} onValueChange={setScheduleId}>
          <SelectTrigger className="w-72 h-8 text-xs"><SelectValue placeholder="Select rate schedule..." /></SelectTrigger>
          <SelectContent>
            {schedules.filter(s => s.is_active).map(s => {
              const p = plans.find(pl => pl.id === s.plan_id);
              return <SelectItem key={s.id} value={s.id}>{s.schedule_name} — {p?.plan_name || "Unknown"}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        {scheduleId && (
          <>
            <Badge variant="outline" className="text-xs">{rates.length} rows</Badge>
            {allAreas.length > 0 && (
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-36 h-7 text-xs"><SelectValue placeholder="All areas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {allAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowCsvImport(!showCsvImport)} className="h-7 text-xs gap-1"><Upload className="w-3 h-3" />Import CSV</Button>
            <Button size="sm" variant="outline" onClick={exportCSV} className="h-7 text-xs gap-1"><Download className="w-3 h-3" />Export CSV</Button>
          </>
        )}
      </div>

      {/* CSV import panel */}
      {showCsvImport && scheduleId && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2"><CardTitle className="text-xs">CSV Import — Expected columns: rating_area_code, age_band_code, tier_code (or tier), monthly_rate</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Tier values: Single/EE → EE · EE+Sp → ES · EE+Ch(ren) → EC · Family → FAM</p>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} className="w-full h-32 text-xs font-mono border rounded p-2 bg-muted/30" placeholder="rating_area_code,age_band_code,tier_code,monthly_rate&#10;CA001,Under25,EE,312.50&#10;CA001,Under25,ES,625.00" />
            <Button size="sm" onClick={() => importMutation.mutate()} disabled={!csvText || importMutation.isPending} className="gap-1">
              <Upload className="w-3 h-3" />{importMutation.isPending ? "Importing..." : "Import Rows"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!scheduleId && (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground text-sm">Select a rate schedule to view and manage its rate detail rows.</CardContent></Card>
      )}

      {scheduleId && (
        <>
          {/* Completeness warnings */}
          {completenessWarnings.length > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 space-y-0.5">
              <p className="font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Tier completeness issues ({completenessWarnings.length}):</p>
              {completenessWarnings.slice(0, 5).map((w, i) => <p key={i}>· {w}</p>)}
              {completenessWarnings.length > 5 && <p>...and {completenessWarnings.length - 5} more</p>}
            </div>
          )}

          {/* Add row */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-end gap-2 flex-wrap">

          {/* Rate grid grouped by area */}
          {isLoading ? <div className="h-32 rounded bg-muted animate-pulse" /> : Object.entries(filteredByArea).map(([area, areaRates]) => (
            <Card key={area}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2">Rating Area: <Badge variant="outline">{area}</Badge> <span className="text-muted-foreground font-normal">({areaRates.length} rows)</span></CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-muted/50 border-b"><th className="text-left px-3 py-1.5">Age Band</th><th className="text-center px-3 py-1.5">Tier</th><th className="text-center px-3 py-1.5">Label</th><th className="text-right px-3 py-1.5">Monthly Rate</th><th className="text-right px-3 py-1.5">Annual</th><th className="px-2"></th></tr></thead>
                    <tbody>
                      {areaRates.sort((a,b) => AGE_BANDS.indexOf(a.age_band_code) - AGE_BANDS.indexOf(b.age_band_code)).map(r => (
                        <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="px-3 py-1.5 font-mono">{r.age_band_code}</td>
                          <td className="px-3 py-1.5 text-center"><Badge className="text-xs h-4 px-1">{r.tier_code}</Badge></td>
                          <td className="px-3 py-1.5 text-center text-muted-foreground">{TIER_LABELS[r.tier_code]}</td>
                          <td className="px-3 py-1.5 text-right">
                            {editRowId === r.id ? (
                              <div className="flex items-center gap-1 justify-end">
                                <Input type="number" step="0.01" value={editRate} onChange={e => setEditRate(e.target.value)} className="h-5 text-xs w-20" autoFocus />
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => editMutation.mutate({ id: r.id, monthly_rate: editRate })}><CheckCircle className="w-3 h-3 text-green-600" /></Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditRowId(null)}><X className="w-3 h-3" /></Button>
                              </div>
                            ) : (
                              <span className="font-semibold cursor-pointer hover:text-primary" onClick={() => { setEditRowId(r.id); setEditRate(r.monthly_rate); }}>${r.monthly_rate?.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">${(r.monthly_rate * 12)?.toFixed(2)}</td>
                          {r.tobacco_flag && <td className="px-2 text-xs text-amber-600">🚬</td>}
                          <td className="px-2"><Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-3 h-3" /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}