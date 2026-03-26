import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, FileText, ClipboardCheck, Building2, TriangleAlert, CheckSquare } from "lucide-react";

const links = [
  { key: "case", label: "Case", icon: Briefcase, getTo: (c) => `/cases/${c.id}` },
  { key: "census", label: "Census", icon: Users, getTo: (c) => `/census?caseId=${c.id}` },
  { key: "quotes", label: "Quotes", icon: FileText, getTo: (c) => `/quotes?caseId=${c.id}` },
  { key: "proposals", label: "Proposals", icon: FileText, getTo: (c) => `/proposals?caseId=${c.id}` },
  { key: "enrollment", label: "Enrollment", icon: ClipboardCheck, getTo: (c) => `/enrollment?caseId=${c.id}` },
  { key: "employer", label: "Employer", icon: Building2, getTo: (c) => `/employers${c.employer_group_id ? `?employerId=${c.employer_group_id}` : ""}` },
  { key: "employees", label: "Employees", icon: Users, getTo: (c) => `/employee-management` },
  { key: "tasks", label: "Tasks", icon: CheckSquare, getTo: (c) => `/tasks?caseId=${c.id}` },
  { key: "exceptions", label: "Exceptions", icon: TriangleAlert, getTo: (c) => `/exceptions?caseId=${c.id}` },
];

export default function CaseQuickLinks({ caseData }) {
  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t">
      {links.map((item) => (
        <Button key={item.key} asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Link to={item.getTo(caseData)}>
            <item.icon className="w-3 h-3" />
            {item.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}