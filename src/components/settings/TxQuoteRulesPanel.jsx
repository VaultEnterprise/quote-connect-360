import React from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const DEFAULT_RULES = [
  { destination_code: "GLOBAL", rule_code: "claims_required_over_enrolled_count", rule_name: "Claims threshold", rule_type: "threshold", rule_config: { threshold: 50 }, is_active: true },
  { destination_code: "GLOBAL", rule_code: "minimum_participation_percent", rule_name: "Minimum participation", rule_type: "threshold", rule_config: { minimum: 25 }, is_active: true },
  { destination_code: "GLOBAL", rule_code: "minimum_employer_contribution_percent", rule_name: "Minimum employer contribution", rule_type: "threshold", rule_config: { minimum: 50 }, is_active: true },
  { destination_code: "TRIAD", rule_code: "require_current_bill", rule_name: "Require current bill", rule_type: "document", rule_config: { required: true }, is_active: true },
  { destination_code: "SUS", rule_code: "require_renewal_offer", rule_name: "Require renewal offer", rule_type: "document", rule_config: { required: true }, is_active: true },
  { destination_code: "AST", rule_code: "require_large_claimant_report", rule_name: "Require large claimant report", rule_type: "document", rule_config: { required: false }, is_active: true },
];

export default function TxQuoteRulesPanel() {
  const queryClient = useQueryClient();
  const { data: rules = [] } = useQuery({
    queryKey: ["txquote-destination-rules"],
    queryFn: () => base44.entities.TxQuoteDestinationRule.list("rule_code", 100),
  });

  const saveMutation = useMutation({
    mutationFn: async (rule) => {
      if (rule.id) return base44.entities.TxQuoteDestinationRule.update(rule.id, rule);
      return base44.entities.TxQuoteDestinationRule.create(rule);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["txquote-destination-rules"] }),
  });

  const mergedRules = DEFAULT_RULES.map((defaultRule) => rules.find((rule) => rule.rule_code === defaultRule.rule_code && rule.destination_code === defaultRule.destination_code) || defaultRule);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TxQuote Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mergedRules.map((rule) => (
          <div key={`${rule.destination_code}-${rule.rule_code}`} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{rule.rule_name}</p>
                <p className="text-xs text-muted-foreground">{rule.destination_code} • {rule.rule_code}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Active</span>
                <Switch checked={!!rule.is_active} onCheckedChange={(checked) => saveMutation.mutate({ ...rule, is_active: checked })} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {rule.rule_config?.threshold !== undefined && (
                <div>
                  <Label>Threshold</Label>
                  <Input type="number" defaultValue={rule.rule_config.threshold} onBlur={(e) => saveMutation.mutate({ ...rule, rule_config: { ...rule.rule_config, threshold: Number(e.target.value || 0) } })} />
                </div>
              )}
              {rule.rule_config?.minimum !== undefined && (
                <div>
                  <Label>Minimum</Label>
                  <Input type="number" defaultValue={rule.rule_config.minimum} onBlur={(e) => saveMutation.mutate({ ...rule, rule_config: { ...rule.rule_config, minimum: Number(e.target.value || 0) } })} />
                </div>
              )}
              {rule.rule_config?.required !== undefined && (
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={!!rule.rule_config.required} onCheckedChange={(checked) => saveMutation.mutate({ ...rule, rule_config: { ...rule.rule_config, required: checked } })} />
                  <Label>Required</Label>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => saveMutation.mutate({ ...rule })}>Save Rule</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}