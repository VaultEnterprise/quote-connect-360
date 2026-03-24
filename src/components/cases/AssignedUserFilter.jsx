import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";

export default function AssignedUserFilter({ cases, value, onChange }) {
  const assignees = useMemo(() => {
    const set = new Set();
    cases.forEach(c => {
      if (c.assigned_to) set.add(c.assigned_to);
    });
    return Array.from(set).sort();
  }, [cases]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40 h-9">
        <Users className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
        <SelectValue placeholder="Assignee" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Assignees</SelectItem>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {assignees.map(a => (
          <SelectItem key={a} value={a}>{a.split("@")[0]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}