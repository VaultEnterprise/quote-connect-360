import React from "react";
import { Activity, CheckCircle2, CircleAlert, Database, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const iconMap = {
  payroll: Database,
  carrier: RefreshCw,
  edi: Activity,
  ingestion: CircleAlert,
};

export default function IntegrationStatusPanel({ items }) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Integration & Processing Health</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const Icon = iconMap[item.key] || Activity;
          return (
            <div key={item.key} className="rounded-2xl border border-border/70 bg-muted/15 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-background p-2 shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">{item.label}</p>
                </div>
                {item.healthy ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleAlert className="h-4 w-4 text-orange-500" />}
              </div>
              <p className="mt-3 text-2xl font-semibold">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}