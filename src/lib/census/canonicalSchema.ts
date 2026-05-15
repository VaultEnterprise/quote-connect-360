export const CENSUS_VALIDATION_SEVERITIES = {
  critical: "critical",
  warning: "warning",
  informational: "informational",
};

export const RELATIONSHIP_TYPES = {
  EMP: "employee",
  SPS: "spouse",
  DEP: "dependent",
};

export function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parts = raw.split(/[\/-]/).map((part) => part.trim());
  if (parts.length !== 3) return raw;
  if (parts[0].length === 4) {
    const [yyyy, mm, dd] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  let [mm, dd, yyyy] = parts;
  if (yyyy.length === 2) yyyy = `19${yyyy}`;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

export function normalizeZip(value) {
  return String(value || "").trim().replace(/[^0-9-]/g, "");
}

export function normalizeGender(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.startsWith("m")) return "male";
  if (raw.startsWith("f")) return "female";
  return "other";
}

export function normalizeCoverageType(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (["EE", "ES", "EC", "EF", "W"].includes(raw)) return raw;
  return raw;
}

export const canonicalCensusSchema = {
  relationship_code: { required: true, type: "string" },
  employee_id: { required: false, type: "string" },
  household_key: { required: true, type: "string" },
  first_name: { required: true, type: "string" },
  last_name: { required: true, type: "string" },
  address: { required: false, type: "string" },
  city: { required: false, type: "string" },
  state: { required: false, type: "string" },
  zip: { required: false, type: "string", transform: normalizeZip },
  gender: { required: false, type: "string", transform: normalizeGender },
  dob: { required: true, type: "date", transform: normalizeDate },
  coverage_type: { required: false, type: "string", transform: normalizeCoverageType },
  dependent_link_type: { required: false, type: "string" },
  source_row_number: { required: true, type: "number" },
};