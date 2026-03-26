import { validateWritePayload } from "@/validation/appContracts";
import { CENSUS_ALLOWED_MEMBER_FIELDS } from "@/contracts/importContracts";

const IMPORT_REQUEST_KEYS = ["caseId", "fileUrl", "fileName", "mapping", "notes", "currentVersionCount", "dryRun"];

export function validateCensusMapping(mapping = {}) {
  Object.keys(mapping).forEach((fieldKey) => {
    if (!CENSUS_ALLOWED_MEMBER_FIELDS.includes(fieldKey)) {
      throw new Error(`Unsupported census field mapping: ${fieldKey}`);
    }
  });
  return mapping;
}

export function validateCensusImportRequest(request) {
  const payload = validateWritePayload(request, IMPORT_REQUEST_KEYS, "census import request", ["caseId", "fileUrl", "mapping"]);
  validateCensusMapping(payload.mapping || {});
  return payload;
}