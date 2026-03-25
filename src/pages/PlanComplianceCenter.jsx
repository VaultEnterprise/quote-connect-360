import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";

const ACA_TIERS = {
  bronze: { label: "Bronze", min: 58, max: 62, color: "bg-amber-100 text-amber-800" },
  silver: { label: "Silver", min: 68, max: 72, color: "bg-gray-100 text-gray-700" },
  gold: { label: "Gold", min: 78, max: 82, color: "bg-yellow-100 text-yellow-800" },
  platinum: { label: "Platinum", min: 88, max: 92, color: "bg-blue-100 text-blue-700" },
};

const REQUIRED_COMPLIANCE_FIELDS = {
  deductible_individual: "Individual Deductible",
  oop_max_individual: "Individual OOP Max",
  copay_pcp: "PCP Copay",
  plan_type: "Plan Type",
  network_type: "Network Type",
  carrier: "Carrier",
};

const PREVENTIVE_REQUIRED = ["no_copay_preventive", "copay_pcp"];

function checkACACompliance(plan) {
  const issues = [];
  if (!plan.plan_type || !["medical"].includes(plan.plan_type)) return [];
  // Check OOP max caps (ACA 2024 individual: $9,450; family: $18,900)
  if (plan.oop_max_individual && plan.oop_max_individual > 9450) issues.push("OOP max exceeds ACA limit of $9,450 (individual)");
  if (plan.oop_max_family && plan.oop_max_family > 18900) issues.push("OOP max exceeds ACA limit of $18,900 (family)");
  // Check HSA eligibility for HDHP
  if (plan.network_type === "HDHP" && !plan.hsa_eligible) issues.push("HDHP plans should be HSA-eligible");
  // HDHP min deductible 2024: $1,600 individual
  if (plan.network_type === "HDHP" && plan.deductible_individual && plan.deductible_individual < 1600) issues.push("HDHP deductible below IRS minimum ($1,600)");
  return issues;
}

function checkDataCompleteness(plan) {
  return Object.entries(REQUIRED_COMPLIANCE_FIELDS).filter(([key]) => !plan[key] && plan[key] !== 0).map(([, label]) => label);
}

export default function PlanComplianceCenter() {
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.filter({ status: "active" }),
  });

  const medicalPlans = plans.filter(p => p.plan_type === "medical");

  const complianceData = useMemo(() => medicalPlans.map(p => ({
    ...p,
    acaIssues: checkACACompliance(p),
    missingFields: checkDataCompleteness(p),
    isCompliant: checkACACompliance(p).length === 0 && checkDataCompleteness(p).length === 0,
  })), [medicalPlans]);

  const compliantCount = complianceData.filter(p => p.isCompliant).length;
  const issueCount = complianceData.filter(p => !p.isCompliant).length;
  const acaIssueCount = complianceData.filter(p => p.acaIssues.length > 0).length;
  const missingCount = complianceData.filter(p => p.missingFields.length > 0).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <Link to="/plans" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 mb-1">
          <ArrowLeft className="w-4 h-4" /> Plan Library
        </Link>
        <h1 className="text-2xl font-bold">Compliance Center</h1>
        <p className="text-muted-foreground text-sm">ACA validation, data completeness, and regulatory compliance tracking</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Compliant Plans", value: compliantCount, icon: CheckCircle, color: "text-green-600" },
          { label: "Issues Found", value: issueCount, icon: AlertTriangle, color: issueCount > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "ACA Violations", value: acaIssueCount, icon: ShieldCheck, color: acaIssueCount > 0 ? "text-amber-600" : "text-muted-foreground" },
          { label: "Missing Data", value: missingCount, icon: Info, color: missingCount > 0 ? "text-orange-600" : "text-muted-foreground" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
              <div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="aca">
        <TabsList>
          <TabsTrigger value="aca">ACA Validation</TabsTrigger>
          <TabsTrigger value="completeness">Data Completeness</TabsTrigger>
          <TabsTrigger value="tiers">Metal Tier Review</TabsTrigger>
        </TabsList>

        <TabsContent value="aca" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">ACA 2026 compliance checks: OOP maximums, HDHP rules, preventive care coverage.</p>
          {isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-16 rounded bg-muted animate-pulse" />)}</div>
          ) : complianceData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No medical plans to validate.</p>
          ) : (
            <div className="space-y-2">
              {complianceData.map(p => (
                <div key={p.id} className={`p-3 rounded-lg border flex items-start gap-3 ${p.acaIssues.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                  {p.acaIssues.length > 0 ? <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.plan_name} — {p.carrier}</p>
                    {p.acaIssues.length > 0 ? (
                      <ul className="mt-1 space-y-0.5">
                        {p.acaIssues.map((issue, i) => <li key={i} className="text-xs text-red-700">• {issue}</li>)}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-700">No ACA violations detected</p>
                    )}
                  </div>
                  <Badge className={p.acaIssues.length > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{p.acaIssues.length > 0 ? `${p.acaIssues.length} Issue(s)` : "Compliant"}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completeness" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Required fields validation — plans missing critical data cannot be published or quoted.</p>
          {complianceData.map(p => (
            <div key={p.id} className={`p-3 rounded-lg border ${p.missingFields.length > 0 ? "border-amber-200" : "border-green-200"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">{p.plan_name}</span>
                <span className="text-xs text-muted-foreground">— {p.carrier}</span>
                <div className="ml-auto">
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(((Object.keys(REQUIRED_COMPLIANCE_FIELDS).length - p.missingFields.length) / Object.keys(REQUIRED_COMPLIANCE_FIELDS).length) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium">{Math.round(((Object.keys(REQUIRED_COMPLIANCE_FIELDS).length - p.missingFields.length) / Object.keys(REQUIRED_COMPLIANCE_FIELDS).length) * 100)}%</span>
                  </div>
                </div>
              </div>
              {p.missingFields.length > 0 && (
                <p className="text-xs text-amber-700">Missing: {p.missingFields.join(", ")}</p>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="tiers" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">ACA metal tier assignments for medical plans (Bronze/Silver/Gold/Platinum).</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(ACA_TIERS).map(([tier, cfg]) => {
              const tierPlans = medicalPlans.filter(p => p.notes?.toLowerCase().includes(tier) || p.plan_name?.toLowerCase().includes(tier));
              return (
                <Card key={tier}>
                  <CardContent className="p-3 text-center">
                    <Badge className={`${cfg.color} mb-2`}>{cfg.label}</Badge>
                    <p className="text-xs text-muted-foreground">Actuarial Value</p>
                    <p className="text-sm font-bold">{cfg.min}–{cfg.max}%</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="space-y-2">
            {medicalPlans.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded border text-sm">
                <span className="font-medium flex-1 truncate">{p.plan_name}</span>
                <span className="text-xs text-muted-foreground">{p.carrier}</span>
                <Badge variant="outline" className="text-xs">{p.network_type || "—"}</Badge>
                {p.deductible_individual ? (
                  <span className="text-xs text-muted-foreground">Ded: ${p.deductible_individual.toLocaleString()}</span>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 text-xs">Missing Deductible</Badge>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}