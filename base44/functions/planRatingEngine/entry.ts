import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ACA_STANDARD_BANDS = [
  { code: 'Under25', label: 'Under 25', min: 0, max: 24, sort: 1 },
  { code: '25-29', label: '25–29', min: 25, max: 29, sort: 2 },
  { code: '30-34', label: '30–34', min: 30, max: 34, sort: 3 },
  { code: '35-39', label: '35–39', min: 35, max: 39, sort: 4 },
  { code: '40-44', label: '40–44', min: 40, max: 44, sort: 5 },
  { code: '45-49', label: '45–49', min: 45, max: 49, sort: 6 },
  { code: '50-54', label: '50–54', min: 50, max: 54, sort: 7 },
  { code: '55-59', label: '55–59', min: 55, max: 59, sort: 8 },
  { code: '60-64', label: '60–64', min: 60, max: 64, sort: 9 },
  { code: '65+', label: '65+', min: 65, max: 999, sort: 10 },
];

const TIER_MAP = {
  single: 'EE', ee: 'EE', 'employee only': 'EE', employee: 'EE',
  'ee+sp': 'ES', 'ee + sp': 'ES', 'ee+spouse': 'ES', 'employee+spouse': 'ES', 'employee + spouse': 'ES', 'ee/spouse': 'ES', 'employee/spouse': 'ES',
  'ee+ch': 'EC', 'ee + ch': 'EC', 'ee+child': 'EC', 'ee+children': 'EC', 'ee+ch(ren)': 'EC', 'ee + ch(ren)': 'EC', 'employee+child': 'EC', 'employee + children': 'EC', 'ee/child(ren)': 'EC', 'ee + children': 'EC',
  family: 'FAM', fam: 'FAM', 'ee+fam': 'FAM', 'ee + family': 'FAM', 'ee/family': 'FAM',
};

const VALID_TIERS = ['EE', 'ES', 'EC', 'FAM'];
const ACTION_CONTRACTS = {
  zipToArea: { required: ['zip'], allowed: ['action', 'zip', 'planId', 'effectiveDate'] },
  dobToAgeBand: { required: ['dob'], allowed: ['action', 'dob', 'effectiveDate'] },
  tierNormalize: { required: ['tier'], allowed: ['action', 'tier'] },
  rateResolve: { required: ['planId', 'ratingAreaCode', 'ageBandCode', 'tierCode'], allowed: ['action', 'planId', 'rateScheduleId', 'ratingAreaCode', 'ageBandCode', 'tierCode', 'tobaccoFlag'] },
  rateCensus: { required: ['caseId', 'planId'], allowed: ['action', 'caseId', 'planId', 'rateScheduleId', 'effectiveDate'] },
  importRateRows: { required: ['rows', 'rateScheduleId', 'planId'], allowed: ['action', 'rows', 'rateScheduleId', 'planId', 'sourceFileName'] },
  importZipRows: { required: ['rows'], allowed: ['action', 'rows', 'planId', 'sourceFileName'] },
  validateRateSchedule: { required: ['rateScheduleId'], allowed: ['action', 'rateScheduleId'] },
  seedAgeBandSchema: { required: [], allowed: ['action'] },
};

function validatePayload(body) {
  const contract = ACTION_CONTRACTS[body.action];
  if (!contract) throw new Error(`Unknown action: ${body.action}`);
  const unknownKeys = Object.keys(body).filter((key) => !contract.allowed.includes(key));
  if (unknownKeys.length > 0) throw new Error(`Unsupported keys for ${body.action}: ${unknownKeys.join(', ')}`);
  const missingKeys = contract.required.filter((key) => body[key] === undefined || body[key] === null || body[key] === '');
  if (missingKeys.length > 0) throw new Error(`Missing required keys for ${body.action}: ${missingKeys.join(', ')}`);
}

function dobToAge(dob, asOfDate) {
  const dobDate = new Date(dob);
  const referenceDate = new Date(asOfDate);
  let age = referenceDate.getFullYear() - dobDate.getFullYear();
  const monthDelta = referenceDate.getMonth() - dobDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && referenceDate.getDate() < dobDate.getDate())) age -= 1;
  return age;
}

function ageToBand(age) {
  return ACA_STANDARD_BANDS.find((band) => age >= band.min && age <= band.max) || null;
}

function tierNormalizer(rawTier) {
  if (!rawTier) return null;
  const normalized = rawTier.toString().toLowerCase().trim();
  return TIER_MAP[normalized] || null;
}

function normalizeZip(rawZip) {
  if (!rawZip) return null;
  const normalized = rawZip.toString().replace(/\D/g, '').padStart(5, '0');
  return normalized.length === 5 ? normalized : null;
}

function normalizeDob(rawDob) {
  if (!rawDob) return null;
  if (typeof rawDob === 'number') {
    const excelEpoch = new Date(1900, 0, 1);
    excelEpoch.setDate(excelEpoch.getDate() + rawDob - 2);
    return excelEpoch.toISOString().slice(0, 10);
  }
  const date = new Date(rawDob);
  if (Number.isNaN(date.getTime()) || date > new Date()) return null;
  return date.toISOString().slice(0, 10);
}

async function createImportRun(base44, payload) {
  return await base44.asServiceRole.entities.ImportRun.create({
    import_type: payload.importType,
    source_file_name: payload.sourceFileName || 'manual',
    plan_id: payload.planId || undefined,
    rate_schedule_id: payload.rateScheduleId || undefined,
    case_id: payload.caseId || undefined,
    status: 'running',
    started_at: new Date().toISOString(),
    total_rows: 0,
    success_rows: 0,
    error_rows: 0,
    warning_rows: 0,
    created_by: payload.createdBy,
    rollback_available: true,
  });
}

async function finalizeRun(base44, runId, payload) {
  return await base44.asServiceRole.entities.ImportRun.update(runId, {
    status: payload.status,
    completed_at: new Date().toISOString(),
    total_rows: payload.totalRows,
    success_rows: payload.successRows,
    error_rows: payload.errorRows,
    warning_rows: payload.warningRows,
  });
}

async function logException(base44, payload) {
  return await base44.asServiceRole.entities.ImportException.create({
    import_run_id: payload.importRunId,
    entity_name: payload.entityName,
    sheet_name: payload.sheetName || undefined,
    source_row_number: payload.sourceRowNumber || undefined,
    error_code: payload.errorCode || 'UNKNOWN',
    error_message: payload.errorMessage,
    severity: payload.severity || 'error',
    raw_payload_json: payload.rawPayload || undefined,
    field_name: payload.fieldName || undefined,
    resolved: false,
  });
}

async function zipToAreaResolver(base44, payload) {
  const normalizedZip = normalizeZip(payload.zip);
  if (!normalizedZip) return { error: `Invalid ZIP: ${payload.zip}`, code: 'INVALID_ZIP' };
  const rows = await base44.asServiceRole.entities.PlanZipAreaMap.filter({ zip_code: normalizedZip, is_active: true });
  const match = rows.find((row) => row.plan_id === payload.planId) || rows.find((row) => !row.plan_id);
  if (!match) return { error: `No rating area found for ZIP ${normalizedZip}`, code: 'NO_ZIP_AREA_MATCH' };
  return { rating_area_code: match.rating_area_code, state_code: match.state_code, county: match.county, zip_code: normalizedZip };
}

async function planRateResolver(base44, payload) {
  const filters = {
    plan_id: payload.planId,
    rating_area_code: payload.ratingAreaCode,
    age_band_code: payload.ageBandCode,
    tier_code: payload.tierCode,
    is_active: true,
  };
  if (payload.rateScheduleId) filters.rate_schedule_id = payload.rateScheduleId;

  const rates = await base44.asServiceRole.entities.PlanRateDetail.filter(filters);
  if (!rates.length) return { error: `No rate found: area=${payload.ratingAreaCode} band=${payload.ageBandCode} tier=${payload.tierCode}`, code: 'NO_RATE_MATCH' };
  const match = payload.tobaccoFlag ? (rates.find((row) => row.tobacco_flag === true) || rates[0]) : (rates.find((row) => !row.tobacco_flag) || rates[0]);
  return { monthly_rate: match.monthly_rate, rate_record_id: match.id };
}

async function importRateRows(base44, payload, user) {
  const run = await createImportRun(base44, { importType: 'rate_detail', sourceFileName: payload.sourceFileName, planId: payload.planId, rateScheduleId: payload.rateScheduleId, createdBy: user.email });
  const seenKeys = new Set();
  const writeRows = [];
  let success = 0;
  let errors = 0;
  let warnings = 0;

  for (let index = 0; index < payload.rows.length; index++) {
    const row = payload.rows[index];
    const rowNumber = index + 2;
    const normalizedTier = VALID_TIERS.includes(row.tier_code) ? row.tier_code : tierNormalizer(row.tier_code);
    const monthlyRate = Number(row.monthly_rate);
    const key = `${payload.rateScheduleId}|${row.rating_area_code}|${row.age_band_code}|${normalizedTier}|${row.tobacco_flag || false}`;

    if (!row.rating_area_code || !row.age_band_code || !row.tier_code || row.monthly_rate === undefined || row.monthly_rate === '') {
      await logException(base44, { importRunId: run.id, entityName: 'PlanRateDetail', sourceRowNumber: rowNumber, errorCode: 'MISSING_REQUIRED_FIELD', errorMessage: 'Missing required rate detail field', rawPayload: row });
      errors += 1;
      continue;
    }
    if (!normalizedTier) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanRateDetail', sourceRowNumber: rowNumber, errorCode: 'INVALID_TIER_CODE', errorMessage: `Unknown tier: ${row.tier_code}`, rawPayload: row, fieldName: 'tier_code' });
      errors += 1;
      continue;
    }
    if (Number.isNaN(monthlyRate) || monthlyRate < 0) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanRateDetail', sourceRowNumber: rowNumber, errorCode: 'NEGATIVE_RATE', errorMessage: `Invalid rate: ${row.monthly_rate}`, rawPayload: row, fieldName: 'monthly_rate' });
      errors += 1;
      continue;
    }
    if (seenKeys.has(key)) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanRateDetail', sourceRowNumber: rowNumber, errorCode: 'DUPLICATE_KEY', errorMessage: `Duplicate rate key ${key}`, rawPayload: row });
      errors += 1;
      continue;
    }

    if (!ACA_STANDARD_BANDS.map((band) => band.code).includes(row.age_band_code)) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanRateDetail', sourceRowNumber: rowNumber, errorCode: 'INVALID_AGE_BAND', errorMessage: `Unknown age band: ${row.age_band_code}`, severity: 'warning', rawPayload: row, fieldName: 'age_band_code' });
      warnings += 1;
    }

    seenKeys.add(key);
    writeRows.push({
      rate_schedule_id: payload.rateScheduleId,
      plan_id: payload.planId,
      rating_area_code: row.rating_area_code,
      age_band_code: row.age_band_code,
      tier_code: normalizedTier,
      tier_label_raw: row.tier_code,
      tobacco_flag: row.tobacco_flag === true || row.tobacco_flag === 'Y' || row.tobacco_flag === 'true',
      monthly_rate: monthlyRate,
      annual_rate: Math.round(monthlyRate * 12 * 100) / 100,
      effective_date: row.effective_date || undefined,
      termination_date: row.termination_date || undefined,
      is_active: true,
    });
    success += 1;
  }

  if (writeRows.length > 0) {
    await base44.asServiceRole.entities.PlanRateDetail.bulkCreate(writeRows);
    await base44.asServiceRole.entities.PlanRateSchedule.update(payload.rateScheduleId, {
      row_count: writeRows.length,
      validation_status: errors > 0 ? 'has_errors' : warnings > 0 ? 'has_warnings' : 'valid',
    });
  }

  const status = errors > 0 && success === 0 ? 'failed' : errors > 0 || warnings > 0 ? 'completed_with_warnings' : 'completed';
  await finalizeRun(base44, run.id, { status, totalRows: payload.rows.length, successRows: success, errorRows: errors, warningRows: warnings });
  return { run_id: run.id, status, success, errors, warnings, total: payload.rows.length };
}

async function importZipRows(base44, payload, user) {
  const run = await createImportRun(base44, { importType: 'zip_area_map', sourceFileName: payload.sourceFileName, planId: payload.planId, createdBy: user.email });
  const seenKeys = new Set();
  const writeRows = [];
  let success = 0;
  let errors = 0;
  let warnings = 0;

  for (let index = 0; index < payload.rows.length; index++) {
    const row = payload.rows[index];
    const rowNumber = index + 2;
    const zip = normalizeZip(row.zip_code || row.zip);
    const duplicateKey = `${payload.planId || 'global'}|${zip}|${row.effective_date || ''}`;

    if (!zip) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanZipAreaMap', sourceRowNumber: rowNumber, errorCode: 'INVALID_ZIP', errorMessage: `Invalid ZIP: ${row.zip_code || row.zip}`, rawPayload: row, fieldName: 'zip_code' });
      errors += 1;
      continue;
    }
    if (!row.rating_area_code) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanZipAreaMap', sourceRowNumber: rowNumber, errorCode: 'MISSING_REQUIRED_FIELD', errorMessage: 'Missing rating_area_code', rawPayload: row, fieldName: 'rating_area_code' });
      errors += 1;
      continue;
    }
    if (seenKeys.has(duplicateKey)) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanZipAreaMap', sourceRowNumber: rowNumber, errorCode: 'DUPLICATE_KEY', errorMessage: `Duplicate ZIP key ${duplicateKey}`, rawPayload: row });
      errors += 1;
      continue;
    }
    if (!row.state_code && !row.state) {
      await logException(base44, { importRunId: run.id, entityName: 'PlanZipAreaMap', sourceRowNumber: rowNumber, errorCode: 'INVALID_STATE_CODE', errorMessage: 'Missing state code', severity: 'warning', rawPayload: row });
      warnings += 1;
    }

    seenKeys.add(duplicateKey);
    writeRows.push({
      plan_id: payload.planId || undefined,
      zip_code: zip,
      state_code: row.state_code || row.state || undefined,
      county: row.county || undefined,
      city: row.city || undefined,
      rating_area_code: row.rating_area_code,
      effective_date: row.effective_date || undefined,
      termination_date: row.termination_date || undefined,
      is_active: true,
      source: 'carrier_provided',
    });
    success += 1;
  }

  if (writeRows.length > 0) await base44.asServiceRole.entities.PlanZipAreaMap.bulkCreate(writeRows);
  const status = errors > 0 && success === 0 ? 'failed' : errors > 0 || warnings > 0 ? 'completed_with_warnings' : 'completed';
  await finalizeRun(base44, run.id, { status, totalRows: payload.rows.length, successRows: success, errorRows: errors, warningRows: warnings });
  return { run_id: run.id, status, success, errors, warnings, total: payload.rows.length };
}

async function caseRatingEngine(base44, payload, user) {
  const run = await createImportRun(base44, { importType: 'census_members', planId: payload.planId, caseId: payload.caseId, createdBy: user.email });
  const members = await base44.asServiceRole.entities.CensusMember.filter({ case_id: payload.caseId });
  if (!members.length) {
    await finalizeRun(base44, run.id, { status: 'failed', totalRows: 0, successRows: 0, errorRows: 1, warningRows: 0 });
    return { error: 'No census members found for this case', run_id: run.id };
  }

  const memberResults = [];
  const errors = [];
  const warnings = [];
  const tierBreakdown = { EE: { count: 0, premium: 0 }, ES: { count: 0, premium: 0 }, EC: { count: 0, premium: 0 }, FAM: { count: 0, premium: 0 } };
  const areaBreakdown = {};
  let totalPremium = 0;
  let failedCount = 0;
  let totalAge = 0;
  let ageCount = 0;

  for (let index = 0; index < members.length; index++) {
    const member = members[index];
    const result = { member_id: member.id, name: `${member.first_name} ${member.last_name}`, errors: [] };
    const zip = normalizeZip(member.zip);
    if (!zip) {
      const message = `Invalid ZIP for ${member.first_name} ${member.last_name}`;
      result.errors.push(message);
      errors.push(message);
      failedCount += 1;
      memberResults.push(result);
      continue;
    }

    const areaResolution = await zipToAreaResolver(base44, { zip, planId: payload.planId, effectiveDate: payload.effectiveDate });
    if (areaResolution.error) {
      result.errors.push(areaResolution.error);
      errors.push(areaResolution.error);
      failedCount += 1;
      memberResults.push(result);
      continue;
    }

    const normalizedDob = normalizeDob(member.date_of_birth);
    if (!normalizedDob) {
      const message = `Invalid DOB for ${member.first_name} ${member.last_name}`;
      result.errors.push(message);
      errors.push(message);
      failedCount += 1;
      memberResults.push(result);
      continue;
    }

    const age = dobToAge(normalizedDob, payload.effectiveDate);
    const ageBand = ageToBand(age);
    if (!ageBand) {
      const message = `Unable to resolve age band for age ${age}`;
      result.errors.push(message);
      errors.push(message);
      failedCount += 1;
      memberResults.push(result);
      continue;
    }

    const rawTier = member.coverage_tier || 'EE';
    const tierCode = VALID_TIERS.includes(rawTier) ? rawTier : tierNormalizer(String(rawTier).replace(/_/g, ' '));
    if (!tierCode) {
      const message = `Unknown tier: ${rawTier}`;
      result.errors.push(message);
      errors.push(message);
      failedCount += 1;
      memberResults.push(result);
      continue;
    }

    const rateResolution = await planRateResolver(base44, {
      planId: payload.planId,
      rateScheduleId: payload.rateScheduleId,
      ratingAreaCode: areaResolution.rating_area_code,
      ageBandCode: ageBand.code,
      tierCode,
      tobaccoFlag: false,
    });
    if (rateResolution.error) {
      result.errors.push(rateResolution.error);
      errors.push(rateResolution.error);
      failedCount += 1;
      memberResults.push(result);
      continue;
    }

    result.rating_area_code = areaResolution.rating_area_code;
    result.age = age;
    result.age_band_code = ageBand.code;
    result.tier_code = tierCode;
    result.monthly_rate = rateResolution.monthly_rate;
    totalPremium += rateResolution.monthly_rate;
    totalAge += age;
    ageCount += 1;
    tierBreakdown[tierCode].count += 1;
    tierBreakdown[tierCode].premium += rateResolution.monthly_rate;
    if (!areaBreakdown[areaResolution.rating_area_code]) areaBreakdown[areaResolution.rating_area_code] = { count: 0, premium: 0 };
    areaBreakdown[areaResolution.rating_area_code].count += 1;
    areaBreakdown[areaResolution.rating_area_code].premium += rateResolution.monthly_rate;
    memberResults.push(result);
  }

  const ratedCount = memberResults.length - failedCount;
  const status = failedCount === memberResults.length ? 'failed' : 'completed';
  await base44.asServiceRole.entities.CaseRatedResult.create({
    case_id: payload.caseId,
    plan_id: payload.planId,
    rate_schedule_id: payload.rateScheduleId || undefined,
    census_version_id: members[0]?.census_version_id || undefined,
    rating_date: payload.effectiveDate,
    total_members_rated: ratedCount,
    total_members_failed: failedCount,
    total_monthly_premium: Math.round(totalPremium * 100) / 100,
    ee_monthly: Math.round(tierBreakdown.EE.premium * 100) / 100,
    es_monthly: Math.round(tierBreakdown.ES.premium * 100) / 100,
    ec_monthly: Math.round(tierBreakdown.EC.premium * 100) / 100,
    fam_monthly: Math.round(tierBreakdown.FAM.premium * 100) / 100,
    avg_age: ageCount > 0 ? Math.round((totalAge / ageCount) * 10) / 10 : undefined,
    rating_area_breakdown: areaBreakdown,
    tier_breakdown: tierBreakdown,
    member_results: memberResults,
    errors,
    warnings,
    status,
    rated_by: user.email,
  });

  await finalizeRun(base44, run.id, { status: failedCount === memberResults.length ? 'failed' : failedCount > 0 ? 'completed_with_warnings' : 'completed', totalRows: members.length, successRows: ratedCount, errorRows: failedCount, warningRows: warnings.length });
  return { run_id: run.id, status, total_members_rated: ratedCount, total_members_failed: failedCount, total_monthly_premium: Math.round(totalPremium * 100) / 100, ee_monthly: Math.round(tierBreakdown.EE.premium * 100) / 100, es_monthly: Math.round(tierBreakdown.ES.premium * 100) / 100, ec_monthly: Math.round(tierBreakdown.EC.premium * 100) / 100, fam_monthly: Math.round(tierBreakdown.FAM.premium * 100) / 100, tier_breakdown: tierBreakdown, rating_area_breakdown: areaBreakdown, member_results: memberResults, warnings };
}

async function validateRateSchedule(base44, payload) {
  const rates = await base44.asServiceRole.entities.PlanRateDetail.filter({ rate_schedule_id: payload.rateScheduleId });
  const errors = [];
  const seenKeys = new Set();
  const tiersByAreaBand = {};

  rates.forEach((rate, index) => {
    if (!rate.monthly_rate || rate.monthly_rate <= 0) errors.push(`Row ${index + 1}: Missing or zero monthly_rate`);
    if (!rate.rating_area_code) errors.push(`Row ${index + 1}: Missing rating_area_code`);
    if (!rate.age_band_code) errors.push(`Row ${index + 1}: Missing age_band_code`);
    if (!VALID_TIERS.includes(rate.tier_code)) errors.push(`Row ${index + 1}: Invalid tier_code ${rate.tier_code}`);
    const rateKey = `${rate.rating_area_code}|${rate.age_band_code}|${rate.tier_code}|${rate.tobacco_flag}`;
    if (seenKeys.has(rateKey)) errors.push(`Row ${index + 1}: Duplicate rate key ${rateKey}`);
    seenKeys.add(rateKey);
    const areaBandKey = `${rate.rating_area_code}|${rate.age_band_code}`;
    if (!tiersByAreaBand[areaBandKey]) tiersByAreaBand[areaBandKey] = new Set();
    tiersByAreaBand[areaBandKey].add(rate.tier_code);
  });

  Object.entries(tiersByAreaBand).forEach(([areaBandKey, tiers]) => {
    const missingTiers = VALID_TIERS.filter((tier) => !tiers.has(tier));
    if (missingTiers.length > 0) errors.push(`Missing tiers for ${areaBandKey}: ${missingTiers.join(', ')}`);
  });

  const status = errors.length === 0 ? 'valid' : 'has_errors';
  await base44.asServiceRole.entities.PlanRateSchedule.update(payload.rateScheduleId, { validation_status: status, validation_errors: errors.slice(0, 100), row_count: rates.length });
  return { status, error_count: errors.length, errors: errors.slice(0, 100), row_count: rates.length };
}

async function seedAgeBandSchema(base44) {
  const existing = await base44.asServiceRole.entities.AgeBandSchema.filter({ schema_code: 'ACA_STANDARD_10' });
  if (existing.length >= ACA_STANDARD_BANDS.length) return { message: 'Already seeded', count: existing.length };
  await base44.asServiceRole.entities.AgeBandSchema.bulkCreate(ACA_STANDARD_BANDS.map((band) => ({ schema_code: 'ACA_STANDARD_10', schema_name: 'ACA Standard 10-Band', age_min: band.min, age_max: band.max, band_label: band.label, band_code: band.code, sort_order: band.sort, is_active: true })));
  return { message: 'Seeded', count: ACA_STANDARD_BANDS.length };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    validatePayload(body);

    if (body.action === 'zipToArea') return Response.json(await zipToAreaResolver(base44, { zip: body.zip, planId: body.planId, effectiveDate: body.effectiveDate || new Date().toISOString().slice(0, 10) }));
    if (body.action === 'dobToAgeBand') {
      const normalizedDob = normalizeDob(body.dob);
      if (!normalizedDob) return Response.json({ error: 'Invalid DOB' }, { status: 400 });
      const age = dobToAge(normalizedDob, body.effectiveDate || new Date().toISOString().slice(0, 10));
      const band = ageToBand(age);
      return Response.json({ age, band_code: band?.code || null, band_label: band?.label || null });
    }
    if (body.action === 'tierNormalize') return Response.json({ normalized: tierNormalizer(body.tier), input: body.tier });
    if (body.action === 'rateResolve') return Response.json(await planRateResolver(base44, body));
    if (body.action === 'rateCensus') return Response.json(await caseRatingEngine(base44, { ...body, effectiveDate: body.effectiveDate || new Date().toISOString().slice(0, 10) }, user));
    if (body.action === 'importRateRows') return Response.json(await importRateRows(base44, body, user));
    if (body.action === 'importZipRows') return Response.json(await importZipRows(base44, body, user));
    if (body.action === 'validateRateSchedule') return Response.json(await validateRateSchedule(base44, body));
    if (body.action === 'seedAgeBandSchema') {
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      return Response.json(await seedAgeBandSchema(base44));
    }

    return Response.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});