import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Eye, DollarSign, FileText, X } from "lucide-react";

/**
 * PlanDetailView
 * Rich modal view for plan details — full policy info, cost breakdown, coverage limits, etc.
 *
 * Props:
 *   plan — BenefitPlan
 *   monthlyCost — number (employee's monthly cost)
 *   onClose — () => void
 *   onSelect — (plan) => void
 */
export default function PlanDetailView({ plan, monthlyCost, onClose, onSelect }) {
  if (!plan) return null;

  const PLAN_TYPE_INFO = {
    medical: { icon: Heart, label: "Medical", color: "text-blue-600" },
    dental: { icon: Shield, label: "Dental", color: "text-emerald-600" },
    vision: { icon: Eye, label: "Vision", color: "text-purple-600" },
  };

  const info = PLAN_TYPE_INFO[plan.plan_type] || { icon: Heart, label: plan.plan_type };
  const Icon = info.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-h-[90vh] sm:max-w-3xl mt-8 sm:mt-0">
        <CardHeader className="flex flex-row items-start justify-between border-b sticky top-0 bg-background">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${info.color}`} />
              <CardTitle>{plan.plan_name}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">{plan.carrier}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Cost summary */}
          {monthlyCost !== undefined && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-baseline gap-1">
                <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-2xl font-bold text-primary">${monthlyCost.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/month (your cost)</span>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {plan.network_type && (
              <Badge variant="outline">{plan.network_type}</Badge>
            )}
            {plan.hsa_eligible && (
              <Badge className="bg-green-100 text-green-700">HSA Eligible</Badge>
            )}
            {plan.status === "active" && (
              <Badge className="bg-blue-100 text-blue-700">Active</Badge>
            )}
          </div>

          {/* Tabs for medical */}
          {plan.plan_type === "medical" && (
            <Tabs defaultValue="cost" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cost">Cost</TabsTrigger>
                <TabsTrigger value="coverage">Coverage</TabsTrigger>
                <TabsTrigger value="rx">Rx</TabsTrigger>
              </TabsList>

              {/* Cost tab */}
              <TabsContent value="cost" className="space-y-3 mt-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Deductibles</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {plan.deductible_individual !== undefined && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Individual</p>
                        <p className="text-lg font-bold mt-1">${plan.deductible_individual.toLocaleString()}</p>
                      </div>
                    )}
                    {plan.deductible_family !== undefined && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Family</p>
                        <p className="text-lg font-bold mt-1">${plan.deductible_family.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Out-of-Pocket Limits</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {plan.oop_max_individual !== undefined && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Individual</p>
                        <p className="text-lg font-bold mt-1">${plan.oop_max_individual.toLocaleString()}</p>
                      </div>
                    )}
                    {plan.oop_max_family !== undefined && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs text-muted-foreground">Family</p>
                        <p className="text-lg font-bold mt-1">${plan.oop_max_family.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Coinsurance</h3>
                  {plan.coinsurance !== undefined ? (
                    <div className="p-3 rounded-lg bg-muted space-y-2">
                      <p className="text-sm text-muted-foreground">Plan pays after deductible</p>
                      <div className="flex items-center gap-3">
                        <Progress value={plan.coinsurance} className="flex-1" />
                        <span className="text-sm font-bold">{plan.coinsurance}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not available</p>
                  )}
                </div>
              </TabsContent>

              {/* Coverage tab */}
              <TabsContent value="coverage" className="space-y-3 mt-4">
                <div className="grid gap-2">
                  {plan.copay_pcp !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <span className="text-sm">PCP Visit Copay</span>
                      <span className="font-bold">${plan.copay_pcp}</span>
                    </div>
                  )}
                  {plan.copay_specialist !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <span className="text-sm">Specialist Visit Copay</span>
                      <span className="font-bold">${plan.copay_specialist}</span>
                    </div>
                  )}
                  {plan.copay_er !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <span className="text-sm">Emergency Room Copay</span>
                      <span className="font-bold">${plan.copay_er}</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Rx tab */}
              <TabsContent value="rx" className="space-y-3 mt-4">
                <p className="text-sm text-muted-foreground mb-3">Prescription copays per fill</p>
                <div className="grid gap-2">
                  {plan.rx_tier1 !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <span className="text-sm">Generic</span>
                      <span className="font-bold">${plan.rx_tier1}</span>
                    </div>
                  )}
                  {plan.rx_tier2 !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <span className="text-sm">Brand Name</span>
                      <span className="font-bold">${plan.rx_tier2}</span>
                    </div>
                  )}
                  {plan.rx_tier3 !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <span className="text-sm">Specialty</span>
                      <span className="font-bold">${plan.rx_tier3}</span>
                    </div>
                  )}
                  {plan.rx_tier4 !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                      <span className="text-sm">High-cost</span>
                      <span className="font-bold">${plan.rx_tier4}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Resources */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">RESOURCES</p>
            <div className="grid gap-2">
              <Button variant="outline" size="sm" className="justify-start gap-2 h-auto py-2">
                <FileText className="w-4 h-4" />
                <div className="text-left text-xs">
                  <p className="font-medium">Summary of Benefits & Coverage</p>
                  <p className="text-muted-foreground">PDF</p>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 flex gap-2 sticky bottom-0 bg-background">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button className="flex-1" onClick={() => { onSelect(plan); onClose(); }}>
            Select This Plan
          </Button>
        </div>
      </Card>
    </div>
  );
}