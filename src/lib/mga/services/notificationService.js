/**
 * MGA Phase 3 — Notification / Email / Deep-Link Scoped Service
 * lib/mga/services/notificationService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 6.
 * Existing email functions (sendEnrollmentInvite, sendProposalEmail) are unchanged.
 */
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

export async function authorizeNotificationRendering(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase' });
  if (denied) return response;
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function authorizeEmailDeepLink(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase' });
  if (denied) return response;
  // Link possession never grants access; re-auth is required at click time (Phase 6)
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, reauth_required: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function staleDeepLinkFailClosed(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase' });
  if (denied) return response;
  const linkAge = Date.now() - new Date(request.payload?.link_created_at || 0).getTime();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  if (linkAge > maxAge) return buildScopedResponse({ success: false, reason_code: 'UNSUPPORTED_OPERATION', correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: { valid: true }, correlation_id: decision.correlation_id });
}

export async function suppressOutOfScopeNotification(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase', target_entity_id: request.target_entity_id || 'notification_check' });
  if (denied) return buildScopedResponse({ data: { suppress: true }, correlation_id: null });
  return buildScopedResponse({ data: { suppress: false, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function authorizeEmailSend(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'BenefitCase' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export default { authorizeNotificationRendering, authorizeEmailDeepLink, staleDeepLinkFailClosed, suppressOutOfScopeNotification, authorizeEmailSend };