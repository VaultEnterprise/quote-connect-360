import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Heart, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";
import EmptyState from "@/components/shared/EmptyState";

// Employee-specific components
import EnrollmentWizard from "@/components/employee/EnrollmentWizard";
import BenefitsDashboard from "@/components/employee/BenefitsDashboard";
import EmployerCaseValidator from "@/components/employee/EmployerCaseValidator";
import SessionTimeout from "@/components/employee/SessionTimeout";
import BenefitsGlossary from "@/components/employee/BenefitsGlossary";
import { useEnrollmentSave } from "@/components/employee/EnrollmentDataPersistence";

function EmployeePortalContent() {
  const { user } = useAuth();
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [enrollmentState, setEnrollmentState] = useState(null);
  const { save: saveEnrollment } = useEnrollmentSave("enrollment-draft", enrollmentState);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: myEnrollments = [] } = useQuery({
    queryKey: ["my-enrollments", user?.email],
    queryFn: () => base44.entities.EmployeeEnrollment.filter({ employee_email: user?.email }, "-created_date", 50),
    enabled: !!user?.email,
  });

  const { data: enrollmentWindows = [] } = useQuery({
    queryKey: ["enrollment-windows"],
    queryFn: () => base44.entities.EnrollmentWindow.list("-created_date", 20),
  });

  // ── Derived state ────────────────────────────────────────────────────────────
  const activeEnrollment = myEnrollments.find(e => ["invited", "started"].includes(e.status));
  const completedEnrollments = myEnrollments.filter(e => ["completed", "waived"].includes(e.status));
  const activeWindow = activeEnrollment
    ? enrollmentWindows.find(w => w.id === activeEnrollment.enrollment_window_id)
    : null;

  // ── State: showing completed enrollment vs enrollment vs nothing ──────────────
  const hasNoWindow = !activeEnrollment && !completedEnrollments.length;
  const isCompleted = !activeEnrollment && completedEnrollments.length > 0;
  const isEnrolling = !!activeEnrollment;

  // ── No active enrollment — show past enrollments or empty state ──────────────
  if (hasNoWindow) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <EmptyState
          icon={Heart}
          title="No Active Enrollment"
          description="You don't have an active benefits enrollment window. Contact your HR administrator to get started."
        />
      </div>
    );
  }

  // ── Show completed enrollments dashboard ──────────────────────────────────────
  if (isCompleted && !showEnrollment) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        <div>
          <h1 className="text-2xl font-bold">My Benefits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your benefit elections</p>
        </div>

        {completedEnrollments.map(enrollment => (
          <div key={enrollment.id}>
            <BenefitsDashboard
              enrollment={enrollment}
              onPrint={() => window.print()}
            />
          </div>
        ))}

        {/* Link to enroll if new window opens */}
        {activeWindow && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-blue-900">New Enrollment Available</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  A new enrollment window has opened for {activeWindow.employer_name || "your organization"}.
                </p>
              </div>
              <Button onClick={() => setShowEnrollment(true)} className="flex-shrink-0">
                Enroll Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Enrollment wizard ────────────────────────────────────────────────────────
  if (isEnrolling || showEnrollment) {
    return (
      <EnrollmentWizard
        enrollmentWindow={activeWindow}
        user={user}
        activeEnrollment={activeEnrollment}
        onComplete={() => window.location.reload()}
        onWaive={() => window.location.reload()}
      />
    );
  }

  // Fallback
  return (
    <div className="max-w-2xl mx-auto py-16">
      <EmptyState
        icon={Heart}
        title="Employee Benefits Portal"
        description="No active enrollment window found for your account."
      />
    </div>
  );
}