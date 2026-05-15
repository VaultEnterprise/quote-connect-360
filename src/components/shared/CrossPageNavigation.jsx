import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

/**
 * CrossPageNavigation
 * Context-aware navigation strip linking to related pages and workflows
 * Used for inter-page consistency and reducing navigation friction
 */
export default function CrossPageNavigation({ category, currentPage }) {
  const navMaps = {
    // Help System Navigation
    help: [
      { label: "Help Center", path: "/help", exclude: "help" },
      { label: "Admin Console", path: "/help-admin", roles: ["admin"] },
      { label: "Governance Dashboard", path: "/help-dashboard", roles: ["admin"] },
      { label: "Coverage Report", path: "/help-coverage", roles: ["admin"] },
      { label: "Search Analytics", path: "/help-analytics", roles: ["admin"] },
      { label: "Target Registry", path: "/help-target-registry", roles: ["admin"] },
    ],
    // Portal Navigation
    portals: [
      { label: "Employer Portal", path: "/employer-portal" },
      { label: "Employee Portal", path: "/employee-portal" },
    ],
    // Core Workflow
    workflow: [
      { label: "Dashboard", path: "/" },
      { label: "Cases", path: "/cases" },
      { label: "Census", path: "/census" },
      { label: "Quotes", path: "/quotes" },
      { label: "Proposals", path: "/proposals" },
      { label: "Enrollment", path: "/enrollment" },
      { label: "Renewals", path: "/renewals" },
    ],
    // Settings & Admin
    admin: [
      { label: "Settings", path: "/settings" },
      { label: "Integration Infrastructure", path: "/integration-infra" },
      { label: "Help Admin", path: "/help-admin", roles: ["admin"] },
    ],
  };

  const items = navMaps[category] || [];
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => {
        // Skip if marked as excluded
        if (item.exclude && currentPage?.includes(item.exclude)) return null;
        // Skip if user doesn't have required role (handled on backend)
        return (
          <Link key={idx} to={item.path}>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              {item.label}
              <ChevronRight className="w-3 h-3 opacity-50" />
            </Button>
          </Link>
        );
      })}
    </div>
  );
}