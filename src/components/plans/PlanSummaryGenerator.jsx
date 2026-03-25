import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Sparkles, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

function fmt(val, prefix = "$") {
  if (val == null) return "—";
  return `${prefix}${Number(val).toLocaleString()}`;
}

export default function PlanSummaryGenerator({ plans }) {
  const [selectedId, setSelectedId] = useState("");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const plan = plans.find(p => p.id === selectedId);

  const generateSummary = async () => {
    if (!plan) return;
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate a professional employee-facing 1-page benefit summary for this health plan. Use plain language. Include: what's covered, key costs, how to use, and a "is this plan right for me?" checklist.

Plan: ${plan.plan_name}
Carrier: ${plan.carrier}
Type: ${plan.plan_type?.toUpperCase()} / ${plan.network_type}
Individual Deductible: ${fmt(plan.deductible_individual)}
Family Deductible: ${fmt(plan.deductible_family)}
Individual OOP Max: ${fmt(plan.oop_max_individual)}
PCP Copay: ${fmt(plan.copay_pcp)}
Specialist Copay: ${fmt(plan.copay_specialist)}
ER Copay: ${fmt(plan.copay_er)}
Generic RX: ${fmt(plan.rx_generic)}
HSA Eligible: ${plan.hsa_eligible ? "Yes" : "No"}
Notes: ${plan.notes || "None"}

Return JSON with: { headline, coverage_summary, key_costs (array of {label,value}), how_to_use (array of strings), right_for_me (array of strings) }`,
      response_json_schema: {
        type: "object",
        properties: {
          headline: { type: "string" },
          coverage_summary: { type: "string" },
          key_costs: { type: "array", items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } } } },
          how_to_use: { type: "array", items: { type: "string" } },
          right_for_me: { type: "array", items: { type: "string" } },
        },
      },
    });
    setSummary(result);
    setLoading(false);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select a plan..." /></SelectTrigger>
          <SelectContent>
            {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.plan_name} — {p.carrier}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={generateSummary} disabled={!selectedId || loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate 1-Pager
        </Button>
        {summary && (
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Download className="w-4 h-4" /> Print / Export
          </Button>
        )}
      </div>

      {plan && !summary && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Click "Generate 1-Pager" to create an AI-powered employee benefit summary for <strong>{plan.plan_name}</strong>.</p>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card className="print:shadow-none">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <Badge className="mb-1 bg-primary text-white">{plan?.carrier}</Badge>
                <CardTitle className="text-xl">{plan?.plan_name}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">{summary.headline}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{plan?.plan_type?.toUpperCase()}</Badge>
                <Badge variant="outline">{plan?.network_type}</Badge>
                {plan?.hsa_eligible && <Badge className="bg-green-100 text-green-700">HSA Eligible</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">📋 Coverage Summary</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{summary.coverage_summary}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">💰 Key Costs</h3>
              <div className="space-y-1.5">
                {summary.key_costs?.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm border-b pb-1">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-medium">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">🏥 How to Use This Plan</h3>
              <ul className="space-y-1">
                {summary.how_to_use?.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary font-bold mt-0.5">·</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">✅ Is This Plan Right For Me?</h3>
              <ul className="space-y-1">
                {summary.right_for_me?.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <span className="text-green-600 font-bold mt-0.5">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}