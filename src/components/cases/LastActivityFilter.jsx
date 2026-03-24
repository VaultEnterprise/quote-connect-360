import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "lucide-react";

export default function LastActivityFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Last Activity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cases</SelectItem>
          <SelectItem value="7d">Activity in 7 days</SelectItem>
          <SelectItem value="14d">Activity in 14 days</SelectItem>
          <SelectItem value="30d">Activity in 30 days</SelectItem>
          <SelectItem value="none">No activity (stalled)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}