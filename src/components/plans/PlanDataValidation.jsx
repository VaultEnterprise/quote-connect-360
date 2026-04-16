import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const REQUIRED_FIELDS = ["plan_name", "carrier", "plan_type", "network_type", "deductible_individual", "oop_max_individual", "copay_pcp"];
const RECOMMENDED_FIELDS = ["deductible_family", "oop_max_family", "copay_specialist", "copay_er", "coinsurance", "rx_tier1"];
const ACA_METAL_TIERS = ["bronze", "silver", "gold", "platinum"];

function computeScore(plan) {
  const missing = REQUIRED_FIELDS.filter(f => !plan[f] && plan[f] !== 0);
  const missingRec = RECOMMENDED_FIELDS.filter(f => !plan[f] && plan[f] !== 0);
  const total = REQUIRED_FIELDS.length + RECOMMENDED_FIELDS.length;
  const filled = total - missing.length - missingRec.length;
  return { score: Math.round((filled / total) * 100), missing, missingRec };
}

export default function PlanDataValidation({ plans }) {
  const qc = useQueryClient();

  const planValidations = useMemo(() =>
    plans.map(p => ({ ...p, ...computeScore(p) })), [plans]);

  const runValidation = useMutation({
    mutationFn: async () => {
      for (const p of planValidations) {
        const existing = await base44.entities.DataCompletenessFlag.filter({ plan_id: p.id });
        const data = {
          plan_id: p.id,
          missing_fields: [...p.missing, ...p.missingRec],
          severity: p.missing.length > 3 ? "critical" : p.missing.length > 0 ? "error" : p.missingRec.length > 0 ? "warning" : "ok",
          completeness_score: p.score,
          can_be_quoted: p.missing.length === 0,
          last_checked: new Date().toISOString(),
        };
        if (existing.length > 0) await base44.entities.DataCompletenessFlag.update(existing[0].id, data);
        else await base44.entities.DataCompletenessFlag.create(data);
      }
      qc.invalidateQueries({ queryKey: ["data-completeness-flags"] });
      toast.success("Validation complete");
    },
  });

  const critical = planValidations.filter(p => p.missing.length > 3);
  const errors = planValidations.filter(p => p.missing.length > 0 && p.missing.length <= 3);
  const warnings = planValidations.filter(p => p.missing.length === 0 && p.missingRec.length > 0);
  const complete = planValidations.filter(p => p.missing.length === 0 && p.missingRec.length === 0);

  const avgScore = planValidations.length > 0 ? Math.round(planValidations.reduce((s, p) => s + p.score, 0) / planValidations.length) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Data Completeness Engine</CardTitle>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => runValidation.mutate()} disabled={runValidation.isPending}>
            <RefreshCw className={`w-3 h-3 ${runValidation.isPending ? "animate-spin" : ""}`} /> Run Validation
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-lg bg-red-50">
            <p className="text-xl font-bold text-red-600">{critical.length}</p>
            <p className="text-xs text-red-600">Critical</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-50">
            <p className="text-xl font-bold text-orange-600">{errors.length}</p>
            <p className="text-xs text-orange-600">Errors</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50">
            <p className="text-xl font-bold text-amber-600">{warnings.length}</p>
            <p className="text-xs text-amber-600">Warnings</p>
          </div>
          <div className="p-2 rounded-lg bg-green-50">
            <p className="text-xl font-bold text-green-600">{complete.length}</p>
            <p className="text-xs text-green-600">Complete</p>
          </div>
        </div>

        {/* Overall score bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Library Completeness</span>
            <span className="font-bold">{avgScore}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${avgScore >= 80 ? "bg-green-500" : avgScore >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${avgScore}%` }} />
          </div>
        </div>

        {/* Per-plan breakdown */}
        {[...critical, ...errors, ...warnings].length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground">Plans Needing Attention</p>
            {[...critical, ...errors, ...warnings].map(p => (
              <div key={p.id} className="flex items-start gap-2 text-xs p-2 rounded border">
                {p.missing.length > 3 ? <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" /> :
                 p.missing.length > 0 ? <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" /> :
                 <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.plan_name} — {p.carrier}</p>
                  <p className="text-muted-foreground">Score: {p.score}% · Missing: {[...p.missing, ...p.missingRec].join(", ") || "none"}</p>
                </div>
                <span className="font-bold">{p.score}%</span>
              </div>
            ))}
          </div>
        )}

        {complete.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-600 p-2 bg-green-50 rounded">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{complete.length} plan(s) fully complete and quote-ready</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}