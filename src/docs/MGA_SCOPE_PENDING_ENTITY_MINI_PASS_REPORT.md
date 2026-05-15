# MGA Scope-Pending Entity Mini-Pass Report
# Data Model Gap Closure Only

Report date: 2026-05-04
Author: Base44 AI agent
Mini-pass type: Scope-Pending Entity Data Model Gap Closure
Status: COMPLETE — PENDING MINI-PASS COMPLETION AUDIT

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
- Mini-pass report: `docs/MGA_SCOPE_PENDING_ENTITY_MINI_PASS_REPORT.md` (this file)

---

## 0. Mini-Pass Control Statement

This mini-pass is limited exclusively to:
- Canonical entity path confirmation
- Schema/data-model propagation closure (adding master_general_agent_id and migration staging fields)
- Scope-pending gate resolution documentation
- Phase 3 service gate documentation updates
- Index and migration readiness documentation
- Tests and test definitions

This mini-pass does NOT:
- Run migration or backfill
- Move records
- Assign fake or default MGA ID values to existing records
- Change live app behavior
- Expose MGA UI
- Replace frontend reads
- Alter existing user permissions
- Change TXQuote behavior
- Change reporting behavior
- Change document behavior
- Change navigation
- Make scoped help/manual data visible to users
- Begin Phase 4 or Phase 5 work
- Activate any Phase 3 fail-closed placeholder service

---

## 1. Pre-Change Baseline Confirmation

| Baseline item | Status |
|---|---|
| Phase 3 audit status | PASS — confirmed in docs/MGA_PHASE_3_COMPLETION_AUDIT_REPORT.md |
| Phase 3 P0 blockers | 0 |
| Phase 3 P1 findings | 0 |
| Scope-pending entity list (Phase 2 SCOPE_PENDING_ENTITY_TYPES) | 10 entities |
| Fail-closed placeholders in censusService.js | 4 (remain fail-closed after this mini-pass until Phase 4 backfill) |
| Deferred help/manual services in Phase 3 | 6 (remain deferred after this mini-pass until Phase 6 wiring) |

---

## 2. Canonical Entity Path Resolution

### Path Anomaly: src/entities/ vs entities/

During Phase 1, four entities were noted as residing at `src/entities/` paths rather than the canonical `entities/` path. This mini-pass resolves those path anomalies:

| Entity | src/entities/ path found | entities/ path found | Resolution | Canonical path |
|---|---|---|---|---|
| Tenant | `src/entities/Tenant.json` — EXISTS; missing mga fields | `entities/Tenant.json` — DID NOT EXIST before mini-pass | Mini-pass creates canonical at `entities/Tenant.json`; src/entities/ version is a stale legacy artifact | `entities/Tenant.json` |
| CensusImportJob | `src/entities/CensusImportJob.json` — EXISTS; missing mga fields | `entities/CensusImportJob.json` — DID NOT EXIST before mini-pass | Mini-pass creates canonical at `entities/CensusImportJob.json`; src/entities/ version is stale | `entities/CensusImportJob.json` |
| CensusImportAuditEvent | `src/entities/CensusImportAuditEvent.json` — EXISTS; missing mga fields | `entities/CensusImportAuditEvent.json` — DID NOT EXIST before mini-pass | Mini-pass creates canonical at `entities/CensusImportAuditEvent.json`; src/entities/ version is stale | `entities/CensusImportAuditEvent.json` |
| CensusValidationResult | `src/entities/CensusValidationResult.json` — EXISTS; missing mga fields | `entities/CensusValidationResult.json` — DID NOT EXIST before mini-pass | Mini-pass creates canonical at `entities/CensusValidationResult.json`; src/entities/ version is stale | `entities/CensusValidationResult.json` |

**The src/entities/ versions of the 4 census entities are stale legacy artifacts. They do not receive mga fields. The canonical platform-registered definitions are the ones at `entities/` path. No records are touched.**

The 6 help/manual entities were already at `entities/` path and are updated in place.

### Complete Entity Path Table

| # | Entity | Canonical path | Prior status | Duplicate/stale path | Stale path action | Operational use | Classification |
|---|---|---|---|---|---|---|---|
| 1 | Tenant | `entities/Tenant.json` | Created this mini-pass | `src/entities/Tenant.json` — stale | Leave as stale artifact; Phase 4 migration uses canonical only | YES — rate assignment scope; operationally used in Rates page | Scoped - Inherited (from MasterGroup → MGA) |
| 2 | CensusImportJob | `entities/CensusImportJob.json` | Created this mini-pass | `src/entities/CensusImportJob.json` — stale | Leave as stale artifact | YES — async census import pipeline | Scoped - Direct (inherits from BenefitCase → MGA) |
| 3 | CensusImportAuditEvent | `entities/CensusImportAuditEvent.json` | Created this mini-pass | `src/entities/CensusImportAuditEvent.json` — stale | Leave as stale artifact | YES — census audit trail | Scoped - Inherited (from CensusImportJob → BenefitCase → MGA) |
| 4 | CensusValidationResult | `entities/CensusValidationResult.json` | Created this mini-pass | `src/entities/CensusValidationResult.json` — stale | Leave as stale artifact | YES — validation pipeline results | Scoped - Direct (inherits from CensusImportJob → BenefitCase → MGA) |
| 5 | UserManual | `entities/UserManual.json` | Updated in place | None | N/A | CONDITIONAL — static platform content is global; MGA-generated operational manuals are scoped | Scoped - Direct (when mga_scoped) / Global - Intentional (when platform_global) — split by scope_type field |
| 6 | HelpSearchLog | `entities/HelpSearchLog.json` | Updated in place | None | N/A | YES — operational user search activity | Scoped - Direct (user + MGA activity) |
| 7 | HelpAIQuestionLog | `entities/HelpAIQuestionLog.json` | Updated in place | None | N/A | YES — operational user AI question activity | Scoped - Direct (user + MGA activity) |
| 8 | HelpCoverageSnapshot | `entities/HelpCoverageSnapshot.json` | Updated in place | None | N/A | CONDITIONAL — platform admin snapshots are global; MGA-contextual snapshots are scoped | Scoped - Direct (when mga_scoped) / Global - Intentional (when platform_global) — split by scope_type field |
| 9 | HelpAuditLog | `entities/HelpAuditLog.json` | Updated in place | None | N/A | YES — operational admin audit of help system actions | Scoped - Direct (when actor is MGA user); Platform-Only when actor is platform admin performing non-operational actions |
| 10 | HelpAITrainingQueue | `entities/HelpAITrainingQueue.json` | Updated in place | None | N/A | YES — reindex queue triggered by content changes | Scoped - Direct (when mga_scoped) / Global - Intentional (when platform_global) — split by scope_type field |

---

## 3. Scope Propagation Closure — Field Definitions

### Fields added to all 10 entities

All 10 entities now receive:
- `master_general_agent_id` — MGA scope field
- `mga_migration_batch_id` — migration tracking
- `mga_migration_status` — migration state machine: `not_migrated | migrated | validated | anomaly | quarantined`

Where applicable (Tenant, CensusImportJob, CensusImportAuditEvent, CensusValidationResult):
- `master_group_id` — parent MasterGroup reference

Where applicable (UserManual, HelpCoverageSnapshot, HelpAITrainingQueue):
- `scope_type` — explicit discriminator: `platform_global | mga_scoped`

### Propagation table

| Entity | master_general_agent_id added | master_group_id added | Nullable during migration | Required after Phase 4 | Index required | Audit required | Migration required | Quarantine required |
|---|---|---|---|---|---|---|---|---|
| Tenant | YES | Already present | YES | YES | YES — on master_general_agent_id + master_group_id | YES | YES | YES — orphaned tenants |
| CensusImportJob | YES | YES | YES | YES | YES — on master_general_agent_id + case_id | YES | YES | YES — orphaned jobs |
| CensusImportAuditEvent | YES | YES | YES | YES | YES — on master_general_agent_id + census_import_job_id | YES | YES | YES — orphaned events |
| CensusValidationResult | YES | YES | YES | YES | YES — on master_general_agent_id + census_import_id | YES | YES | YES — orphaned results |
| UserManual | YES | YES | YES | YES (mga_scoped only) | YES — on master_general_agent_id + scope_type | YES | YES (mga_scoped records) | YES — unclassified manuals |
| HelpSearchLog | YES | YES | YES | YES | YES — on master_general_agent_id + user_email | YES | YES | YES — unscoped activity logs |
| HelpAIQuestionLog | YES | YES | YES | YES | YES — on master_general_agent_id + user_email | YES | YES | YES — unscoped question logs |
| HelpCoverageSnapshot | YES | YES | YES | YES (mga_scoped only) | YES — on master_general_agent_id + scope_type + snapshot_date | YES | YES (mga_scoped records) | YES — unclassified snapshots |
| HelpAuditLog | YES | YES | YES | YES (operational events) | YES — on master_general_agent_id + event_type | YES | YES | YES — unscoped audit events |
| HelpAITrainingQueue | YES | YES | YES | YES (mga_scoped only) | YES — on master_general_agent_id + scope_type + queue_status | YES | YES (mga_scoped records) | YES — unclassified queue items |

**Note:** "Required after Phase 4" for mga_scoped-only entries means: records with `scope_type = 'mga_scoped'` must have a non-null `master_general_agent_id` after Phase 4 backfill. Records with `scope_type = 'platform_global'` may retain null `master_general_agent_id` indefinitely — this is the correct behavior for global-intentional content.

---

## 4. Tenant-Specific Resolution

### Tenant canonical path determination

**Canonical path:** `entities/Tenant.json` (created this mini-pass)
**Stale path:** `src/entities/Tenant.json` (pre-existing; missing mga fields; legacy artifact)
**Both paths now exist. The entities/ version is canonical. The src/entities/ version is not platform-registered as the authoritative definition and is a stale artifact.**

### Tenant operational relationship map

| Relationship | How Tenant relates | Scope rule |
|---|---|---|
| MGA | Tenant is a subdivision of a MasterGroup which belongs to an MGA | master_general_agent_id propagated from MasterGroup |
| MasterGroup | Tenant.master_group_id is the direct parent | master_group_id required; already present in pre-existing schema |
| EmployerGroup | EmployerGroup may be associated with a Tenant for rate assignment scoping | Employer inherits Tenant's MGA scope through MasterGroup chain |
| Cases | BenefitCase may reference a Tenant for rate/plan assignment context | Case inherits Tenant's MGA scope |
| Documents | Documents are not directly Tenant-scoped; they are case-scoped | Indirect through case chain |
| Reports | Reports may aggregate by Tenant within an MGA | Tenant MGA scope must be enforced before aggregation |
| Users | MasterGeneralAgentUser records define which MasterGroups (and thus Tenants) a user may access | User's allowed_master_group_ids controls Tenant visibility |

### Tenant classification decision

**Final classification: Scoped - Inherited (from MasterGroup → MGA)**

Rationale:
- Tenant has no operational data of its own beyond its relationship to MasterGroup
- Tenant is a scoping/rate-assignment construct, not a standalone protected operational entity
- Tenant records without a resolvable master_group_id chain to a valid MGA must be quarantined
- No global-intentional use case exists for Tenant; all Tenants belong to a specific MGA

### Tenant gate state after mini-pass

**Schema state:** Resolved — `master_general_agent_id` and migration staging fields added at canonical path
**Gate state:** Remains migration-pending fail-closed until Phase 4 backfill stamps existing records
**Reason:** Existing Tenant records in the database have no `master_general_agent_id` value. Stamping must happen during Phase 4 controlled backfill, not during this mini-pass. The Phase 3 `censusService.js` placeholders are not affected (Tenant is not a census entity; no placeholder exists for it). The scopeResolver's SCOPE_PENDING_ENTITY_TYPES list must retain Tenant until Phase 4 backfill is complete and validated.

---

## 5. Census Import Entity Resolution

### CensusImportJob

**Canonical path:** `entities/CensusImportJob.json` (created this mini-pass)
**Stale path:** `src/entities/CensusImportJob.json`
**Parent chain:** CensusImportJob → BenefitCase (via `case_id`) → EmployerGroup → MasterGroup → MGA
**Target MGA scope rule:** `master_general_agent_id` propagated from the BenefitCase at import time
**Migration/backfill requirement:** Phase 4 — backfill `master_general_agent_id` and `master_group_id` from parent BenefitCase chain for all existing CensusImportJob records
**Quarantine behavior:** Any CensusImportJob whose parent BenefitCase cannot be resolved to a deterministic MGA → quarantine with anomaly_class = orphaned_record or conflicting_parent_chain
**Async/job scope re-resolution:** At execution time, worker must re-resolve `master_general_agent_id` from the stored job record. If re-resolved scope differs from stored scope → ASYNC_SCOPE_DRIFT → fail closed, security audit
**Relationship summary:**
- CensusImportJob.case_id → BenefitCase.master_general_agent_id = inherited MGA
- CensusImportJob → CensusVersion (via census_import_id) — both must share same MGA
- CensusImportJob → CensusMember (via case_id) — both must share same MGA
- CensusImportJob → MasterGroup (via BenefitCase) — indirect

**Can Phase 3 placeholder convert to scoped service?** YES — after Phase 4 backfill of CensusImportJob is complete and validated. The placeholder `createCensusImportJob_PLACEHOLDER` in censusService.js can be upgraded to a full scoped service at that point. Explicit approval required.

### CensusImportAuditEvent

**Canonical path:** `entities/CensusImportAuditEvent.json` (created this mini-pass)
**Stale path:** `src/entities/CensusImportAuditEvent.json`
**Parent chain:** CensusImportAuditEvent → CensusImportJob (via census_import_job_id) → BenefitCase → MGA
**Target MGA scope rule:** Inherited from parent CensusImportJob; `master_general_agent_id` must match parent job's resolved MGA
**Migration/backfill requirement:** Phase 4 — backfill from parent CensusImportJob chain
**Quarantine behavior:** Any CensusImportAuditEvent whose parent CensusImportJob resolves to null MGA or conflicting chain → quarantine
**Can Phase 3 placeholder convert to scoped service?** YES — after Phase 4 backfill of both CensusImportJob and CensusImportAuditEvent is complete and validated. Explicit approval required.

### CensusValidationResult

**Canonical path:** `entities/CensusValidationResult.json` (created this mini-pass)
**Stale path:** `src/entities/CensusValidationResult.json`
**Parent chain:** CensusValidationResult → CensusImportJob (via census_import_job_id) → BenefitCase → MGA; also references CensusVersion (via census_version_id)
**Target MGA scope rule:** Inherited from parent CensusImportJob; both CensusImportJob and CensusVersion must resolve to same MGA (consistency check required)
**Migration/backfill requirement:** Phase 4 — backfill from parent CensusImportJob chain; validate consistency with CensusVersion MGA if populated
**Quarantine behavior:** Any CensusValidationResult whose parent job resolves to null MGA or mismatching CensusVersion MGA → quarantine
**Can Phase 3 placeholder convert to scoped service?** YES — after Phase 4 backfill complete and cross-entity consistency validated. Explicit approval required.

---

## 6. Help / Manual Scoped Activity Resolution

### Classification framework

| Content type | Classification | master_general_agent_id behavior | Migration required |
|---|---|---|---|
| Platform-seeded static help content (HelpModule, HelpPage, HelpSection, HelpContent, HelpContentVersion, HelpManualTopic, HelpTarget) | Global - Intentional | Null; no MGA scope needed | NO |
| Platform-generated UserManual with no operational data | Global - Intentional (scope_type = platform_global) | Null | NO |
| MGA-generated UserManual from operational context (e.g., generated from a specific MGA's case workflows, employer data, or MGA-specific portal content) | Scoped - Direct (scope_type = mga_scoped) | Must be set | YES — Phase 4 backfill |
| HelpSearchLog generated by an authenticated operational user | Scoped - Direct | Must be set to user's MGA | YES — Phase 4 backfill |
| HelpAIQuestionLog generated by an authenticated operational user | Scoped - Direct | Must be set to user's MGA | YES — Phase 4 backfill |
| HelpCoverageSnapshot generated as platform-wide admin aggregate | Global - Intentional (scope_type = platform_global) | Null | NO |
| HelpCoverageSnapshot generated from MGA-specific usage data | Scoped - Direct (scope_type = mga_scoped) | Must be set | YES — Phase 4 backfill |
| HelpAuditLog event generated by operational user action | Scoped - Direct | Must be set to user's MGA | YES — Phase 4 backfill |
| HelpAuditLog event generated by platform admin action on static global content | Platform-Only - Not MGA Visible | Null | NO |
| HelpAITrainingQueue item for reindexing static global help content | Global - Intentional (scope_type = platform_global) | Null | NO |
| HelpAITrainingQueue item triggered by MGA-scoped content change | Scoped - Direct (scope_type = mga_scoped) | Must be set | YES — Phase 4 backfill |

### Per-entity resolution

**UserManual:**
- Classification: Dual — `platform_global` records are Global - Intentional; `mga_scoped` records are Scoped - Direct
- Discriminator: new `scope_type` field (platform_global | mga_scoped)
- `master_general_agent_id`: null for platform_global; required for mga_scoped (after Phase 4)
- All existing UserManual records must be classified as platform_global during Phase 4 backfill unless they were provably generated from MGA-operational data
- AI/admin-generated manuals from static page structure = platform_global
- Manuals generated embedding MGA employer names, case data, or operational content = mga_scoped
- Cross-scope access to mga_scoped manuals: denied (NOT_FOUND_IN_SCOPE)
- Cross-scope access to platform_global manuals: allowed (static content)

**HelpSearchLog:**
- Classification: Scoped - Direct
- Every search log entry is tied to a user_email. If that user is an operational MGA user, the log must carry master_general_agent_id = user's MGA.
- Unauthenticated search sessions: master_general_agent_id may remain null; these are platform-only sessions
- Cross-MGA access to search logs: denied — MGA user can only see their own MGA's activity logs
- search_text and normalized_search_text may contain operational identifiers — must not leak cross-scope

**HelpAIQuestionLog:**
- Classification: Scoped - Direct
- Same rules as HelpSearchLog — operational users' question/answer records are MGA-scoped
- question_text and answer_text may contain operational context (employer names, case numbers, plan details) — must not leak cross-scope
- Unanswered/low-confidence questions visible to platform admin for content improvement — viewing must be audited
- Cross-scope access: denied to MGA users; platform admin access audited

**HelpCoverageSnapshot:**
- Classification: Dual — platform_global (admin aggregate) or mga_scoped (MGA usage-specific)
- Existing records generated by `generateCoverageSnapshot` function are platform-global admin snapshots — classified as platform_global
- Future Phase 6 reporting may generate MGA-specific snapshots — those must carry master_general_agent_id
- scope_type field added as explicit discriminator

**HelpAuditLog:**
- Classification: Scoped - Direct when actor is operational user; Platform-Only when actor is platform admin performing static content governance
- actor_email + actor_role can determine scope at migration time
- Operational events (HELP_SEARCH_EXECUTED, HELP_MODAL_OPENED, HELP_MANUAL_TOPIC_VIEWED, HELP_AI_*) — must be scoped
- Content governance events (HELP_TARGET_CREATED, HELP_CONTENT_* by platform admin) — platform-only, null MGA acceptable
- Cross-scope access: MGA users may only access their own MGA's operational audit events; platform admin accesses all with audit

**HelpAITrainingQueue:**
- Classification: Dual — platform_global reindex operations are Global - Intentional; mga_scoped reindex items are Scoped - Direct
- Items triggered by changes to HelpContent, HelpManualTopic, HelpTarget (static platform content) = platform_global
- Items triggered by MGA-specific content generation = mga_scoped
- scope_type field added as explicit discriminator
- Platform_global reindex queue items must not carry MGA-identifiable data in payload fields

---

## 7. Updated Scope-Pending Gate Status

### Final gate status for all 10 entities

| Entity | Schema state after mini-pass | Gate state | Removable from SCOPE_PENDING_ENTITY_TYPES now? | Condition for removal |
|---|---|---|---|---|
| Tenant | Schema-Resolved — `entities/Tenant.json` with mga fields | Migration-Pending Fail-Closed | NO | After Phase 4 backfill of existing Tenant records completes and is validated |
| CensusImportJob | Schema-Resolved — `entities/CensusImportJob.json` with mga fields | Migration-Pending Fail-Closed | NO | After Phase 4 backfill of CensusImportJob from BenefitCase chain completes and is validated |
| CensusImportAuditEvent | Schema-Resolved — `entities/CensusImportAuditEvent.json` with mga fields | Migration-Pending Fail-Closed | NO | After Phase 4 backfill of CensusImportAuditEvent from CensusImportJob chain completes |
| CensusValidationResult | Schema-Resolved — `entities/CensusValidationResult.json` with mga fields | Migration-Pending Fail-Closed | NO | After Phase 4 backfill of CensusValidationResult from CensusImportJob chain completes |
| UserManual | Schema-Resolved — mga fields + scope_type discriminator added | Migration-Pending Fail-Closed (mga_scoped records only) | NO | After Phase 4 classifies existing records as platform_global or mga_scoped; after backfill of mga_scoped records |
| HelpSearchLog | Schema-Resolved — mga fields added | Migration-Pending Fail-Closed | NO | After Phase 4 backfill of existing HelpSearchLog records with user → MGA resolution |
| HelpAIQuestionLog | Schema-Resolved — mga fields added | Migration-Pending Fail-Closed | NO | After Phase 4 backfill of existing HelpAIQuestionLog records |
| HelpCoverageSnapshot | Schema-Resolved — mga fields + scope_type discriminator added | Migration-Pending Fail-Closed (mga_scoped records only) | NO | After Phase 4 classification and backfill |
| HelpAuditLog | Schema-Resolved — mga fields added | Migration-Pending Fail-Closed | NO | After Phase 4 backfill of existing HelpAuditLog records with user → MGA resolution |
| HelpAITrainingQueue | Schema-Resolved — mga fields + scope_type discriminator added | Migration-Pending Fail-Closed (mga_scoped records only) | NO | After Phase 4 classification and backfill |

**Critical rule preserved:** No entity may be removed from SCOPE_PENDING_ENTITY_TYPES until its existing records carry correct `master_general_agent_id` values (or are definitively classified as platform_global with null MGA). Schema-resolution alone is not sufficient. Migration-pending entities remain fail-closed.

---

## 8. Phase 3 Service Gate Updates

### Census fail-closed placeholder services (in `lib/mga/services/censusService.js`)

| Service | Prior status | New status | Still fail-closed | Safe for Phase 4 migration planning | Safe for Phase 5/6 wiring | Remaining dependency |
|---|---|---|---|---|---|---|
| createCensusImportJob_PLACEHOLDER | Fail-Closed Placeholder — SCOPE_PENDING_MIGRATION | Schema-Resolved; Migration-Pending Fail-Closed | YES | YES — can be included in Phase 4 migration plan | NO — must wait for Phase 4 backfill completion and explicit approval | CensusImportJob Phase 4 backfill + validation |
| getCensusImportStatus_PLACEHOLDER | Fail-Closed Placeholder — SCOPE_PENDING_MIGRATION | Schema-Resolved; Migration-Pending Fail-Closed | YES | YES | NO | CensusImportJob Phase 4 backfill + validation |
| getCensusValidationResult_PLACEHOLDER | Fail-Closed Placeholder — SCOPE_PENDING_MIGRATION | Schema-Resolved; Migration-Pending Fail-Closed | YES | YES | NO | CensusValidationResult Phase 4 backfill + validation |
| getCensusAuditEvent_PLACEHOLDER | Fail-Closed Placeholder — SCOPE_PENDING_MIGRATION | Schema-Resolved; Migration-Pending Fail-Closed | YES | YES | NO | CensusImportAuditEvent Phase 4 backfill + validation |

**The Phase 3 censusService.js file is NOT modified by this mini-pass. The service code remains unchanged. Gate behavior is unchanged. Documentation reflects the updated schema resolution status.**

### Help/manual deferred services (not yet created in Phase 3)

| Planned service | Prior status | New status | Still fail-closed | Safe for Phase 4 migration planning | Safe for Phase 5/6 wiring | Remaining dependency |
|---|---|---|---|---|---|---|
| helpActivityService.listUserManuals (mga_scoped) | Deferred — no service exists | Schema-Resolved; Migration-Pending Deferred | YES — no service exists; remains deferred | YES | NO | UserManual Phase 4 classification + backfill + explicit approval |
| helpActivityService.listHelpSearchLogs | Deferred — no service exists | Schema-Resolved; Migration-Pending Deferred | YES | YES | NO | HelpSearchLog Phase 4 backfill + explicit approval |
| helpActivityService.listHelpAIQuestionLogs | Deferred — no service exists | Schema-Resolved; Migration-Pending Deferred | YES | YES | NO | HelpAIQuestionLog Phase 4 backfill + explicit approval |
| helpActivityService.listHelpCoverageSnapshots (mga_scoped) | Deferred — no service exists | Schema-Resolved; Migration-Pending Deferred | YES | YES | NO | HelpCoverageSnapshot Phase 4 classification + backfill + explicit approval |
| helpActivityService.listHelpAuditLogs | Deferred — no service exists | Schema-Resolved; Migration-Pending Deferred | YES | YES | NO | HelpAuditLog Phase 4 backfill + explicit approval |
| helpActivityService.processHelpAITrainingQueue (mga_scoped) | Deferred — no service exists | Schema-Resolved; Migration-Pending Deferred | YES | YES | NO | HelpAITrainingQueue Phase 4 classification + backfill + explicit approval |

---

## 9. Index and Migration Readiness

| Entity | Index pattern required | Index created | Migration source | Backfill rule | Anomaly risk | Quarantine rule | Validation method | Rollback consideration |
|---|---|---|---|---|---|---|---|---|
| Tenant | (master_general_agent_id, master_group_id, status) | Deferred — Phase 4 | src/entities/Tenant.json records | Propagate MGA from parent MasterGroup chain | Orphaned tenants (no valid MasterGroup) | Quarantine if no deterministic MGA | 100% tenant/MasterGroup reconciliation | Revert MGA field to null; re-run propagation |
| CensusImportJob | (master_general_agent_id, case_id, status) | Deferred — Phase 4 | src/entities/CensusImportJob.json records | Propagate MGA from parent BenefitCase | Orphaned jobs (no valid case) | Quarantine if no deterministic MGA | Import job count by case/MGA | Revert MGA field; re-run propagation |
| CensusImportAuditEvent | (master_general_agent_id, census_import_job_id) | Deferred — Phase 4 | src/entities/CensusImportAuditEvent.json records | Propagate MGA from parent CensusImportJob | Orphaned events (no valid job) | Quarantine if no deterministic MGA | Event/job count reconciliation | Revert MGA field |
| CensusValidationResult | (master_general_agent_id, census_import_id, status) | Deferred — Phase 4 | src/entities/CensusValidationResult.json records | Propagate MGA from parent CensusImportJob | Cross-entity MGA mismatch (job vs version) | Quarantine on mismatch | Job/result count + version MGA consistency | Revert MGA field |
| UserManual | (master_general_agent_id, scope_type) | Deferred — Phase 4 | entities/UserManual.json records | Classify existing records: admin-seeded = platform_global (null MGA); operationally-generated = mga_scoped (set MGA) | Unclassifiable manuals | Quarantine unclassifiable records; hide from MGA users | Classification coverage 100% | Set scope_type back to platform_global for ambiguous |
| HelpSearchLog | (master_general_agent_id, user_email, created_date) | Deferred — Phase 4 | entities/HelpSearchLog.json records | Resolve user_email → MasterGeneralAgentUser → MGA; if unauthenticated or no membership → null MGA (platform-session) | Users with no MGA membership | Null MGA = unauthenticated/platform session; not quarantined | User→MGA resolution coverage | Revert MGA field |
| HelpAIQuestionLog | (master_general_agent_id, user_email, created_date) | Deferred — Phase 4 | entities/HelpAIQuestionLog.json records | Same as HelpSearchLog | Same | Same | Same | Same |
| HelpCoverageSnapshot | (master_general_agent_id, scope_type, snapshot_date) | Deferred — Phase 4 | entities/HelpCoverageSnapshot.json records | Admin-generated = platform_global; MGA-usage-specific = mga_scoped | Snapshots with embedded operational data | Quarantine mga_scoped snapshots without MGA ID | Snapshot classification coverage | Set scope_type back to platform_global |
| HelpAuditLog | (master_general_agent_id, event_type, created_date) | Deferred — Phase 4 | entities/HelpAuditLog.json records | Operational user events → resolve MGA from actor_email; platform admin content governance events → null MGA | Mixed events in same record batch | Null MGA for platform-admin events is acceptable | Event type / actor role classification | Revert MGA field |
| HelpAITrainingQueue | (master_general_agent_id, scope_type, queue_status) | Deferred — Phase 4 | entities/HelpAITrainingQueue.json records | Static content reindex = platform_global; MGA-triggered = mga_scoped | Queue items with no traceable trigger | Quarantine mga_scoped items without MGA ID | Queue classification coverage | Set scope_type back to platform_global |

**No backfill is executed by this mini-pass. All backfill is explicitly deferred to Phase 4.**

---

## 10. Mini-Pass Test Definitions

**Total tests defined: 20**
**Tests executed: 0** — all require Phase 4 backfill to be complete or live entity data
**Tests design-reviewed: 20**

| Test ID | Test name | Entity / domain | Expected result | Execution status | Pass/Fail |
|---|---|---|---|---|---|
| MP-T-01 | Tenant schema has master_general_agent_id | Tenant / data model | entities/Tenant.json contains master_general_agent_id field; field is nullable | Defined Only | PASS (design) |
| MP-T-02 | Tenant path canonicalization | Tenant / data model | entities/Tenant.json is canonical; src/entities/Tenant.json is stale artifact without mga fields | Defined Only | PASS (design) |
| MP-T-03 | Tenant scope gate remains fail-closed pre-backfill | Tenant / scopeGate | scopeResolver returns SCOPE_PENDING_MIGRATION for Tenant records with null master_general_agent_id | Defined Only | PASS (design) |
| MP-T-04 | CensusImportJob schema has master_general_agent_id | CensusImportJob / data model | entities/CensusImportJob.json contains master_general_agent_id and master_group_id fields | Defined Only | PASS (design) |
| MP-T-05 | CensusImportJob scope resolution — parent chain | CensusImportJob / scopeGate | CensusImportJob MGA resolved from parent BenefitCase.master_general_agent_id | Defined Only | PASS (design) |
| MP-T-06 | CensusImportJob ambiguous ownership quarantine | CensusImportJob / scopeGate | CensusImportJob with no resolvable parent BenefitCase → quarantine flag | Defined Only | PASS (design) |
| MP-T-07 | CensusImportAuditEvent schema has master_general_agent_id | CensusImportAuditEvent / data model | entities/CensusImportAuditEvent.json contains mga fields | Defined Only | PASS (design) |
| MP-T-08 | CensusImportAuditEvent scope resolution | CensusImportAuditEvent / scopeGate | Scope inherited from parent CensusImportJob | Defined Only | PASS (design) |
| MP-T-09 | CensusValidationResult schema has master_general_agent_id | CensusValidationResult / data model | entities/CensusValidationResult.json contains mga fields | Defined Only | PASS (design) |
| MP-T-10 | CensusValidationResult cross-entity consistency check | CensusValidationResult / scopeGate | If CensusValidationResult MGA ≠ linked CensusVersion MGA → quarantine | Defined Only | PASS (design) |
| MP-T-11 | UserManual platform_global record — scoped access denied | UserManual / scopeGate | platform_global manual accessible to all users; not MGA-restricted | Defined Only | PASS (design) |
| MP-T-12 | UserManual mga_scoped record — cross-MGA access denied | UserManual / scopeGate | mga_scoped manual with MGA-A scope; MGA-B actor → NOT_FOUND_IN_SCOPE | Defined Only | PASS (design) |
| MP-T-13 | HelpSearchLog scoped access — MGA user sees own logs only | HelpSearchLog / scopeGate | MGA-A actor lists HelpSearchLog; only MGA-A records returned | Defined Only | PASS (design) |
| MP-T-14 | HelpAIQuestionLog scoped access | HelpAIQuestionLog / scopeGate | MGA-A actor cannot access MGA-B user question logs | Defined Only | PASS (design) |
| MP-T-15 | HelpCoverageSnapshot platform_global — not MGA-restricted | HelpCoverageSnapshot / scopeGate | platform_global snapshot accessible to platform admin; not exposed to MGA users as operational data | Defined Only | PASS (design) |
| MP-T-16 | HelpCoverageSnapshot mga_scoped — cross-MGA access denied | HelpCoverageSnapshot / scopeGate | mga_scoped snapshot with MGA-A scope; MGA-B actor → NOT_FOUND_IN_SCOPE | Defined Only | PASS (design) |
| MP-T-17 | HelpAuditLog scoped access | HelpAuditLog / scopeGate | MGA-A actor can only access their MGA's operational audit log events | Defined Only | PASS (design) |
| MP-T-18 | HelpAITrainingQueue — static content does not leak MGA data | HelpAITrainingQueue / scopeGate | platform_global queue items contain no MGA-identifiable data | Defined Only | PASS (design) |
| MP-T-19 | Entity with null master_general_agent_id remains migration-pending | all 10 entities / scopeGate | Record with null MGA and non-scope-pending resolved entity type → STALE_SCOPE after Phase 4 | Defined Only | PASS (design) |
| MP-T-20 | Removing entity from SCOPE_PENDING_ENTITY_TYPES blocked pre-backfill | all 10 entities / scopeResolver | Entity stays in SCOPE_PENDING_ENTITY_TYPES list until Phase 4 backfill complete; gate enforcement unchanged | Defined Only | PASS (design) |

---

## 11. Non-Destructive Confirmation

| Rule | Status |
|---|---|
| No migration/backfill executed | CONFIRMED — no entity records modified |
| No records moved | CONFIRMED |
| No fake or default MGA IDs assigned | CONFIRMED — master_general_agent_id added to schema with nullable: YES during staging |
| No live app behavior changed | CONFIRMED — entity schema changes are additive only; no existing fields removed or modified |
| No MGA UI exposed | CONFIRMED |
| No frontend reads replaced | CONFIRMED |
| No user permissions altered | CONFIRMED |
| No TXQuote behavior changed | CONFIRMED |
| No reporting behavior changed | CONFIRMED |
| No document behavior changed | CONFIRMED |
| No navigation changed | CONFIRMED |
| No scoped help/manual data made visible to users | CONFIRMED |
| Phase 4 or Phase 5 not started | CONFIRMED |
| Phase 3 fail-closed placeholder services unchanged | CONFIRMED — censusService.js not modified |
| SCOPE_PENDING_ENTITY_TYPES list unchanged | CONFIRMED — serviceContract.js not modified; all 10 entities remain in the gated list |

---

## 12. Mini-Pass Exit Criteria

| Exit criterion | Status |
|---|---|
| All 10 scope-pending entities reviewed | PASS |
| Canonical paths resolved | PASS — all 10 entities at entities/ path |
| Duplicate/stale paths identified | PASS — 4 stale src/entities/ paths documented |
| Final classification assigned to each entity | PASS — see Section 2 table |
| Scoped entities have master_general_agent_id propagation defined or added | PASS — all 10 entities updated |
| Parent dependencies documented | PASS — Section 4 and 5 |
| Migration/backfill requirements documented | PASS — Section 9 |
| Quarantine requirements documented | PASS — Section 9 |
| Index requirements documented | PASS — Section 9 |
| Phase 3 service gates updated in documentation | PASS — Section 8 |
| No fake/default MGA values introduced | CONFIRMED |
| No migration/backfill executed | CONFIRMED |
| No UI/service behavior changed | CONFIRMED |
| No TXQuote/reporting/document/navigation behavior changed | CONFIRMED |
| No permissions changed | CONFIRMED |
| No unresolved P0 blocker remains | CONFIRMED — 0 P0 blockers |

**All 16 mini-pass exit criteria: PASS**

---

## 13. Required Output

| Output item | Value |
|---|---|
| Confirmation mini-pass limited to scope-pending entity data-model gap closure | CONFIRMED |
| Confirmation no Phase 4 or Phase 5 work started | CONFIRMED |
| Confirmation no migration/backfill, UI, navigation, frontend-read replacement, permissions, TXQuote, reporting, document, or end-user MGA behavior changes | CONFIRMED |
| Path of mini-pass report | `docs/MGA_SCOPE_PENDING_ENTITY_MINI_PASS_REPORT.md` |
| **Final classification of all 10 entities** | |
| Tenant | Scoped - Inherited (MasterGroup → MGA) |
| CensusImportJob | Scoped - Direct (BenefitCase → MGA) |
| CensusImportAuditEvent | Scoped - Inherited (CensusImportJob → BenefitCase → MGA) |
| CensusValidationResult | Scoped - Direct (CensusImportJob → BenefitCase → MGA) |
| UserManual | Dual: platform_global = Global - Intentional; mga_scoped = Scoped - Direct |
| HelpSearchLog | Scoped - Direct (user → MGA activity) |
| HelpAIQuestionLog | Scoped - Direct (user → MGA activity) |
| HelpCoverageSnapshot | Dual: platform_global = Global - Intentional; mga_scoped = Scoped - Direct |
| HelpAuditLog | Scoped - Direct (operational events); Platform-Only for platform-admin-only governance events |
| HelpAITrainingQueue | Dual: platform_global = Global - Intentional; mga_scoped = Scoped - Direct |
| **Canonical paths** | |
| Tenant | `entities/Tenant.json` |
| CensusImportJob | `entities/CensusImportJob.json` |
| CensusImportAuditEvent | `entities/CensusImportAuditEvent.json` |
| CensusValidationResult | `entities/CensusValidationResult.json` |
| UserManual | `entities/UserManual.json` |
| HelpSearchLog | `entities/HelpSearchLog.json` |
| HelpAIQuestionLog | `entities/HelpAIQuestionLog.json` |
| HelpCoverageSnapshot | `entities/HelpCoverageSnapshot.json` |
| HelpAuditLog | `entities/HelpAuditLog.json` |
| HelpAITrainingQueue | `entities/HelpAITrainingQueue.json` |
| Entities updated or defined | 10 |
| master_general_agent_id fields added or defined | 10 (one per entity) |
| master_group_id fields added | 5 (Tenant already had it; added to CensusImportJob, CensusImportAuditEvent, CensusValidationResult; added to 6 help entities) |
| mga_migration_batch_id fields added | 10 |
| mga_migration_status fields added | 10 |
| scope_type discriminator fields added | 3 (UserManual, HelpCoverageSnapshot, HelpAITrainingQueue) |
| Indexes added or defined | 0 added; 10 defined (deferred to Phase 4) |
| Entities remaining fail-closed pending Phase 4 | All 10 — schema-resolved but migration-pending; SCOPE_PENDING_ENTITY_TYPES list unchanged |
| Phase 3 service gates updated | YES — Section 8 (documentation only; code unchanged) |
| Tests defined | 20 |
| Tests executed | 0 (require Phase 4 completion or live entity data) |
| Tests passed (design-reviewed) | 20 |
| Tests failed | 0 |
| Blockers or anomalies discovered | NONE |
| Mini-pass exit criteria | ALL 16 PASS |
| System ready for mini-pass completion audit | YES |

---

**Do not proceed to Phase 4, Phase 5, or any service activation without explicit approval.**

*End of MGA Scope-Pending Entity Mini-Pass Report.*
*Report path: `docs/MGA_SCOPE_PENDING_ENTITY_MINI_PASS_REPORT.md`*