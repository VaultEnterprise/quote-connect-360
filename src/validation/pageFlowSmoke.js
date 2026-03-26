export const TOUCHED_FLOW_SMOKE_MATRIX = {
  Cases: ["load", "empty_state", "filtered_state", "deep_link_state", "mutation_path", "return_navigation"],
  Dashboard: ["load", "empty_state", "filtered_state", "deep_link_state", "return_navigation"],
  CensusUploadModal: ["load", "mapping", "validation", "import", "close"],
};

export function assertPageFlowCoverage(pageKey) {
  const checks = TOUCHED_FLOW_SMOKE_MATRIX[pageKey];
  if (!checks) throw new Error(`No smoke definition registered for ${pageKey}`);
  return checks;
}