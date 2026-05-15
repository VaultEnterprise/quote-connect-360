import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import DocumentAttachmentField from "./DocumentAttachmentField";
import SUSRequiredFormsPanel from "./SUSRequiredFormsPanel";

export default function CarrierRequiredDocumentsTab({
  carrierId,
  attachments,
  onAttachmentChange,
  requiredForms,
  onFormUpdate,
}) {
  const renderCarrierSpecificSection = () => {
    if (carrierId === "sus") {
      return (
        <>
          <SUSRequiredFormsPanel
            requiredForms={requiredForms}
            onFormUpdate={onFormUpdate}
          />
        </>
      );
    }

    if (carrierId === "ast") {
      return (
        <div className="bg-muted/20 border border-muted-foreground/10 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-1">AST Attachments</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Optional supporting documents for AST submission
          </p>
          <p className="text-xs text-muted-foreground italic">
            No specific required documents at this time. You may attach optional supporting documentation below.
          </p>
        </div>
      );
    }

    if (carrierId === "triad") {
      return (
        <div className="bg-muted/20 border border-muted-foreground/10 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-1">Triad Attachments</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Optional supporting documents for Triad submission
          </p>
          <p className="text-xs text-muted-foreground italic">
            No specific required documents at this time. You may attach optional supporting documentation below.
          </p>
        </div>
      );
    }

    if (carrierId === "mecMvp") {
      return (
        <div className="bg-muted/20 border border-muted-foreground/10 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-1">MEC / MVP Attachments</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Optional supporting documents for MEC / MVP review
          </p>
          <p className="text-xs text-muted-foreground italic">
            No specific required documents at this time. You may attach optional supporting documentation below.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Attach supporting documents required for carrier submission.
      </p>

      {renderCarrierSpecificSection()}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p>
          <strong>Note:</strong> Files are stored locally for this phase. Backend persistence will be integrated in a later phase.
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Additional Attachments</h4>
        {(attachments || []).map((attachment, idx) => (
          <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-semibold">{attachment.file?.name}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {attachment.file?.size ? `${(attachment.file.size / 1024).toFixed(1)} KB` : ""}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => onAttachmentChange(idx, "remove")}
                className="text-muted-foreground hover:text-destructive text-xs"
              >
                Remove
              </button>
            </div>
            {attachment.notes && (
              <p className="text-xs text-muted-foreground">{attachment.notes}</p>
            )}
          </div>
        ))}

        <div className="border border-dashed border-border rounded-lg p-4">
          <Label className="text-xs font-medium block mb-2">Attach Additional Document</Label>
          <DocumentAttachmentField
            file={null}
            onFileSelect={(file) => onAttachmentChange(null, "add", file)}
            onRemove={() => {}}
            acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg"
          />
        </div>

        {(attachments?.length || 0) > 0 && (
          <div>
            <Label className="text-xs font-medium">Notes (optional)</Label>
            <Textarea
              placeholder="Add notes about the attached documents..."
              className="text-xs h-16 mt-1"
            />
          </div>
        )}
      </div>
    </div>
  );
}