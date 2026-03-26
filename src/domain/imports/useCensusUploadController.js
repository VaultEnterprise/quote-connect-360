import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CENSUS_FIELDS } from "@/contracts/importContracts";
import { inspectCensusFile, runCensusImport } from "@/domain/imports/useImportRuns";
import { assertBlockingValidationGate } from "@/validation/blockingValidationGate";

export const CENSUS_UPLOAD_STEPS = ["upload", "mapping", "validate", "done"];

export function useCensusUploadController({ caseId, currentVersionCount, onClose }) {
  useMemo(() => {
    assertBlockingValidationGate({ pageKey: "CensusUploadModal", routeKey: "census" });
    return true;
  }, []);

  const queryClient = useQueryClient();
  const [step, setStep] = useState("upload");
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [headers, setHeaders] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [mapping, setMapping] = useState({});
  const [validationSummary, setValidationSummary] = useState(null);
  const [fieldStats, setFieldStats] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [transformedPreview, setTransformedPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setFileUrl("");
    setNotes("");
    setHeaders([]);
    setSampleRows([]);
    setRowCount(0);
    setMapping({});
    setValidationSummary(null);
    setFieldStats(null);
    setDuplicates([]);
    setTransformedPreview([]);
    setLoading(false);
  };

  const handleFile = async (nextFile) => {
    setLoading(true);
    const inspection = await inspectCensusFile(nextFile);
    setFile(nextFile);
    setFileUrl(inspection.fileUrl);
    setHeaders(inspection.headers || []);
    setSampleRows(inspection.sample_rows || []);
    setRowCount(inspection.row_count || 0);
    setMapping(inspection.suggested_mapping || {});
    setStep("mapping");
    setLoading(false);
  };

  const handleValidate = async () => {
    setLoading(true);
    const result = await runCensusImport({
      mode: "validate",
      caseId,
      fileUrl,
      fileName: file?.name,
      mapping,
      notes,
      currentVersionCount,
    });
    setValidationSummary(result.validation_summary || null);
    setFieldStats(result.field_stats || null);
    setDuplicates(result.duplicates || []);
    setTransformedPreview(result.transformed_preview || []);
    setStep("validate");
    setLoading(false);
  };

  const handleImport = async () => {
    setLoading(true);
    await runCensusImport({
      mode: "import",
      caseId,
      fileUrl,
      fileName: file?.name,
      mapping,
      notes,
      currentVersionCount,
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["census-versions", caseId] }),
      queryClient.invalidateQueries({ queryKey: ["census-all"] }),
      queryClient.invalidateQueries({ queryKey: ["census-members"] }),
      queryClient.invalidateQueries({ queryKey: ["cases"] }),
      queryClient.invalidateQueries({ queryKey: ["case", caseId] }),
    ]);
    setStep("done");
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const mappedRequired = CENSUS_FIELDS.filter((field) => field.required && !mapping[field.key]);
  const canProceedFromMapping = mappedRequired.length === 0 && headers.length > 0;

  return {
    step,
    file,
    notes,
    headers,
    sampleRows,
    rowCount,
    mapping,
    validationSummary,
    fieldStats,
    duplicates,
    transformedPreview,
    loading,
    mappedRequired,
    canProceedFromMapping,
    setNotes,
    setMapping,
    handleFile,
    handleValidate,
    handleImport,
    handleClose,
    reInspect: () => file && handleFile(file),
  };
}