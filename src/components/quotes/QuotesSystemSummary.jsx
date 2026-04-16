import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calculator, Users, ArrowRightLeft } from "lucide-react";

export default function QuotesSystemSummary({ scenarios, cases, enrollments, renewals }) {
  const completedScenarios = scenarios.filter((item) => item.status === "completed");
  const draftScenarios = scenarios.filter((item) => item.status === "draft");
  const quoteReadyCases = cases.filter((item) => ["ready_for_quote", "quoting"].includes(item.stage));
  const openEnrollments = enrollments.filter((item) => ["open", "closing_soon"].includes(item.status));
  const activeRenewals = renewals.filter((item) => item.status !== "completed");

  const items = [
    {
      label: "Quote-ready cases",
      value: quoteReadyCases.length,
      note: "Cases actively feeding the pricing engine",
      icon: Building2,
    },
    {
      label: "Calculated scenarios",
      value: completedScenarios.length,
      note: "Completed pricing outputs available downstream",
      icon: Calculator,
    },
    {
      label: "Enrollment consumers",
      value: openEnrollments.length,
      note: "Open enrollment windows relying on quote decisions",
      icon: Users,
    },
    {
      label: "Renewal consumers",
      value: activeRenewals.length,
      note: "Renewal cycles depending on pricing comparisons",
      icon: ArrowRightLeft,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-border/70 bg-card/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{item.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.note}</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              {item.label === "Calculated scenarios" && draftScenarios.length > 0 && (
                <Badge variant="outline" className="mt-4 text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                  {draftScenarios.length} still pending calculation
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}