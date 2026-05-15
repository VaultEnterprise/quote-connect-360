/**
 * MGA Phase 4A — Feature Flag and Cutover Plan
 * lib/mga/migration/featureFlagPlan.js
 *
 * Documents the migration state machine and feature flag coordination.
 * All flags are currently in pre_migration state (OFF).
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 12
 */

export const MIGRATION_STATES = {
  pre_migration: {
    state: 'pre_migration',
    description: 'Current state. All MGA features disabled. All entities fail-closed.',
    flags: {
      'mga.enabled': false,
      'mga.scopedServices.enabled': false,
      'mga.ui.visible': false,
      'mga.dryRun.enabled': false,
      'mga.migration.backfillInProgress': false,
      'mga.migration.readiness': 'not_started',
      'mga.pilotAccess': false,
      'mga.emergencyDisable': false,
    },
    isCurrent: true,
  },
  dry_run: {
    state: 'dry_run',
    description: 'Phase 4A. Dry-run engine runs non-destructively. No user visibility.',
    flags: {
      'mga.enabled': false,
      'mga.scopedServices.enabled': false,
      'mga.ui.visible': false,
      'mga.dryRun.enabled': true,
      'mga.migration.backfillInProgress': false,
      'mga.migration.readiness': 'dry_run',
      'mga.pilotAccess': false,
      'mga.emergencyDisable': false,
    },
    isCurrent: false,
  },
  backfill_in_progress: {
    state: 'backfill_in_progress',
    description: 'Phase 4B. Indexes created. Backfill running. All scoped services still disabled for users.',
    flags: {
      'mga.enabled': false,
      'mga.scopedServices.enabled': false,
      'mga.ui.visible': false,
      'mga.dryRun.enabled': false,
      'mga.migration.backfillInProgress': true,
      'mga.migration.readiness': 'backfill_in_progress',
      'mga.pilotAccess': false,
      'mga.emergencyDisable': false,
    },
    isCurrent: false,
  },
  post_backfill_validation: {
    state: 'post_backfill_validation',
    description: 'Phase 4B validation. Reconciliation report reviewed. Zero P0 anomalies confirmed. Services still not user-visible.',
    flags: {
      'mga.enabled': false,
      'mga.scopedServices.enabled': false,
      'mga.ui.visible': false,
      'mga.dryRun.enabled': false,
      'mga.migration.backfillInProgress': false,
      'mga.migration.readiness': 'validating',
      'mga.pilotAccess': false,
      'mga.emergencyDisable': false,
    },
    isCurrent: false,
  },
  mga_services_available: {
    state: 'mga_services_available',
    description: 'Phase 5 internal. Scoped services wired but not user-visible. Internal QA only.',
    flags: {
      'mga.enabled': true,
      'mga.scopedServices.enabled': true,
      'mga.ui.visible': false,
      'mga.dryRun.enabled': false,
      'mga.migration.backfillInProgress': false,
      'mga.migration.readiness': 'validated',
      'mga.pilotAccess': false,
      'mga.emergencyDisable': false,
    },
    isCurrent: false,
  },
  ui_pilot: {
    state: 'ui_pilot',
    description: 'Phase 5/6. Pilot cohort access only.',
    flags: {
      'mga.enabled': true,
      'mga.scopedServices.enabled': true,
      'mga.ui.visible': true,
      'mga.dryRun.enabled': false,
      'mga.migration.backfillInProgress': false,
      'mga.migration.readiness': 'validated',
      'mga.pilotAccess': ['named_pilot_users'],
      'mga.emergencyDisable': false,
    },
    isCurrent: false,
  },
  full_rollout: {
    state: 'full_rollout',
    description: 'Phase 6+. Full production.',
    flags: {
      'mga.enabled': true,
      'mga.scopedServices.enabled': true,
      'mga.ui.visible': true,
      'mga.dryRun.enabled': false,
      'mga.migration.backfillInProgress': false,
      'mga.migration.readiness': 'complete',
      'mga.pilotAccess': false,
      'mga.emergencyDisable': false,
    },
    isCurrent: false,
  },
  rollback: {
    state: 'rollback',
    description: 'Emergency. All MGA surfaces disabled immediately.',
    flags: {
      'mga.enabled': false,
      'mga.scopedServices.enabled': false,
      'mga.ui.visible': false,
      'mga.dryRun.enabled': false,
      'mga.migration.backfillInProgress': false,
      'mga.migration.readiness': 'rollback',
      'mga.pilotAccess': false,
      'mga.emergencyDisable': true,
    },
    isCurrent: false,
  },
};

export const CUTOVER_RULES = [
  { rule: 'Feature flags must prevent partial rollout leakage', enforcement: 'All 6 core flags must be coordinated; no single flag covers partial scope' },
  { rule: 'Backfilled records must not become user-visible through MGA UI until Phase 5/6 approval', enforcement: 'mga.ui.visible remains false until explicit Phase 5 approval' },
  { rule: 'Services remain isolated from live UI until Phase 5/6 approval', enforcement: 'mga.scopedServices.enabled remains false for live UI until Phase 5 wiring approval' },
  { rule: 'Emergency disablement must revert all MGA surfaces within 60 seconds', enforcement: 'mga.emergencyDisable triggers immediate flag cascade' },
];

export const CURRENT_STATE = 'pre_migration';

export default { MIGRATION_STATES, CUTOVER_RULES, CURRENT_STATE };