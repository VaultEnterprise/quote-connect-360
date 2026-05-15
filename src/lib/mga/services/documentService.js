/**
 * MGA Phase 3 — Document/File Scoped Service
 * lib/mga/services/documentService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 6.
 */
import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

export async function listDocuments(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'documents', action: 'list', target_entity_type: 'Document', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const docs = await base44.entities.Document.filter(filters);
  return buildScopedResponse({ data: docs, correlation_id: decision.correlation_id });
}

export async function getDocumentMetadata(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'documents', action: 'detail', target_entity_type: 'Document' });
  if (denied) return response;
  const records = await base44.entities.Document.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const { file_url, ...metadata } = records[0];
  return buildScopedResponse({ data: metadata, correlation_id: decision.correlation_id });
}

export async function authorizeDocumentDownload(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'documents', action: 'download', target_entity_type: 'Document' });
  if (denied) return response;
  const records = await base44.entities.Document.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, file_url: records[0].file_url, document_id: request.target_entity_id }, correlation_id: decision.correlation_id });
}

export async function authorizeDocumentUpload(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'documents', action: 'upload', target_entity_type: 'Document' });
  if (denied) return response;
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function authorizeDocumentPreview(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'documents', action: 'preview', target_entity_type: 'Document' });
  if (denied) return response;
  const records = await base44.entities.Document.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: { authorized: true, document_id: request.target_entity_id }, correlation_id: decision.correlation_id });
}

export async function authorizeSignedLinkGeneration(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'signed_links', action: 'create', target_entity_type: 'Document' });
  if (denied) return response;
  const records = await base44.entities.Document.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { authorized: true, document_id: request.target_entity_id }, correlation_id: decision.correlation_id });
}

export async function authorizeExportBundleInclusion(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: 'documents', action: 'export', target_entity_type: 'Document' });
  if (denied) return response;
  const records = await base44.entities.Document.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  await prepareAndRecordAudit(decision, { outcome: 'success' }, request.idempotency_key);
  return buildScopedResponse({ data: { included: true, document_id: request.target_entity_id, effective_mga_id: decision.effective_mga_id }, correlation_id: decision.correlation_id });
}

export async function authorizeDocumentThumbnail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'documents', action: 'preview', target_entity_type: 'Document' });
  if (denied) return response;
  const records = await base44.entities.Document.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: { authorized: true, document_id: request.target_entity_id }, correlation_id: decision.correlation_id });
}

export default { listDocuments, getDocumentMetadata, authorizeDocumentDownload, authorizeDocumentUpload, authorizeDocumentPreview, authorizeSignedLinkGeneration, authorizeExportBundleInclusion, authorizeDocumentThumbnail };