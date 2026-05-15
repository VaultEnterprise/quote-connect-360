/**
 * MGA Phase 3 — Enrollment Scoped Service
 * lib/mga/services/enrollmentService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 5/6.
 */
import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';
const DOMAIN = 'enrollment';

export async function listEnrollmentWindows(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'EnrollmentWindow', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const windows = await base44.entities.EnrollmentWindow.filter(filters);
  return buildScopedResponse({ data: windows, correlation_id: decision.correlation_id });
}

export async function getEnrollmentMemberDetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'EmployeeEnrollment' });
  if (denied) return response;
  const records = await base44.entities.EmployeeEnrollment.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function updateEnrollmentStatus(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'EmployeeEnrollment' });
  if (denied) return response;
  const records = await base44.entities.EmployeeEnrollment.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const validTransitions = { invited: ['started', 'waived'], started: ['completed', 'waived'], completed: [], waived: [] };
  const current = records[0].status;
  const next = request.payload.status;
  if (!validTransitions[current]?.includes(next)) return buildScopedResponse({ success: false, reason_code: 'UNSUPPORTED_OPERATION', correlation_id: decision.correlation_id });
  const updated = await base44.entities.EmployeeEnrollment.update(request.target_entity_id, { status: next });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function getEnrollmentProgressSummary(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'EnrollmentWindow' });
  if (denied) return response;
  const records = await base44.entities.EnrollmentWindow.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const members = await base44.entities.EmployeeEnrollment.filter({ enrollment_window_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  const summary = { total: members.length, completed: members.filter(m => m.status === 'completed').length, waived: members.filter(m => m.status === 'waived').length, pending: members.filter(m => ['invited', 'started'].includes(m.status)).length };
  return buildScopedResponse({ data: { window: records[0], summary }, correlation_id: decision.correlation_id });
}

export async function authorizeEnrollmentExport(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'export', target_entity_type: 'EnrollmentWindow' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export default { listEnrollmentWindows, getEnrollmentMemberDetail, updateEnrollmentStatus, getEnrollmentProgressSummary, authorizeEnrollmentExport };