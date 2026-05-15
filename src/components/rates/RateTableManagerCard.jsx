import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RateTableEditor from "@/components/plans/RateTableEditor";
import { summarizeRatePlan } from "@/components/rates/rateGovernanceEngine";
import VersionTimeline from "@/components/shared/VersionTimeline";

export default function RateTableManagerCard({ plan, rateTables = [] }) {
  const summary = summarizeRatePlan(plan, rateTables);
  const latestRate = summary.latest;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{plan.plan_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {plan.carrier}{plan.plan_code ? ` · ${plan.plan_code}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Badge variant="secondary" className="capitalize">{plan.plan_type}</Badge>
            {plan.network_type ? <Badge variant="outline">{plan.network_type}</Badge> : null}
            {latestRate ? <Badge variant="outline">{latestRate.rate_type === "age_banded" ? "Age Banded" : "Composite"}</Badge> : <Badge variant="outline">No Rates</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">State</p>
            <p className="font-medium">{plan.state || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Effective</p>
            <p className="font-medium">{latestRate?.effective_date || plan.effective_date || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">EE Rate</p>
            <p className="font-medium">{latestRate?.ee_rate != null ? `$${latestRate.ee_rate}` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Family Rate</p>
            <p className="font-medium">{latestRate?.fam_rate != null ? `$${latestRate.fam_rate}` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Versions</p>
            <p className="font-medium">{summary.versionCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Future</p>
            <p className="font-medium">{summary.futureCount}</p>
          </div>
        </div>
        <RateTableEditor planId={plan.id} rateTables={rateTables} />
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-3">Rate Version History</p>
          <VersionTimeline
            items={rateTables.map((table) => ({
              id: table.id,
              timestamp: table.updated_date || table.created_date,
              status: table.rate_type,
              effective_date: table.effective_date,
              ee_rate: table.ee_rate,
              fam_rate: table.fam_rate,
              age_banded_count: table.age_banded_rates?.length || 0,
            }))}
            emptyLabel="No saved rate versions"
            renderMeta={(item) => (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>Effective: {item.effective_date || "—"}</p>
                <p>{item.status === "age_banded" ? `Age rows: ${item.age_banded_count}` : `EE: $${Number(item.ee_rate || 0).toLocaleString()} · Family: $${Number(item.fam_rate || 0).toLocaleString()}`}</p>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}