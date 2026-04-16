import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RateTableEditor from "@/components/plans/RateTableEditor";

export default function RateTableManagerCard({ plan, rateTables = [] }) {
  const latestRate = rateTables[0];

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
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
        </div>
        <RateTableEditor planId={plan.id} rateTables={rateTables} />
      </CardContent>
    </Card>
  );
}