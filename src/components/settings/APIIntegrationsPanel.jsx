import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Zap, Settings, Eye, EyeOff, Copy } from "lucide-react";

const INTEGRATIONS = [
  {
    id: "docusign",
    name: "DocuSign",
    category: "eSignature",
    description: "Electronic signature for enrollment forms and documents",
    enabled: true,
    status: "connected",
    icon: "📄",
    credentials: { apiKey: "sk_live_••••••••••••" },
    lastUsed: "2026-03-22 10:30",
    stats: { sent: 142, signed: 138, pending: 4 }
  },
  {
    id: "gradientai",
    name: "GradientAI",
    category: "AI/ML",
    description: "Risk scoring and member health prediction for benefits optimization",
    enabled: true,
    status: "connected",
    icon: "🧠",
    credentials: { apiKey: "grad_••••••••••••" },
    lastUsed: "2026-03-22 09:15",
    stats: { analyzed: 256, riskTier: "standard" }
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Payments",
    description: "Payment collection, invoicing, and billing for employers",
    enabled: true,
    status: "connected",
    icon: "💳",
    credentials: { apiKey: "sk_live_••••••••••••" },
    lastUsed: "2026-03-21 14:45",
    stats: { volume: "$285k", transactions: 47 }
  },
  {
    id: "slack",
    name: "Slack",
    category: "Communication",
    description: "Send alerts and notifications to Slack channels",
    enabled: true,
    status: "connected",
    icon: "💬",
    credentials: { apiKey: "xoxb-••••••••••••" },
    lastUsed: "2026-03-22 11:00",
    stats: { messages: 1240, channels: 3 }
  },
  {
    id: "adp",
    name: "ADP Workforce Now",
    category: "HRIS",
    description: "Sync payroll deductions and employee census data",
    enabled: false,
    status: "available",
    icon: "🏢",
    credentials: null,
    lastUsed: null,
    stats: null
  },
  {
    id: "workday",
    name: "Workday HCM",
    category: "HRIS",
    description: "Full HR and benefits data integration",
    enabled: false,
    status: "available",
    icon: "📊",
    credentials: null,
    lastUsed: null,
    stats: null
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    category: "Analytics",
    description: "Track portal usage and enrollment funnel metrics",
    enabled: false,
    status: "available",
    icon: "📈",
    credentials: null,
    lastUsed: null,
    stats: null
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    category: "Email",
    description: "Transactional email delivery for notifications",
    enabled: false,
    status: "available",
    icon: "✉️",
    credentials: null,
    lastUsed: null,
    stats: null
  },
];

export default function APIIntegrationsPanel() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [expandedId, setExpandedId] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});

  const toggleIntegration = (id) => {
    setIntegrations(prev => prev.map(int =>
      int.id === id ? { ...int, enabled: !int.enabled } : int
    ));
  };

  const toggleSecretVisibility = (id) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [...new Set(integrations.map(i => i.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">API Integrations</p>
          <p className="text-xs text-muted-foreground">Enable/disable third-party integrations and manage credentials</p>
        </div>
        <Badge className="text-xs">{integrations.filter(i => i.enabled).length} active</Badge>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{cat}</p>
          <div className="space-y-2">
            {integrations.filter(i => i.category === cat).map(int => (
              <Card key={int.id} className={int.enabled ? "" : "opacity-60"}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    {/* Left side: icon, name, description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">{int.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{int.name}</p>
                            <Badge className={int.enabled
                              ? "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0"
                              : "bg-muted text-muted-foreground border text-[9px] py-0"}>
                              {int.enabled ? "Active" : "Inactive"}
                            </Badge>
                            {int.status === "connected" && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-[9px] py-0 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{int.description}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      {int.stats && int.enabled && (
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                          {Object.entries(int.stats).map(([k, v]) => (
                            <span key={k}><strong>{k}:</strong> {v}</span>
                          ))}
                        </div>
                      )}

                      {int.lastUsed && (
                        <p className="text-[10px] text-muted-foreground mt-1">Last used: {int.lastUsed}</p>
                      )}
                    </div>

                    {/* Right side: toggle & settings */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex flex-col items-end gap-2">
                        <Switch checked={int.enabled} onCheckedChange={() => toggleIntegration(int.id)} />
                        {int.enabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => setExpandedId(expandedId === int.id ? null : int.id)}
                          >
                            <Settings className="w-3 h-3" /> Config
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded config section */}
                  {expandedId === int.id && int.credentials && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      {Object.entries(int.credentials).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-xs font-medium mb-1.5 block capitalize">{key.replace(/_/g, " ")}</label>
                          <div className="flex gap-2">
                            <Input
                              type={showSecrets[key] ? "text" : "password"}
                              value={value}
                              readOnly
                              className="h-8 text-xs font-mono bg-muted"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 flex-shrink-0"
                              onClick={() => toggleSecretVisibility(key)}
                            >
                              {showSecrets[key] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 flex-shrink-0"
                              onClick={() => navigator.clipboard.writeText(value)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="text-xs h-7">Rotate Key</Button>
                        <Button variant="outline" size="sm" className="text-xs h-7">Disconnect</Button>
                        <Button variant="outline" size="sm" className="text-xs h-7">Test Connection</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}