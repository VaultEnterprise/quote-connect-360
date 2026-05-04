/**
 * MGA Phase 3 — Quote Scoped Service
 * lib/mga/services/quoteService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 5.
 */
import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';
const DOMAIN = 'quotes';

export async function createQuoteScenario(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'QuoteScenario' });
  if (denied) return response;
  const existing = await base44.entities.QuoteScenario.filter({ idempotency_key: request.idempotency_key, master_general_agent_id: decision.effective_mga_id });
  if (existing?.length) return buildScopedResponse({ data: existing[0], idempotency_result: 'already_processed', correlation_id: decision.correlation_id });
  const created = await base44.entities.QuoteScenario.create({ ...request.payload, master_general_agent_id: decision.effective_mga_id, idempotency_key: request.idempotency_key });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created }, request.idempotency_key);
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function getQuoteDetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'QuoteScenario' });
  if (denied) return response;
  const records = await base44.entities.QuoteScenario.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function listQuotes(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'QuoteScenario', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const quotes = await base44.entities.QuoteScenario.filter(filters);
  return buildScopedResponse({ data: quotes, correlation_id: decision.correlation_id });
}

export async function updateQuoteScenario(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'QuoteScenario' });
  if (denied) return response;
  const records = await base44.entities.QuoteScenario.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  if (request.expected_updated_date && records[0].updated_date !== request.expected_updated_date) return buildScopedResponse({ success: false, reason_code: 'STALE_SCOPE', correlation_id: decision.correlation_id });
  const updated = await base44.entities.QuoteScenario.update(request.target_entity_id, request.payload);
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function createQuoteVersion(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'QuoteScenario' });
  if (denied) return response;
  const records = await base44.entities.QuoteScenario.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  if (request.expected_updated_date && records[0].updated_date !== request.expected_updated_date) return buildScopedResponse({ success: false, reason_code: 'STALE_SCOPE', correlation_id: decision.correlation_id });
  const versions = records[0].versions || [];
  const newVersion = { ...request.payload, version_number: versions.length + 1, created_at: new Date().toISOString(), idempotency_key: request.idempotency_key };
  const updated = await base44.entities.QuoteScenario.update(request.target_entity_id, { versions: [...versions, newVersion] });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: newVersion, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function compareQuotes(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'QuoteScenario', target_entity_id: 'list_operation' });
  if (denied) return response;
  const ids = request.payload?.scenario_ids || [];
  const scenarios = await Promise.all(ids.map(id => base44.entities.QuoteScenario.filter({ id, master_general_agent_id: decision.effective_mga_id })));
  const validScenarios = scenarios.map(r => r?.[0]).filter(Boolean);
  if (validScenarios.length !== ids.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: validScenarios, correlation_id: decision.correlation_id });
}

export async function archiveQuote(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'delete', target_entity_type: 'QuoteScenario' });
  if (denied) return response;
  const records = await base44.entities.QuoteScenario.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const updated = await base44.entities.QuoteScenario.update(request.target_entity_id, { status: 'expired' });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function authorizeQuoteExport(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'export', target_entity_type: 'QuoteScenario' });
  if (denied) return response;
  const records = await base44.entities.QuoteScenario.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, scenario_id: request.target_entity_id, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export default { createQuoteScenario, getQuoteDetail, listQuotes, updateQuoteScenario, createQuoteVersion, compareQuotes, archiveQuote, authorizeQuoteExport };