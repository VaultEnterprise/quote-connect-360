import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, Users, Workflow } from "lucide-react";

export default function EmployerControlSummary({ controlPlane }) {
  if (!controlPlane) return null;

  const items = [
    { label: "Eligible members", value: controlPlane.metrics.eligibleMembers, icon: Users },
    { label: "Invalid census rows", value: controlPlane.metrics.invalidMembers, icon: ShieldCheck },
    { label: "Active workflows", value: controlPlane.metrics.activeCases, icon: Workflow },
    { label: "Pending proposals", value: controlPlane.metrics.pendingProposals, icon: Building2 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-border/70 shadow-sm">
            <CardContent className="p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
                {item.label === "Invalid census rows" && item.value > 0 && (
                  <Badge variant="outline" className="mt-3 border-amber-200 text-amber-700 bg-amber-50">Needs remediation</Badge>
                )}
              </div>
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}