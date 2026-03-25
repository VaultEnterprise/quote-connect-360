import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronRight, RefreshCw, Zap, Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  running:                  { icon: Clock, color: "text-blue-500", bg: "bg-blue-50 text-blue-700" },
  completed:                { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 text-green-700" },
  completed_with_warnings:  { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 text-amber-700" },
  failed:                   { icon: XCircle, color: "text-red-600", bg: "bg-red-50 text-red-700" },
  rolled_back:              { icon: RefreshCw, color: "text-gray-500", bg: "bg-gray-100 text-gray-600" },
};

const IMPORT_TYPE_LABELS = {
  plan_master:          "Plan Master",
  zip_area_map:         "ZIP / Area Map",
  rate_schedule_header: "Rate Schedule Header",
  rate_detail:          "Rate Detail",
  census_members:       "Census Rating",
  age_band_schema:      "Age Band Schema",
};

const SEV_CONFIG = {
  error:   "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
};

function RunRow({ run }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const { data: exceptions = [] } = useQuery({
    queryKey: ["import-exceptions", run.id],
    queryFn: () => base44.entities.ImportException.filter({ import_run_id: run.id }),
    enabled: expanded,
  });

  const seedMutation = useMutation({
    mutationFn: () => base44.functions.invoke("planRatingEngine", { action: "seedAgeBandSchema" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["import-runs"] }); toast.success("Age band schema seeded"); },
  });

  const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.running;
  const Icon = cfg.icon;
  const duration = run.completed_at && run.started_at
    ? Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000)
    : null;

  const exportExceptions = () => {
    if (!exceptions.length) return;
    const lines = ["row,error_code,severity,field,message", ...exceptions.map(e =>
      `${e.source_row_number || ""},${e.error_code},${e.severity},${e.field_name || ""},${JSON.stringify(e.error_message)}`)];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `exceptions_${run.id}.csv`; a.click();
  };

  return (
    <Card className={run.status === "failed" ? "border-red-200" : run.status === "completed_with_warnings" ? "border-amber-200" : ""}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm">{IMPORT_TYPE_LABELS[run.import_type] || run.import_type}</span>
              <Badge className={`text-xs px-1.5 py-0.5 ${cfg.bg}`}>{run.status.replace(/_/g, " ")}</Badge>
              {run.source_file_name && <span className="text-xs text-muted-foreground truncate max-w-32">{run.source_file_name}</span>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {run.started_at && <span>{new Date(run.started_at).toLocaleString()}</span>}
              {duration != null && <span>{duration}s</span>}
              <span className="text-green-600 font-medium">{run.success_rows} ok</span>
              {run.error_rows > 0 && <span className="text-red-600 font-medium">{run.error_rows} errors</span>}
              {run.warning_rows > 0 && <span className="text-amber-600 font-medium">{run.warning_rows} warnings</span>}
              <span>by {run.created_by || "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {exceptions.length > 0 && (
              <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2" onClick={exportExceptions}>
                <Download className="w-3 h-3" />CSV
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-1.5 pl-7">
            {exceptions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No exceptions logged for this run.</p>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground mb-1">{exceptions.length} exception(s):</p>
                {exceptions.map(ex => (
                  <div key={ex.id} className={`text-xs p-2 rounded border ${SEV_CONFIG[ex.severity]}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge className="text-[10px] px-1 h-4">{ex.error_code}</Badge>
                      {ex.source_row_number && <span>Row {ex.source_row_number}</span>}
                      {ex.field_name && <span className="font-mono">· {ex.field_name}</span>}
                    </div>
                    <p>{ex.error_message}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportRunLog() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const qc = useQueryClient();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["import-runs"],
    queryFn: () => base44.entities.ImportRun.list("-created_date", 100),
    refetchInterval: 15000,
  });

  const seedMutation = useMutation({
    mutationFn: () => base44.functions.invoke("planRatingEngine", { action: "seedAgeBandSchema" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["import-runs"] }); toast.success("ACA Standard 10-band schema seeded"); },
    onError: e => toast.error(e.message),
  });

  const filtered = runs.filter(r =>
    (typeFilter === "all" || r.import_type === typeFilter) &&
    (statusFilter === "all" || r.status === statusFilter)
  );

  const totalErrors = runs.filter(r => r.status === "failed").length;
  const totalWarnings = runs.filter(r => r.status === "completed_with_warnings").length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {[
          { label: "Total Runs", val: runs.length, color: "" },
          { label: "Completed", val: runs.filter(r => r.status === "completed").length, color: "text-green-600" },
          { label: "With Warnings", val: totalWarnings, color: "text-amber-600" },
          { label: "Failed", val: totalErrors, color: "text-red-600" },
        ].map(k => (
          <Card key={k.label}><CardContent className="p-3 text-center"><p className={`text-xl font-bold ${k.color}`}>{k.val}</p><p className="text-muted-foreground">{k.label}</p></CardContent></Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(IMPORT_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="h-8 text-xs gap-1.5">
            <Zap className="w-3 h-3" />{seedMutation.isPending ? "Seeding..." : "Seed Age Band Schema"}
          </Button>
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await base44.functions.invoke("seedValidationRules", {});
              qc.invalidateQueries({ queryKey: ["import-runs"] });
              toast.success(`Validation rules: ${res.data?.message || "done"}`);
            } catch(e) { toast.error(e.message); }
          }} className="h-8 text-xs gap-1.5">
            <ShieldCheck className="w-3 h-3" />Seed Validation Rules
          </Button>
        </div>
      </div>

      {/* Run list */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground text-sm">No import runs yet. Import rate rows, ZIP mappings, or run a census rating to see audit logs here.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(run => <RunRow key={run.id} run={run} />)}
        </div>
      )}
    </div>
  );
}