import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart2,
  Award,
  FileText,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  Settings,
  Building2,
  BookOpen,
  FileOutput,
  TriangleAlert,
  Calculator,
  Heart,
  Landmark,
  UserCog,
  Brain,
  ServerCog,
  HelpCircle,
  ShieldCheck,
  Scale,
  CloudCog,
} from "lucide-react";

export const navGroups = [
  {
    label: "Core Workflow",
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard },
      { path: "/cases", label: "Cases", icon: Briefcase },
      { path: "/employers", label: "Employers", icon: Building2 },
      { path: "/census", label: "Census", icon: Users },
      { path: "/quotes", label: "Quotes", icon: FileText },
      { path: "/contributions", label: "Contributions", icon: Calculator },
      { path: "/proposals", label: "Proposals", icon: FileOutput },
      { path: "/enrollment", label: "Enrollment", icon: ClipboardCheck },
      { path: "/renewals", label: "Renewals", icon: RefreshCw },
    ],
  },
  {
    label: "Tools & Reference",
    items: [
      { path: "/plans", label: "Plan Library", icon: BookOpen },
      { path: "/plan-rate-editor", label: "Rate Editor", icon: BarChart2 },
      { path: "/plan-analytics", label: "Plan Analytics", icon: Award },
      { path: "/plan-compliance", label: "Compliance Center", icon: ShieldCheck },
      { path: "/plan-rating", label: "Rating Engine", icon: BarChart2 },
      { path: "/policymatch", label: "PolicyMatchAI", icon: Brain },
      { path: "/tasks", label: "Tasks", icon: AlertCircle },
      { path: "/exceptions", label: "Exceptions", icon: TriangleAlert },
      { path: "/integration-infra", label: "Integration Infra", icon: ServerCog },
      { path: "/salesforce", label: "Salesforce CRM", icon: CloudCog },
      { path: "/aca-library", label: "ACA Library", icon: Scale },
    ],
  },
  {
    label: "Portals",
    items: [
      { path: "/employer-portal", label: "Employer Portal", icon: Landmark },
      { path: "/employee-portal", label: "Employee Portal", icon: Heart },
      { path: "/employee-management", label: "Employee Mgmt", icon: UserCog },
    ],
  },
];

export const bottomItems = [
  { path: "/help", label: "Help Center", icon: HelpCircle },
  { path: "/help-admin", label: "Help Console", icon: ShieldCheck },
  { path: "/settings", label: "Settings", icon: Settings },
];

export const sidebarBadgeConfigs = {
  "/tasks": {
    queryKey: ["tasks-pending"],
    queryFn: (base44) => base44.entities.CaseTask.filter({ status: "pending" }, "-created_date", 25),
    count: (data) => data.length,
    expandedClassName: "bg-destructive text-destructive-foreground",
    collapsedClassName: "bg-destructive",
  },
  "/exceptions": {
    queryKey: ["exceptions-open-count"],
    queryFn: (base44) => base44.entities.ExceptionItem.list("-created_date", 50),
    count: (data) => data.filter((item) => !["resolved", "dismissed"].includes(item.status)).length,
    expandedClassName: "bg-red-500 text-white",
    collapsedClassName: "bg-red-500",
  },
  "/enrollment": {
    queryKey: ["enrollments-active-count"],
    queryFn: (base44) => base44.entities.EnrollmentWindow.list("-created_date", 20),
    count: (data) => data.filter((item) => ["open", "closing_soon"].includes(item.status)).length,
    expandedClassName: "bg-blue-500 text-white",
    collapsedClassName: "bg-blue-500",
  },
};