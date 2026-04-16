import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Database, ShieldCheck, Users, Workflow } from "lucide-react";

export default function CensusSystemSummary({ versions, members, cases }) {
  const validatedVersions = versions.filter((version) => version.status === "validated");
  const issueVersions = versions.filter((version) => version.status === "has_issues");
  const latestVersion = [...versions].sort((a, b) => Number(b.version_number || 0) - Number(a.version_number || 0))[0];
  const latestMembers = latestVersion ? members.filter((member) => member.census_version_id === latestVersion.id) : [];
  const eligibleMembers = latestMembers.filter((member) => member.is_eligible !== false);
  const activeCases = cases.filter((item) => !["closed", "renewed"].includes(item.stage));

  const items = [
    { label: "Validated versions", value: validatedVersions.length, icon: ShieldCheck },
    { label: "Issue versions", value: issueVersions.length, icon: Database },
    { label: "Latest eligible", value: eligibleMembers.length, icon: Users },
    { label: "Active case consumers", value: activeCases.length, icon: Workflow },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-border/70 bg-card/80 shadow-sm">
            <CardContent className="p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
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