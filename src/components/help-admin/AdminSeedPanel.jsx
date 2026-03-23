import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { BookOpen, Play, CheckCircle2, AlertCircle, Loader2, Database, RefreshCw } from "lucide-react";

const SEED_PACKS = [
  {
    key: "full_manual",
    label: "Seed Full Manual",
    description: "All 5 packs: chapters, page guides, FAQs, how-tos, architecture doc",
    variant: "default",
    icon: BookOpen,
    fn: async (base44) => {
      const results = await Promise.all([
        base44.functions.invoke("seedApplicationManualPart1", {}),
        base44.functions.invoke("seedApplicationManualPart2", {}),
        base44.functions.invoke("seedManualPageGuides", {}),
        base44.functions.invoke("seedManualFAQBank", {}),
        base44.functions.invoke("seedManualArchitectureDoc", {}),
      ]);
      const created = results.reduce((s, r) => s + (r.data?.created || 0), 0);
      const updated = results.reduce((s, r) => s + (r.data?.updated || 0), 0);
      return `${created} created, ${updated} updated across all packs.`;
    },
    invalidates: ["help-manual-topics"],
  },
  {
    key: "contextual",
    label: "Seed Contextual Help",
    description: "Field-level and button-level help for all UI targets",
    variant: "outline",
    icon: Play,
    fn: async (base44) => {
      const res = await base44.functions.invoke("seedHelpContent", {});
      return `Created ${res.data?.created || 0} records, skipped ${res.data?.skipped || 0}.`;
    },
    invalidates: ["help-contents-admin", "help-contents-all"],
  },
  {
    key: "page_inventory",
    label: "Seed Page Inventory",
    description: "Complete app page inventory, dependency map, section map, action map, missing dependency report",
    variant: "outline",
    icon: Play,
    fn: async (base44) => {
      const res = await base44.functions.invoke("seedPageInventory", {});
      return `Created ${res.data?.created || 0}, updated ${res.data?.updated || 0}.`;
    },
    invalidates: ["help-manual-topics"],
  },
  {
    key: "dashboard",
    label: "Seed Dashboard Help",
    description: "Dashboard-specific contextual help content",
    variant: "outline",
    icon: Play,
    fn: async (base44) => {
      const res = await base44.functions.invoke("seedDashboardHelp", {});
      return res.data?.message || "Done.";
    },
    invalidates: ["help-contents-admin", "help-contents-all"],
  },
];

export default function AdminSeedPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});

  const runSeed = async (pack) => {
    setLoading(p => ({ ...p, [pack.key]: true }));
    setResults(p => ({ ...p, [pack.key]: null }));
    try {
      const msg = await pack.fn(base44);
      setResults(p => ({ ...p, [pack.key]: { ok: true, msg } }));
      pack.invalidates.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      toast({ title: `${pack.label} Complete`, description: msg });
    } catch (e) {
      setResults(p => ({ ...p, [pack.key]: { ok: false, msg: e.message } }));
      toast({ title: "Seed Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(p => ({ ...p, [pack.key]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Seed functions populate the help knowledge base. All seeds are safe to re-run (upserts by code).</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SEED_PACKS.map(pack => {
          const Icon = pack.icon;
          const res = results[pack.key];
          const isLoading = loading[pack.key];
          return (
            <Card key={pack.key} className={res?.ok ? "border-emerald-200" : res?.ok === false ? "border-red-200" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{pack.label}</CardTitle>
                  {res?.ok === true && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  {res?.ok === false && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground">{pack.description}</p>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {res && (
                  <p className={`text-xs ${res.ok ? "text-emerald-700" : "text-red-600"}`}>{res.msg}</p>
                )}
                <Button
                  size="sm"
                  variant={pack.variant}
                  onClick={() => runSeed(pack)}
                  disabled={isLoading}
                  className="w-full gap-1"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                  {isLoading ? "Running…" : "Run Seed"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <span className="font-semibold">Re-seed after changes:</span> Run "Seed Full Manual" after any feature release or content update to keep HelpAI's knowledge base current. Contextual help is independent — seed it separately when UI elements change.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}