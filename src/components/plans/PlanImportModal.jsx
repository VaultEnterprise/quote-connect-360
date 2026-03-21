import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";

const CSV_TEMPLATE = `plan_type,carrier,plan_name,plan_code,network_type,state,effective_date,deductible_individual,deductible_family,oop_max_individual,oop_max_family,copay_pcp,copay_specialist,copay_er,coinsurance,rx_tier1,rx_tier2,rx_tier3,rx_tier4,hsa_eligible
medical,Aetna,Gold PPO 1000,MED-G-1000,PPO,CA,2026-01-01,1000,2000,5000,10000,25,50,250,80,10,35,65,150,false
dental,Cigna,Basic Dental,DEN-B-100,,,2026-01-01,,,,,,,,,,,,, false`;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const v = vals[i];
      if (!v || v === "") return;
      const numFields = ["deductible_individual","deductible_family","oop_max_individual","oop_max_family","copay_pcp","copay_specialist","copay_er","coinsurance","rx_tier1","rx_tier2","rx_tier3","rx_tier4"];
      if (numFields.includes(h)) obj[h] = parseFloat(v);
      else if (h === "hsa_eligible") obj[h] = v.toLowerCase() === "true";
      else obj[h] = v;
    });
    return obj;
  }).filter(r => r.plan_name && r.carrier);
}

export default function PlanImportModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setPreview(parsed);
    };
    reader.readAsText(f);
  };

  const importMutation = useMutation({
    mutationFn: () => base44.entities.BenefitPlan.bulkCreate(preview.map(p => ({ ...p, status: "active" }))),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["benefit-plans"] });
      setResult({ success: true, count: preview.length });
    },
  });

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plan_import_template.csv"; a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Plans from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground">
            Upload a CSV file with plan data. Download the template below for the correct column format.
          </div>

          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" /> Download CSV Template
          </Button>

          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => document.getElementById("plan-csv-input").click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{file ? file.name : "Click to select CSV file"}</p>
            <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
            <input id="plan-csv-input" type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          {preview.length > 0 && !result && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                Preview — {preview.length} plans found
              </div>
              <div className="max-h-40 overflow-y-auto divide-y">
                {preview.map((p, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{p.plan_name}</span>
                    <span className="text-xs text-muted-foreground">{p.carrier} · {p.plan_type?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.success && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4" />
              Successfully imported {result.count} plans!
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {preview.length > 0 && !result && (
            <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
              {importMutation.isPending ? "Importing..." : `Import ${preview.length} Plans`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}