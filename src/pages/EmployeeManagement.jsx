import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import { Link } from "react-router-dom";
import {
  Users, ClipboardCheck, BarChart2, FileSignature,
  TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Send, RefreshCw, ExternalLink, Briefcase, UserCheck,
  MessageSquare, ShieldCheck
} from "lucide-react";

// Tab sub-components
import EmployeeRosterTab from "@/components/employee-mgmt/EmployeeRosterTab";
import EnrollmentWindowsTab from "@/components/employee-mgmt/EnrollmentWindowsTab";
import EnrollmentStatusTab from "@/components/employee-mgmt/EnrollmentStatusTab";
import DocuSignManagementTab from "@/components/employee-mgmt/DocuSignManagementTab";
import EmployeeAnalyticsTab from "@/components/employee-mgmt/EmployeeAnalyticsTab";
import EmployeeCommunicationTab from "@/components/employee-mgmt/EmployeeCommunicationTab";
import EmployeeComplianceTab from "@/components/employee-mgmt/EmployeeComplianceTab";

export default function EmployeeManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("roster");

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["all-employee-enrollments"],
    queryFn: () => base44.entities.EmployeeEnrollment.list("-created_date", 500),
  });

  const { data: windows = [], isLoading: loadingWindows } = useQuery({
    queryKey: ["enrollments-all"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 100),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.BenefitCase.list("-created_date", 100),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["benefit-plans"],
    queryFn: () => base44.entities.BenefitPlan.list("-created_date", 200),
  });

  const isLoading = loadingEnrollments || loadingWindows;

  // ── Dashboard KPIs ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = enrollments.length;
    const invited = enrollments.filter(e => e.status === "invited").length;
    const started = enrollments.filter(e => e.status === "started").length;
    const completed = enrollments.filter(e => e.status === "completed").length;
    const waived = enrollments.filter(e => e.status === "waived").length;
    const participationRate = total > 0 ? Math.round(((completed + waived) / total) * 100) : 0;
    const dsNeedsSigning = enrollments.filter(e => e.status === "completed" && (!e.docusign_status || e.docusign_status === "not_sent")).length;
    const dsPending = enrollments.filter(e => ["sent","delivered"].includes(e.docusign_status)).length;
    const dsComplete = enrollments.filter(e => e.docusign_status === "completed").length;
    const openWindows = windows.filter(w => ["open","closing_soon"].includes(w.status)).length;
    const overdueInvites = enrollments.filter(e => e.status === "invited").length;
    return { total, invited, started, completed, waived, participationRate, dsNeedsSigning, dsPending, dsComplete, openWindows, overdueInvites };
  }, [enrollments, windows]);

  // Tab badge counts
  const pendingCount = kpis.invited;
  const docuSignPending = kpis.dsPending + kpis.dsNeedsSigning;
  const complianceAlerts = useMemo(() => {
    // Employees with completed enrollment but no DocuSign
    const noDs = enrollments.filter(e => e.status === "completed" && (!e.docusign_status || e.docusign_status === "not_sent")).length;
    // Overdue invites (invited but window closing soon/closed)
    const overdueWindows = new Set(windows.filter(w => ["closed","finalized"].includes(w.status)).map(w => w.id));
    const stuck = enrollments.filter(e => ["invited","started"].includes(e.status) && overdueWindows.has(e.enrollment_window_id)).length;
    return noDs + stuck;
  }, [enrollments, windows]);

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64 flex-col gap-3">
        <ShieldCheck className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground font-medium">Admin access required to manage employees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title="Employee Management"
        description={`${kpis.total} employees · ${kpis.openWindows} active window${kpis.openWindows !== 1 ? "s" : ""} · ${kpis.participationRate}% participation`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/enrollment">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <ClipboardCheck className="w-3.5 h-3.5" /> Enrollment Windows
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Button>
            </Link>
            <Link to="/cases">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Briefcase className="w-3.5 h-3.5" /> Cases
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Button>
            </Link>
            <Link to="/employee-portal">
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <UserCheck className="w-3.5 h-3.5" /> Employee Portal
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Dashboard Health Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { label: "Total Employees", value: kpis.total, color: "text-foreground", bg: "bg-muted/40", tab: null },
          { label: "Invited (Pending)", value: kpis.invited, color: "text-amber-600", bg: "bg-amber-50", tab: "roster" },
          { label: "In Progress", value: kpis.started, color: "text-blue-600", bg: "bg-blue-50", tab: "status" },
          { label: "Enrolled", value: kpis.completed, color: "text-green-600", bg: "bg-green-50", tab: "status" },
          { label: "Waived", value: kpis.waived, color: "text-slate-500", bg: "bg-slate-50", tab: "status" },
          { label: "Open Windows", value: kpis.openWindows, color: "text-primary", bg: "bg-primary/5", tab: "windows" },
          { label: "Awaiting DocuSign", value: kpis.dsNeedsSigning, color: kpis.dsNeedsSigning > 0 ? "text-orange-600" : "text-slate-400", bg: kpis.dsNeedsSigning > 0 ? "bg-orange-50" : "bg-muted/30", tab: "docusign" },
          { label: "DocuSign Signed", value: kpis.dsComplete, color: "text-emerald-600", bg: "bg-emerald-50", tab: "docusign" },
        ].map(k => (
          <div key={k.label}
            className={`rounded-xl border p-2.5 ${k.bg} ${k.tab ? "cursor-pointer hover:shadow-sm transition-all" : ""}`}
            onClick={() => k.tab && setActiveTab(k.tab)}>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Alert banners */}
      {kpis.overdueInvites > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>{kpis.overdueInvites}</strong> employee{kpis.overdueInvites !== 1 ? "s" : ""} invited but haven't started enrollment
            </p>
          </div>
          <Button size="sm" variant="ghost" className="text-amber-700 h-7 text-xs gap-1 flex-shrink-0"
            onClick={() => setActiveTab("communication")}>
            <Send className="w-3.5 h-3.5" /> Send Reminders
          </Button>
        </div>
      )}
      {kpis.dsNeedsSigning > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>{kpis.dsNeedsSigning}</strong> completed enrollment{kpis.dsNeedsSigning !== 1 ? "s" : ""} need DocuSign sent
            </p>
          </div>
          <Button size="sm" variant="ghost" className="text-blue-700 h-7 text-xs gap-1 flex-shrink-0"
            onClick={() => setActiveTab("docusign")}>
            <FileSignature className="w-3.5 h-3.5" /> Manage DocuSign
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-0.5">
          <TabsTrigger value="roster" className="text-xs gap-1.5">
            <Users className="w-3.5 h-3.5" /> Roster
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="windows" className="text-xs gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" /> Enrollment Windows
          </TabsTrigger>
          <TabsTrigger value="status" className="text-xs gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Enrollment Status
          </TabsTrigger>
          <TabsTrigger value="docusign" className="text-xs gap-1.5">
            <FileSignature className="w-3.5 h-3.5" /> DocuSign
            {docuSignPending > 0 && (
              <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{docuSignPending}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="communication" className="text-xs gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Communications
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Compliance
            {complianceAlerts > 0 && (
              <span className="bg-destructive text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{complianceAlerts}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-5">
          <EmployeeRosterTab
            enrollments={enrollments}
            windows={windows}
            cases={cases}
            plans={plans}
            isLoading={isLoading}
            currentUser={user}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="windows" className="mt-5">
          <EnrollmentWindowsTab
            windows={windows}
            enrollments={enrollments}
            cases={cases}
            isLoading={loadingWindows}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-5">
          <EnrollmentStatusTab
            enrollments={enrollments}
            windows={windows}
            plans={plans}
            isLoading={loadingEnrollments}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="docusign" className="mt-5">
          <DocuSignManagementTab
            enrollments={enrollments}
            isLoading={loadingEnrollments}
          />
        </TabsContent>

        <TabsContent value="communication" className="mt-5">
          <EmployeeCommunicationTab
            enrollments={enrollments}
            windows={windows}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-5">
          <EmployeeComplianceTab
            enrollments={enrollments}
            windows={windows}
            plans={plans}
            cases={cases}
            isLoading={isLoading}
            onNavigate={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-5">
          <EmployeeAnalyticsTab
            enrollments={enrollments}
            windows={windows}
            plans={plans}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}