/**
 * MGA Phase 2 — Async / Webhook / Retry / Scheduled Job Scope Rules
 * lib/mga/asyncScopeRules.js
 *
 * Defines scope requirements and failure behavior for non-UI operations.
 * These rules must be followed by all Phase 3+ async jobs, schedulers,
 * retry queues, import/export pipelines, and webhook handlers.
 *
 * PHASE 2 CONSTRAINT: Inert until called by Phase 3 services.
 * Does not modify any existing application behavior.
 *
 * @see docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md Section 10
 */

/**
 * JOB_SCOPE_FIELDS — Required fields that must be persisted on every async job record at enqueue time.
 */
export const JOB_SCOPE_FIELDS = [
  'initiating_actor_email',
  'effective_mga_id',
  'target_entity_type',
  'target_entity_ids',    // array
  'correlation_id',
  'request_channel',      // "async_job"|"import"|"export"|"scheduled_job"
  'idempotency_key',
  'enqueued_at',
];

/**
 * SCHEDULED_JOB_SCOPE_TYPES — Valid scope types for scheduled jobs.
 */
export const SCHEDULED_JOB_SCOPE_TYPES = {
  PLATFORM_GLOBAL: 'platform_global',   // platform-only operations; no scoped data access
  MGA_TARGETED: 'mga_targeted',         // operates only within configured MGA
};

/**
 * PLATFORM_GLOBAL_ALLOWED_OPERATIONS — Operations permitted for platform-global scheduled jobs.
 * These must not access scoped operational entity data.
 */
export const PLATFORM_GLOBAL_ALLOWED_OPERATIONS = [
  'cleanup_orphaned_help_content',
  'generate_coverage_snapshot',
  'run_help_master_seed',
  'seed_documentation_system',
  'seed_page_inventory',
];

/**
 * buildJobContext — Construct the scope context that must be persisted on async job creation.
 *
 * @param {GateDecision} gateDecision — gate decision from the initiating protected request
 * @param {string[]} targetEntityIds
 * @param {string} idempotencyKey
 * @param {string} requestChannel
 * @returns {JobScopeContext}
 */
export function buildJobContext(gateDecision, targetEntityIds, idempotencyKey, requestChannel = 'async_job') {
  if (!gateDecision.allowed) {
    throw new Error('Cannot create job context from denied gate decision.');
  }

  return {
    initiating_actor_email: gateDecision.actor_email,
    effective_mga_id: gateDecision.effective_mga_id,
    actor_role: gateDecision.actor_role,
    target_entity_type: gateDecision.target_entity_type,
    target_entity_ids: targetEntityIds,
    correlation_id: gateDecision.correlation_id,
    request_channel: requestChannel,
    idempotency_key: idempotencyKey,
    enqueued_at: new Date().toISOString(),
  };
}

/**
 * validateJobExecution — Re-resolve scope at job execution time.
 * Compares stored job context against current target record scope.
 * Fails closed if scope has drifted.
 *
 * @param {JobScopeContext} jobContext — persisted context from enqueue time
 * @param {string} currentTargetMgaId — resolved from current target record at execution time
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateJobExecution(jobContext, currentTargetMgaId) {
  if (!jobContext.effective_mga_id) {
    return {
      valid: false,
      reason: 'ASYNC_SCOPE_DRIFT',
      message: 'Job has no effective MGA scope — cannot execute.',
    };
  }

  if (!currentTargetMgaId) {
    return {
      valid: false,
      reason: 'STALE_SCOPE',
      message: 'Target record has null MGA scope at execution time.',
    };
  }

  if (
    jobContext.effective_mga_id !== 'platform_scope' &&
    currentTargetMgaId !== jobContext.effective_mga_id
  ) {
    return {
      valid: false,
      reason: 'ASYNC_SCOPE_DRIFT',
      message: `Job enqueued for MGA ${jobContext.effective_mga_id} but target now resolves to MGA ${currentTargetMgaId}.`,
    };
  }

  return { valid: true, reason: null };
}

/**
 * buildRetryContext — Construct retry context from an original operation context.
 * Preserves original idempotency_key and correlation_id; adds retry metadata.
 *
 * @param {JobScopeContext} originalContext
 * @param {number} retryAttempt — 1-based retry number
 * @returns {RetryContext}
 */
export function buildRetryContext(originalContext, retryAttempt = 1) {
  return {
    ...originalContext,
    original_correlation_id: originalContext.correlation_id,
    retry_correlation_id: `retry-${retryAttempt}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    retry_attempt: retryAttempt,
    retried_at: new Date().toISOString(),
    // idempotency_key preserved — prevents duplicate execution
  };
}

/**
 * resolveWebhookOwnership — Determine the MGA scope of a webhook receipt
 * by resolving its owning entity. Returns quarantine directive if unresolvable.
 *
 * @param {Object} params
 * @param {string} params.webhook_type — e.g. "docusign", "stripe", "external"
 * @param {string|null} params.entity_type — if known from webhook payload
 * @param {string|null} params.entity_id — if known from webhook payload
 * @param {string|null} params.resolved_mga_id — if resolvable from owned entity
 * @returns {{ resolved: boolean, mga_id: string|null, quarantine: boolean, quarantine_reason: string|null }}
 */
export function resolveWebhookOwnership(params) {
  const { entity_type, entity_id, resolved_mga_id } = params;

  // If owning entity is known and MGA is resolved
  if (entity_type && entity_id && resolved_mga_id) {
    return {
      resolved: true,
      mga_id: resolved_mga_id,
      quarantine: false,
      quarantine_reason: null,
    };
  }

  // If entity is known but MGA is missing — stale scope
  if (entity_type && entity_id && !resolved_mga_id) {
    return {
      resolved: false,
      mga_id: null,
      quarantine: true,
      quarantine_reason: 'Webhook receipt: owning entity found but MGA scope is null (stale scope).',
      anomaly_class: 'missing_upstream_owner_mapping',
    };
  }

  // No owning entity resolvable — quarantine
  return {
    resolved: false,
    mga_id: null,
    quarantine: true,
    quarantine_reason: 'Webhook receipt: no owning in-scope entity could be resolved.',
    anomaly_class: 'ambiguous_ownership',
  };
}

/**
 * validateScheduledJobScope — Verify that a scheduled job's configured scope
 * is appropriate for its operation type.
 *
 * @param {Object} params
 * @param {string} params.scope_type — PLATFORM_GLOBAL | MGA_TARGETED
 * @param {string} params.operation_name
 * @param {string|null} params.configured_mga_id — required for MGA_TARGETED
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateScheduledJobScope(params) {
  const { scope_type, operation_name, configured_mga_id } = params;

  if (scope_type === SCHEDULED_JOB_SCOPE_TYPES.PLATFORM_GLOBAL) {
    if (!PLATFORM_GLOBAL_ALLOWED_OPERATIONS.includes(operation_name)) {
      return {
        valid: false,
        reason: 'UNSUPPORTED_OPERATION',
        message: `Operation '${operation_name}' is not approved for platform-global scheduled execution.`,
      };
    }
    return { valid: true, reason: null };
  }

  if (scope_type === SCHEDULED_JOB_SCOPE_TYPES.MGA_TARGETED) {
    if (!configured_mga_id) {
      return {
        valid: false,
        reason: 'MISSING_MEMBERSHIP',
        message: 'MGA-targeted scheduled job has no configured MGA scope.',
      };
    }
    return { valid: true, reason: null };
  }

  return {
    valid: false,
    reason: 'UNSUPPORTED_OPERATION',
    message: `Unknown scope type: ${scope_type}`,
  };
}

/**
 * validateImportRecord — Check whether an import record's resolved scope
 * matches the import job scope. Returns quarantine directive if mismatch.
 *
 * @param {JobScopeContext} jobContext
 * @param {string|null} recordMgaId — resolved from the record's parent entity
 * @returns {{ valid: boolean, quarantine: boolean, reason: string|null }}
 */
export function validateImportRecord(jobContext, recordMgaId) {
  if (!recordMgaId) {
    return {
      valid: false,
      quarantine: true,
      reason: 'Record has null MGA scope at import time.',
      anomaly_class: 'missing_upstream_owner_mapping',
    };
  }

  if (recordMgaId !== jobContext.effective_mga_id) {
    return {
      valid: false,
      quarantine: true,
      reason: `Import record scope (${recordMgaId}) differs from job scope (${jobContext.effective_mga_id}).`,
      anomaly_class: 'conflicting_parent_chain',
    };
  }

  return { valid: true, quarantine: false, reason: null };
}

export default {
  buildJobContext,
  validateJobExecution,
  buildRetryContext,
  resolveWebhookOwnership,
  validateScheduledJobScope,
  validateImportRecord,
  JOB_SCOPE_FIELDS,
  SCHEDULED_JOB_SCOPE_TYPES,
  PLATFORM_GLOBAL_ALLOWED_OPERATIONS,
};