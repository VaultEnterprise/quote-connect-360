import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, FileText, ClipboardCheck, Building2, TriangleAlert, CheckSquare } from "lucide-react";
import { getCaseRouteContext } from "@/contracts/routeContracts";
import { buildRoute } from "@/lib/routing/buildRoute";

const links = [
  { key: "case", label: "Case", icon: Briefcase, getTo: (_, context) => buildRoute("caseDetail", { caseId: context.caseId }) },
  { key: "census", label: "Census", icon: Users, getTo: (_, context) => buildRoute("census", { caseId: context.caseId, employerId: context.employerId }) },
  { key: "quotes", label: "Quotes", icon: FileText, getTo: (_, context) => buildRoute("quotes", { caseId: context.caseId, employerId: context.employerId }) },
  { key: "proposals", label: "Proposals", icon: FileText, getTo: (_, context) => buildRoute("proposals", { caseId: context.caseId, employerId: context.employerId }) },
  { key: "enrollment", label: "Enrollment", icon: ClipboardCheck, getTo: (_, context) => buildRoute("enrollment", { caseId: context.caseId, employerId: context.employerId }) },
  { key: "employer", label: "Employer", icon: Building2, getTo: (_, context) => buildRoute("employers", { caseId: context.caseId, employerId: context.employerId }) },
  { key: "employees", label: "Employees", icon: Users, getTo: (_, context) => buildRoute("employeeManagement", { caseId: context.caseId, employerId: context.employerId }) },
  { key: "tasks", label: "Tasks", icon: CheckSquare, getTo: (_, context) => buildRoute("tasks", { caseId: context.caseId }) },
  { key: "exceptions", label: "Exceptions", icon: TriangleAlert, getTo: (_, context) => buildRoute("exceptions", { caseId: context.caseId }) },
  { key: "renewals", label: "Renewals", icon: Briefcase, getTo: (_, context) => buildRoute("renewals", { caseId: context.caseId, employerId: context.employerId }) },
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