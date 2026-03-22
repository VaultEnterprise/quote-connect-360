import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, Plus, Copy, Trash2, RotateCcw, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

const SCOPES = ["cases:read", "cases:write", "census:read", "census:write", "quotes:read", "quotes:write", "enrollment:read", "enrollment:write", "proposals:read", "proposals:write", "webhooks:manage"];

const MOCK_KEYS = [
  { id: "key_1", name: "Production Integration", scopes: ["cases:read", "quotes:read", "enrollment:read"], created: new Date("2026-01-15"), lastUsed: new Date("2026-03-21"), status: "active", prefix: "cq360_prod_" },
  { id: "key_2", name: "Payroll Sync Service", scopes: ["census:read", "enrollment:read"], created: new Date("2026-02-01"), lastUsed: new Date("2026-03-20"), status: "active", prefix: "cq360_pay_" },
  { id: "key_3", name: "Old Staging Key", scopes: ["cases:read", "cases:write"], created: new Date("2025-11-01"), lastUsed: new Date("2026-01-05"), status: "revoked", prefix: "cq360_stg_" },
];

function KeyRow({ apiKey }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const maskedKey = `${apiKey.prefix}${"•".repeat(24)}`;
  const fullKey = `${apiKey.prefix}xK9mP2qR7nL4vJ8wA1cD5eF6`;

  const copy = () => {
    navigator.clipboard.writeText(fullKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Card className={apiKey.status === "revoked" ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold">{apiKey.name}</p>
              <Badge className={apiKey.status === "active" ? "bg-green-100 text-green-700 border-green-200 border text-[10px] py-0" : "bg-red-100 text-red-600 border-red-200 border text-[10px] py-0"}>
                {apiKey.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {show ? fullKey : maskedKey}
              </code>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShow(!show)}>
                {show ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={copy}>
                <Copy className="w-3 h-3" />{copied ? "Copied!" : ""}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {apiKey.scopes.map(s => (
                <Badge key={s} variant="outline" className="text-[9px] py-0 font-mono">{s}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Created {format(apiKey.created, "MMM d, yyyy")} · Last used {format(apiKey.lastUsed, "MMM d, yyyy")}
            </p>
          </div>
          {apiKey.status === "active" && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <RotateCcw className="w-3 h-3" /> Rotate
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive gap-1">
                <Trash2 className="w-3 h-3" /> Revoke
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApiKeysPanel() {
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState([]);

  const toggleScope = (s) => setSelectedScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">API Keys</p>
          <p className="text-xs text-muted-foreground">Manage credentials for external integrations</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-1.5">
          <Plus className="w-4 h-4" /> New API Key
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> Create New API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Key Name</label>
              <Input placeholder="e.g. Payroll Integration, Carrier Portal" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">Scopes <span className="text-muted-foreground font-normal">(select minimum required)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {SCOPES.map(s => (
                  <button key={s} onClick={() => toggleScope(s)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${selectedScopes.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" disabled={!newKeyName || selectedScopes.length === 0} className="gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Generate Key
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {MOCK_KEYS.map(k => <KeyRow key={k.id} apiKey={k} />)}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p className="font-semibold text-foreground">Key Security Policy</p>
            <p>Keys are shown once on creation. Use scoped keys — never grant more permissions than needed. Revoked keys cannot be restored. Rate limit: 1,000 req/min per key.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}