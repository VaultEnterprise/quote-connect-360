import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";
import { AlertCircle, CheckCircle2, Clock, Filter, Download } from "lucide-react";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

export default function ContentCoverageTab({ contentMap, onEditTarget, onBrowseModule }) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [search, setSearch] = useState("");

  const covered = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "active").length;
  const missing = HELP_TARGETS.filter(t => !contentMap[t.target_code]).length;
  const drafts = Object.values(contentMap).filter(c => c.content_status === "draft").length;
  const reviewNeeded = Object.values(contentMap).filter(c => c.content_status === "review_required").length;
  const coveragePct = Math.round((covered / HELP_TARGETS.length) * 100);

  const filtered = useMemo(() => {
    return HELP_TARGETS.filter(t => {
      const c = contentMap[t.target_code];
      const statusMatch = filterStatus === "all"
        || (filterStatus === "missing" && !c)
        || (filterStatus === "active" && c?.content_status === "active")
        || (filterStatus === "draft" && c?.content_status === "draft")
        || (filterStatus === "review" && c?.content_status === "review_required");
      const moduleMatch = filterModule === "all" || t.module_code === filterModule;
      const searchMatch = !search || t.target_label.toLowerCase().includes(search.toLowerCase()) || t.target_code.toLowerCase().includes(search.toLowerCase());
      return statusMatch && moduleMatch && searchMatch;
    });
  }, [contentMap, filterStatus, filterModule, search]);

  const handleExport = () => {
    const rows = [["Target Code","Label","Module","Page","Component Type","Status"]];
    HELP_TARGETS.forEach(t => {
      const c = contentMap[t.target_code];
      rows.push([t.target_code, t.target_label, t.module_code, t.page_code, t.component_type, c?.content_status || "missing"]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "help_coverage.csv"; a.click();
  };

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Targets", value: HELP_TARGETS.length, color: "text-primary", icon: null },
          { label: `Coverage (${coveragePct}%)`, value: covered, color: "text-emerald-600", icon: CheckCircle2 },
          { label: "Missing", value: missing, color: "text-red-600", icon: AlertCircle },
          { label: "Draft", value: drafts, color: "text-amber-600", icon: Clock },
          { label: "Review Needed", value: reviewNeeded, color: "text-orange-600", icon: AlertCircle },
        ].map(kpi => (
          <Card key={kpi.label}
            className={`cursor-pointer hover:border-primary/40 transition-all ${filterStatus !== "all" ? "" : ""}`}
            onClick={() => {
              const map = { "Coverage": "active", "Missing": "missing", "Draft": "draft", "Review Needed": "review" };
              const k = Object.keys(map).find(k => kpi.label.includes(k));
              setFilterStatus(k ? map[k] : "all");
            }}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coverage by module */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Coverage by Module</CardTitle>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleExport}>
            <Download className="w-3 h-3" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {MODULES.map(mod => {
            const targets = HELP_TARGETS.filter(t => t.module_code === mod);
            const modActive = targets.filter(t => contentMap[t.target_code]?.content_status === "active").length;
            const pct = Math.round((modActive / targets.length) * 100);
            return (
              <div key={mod} className="flex items-center gap-3 group">
                <button onClick={() => onBrowseModule(mod)} className="w-28 text-xs text-left font-medium hover:text-primary truncate">
                  {MODULE_LABELS[mod] || mod}
                </button>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct > 66 ? "bg-primary" : pct > 33 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{modActive}/{targets.length}</span>
                <Badge className={`text-[8px] w-10 text-center ${pct === 100 ? "bg-emerald-100 text-emerald-700" : pct > 66 ? "bg-blue-100 text-blue-700" : pct > 33 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {pct}%
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Filterable target list */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Filter targets…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 text-xs" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="review">Review Needed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {MODULES.map(m => <SelectItem key={m} value={m}>{MODULE_LABELS[m] || m}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} targets</span>
      </div>

      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {filtered.map(t => {
          const c = contentMap[t.target_code];
          return (
            <div key={t.target_code} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 border border-transparent hover:border-border gap-2 group">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" className="text-[8px] py-0 flex-shrink-0">{t.component_type}</Badge>
                <span className="text-xs font-medium truncate">{t.target_label}</span>
                <span className="text-[10px] text-muted-foreground font-mono hidden sm:block">{t.target_code}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!c && <Badge className="text-[8px] bg-red-100 text-red-700">Missing</Badge>}
                {c?.content_status === "draft" && <Badge className="text-[8px] bg-amber-100 text-amber-700">Draft</Badge>}
                {c?.content_status === "active" && <Badge className="text-[8px] bg-emerald-100 text-emerald-700">Active</Badge>}
                {c?.content_status === "review_required" && <Badge className="text-[8px] bg-orange-100 text-orange-700">Review</Badge>}
                {c?.content_status === "inactive" && <Badge className="text-[8px] bg-slate-100 text-slate-600">Inactive</Badge>}
                <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onEditTarget(t)}>
                  {c ? "Edit" : "Add"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}