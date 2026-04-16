import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkflowBottlenecksPanel({ items }) {
  if (!items.length) return null;

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" /> Workflow Bottlenecks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <Link key={item.label} to={item.href} className="flex items-center justify-between rounded-lg border px-3 py-2.5 hover:bg-muted/40 transition-colors">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{item.value}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}