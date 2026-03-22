import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Send, Eye, XCircle, FileSignature, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const EVENT_CONFIG = {
  not_sent:  { icon: AlertCircle, label: "Not yet sent",         color: "text-gray-400" },
  sent:      { icon: Send,        label: "Sent for signature",   color: "text-blue-500" },
  delivered: { icon: Eye,         label: "Opened by recipient",  color: "text-yellow-500" },
  completed: { icon: CheckCircle, label: "Signed & completed",   color: "text-green-600" },
  declined:  { icon: XCircle,     label: "Signing declined",     color: "text-red-500" },
  voided:    { icon: XCircle,     label: "Envelope voided",      color: "text-gray-500" },
};

/**
 * DocuSignAuditTrail
 * Timeline of DocuSign events for an enrollment record.
 *
 * Props:
 *   enrollment — EmployeeEnrollment
 */
export default function DocuSignAuditTrail({ enrollment }) {
  if (!enrollment) return null;

  const events = [];

  if (enrollment.docusign_sent_at) {
    events.push({ type: "sent", timestamp: enrollment.docusign_sent_at });
  }
  if (enrollment.docusign_status === "delivered" || enrollment.docusign_signed_at) {
    events.push({ type: "delivered", timestamp: null });
  }
  if (enrollment.docusign_signed_at) {
    events.push({ type: "completed", timestamp: enrollment.docusign_signed_at });
  }
  if (enrollment.docusign_status === "declined") {
    events.push({ type: "declined", timestamp: null });
  }
  if (enrollment.docusign_status === "voided") {
    events.push({ type: "voided", timestamp: null });
  }

  if (!events.length) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-muted-foreground" />
            DocuSign Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">No signing activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-muted-foreground" />
          DocuSign Audit Trail
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((evt, i) => {
            const cfg = EVENT_CONFIG[evt.type] || EVENT_CONFIG.not_sent;
            const Icon = cfg.icon;
            const isLast = i === events.length - 1;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-muted ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!isLast && <div className="w-0.5 h-4 bg-border mt-1" />}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
                  {evt.timestamp && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(evt.timestamp), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                  {evt.type === "declined" && enrollment.docusign_declined_reason && (
                    <p className="text-[11px] text-red-600 mt-0.5">
                      Reason: {enrollment.docusign_declined_reason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {enrollment.docusign_envelope_id && (
          <p className="text-[10px] text-muted-foreground mt-3 font-mono border-t pt-2">
            Envelope ID: {enrollment.docusign_envelope_id}
          </p>
        )}
      </CardContent>
    </Card>
  );
}