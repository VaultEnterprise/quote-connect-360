import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@anstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

import EnrollmentWizard from "@/components/employee/EnrollmentWizard";
import EmptyState from "@/components/shared/EmptyState";

/**
 * EmployeeEnrollment
 * Portal-based enrollment (session-based, not app login required).
 */
export default function EmployeeEnrollment() {
  const navigate = useNavigate();

  // Get session from sessionStorage
  const session = React.useMemo(() => {
    try {
      const data = sessionStorage.getItem("portal_session");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!session) {
      navigate("/employee-portal-login", { replace: true });
    }
  }, [session, navigate]);

  // Fetch enrollment + window
  const { data: enrollment, isLoading: loadingEnrollment } = useQuery({
    queryKey: ["portal-enrollment", session?.enrollment_id],
    queryFn: () => session?.enrollment_id ? base44.entities.EmployeeEnrollment.filter({ id: session.enrollment_id }) : Promise.resolve([]),
    enabled: !!session?.enrollment_id,
  });

  const activeEnrollment = enrollment?.[0];

  const { data: enrollmentWindow, isLoading: loadingWindow } = useQuery({
    queryKey: ["portal-window", activeEnrollment?.enrollment_window_id],
    queryFn: () =>
      activeEnrollment?.enrollment_window_id
        ? base44.entities.EnrollmentWindow.filter({ id: activeEnrollment.enrollment_window_id })
        : Promise.resolve([]),
    enabled: !!activeEnrollment?.enrollment_window_id,
  });

  const window = enrollmentWindow?.[0];

  const handleLogout = () => {
    sessionStorage.removeItem("portal_session");
    navigate("/employee-portal-login", { replace: true });
  };

  if (!session) return null;

  if (loadingEnrollment || loadingWindow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your enrollment...</p>
        </div>
      </div>
    );
  }

  if (!activeEnrollment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-background flex items-center justify-center p-4">
        <div className="max-w-md">
          <EmptyState
            icon={Home}
            title="Enrollment Not Found"
            description="We couldn't find your enrollment record. Please check your access token and try again."
            actionLabel="Back to Login"
            onAction={() => navigate("/employee-portal-login")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-background">
      {/* Portal header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <p className="font-semibold text-foreground">{session.employee_name}</p>
            <p className="text-xs text-muted-foreground">{session.employee_email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 h-8">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Enrollment wizard */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <EnrollmentWizard
          enrollmentWindow={window}
          user={{ email: session.employee_email, full_name: session.employee_name }}
          activeEnrollment={activeEnrollment}
          onComplete={() => navigate("/employee-benefits")}
          onWaive={() => navigate("/employee-benefits")}
        />
      </div>
    </div>
  );
}