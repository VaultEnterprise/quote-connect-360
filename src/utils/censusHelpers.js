// ─── Template Generation ───────────────────────────────────────────────────────
export function generateCensusTemplate() {
  const headers = [
    "first_name", "last_name", "date_of_birth", "gender", "email", "phone",
    "employee_id", "ssn_last4", "hire_date", "employment_status", "employment_type",
    "hours_per_week", "annual_salary", "job_title", "department", "address",
    "city", "state", "zip", "coverage_tier", "dependent_count", "class_code"
  ];
  
  const sampleRows = [
    ["John", "Smith", "1985-05-12", "male", "john.smith@company.com", "555-1234", "EMP001", "2345", "2020-01-15", "active", "full_time", "40", "65000", "Software Engineer", "Engineering", "123 Main St", "San Francisco", "CA", "94105", "family", "2", "ENG-001"],
    ["Jane", "Doe", "1988-08-20", "female", "jane.doe@company.com", "555-5678", "EMP002", "6789", "2019-06-01", "active", "full_time", "40", "75000", "Senior Manager", "Operations", "456 Oak Ave", "San Francisco", "CA", "94105", "family", "1", "MGR-001"],
  ];

  const csv = [headers, ...sampleRows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  return csv;
}

// ─── XLSX Parser ───────────────────────────────────────────────────────────────
export async function parseXLSX(file) {
  const arrayBuffer = await file.arrayBuffer();
  // For now, we'll provide a helper comment
  // In production, use SheetJS: import * as XLSX from 'xlsx'
  // const wb = XLSX.read(arrayBuffer, { type: 'array' });
  // const ws = wb.Sheets[wb.SheetNames[0]];
  // const data = XLSX.utils.sheet_to_json(ws);
  // For this implementation, we'll parse as CSV fallback or require SheetJS
  throw new Error("XLSX requires SheetJS library. Using CSV parser instead.");
}

// ─── Duplicate Detection ───────────────────────────────────────────────────────
export function detectDuplicates(rows, mapping) {
  const seen = new Map();
  const duplicates = [];

  rows.forEach((row, idx) => {
    const email = row[mapping.email];
    const empId = row[mapping.employee_id];
    const key = email || empId;

    if (!key) return; // Skip if no identifying field

    if (seen.has(key)) {
      const prevIdx = seen.get(key);
      duplicates.push({
        row: idx,
        prevRow: prevIdx,
        email,
        employee_id: empId,
        type: email ? "email" : "employee_id"
      });
    } else {
      seen.set(key, idx);
    }
  });

  return duplicates;
}

// ─── Field Completeness Analysis ───────────────────────────────────────────────
export function analyzeDataQuality(rows, mapping) {
  const fieldStats = {};

  Object.entries(mapping).forEach(([field, column]) => {
    if (!column) return;
    const populated = rows.filter(r => r[column]?.trim()).length;
    const completeness = Math.round((populated / rows.length) * 100);
    fieldStats[field] = {
      column,
      populated,
      total: rows.length,
      completeness,
      isEmpty: completeness === 0
    };
  });

  return fieldStats;
}

// ─── Mapping Profile Management ───────────────────────────────────────────────
export function saveMappingProfile(profileName, mapping, headers) {
  const profiles = JSON.parse(localStorage.getItem("census_mapping_profiles") || "{}");
  profiles[profileName] = { mapping, headers, savedAt: new Date().toISOString() };
  localStorage.setItem("census_mapping_profiles", JSON.stringify(profiles));
}

export function loadMappingProfile(profileName) {
  const profiles = JSON.parse(localStorage.getItem("census_mapping_profiles") || "{}");
  return profiles[profileName];
}

export function listMappingProfiles() {
  const profiles = JSON.parse(localStorage.getItem("census_mapping_profiles") || "{}");
  return Object.entries(profiles).map(([name, data]) => ({
    name,
    ...data,
  }));
}

export function deleteMappingProfile(profileName) {
  const profiles = JSON.parse(localStorage.getItem("census_mapping_profiles") || "{}");
  delete profiles[profileName];
  localStorage.setItem("census_mapping_profiles", JSON.stringify(profiles));
}