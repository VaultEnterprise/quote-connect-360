/**
 * MGA Phase 3 — TXQuote Scoped Service
 * lib/mga/services/txquoteService.js
 *
 * CRITICAL RULES:
 * - transmitTXQuote() is defined but must NOT be wired to live sendTxQuote until Phase 5 approval.
 * - All transmit operations require idempotency_key.
 * - Retries must not duplicate external transmissions.
 * - Cross-MGA TXQuote fails closed.
 * - Existing sendTxQuote production behavior is unchanged.
 *
 * PHASE 3 CONSTRAINT: Inert until explicitly approved and wired in a future phase.
 * @see docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md Section 6.1-F
 */

import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

const DOMAIN = 'txquote';

export async function validateTXQuoteReadiness(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'TxQuoteCase' });
  if (denied) return response;
  const records = await base44.entities.TxQuoteCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const readiness = await base44.entities.TxQuoteReadinessResult.filter({ txquote_case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  return buildScopedResponse({ data: { txquoteCase: records[0], readiness }, correlation_id: decision.correlation_id });
}

export async function prepareTXQuotePayload(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'TxQuoteCase' });
  if (denied) return response;
  const records = await base44.entities.TxQuoteCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const [profile, census, destinations, documents] = await Promise.all([
    base44.entities.TxQuoteEmployerProfile.filter({ txquote_case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
    base44.entities.CensusVersion.filter({ case_id: records[0].case_id, master_general_agent_id: decision.effective_mga_id }),
    base44.entities.TxQuoteDestination.filter({ txquote_case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
    base44.entities.TxQuoteSupportingDocument.filter({ txquote_case_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id }),
  ]);
  await prepareAndRecordAudit(decision, { outcome: 'success', case_id: records[0].case_id }, request.idempotency_key);
  return buildScopedResponse({ data: { txquoteCase: records[0], profile, census, destinations, documents }, correlation_id: decision.correlation_id });
}

export async function authorizeTXQuoteTransmit(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'transmit', target_entity_type: 'TxQuoteCase' });
  if (denied) return response;
  const records = await base44.entities.TxQuoteCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: { authorized: true, txquote_case_id: request.target_entity_id, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

/**
 * transmitTXQuote — Scoped TXQuote transmission service.
 * MUST NOT be wired to live production traffic until explicitly approved in a future phase.
 * Existing sendTxQuote function is unchanged and continues to serve live traffic.
 */
export async function transmitTXQuote(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'transmit', target_entity_type: 'TxQuoteCase' });
  if (denied) return response;

  // Idempotency: check for existing successful transmission
  const existing = await base44.entities.QuoteTransmission.filter({ idempotency_key: request.idempotency_key, master_general_agent_id: decision.effective_mga_id, status: 'success' });
  if (existing?.length) {
    return buildScopedResponse({ data: existing[0], idempotency_result: 'already_processed', correlation_id: decision.correlation_id });
  }

  // Create pending transmission record before external call
  const transmissionRecord = await base44.entities.QuoteTransmission.create({
    idempotency_key: request.idempotency_key,
    master_general_agent_id: decision.effective_mga_id,
    case_id: request.target_parent_refs?.case_id,
    status: 'pending',
    sent_by: decision.actor_email,
    ...request.payload,
  });

  await prepareAndRecordAudit(decision, { outcome: 'success', after: transmissionRecord, case_id: request.target_parent_refs?.case_id }, request.idempotency_key);
  // NOTE: Actual external dispatch is handled by the existing sendTxQuote function until Phase 5 approval.
  return buildScopedResponse({ data: transmissionRecord, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function retryTXQuote(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'retry', target_entity_type: 'QuoteTransmission' });
  if (denied) return response;

  const original = await base44.entities.QuoteTransmission.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!original?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });

  // Idempotency: no duplicate retry for same idempotency_key
  const existing = await base44.entities.QuoteTransmission.filter({ idempotency_key: request.idempotency_key, master_general_agent_id: decision.effective_mga_id, status: 'success' });
  if (existing?.length) return buildScopedResponse({ data: existing[0], idempotency_result: 'already_processed', correlation_id: decision.correlation_id });

  const retryRecord = await base44.entities.QuoteTransmission.create({
    ...original[0],
    id: undefined,
    status: 'pending',
    idempotency_key: request.idempotency_key,
    failure_reason: null,
    sent_at: null,
  });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: retryRecord }, request.idempotency_key);
  return buildScopedResponse({ data: retryRecord, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function listTXQuoteTransmissions(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'QuoteTransmission', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const transmissions = await base44.entities.QuoteTransmission.filter(filters);
  return buildScopedResponse({ data: transmissions, correlation_id: decision.correlation_id });
}

export async function getTXQuoteTransmissionDetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'QuoteTransmission' });
  if (denied) return response;
  const records = await base44.entities.QuoteTransmission.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export default { validateTXQuoteReadiness, prepareTXQuotePayload, authorizeTXQuoteTransmit, transmitTXQuote, retryTXQuote, listTXQuoteTransmissions, getTXQuoteTransmissionDetail };