import importManifest from "@/config/import_manifest.json";
import pageSpecs from "@/config/page_specs.json";
import resolverContracts from "@/config/resolver_contracts.json";
import { validateWritePayload } from "@/validation/appContracts";
import { CENSUS_ALLOWED_MEMBER_FIELDS } from "@/contracts/importContracts";

const IMPORT_REQUEST_KEYS = ["mode", "caseId", "fileUrl", "fileName", "mapping", "notes", "currentVersionCount"];
const VALID_IMPORT_MODES = ["inspect", "validate", "import"];

export function validateCensusMapping(mapping = {}) {
  Object.keys(mapping).forEach((fieldKey) => {
    if (!CENSUS_ALLOWED_MEMBER_FIELDS.includes(fieldKey)) {
      throw new Error(`Unsupported census field mapping: ${fieldKey}`);
    }
  });
  return mapping;
}

export function validateCensusImportRequest(request) {
  const payload = validateWritePayload(request, IMPORT_REQUEST_KEYS, "census import request", ["mode", "fileUrl"]);
  if (!VALID_IMPORT_MODES.includes(payload.mode)) {
    throw new Error(`Unsupported census import mode: ${payload.mode}`);
  }
  if (["validate", "import"].includes(payload.mode)) {
    validateWritePayload(payload, IMPORT_REQUEST_KEYS, "census import request", ["mode", "caseId", "fileUrl", "mapping"]);
    validateCensusMapping(payload.mapping || {});
  }
  return payload;
}

export function validateImportContractAlignment() {
  const errors = [];
  const resolverKeys = new Set(Object.keys(resolverContracts.resolvers || {}));

  Object.entries(importManifest.templates || {}).forEach(([templateKey, template]) => {
    if (!template.target_entity && !["rate_validation"].includes(templateKey)) {
      errors.push(`Import template ${templateKey} is missing target_entity`);
    }
    if (!Array.isArray(template.required_columns) || template.required_columns.length === 0) {
      errors.push(`Import template ${templateKey} must define required_columns`);
    }
  });

  Object.values(pageSpecs.screens || {}).forEach((screen) => {
    if (screen.import_action && !resolverKeys.has(screen.import_action)) {
      errors.push(`Missing resolver contract for import action ${screen.import_action}`);
    }
    if (screen.rating_action && !resolverKeys.has(screen.rating_action)) {
      errors.push(`Missing resolver contract for rating action ${screen.rating_action}`);
    }
  });

  const censusTemplate = importManifest.templates?.census_members;
  if (!censusTemplate?.do_not_trust_from_sheet?.length) {
    errors.push("Census import contract must declare do_not_trust_from_sheet fields");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}