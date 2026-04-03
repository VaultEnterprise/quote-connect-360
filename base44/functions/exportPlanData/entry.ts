import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import * as XLSX from 'npm:xlsx@0.18.5';

const PLAN_FIELDS = [
  'id',
  'plan_type',
  'carrier',
  'plan_name',
  'plan_code',
  'network_type',
  'state',
  'effective_date',
  'policy_expiration_date',
  'schedule_of_benefits_url',
  'hsa_eligible',
  'status',
  'notes',
  'created_date',
  'updated_date',
  'created_by'
];

const SCHEDULE_FIELDS = [
  'id',
  'plan_id',
  'schedule_name',
  'effective_date',
  'termination_date',
  'rating_basis',
  'tobacco_mode',
  'state_scope',
  'version_number',
  'plan_year',
  'market_segment',
  'funding_type',
  'rating_model',
  'tobacco_rating_flag',
  'is_active',
  'uploaded_by',
  'row_count',
  'validation_status',
  'validation_errors',
  'notes',
  'created_date',
  'updated_date',
  'created_by'
];

const RATE_FIELDS = [
  'id',
  'rate_schedule_id',
  'plan_id',
  'rating_area_code',
  'age_band_code',
  'age_min',
  'age_max',
  'tobacco_flag',
  'tier_code',
  'tier_label_raw',
  'monthly_rate',
  'annual_rate',
  'effective_date',
  'termination_date',
  'is_active',
  'created_date',
  'updated_date',
  'created_by'
];

function slugify(value) {
  return String(value || 'plan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'plan';
}

function normalizeValue(value) {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value == null) return '';
  return value;
}

function pickFields(row, fields) {
  const picked = {};
  for (const field of fields) {
    picked[field] = normalizeValue(row?.[field]);
  }
  return picked;
}

function escapeSql(value) {
  if (value == null || value === '') return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildInsert(tableName, rows, fields) {
  if (!rows.length) return `-- No rows for ${tableName}`;
  return rows.map((row) => {
    const values = fields.map((field) => escapeSql(Array.isArray(row[field]) || (row[field] && typeof row[field] === 'object') ? JSON.stringify(row[field]) : row[field]));
    return `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${values.join(', ')});`;
  }).join('\n');
}

function buildDelimitedRows(plan, schedules, rateDetails) {
  if (!rateDetails.length) {
    return [
      {
        plan_id: plan.id,
        plan_name: plan.plan_name,
        carrier: plan.carrier,
        schedule_id: '',
        schedule_name: '',
        rating_area_code: '',
        age_band_code: '',
        tier_code: '',
        monthly_rate: '',
        annual_rate: ''
      }
    ];
  }

  const schedulesById = Object.fromEntries(schedules.map((schedule) => [schedule.id, schedule]));
  return rateDetails.map((rate) => {
    const schedule = schedulesById[rate.rate_schedule_id] || {};
    return {
      plan_id: plan.id,
      plan_name: plan.plan_name,
      carrier: plan.carrier,
      plan_type: plan.plan_type,
      state: plan.state,
      effective_date: plan.effective_date,
      schedule_id: schedule.id || '',
      schedule_name: schedule.schedule_name || '',
      schedule_effective_date: schedule.effective_date || '',
      rating_area_code: rate.rating_area_code || '',
      age_band_code: rate.age_band_code || '',
      age_min: rate.age_min ?? '',
      age_max: rate.age_max ?? '',
      tier_code: rate.tier_code || '',
      tobacco_flag: rate.tobacco_flag ? 'true' : 'false',
      monthly_rate: rate.monthly_rate ?? '',
      annual_rate: rate.annual_rate ?? ''
    };
  });
}

function toBase64FromString(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id: planId, format = 'xlsx' } = await req.json();

    if (!planId) {
      return Response.json({ error: 'plan_id is required' }, { status: 400 });
    }

    const [plans, schedules, rateDetails] = await Promise.all([
      base44.entities.BenefitPlan.filter({ id: planId }),
      base44.entities.PlanRateSchedule.filter({ plan_id: planId }, '-version_number', 500),
      base44.entities.PlanRateDetail.filter({ plan_id: planId }, '-created_date', 10000),
    ]);

    const plan = plans[0];

    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 });
    }

    const baseName = `${slugify(plan.plan_name || plan.plan_code || plan.id)}-export`;
    const normalizedPlan = pickFields(plan, PLAN_FIELDS);
    const normalizedSchedules = schedules.map((row) => pickFields(row, SCHEDULE_FIELDS));
    const normalizedRateDetails = rateDetails.map((row) => pickFields(row, RATE_FIELDS));

    if (format === 'json') {
      const content = JSON.stringify({
        exported_at: new Date().toISOString(),
        plan: normalizedPlan,
        rate_schedules: normalizedSchedules,
        rate_details: normalizedRateDetails,
      }, null, 2);

      return Response.json({
        filename: `${baseName}.json`,
        mimeType: 'application/json',
        content,
        encoding: 'text'
      });
    }

    if (format === 'sql') {
      const content = [
        '-- BenefitPlan export',
        buildInsert('BenefitPlan', [plan], PLAN_FIELDS),
        '',
        '-- PlanRateSchedule export',
        buildInsert('PlanRateSchedule', schedules, SCHEDULE_FIELDS),
        '',
        '-- PlanRateDetail export',
        buildInsert('PlanRateDetail', rateDetails, RATE_FIELDS),
      ].join('\n');

      return Response.json({
        filename: `${baseName}.sql`,
        mimeType: 'application/sql',
        content,
        encoding: 'text'
      });
    }

    if (format === 'csv' || format === 'txt') {
      const rows = buildDelimitedRows(plan, schedules, rateDetails);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const delimiter = format === 'csv' ? ',' : '\t';
      const content = XLSX.utils.sheet_to_csv(worksheet, { FS: delimiter });

      return Response.json({
        filename: `${baseName}.${format === 'csv' ? 'csv' : 'txt'}`,
        mimeType: format === 'csv' ? 'text/csv' : 'text/plain',
        content,
        encoding: 'text'
      });
    }

    if (format === 'xlsx' || format === 'xls') {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([normalizedPlan]), 'Plan');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(normalizedSchedules.length ? normalizedSchedules : [{ note: 'No rate schedules found' }]), 'RateSchedules');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(normalizedRateDetails.length ? normalizedRateDetails : [{ note: 'No rate details found' }]), 'RateDetails');

      const base64 = XLSX.write(workbook, {
        type: 'base64',
        bookType: format,
      });

      return Response.json({
        filename: `${baseName}.${format}`,
        mimeType: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/vnd.ms-excel',
        content: base64,
        encoding: 'base64'
      });
    }

    return Response.json({ error: 'Unsupported export format' }, { status: 400 });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});