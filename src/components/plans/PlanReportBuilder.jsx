import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Table, Filter, X } from "lucide-react";
import { toast } from "sonner";

const ALL_COLUMNS = [
  { key: "plan_name", label: "Plan Name" },
  { key: "carrier", label: "Carrier" },
  { key: "plan_type", label: "Type" },
  { key: "network_type", label: "Network" },
  { key: "status", label: "Status" },
  { key: "deductible_individual", label: "Ind. Deductible", format: "currency" },
  { key: "deductible_family", label: "Fam. Deductible", format: "currency" },
  { key: "oop_max_individual", label: "Ind. OOP Max", format: "currency" },
  { key: "oop_max_family", label: "Fam. OOP Max", format: "currency" },
  { key: "copay_pcp", label: "PCP Copay", format: "currency" },
  { key: "copay_specialist", label: "Specialist Copay", format: "currency" },
  { key: "copay_er", label: "ER Copay", format: "currency" },
  { key: "rx_generic", label: "Generic RX", format: "currency" },
  { key: "rx_brand", label: "Brand RX", format: "currency" },
  { key: "hsa_eligible", label: "HSA Eligible", format: "boolean" },
  { key: "effective_date", label: "Effective Date" },
  { key: "termination_date", label: "Termination Date" },
];

const DEFAULT_COLS = ["plan_name","carrier","plan_type","network_type","deductible_individual","oop_max_individual","copay_pcp","status"];

function formatVal(val, format) {
  if (val == null || val === "") return "";
  if (format === "currency") return `$${Number(val).toLocaleString()}`;
  if (format === "boolean") return val ? "Yes" : "No";
  return String(val);
}

function toCSV(rows, columns) {
  const header = columns.map(c => c.label).join(",");
  const body = rows.map(r => columns.map(c => {
    const v = formatVal(r[c.key], c.format);
    return v.includes(",") ? `"${v}"` : v;
  }).join(",")).join("\n");
  return `${header}\n${body}`;
}

function toJSON(rows, columns) {
  return JSON.stringify(rows.map(r => Object.fromEntries(columns.map(c => [c.key, r[c.key]]))), null, 2);
}

export default function PlanReportBuilder({ plans }) {
  const [selectedCols, setSelectedCols] = useState(DEFAULT_COLS);
  const [filterCarrier, setFilterCarrier] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const carriers = [...new Set(plans.map(p => p.carrier).filter(Boolean))];
  const types = [...new Set(plans.map(p => p.plan_type).filter(Boolean))];
  const statuses = [...new Set(plans.map(p => p.status).filter(Boolean))];

  const filtered = useMemo(() => plans.filter(p =>
    (filterCarrier === "all" || p.carrier === filterCarrier) &&
    (filterType === "all" || p.plan_type === filterType) &&
    (filterStatus === "all" || p.status === filterStatus) &&
    (!search || p.plan_name?.toLowerCase().includes(search.toLowerCase()) || p.carrier?.toLowerCase().includes(search.toLowerCase()))
  ), [plans, filterCarrier, filterType, filterStatus, search]);

  const activeCols = ALL_COLUMNS.filter(c => selectedCols.includes(c.key));

  const toggleCol = (key) => setSelectedCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const exportCSV = () => {
    const blob = new Blob([toCSV(filtered, activeCols)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plan_report.csv"; a.click();
    toast.success("CSV exported");
  };

  const exportJSON = () => {
    const blob = new Blob([toJSON(filtered, activeCols)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plan_report.json"; a.click();
    toast.success("JSON exported");
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plans..." className="h-8 text-sm w-48" />
        <Select value={filterCarrier} onValueChange={setFilterCarrier}><SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Carrier" /></SelectTrigger><SelectContent><SelectItem value="all">All Carriers</SelectItem>{carriers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Badge variant="outline" className="ml-auto">{filtered.length} plans</Badge>
        <Button size="sm" variant="outline" onClick={exportCSV} className="h-8 text-xs gap-1"><Download className="w-3 h-3" />CSV</Button>
        <Button size="sm" variant="outline" onClick={exportJSON} className="h-8 text-xs gap-1"><Download className="w-3 h-3" />JSON</Button>
      </div>

      {/* Column picker */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5"><Table className="w-3.5 h-3.5" />Select Columns</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {ALL_COLUMNS.map(c => (
              <div key={c.key} className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleCol(c.key)}>
                <Checkbox checked={selectedCols.includes(c.key)} onCheckedChange={() => toggleCol(c.key)} className="h-3.5 w-3.5" />
                <span className="text-xs">{c.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview table */}
      <div className="rounded-lg border overflow-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
            <tr>
              {activeCols.map(c => <th key={c.key} className="text-left px-3 py-2 font-medium whitespace-nowrap">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={row.id} className="border-t hover:bg-muted/30">
                {activeCols.map(c => <td key={c.key} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">{formatVal(row[c.key], c.format) || "—"}</td>)}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={activeCols.length} className="text-center py-6 text-muted-foreground">No plans match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}