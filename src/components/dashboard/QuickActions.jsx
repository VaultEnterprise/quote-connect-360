import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Upload, ClipboardCheck, Users, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildRoute } from "@/lib/routing/buildRoute";

const ACTIONS = [
  { label: "New Case", icon: Briefcase, href: "/cases/new", variant: "default" },
  { label: "Upload Census", icon: Upload, href: buildRoute("census"), variant: "outline" },
  { label: "Start Enrollment", icon: ClipboardCheck, href: buildRoute("enrollment"), variant: "outline" },
  { label: "Add Employer", icon: Users, href: buildRoute("employers"), variant: "outline" },
  { label: "Build Quote", icon: FileText, href: buildRoute("quotes"), variant: "outline" },
  { label: "View Renewals", icon: RefreshCw, href: buildRoute("renewals"), variant: "outline" },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(a => (
        <Link key={a.href} to={a.href}>
          <Button size="sm" variant={a.variant} className="h-8 text-xs gap-1.5">
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}