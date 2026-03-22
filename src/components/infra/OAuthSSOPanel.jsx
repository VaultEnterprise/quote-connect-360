import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Shield, Plus, ExternalLink, CheckCircle2, AlertTriangle, Settings, Lock, Key, Users, Globe } from "lucide-react";

const OAUTH_PROVIDERS = [
  { id: "okta", name: "Okta", logo: "🔵", status: "connected", users: 84, lastSync: "2 min ago", scopes: ["openid", "profile", "email", "groups"], protocol: "OIDC" },
  { id: "azure", name: "Azure AD / Entra", logo: "🪟", status: "connected", users: 142, lastSync: "5 min ago", scopes: ["openid", "profile", "email", "Directory.Read.All"], protocol: "OIDC" },
  { id: "google", name: "Google Workspace", logo: "🟡", status: "disconnected", users: 0, lastSync: "—", scopes: [], protocol: "OIDC" },
  { id: "saml", name: "SAML 2.0 IdP", logo: "🔐", status: "disconnected", users: 0, lastSync: "—", scopes: [], protocol: "SAML" },
];

const SCIM_CONFIG = {
  endpoint: "https://api.connectquote360.com/scim/v2",
  token: "scim_tok_••••••••••••••••",
  autoProvision: true,
  autoDeprovision: true,
  groupSync: true,
  lastSync: "2026-03-22T09:14:00Z",
  usersProvisioned: 226,
  groupsSynced: 12,
};

const JWT_SETTINGS = [
  { label: "Algorithm", value: "RS256", editable: false },
  { label: "Token TTL", value: "3600s (1 hour)", editable: true },
  { label: "Refresh Token TTL", value: "2592000s (30 days)", editable: true },
  { label: "Issuer", value: "https://auth.connectquote360.com", editable: false },
  { label: "Audience", value: "https://api.connectquote360.com", editable: false },
];

const RBAC_ROLES = [
  { name: "super_admin", desc: "Full platform access, billing, integrations", perms: ["*"] },
  { name: "broker_admin", desc: "All cases, census, quotes, proposals, enrollment", perms: ["cases:*", "census:*", "quotes:*", "proposals:*", "enrollment:*"] },
  { name: "broker_read", desc: "Read-only access to all broker data", perms: ["cases:read", "quotes:read", "proposals:read", "enrollment:read"] },
  { name: "employer_admin", desc: "Own group's cases and enrollment", perms: ["cases:read", "enrollment:*", "proposals:read"] },
  { name: "employee", desc: "Personal enrollment portal only", perms: ["enrollment.self:*"] },
  { name: "api_integration", desc: "Machine-to-machine API access", perms: ["cases:read", "census:*", "enrollment:read", "webhooks:manage"] },
];

export default function OAuthSSOPanel() {
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [scimEnabled, setScimEnabled] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(true);
  const [ipAllowlist, setIpAllowlist] = useState(true);

  return (
    <div className="space-y-6">
      {/* SSO Providers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">SSO / Identity Providers</p>
            <p className="text-xs text-muted-foreground">OIDC and SAML 2.0 enterprise SSO connections</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddProvider(!showAddProvider)}>
            <Plus className="w-4 h-4" /> Add Provider
          </Button>
        </div>

        {showAddProvider && (
          <Card className="border-primary/30 bg-primary/5 mb-4">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1.5 block">Discovery URL / Metadata URL</label>
                  <Input placeholder="https://your-idp.com/.well-known/openid-configuration" className="h-8 text-xs font-mono" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">Client ID</label>
                  <Input placeholder="client_id" className="h-8 text-xs font-mono" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">Client Secret</label>
                  <Input type="password" placeholder="••••••••••••" className="h-8 text-xs font-mono" /></div>
                <div><label className="text-xs font-medium mb-1.5 block">Display Name</label>
                  <Input placeholder="My Company SSO" className="h-8 text-xs" /></div>
              </div>
              <div className="flex gap-2">
                <Button size="sm">Test & Save</Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddProvider(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {OAUTH_PROVIDERS.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                <span className="text-2xl">{p.logo}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <Badge variant="outline" className="text-[9px] py-0">{p.protocol}</Badge>
                    <Badge className={p.status === "connected"
                      ? "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0"
                      : "bg-muted text-muted-foreground border text-[9px] py-0"}>
                      {p.status}
                    </Badge>
                  </div>
                  {p.status === "connected" && (
                    <p className="text-xs text-muted-foreground">{p.users} users · last sync {p.lastSync}</p>
                  )}
                  {p.scopes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.scopes.map(s => <Badge key={s} variant="outline" className="text-[9px] font-mono py-0">{s}</Badge>)}
                    </div>
                  )}
                </div>
                <Button variant={p.status === "connected" ? "outline" : "default"} size="sm" className="h-7 text-xs gap-1">
                  {p.status === "connected" ? <><Settings className="w-3 h-3" /> Configure</> : <><Plus className="w-3 h-3" /> Connect</>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* SCIM */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> SCIM 2.0 Provisioning
            <Switch checked={scimEnabled} onCheckedChange={setScimEnabled} className="ml-auto" />
          </CardTitle>
        </CardHeader>
        {scimEnabled && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Users Provisioned", value: SCIM_CONFIG.usersProvisioned },
                { label: "Groups Synced", value: SCIM_CONFIG.groupsSynced },
                { label: "Auto-Provision", value: "On" },
                { label: "Auto-Deprovision", value: "On" },
              ].map(s => (
                <div key={s.label} className="p-2 bg-muted/40 rounded-lg text-center">
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">SCIM Endpoint</label>
              <div className="flex items-center gap-2">
                <Input value={SCIM_CONFIG.endpoint} readOnly className="h-8 text-xs font-mono bg-muted" />
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1 flex-shrink-0" onClick={() => navigator.clipboard.writeText(SCIM_CONFIG.endpoint)}>
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* JWT Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> JWT Token Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {JWT_SETTINGS.map(s => (
            <div key={s.label} className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-foreground bg-muted px-2 py-0.5 rounded">{s.value}</code>
                {s.editable && <Button variant="ghost" size="sm" className="h-6 text-xs">Edit</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Policies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Security Policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Require MFA for all users", desc: "TOTP, hardware key, or push notification required", state: mfaRequired, set: setMfaRequired },
            { label: "IP Allowlist enforcement", desc: "Only allow API calls from registered CIDR ranges", state: ipAllowlist, set: setIpAllowlist },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-xs font-medium">{p.label}</p>
                <p className="text-[10px] text-muted-foreground">{p.desc}</p>
              </div>
              <Switch checked={p.state} onCheckedChange={p.set} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* RBAC */}
      <div>
        <p className="text-sm font-semibold mb-1">Role-Based Access Control (RBAC)</p>
        <p className="text-xs text-muted-foreground mb-3">Built-in roles with granular permission scopes</p>
        <div className="space-y-2">
          {RBAC_ROLES.map(r => (
            <Card key={r.name}>
              <CardContent className="p-3 flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <code className="text-xs font-mono font-semibold">{r.name}</code>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-1.5">{r.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {r.perms.map(p => (
                      <Badge key={p} variant="outline" className="text-[9px] font-mono py-0">{p}</Badge>
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Settings className="w-3 h-3" /> Edit</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}