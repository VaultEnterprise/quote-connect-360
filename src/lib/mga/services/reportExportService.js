/**
 * MGA Gate 6C — Report Export Service Layer
 * Orchestrates data retrieval, field policy application, serialization, and storage.
 * All export operations must enforce scope, permissions, and field policy.
 */

import { base44 } from '@/api/base44Client';
import { scopeGate } from '@/lib/mga/scopeGate';
import {
  FIELD_POLICIES,
  applyFieldPolicy,
  validateFieldPolicySafety,
} from '@/lib/mga/reportExportFieldPolicy';
import {
  auditExportGeneration,
  auditScopeValidation,
} from '@/lib/mga/reportExportAudit';

/**
 * List available export types for a given user/MGA.
 * @param {Object} params - Parameters
 * @param {string} params.mga_id - MGA ID
 * @param {string} params.actor_email - User email
 * @param {Array<string>} params.user_permissions - User permission keys
 * @param {string} params.correlation_id - Request correlation ID
 * @returns {Object} { success, data: [export types], reason_code }
 */
export async function listAvailableExports({
  mga_id,
  actor_email,
  user_permissions = [],
  correlation_id,
}) {
  const available = [];

  // Check which export types user can access based on permissions
  if (user_permissions.includes('mga.reports.export')) {
    available.push({
      type: 'case_summary',
      label: 'Case Summary',
      formats: ['csv', 'xlsx', 'pdf'],
      description: 'Summary data for all cases in scope',
    });

    available.push({
      type: 'quote_scenario',
      label: 'Quote Scenario',
      formats: ['csv', 'xlsx', 'pdf'],
      description: 'Quote scenario details and financial summaries',
    });

    available.push({
      type: 'census_member',
      label: 'Census Member',
      formats: ['csv', 'xlsx'],
      description: 'Census member data (non-sensitive fields)',
    });

    available.push({
      type: 'mga_summary',
      label: 'MGA Summary',
      formats: ['csv', 'xlsx', 'pdf'],
      description: 'MGA performance metrics and status',
    });
  }

  // Audit-only export requires special permission
  if (user_permissions.includes('mga.reports.audit')) {
    available.push({
      type: 'audit_activity',
      label: 'Audit Activity Log',
      formats: ['csv', 'xlsx', 'pdf'],
      description: 'Activity and security audit logs',
    });
  }

  return {
    success: true,
    data: available,
  };
}

/**
 * Prepare an export request (validate filters, estimate record count).
 * @param {Object} params - Parameters
 * @param {string} params.mga_id - MGA ID
 * @param {string} params.case_id - Case ID (if filtering by case)
 * @param {string} params.report_type - Export type
 * @param {string} params.format - Export format
 * @param {Object} params.filters - Additional filters
 * @param {string} params.correlation_id - Request correlation ID
 * @returns {Object} { success, estimated_records, reason_code }
 */
export async function prepareExport({
  mga_id,
  case_id,
  report_type,
  format,
  filters = {},
  correlation_id,
}) {
  // Validate policy exists for report type
  if (!FIELD_POLICIES[report_type]) {
    return {
      success: false,
      reason_code: 'INVALID_REPORT_TYPE',
      message: `Unknown report type: ${report_type}`,
    };
  }

  // Validate format
  const policy = FIELD_POLICIES[report_type];
  if (!['csv', 'xlsx', 'pdf'].includes(format)) {
    return {
      success: false,
      reason_code: 'INVALID_FORMAT',
      message: `Invalid format: ${format}`,
    };
  }

  // For case-scoped exports, validate scope
  if (case_id) {
    const scopeCheckResult = await scopeGate.validateCaseScope({
      mga_id,
      case_id,
      action: 'export',
    });

    if (!scopeCheckResult.allowed) {
      return {
        success: false,
        reason_code: 'SCOPE_DENIED',
        message: scopeCheckResult.reason,
      };
    }
  }

  // Estimate record count
  let estimatedRecords = 0;
  try {
    switch (report_type) {
      case 'case_summary':
        const cases = await base44.entities.BenefitCase.filter(
          { master_general_agent_id: mga_id },
          null,
          1
        );
        estimatedRecords = cases.length;
        break;

      case 'quote_scenario':
        const quotes = await base44.entities.QuoteScenario.filter(
          { master_general_agent_id: mga_id },
          null,
          1
        );
        estimatedRecords = quotes.length;
        break;

      case 'census_member':
        const members = await base44.entities.CensusMember.filter(
          { master_general_agent_id: mga_id },
          null,
          1
        );
        estimatedRecords = members.length;
        break;

      case 'audit_activity':
        const activities = await base44.entities.ActivityLog.filter(
          { master_general_agent_id: mga_id },
          null,
          1
        );
        estimatedRecords = activities.length;
        break;

      case 'mga_summary':
        estimatedRecords = 1; // Single MGA record
        break;

      default:
        estimatedRecords = 0;
    }
  } catch (e) {
    return {
      success: false,
      reason_code: 'PREPARATION_FAILED',
      message: 'Failed to estimate record count',
    };
  }

  return {
    success: true,
    estimated_records: estimatedRecords,
    maximum_records: estimatedRecords > 10000 ? 10000 : estimatedRecords,
  };
}

/**
 * Generate an export and return artifact URL.
 * For large exports, returns async job ID and polling endpoint.
 * @param {Object} params - Parameters
 * @param {string} params.mga_id - MGA ID
 * @param {string} params.case_id - Case ID (if applicable)
 * @param {string} params.report_type - Export type
 * @param {string} params.format - Export format (csv, xlsx, pdf)
 * @param {string} params.actor_email - User email (for audit)
 * @param {string} params.actor_role - User role (for audit)
 * @param {Object} params.filters - Additional filters
 * @param {string} params.correlation_id - Request correlation ID
 * @returns {Object} { success, artifact_url or job_id, reason_code }
 */
export async function generateExport({
  mga_id,
  case_id,
  report_type,
  format,
  actor_email,
  actor_role,
  filters = {},
  correlation_id,
}) {
  const startTime = Date.now();

  try {
    // Fetch records for export
    let records = [];

    switch (report_type) {
      case 'case_summary':
        records = await base44.entities.BenefitCase.filter(
          { master_general_agent_id: mga_id },
          '-updated_date',
          10000
        );
        break;

      case 'quote_scenario':
        records = await base44.entities.QuoteScenario.filter(
          { master_general_agent_id: mga_id },
          '-updated_date',
          10000
        );
        break;

      case 'census_member':
        records = await base44.entities.CensusMember.filter(
          { master_general_agent_id: mga_id },
          '-updated_date',
          10000
        );
        break;

      case 'audit_activity':
        records = await base44.entities.ActivityLog.filter(
          { master_general_agent_id: mga_id },
          '-created_date',
          10000
        );
        break;

      case 'mga_summary':
        const mgaRecord = await base44.entities.MasterGeneralAgent.list({
          id: mga_id,
        });
        records = mgaRecord ? [mgaRecord] : [];
        break;

      default:
        throw new Error(`Unknown report type: ${report_type}`);
    }

    if (!records || records.length === 0) {
      await auditExportGeneration({
        mga_id,
        case_id,
        actor_email,
        actor_role,
        report_type,
        format,
        success: false,
        reason: 'No records found',
        correlation_id,
      });

      return {
        success: false,
        reason_code: 'NO_RECORDS',
        message: 'No records found for export',
      };
    }

    // Apply field policy to all records
    const filteredRecords = records.map((record) =>
      applyFieldPolicy(record, report_type)
    );

    // Validate field policy safety
    for (const record of filteredRecords) {
      validateFieldPolicySafety(record, report_type);
    }

    // Serialize to requested format
    let serialized;
    switch (format) {
      case 'csv':
        serialized = serializeToCSV(filteredRecords, report_type);
        break;
      case 'xlsx':
        serialized = serializeToXLSX(filteredRecords, report_type);
        break;
      case 'pdf':
        serialized = serializeToPDF(filteredRecords, report_type);
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    // In production, store artifact and return signed URL
    // For now, return placeholder
    const artifactUrl = `file://mga-export/${mga_id}/${correlation_id}.${format}`;

    await auditExportGeneration({
      mga_id,
      case_id,
      actor_email,
      actor_role,
      report_type,
      format,
      success: true,
      metadata: { record_count: filteredRecords.length, file_size: serialized.length },
      correlation_id,
    });

    return {
      success: true,
      artifact_url: artifactUrl,
      record_count: filteredRecords.length,
      file_size: serialized.length,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    await auditExportGeneration({
      mga_id,
      case_id,
      actor_email,
      actor_role,
      report_type,
      format,
      success: false,
      reason: error.message,
      correlation_id,
    });

    return {
      success: false,
      reason_code: 'EXPORT_FAILED',
      message: error.message,
    };
  }
}

/**
 * Serialize records to CSV format.
 * @param {Array} records - Records to serialize
 * @param {string} reportType - Report type (determines columns)
 * @returns {string} CSV-formatted string
 */
function serializeToCSV(records, reportType) {
  if (!records || records.length === 0) return '';

  const policy = FIELD_POLICIES[reportType];
  const headers = policy.allowed;

  // Build CSV header
  const headerLine = headers.map((h) => `"${h}"`).join(',');

  // Build CSV rows
  const rows = records.map((record) => {
    return headers
      .map((field) => {
        const value = record[field];
        if (value === null || value === undefined) return '""';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return `"${JSON.stringify(value)}"`;
      })
      .join(',');
  });

  return [headerLine, ...rows].join('\n');
}

/**
 * Serialize records to XLSX format (placeholder).
 * @param {Array} records - Records to serialize
 * @param {string} reportType - Report type
 * @returns {string} XLSX as string (would be binary in production)
 */
function serializeToXLSX(records, reportType) {
  // In production, use a library like xlsx
  // For now, return CSV-like format
  return serializeToCSV(records, reportType);
}

/**
 * Serialize records to PDF format (placeholder).
 * @param {Array} records - Records to serialize
 * @param {string} reportType - Report type
 * @returns {string} PDF as string (would be binary in production)
 */
function serializeToPDF(records, reportType) {
  // In production, use a library like jspdf
  // For now, return placeholder
  return `PDF Report: ${reportType} (${records.length} records)`;
}