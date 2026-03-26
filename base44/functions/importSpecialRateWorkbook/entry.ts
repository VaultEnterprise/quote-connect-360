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

function normalizeZip(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.padStart(5, '0').slice(-5);
}

function normalizeStateCode(value) {
  const state = String(value ?? '').trim().toUpperCase();
  return state.length === 2 ? state : null;
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

function chunk(array, size) {
  const chunks = [];
  for (let index = 0; index < array.length; index += size) chunks.push(array.slice(index, index + size));
  return chunks;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.file_url || !body.planId || !body.rateScheduleId) {
      return Response.json({ error: 'file_url, planId, and rateScheduleId are required' }, { status: 400 });
    }

    const scheduleRows = await base44.asServiceRole.entities.PlanRateSchedule.filter({ id: body.rateScheduleId }, '-created_date', 1);
    const schedule = scheduleRows[0];
    if (!schedule) return Response.json({ error: 'Rate schedule not found' }, { status: 404 });
    if (schedule.plan_id !== body.planId) return Response.json({ error: 'Selected schedule does not belong to the selected plan' }, { status: 400 });

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

    const run = await base44.asServiceRole.entities.ImportRun.create({
      import_type: 'rate_detail',
      source_file_name: body.sourceFileName || 'special_rate_workbook.xlsx',
      plan_id: body.planId,
      rate_schedule_id: body.rateScheduleId,
      status: 'running',
      started_at: new Date().toISOString(),
      created_by: user.email,
      rollback_available: true,
      notes: 'Special importer workbook: rates + ZIP area mappings',
    });

    const existingRateRows = await base44.asServiceRole.entities.PlanRateDetail.filter({ rate_schedule_id: body.rateScheduleId }, '-created_date', 5000);
    const existingZipRows = await base44.asServiceRole.entities.PlanZipAreaMap.filter({ plan_id: body.planId }, '-created_date', 50000);
    const existingRateKeys = new Set(existingRateRows.map((row) => `${row.rating_area_code}|${row.age_band_code}|${row.tier_code}|${!!row.tobacco_flag}`));
    const existingZipKeys = new Set(existingZipRows.map((row) => `${row.zip_code}|${row.effective_date || ''}`));

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
      const monthlyRate = Number(row['Monthly Rate']);
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
      if (existingRateKeys.has(dedupeKey) || seenRateKeys.has(dedupeKey)) {
        skippedDuplicates += 1;
        continue;
      }

      seenRateKeys.add(dedupeKey);
      detailWrites.push({
        rate_schedule_id: body.rateScheduleId,
        plan_id: body.planId,
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
      if (existingZipKeys.has(dedupeKey) || seenZipKeys.has(dedupeKey)) {
        skippedDuplicates += 1;
        continue;
      }

      seenZipKeys.add(dedupeKey);
      zipWrites.push({
        plan_id: body.planId,
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

    await base44.asServiceRole.entities.PlanRateSchedule.update(body.rateScheduleId, {
      row_count: (existingRateRows.length || 0) + detailWrites.length,
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
      run_id: run.id,
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
    return Response.json({ error: error.message }, { status: 500 });
  }
});