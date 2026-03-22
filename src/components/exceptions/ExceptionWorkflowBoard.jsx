import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Hourglass, Eye, Zap } from "lucide-react";

const COLUMNS = [
  { id: "new", label: "New", icon: AlertTriangle, color: "bg-blue-50 border-blue-200", bgColor: "bg-blue-100" },
  { id: "triaged", label: "Triaged", icon: Eye, color: "bg-purple-50 border-purple-200", bgColor: "bg-purple-100" },
  { id: "in_progress", label: "In Progress", icon: Hourglass, color: "bg-amber-50 border-amber-200", bgColor: "bg-amber-100" },
  { id: "waiting_external", label: "Waiting External", icon: Hourglass, color: "bg-orange-50 border-orange-200", bgColor: "bg-orange-100" },
  { id: "resolved", label: "Resolved", icon: CheckCircle2, color: "bg-green-50 border-green-200", bgColor: "bg-green-100" },
];

export default function ExceptionWorkflowBoard({ exceptions }) {
  const columnData = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      items: exceptions.filter(e => {
        if (col.id === "new") return e.status === "new";
        if (col.id === "resolved") return ["resolved", "dismissed"].includes(e.status);
        return e.status === col.id;
      })
    }));
  }, [exceptions]);

  const totalCount = exceptions.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Workflow Status Board</p>
        <Badge variant="outline" className="text-[10px]">{totalCount} total</Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto pb-2">
        {columnData.map(col => (
          <div key={col.id} className={`rounded-lg border-2 ${col.color} p-3 min-w-[150px]`}>
            <div className="flex items-center gap-2 mb-2">
              <col.icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold">{col.label}</p>
              <Badge className={`${col.bgColor} text-[9px] py-0 ml-auto font-bold`}>{col.items.length}</Badge>
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {col.items.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-4">—</p>
              ) : (
                col.items.map(item => (
                  <div key={item.id} className="p-2 rounded bg-white border border-border text-[10px] line-clamp-2 hover:shadow-sm transition-shadow cursor-pointer group">
                    <p className="font-medium group-hover:text-primary">{item.title}</p>
                    {item.severity === "critical" && <Badge className="mt-1 text-[8px] bg-red-100 text-red-700 border-red-200 border py-0">Critical</Badge>}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}