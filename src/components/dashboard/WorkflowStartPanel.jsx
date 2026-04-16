import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { primaryWorkflowItems } from "@/components/layout/navigationConfig";

export default function WorkflowStartPanel() {
  const quickPath = primaryWorkflowItems.filter((item) => item.path !== "/").slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">How to use the platform</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickPath.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/cases/new"><Button size="sm">Start with a new case</Button></Link>
          <Link to="/employers"><Button size="sm" variant="outline">Open master groups</Button></Link>
          <Link to="/census"><Button size="sm" variant="outline">Upload census</Button></Link>
        </div>
      </CardContent>
    </Card>
  );
}