/**
 * MGA Phase 4A — Rollback and Containment Plan
 * lib/mga/migration/rollbackPlan.js
 *
 * Defines rollback triggers, owners, steps, and containment procedures for Phase 4B.
 * Phase 4A: planning only. Rollback execution occurs only if Phase 4B has run.
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 11
 */

export const ROLLBACK_TRIGGERS = [
  { trigger: 'cross_scope_data_leakage', condition: 'Any record visible to wrong MGA', severity: 'P0', initiator: 'automated_monitoring' },
  { trigger: 'rbac_matrix_failure', condition: 'User gains access outside their MGA', severity: 'P0', initiator: 'automated_monitoring' },
  { trigger: 'migration_reconciliation_failure', condition: 'Record count mismatch after backfill', severity: 'P0', initiator: 'migration_owner' },
  { trigger: 'fake_default_mga_post_backfill', condition: 'fake_default_mga_detected anomaly post Phase 4B', severity: 'P0', initiator: 'automated' },
  { trigger: 'document_link_leakage', condition: 'file_url or deep link accessible cross-MGA', severity: 'P0', initiator: 'automated_monitoring' },
  { trigger: 'txquote_duplicate_or_external_leak', condition: 'External transmit with wrong or mixed scope', severity: 'P0', initiator: 'txquote_owner' },
  { trigger: 'audit_gap', condition: 'Material operation with no audit record', severity: 'P1', initiator: 'audit_owner' },
  { trigger: 'performance_degradation', condition: 'Scoped queries exceed P95 baseline', severity: 'P1', initiator: 'platform_monitoring' },
  { trigger: 'business_approval_revoked', condition: 'MasterGroup mapping approval withdrawn post-backfill', severity: 'P1', initiator: 'business_owner' },
];

export const ROLLBACK_OWNERS = [
  { role: 'migration_owner', responsibility: 'Overall rollback decision; coordinates all teams' },
  { role: 'domain_owner', responsibility: 'Domain-specific rollback execution (cases/census/quotes/enrollment/docs)' },
  { role: 'security_scope_reviewer', responsibility: 'Cross-MGA leakage containment' },
  { role: 'txquote_owner', responsibility: 'TXQuote-specific rollback and external notification' },
  { role: 'compliance_officer', responsibility: 'Document/PII rollback; regulatory notification if required' },
  { role: 'platform_admin', responsibility: 'Flag/feature disablement; emergency off switch' },
  { role: 'communications_owner', responsibility: 'User notification if access disrupted' },
];

export const ROLLBACK_STEPS = [
  { step: 1, action: 'Disable feature flags', detail: 'Set mga.enabled = OFF and mga.scopedServices.enabled = OFF → routes to disabled-safe state', timing: 'Immediate' },
  { step: 2, action: 'Revoke generated links', detail: 'Revoke all generated signed links and export bundle access', timing: 'Immediate' },
  { step: 3, action: 'Quarantine expansion', detail: 'Set mga_migration_status = quarantined on all backfilled records via batch revert', timing: 'Within 15 minutes' },
  { step: 4, action: 'Batch rollback by batch_id', detail: 'Use mga_migration_batch_id to identify all records in failed batch; revert master_general_agent_id to before-state snapshot value', timing: 'Within 30 minutes' },
  { step: 5, action: 'Record-level rollback', detail: 'Use per-record rollback markers to revert individual fields', timing: 'Within 1 hour' },
  { step: 6, action: 'TXQuote containment', detail: 'Pause all outbound TXQuote transmit/retry jobs; notify TXQuote owner', timing: 'Immediate' },
  { step: 7, action: 'Document/file access revoke', detail: 'Revoke file_url access tokens for documents affected by rollback scope', timing: 'Within 1 hour' },
  { step: 8, action: 'Audit rollback event', detail: 'Record rollback as governance audit event with full before/after state', timing: 'During rollback' },
  { step: 9, action: 'Monitoring hold', detail: 'Hold system in rollback state for minimum 24-hour monitoring period', timing: '24 hours minimum' },
  { step: 10, action: 'Escalation', detail: 'If rollback does not contain leakage within 1 hour → escalate to executive/platform admin for production freeze', timing: '1 hour threshold' },
];

export const ROLLBACK_RULES = {
  batch_rollback_method: 'Filter all records by mga_migration_batch_id = <failed_batch_id>; revert master_general_agent_id field to before-state snapshot value',
  record_level_rollback: 'Per-record rollback markers (before-state snapshots) stored before any field write; revert by record_id',
  does_not_delete_records: true,
  migration_batch_id_behavior: 'Every backfilled record stores mga_migration_batch_id; rollback by batch is atomic',
  quarantine_on_rollback: 'Quarantine records created during failed batch are set to mga_migration_status = quarantined',
  snapshot_requirement: 'Every record targeted for backfill must have a before-state snapshot BEFORE any field is written; no snapshot = no backfill',
  monitoring_period_hours: 48,
  phase4b_pre_approval_required: true,
};

export const CONTAINMENT_PLAN = {
  pre_migration_state: { mga_enabled: false, mga_ui_visible: false, mga_services_enabled: false },
  rollback_state: { mga_enabled: false, mga_ui_visible: false, mga_services_enabled: false, mga_emergency_disable: true },
  communication_requirements: [
    'Notify internal admins/support first',
    'Notify affected pilot users if access disabled',
    'Document incident and remediation plan',
  ],
  escalation_path: 'domain_owner → security_scope_reviewer → migration_owner → executive/platform_admin',
};

export default {
  ROLLBACK_TRIGGERS,
  ROLLBACK_OWNERS,
  ROLLBACK_STEPS,
  ROLLBACK_RULES,
  CONTAINMENT_PLAN,
};