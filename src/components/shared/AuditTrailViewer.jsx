import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, User, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function AuditTrailViewer({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Change History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No changes recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Change History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-4 relative pb-4 border-b last:border-b-0 last:pb-0">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5" />
                {idx < logs.length - 1 && (
                  <div className="w-0.5 h-12 bg-border mt-2" />
                )}
              </div>

              {/* Log content */}
              <div className="flex-1 min-w-0">
                {/* Header: Who, when, what field */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">{log.actor_name || log.actor_email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_date), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>

                {/* Action and field */}
                <div className="text-sm">
                  <span className="font-medium">{log.action}</span>
                  {log.entity_type && (
                    <>
                      <span className="text-muted-foreground"> on </span>
                      <Badge variant="outline" className="text-[10px]">
                        {log.entity_type}
                      </Badge>
                    </>
                  )}
                </div>

                {/* Field changes (old → new) */}
                {log.old_value !== undefined && log.new_value !== undefined && (
                  <div className="mt-2 bg-muted/50 rounded px-2 py-1.5 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="line-through text-muted-foreground">
                        {log.old_value || "(empty)"}
                      </span>
                      <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="font-semibold text-foreground">
                        {log.new_value || "(empty)"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Detail/notes */}
                {log.detail && (
                  <p className="text-xs text-muted-foreground mt-1">{log.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}