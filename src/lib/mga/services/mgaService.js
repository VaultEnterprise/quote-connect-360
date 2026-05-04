/**
 * MGA Phase 3 — MGA Management Scoped Service
 * lib/mga/services/mgaService.js
 *
 * PHASE 3 CONSTRAINT: Inert until wired into live flows in Phase 5.
 * @see docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md Section 6.1-A
 */

import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

const DOMAIN = 'mga';

export async function createMGA(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'MasterGeneralAgent' });
  if (denied) return response;
  const existing = await base44.entities.MasterGeneralAgent.filter({ idempotency_key: request.idempotency_key });
  if (existing?.length) return buildScopedResponse({ data: existing[0], idempotency_result: 'already_processed', correlation_id: decision.correlation_id });
  const created = await base44.entities.MasterGeneralAgent.create({ ...request.payload, idempotency_key: request.idempotency_key });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created }, request.idempotency_key);
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function getMGADetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'MasterGeneralAgent' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgent.filter({ id: request.target_entity_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function listMGAs(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'MasterGeneralAgent', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = decision.effective_mga_id !== 'platform_scope'
    ? { id: decision.effective_mga_id }
    : {};
  const mgas = await base44.entities.MasterGeneralAgent.filter(filters);
  return buildScopedResponse({ data: mgas, correlation_id: decision.correlation_id });
}

export async function updateMGA(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'MasterGeneralAgent' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgent.filter({ id: request.target_entity_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  if (request.expected_updated_date && records[0].updated_date !== request.expected_updated_date) return buildScopedResponse({ success: false, reason_code: 'STALE_SCOPE', correlation_id: decision.correlation_id });
  const updated = await base44.entities.MasterGeneralAgent.update(request.target_entity_id, request.payload);
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function changeMGAStatus(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'approve', target_entity_type: 'MasterGeneralAgent' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgent.filter({ id: request.target_entity_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const updated = await base44.entities.MasterGeneralAgent.update(request.target_entity_id, { status: request.payload.status });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function manageMGAOnboarding(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'MasterGeneralAgent' });
  if (denied) return response;
  const updated = await base44.entities.MasterGeneralAgent.update(request.target_entity_id, { onboarding_status: request.payload.onboarding_status, onboarding_data: request.payload.onboarding_data });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function manageMGAAgreements(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'MasterGeneralAgentAgreement' });
  if (denied) return response;
  const created = await base44.entities.MasterGeneralAgentAgreement.create({ ...request.payload, master_general_agent_id: decision.effective_mga_id });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created }, request.idempotency_key);
  return buildScopedResponse({ data: created, correlation_id: decision.correlation_id });
}

export async function manageMGACommissionProfile(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'view_financials', target_entity_type: 'MasterGeneralAgentCommissionProfile' });
  if (denied) return response;
  const created = await base44.entities.MasterGeneralAgentCommissionProfile.create({ ...request.payload, master_general_agent_id: decision.effective_mga_id });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created }, request.idempotency_key);
  return buildScopedResponse({ data: created, correlation_id: decision.correlation_id });
}

export default { createMGA, getMGADetail, listMGAs, updateMGA, changeMGAStatus, manageMGAOnboarding, manageMGAAgreements, manageMGACommissionProfile };