import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Search, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

function parseZipCSV(text, planId) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g,"_"));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",");
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j]?.trim(); });
    if (!row.zip_code && !row.zip) continue;
    rows.push({
      plan_id: planId || null,
      zip_code: row.zip_code || row.zip || "",
      state_code: row.state_code || row.state || "",
      county: row.county || "",
      city: row.city || "",
      rating_area_code: row.rating_area_code || row.area_code || row.rating_area || "",
      effective_date: row.effective_date || null,
      is_active: true,
      source: "carrier_provided",
    });
  }
  return rows.filter(r => r.zip_code && r.rating_area_code);
}

export default function ZipAreaMappingManager({ plans }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [showCsv, setShowCsv] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvPlanId, setCsvPlanId] = useState("");
  const [newRow, setNewRow] = useState({ zip_code: "", state_code: "", county: "", city: "", rating_area_code: "", plan_id: "" });

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ["zip-area-maps"],
    queryFn: () => base44.entities.PlanZipAreaMap.list("-created_date", 500),
  });

  const filtered = mappings.filter(m =>
    (stateFilter === "all" || m.state_code === stateFilter) &&
    (!search || m.zip_code?.includes(search) || m.rating_area_code?.toLowerCase().includes(search.toLowerCase()) || m.county?.toLowerCase().includes(search.toLowerCase()))
  );

  const addMutation = useMutation({
    mutationFn: () => base44.entities.PlanZipAreaMap.create({ ...newRow, plan_id: newRow.plan_id || null, is_active: true, source: "manual" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["zip-area-maps"] }); setNewRow({ zip_code: "", state_code: "", county: "", city: "", rating_area_code: "", plan_id: "" }); toast.success("ZIP mapping added"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlanZipAreaMap.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zip-area-maps"] }),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const rows = parseZipCSV(csvText, csvPlanId || null);
      if (!rows.length) throw new Error("No valid rows parsed");
      const res = await base44.functions.invoke("planRatingEngine", {
        action: "importZipRows",
        rows,
        planId: csvPlanId || null,
        sourceFileName: "manual_csv_import",
      });
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["zip-area-maps"] });
      qc.invalidateQueries({ queryKey: ["import-runs"] });
      const msg = `${data.success} ZIP mappings imported · ${data.errors} errors`;
      if (data.errors > 0) toast.warning(msg); else toast.success(`${data.success} ZIP mappings imported`);
      setCsvText(""); setShowCsv(false);
    },
    onError: e => toast.error(e.message),
  });

  const areas = [...new Set(mappings.map(m => m.rating_area_code))].sort();
  const states = [...new Set(mappings.map(m => m.state_code).filter(Boolean))].sort();

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        {[
          { label: "ZIP Codes", val: mappings.length },
          { label: "Rating Areas", val: areas.length },
          { label: "States", val: states.length },
        ].map(kpi => (
          <Card key={kpi.label}><CardContent className="p-3 text-center"><p className="text-xl font-bold">{kpi.val}</p><p className="text-xs text-muted-foreground">{kpi.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ZIP, area, county..." className="pl-8 h-8 text-xs" />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="State" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem>{states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => setShowCsv(!showCsv)} className="h-8 text-xs gap-1"><Upload className="w-3 h-3" />Import CSV</Button>
      </div>

      {/* CSV Import */}
      {showCsv && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2"><CardTitle className="text-xs">CSV Import — Columns: zip_code, state_code, county, city, rating_area_code</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Select value={csvPlanId} onValueChange={setCsvPlanId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Scope to specific plan (optional — leave blank for global)" /></SelectTrigger>
              <SelectContent><SelectItem value={null}>Global (all plans)</SelectItem>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name}</SelectItem>)}</SelectContent>
            </Select>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)} className="w-full h-28 text-xs font-mono border rounded p-2 bg-muted/30" placeholder="zip_code,state_code,county,city,rating_area_code&#10;90210,CA,Los Angeles,Beverly Hills,CA001" />
            <Button size="sm" onClick={() => importMutation.mutate()} disabled={!csvText || importMutation.isPending} className="gap-1"><Upload className="w-3 h-3" />{importMutation.isPending ? "Importing..." : "Import"}</Button>
          </CardContent>
        </Card>
      )}

      {/* Add single row */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-end gap-2 flex-wrap">
            <div><label className="text-xs mb-1 block">ZIP</label><Input value={newRow.zip_code} onChange={e => setNewRow(p => ({ ...p, zip_code: e.target.value }))} placeholder="90210" className="h-7 text-xs w-20" /></div>
            <div>
              <label className="text-xs mb-1 block">State</label>
              <Select value={newRow.state_code} onValueChange={v => setNewRow(p => ({ ...p, state_code: v }))}>
                <SelectTrigger className="h-7 text-xs w-16"><SelectValue placeholder="ST" /></SelectTrigger>
                <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs mb-1 block">County</label><Input value={newRow.county} onChange={e => setNewRow(p => ({ ...p, county: e.target.value }))} placeholder="County" className="h-7 text-xs w-28" /></div>
            <div><label className="text-xs mb-1 block">City</label><Input value={newRow.city} onChange={e => setNewRow(p => ({ ...p, city: e.target.value }))} placeholder="City" className="h-7 text-xs w-28" /></div>
            <div><label className="text-xs mb-1 block">Rating Area</label><Input value={newRow.rating_area_code} onChange={e => setNewRow(p => ({ ...p, rating_area_code: e.target.value }))} placeholder="CA001" className="h-7 text-xs w-20" /></div>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={() => addMutation.mutate()} disabled={!newRow.zip_code || !newRow.state_code || !newRow.rating_area_code}>
              <Plus className="w-3 h-3" />Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-lg border overflow-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b">
            <tr><th className="text-left px-3 py-2">ZIP</th><th className="text-left px-3 py-2">State</th><th className="text-left px-3 py-2">County</th><th className="text-left px-3 py-2">City</th><th className="text-left px-3 py-2">Rating Area</th><th className="text-left px-3 py-2">Scope</th><th className="px-2"></th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-6 text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No ZIP mappings found.</td></tr>
            ) : filtered.slice(0, 200).map(m => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-3 py-1.5 font-mono font-bold">{m.zip_code}</td>
                <td className="px-3 py-1.5"><Badge variant="outline" className="text-xs h-4 px-1">{m.state_code}</Badge></td>
                <td className="px-3 py-1.5 text-muted-foreground">{m.county || "—"}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{m.city || "—"}</td>
                <td className="px-3 py-1.5"><Badge className="text-xs bg-primary/10 text-primary">{m.rating_area_code}</Badge></td>
                <td className="px-3 py-1.5 text-muted-foreground">{m.plan_id ? plans.find(p => p.id === m.plan_id)?.plan_name || "Plan-specific" : "Global"}</td>
                <td className="px-2"><Button size="icon" variant="ghost" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="w-3 h-3" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length > 200 && <p className="text-xs text-center text-muted-foreground py-2">Showing 200 of {filtered.length} — refine search to see more</p>}
      </div>
    </div>
  );
}