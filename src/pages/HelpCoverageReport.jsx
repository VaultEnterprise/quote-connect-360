import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Download } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

export default function HelpCoverageReport() {
  const { user } = useAuth();

  const { data: contents = [] } = useQuery({
    queryKey: ["help-cov-contents"],
    queryFn: () => base44.entities.HelpContent.list("-updated_date", 500),
  });

  const contentMap = useMemo(() => contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {}), [contents]);

  if (user?.role !== "admin") return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Admin access required.</p></div>;

  const { data: contents = [] } = useQuery({
    queryKey: ["help-cov-contents"],
    queryFn: () => base44.entities.HelpContent.list("-updated_date", 500),
  });

  if (user?.role !== "admin") return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Admin access required.</p></div>;

  const contentMap = useMemo(() => contents.reduce((acc, c) => { acc[c.help_target_code] = c; return acc; }, {}), [contents]);

  const total = HELP_TARGETS.length;
  const activeCount = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "active").length;
  const missingTargets = HELP_TARGETS.filter(t => !contentMap[t.target_code]);
  const draftTargets = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "draft");
  const shortHelpTargets = contents.filter(c => c.content_status === "active" && (c.short_help_text || "").length < 30);
  const noKeywordTargets = contents.filter(c => c.content_status === "active" && (!c.search_keywords || c.search_keywords.length === 0));

  const modStats = MODULES.map(mod => {
    const targets = HELP_TARGETS.filter(t => t.module_code === mod);
    const active = targets.filter(t => contentMap[t.target_code]?.content_status === "active").length;
    const missing = targets.filter(t => !contentMap[t.target_code]).length;
    const draft = targets.filter(t => contentMap[t.target_code]?.content_status === "draft").length;
    const pct = Math.round((active / targets.length) * 100);
    return { mod, total: targets.length, active, missing, draft, pct };
  });

  const typeStats = {};
  for (const t of HELP_TARGETS) {
    if (!typeStats[t.target_type]) typeStats[t.target_type] = { total: 0, active: 0 };
    typeStats[t.target_type].total++;
    if (contentMap[t.target_code]?.content_status === "active") typeStats[t.target_type].active++;
  }

  const exportCSV = () => {
    const rows = [
      ["Target Code", "Module", "Page", "Component Type", "Label", "Status", "Has Active Help", "View Count"],
      ...HELP_TARGETS.map(t => {
        const c = contentMap[t.target_code];
        return [t.target_code, t.module_code, t.page_code, t.component_type, t.target_label,
          c?.status || "missing", c?.status === "active" ? "Yes" : "No", c?.view_count || 0];
      })
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "help_coverage_report.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Help Coverage Report"
        description="Completeness analysis across all registered help targets"
        actions={
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Targets", value: total, color: "text-foreground" },
          { label: "Active Coverage", value: `${Math.round((activeCount/total)*100)}%`, color: "text-emerald-600" },
          { label: "Missing Help", value: missingTargets.length, color: "text-red-600" },
          { label: "Draft Only", value: draftTargets.length, color: "text-amber-600" },
          { label: "No Keywords", value: noKeywordTargets.length, color: "text-orange-600" },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coverage by Module */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Coverage by Module</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modStats.map(m => (
              <div key={m.mod} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{MODULE_LABELS[m.mod] || m.mod}</span>
                  <span className={`text-xs font-bold ${m.pct >= 80 ? "text-emerald-600" : m.pct >= 50 ? "text-amber-600" : "text-red-600"}`}>{m.pct}%</span>
                </div>
                <Progress value={m.pct} className="h-2" />
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  <span className="text-emerald-600">✓ {m.active} active</span>
                  {m.missing > 0 && <span className="text-red-600">✗ {m.missing} missing</span>}
                  {m.draft > 0 && <span className="text-amber-600">◷ {m.draft} draft</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Coverage by Type */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Coverage by Component Type</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(typeStats).sort((a,b) => b[1].total - a[1].total).map(([type, stat]) => {
              const pct = Math.round((stat.active / stat.total) * 100);
              return (
                <div key={type} className="bg-muted/50 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize">{type.replace(/_/g, " ")}</span>
                    <span className={`text-xs font-bold ${pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"}`}>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">{stat.active}/{stat.total}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Missing targets list */}
      {missingTargets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Missing Help ({missingTargets.length} targets)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {missingTargets.map(t => (
                <div key={t.target_code} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[8px] py-0">{t.component_type}</Badge>
                    <span className="text-xs">{t.target_label}</span>
                    <Badge className="text-[8px] bg-blue-50 text-blue-700">{t.module_code}</Badge>
                  </div>
                  <code className="text-[9px] text-muted-foreground font-mono">{t.target_code}</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low quality content */}
      {shortHelpTargets.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Thin Help Content ({shortHelpTargets.length})</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Active help entries with very short descriptions (under 30 characters).</p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {shortHelpTargets.map(c => (
                <div key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50">
                  <span className="text-xs">{c.help_title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground italic">"{c.short_help_text}"</span>
                    <code className="text-[9px] font-mono text-muted-foreground">{c.help_target_code}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}