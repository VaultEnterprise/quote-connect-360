# MGA Phase 4A — Migration Readiness, Index Preparation, and Dry-Run Backfill Planning

Report date: 2026-05-04
Author: Base44 AI agent
Phase: 4A — Migration Readiness and Dry-Run Planning
Status: COMPLETE — PENDING PHASE 4A COMPLETION AUDIT

Canonical documents:
- Architecture: `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`
- Build planning: `docs/MGA_BUILD_PLANNING_PACKAGE.md`
- Phase 0 report: `docs/MGA_PHASE_0_BASELINE_AND_SAFETY_REPORT.md`
- Phase 1 report: `docs/MGA_PHASE_1_DATA_MODEL_AND_SCOPE_FOUNDATION_REPORT.md`
- Phase 1 audit: `docs/MGA_PHASE_1_COMPLETION_AUDIT_REPORT.md`
- Phase 2 report: `docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md`
- Phase 2 audit: `docs/MGA_PHASE_2_COMPLETION_AUDIT_REPORT.md`
- Phase 3 report: `docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md`
- Phase 3 audit: `docs/MGA_PHASE_3_COMPLETION_AUDIT_REPORT.md`
- Mini-pass report: `docs/MGA_SCOPE_PENDING_ENTITY_MINI_PASS_REPORT.md`
- Mini-pass audit: `docs/MGA_SCOPE_PENDING_ENTITY_MINI_PASS_COMPLETION_AUDIT_REPORT.md`
- Phase 4A report: `docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md` (this file)

Phase 4A artifacts:
- `lib/mga/migration/dryRunEngine.js`
- `lib/mga/migration/anomalyDetector.js`
- `lib/mga/migration/reconciliationReport.js`
- `lib/mga/migration/masterGroupMappingPlan.js`
- `lib/mga/migration/backfillPlan.js`
- `lib/mga/migration/quarantinePlan.js`
- `lib/mga/migration/indexPlan.js`
- `lib/mga/migration/rollbackPlan.js`
- `lib/mga/migration/featureFlagPlan.js`
- `lib/mga/migration/phase4bTestPlan.js`

---

## 0. Phase 4A Control Statement

Phase 4A is limited exclusively to:
- Migration readiness planning and documentation
- Index preparation (definitions; creation only if non-destructive and environment allows)
- Source-of-truth mapping design
- Dry-run migration logic (computes proposed values; does NOT commit them)
- Dry-run reconciliation report design
- Anomaly detection logic (detection only; no record mutations)
- Quarantine planning
- Rollback planning
- Business approval workflow definition
- Non-destructive validation

Phase 4A does NOT:
- Run final production migration or backfill
- Assign final MGA ownership to any live records
- Move records
- Delete records
- Replace frontend reads
- Modify UI behavior
- Modify navigation
- Enable MGA functionality for users
- Change TXQuote production behavior
- Change reporting production behavior
- Change document production behavior
- Alter existing user permissions
- Activate Phase 3 scoped services in live user flows
- Remove any entity from fail-closed protection
- Expose quarantined records to users
- Begin Phase 5, 6, 7, or 8

---

## 1. Pre-Change Baseline Confirmation

### Certified phase audit status

| Phase | Audit status | P0 blockers | P1 findings |
|---|---|---|---|
| Phase 3 | PASS | 0 | 0 |
| Mini-pass | PASS | 0 | 0 |
| Mini-pass gate-list correction | APPLIED — isolated to serviceContract.js import; no live behavior change | — | — |

### Gate-list correction verification

The audit-time correction to `lib/mga/services/serviceContract.js` replaced an inline duplicate `SCOPE_PENDING_ENTITY_TYPES` array with an import from `lib/mga/scopeResolver.js`. Verified:
- `serviceContract.js` line 159: `import { SCOPE_PENDING_ENTITY_TYPES } from '../scopeResolver.js';`
- `serviceContract.js` line 160: `export { SCOPE_PENDING_ENTITY_TYPES };`
- `isScopePending()` function behavior unchanged
- `buildScopePendingResponse()` function behavior unchanged
- No user-visible change; no live app behavior affected

### All 10 previously scope-pending entities confirmed fail-closed

| Entity | Fail-closed status |
|---|---|
| Tenant | YES — in SCOPE_PENDING_ENTITY_TYPES; scopeResolver returns SCOPE_PENDING_MIGRATION |
| CensusImportJob | YES |
| CensusImportAuditEvent | YES |
| CensusValidationResult | YES |
| UserManual | YES |
| HelpSearchLog | YES |
| HelpAIQuestionLog | YES |
| HelpCoverageSnapshot | YES |
| HelpAuditLog | YES |
| HelpAITrainingQueue | YES |

### Certified counts preserved

| Metric | Value |
|---|---|
| Phase 3 services implemented | 91 |
| Phase 3 fail-closed placeholders | 4 |
| Phase 3 deferred services pending mini-pass | 10 |
| Phase 3 services calling scopeGate | 95 / 95 (100%) |
| Phase 3 direct frontend replacement mappings | 57 grouped findings / 157 total findings |
| Mini-pass entities updated | 10 |
| Mini-pass master_general_agent_id fields added | 10 |
| Mini-pass mga_migration_status fields added | 10 |
| Mini-pass mga_migration_batch_id fields added | 10 |
| Mini-pass entities remaining fail-closed | 10 |
| Authoritative SCOPE_PENDING_ENTITY_TYPES source | `lib/mga/scopeResolver.js` lines 28–39 |

No duplicate spaced-path documents exist. No Phase 5–8 work has started.

---

## 2. Migration Entity Scope Map

Complete map of every entity requiring MGA propagation, validation, or explicit exclusion.

### Group A — MGA Core (root anchors)

| Entity | Parent source | MGA scope rule | Direct/Inherited | Current MGA state | Nullable during migration | Required after | Backfill method | Anomaly rule | Quarantine rule | Rollback rule | Validation method | Index required | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MasterGeneralAgent | Self (root anchor) | IS the MGA root | Direct — root | Not applicable — this IS the scope anchor | NO | YES | MGA records must be created/seeded before any downstream backfill | Duplicate code or name | Quarantine duplicate; alert | Archive duplicate candidate | Unique code constraint | (id, code, status) | YES — MGA creation approval |
| MasterGeneralAgentUser | MasterGeneralAgent | master_general_agent_id = MGA parent | Direct | Already carries master_general_agent_id (Phase 1 entity) | NO | YES | No backfill needed if created with MGA parent | Membership with missing MGA | Quarantine; deny login | Revert membership | User membership count per MGA | (master_general_agent_id, user_email, status) | YES — user role governance |
| MasterGeneralAgentAgreement | MasterGeneralAgent | master_general_agent_id = MGA parent | Direct | Phase 1 entity; field present | NO | YES | No backfill if Phase 1 seeded correctly | Agreement with missing MGA | Quarantine | Revert | Agreement/MGA count | (master_general_agent_id, status) | YES |
| MasterGeneralAgentCommissionProfile | MasterGeneralAgent | master_general_agent_id = MGA parent | Direct | Phase 1 entity; field present | NO | YES | No backfill if Phase 1 seeded correctly | Profile with missing MGA | Quarantine | Revert | Profile/MGA count | (master_general_agent_id) | YES |
| MasterGeneralAgentActivityLog | MasterGeneralAgent | master_general_agent_id = MGA parent | Direct | Phase 1 entity; field present | YES — historical logs may predate MGA | After Phase 4B | Backfill from actor's resolved MGA via MasterGeneralAgentUser | Logs with no actor MGA | Null MGA acceptable for platform-admin events | N/A (append-only) | Actor/log/MGA reconciliation | (master_general_agent_id, actor_email) | NO |
| MGAMigrationBatch | MasterGeneralAgent | master_general_agent_id = MGA parent | Direct | Phase 1 entity; field present | NO | YES | Created during Phase 4B for each backfill run | Duplicate batch IDs | Flag; merge or quarantine | Void batch | Batch ID uniqueness | (master_general_agent_id, status) | YES — batch approval |
| MGAQuarantineRecord | MasterGeneralAgent | master_general_agent_id = MGA parent (or null for unresolved) | Direct | Phase 1 entity; field present | YES — unresolved records may have null | After resolution | Created by quarantine detection logic | Quarantine record with no source entity | N/A — this IS the quarantine sink | Unreachable; quarantine records are immutable | Quarantine count by entity | (master_general_agent_id, entity_type, status) | YES — release approval |

### Group B — MasterGroup Tier

| Entity | Parent source | MGA scope rule | Direct/Inherited | Current MGA state | Nullable | Required after | Backfill method | Anomaly rule | Quarantine rule | Rollback rule | Validation method | Index required | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MasterGroup | MasterGeneralAgent | master_general_agent_id = parent MGA | Direct | Phase 1 entity; field present but may not be stamped on all existing records | YES | YES | Map MasterGroup → MGA via approved mapping table; write master_general_agent_id | No mapping | Quarantine; block downstream | Revert field | 100% MasterGroup → MGA reconciliation | (master_general_agent_id, status) | YES — core mapping approval |
| Tenant | MasterGroup | master_general_agent_id = MasterGroup.master_general_agent_id | Inherited | NULL on existing records (mini-pass added field) | YES | YES | Propagate from parent MasterGroup.master_general_agent_id | Parent MasterGroup unresolved | Quarantine Tenant; block downstream | Revert field | Tenant/MasterGroup/MGA count check | (master_general_agent_id, master_group_id, status) | NO — automatic propagation |
| RateSetAssignment | MasterGroup / Tenant / Global | master_general_agent_id = MasterGroup or global intent | Direct or Global-Intentional | Field present; may be null or stale | YES | YES (scoped); NO (global) | Classify: assignment_type = global → exclude; else propagate from parent MasterGroup | Scoped assignment without MasterGroup parent | Quarantine scoped; exclude global | Revert or re-classify | Assignment type coverage | (master_general_agent_id, assignment_type) | YES — catalog global vs scoped decision |

### Group C — Employer / Agency Tier

| Entity | Parent source | MGA scope rule | Direct/Inherited | Current MGA state | Nullable | Required after | Backfill method | Anomaly rule | Quarantine rule | Rollback rule | Validation method | Index required | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Agency | Platform / MGA future | Global - Intentional or Scoped | Global (currently) | master_general_agent_id not present on Agency schema | YES — pending business decision | After business classification | Classify as global/platform or assign to MGA; no automatic propagation | Shared agency data used by multiple MGAs | Quarantine if scoped but ambiguous | Revert | Agency/MGA assignment coverage | (master_general_agent_id if scoped) | YES — global vs scoped business decision |
| EmployerGroup | Agency / MasterGroup | master_general_agent_id = parent MasterGroup's MGA | Inherited via MasterGroup | Field present; may be null or unresolved | YES | YES | Propagate from parent MasterGroup.master_general_agent_id via agency_id lookup | EmployerGroup with no resolvable MasterGroup | Quarantine; block case downstream | Revert field | EmployerGroup/MasterGroup/MGA count | (master_general_agent_id, status) | NO — automatic if MasterGroup resolved |

### Group D — Case / Workflow Tier

| Entity | Parent source | MGA scope rule | Direct/Inherited | Current MGA state | Nullable | Required after | Backfill method | Anomaly rule | Quarantine rule | Rollback | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BenefitCase | EmployerGroup | Inherited via EmployerGroup → MasterGroup → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent EmployerGroup.master_general_agent_id | Case with no EmployerGroup | Quarantine; block census/quote downstream | Revert | Case/Employer/MGA count | (master_general_agent_id, stage, status) | NO — automatic |
| CaseTask | BenefitCase | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | Task with no case | Quarantine | Revert | Task/Case/MGA count | (master_general_agent_id, case_id, status) | NO |
| ExceptionItem | BenefitCase / entity | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | Exception with no case or entity | Quarantine | Revert | Exception/Case/MGA count | (master_general_agent_id, case_id, severity) | NO |
| ActivityLog | BenefitCase | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | Log with no case | Null MGA for platform-admin; quarantine for operational | Revert | Log/Case/MGA count | (master_general_agent_id, case_id) | NO |
| CaseFilterPreset | User / Case | User + MGA scope | Direct (user-scoped) | Field present; may be null | YES | YES | Resolve user → MGA via MasterGeneralAgentUser | Preset with no user MGA | Null MGA = unauthenticated; quarantine if operational | Revert | Preset/User/MGA count | (master_general_agent_id, created_by) | NO |
| ViewPreset | User / Page | User + MGA scope | Direct (user-scoped) | Field present; may be null | YES | YES | Resolve user → MGA via MasterGeneralAgentUser | Preset with no user MGA | Same as CaseFilterPreset | Revert | Preset/User/MGA count | (master_general_agent_id, created_by) | NO |

### Group E — Census Tier

| Entity | Parent source | MGA scope rule | Inherited / Direct | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Rollback | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CensusVersion | BenefitCase | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine; block member/job downstream | Revert | Version/Case/MGA count | (master_general_agent_id, case_id, status) | NO |
| CensusMember | CensusVersion / BenefitCase | Inherited via CensusVersion → BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent CensusVersion.master_general_agent_id | No parent version | Quarantine | Revert | Member/Version/MGA count | (master_general_agent_id, case_id) | NO |
| CensusImportJob | BenefitCase | Inherited via BenefitCase → MGA | Inherited | NULL (mini-pass added field; no existing records stamped) | YES | YES | Propagate from parent BenefitCase.master_general_agent_id at job creation time; backfill existing from case_id | No parent case | Quarantine; block AuditEvent/ValidationResult downstream | Revert | Job/Case/MGA count | (master_general_agent_id, case_id, status) | NO |
| CensusImportAuditEvent | CensusImportJob | Inherited via CensusImportJob → BenefitCase → MGA | Inherited | NULL (mini-pass added field) | YES | YES | Propagate from parent CensusImportJob.master_general_agent_id | No parent job | Quarantine | Revert | Event/Job/MGA count | (master_general_agent_id, census_import_job_id) | NO |
| CensusValidationResult | CensusImportJob / CensusVersion | Inherited via CensusImportJob → BenefitCase → MGA; must match CensusVersion MGA | Inherited | NULL (mini-pass added field) | YES | YES | Propagate from parent CensusImportJob; cross-check with CensusVersion | MGA mismatch between job and version | Quarantine on mismatch | Revert | Result/Job/Version MGA consistency check | (master_general_agent_id, census_import_id, status) | NO |

### Group F — Quote / Proposal Tier

| Entity | Parent source | MGA scope rule | Inherited / Direct | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Rollback | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QuoteScenario | BenefitCase | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine | Revert | Scenario/Case/MGA count | (master_general_agent_id, case_id, status) | NO |
| ScenarioPlan | QuoteScenario / BenefitCase | Inherited via QuoteScenario → BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent QuoteScenario.master_general_agent_id | No parent scenario | Quarantine | Revert | Plan/Scenario/MGA count | (master_general_agent_id, scenario_id) | NO |
| ContributionModel | QuoteScenario / BenefitCase | Inherited via QuoteScenario → BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent QuoteScenario.master_general_agent_id | No parent scenario | Quarantine | Revert | Model/Scenario/MGA count | (master_general_agent_id, case_id) | NO |
| QuoteTransmission | BenefitCase / CensusVersion | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine; external log preserved | Revert field (not external log) | Transmission/Case/MGA count | (master_general_agent_id, case_id) | YES — external transmission records |
| PolicyMatchResult | BenefitCase / QuoteScenario | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine; AI output | Revert | Result/Case/MGA count | (master_general_agent_id, case_id) | NO |
| Proposal | BenefitCase / QuoteScenario | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine; revoke export artifacts | Revert | Proposal/Case/MGA count | (master_general_agent_id, case_id, status) | YES — generated artifacts |

### Group G — TXQuote Tier

| Entity | Parent source | MGA scope rule | Inherited / Direct | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Rollback | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TxQuoteCase | BenefitCase | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine; pause TXQuote flow | Revert | TxQuoteCase/BenefitCase/MGA count | (master_general_agent_id, case_id) | YES — external transmission |
| TxQuoteDestination | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase.master_general_agent_id | No parent TxQuoteCase | Quarantine | Revert | Destination/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| TxQuoteReadinessResult | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | No parent TxQuoteCase | Quarantine | Revert | Readiness/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| TxQuoteSubmissionLog | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | No parent TxQuoteCase | Quarantine; external log preserved | Revert field | Submission/Case/MGA count | (master_general_agent_id, txquote_case_id) | YES |
| TxQuoteEmployerProfile | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | Same | Quarantine | Revert | Profile/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| TxQuoteCurrentPlanInfo | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | Same | Quarantine | Revert | Plan/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| TxQuoteContributionStrategy | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | Same | Quarantine | Revert | Strategy/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| TxQuoteClaimsRequirement | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | Same | Quarantine | Revert | Claims/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| TxQuoteSupportingDocument | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | Same | Quarantine | Revert | Doc/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| TxQuoteDestinationContact | TxQuoteDestination / Rule | Inherited via Destination → TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteDestination | No parent destination | Quarantine | Revert | Contact/Destination/MGA count | (master_general_agent_id) | NO |
| TxQuoteDestinationRule | Platform / MGA custom | Global - Intentional or MGA-custom | Dual — see RateSetAssignment pattern | May be null | YES | YES (MGA-custom only) | Classify: platform = global; custom = propagate from MGA owner | Custom rule with no MGA owner | Quarantine custom; exclude global | Revert | Rule type coverage | (master_general_agent_id if scoped) | YES — global vs custom business decision |
| TxQuoteCensusOverride | TxQuoteCase | Inherited via TxQuoteCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent TxQuoteCase | Same | Quarantine | Revert | Override/Case/MGA count | (master_general_agent_id, txquote_case_id) | NO |
| QuoteProviderRoute | Platform / MGA custom | Same as TxQuoteDestinationRule | Dual | May be null | YES | YES (custom only) | Classify and propagate or exclude | Custom route with no MGA owner | Quarantine custom; exclude global | Revert | Route type coverage | (master_general_agent_id if scoped) | YES — global vs custom business decision |

### Group H — Enrollment Tier

| Entity | Parent source | MGA scope rule | Inherited / Direct | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Rollback | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EnrollmentWindow | BenefitCase | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine | Revert | Window/Case/MGA count | (master_general_agent_id, case_id, status) | NO |
| EmployeeEnrollment | EnrollmentWindow / BenefitCase | Inherited via EnrollmentWindow → BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent EnrollmentWindow.master_general_agent_id | No parent window | Quarantine; revoke access links | Revert | Enrollment/Window/MGA count | (master_general_agent_id, case_id, status) | YES — employee PII |
| EnrollmentMember | EmployeeEnrollment | Inherited via EmployeeEnrollment → EnrollmentWindow → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent EmployeeEnrollment.master_general_agent_id | No parent enrollment | Quarantine | Revert | Member/Enrollment/MGA count | (master_general_agent_id, enrollment_window_id) | NO |

### Group I — Document / File Tier

| Entity | Parent source | MGA scope rule | Inherited / Direct | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Rollback | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Document | BenefitCase / EmployerGroup | Inherited via BenefitCase or EmployerGroup → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase or EmployerGroup.master_general_agent_id (prefer BenefitCase) | Missing both parent case and employer | Quarantine; revoke file_url access | Revert | Doc/Case/Employer/MGA count | (master_general_agent_id, case_id) | YES — file access |
| Proposal (generated PDF artifact) | BenefitCase / QuoteScenario | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine; revoke PDF artifact | Revert | See Group F — Proposal | See Group F | See Group F |

### Group J — Report / Snapshot / Export Tier

| Entity | Parent source | MGA scope rule | Inherited / Direct | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Rollback | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HelpCoverageSnapshot (mga_scoped) | MGA / usage data | Inherited from generating MGA context | Direct | NULL (mini-pass added field) | YES | YES (mga_scoped only) | Classify: admin global → platform_global (null MGA); MGA usage → mga_scoped (set MGA) | Snapshot with operational data but null MGA | Quarantine | Revert scope_type to platform_global | Snapshot classification coverage | (master_general_agent_id, scope_type, snapshot_date) | NO |
| RenewalCycle | BenefitCase / EmployerGroup | Inherited via BenefitCase → MGA | Inherited | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id | No parent case | Quarantine | Revert | Renewal/Case/MGA count | (master_general_agent_id, case_id) | NO |

### Group K — Notification / Email / Link Tier

| Entity | MGA scope rule | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|
| (Email/notification logs — no dedicated entity currently) | Scoped via function invocation context; not stored as entities in current schema | N/A | N/A | N/A | Scope verified at send time from BenefitCase/EnrollmentWindow parent chain | Stale deep links point to moved/quarantined records | Stale links fail closed | Link reauth test | N/A | NO |

### Group L — Webhook / Job / Retry Tier

| Entity | MGA scope rule | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|
| (Webhook/job/retry — managed via existing backend functions; no dedicated entity currently) | Scope must be re-resolved at execution from stored parent entity references | N/A | N/A | N/A | Function scope re-resolution at execution time | Ownership ambiguity | Quarantine via MGAQuarantineRecord | Async scope drift test | N/A | NO |

### Group M — Audit / Activity Tier

| Entity | Parent source | MGA scope rule | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ActivityLog | BenefitCase | Inherited via BenefitCase → MGA | Field present; may be null | YES | YES | Propagate from parent BenefitCase.master_general_agent_id; null MGA acceptable for platform-admin events | Log with no case and non-admin actor | Null MGA acceptable for platform events; quarantine operational orphans | Log/Case/MGA count | (master_general_agent_id, case_id) | NO |
| MasterGeneralAgentActivityLog | MasterGeneralAgent | Direct | Field present | NO | YES | No backfill needed if Phase 1 seeded correctly | Log with missing MGA | Quarantine | Activity/MGA count | (master_general_agent_id) | NO |
| HelpAuditLog | Actor user → MGA | Inherited via actor_email → MGA (operational) or null (platform admin) | NULL (mini-pass added field) | YES | YES (operational) | Resolve actor_email → MGA via MasterGeneralAgentUser; null MGA for platform-admin | Operational log with no actor MGA | Quarantine operational orphans | Log/Actor/MGA count | (master_general_agent_id, event_type) | NO |

### Group N — Help / Manual Scoped Activity Tier

| Entity | Parent source | MGA scope rule | Current MGA state | Nullable | Required after | Backfill method | Anomaly | Quarantine | Validation | Index | Business approval |
|---|---|---|---|---|---|---|---|---|---|---|---|
| UserManual (mga_scoped) | Generating MGA context | Direct (mga_scoped only) | NULL (mini-pass added field) | YES | YES (mga_scoped only) | Classify all existing records; admin-seeded = platform_global; operational = mga_scoped with MGA set | Unclassifiable manuals | Quarantine unclassifiable; hide from MGA users | Classification coverage 100% | (master_general_agent_id, scope_type) | NO |
| HelpSearchLog | Actor user → MGA | Direct (user activity) | NULL (mini-pass added field) | YES | YES (for operational users) | Resolve user_email → MGA via MasterGeneralAgentUser | Users with no MGA membership | Null MGA = unauthenticated/platform session; not quarantined | User/MGA resolution coverage | (master_general_agent_id, user_email, created_date) | NO |
| HelpAIQuestionLog | Actor user → MGA | Direct (user activity) | NULL (mini-pass added field) | YES | YES (for operational users) | Same as HelpSearchLog | Same | Same | Same | (master_general_agent_id, user_email, created_date) | NO |
| HelpAITrainingQueue (mga_scoped) | Content change trigger → MGA | Direct (mga_scoped only) | NULL (mini-pass added field) | YES | YES (mga_scoped only) | Classify by trigger source; platform content = platform_global; MGA content = mga_scoped | Queue items with no traceable trigger | Quarantine mga_scoped without MGA ID | Classification coverage | (master_general_agent_id, scope_type, queue_status) | NO |

### Group O — Quarantine / Migration Records

| Entity | MGA scope rule | Validation | Index |
|---|---|---|---|
| MGAMigrationBatch | Direct — belongs to MGA that initiated the batch | Batch/MGA count; batch ID uniqueness | (master_general_agent_id, status) |
| MGAQuarantineRecord | Direct — assigned to MGA that owns the quarantined source record (or null for unresolved) | Quarantine count by entity type and resolution status | (master_general_agent_id, entity_type, status) |

**Total entity categories mapped: 15 groups, 58 entity types**
**Entity types excluded as Global - Intentional (no MGA propagation): HelpModule, HelpPage, HelpSection, HelpContent, HelpContentVersion, HelpTarget, HelpManualTopic, HelpManualTopicTargetMap, SeedRun, SeedRunStep, User**
**Entity types requiring business classification before backfill: Agency, RateSetAssignment, TxQuoteDestinationRule, QuoteProviderRoute**

---

## 3. MasterGroup-to-MGA Mapping Plan

### Source of truth for MasterGroup MGA assignment

| Data source | Reliability | Use |
|---|---|---|
| MasterGroup.master_general_agent_id (if already stamped) | High — if set in Phase 1 seeding | Primary source for already-stamped records |
| MasterGeneralAgentUser records linking users to both MGA and MasterGroup | High | Cross-reference: users with allowed_master_group_ids indicate ownership |
| Existing BenefitCase records referencing both employer_group_id and agency_id | Medium — indirect | Infer EmployerGroup → MasterGroup → MGA chain |
| Business approval intake form / owner attestation | Authoritative | Required for any ambiguous or multi-signal mapping |

### Mapping method classification

| Method | Definition | Approval required | When used |
|---|---|---|---|
| Automatic | Single unambiguous signal: MasterGroup.master_general_agent_id is already set and non-null | NO | MasterGroups already stamped from Phase 1 setup |
| Inferred | MasterGroup has no stamped MGA, but MasterGeneralAgentUser records + case patterns suggest a single MGA | YES — migration owner review | MasterGroups with clear but indirect signals |
| Manual | MasterGroup has zero signals or conflicting signals | YES — business owner approval | Ambiguous or multi-signal groups |
| Excluded | MasterGroup is a platform-level test/seed record or explicitly designated global | YES — platform admin approval | Seed/test/demo data |
| Quarantined | No safe mapping exists after all methods exhausted | YES — compliance/security review | Orphaned or conflicting groups |

### Mapping record fields

Each MasterGroup mapping record must document:
- `master_group_id` — source record
- `proposed_mga_id` — proposed MGA assignment
- `mapping_method` — automatic | inferred | manual | excluded | quarantined
- `signal_sources` — array of evidence (field names, record IDs)
- `confidence_level` — high | medium | low
- `is_deterministic` — true | false
- `conflict_detected` — true | false
- `conflict_description` — description if conflict
- `approval_status` — pending | approved | rejected
- `approval_owner` — role/person responsible
- `approval_date` — date approved
- `rollback_marker` — before-state snapshot reference
- `quarantine_reason` — if quarantined
- `downstream_blocked` — count of records blocked pending this mapping

### Blocking rules

| Rule | Enforcement |
|---|---|
| No MasterGroup may be assigned to an MGA by guesswork | Any mapping with confidence_level = low and no business approval is blocked |
| Ambiguous MasterGroups must be quarantined or flagged | conflict_detected = true → quarantine or manual approval required |
| No downstream backfill until parent MasterGroup is resolved | Backfill engine checks is_deterministic = true before proceeding to child records |
| No fake/default MGA values | proposed_mga_id must be a real MasterGeneralAgent.id or NULL (quarantine) |

### Approval workflow before final backfill

1. Phase 4A: Dry-run engine computes mapping for all MasterGroups → produces mapping report
2. Platform admin reviews: confirms automatic, reviews inferred
3. Business owners review: approves or rejects manual mappings
4. All approved mappings marked `approval_status = approved`
5. Any rejected mappings → quarantine or re-investigate
6. 100% of MasterGroups must have a final status (approved or quarantined) before Phase 4B

---

## 4. Downstream Backfill Plan

### Backfill execution order

| Step | Entity/Group | Source records | Target records | Parent dependency | Backfill rule | Validation | Anomaly handling | Rollback marker | Quarantine condition | Acceptance threshold |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | MasterGeneralAgent | Platform seed | Verified MGA records | None (root) | Verify all MGAs are seeded correctly; no creation here | MGA count matches expected | Duplicate code → quarantine | Snapshot before step | Duplicate or missing MGA | 100% of expected MGAs present |
| 2 | MasterGroup | Existing records | MasterGroup.master_general_agent_id | MasterGeneralAgent | Apply approved mapping table | 100% MasterGroup → MGA reconciliation | Ambiguous → quarantine | Field snapshot | No approved mapping | 100% deterministic or quarantined |
| 3 | Tenant | Existing records | Tenant.master_general_agent_id | MasterGroup | Propagate from MasterGroup.master_general_agent_id | Tenant/MasterGroup/MGA count match | No parent MasterGroup → quarantine | Field snapshot | Parent unresolved | 100% with resolved parent |
| 4 | EmployerGroup | Existing records | EmployerGroup.master_general_agent_id | MasterGroup | Propagate from MasterGroup.master_general_agent_id via agency_id/master_group_id chain | Employer/MasterGroup/MGA count | No parent → quarantine | Field snapshot | Parent unresolved | ≥99% with resolved parent; remainder quarantined |
| 5 | BenefitCase | Existing records | BenefitCase.master_general_agent_id | EmployerGroup | Propagate from EmployerGroup.master_general_agent_id | Case/Employer/MGA count | No parent → quarantine | Field snapshot | Parent unresolved | ≥99% |
| 6 | CensusVersion / CensusMember | Existing records | .master_general_agent_id | BenefitCase | Propagate from BenefitCase | Version/Case/MGA count | No parent → quarantine | Field snapshot | Parent unresolved | ≥99% |
| 7 | CensusImportJob / CensusImportAuditEvent / CensusValidationResult | Existing records | .master_general_agent_id | BenefitCase / CensusImportJob | Propagate from BenefitCase chain; cross-check CensusVersion for CensusValidationResult | Job/Event/Result counts; cross-entity MGA consistency | Orphan or mismatch → quarantine | Field snapshot | Orphan or mismatch | ≥99% |
| 8 | QuoteScenario / ScenarioPlan / ContributionModel / QuoteTransmission / PolicyMatchResult | Existing records | .master_general_agent_id | BenefitCase | Propagate from BenefitCase | Quote/Scenario/MGA count | No parent → quarantine | Field snapshot | Parent unresolved | ≥99% |
| 9 | Proposal | Existing records | .master_general_agent_id | BenefitCase | Propagate from BenefitCase | Proposal/Case/MGA count; PDF artifact review | No parent → quarantine; revoke PDF | Field snapshot + artifact snapshot | Parent unresolved | ≥99%; PDF artifacts reviewed |
| 10 | TxQuoteCase + all TXQuote child entities | Existing records | .master_general_agent_id | BenefitCase | Propagate from BenefitCase | TxQuoteCase/BenefitCase/MGA count | No parent → quarantine; pause TXQuote | Field snapshot | Parent unresolved | 100% (external transmission records require full resolution) |
| 11 | EnrollmentWindow / EmployeeEnrollment / EnrollmentMember | Existing records | .master_general_agent_id | BenefitCase | Propagate from BenefitCase → EnrollmentWindow chain | Enrollment/Window/MGA count | No parent → quarantine; revoke links | Field snapshot | Parent unresolved | ≥99%; links reviewed |
| 12 | Document (and document-derived artifacts) | Existing records | .master_general_agent_id | BenefitCase / EmployerGroup | Propagate from BenefitCase (prefer) or EmployerGroup | Doc/Case/Employer/MGA count | No parent → quarantine; revoke file_url | File snapshot | Both parents unresolved | ≥99% |
| 13 | RenewalCycle | Existing records | .master_general_agent_id | BenefitCase | Propagate from BenefitCase | Renewal/Case/MGA count | No parent → quarantine | Field snapshot | Parent unresolved | ≥99% |
| 14 | CaseTask / ExceptionItem | Existing records | .master_general_agent_id | BenefitCase | Propagate from BenefitCase | Task/Exception/MGA count | No parent → quarantine | Field snapshot | Parent unresolved | ≥99% |
| 15 | ActivityLog / MasterGeneralAgentActivityLog | Existing records | .master_general_agent_id | BenefitCase / MGA | Propagate from BenefitCase; null MGA for platform events | Log/Case/MGA count | Operational orphan → quarantine | Field snapshot | Operational orphan | ≥95% resolved; remainder classified as platform |
| 16 | HelpSearchLog / HelpAIQuestionLog | Existing records | .master_general_agent_id | user_email → MGA | Resolve user_email → MasterGeneralAgentUser → MGA | User/MGA resolution coverage | No MGA membership = unauthenticated (null MGA, not quarantined) | Field snapshot | N/A | 100% classified (resolved or unauthenticated) |
| 17 | HelpCoverageSnapshot / HelpAITrainingQueue / UserManual | Existing records | .master_general_agent_id + scope_type | Generating context | Classify scope_type first; set MGA only for mga_scoped | Classification coverage | Unclassifiable → quarantine | Field snapshot | Unclassifiable | 100% classified |
| 18 | HelpAuditLog | Existing records | .master_general_agent_id | actor_email → MGA | Resolve actor_email → MGA for operational events; null for platform-admin | Log/Actor/MGA count | Operational orphan → quarantine | Field snapshot | Operational orphan | ≥95% classified |
| 19 | CaseFilterPreset / ViewPreset | Existing records | .master_general_agent_id | user_email → MGA | Resolve user → MGA | Preset/User/MGA count | No MGA → null (unauthenticated) or quarantine if operational | Field snapshot | Operational preset with no user MGA | 100% classified |
| 20 | RateSetAssignment / QuoteProviderRoute / TxQuoteDestinationRule | Existing records | .master_general_agent_id (if scoped) | Business classification | Classify global vs scoped; propagate only for scoped | Classification coverage | Scoped without owner → quarantine | Classification snapshot | Unclassified scoped | 100% classified after business approval |

---

## 5. Index Preparation

### Phase 1 deferred indexes (16 defined in Phase 1 report)

These are the compound indexes defined during Phase 1 data model work. All deferred to Phase 4. Phase 4A documents readiness; Phase 4B creates them immediately before final backfill.

| # | Entity | Index fields | Purpose | Created now | Deferred | Risk if missing | Phase dependency |
|---|---|---|---|---|---|---|---|
| 1 | MasterGeneralAgent | (code, status) | Unique code enforcement; status filter | NO | Phase 4B prereq | Full-table scan on code lookup | Phase 4B |
| 2 | MasterGroup | (master_general_agent_id, status) | MGA-scoped group listing | NO | Phase 4B prereq | Cross-MGA scan risk during backfill | Phase 4B |
| 3 | EmployerGroup | (master_general_agent_id, status) | MGA-scoped employer listing | NO | Phase 4B prereq | Cross-MGA scan risk | Phase 4B |
| 4 | BenefitCase | (master_general_agent_id, stage, status) | MGA-scoped case pipeline | NO | Phase 4B prereq | Performance degradation; cross-MGA scan | Phase 4B |
| 5 | CensusVersion | (master_general_agent_id, case_id, status) | MGA-scoped census listing | NO | Phase 4B prereq | Scan risk | Phase 4B |
| 6 | CensusMember | (master_general_agent_id, case_id) | MGA-scoped PII member listing | NO | Phase 4B prereq | PII scan risk | Phase 4B |
| 7 | QuoteScenario | (master_general_agent_id, case_id, status) | MGA-scoped quote listing | NO | Phase 4B prereq | Scan risk | Phase 4B |
| 8 | EnrollmentWindow | (master_general_agent_id, case_id, status) | MGA-scoped enrollment listing | NO | Phase 4B prereq | Scan risk | Phase 4B |
| 9 | EmployeeEnrollment | (master_general_agent_id, case_id, status) | MGA-scoped PII employee listing | NO | Phase 4B prereq | PII scan risk | Phase 4B |
| 10 | Document | (master_general_agent_id, case_id) | MGA-scoped document listing | NO | Phase 4B prereq | File access scan risk | Phase 4B |
| 11 | CaseTask | (master_general_agent_id, case_id, status) | MGA-scoped task listing | NO | Phase 4B prereq | Scan risk | Phase 4B |
| 12 | ExceptionItem | (master_general_agent_id, case_id, severity) | MGA-scoped exception triage | NO | Phase 4B prereq | Scan risk | Phase 4B |
| 13 | ActivityLog | (master_general_agent_id, case_id) | MGA-scoped audit trail | NO | Phase 4B prereq | Audit scan risk | Phase 4B |
| 14 | RenewalCycle | (master_general_agent_id, case_id) | MGA-scoped renewal listing | NO | Phase 4B prereq | Scan risk | Phase 4B |
| 15 | Proposal | (master_general_agent_id, case_id, status) | MGA-scoped proposal listing | NO | Phase 4B prereq | Artifact scan risk | Phase 4B |
| 16 | MGAMigrationBatch | (master_general_agent_id, status) | Migration batch tracking | NO | Phase 4B prereq | Migration tracking failure | Phase 4B |

### Mini-pass deferred indexes (10 defined in mini-pass)

| # | Entity | Index fields | Purpose | Created now | Deferred | Risk if missing | Phase dependency |
|---|---|---|---|---|---|---|---|
| 17 | Tenant | (master_general_agent_id, master_group_id, status) | Tenant scoping via MasterGroup | NO | Phase 4B prereq | Tenant scan risk | Phase 4B |
| 18 | CensusImportJob | (master_general_agent_id, case_id, status) | Scoped job tracking | NO | Phase 4B prereq | Job scan risk | Phase 4B |
| 19 | CensusImportAuditEvent | (master_general_agent_id, census_import_job_id) | Scoped audit event lookup | NO | Phase 4B prereq | Audit scan risk | Phase 4B |
| 20 | CensusValidationResult | (master_general_agent_id, census_import_id, status) | Scoped validation results | NO | Phase 4B prereq | Validation scan risk | Phase 4B |
| 21 | UserManual | (master_general_agent_id, scope_type) | Discriminated manual listing | NO | Phase 4B prereq | Scope bleed risk | Phase 4B |
| 22 | HelpSearchLog | (master_general_agent_id, user_email, created_date) | Scoped search activity | NO | Phase 4B prereq | Activity scan risk | Phase 4B |
| 23 | HelpAIQuestionLog | (master_general_agent_id, user_email, created_date) | Scoped question activity | NO | Phase 4B prereq | PII scan risk | Phase 4B |
| 24 | HelpCoverageSnapshot | (master_general_agent_id, scope_type, snapshot_date) | Discriminated snapshot listing | NO | Phase 4B prereq | Scope bleed risk | Phase 4B |
| 25 | HelpAuditLog | (master_general_agent_id, event_type, created_date) | Scoped help audit | NO | Phase 4B prereq | Audit scan risk | Phase 4B |
| 26 | HelpAITrainingQueue | (master_general_agent_id, scope_type, queue_status) | Discriminated queue processing | NO | Phase 4B prereq | Queue contamination risk | Phase 4B |

### Additional indexes required (identified during Phase 4A mapping)

| # | Entity | Index fields | Purpose | Deferred | Phase dependency |
|---|---|---|---|---|---|
| 27 | MasterGeneralAgentUser | (master_general_agent_id, user_email, status) | Membership lookup (used by scopeResolver at every gate call) | Phase 4B prereq | Phase 4B |
| 28 | MGAQuarantineRecord | (master_general_agent_id, entity_type, status) | Quarantine triage and release | Phase 4B prereq | Phase 4B |
| 29 | TxQuoteCase | (master_general_agent_id, case_id) | TXQuote scoping | Phase 4B prereq | Phase 4B |
| 30 | EnrollmentMember | (master_general_agent_id, enrollment_window_id) | Enrollment member scoping | Phase 4B prereq | Phase 4B |

**Total indexes defined: 30**
**Indexes created during Phase 4A: 0** — environment requires Phase 4B controlled creation; all indexes are prerequisites for final backfill and must be created before Phase 4B begins
**Rule: No production backfill may run if any of the 30 required indexes is missing**

---

## 6. Dry-Run Migration Logic

**Implemented at:** `lib/mga/migration/dryRunEngine.js`

### Purpose

The dry-run engine computes proposed `master_general_agent_id` values for every record in every scoped entity group, without committing any changes to operational fields. Output is written to staging/reporting structures only (MGAMigrationBatch records with dry-run flag, or in-memory for reporting).

### Dry-run output per record

```javascript
{
  entity_type: string,
  record_id: string,
  current_mga_id: string | null,       // existing field value (null = not yet stamped)
  proposed_mga_id: string | null,       // computed proposed value (null = quarantine)
  source_parent_chain: string[],        // e.g. ['EmployerGroup:abc', 'MasterGroup:def', 'MGA:ghi']
  confidence_level: 'high' | 'medium' | 'low',
  is_deterministic: boolean,
  anomaly_detected: boolean,
  anomaly_class: string | null,         // from MGAQuarantineRecord anomaly_class enum
  quarantine_recommended: boolean,
  business_approval_required: boolean,
  rollback_marker: string,              // snapshot reference before any change
  validation_status: 'pass' | 'pending' | 'fail',
  dry_run_batch_id: string,
  dry_run_timestamp: string,
}
```

### Dry-run resolution algorithm

```
for each entity type in backfill order:
  for each record in entity:
    1. Check current master_general_agent_id
       → if non-null and valid: mark already_compliant; skip
       → if non-null but stale/invalid: flag as anomaly
    2. Resolve parent chain:
       → load parent record (e.g., BenefitCase for QuoteScenario)
       → if parent has resolved MGA: proposed = parent MGA; confidence = high; deterministic = true
       → if parent has null MGA: recurse up parent chain
       → if parent not found: anomaly_class = orphaned_record; quarantine_recommended = true
       → if multiple parents with different MGAs: anomaly_class = conflicting_parent_chain; quarantine_recommended = true
    3. Cross-check rules (where applicable):
       → CensusValidationResult: cross-check proposed MGA with CensusVersion MGA
       → scope_type entities: confirm scope_type before stamping
    4. Compute rollback_marker:
       → record current field value as before-state snapshot reference
    5. Write to dry-run output (not to operational record)
    6. Aggregate into reconciliation report
```

### Dry-run rules

- Dry-run MUST NOT update `master_general_agent_id` on any operational record
- Dry-run MUST NOT update `mga_migration_status` on any operational record (except to staging batch tracking)
- Dry-run MUST NOT remove any entity from `SCOPE_PENDING_ENTITY_TYPES`
- Dry-run output is written only to `MGAMigrationBatch` records with `dry_run_flag: true`
- Dry-run is idempotent and may be re-run multiple times without side effects
- Dry-run completion does not authorize Phase 4B

---

## 7. Anomaly Detection

**Implemented at:** `lib/mga/migration/anomalyDetector.js`

### Anomaly catalog

| Anomaly class | Description | Severity | Blocking | Detection method |
|---|---|---|---|---|
| orphaned_record | Record has no resolvable parent entity | P0 | YES — blocks final backfill | Walk parent chain; parent not found |
| conflicting_parent_chain | Record's parent chain leads to 2+ different MGAs | P0 | YES | Walk parent chain; compare MGA IDs at each level |
| missing_master_group_id | Scoped record has null master_group_id where required | P0 | YES | Field null check |
| missing_upstream_owner_mapping | MasterGroup has no approved MGA mapping | P0 | YES | Check mapping table; no approved mapping |
| invalid_duplicate_lineage | Two records claim the same unique parent slot | P0 | YES | Uniqueness constraint scan |
| cross_entity_mga_mismatch | Two related entities (e.g., CensusImportJob + CensusVersion) have different MGA IDs | P0 | YES | Cross-entity comparison |
| stale_mga_value | Record has master_general_agent_id set but the value does not match current parent chain | P1 | NO (warning) | Compare stored value to recomputed value |
| missing_scope_type_discriminator | Entity with scope_type field has null or invalid value | P1 | NO | Field null/enum check |
| unclassified_global_candidate | Record may be global-intentional but is not explicitly classified | P1 | NO | Heuristic scan (no operational field values; seeded records) |
| legacy_src_entities_path_risk | Record may have been created from src/entities/ schema rather than entities/ schema | P2 | NO | Detection heuristic; no field-level impact |
| multiple_mga_signal_candidates | Record has indirect signals pointing to 2+ MGAs; cannot auto-resolve | P1 | NO (requires business approval) | Multi-signal resolution failure |
| export_bundle_mixed_scope | An export/document bundle references records from 2+ MGAs | P0 | YES | Bundle manifest scan |
| notification_stale_link | Email/notification deep link points to a quarantined or moved record | P1 | NO | Link reauth validation |
| webhook_unresolved_ownership | Webhook event ownership cannot be resolved to a single MGA | P1 | NO (quarantine) | Webhook event metadata scan |
| audit_log_missing_context | Audit/activity record references a case_id or entity_id that no longer resolves | P2 | NO | Parent reference scan |
| help_activity_operational_unscoped | Help search/question/audit record has operational content markers but null MGA | P1 | NO | Content + MGA field scan |
| fake_default_mga_detected | master_general_agent_id is a known placeholder or default value rather than a real MGA ID | P0 | YES | Check against MasterGeneralAgent.id registry |

### Anomaly severity rules

| Severity | Definition | Effect on Phase 4B |
|---|---|---|
| P0 | Blocks final backfill; must be resolved or records quarantined before Phase 4B | Phase 4B cannot begin with any unresolved P0 anomalies |
| P1 | Requires remediation or business approval; does not block Phase 4B if documented and quarantine/approval is in place | Phase 4B may proceed with P1 anomalies if each has a documented resolution plan or is quarantined |
| P2 | Can be monitored or deferred | Does not block Phase 4B |

---

## 8. Quarantine Plan

**Implemented at:** `lib/mga/migration/quarantinePlan.js`

### Quarantine trigger conditions and rules

| Entity category | Quarantine condition | Record fields populated | Visibility rule | Release requirement | Approval role | Audit requirement | Blocks downstream | Blocks Phase 4B |
|---|---|---|---|---|---|---|---|---|
| MasterGroup | No approved MGA mapping after business review | mga_migration_status = 'quarantined', mga_migration_anomaly_class = missing_upstream_owner_mapping | Platform admin only | Business owner approval + new mapping | Business owner | YES — governance event | YES — all downstream records | YES if unresolved P0 |
| EmployerGroup | No resolvable MasterGroup parent | mga_migration_status = 'quarantined', mga_migration_anomaly_class = orphaned_record | Platform admin only | Parent MasterGroup identified and mapped | Migration owner | YES | YES — all cases | YES if P0 |
| BenefitCase | No resolvable EmployerGroup parent | Same | Platform admin only | Parent resolved | Migration owner | YES | YES — census/quote/enrollment | YES if P0 |
| Census entities | Orphan or cross-entity MGA mismatch | Same | Platform admin only | Parent resolved + consistency verified | Migration owner | YES | YES — downstream census chain | YES if P0 |
| TXQuote entities | No resolvable BenefitCase parent | Same | Platform admin only | Parent resolved | Migration owner | YES | YES — TXQuote flow | YES (TXQuote requires 100%) |
| Enrollment entities | No resolvable EnrollmentWindow parent | Same | Platform admin only | Parent resolved | Migration owner | YES | YES — enrollment links | YES if P0 |
| Document/file entities | Missing both case and employer parents | Same + file_url access revoked | Platform admin only | Parent resolved; file_url reviewed | Migration owner + compliance | YES | NO (file exists) | YES if P0 |
| Help/manual mga_scoped | Unclassifiable or no MGA signal | mga_migration_status = 'quarantined', mga_migration_anomaly_class = missing_upstream_owner_mapping | Platform admin only | Classification determined | Platform admin | YES | NO | NO |
| Help activity logs | Operational event with no actor MGA | Same | Platform admin only | Actor MGA resolved or classified as platform session | Platform admin | YES | NO | NO |
| Records with fake/default MGA | fake_default_mga_detected anomaly | Same | Platform admin only | Real MGA assigned via approved process | Migration owner + security | YES — security event | YES — all downstream | YES — P0 |
| Export bundles / mixed-scope artifacts | Multiple MGA records detected in single bundle | Bundle flag + quarantine notice | Platform admin only | Bundle regenerated from single-MGA source | Migration owner | YES | NO | YES — P0 |

### Quarantine enforcement rules

| Rule | Status |
|---|---|
| Quarantined records must not become user-visible | ENFORCED — scopeResolver returns QUARANTINE_DENIED for non-admin actors |
| Quarantined records must not appear in MGA dashboards | ENFORCED — service layer filters by mga_migration_status != 'quarantined' |
| Quarantined records must not be included in reports, search, exports, notifications | ENFORCED — Phase 3 services include quarantine filter |
| No record may be force-assigned to avoid quarantine | RULE — dry-run engine enforces: proposed_mga_id must be a real MGA or null (quarantine) |
| Quarantine release requires explicit approval | RULE — MGAQuarantineRecord.release_approval_status must be 'approved' |
| Quarantine release must be audited | RULE — createGovernanceAuditEvent() called on every release |

---

## 9. Reconciliation Report Design

**Implemented at:** `lib/mga/migration/reconciliationReport.js`

### Report structure

```
MGA Migration Reconciliation Report
====================================
Generated: <timestamp>
Dry-run batch ID: <batch_id>
MGA: <mga_id> (or ALL for platform admin)

SUMMARY
-------
Total entity types scanned: <n>
Total records scanned: <n>
Records already compliant (MGA stamped and valid): <n>
Records with deterministic mapping: <n>
Records requiring business approval: <n>
Records recommended for quarantine: <n>
Records blocked (pending parent resolution): <n>
Records excluded as global/platform-only: <n>
Records with conflicting scope (P0 anomalies): <n>
Records with missing parent chain (P0 anomalies): <n>
Records with stale path/entity issues (P2): <n>
Records with fake/default MGA detected (P0): <n>

P0 anomalies total: <n>
P1 anomalies total: <n>
P2 anomalies total: <n>

Overall dry-run status: PASS / FAIL (FAIL if P0 > 0)
Phase 4B readiness: READY / BLOCKED

ENTITY-LEVEL BREAKDOWN
-----------------------
[For each entity type:]
Entity: <entity_name>
  Total records: <n>
  Already compliant: <n>
  Deterministic mapping: <n>
  Business approval required: <n>
  Quarantine recommended: <n>
  P0 anomalies: <n>
  P1 anomalies: <n>
  P2 anomalies: <n>
  Acceptance threshold: <pct>%
  Threshold met: YES / NO
  Pass/fail: PASS / FAIL

MASTERGROUP MAPPING STATUS
---------------------------
Total MasterGroups: <n>
Automatic mapping: <n>
Inferred mapping (approved): <n>
Manual mapping (approved): <n>
Excluded (platform/global): <n>
Quarantined: <n>
Pending approval: <n>
100% deterministic: YES / NO

ROLLBACK READINESS
------------------
Rollback markers available: <n> / <total>
Before-state snapshots complete: YES / NO
Rollback readiness: READY / BLOCKED

ACCEPTANCE THRESHOLD SUMMARY
-----------------------------
[Per entity — see Section 10]
```

---

## 10. Acceptance Thresholds

Phase 4B final backfill requires ALL of the following thresholds to be met:

| # | Threshold | Requirement | Measurement | Blocking |
|---|---|---|---|---|
| 1 | MasterGroup mapping complete | 100% of MasterGroups have approved deterministic MGA mapping or are explicitly quarantined | Count: approved + quarantined = total | YES |
| 2 | Downstream operational records resolved | 100% of downstream records resolve through deterministic parent chain OR are quarantined | Count: deterministic + quarantined = total | YES |
| 3 | P0 anomalies resolved | 0 unresolved P0 anomalies | P0 anomaly count = 0 | YES |
| 4 | Mixed-scope artifacts resolved | 0 cross-MGA mixed-scope export/document/report bundles unresolved | Bundle P0 count = 0 | YES |
| 5 | No fake/default MGA assignments | 0 records with fake/default MGA values | fake_default_mga_detected count = 0 | YES |
| 6 | No missing migration status fields | 0 scoped entities missing mga_migration_status field | Field coverage = 100% | YES |
| 7 | All required indexes present | 0 of 30 required indexes missing before final backfill | Index creation confirmed = 30 | YES |
| 8 | Rollback markers available | 100% of records targeted for backfill have rollback marker (before-state snapshot) | Rollback marker count = backfill target count | YES |
| 9 | Reconciliation report generated and reviewed | Dry-run reconciliation report reviewed and signed off by migration owner | Report status = reviewed + signed | YES |
| 10 | Business approvals complete | All non-automatic MasterGroup mappings have business owner approval | pending_approval count = 0 | YES |
| 11 | TXQuote records resolved | 100% of TxQuoteCase records resolved (external transmission requires full resolution) | TxQuoteCase quarantined or approved = 100% | YES |
| 12 | Employee PII records resolved | ≥99% of EmployeeEnrollment records resolved; remainder quarantined with access links revoked | Enrollment resolved + quarantined = total | YES |
| 13 | Document file_url access reviewed | 100% of quarantined documents have file_url access reviewed and revoked | Doc quarantine review = 100% | YES |
| 14 | Dry-run passes with 0 P0 anomalies | Dry-run must show overall status = PASS | Dry-run overall status = PASS | YES |

---

## 11. Rollback and Containment Plan

**Implemented at:** `lib/mga/migration/rollbackPlan.js`

### Rollback triggers

| Trigger | Condition | Severity | Initiator |
|---|---|---|---|
| Cross-scope data leakage detected post-backfill | Any record visible to wrong MGA | P0 | Automated monitoring |
| RBAC matrix failure detected | User gains access outside their MGA | P0 | Automated monitoring |
| Migration reconciliation failure | Record count mismatch after backfill | P0 | Migration owner |
| Fake/default MGA assignment detected post-backfill | fake_default_mga_detected anomaly post Phase 4B | P0 | Automated |
| Document/link leakage | file_url or deep link accessible cross-MGA | P0 | Automated |
| TXQuote duplicate or external data leak | External transmit with wrong or mixed scope | P0 | TXQuote owner |
| Audit gap detected | Material operation with no audit record | P1 | Audit owner |
| Performance degradation beyond P95 threshold | Scoped queries exceed P95 baseline | P1 | Platform monitoring |
| Business approval revoked post-backfill | MasterGroup mapping approval withdrawn | P1 | Business owner |

### Rollback owners

| Role | Responsibility |
|---|---|
| Migration owner | Overall rollback decision; coordinates all teams |
| Domain owner (cases/census/quotes/enrollment/docs) | Domain-specific rollback execution |
| Security/scope reviewer | Cross-MGA leakage containment |
| TXQuote owner | TXQuote-specific rollback and external notification |
| Compliance officer | Document/PII rollback; regulatory notification if required |
| Platform admin | Flag/feature disablement; emergency off switch |
| Communications owner | User notification if access disrupted |

### Rollback steps

1. **Immediate:** Disable `mga.enabled` and `mga.scopedServices.enabled` feature flags → routes all service calls to disabled-safe state
2. **Containment:** Revoke all generated signed links and export bundle access
3. **Quarantine expansion:** Set `mga_migration_status = 'quarantined'` on all backfilled records via batch revert
4. **Batch rollback:** Use `mga_migration_batch_id` to identify all records backfilled in the failed batch; revert `master_general_agent_id` to before-state snapshot value
5. **Record-level rollback:** Use per-record rollback markers to revert individual fields
6. **TXQuote:** Pause all outbound TXQuote transmit/retry jobs; notify TXQuote owner
7. **Document/file:** Revoke file_url access tokens for any document affected by the rollback scope
8. **Audit:** Record rollback event as governance audit event with full before/after state
9. **Monitoring:** Hold system in rollback state for minimum 24-hour monitoring period before re-evaluation
10. **Escalation:** If rollback does not contain leakage within 1 hour → escalate to executive/platform admin for production freeze decision

### Migration batch ID behavior

- Every backfill run creates a unique `MGAMigrationBatch` record with a `batch_id`
- Every backfilled record stores `mga_migration_batch_id = batch_id`
- Rollback by batch: filter all records by `mga_migration_batch_id = <failed_batch_id>` → revert fields
- Rollback does not delete records; it reverts fields to before-state snapshot values
- Quarantine records created during failed batch are set to `mga_migration_status = 'quarantined'` on rollback

### Before/after snapshot requirement

- Every record targeted for backfill must have a before-state snapshot recorded before any field is written
- Snapshot must include: `record_id`, `entity_type`, `before_master_general_agent_id`, `before_mga_migration_status`, `snapshot_timestamp`, `dry_run_batch_id`
- Snapshots stored in `MGAMigrationBatch.snapshot_manifest` (or linked snapshot store)
- No backfill may proceed for a record without a confirmed snapshot

### Monitoring period

- Minimum monitoring period after Phase 4B: 48 hours before any Phase 5 approval discussion
- Metrics monitored: cross-MGA access attempts, STALE_SCOPE gate responses, P0 anomaly alerts, TXQuote transmission errors, document access errors

---

## 12. Feature Flag and Cutover Plan

**Implemented at:** `lib/mga/migration/featureFlagPlan.js`

### Migration state machine

| State | Flag values | Description |
|---|---|---|
| pre_migration | mga.enabled = OFF; mga.scopedServices.enabled = OFF; mga.ui.visible = OFF | Current state. All MGA features disabled. All entities fail-closed. |
| dry_run | mga.enabled = OFF; mga.dryRun.enabled = ON; mga.ui.visible = OFF | Phase 4A. Dry-run engine runs non-destructively. No user visibility. |
| backfill_in_progress | mga.enabled = OFF; mga.migration.backfillInProgress = ON; mga.ui.visible = OFF | Phase 4B. Indexes created. Backfill running. All scoped services still disabled for users. |
| post_backfill_validation | mga.enabled = OFF; mga.migration.readiness = 'validating'; mga.ui.visible = OFF | Phase 4B validation. Reconciliation report reviewed. Zero P0 anomalies confirmed. Scoped services still not user-visible. |
| mga_services_available | mga.enabled = ON; mga.scopedServices.enabled = ON; mga.ui.visible = OFF | Phase 5 internal. Scoped services wired but not user-visible. Internal QA only. |
| ui_pilot | mga.enabled = ON; mga.ui.visible = ON; mga.pilotAccess = [named pilots] | Phase 5/6. Pilot cohort access only. Full MGA feature set visible to pilots. |
| full_rollout | mga.enabled = ON; mga.ui.visible = ON; mga.pilotAccess = OFF | Phase 6+. Full production. |
| rollback | mga.enabled = OFF; mga.emergencyDisable = ON | Emergency. All MGA surfaces disabled immediately. |

### Cutover rules

| Rule | Enforcement |
|---|---|
| Feature flags must prevent partial rollout leakage | No single flag covers partial scope; all six core flags must be coordinated |
| Backfilled records must not become user-visible through MGA UI until Phase 5/6 approval | mga.ui.visible remains OFF until explicit Phase 5 approval |
| Services remain isolated from live UI until Phase 5/6 approval | mga.scopedServices.enabled remains OFF for live UI until Phase 5 wiring approval |
| Emergency disablement must revert all MGA surfaces within 60 seconds | mga.emergencyDisable = ON triggers immediate flag cascade |

### Current Phase 4A flag state

All flags: OFF / pre_migration state. No change from Phase 3.

---

## 13. Phase 4B Test Plan

**Implemented at:** `lib/mga/migration/phase4bTestPlan.js`

**Total Phase 4B tests defined: 25**

| Test ID | Test name | Entity / domain | Expected result | Required before Phase 4B | Execution status |
|---|---|---|---|---|---|
| P4B-T-01 | MasterGroup mapping completeness | MasterGroup / mapping | 100% of MasterGroups have approved mapping or quarantine | YES | Defined Only |
| P4B-T-02 | Downstream parent-chain propagation — BenefitCase | BenefitCase / cases | BenefitCase.master_general_agent_id = EmployerGroup.master_general_agent_id | YES | Defined Only |
| P4B-T-03 | Downstream parent-chain propagation — QuoteScenario | QuoteScenario / quotes | QuoteScenario.master_general_agent_id = BenefitCase.master_general_agent_id | YES | Defined Only |
| P4B-T-04 | Downstream parent-chain propagation — CensusImportJob | CensusImportJob / census | CensusImportJob.master_general_agent_id = BenefitCase.master_general_agent_id | YES | Defined Only |
| P4B-T-05 | Orphan detection — EmployerGroup | EmployerGroup / employers | EmployerGroup with no MasterGroup parent → quarantined; not backfilled | YES | Defined Only |
| P4B-T-06 | Orphan detection — BenefitCase | BenefitCase / cases | BenefitCase with no EmployerGroup parent → quarantined | YES | Defined Only |
| P4B-T-07 | Conflicting parent-chain quarantine | Any entity / all | Record with 2+ conflicting MGA parent signals → quarantined; not backfilled | YES | Defined Only |
| P4B-T-08 | Document artifact scope test | Document / documents | Document.master_general_agent_id = parent BenefitCase.master_general_agent_id | YES | Defined Only |
| P4B-T-09 | Export bundle mixed-scope detection | Proposal/Document/Export / documents | Bundle with records from 2+ MGAs → P0 anomaly; blocked | YES | Defined Only |
| P4B-T-10 | TXQuote record scope propagation | TxQuoteCase / txquote | TxQuoteCase.master_general_agent_id = parent BenefitCase.master_general_agent_id | YES | Defined Only |
| P4B-T-11 | Census import scope propagation | CensusImportJob, CensusImportAuditEvent, CensusValidationResult / census | All three inherit MGA from parent BenefitCase; CensusValidationResult cross-checks CensusVersion | YES | Defined Only |
| P4B-T-12 | Help/manual activity scope propagation | HelpSearchLog, HelpAIQuestionLog / help | Records from operational users carry MGA from MasterGeneralAgentUser; unauthenticated records have null MGA | YES | Defined Only |
| P4B-T-13 | Report snapshot scope propagation | HelpCoverageSnapshot / help | platform_global snapshots have null MGA; mga_scoped snapshots have MGA set | YES | Defined Only |
| P4B-T-14 | Notification/email deep-link scope propagation | Email function / notifications | Deep links validated against case/enrollment scope at send time; stale links fail closed | YES | Defined Only |
| P4B-T-15 | Webhook unresolved ownership quarantine | docuSignWebhook / webhooks | Webhook event with unresolvable owner → MGAQuarantineRecord created; no data written | YES | Defined Only |
| P4B-T-16 | Rollback marker availability | All backfill targets / migration | 100% of target records have before-state snapshot before any field is written | YES | Defined Only |
| P4B-T-17 | Migration batch reconciliation | MGAMigrationBatch / migration | All records backfilled in a batch carry matching mga_migration_batch_id; count matches batch manifest | YES | Defined Only |
| P4B-T-18 | No fake/default MGA assignment | All scoped entities / all | 0 records with proposed_mga_id that is not a valid MasterGeneralAgent.id | YES | Defined Only |
| P4B-T-19 | Fail-closed pending entity test — post-backfill | All 10 scope-pending entities | After Phase 4B backfill: if entity removed from SCOPE_PENDING_ENTITY_TYPES, scopeGate allows; if still pending, still fails closed | YES | Defined Only |
| P4B-T-20 | Post-backfill scopeGate test | BenefitCase / cases | Backfilled record with stamped MGA passes scopeGate for matching actor MGA; fails for mismatching | YES | Defined Only |
| P4B-T-21 | Audit metadata preservation | ActivityLog / audit | All material backfill operations produce audit records; no audit gap | YES | Defined Only |
| P4B-T-22 | Scope-type discriminator post-backfill | UserManual, HelpCoverageSnapshot, HelpAITrainingQueue / help | All records have scope_type set to platform_global or mga_scoped; no null values remain | YES | Defined Only |
| P4B-T-23 | MasterGeneralAgentUser index performance | MasterGeneralAgentUser / mga | scopeResolver membership lookup completes in < 100ms with index in place | YES | Defined Only |
| P4B-T-24 | Tenant propagation from MasterGroup | Tenant / rates | Tenant.master_general_agent_id = parent MasterGroup.master_general_agent_id after backfill | YES | Defined Only |
| P4B-T-25 | Enrollment PII access revoked for quarantined records | EmployeeEnrollment / enrollment | Quarantined enrollment records return QUARANTINE_DENIED to non-admin actors; access links revoked | YES | Defined Only |

---

## 14. Non-Destructive Confirmation

| Rule | Status |
|---|---|
| Final production migration/backfill NOT run | CONFIRMED |
| Final MGA ownership NOT assigned to live records | CONFIRMED — dry-run logic writes only to staging/batch structures |
| Records NOT moved | CONFIRMED |
| Records NOT deleted | CONFIRMED |
| Current user permissions NOT altered | CONFIRMED |
| MGA UI NOT exposed | CONFIRMED |
| Frontend reads NOT replaced | CONFIRMED |
| Navigation NOT changed | CONFIRMED |
| Phase 3 services NOT activated in live flows | CONFIRMED |
| TXQuote production behavior NOT changed | CONFIRMED |
| Reporting production behavior NOT changed | CONFIRMED |
| Document production behavior NOT changed | CONFIRMED |
| Quarantined records NOT made visible | CONFIRMED |
| Fail-closed status NOT removed from migration-pending entities | CONFIRMED — all 10 remain in SCOPE_PENDING_ENTITY_TYPES |

---

## 15. Phase 4A Exit Criteria

| Exit criterion | Status |
|---|---|
| Canonical documents confirmed | PASS |
| Mini-pass gate-list correction verified as isolated and non-user-visible | PASS |
| All migration entities mapped | PASS — 15 groups, 58 entity types |
| MasterGroup-to-MGA mapping plan completed | PASS — Section 3 |
| Downstream backfill order completed | PASS — 20 ordered steps, Section 4 |
| Deferred index plan completed | PASS — 30 indexes defined; all deferred to Phase 4B as prerequisites |
| Dry-run migration logic created or defined | PASS — lib/mga/migration/dryRunEngine.js |
| Anomaly detection logic created or defined | PASS — lib/mga/migration/anomalyDetector.js; 17 anomaly classes |
| Quarantine plan completed | PASS — Section 8; all entity categories covered |
| Reconciliation report format completed | PASS — lib/mga/migration/reconciliationReport.js |
| Quantified acceptance thresholds completed | PASS — 14 thresholds, Section 10 |
| Rollback and containment plan completed | PASS — lib/mga/migration/rollbackPlan.js; Section 11 |
| Feature flag and cutover plan completed | PASS — lib/mga/migration/featureFlagPlan.js; Section 12 |
| Phase 4B test plan completed | PASS — 25 tests defined |
| No final production migration/backfill executed | CONFIRMED |
| No fake/default MGA values assigned | CONFIRMED |
| No UI/navigation/service activation behavior changed | CONFIRMED |
| No TXQuote/reporting/document production behavior changed | CONFIRMED |
| No end-user MGA functionality enabled | CONFIRMED |
| No unresolved P0 migration-readiness blocker | CONFIRMED — 0 P0 blockers |

**All 20 Phase 4A exit criteria: PASS**

---

## 16. Migration-Readiness Risk Register

### P0 risks (block Phase 4B)

| Risk ID | Description | Domain | Mitigation | Status |
|---|---|---|---|---|
| P4A-P0-01 | MasterGroup has no approved MGA mapping at Phase 4B time | MasterGroup / mapping | Business approval workflow defined; quarantine rule enforced | Documented; pending business approval process |
| P4A-P0-02 | Orphaned BenefitCase records with no EmployerGroup parent | Cases | Orphan detection in dry-run engine; quarantine before Phase 4B | Documented |
| P4A-P0-03 | Cross-entity MGA mismatch between CensusImportJob and CensusVersion | Census | Cross-check in dry-run engine; quarantine on mismatch | Documented |
| P4A-P0-04 | Export/document bundle containing records from 2+ MGAs | Documents / exports | Bundle scan in anomaly detector; P0 flag; block bundle | Documented |
| P4A-P0-05 | TXQuote records with no resolvable parent BenefitCase | TXQuote | 100% TXQuote resolution required; quarantine if unresolvable | Documented |
| P4A-P0-06 | Required index missing before Phase 4B backfill | All entities | All 30 indexes must be created before Phase 4B begins | Documented; blocked until Phase 4B index creation step |
| P4A-P0-07 | Rollback marker missing for a backfill target record | All entities | Dry-run engine enforces: no snapshot = no backfill for that record | Documented |
| P4A-P0-08 | fake_default_mga_detected anomaly found in dry-run | All entities | Dry-run engine blocks any fake MGA from being proposed | Documented |

### P1 risks (require remediation or approval; do not block Phase 4B if managed)

| Risk ID | Description | Domain | Mitigation |
|---|---|---|---|
| P4A-P1-01 | stale_mga_value on records that were manually or incorrectly stamped before Phase 4 | All entities | Dry-run detects mismatch; recompute from authoritative parent chain |
| P4A-P1-02 | Agency classification not resolved before Phase 4B | Agency / employers | Business decision required; document exclusion or mapping |
| P4A-P1-03 | Inferred MasterGroup mappings require migration owner review | MasterGroup | Review workflow in mapping plan |
| P4A-P1-04 | Help/manual activity records with operational content markers but null MGA | Help | Classification logic in dry-run; quarantine or resolve |
| P4A-P1-05 | Webhook unresolved ownership records accumulate | Webhooks | Quarantine via MGAQuarantineRecord; review before Phase 5 |
| P4A-P1-06 | Audit/activity records referencing deleted or moved entities | Audit | Acceptable to leave with null parent; classify as platform-admin event |
| P4A-P1-07 | Performance degradation during dry-run due to missing indexes | All entities | Indexes created in Phase 4B before backfill; dry-run may be slower |

### P2 risks (monitor; do not block Phase 4B)

| Risk ID | Description | Domain | Mitigation |
|---|---|---|---|
| P4A-P2-01 | src/entities/ stale paths not cleaned up before Phase 5 | All | Cleanup documented as controlled later task |
| P4A-P2-02 | Dry-run performance on large record sets | All | Batched processing in dryRunEngine.js |
| P4A-P2-03 | Business approval process takes longer than expected | MasterGroup mapping | Phase 4B start depends on approval completion; no timeline pressure from tech side |

---

## 17. Required Output

| Item | Value |
|---|---|
| **Confirmation Phase 4A limited to migration readiness, index preparation, dry-run planning, anomaly detection, quarantine planning, reconciliation design, rollback planning, and validation planning** | **CONFIRMED** |
| **Confirmation no final production migration/backfill run** | **CONFIRMED** |
| **Confirmation no Phase 5–8 work started** | **CONFIRMED** |
| **Confirmation no UI, navigation, frontend-read replacement, permissions, TXQuote, reporting, document, service activation, or end-user MGA behavior changes** | **CONFIRMED** |
| Phase 4A report path | `docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md` |
| Migration entities mapped | 58 entity types across 15 groups |
| MasterGroup mapping plan status | COMPLETE — Section 3 |
| Downstream backfill order status | COMPLETE — 20 ordered steps |
| Indexes created | 0 |
| Indexes defined and deferred | 30 (all Phase 4B prerequisites) |
| Dry-run logic status | COMPLETE — lib/mga/migration/dryRunEngine.js |
| Anomaly detection status | COMPLETE — lib/mga/migration/anomalyDetector.js; 17 anomaly classes |
| Quarantine plan status | COMPLETE — Section 8 |
| Reconciliation report design status | COMPLETE — lib/mga/migration/reconciliationReport.js |
| Acceptance thresholds status | COMPLETE — 14 thresholds |
| Rollback/containment plan status | COMPLETE — lib/mga/migration/rollbackPlan.js |
| Feature flag/cutover plan status | COMPLETE — lib/mga/migration/featureFlagPlan.js |
| Phase 4B test plan status | COMPLETE — 25 tests defined |
| P0 migration-readiness risks | 8 (all documented; all mitigated or blocked pending Phase 4B prerequisites) |
| P1 migration-readiness risks | 7 |
| P2 migration-readiness risks | 3 |
| Blockers before Phase 4B | P4A-P0-01 through P4A-P0-08 — all are Phase 4B prerequisites, not Phase 4A blockers |
| Phase 4A exit criteria | ALL 20 PASS |
| System ready for Phase 4A completion audit | YES |

---

**Do not proceed to Phase 4B final backfill, Phase 5 UI wiring, or service activation without explicit approval.**

*End of MGA Phase 4A — Migration Readiness, Index Preparation, and Dry-Run Backfill Planning Report.*
*Report path: `docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md`*