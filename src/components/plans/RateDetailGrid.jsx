import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, Trash2, AlertTriangle, FileUp } from "lucide-react";
import { toast } from "sonner";
import SpecialRateImporter from "@/components/plans/SpecialRateImporter";

const AGE_BANDS = ["Under25","25-29","30-34","35-39","40-44","45-49","50-54","55-59","60-64","65+"];
const TIERS = ["EE","ES","EC","FAM"];
const TIER_LABELS = { EE: "Single / EE Only", ES: "EE + Spouse", EC: "EE + Child(ren)", FAM: "Family" };

const TIER_MAP = {
  "single":"EE","ee":"EE","employee":"EE","employee only":"EE",
  "ee+sp":"ES","ee + sp":"ES","ee+spouse":"ES","employee+spouse":"ES","employee + spouse":"ES",
  "ee+ch":"EC","ee+ch(ren)":"EC","ee + ch(ren)":"EC","ee+children":"EC","employee+children":"EC",
  "family":"FAM","fam":"FAM","ee+family":"FAM","ee + family":"FAM",
};

function parseCSVRates(text, scheduleId, planId) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g,"_"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",");
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j]?.trim(); });
    const rawTier = (row.tier_code || row.tier || row.coverage_tier || "").trim();
    const normalizedTier = TIER_MAP[rawTier.toLowerCase()] || rawTier.toUpperCase();
    if (!TIERS.includes(normalizedTier)) continue;
    const monthly = parseFloat(row.monthly_rate || row.rate || 0);
    if (!monthly || monthly <= 0) continue;
    rows.push({
      rate_schedule_id: scheduleId,
      plan_id: planId,
      rating_area_code: (row.rating_area_code || row.area_code || row.area || "").trim(),
      age_band_code: (row.age_band_code || row.age_band || row.age || "").trim(),
      tier_code: normalizedTier,
      tier_label_raw: rawTier,
      monthly_rate: monthly,
      annual_rate: monthly * 12,
      tobacco_flag: row.tobacco_flag === "true" || row.tobacco_flag === "1" || row.tobacco_flag?.toLowerCase() === "y",
      is_active: true,
    });
  }
  return rows;
}

export default function RateDetailGrid({ plans, schedules, initialScheduleId = "" }) {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [scheduleId, setScheduleId] = useState(initialScheduleId || "");
  const [newRow, setNewRow] = useState({ rating_area_code: "", age_band_code: "", tier_code: "EE", monthly_rate: "", tobacco_flag: false });
  const [csvText, setCsvText] = useState("");
  const [showCsvImport, setShowCsvImport] = useState(false);

  useEffect(() => {
    if (scheduleId && schedules.some((schedule) => schedule.id === scheduleId && schedule.is_active)) return;
    if (initialScheduleId && schedules.some((schedule) => schedule.id === initialScheduleId && schedule.is_active)) {
      setScheduleId(initialScheduleId);
      return;
    }
    const activeSchedules = schedules.filter((schedule) => schedule.is_active);
    if (activeSchedules.length === 1) setScheduleId(activeSchedules[0].id);
  }, [initialScheduleId, scheduleId, schedules]);

  const schedule = schedules.find(s => s.id === scheduleId);
  const plan = plans.find(p => p.id === schedule?.plan_id);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["rate-detail", scheduleId],
    queryFn: () => base44.entities.PlanRateDetail.filter({ rate_schedule_id: scheduleId }),
    enabled: !!scheduleId,
  });

  const addMutation = useMutation({
    mutationFn: () => base44.entities.PlanRateDetail.create({
      ...newRow,
      rate_schedule_id: scheduleId,
      plan_id: schedule?.plan_id,
      monthly_rate: parseFloat(newRow.monthly_rate),
      annual_rate: parseFloat(newRow.monthly_rate) * 12,
      is_active: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rate-detail", scheduleId] });
      setNewRow({ rating_area_code: "", age_band_code: "", tier_code: "EE", monthly_rate: "", tobacco_flag: false });
      toast.success("Rate row added");
    },
    onError: (error) => toast.error(error.message || "Could not save the rate row"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanRateDetail.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rate-detail", scheduleId] }),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const rows = parseCSVRates(csvText, scheduleId, schedule?.plan_id);
      if (!rows.length) throw new Error("No valid rows parsed — check required columns: rating_area_code, age_band_code, tier_code, monthly_rate");
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
      if (data?.errors > 0) toast.warning(`${data.success} imported · ${data.errors} errors · Run: ${data.run_id?.slice(-6)}`);
      else toast.success(`${data?.success ?? "?"} rate rows imported`);
      setCsvText(""); setShowCsvImport(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(ev.target.result || "");
    reader.readAsText(file);
    setShowCsvImport(true);
  };

  const exportCSV = () => {
    const header = "rating_area_code,age_band_code,tier_code,tier_label,monthly_rate,annual_rate,tobacco_flag";
    const rows = rates.map(r =>
      `${r.rating_area_code},${r.age_band_code},${r.tier_code},"${TIER_LABELS[r.tier_code] || r.tier_code}",${r.monthly_rate},${(r.monthly_rate * 12).toFixed(2)},${r.tobacco_flag || false}`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `rate_detail_${scheduleId}.csv`; a.click();
  };

  const downloadTemplate = () => {
    const tmpl = "rating_area_code,age_band_code,tier_code,monthly_rate,tobacco_flag\nCA001,Under25,EE,312.50,false\nCA001,Under25,ES,625.00,false\nCA001,Under25,EC,562.00,false\nCA001,Under25,FAM,875.00,false";
    const blob = new Blob([tmpl], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rate_detail_template.csv"; a.click();
  };

  const byArea = rates.reduce((m, r) => {
    if (!m[r.rating_area_code]) m[r.rating_area_code] = [];
    m[r.rating_area_code].push(r);
    return m;
  }, {});

  // detect areas missing full tier coverage
  const areaWarnings = Object.entries(byArea).reduce((w, [area, areaRates]) => {
    const tiersByBand = areaRates.reduce((m, r) => {
      if (!m[r.age_band_code]) m[r.age_band_code] = new Set();
      m[r.age_band_code].add(r.tier_code);
      return m;
    }, {});
    const missing = Object.entries(tiersByBand)
      .filter(([, tiers]) => TIERS.some(t => !tiers.has(t)))
      .map(([band, tiers]) => `${band}: missing ${TIERS.filter(t => !tiers.has(t)).join(", ")}`);
    if (missing.length) w[area] = missing;
    return w;
  }, {});

  return (
    <div className="space-y-4">
      {/* Schedule selector + actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={scheduleId} onValueChange={setScheduleId}>
          <SelectTrigger className="w-72 h-8 text-xs"><SelectValue placeholder="Select rate schedule..." /></SelectTrigger>
          <SelectContent>
            {schedules.filter(s => s.is_active).map(s => {
              const p = plans.find(pl => pl.id === s.plan_id);
              return <SelectItem key={s.id} value={s.id}>{s.schedule_name} — {p?.plan_name || "Unknown"} (v{s.version_number})</SelectItem>;
            })}
          </SelectContent>
        </Select>
        {scheduleId && (
          <>
            <Badge variant="outline" className="text-xs">{rates.length} rows</Badge>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setShowCsvImport(!showCsvImport)}>
              <Upload className="w-3 h-3" />Paste CSV
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="w-3 h-3" />Upload File
            </Button>
            <SpecialRateImporter
              planId={schedule?.plan_id}
              rateScheduleId={scheduleId}
              scheduleName={schedule?.schedule_name}
            />
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={exportCSV}>
              <Download className="w-3 h-3" />Export
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={downloadTemplate}>
              <Download className="w-3 h-3" />Template
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
          </>
        )}
      </div>

      {/* CSV paste panel */}
      {showCsvImport && scheduleId && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">
              CSV Import — Required: <code className="bg-muted px-1 rounded">rating_area_code, age_band_code, tier_code, monthly_rate</code>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Tier aliases: Single/EE → EE · EE+Sp → ES · EE+Ch(ren) → EC · Family → FAM
            </p>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              className="w-full h-32 text-xs font-mono border rounded p-2 bg-muted/30"
              placeholder="rating_area_code,age_band_code,tier_code,monthly_rate,tobacco_flag&#10;CA001,Under25,EE,312.50,false"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => importMutation.mutate()} disabled={!csvText || importMutation.isPending} className="gap-1">
                <Upload className="w-3 h-3" />{importMutation.isPending ? "Importing..." : "Import Rows"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setCsvText(""); setShowCsvImport(false); }}>Cancel</Button>
              {csvText && <p className="text-xs text-muted-foreground">{csvText.trim().split("\n").length - 1} data rows detected</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {!scheduleId && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            {schedules.some((schedule) => schedule.is_active)
              ? "Select a rate schedule to view and manage its rate detail rows."
              : "No active rate schedules are available to show rate details."}
          </CardContent>
        </Card>
      )}

      {scheduleId && (
        <>
          {/* Add row form */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-end gap-2 flex-wrap">
                <div>
                  <label className="text-xs mb-1 block">Area Code</label>
                  <Input value={newRow.rating_area_code} onChange={e => setNewRow(p => ({ ...p, rating_area_code: e.target.value }))} placeholder="e.g. CA001" className="h-7 text-xs w-24" />
                </div>
                <div>
                  <label className="text-xs mb-1 block">Age Band</label>
                  <Select value={newRow.age_band_code} onValueChange={v => setNewRow(p => ({ ...p, age_band_code: v }))}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="Band" /></SelectTrigger>
                    <SelectContent>{AGE_BANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs mb-1 block">Tier</label>
                  <Select value={newRow.tier_code} onValueChange={v => setNewRow(p => ({ ...p, tier_code: v }))}>
                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t}>{t} — {TIER_LABELS[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs mb-1 block">Monthly Rate $</label>
                  <Input type="number" step="0.01" value={newRow.monthly_rate} onChange={e => setNewRow(p => ({ ...p, monthly_rate: e.target.value }))} placeholder="0.00" className="h-7 text-xs w-24" />
                </div>
                <div className="flex items-center gap-1.5 pb-1">
                  <input type="checkbox" id="tob" checked={!!newRow.tobacco_flag} onChange={e => setNewRow(p => ({ ...p, tobacco_flag: e.target.checked }))} className="w-3.5 h-3.5" />
                  <label htmlFor="tob" className="text-xs">Tobacco</label>
                </div>
                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => addMutation.mutate()}
                  disabled={!newRow.rating_area_code || !newRow.age_band_code || !newRow.monthly_rate || addMutation.isPending}>
                  <Plus className="w-3 h-3" />Add Row
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rate grid grouped by area */}
          {isLoading ? (
            <div className="h-32 rounded bg-muted animate-pulse" />
          ) : Object.entries(byArea).length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-6 text-center text-muted-foreground text-xs">No rate rows yet. Add rows manually or import from CSV.</CardContent></Card>
          ) : (
            Object.entries(byArea).map(([area, areaRates]) => (
              <Card key={area}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs flex items-center gap-2 flex-wrap">
                    Rating Area: <Badge variant="outline">{area}</Badge>
                    <span className="text-muted-foreground font-normal">({areaRates.length} rows)</span>
                    {areaWarnings[area] && (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{areaWarnings[area].length} band(s) missing tiers</span>
                      </div>
                    )}
                  </CardTitle>
                  {areaWarnings[area] && (
                    <div className="mt-1 space-y-0.5">
                      {areaWarnings[area].map((w, i) => (
                        <p key={i} className="text-[10px] text-amber-600 font-mono">· {w}</p>
                      ))}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-1.5">Age Band</th>
                          <th className="text-center px-3 py-1.5">Tier</th>
                          <th className="text-center px-3 py-1.5">Label</th>
                          <th className="text-center px-3 py-1.5">Tobacco</th>
                          <th className="text-right px-3 py-1.5">Monthly</th>
                          <th className="text-right px-3 py-1.5">Annual</th>
                          <th className="px-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {areaRates
                          .sort((a, b) => {
                            const bi = AGE_BANDS.indexOf(a.age_band_code) - AGE_BANDS.indexOf(b.age_band_code);
                            return bi !== 0 ? bi : TIERS.indexOf(a.tier_code) - TIERS.indexOf(b.tier_code);
                          })
                          .map(r => (
                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/20">
                              <td className="px-3 py-1.5 font-mono">{r.age_band_code}</td>
                              <td className="px-3 py-1.5 text-center"><Badge className="text-xs h-4 px-1">{r.tier_code}</Badge></td>
                              <td className="px-3 py-1.5 text-center text-muted-foreground">{TIER_LABELS[r.tier_code]}</td>
                              <td className="px-3 py-1.5 text-center">{r.tobacco_flag ? <Badge className="bg-amber-100 text-amber-700 text-[10px] h-4 px-1">Y</Badge> : <span className="text-muted-foreground">—</span>}</td>
                              <td className="px-3 py-1.5 text-right font-semibold">${r.monthly_rate?.toFixed(2)}</td>
                              <td className="px-3 py-1.5 text-right text-muted-foreground">${(r.monthly_rate * 12)?.toFixed(2)}</td>
                              <td className="px-2">
                                <Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}