import { validateWritePayload } from "@/validation/appContracts";

export const ENTITY_WRITE_SCHEMAS = {
  BenefitCase: ["agency_id", "employer_group_id", "case_number", "case_type", "effective_date", "stage", "priority", "assigned_to", "products_requested", "notes", "employer_name", "employee_count", "census_status", "quote_status", "enrollment_status", "last_activity_date", "target_close_date", "closed_date", "closed_reason", "sf_opportunity_id"],
  DashboardViewPreset: ["name", "description", "view_mode", "date_range", "is_default", "filters"],
  CensusVersion: ["case_id", "version_number", "file_url", "file_name", "status", "total_employees", "eligible_employees", "validation_errors", "validation_warnings", "uploaded_by", "validated_at", "notes"],
  CensusMember: ["employee_id", "first_name", "last_name", "date_of_birth", "gender", "ssn_last4", "email", "phone", "address", "city", "state", "zip", "hire_date", "employment_status", "employment_type", "hours_per_week", "annual_salary", "job_title", "department", "class_code", "is_eligible", "dependent_count", "coverage_tier", "validation_status", "validation_issues", "census_version_id", "case_id"],
  ImportRun: ["import_type", "source_file_name", "plan_id", "rate_schedule_id", "case_id", "status", "started_at", "completed_at", "total_rows", "success_rows", "error_rows", "warning_rows", "created_by", "rollback_available", "rollback_at", "rollback_by", "notes"],
  ImportException: ["import_run_id", "entity_name", "sheet_name", "source_row_number", "error_code", "error_message", "severity", "raw_payload_json", "field_name", "resolved", "resolved_at", "resolved_by"],
  PlanRateDetail: ["rate_schedule_id", "plan_id", "rating_area_code", "age_band_code", "age_min", "age_max", "tobacco_flag", "tier_code", "tier_label_raw", "monthly_rate", "annual_rate", "effective_date", "termination_date", "is_active"],
  PlanRateSchedule: ["plan_id", "schedule_name", "effective_date", "termination_date", "rating_basis", "tobacco_mode", "state_scope", "version_number", "plan_year", "market_segment", "funding_type", "rating_model", "tobacco_rating_flag", "is_active", "uploaded_by", "row_count", "validation_status", "validation_errors", "notes"],
  PlanZipAreaMap: ["plan_id", "zip_code", "state_code", "county", "city", "rating_area_code", "effective_date", "termination_date", "is_active", "source"],
  CaseRatedResult: ["case_id", "plan_id", "rate_schedule_id", "census_version_id", "rating_date", "total_members_rated", "total_members_failed", "total_monthly_premium", "ee_monthly", "es_monthly", "ec_monthly", "fam_monthly", "avg_age", "rating_area_breakdown", "tier_breakdown", "member_results", "errors", "warnings", "status", "rated_by"],
};

export function validateEntityWrite(entityName, payload, requiredKeys = []) {
  const allowedKeys = ENTITY_WRITE_SCHEMAS[entityName];
  if (!allowedKeys) throw new Error(`No write schema registered for ${entityName}`);
  return validateWritePayload(payload, allowedKeys, `${entityName} write`, requiredKeys);
}