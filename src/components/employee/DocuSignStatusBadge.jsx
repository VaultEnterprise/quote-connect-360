import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, Clock, XCircle, AlertCircle, FileSignature, RefreshCw, ExternalLink
} from "lucide-react";

const STATUS_CONFIG = {
  not_sent:  { label: "Not Sent",   icon: AlertCircle,    className: "bg-gray-100 text-gray-600 border-gray-200" },
  sent:      { label: "Awaiting Signature", icon: Clock,  className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  delivered: { label: "Opened",     icon: FileSignature,  className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Signed",     icon: CheckCircle,    className: "bg-green-100 text-green-700 border-green-200" },
  declined:  { label: "Declined",   icon: XCircle,        className: "bg-red-100 text-red-700 border-red-200" },
  voided:    { label: "Voided",     icon: XCircle,        className: "bg-gray-100 text-gray-500 border-gray-200" },
};

/**
 * DocuSignStatusBadge
 * Compact status badge + optional action buttons for broker/admin views.
 *
 * Props:
 *   status           — docusign_status string
 *   documentUrl      — signed document URL (if completed)
 *   onResend         — () => void (optional)
 *   showActions      — bool (default false, for broker table views)
 */
export default function DocuSignStatusBadge({ status = "not_sent", documentUrl, onResend, showActions = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_sent;
  const Icon = cfg.icon;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="outline" className={`gap-1 text-xs ${cfg.className}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </Badge>

      {showActions && (
        <>
          {status === "completed" && documentUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={() => window.open(documentUrl, "_blank")}
            >
              <ExternalLink className="w-3 h-3" /> View
            </Button>
          )}
          {["not_sent", "sent", "delivered", "declined"].includes(status) && onResend && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={onResend}
            >
              <RefreshCw className="w-3 h-3" /> Resend
            </Button>
          )}
        </>
      )}
    </div>
  );
}