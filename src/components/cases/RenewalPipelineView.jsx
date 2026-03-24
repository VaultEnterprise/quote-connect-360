import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

export default function RenewalPipelineView({ cases }) {
  const renewals = useMemo(() => {
    return cases
      .filter(c => c.case_type === "renewal")
      .sort((a, b) => new Date(a.effective_date || 0) - new Date(b.effective_date || 0))
      .slice(0, 10);
  }, [cases]);

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4" /> Renewal Pipeline ({renewals.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        {renewals.length === 0 ? (
          <p className="text-xs text-muted-foreground">No renewals</p>
        ) : (
          renewals.map(c => (
            <div key={c.id} className="p-2 bg-muted/30 rounded text-xs">
              <div className="flex justify-between items-start gap-2 mb-1">
                <span className="font-medium truncate">{c.employer_name}</span>
                {c.effective_date && <Badge variant="outline" className="text-[10px] py-0 h-4 flex-shrink-0">{format(new Date(c.effective_date), "MMM d")}</Badge>}
              </div>
              <p className="text-muted-foreground capitalize">{c.stage?.replace(/_/g, " ")}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}