import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Sparkles, Play, Pause, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { HELP_TARGETS, MODULES } from "@/lib/helpTargetRegistry";

const MODULE_LABELS = {
  DASHBOARD:"Dashboard", CASES:"Cases", CENSUS:"Census", QUOTES:"Quotes",
  PROPOSALS:"Proposals", ENROLLMENT:"Enrollment", RENEWALS:"Renewals",
  PLANS:"Plan Library", POLICYMATCH:"PolicyMatchAI", EMPLOYERS:"Employers",
  TASKS:"Tasks", CONTRIBUTIONS:"Contributions", EXCEPTIONS:"Exceptions",
  SETTINGS:"Settings", PORTALS:"Portals",
};

export default function BulkAIGeneratePanel({ contentMap }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterModule, setFilterModule] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0, current: "" });
  const [abortRef] = useState({ abort: false });

  const targets = useMemo(() => {
    return HELP_TARGETS.filter(t => {
      const moduleMatch = filterModule === "all" || t.module_code === filterModule;
      const missingMatch = !onlyMissing || !contentMap[t.target_code];
      return moduleMatch && missingMatch;
    });
  }, [contentMap, filterModule, onlyMissing]);

  const runBulk = async () => {
    if (targets.length === 0) return;
    setRunning(true);
    abortRef.abort = false;
    setProgress({ done: 0, total: targets.length, errors: 0, current: "" });

    let errors = 0;
    for (let i = 0; i < targets.length; i++) {
      if (abortRef.abort) break;
      const t = targets[i];
      setProgress(p => ({ ...p, done: i, current: t.target_label }));
      try {
        await base44.functions.invoke("generateHelpForTarget", {
          target_code: t.target_code,
          target_label: t.target_label,
          module_code: t.module_code,
          page_code: t.page_code,
          component_type: t.component_type,
        });
      } catch {
        errors++;
      }
    }

    setProgress(p => ({ ...p, done: targets.length, current: "", errors }));
    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ["help-contents-admin"] });
    queryClient.invalidateQueries({ queryKey: ["help-contents-all"] });
    toast({
      title: "Bulk Generation Complete",
      description: `Generated ${targets.length - errors} items. ${errors > 0 ? `${errors} errors.` : ""}`,
    });
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card className="border-purple-100 bg-purple-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-purple-900">Bulk AI Content Generation</p>
              <p className="text-xs text-purple-700 mt-1">
                Automatically generate contextual help content for multiple UI targets at once using AI.
                Each target gets: title, short help, detailed text, user action guide, warnings, and search keywords.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{HELP_TARGETS.filter(t => !contentMap[t.target_code]).length}</p>
            <p className="text-xs text-muted-foreground">Missing Help Content</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{Object.values(contentMap).filter(c => c.content_status === "draft").length}</p>
            <p className="text-xs text-muted-foreground">Draft (needs review)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{targets.length}</p>
            <p className="text-xs text-muted-foreground">Selected for Generation</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="All Modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {MODULES.map(m => <SelectItem key={m} value={m}>{MODULE_LABELS[m] || m}</SelectItem>)}
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} />
          Only missing targets ({HELP_TARGETS.filter(t => !contentMap[t.target_code]).length})
        </label>
        <Badge variant="outline" className="text-xs">{targets.length} targets queued</Badge>
      </div>

      {running && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Generating content…</span>
              <span className="text-muted-foreground">{progress.done}/{progress.total}</span>
            </div>
            <Progress value={pct} className="h-2" />
            {progress.current && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Processing: {progress.current}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!running && progress.done > 0 && (
        <Card className="border-emerald-200">
          <CardContent className="p-3 flex items-center gap-3">
            {progress.errors === 0
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              : <AlertCircle className="w-5 h-5 text-amber-500" />}
            <p className="text-sm">
              Completed: <strong>{progress.done - progress.errors}</strong> generated.
              {progress.errors > 0 && <span className="text-amber-600"> {progress.errors} errors.</span>}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          onClick={runBulk}
          disabled={running || targets.length === 0}
          className="gap-1"
        >
          <Sparkles className="w-4 h-4" />
          {running ? "Generating…" : `Generate ${targets.length} Items`}
        </Button>
        {running && (
          <Button variant="outline" onClick={() => { abortRef.abort = true; }} className="gap-1">
            <Pause className="w-4 h-4" /> Stop
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        ⚠ AI generation is a starting point — review and refine generated content before relying on it for HelpAI answers.
        Generated content is saved as "active" by default. You can change status in the Editor tab.
      </p>
    </div>
  );
}