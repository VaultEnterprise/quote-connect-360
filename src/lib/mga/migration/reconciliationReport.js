/**
 * MGA Phase 4A — Reconciliation Report Builder
 * lib/mga/migration/reconciliationReport.js
 *
 * Builds the canonical dry-run reconciliation report from dry-run output records
 * and anomaly detection results. Report is documentation/planning output only.
 *
 * PHASE 4A CONSTRAINT: Report generation only. No record mutations.
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 9
 */

// ─── Per-entity acceptance thresholds (from Section 10 of Phase 4A report) ───

export const ACCEPTANCE_THRESHOLDS = {
  MasterGroup: { minResolvedPct: 100, txquoteRequired: false, description: '100% — core mapping anchor' },
  Tenant: { minResolvedPct: 100, txquoteRequired: false, description: '100% — propagation only' },
  EmployerGroup: { minResolvedPct: 99, txquoteRequired: false, description: '≥99% — remainder quarantined' },
  BenefitCase: { minResolvedPct: 99, txquoteRequired: false, description: '≥99% — remainder quarantined' },
  CensusVersion: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  CensusMember: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  CensusImportJob: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  CensusImportAuditEvent: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  CensusValidationResult: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  QuoteScenario: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  ScenarioPlan: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  ContributionModel: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  QuoteTransmission: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%; external log preserved' },
  PolicyMatchResult: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  Proposal: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%; PDF artifacts reviewed' },
  TxQuoteCase: { minResolvedPct: 100, txquoteRequired: true, description: '100% — external transmission' },
  EnrollmentWindow: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  EmployeeEnrollment: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%; links reviewed' },
  EnrollmentMember: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  Document: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%; file_url reviewed' },
  RenewalCycle: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  CaseTask: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  ExceptionItem: { minResolvedPct: 99, txquoteRequired: false, description: '≥99%' },
  ActivityLog: { minResolvedPct: 95, txquoteRequired: false, description: '≥95%; remainder classified as platform' },
  HelpSearchLog: { minResolvedPct: 100, txquoteRequired: false, description: '100% classified (resolved or unauthenticated)' },
  HelpAIQuestionLog: { minResolvedPct: 100, txquoteRequired: false, description: '100% classified' },
  HelpCoverageSnapshot: { minResolvedPct: 100, txquoteRequired: false, description: '100% classified' },
  HelpAITrainingQueue: { minResolvedPct: 100, txquoteRequired: false, description: '100% classified' },
  UserManual: { minResolvedPct: 100, txquoteRequired: false, description: '100% classified' },
  HelpAuditLog: { minResolvedPct: 95, txquoteRequired: false, description: '≥95% classified' },
  CaseFilterPreset: { minResolvedPct: 100, txquoteRequired: false, description: '100% classified' },
  ViewPreset: { minResolvedPct: 100, txquoteRequired: false, description: '100% classified' },
};

// ─── Report builder ───────────────────────────────────────────────────────────

/**
 * buildEntitySection — Build the entity-level section of the reconciliation report.
 *
 * @param {string} entityType
 * @param {Object[]} dryRunRecords — records for this entity
 * @param {Object[]} anomalyRecords — anomalies for this entity
 * @returns {Object} entitySection
 */
export function buildEntitySection(entityType, dryRunRecords, anomalyRecords) {
  const total = dryRunRecords.length;
  const alreadyCompliant = dryRunRecords.filter((r) => r.current_mga_id && r.is_deterministic).length;
  const deterministicMapping = dryRunRecords.filter((r) => r.is_deterministic && !r.anomaly_detected).length;
  const businessApprovalRequired = dryRunRecords.filter((r) => r.business_approval_required).length;
  const quarantineRecommended = dryRunRecords.filter((r) => r.quarantine_recommended).length;
  const p0Anomalies = anomalyRecords.filter((a) => a.severity === 'P0').length;
  const p1Anomalies = anomalyRecords.filter((a) => a.severity === 'P1').length;
  const p2Anomalies = anomalyRecords.filter((a) => a.severity === 'P2').length;

  const resolvedCount = deterministicMapping + alreadyCompliant;
  const resolvedPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 100;

  const threshold = ACCEPTANCE_THRESHOLDS[entityType];
  const thresholdMet = threshold ? resolvedPct >= threshold.minResolvedPct && p0Anomalies === 0 : true;

  return {
    entity_type: entityType,
    total_records: total,
    already_compliant: alreadyCompliant,
    deterministic_mapping: deterministicMapping,
    business_approval_required: businessApprovalRequired,
    quarantine_recommended: quarantineRecommended,
    p0_anomalies: p0Anomalies,
    p1_anomalies: p1Anomalies,
    p2_anomalies: p2Anomalies,
    resolved_pct: resolvedPct,
    acceptance_threshold: threshold?.minResolvedPct ?? null,
    acceptance_threshold_description: threshold?.description ?? 'not defined',
    threshold_met: thresholdMet,
    pass_fail: thresholdMet ? 'PASS' : 'FAIL',
  };
}

/**
 * buildReconciliationReport — Build the full reconciliation report from dry-run output.
 *
 * @param {Object} options
 * @param {string} options.dryRunBatchId
 * @param {string|null} options.mgaFilter — MGA ID filter or null for ALL
 * @param {Object[]} options.entitySections — from buildEntitySection per entity
 * @param {Object} options.masterGroupMappingStatus
 * @param {Object} options.rollbackReadiness
 * @param {Object} options.anomalySummary — from buildAnomalySummary
 * @returns {Object} report
 */
export function buildReconciliationReport({
  dryRunBatchId,
  mgaFilter,
  entitySections,
  masterGroupMappingStatus,
  rollbackReadiness,
  anomalySummary,
}) {
  const totalRecords = entitySections.reduce((s, e) => s + e.total_records, 0);
  const alreadyCompliant = entitySections.reduce((s, e) => s + e.already_compliant, 0);
  const deterministicMapping = entitySections.reduce((s, e) => s + e.deterministic_mapping, 0);
  const businessApprovalRequired = entitySections.reduce((s, e) => s + e.business_approval_required, 0);
  const quarantineRecommended = entitySections.reduce((s, e) => s + e.quarantine_recommended, 0);

  const p0Total = anomalySummary?.P0 || 0;
  const p1Total = anomalySummary?.P1 || 0;
  const p2Total = anomalySummary?.P2 || 0;

  const allEntitiesPass = entitySections.every((e) => e.pass_fail === 'PASS');
  const overallStatus = (p0Total === 0 && allEntitiesPass) ? 'PASS' : 'FAIL';
  const phase4BReady = overallStatus === 'PASS' && rollbackReadiness?.ready === true;

  return {
    report_type: 'MGA_MIGRATION_DRY_RUN_RECONCILIATION',
    generated_at: new Date().toISOString(),
    dry_run_batch_id: dryRunBatchId,
    mga_filter: mgaFilter || 'ALL',
    summary: {
      total_entity_types_scanned: entitySections.length,
      total_records_scanned: totalRecords,
      records_already_compliant: alreadyCompliant,
      records_with_deterministic_mapping: deterministicMapping,
      records_requiring_business_approval: businessApprovalRequired,
      records_quarantine_recommended: quarantineRecommended,
      p0_anomalies_total: p0Total,
      p1_anomalies_total: p1Total,
      p2_anomalies_total: p2Total,
      overall_dry_run_status: overallStatus,
      phase_4b_readiness: phase4BReady ? 'READY' : 'BLOCKED',
    },
    entity_breakdown: entitySections,
    mastergroup_mapping_status: masterGroupMappingStatus,
    rollback_readiness: rollbackReadiness,
    anomaly_summary: anomalySummary,
    acceptance_thresholds: ACCEPTANCE_THRESHOLDS,
    _dry_run_only: true,
    _must_not_authorize_phase4b_automatically: true,
    _phase4b_requires_explicit_human_approval: true,
  };
}

export default {
  ACCEPTANCE_THRESHOLDS,
  buildEntitySection,
  buildReconciliationReport,
};