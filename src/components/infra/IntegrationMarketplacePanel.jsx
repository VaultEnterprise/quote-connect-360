import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Search, CheckCircle2, Plus, ExternalLink, Sparkles, Loader2, Star, Zap, Filter } from "lucide-react";

const CATEGORIES = ["All", "Payroll", "HRIS", "Carrier", "TPA", "Billing", "Communication", "Compliance"];

const INTEGRATIONS = [
  { id: "adp", name: "ADP Workforce Now", category: "Payroll", logo: "🔴", status: "connected", tier: "enterprise", stars: 4.8, installs: "2.1k", desc: "Bi-directional sync of enrollment elections and payroll deductions.", features: ["Deduction sync", "Employee lifecycle", "SSO via ADP"] },
  { id: "workday", name: "Workday HCM", category: "HRIS", logo: "🟠", status: "available", tier: "enterprise", stars: 4.9, installs: "1.8k", desc: "Full HCM integration including census import and benefit elections.", features: ["Census auto-import", "Life event triggers", "Org sync"] },
  { id: "paychex", name: "Paychex Flex", category: "Payroll", logo: "🟢", status: "available", tier: "pro", stars: 4.5, installs: "890", desc: "Payroll deduction export and enrollment confirmation sync.", features: ["Deduction file export", "New hire feed", "Termination sync"] },
  { id: "bamboo", name: "BambooHR", category: "HRIS", logo: "🌿", status: "connected", tier: "pro", stars: 4.7, installs: "1.2k", desc: "Sync employee records, trigger enrollment on new hires.", features: ["New hire auto-invite", "Termination deprovision", "PTO data"] },
  { id: "aetna", name: "Aetna Carrier API", category: "Carrier", logo: "🏥", status: "available", tier: "enterprise", stars: 4.3, installs: "430", desc: "Direct carrier eligibility submission and ID card retrieval.", features: ["Eligibility 834 file", "ID card generation", "Claims status"] },
  { id: "bcbs", name: "BCBS APIs", category: "Carrier", logo: "🔵", status: "available", tier: "enterprise", stars: 4.2, installs: "380", desc: "Blue Cross Blue Shield state plan and eligibility APIs.", features: ["Plan enrollment", "Eligibility check", "EOB retrieval"] },
  { id: "quickbooks", name: "QuickBooks Online", category: "Billing", logo: "💚", status: "available", tier: "pro", stars: 4.4, installs: "620", desc: "Premium billing, invoicing, and reconciliation.", features: ["Invoice creation", "Payment tracking", "GL posting"] },
  { id: "stripe", name: "Stripe", category: "Billing", logo: "💜", status: "connected", tier: "pro", stars: 4.9, installs: "4.2k", desc: "Premium collection, ACH, and card processing for employer invoices.", features: ["ACH debit", "Card processing", "Dunning management"] },
  { id: "slack", name: "Slack", category: "Communication", logo: "🟣", status: "available", tier: "starter", stars: 4.8, installs: "3.1k", desc: "Push enrollment alerts, deadlines, and approvals to Slack channels.", features: ["Enrollment reminders", "Approval workflows", "Daily digests"] },
  { id: "docusign", name: "DocuSign", category: "Compliance", logo: "📄", status: "connected", tier: "pro", stars: 4.7, installs: "2.3k", desc: "Electronic signature for enrollment forms and employer approvals.", features: ["Embedded signing", "Webhook status", "Audit trail"] },
  { id: "gusto", name: "Gusto", category: "Payroll", logo: "🟡", status: "available", tier: "starter", stars: 4.6, installs: "780", desc: "SMB payroll sync with automatic benefit deduction updates.", features: ["Deduction sync", "New hire feed", "COBRA events"] },
  { id: "rippling", name: "Rippling", category: "HRIS", logo: "⚡", status: "available", tier: "enterprise", stars: 4.8, installs: "910", desc: "Comprehensive employee management with device, payroll, and benefits.", features: ["Unified HR sync", "Device management", "App provisioning"] },
];

const TIER_COLORS = {
  starter: "bg-green-100 text-green-700 border-green-200 border",
  pro: "bg-blue-100 text-blue-700 border-blue-200 border",
  enterprise: "bg-purple-100 text-purple-700 border-purple-200 border",
};

export default function IntegrationMarketplacePanel({ aiEnabled }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [aiRecommending, setAiRecommending] = useState(false);
  const [aiRecs, setAiRecs] = useState("");

  const filtered = INTEGRATIONS.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.desc.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || i.category === category;
    return matchSearch && matchCat;
  });

  const getAIRecommendations = async () => {
    setAiRecommending(true);
    setAiRecs("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a health benefits technology consultant. Based on the available integrations in ConnectQuote360's marketplace, recommend which 3-4 integrations would be MOST valuable for a mid-market insurance broker managing 50-200 employer groups. Consider: payroll sync efficiency, carrier connectivity, and HR automation. Be concise — 2-3 sentences per recommendation with a clear business rationale.`,
      });
      setAiRecs(res);
    } catch (e) {
      setAiRecs(`Error: ${e.message}`);
    } finally {
      setAiRecommending(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* AI Recommendations */}
      {aiEnabled && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">AI Integration Recommendations</p>
              </div>
              {aiRecs
                ? <p className="text-xs text-muted-foreground leading-relaxed">{aiRecs}</p>
                : <p className="text-xs text-muted-foreground">Get AI-powered suggestions based on your agency profile and workflow patterns.</p>
              }
            </div>
            <Button size="sm" onClick={getAIRecommendations} disabled={aiRecommending} className="gap-1.5 flex-shrink-0">
              {aiRecommending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {aiRecommending ? "Analyzing..." : "Get Recommendations"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search integrations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${category === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Available", value: INTEGRATIONS.filter(i => i.status === "available").length, color: "text-foreground" },
          { label: "Connected", value: INTEGRATIONS.filter(i => i.status === "connected").length, color: "text-green-600" },
          { label: "Total", value: INTEGRATIONS.length, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(int => (
          <Card key={int.id} className={int.status === "connected" ? "border-green-200" : ""}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{int.logo}</span>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{int.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Badge className={`${TIER_COLORS[int.tier]} text-[8px] py-0`}>{int.tier}</Badge>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{int.stars}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={int.status === "connected"
                  ? "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0 flex-shrink-0"
                  : "bg-muted text-muted-foreground border text-[9px] py-0 flex-shrink-0"}>
                  {int.status === "connected" ? "✓ Connected" : "Available"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{int.desc}</p>
              <div className="flex flex-wrap gap-1">
                {int.features.map(f => (
                  <span key={f} className="text-[9px] px-1.5 py-0.5 bg-muted rounded border border-border">{f}</span>
                ))}
              </div>
              <Button size="sm" variant={int.status === "connected" ? "outline" : "default"} className="w-full h-7 text-xs gap-1">
                {int.status === "connected" ? "Configure" : <><Plus className="w-3 h-3" /> Connect</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}