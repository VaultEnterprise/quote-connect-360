/**
 * MGA Phase 3 — Webhook / Async / Scheduled / Retry Scoped Service
 * lib/mga/services/webhookService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 5/6.
 */
import { buildJobContext, validateJobExecution, buildRetryContext, resolveWebhookOwnership as resolveOwnership, validateScheduledJobScope } from '../asyncScopeRules.js';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

export async function resolveWebhookOwnership(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase', target_entity_id: 'webhook_resolution' });
  if (denied) return response;
  const result = resolveOwnership({ entity_type: request.payload?.entity_type, entity_id: request.payload?.entity_id, resolved_mga_id: request.payload?.resolved_mga_id });
  if (result.quarantine) await prepareAndRecordAudit(decision, { outcome: 'blocked', detail: result.quarantine_reason }, request.idempotency_key);
  return buildScopedResponse({ data: result, correlation_id: decision.correlation_id });
}

export async function webhookQuarantineDecision(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'MGAQuarantineRecord', target_entity_id: 'quarantine_decision' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'blocked', detail: 'webhook quarantine decision' }, request.idempotency_key);
  return buildScopedResponse({ data: { quarantine: true, reason: 'unresolved_ownership', effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function validateAsyncJobScope(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase', target_entity_id: 'async_job_scope' });
  if (denied) return response;
  const result = validateJobExecution(request.payload?.job_context, request.payload?.current_target_mga_id);
  if (!result.valid) await prepareAndRecordAudit(decision, { outcome: 'blocked', detail: result.reason }, request.idempotency_key);
  return buildScopedResponse({ data: result, correlation_id: decision.correlation_id });
}

export async function validateScheduledJobScopeService(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase', target_entity_id: 'scheduled_job_scope' });
  if (denied) return response;
  const result = validateScheduledJobScope({ scope_type: request.payload?.scope_type, operation_name: request.payload?.operation_name, configured_mga_id: request.payload?.configured_mga_id });
  return buildScopedResponse({ data: result, correlation_id: decision.correlation_id });
}

export async function validateRetryQueueScope(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'retry', target_entity_type: 'BenefitCase', target_entity_id: 'retry_queue' });
  if (denied) return response;
  const retryCtx = buildRetryContext(request.payload?.original_context, request.payload?.retry_attempt || 1);
  return buildScopedResponse({ data: retryCtx, correlation_id: decision.correlation_id });
}

export async function authorizeExportJob(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'reports', action: 'export', target_entity_type: 'BenefitCase', target_entity_id: 'export_job' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function authorizeReportJob(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'reports', action: 'create', target_entity_type: 'Proposal', target_entity_id: 'report_job' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function authorizeNotificationJob(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase', target_entity_id: 'notification_job' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export default { resolveWebhookOwnership, webhookQuarantineDecision, validateAsyncJobScope, validateScheduledJobScopeService, validateRetryQueueScope, authorizeExportJob, authorizeReportJob, authorizeNotificationJob };