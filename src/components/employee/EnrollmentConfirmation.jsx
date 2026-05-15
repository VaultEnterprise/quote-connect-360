import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Mail, Calendar, Users } from "lucide-react";
import { format } from "date-fns";
import DocuSignSigningPane from "./DocuSignSigningPane";
import DocuSignAuditTrail from "./DocuSignAuditTrail";

/**
 * EnrollmentConfirmation
 * Full-screen confirmation shown after enrollment submission before page reload.
 *
 * Props:
 *   enrollment  — EmployeeEnrollment (freshly completed)
 *   isWaived    — bool
 *   onDone      — () => void  (triggers actual page reload)
 */
export default function EnrollmentConfirmation({ enrollment, isWaived, onDone }) {
  const confirmationNumber = `ENR-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const docuStatus = enrollment?.docusign_status || "not_sent";
  const needsSignature = !isWaived && !["completed"].includes(docuStatus);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {isWaived ? "Coverage Waived" : "Enrollment Complete!"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isWaived
              ? "Your waiver has been recorded."
              : "Your benefit elections have been submitted successfully."}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono">
          Confirmation # {confirmationNumber}
        </Badge>
      </div>

      {/* Summary card */}
      {!isWaived && enrollment && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <p className="text-sm font-semibold">Your Elections</p>
            {enrollment.coverage_tier && (
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" /> Coverage Tier
                </div>
                <span className="text-sm font-medium capitalize">
                  {enrollment.coverage_tier.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {enrollment.selected_plan_name && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Plan Elected</span>
                <span className="text-sm font-medium">{enrollment.selected_plan_name}</span>
              </div>
            )}
            {enrollment.effective_date && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" /> Effective Date
                </div>
                <span className="text-sm font-medium">
                  {format(new Date(enrollment.effective_date), "MMMM d, yyyy")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* DocuSign Signing — shown if not yet signed */}
      {needsSignature && (
        <DocuSignSigningPane
          enrollment={enrollment}
          onSigned={() => {}}
          onSkip={() => {}}
        />
      )}

      {/* DocuSign signed document download */}
      {!isWaived && docuStatus === "completed" && enrollment?.docusign_document_url && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-green-900 text-sm">Enrollment Form Signed</p>
              <p className="text-xs text-green-700 mt-0.5">Your signed document is available for download.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-green-300 text-green-700 hover:bg-green-100 flex-shrink-0"
              onClick={() => window.open(enrollment.docusign_document_url, "_blank")}
            >
              <Download className="w-4 h-4" /> Download
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DocuSign audit trail */}
      {!isWaived && enrollment?.docusign_envelope_id && (
        <DocuSignAuditTrail enrollment={enrollment} />
      )}

      {/* Next steps */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 space-y-2">
          <p className="font-semibold text-blue-900 text-sm">What happens next?</p>
          <ul className="text-xs text-blue-800 space-y-1.5 list-disc pl-4">
            <li>A confirmation email will be sent to your registered email address.</li>
            {!isWaived && <li>Sign your enrollment form via DocuSign to finalize your elections.</li>}
            <li>Your ID cards and plan documents will be mailed within 7–10 business days.</li>
            <li>Coverage is effective on your plan's effective date.</li>
            {!isWaived && <li>Contact HR if you need to make changes due to a qualifying life event.</li>}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={() => window.print()}>
          <Download className="w-4 h-4" /> Print Summary
        </Button>
        <Button className="flex-1" onClick={onDone}>
          View My Benefits
        </Button>
      </div>
    </div>
  );
}