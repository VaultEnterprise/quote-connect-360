/**
 * MGA Phase 4A — Dry-Run Migration Engine
 * lib/mga/migration/dryRunEngine.js
 *
 * Computes proposed master_general_agent_id values for every scoped entity
 * WITHOUT committing any changes to operational records.
 *
 * PHASE 4A CONSTRAINT:
 *   - MUST NOT update master_general_agent_id on any operational record.
 *   - MUST NOT update mga_migration_status on any operational record.
 *   - MUST NOT remove any entity from SCOPE_PENDING_ENTITY_TYPES.
 *   - Output written only to dry-run batch reporting structures (MGAMigrationBatch with dry_run_flag: true).
 *   - Idempotent — may be re-run multiple times without side effects.
 *   - Completion of dry-run does NOT authorize Phase 4B.
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 6
 */

import { base44 } from '@/api/base44Client';

// ─── Backfill order (matches Section 4 of Phase 4A report) ───────────────────

export const BACKFILL_ORDER = [
  { step: 1, entity: 'MasterGeneralAgent', parentField: null, parentEntity: null },
  { step: 2, entity: 'MasterGroup', parentField: 'master_general_agent_id', parentEntity: null, mappingRequired: true },
  { step: 3, entity: 'Tenant', parentField: 'master_group_id', parentEntity: 'MasterGroup' },
  { step: 4, entity: 'EmployerGroup', parentField: 'master_group_id', parentEntity: 'MasterGroup' },
  { step: 5, entity: 'BenefitCase', parentField: 'employer_group_id', parentEntity: 'EmployerGroup' },
  { step: 6, entity: 'CensusVersion', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 6, entity: 'CensusMember', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 7, entity: 'CensusImportJob', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 7, entity: 'CensusImportAuditEvent', parentField: 'census_import_job_id', parentEntity: 'CensusImportJob' },
  { step: 7, entity: 'CensusValidationResult', parentField: 'census_import_job_id', parentEntity: 'CensusImportJob', crossCheck: { field: 'census_version_id', entity: 'CensusVersion' } },
  { step: 8, entity: 'QuoteScenario', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 8, entity: 'ScenarioPlan', parentField: 'scenario_id', parentEntity: 'QuoteScenario' },
  { step: 8, entity: 'ContributionModel', parentField: 'scenario_id', parentEntity: 'QuoteScenario' },
  { step: 8, entity: 'QuoteTransmission', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 8, entity: 'PolicyMatchResult', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 9, entity: 'Proposal', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 10, entity: 'TxQuoteCase', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 10, entity: 'TxQuoteDestination', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteReadinessResult', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteSubmissionLog', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteEmployerProfile', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteCurrentPlanInfo', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteContributionStrategy', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteClaimsRequirement', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteSupportingDocument', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteDestinationContact', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 10, entity: 'TxQuoteCensusOverride', parentField: 'txquote_case_id', parentEntity: 'TxQuoteCase' },
  { step: 11, entity: 'EnrollmentWindow', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 11, entity: 'EmployeeEnrollment', parentField: 'enrollment_window_id', parentEntity: 'EnrollmentWindow' },
  { step: 11, entity: 'EnrollmentMember', parentField: 'enrollment_window_id', parentEntity: 'EnrollmentWindow' },
  { step: 12, entity: 'Document', parentField: 'case_id', parentEntity: 'BenefitCase', fallbackParentField: 'employer_group_id', fallbackParentEntity: 'EmployerGroup' },
  { step: 13, entity: 'RenewalCycle', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 14, entity: 'CaseTask', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 14, entity: 'ExceptionItem', parentField: 'case_id', parentEntity: 'BenefitCase' },
  { step: 15, entity: 'ActivityLog', parentField: 'case_id', parentEntity: 'BenefitCase', nullMgaAcceptable: true },
  { step: 16, entity: 'HelpSearchLog', parentField: null, parentEntity: null, resolveViaUser: true, nullMgaAcceptable: true },
  { step: 16, entity: 'HelpAIQuestionLog', parentField: null, parentEntity: null, resolveViaUser: true, nullMgaAcceptable: true },
  { step: 17, entity: 'HelpCoverageSnapshot', parentField: null, parentEntity: null, requiresScopeTypeClassification: true, nullMgaAcceptable: true },
  { step: 17, entity: 'HelpAITrainingQueue', parentField: null, parentEntity: null, requiresScopeTypeClassification: true, nullMgaAcceptable: true },
  { step: 17, entity: 'UserManual', parentField: null, parentEntity: null, requiresScopeTypeClassification: true, nullMgaAcceptable: true },
  { step: 18, entity: 'HelpAuditLog', parentField: null, parentEntity: null, resolveViaUser: true, nullMgaAcceptable: true },
  { step: 19, entity: 'CaseFilterPreset', parentField: null, parentEntity: null, resolveViaUser: true, nullMgaAcceptable: true },
  { step: 19, entity: 'ViewPreset', parentField: null, parentEntity: null, resolveViaUser: true, nullMgaAcceptable: true },
];

// ─── Dry-run output record structure ─────────────────────────────────────────

/**
 * buildDryRunRecord — Build a dry-run output record for a single entity record.
 * This record is NOT written to the operational entity. It is written to the
 * dry-run batch manifest only.
 *
 * @param {Object} options
 * @returns {Object} dryRunRecord
 */
export function buildDryRunRecord({
  entityType,
  recordId,
  currentMgaId,
  proposedMgaId,
  sourceParentChain,
  confidenceLevel,
  isDeterministic,
  anomalyDetected,
  anomalyClass,
  quarantineRecommended,
  businessApprovalRequired,
  rollbackMarker,
  validationStatus,
  dryRunBatchId,
}) {
  // SAFETY GUARD: Proposed MGA must never be a placeholder or empty string.
  // If proposedMgaId is not a valid string (non-empty), force quarantine.
  const safeProposesMgaId = (typeof proposedMgaId === 'string' && proposedMgaId.length > 0)
    ? proposedMgaId
    : null;

  if (proposedMgaId !== null && safeProposesMgaId === null) {
    anomalyDetected = true;
    anomalyClass = 'fake_default_mga_detected';
    quarantineRecommended = true;
    isDeterministic = false;
    confidenceLevel = 'low';
    validationStatus = 'fail';
  }

  return {
    entity_type: entityType,
    record_id: recordId,
    current_mga_id: currentMgaId || null,
    proposed_mga_id: safeProposesMgaId,
    source_parent_chain: sourceParentChain || [],
    confidence_level: confidenceLevel || 'low',
    is_deterministic: isDeterministic === true,
    anomaly_detected: anomalyDetected === true,
    anomaly_class: anomalyClass || null,
    quarantine_recommended: quarantineRecommended === true,
    business_approval_required: businessApprovalRequired === true,
    rollback_marker: rollbackMarker || null,
    validation_status: validationStatus || 'pending',
    dry_run_batch_id: dryRunBatchId,
    dry_run_timestamp: new Date().toISOString(),
    // EXPLICIT SAFETY: This record documents intent only; it does NOT authorize backfill.
    _dry_run_only: true,
    _must_not_update_operational_record: true,
  };
}

/**
 * resolveParentChain — Walk the parent chain to compute proposed MGA.
 * Does NOT write to any record.
 *
 * @param {Object} record — current record being analyzed
 * @param {Object} stepConfig — BACKFILL_ORDER entry for this entity
 * @param {Map} resolvedCache — cache of already-resolved MGA IDs by entity/id
 * @returns {{ proposedMgaId, sourceChain, confidence, isDeterministic, anomaly }}
 */
export async function resolveParentChain(record, stepConfig, resolvedCache = new Map()) {
  const chain = [];

  // Case: record already has a valid MGA stamped
  if (record.master_general_agent_id) {
    return {
      proposedMgaId: record.master_general_agent_id,
      sourceChain: [`${stepConfig.entity}:${record.id}:already_stamped`],
      confidence: 'high',
      isDeterministic: true,
      anomaly: null,
    };
  }

  // Case: no parent field — requires user resolution or scope_type classification
  if (!stepConfig.parentField) {
    if (stepConfig.resolveViaUser) {
      // User-resolved: look up user_email → MasterGeneralAgentUser
      const userEmail = record.user_email || record.actor_email;
      if (!userEmail) {
        return { proposedMgaId: null, sourceChain: ['no_user_email'], confidence: 'low', isDeterministic: false, anomaly: 'orphaned_record' };
      }
      const cacheKey = `user:${userEmail}`;
      if (resolvedCache.has(cacheKey)) {
        return { proposedMgaId: resolvedCache.get(cacheKey), sourceChain: [`user:${userEmail}:cached`], confidence: 'high', isDeterministic: true, anomaly: null };
      }
      const memberships = await base44.entities.MasterGeneralAgentUser.filter({ user_email: userEmail, status: 'active' });
      if (!memberships?.length) {
        // Unauthenticated or no membership — null MGA acceptable
        resolvedCache.set(cacheKey, null);
        return { proposedMgaId: null, sourceChain: [`user:${userEmail}:no_membership`], confidence: 'high', isDeterministic: true, anomaly: null };
      }
      const mgaIds = [...new Set(memberships.map((m) => m.master_general_agent_id))];
      if (mgaIds.length > 1) {
        return { proposedMgaId: null, sourceChain: [`user:${userEmail}:conflicting_memberships`], confidence: 'low', isDeterministic: false, anomaly: 'conflicting_parent_chain' };
      }
      resolvedCache.set(cacheKey, mgaIds[0]);
      return { proposedMgaId: mgaIds[0], sourceChain: [`user:${userEmail}:MGA:${mgaIds[0]}`], confidence: 'high', isDeterministic: true, anomaly: null };
    }

    if (stepConfig.requiresScopeTypeClassification) {
      // scope_type discriminator entities — classify before stamping
      const scopeType = record.scope_type;
      if (scopeType === 'platform_global') {
        return { proposedMgaId: null, sourceChain: ['scope_type:platform_global'], confidence: 'high', isDeterministic: true, anomaly: null };
      }
      if (scopeType === 'mga_scoped') {
        // Must already have MGA or be quarantined
        return { proposedMgaId: null, sourceChain: ['scope_type:mga_scoped:no_mga_set'], confidence: 'low', isDeterministic: false, anomaly: 'missing_upstream_owner_mapping' };
      }
      // null/unset scope_type — treat as platform_global (safe default per schema)
      return { proposedMgaId: null, sourceChain: ['scope_type:unset:defaulting_to_platform_global'], confidence: 'medium', isDeterministic: false, anomaly: 'missing_scope_type_discriminator' };
    }

    return { proposedMgaId: null, sourceChain: ['no_resolution_method'], confidence: 'low', isDeterministic: false, anomaly: 'orphaned_record' };
  }

  // Case: parent field present — walk parent chain
  const parentId = record[stepConfig.parentField];
  if (!parentId) {
    return { proposedMgaId: null, sourceChain: [`${stepConfig.entity}:${record.id}:missing_parent_field_${stepConfig.parentField}`], confidence: 'low', isDeterministic: false, anomaly: 'orphaned_record' };
  }

  const cacheKey = `${stepConfig.parentEntity}:${parentId}`;
  if (resolvedCache.has(cacheKey)) {
    const cachedMga = resolvedCache.get(cacheKey);
    return {
      proposedMgaId: cachedMga,
      sourceChain: [`${stepConfig.parentEntity}:${parentId}:cached`],
      confidence: 'high',
      isDeterministic: cachedMga !== null,
      anomaly: cachedMga === null ? 'orphaned_record' : null,
    };
  }

  let parentRecord = null;
  try {
    const results = await base44.entities[stepConfig.parentEntity].filter({ id: parentId });
    parentRecord = results?.[0];
  } catch {
    return { proposedMgaId: null, sourceChain: [`${stepConfig.parentEntity}:${parentId}:lookup_failed`], confidence: 'low', isDeterministic: false, anomaly: 'orphaned_record' };
  }

  if (!parentRecord) {
    resolvedCache.set(cacheKey, null);
    return { proposedMgaId: null, sourceChain: [`${stepConfig.parentEntity}:${parentId}:not_found`], confidence: 'low', isDeterministic: false, anomaly: 'orphaned_record' };
  }

  chain.push(`${stepConfig.parentEntity}:${parentId}`);

  if (parentRecord.master_general_agent_id) {
    resolvedCache.set(cacheKey, parentRecord.master_general_agent_id);
    chain.push(`MGA:${parentRecord.master_general_agent_id}`);

    // Cross-check if applicable
    if (stepConfig.crossCheck) {
      const crossCheckId = record[stepConfig.crossCheck.field];
      if (crossCheckId) {
        const crossRecords = await base44.entities[stepConfig.crossCheck.entity].filter({ id: crossCheckId });
        const crossRecord = crossRecords?.[0];
        if (crossRecord?.master_general_agent_id && crossRecord.master_general_agent_id !== parentRecord.master_general_agent_id) {
          return {
            proposedMgaId: null,
            sourceChain: [...chain, `cross_check_mismatch:${stepConfig.crossCheck.entity}:${crossCheckId}:MGA:${crossRecord.master_general_agent_id}`],
            confidence: 'low',
            isDeterministic: false,
            anomaly: 'cross_entity_mga_mismatch',
          };
        }
      }
    }

    return { proposedMgaId: parentRecord.master_general_agent_id, sourceChain: chain, confidence: 'high', isDeterministic: true, anomaly: null };
  }

  // Parent has no MGA — parent is itself not yet resolved (run dry-run in order)
  resolvedCache.set(cacheKey, null);
  return {
    proposedMgaId: null,
    sourceChain: [...chain, 'parent_mga_not_resolved'],
    confidence: 'low',
    isDeterministic: false,
    anomaly: 'missing_upstream_owner_mapping',
  };
}

/**
 * buildRollbackMarker — Record before-state for a single record.
 * DOES NOT write to the operational record.
 *
 * @param {Object} record
 * @param {string} entityType
 * @param {string} dryRunBatchId
 * @returns {Object} rollbackMarker
 */
export function buildRollbackMarker(record, entityType, dryRunBatchId) {
  return {
    record_id: record.id,
    entity_type: entityType,
    before_master_general_agent_id: record.master_general_agent_id || null,
    before_mga_migration_status: record.mga_migration_status || null,
    snapshot_timestamp: new Date().toISOString(),
    dry_run_batch_id: dryRunBatchId,
    _dry_run_only: true,
  };
}

export default {
  BACKFILL_ORDER,
  buildDryRunRecord,
  resolveParentChain,
  buildRollbackMarker,
};