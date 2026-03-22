import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSignature, CheckCircle, XCircle, Clock, RefreshCw,
  Mail, ExternalLink, AlertCircle, Loader2
} from "lucide-react";

/**
 * DocuSignSigningPane
 * Shown after enrollment submit. Handles the embedded signing ceremony
 * or email-based fallback. Polls for status if embedded not available.
 *
 * Props:
 *   enrollment       — EmployeeEnrollment record (with docusign_* fields)
 *   onSigned         — () => void — called when signing is confirmed complete
 *   onSkip           — () => void — proceed without signing (e.g. HR manual flow)
 */
export default function DocuSignSigningPane({ enrollment, onSigned, onSkip }) {
  const [signingUrl, setSigningUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [status, setStatus] = useState(enrollment?.docusign_status || "not_sent");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const iframeRef = useRef(null);
  const pollRef = useRef(null);

  // Listen for DocuSign iframe completion events
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && typeof e.data === "string") {
        if (e.data.includes("signing_complete")) {
          setStatus("completed");
          setSigningUrl(null);
          if (onSigned) onSigned();
        } else if (e.data.includes("decline")) {
          setStatus("declined");
          setSigningUrl(null);
        } else if (e.data.includes("cancel") || e.data.includes("session_timeout")) {
          setSigningUrl(null);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSigned]);

  // Poll for status updates every 10s while waiting
  useEffect(() => {
    if (["completed", "declined", "voided"].includes(status)) return;
    pollRef.current = setInterval(async () => {
      try {
        const records = await base44.entities.EmployeeEnrollment.filter(
          { employee_email: enrollment?.employee_email },
          "-created_date",
          1
        );
        const latest = records?.[0];
        if (latest?.docusign_status && latest.docusign_status !== status) {
          setStatus(latest.docusign_status);
          if (latest.docusign_status === "completed" && onSigned) onSigned();
        }
      } catch (_) {}
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, [status, enrollment?.employee_email, onSigned]);

  const launchEmbeddedSigning = async () => {
    setLoadingUrl(true);
    setUrlError(null);
    try {
      const res = await base44.functions.invoke("getDocuSignSigningURL", {
        enrollment_id: enrollment?.id,
        return_url: window.location.href,
      });
      if (res?.data?.signing_url) {
        setSigningUrl(res.data.signing_url);
        setStatus("delivered");
      } else {
        setUrlError("Could not retrieve signing URL. Please use the email link instead.");
      }
    } catch (err) {
      setUrlError("Signing session unavailable. Please check your email for the signing link.");
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await base44.functions.invoke("sendDocuSignEnvelope", {
        enrollment_id: enrollment?.id,
        resend: true,
      });
      setResent(true);
    } catch (_) {
    } finally {
      setResending(false);
    }
  };

  // ── Completed ───────────────────────────────────────────────────────────────
  if (status === "completed") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="font-bold text-green-900 text-lg">Enrollment Form Signed!</h3>
          <p className="text-sm text-green-800">
            Your enrollment documents have been signed and recorded. You'll receive a copy at your email address.
          </p>
          {enrollment?.docusign_document_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(enrollment.docusign_document_url, "_blank")}
            >
              <ExternalLink className="w-4 h-4" /> View Signed Document
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Declined ────────────────────────────────────────────────────────────────
  if (status === "declined") {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-900">Signing Declined</h3>
              <p className="text-sm text-red-700">You declined to sign the enrollment documents.</p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-red-100 text-xs text-red-800">
            <strong>Important:</strong> Your benefit elections will not be finalized until the enrollment form is signed. 
            Contact your HR administrator if you have concerns about the document.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 border-red-300 text-red-700 hover:bg-red-100"
              disabled={resending}
              onClick={handleResend}
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Re-send Document
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground" onClick={onSkip}>
              Contact HR
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Embedded iframe signing ─────────────────────────────────────────────────
  if (signingUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-primary" />
            Sign Your Enrollment Form
          </p>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSigningUrl(null)}>
            Close
          </Button>
        </div>
        <div className="rounded-xl border overflow-hidden" style={{ height: 600 }}>
          <iframe
            ref={iframeRef}
            src={signingUrl}
            className="w-full h-full border-0"
            title="DocuSign Enrollment Form"
            allow="camera"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Powered by DocuSign · Your signature is legally binding
        </p>
      </div>
    );
  }

  // ── Default: prompt to sign ─────────────────────────────────────────────────
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FileSignature className="w-6 h-6 text-blue-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-blue-900">One More Step — Sign Your Enrollment Form</h3>
              <Badge className="bg-blue-200 text-blue-800 text-[10px]">Required</Badge>
            </div>
            <p className="text-sm text-blue-800 mt-1">
              Your elections have been submitted. Please sign the enrollment form to finalize your benefits.
            </p>
          </div>
        </div>

        {/* Status line */}
        <div className="flex items-center gap-2 text-sm">
          {status === "sent" || status === "delivered" ? (
            <>
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">
                Signing request sent to <strong>{enrollment?.employee_email}</strong>
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">Ready to send your signing request</span>
            </>
          )}
        </div>

        {urlError && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {urlError}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={launchEmbeddedSigning}
            disabled={loadingUrl}
          >
            {loadingUrl ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSignature className="w-4 h-4" />
            )}
            {loadingUrl ? "Loading Signing Session..." : "Sign Now (In-App)"}
          </Button>

          {(status === "sent" || status === "delivered" || resent) && (
            <Button
              variant="outline"
              className="flex-1 gap-2"
              disabled={resending}
              onClick={handleResend}
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {resent ? "Email Resent!" : "Resend via Email"}
            </Button>
          )}
        </div>

        <p className="text-xs text-blue-700 text-center">
          Signing is powered by DocuSign. Your document will be stored securely and emailed to you upon completion.
        </p>

        <div className="border-t border-blue-200 pt-3">
          <button
            className="text-xs text-blue-600 underline underline-offset-2 hover:text-blue-800"
            onClick={onSkip}
          >
            Skip for now — I'll sign via email
          </button>
        </div>
      </CardContent>
    </Card>
  );
}