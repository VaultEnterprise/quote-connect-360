import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, FileText, ClipboardCheck, Building2, TriangleAlert, CheckSquare } from "lucide-react";
import { buildRoute, getCaseRouteContext } from "@/contracts/routeContracts";

const links = [
  { key: "case", label: "Case", icon: Briefcase, getTo: (caseData, context) => buildRoute("caseDetail", { caseId: context.caseId }) },
  { key: "census", label: "Census", icon: Users, getTo: (caseData, context) => buildRoute("census", context) },
  { key: "quotes", label: "Quotes", icon: FileText, getTo: (caseData, context) => buildRoute("quotes", context) },
  { key: "proposals", label: "Proposals", icon: FileText, getTo: (caseData, context) => buildRoute("proposals", context) },
  { key: "enrollment", label: "Enrollment", icon: ClipboardCheck, getTo: (caseData, context) => buildRoute("enrollment", context) },
  { key: "employer", label: "Employer", icon: Building2, getTo: (caseData, context) => buildRoute("employers", context) },
  { key: "employees", label: "Employees", icon: Users, getTo: (caseData, context) => buildRoute("employeeManagement", context) },
  { key: "tasks", label: "Tasks", icon: CheckSquare, getTo: (caseData, context) => buildRoute("tasks", context) },
  { key: "exceptions", label: "Exceptions", icon: TriangleAlert, getTo: (caseData, context) => buildRoute("exceptions", context) },
  { key: "renewals", label: "Renewals", icon: Briefcase, getTo: (caseData, context) => buildRoute("renewals", context) },
];

export default function CaseQuickLinks({ caseData }) {
  const context = getCaseRouteContext(caseData);

  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t">
      {links.map((item) => (
        <Button key={item.key} asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Link to={item.getTo(caseData, context)}>
            <item.icon className="w-3 h-3" />
            {item.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}