import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function DateRangeFilter({ type = "effective", value, onChange }) {
  const [preset, setPreset] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const handlePreset = (p) => {
    setPreset(p);
    const today = new Date();
    let range = null;
    if (p === "all") range = null;
    else if (p === "7d") range = { start: new Date(today.getTime() - 7 * 86400000), end: today };
    else if (p === "30d") range = { start: new Date(today.getTime() - 30 * 86400000), end: today };
    else if (p === "90d") range = { start: new Date(today.getTime() - 90 * 86400000), end: today };
    else if (p === "custom") range = { start: customStart ? new Date(customStart) : null, end: customEnd ? new Date(customEnd) : null };
    onChange(range);
  };

  const labels = { effective: "Effective Date", created: "Created Date", target_close: "Target Close" };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
      <Select value={preset} onValueChange={handlePreset}>
        <SelectTrigger className="w-32 h-9"><SelectValue placeholder={labels[type]} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="7d">Last 7 Days</SelectItem>
          <SelectItem value="30d">Last 30 Days</SelectItem>
          <SelectItem value="90d">Last 90 Days</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>
      {preset === "custom" && (
        <div className="flex gap-1">
          <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-24 h-9 text-xs" />
          <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-24 h-9 text-xs" />
          <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => handlePreset("custom")}>Apply</Button>
        </div>
      )}
    </div>
  );
}