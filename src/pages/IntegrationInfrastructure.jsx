import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/shared/PageHeader";

// --- Existing panels ---
import RetryMiddlewarePanel from "@/components/infra/RetryMiddlewarePanel";
import IdempotencyPanel from "@/components/infra/IdempotencyPanel";
import StructuredLoggerPanel from "@/components/infra/StructuredLoggerPanel";
import SecretsProviderPanel from "@/components/infra/SecretsProviderPanel";
import EndpointHealthPanel from "@/components/infra/EndpointHealthPanel";
import PayloadValidatorPanel from "@/components/infra/PayloadValidatorPanel";
import ApiReferencePanel from "@/components/infra/ApiReferencePanel";
import AuthGuidePanel from "@/components/infra/AuthGuidePanel";
import ApiKeysPanel from "@/components/infra/ApiKeysPanel";
import WebhooksPanel from "@/components/infra/WebhooksPanel";
import DataModelsPanel from "@/components/infra/DataModelsPanel";
import EventLogPanel from "@/components/infra/EventLogPanel";

// --- New enterprise panels ---
import AIIntegrationAssistant from "@/components/infra/AIIntegrationAssistant";
import RateLimitingPanel from "@/components/infra/RateLimitingPanel";
import OAuthSSOPanel from "@/components/infra/OAuthSSOPanel";
import SDKsAndLibrariesPanel from "@/components/infra/SDKsAndLibrariesPanel";
import GraphQLPanel from "@/components/infra/GraphQLPanel";
import DataTransformationPanel from "@/components/infra/DataTransformationPanel";
import APIPlaygroundPanel from "@/components/infra/APIPlaygroundPanel";
import APITesterPanel from "@/components/infra/APITesterPanel";
import WebhookTesterPanel from "@/components/infra/WebhookTesterPanel";
import IntegrationMarketplacePanel from "@/components/infra/IntegrationMarketplacePanel";
import ComplianceAuditPanel from "@/components/infra/ComplianceAuditPanel";

import { RefreshCw, Shield, Brain, Sparkles, Zap } from "lucide-react";

const TAB_GROUPS = [
  {
    label: "Developer",
    tabs: [
      { id: "playground", label: "Playground", shortLabel: "Playground" },
      { id: "reference", label: "API Reference", shortLabel: "API Ref" },
      { id: "graphql", label: "GraphQL", shortLabel: "GraphQL" },
      { id: "auth", label: "Authentication", shortLabel: "Auth" },
      { id: "keys", label: "API Keys", shortLabel: "API Keys" },
      { id: "sdks", label: "SDKs & Libraries", shortLabel: "SDKs" },
      { id: "webhooks", label: "Webhooks", shortLabel: "Webhooks" },
      { id: "events", label: "Event Log", shortLabel: "Event Log" },
      { id: "models", label: "Data Models", shortLabel: "Data Models" },
    ]
  },
  {
    label: "Integration",
    tabs: [
      { id: "marketplace", label: "Marketplace", shortLabel: "Marketplace" },
      { id: "transform", label: "Data Transform", shortLabel: "Transform" },
      { id: "sso", label: "OAuth / SSO", shortLabel: "SSO" },
    ]
  },
  {
    label: "Runtime / Ops",
    tabs: [
      { id: "health", label: "Endpoint Health", shortLabel: "Health" },
      { id: "ratelimit", label: "Rate Limiting", shortLabel: "Rate Limit" },
      { id: "retry", label: "Retry Middleware", shortLabel: "Retry" },
      { id: "idempotency", label: "Idempotency", shortLabel: "Idempotency" },
      { id: "logger", label: "Structured Logger", shortLabel: "Logger" },
      { id: "secrets", label: "Secrets Provider", shortLabel: "Secrets" },
      { id: "validators", label: "Payload Validators", shortLabel: "Validators" },
    ]
  },
  {
    label: "Compliance",
    tabs: [
      { id: "compliance", label: "Compliance & Audit", shortLabel: "Compliance" },
    ]
  },
  {
    label: "AI",
    ai: true,
    tabs: [
      { id: "ai", label: "AI Integration Assistant", shortLabel: "AI Assistant" },
    ]
  }
];

function OverallStatusBadge({ status }) {
  if (status === "healthy") return <Badge className="bg-green-100 text-green-700 border-green-200 border">All Systems Healthy</Badge>;
  if (status === "degraded") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 border">Degraded</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-200 border">Issues Detected</Badge>;
}

export default function IntegrationInfrastructure() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [overallStatus, setOverallStatus] = useState("healthy");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [tab, setTab] = useState("playground");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integration Infrastructure"
        description="Enterprise API platform · Production hardening · AI-assisted integrations"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <OverallStatusBadge status={overallStatus} />
            {/* Global AI toggle visible in header */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background">
              <Brain className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium">AI Assist</span>
              <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              {aiEnabled && <Sparkles className="w-3 h-3 text-primary" />}
            </div>
            <Button variant="outline" size="sm" onClick={() => setLastRefresh(new Date())}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
          </div>
        }
      />

      {/* AI Banner */}
      {aiEnabled && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-3 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-primary font-medium">
              AI Integration Assistant is active — visit the <strong>AI Assistant</strong> tab for code generation, data mapping, and integration help. AI features are also enabled in <strong>Data Transform</strong> and <strong>Marketplace</strong> tabs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stack diagram */}
      <StackDiagram activeTab={tab} onNavigate={(t) => {
        // find the tab element and click it via state
        setTab(t);
      }} />

      <Tabs value={tab} onValueChange={setTab}>
        {TAB_GROUPS.map(group => (
          <div key={group.label} className="mb-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
              {group.label}
              {group.ai && aiEnabled && <Badge className="text-[8px] bg-primary/20 text-primary border-primary/30 border py-0 px-1">Enabled</Badge>}
              {group.ai && !aiEnabled && <Badge className="text-[8px] bg-muted text-muted-foreground border py-0 px-1">Admin Toggle</Badge>}
            </p>
            <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 mb-2">
              {group.tabs.map(t => (
                <TabsTrigger key={t.id} value={t.id} className="text-xs" onClick={() => setTab(t.id)}>
                  {t.shortLabel}
                  {t.id === "ai" && aiEnabled && <Sparkles className="w-2.5 h-2.5 ml-1 text-primary" />}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        ))}

        {/* Developer */}
        <TabsContent value="playground" className="mt-4"><APIPlaygroundPanel /></TabsContent>
        <TabsContent value="reference" className="mt-4"><ApiReferencePanel /></TabsContent>
        <TabsContent value="graphql" className="mt-4"><GraphQLPanel /></TabsContent>
        <TabsContent value="auth" className="mt-4"><AuthGuidePanel /></TabsContent>
        <TabsContent value="keys" className="mt-4"><ApiKeysPanel /></TabsContent>
        <TabsContent value="sdks" className="mt-4"><SDKsAndLibrariesPanel /></TabsContent>
        <TabsContent value="webhooks" className="mt-4"><WebhooksPanel /></TabsContent>
        <TabsContent value="events" className="mt-4"><EventLogPanel /></TabsContent>
        <TabsContent value="models" className="mt-4"><DataModelsPanel /></TabsContent>

        {/* Integration */}
        <TabsContent value="marketplace" className="mt-4"><IntegrationMarketplacePanel aiEnabled={aiEnabled} /></TabsContent>
        <TabsContent value="transform" className="mt-4"><DataTransformationPanel aiEnabled={aiEnabled} /></TabsContent>
        <TabsContent value="sso" className="mt-4"><OAuthSSOPanel /></TabsContent>

        {/* Runtime / Ops */}
        <TabsContent value="health" className="mt-4">
          <EndpointHealthPanel lastRefresh={lastRefresh} onStatusChange={setOverallStatus} />
        </TabsContent>
        <TabsContent value="ratelimit" className="mt-4"><RateLimitingPanel /></TabsContent>
        <TabsContent value="retry" className="mt-4"><RetryMiddlewarePanel /></TabsContent>
        <TabsContent value="idempotency" className="mt-4"><IdempotencyPanel /></TabsContent>
        <TabsContent value="logger" className="mt-4"><StructuredLoggerPanel /></TabsContent>
        <TabsContent value="secrets" className="mt-4"><SecretsProviderPanel /></TabsContent>
        <TabsContent value="validators" className="mt-4"><PayloadValidatorPanel /></TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="mt-4"><ComplianceAuditPanel /></TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="mt-4">
          <AIIntegrationAssistant aiEnabled={aiEnabled} onToggleAI={setAiEnabled} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Maps each stack layer to which tab(s) it corresponds to
const LAYER_TAB_MAP = [
  { label: "Base44 UI + API Playground", sub: "React frontend · GraphQL IDE · Interactive REST client", color: "bg-primary/10 border-primary/30 text-primary", tab: "playground", tabs: ["playground", "graphql", "reference", "sdks"] },
  { label: "CQ360 REST + GraphQL APIs", sub: "Cases · Census · Quotes · Proposals · Enrollment · Renewal · Webhooks", color: "bg-accent/10 border-accent/30 text-accent-foreground", tab: "reference", tabs: ["reference", "graphql", "webhooks", "models", "events"] },
  { label: "Hardening Middleware", sub: "Retry · Idempotency · Rate Limiting · Validation · Structured Logging · Secrets", color: "bg-amber-50 border-amber-200 text-amber-800", tab: "retry", tabs: ["retry", "idempotency", "ratelimit", "validators", "logger", "secrets"] },
  { label: "Integration & Transformation Layer", sub: "AI ETL Engine · Field Mapper · Schema Validator · Marketplace Connectors", color: "bg-violet-50 border-violet-200 text-violet-800", tab: "transform", tabs: ["transform", "marketplace", "ai"] },
  { label: "Auth & Compliance", sub: "OAuth 2.0 · OIDC SSO · SCIM · RBAC · HIPAA · SOC 2 · Audit Trail", color: "bg-rose-50 border-rose-200 text-rose-800", tab: "sso", tabs: ["sso", "auth", "keys", "compliance"] },
  { label: "Adapter Layer", sub: "ADP · Workday · DocuSign · Aetna · BCBS · Stripe · BambooHR · Slack", color: "bg-purple-50 border-purple-200 text-purple-800", tab: "marketplace", tabs: ["marketplace"] },
  { label: "PostgreSQL Repositories", sub: "Audit · Census · Quote · Proposal · Enrollment · Install · Renewal", color: "bg-slate-100 border-slate-300 text-slate-700", tab: "models", tabs: ["models", "events", "health"] },
];

function StackDiagram({ activeTab, onNavigate }) {
  const activeLayerIndex = LAYER_TAB_MAP.findIndex(l => l.tabs.includes(activeTab));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          CQ360 Enterprise API Stack
          <span className="text-[10px] font-normal text-muted-foreground ml-1">— click a layer to navigate</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-0">
          {LAYER_TAB_MAP.map((layer, i) => {
            const isActive = i === activeLayerIndex;
            return (
              <React.Fragment key={layer.label}>
                <button
                  onClick={() => onNavigate(layer.tab)}
                  className={`w-full max-w-2xl border rounded-lg px-4 py-2.5 text-center transition-all hover:scale-[1.01] hover:shadow-md
                    ${layer.color}
                    ${isActive ? "ring-2 ring-primary ring-offset-1 shadow-sm scale-[1.01]" : "opacity-80 hover:opacity-100"}`}
                >
                  <p className="text-xs font-semibold">{layer.label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{layer.sub}</p>
                  {isActive && (
                    <Badge className="mt-1 text-[9px] bg-primary/20 text-primary border-primary/40 border py-0">← You are here</Badge>
                  )}
                </button>
                {i < LAYER_TAB_MAP.length - 1 && <div className="w-px h-3 bg-border" />}
              </React.Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}