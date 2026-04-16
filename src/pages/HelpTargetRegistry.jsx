import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit2, CheckCircle2, AlertCircle, Clock, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const TARGET_TYPES = ["page","section","field","button","action","workflow_step","status","grid","grid_column","report","import","export","setting","filter","widget","navigation_item","modal","tab","process_step","badge","link","toggle","radio_option","select_option","card"];

export default function HelpTargetRegistry() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterCoverage, setFilterCoverage] = useState("all"); // all, covered, missing, draft
  const [selectedTarget, setSelectedTarget] = useState(null);

  const { data: contents = [] } = useQuery({
    queryKey: ["help-registry-contents"],
    queryFn: () => base44.entities.HelpContent.list("-updated_date", 500),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["help-registry-versions"],
    queryFn: () => selectedTarget ? base44.entities.HelpContentVersion.filter({ help_target_code: selectedTarget.target_code }, "-version_no", 20) : Promise.resolve([]),
    enabled: !!selectedTarget,
  });

  if (user?.role !== "admin") return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Admin access required.</p></div>;

  const contentMap = useMemo(() =>
    contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {}),
  [contents]);

  const filtered = useMemo(() => {
    let targets = HELP_TARGETS;
    if (filterModule !== "all") targets = targets.filter(t => t.module_code === filterModule);
    if (filterType !== "all") targets = targets.filter(t => t.target_type === filterType);
    if (filterCoverage === "covered") targets = targets.filter(t => contentMap[t.target_code]?.content_status === "active");
    if (filterCoverage === "missing") targets = targets.filter(t => !contentMap[t.target_code]);
    if (filterCoverage === "draft") targets = targets.filter(t => contentMap[t.target_code]?.content_status === "draft");
    if (search) {
      const q = search.toLowerCase();
      targets = targets.filter(t =>
        t.target_label.toLowerCase().includes(q) ||
        t.target_code.toLowerCase().includes(q) ||
        t.module_code.toLowerCase().includes(q) ||
        t.target_type.toLowerCase().includes(q)
      );
    }
    return targets;
  }, [search, filterModule, filterType, filterCoverage, contentMap]);

  const coverageIcon = (t) => {
    const c = contentMap[t.target_code];
    if (!c) return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    if (c.content_status === "active") return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (c.content_status === "draft") return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Help Target Registry"
        description="Master registry of all help-capable UI elements (PG-ADM-HELP-TARGET-REGISTRY)"
        actions={
          <Link to="/help-admin"><Button size="sm" variant="outline">← Help Console</Button></Link>
        }
      />

      {/* Stats strip */}
      <div className="flex gap-4 text-sm flex-wrap">
        {[
          { label: "Total", value: HELP_TARGETS.length, color: "text-foreground" },
          { label: "Active", value: HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "active").length, color: "text-emerald-600" },
          { label: "Draft", value: HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "draft").length, color: "text-amber-600" },
          { label: "Missing", value: HELP_TARGETS.filter(t => !contentMap[t.target_code]).length, color: "text-red-600" },
        ].map(s => (
          <span key={s.label} className="text-xs"><span className={`font-bold ${s.color}`}>{s.value}</span> {s.label}</span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search targets…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-52" />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="h-8 text-xs w-36"><Filter className="w-3 h-3 mr-1" /><SelectValue placeholder="Module" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Modules</SelectItem>
            {MODULES.map(m => <SelectItem key={m} value={m} className="text-xs">{MODULE_LABELS[m] || m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            {TARGET_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t.replace(/_/g," ")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCoverage} onValueChange={setFilterCoverage}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Coverage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Coverage</SelectItem>
            <SelectItem value="covered" className="text-xs">Active Help</SelectItem>
            <SelectItem value="draft" className="text-xs">Draft Only</SelectItem>
            <SelectItem value="missing" className="text-xs">Missing Help</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} results</span>
      </div>

      {/* Registry table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide bg-muted/50 px-3 py-2 border-b">
          <span className="w-6"></span>
          <span>Target</span>
          <span className="px-4">Module</span>
          <span className="px-4">Type</span>
          <span className="px-4">Status</span>
          <span className="px-2">Action</span>
        </div>
        <div className="divide-y max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No targets match your filters.</div>
          ) : filtered.map(t => {
            const c = contentMap[t.target_code];
            return (
              <div
                key={t.target_code}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 items-center px-3 py-2 hover:bg-muted/30 cursor-pointer ${selectedTarget?.target_code === t.target_code ? "bg-primary/5" : ""}`}
                onClick={() => setSelectedTarget(selectedTarget?.target_code === t.target_code ? null : t)}
              >
                <span className="w-6">{coverageIcon(t)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{t.target_label}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">{t.target_code}</p>
                </div>
                <span className="px-4"><Badge variant="outline" className="text-[8px]">{MODULE_LABELS[t.module_code] || t.module_code}</Badge></span>
                <span className="px-4"><Badge variant="outline" className="text-[8px]">{t.target_type}</Badge></span>
                <span className="px-4">
                  {!c
                    ? <Badge className="text-[8px] bg-red-50 text-red-700">Missing</Badge>
                    : <Badge className={`text-[8px] ${c.content_status === "active" ? "bg-emerald-50 text-emerald-700" : c.content_status === "draft" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{c.content_status}</Badge>
                  }
                </span>
                <span className="px-2">
                  <Link
                    to={`/help-admin`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Edit help">
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </Link>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedTarget && (() => {
        const c = contentMap[selectedTarget.target_code];
        return (
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{selectedTarget.target_label}</h3>
                  <code className="text-[10px] font-mono text-muted-foreground">{selectedTarget.target_code}</code>
                </div>
                <button onClick={() => setSelectedTarget(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div><p className="text-[10px] text-muted-foreground uppercase">Module</p><p className="font-medium">{MODULE_LABELS[selectedTarget.module_code] || selectedTarget.module_code}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Page</p><p className="font-medium">{selectedTarget.page_code}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Section</p><p className="font-medium">{selectedTarget.section_code || "—"}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Type</p><p className="font-medium">{selectedTarget.target_type}</p></div>
              </div>
              {c ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[9px] ${c.content_status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.content_status}</Badge>
                    <span className="text-xs text-muted-foreground">v{c.version_no} · {c.content_source_type?.replace(/_/g," ")}</span>
                    <span className="text-xs text-muted-foreground">by {c.last_updated_by || "system"}</span>
                  </div>
                  <p className="text-sm bg-primary/5 border border-primary/10 rounded-lg p-2">{c.short_help_text}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No help content exists for this target.</p>
              )}
              {versions.length > 0 && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Version History</p>
                  <div className="space-y-1">
                    {versions.slice(0,5).map(v => (
                      <div key={v.id} className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="font-mono">v{v.version_no}</span>
                        <Badge variant="outline" className="text-[8px]">{v.change_type}</Badge>
                        <span>{v.changed_by || "system"}</span>
                        <span>{v.change_summary || ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}