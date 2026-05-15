import React from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * CaseInfoCard
 * Generic metric tile used in the CaseDetail overview grid.
 *
 * Props:
 *   label — display label (string)
 *   value — string | ReactNode
 *   icon  — Lucide icon component
 */
export default function CaseInfoCard({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="text-sm font-medium mt-0.5">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}