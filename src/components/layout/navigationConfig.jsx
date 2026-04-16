import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  FileText,
  Calculator,
  FileOutput,
  ClipboardCheck,
  RefreshCw,
  BookOpen,
  DollarSign,
  Brain,
  AlertCircle,
  TriangleAlert,
  Landmark,
  Heart,
  UserCog,
  ServerCog,
  HelpCircle,
  ShieldCheck,
  Settings,
  Scale,
} from "lucide-react";

export const primaryWorkflowItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, description: "Start here" },
  { path: "/employers", label: "Master Groups", icon: Building2, description: "Manage employer accounts" },
  { path: "/cases", label: "Cases", icon: Briefcase, description: "Run end-to-end workflows" },
  { path: "/census", label: "Census & Employees", icon: Users, description: "Upload and validate employee data" },
  { path: "/quotes", label: "Quotes", icon: FileText, description: "Build scenarios and pricing" },
  { path: "/contributions", label: "Contributions", icon: Calculator, description: "Model employer costs" },
  { path: "/proposals", label: "Proposals", icon: FileOutput, description: "Prepare employer-ready output" },
  { path: "/enrollment", label: "Enrollment", icon: ClipboardCheck, description: "Open and manage windows" },
  { path: "/renewals", label: "Renewals", icon: RefreshCw, description: "Manage renewal cycles" },
];

export const referenceItems = [
  { path: "/plans", label: "Plans / Plan Builder", icon: BookOpen, description: "Manage plan catalog" },
  { path: "/rates", label: "Rates", icon: DollarSign, description: "Maintain pricing tables" },
  { path: "/policymatch", label: "PolicyMatch AI", icon: Brain, description: "Compare policy options" },
  { path: "/tasks", label: "Tasks", icon: AlertCircle, description: "Track operational work" },
  { path: "/exceptions", label: "Issues", icon: TriangleAlert, description: "Resolve blockers" },
  { path: "/integration-infra", label: "Integrations", icon: ServerCog, description: "Integration operations" },
  { path: "/aca-library", label: "ACA Library", icon: Scale, description: "Compliance reference" },
];

export const portalItems = [
  { path: "/employer-portal", label: "Employer Portal", icon: Landmark, description: "Employer-facing workspace" },
  { path: "/employee-portal", label: "Employee Portal", icon: Heart, description: "Employee-facing workspace" },
  { path: "/employee-management", label: "Employees", icon: UserCog, description: "Roster, windows, status" },
];

export const supportItems = [
  { path: "/help", label: "Help Center", icon: HelpCircle, description: "Guides and help" },
  { path: "/help-admin", label: "Help Console", icon: ShieldCheck, description: "Admin help tools" },
  { path: "/settings", label: "Settings", icon: Settings, description: "Platform setup" },
];

export const navGroups = [
  { label: "Workflow", items: primaryWorkflowItems },
  { label: "Reference & Operations", items: referenceItems },
  { label: "Portals & People", items: portalItems },
];