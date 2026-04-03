import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as XLSX from 'npm:xlsx@0.18.5';

const AGE_BANDS = {
  Under25: { code: 'Under25', min: 0, max: 24 },
  '25-29': { code: '25-29', min: 25, max: 29 },
  '30-34': { code: '30-34', min: 30, max: 34 },
  '35-39': { code: '35-39', min: 35, max: 39 },
  '40-44': { code: '40-44', min: 40, max: 44 },
  '45-49': { code: '45-49', min: 45, max: 49 },
  '50-54': { code: '50-54', min: 50, max: 54 },
  '55-59': { code: '55-59', min: 55, max: 59 },
  '60-64': { code: '60-64', min: 60, max: 64 },
  '65+': { code: '65+', min: 65, max: 999 },
};

const TIER_MAP = {
  single: 'EE',
  ee: 'EE',
  'employee only': 'EE',
  'ee + sp': 'ES',
  'ee+sp': 'ES',
  'ee + spouse': 'ES',
  'ee+spouse': 'ES',
  'ee + ch(ren)': 'EC',
  'ee+ch(ren)': 'EC',
  'ee + children': 'EC',
  'ee+children': 'EC',
  family: 'FAM',
};

function chunk(array, size) {
  const chunks = [];
  for (let index = 0; index < array.length; index += size) chunks.push(array.slice(index, index + size));
  return chunks;
}

function normalizeZip(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.padStart(5, '0').slice(-5);
}

function normalizeStateCode(value) {
  const state = String(value ?? '').trim().toUpperCase();
  return state.length === 2 && state !== 'OTHER' ? state : null;
}

function normalizeTier(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return TIER_MAP[normalized] || null;
}

function normalizeTobacco(value) {
  const normalized = String(value ?? '').trim().toUpperCase();
  return normalized === 'Y' || normalized === 'YES' || normalized === 'T' || normalized === 'TRUE';
}

function normalizeAgeBand(value) {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!normalized) return null;
  if (/^under\s*25$/i.test(normalized)) return AGE_BANDS.Under25;
  if (/^(0?25)\s*-\s*(0?29)$/i.test(normalized)) return AGE_BANDS['25-29'];
  if (/^(0?30)\s*-\s*(0?34)$/i.test(normalized)) return AGE_BANDS['30-34'];
  if (/^(0?35)\s*-\s*(0?39)$/i.test(normalized)) return AGE_BANDS['35-39'];
  if (/^(0?40)\s*-\s*(0?44)$/i.test(normalized)) return AGE_BANDS['40-44'];
  if (/^(0?45)\s*-\s*(0?49)$/i.test(normalized)) return AGE_BANDS['45-49'];
  if (/^(0?50)\s*-\s*(0?54)$/i.test(normalized)) return AGE_BANDS['50-54'];
  if (/^(0?55)\s*-\s*(0?59)$/i.test(normalized)) return AGE_BANDS['55-59'];
  if (/^(0?60)\s*-\s*(0?64)$/i.test(normalized)) return AGE_BANDS['60-64'];
  if (/^(0?65\+|0?65 and over|0?65 or over)$/i.test(normalized)) return AGE_BANDS['65+'];
  return null;
}

function normalizeMoney(value) {
  const parsed = parseFloat(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function endOfYear(dateString) {
  const year = Number(String(dateString).slice(0, 4));
  return Number.isFinite(year) ? `${year}-12-31` : null;
}

function inferPlanName(fileName) {
  return String(fileName || 'Imported Plan Workbook')
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

Deno.serve(async (req) => {
  let runId = null;

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin role required' }, { status: 403 });


    const body = await req.json();
    const planDraft = body.planDraft || {};
    if (!body.file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });
    if (!planDraft.carrier || !planDraft.plan_name || !planDraft.effective_date || !planDraft.policy_expiration_date) {
      return Response.json({ error: 'carrier, plan_name, effective_date, and policy_expiration_date are required' }, { status: 400 });
    }

    const workbookResponse = await fetch(body.file_url);
    if (!workbookResponse.ok) return Response.json({ error: 'Unable to fetch workbook file' }, { status: 400 });

    const workbookBuffer = await workbookResponse.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(workbookBuffer), { type: 'array' });
    const ratesSheet = workbook.Sheets['Rates by Area Tier'];
    const zipSheet = workbook.Sheets['Zip Code to Area'];

    if (!ratesSheet) return Response.json({ error: 'Sheet "Rates by Area Tier" was not found' }, { status: 400 });
    if (!zipSheet) return Response.json({ error: 'Sheet "Zip Code to Area" was not found' }, { status: 400 });

    const rateRows = XLSX.utils.sheet_to_json(ratesSheet, { defval: null });
    const zipRows = XLSX.utils.sheet_to_json(zipSheet, { defval: null });

    const stateScope = [...new Set(zipRows.map((row) => normalizeStateCode(row.State)).filter(Boolean))].sort();
    const hasTobaccoRates = rateRows.some((row) => normalizeTobacco(row.Tobacco));
    const effectiveDate = planDraft.effective_date;
    const policyExpirationDate = planDraft.policy_expiration_date;
    const planName = String(planDraft.plan_name || inferPlanName(body.sourceFileName)).trim();

    const plan = await base44.asServiceRole.entities.BenefitPlan.create({
      plan_type: planDraft.plan_type || 'medical',
      carrier: String(planDraft.carrier).trim(),
      plan_name: planName,
      plan_code: planDraft.plan_code ? String(planDraft.plan_code).trim() : undefined,
      network_type: planDraft.network_type ? String(planDraft.network_type).trim() : undefined,
      state: planDraft.state ? String(planDraft.state).trim().toUpperCase() : stateScope.length === 1 ? stateScope[0] : '',
      effective_date: effectiveDate,
      policy_expiration_date: policyExpirationDate,
      hsa_eligible: !!planDraft.hsa_eligible,
      notes: planDraft.notes ? String(planDraft.notes).trim() : `Imported from workbook: ${body.sourceFileName || 'uploaded workbook'}`,
      status: 'active',
    });

    const schedule = await base44.asServiceRole.entities.PlanRateSchedule.create({
      plan_id: plan.id,
      schedule_name: planDraft.schedule_name ? String(planDraft.schedule_name).trim() : `${planName} Rates`,
      effective_date: effectiveDate,
      termination_date: planDraft.termination_date || policyExpirationDate || endOfYear(effectiveDate),
      rating_basis: 'age_band_area_tier',
      tobacco_mode: hasTobaccoRates ? 'separate_rate' : 'none',
      tobacco_rating_flag: hasTobaccoRates,
      plan_year: Number(String(effectiveDate).slice(0, 4)),
      market_segment: planDraft.market_segment || 'small_group',
      funding_type: planDraft.funding_type || 'fully_insured',
      rating_model: 'area_age_band_tier',
      version_number: 1,
      state_scope: stateScope,
      notes: planDraft.schedule_notes ? String(planDraft.schedule_notes).trim() : 'Created from special workbook import',
      validation_status: 'pending',
      is_active: true,
      uploaded_by: user.email,
    });

    const run = await base44.asServiceRole.entities.ImportRun.create({
      import_type: 'rate_detail',
      source_file_name: body.sourceFileName || 'special_rate_workbook.xlsx',
      plan_id: plan.id,
      rate_schedule_id: schedule.id,
      status: 'running',
      started_at: new Date().toISOString(),
      created_by: user.email,
      rollback_available: true,
      notes: 'Plan + schedule created from workbook import',
    });
    runId = run.id;

    const detailWrites = [];
    const zipWrites = [];
    const seenRateKeys = new Set();
    const seenZipKeys = new Set();
    let errors = 0;
    let warnings = 0;
    let skippedDuplicates = 0;

    for (let index = 0; index < rateRows.length; index++) {
      const row = rateRows[index];
      const sourceRow = index + 2;
      const area = String(row.Area ?? '').trim().toUpperCase();
      const band = normalizeAgeBand(row['Age Band']);
      const tierCode = normalizeTier(row.Tier);
      const monthlyRate = normalizeMoney(row['Monthly Rate']);
      const tobaccoFlag = normalizeTobacco(row.Tobacco);

      if (!area || !band || !tierCode || Number.isNaN(monthlyRate) || monthlyRate <= 0) {
        await base44.asServiceRole.entities.ImportException.create({
          import_run_id: run.id,
          entity_name: 'PlanRateDetail',
          sheet_name: 'Rates by Area Tier',
          source_row_number: sourceRow,
          error_code: !band ? 'INVALID_AGE_BAND' : !tierCode ? 'INVALID_TIER_CODE' : 'MISSING_REQUIRED_FIELD',
          error_message: 'Could not normalize one or more required rate fields',
          severity: 'error',
          raw_payload_json: row,
        });
        errors += 1;
        continue;
      }

      const dedupeKey = `${area}|${band.code}|${tierCode}|${tobaccoFlag}`;
      if (seenRateKeys.has(dedupeKey)) {
        skippedDuplicates += 1;
        continue;
      }

      seenRateKeys.add(dedupeKey);
      detailWrites.push({
        rate_schedule_id: schedule.id,
        plan_id: plan.id,
        rating_area_code: area,
        age_band_code: band.code,
        age_min: band.min,
        age_max: band.max,
        tobacco_flag: tobaccoFlag,
        tier_code: tierCode,
        tier_label_raw: String(row.Tier ?? '').trim(),
        monthly_rate: Math.round(monthlyRate * 100) / 100,
        annual_rate: Math.round(monthlyRate * 12 * 100) / 100,
        effective_date: schedule.effective_date,
        is_active: true,
      });
    }

    for (let index = 0; index < zipRows.length; index++) {
      const row = zipRows[index];
      const sourceRow = index + 2;
      const zip = normalizeZip(row.Zip);
      const stateCode = normalizeStateCode(row.State);
      const area = String(row.Area ?? '').trim().toUpperCase();

      if (!zip || !stateCode || !area) {
        await base44.asServiceRole.entities.ImportException.create({
          import_run_id: run.id,
          entity_name: 'PlanZipAreaMap',
          sheet_name: 'Zip Code to Area',
          source_row_number: sourceRow,
          error_code: !zip ? 'INVALID_ZIP' : !stateCode ? 'INVALID_STATE_CODE' : 'UNKNOWN_RATING_AREA',
          error_message: 'Could not normalize one or more required ZIP mapping fields',
          severity: 'error',
          raw_payload_json: row,
        });
        errors += 1;
        continue;
      }

      const dedupeKey = `${zip}|${schedule.effective_date || ''}`;
      if (seenZipKeys.has(dedupeKey)) {
        skippedDuplicates += 1;
        continue;
      }

      seenZipKeys.add(dedupeKey);
      zipWrites.push({
        plan_id: plan.id,
        zip_code: zip,
        state_code: stateCode,
        county: row.County ? String(row.County).trim() : undefined,
        city: row.City ? String(row.City).trim() : undefined,
        rating_area_code: area,
        effective_date: schedule.effective_date,
        is_active: true,
        source: 'carrier_provided',
      });
    }

    for (const batch of chunk(detailWrites, 500)) {
      await base44.asServiceRole.entities.PlanRateDetail.bulkCreate(batch);
    }
    for (const batch of chunk(zipWrites, 1000)) {
      await base44.asServiceRole.entities.PlanZipAreaMap.bulkCreate(batch);
    }

    if (detailWrites.length === 0) {
      await base44.asServiceRole.entities.ImportException.create({
        import_run_id: run.id,
        entity_name: 'PlanRateDetail',
        sheet_name: 'Rates by Area Tier',
        error_code: 'MISSING_RATE_ROWS',
        error_message: 'No new rate detail rows were imported from the workbook',
        severity: 'warning',
      });
      warnings += 1;
    }

    await base44.asServiceRole.entities.PlanRateSchedule.update(schedule.id, {
      row_count: detailWrites.length,
      validation_status: errors > 0 ? 'has_errors' : warnings > 0 ? 'has_warnings' : 'valid',
    });

    const totalRows = rateRows.length + zipRows.length;
    const successRows = detailWrites.length + zipWrites.length;
    const status = successRows === 0 ? 'failed' : errors > 0 || warnings > 0 ? 'completed_with_warnings' : 'completed';

    await base44.asServiceRole.entities.ImportRun.update(run.id, {
      status,
      completed_at: new Date().toISOString(),
      total_rows: totalRows,
      success_rows: successRows,
      error_rows: errors,
      warning_rows: warnings,
    });

    return Response.json({
      plan_id: plan.id,
      schedule_id: schedule.id,
      status,
      imported_rate_rows: detailWrites.length,
      imported_zip_rows: zipWrites.length,
      skipped_duplicates: skippedDuplicates,
      error_rows: errors,
      warning_rows: warnings,
      total_source_rows: totalRows,
      detected_sheets: workbook.SheetNames,
    });
  } catch (error) {
    if (runId) {
      try {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.ImportRun.update(runId, {
          status: 'failed',
          completed_at: new Date().toISOString(),
        });
      } catch (_) {}
    }
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});