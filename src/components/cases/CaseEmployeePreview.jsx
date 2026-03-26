import React from "react";
import { Users } from "lucide-react";

export default function CaseEmployeePreview({ employees = [], employeeCount = 0 }) {
  if (employeeCount === 0) return null;

  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Users className="w-3 h-3" />
        Employees ({employeeCount})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {employees.map((employee) => (
          <span key={employee.id} className="rounded-full border bg-background px-2 py-1 text-[11px] text-foreground">
            {employee.first_name} {employee.last_name}
          </span>
        ))}
        {employeeCount > employees.length && (
          <span className="rounded-full border bg-background px-2 py-1 text-[11px] text-muted-foreground">
            +{employeeCount - employees.length} more
          </span>
        )}
      </div>
    </div>
  );
}