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

  // Summary counts for tab badges
  const pendingCount = enrollments.filter(e => e.status === "invited").length;
  const docuSignPending = enrollments.filter(e =>
    e.docusign_status && !["not_sent", "completed"].includes(e.docusign_status)
  ).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Employee Management"
        description={`${enrollments.length} total employee enrollments across ${windows.length} windows`}
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
            enrollments={enrollments}
            windows={windows}
            cases={cases}
            plans={plans}
            isLoading={isLoading}
            currentUser={user}
          />
        </TabsContent>

        <TabsContent value="windows" className="mt-5">
          <EnrollmentWindowsTab
            windows={windows}
            enrollments={enrollments}
            cases={cases}
            isLoading={loadingWindows}
          />
        </TabsContent>

        <TabsContent value="status" className="mt-5">
          <EnrollmentStatusTab
            enrollments={enrollments}
            windows={windows}
            plans={plans}
            isLoading={loadingEnrollments}
          />
        </TabsContent>

        <TabsContent value="docusign" className="mt-5">
          <DocuSignManagementTab
            enrollments={enrollments}
            isLoading={loadingEnrollments}
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