import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Calendar, Users, DollarSign, AlertCircle, FileSignature } from "lucide-react";
import { format } from "date-fns";
import DocuSignStatusBadge from "./DocuSignStatusBadge";
import DocuSignSigningPane from "./DocuSignSigningPane";
import DocuSignAuditTrail from "./DocuSignAuditTrail";

/**
 * BenefitsDashboard
 * Post-enrollment "My Benefits" summary with plans, coverage, dates, and cost tracker.
 *
 * Props:
 *   enrollment     — EmployeeEnrollment
 *   onPrint        — () => void (optional)
 */
export default function BenefitsDashboard({ enrollment, onPrint }) {
  const [showSigning, setShowSigning] = useState(false);
  if (!enrollment) return null;

  const docuStatus = enrollment.docusign_status || "not_sent";
  const needsSignature = enrollment.status === "completed" && docuStatus !== "completed";

  const coverageDate = enrollment.effective_date
    ? new Date(enrollment.effective_date)
    : null;

  // Placeholder for cost tracking — would come from plan rate data in real implementation
  const deductible = enrollment.selected_plan_deductible || 1500;
  const oop_max = enrollment.selected_plan_oop_max || 5000;
  const claimed = 0; // Would come from claims data
  const claimedPct = Math.round((claimed / oop_max) * 100);

  return (
    <div className="space-y-6">
      {/* Hero — elected plan(s) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Benefits</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your benefit elections are active</p>
          </div>
          {onPrint && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onPrint}>
              <Download className="w-4 h-4" /> Download Summary
            </Button>
          )}
        </div>

        {enrollment.status === "completed" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800">Coverage is active</p>
                {coverageDate && (
                  <p className="text-sm text-green-700 mt-0.5">
                    Effective {format(coverageDate, "MMMM d, yyyy")}
                  </p>
                )}
              </div>
              <DocuSignStatusBadge status={docuStatus} documentUrl={enrollment.docusign_document_url} />
            </CardContent>
          </Card>
        )}

        {/* DocuSign action banner — shown if enrollment complete but not signed */}
        {needsSignature && !showSigning && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileSignature className="w-5 h-5 text-yellow-700 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">Signature Required</p>
                  <p className="text-xs text-yellow-700">Your enrollment form needs to be signed to be finalized.</p>
                </div>
              </div>
              <Button size="sm" className="flex-shrink-0 gap-1.5" onClick={() => setShowSigning(true)}>
                <FileSignature className="w-4 h-4" /> Sign Now
              </Button>
            </CardContent>
          </Card>
        )}

        {showSigning && (
          <DocuSignSigningPane
            enrollment={enrollment}
            onSigned={() => setShowSigning(false)}
            onSkip={() => setShowSigning(false)}
          />
        )}
      </div>

      {/* Coverage info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {coverageDate && (
          <Card>
            <CardContent className="p-3 text-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xs text-muted-foreground">Coverage Start</p>
              <p className="text-sm font-semibold mt-0.5">{format(coverageDate, "MMM d")}</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Coverage Tier</p>
            <p className="text-sm font-semibold mt-0.5 capitalize">
              {enrollment.coverage_tier?.replace(/_/g, " ") || "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className="mt-1 capitalize bg-green-100 text-green-700">
              {enrollment.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Elected plans */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Your Elected Plans</h2>
        <div className="space-y-2">
          {/* Multi-plan support: render all plan types if stored as array, else fall back to single */}
          {Array.isArray(enrollment.plan_elections) && enrollment.plan_elections.length > 0
            ? enrollment.plan_elections.map((plan, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{plan.plan_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {plan.plan_type} · {plan.carrier || ""}
                        </p>
                      </div>
                      <Badge className="bg-primary/10 text-primary flex-shrink-0 capitalize">{plan.plan_type || "Active"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            : enrollment.selected_plan_name && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{enrollment.selected_plan_name}</p>
                        {enrollment.selected_plan_id && (
                          <p className="text-xs text-muted-foreground mt-0.5">Plan ID: {enrollment.selected_plan_id}</p>
                        )}
                      </div>
                      <Badge className="bg-primary/10 text-primary flex-shrink-0">Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              )
          }
          {enrollment.dependents?.length > 0 && (
            <Card className="border-muted">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Covered Dependents
                </p>
                <div className="space-y-1.5">
                  {enrollment.dependents.map((dep, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Users className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span>{dep.name || `${dep.firstName} ${dep.lastName}`}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        ({dep.relationship?.replace(/_/g, " ")})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cost & OOP tracker (medical plans only) */}
      {enrollment.selected_plan_name?.toLowerCase().includes("medical") && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Out-of-Pocket Tracker</h2>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Deductible</p>
                  <p className="text-lg font-bold text-primary mt-1">${deductible.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">per year</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Out-of-Pocket Max</p>
                  <p className="text-lg font-bold text-primary mt-1">${oop_max.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">per year</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Amount Claimed</span>
                  <span>${claimed.toLocaleString()} of ${oop_max.toLocaleString()}</span>
                </div>
                <Progress value={claimedPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{claimedPct}% of annual maximum</p>
              </div>

              {claimed === 0 && (
                <div className="rounded-lg bg-muted/40 p-2 flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>No claims processed yet. This updates after services are billed.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* DocuSign audit trail */}
      {enrollment.docusign_envelope_id && (
        <DocuSignAuditTrail enrollment={enrollment} />
      )}

      {/* Plan documents & carrier contacts */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Plan Documents & Carrier</h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Effective Date
              </p>
              <p className="text-sm font-medium">
                {coverageDate ? format(coverageDate, "MMMM d, yyyy") : "Not available"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Summary of Benefits & Coverage (SBC)
              </p>
              <p className="text-xs text-muted-foreground mb-2">Your SBC document is available from your carrier's member portal or via your HR department.</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => window.print()}>
                <Download className="w-3.5 h-3.5 mr-1" /> Download ID Cards & Summary
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Member Services
              </p>
              <p className="text-xs text-muted-foreground">Call the member services number on the back of your insurance card for claims, authorizations, and provider searches.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}