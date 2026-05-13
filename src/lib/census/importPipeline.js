export const VAULT_TARGET_SHEET = 'GROUP INFO & CENSUS';
export const VAULT_CENSUS_MARKER = 'CENSUS:';
export const VAULT_GROUP_INFO_MARKER = 'GROUP INFORMATION:';

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

export async function extractRowsFromXls(buffer) {
  // Extract rows from .xls (BIFF8 format) file
  // Supports both legacy binary Excel workbooks and CSV-like .xls files
  const rows = [];
  try {
    // Attempt full BIFF8 binary parsing via xlsx
    const XLSX = await import('npm:xlsx@0.18.5');
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    if (!workbook.SheetNames.length) return [];
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    // Convert to normalized string array format (same as CSV output)
    return sheetRows.map(row => 
      (Array.isArray(row) ? row : [row]).map(cell => normalizeCell(cell))
    );
  } catch (biffError) {
    // Fallback: attempt CSV-compatible text decode
    // (Some legacy .xls exports are CSV text wrapped in Excel format)
    try {
      const view = new Uint8Array(buffer);
      const text = new TextDecoder().decode(view);
      if (text.includes(',') || text.includes('\n')) {
        return extractRowsFromCsv(text);
      }
    } catch {
      // Both BIFF8 and CSV decode failed
    }
    return [];
  }
}

export function detectFileType({ source_file_name = '', content_type = '' }) {
  const fileName = source_file_name.toLowerCase();
  const type = content_type.toLowerCase();
  if (fileName.endsWith('.xlsx') || type.includes('spreadsheetml')) return 'xlsx';
  if (fileName.endsWith('.xls') || type === 'application/vnd.ms-excel') return 'xls';
  return 'csv';
}

export function normalizeRelationship(value) {
  const raw = normalizeCell(value).toUpperCase();
  const mapping = { EMP: 'EMP', SPS: 'SPS', DEP: 'DEP', EMPLOYEE: 'EMP', SPOUSE: 'SPS', DEPENDENT: 'DEP' };
  return mapping[raw] || raw;
}

export function normalizeCoverageType(value) {
  const raw = normalizeCell(value).toUpperCase().trim();
  const mapping = {
    'EE': 'EE',
    'EMPLOYEE ONLY': 'EE',
    'ES': 'ES',
    'EMPLOYEE + SPOUSE': 'ES',
    'EMPLOYEE+SPOUSE': 'ES',
    'EC': 'EC',
    'EMPLOYEE + CHILD(REN)': 'EC',
    'EMPLOYEE+CHILD': 'EC',
    'EF': 'EF',
    'FAMILY': 'EF',
    'W': 'W',
    'WAIVING COVERAGE': 'W',
  };
  return mapping[raw] || raw;
}

export function extractVaultGroupMetadata(rows = [], vaultMarkerIdx = -1) {
  const metadata = {};
  const groupInfoStart = rows.findIndex((r) => normalizeCell(r[0] || '').includes('GROUP INFORMATION') || normalizeCell(r[1] || '').includes('GROUP INFORMATION'));
  if (groupInfoStart < 0) return metadata;

  const endIdx = vaultMarkerIdx >= 0 ? vaultMarkerIdx : rows.length;
  const fieldMap = {
    'legal group name': 'legal_group_name',
    'tax id': 'tax_id',
    'sic code': 'sic_code',
    'address': 'address',
    'city': 'city',
    'state': 'state',
    'zip': 'zip',
    'eligible employees': 'total_eligible_employees',
    'employees on current plan': 'total_employees_current_plan',
    'current carrier': 'current_carrier',
    'desired effective date': 'desired_effective_date',
    'years with carrier': 'years_with_carrier',
  };

  for (let i = groupInfoStart + 1; i < endIdx; i++) {
    const row = rows[i] || [];
    for (let j = 1; j < row.length - 1; j += 2) {
      const key = normalizeCell(row[j] || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const value = normalizeCell(row[j + 1] || '');
      if (key && value) {
        for (const [matchKey, fieldName] of Object.entries(fieldMap)) {
          if (key.includes(matchKey)) {
            metadata[fieldName] = value;
            break;
          }
        }
      }
    }
  }
  return metadata;
}

export function locateVaultCensusMarker(rows = []) {
  for (let i = 0; i < rows.length; i += 1) {
    const firstCell = normalizeCell(rows[i][0]);
    if (firstCell === VAULT_CENSUS_MARKER) {
      return i;
    }
  }
  return -1;
}

export function locateCensusSection(rows = []) {
  // Try VAULT layout first
  const vaultMarkerIdx = locateVaultCensusMarker(rows);
  if (vaultMarkerIdx >= 0) {
    // Header should be immediately after CENSUS: marker
    const headerIdx = vaultMarkerIdx + 1;
    if (headerIdx < rows.length) {
      return { headerIndex: headerIdx, isVaultLayout: true, vaultMarkerIndex: vaultMarkerIdx };
    }
  }

  // Fall back to standard census header detection
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

export function extractVaultGroupMetadata(rows = [], vaultMarkerIdx = -1) {
  const metadata = {};
  // Scan rows before VAULT CENSUS: marker for GROUP INFORMATION section
  const groupInfoStart = rows.findIndex((r) => normalizeCell(r[0]) === VAULT_GROUP_INFO_MARKER || normalizeHeaderLabel(normalizeCell(r[1])).includes('group information'));
  if (groupInfoStart < 0) return metadata;

  // Extract metadata from rows between GROUP INFORMATION and CENSUS marker
  const endIdx = vaultMarkerIdx >= 0 ? vaultMarkerIdx : rows.length;
  for (let i = groupInfoStart + 1; i < endIdx; i += 1) {
    const row = rows[i];
    for (let j = 1; j < row.length - 1; j += 2) {
      const key = normalizeCell(row[j]);
      const value = normalizeCell(row[j + 1]);
      if (key && key.endsWith(':') && value) {
        const normalizedKey = key.slice(0, -1).toLowerCase().replace(/[^a-z0-9]+/g, '_');
        metadata[normalizedKey] = value;
      }
    }
  }
  return metadata;
}

export function normalizeCensusHeaders(headerRow = []) {
  const aliases = {
    relationship: 'relationship',
    relation: 'relationship',
    employee_dependent: 'relationship',
    first_name: 'first_name',
    first: 'first_name',
    first_name_middle_initial: 'first_name',
    last_name: 'last_name',
    last: 'last_name',
    surname: 'last_name',
    address: 'address',
    home_address: 'address',
    city: 'city',
    state: 'state',
    zip: 'zip',
    zipcode: 'zip',
    postal_code: 'zip',
    gender: 'gender',
    sex: 'gender',
    dob: 'dob',
    date_of_birth: 'dob',
    birth_date: 'dob',
    coverage_type: 'coverage_type',
    coverage: 'coverage_type',
    elected_coverage: 'coverage_type',
    definitions: 'ignore',
  };
  return headerRow.map((cell, index) => {
    const normalized = normalizeHeaderLabel(cell)
      .replace('coverage type ee es ec ef w', 'coverage_type')
      .replace('coverage type', 'coverage_type')
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

export function normalizeRelationship(value) {
  const raw = normalizeCell(value).toUpperCase();
  const mapping = { EMP: 'EMP', SPS: 'SPS', DEP: 'DEP', EMPLOYEE: 'EMP', SPOUSE: 'SPS', DEPENDENT: 'DEP' };
  return mapping[raw] || raw;
}

export function normalizeRelationshipCode(value) {
  return normalizeRelationship(value);
}

export function isRelationshipCode(value) {
  const normalized = normalizeRelationshipCode(value);
  return ['EMP', 'SPS', 'DEP'].includes(normalized);
}

export function normalizeCoverageType(value) {
  const raw = normalizeCell(value).toUpperCase().trim();
  const mapping = {
    'EE': 'EE',
    'EMPLOYEE ONLY': 'EE',
    'ES': 'ES',
    'EMPLOYEE + SPOUSE': 'ES',
    'EMPLOYEE+SPOUSE': 'ES',
    'EC': 'EC',
    'EMPLOYEE + CHILD(REN)': 'EC',
    'EMPLOYEE+CHILD': 'EC',
    'EF': 'EF',
    'FAMILY': 'EF',
    'W': 'W',
    'WAIVING COVERAGE': 'W',
  };
  return mapping[raw] || raw;
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
    if (yyyy.length === 2) yyyy = parseInt(yyyy, 10) > 30 ? `19${yyyy}` : `20${yyyy}`;
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
  let householdSequence = 0;
  const seenHouseholds = new Set();
  const records = [];
  rows.forEach((row, rowOffset) => {
    const rowNumber = headerIndex + rowOffset + 2;
    if (isEffectivelyBlankRow(row)) return;
    const relationship = normalizeRelationshipCode(row[relationshipIndex]);
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
      coverage_type: normalizeCoverageType(row[coverageIndex]),
      source_row_number: rowNumber,
      source_payload: Object.fromEntries(headerMap.map((item) => [item.source || `col_${item.index}`, row[item.index] ?? ''])),
    };
    let householdKey = [record.first_name, record.last_name, record.dob].filter(Boolean).join('|').toLowerCase();
    if (relationship === 'EMP') {
      if (!householdKey) {
        householdSequence += 1;
        householdKey = `household_${householdSequence}`;
      }
      if (seenHouseholds.has(householdKey)) {
        householdSequence += 1;
        householdKey = `${householdKey}_${householdSequence}`;
      }
      seenHouseholds.add(householdKey);
      activeHouseholdKey = householdKey;
    }
    record.household_key = relationship === 'EMP' ? householdKey : activeHouseholdKey;
    record.employee_id = '';
    record.dependent_link_type = relationship === 'EMP' ? 'employee' : relationship === 'SPS' ? 'spouse' : 'dependent';
    records.push(record);
  });
  return records;
}

export function buildValidationIssues(record, context = {}) {
  const issues = [];
  if (!record.relationship_code) issues.push({ field: 'relationship_code', severity: 'critical', code: 'REQUIRED_FIELD_MISSING', message: 'Relationship code is required', recommended_fix: 'Set relationship to EMP, SPS, or DEP.' });
  if (!record.first_name) issues.push({ field: 'first_name', severity: 'critical', code: 'REQUIRED_FIELD_MISSING', message: 'First name is required', recommended_fix: 'Fill in the first name for this member row.' });
  if (!record.last_name) issues.push({ field: 'last_name', severity: 'critical', code: 'REQUIRED_FIELD_MISSING', message: 'Last name is required', recommended_fix: 'Fill in the last name for this member row.' });
  if (!record.dob || !/^\d{4}-\d{2}-\d{2}$/.test(record.dob)) issues.push({ field: 'dob', severity: 'critical', code: 'INVALID_DATE', message: 'DOB must normalize to YYYY-MM-DD', recommended_fix: 'Use a valid date in the DOB column.' });
  if (record.relationship_code !== 'EMP' && !record.household_key) issues.push({ field: 'household_key', severity: 'critical', code: 'MISSING_EMPLOYEE_LINK', message: 'Dependent row is not linked to an employee household', recommended_fix: 'Ensure dependent rows come after a matching EMP row.' });
  if (record.zip && !/^\d{5}(-\d{4})?$/.test(record.zip)) issues.push({ field: 'zip', severity: 'warning', code: 'INVALID_ZIP', message: 'ZIP should be 5 or 9 digits', recommended_fix: 'Enter a 5-digit ZIP or ZIP+4.' });
  if (!['EMP', 'SPS', 'DEP'].includes(record.relationship_code || '')) issues.push({ field: 'relationship_code', severity: 'critical', code: 'INVALID_RELATIONSHIP', message: 'Relationship must be EMP, SPS, or DEP', recommended_fix: 'Use EMP, SPS, or DEP in the relationship column.' });
  if (record.relationship_code === 'DEP' && !context.hasActiveEmployee) issues.push({ field: 'relationship_code', severity: 'critical', code: 'DEPENDENT_BEFORE_EMPLOYEE', message: 'Dependent row appears before a valid employee row', recommended_fix: 'Place employee rows before related dependent rows.' });
  if (record.relationship_code === 'SPS' && !context.hasActiveEmployee) issues.push({ field: 'relationship_code', severity: 'critical', code: 'SPOUSE_BEFORE_EMPLOYEE', message: 'Spouse row appears before a valid employee row', recommended_fix: 'Place employee rows before spouse rows.' });
  const normalizedCoverage = normalizeCoverageType(record.coverage_type || '');
  if (!['EE', 'ES', 'EC', 'EF', 'W', ''].includes(normalizedCoverage)) issues.push({ field: 'coverage_type', severity: 'warning', code: 'UNKNOWN_COVERAGE_CODE', message: 'Coverage code is not recognized', recommended_fix: 'Use EE, ES, EC, EF, or W.' });
  if (context.isDuplicateMember) issues.push({ field: 'household_key', severity: 'critical', code: 'DUPLICATE_MEMBER', message: 'Duplicate member record detected', recommended_fix: 'Remove duplicate member rows for the same household/person combination.' });
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