/**
 * MGA Gate 6C — Report Export Audit Logging
 * Standardized audit event logging for export operations.
 * All export actions must be logged per regulatory requirements.
 */

import { base44 } from '@/api/base44Client';

/**
 * Audit event types for report export operations.
 */
export const EXPORT_AUDIT_EVENTS = {
  EXPORT_REQUESTED: 'report_export_requested',
  AUTHORIZATION_CHECKED: 'report_export_authorization_checked',
  AUTHORIZATION_PASSED: 'report_export_authorization_passed',
  AUTHORIZATION_FAILED: 'report_export_authorization_failed',
  SCOPE_VALIDATED: 'report_export_scope_validated',
  SCOPE_DENIED: 'report_export_scope_denied',
  EXPORT_PREPARED: 'report_export_prepared',
  EXPORT_GENERATED: 'report_export_generated',
  EXPORT_FAILED: 'report_export_failed',
  DOWNLOAD_INITIATED: 'report_export_download_initiated',
  DOWNLOAD_FAILED: 'report_export_download_failed',
};

/**
 * Write an audit event for an export action.
 * Called from backend function to log all export activity.
 * @param {Object} params - Audit parameters
 * @param {string} params.mga_id - MGA ID
 * @param {string} params.case_id - Case ID (if applicable)
 * @param {string} params.actor_email - User email
 * @param {string} params.actor_role - User role at time of action
 * @param {string} params.event_type - EXPORT_AUDIT_EVENTS key
 * @param {string} params.report_type - Export type (case_summary, etc.)
 * @param {string} params.format - Export format (csv, xlsx, pdf)
 * @param {string} params.outcome - success, failed, denied
 * @param {string} params.detail - Human-readable detail
 * @param {string} params.correlation_id - Request correlation ID
 * @param {Object} params.metadata - Additional metadata (non-sensitive)
 * @returns {Promise<void>}
 */
export async function writeExportAudit({
  mga_id,
  case_id,
  actor_email,
  actor_role,
  event_type,
  report_type,
  format,
  outcome,
  detail,
  correlation_id,
  metadata = {},
}) {
  try {
    // Do not log sensitive data
    const sensitiveKeywords = ['password', 'token', 'secret', 'ssn', 'ein', 'url'];
    const detailSafe = detail && sanitizeDetail(detail, sensitiveKeywords);

    // Create audit log entry
    const auditEntry = {
      case_id,
      master_general_agent_id: mga_id,
      actor_email,
      actor_name: actor_email,
      actor_role,
      action: `export_${report_type}_${format}`,
      detail: detailSafe,
      entity_type: 'ReportExport',
      entity_id: correlation_id,
      outcome,
      correlation_id,
    };

    // Add to ActivityLog (don't await; fire-and-forget for audit trail)
    try {
      await base44.entities.ActivityLog.create(auditEntry);
    } catch (logError) {
      console.error('Failed to write export audit log:', logError);
      // Don't throw; audit failure is non-blocking
    }
  } catch (error) {
    console.error('Export audit error:', error);
    // Log errors but don't block export flow
  }
}

/**
 * Sanitize detail strings to remove sensitive keywords.
 * @param {string} detail - Original detail string
 * @param {Array<string>} keywords - Sensitive keywords to redact
 * @returns {string} Sanitized detail
 */
function sanitizeDetail(detail, keywords) {
  let sanitized = detail;
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}[^\\s]*`, 'gi');
    sanitized = sanitized.replace(regex, `[${keyword.toUpperCase()}_REDACTED]`);
  }
  return sanitized;
}

/**
 * Log authorization check result.
 * @param {Object} params - Audit parameters
 * @param {string} params.mga_id - MGA ID
 * @param {string} params.actor_email - User email
 * @param {string} params.actor_role - User role
 * @param {boolean} params.passed - True if authorization passed
 * @param {string} params.reason - Reason if denied
 * @param {string} params.correlation_id - Request correlation ID
 */
export async function auditAuthorizationCheck({
  mga_id,
  actor_email,
  actor_role,
  passed,
  reason,
  correlation_id,
}) {
  await writeExportAudit({
    mga_id,
    actor_email,
    actor_role,
    event_type: passed
      ? EXPORT_AUDIT_EVENTS.AUTHORIZATION_PASSED
      : EXPORT_AUDIT_EVENTS.AUTHORIZATION_FAILED,
    report_type: 'authorization_check',
    format: 'n/a',
    outcome: passed ? 'success' : 'denied',
    detail: reason || (passed ? 'Authorization check passed' : 'Authorization denied'),
    correlation_id,
  });
}

/**
 * Log scope validation result.
 * @param {Object} params - Audit parameters
 * @param {string} params.mga_id - MGA ID
 * @param {string} params.case_id - Case ID
 * @param {string} params.actor_email - User email
 * @param {string} params.actor_role - User role
 * @param {boolean} params.passed - True if scope validation passed
 * @param {string} params.reason - Reason if denied
 * @param {string} params.correlation_id - Request correlation ID
 */
export async function auditScopeValidation({
  mga_id,
  case_id,
  actor_email,
  actor_role,
  passed,
  reason,
  correlation_id,
}) {
  await writeExportAudit({
    mga_id,
    case_id,
    actor_email,
    actor_role,
    event_type: passed
      ? EXPORT_AUDIT_EVENTS.SCOPE_VALIDATED
      : EXPORT_AUDIT_EVENTS.SCOPE_DENIED,
    report_type: 'scope_validation',
    format: 'n/a',
    outcome: passed ? 'success' : 'denied',
    detail: reason || (passed ? 'Scope validation passed' : 'Scope validation failed'),
    correlation_id,
  });
}

/**
 * Log export generation result.
 * @param {Object} params - Audit parameters
 * @param {string} params.mga_id - MGA ID
 * @param {string} params.case_id - Case ID
 * @param {string} params.actor_email - User email
 * @param {string} params.actor_role - User role
 * @param {string} params.report_type - Export type
 * @param {string} params.format - Export format
 * @param {boolean} params.success - True if export generated successfully
 * @param {string} params.reason - Reason if failed
 * @param {Object} params.metadata - Additional metadata (record count, size, etc.)
 * @param {string} params.correlation_id - Request correlation ID
 */
export async function auditExportGeneration({
  mga_id,
  case_id,
  actor_email,
  actor_role,
  report_type,
  format,
  success,
  reason,
  metadata = {},
  correlation_id,
}) {
  await writeExportAudit({
    mga_id,
    case_id,
    actor_email,
    actor_role,
    event_type: success
      ? EXPORT_AUDIT_EVENTS.EXPORT_GENERATED
      : EXPORT_AUDIT_EVENTS.EXPORT_FAILED,
    report_type,
    format,
    outcome: success ? 'success' : 'failed',
    detail: reason || (success ? `${report_type} export generated in ${format}` : `${report_type} export failed`),
    correlation_id,
    metadata,
  });
}