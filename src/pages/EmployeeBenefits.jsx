import React, { useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Home, Download, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import BenefitsDashboard from "@/components/employee/BenefitsDashboard";
import EmptyState from "@/components/shared/EmptyState";

/**
 * EmployeeBenefits
 * Portal-based benefits dashboard — view active elections, coverage, costs, and resources.
 */
export default function EmployeeBenefits() {
  const navigate = useNavigate();

  // Get session
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

  // Fetch enrollment
  const { data: enrollment, isLoading } = useQuery({
    queryKey: ["portal-enrollment-detail", session?.enrollment_id],
    queryFn: () =>
      session?.enrollment_id ? base44.entities.EmployeeEnrollment.filter({ id: session.enrollment_id }) : Promise.resolve([]),
    enabled: !!session?.enrollment_id,
  });

  const activeEnrollment = enrollment?.[0];

  // Fetch related plans
  const { data: selectedPlans = [] } = useQuery({
    queryKey: ["portal-selected-plans", activeEnrollment?.selected_plan_id],
    queryFn: async () => {
      if (!activeEnrollment?.selected_plan_id) return [];
      const plans = await base44.entities.BenefitPlan.filter({ id: activeEnrollment.selected_plan_id });
      return plans;
    },
    enabled: !!activeEnrollment?.selected_plan_id,
  });

  const handleLogout = () => {
    sessionStorage.removeItem("portal_session");
    navigate("/employee-portal-login", { replace: true });
  };

  if (!session) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading your benefits...</p>
        </div>
      </div>
    );
  }

  if (!activeEnrollment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-background flex items-center justify-center p-4">
        <div className="max-w-md">
          <EmptyState
            icon={Home}
            title="Benefits Not Found"
            description="No completed enrollment found. Please complete enrollment first."
            actionLabel="Back to Login"
            onAction={() => navigate("/employee-portal-login")}
          />
        </div>
      </div>
    );
  }

  const isWaived = activeEnrollment.status === "waived";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-background">
      {/* Portal header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <p className="font-semibold text-foreground">{session.employee_name}</p>
            <p className="text-xs text-muted-foreground">Benefits Dashboard</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 h-8">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Status banner */}
        <Card className={`border-l-4 ${isWaived ? "border-l-orange-400 bg-orange-50 border-orange-200" : "border-l-green-400 bg-green-50 border-green-200"}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`font-semibold ${isWaived ? "text-orange-900" : "text-green-900"}`}>
                  {isWaived ? "Coverage Waived" : "Enrollment Complete"}
                </p>
                <p className={`text-sm mt-1 ${isWaived ? "text-orange-700" : "text-green-700"}`}>
                  {isWaived
                    ? `Reason: ${activeEnrollment.waiver_reason?.replace(/_/g, " ")}`
                    : `Coverage effective ${format(new Date(activeEnrollment.effective_date || ""), "MMMM d, yyyy")}`}
                </p>
              </div>
              {!isWaived && (
                <Badge className="bg-green-600 text-white flex-shrink-0">
                  ✓ Confirmed
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main content */}
        {!isWaived ? (
          <>
            {/* Benefits dashboard component */}
            <div>
              <BenefitsDashboard enrollment={activeEnrollment} />
            </div>

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle>Helpful Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start gap-2 h-auto py-2">
                    <Download className="w-4 h-4" />
                    <div className="text-left text-xs">
                      <p className="font-medium">Summary of Benefits</p>
                      <p className="text-muted-foreground">PDF document</p>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start gap-2 h-auto py-2">
                    <Phone className="w-4 h-4" />
                    <div className="text-left text-xs">
                      <p className="font-medium">Carrier Support</p>
                      <p className="text-muted-foreground">Contact info</p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Waived state */
          <Card className="bg-muted/30">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                You have waived coverage. If you need to enroll or change your elections, contact your HR department.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Acknowledgment */}
        <Card className="border-l-4 border-l-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-xs text-blue-900">
              <strong>Acknowledgment:</strong> By completing enrollment or waiving coverage, you acknowledge that you have reviewed and understand your benefit elections and coverage information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}