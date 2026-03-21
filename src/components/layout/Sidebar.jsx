import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/cases", label: "Cases", icon: Briefcase },
  { path: "/employers", label: "Employers", icon: Building2 },
  { path: "/census", label: "Census", icon: Users },
  { path: "/quotes", label: "Quotes", icon: FileText },
  { path: "/enrollment", label: "Enrollment", icon: ClipboardCheck },
  { path: "/renewals", label: "Renewals", icon: RefreshCw },
  { path: "/tasks", label: "Tasks", icon: AlertCircle },
];

const bottomItems = [
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ item }) => {
    const active = isActive(item.path);
    const linkContent = (
      <Link
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        )}
      >
        <item.icon className={cn("w-5 h-5 flex-shrink-0", active && "drop-shadow-sm")} />
        {!collapsed && (
          <span className="text-sm font-medium truncate">{item.label}</span>
        )}
        {active && !collapsed && (
          <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-sidebar-primary-foreground/80" />
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center gap-2.5 px-4 h-16 border-b border-sidebar-border flex-shrink-0", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-sidebar-foreground leading-tight truncate">Connect Quote</h1>
              <p className="text-[10px] font-medium text-sidebar-foreground/50 tracking-wider">360</p>
            </div>
          )}
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-1 border-t border-sidebar-border pt-3">
          {bottomItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent mt-2"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}