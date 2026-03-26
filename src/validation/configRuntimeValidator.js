import importManifest from "@/config/import_manifest.json";
import pageSpecs from "@/config/page_specs.json";
import resolverContracts from "@/config/resolver_contracts.json";
import { ROUTE_PARAM_SCHEMAS } from "@/contracts/routes/routeParamSchemas";
import { assertPageFlowCoverage } from "@/validation/pageFlowSmoke";
import { buildDeepLinkSmokeMatrix } from "@/validation/deepLinkSmoke";

export function validateConfigRuntimeAlignment() {
  const errors = [];
  const resolverKeys = new Set(Object.keys(resolverContracts.resolvers || {}));

  if (resolverContracts._meta?.backend_function !== "planRatingEngine") {
    errors.push("resolver_contracts.json must target planRatingEngine");
  }

  ["dashboard", "cases", "census", "tasks", "exceptions", "renewals", "employeeManagement", "caseDetail"].forEach((routeKey) => {
    if (!ROUTE_PARAM_SCHEMAS[routeKey]) {
      errors.push(`Missing route contract for ${routeKey}`);
    }
  });

  ["Cases", "Dashboard", "CensusUploadModal"].forEach((pageKey) => {
    try {
      assertPageFlowCoverage(pageKey);
    } catch (error) {
      errors.push(error.message);
    }
  });

  try {
    buildDeepLinkSmokeMatrix();
  } catch (error) {
    errors.push(`Deep link smoke generation failed: ${error.message}`);
  }

  Object.values(pageSpecs.screens || {}).forEach((screen) => {
    if (screen.import_action && !resolverKeys.has(screen.import_action)) {
      errors.push(`Missing resolver for import action ${screen.import_action}`);
    }
    if (screen.rating_action && !resolverKeys.has(screen.rating_action)) {
      errors.push(`Missing resolver for rating action ${screen.rating_action}`);
    }
  });

  Object.entries(importManifest.templates || {}).forEach(([templateKey, template]) => {
    if (!template.target_entity && !["rate_validation"].includes(templateKey)) {
      errors.push(`Import template ${templateKey} is missing target_entity`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}