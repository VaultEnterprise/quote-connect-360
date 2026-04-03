import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const VALIDATION_RULES = [
  // ── Plan Master ──────────────────────────────────────────────────────────────
  { rule_code: "PLAN_001", rule_name: "Plan code required",             domain: "plan_master",   level: "row",        severity: "error",   action: "reject_row",     field_name: "plan_code",       condition_expression: "plan_code must be present and non-empty",                          error_message_template: "plan_code is required",                                      sort_order: 10, applies_to_import_types: ["plan_master"] },
  { rule_code: "PLAN_002", rule_name: "Effective date required",        domain: "plan_master",   level: "row",        severity: "error",   action: "reject_row",     field_name: "effective_date",  condition_expression: "effective_date must be a valid ISO date",                          error_message_template: "effective_date is required and must be a valid date",         sort_order: 11, applies_to_import_types: ["plan_master"] },
  { rule_code: "PLAN_003", rule_name: "Termination after effective",    domain: "plan_master",   level: "row",        severity: "error",   action: "reject_row",     field_name: "termination_date",condition_expression: "termination_date must be null or > effective_date",               error_message_template: "termination_date {termination_date} must be after effective_date {effective_date}", sort_order: 12, applies_to_import_types: ["plan_master"] },
  { rule_code: "PLAN_004", rule_name: "Duplicate active plan version",  domain: "plan_master",   level: "cross_table",severity: "error",   action: "reject_batch",   field_name: "plan_code",       condition_expression: "no active plan with same plan_code + plan_year may already exist unless override flag set", error_message_template: "Active plan {plan_code} for year {plan_year} already exists", sort_order: 13, applies_to_import_types: ["plan_master"] },

  // ── ZIP / Area Map ────────────────────────────────────────────────────────────
  { rule_code: "ZIP_001",  rule_name: "ZIP code required",              domain: "zip_area_map",  level: "row",        severity: "error",   action: "reject_row",     field_name: "zip_code",        condition_expression: "zip_code must be non-empty after normalization",                   error_message_template: "zip_code is missing or invalid: {zip_code}",                 sort_order: 20, applies_to_import_types: ["zip_area_map"] },
  { rule_code: "ZIP_002",  rule_name: "ZIP must be 5 digits",           domain: "zip_area_map",  level: "row",        severity: "error",   action: "reject_row",     field_name: "zip_code",        condition_expression: "zip_code must be exactly 5 numeric digits after left-padding",     error_message_template: "zip_code '{zip_code}' is not a valid 5-digit ZIP",           sort_order: 21, applies_to_import_types: ["zip_area_map", "census_members"] },
  { rule_code: "ZIP_003",  rule_name: "Rating area required",           domain: "zip_area_map",  level: "row",        severity: "error",   action: "reject_row",     field_name: "rating_area_code",condition_expression: "rating_area_code must be present",                                  error_message_template: "rating_area_code is required",                               sort_order: 22, applies_to_import_types: ["zip_area_map"] },
  { rule_code: "ZIP_004",  rule_name: "State code required",            domain: "zip_area_map",  level: "row",        severity: "warning", action: "warn",           field_name: "state_code",      condition_expression: "state_code should be a valid 2-letter US state abbreviation",      error_message_template: "state_code is missing — will be null in lookup table",       sort_order: 23, applies_to_import_types: ["zip_area_map"] },
  { rule_code: "ZIP_005",  rule_name: "Duplicate ZIP + effective date", domain: "zip_area_map",  level: "row",        severity: "error",   action: "reject_row",     field_name: "zip_code",        condition_expression: "no duplicate (plan_id, zip_code, effective_date) in same batch",   error_message_template: "Duplicate ZIP {zip_code} for effective date {effective_date}", sort_order: 24, applies_to_import_types: ["zip_area_map"] },
  { rule_code: "ZIP_006",  rule_name: "Census ZIP not in map",          domain: "zip_area_map",  level: "cross_table",severity: "warning", action: "warn",           field_name: "zip_code",        condition_expression: "every ZIP in census import must resolve in PlanZipAreaMap",        error_message_template: "Census ZIP {zip_code} has no matching rating area",          sort_order: 25, applies_to_import_types: ["census_members"] },

  // ── Rate Schedule ─────────────────────────────────────────────────────────────
  { rule_code: "SCHED_001",rule_name: "Plan code required",             domain: "rate_schedule", level: "row",        severity: "error",   action: "reject_row",     field_name: "plan_code",       condition_expression: "plan_code must resolve to an existing BenefitPlan",               error_message_template: "plan_code {plan_code} does not match any active plan",        sort_order: 30, applies_to_import_types: ["rate_schedule_header"] },
  { rule_code: "SCHED_002",rule_name: "Schedule effective date required",domain:"rate_schedule",  level: "row",        severity: "error",   action: "reject_row",     field_name: "effective_date",  condition_expression: "effective_date must be a valid ISO date",                          error_message_template: "Rate schedule effective_date is required",                   sort_order: 31, applies_to_import_types: ["rate_schedule_header"] },
  { rule_code: "SCHED_003",rule_name: "No active schedule exists",      domain: "rate_schedule", level: "cross_table",severity: "error",   action: "reject_batch",   field_name: null,              condition_expression: "plan must have at least one active PlanRateSchedule before activation", error_message_template: "Plan {plan_id} has no active rate schedule — cannot activate", sort_order: 32, applies_to_import_types: ["rate_schedule_header"] },

  // ── Rate Detail ───────────────────────────────────────────────────────────────
  { rule_code: "RATE_001", rule_name: "Rating area required",           domain: "rate_detail",   level: "row",        severity: "error",   action: "reject_row",     field_name: "rating_area_code",condition_expression: "rating_area_code must be non-empty",                               error_message_template: "rating_area_code is required",                               sort_order: 40, applies_to_import_types: ["rate_detail"] },
  { rule_code: "RATE_002", rule_name: "Age band required",              domain: "rate_detail",   level: "row",        severity: "error",   action: "reject_row",     field_name: "age_band_code",   condition_expression: "age_band_code must be non-empty",                                  error_message_template: "age_band_code is required",                                  sort_order: 41, applies_to_import_types: ["rate_detail"] },
  { rule_code: "RATE_003", rule_name: "Tier code required",             domain: "rate_detail",   level: "row",        severity: "error",   action: "reject_row",     field_name: "tier_code",       condition_expression: "tier_code must map to EE|ES|EC|FAM after normalization",           error_message_template: "Unknown tier_code '{tier_code}' — cannot normalize to EE/ES/EC/FAM", sort_order: 42, applies_to_import_types: ["rate_detail"] },
  { rule_code: "RATE_004", rule_name: "Monthly rate required and > 0", domain: "rate_detail",   level: "row",        severity: "error",   action: "reject_row",     field_name: "monthly_rate",    condition_expression: "monthly_rate must be a number > 0",                               error_message_template: "monthly_rate '{monthly_rate}' is invalid — must be a positive number", sort_order: 43, applies_to_import_types: ["rate_detail"] },
  { rule_code: "RATE_005", rule_name: "Duplicate rate key",             domain: "rate_detail",   level: "row",        severity: "error",   action: "reject_row",     field_name: null,              condition_expression: "no duplicate (schedule_id, area, band, tobacco, tier, effective_date)", error_message_template: "Duplicate rate key: area={rating_area_code} band={age_band_code} tier={tier_code}", sort_order: 44, applies_to_import_types: ["rate_detail"] },
  { rule_code: "RATE_006", rule_name: "Age band not in schema",         domain: "rate_detail",   level: "row",        severity: "warning", action: "warn",           field_name: "age_band_code",   condition_expression: "age_band_code must be in ACA_STANDARD_10 band code list",          error_message_template: "age_band_code '{age_band_code}' not recognized in ACA_STANDARD_10 schema", sort_order: 45, applies_to_import_types: ["rate_detail"] },
  { rule_code: "RATE_007", rule_name: "Incomplete tier coverage",       domain: "rate_detail",   level: "cross_table",severity: "error",   action: "reject_batch",   field_name: null,              condition_expression: "every (area, band) combination must have all 4 tier codes: EE, ES, EC, FAM", error_message_template: "Missing tiers for area={rating_area_code} band={age_band_code}: {missing_tiers}", sort_order: 46, applies_to_import_types: ["rate_detail"] },
  { rule_code: "RATE_008", rule_name: "Schedule has no rate rows",      domain: "rate_detail",   level: "cross_table",severity: "error",   action: "reject_batch",   field_name: null,              condition_expression: "schedule must have at least 1 PlanRateDetail row to be activated", error_message_template: "Rate schedule {rate_schedule_id} has no rate rows",           sort_order: 47, applies_to_import_types: ["rate_schedule_header"] },

  // ── Census / Rating ───────────────────────────────────────────────────────────
  { rule_code: "CENS_001", rule_name: "ZIP required for census member", domain: "census_member", level: "row",        severity: "error",   action: "reject_row",     field_name: "zip_code",        condition_expression: "zip_code must be present and normalizable",                       error_message_template: "Census member missing zip_code",                             sort_order: 50, applies_to_import_types: ["census_members"] },
  { rule_code: "CENS_002", rule_name: "DOB required for census member", domain: "census_member", level: "row",        severity: "error",   action: "reject_row",     field_name: "dob",             condition_expression: "dob must be present, parseable, and not a future date",           error_message_template: "Census member has invalid or missing DOB: {dob}",            sort_order: 51, applies_to_import_types: ["census_members"] },
  { rule_code: "CENS_003", rule_name: "Tier required for census member",domain: "census_member", level: "row",        severity: "error",   action: "reject_row",     field_name: "tier_code",       condition_expression: "tier_code must be present and normalizable to EE|ES|EC|FAM",      error_message_template: "Census member has unknown or missing tier: {tier_code}",     sort_order: 52, applies_to_import_types: ["census_members"] },
  { rule_code: "CENS_004", rule_name: "ZIP resolves to area",           domain: "case_rating",   level: "row",        severity: "error",   action: "reject_row",     field_name: "zip_code",        condition_expression: "ZIP must resolve to a rating_area_code via PlanZipAreaMap",       error_message_template: "ZIP {zip_code} does not resolve to any rating area",         sort_order: 53, applies_to_import_types: ["census_members"] },
  { rule_code: "CENS_005", rule_name: "Rate row must exist for member", domain: "case_rating",   level: "row",        severity: "error",   action: "reject_row",     field_name: null,              condition_expression: "PlanRateDetail row must exist for (plan, area, band, tier)",      error_message_template: "No rate found for area={area} band={band} tier={tier}",      sort_order: 54, applies_to_import_types: ["census_members"] },
  { rule_code: "CENS_006", rule_name: "Gender warning",                 domain: "census_member", level: "row",        severity: "warning", action: "warn",           field_name: "gender",          condition_expression: "gender is missing but not required by this rating model",         error_message_template: "Census member missing gender — not used by current rating model", sort_order: 55, applies_to_import_types: ["census_members"] },
  { rule_code: "CENS_007", rule_name: "Tobacco defaulted warning",      domain: "census_member", level: "row",        severity: "warning", action: "default_and_continue", field_name: "tobacco_flag", condition_expression: "tobacco_flag is missing — defaulted to N per plan config",    error_message_template: "tobacco_flag missing — defaulted to N",                      sort_order: 56, applies_to_import_types: ["census_members"] },

  // ── File-Level ────────────────────────────────────────────────────────────────
  { rule_code: "FILE_001", rule_name: "Required sheet missing",         domain: "rate_detail",   level: "file",       severity: "error",   action: "reject_batch",   field_name: null,              condition_expression: "source workbook must contain all required sheets",                 error_message_template: "Required sheet '{sheet_name}' is missing from workbook",     sort_order: 1,  applies_to_import_types: ["rate_detail","zip_area_map","census_members"] },
  { rule_code: "FILE_002", rule_name: "Required columns missing",       domain: "rate_detail",   level: "file",       severity: "error",   action: "reject_batch",   field_name: null,              condition_expression: "CSV/sheet must contain all required column headers",               error_message_template: "Missing required columns: {missing_columns}",                sort_order: 2,  applies_to_import_types: ["rate_detail","zip_area_map","census_members","plan_master"] },
  { rule_code: "FILE_003", rule_name: "Duplicate column headers",       domain: "rate_detail",   level: "file",       severity: "error",   action: "reject_batch",   field_name: null,              condition_expression: "column header names must be unique",                               error_message_template: "Duplicate column header detected in source file",             sort_order: 3,  applies_to_import_types: ["rate_detail","zip_area_map","census_members"] },
  { rule_code: "FILE_004", rule_name: "Empty file",                     domain: "rate_detail",   level: "file",       severity: "error",   action: "reject_batch",   field_name: null,              condition_expression: "source file must contain at least 1 data row after header",        error_message_template: "Import file is empty — no data rows found",                  sort_order: 4,  applies_to_import_types: ["rate_detail","zip_area_map","census_members","plan_master"] }
];

Deno.serve(async (req) => {
  try {
  // ─── SEED GUARD ─────────────────────────────────────────────────────────────
  // Seed functions must never be callable without authorization.
  // Set SEED_SECRET in function Secrets and pass it as X-Seed-Secret header.
  const seedSecret = Deno.env.get("SEED_SECRET");
  if (seedSecret) {
    const incomingSecret = req.headers.get("x-seed-secret");
    if (incomingSecret !== seedSecret) {
      return Response.json({ error: "Unauthorized: invalid or missing X-Seed-Secret header." }, { status: 401 });
    }
  } else {
    // No secret configured → block in all environments (seeds are dangerous)
    return Response.json({ error: "Seed functions are disabled. Set SEED_SECRET env var to enable." }, { status: 403 });
  }
  // ─────────────────────────────────────────────────────────────────────────────
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const existing = await base44.asServiceRole.entities.ValidationRule.list("-created_date", 200);
    const existingCodes = new Set(existing.map(r => r.rule_code));

    const toInsert = VALIDATION_RULES
      .filter(r => !existingCodes.has(r.rule_code))
      .map(r => ({ ...r, is_active: true }));

    if (toInsert.length === 0) {
      return Response.json({ message: "All validation rules already seeded", total: existing.length });
    }

    await base44.asServiceRole.entities.ValidationRule.bulkCreate(toInsert);

    return Response.json({
      message: "Validation rules seeded successfully",
      inserted: toInsert.length,
      already_existed: existingCodes.size,
      total: existing.length + toInsert.length,
      domains: [...new Set(toInsert.map(r => r.domain))],
    });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});