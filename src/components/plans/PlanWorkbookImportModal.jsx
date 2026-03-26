import React, { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

function inferPlanName(fileName) {
  return String(fileName || "")
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function PlanWorkbookImportModal({ open, onClose, onImported }) {
  const qc = useQueryClient();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    carrier: "",
    plan_name: "",
    plan_code: "",
    network_type: "PPO",
    plan_type: "medical",
    effective_date: "",
    policy_expiration_date: "",
    market_segment: "small_group",
    funding_type: "fully_insured",
    notes: "",
  });

  const canSubmit = useMemo(() => !!file && !!form.carrier && !!form.plan_name && !!form.effective_date && !!form.policy_expiration_date, [file, form]);
  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const importMutation = useMutation({
    mutationFn: async () => {
      const upload = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke("importPlanWorkbook", {
        file_url: upload.file_url,
        sourceFileName: file.name,
        planDraft: form,
      });
      return response.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["benefit-plans"] });
      qc.invalidateQueries({ queryKey: ["plan-rate-schedules"] });
      qc.invalidateQueries({ queryKey: ["zip-area-maps"] });
      toast.success(`Imported ${data.imported_rate_rows} rate rows and ${data.imported_zip_rows} ZIP codes into ${form.plan_name}`);
      onClose();
      if (onImported) onImported(data.plan_id);
    },
    onError: (error) => toast.error(error.message || "Could not import workbook"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Special Workbook Import</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            Use this for carrier workbooks like the one you attached. It creates the plan, creates its rate schedule, imports the rate rows, and saves it directly into the Rate Editor.
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/40"
          >
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">{file ? file.name : "Choose workbook"}</p>
            <p className="text-xs text-muted-foreground mt-1">Accepted: .xlsx or .xls</p>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] || null;
              setFile(nextFile);
              if (nextFile && !form.plan_name) setField("plan_name", inferPlanName(nextFile.name));
            }}
          />

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Carrier *</Label>
              <Input className="mt-1" value={form.carrier} onChange={(e) => setField("carrier", e.target.value)} placeholder="e.g. Aetna" />
            </div>
            <div>
              <Label>Plan Name *</Label>
              <Input className="mt-1" value={form.plan_name} onChange={(e) => setField("plan_name", e.target.value)} placeholder="e.g. Road Ranger Medical 2026" />
            </div>
            <div>
              <Label>Plan Code</Label>
              <Input className="mt-1" value={form.plan_code} onChange={(e) => setField("plan_code", e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label>Effective Date *</Label>
              <Input className="mt-1" type="date" value={form.effective_date} onChange={(e) => setField("effective_date", e.target.value)} />
            </div>
            <div>
              <Label>Policy Expiration Date *</Label>
              <Input className="mt-1" type="date" value={form.policy_expiration_date} onChange={(e) => setField("policy_expiration_date", e.target.value)} />
            </div>
            <div>
              <Label>Plan Type</Label>
              <Select value={form.plan_type} onValueChange={(value) => setField("plan_type", value)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="dental">Dental</SelectItem>
                  <SelectItem value="vision">Vision</SelectItem>
                  <SelectItem value="life">Life</SelectItem>
                  <SelectItem value="std">STD</SelectItem>
                  <SelectItem value="ltd">LTD</SelectItem>
                  <SelectItem value="voluntary">Voluntary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Network Type</Label>
              <Select value={form.network_type} onValueChange={(value) => setField("network_type", value)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HMO">HMO</SelectItem>
                  <SelectItem value="PPO">PPO</SelectItem>
                  <SelectItem value="EPO">EPO</SelectItem>
                  <SelectItem value="HDHP">HDHP</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                  <SelectItem value="indemnity">Indemnity</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Market Segment</Label>
              <Select value={form.market_segment} onValueChange={(value) => setField("market_segment", value)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small_group">Small Group</SelectItem>
                  <SelectItem value="large_group">Large Group</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="medicare_advantage">Medicare Advantage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Funding Type</Label>
              <Select value={form.funding_type} onValueChange={(value) => setField("funding_type", value)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fully_insured">Fully Insured</SelectItem>
                  <SelectItem value="self_funded">Self-Funded</SelectItem>
                  <SelectItem value="level_funded">Level Funded</SelectItem>
                  <SelectItem value="reference_based">Reference-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => importMutation.mutate()} disabled={!canSubmit || importMutation.isPending} className="flex-1 gap-1.5">
              {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {importMutation.isPending ? "Importing..." : "Create Plan & Import Workbook"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}