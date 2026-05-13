import { base44 } from "@/api/base44Client";

export const censusImportClient = {
  analyzeWorkbook: (source_file_url) =>
    base44.functions.invoke("analyzeCensusWorkbook", { source_file_url }),

  previewMapping: (source_file_url, mapping, header_row_index) =>
    base44.functions.invoke("previewCensusMapping", {
      source_file_url,
      mapping,
      header_row_index,
    }),

  validateMapping: (mapping) =>
    base44.functions.invoke("validateCensusMapping", { mapping }),

  executeImport: (caseId, census_import_id, source_file_url, source_file_name, mapping, header_row_index, mapping_profile_id) =>
    base44.functions.invoke("executeCensusImportWithMapping", {
      caseId,
      census_import_id,
      source_file_url,
      source_file_name,
      mapping,
      header_row_index,
      mapping_profile_id,
    }),

  saveMappingProfile: (name, mapping, description) =>
    base44.functions.invoke("saveCensusMappingProfile", {
      name,
      mapping,
      description,
    }),
};

export const SYSTEM_FIELDS = [
  { id: 'employee_id', label: 'Employee ID', required: false },
  { id: 'relationship', label: 'Relationship (EMP/SPS/DEP)', required: true },
  { id: 'first_name', label: 'First Name', required: true },
  { id: 'last_name', label: 'Last Name', required: true },
  { id: 'full_name', label: 'Full Name', required: false },
  { id: 'dob', label: 'Date of Birth', required: true },
  { id: 'gender', label: 'Gender', required: false },
  { id: 'ssn_last4', label: 'SSN / Last 4', required: false },
  { id: 'address', label: 'Address', required: false },
  { id: 'city', label: 'City', required: false },
  { id: 'state', label: 'State', required: false },
  { id: 'zip', label: 'ZIP', required: false },
  { id: 'county', label: 'County', required: false },
  { id: 'email', label: 'Email', required: false },
  { id: 'phone', label: 'Phone', required: false },
  { id: 'hire_date', label: 'Hire Date', required: false },
  { id: 'termination_date', label: 'Termination Date', required: false },
  { id: 'employment_status', label: 'Employment Status', required: false },
  { id: 'department', label: 'Department', required: false },
  { id: 'class_code', label: 'Class / Division', required: false },
  { id: 'location', label: 'Location', required: false },
  { id: 'salary', label: 'Salary', required: false },
  { id: 'hourly_rate', label: 'Hourly Rate', required: false },
  { id: 'hours_worked', label: 'Hours Worked', required: false },
  { id: 'benefit_class', label: 'Benefit Class', required: false },
  { id: 'coverage_type', label: 'Coverage Tier', required: false },
  { id: 'tobacco_status', label: 'Tobacco Status', required: false },
  { id: 'cobra_status', label: 'COBRA Status', required: false },
  { id: 'waiver_status', label: 'Waiver Status', required: false },
  { id: 'waiver_reason', label: 'Waiver Reason', required: false },
  { id: 'custom', label: 'Store as Custom Field', required: false },
  { id: 'ignore', label: 'Ignore Column', required: false },
];