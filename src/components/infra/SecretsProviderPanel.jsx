import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Eye, EyeOff, Key, AlertTriangle, Lock } from "lucide-react";

const SECRETS = [
  { name: "DOCUSIGN_INTEGRATION_KEY", provider: "env", adapter: "DocuSign", required: true, present: true, last_rotated: "2026-02-15" },
  { name: "DOCUSIGN_ACCOUNT_ID", provider: "env", adapter: "DocuSign", required: true, present: true, last_rotated: "2026-02-15" },
  { name: "DOCUSIGN_PRIVATE_KEY", provider: "env", adapter: "DocuSign", required: true, present: true, last_rotated: "2026-02-15" },
  { name: "CARRIER_API_KEY", provider: "env", adapter: "Carrier", required: true, present: true, last_rotated: "2026-01-10" },
  { name: "TPA_API_KEY", provider: "env", adapter: "TPA", required: true, present: false, last_rotated: null },
  { name: "PAYROLL_API_KEY", provider: "env", adapter: "Payroll", required: true, present: true, last_rotated: "2026-03-01" },
  { name: "BILLING_API_KEY", provider: "env", adapter: "Billing", required: true, present: true, last_rotated: "2026-03-01" },
  { name: "EMAIL_API_KEY", provider: "env", adapter: "Notifications", required: true, present: true, last_rotated: "2026-02-20" },
  { name: "SMS_API_KEY", provider: "env", adapter: "Notifications", required: true, present: true, last_rotated: "2026-02-20" },
  { name: "DATABASE_URL", provider: "env", adapter: "PostgreSQL", required: true, present: true, last_rotated: "2026-03-10" },
];

const PROVIDER_OPTIONS = [
  { id: "env", label: "Environment Variables", desc: "os.environ / process.env — suitable for local dev and containerized deployments", icon: "⚙️", recommended: false },
  { id: "azure_kv", label: "Azure Key Vault", desc: "AzureKeyVaultSecretsProvider — recommended for production Azure deployments", icon: "🔷", recommended: true },
  { id: "aws_sm", label: "AWS Secrets Manager", desc: "AwsSecretsManagerProvider — recommended for production AWS deployments", icon: "🟠", recommended: true },
  { id: "dict", label: "DictSecretsProvider", desc: "In-memory dictionary — for testing only, never production", icon: "🧪", recommended: false },
];

function daysSinceRotation(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function SecretsProviderPanel() {
  const [showValues, setShowValues] = useState(false);
  const [activeProvider, setActiveProvider] = useState("env");

  const missing = SECRETS.filter(s => s.required && !s.present).length;
  const stale = SECRETS.filter(s => { const d = daysSinceRotation(s.last_rotated); return d !== null && d > 60; }).length;

  return (
    <div className="space-y-4">
      {/* Alert for missing secrets */}
      {missing > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">{missing} required secret{missing > 1 ? "s" : ""} missing</p>
            <p className="text-xs text-red-700 mt-0.5">Adapters dependent on these secrets will throw <code className="font-mono">KeyError</code> at runtime.</p>
          </div>
        </div>
      )}

      {/* Provider selector */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Active Secrets Provider</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROVIDER_OPTIONS.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${activeProvider === p.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/30"}`}
              >
                <span className="text-lg flex-shrink-0">{p.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold">{p.label}</p>
                    {p.recommended && <Badge className="text-[9px] py-0 bg-green-100 text-green-700 border-green-200 border">recommended</Badge>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secret registry */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> Secret Registry</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowValues(!showValues)}>
              {showValues ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
              {showValues ? "Mask Values" : "Show Values"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {SECRETS.map(s => {
              const days = daysSinceRotation(s.last_rotated);
              const isStale = days !== null && days > 60;
              return (
                <div key={s.name} className={`flex items-center gap-3 p-3 rounded-lg border ${!s.present ? "border-red-200 bg-red-50/30" : isStale ? "border-amber-200 bg-amber-50/30" : "border-border"}`}>
                  {s.present
                    ? <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isStale ? "text-amber-500" : "text-green-500"}`} />
                    : <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-medium">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[9px] py-0">{s.adapter}</Badge>
                      {isStale && <span className="text-[10px] text-amber-600 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {days}d since rotation</span>}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
                    {!s.present ? (
                      <span className="text-destructive font-semibold">NOT SET</span>
                    ) : showValues ? (
                      <span className="text-green-600">sk_live_••••••••••{s.name.slice(-4).toLowerCase()}</span>
                    ) : (
                      <span>••••••••••••••••</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}