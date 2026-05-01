export const VAULT_TARGET_SHEET = 'GROUP INFO & CENSUS';

export function excelSerialToIso(value) {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return '';
  const utcDays = Math.floor(value - 25569);
  const utcValue = utcDays * 86400;
  return new Date(utcValue * 1000).toISOString().slice(0, 10);
}

export function normalizeCell(value) {
  if (value === null || value === undefined || value === false) return '';
  if (typeof value === 'number') return String(value);
  return String(value).replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalizeHeaderLabel(value) {
  return normalizeCell(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function isBlankLike(value) {
  const cell = normalizeCell(value);
  return !cell || cell === '0' || cell === ',' || cell === ', ,';
}

export function isEffectivelyBlankRow(row = []) {
  return row.every((cell) => isBlankLike(cell));
}

export function extractRowsFromCsv(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      rows.push(current);
      current = '';
      if (char === '\r' && next === '\n') i += 1;
    } else {
      current += char;
    }
  }
  if (current.length) rows.push(current);
  return rows.map((line) => {
    const cells = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        cells.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells;
  });
}

export function extractRowsFromWorksheet(records = []) {
  const columnKeys = Array.from(new Set(records.flatMap((row) => Object.keys(row || {})))).sort((a, b) => {
    const aNum = Number(String(a).replace('col_', ''));
    const bNum = Number(String(b).replace('col_', ''));
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
    return String(a).localeCompare(String(b));
  });
  return records.map((record) => columnKeys.map((key) => record?.[key] ?? ''));
}

export function detectFileType({ source_file_name = '', content_type = '' }) {
  const fileName = source_file_name.toLowerCase();
  const type = content_type.toLowerCase();
  if (fileName.endsWith('.xlsx') || type.includes('spreadsheetml')) return 'xlsx';
  return 'csv';
}

export function locateCensusSection(rows = []) {
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i += 1) {
    const labels = rows[i].map(normalizeHeaderLabel);
    const hasRelationship = labels.includes('relationship');
    const hasFirstName = labels.includes('first name');
    const hasLastName = labels.includes('last name');
    const hasDob = labels.includes('dob');
    if (hasRelationship && hasFirstName && hasLastName && hasDob) {
      headerIndex = i;
      break;
    }
  }
  return { headerIndex };
}

export function extractGroupMetadata(rows = []) {
  const metadata = {};
  rows.forEach((row) => {
    for (let i = 0; i < row.length - 1; i += 1) {
      const key = normalizeCell(row[i]);
      const next = row[i + 1];
      if (!key.endsWith(':')) continue;
      const normalizedKey = key.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const value = normalizeCell(next);
      if (value) metadata[normalizedKey] = value;
    }
  });
  return metadata;
}

export function normalizeCensusHeaders(headerRow = []) {
  const aliases = {
    relationship: 'relationship',
    first_name: 'first_name',
    last_name: 'last_name',
    address: 'address',
    city: 'city',
    state: 'state',
    zip: 'zip',
    gender: 'gender',
    dob: 'dob',
    coverage_type: 'coverage_type',
  };
  return headerRow.map((cell, index) => {
    const normalized = normalizeHeaderLabel(cell)
      .replace('coverage type ee es ec ef w', 'coverage_type')
      .replace('first name', 'first_name')
      .replace('last name', 'last_name');
    const compact = normalized.replace(/\s+/g, '_');
    return {
      index,
      source: normalizeCell(cell),
      canonical: aliases[compact] || compact,
    };
  });
}

export function isRelationshipCode(value) {
  const raw = normalizeCell(value).toUpperCase();
  return ['EMP', 'SPS', 'DEP'].includes(raw);
}

export function normalizeDateValue(value) {
  if (typeof value === 'number') return excelSerialToIso(value);
  const raw = normalizeCell(value);
  if (!raw || raw === '00:00:00') return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parts = raw.split(/[\/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    let [mm, dd, yyyy] = parts;
    if (yyyy.length === 2) yyyy = `19${yyyy}`;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return raw;
}

export function parseHouseholds(rows = [], headerMap = [], headerIndex = 0) {
  const getIndex = (canonical) => headerMap.find((item) => item.canonical === canonical)?.index ?? -1;
  const relationshipIndex = getIndex('relationship');
  const firstNameIndex = getIndex('first_name');
  const lastNameIndex = getIndex('last_name');
  const addressIndex = getIndex('address');
  const cityIndex = getIndex('city');
  const stateIndex = getIndex('state');
  const zipIndex = getIndex('zip');
  const genderIndex = getIndex('gender');
  const dobIndex = getIndex('dob');
  const coverageIndex = getIndex('coverage_type');

  let activeHouseholdKey = '';
  const records = [];
  rows.forEach((row, rowOffset) => {
    const rowNumber = headerIndex + rowOffset + 2;
    if (isEffectivelyBlankRow(row)) return;
    const relationship = normalizeCell(row[relationshipIndex]).toUpperCase();
    if (!isRelationshipCode(relationship)) return;
    const record = {
      relationship_code: relationship,
      first_name: normalizeCell(row[firstNameIndex]),
      last_name: normalizeCell(row[lastNameIndex]),
      address: normalizeCell(row[addressIndex]),
      city: normalizeCell(row[cityIndex]),
      state: normalizeCell(row[stateIndex]),
      zip: normalizeCell(row[zipIndex]).replace(/[^0-9-]/g, ''),
      gender: normalizeCell(row[genderIndex]),
      dob: normalizeDateValue(row[dobIndex]),
      coverage_type: normalizeCell(row[coverageIndex]).toUpperCase(),
      source_row_number: rowNumber,
      source_payload: Object.fromEntries(headerMap.map((item) => [item.source || `col_${item.index}`, row[item.index] ?? ''])),
    };
    const householdKey = [record.first_name, record.last_name, record.dob].filter(Boolean).join('|').toLowerCase();
    if (relationship === 'EMP') activeHouseholdKey = householdKey;
    record.household_key = relationship === 'EMP' ? householdKey : activeHouseholdKey;
    record.employee_id = '';
    record.dependent_link_type = relationship === 'EMP' ? 'employee' : relationship === 'SPS' ? 'spouse' : 'dependent';
    records.push(record);
  });
  return records;
}

export function buildValidationIssues(record) {
  const issues = [];
  if (!record.relationship_code) issues.push({ field: 'relationship_code', severity: 'critical', code: 'REQUIRED_FIELD_MISSING', message: 'Relationship code is required', recommended_fix: 'Set relationship to EMP, SPS, or DEP.' });
  if (!record.first_name) issues.push({ field: 'first_name', severity: 'critical', code: 'REQUIRED_FIELD_MISSING', message: 'First name is required', recommended_fix: 'Fill in the first name for this member row.' });
  if (!record.last_name) issues.push({ field: 'last_name', severity: 'critical', code: 'REQUIRED_FIELD_MISSING', message: 'Last name is required', recommended_fix: 'Fill in the last name for this member row.' });
  if (!record.dob || !/^\d{4}-\d{2}-\d{2}$/.test(record.dob)) issues.push({ field: 'dob', severity: 'critical', code: 'INVALID_DATE', message: 'DOB must normalize to YYYY-MM-DD', recommended_fix: 'Use a valid date in the DOB column.' });
  if (record.relationship_code !== 'EMP' && !record.household_key) issues.push({ field: 'household_key', severity: 'critical', code: 'MISSING_EMPLOYEE_LINK', message: 'Dependent row is not linked to an employee household', recommended_fix: 'Ensure dependent rows come after a matching EMP row.' });
  if (record.zip && !/^\d{5}(-\d{4})?$/.test(record.zip)) issues.push({ field: 'zip', severity: 'warning', code: 'INVALID_ZIP', message: 'ZIP should be 5 or 9 digits', recommended_fix: 'Enter a 5-digit ZIP or ZIP+4.' });
  if (record.coverage_type === 'W') issues.push({ field: 'coverage_type', severity: 'informational', code: 'WAIVED_COVERAGE', message: 'Coverage is waived', recommended_fix: 'No action needed if waiver is intentional.' });
  return issues;
}

export function summarizeValidation(records = [], results = []) {
  const employee_count = records.filter((item) => item.relationship_code === 'EMP').length;
  const dependent_count = records.filter((item) => item.relationship_code !== 'EMP').length;
  const household_count = new Set(records.filter((item) => item.household_key).map((item) => item.household_key)).size;
  return {
    row_count: records.length,
    employee_count,
    dependent_count,
    household_count,
    critical_error_count: results.reduce((sum, item) => sum + Number(item.critical_error_count || 0), 0),
    warning_count: results.reduce((sum, item) => sum + Number(item.warning_count || 0), 0),
    informational_count: results.reduce((sum, item) => sum + Number(item.informational_count || 0), 0),
  };
}

export function determineCaseImportStatus(summary = {}) {
  return Number(summary.critical_error_count || 0) > 0
    ? { census_status: 'issues_found', stage: 'census_in_progress', job_status: 'failed', version_status: 'has_issues' }
    : { census_status: 'validated', stage: 'census_validated', job_status: 'completed', version_status: 'validated' };
}

export function buildAuditEvent({ caseId, census_import_id, census_import_job_id, event_type, stage, message, severity = 'informational', row_number = null, source_file_name = '', recommended_fix = '', extra = {} }) {
  return {
    case_id: caseId,
    census_import_id,
    census_import_job_id,
    event_type,
    actor_id: 'system',
    payload: {
      source_file_name,
      parser_stage: stage,
      error_message: message,
      severity,
      row_number,
      recommended_fix,
      ...extra,
    },
  };
}