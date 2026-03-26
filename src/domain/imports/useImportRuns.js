import { base44 } from "@/api/base44Client";
import { inspectCensusFile, runCensusImport } from "@/services/import/censusImportClient";

export { inspectCensusFile, runCensusImport };

export async function listImportRuns(limit = 50) {
  const response = await base44.entities.ImportRun.list("-created_date", limit);
  return response || [];
}