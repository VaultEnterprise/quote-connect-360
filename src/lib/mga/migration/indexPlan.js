/**
 * MGA Phase 4A — Index Preparation Plan
 * lib/mga/migration/indexPlan.js
 *
 * Documents all 30 required migration/backfill indexes.
 * All indexes are deferred to Phase 4B as prerequisites before final backfill.
 * No indexes are created during Phase 4A.
 *
 * RULE: No production backfill may run if any required index is missing.
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 5
 */

export const REQUIRED_INDEXES = [
  // ─── Phase 1 deferred indexes (16) ───────────────────────────────────────────
  { id: 1, entity: 'MasterGeneralAgent', fields: ['code', 'status'], purpose: 'Unique code enforcement; status filter', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Full-table scan on code lookup', phaseRequired: 'Phase 4B prereq' },
  { id: 2, entity: 'MasterGroup', fields: ['master_general_agent_id', 'status'], purpose: 'MGA-scoped group listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Cross-MGA scan risk during backfill', phaseRequired: 'Phase 4B prereq' },
  { id: 3, entity: 'EmployerGroup', fields: ['master_general_agent_id', 'status'], purpose: 'MGA-scoped employer listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Cross-MGA scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 4, entity: 'BenefitCase', fields: ['master_general_agent_id', 'stage', 'status'], purpose: 'MGA-scoped case pipeline', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Performance degradation; cross-MGA scan', phaseRequired: 'Phase 4B prereq' },
  { id: 5, entity: 'CensusVersion', fields: ['master_general_agent_id', 'case_id', 'status'], purpose: 'MGA-scoped census listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 6, entity: 'CensusMember', fields: ['master_general_agent_id', 'case_id'], purpose: 'MGA-scoped PII member listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'PII scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 7, entity: 'QuoteScenario', fields: ['master_general_agent_id', 'case_id', 'status'], purpose: 'MGA-scoped quote listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 8, entity: 'EnrollmentWindow', fields: ['master_general_agent_id', 'case_id', 'status'], purpose: 'MGA-scoped enrollment listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 9, entity: 'EmployeeEnrollment', fields: ['master_general_agent_id', 'case_id', 'status'], purpose: 'MGA-scoped PII employee listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'PII scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 10, entity: 'Document', fields: ['master_general_agent_id', 'case_id'], purpose: 'MGA-scoped document listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'File access scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 11, entity: 'CaseTask', fields: ['master_general_agent_id', 'case_id', 'status'], purpose: 'MGA-scoped task listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 12, entity: 'ExceptionItem', fields: ['master_general_agent_id', 'case_id', 'severity'], purpose: 'MGA-scoped exception triage', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 13, entity: 'ActivityLog', fields: ['master_general_agent_id', 'case_id'], purpose: 'MGA-scoped audit trail', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Audit scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 14, entity: 'RenewalCycle', fields: ['master_general_agent_id', 'case_id'], purpose: 'MGA-scoped renewal listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 15, entity: 'Proposal', fields: ['master_general_agent_id', 'case_id', 'status'], purpose: 'MGA-scoped proposal listing', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Artifact scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 16, entity: 'MGAMigrationBatch', fields: ['master_general_agent_id', 'status'], purpose: 'Migration batch tracking', phase: 'Phase 1 deferred', createdNow: false, riskIfMissing: 'Migration tracking failure', phaseRequired: 'Phase 4B prereq' },
  // ─── Mini-pass deferred indexes (10) ─────────────────────────────────────────
  { id: 17, entity: 'Tenant', fields: ['master_general_agent_id', 'master_group_id', 'status'], purpose: 'Tenant scoping via MasterGroup', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Tenant scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 18, entity: 'CensusImportJob', fields: ['master_general_agent_id', 'case_id', 'status'], purpose: 'Scoped job tracking', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Job scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 19, entity: 'CensusImportAuditEvent', fields: ['master_general_agent_id', 'census_import_job_id'], purpose: 'Scoped audit event lookup', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Audit scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 20, entity: 'CensusValidationResult', fields: ['master_general_agent_id', 'census_import_id', 'status'], purpose: 'Scoped validation results', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Validation scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 21, entity: 'UserManual', fields: ['master_general_agent_id', 'scope_type'], purpose: 'Discriminated manual listing', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Scope bleed risk', phaseRequired: 'Phase 4B prereq' },
  { id: 22, entity: 'HelpSearchLog', fields: ['master_general_agent_id', 'user_email', 'created_date'], purpose: 'Scoped search activity', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Activity scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 23, entity: 'HelpAIQuestionLog', fields: ['master_general_agent_id', 'user_email', 'created_date'], purpose: 'Scoped question activity', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'PII scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 24, entity: 'HelpCoverageSnapshot', fields: ['master_general_agent_id', 'scope_type', 'snapshot_date'], purpose: 'Discriminated snapshot listing', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Scope bleed risk', phaseRequired: 'Phase 4B prereq' },
  { id: 25, entity: 'HelpAuditLog', fields: ['master_general_agent_id', 'event_type', 'created_date'], purpose: 'Scoped help audit', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Audit scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 26, entity: 'HelpAITrainingQueue', fields: ['master_general_agent_id', 'scope_type', 'queue_status'], purpose: 'Discriminated queue processing', phase: 'Mini-pass deferred', createdNow: false, riskIfMissing: 'Queue contamination risk', phaseRequired: 'Phase 4B prereq' },
  // ─── Phase 4A additional indexes (4) ─────────────────────────────────────────
  { id: 27, entity: 'MasterGeneralAgentUser', fields: ['master_general_agent_id', 'user_email', 'status'], purpose: 'Membership lookup — used by scopeResolver at every gate call', phase: 'Phase 4A identified', createdNow: false, riskIfMissing: 'CRITICAL — scopeResolver full-table scan on every protected request', phaseRequired: 'Phase 4B prereq (highest priority)' },
  { id: 28, entity: 'MGAQuarantineRecord', fields: ['master_general_agent_id', 'entity_type', 'status'], purpose: 'Quarantine triage and release', phase: 'Phase 4A identified', createdNow: false, riskIfMissing: 'Quarantine tracking scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 29, entity: 'TxQuoteCase', fields: ['master_general_agent_id', 'case_id'], purpose: 'TXQuote scoping', phase: 'Phase 4A identified', createdNow: false, riskIfMissing: 'TXQuote scan risk', phaseRequired: 'Phase 4B prereq' },
  { id: 30, entity: 'EnrollmentMember', fields: ['master_general_agent_id', 'enrollment_window_id'], purpose: 'Enrollment member scoping', phase: 'Phase 4A identified', createdNow: false, riskIfMissing: 'PII scan risk', phaseRequired: 'Phase 4B prereq' },
];

export const INDEX_SUMMARY = {
  total: 30,
  created_in_phase4a: 0,
  deferred_to_phase4b: 30,
  highest_priority: [27], // MasterGeneralAgentUser — used at every gate call
  rule: 'No production backfill may run if any of the 30 required indexes is missing.',
};

export default { REQUIRED_INDEXES, INDEX_SUMMARY };