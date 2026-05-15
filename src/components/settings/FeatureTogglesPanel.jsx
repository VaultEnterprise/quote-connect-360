import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Lightbulb, Zap, TestTube } from "lucide-react";

const FEATURES = [
  {
    group: "Core Features",
    items: [
      { id: "enrollment", name: "Employee Enrollment", desc: "Self-service benefits enrollment portal", enabled: true, beta: false },
      { id: "proposals", name: "Proposal Builder", desc: "Create and send benefit proposals to employers", enabled: true, beta: false },
      { id: "census", name: "Census Management", desc: "Upload and validate employee census data", enabled: true, beta: false },
      { id: "quotes", name: "Quote Engine", desc: "Run benefit quotes with multiple scenarios", enabled: true, beta: false },
    ]
  },
  {
    group: "AI & Analytics",
    items: [
      { id: "gradient_ai", name: "GradientAI Risk Scoring", desc: "ML-powered member risk assessment and health predictions", enabled: true, beta: false },
      { id: "ai_triage", name: "AI Exception Triage", desc: "Automatic exception analysis and recommended actions", enabled: true, beta: true },
      { id: "ai_assistant", name: "AI Integration Assistant", desc: "ChatGPT-powered help for API integrations and data mapping", enabled: false, beta: true },
      { id: "predictive_analytics", name: "Predictive Analytics", desc: "Forecast claim costs and enrollment patterns", enabled: false, beta: true },
    ]
  },
  {
    group: "Document & eSignature",
    items: [
      { id: "docusign", name: "DocuSign Integration", desc: "Electronic signatures for enrollment and approvals", enabled: true, beta: false },
      { id: "document_mgmt", name: "Document Management", desc: "Store, organize, and retrieve policy documents", enabled: true, beta: false },
      { id: "embedded_signing", name: "Embedded Signing", desc: "Sign documents without leaving the portal", enabled: true, beta: false },
    ]
  },
  {
    group: "Advanced",
    items: [
      { id: "webhooks", name: "Custom Webhooks", desc: "Send real-time events to external systems", enabled: true, beta: false },
      { id: "api_access", name: "REST API Access", desc: "Programmatic access to all platform data", enabled: true, beta: false },
      { id: "graphql", name: "GraphQL API", desc: "Query and mutate data with flexible GraphQL interface", enabled: false, beta: true },
      { id: "policy_match", name: "PolicyMatch AI", desc: "Intelligent plan recommendations based on risk profiles", enabled: false, beta: true },
    ]
  },
];

export default function FeatureTogglesPanel() {
  const [features, setFeatures] = useState(FEATURES);

  const toggleFeature = (groupIdx, itemIdx) => {
    setFeatures(prev => {
      const newFeatures = [...prev];
      newFeatures[groupIdx] = {
        ...newFeatures[groupIdx],
        items: newFeatures[groupIdx].items.map((item, i) =>
          i === itemIdx ? { ...item, enabled: !item.enabled } : item
        )
      };
      return newFeatures;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold">Feature Toggles</p>
        <p className="text-xs text-muted-foreground">Enable/disable features for your organization. Changes apply immediately.</p>
      </div>

      {features.map((group, groupIdx) => (
        <div key={group.group}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{group.group}</p>
          <div className="space-y-2">
            {group.items.map((item, itemIdx) => (
              <Card key={item.id} className={item.enabled ? "" : "opacity-50"}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.beta && <Badge className="text-[8px] bg-amber-100 text-amber-700 border-amber-200 border py-0">Beta</Badge>}
                      {item.enabled && <Badge className="text-[8px] bg-green-100 text-green-700 border-green-200 border py-0">Active</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={() => toggleFeature(groupIdx, itemIdx)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Beta Features</p>
            <p>Beta features are under active development and may change. Use in production at your own risk.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}