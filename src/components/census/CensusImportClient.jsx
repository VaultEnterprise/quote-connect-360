import { base44 } from "@/api/base44Client";

export const censusImportClient = {
  analyzeWorkbook: (source_file_url, source_file_name = '', file_type = '') =>
    base44.functions.invoke("analyzeCensusWorkbook", { source_file_url, source_file_name, file_type }),

  previewMapping: (source_file_url, mapping, header_row_index, source_file_name = '', file_type = '') =>
    base44.functions.invoke("previewCensusMapping", {
      source_file_url,
      mapping,
      header_row_index,
      source_file_name,
      file_type,
    }),

  validateMapping: (mapping) =>
    base44.functions.invoke("validateCensusMapping", { mapping }),

  executeImport: (caseId, census_import_id, source_file_url, source_file_name, mapping, header_row_index, mapping_profile_id, file_type) =>
    base44.functions.invoke("executeCensusImportWithMapping", {
      caseId,
      census_import_id,
      source_file_url,
      source_file_name,
      mapping,
      header_row_index,
      mapping_profile_id,
      file_type,
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
  { id: 'dob', label: 'Date of Birth / DOB', required: true },
  { id: 'gender', label: 'Gender', required: false },
  { id: 'employee_dependent_indicator', label: 'Employee / Dependent Indicator', required: false },
  { id: 'spouse_indicator', label: 'Spouse Indicator', required: false },
  { id: 'child_indicator', label: 'Child Indicator', required: false },
  { id: 'ssn_last4', label: 'SSN / Last 4 SSN', required: false },
  { id: 'zip', label: 'ZIP', required: false },
  { id: 'state', label: 'State', required: false },
  { id: 'address', label: 'Address', required: false },
  { id: 'city', label: 'City', required: false },
  { id: 'county', label: 'County', required: false },
  { id: 'hire_date', label: 'Hire Date', required: false },
  { id: 'termination_date', label: 'Termination Date', required: false },
  { id: 'employment_status', label: 'Employment Status', required: false },
  { id: 'class_code', label: 'Class / Division', required: false },
  { id: 'department', label: 'Department', required: false },
  { id: 'location', label: 'Location', required: false },
  { id: 'salary', label: 'Salary', required: false },
  { id: 'hourly_salary_indicator', label: 'Hourly / Salary Indicator', required: false },
  { id: 'hours_worked', label: 'Hours Worked', required: false },
  { id: 'benefit_class', label: 'Benefit Class', required: false },
  { id: 'coverage_type', label: 'Coverage Type', required: false },
  { id: 'medical_plan_election', label: 'Medical Plan Election', required: false },
  { id: 'dental_plan_election', label: 'Dental Plan Election', required: false },
  { id: 'vision_plan_election', label: 'Vision Plan Election', required: false },
  { id: 'life_disability_election', label: 'Life / Disability Election', required: false },
  { id: 'tobacco_status', label: 'Tobacco Status', required: false },
  { id: 'cobra_status', label: 'COBRA Status', required: false },
  { id: 'waiver_status', label: 'Waiver Status', required: false },
  { id: 'waiver_reason', label: 'Waiver Reason', required: false },
  { id: 'email', label: 'Email', required: false },
  { id: 'phone', label: 'Phone', required: false },
  { id: 'custom', label: 'Store as Custom Field', required: false },
  { id: 'ignore', label: 'Ignore Column', required: false },
];