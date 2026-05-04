/**
 * MGA Phase 3 — Census Scoped Service
 * lib/mga/services/censusService.js
 *
 * CensusVersion and CensusMember are fully available (propagated).
 * CensusImportJob, CensusImportAuditEvent, CensusValidationResult are SCOPE-PENDING.
 * All import-related services are FAIL-CLOSED PLACEHOLDERS until mini-pass resolves propagation.
 *
 * PHASE 3 CONSTRAINT: Inert until wired into live flows in Phase 5.
 * @see docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md Section 6.1-D
 */

import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, buildScopePendingResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

const DOMAIN = 'census';

export async function listCensusVersions(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'CensusVersion', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const versions = await base44.entities.CensusVersion.filter(filters);
  return buildScopedResponse({ data: versions, correlation_id: decision.correlation_id });
}

export async function getCensusVersionDetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'CensusVersion' });
  if (denied) return response;
  const records = await base44.entities.CensusVersion.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function listCensusMembers(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'CensusMember', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
  const members = await base44.entities.CensusMember.filter(filters);
  return buildScopedResponse({ data: members, correlation_id: decision.correlation_id });
}

export async function getCensusMemberDetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'CensusMember' });
  if (denied) return response;
  const records = await base44.entities.CensusMember.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

/**
 * createCensusImportJob_PLACEHOLDER — FAIL-CLOSED PLACEHOLDER
 * CensusImportJob is in SCOPE_PENDING_ENTITY_TYPES (Phase 1 P1 gap).
 * This service must fail closed until the mini-pass resolves the canonical entity path.
 */
export async function createCensusImportJob_PLACEHOLDER(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  // Scope gate is called even for placeholders — always first
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'CensusImportJob' });
  if (denied) return response; // Gate returns SCOPE_PENDING_MIGRATION for this entity type
  // If somehow gate allowed (should not happen per SCOPE_PENDING_ENTITY_TYPES), explicitly fail closed
  return buildScopePendingResponse(decision.correlation_id);
}

/**
 * getCensusImportStatus_PLACEHOLDER — FAIL-CLOSED PLACEHOLDER
 * CensusImportJob is scope-pending. Always returns SCOPE_PENDING_MIGRATION.
 */
export async function getCensusImportStatus_PLACEHOLDER(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'CensusImportJob' });
  if (denied) return response;
  return buildScopePendingResponse(decision?.correlation_id);
}

/**
 * getCensusValidationResult_PLACEHOLDER — FAIL-CLOSED PLACEHOLDER
 * CensusValidationResult is scope-pending. Always returns SCOPE_PENDING_MIGRATION.
 */
export async function getCensusValidationResult_PLACEHOLDER(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'CensusValidationResult' });
  if (denied) return response;
  return buildScopePendingResponse(decision?.correlation_id);
}

/**
 * getCensusAuditEvent_PLACEHOLDER — FAIL-CLOSED PLACEHOLDER
 * CensusImportAuditEvent is scope-pending. Always returns SCOPE_PENDING_MIGRATION.
 */
export async function getCensusAuditEvent_PLACEHOLDER(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'view_audit', target_entity_type: 'CensusImportAuditEvent' });
  if (denied) return response;
  return buildScopePendingResponse(decision?.correlation_id);
}

export default {
  listCensusVersions,
  getCensusVersionDetail,
  listCensusMembers,
  getCensusMemberDetail,
  createCensusImportJob_PLACEHOLDER,
  getCensusImportStatus_PLACEHOLDER,
  getCensusValidationResult_PLACEHOLDER,
  getCensusAuditEvent_PLACEHOLDER,
};