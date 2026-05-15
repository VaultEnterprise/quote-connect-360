import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

export default function ContentStatisticsTab({ contentMap }) {
  const stats = useMemo(() => {
    const totalTargets = HELP_TARGETS.length;
    const withContent = HELP_TARGETS.filter(t => contentMap[t.target_code]).length;
    const active = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "active").length;
    const draft = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "draft").length;
    const reviewRequired = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "review_required").length;
    const archived = HELP_TARGETS.filter(t => contentMap[t.target_code]?.content_status === "archived").length;

    // Field completeness
    let completenessByField = {};
    for (const target of HELP_TARGETS) {
      const content = contentMap[target.target_code];
      if (content) {
        const fields = [
          "help_title", "short_help_text", "detailed_help_text", "examples_text",
          "warnings_text", "expected_user_action_text", "search_keywords"
        ];
        fields.forEach(f => {
          if (!completenessByField[f]) completenessByField[f] = { filled: 0, total: 0 };
          completenessByField[f].total++;
          if (content[f]?.trim()) completenessByField[f].filled++;
        });
      }
    }

    // Module breakdown
    const moduleStats = MODULES.map(mod => {
      const modTargets = HELP_TARGETS.filter(t => t.module_code === mod);
      const modWithContent = modTargets.filter(t => contentMap[t.target_code]).length;
      const modActive = modTargets.filter(t => contentMap[t.target_code]?.content_status === "active").length;
      return {
        module: MODULE_LABELS[mod] || mod,
        total: modTargets.length,
        withContent: modWithContent,
        active: modActive,
        missing: modTargets.length - modWithContent,
        coverage: Math.round((modWithContent / modTargets.length) * 100)
      };
    });

    const statusData = [
      { name: "Active", value: active, color: "#10b981" },
      { name: "Draft", value: draft, color: "#f59e0b" },
      { name: "Review", value: reviewRequired, color: "#ef4444" },
      { name: "Archived", value: archived, color: "#8b5cf6" },
      { name: "Missing", value: totalTargets - withContent, color: "#d1d5db" }
    ];

    return {
      totalTargets,
      withContent,
      coverage: Math.round((withContent / totalTargets) * 100),
      active,
      draft,
      reviewRequired,
      archived,
      missing: totalTargets - withContent,
      completenessByField,
      moduleStats: moduleStats.sort((a, b) => b.coverage - a.coverage),
      statusData
    };
  }, [contentMap]);

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{stats.coverage}%</div>
            <p className="text-xs text-muted-foreground mt-1">Coverage</p>
            <p className="text-[10px] text-muted-foreground">{stats.withContent}/{stats.totalTargets}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
            <p className="text-xs text-emerald-700 mt-1">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.draft}</div>
            <p className="text-xs text-amber-700 mt-1">Draft</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.reviewRequired}</div>
            <p className="text-xs text-orange-700 mt-1">Review</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
            <p className="text-xs text-red-700 mt-1">Missing</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Content Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stats.statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                {stats.statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Module Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Module Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.moduleStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="module" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" stackId="a" fill="#10b981" name="Active" />
              <Bar dataKey="withContent" stackId="a" fill="#f59e0b" name="With Content (Other)" />
              <Bar dataKey="missing" stackId="a" fill="#ef4444" name="Missing" />
            </BarChart>
          </ResponsiveContainer>
          <div className="space-y-2 pt-3 border-t">
            {stats.moduleStats.map(mod => (
              <div key={mod.module} className="flex items-center justify-between">
                <div className="text-xs flex-1">
                  <p className="font-medium">{mod.module}</p>
                  <p className="text-muted-foreground text-[10px]">{mod.withContent}/{mod.total} content</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${mod.coverage}%` }} />
                  </div>
                  <Badge variant={mod.coverage === 100 ? "default" : "outline"} className="text-[10px]">{mod.coverage}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Field Completeness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Field Completeness (among content with fields)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.completenessByField).map(([field, data]) => {
              const pct = data.total > 0 ? Math.round((data.filled / data.total) * 100) : 0;
              const fieldLabel = field.replace(/_/g, " ").replace("text", "").trim();
              return (
                <div key={field} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium capitalize truncate">{fieldLabel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct === 100 ? "bg-emerald-500" : pct > 75 ? "bg-primary" : pct > 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}