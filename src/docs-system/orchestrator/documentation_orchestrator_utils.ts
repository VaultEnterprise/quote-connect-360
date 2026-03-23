import type { DocumentationDataset } from "../shared/documentation_types";

/**
 * Builds and organizes documentation dataset for export
 * Sorts all items by code for consistent output
 */
export function buildDocumentationDataset(seed: DocumentationDataset): DocumentationDataset {
  return {
    ...seed,
    pages: [...seed.pages].sort((a, b) => a.page_code.localeCompare(b.page_code)),
    features: [...seed.features].sort((a, b) => a.feature_code.localeCompare(b.feature_code)),
    controls: [...seed.controls].sort((a, b) => a.control_code.localeCompare(b.control_code)),
    workflows: [...seed.workflows].sort((a, b) => a.workflow_code.localeCompare(b.workflow_code)),
    sections: [...seed.sections].sort((a, b) => a.sort_order - b.sort_order),
  };
}

/**
 * Validates dataset completeness before export
 */
export function validateDataset(dataset: DocumentationDataset): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!dataset.pages || dataset.pages.length === 0) {
    errors.push("No pages defined in dataset");
  }

  if (!dataset.features || dataset.features.length === 0) {
    errors.push("No features defined in dataset");
  }

  if (!dataset.controls || dataset.controls.length === 0) {
    errors.push("No controls defined in dataset");
  }

  if (!dataset.workflows || dataset.workflows.length === 0) {
    errors.push("No workflows defined in dataset");
  }

  if (!dataset.sections || dataset.sections.length === 0) {
    errors.push("No sections defined in dataset");
  }

  // Validate references
  const pageCodesSet = new Set(dataset.pages.map((p) => p.page_code));
  const featureCodesSet = new Set(dataset.features.map((f) => f.feature_code));
  const controlCodesSet = new Set(dataset.controls.map((c) => c.control_code));
  const workflowCodesSet = new Set(dataset.workflows.map((w) => w.workflow_code));

  // Check feature references
  for (const feature of dataset.features) {
    if (!pageCodesSet.has(feature.page_code)) {
      errors.push(`Feature ${feature.feature_code} references missing page ${feature.page_code}`);
    }
  }

  // Check control references
  for (const control of dataset.controls) {
    if (!pageCodesSet.has(control.page_code)) {
      errors.push(`Control ${control.control_code} references missing page ${control.page_code}`);
    }
  }

  // Check page workflow references
  for (const page of dataset.pages) {
    for (const wfCode of page.related_workflows) {
      if (!workflowCodesSet.has(wfCode)) {
        errors.push(`Page ${page.page_code} references missing workflow ${wfCode}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates statistics about the documentation dataset
 */
export function calculateDatasetStats(dataset: DocumentationDataset) {
  return {
    total_pages: dataset.pages.length,
    total_features: dataset.features.length,
    total_controls: dataset.controls.length,
    total_workflows: dataset.workflows.length,
    total_sections: dataset.sections.length,
    pages_by_module: Object.fromEntries(
      Array.from(new Set(dataset.pages.map((p) => p.module))).map((module) => [
        module,
        dataset.pages.filter((p) => p.module === module).length,
      ]),
    ),
    pages_by_type: Object.fromEntries(
      Array.from(new Set(dataset.pages.map((p) => p.page_type))).map((type) => [
        type,
        dataset.pages.filter((p) => p.page_type === type).length,
      ]),
    ),
    features_by_type: Object.fromEntries(
      Array.from(new Set(dataset.features.map((f) => f.feature_type))).map((type) => [
        type,
        dataset.features.filter((f) => f.feature_type === type).length,
      ]),
    ),
    controls_by_type: Object.fromEntries(
      Array.from(new Set(dataset.controls.map((c) => c.control_type))).map((type) => [
        type,
        dataset.controls.filter((c) => c.control_type === type).length,
      ]),
    ),
    total_roles: new Set([
      ...dataset.pages.flatMap((p) => p.access_roles),
      ...dataset.features.flatMap((f) => f.user_roles),
      ...dataset.controls.flatMap((c) => c.visible_roles),
    ]).size,
  };
}