/**
 * MGA Phase 3 — Reporting / Dashboard Scoped Service
 * lib/mga/services/reportingService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 5/6.
 */
import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';
const DOMAIN = 'reports';

export async function getScopedDashboardSummary(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'BenefitCase', target_entity_id: 'dashboard_summary' });
  if (denied) return response;
  const mgaFilter = { master_general_agent_id: decision.effective_mga_id };
  const [cases, tasks, enrollment, exceptions, census, quotes] = await Promise.all([
    base44.entities.BenefitCase.filter(mgaFilter, '-updated_date', 20),
    base44.entities.CaseTask.filter({ ...mgaFilter, status: 'pending' }),
    base44.entities.EnrollmentWindow.filter({ ...mgaFilter, status: 'open' }),
    base44.entities.ExceptionItem.filter({ ...mgaFilter, severity: 'high' }),
    base44.entities.CensusVersion.filter(mgaFilter, '-created_date', 10),
    base44.entities.QuoteScenario.filter(mgaFilter, '-updated_date', 10),
  ]);
  return buildScopedResponse({ data: { cases, tasks, enrollment, exceptions, census, quotes, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function listScopedReports(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'Proposal', target_entity_id: 'list_operation' });
  if (denied) return response;
  const proposals = await base44.entities.Proposal.filter({ master_general_agent_id: decision.effective_mga_id });
  return buildScopedResponse({ data: proposals, correlation_id: decision.correlation_id });
}

export async function getScopedReportDetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'Proposal' });
  if (denied) return response;
  const records = await base44.entities.Proposal.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function authorizeReportGeneration(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'Proposal' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function authorizeReportSnapshot(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'Proposal' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function buildScopedAggregateQuery(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'BenefitCase', target_entity_id: 'aggregate_query' });
  if (denied) return response;
  const scopedFilter = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  return buildScopedResponse({ data: { scoped_filter: scopedFilter, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export default { getScopedDashboardSummary, listScopedReports, getScopedReportDetail, authorizeReportGeneration, authorizeReportSnapshot, buildScopedAggregateQuery };