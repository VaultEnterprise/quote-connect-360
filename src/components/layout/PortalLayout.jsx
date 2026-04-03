import React from "react";
import { Outlet } from "react-router-dom";
import { Zap } from "lucide-react";

/**
 * PortalLayout
 * Minimal layout for employee and employer portals.
 * Deliberately excludes the broker Sidebar and TopBar so external
 * users (employees, employer contacts) never see the broker UI.
 *
 * All portal routes (/employee-portal, /employee-enrollment,
 * /employee-benefits, /employer-portal) must use this layout.
 */
export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal header — brand only, no nav */}
      <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-foreground">Connect Quote 360</span>
      </header>

      <main className="p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
