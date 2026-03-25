import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACA_STANDARD_BANDS = [
  { code: "Under25", label: "Under 25", min: 0,  max: 24, sort: 1 },
  { code: "25-29",   label: "25–29",    min: 25, max: 29, sort: 2 },
  { code: "30-34",   label: "30–34",    min: 30, max: 34, sort: 3 },
  { code: "35-39",   label: "35–39",    min: 35, max: 39, sort: 4 },
  { code: "40-44",   label: "40–44",    min: 40, max: 44, sort: 5 },
  { code: "45-49",   label: "45–49",    min: 45, max: 49, sort: 6 },
  { code: "50-54",   label: "50–54",    min: 50, max: 54, sort: 7 },
  { code: "55-59",   label: "55–59",    min: 55, max: 59, sort: 8 },
  { code: "60-64",   label: "60–64",    min: 60, max: 64, sort: 9 },
  { code: "65+",     label: "65+",      min: 65, max: 999, sort: 10 },
];

const TIER_MAP = {
  "single": "EE", "ee": "EE", "employee only": "EE", "employee": "EE",
  "ee+sp": "ES", "ee + sp": "ES", "ee+spouse": "ES", "employee+spouse": "ES",
  "employee + spouse": "ES", "ee/spouse": "ES", "employee/spouse": "ES",
  "ee+ch": "EC", "ee + ch": "EC", "ee+child": "EC", "ee+children": "EC",
  "ee+ch(ren)": "EC", "ee + ch(ren)": "EC", "employee+child": "EC",
  "employee + children": "EC", "ee/child(ren)": "EC", "ee + children": "EC",
  "family": "FAM", "fam": "FAM", "ee+fam": "FAM", "ee + family": "FAM", "ee/family": "FAM",
};

const VALID_TIERS = ["EE", "ES", "EC", "FAM"];

// ─── Pure Resolvers ───────────────────────────────────────────────────────────
function dobToAge(dob, asOfDate) {
  const d = new Date(dob);
  const ref = new Date(asOfDate);
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

function ageToBand(age, bands = ACA_STANDARD_BANDS) {
  return bands.find(b => age >= b.min && age <= b.max) || null;
}

function tierNormalizer(raw) {
  if (!raw) return null;
  const key = raw.toString().toLowerCase().trim();
  return TIER_MAP[key] || null;
}

function normalizeZip(raw) {
  if (!raw) return null;
  const z = raw.toString().replace(/\D/g, "").padStart(5, "0");
  return z.length === 5 ? z : null;
}

function normalizeDob(raw) {
  if (!raw) return null;
  // Handle Excel serial dates
  if (typeof raw === "number") {
    const excelEpoch = new Date(1900, 0, 1);
    excelEpoch.setDate(excelEpoch.getDate() + raw - 2);
    return excelEpoch.toISOString().slice(0, 10);
  }
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  if (d > new Date()) return null; // reject future DOB
  return d.toISOString().slice(0, 10);
}

function normalizeTobacco(raw, planAllowsTobacco = false) {
  if (!planAllowsTobacco) return false;
  const v = raw?.toString().toUpperCase().trim();
  return v === "Y" || v === "YES" || v === "TRUE" || v === "1";
}

// ─── DB Resolvers ─────────────────────────────────────────────────────────────
async function zipToAreaResolver(base44, { zip, planId, effectiveDate }) {
  const normalized = normalizeZip(zip);
  if (!normalized) return { error: `Invalid ZIP: ${zip}`, code: "INVALID_ZIP" };

  const rows = await base44.asServiceRole.entities.PlanZipAreaMap.filter({ zip_code: normalized, is_active: true });
  const planSpecific = rows.find(r => r.plan_id === planId);
  const global = rows.find(r => !r.plan_id);
  const match = planSpecific || global;

  if (!match) return { error: `No rating area found for ZIP ${normalized}`, code: "NO_ZIP_AREA_MATCH" };
  return { rating_area_code: match.rating_area_code, state_code: match.state_code, county: match.county, zip_code: normalized };
}

async function planRateResolver(base44, { planId, rateScheduleId, ratingAreaCode, ageBandCode, tierCode, tobaccoFlag }) {
  const filters = { plan_id: planId, rating_area_code: ratingAreaCode, age_band_code: ageBandCode, tier_code: tierCode, is_active: true };
  if (rateScheduleId) filters.rate_schedule_id = rateScheduleId;

  const rates = await base44.asServiceRole.entities.PlanRateDetail.filter(filters);
  if (!rates.length) return { error: `No rate found: area=${ratingAreaCode} band=${ageBandCode} tier=${tierCode}`, code: "NO_RATE_MATCH" };

  const match = tobaccoFlag
    ? (rates.find(r => r.tobacco_flag === true) || rates[0])
    : (rates.find(r => !r.tobacco_flag) || rates[0]);

  return { monthly_rate: match.monthly_rate, rate_record_id: match.id };
}

// ─── Import Run Helpers ───────────────────────────────────────────────────────
async function createImportRun(base44, { importType, sourceFileName, planId, rateScheduleId, caseId, createdBy }) {
  return base44.asServiceRole.entities.ImportRun.create({
    import_type: importType,
    source_file_name: sourceFileName || "manual",
    plan_id: planId || null,
    rate_schedule_id: rateScheduleId || null,
    case_id: caseId || null,
    status: "running",
    started_at: new Date().toISOString(),
    total_rows: 0, success_rows: 0, error_rows: 0, warning_rows: 0,
    created_by: createdBy,
    rollback_available: true,
  });
}

async function logException(base44, { importRunId, entityName, sheetName, sourceRowNumber, errorCode, errorMessage, severity, rawPayload, fieldName }) {
  return base44.asServiceRole.entities.ImportException.create({
    import_run_id: importRunId,
    entity_name: entityName,
    sheet_name: sheetName || null,
    source_row_number: sourceRowNumber || null,
    error_code: errorCode || "UNKNOWN",
    error_message: errorMessage,
    severity: severity || "error",
    raw_payload_json: rawPayload || null,
    field_name: fieldName || null,
    resolved: false,
  });
}

async function finalizeRun(base44, runId, { status, totalRows, successRows, errorRows, warningRows }) {
  return base44.asServiceRole.entities.ImportRun.update(runId, {
    status,
    completed_at: new Date().toISOString(),
    total_rows: totalRows,
    success_rows: successRows,
    error_rows: errorRows,
    warning_rows: warningRows,
  });
}

// ─── Batch Rate Import ────────────────────────────────────────────────────────
async function importRateRows(base44, { rows, rateScheduleId, planId, sourceFileName, user }) {
  const run = await createImportRun(base44, { importType: "rate_detail", sourceFileName, planId, rateScheduleId, createdBy: user.email });
  const runId = run.id;

  let success = 0, errors = 0, warnings = 0;
  const toInsert = [];
  const seenKeys = new Set();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // 1-indexed, row 1 = header

    // Validate required fields
    const missingFields = [];
    if (!r.rating_area_code) missingFields.push("rating_area_code");
    if (!r.age_band_code) missingFields.push("age_band_code");
    if (!r.tier_code) missingFields.push("tier_code");
    if (r.monthly_rate == null || r.monthly_rate === "") missingFields.push("monthly_rate");

    if (missingFields.length) {
      await logException(base44, { importRunId: runId, entityName: "PlanRateDetail", sheetName: "Rates by Area Tier", sourceRowNumber: rowNum, errorCode: "MISSING_REQUIRED_FIELD", errorMessage: `Missing: ${missingFields.join(", ")}`, severity: "error", rawPayload: r, fieldName: missingFields[0] });
      errors++; continue;
    }

    // Normalize tier
    const normalizedTier = VALID_TIERS.includes(r.tier_code) ? r.tier_code : tierNormalizer(r.tier_code);
    if (!normalizedTier) {
      await logException(base44, { importRunId: runId, entityName: "PlanRateDetail", sheetName: "Rates by Area Tier", sourceRowNumber: rowNum, errorCode: "INVALID_TIER_CODE", errorMessage: `Unknown tier: '${r.tier_code}'. Expected Single/EE/EE+Sp/EE+Ch(ren)/Family or EE/ES/EC/FAM`, severity: "error", rawPayload: r, fieldName: "tier_code" });
      errors++; continue;
    }

    // Validate rate
    const monthlyRate = parseFloat(r.monthly_rate);
    if (isNaN(monthlyRate) || monthlyRate < 0) {
      await logException(base44, { importRunId: runId, entityName: "PlanRateDetail", sheetName: "Rates by Area Tier", sourceRowNumber: rowNum, errorCode: "NEGATIVE_RATE", errorMessage: `Invalid rate: ${r.monthly_rate}`, severity: "error", rawPayload: r, fieldName: "monthly_rate" });
      errors++; continue;
    }

    // Duplicate key check
    const key = `${rateScheduleId}|${r.rating_area_code}|${r.age_band_code}|${normalizedTier}|${r.tobacco_flag || false}`;
    if (seenKeys.has(key)) {
      await logException(base44, { importRunId: runId, entityName: "PlanRateDetail", sourceRowNumber: rowNum, errorCode: "DUPLICATE_KEY", errorMessage: `Duplicate rate key: area=${r.rating_area_code} band=${r.age_band_code} tier=${normalizedTier}`, severity: "error", rawPayload: r });
      errors++; continue;
    }
    seenKeys.add(key);

    // Age band validation
    const validBands = ACA_STANDARD_BANDS.map(b => b.code);
    if (!validBands.includes(r.age_band_code)) {
      await logException(base44, { importRunId: runId, entityName: "PlanRateDetail", sourceRowNumber: rowNum, errorCode: "INVALID_AGE_BAND", errorMessage: `Unknown age band: '${r.age_band_code}'`, severity: "warning", rawPayload: r, fieldName: "age_band_code" });
      warnings++;
    }

    toInsert.push({
      rate_schedule_id: rateScheduleId,
      plan_id: planId,
      rating_area_code: r.rating_area_code,
      age_band_code: r.age_band_code,
      tier_code: normalizedTier,
      tier_label_raw: r.tier_code,
      tobacco_flag: r.tobacco_flag === true || r.tobacco_flag === "Y" || r.tobacco_flag === "true",
      monthly_rate: monthlyRate,
      annual_rate: Math.round(monthlyRate * 12 * 100) / 100,
      effective_date: r.effective_date || null,
      termination_date: r.termination_date || null,
      source_row_number: rowNum,
      is_active: true,
    });
    success++;
  }

  if (toInsert.length) {
    await base44.asServiceRole.entities.PlanRateDetail.bulkCreate(toInsert);
    // Update schedule row count
    await base44.asServiceRole.entities.PlanRateSchedule.update(rateScheduleId, { row_count: toInsert.length, validation_status: errors > 0 ? "has_errors" : "pending" });
  }

  const status = errors > 0 && success === 0 ? "failed" : errors > 0 ? "completed_with_warnings" : "completed";
  await finalizeRun(base44, runId, { status, totalRows: rows.length, successRows: success, errorRows: errors, warningRows: warnings });
  return { run_id: runId, status, success, errors, warnings, total: rows.length };
}

// ─── Batch ZIP Import ─────────────────────────────────────────────────────────
async function importZipRows(base44, { rows, planId, sourceFileName, user }) {
  const run = await createImportRun(base44, { importType: "zip_area_map", sourceFileName, planId, createdBy: user.email });
  const runId = run.id;

  let success = 0, errors = 0, warnings = 0;
  const seenKeys = new Set();
  const toInsert = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2;

    const zip = normalizeZip(r.zip_code || r.zip);
    if (!zip) {
      await logException(base44, { importRunId: runId, entityName: "PlanZipAreaMap", sheetName: "Zip Code to Area", sourceRowNumber: rowNum, errorCode: "INVALID_ZIP", errorMessage: `Invalid or missing ZIP: '${r.zip_code || r.zip}'`, severity: "error", rawPayload: r, fieldName: "zip_code" });
      errors++; continue;
    }
    if (!r.rating_area_code) {
      await logException(base44, { importRunId: runId, entityName: "PlanZipAreaMap", sourceRowNumber: rowNum, errorCode: "MISSING_REQUIRED_FIELD", errorMessage: "Missing rating_area_code", severity: "error", rawPayload: r, fieldName: "rating_area_code" });
      errors++; continue;
    }
    if (!r.state_code && !r.state) {
      await logException(base44, { importRunId: runId, entityName: "PlanZipAreaMap", sourceRowNumber: rowNum, errorCode: "INVALID_STATE_CODE", errorMessage: "Missing state_code", severity: "warning", rawPayload: r });
      warnings++;
    }

    const dupKey = `${planId || "global"}|${zip}|${r.effective_date || ""}`;
    if (seenKeys.has(dupKey)) {
      await logException(base44, { importRunId: runId, entityName: "PlanZipAreaMap", sourceRowNumber: rowNum, errorCode: "DUPLICATE_KEY", errorMessage: `Duplicate ZIP ${zip} for same effective date`, severity: "error", rawPayload: r });
      errors++; continue;
    }
    seenKeys.add(dupKey);

    toInsert.push({
      plan_id: planId || null,
      zip_code: zip,
      state_code: r.state_code || r.state || null,
      county: r.county || null,
      city: r.city || null,
      rating_area_code: r.rating_area_code,
      effective_date: r.effective_date || null,
      termination_date: r.termination_date || null,
      is_active: true,
      source: "carrier_provided",
    });
    success++;
  }

  if (toInsert.length) await base44.asServiceRole.entities.PlanZipAreaMap.bulkCreate(toInsert);

  const status = errors > 0 && success === 0 ? "failed" : errors > 0 ? "completed_with_warnings" : "completed";
  await finalizeRun(base44, runId, { status, totalRows: rows.length, successRows: success, errorRows: errors, warningRows: warnings });
  return { run_id: runId, status, success, errors, warnings, total: rows.length };
}

// ─── Case Rating Engine ───────────────────────────────────────────────────────
async function caseRatingEngine(base44, { caseId, planId, rateScheduleId, effectiveDate, user }) {
  const run = await createImportRun(base44, { importType: "census_members", planId, caseId, createdBy: user?.email || "system" });
  const runId = run.id;

  const members = await base44.asServiceRole.entities.CensusMember.filter({ case_id: caseId });
  if (!members.length) {
    await finalizeRun(base44, runId, { status: "failed", totalRows: 0, successRows: 0, errorRows: 1, warningRows: 0 });
    return { error: "No census members found for this case", run_id: runId };
  }

  const memberResults = [];
  let totalPremium = 0, failedCount = 0, warnings = 0;
  const tierBreakdown = { EE: { count: 0, premium: 0 }, ES: { count: 0, premium: 0 }, EC: { count: 0, premium: 0 }, FAM: { count: 0, premium: 0 } };
  const areaBreakdown = {};
  const resultRows = [];

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const result = { member_id: member.id, name: `${member.first_name} ${member.last_name}`, errors: [] };

    // 1. ZIP
    const zip = normalizeZip(member.zip);
    if (!zip) {
      const msg = `Invalid/missing ZIP: ${member.zip}`;
      result.errors.push(msg);
      await logException(base44, { importRunId: runId, entityName: "CensusMember", sourceRowNumber: i + 1, errorCode: "INVALID_ZIP", errorMessage: msg, severity: "error", rawPayload: { id: member.id, zip: member.zip } });
      failedCount++; memberResults.push(result);
      resultRows.push({ case_id: caseId, census_member_id: member.id, plan_id: planId, rate_schedule_id: rateScheduleId || null, rating_status: "exception", exception_code: "INVALID_ZIP", exception_message: msg, rated_at: new Date().toISOString() });
      continue;
    }

    const areaRes = await zipToAreaResolver(base44, { zip, planId, effectiveDate });
    if (areaRes.error) {
      await logException(base44, { importRunId: runId, entityName: "CensusMember", sourceRowNumber: i + 1, errorCode: areaRes.code || "NO_ZIP_AREA_MATCH", errorMessage: areaRes.error, severity: "error", rawPayload: { id: member.id, zip } });
      result.errors.push(areaRes.error); failedCount++; memberResults.push(result);
      resultRows.push({ case_id: caseId, census_member_id: member.id, plan_id: planId, rating_status: "exception", exception_code: areaRes.code, exception_message: areaRes.error, rated_at: new Date().toISOString() });
      continue;
    }
    result.rating_area_code = areaRes.rating_area_code;

    // 2. DOB → Age → Band
    const dobNorm = normalizeDob(member.date_of_birth);
    if (!dobNorm) {
      const msg = `Invalid/missing DOB: ${member.date_of_birth}`;
      result.errors.push(msg);
      await logException(base44, { importRunId: runId, entityName: "CensusMember", sourceRowNumber: i + 1, errorCode: "INVALID_DOB", errorMessage: msg, severity: "error", rawPayload: { id: member.id, dob: member.date_of_birth } });
      failedCount++; memberResults.push(result);
      resultRows.push({ case_id: caseId, census_member_id: member.id, plan_id: planId, rating_status: "exception", exception_code: "INVALID_DOB", exception_message: msg, rated_at: new Date().toISOString() });
      continue;
    }
    const age = dobToAge(dobNorm, effectiveDate);
    const band = ageToBand(age);
    if (!band) {
      const msg = `Cannot resolve age band for age ${age}`;
      result.errors.push(msg);
      await logException(base44, { importRunId: runId, entityName: "CensusMember", sourceRowNumber: i + 1, errorCode: "INVALID_AGE_BAND", errorMessage: msg, severity: "error", rawPayload: { id: member.id, dob: dobNorm, age } });
      failedCount++; memberResults.push(result);
      continue;
    }
    result.age = age;
    result.age_band_code = band.code;

    // 3. Tier
    const rawTier = member.coverage_tier || "EE";
    const tierCode = VALID_TIERS.includes(rawTier) ? rawTier : tierNormalizer(rawTier.replace(/_/g, " "));
    if (!tierCode) {
      const msg = `Unknown tier: ${rawTier}`;
      result.errors.push(msg);
      await logException(base44, { importRunId: runId, entityName: "CensusMember", sourceRowNumber: i + 1, errorCode: "INVALID_TIER_CODE", errorMessage: msg, severity: "error", rawPayload: { id: member.id, tier: rawTier } });
      failedCount++; memberResults.push(result);
      resultRows.push({ case_id: caseId, census_member_id: member.id, plan_id: planId, rating_status: "exception", exception_code: "INVALID_TIER_CODE", exception_message: msg, rated_at: new Date().toISOString() });
      continue;
    }
    result.tier_code = tierCode;

    // 4. Rate lookup
    const rateRes = await planRateResolver(base44, { planId, rateScheduleId, ratingAreaCode: areaRes.rating_area_code, ageBandCode: band.code, tierCode, tobaccoFlag: false });
    if (rateRes.error) {
      await logException(base44, { importRunId: runId, entityName: "CensusMember", sourceRowNumber: i + 1, errorCode: rateRes.code || "NO_RATE_MATCH", errorMessage: rateRes.error, severity: "error", rawPayload: { id: member.id, area: areaRes.rating_area_code, band: band.code, tier: tierCode } });
      result.errors.push(rateRes.error); failedCount++; memberResults.push(result);
      resultRows.push({ case_id: caseId, census_member_id: member.id, plan_id: planId, rate_schedule_id: rateScheduleId || null, rating_area_code: areaRes.rating_area_code, age_band_code: band.code, tier_code: tierCode, rating_status: "exception", exception_code: rateRes.code || "NO_RATE_MATCH", exception_message: rateRes.error, rated_at: new Date().toISOString() });
      continue;
    }

    result.monthly_rate = rateRes.monthly_rate;
    totalPremium += rateRes.monthly_rate;

    if (tierBreakdown[tierCode]) { tierBreakdown[tierCode].count++; tierBreakdown[tierCode].premium += rateRes.monthly_rate; }
    if (!areaBreakdown[areaRes.rating_area_code]) areaBreakdown[areaRes.rating_area_code] = { count: 0, premium: 0 };
    areaBreakdown[areaRes.rating_area_code].count++;
    areaBreakdown[areaRes.rating_area_code].premium += rateRes.monthly_rate;

    resultRows.push({ case_id: caseId, census_member_id: member.id, plan_id: planId, rate_schedule_id: rateScheduleId || null, rating_area_code: areaRes.rating_area_code, age_band_code: band.code, tier_code: tierCode, tobacco_flag: false, monthly_rate: rateRes.monthly_rate, rated_at: new Date().toISOString(), rating_status: "rated" });
    memberResults.push(result);
  }

  // Persist rated results
  if (resultRows.length) await base44.asServiceRole.entities.CaseRatedResult.bulkCreate(resultRows);

  const ratedCount = memberResults.length - failedCount;
  const status = failedCount === memberResults.length ? "failed" : failedCount > 0 ? "completed_with_warnings" : "completed";
  await finalizeRun(base44, runId, { status, totalRows: members.length, successRows: ratedCount, errorRows: failedCount, warningRows: warnings });

  return {
    run_id: runId, status,
    total_members_rated: ratedCount, total_members_failed: failedCount,
    total_monthly_premium: Math.round(totalPremium * 100) / 100,
    ee_monthly: Math.round(tierBreakdown.EE.premium * 100) / 100,
    es_monthly: Math.round(tierBreakdown.ES.premium * 100) / 100,
    ec_monthly: Math.round(tierBreakdown.EC.premium * 100) / 100,
    fam_monthly: Math.round(tierBreakdown.FAM.premium * 100) / 100,
    tier_breakdown: tierBreakdown, rating_area_breakdown: areaBreakdown,
    member_results: memberResults, warnings: [],
  };
}

// ─── Schedule Validation ──────────────────────────────────────────────────────
async function validateRateSchedule(base44, { rateScheduleId }) {
  const rates = await base44.asServiceRole.entities.PlanRateDetail.filter({ rate_schedule_id: rateScheduleId });
  const errors = [];
  const seen = new Set();

  rates.forEach((r, i) => {
    if (!r.monthly_rate || r.monthly_rate <= 0) errors.push(`Row ${i + 1}: Missing or zero monthly_rate`);
    if (!r.rating_area_code) errors.push(`Row ${i + 1}: Missing rating_area_code`);
    if (!r.age_band_code) errors.push(`Row ${i + 1}: Missing age_band_code`);
    if (!VALID_TIERS.includes(r.tier_code)) errors.push(`Row ${i + 1}: Invalid tier_code '${r.tier_code}'`);
    const key = `${r.rating_area_code}|${r.age_band_code}|${r.tier_code}|${r.tobacco_flag}`;
    if (seen.has(key)) errors.push(`Row ${i + 1}: Duplicate rate key ${key}`);
    seen.add(key);
  });

  // Check completeness: every area+band combo should have all 4 tiers
  const areasBands = {};
  rates.forEach(r => {
    const k = `${r.rating_area_code}|${r.age_band_code}`;
    if (!areasBands[k]) areasBands[k] = new Set();
    areasBands[k].add(r.tier_code);
  });
  Object.entries(areasBands).forEach(([k, tiers]) => {
    const missing = VALID_TIERS.filter(t => !tiers.has(t));
    if (missing.length) errors.push(`Missing tiers for ${k}: ${missing.join(", ")}`);
  });

  const status = errors.length === 0 ? "valid" : "has_errors";
  await base44.asServiceRole.entities.PlanRateSchedule.update(rateScheduleId, { validation_status: status, validation_errors: errors.slice(0, 100), row_count: rates.length });
  return { status, error_count: errors.length, errors: errors.slice(0, 100), row_count: rates.length };
}

// ─── Seed Age Band Schema ─────────────────────────────────────────────────────
async function seedAgeBandSchema(base44) {
  const existing = await base44.asServiceRole.entities.AgeBandSchema.filter({ schema_code: "ACA_STANDARD_10" });
  if (existing.length >= ACA_STANDARD_BANDS.length) return { message: "Already seeded", count: existing.length };

  const rows = ACA_STANDARD_BANDS.map(b => ({
    schema_code: "ACA_STANDARD_10",
    schema_name: "ACA Standard 10-Band",
    age_min: b.min, age_max: b.max,
    band_label: b.label, band_code: b.code,
    sort_order: b.sort, is_active: true,
  }));
  await base44.asServiceRole.entities.AgeBandSchema.bulkCreate(rows);
  return { message: "Seeded", count: rows.length };
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === "zipToArea") {
      const result = await zipToAreaResolver(base44, { zip: body.zip, planId: body.planId, effectiveDate: body.effectiveDate || new Date().toISOString().slice(0, 10) });
      return Response.json(result);
    }

    if (action === "dobToAgeBand") {
      const dob = normalizeDob(body.dob);
      if (!dob) return Response.json({ error: "Invalid DOB" }, { status: 400 });
      const age = dobToAge(dob, body.effectiveDate || new Date().toISOString().slice(0, 10));
      const band = ageToBand(age);
      return Response.json({ age, band_code: band?.code || null, band_label: band?.label || null });
    }

    if (action === "tierNormalize") {
      return Response.json({ normalized: tierNormalizer(body.tier), input: body.tier });
    }

    if (action === "rateResolve") {
      const { planId, rateScheduleId, ratingAreaCode, ageBandCode, tierCode, tobaccoFlag } = body;
      if (!planId || !ratingAreaCode || !ageBandCode || !tierCode) return Response.json({ error: "planId, ratingAreaCode, ageBandCode, tierCode required" }, { status: 400 });
      return Response.json(await planRateResolver(base44, { planId, rateScheduleId, ratingAreaCode, ageBandCode, tierCode, tobaccoFlag }));
    }

    if (action === "rateCensus") {
      const { caseId, planId, rateScheduleId, effectiveDate } = body;
      if (!caseId || !planId) return Response.json({ error: "caseId and planId required" }, { status: 400 });
      return Response.json(await caseRatingEngine(base44, { caseId, planId, rateScheduleId, effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10), user }));
    }

    if (action === "importRateRows") {
      const { rows, rateScheduleId, planId, sourceFileName } = body;
      if (!rows?.length || !rateScheduleId || !planId) return Response.json({ error: "rows, rateScheduleId, planId required" }, { status: 400 });
      return Response.json(await importRateRows(base44, { rows, rateScheduleId, planId, sourceFileName, user }));
    }

    if (action === "importZipRows") {
      const { rows, planId, sourceFileName } = body;
      if (!rows?.length) return Response.json({ error: "rows required" }, { status: 400 });
      return Response.json(await importZipRows(base44, { rows, planId, sourceFileName, user }));
    }

    if (action === "validateRateSchedule") {
      const { rateScheduleId } = body;
      if (!rateScheduleId) return Response.json({ error: "rateScheduleId required" }, { status: 400 });
      return Response.json(await validateRateSchedule(base44, { rateScheduleId }));
    }

    if (action === "seedAgeBandSchema") {
      if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
      return Response.json(await seedAgeBandSchema(base44));
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});