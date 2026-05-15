import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const ComponentBadgeColors = {
  page: "bg-blue-100 text-blue-700",
  section: "bg-purple-100 text-purple-700",
  field: "bg-emerald-100 text-emerald-700",
  button: "bg-orange-100 text-orange-700",
  status: "bg-pink-100 text-pink-700",
  workflow_step: "bg-indigo-100 text-indigo-700",
  tab: "bg-slate-100 text-slate-700",
  card: "bg-yellow-100 text-yellow-700",
  action: "bg-red-100 text-red-700",
};

export default function HelpModuleDrillDown({ selectedModule, helpTargets, contentMap, onBack, onSelectTarget }) {
  const [expandedPages, setExpandedPages] = useState({});
  const [typeFilter, setTypeFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState("all");

  const moduleTargets = useMemo(() => {
    const targets = helpTargets.filter(t => t.module_code === selectedModule);
    const byPage = {};
    for (const t of targets) {
      if (!byPage[t.page_code]) byPage[t.page_code] = [];
      byPage[t.page_code].push(t);
    }
    return byPage;
  }, [selectedModule, helpTargets]);

  const allTypes = useMemo(() => {
    const types = new Set();
    helpTargets.filter(t => t.module_code === selectedModule).forEach(t => {
      if (t.component_type) types.add(t.component_type);
      if (t.target_type) types.add(t.target_type);
    });
    return Array.from(types).sort();
  }, [selectedModule, helpTargets]);

  const togglePage = (pageCode) =>
    setExpandedPages(p => ({ ...p, [pageCode]: !p[pageCode] }));

  const expandAll = () => {
    const all = {};
    Object.keys(moduleTargets).forEach(k => (all[k] = true));
    setExpandedPages(all);
  };

  const collapseAll = () => setExpandedPages({});

  const filterTarget = (t) => {
    const type = t.component_type || t.target_type;
    if (typeFilter !== "all" && type !== typeFilter) return false;
    const hasContent = !!contentMap[t.target_code];
    if (coverageFilter === "covered" && !hasContent) return false;
    if (coverageFilter === "missing" && hasContent) return false;
    return true;
  };

  const totalCovered = helpTargets.filter(t => t.module_code === selectedModule && contentMap[t.target_code]).length;
  const totalAll = helpTargets.filter(t => t.module_code === selectedModule).length;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button onClick={onBack} className="text-primary hover:underline flex items-center gap-1">← All Modules</button>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold">{MODULE_LABELS[selectedModule] || selectedModule}</span>
        <span className="ml-auto text-xs text-muted-foreground">{totalCovered}/{totalAll} topics covered</span>
      </div>

      {/* Filters + Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-7 text-xs w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {allTypes.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={coverageFilter} onValueChange={setCoverageFilter}>
          <SelectTrigger className="h-7 text-xs w-36">
            <SelectValue placeholder="All items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="covered">Has help content</SelectItem>
            <SelectItem value="missing">Missing content</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 ml-auto">
          <button onClick={expandAll} className="text-[11px] text-primary hover:underline px-2">Expand all</button>
          <span className="text-muted-foreground text-[11px]">·</span>
          <button onClick={collapseAll} className="text-[11px] text-primary hover:underline px-2">Collapse all</button>
        </div>
      </div>

      {/* Page Groups */}
      <div className="space-y-3">
        {Object.entries(moduleTargets).map(([pageCode, targets]) => {
          const filtered = targets.filter(filterTarget);
          if (filtered.length === 0) return null;
          const coveredCount = filtered.filter(t => !!contentMap[t.target_code]).length;

          return (
            <Card key={pageCode}>
              <button
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-t-xl"
                onClick={() => togglePage(pageCode)}
              >
                <div className="flex items-center gap-2">
                  {expandedPages[pageCode] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-semibold text-sm">{pageCode.replace(/_/g, " ")}</span>
                  <Badge variant="outline" className="text-[9px]">{filtered.length} items</Badge>
                  {coveredCount < filtered.length && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0">{filtered.length - coveredCount} missing</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70 rounded-full" style={{ width: `${filtered.length > 0 ? (coveredCount / filtered.length) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{coveredCount}/{filtered.length}</span>
                  </div>
                </div>
              </button>

              {expandedPages[pageCode] && (
                <CardContent className="pt-0 pb-3 space-y-1">
                  {filtered.map(t => {
                    const hasContent = !!contentMap[t.target_code];
                    const type = t.component_type || t.target_type;
                    return (
                      <button
                        key={t.target_code}
                        onClick={() => hasContent && onSelectTarget(t.target_code)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors
                          ${hasContent ? "hover:bg-muted/50 cursor-pointer" : "opacity-50 cursor-default"}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge className={`text-[8px] py-0 flex-shrink-0 ${ComponentBadgeColors[type] || "bg-gray-100 text-gray-700"}`}>
                            {type}
                          </Badge>
                          <span className="text-xs truncate">{t.target_label}</span>
                        </div>
                        {hasContent
                          ? <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          : <span className="text-[9px] text-muted-foreground flex-shrink-0">No content</span>
                        }
                      </button>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}