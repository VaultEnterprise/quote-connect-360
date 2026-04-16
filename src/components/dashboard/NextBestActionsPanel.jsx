import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NextBestActionsPanel({ actions }) {
  if (!actions.length) return null;

  return (
    <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Next Best Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link key={`${action.label}-${action.href}`} to={action.href} className="flex items-center justify-between rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/30">
            <div>
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{action.meta}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}