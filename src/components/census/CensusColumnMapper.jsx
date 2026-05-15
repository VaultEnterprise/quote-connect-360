import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { SYSTEM_FIELDS } from "./CensusImportClient";

export default function CensusColumnMapper({
  headers = [],
  onMappingChange,
  mapping = {},
  validationErrors = [],
}) {
  const [localMapping, setLocalMapping] = useState(mapping);

  useEffect(() => {
    setLocalMapping(mapping);
  }, [mapping]);

  const handleMappingChange = (sourceIndex, systemField) => {
    const updated = { ...localMapping, [sourceIndex]: systemField };
    setLocalMapping(updated);
    onMappingChange(updated);
  };

  const getSuggestedField = (headerName) => {
    const normalized = headerName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const match = SYSTEM_FIELDS.find(
      (f) => f.id === normalized || headerName.toLowerCase().includes(f.label.toLowerCase())
    );
    return match?.id || null;
  };

  const requiredFields = SYSTEM_FIELDS.filter((f) => f.required).map((f) => f.id);
  const reversedMapping = {};
  Object.entries(localMapping).forEach(([sourceIdx, systemField]) => {
    if (systemField && systemField !== "ignore") {
      reversedMapping[systemField] = parseInt(sourceIdx, 10);
    }
  });
  const mappedRequiredFields = requiredFields.filter((f) => reversedMapping[f] !== undefined);
  const missingRequired = requiredFields.filter((f) => reversedMapping[f] === undefined);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Map Census Columns</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Match each source column to a system field. Required fields are marked with *.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingRequired.length > 0 && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-xs text-destructive">
                <p className="font-medium">Missing required fields:</p>
                <p>{missingRequired.map((f) => SYSTEM_FIELDS.find((sf) => sf.id === f)?.label).join(", ")}</p>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {headers.map((header, sourceIdx) => {
              const suggested = getSuggestedField(header.name);
              const current = localMapping[sourceIdx] || null;

              return (
                <div key={sourceIdx} className="p-3 border rounded-lg bg-card/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Source Column #{sourceIdx + 1}: <span className="font-mono text-foreground">{header.name}</span>
                  </p>
                  <Select value={current || ""} onValueChange={(val) => handleMappingChange(sourceIdx, val)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder={`${suggested ? `Suggested: ${suggested}` : "Select field or Ignore"}`} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value={null}>-- Select Field --</SelectItem>
                      {SYSTEM_FIELDS.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.label}
                          {field.required ? " *" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Mapped: {mappedRequiredFields.length} of {requiredFields.length} required
            </p>
            <div className="flex flex-wrap gap-1">
              {requiredFields.map((field) => {
                const isMapped = reversedMapping[field] !== undefined;
                return (
                  <span
                    key={field}
                    className={`text-xs px-2 py-1 rounded ${
                      isMapped ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {SYSTEM_FIELDS.find((f) => f.id === field)?.label}
                  </span>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}