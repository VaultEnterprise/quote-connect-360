import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function PolicyMatchHistoryTimeline({ results }) {
  const sortedResults = [...results].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const RISK_COLORS = {
    preferred: "bg-emerald-100 text-emerald-700 border-emerald-200",
    standard: "bg-blue-100 text-blue-700 border-blue-200",
    elevated: "bg-amber-100 text-amber-700 border-amber-200",
    high: "bg-red-100 text-red-700 border-red-200"
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Analysis History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {sortedResults.slice(0, 10).map((r, i) => (
            <div key={r.id} className="relative pb-4 last:pb-0">
              {/* Timeline line */}
              {i < sortedResults.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
              )}
              
              <div className="flex gap-3">
                {/* Timeline dot */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center relative z-10 ${
                    r.status === "accepted" ? "bg-emerald-100 border-emerald-400" : 
                    r.status === "declined" ? "bg-red-100 border-red-400" : 
                    "bg-primary/10 border-primary"
                  }`}>
                    {r.status === "accepted" && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                    {r.status === "declined" && <XCircle className="w-4 h-4 text-red-600" />}
                    {!r.status || r.status === "optimized" && <Brain className="w-4 h-4 text-primary" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold truncate">{r.employer_name}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0 whitespace-nowrap">
                      {format(new Date(r.created_date), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={`text-[9px] py-0 border ${RISK_COLORS[r.risk_tier] || RISK_COLORS.standard}`}>
                      Risk: {r.risk_score}
                    </Badge>
                    <Badge className={`text-[9px] py-0 ${
                      r.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "declined" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {r.status?.charAt(0).toUpperCase() + r.status?.slice(1) || "Optimized"}
                    </Badge>
                    {r.auto_bindable && <Badge className="text-[9px] py-0 bg-purple-100 text-purple-700">Auto-Bindable</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}