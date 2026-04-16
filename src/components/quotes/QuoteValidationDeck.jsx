import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function QuoteValidationDeck({ items }) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Validation & Guardrails</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link key={item.label} to={item.href} className="rounded-2xl border border-border/70 bg-muted/15 p-4 transition-colors hover:bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </div>
              {item.value > 0 ? <AlertTriangle className="h-4 w-4 text-orange-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Badge variant="outline" className="rounded-full">{item.value}</Badge>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}