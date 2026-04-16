import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DomainControlGrid({ domains }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {domains.map((domain) => {
        const Icon = domain.icon;
        return (
          <Card key={domain.key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{domain.label}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{domain.description}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">{domain.href}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {domain.stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border bg-muted/30 p-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-semibold mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                {domain.actions.map((action) => (
                  <Link key={action.label} to={action.href} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm hover:bg-muted/40 transition-colors">
                    <span>{action.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}