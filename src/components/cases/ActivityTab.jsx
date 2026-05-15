import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Activity, Clock } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function ActivityTab({ caseId }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["activity", caseId],
    queryFn: () => base44.entities.ActivityLog.filter({ case_id: caseId }, "-created_date", 50),
  });

  if (logs.length === 0) {
    return <EmptyState icon={Activity} title="No Activity Yet" description="Actions taken on this case will appear here" />;
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-4 pl-10">
        {logs.map((log) => (
          <div key={log.id} className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-primary/20 border-2 border-primary" />
            <div className="bg-card border border-border/50 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">{log.action}</p>
              {log.detail && <p className="text-xs text-muted-foreground mt-0.5">{log.detail}</p>}
              {(log.old_value || log.new_value) && (
                <div className="flex items-center gap-2 mt-1.5 text-xs">
                  {log.old_value && <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground line-through">{log.old_value}</span>}
                  {log.new_value && <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">{log.new_value}</span>}
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(log.created_date), "MMM d, yyyy 'at' h:mm a")}</span>
                {log.actor_name && <><span>•</span><span>{log.actor_name}</span></>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}