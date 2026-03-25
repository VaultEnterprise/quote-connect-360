import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REQUIRED_COLS = ["plan_name", "state", "effective_date", "ee_only"];
const OPTIONAL_COLS = ["ee_spouse", "ee_children", "family", "prior_year_ee", "rate_type", "regulatory_notes"];

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return { headers, rows: lines.slice(1).map(line => {
    const vals = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() || ""]));
  })};
}

export default function BulkRateUpload({ plans }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef();
  const [status, setStatus] = useState("idle"); // idle | parsing | validating | importing | done | error
  const [results, setResults] = useState({ valid: [], invalid: [], warnings: [] });
  const [progress, setProgress] = useState(0);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("parsing");
    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    // Validate headers
    const missingCols = REQUIRED_COLS.filter(c => !headers.includes(c));
    if (missingCols.length > 0) {
      setStatus("error");
      setResults({ valid: [], invalid: [{ row: 0, reason: `Missing required columns: ${missingCols.join(", ")}` }], warnings: [] });
      return;
    }

    setStatus("validating");
    const valid = [], invalid = [], warnings = [];
    const seenKeys = new Set();

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      const errs = [];
      const warns = [];
      if (!row.plan_name) errs.push("Missing plan_name");
      if (!row.state || row.state.length !== 2) errs.push("Invalid state code");
      if (!row.effective_date) errs.push("Missing effective_date");
      if (!row.ee_only || isNaN(parseFloat(row.ee_only))) errs.push("Invalid ee_only rate");

      const key = `${row.plan_name}|${row.state}|${row.effective_date}`;
      if (seenKeys.has(key)) errs.push("Duplicate entry");
      seenKeys.add(key);

      if (row.prior_year_ee && row.ee_only) {
        const variance = ((parseFloat(row.ee_only) - parseFloat(row.prior_year_ee)) / parseFloat(row.prior_year_ee)) * 100;
        if (Math.abs(variance) > 10) warns.push(`Rate variance ${variance.toFixed(1)}% YoY`);
      }

      if (errs.length > 0) invalid.push({ row: rowNum, data: row, reason: errs.join("; ") });
      else { valid.push(row); if (warns.length > 0) warnings.push({ row: rowNum, data: row, warns }); }
    });

    setResults({ valid, invalid, warnings });
    setStatus("ready");
  };

  const runImport = async () => {
    setStatus("importing");
    setProgress(0);
    let done = 0;
    for (const row of results.valid) {
      const matchedPlan = plans.find(p => p.plan_name?.toLowerCase() === row.plan_name?.toLowerCase());
      if (matchedPlan) {
        await base44.entities.PlanRateByState.create({
          plan_id: matchedPlan.id,
          state: row.state.toUpperCase(),
          effective_date: row.effective_date,
          ee_only: parseFloat(row.ee_only) || 0,
          ee_spouse: parseFloat(row.ee_spouse) || 0,
          ee_children: parseFloat(row.ee_children) || 0,
          family: parseFloat(row.family) || 0,
          prior_year_ee: parseFloat(row.prior_year_ee) || 0,
          rate_type: row.rate_type || "composite",
          regulatory_notes: row.regulatory_notes || "",
        });
        await base44.entities.PlanAuditLog.create({ plan_id: matchedPlan.id, action: "rate_changed", actor_email: user?.email || "import", description: `Bulk rate upload: ${row.state} rates for ${row.effective_date}`, source: "import" });
      }
      done++;
      setProgress(Math.round((done / results.valid.length) * 100));
    }
    qc.invalidateQueries({ queryKey: ["plan-rates-by-state"] });
    setStatus("done");
    toast.success(`Imported ${results.valid.length} rate records`);
  };

  const downloadTemplate = () => {
    const csv = [REQUIRED_COLS.concat(OPTIONAL_COLS).join(","), "Aetna PPO Gold,CA,2024-01-01,450.00,900.00,700.00,1200.00,400.00,composite,Standard CA rates"].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rate_upload_template.csv"; a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Bulk Rate Upload</CardTitle>
          </div>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={downloadTemplate}>Download Template</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload zone */}
        <div
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          {status === "idle" || status === "ready" || status === "done" ? (
            <>
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Drop a CSV rate file here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Required columns: {REQUIRED_COLS.join(", ")}</p>
            </>
          ) : status === "parsing" || status === "validating" ? (
            <div className="flex items-center justify-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> {status === "parsing" ? "Parsing file..." : "Validating data..."}</div>
          ) : status === "importing" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Importing... {progress}%</div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          ) : null}
        </div>

        {/* Validation results */}
        {(status === "ready" || status === "done") && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-green-50 p-2 rounded"><p className="font-bold text-green-700 text-lg">{results.valid.length}</p><p className="text-green-600">Valid</p></div>
              <div className="bg-red-50 p-2 rounded"><p className="font-bold text-red-700 text-lg">{results.invalid.length}</p><p className="text-red-600">Invalid</p></div>
              <div className="bg-amber-50 p-2 rounded"><p className="font-bold text-amber-700 text-lg">{results.warnings.length}</p><p className="text-amber-600">Warnings</p></div>
            </div>

            {results.invalid.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {results.invalid.map((err, i) => (
                  <div key={i} className="text-xs flex gap-2 items-start p-1.5 bg-red-50 rounded">
                    <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>Row {err.row}: {err.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {results.warnings.length > 0 && (
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {results.warnings.map((w, i) => (
                  <div key={i} className="text-xs flex gap-2 items-start p-1.5 bg-amber-50 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Row {w.row}: {w.warns.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}

            {status === "done" ? (
              <div className="flex items-center gap-2 text-sm text-green-600 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4" /> Import complete — {results.valid.length} records added
              </div>
            ) : results.valid.length > 0 && (
              <Button className="w-full" onClick={runImport}>Import {results.valid.length} Valid Records</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}