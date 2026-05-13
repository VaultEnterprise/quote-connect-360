import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";

export default function DaltonRulesToggle({ checked, onChange }) {
  return (
    <div className="flex items-center gap-2" title="Run Dalton Rules review after census validation">
      <Checkbox
        id="dalton-rules"
        checked={checked}
        onCheckedChange={onChange}
        className="h-4 w-4"
      />
      <Label htmlFor="dalton-rules" className="text-xs font-medium cursor-pointer flex items-center gap-1">
        Dalton Rules
        <HelpCircle className="w-3 h-3 text-muted-foreground" />
      </Label>
    </div>
  );
}