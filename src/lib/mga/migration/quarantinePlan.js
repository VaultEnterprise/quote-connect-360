/**
 * MGA Phase 4A — Quarantine Plan
 * lib/mga/migration/quarantinePlan.js
 *
 * Defines quarantine rules, record builders, and enforcement checks for migration.
 * Phase 4A: planning and dry-run classification only.
 * Phase 4B: actual MGAQuarantineRecord creation occurs on final backfill.
 *
 * PHASE 4A CONSTRAINT: No records are quarantined during Phase 4A.
 *   Quarantine record BUILDERS are defined here; they execute in Phase 4B only.
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 8
 */

// ─── Quarantine condition registry ───────────────────────────────────────────

export const QUARANTINE_CONDITIONS = {
  MasterGroup: {
    condition: 'No approved MGA mapping after business review',
    anomaly_class: 'missing_upstream_owner_mapping',
    blocks_downstream: true,
    blocks_phase4b: true,
    approval_role: 'business_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Business owner approval + new mapping created',
  },
  EmployerGroup: {
    condition: 'No resolvable MasterGroup parent',
    anomaly_class: 'orphaned_record',
    blocks_downstream: true,
    blocks_phase4b: true,
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Parent MasterGroup identified and mapped',
  },
  BenefitCase: {
    condition: 'No resolvable EmployerGroup parent',
    anomaly_class: 'orphaned_record',
    blocks_downstream: true,
    blocks_phase4b: true,
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Parent EmployerGroup identified and resolved',
  },
  CensusImportJob: {
    condition: 'No resolvable BenefitCase parent; or async scope drift',
    anomaly_class: 'orphaned_record',
    blocks_downstream: true,
    blocks_phase4b: true,
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Parent BenefitCase identified and resolved',
  },
  CensusValidationResult: {
    condition: 'Cross-entity MGA mismatch between CensusImportJob and CensusVersion',
    anomaly_class: 'cross_entity_mga_mismatch',
    blocks_downstream: true,
    blocks_phase4b: true,
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Cross-entity consistency verified and resolved',
  },
  TxQuoteCase: {
    condition: 'No resolvable BenefitCase parent',
    anomaly_class: 'orphaned_record',
    blocks_downstream: true,
    blocks_phase4b: true,
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Parent BenefitCase identified; TXQuote flow paused pending resolution',
  },
  EmployeeEnrollment: {
    condition: 'No resolvable EnrollmentWindow parent',
    anomaly_class: 'orphaned_record',
    blocks_downstream: true,
    blocks_phase4b: false,  // does not block Phase 4B if quarantined and links revoked
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Parent resolved; access links reviewed and re-issued if appropriate',
    extra_action: 'revoke_access_links',
  },
  Document: {
    condition: 'Missing both case and employer parent references',
    anomaly_class: 'orphaned_record',
    blocks_downstream: false,
    blocks_phase4b: false,
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Parent identified; file_url access reviewed',
    extra_action: 'revoke_file_url_access',
  },
  UserManual: {
    condition: 'Unclassifiable scope_type (neither platform_global nor mga_scoped deterministic)',
    anomaly_class: 'unclassified_global_candidate',
    blocks_downstream: false,
    blocks_phase4b: false,
    approval_role: 'platform_admin',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Classification determined; scope_type set',
  },
  HelpCoverageSnapshot: {
    condition: 'mga_scoped snapshot without resolved MGA ID',
    anomaly_class: 'missing_upstream_owner_mapping',
    blocks_downstream: false,
    blocks_phase4b: false,
    approval_role: 'platform_admin',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'MGA assigned; or scope_type reclassified as platform_global',
  },
  HelpAITrainingQueue: {
    condition: 'mga_scoped queue item without resolved MGA ID',
    anomaly_class: 'missing_upstream_owner_mapping',
    blocks_downstream: false,
    blocks_phase4b: false,
    approval_role: 'platform_admin',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'MGA assigned; or scope_type reclassified',
  },
  _fake_mga: {
    condition: 'fake_default_mga_detected — placeholder MGA ID assigned to record',
    anomaly_class: 'fake_default_mga_detected',
    blocks_downstream: true,
    blocks_phase4b: true,
    approval_role: 'migration_owner + security',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Real MGA assigned via approved process; security review complete',
  },
  _export_bundle_mixed_scope: {
    condition: 'Export/document bundle contains records from 2+ MGAs',
    anomaly_class: 'export_bundle_mixed_scope',
    blocks_downstream: false,
    blocks_phase4b: true,
    approval_role: 'migration_owner',
    audit_required: true,
    visibility: 'platform_admin_only',
    release_requirement: 'Bundle regenerated from single-MGA source',
  },
};

// ─── Quarantine record builder (executes in Phase 4B, defined here) ──────────

/**
 * buildQuarantineRecordSpec — Build the spec for a MGAQuarantineRecord.
 * This spec describes what WILL be created in Phase 4B when quarantine is executed.
 * Phase 4A only produces specs, not actual records.
 *
 * @param {Object} options
 * @returns {Object} quarantineRecordSpec
 */
export function buildQuarantineRecordSpec({
  entityType,
  entityId,
  anomalyClass,
  description,
  proposedMgaId,
  conflictDescription,
  migrationBatchId,
  requiresBusinessApproval,
  blocksDownstream,
  extraActions,
}) {
  const conditions = QUARANTINE_CONDITIONS[entityType] || QUARANTINE_CONDITIONS._fake_mga;

  return {
    // Fields for MGAQuarantineRecord entity
    entity_type: entityType,
    entity_id: entityId,
    anomaly_class: anomalyClass || conditions.anomaly_class,
    quarantine_reason: description || conditions.condition,
    proposed_mga_id: proposedMgaId || null,
    conflict_description: conflictDescription || null,
    approval_role_required: conditions.approval_role,
    release_requirement: conditions.release_requirement,
    blocks_downstream: blocksDownstream !== undefined ? blocksDownstream : conditions.blocks_downstream,
    blocks_phase4b: conditions.blocks_phase4b,
    extra_actions: extraActions || [],
    migration_batch_id: migrationBatchId,
    requires_business_approval: requiresBusinessApproval === true,
    status: 'pending_quarantine',  // Will become 'quarantined' when Phase 4B executes
    // Enforcement fields
    must_not_be_user_visible: true,
    must_not_appear_in_mga_dashboard: true,
    must_not_be_included_in_reports_search_exports: true,
    // Phase 4A metadata
    _phase4a_spec_only: true,
    _executes_in_phase4b: true,
  };
}

// ─── Enforcement rules ────────────────────────────────────────────────────────

export const QUARANTINE_ENFORCEMENT_RULES = [
  { rule: 'Quarantined records must not become user-visible', enforcement: 'scopeResolver returns QUARANTINE_DENIED for non-admin actors', verified: true },
  { rule: 'Quarantined records must not appear in MGA dashboards', enforcement: 'Service layer filters mga_migration_status != quarantined', verified: true },
  { rule: 'Quarantined records excluded from reports/search/exports/notifications', enforcement: 'Phase 3 services include quarantine filter', verified: true },
  { rule: 'No record may be force-assigned to avoid quarantine', enforcement: 'dry-run engine enforces: proposed_mga_id must be real MGA ID or null', verified: true },
  { rule: 'Quarantine release requires explicit approval', enforcement: 'MGAQuarantineRecord.release_approval_status must be approved', verified: true },
  { rule: 'Quarantine release must be audited', enforcement: 'createGovernanceAuditEvent() called on every release', verified: true },
];

export default {
  QUARANTINE_CONDITIONS,
  buildQuarantineRecordSpec,
  QUARANTINE_ENFORCEMENT_RULES,
};