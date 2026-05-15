/**
 * MGA Phase 3 — Case Scoped Service
 * lib/mga/services/caseService.js
 *
 * All protected case operations must call scopeGate before execution.
 * Client-supplied master_general_agent_id is never authoritative.
 *
 * PHASE 3 CONSTRAINT: Inert until wired into live flows in Phase 5.
 * Does not modify any existing application behavior.
 *
 * @see docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md Section 6.1-C
 */

import { base44 } from '@/api/base44Client';
import {
  validateServiceRequest,
  buildScopedResponse,
  buildDeniedResponse,
  checkScope,
  prepareAndRecordAudit,
} from './serviceContract.js';

const DOMAIN = 'cases';

/**
 * createCase — Create a new case scoped to the actor's MGA.
 * Case parent chain (MasterGroup → MGA) must resolve to the same MGA.
 * Requires idempotency_key.
 */
export async function createCase(request) {
  const validation = validateServiceRequest(request, { requireIdempotency: true });
  if (!validation.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'create', target_entity_type: 'BenefitCase',
  });
  if (denied) return response;

  const existing = await base44.entities.BenefitCase.filter({ idempotency_key: request.idempotency_key, master_general_agent_id: decision.effective_mga_id });
  if (existing?.length) {
    return buildScopedResponse({ data: existing[0], idempotency_result: 'already_processed', correlation_id: decision.correlation_id });
  }

  const caseData = {
    ...request.payload,
    master_general_agent_id: decision.effective_mga_id,
    idempotency_key: request.idempotency_key,
  };
  const created = await base44.entities.BenefitCase.create(caseData);
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created, case_id: created.id }, request.idempotency_key);

  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

/**
 * getCaseDetail — Get a single case by ID, scoped to actor's MGA.
 */
export async function getCaseDetail(request) {
  const validation = validateServiceRequest(request, { requireIdempotency: false });
  if (!validation.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'BenefitCase',
  });
  if (denied) return response;

  const records = await base44.entities.BenefitCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });

  await prepareAndRecordAudit(decision, { outcome: 'success', case_id: records[0].id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

/**
 * listCases — List cases scoped to actor's MGA.
 * All filters applied AFTER scope predicate is set.
 */
export async function listCases(request) {
  const validation = validateServiceRequest(request, { requireIdempotency: false });
  if (!validation.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'list', target_entity_type: 'BenefitCase', target_entity_id: 'list_operation',
  });
  if (denied) return response;

  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const cases = await base44.entities.BenefitCase.filter(filters, request.sort || '-updated_date', request.limit || 50);

  return buildScopedResponse({ data: cases, correlation_id: decision.correlation_id });
}

/**
 * updateCase — Update a case. Validates optimistic locking via updated_date.
 */
export async function updateCase(request) {
  const validation = validateServiceRequest(request, { requireIdempotency: true });
  if (!validation.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'BenefitCase',
  });
  if (denied) return response;

  const records = await base44.entities.BenefitCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });

  // Optimistic lock: reject if client's expected_updated_date doesn't match
  const current = records[0];
  if (request.expected_updated_date && current.updated_date !== request.expected_updated_date) {
    return buildScopedResponse({ success: false, reason_code: 'STALE_SCOPE', correlation_id: decision.correlation_id });
  }

  const updated = await base44.entities.BenefitCase.update(request.target_entity_id, request.payload);
  await prepareAndRecordAudit(decision, { outcome: 'success', before: current, after: updated, case_id: current.id }, request.idempotency_key);

  return buildScopedResponse({ data: updated, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

/**
 * archiveCase — Archive/close a case. Requires delete permission.
 */
export async function archiveCase(request) {
  const validation = validateServiceRequest(request, { requireIdempotency: true });
  if (!validation.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'delete', target_entity_type: 'BenefitCase',
  });
  if (denied) return response;

  const records = await base44.entities.BenefitCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });

  const updated = await base44.entities.BenefitCase.update(request.target_entity_id, { stage: 'closed', closed_reason: request.payload?.reason || 'archived' });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated, case_id: records[0].id }, request.idempotency_key);

  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

/**
 * reassignCase — Reassign case within same MGA. Cross-MGA reassignment is prohibited.
 */
export async function reassignCase(request) {
  const validation = validateServiceRequest(request, { requireIdempotency: true });
  if (!validation.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'BenefitCase',
  });
  if (denied) return response;

  const records = await base44.entities.BenefitCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });

  const updated = await base44.entities.BenefitCase.update(request.target_entity_id, { assigned_to: request.payload.assigned_to });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated, case_id: records[0].id }, request.idempotency_key);

  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

/**
 * getCaseStatusSummary — Aggregate status for a case: tasks, census, quote, enrollment, exceptions.
 */
export async function getCaseStatusSummary(request) {
  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'read', target_entity_type: 'BenefitCase',
  });
  if (denied) return response;

  const records = await base44.entities.BenefitCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });

  const [tasks, census, quotes, enrollment, exceptions] = await Promise.all([
    base44.entities.CaseTask.filter({ case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
    base44.entities.CensusVersion.filter({ case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
    base44.entities.QuoteScenario.filter({ case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
    base44.entities.EnrollmentWindow.filter({ case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
    base44.entities.ExceptionItem.filter({ case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
  ]);

  return buildScopedResponse({
    data: { case: records[0], tasks, census, quotes, enrollment, exceptions },
    correlation_id: decision.correlation_id,
  });
}

/**
 * advanceCaseStage — Advance the case to the next workflow stage.
 * Validates that the transition is permitted and requires approve permission.
 */
export async function advanceCaseStage(request) {
  const validation = validateServiceRequest(request, { requireIdempotency: true });
  if (!validation.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });

  const { decision, denied, response } = await checkScope({
    ...request, domain: DOMAIN, action: 'approve', target_entity_type: 'BenefitCase',
  });
  if (denied) return response;

  const records = await base44.entities.BenefitCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });

  const current = records[0];
  if (request.expected_updated_date && current.updated_date !== request.expected_updated_date) {
    return buildScopedResponse({ success: false, reason_code: 'STALE_SCOPE', correlation_id: decision.correlation_id });
  }

  const updated = await base44.entities.BenefitCase.update(request.target_entity_id, {
    stage: request.payload.next_stage,
    last_activity_date: new Date().toISOString(),
  });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: current, after: updated, case_id: current.id }, request.idempotency_key);

  return buildScopedResponse({ data: updated, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export default { createCase, getCaseDetail, listCases, updateCase, archiveCase, reassignCase, getCaseStatusSummary, advanceCaseStage };