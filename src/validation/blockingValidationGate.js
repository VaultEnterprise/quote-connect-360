import { assertRouteContract } from "@/validation/routeContractValidator";
import { validateConfigRuntimeAlignment } from "@/validation/configRuntimeValidator";
import { validateImportContractAlignment } from "@/validation/importContractValidator";
import { assertPageFlowCoverage } from "@/validation/pageFlowSmoke";
import { assertNavigationFlowCoverage } from "@/validation/navigationFlowSmoke";
import { assertEntityWriteSchemaCoverage } from "@/validation/schemaWriteValidator";
import { STAGE_ORDER, CASE_STAGE_GROUPS } from "@/contracts/workflowRegistry";

const EXEMPT_WORKFLOW_STAGES = ["closed", "renewed"];
const REQUIRED_ENTITY_WRITE_SCHEMAS = [
  "BenefitCase",
  "DashboardViewPreset",
  "CensusVersion",
  "CensusMember",
  "ImportRun",
  "ImportException",
  "PlanRateDetail",
  "PlanRateSchedule",
  "PlanZipAreaMap",
  "CaseRatedResult",
  "CaseTask",
  "ExceptionItem",
  "RenewalCycle",
];

export function assertWorkflowCoverage() {
  const uncoveredStages = STAGE_ORDER.filter((stage) => !EXEMPT_WORKFLOW_STAGES.includes(stage) && !CASE_STAGE_GROUPS.some((group) => group.match(stage)));
  if (uncoveredStages.length > 0) {
    throw new Error(`Workflow registry has uncovered stages: ${uncoveredStages.join(", ")}`);
  }
  return true;
}

export function assertBlockingValidationGate({ pageKey, routeKey }) {
  assertPageFlowCoverage(pageKey);
  assertNavigationFlowCoverage();
  assertRouteContract(routeKey);
  assertEntityWriteSchemaCoverage(REQUIRED_ENTITY_WRITE_SCHEMAS);
  assertWorkflowCoverage();

  const configValidation = validateConfigRuntimeAlignment();
  if (!configValidation.valid) {
    throw new Error(`Config runtime validation failed: ${configValidation.errors.join(" | ")}`);
  }

  const importValidation = validateImportContractAlignment();
  if (!importValidation.valid) {
    throw new Error(`Import contract validation failed: ${importValidation.errors.join(" | ")}`);
  }

  return true;
}