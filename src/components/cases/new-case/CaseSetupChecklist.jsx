import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const CARRIERS = [
  {
    id: "ast",
    name: "AST",
    label: "Send to AST",
    description: "Prepare and validate census data for AST submission.",
  },
  {
    id: "sus",
    name: "SUS",
    label: "Send to SUS",
    description: "Prepare SUS census data and collect required SARA-related documents.",
  },
  {
    id: "triad",
    name: "Triad",
    label: "Send to Triad",
    description: "Prepare and validate census data for Triad submission.",
  },
  {
    id: "mecMvp",
    name: "MEC / MVP",
    label: "Send to MEC / MVP",
    description: "Prepare and validate MEC / MVP census data and attach supporting documents for review.",
  },
];

export default function CaseSetupChecklist({ selectedDestinations, onDestinationToggle }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Case Setup Checklist</CardTitle>
        <CardDescription className="text-xs mt-1">
          Select the census workflows and carrier submission packages required for this case.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {CARRIERS.map((carrier) => {
            const isSelected = selectedDestinations[carrier.id];
            const statusBadge = isSelected ? "Ready to configure" : "Not selected";
            const statusColor = isSelected ? "bg-blue-50 border-blue-200" : "bg-muted";
            
            return (
              <div
                key={carrier.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${statusColor} ${
                  isSelected ? "border-blue-200" : "border-border"
                }`}
              >
                <Checkbox
                   id={`carrier-${carrier.id}`}
                   checked={isSelected}
                   onCheckedChange={() => onDestinationToggle(carrier.id)}
                   className="mt-1 flex-shrink-0"
                 />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Label htmlFor={`carrier-${carrier.id}`} className="font-medium text-sm cursor-pointer">
                      {carrier.label}
                    </Label>
                    <Badge variant={isSelected ? "default" : "outline"} className="text-xs h-fit">
                      {statusBadge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{carrier.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}