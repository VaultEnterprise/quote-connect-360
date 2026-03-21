import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight } from "lucide-react";

// ─── Field definitions ────────────────────────────────────────────────────────
const PLAN_FIELDS = [
  { key: "plan_type",              label: "Plan Type",            required: true },
  { key: "carrier",                label: "Carrier",              required: true },
  { key: "plan_name",              label: "Plan Name",            required: true },
  { key: "plan_code",              label: "Plan Code",            required: false },
  { key: "network_type",           label: "Network Type",         required: false },
  { key: "state",                  label: "State",                required: false },
  { key: "effective_date",         label: "Effective Date",       required: false },
  { key: "deductible_individual",  label: "Deductible (Ind)",     required: false },
  { key: "deductible_family",      label: "Deductible (Family)",  required: false },
  { key: "oop_max_individual",     label: "OOP Max (Ind)",        required: false },
  { key: "oop_max_family",         label: "OOP Max (Family)",     required: false },
  { key: "copay_pcp",              label: "PCP Copay",            required: false },
  { key: "copay_specialist",       label: "Specialist Copay",     required: false },
  { key: "copay_er",               label: "ER Copay",             required: false },
  { key: "coinsurance",            label: "Coinsurance %",        required: false },
  { key: "rx_tier1",               label: "Rx Tier 1",            required: false },
  { key: "rx_tier2",               label: "Rx Tier 2",            required: false },
  { key: "rx_tier3",               label: "Rx Tier 3",            required: false },
  { key: "rx_tier4",               label: "Rx Tier 4",            required: false },
  { key: "hsa_eligible",           label: "HSA Eligible",         required: false },
];

const NUM_FIELDS = ["deductible_individual","deductible_family","oop_max_individual","oop_max_family",
  "copay_pcp","copay_specialist","copay_er","coinsurance","rx_tier1","rx_tier2","rx_tier3","rx_tier4"];

// ─── Automap hints ────────────────────────────────────────────────────────────
const AUTOMAP_HINTS = {
  plan_type:             ["plan_type","plan type","type","benefit type","benefit_type","line of coverage"],
  carrier:               ["carrier","insurance company","insurer","company","payer"],
  plan_name:             ["plan_name","plan name","name","plan","benefit plan"],
  plan_code:             ["plan_code","plan code","code","plan id","id","product code"],
  network_type:          ["network_type","network","network type","plan design","hmo","ppo","epo","hdhp"],
  state:                 ["state","st","location"],
  effective_date:        ["effective_date","effective date","start date","date"],
  deductible_individual: ["deductible_individual","deductible (ind)","ind deductible","individual deductible","deductible individual","single deductible","ded ind"],
  deductible_family:     ["deductible_family","family deductible","deductible (family)","ded fam","fam deductible"],
  oop_max_individual:    ["oop_max_individual","oop individual","individual oop","oop ind","out of pocket individual","moop ind"],
  oop_max_family:        ["oop_max_family","family oop","oop family","out of pocket family","moop fam"],
  copay_pcp:             ["copay_pcp","pcp copay","primary care","primary copay","pcp","office visit"],
  copay_specialist:      ["copay_specialist","specialist copay","specialist","spec copay"],
  copay_er:              ["copay_er","er copay","emergency room","emergency","er"],
  coinsurance:           ["coinsurance","co-insurance","coins","plan pays","coin"],
  rx_tier1:              ["rx_tier1","rx tier 1","tier 1","generic","tier1","rx1"],
  rx_tier2:              ["rx_tier2","rx tier 2","tier 2","preferred brand","tier2","rx2"],
  rx_tier3:              ["rx_tier3","rx tier 3","tier 3","non-preferred","tier3","rx3"],
  rx_tier4:              ["rx_tier4","rx tier 4","tier 4","specialty","tier4","rx4"],
  hsa_eligible:          ["hsa_eligible","hsa","hsa eligible","hsa eligible?","high deductible"],
};

function autoMap(headers) {
  const mapping = {};
  headers.forEach(h => {
    const normalized = h.toLowerCase().replace(/[_\-]+/g, " ").trim();
    for (const [field, hints] of Object.entries(AUTOMAP_HINTS)) {
      if (hints.some(hint => hint.replace(/[_\-]+/g, " ").trim() === normalized)) {
        if (!mapping[field]) mapping[field] = h;
        break;
      }
    }
  });
  return mapping;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.replace(/^["']|["']$/g, "").trim());
  const rows = lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.replace(/^["']|["']$/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  }).filter(r => Object.values(r).some(v => v));
  return { headers, rows };
}

// ─── Transform ────────────────────────────────────────────────────────────────
const VALID_PLAN_TYPES = ["medical","dental","vision","life","std","ltd","voluntary"];
const VALID_NETWORK_TYPES = ["HMO","PPO","EPO","HDHP","POS","indemnity","other"];

function transformRow(row, mapping) {
  const get = (field) => row[mapping[field]] || "";
  const obj = { status: "active" };
  PLAN_FIELDS.forEach(({ key }) => {
    if (!mapping[key]) return;
    const val = get(key);
    if (!val) return;
    if (NUM_FIELDS.includes(key)) obj[key] = parseFloat(val.replace(/[$,]/g, "")) || undefined;
    else if (key === "hsa_eligible") obj[key] = ["true","yes","1","y"].includes(val.toLowerCase());
    else obj[key] = val;
  });

  // Normalize plan_type
  if (obj.plan_type) {
    const t = obj.plan_type.toLowerCase();
    const found = VALID_PLAN_TYPES.find(v => t.includes(v));
    obj.plan_type = found || "medical";
  }

  // Normalize network_type
  if (obj.network_type) {
    const n = obj.network_type.toUpperCase();
    const found = VALID_NETWORK_TYPES.find(v => v.toUpperCase() === n || n.includes(v.toUpperCase()));
    obj.network_type = found || "other";
  }

  return obj;
}

// ─── Template ─────────────────────────────────────────────────────────────────
const CSV_TEMPLATE = `plan_type,carrier,plan_name,plan_code,network_type,state,effective_date,deductible_individual,deductible_family,oop_max_individual,oop_max_family,copay_pcp,copay_specialist,copay_er,coinsurance,rx_tier1,rx_tier2,rx_tier3,rx_tier4,hsa_eligible
medical,Aetna,Gold PPO 1000,MED-G-1000,PPO,CA,2026-01-01,1000,2000,5000,10000,25,50,250,80,10,35,65,150,false
medical,Aetna,Silver HDHP 2500,MED-S-2500,HDHP,CA,2026-01-01,2500,5000,7000,14000,0,0,250,80,10,35,65,150,true
dental,Cigna,Basic Dental,DEN-B-100,,,2026-01-01,50,150,1000,1000,,,,80,,,,, false
vision,VSP,Core Vision,VIS-C,,,2026-01-01,,,,,,,,,,,,,`;

const STEPS = ["upload", "mapping", "review", "done"];

export default function PlanImportModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleFile = (f) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers: h, rows: r } = parseCSV(ev.target.result);
      setHeaders(h);
      setRows(r);
      setMapping(autoMap(h));
      setStep("mapping");
    };
    reader.readAsText(f);
  };

  const preview = rows.map(r => transformRow(r, mapping)).filter(r => r.plan_name && r.carrier);

  const handleImport = async () => {
    setImporting(true);
    for (let i = 0; i < preview.length; i += 50) {
      await base44.entities.BenefitPlan.bulkCreate(preview.slice(i, i + 50));
    }
    queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
    setImportedCount(preview.length);
    setImporting(false);
    setStep("done");
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plan_import_template.csv"; a.click();
  };

  const handleClose = () => {
    setStep("upload"); setFile(null); setHeaders([]); setRows([]); setMapping({}); setImporting(false);
    onClose();
  };

  const mappedRequired = PLAN_FIELDS.filter(f => f.required && !mapping[f.key]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Plans from CSV</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 pt-2">
            {["Upload", "Map Fields", "Review", "Done"].map((label, i) => {
              const stepKey = STEPS[i];
              const active = step === stepKey;
              const done = STEPS.indexOf(step) > i;
              return (
                <React.Fragment key={stepKey}>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${active ? "text-primary" : done ? "text-green-600" : "text-muted-foreground"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-primary text-white" : done ? "bg-green-500 text-white" : "bg-muted"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    {label}
                  </div>
                  {i < 3 && <div className="flex-1 h-px bg-border" />}
                </React.Fragment>
              );
            })}
          </div>
        </DialogHeader>

        {/* ── Step 1: Upload ── */}
        {step === "upload" && (
          <div className="space-y-4 py-2">
            <div className="bg-muted/40 rounded-lg p-3 text-sm text-muted-foreground">
              Upload a CSV with plan data. Columns will be auto-mapped — any column order or naming works.
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" /> Download CSV Template
            </Button>
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Click to select a CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
              <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          </div>
        )}

        {/* ── Step 2: Mapping ── */}
        {step === "mapping" && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{rows.length} rows</span> in <span className="font-medium text-foreground">{file?.name}</span>
              </p>
              <Button variant="outline" size="sm" onClick={() => setMapping(autoMap(headers))}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Re-automap
              </Button>
            </div>

            {mappedRequired.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Required fields not mapped: {mappedRequired.map(f => f.label).join(", ")}
              </div>
            )}

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-2 gap-4">
                <span>Field</span><span>Column in Your File</span>
              </div>
              <div className="divide-y max-h-72 overflow-y-auto">
                {PLAN_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="px-3 py-2 grid grid-cols-2 gap-4 items-center">
                    <div className="text-sm flex items-center gap-1.5">
                      {required && <span className="text-destructive">*</span>}
                      <span className={required ? "font-medium" : "text-muted-foreground"}>{label}</span>
                      {mapping[key] && <Badge variant="secondary" className="text-[10px] py-0">auto</Badge>}
                    </div>
                    <Select value={mapping[key] || "__none__"} onValueChange={v => setMapping(m => ({ ...m, [key]: v === "__none__" ? undefined : v }))}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="— skip —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— skip —</SelectItem>
                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === "review" && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{preview.length} plans</span> ready to import
            </p>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground grid grid-cols-4 gap-2">
                <span>Plan Name</span><span>Carrier</span><span>Type</span><span>Network</span>
              </div>
              <div className="divide-y max-h-56 overflow-y-auto">
                {preview.map((p, i) => (
                  <div key={i} className="px-3 py-2 grid grid-cols-4 gap-2 text-xs">
                    <span className="font-medium truncate">{p.plan_name}</span>
                    <span className="text-muted-foreground truncate">{p.carrier}</span>
                    <span className="capitalize">{p.plan_type}</span>
                    <span className="text-muted-foreground">{p.network_type || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
            {preview.length < rows.length && (
              <p className="text-xs text-amber-600">{rows.length - preview.length} rows skipped (missing required fields)</p>
            )}
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === "done" && (
          <div className="py-10 flex flex-col items-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-green-500" />
            <p className="text-lg font-semibold">Plans Imported!</p>
            <p className="text-sm text-muted-foreground">{importedCount} plans added to the Plan Library</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{step === "done" ? "Close" : "Cancel"}</Button>
          {step === "mapping" && (
            <Button onClick={() => setStep("review")} disabled={mappedRequired.length > 0}>
              Review <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
          {step === "review" && (
            <Button onClick={handleImport} disabled={importing || preview.length === 0}>
              {importing ? "Importing..." : `Import ${preview.length} Plans`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}