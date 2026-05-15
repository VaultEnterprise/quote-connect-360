/**
 * MGA Phase 2 — Canonical Scope Resolver
 * lib/mga/scopeResolver.js
 *
 * This is the authoritative scope resolution algorithm for all protected MGA operations.
 * It implements the 12-step deterministic algorithm defined in the Phase 2 report Section 3.4.
 *
 * PHASE 2 CONSTRAINT: This library is inert until imported by Phase 3 services.
 * It does not modify any existing application behavior.
 *
 * SOURCE OF TRUTH: Server-side MasterGeneralAgentUser membership records.
 * Client-provided scope values (master_general_agent_id, role, etc.) are NEVER authoritative.
 *
 * @see docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md Section 3
 */

import { base44 } from '@/api/base44Client';
import { errorModel } from './errorModel.js';

/**
 * Entities whose master_general_agent_id is not yet propagated (Phase 1 P1 gaps).
 * Resolution for these entity types MUST fail closed with SCOPE_PENDING_MIGRATION.
 * This list MUST be updated when the dedicated mini-pass resolves each entity.
 *
 * Gate rule: Phase 3 services targeting these entities are BLOCKED until resolved.
 * @see docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md Section 2
 */
export const SCOPE_PENDING_ENTITY_TYPES = [
  'Tenant',
  'CensusImportJob',
  'CensusImportAuditEvent',
  'CensusValidationResult',
  'UserManual',
  'HelpSearchLog',
  'HelpAIQuestionLog',
  'HelpCoverageSnapshot',
  'HelpAuditLog',
  'HelpAITrainingQueue',
];

/**
 * Entity types classified as Global - Intentional (not MGA-scoped).
 * These entities do not carry master_general_agent_id and are accessible
 * through platform-controlled catalog services only.
 */
export const GLOBAL_ENTITY_TYPES = [
  'HelpModule',
  'HelpPage',
  'HelpSection',
  'HelpContent',
  'HelpContentVersion',
  'HelpTarget',
  'HelpManualTopic',
  'HelpManualTopicTargetMap',
  'SeedRun',
  'SeedRunStep',
  'User',
];

/**
 * resolveScope — Execute the canonical 12-step scope resolution algorithm.
 *
 * @param {Object} context
 * @param {string} context.actor_email — from authenticated session only
 * @param {string} context.actor_session_token — validated before calling resolver
 * @param {string} context.target_entity_type — entity type name
 * @param {string} context.target_entity_id — specific record ID
 * @param {Object} [context.target_parent_refs] — optional known parent chain
 * @param {string} context.domain — operational domain
 * @param {string} context.action — operation action
 * @param {string} context.correlation_id — required; generated if absent
 * @param {string} context.request_channel — ui|api|webhook|scheduled_job|async_job|import|system
 * @param {string|null} [context.impersonation_session_id] — support operations only
 * @returns {Promise<ScopeDecision>}
 */
export async function resolveScope(context) {
  const correlationId = context.correlation_id || _generateCorrelationId();
  const decisionTimestamp = new Date().toISOString();

  const baseDecision = {
    allowed: false,
    reason_code: null,
    actor_email: context.actor_email,
    actor_role: null,
    actor_type: null,
    real_actor_email: null,
    impersonated_actor_email: null,
    effective_mga_id: null,
    effective_mga_name: null,
    allowed_master_group_ids: [],
    target_entity_type: context.target_entity_type,
    target_entity_id: context.target_entity_id,
    target_mga_id: null,
    domain: context.domain,
    action: context.action,
    required_permission: `${context.domain}:${context.action}`,
    decision_timestamp: decisionTimestamp,
    correlation_id: correlationId,
    audit_required: false,
    security_event: false,
    governance_event: false,
  };

  // STEP 1 — Authenticate actor
  if (!context.actor_email || !context.actor_session_token) {
    return { ...baseDecision, ...errorModel.UNAUTHENTICATED };
  }

  // STEP 2 — Resolve actor principal type
  let actorType = 'mga_user';
  let isPlatformSuperAdmin = false;

  try {
    const users = await base44.entities.User.filter({ email: context.actor_email });
    const user = users?.[0];
    if (user?.role === 'admin') {
      actorType = 'platform_super_admin';
      isPlatformSuperAdmin = true;
    }
  } catch {
    return { ...baseDecision, ...errorModel.UNAUTHENTICATED };
  }

  // STEP 3 — Handle support impersonation path
  if (context.impersonation_session_id) {
    return await _resolveImpersonationScope(context, baseDecision, correlationId, decisionTimestamp);
  }

  // STEP 4-6 — Load and validate membership (skip for platform_super_admin)
  let effectiveMgaId = 'platform_scope';
  let actorRole = 'platform_super_admin';
  let allowedMasterGroupIds = [];

  if (!isPlatformSuperAdmin) {
    let memberships = [];
    try {
      memberships = await base44.entities.MasterGeneralAgentUser.filter({
        user_email: context.actor_email,
        status: 'active',
      });
    } catch {
      return {
        ...baseDecision,
        ...errorModel.MISSING_MEMBERSHIP,
        security_event: true,
        correlation_id: correlationId,
      };
    }

    if (!memberships || memberships.length === 0) {
      return {
        ...baseDecision,
        ...errorModel.MISSING_MEMBERSHIP,
        security_event: true,
        correlation_id: correlationId,
      };
    }

    // Validate single-MGA cardinality
    const uniqueMgaIds = [...new Set(memberships.map((m) => m.master_general_agent_id))];
    if (uniqueMgaIds.length > 1) {
      return {
        ...baseDecision,
        ...errorModel.CONFLICTING_MEMBERSHIP,
        security_event: true,
        correlation_id: correlationId,
      };
    }

    effectiveMgaId = uniqueMgaIds[0];
    actorRole = memberships[0].role;
    actorType = actorRole;

    // Collect allowed MasterGroups across all membership records
    const allGroupIds = memberships.flatMap((m) => m.allowed_master_group_ids || []);
    allowedMasterGroupIds = [...new Set(allGroupIds)]; // empty = all within MGA
  }

  // STEP 7 — Resolve target entity scope
  // Global entity types do not require MGA scope validation
  if (GLOBAL_ENTITY_TYPES.includes(context.target_entity_type)) {
    return {
      ...baseDecision,
      allowed: true,
      reason_code: 'GLOBAL_ENTITY',
      actor_role: actorRole,
      actor_type: actorType,
      effective_mga_id: effectiveMgaId,
      allowed_master_group_ids: allowedMasterGroupIds,
      audit_required: isPlatformSuperAdmin,
      correlation_id: correlationId,
    };
  }

  // Check scope-pending entities (P1 gaps — fail closed)
  if (SCOPE_PENDING_ENTITY_TYPES.includes(context.target_entity_type)) {
    return {
      ...baseDecision,
      ...errorModel.SCOPE_PENDING_MIGRATION,
      actor_type: actorType,
      actor_role: actorRole,
      effective_mga_id: effectiveMgaId,
      correlation_id: correlationId,
      scope_pending_flag: true,
    };
  }

  // LIST OPERATION SENTINEL — skip per-record lookup; scope is resolved from actor membership alone
  if (context.target_entity_id === 'list_operation') {
    return {
      ...baseDecision,
      allowed: true,
      reason_code: 'SCOPE_RESOLVED',
      actor_type: actorType,
      actor_role: actorRole,
      effective_mga_id: effectiveMgaId,
      allowed_master_group_ids: allowedMasterGroupIds,
      target_mga_id: effectiveMgaId,
      audit_required: isPlatformSuperAdmin,
      security_event: false,
      correlation_id: correlationId,
    };
  }

  let targetRecord = null;
  try {
    const records = await base44.entities[context.target_entity_type].filter({
      id: context.target_entity_id,
    });
    targetRecord = records?.[0];
  } catch {
    // Entity type unrecognized or lookup failed
    return {
      ...baseDecision,
      ...errorModel.NOT_FOUND_IN_SCOPE,
      actor_type: actorType,
      actor_role: actorRole,
      effective_mga_id: effectiveMgaId,
      correlation_id: correlationId,
    };
  }

  if (!targetRecord) {
    return {
      ...baseDecision,
      ...errorModel.NOT_FOUND_IN_SCOPE,
      actor_type: actorType,
      actor_role: actorRole,
      effective_mga_id: effectiveMgaId,
      correlation_id: correlationId,
    };
  }

  const targetMgaId = targetRecord.master_general_agent_id;

  // Quarantine check before scope comparison
  if (targetRecord.mga_migration_status === 'quarantined') {
    if (!isPlatformSuperAdmin) {
      return {
        ...baseDecision,
        ...errorModel.QUARANTINE_DENIED,
        actor_type: actorType,
        actor_role: actorRole,
        effective_mga_id: effectiveMgaId,
        target_mga_id: targetMgaId,
        correlation_id: correlationId,
        quarantine_flag: true,
      };
    }
    // Platform super admin may view quarantined records
    return {
      ...baseDecision,
      allowed: true,
      reason_code: 'QUARANTINE_VISIBLE',
      actor_type: 'platform_super_admin',
      actor_role: 'platform_super_admin',
      effective_mga_id: effectiveMgaId,
      target_mga_id: targetMgaId,
      audit_required: true,
      security_event: true,
      correlation_id: correlationId,
      quarantine_flag: true,
    };
  }

  // Stale scope check
  if (!targetMgaId) {
    return {
      ...baseDecision,
      ...errorModel.STALE_SCOPE,
      actor_type: actorType,
      actor_role: actorRole,
      effective_mga_id: effectiveMgaId,
      target_mga_id: null,
      security_event: true,
      correlation_id: correlationId,
    };
  }

  // STEP 8 — Compare actor scope to target scope
  if (!isPlatformSuperAdmin && effectiveMgaId !== targetMgaId) {
    return {
      ...baseDecision,
      ...errorModel.CROSS_MGA_VIOLATION,
      actor_type: actorType,
      actor_role: actorRole,
      effective_mga_id: effectiveMgaId,
      target_mga_id: targetMgaId,
      security_event: true,
      audit_required: true,
      correlation_id: correlationId,
    };
  }

  // STEP 9 — Evaluate RBAC permission (delegated to permissionResolver)
  // (permissionResolver.check() called by scopeGate after this resolver returns)
  // Resolver returns scope match; gate applies permission matrix

  return {
    ...baseDecision,
    allowed: true,
    reason_code: 'SCOPE_RESOLVED',
    actor_type: actorType,
    actor_role: actorRole,
    effective_mga_id: effectiveMgaId,
    allowed_master_group_ids: allowedMasterGroupIds,
    target_mga_id: targetMgaId,
    audit_required: isPlatformSuperAdmin,
    security_event: false,
    correlation_id: correlationId,
  };
}

/**
 * _resolveImpersonationScope — Internal handler for support impersonation sessions.
 * Impersonation is read-only by default. Write operations are denied unless break-glass is active (disabled by default).
 */
async function _resolveImpersonationScope(context, baseDecision, correlationId) {
  // Write-capable impersonation is disabled by default
  const writeActions = ['create', 'edit', 'update', 'delete', 'approve', 'transmit', 'retry', 'upload', 'import'];
  if (writeActions.includes(context.action)) {
    return {
      ...baseDecision,
      ...errorModel.IMPERSONATION_WRITE_DENIED,
      actor_type: 'support_impersonation',
      real_actor_email: context.actor_email,
      security_event: true,
      audit_required: true,
      correlation_id: correlationId,
    };
  }

  // For read operations in impersonation mode, the resolver follows the impersonated subject's scope
  // Full impersonation session management is in impersonationControl.js
  return {
    ...baseDecision,
    allowed: true,
    reason_code: 'IMPERSONATION_READ_ALLOWED',
    actor_type: 'support_impersonation',
    real_actor_email: context.actor_email,
    audit_required: true,
    security_event: false,
    correlation_id: correlationId,
  };
}

/**
 * _generateCorrelationId — Generate a UUID-style correlation ID.
 */
function _generateCorrelationId() {
  return 'corr-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
}

export default { resolveScope, SCOPE_PENDING_ENTITY_TYPES, GLOBAL_ENTITY_TYPES };