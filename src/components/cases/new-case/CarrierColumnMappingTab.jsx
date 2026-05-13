import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

const AVAILABLE_SYSTEM_FIELDS = [
  { value: "relationship", label: "Relationship (EMP/SPS/DEP)" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "dob", label: "Date of Birth" },
  { value: "gender", label: "Gender" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip", label: "ZIP" },
  { value: "ssn_last4", label: "SSN Last 4" },
  { value: "coverage_type", label: "Coverage Type" },
  { value: "hire_date", label: "Hire Date" },
  { value: "employment_status", label: "Employment Status" },
  { value: "department", label: "Department" },
  { value: "job_title", label: "Job Title" },
  { value: "custom", label: "Store as Custom Field" },
  { value: "ignore", label: "Ignore Column" },
];

const REQUIRED_FIELDS = [
  "relationship",
  "first_name",
  "last_name",
  "dob",
  "gender",
  "zip",
  "coverage_type",
];

export default function CarrierColumnMappingTab({
  mapping,
  onMappingChange,
  censusFile,
  analysisResult,
}) {
  if (!censusFile) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Upload a census file first to configure column mappings.
      </div>
    );
  }

  const mappedFieldCount = Object.values(mapping).filter(f => f && f !== "ignore").length;
  const requiredFieldsMapped = REQUIRED_FIELDS.filter(f =>
    Object.values(mapping).includes(f)
  ).length;
  const mappingComplete = requiredFieldsMapped === REQUIRED_FIELDS.length;

  // Use real headers from analysisResult if available, otherwise show placeholder
  const columns = analysisResult?.headers || [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Map detected columns to system fields. All required fields must be mapped before validation.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
        <p>
          <strong>Mapping Status:</strong> {requiredFieldsMapped}/{REQUIRED_FIELDS.length} required fields mapped
        </p>
      </div>

      {!columns || columns.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 text-center">
          Click "Analyze Census" to detect columns from your file.
        </div>
      ) : (
        <div className="space-y-2">
          {columns.map((col, idx) => {
            const isRequired = REQUIRED_FIELDS.some(rf => col.toLowerCase().includes(rf.replace("_", " ")));
            
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-shrink-0 min-w-fit max-w-32">
                  <span className={`text-xs font-medium truncate ${isRequired ? "text-red-600" : ""}`}>
                    {col} {isRequired && <span className="text-red-600">*</span>}
                  </span>
                </div>
                <Select value={mapping[idx] || ""} onValueChange={(val) => onMappingChange(idx, val)}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Select mapping..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_SYSTEM_FIELDS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      )}

      {!mappingComplete && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Missing required fields:</strong> {REQUIRED_FIELDS.filter(f => !Object.values(mapping).includes(f)).join(", ")}
          </p>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" disabled className="w-full">
        Preview Mapped Data (pending backend)
      </Button>
    </div>
  );
}