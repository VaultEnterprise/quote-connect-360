import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertCircle, CheckCircle2, Clock, Filter, Download,
  Sparkles, Trash2, Eye, EyeOff, X, CheckSquare
} from "lucide-react";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

export default function ContentCoverageTab({ contentMap, onEditTarget, onBrowseModule, onBulkAIModule }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterModule, setFilterModule] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedCodes, setSelectedCodes] = useState(new Set());

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
        || (filterStatus === "review" && c?.content_status === "review_required")
        || (filterStatus === "inactive" && c?.content_status === "inactive");
      const moduleMatch = filterModule === "all" || t.module_code === filterModule;
      const searchMatch = !search || t.target_label.toLowerCase().includes(search.toLowerCase()) || t.target_code.toLowerCase().includes(search.toLowerCase());
      return statusMatch && moduleMatch && searchMatch;
    });
  }, [contentMap, filterStatus, filterModule, search]);

  const handleExport = () => {
    const rows = [["Target Code","Label","Module","Page","Component Type","Status","Title","Last Updated"]];
    HELP_TARGETS.forEach(t => {
      const c = contentMap[t.target_code];
      rows.push([
        t.target_code, t.target_label, t.module_code, t.page_code, t.component_type,
        c?.content_status || "missing",
        c?.help_title || "",
        c?.updated_date ? new Date(c.updated_date).toLocaleDateString() : "",
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "help_coverage.csv"; a.click();
  };

  const bulkActivate = useMutation({
    mutationFn: () => {
      const toActivate = [...selectedCodes].map(code => contentMap[code]).filter(Boolean);
      return Promise.all(toActivate.map(c => base44.entities.HelpContent.update(c.id, { content_status: "active", is_active: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      toast({ title: `Activated ${selectedCodes.size} items` });
      setSelectedCodes(new Set());
    },
  });

  const bulkDeactivate = useMutation({
    mutationFn: () => {
      const toDeactivate = [...selectedCodes].map(code => contentMap[code]).filter(Boolean);
      return Promise.all(toDeactivate.map(c => base44.entities.HelpContent.update(c.id, { content_status: "inactive", is_active: false })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      toast({ title: `Deactivated ${selectedCodes.size} items` });
      setSelectedCodes(new Set());
    },
  });

  const bulkDelete = useMutation({
    mutationFn: () => {
      const toDelete = [...selectedCodes].map(code => contentMap[code]).filter(Boolean);
      return Promise.all(toDelete.map(c => base44.entities.HelpContent.delete(c.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
      toast({ title: `Deleted ${selectedCodes.size} content records` });
      setSelectedCodes(new Set());
    },
  });

  const toggleSelect = (code) => setSelectedCodes(prev => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });

  const toggleAll = () => {
    const hasCodes = filtered.filter(t => contentMap[t.target_code]);
    if (selectedCodes.size === hasCodes.length) setSelectedCodes(new Set());
    else setSelectedCodes(new Set(hasCodes.map(t => t.target_code)));
  };

  const selectedWithContent = [...selectedCodes].filter(code => contentMap[code]).length;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Targets", value: HELP_TARGETS.length, color: "text-primary", filter: "all" },
          { label: `Coverage (${coveragePct}%)`, value: covered, color: "text-emerald-600", filter: "active" },
          { label: "Missing", value: missing, color: "text-red-600", filter: "missing" },
          { label: "Draft", value: drafts, color: "text-amber-600", filter: "draft" },
          { label: "Review Needed", value: reviewNeeded, color: "text-orange-600", filter: "review" },
        ].map(kpi => (
          <Card key={kpi.label}
            className={`cursor-pointer hover:border-primary/40 transition-all ${filterStatus === kpi.filter ? "border-primary" : ""}`}
            onClick={() => setFilterStatus(prev => prev === kpi.filter ? "all" : kpi.filter)}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coverage by module */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm">Coverage by Module</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleExport}>
              <Download className="w-3 h-3" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {MODULES.map(mod => {
            const targets = HELP_TARGETS.filter(t => t.module_code === mod);
            const modActive = targets.filter(t => contentMap[t.target_code]?.content_status === "active").length;
            const modMissing = targets.filter(t => !contentMap[t.target_code]).length;
            const pct = Math.round((modActive / targets.length) * 100);
            return (
              <div key={mod} className="flex items-center gap-3 group">
                <button onClick={() => onBrowseModule(mod)} className="w-28 text-xs text-left font-medium hover:text-primary truncate flex-shrink-0">
                  {MODULE_LABELS[mod] || mod}
                </button>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : pct > 66 ? "bg-primary" : pct > 33 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-14 text-right flex-shrink-0">{modActive}/{targets.length}</span>
                <Badge className={`text-[8px] w-10 text-center flex-shrink-0 ${pct === 100 ? "bg-emerald-100 text-emerald-700" : pct > 66 ? "bg-blue-100 text-blue-700" : pct > 33 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                  {pct}%
                </Badge>
                {modMissing > 0 && onBulkAIModule && (
                  <Button size="sm" variant="ghost" className="h-6 text-[9px] px-2 opacity-0 group-hover:opacity-100 gap-1 text-purple-600 flex-shrink-0"
                    onClick={() => onBulkAIModule(mod)}>
                    <Sparkles className="w-2.5 h-2.5" /> Generate {modMissing}
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Filters + bulk actions */}
      <div className="flex flex-wrap gap-2 items-center">
        <Checkbox
          checked={selectedCodes.size > 0 && selectedCodes.size === filtered.filter(t => contentMap[t.target_code]).length}
          onCheckedChange={toggleAll}
          className="flex-shrink-0"
        />
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
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {MODULES.map(m => <SelectItem key={m} value={m}>{MODULE_LABELS[m] || m}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || filterStatus !== "all" || filterModule !== "all") && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterModule("all"); }}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{filtered.length} targets</span>
      </div>

      {/* Bulk action bar */}
      {selectedCodes.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 flex-wrap">
          <CheckSquare className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">{selectedCodes.size} selected ({selectedWithContent} with content)</span>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => bulkActivate.mutate()} disabled={selectedWithContent === 0 || bulkActivate.isPending}>
            <Eye className="w-3 h-3" /> Activate
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => bulkDeactivate.mutate()} disabled={selectedWithContent === 0 || bulkDeactivate.isPending}>
            <EyeOff className="w-3 h-3" /> Deactivate
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive border-destructive/30"
            onClick={() => { if (confirm(`Delete content for ${selectedWithContent} targets?`)) bulkDelete.mutate(); }}
            disabled={selectedWithContent === 0 || bulkDelete.isPending}>
            <Trash2 className="w-3 h-3" /> Delete Content
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs ml-auto" onClick={() => setSelectedCodes(new Set())}>
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
      )}

      {/* Target list */}
      <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No targets match filters.</p>
        )}
        {filtered.map(t => {
          const c = contentMap[t.target_code];
          const isSelected = selectedCodes.has(t.target_code);
          return (
            <div key={t.target_code}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border gap-2 group transition-colors
                ${isSelected ? "bg-primary/5 border-primary/20" : "border-transparent hover:bg-muted/50 hover:border-border"}`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelect(t.target_code)}
                  className="flex-shrink-0"
                />
                <Badge variant="outline" className="text-[8px] py-0 flex-shrink-0">{t.component_type}</Badge>
                <span className="text-xs font-medium truncate">{t.target_label}</span>
                <span className="text-[10px] text-muted-foreground font-mono hidden sm:block">{t.target_code}</span>
                {c?.help_title && c.help_title !== t.target_label && (
                  <span className="text-[10px] text-muted-foreground hidden lg:block italic truncate max-w-32">"{c.help_title}"</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!c && <Badge className="text-[8px] bg-red-100 text-red-700">Missing</Badge>}
                {c?.content_status === "draft" && <Badge className="text-[8px] bg-amber-100 text-amber-700">Draft</Badge>}
                {c?.content_status === "active" && <Badge className="text-[8px] bg-emerald-100 text-emerald-700">Active</Badge>}
                {c?.content_status === "review_required" && <Badge className="text-[8px] bg-orange-100 text-orange-700">Review</Badge>}
                {c?.content_status === "inactive" && <Badge className="text-[8px] bg-slate-100 text-slate-600">Inactive</Badge>}
                {c?.view_count > 0 && <span className="text-[9px] text-muted-foreground hidden md:block">{c.view_count} views</span>}
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