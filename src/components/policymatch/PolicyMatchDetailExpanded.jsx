import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PolicyMatchRiskBreakdown from "./PolicyMatchRiskBreakdown";
import PolicyMatchRecommendationEngine from "./PolicyMatchRecommendationEngine";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function PolicyMatchDetailExpanded({ result }) {
  const enhancementData = (result.enhancements || []).map(e => ({
    name: e.plan_type,
    cost: e.cost_delta_pmpm || 0,
    value: e.value_gain ? 50 : 25 // placeholder scoring
  }));

  const riskFactorData = (result.risk_factors || [])
    .slice(0, 8)
    .map(f => ({
      name: f.factor.slice(0, 15),
      weight: (f.weight || 0.5) * 100
    }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Expanded Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="risks" className="space-y-3">
          <TabsList className="grid grid-cols-3 w-full text-xs h-8">
            <TabsTrigger value="risks">Risk Factors</TabsTrigger>
            <TabsTrigger value="enhancements">Enhancements</TabsTrigger>
            <TabsTrigger value="script">Talking Points</TabsTrigger>
          </TabsList>

          {/* Risk Factors */}
          <TabsContent value="risks">
            <PolicyMatchRiskBreakdown result={result} />
            {riskFactorData.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold text-muted-foreground mb-2">Factor Weight Distribution</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={riskFactorData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="weight" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Enhancements */}
          <TabsContent value="enhancements">
            {result.enhancements && result.enhancements.length > 0 ? (
              <div className="space-y-2">
                {result.enhancements.map((e, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-xs font-semibold">{e.plan_name}</p>
                        <Badge className="text-[9px] py-0 mt-1">{e.plan_type}</Badge>
                      </div>
                      <span className={`text-xs font-bold ${(e.cost_delta_pmpm || 0) <= 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {e.cost_delta_pmpm ? `${e.cost_delta_pmpm > 0 ? "+" : ""}$${e.cost_delta_pmpm.toFixed(2)}/mo` : ""}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{e.value_gain}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground p-3 text-center">No ancillary enhancements for this optimization.</p>
            )}
          </TabsContent>

          {/* Talking Points */}
          <TabsContent value="script">
            <PolicyMatchRecommendationEngine result={result} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}