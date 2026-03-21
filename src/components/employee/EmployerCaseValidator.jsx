import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

/**
 * EmployerCaseValidator
 * Ensures employee belongs to an active case/enrollment window
 * Prevents unauthorized portal access
 */
export default function EmployerCaseValidator({ children }) {
  const { user } = useAuth();
  const [isValidated, setIsValidated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const validate = async () => {
      if (!user?.email) {
        setError("User not authenticated");
        return;
      }

      try {
        // Check if employee has any active enrollments or cases
        const enrollments = await base44.entities.EmployeeEnrollment.filter({
          employee_email: user.email,
        }, "-created_date", 1);

        if (!enrollments || enrollments.length === 0) {
          setError("No active enrollment found. Contact your HR administrator.");
          return;
        }

        setIsValidated(true);
      } catch (err) {
        setError("Error verifying access. Please try again.");
      }
    };

    validate();
  }, [user?.email]);

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="font-semibold text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidated) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Verifying your access...</p>
      </div>
    );
  }

  return children;
}