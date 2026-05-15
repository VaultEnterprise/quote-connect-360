import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import DocumentAttachmentField from "./DocumentAttachmentField";

const SUS_FORMS = [
  {
    id: "saraForm",
    label: "Upload SARA Form",
    description: "Submit the required SARA form",
  },
  {
    id: "employeeQuestionnaire",
    label: "Upload Employee Questionnaire",
    description: "Employee questionnaire for SUS underwriting",
  },
  {
    id: "saraChecklist",
    label: "Upload SARA Checklist",
    description: "SARA checklist to ensure all required items are present",
  },
];

export default function SUSRequiredFormsPanel({ requiredForms, onFormUpdate }) {
  return (
    <div className="space-y-4 bg-muted/20 border border-muted-foreground/10 rounded-lg p-4">
      <div>
        <h4 className="font-semibold text-sm">SUS Required Forms</h4>
        <p className="text-xs text-muted-foreground">Upload the required SUS submission documents</p>
      </div>

      <div className="space-y-4">
        {SUS_FORMS.map((form) => {
          const formData = requiredForms[form.id];
          const isSelected = formData?.selected || false;

          return (
            <div key={form.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`form-${form.id}`}
                  checked={isSelected}
                  onCheckedChange={() => onFormUpdate(form.id, "selected", !isSelected)}
                  className="h-4 w-4"
                />
                <Label htmlFor={`form-${form.id}`} className="text-sm font-medium cursor-pointer">
                  {form.label}
                </Label>
                {isSelected && formData.file && (
                  <Badge variant="default" className="text-xs h-fit bg-green-600">
                    Uploaded
                  </Badge>
                )}
              </div>

              {isSelected && (
                <div className="ml-6 space-y-2">
                  <p className="text-xs text-muted-foreground">{form.description}</p>
                  <DocumentAttachmentField
                    label={form.label}
                    file={formData.file}
                    onFileSelect={(file) => onFormUpdate(form.id, "file", file)}
                    onRemove={() => onFormUpdate(form.id, "file", null)}
                    acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
                  />
                  <div>
                    <Label className="text-xs">Notes (optional)</Label>
                    <Textarea
                      placeholder="Add any notes about this document..."
                      value={formData.notes || ""}
                      onChange={(e) => onFormUpdate(form.id, "notes", e.target.value)}
                      className="mt-1 text-xs h-16"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}