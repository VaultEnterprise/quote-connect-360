import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AlertsAndAuditFeed({ alerts, feed }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">No active alerts.</div>
          ) : (
            alerts.map((alert) => (
              <Link key={`${alert.label}-${alert.href}`} to={alert.href} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{alert.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full">{alert.value}</Badge>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock3 className="h-4 w-4 text-primary" /> Activity & Audit Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feed.length === 0 ? (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">No recent activity.</div>
          ) : (
            feed.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-muted/15 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}