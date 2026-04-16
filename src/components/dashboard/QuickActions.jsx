import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Upload, ClipboardCheck, Users, FileText, RefreshCw } from "lucide-react";

const ACTIONS = [
  { label: "New Case", icon: Briefcase, href: "/cases/new", className: "bg-primary text-primary-foreground shadow hover:bg-primary/90" },
  { label: "Upload Census", icon: Upload, href: "/census", className: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" },
  { label: "Start Enrollment", icon: ClipboardCheck, href: "/enrollment", className: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" },
  { label: "Add Employer", icon: Users, href: "/employers", className: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" },
  { label: "Build Quote", icon: FileText, href: "/quotes", className: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" },
  { label: "View Renewals", icon: RefreshCw, href: "/renewals", className: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" },
];

export default function QuickActions({ actions = ACTIONS }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.filter(Boolean).map((action, index) => {
        const ActionIcon = action.icon;
        return (
        <Link
          key={action.href || `action-${index}`}
          to={action.href}
          className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors ${action.className}`}
        >
          {ActionIcon ? <ActionIcon className="w-3.5 h-3.5" /> : null}
          {action.label}
        </Link>
      )})}
    </div>
  );
}