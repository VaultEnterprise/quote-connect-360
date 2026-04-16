import { base44 } from "@/api/base44Client";
import { CENSUS_ALLOWED_MEMBER_FIELDS } from "@/contracts/importContracts";
import { validateWritePayload } from "@/validation/appContracts";

const IMPORT_REQUEST_KEYS = ["caseId", "fileUrl", "fileName", "mapping", "notes", "currentVersionCount", "dryRun"];

export async function inspectCensusFile(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  const response = await base44.functions.invoke("inspectCensusFile", {
    fileUrl: file_url,
    fileName: file.name,
  });
  return { fileUrl: file_url, ...response.data };
}

export async function runCensusImport(request) {
  const payload = validateWritePayload(request, IMPORT_REQUEST_KEYS, "census import request", ["caseId", "fileUrl", "mapping"]);
  Object.keys(payload.mapping || {}).forEach((fieldKey) => {
    if (!CENSUS_ALLOWED_MEMBER_FIELDS.includes(fieldKey)) {
      throw new Error(`Unsupported census field mapping: ${fieldKey}`);
    }
  });

  const response = await base44.functions.invoke("importCensusFile", payload);
  return response.data;
}