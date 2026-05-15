import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const DEFAULT_PROVIDERS = [
  { provider_code: "AST", provider_name: "AST" },
  { provider_code: "SUS", provider_name: "SUS" },
  { provider_code: "BENEFITTER", provider_name: "Benefitter" },
  { provider_code: "MEC_MVP", provider_name: "MEC/MVP" },
  { provider_code: "TRIAD", provider_name: "Triad" },
];

export default function QuoteProviderRoutingPanel() {
  const queryClient = useQueryClient();
  const [customProviderName, setCustomProviderName] = React.useState("");
  const [customProviderEmail, setCustomProviderEmail] = React.useState("");
  const { data: routes = [] } = useQuery({
    queryKey: ["quote-provider-routes"],
    queryFn: () => base44.entities.QuoteProviderRoute.list("provider_code", 50),
  });

  const saveMutation = useMutation({
    mutationFn: async (route) => {
      if (route.id) {
        return base44.entities.QuoteProviderRoute.update(route.id, route);
      }
      return base44.entities.QuoteProviderRoute.create(route);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quote-provider-routes"] }),
  });

  const mergedRoutes = [
    ...DEFAULT_PROVIDERS.map((provider) => routes.find((route) => route.provider_code === provider.provider_code) || {
      ...provider,
      destination_email: "",
      active: false,
      default_cc: "",
      subject_template: "",
      body_template: "",
      is_custom: false,
    }),
    ...routes.filter((route) => route.is_custom),
  ];

  const addCustomProvider = () => {
    if (!customProviderName || !customProviderEmail) return;
    const providerCode = `OTHER_${customProviderName.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
    saveMutation.mutate({
      provider_code: providerCode,
      provider_name: customProviderName,
      destination_email: customProviderEmail,
      active: true,
      default_cc: "",
      subject_template: "",
      body_template: "",
      is_custom: true,
    });
    setCustomProviderName("");
    setCustomProviderEmail("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quote Provider Routing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border p-4 space-y-3">
          <p className="font-medium">Add Other Carrier</p>
          <div className="grid gap-3 md:grid-cols-[1fr,1fr,auto]">
            <div>
              <Label>Carrier Name</Label>
              <Input value={customProviderName} onChange={(e) => setCustomProviderName(e.target.value)} placeholder="Carrier name" />
            </div>
            <div>
              <Label>Destination Email</Label>
              <Input value={customProviderEmail} onChange={(e) => setCustomProviderEmail(e.target.value)} placeholder="carrier@example.com" />
            </div>
            <div className="flex items-end">
              <Button onClick={addCustomProvider}>Add Carrier</Button>
            </div>
          </div>
        </div>
        {mergedRoutes.map((route) => (
          <div key={route.provider_code} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{route.provider_name}</p>
                <p className="text-xs text-muted-foreground">{route.provider_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Active</span>
                <Switch
                  checked={!!route.active}
                  onCheckedChange={(checked) => saveMutation.mutate({ ...route, active: checked })}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Destination Email</Label>
                <Input defaultValue={route.destination_email || ""} onBlur={(e) => saveMutation.mutate({ ...route, destination_email: e.target.value })} />
              </div>
              <div>
                <Label>Default CC</Label>
                <Input defaultValue={route.default_cc || ""} onBlur={(e) => saveMutation.mutate({ ...route, default_cc: e.target.value })} />
              </div>
              <div>
                <Label>Subject Template</Label>
                <Input defaultValue={route.subject_template || ""} onBlur={(e) => saveMutation.mutate({ ...route, subject_template: e.target.value })} />
              </div>
              <div>
                <Label>Body Template</Label>
                <Input defaultValue={route.body_template || ""} onBlur={(e) => saveMutation.mutate({ ...route, body_template: e.target.value })} />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => saveMutation.mutate({ ...route })}>Save {route.provider_name}</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}