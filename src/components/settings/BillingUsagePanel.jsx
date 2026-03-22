import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, TrendingUp, AlertTriangle, Download } from "lucide-react";

const USAGE_METRICS = [
  { name: "API Requests", usage: 28500, limit: 100000, unit: "req/month", percentage: 28.5 },
  { name: "Enrolled Members", usage: 1240, limit: 2000, unit: "members", percentage: 62 },
  { name: "Storage", usage: 14.2, limit: 50, unit: "GB", percentage: 28.4 },
  { name: "Email Sends", usage: 8900, limit: 50000, unit: "emails/month", percentage: 17.8 },
  { name: "SMS Messages", usage: 0, limit: 10000, unit: "sms/month", percentage: 0 },
  { name: "GradientAI Analyses", usage: 256, limit: 5000, unit: "analyses/month", percentage: 5.1 },
];

const BILLING_HISTORY = [
  { id: "1", date: "2026-03-01", amount: "$2,999", plan: "Professional Plan", status: "Paid" },
  { id: "2", date: "2026-02-01", amount: "$2,999", plan: "Professional Plan", status: "Paid" },
  { id: "3", date: "2026-01-01", amount: "$2,999", plan: "Professional Plan", status: "Paid" },
];

export default function BillingUsagePanel() {
  return (
    <div className="space-y-4">
      {/* Current plan */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Professional Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">$2,999/month • Renews on April 1, 2026</p>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-7">Change Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage metrics */}
      <div>
        <p className="text-sm font-semibold mb-2">Current Usage</p>
        <div className="space-y-3">
          {USAGE_METRICS.map(m => (
            <Card key={m.name}>
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{m.name}</p>
                  <Badge
                    className={m.percentage > 80
                      ? "bg-red-100 text-red-700 border-red-200 border text-[9px] py-0"
                      : m.percentage > 60
                        ? "bg-amber-100 text-amber-700 border-amber-200 border text-[9px] py-0"
                        : "bg-green-100 text-green-700 border-green-200 border text-[9px] py-0"}
                  >
                    {m.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={m.percentage} className="h-2" />
                <p className="text-[10px] text-muted-foreground">
                  {m.usage.toLocaleString()} / {m.limit.toLocaleString()} {m.unit}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing history */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Billing History</p>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
            <Download className="w-3 h-3" /> Export
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {BILLING_HISTORY.map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                  <div>
                    <p className="text-xs font-medium">{bill.plan}</p>
                    <p className="text-[10px] text-muted-foreground">{bill.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700 border-green-200 border text-[9px] py-0">{bill.status}</Badge>
                    <p className="text-xs font-semibold min-w-[80px] text-right">{bill.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}