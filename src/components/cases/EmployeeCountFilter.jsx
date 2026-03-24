import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

export default function EmployeeCountFilter({ value, onChange }) {
  const [preset, setPreset] = useState("all");

  const handlePreset = (p) => {
    setPreset(p);
    let range = null;
    if (p === "small") range = { min: 0, max: 49 };
    else if (p === "medium") range = { min: 50, max: 249 };
    else if (p === "large") range = { min: 250, max: 999 };
    else if (p === "enterprise") range = { min: 1000, max: Infinity };
    onChange(range);
  };

  return (
    <div className="flex items-center gap-2">
      <Users className="w-3.5 h-3.5 text-muted-foreground" />
      <Select value={preset} onValueChange={handlePreset}>
        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Employee Count" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sizes</SelectItem>
          <SelectItem value="small">Small (1–49)</SelectItem>
          <SelectItem value="medium">Medium (50–249)</SelectItem>
          <SelectItem value="large">Large (250–999)</SelectItem>
          <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}