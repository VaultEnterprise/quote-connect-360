/**
 * MGA Phase 4A — Anomaly Detector
 * lib/mga/migration/anomalyDetector.js
 *
 * Non-destructive anomaly detection for migration readiness.
 * Detects anomalies in existing records WITHOUT modifying them.
 *
 * PHASE 4A CONSTRAINT: Detection only. No record mutations.
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 7
 */

// ─── Anomaly class catalog ────────────────────────────────────────────────────

export const ANOMALY_CATALOG = {
  orphaned_record: {
    class: 'orphaned_record',
    description: 'Record has no resolvable parent entity',
    severity: 'P0',
    blocks_final_backfill: true,
  },
  conflicting_parent_chain: {
    class: 'conflicting_parent_chain',
    description: "Record's parent chain leads to 2+ different MGAs",
    severity: 'P0',
    blocks_final_backfill: true,
  },
  missing_master_group_id: {
    class: 'missing_master_group_id',
    description: 'Scoped record has null master_group_id where required',
    severity: 'P0',
    blocks_final_backfill: true,
  },
  missing_upstream_owner_mapping: {
    class: 'missing_upstream_owner_mapping',
    description: 'MasterGroup has no approved MGA mapping',
    severity: 'P0',
    blocks_final_backfill: true,
  },
  invalid_duplicate_lineage: {
    class: 'invalid_duplicate_lineage',
    description: 'Two records claim the same unique parent slot',
    severity: 'P0',
    blocks_final_backfill: true,
  },
  cross_entity_mga_mismatch: {
    class: 'cross_entity_mga_mismatch',
    description: 'Two related entities have different MGA IDs (e.g., CensusImportJob vs CensusVersion)',
    severity: 'P0',
    blocks_final_backfill: true,
  },
  export_bundle_mixed_scope: {
    class: 'export_bundle_mixed_scope',
    description: 'An export/document bundle references records from 2+ MGAs',
    severity: 'P0',
    blocks_final_backfill: true,
  },
  fake_default_mga_detected: {
    class: 'fake_default_mga_detected',
    description: 'master_general_agent_id is a placeholder/default value, not a real MGA ID',
    severity: 'P0',
    blocks_final_backfill: true,
  },
  stale_mga_value: {
    class: 'stale_mga_value',
    description: 'Record has MGA set but it does not match recomputed parent chain',
    severity: 'P1',
    blocks_final_backfill: false,
  },
  missing_scope_type_discriminator: {
    class: 'missing_scope_type_discriminator',
    description: 'Entity with scope_type field has null or invalid value',
    severity: 'P1',
    blocks_final_backfill: false,
  },
  unclassified_global_candidate: {
    class: 'unclassified_global_candidate',
    description: 'Record may be global-intentional but is not explicitly classified',
    severity: 'P1',
    blocks_final_backfill: false,
  },
  multiple_mga_signal_candidates: {
    class: 'multiple_mga_signal_candidates',
    description: 'Record has indirect signals pointing to 2+ MGAs; cannot auto-resolve',
    severity: 'P1',
    blocks_final_backfill: false,
  },
  notification_stale_link: {
    class: 'notification_stale_link',
    description: 'Email/notification deep link points to a quarantined or moved record',
    severity: 'P1',
    blocks_final_backfill: false,
  },
  webhook_unresolved_ownership: {
    class: 'webhook_unresolved_ownership',
    description: 'Webhook event ownership cannot be resolved to a single MGA',
    severity: 'P1',
    blocks_final_backfill: false,
  },
  audit_log_missing_context: {
    class: 'audit_log_missing_context',
    description: 'Audit/activity record references a case_id or entity_id that no longer resolves',
    severity: 'P2',
    blocks_final_backfill: false,
  },
  help_activity_operational_unscoped: {
    class: 'help_activity_operational_unscoped',
    description: 'Help activity record has operational content but null MGA',
    severity: 'P1',
    blocks_final_backfill: false,
  },
  legacy_src_entities_path_risk: {
    class: 'legacy_src_entities_path_risk',
    description: 'Record may have been created from src/entities/ schema; no field-level impact',
    severity: 'P2',
    blocks_final_backfill: false,
  },
};

// ─── Anomaly record builder ───────────────────────────────────────────────────

/**
 * buildAnomalyRecord — Create a structured anomaly detection result.
 * This record is NOT written to the source entity; it is written to the
 * migration reporting output only.
 *
 * @param {Object} options
 * @returns {Object} anomalyRecord
 */
export function buildAnomalyRecord({
  entityType,
  recordId,
  anomalyClass,
  description,
  relatedEntityType,
  relatedEntityId,
  detectedFields,
  conflictDescription,
  recommendedAction,
  requiresBusinessApproval,
  dryRunBatchId,
}) {
  const catalogEntry = ANOMALY_CATALOG[anomalyClass] || { severity: 'P2', blocks_final_backfill: false };

  return {
    entity_type: entityType,
    record_id: recordId,
    anomaly_class: anomalyClass,
    anomaly_description: description || catalogEntry.description,
    severity: catalogEntry.severity,
    blocks_final_backfill: catalogEntry.blocks_final_backfill,
    related_entity_type: relatedEntityType || null,
    related_entity_id: relatedEntityId || null,
    detected_fields: detectedFields || [],
    conflict_description: conflictDescription || null,
    recommended_action: recommendedAction || (catalogEntry.blocks_final_backfill ? 'quarantine_and_resolve' : 'review_and_classify'),
    requires_business_approval: requiresBusinessApproval === true,
    dry_run_batch_id: dryRunBatchId,
    detected_at: new Date().toISOString(),
    resolution_status: 'unresolved',
    _dry_run_only: true,
  };
}

// ─── Anomaly checks ───────────────────────────────────────────────────────────

/**
 * checkFakeMgaId — Verify a proposed MGA ID is a real MasterGeneralAgent ID.
 * Returns anomaly record if fake/placeholder detected.
 *
 * @param {string} proposedMgaId
 * @param {string[]} validMgaIds — list of real MasterGeneralAgent IDs
 * @param {string} entityType
 * @param {string} recordId
 * @param {string} dryRunBatchId
 * @returns {Object|null} anomalyRecord or null
 */
export function checkFakeMgaId(proposedMgaId, validMgaIds, entityType, recordId, dryRunBatchId) {
  if (proposedMgaId === null) return null; // null is acceptable (quarantine intent)
  if (!validMgaIds.includes(proposedMgaId)) {
    return buildAnomalyRecord({
      entityType,
      recordId,
      anomalyClass: 'fake_default_mga_detected',
      description: `proposed_mga_id '${proposedMgaId}' is not a valid MasterGeneralAgent.id`,
      detectedFields: ['master_general_agent_id'],
      recommendedAction: 'block_backfill_for_this_record',
      dryRunBatchId,
    });
  }
  return null;
}

/**
 * checkStaleMgaValue — Verify that a pre-existing MGA value matches the recomputed parent chain.
 *
 * @param {string} existingMgaId — current record value
 * @param {string} proposedMgaId — value computed by dry-run
 * @param {string} entityType
 * @param {string} recordId
 * @param {string} dryRunBatchId
 * @returns {Object|null} anomalyRecord or null
 */
export function checkStaleMgaValue(existingMgaId, proposedMgaId, entityType, recordId, dryRunBatchId) {
  if (!existingMgaId || !proposedMgaId) return null;
  if (existingMgaId !== proposedMgaId) {
    return buildAnomalyRecord({
      entityType,
      recordId,
      anomalyClass: 'stale_mga_value',
      description: `Existing MGA '${existingMgaId}' does not match recomputed parent chain MGA '${proposedMgaId}'`,
      detectedFields: ['master_general_agent_id'],
      conflictDescription: `stored: ${existingMgaId} vs recomputed: ${proposedMgaId}`,
      recommendedAction: 'review_and_recompute',
      dryRunBatchId,
    });
  }
  return null;
}

/**
 * checkScopeTypeDiscriminator — Verify scope_type field is set correctly.
 *
 * @param {Object} record
 * @param {string} entityType
 * @param {string} dryRunBatchId
 * @returns {Object|null} anomalyRecord or null
 */
export function checkScopeTypeDiscriminator(record, entityType, dryRunBatchId) {
  const VALID_SCOPE_TYPES = ['platform_global', 'mga_scoped'];
  const SCOPE_TYPE_ENTITIES = ['UserManual', 'HelpCoverageSnapshot', 'HelpAITrainingQueue'];

  if (!SCOPE_TYPE_ENTITIES.includes(entityType)) return null;

  if (!record.scope_type || !VALID_SCOPE_TYPES.includes(record.scope_type)) {
    return buildAnomalyRecord({
      entityType,
      recordId: record.id,
      anomalyClass: 'missing_scope_type_discriminator',
      description: `scope_type is '${record.scope_type}' — must be 'platform_global' or 'mga_scoped'`,
      detectedFields: ['scope_type'],
      recommendedAction: 'classify_scope_type',
      dryRunBatchId,
    });
  }

  // mga_scoped records must have master_general_agent_id after migration
  if (record.scope_type === 'mga_scoped' && !record.master_general_agent_id) {
    return buildAnomalyRecord({
      entityType,
      recordId: record.id,
      anomalyClass: 'missing_upstream_owner_mapping',
      description: `mga_scoped record missing master_general_agent_id`,
      detectedFields: ['scope_type', 'master_general_agent_id'],
      recommendedAction: 'set_mga_id_or_quarantine',
      dryRunBatchId,
    });
  }

  return null;
}

// ─── Anomaly summary builder ──────────────────────────────────────────────────

/**
 * buildAnomalySummary — Aggregate anomaly records into counts by severity and class.
 *
 * @param {Object[]} anomalyRecords
 * @returns {Object} summary
 */
export function buildAnomalySummary(anomalyRecords) {
  const summary = { P0: 0, P1: 0, P2: 0, total: anomalyRecords.length, byClass: {}, blocksPhase4B: false };
  for (const rec of anomalyRecords) {
    summary[rec.severity] = (summary[rec.severity] || 0) + 1;
    summary.byClass[rec.anomaly_class] = (summary.byClass[rec.anomaly_class] || 0) + 1;
    if (rec.blocks_final_backfill) summary.blocksPhase4B = true;
  }
  return summary;
}

export default {
  ANOMALY_CATALOG,
  buildAnomalyRecord,
  buildAnomalySummary,
  checkFakeMgaId,
  checkStaleMgaValue,
  checkScopeTypeDiscriminator,
};