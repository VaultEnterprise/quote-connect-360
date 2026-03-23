import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { History, ArrowRight, User, Clock } from "lucide-react";

/**
 * AuditTrailViewer
 * Displays field-level change history for any entity.
 * Shows: who changed what, from X to Y, when.
 */
export default function AuditTrailViewer({ activities = [], entityName = "Entity" }) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">No activity recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Activity Log
        </CardTitle>
        <Badge variant="secondary" className="text-xs">{activities.length} changes</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.map((activity, idx) => (
            <div key={idx} className="flex gap-3 pb-3 border-b last:border-b-0">
              {/* Timeline dot */}
              <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {idx < activities.length - 1 && <div className="w-px h-6 bg-border" />}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {/* Action summary */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold text-foreground capitalize">{activity.action}</span>
                  {activity.entity_type && (
                    <Badge variant="outline" className="text-xs py-0 h-4">{activity.entity_type}</Badge>
                  )}
                </div>

                {/* Field change detail (for update actions) */}
                {activity.old_value !== undefined && activity.new_value !== undefined && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground bg-muted/50 p-1.5 rounded">
                    <span className="font-mono bg-red-50 text-red-700 px-1 rounded text-[10px] truncate">
                      {typeof activity.old_value === "object" ? JSON.stringify(activity.old_value).slice(0, 30) : String(activity.old_value || "—").slice(0, 30)}
                    </span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0 text-border" />
                    <span className="font-mono bg-green-50 text-green-700 px-1 rounded text-[10px] truncate">
                      {typeof activity.new_value === "object" ? JSON.stringify(activity.new_value).slice(0, 30) : String(activity.new_value || "—").slice(0, 30)}
                    </span>
                  </div>
                )}

                {/* Detail text */}
                {activity.detail && (
                  <p className="text-xs text-muted-foreground mb-1.5">{activity.detail}</p>
                )}

                {/* Actor + Time */}
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {activity.actor_name && (
                    <>
                      <User className="w-3 h-3" />
                      <span>{activity.actor_name}</span>
                    </>
                  )}
                  {activity.created_date && (
                    <>
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(activity.created_date), "MMM d, h:mm a")}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}