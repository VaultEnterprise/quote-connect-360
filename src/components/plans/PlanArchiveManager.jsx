import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

export default function PlanArchiveManager({ archivedPlans = [] }) {
  const [showArchived, setShowArchived] = useState(false);

  if (archivedPlans.length === 0) return null;

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowArchived(!showArchived)}
        className="text-xs h-8 gap-1">
        <Archive className="w-3 h-3" /> Archived Plans ({archivedPlans.length})
      </Button>

      {showArchived && (
        <Card className="bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Archived Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {archivedPlans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                <div>
                  <p className="text-xs font-medium">{plan.plan_name}</p>
                  <p className="text-[10px] text-muted-foreground">{plan.carrier} · {plan.plan_code}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                    <RotateCcw className="w-3 h-3" /> Restore
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}