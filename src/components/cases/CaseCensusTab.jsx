import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import CensusUploadModal from "@/components/census/CensusUploadModal";
import CensusMemberTable from "@/components/census/CensusMemberTable";
import GradientAIAnalysisPanel from "@/components/census/GradientAIAnalysisPanel";
import CensusImportStatusPanel from "@/components/census/CensusImportStatusPanel";
import CensusValidationDetailsDialog from "@/components/census/CensusValidationDetailsDialog";

/**
 * CaseCensusTab
 * Lists all CensusVersion records for a case.
 * Supports upload, version selection, and inline member table expansion.
 *
 * Props:
 *   caseId          — string (BenefitCase.id)
 *   censusVersions  — CensusVersion[]
 */
export default function CaseCensusTab({ caseId, censusVersions, onOpenTxQuote, txQuoteAvailable }) {
  const [showUpload, setShowUpload] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const { data: importJobs = [], error: importJobError } = useQuery({
    queryKey: ["census-import-job", caseId],
    queryFn: () => base44.entities.CensusImportJob.filter({ case_id: caseId }, "-created_date", 10),
    enabled: !!caseId,
  });

  const { data: validationResults = [] } = useQuery({
    queryKey: ["census-validation-results", caseId],
    queryFn: async () => {
      const latestJob = await base44.entities.CensusImportJob.filter({ case_id: caseId }, "-created_date", 1).then((items) => items[0] || null);
      if (!latestJob) return [];
      return base44.entities.CensusValidationResult.filter({ census_import_id: latestJob.census_import_id }, "row_number", 500);
    },
    enabled: !!caseId,
  });

  const latestJob = importJobs[0] || null;
  const reprocessMutation = useMutation({
    mutationFn: () => latestJob ? base44.functions.invoke("reprocessCensusImport", { census_import_id: latestJob.census_import_id }) : Promise.resolve(),
  });

  const toggleVersion = (id) => {
    setSelectedVersionId(prev => (prev === id ? null : id));
  };

  return (
    <>
      {importJobError && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          Census import system not initialized. Entity missing.
        </div>
      )}

      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <h3 className="text-sm font-medium text-muted-foreground">{censusVersions.length} version(s)</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowUpload(true)} disabled={!!importJobError}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Census
          </Button>
          {txQuoteAvailable && (
            <Button size="sm" variant="outline" onClick={onOpenTxQuote}>
              TxQuote
            </Button>
          )}
        </div>
      </div>

      {latestJob && (
        <div className="space-y-3 mb-4">
          <CensusImportStatusPanel
            job={latestJob}
            onReprocess={() => reprocessMutation.mutate()}
            reprocessing={reprocessMutation.isPending}
          />
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowValidationDetails(true)}>
              View Validation Details
            </Button>
          </div>
        </div>
      )}

      {censusVersions.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Census Uploaded"
          description="Upload a census file to begin the quoting process"
          actionLabel="Upload Census"
          onAction={() => setShowUpload(true)}
        />
      ) : (
        <div className="space-y-3">
          {censusVersions.map((cv) => (
            <Card key={cv.id} className={selectedVersionId === cv.id ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">
                      Version {cv.version_number} — {cv.file_name || "Census File"}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{cv.total_employees || 0} employees</span>
                      <span>{cv.total_dependents || 0} dependents</span>
                      {cv.validation_errors > 0 && (
                        <span className="text-destructive">{cv.validation_errors} errors</span>
                      )}
                      {cv.validation_warnings > 0 && (
                        <span className="text-amber-600">{cv.validation_warnings} warnings</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={cv.status} />
                    <Button
                      variant="outline" size="sm" className="text-xs"
                      onClick={() => toggleVersion(cv.id)}
                    >
                      {selectedVersionId === cv.id ? "Hide Members" : "View Members"}
                    </Button>
                  </div>
                </div>
                {selectedVersionId === cv.id && (
                  <div className="space-y-4 mt-2">
                    <GradientAIAnalysisPanel censusVersionId={cv.id} caseId={caseId} />
                    <CensusMemberTable censusVersionId={cv.id} caseId={caseId} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showUpload && (
        <CensusUploadModal
          caseId={caseId}
          currentVersionCount={censusVersions.length}
          open={showUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      <CensusValidationDetailsDialog
        open={showValidationDetails}
        onOpenChange={setShowValidationDetails}
        results={validationResults}
      />
    </>
  );
}