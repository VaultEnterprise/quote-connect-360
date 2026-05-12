/**
 * MGA Gate 6I-A — Report Template & Schedule Service
 * lib/mga/services/reportTemplateService.js
 *
 * Implements CRUD for saved report templates and schedule definitions.
 * Enforces: scopeGate, permissionResolver, filter safety, audit logging.
 * Does NOT execute schedules; execution deferred to Gate 6I-B.
 */

import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

const DOMAIN = 'reports';
const BLACKLIST_FILTERS = [
  'signed_url', 'private_file_uri', 'download_token',
  'user_auth_token', 'session_id', 'api_key', 'oauth_token', 'refresh_token',
  'ssn', 'credit_card', 'tax_id_ein', 'bank_account', 'unredacted_address', 'unredacted_phone',
  'internal_system_flag', 'database_migration_state', 'feature_flag_override', 'config_override',
  'error_stack_trace', 'debug_log', 'internal_error_message'
];

function validateFiltersPayload(filters_json) {
  if (!filters_json) return true;
  for (let key in filters_json) {
    if (BLACKLIST_FILTERS.includes(key)) {
      throw new Error(`Restricted filter: ${key}`);
    }
    const value = filters_json[key];
    if (!isAllowedType(value)) {
      throw new Error(`Invalid filter value type for ${key}`);
    }
  }
  return true;
}

function isAllowedType(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (value instanceof Date) return true;
  if (Array.isArray(value)) return value.every(v => isAllowedType(v));
  return false;
}

// ============= TEMPLATE METHODS =============

export async function listReportTemplates(request) {
  const v = validateServiceRequest(request);
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'templates.view',
    target_entity_type: 'MGAReportTemplate',
    target_entity_id: 'list_operation'
  });
  if (denied) return response;
  
  const filters = decision.effective_mga_id !== 'platform_scope'
    ? { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) }
    : request.filters || {};
  
  const templates = await base44.entities.MGAReportTemplate.filter(filters);
  return buildScopedResponse({ data: templates, correlation_id: decision.correlation_id });
}

export async function createReportTemplate(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'templates.manage',
    target_entity_type: 'MGAReportTemplate'
  });
  if (denied) return response;
  
  // Validate filters
  if (request.payload.filters_json) {
    try {
      validateFiltersPayload(request.payload.filters_json);
    } catch (err) {
      return buildScopedResponse({ success: false, reason_code: 'INVALID_FILTERS', detail: err.message });
    }
  }
  
  const existing = await base44.entities.MGAReportTemplate.filter({
    idempotency_key: request.idempotency_key,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (existing?.length) {
    return buildScopedResponse({
      data: existing[0],
      idempotency_result: 'already_processed',
      correlation_id: decision.correlation_id
    });
  }
  
  const created = await base44.entities.MGAReportTemplate.create({
    ...request.payload,
    master_general_agent_id: decision.effective_mga_id,
    created_by: decision.actor_email
  });
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    after: created,
    detail: `Created template "${created.template_name}" (${created.report_type}, ${created.export_format})`
  }, request.idempotency_key);
  
  return buildScopedResponse({
    data: created,
    idempotency_result: 'created',
    correlation_id: decision.correlation_id
  });
}

export async function getReportTemplateDetail(request) {
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'templates.view',
    target_entity_type: 'MGAReportTemplate'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportTemplate.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function updateReportTemplate(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'templates.manage',
    target_entity_type: 'MGAReportTemplate'
  });
  if (denied) return response;
  
  // Validate filters if provided
  if (request.payload.filters_json) {
    try {
      validateFiltersPayload(request.payload.filters_json);
    } catch (err) {
      return buildScopedResponse({ success: false, reason_code: 'INVALID_FILTERS', detail: err.message });
    }
  }
  
  const records = await base44.entities.MGAReportTemplate.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  const updated = await base44.entities.MGAReportTemplate.update(request.target_entity_id, request.payload);
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: records[0],
    after: updated,
    detail: `Updated template "${updated.template_name}"`
  }, request.idempotency_key);
  
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function archiveReportTemplate(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'templates.manage',
    target_entity_type: 'MGAReportTemplate'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportTemplate.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  const updated = await base44.entities.MGAReportTemplate.update(request.target_entity_id, { status: 'archived' });
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: records[0],
    after: updated,
    detail: `Archived template "${updated.template_name}"`
  }, request.idempotency_key);
  
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

// ============= SCHEDULE METHODS =============

export async function listReportSchedules(request) {
  const v = validateServiceRequest(request);
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.view',
    target_entity_type: 'MGAReportSchedule',
    target_entity_id: 'list_operation'
  });
  if (denied) return response;
  
  const filters = decision.effective_mga_id !== 'platform_scope'
    ? { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) }
    : request.filters || {};
  
  const schedules = await base44.entities.MGAReportSchedule.filter(filters);
  return buildScopedResponse({ data: schedules, correlation_id: decision.correlation_id });
}

export async function createReportScheduleDefinition(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.manage',
    target_entity_type: 'MGAReportSchedule'
  });
  if (denied) return response;
  
  // Verify template exists and is accessible
  const templates = await base44.entities.MGAReportTemplate.filter({
    id: request.payload.template_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!templates?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'TEMPLATE_NOT_FOUND',
      detail: 'Specified template not found or not accessible',
      correlation_id: decision.correlation_id
    });
  }
  
  const existing = await base44.entities.MGAReportSchedule.filter({
    idempotency_key: request.idempotency_key,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (existing?.length) {
    return buildScopedResponse({
      data: existing[0],
      idempotency_result: 'already_processed',
      correlation_id: decision.correlation_id
    });
  }
  
  const created = await base44.entities.MGAReportSchedule.create({
    ...request.payload,
    master_general_agent_id: decision.effective_mga_id,
    created_by: decision.actor_email,
    schedule_type: 'one_time',
    status: 'draft'
  });
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    after: created,
    detail: `Created schedule definition "${created.schedule_name}" (template: ${templates[0].template_name})`
  }, request.idempotency_key);
  
  return buildScopedResponse({
    data: created,
    idempotency_result: 'created',
    correlation_id: decision.correlation_id
  });
}

export async function getReportScheduleDetail(request) {
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.view',
    target_entity_type: 'MGAReportSchedule'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportSchedule.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function updateReportScheduleDefinition(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.manage',
    target_entity_type: 'MGAReportSchedule'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportSchedule.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  const updated = await base44.entities.MGAReportSchedule.update(request.target_entity_id, request.payload);
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: records[0],
    after: updated,
    detail: `Updated schedule definition "${updated.schedule_name}"`
  }, request.idempotency_key);
  
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function activateReportSchedule(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.manage',
    target_entity_type: 'MGAReportSchedule'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportSchedule.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  if (records[0].status !== 'draft') {
    return buildScopedResponse({
      success: false,
      reason_code: 'INVALID_STATE',
      detail: 'Only draft schedules can be activated',
      correlation_id: decision.correlation_id
    });
  }
  
  const updated = await base44.entities.MGAReportSchedule.update(request.target_entity_id, {
    status: 'active',
    next_run_at: records[0].scheduled_date_time
  });
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: records[0],
    after: updated,
    detail: `Activated schedule definition "${updated.schedule_name}"`
  }, request.idempotency_key);
  
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function pauseReportSchedule(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.manage',
    target_entity_type: 'MGAReportSchedule'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportSchedule.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  const updated = await base44.entities.MGAReportSchedule.update(request.target_entity_id, { status: 'paused' });
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: records[0],
    after: updated,
    detail: `Paused schedule definition "${updated.schedule_name}"`
  }, request.idempotency_key);
  
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function cancelReportSchedule(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_REQUEST' });
  
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.manage',
    target_entity_type: 'MGAReportSchedule'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportSchedule.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  const updated = await base44.entities.MGAReportSchedule.update(request.target_entity_id, { status: 'cancelled' });
  
  await prepareAndRecordAudit(decision, {
    outcome: 'success',
    before: records[0],
    after: updated,
    detail: `Cancelled schedule definition "${updated.schedule_name}"`
  }, request.idempotency_key);
  
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function getReportScheduleAuditTrail(request) {
  const { decision, denied, response } = await checkScope({
    ...request,
    domain: DOMAIN,
    action: 'schedules.audit',
    target_entity_type: 'MGAReportSchedule'
  });
  if (denied) return response;
  
  const records = await base44.entities.MGAReportSchedule.filter({
    id: request.target_entity_id,
    master_general_agent_id: decision.effective_mga_id
  });
  
  if (!records?.length) {
    return buildScopedResponse({
      success: false,
      reason_code: 'NOT_FOUND_IN_SCOPE',
      masked_not_found: true,
      correlation_id: decision.correlation_id
    });
  }
  
  const auditLogs = await base44.entities.ActivityLog.filter({
    entity_id: request.target_entity_id,
    entity_type: 'MGAReportSchedule',
    master_general_agent_id: decision.effective_mga_id
  });
  
  return buildScopedResponse({ data: auditLogs || [], correlation_id: decision.correlation_id });
}

export default {
  listReportTemplates,
  createReportTemplate,
  getReportTemplateDetail,
  updateReportTemplate,
  archiveReportTemplate,
  listReportSchedules,
  createReportScheduleDefinition,
  getReportScheduleDetail,
  updateReportScheduleDefinition,
  activateReportSchedule,
  pauseReportSchedule,
  cancelReportSchedule,
  getReportScheduleAuditTrail
};