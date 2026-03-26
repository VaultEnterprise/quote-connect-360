import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

// Tab sub-components
import EmployeeRosterTab from "@/components/employee-mgmt/EmployeeRosterTab";
import EnrollmentWindowsTab from "@/components/employee-mgmt/EnrollmentWindowsTab";
import EnrollmentStatusTab from "@/components/employee-mgmt/EnrollmentStatusTab";
import DocuSignManagementTab from "@/components/employee-mgmt/DocuSignManagementTab";
import EmployeeAnalyticsTab from "@/components/employee-mgmt/EmployeeAnalyticsTab";
import useRouteContext from "@/hooks/useRouteContext";

export default function EmployeeManagement() {
  const { user } = useAuth();
  const routeContext = useRouteContext("employeeManagement");
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
  const scopedWindows = useMemo(() => windows.filter((windowItem) => !routeContext.caseId || windowItem.case_id === routeContext.caseId), [windows, routeContext.caseId]);
  const scopedEnrollments = useMemo(() => enrollments.filter((enrollment) => !routeContext.caseId || enrollment.case_id === routeContext.caseId), [enrollments, routeContext.caseId]);
  const scopedCases = useMemo(() => cases.filter((caseItem) => (!routeContext.caseId || caseItem.id === routeContext.caseId) && (!routeContext.employerId || caseItem.employer_group_id === routeContext.employerId)), [cases, routeContext.caseId, routeContext.employerId]);

  // Summary counts for tab badges
  const pendingCount = scopedEnrollments.filter(e => e.status === "invited").length;
  const docuSignPending = scopedEnrollments.filter(e =>
    e.docusign_status && !["not_sent", "completed"].includes(e.docusign_status)
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employee Management"
        description={`${scopedEnrollments.length} total employee enrollments across ${scopedWindows.length} windows`}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="roster">
            Employee Roster
            {pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="windows">Enrollment Windows</TabsTrigger>
          <TabsTrigger value="status">Enrollment Status</TabsTrigger>
          <TabsTrigger value="docusign">
            DocuSign
            {docuSignPending > 0 && (
              <span className="ml-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{docuSignPending}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="roster" className="mt-5">
          <EmployeeRosterTab
            enrollments={scopedEnrollments}
            windows={scopedWindows}
            cases={scopedCases}
            plans={plans}
            isLoading={isLoading}
            currentUser={user}
          />
        </TabsContent>

        <TabsContent value="windows" className="mt-5">
          <EnrollmentWindowsTab
            windows={scopedWindows}
            enrollments={scopedEnrollments}
            cases={scopedCases}
            isLoading={loadingWindows}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-5">
          <EnrollmentStatusTab
            enrollments={scopedEnrollments}
            windows={scopedWindows}
            plans={plans}
            isLoading={loadingEnrollments}
          />
        </TabsContent>

        <TabsContent value="docusign" className="mt-5">
          <DocuSignManagementTab
            enrollments={scopedEnrollments}
            isLoading={loadingEnrollments}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-5">
          <EmployeeAnalyticsTab
            enrollments={scopedEnrollments}
            windows={scopedWindows}
            plans={plans}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}