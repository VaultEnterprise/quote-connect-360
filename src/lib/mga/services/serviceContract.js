/**
 * MGA Phase 3 — Scoped Service Contract Standard
 * lib/mga/services/serviceContract.js
 *
 * Defines the canonical contract that every Phase 3 scoped service must follow.
 * Provides shared utilities: request validation, response building, error mapping.
 *
 * PHASE 3 CONSTRAINT: These services are inert library modules.
 * They must not be called by live pages, functions, or routes until Phase 5 wiring.
 *
 * Required service pattern (enforced via buildScopedResponse):
 *   receive request
 *   → validateServiceRequest()
 *   → authenticate actor (scopeGate handles)
 *   → scopeGate.check() ← MUST BE FIRST CALL IN EVERY SERVICE
 *   → if denied: return buildErrorResponse(decision)
 *   → perform scoped operation using resolved scope only
 *   → auditDecision.build() + auditDecision.record() for material operations
 *   → return buildScopedResponse(...)
 *
 * @see docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md Section 3
 */

import { check as scopeGateCheck, buildErrorResponse } from '../scopeGate.js';
import { build as buildAudit, record as recordAudit } from '../auditDecision.js';
import { errorModel } from '../errorModel.js';

// ─── Idempotency tracking (in-memory for Phase 3 definition; Phase 5 wires to persistent store) ───

const IDEMPOTENCY_REQUIRED_ACTIONS = new Set([
  'create', 'transmit', 'retry', 'upload', 'import',
  'export', 'report_generation', 'webhook_processing', 'notification_send',
]);

// ─── Request validation ───────────────────────────────────────────────────────

/**
 * validateServiceRequest — Validate incoming service request structure.
 * Returns { valid: boolean, error: string | null }
 */
export function validateServiceRequest(request, options = {}) {
  if (!request) return { valid: false, error: 'MALFORMED_TARGET: request is null' };
  if (!request.actor_email) return { valid: false, error: 'UNAUTHENTICATED: actor_email missing' };
  if (!request.actor_session_token) return { valid: false, error: 'UNAUTHENTICATED: session token missing' };
  if (!request.domain) return { valid: false, error: 'MALFORMED_TARGET: domain missing' };
  if (!request.action) return { valid: false, error: 'MALFORMED_TARGET: action missing' };
  if (!request.target_entity_type) return { valid: false, error: 'MALFORMED_TARGET: target_entity_type missing' };

  // Idempotency key required for sensitive operations
  if (IDEMPOTENCY_REQUIRED_ACTIONS.has(request.action) && options.requireIdempotency !== false) {
    if (!request.idempotency_key) {
      return { valid: false, error: 'MALFORMED_TARGET: idempotency_key required for this operation' };
    }
  }

  // client_supplied_mga_id is accepted as hint only — never as authoritative input
  if (request.client_supplied_mga_id) {
    request._client_mga_hint = request.client_supplied_mga_id;
    // Do not forward as authoritative; gate will detect mismatch if present
  }

  return { valid: true, error: null };
}

// ─── Standard response builder ─────────────────────────────────────────────

/**
 * buildScopedResponse — Build a standard scoped service response.
 */
export function buildScopedResponse(options = {}) {
  return {
    success: options.success !== false,
    data: options.data !== undefined ? options.data : null,
    masked_not_found: options.masked_not_found || false,
    reason_code: options.reason_code || null,
    correlation_id: options.correlation_id || null,
    audit_ref: options.audit_ref || null,
    idempotency_result: options.idempotency_result || null,
    validation_errors: options.validation_errors || null,
  };
}

/**
 * buildDeniedResponse — Build a standard denied response from a gate decision.
 */
export function buildDeniedResponse(decision) {
  const errResp = buildErrorResponse(decision);
  return buildScopedResponse({
    success: false,
    data: null,
    masked_not_found: decision.reason_code === 'NOT_FOUND_IN_SCOPE',
    reason_code: decision.reason_code,
    correlation_id: decision.correlation_id,
  });
}

// ─── Scope gate invocation helper ─────────────────────────────────────────

/**
 * checkScope — Standard wrapper to call scopeGate.check().
 * MUST be the first operation in every service method.
 * Returns { decision, denied, response } where:
 *   - denied === true means the operation must return response immediately
 *   - denied === false means the operation may proceed using decision.effective_mga_id
 */
export async function checkScope(request) {
  const gateRequest = {
    actor_email: request.actor_email,
    actor_session_token: request.actor_session_token,
    target_entity_type: request.target_entity_type,
    target_entity_id: request.target_entity_id || 'list_operation',
    target_parent_refs: request.target_parent_refs || null,
    domain: request.domain,
    action: request.action,
    correlation_id: request.correlation_id,
    request_channel: request.request_channel || 'api',
    impersonation_session_id: request.impersonation_session_id || null,
    client_supplied_mga_id: request._client_mga_hint || null,
  };

  const decision = await scopeGateCheck(gateRequest);

  if (!decision.allowed) {
    return {
      decision,
      denied: true,
      response: buildDeniedResponse(decision),
    };
  }

  return {
    decision,
    denied: false,
    response: null,
  };
}

// ─── Audit helpers ────────────────────────────────────────────────────────

/**
 * prepareAndRecordAudit — Build and conditionally record audit metadata.
 */
export async function prepareAndRecordAudit(decision, operationResult, idempotencyKey = null) {
  const auditRecord = buildAudit(decision, operationResult, idempotencyKey);
  await recordAudit(decision, operationResult, idempotencyKey);
  return auditRecord;
}

// ─── Scope-pending guard ──────────────────────────────────────────────────

/**
 * SCOPE_PENDING_ENTITY_TYPES — Re-exported from scopeResolver for service-layer use.
 * Services that define placeholders for these entities should call isScopePending().
 */
export const SCOPE_PENDING_ENTITY_TYPES = [
  'Tenant', 'CensusImportJob', 'CensusImportAuditEvent', 'CensusValidationResult',
  'UserManual', 'HelpSearchLog', 'HelpAIQuestionLog', 'HelpCoverageSnapshot',
  'HelpAuditLog', 'HelpAITrainingQueue',
];

export function isScopePending(entityType) {
  return SCOPE_PENDING_ENTITY_TYPES.includes(entityType);
}

/**
 * buildScopePendingResponse — Return a canonical fail-closed response for scope-pending entities.
 * All fail-closed placeholder services call this.
 */
export function buildScopePendingResponse(correlationId) {
  return buildScopedResponse({
    success: false,
    reason_code: 'SCOPE_PENDING_MIGRATION',
    correlation_id: correlationId,
  });
}

// ─── Phase 3 service registry (for coverage matrix and audit) ─────────────

export const PHASE3_SERVICE_REGISTRY = [
  // A. MGA Management
  { name: 'createMGA', domain: 'mga', action: 'create', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'getMGADetail', domain: 'mga', action: 'detail', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'listMGAs', domain: 'mga', action: 'list', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'updateMGA', domain: 'mga', action: 'edit', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: true, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'changeMGAStatus', domain: 'mga', action: 'approve', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'manageMGAOnboarding', domain: 'mga', action: 'edit', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'manageMGAAgreements', domain: 'mga', action: 'edit', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'manageMGACommissionProfile', domain: 'mga', action: 'edit', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  // B. MasterGroup
  { name: 'createMasterGroup', domain: 'mastergroup', action: 'create', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'getMasterGroupDetail', domain: 'mastergroup', action: 'detail', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'listMasterGroups', domain: 'mastergroup', action: 'list', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'updateMasterGroup', domain: 'mastergroup', action: 'edit', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: true, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'archiveMasterGroup', domain: 'mastergroup', action: 'delete', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'getMasterGroupSummary', domain: 'mastergroup', action: 'read', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'listMasterGroupActivity', domain: 'mastergroup', action: 'view_audit', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  // C. Case
  { name: 'createCase', domain: 'cases', action: 'create', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'getCaseDetail', domain: 'cases', action: 'detail', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'listCases', domain: 'cases', action: 'list', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'updateCase', domain: 'cases', action: 'edit', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: true, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'archiveCase', domain: 'cases', action: 'delete', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'reassignCase', domain: 'cases', action: 'edit', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'getCaseStatusSummary', domain: 'cases', action: 'read', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'advanceCaseStage', domain: 'cases', action: 'approve', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: true, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  // D. Census (with fail-closed placeholders)
  { name: 'listCensusVersions', domain: 'census', action: 'list', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'getCensusVersionDetail', domain: 'census', action: 'detail', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: true, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'listCensusMembers', domain: 'census', action: 'list', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'getCensusMemberDetail', domain: 'census', action: 'detail', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: false, status: 'Implemented' },
  { name: 'createCensusImportJob_PLACEHOLDER', domain: 'census', action: 'create', callsScopeGate: true, auditMetadata: true, idempotency: true, concurrency: false, fileImplication: true, externalSideEffect: false, asyncImplication: true, p1GatedEntity: true, status: 'Fail-Closed Placeholder' },
  { name: 'getCensusImportStatus_PLACEHOLDER', domain: 'census', action: 'read', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: true, p1GatedEntity: true, status: 'Fail-Closed Placeholder' },
  { name: 'getCensusValidationResult_PLACEHOLDER', domain: 'census', action: 'read', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: true, status: 'Fail-Closed Placeholder' },
  { name: 'getCensusAuditEvent_PLACEHOLDER', domain: 'census', action: 'view_audit', callsScopeGate: true, auditMetadata: true, idempotency: false, concurrency: false, fileImplication: false, externalSideEffect: false, asyncImplication: false, p1GatedEntity: true, status: 'Fail-Closed Placeholder' },
];

export default {
  validateServiceRequest,
  buildScopedResponse,
  buildDeniedResponse,
  buildScopePendingResponse,
  checkScope,
  prepareAndRecordAudit,
  isScopePending,
  SCOPE_PENDING_ENTITY_TYPES,
  PHASE3_SERVICE_REGISTRY,
};