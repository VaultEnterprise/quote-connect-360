/**
 * MGA Phase 3 — User / RBAC / Settings Scoped Service
 * lib/mga/services/userAdminService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 5.
 * Existing user behavior (role assignments, permissions) unchanged.
 */
import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

export async function inviteMGAUser(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'users', action: 'create', target_entity_type: 'MasterGeneralAgentUser' });
  if (denied) return response;
  const existing = await base44.entities.MasterGeneralAgentUser.filter({ user_email: request.payload.email, master_general_agent_id: decision.effective_mga_id });
  if (existing?.length) return buildScopedResponse({ data: existing[0], idempotency_result: 'already_processed', correlation_id: decision.correlation_id });
  const created = await base44.entities.MasterGeneralAgentUser.create({ ...request.payload, master_general_agent_id: decision.effective_mga_id, status: 'invited' });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created }, request.idempotency_key);
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function listMGAUsers(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'users', action: 'list', target_entity_type: 'MasterGeneralAgentUser', target_entity_id: 'list_operation' });
  if (denied) return response;
  const users = await base44.entities.MasterGeneralAgentUser.filter({ master_general_agent_id: decision.effective_mga_id });
  return buildScopedResponse({ data: users, correlation_id: decision.correlation_id });
}

export async function updateMGAUserRole(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'users', action: 'edit', target_entity_type: 'MasterGeneralAgentUser' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgentUser.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const updated = await base44.entities.MasterGeneralAgentUser.update(request.target_entity_id, { role: request.payload.role });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function deactivateMGAUser(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'users', action: 'delete', target_entity_type: 'MasterGeneralAgentUser' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgentUser.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const updated = await base44.entities.MasterGeneralAgentUser.update(request.target_entity_id, { status: 'inactive' });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function viewSettings(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'settings', action: 'view', target_entity_type: 'MasterGeneralAgent' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgent.filter({ id: decision.effective_mga_id !== 'platform_scope' ? decision.effective_mga_id : request.target_entity_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: { settings: records[0] }, correlation_id: decision.correlation_id });
}

export async function updateSettings(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'settings', action: 'manage_settings', target_entity_type: 'MasterGeneralAgent' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgent.filter({ id: request.target_entity_id, ...(decision.effective_mga_id !== 'platform_scope' ? { id: decision.effective_mga_id } : {}) });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  if (request.expected_updated_date && records[0].updated_date !== request.expected_updated_date) return buildScopedResponse({ success: false, reason_code: 'STALE_SCOPE', correlation_id: decision.correlation_id });
  const updated = await base44.entities.MasterGeneralAgent.update(request.target_entity_id, request.payload);
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function viewPermissionMatrix(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'view', target_entity_type: 'MasterGeneralAgent', target_entity_id: 'permission_matrix' });
  if (denied) return response;
  const { MATRIX } = await import('../permissionResolver.js');
  return buildScopedResponse({ data: { matrix: MATRIX, actor_role: decision.actor_role }, correlation_id: decision.correlation_id });
}

export default { inviteMGAUser, listMGAUsers, updateMGAUserRole, deactivateMGAUser, viewSettings, updateSettings, viewPermissionMatrix };