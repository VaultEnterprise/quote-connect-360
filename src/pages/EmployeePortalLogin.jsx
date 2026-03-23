import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Heart, Loader, Mail } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

/**
 * EmployeePortalLogin
 * Token-based portal access — employees use access token to unlock enrollment without app login.
 * Resolves enrollment record and validates token + email match.
 */
export default function EmployeePortalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Verify token against EmployeeEnrollment
      const enrollments = await base44.entities.EmployeeEnrollment.filter({
        employee_email: email,
        access_token: token,
      });

      if (!enrollments || enrollments.length === 0) {
        setError("Invalid email or access token. Please check and try again.");
        setLoading(false);
        return;
      }

      const enrollment = enrollments[0];

      // 2. Verify enrollment window is still open
      const enrollmentWindows = await base44.entities.EnrollmentWindow.filter({
        id: enrollment.enrollment_window_id,
      });

      if (!enrollmentWindows || enrollmentWindows.length === 0) {
        setError("This enrollment is no longer available.");
        setLoading(false);
        return;
      }

      const window = enrollmentWindows[0];

      // 3. Check if enrollment period is still active or has ended
      const now = new Date();
      const endDate = new Date(window.end_date);
      
      if (now > endDate && window.status === "closed") {
        setError("This enrollment period has ended.");
        setLoading(false);
        return;
      }

      // 4. Verify case exists and is active
      const cases = await base44.entities.BenefitCase.filter({
        id: enrollment.case_id,
      });

      if (!cases || cases.length === 0) {
        setError("Case not found. Please contact your administrator.");
        setLoading(false);
        return;
      }

      // 5. Store secure session token (NOT access_token in plain text)
      const sessionToken = btoa(`${enrollment.id}:${token}:${Date.now()}`);
      sessionStorage.setItem("portal_session_token", sessionToken);
      sessionStorage.setItem("portal_enrollment_id", enrollment.id);
      sessionStorage.setItem("portal_case_id", enrollment.case_id);
      sessionStorage.setItem("portal_session_timestamp", new Date().toISOString());

      // 6. Redirect based on enrollment status
      if (enrollment.status === "invited" || enrollment.status === "started") {
        navigate("/employee-enrollment", { replace: true });
      } else if (enrollment.status === "completed" || enrollment.status === "waived") {
        navigate("/employee-benefits", { replace: true });
      } else {
        navigate("/employee-enrollment", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Benefits Enrollment</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Secure Portal Access</p>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-sm">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use the email address associated with your enrollment invitation.
              </p>
            </div>

            <div>
              <Label htmlFor="token" className="text-sm">
                Access Token <span className="text-destructive">*</span>
              </Label>
              <Input
                id="token"
                type="password"
                placeholder="Paste your access token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="mt-1.5 font-mono text-xs"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                This was included in your enrollment invitation email.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full mt-6"
              disabled={loading || !email || !token}
            >
              {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Verifying..." : "Access My Enrollment"}
            </Button>
          </form>

          <div className="space-y-3 pt-4 border-t text-xs text-muted-foreground">
            <div>
              <p className="font-semibold mb-1.5">Need Help?</p>
              <div className="space-y-1.5">
                <button
                  onClick={() => setShowPasswordReset(!showPasswordReset)}
                  className="flex items-center gap-1.5 text-primary hover:underline text-xs font-medium"
                >
                  <Mail className="w-3 h-3" /> Resend Invitation Email
                </button>
                {showPasswordReset && (
                  <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/10 space-y-2">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                    <button className="w-full px-2 py-1 text-xs bg-primary text-white rounded hover:opacity-90">
                      Send Invitation
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="border-t pt-2">
              <p>Contact your HR department or <a href="mailto:support@connectquote.io" className="text-primary hover:underline">benefits administrator</a> for further assistance.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}