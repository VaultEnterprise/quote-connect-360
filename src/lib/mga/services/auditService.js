/**
 * MGA Phase 3 — Audit / Activity Scoped Service
 * lib/mga/services/auditService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 5.
 */
import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';
import { build as buildAudit } from '../auditDecision.js';
const DOMAIN = 'audit_logs';

export async function prepareAuditEvent(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'MasterGeneralAgentActivityLog', target_entity_id: 'prepare_audit' });
  if (denied) return response;
  const auditRecord = buildAudit(decision, request.payload?.operationResult || {}, request.idempotency_key);
  return buildScopedResponse({ data: auditRecord, correlation_id: decision.correlation_id });
}

export async function listAuditEventsByScope(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'MasterGeneralAgentActivityLog', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const logs = await base44.entities.MasterGeneralAgentActivityLog.filter(filters, '-created_date', request.limit || 50);
  return buildScopedResponse({ data: logs, correlation_id: decision.correlation_id });
}

export async function createSecurityAuditEvent(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'MasterGeneralAgentActivityLog' });
  if (denied) return response;
  const created = await base44.entities.MasterGeneralAgentActivityLog.create({ ...request.payload, action_category: 'security', master_general_agent_id: decision.effective_mga_id });
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function createGovernanceAuditEvent(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'MasterGeneralAgentActivityLog' });
  if (denied) return response;
  const created = await base44.entities.MasterGeneralAgentActivityLog.create({ ...request.payload, action_category: 'governance', master_general_agent_id: decision.effective_mga_id });
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function createOperationalAuditEvent(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'MasterGeneralAgentActivityLog' });
  if (denied) return response;
  const created = await base44.entities.MasterGeneralAgentActivityLog.create({ ...request.payload, action_category: 'operational', master_general_agent_id: decision.effective_mga_id });
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function createImpersonationAuditEvent(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'MasterGeneralAgentActivityLog' });
  if (denied) return response;
  const created = await base44.entities.MasterGeneralAgentActivityLog.create({ ...request.payload, action_category: 'security', actor_type: 'support_impersonation', master_general_agent_id: decision.effective_mga_id });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created }, request.idempotency_key);
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export default { prepareAuditEvent, listAuditEventsByScope, createSecurityAuditEvent, createGovernanceAuditEvent, createOperationalAuditEvent, createImpersonationAuditEvent };