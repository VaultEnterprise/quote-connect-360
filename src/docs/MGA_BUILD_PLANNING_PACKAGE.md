# MGA Build Planning Package

## 1. Architecture Baseline Confirmation

Certified architecture status: **GO**.

Canonical source architecture document path: `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`.

Path verification note: the process previously referenced both `docs/MGA ENTERPRISE ARCHITECTURE PACKAGE` and `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`. The canonical source of truth is `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`. The build process must use that file only. Revision Round 1 and Revision Round 2 content must not be moved, overwritten, or split during build execution.

Baseline confirmation:
- Revision Round 1 included: **YES**
- Revision Round 2 included: **YES**
- Universal protected scope gate included: **YES**
- Final entity classification table included: **YES**
- Scoped service conformance matrix included: **YES**
- Cross-scope edge case closure included: **YES**
- Validation addendum included: **YES**

## 2. Build Principles

Implementation must follow these non-negotiable rules:

1. No protected operation executes without scope resolution.
2. No direct frontend entity reads in protected domains.
3. All protected UI data loads must use scoped services.
4. All sensitive writes must use scoped service contracts.
5. Cross-MGA access fails closed.
6. Every material action writes audit events.
7. Document metadata, thumbnails, previews, signed links, exports, reports, and notifications are protected the same as source records.
8. Async jobs, webhooks, retries, and scheduled jobs must re-resolve scope before execution.
9. No implementation shortcut may weaken the certified architecture.

## 3. Recommended Implementation Phases

## Phase 0 — Baseline and Safety Preparation

Plan:
- Confirm canonical architecture document.
- Inventory current entities, pages, functions, workflows, integrations, automations, and direct entity reads.
- Identify protected domains.
- Identify existing frontend direct reads and mutations that must be replaced.
- Create an implementation tracking checklist.
- Define feature flag and staged rollout strategy.
- Define rollback approach for every future phase.

Exit criteria:
- Architecture source of truth confirmed.
- Existing app inventory complete.
- Protected domains identified.
- Direct-read replacement plan complete.
- Feature flag and rollback approach documented.

## Phase 1 — Data Model and Scope Foundation

Plan:
- Implement `MasterGeneralAgent`.
- Implement MGA membership/user mapping.
- Add `master_general_agent_id` fields according to the final entity classification table.
- Define entity propagation rules.
- Add scope indexes.
- Add migration staging fields where needed.
- Add quarantine records.
- Establish audit foundations.

Exit criteria:
- Scope model supports the certified architecture.
- All scoped entities are identified for migration.
- No schema path contradicts the entity classification table.
- Quarantine and audit foundations are ready before protected data migration.

## Phase 2 — Canonical Scope Resolution and Authorization Layer

Plan:
- Implement canonical scope resolver.
- Implement role and permission resolver.
- Implement universal protected scope gate.
- Implement fail-closed behavior.
- Implement platform admin support rules.
- Implement read-only impersonation.
- Add break-glass governance placeholder for future write-capable support actions, disabled by default.
- Add audit correlation IDs.

Exit criteria:
- No protected service can execute without scope.
- Cross-MGA denial behavior is defined and testable.
- Impersonation behavior matches the certified policy.
- Audit correlation is available for multi-step operations.

## Phase 3 — Scoped Service Layer

Plan scoped services for:
- MGA management
- MasterGroup management
- cases
- census
- quotes
- TXQuote
- enrollment
- documents/files
- signed links
- reports
- dashboards
- search
- notifications
- exports
- webhooks
- background jobs
- audit logs
- help/manual activity where scoped

Exit criteria:
- Each protected service conforms to the certified contract matrix.
- No protected domain relies on frontend-only filtering.
- Idempotency and concurrency rules are applied where required.
- Cross-scope denial and audit behavior are verified at service level.

## Phase 4 — Migration and Backfill

Plan:
- Execute dry-run migration.
- Map MasterGroups to MGAs.
- Propagate scope downstream.
- Detect orphaned and conflicting records.
- Quarantine unresolved records.
- Produce reconciliation report.
- Enforce acceptance thresholds.
- Define rollback triggers.
- Define cutover plan.
- Define post-migration monitoring.

Exit criteria:
- Dry run passes thresholds.
- Business mapping approvals complete.
- No unresolved P0 anomalies.
- Rollback path is executable.
- Quarantined records are excluded from operational workflows.

## Phase 5 — MGA UI, Navigation, and Onboarding

Plan:
- MGA signup/onboarding
- MGA dashboard
- MGA detail page
- MGA MasterGroups page
- MGA cases page
- MGA quote pipeline
- MGA census workflows
- MGA documents page
- MGA reporting
- MGA users
- MGA settings
- MGA audit log
- role-based navigation visibility

Exit criteria:
- All protected page loads use scoped services.
- No direct entity reads remain in protected screens.
- Navigation visibility matches the RBAC matrix.
- UI cannot expose actions that backend services deny.

## Phase 6 — Documents, Reports, Search, Notifications, and Real-Time Hardening

Plan:
- document previews
- thumbnails
- signed links
- exports
- report snapshots
- cached dashboard scope keys
- global search
- autocomplete
- snippets
- notifications
- email deep links
- real-time subscriptions
- event streams

Exit criteria:
- No document-derived metadata leaks cross-scope.
- Search, autocomplete, and snippets are scope-safe.
- Notifications and deep links re-authorize on access.
- Real-time events are scoped before delivery.
- Report and dashboard caches are scope-keyed and invalidated on scope changes.

## Phase 7 — Testing, Validation, and Certification

Plan test execution for:
- RBAC matrix
- service contract conformance
- cross-MGA denial
- migration reconciliation
- document access
- signed links
- exports
- reporting accuracy
- search leakage
- notification/deep-link authorization
- real-time event leakage
- async job scope re-resolution
- TXQuote retry/idempotency
- performance benchmarks
- audit completeness

Exit criteria:
- 100% protected service conformance.
- 100% RBAC matrix pass.
- Zero cross-scope leakage.
- Performance targets met or formally remediated.
- Audit completeness validated.

## Phase 8 — Controlled Rollout

Plan:
- internal admin rollout
- pilot MGA rollout
- limited production release
- broader release
- monitoring dashboards
- incident response
- rollback windows
- post-release audit review

Exit criteria:
- No unresolved P0 issues.
- Monitoring active.
- Support procedures ready.
- Production release approved.

## 4. Dependency Map

Hard dependencies:
- Phase 0 must complete before all implementation phases.
- Phase 1 depends on Phase 0.
- Phase 2 depends on Phase 1 because authorization requires finalized scope fields and membership model.
- Phase 3 depends on Phase 2 because services must use the canonical resolver and protected scope gate.
- Phase 4 depends on Phase 1 and Phase 2 because migration requires scope fields and deterministic validation.
- Phase 5 depends on Phase 3 because UI work cannot safely begin until scoped services exist.
- Phase 6 depends on Phase 3 and relevant Phase 4 migration readiness because reports/search/documents require scope-safe access paths.
- Phase 7 depends on Phases 1 through 6.
- Phase 8 depends on Phase 7 certification.

Dependency rules:
- UI work cannot safely begin until scoped services exist.
- Migration cannot finalize until entity classification and scope fields are implemented.
- Reports, search, and documents cannot be released until scope-safe access paths are implemented.
- TXQuote workflows cannot go live until idempotency, audit, and cross-scope validation pass.
- No phase may introduce direct protected reads as a temporary shortcut.

## 5. Implementation Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Legacy direct frontend reads | Cross-scope leakage | Inventory all reads in Phase 0; replace protected reads with scoped services before UI rollout |
| Incomplete entity propagation | Inconsistent scope enforcement | Use final entity classification table as migration checklist; validate every downstream entity |
| Migration anomalies | Incorrect ownership or inaccessible records | Dry run, anomaly classification, quarantine, approval workflow, rollback triggers |
| Performance degradation from scoped queries | Slow pages/reports | Add indexes, benchmark P95 targets, async reports over 3 seconds |
| Report cache leakage | Cross-MGA data exposure | Scope-key every cache and invalidate on scope changes |
| Document metadata leakage | Filename/thumbnail/preview exposure | Treat metadata as protected content and authorize before rendering |
| Notification/deep-link leakage | Link possession bypass | Re-authenticate and re-authorize every deep link click |
| Async job scope drift | Jobs operate on stale scope | Persist job scope and re-resolve before execution |
| Admin/support misuse | Overbroad access | Read-only impersonation by default, audited super-admin access, break-glass disabled |
| TXQuote retry duplication | Duplicate transmissions | Idempotency keys, retry state tracking, audit correlation |
| RBAC drift | UI/backend mismatch | Backend is authority; validate full role/action matrix |
| Audit gaps | Incomplete traceability | Audit every material action with correlation IDs |

## 6. Acceptance Gates

Hard gate rule:

No phase may proceed if it introduces or preserves a known P0 scope, RBAC, audit, migration, or service-contract violation.

Phase gates:
- Phase 0 gate: complete inventory, canonical document confirmed, protected domain list approved.
- Phase 1 gate: scope schema plan matches certified entity classification.
- Phase 2 gate: protected scope gate and fail-closed authorization are testable.
- Phase 3 gate: scoped services conform to the contract matrix.
- Phase 4 gate: dry-run migration passes thresholds and unresolved records are quarantined.
- Phase 5 gate: protected UI uses scoped services only.
- Phase 6 gate: documents, reports, search, notifications, and real-time channels pass leakage tests.
- Phase 7 gate: full validation suite passes.
- Phase 8 gate: production rollout approved with monitoring and rollback procedures active.

## 7. Build Readiness Decision

Build planning status: **READY**.

Blockers before Phase 0: **None**, subject to confirming no duplicate conflicting architecture file exists.

Blockers before Phase 1:
- Phase 0 inventory must be complete.
- Protected domains and direct-read replacement plan must be approved.
- Feature flag and rollback plan must be documented.

Recommended first implementation task:
- Begin Phase 0 with canonical document confirmation and a full inventory of entities, pages, functions, workflows, and protected direct frontend reads.

Confirmation:
- No code has been written.
- No schema changes have been made.
- No UI changes have been made.
- No behavior changes have been made.

---

# Revision Round 1 — Executable Implementation-Control Plan

This revision supersedes any earlier high-level phase descriptions where more detail is required. It remains planning-only and does not authorize code, schema, UI, service, entity, database, or behavior changes.

## A. Standard Phase Template Applied to Phases 0–8

## Phase 0 — Baseline and Safety Preparation

### Objective
Create a complete factual baseline of the current app before implementation begins, with no code changes and no behavior changes.

### Scope
Architecture source confirmation, current-state inventory, protected-domain identification, direct-read/direct-mutation discovery, migration candidate discovery, rollout planning, rollback planning, and baseline test snapshot planning.

### Out of scope
Schema changes, service creation, UI changes, migration execution, entity updates, data backfill, feature rollout, and Phase 1 implementation.

### Dependencies
Certified architecture document: `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`; canonical build planning document: `docs/MGA_BUILD_PLANNING_PACKAGE.md`.

### Major tasks
- Confirm canonical document paths.
- Create Current Entity Inventory.
- Create Current Page Inventory.
- Create Current Function / Service Inventory.
- Create Direct Frontend Read / Mutation Inventory.
- Classify protected domains.
- Create Migration Candidate Inventory.
- Create Existing Document / File Access Inventory.
- Create Existing Report / Search / Notification / Event Path Inventory.
- Create Implementation Tracking Checklist.
- Define feature flag / rollout strategy.
- Define rollback strategy.
- Capture baseline test snapshot plan.

### Required deliverables
- `Current Entity Inventory`
- `Current Page Inventory`
- `Current Function / Service Inventory`
- `Direct Frontend Read / Mutation Inventory`
- `Protected Domain Register`
- `Migration Candidate Inventory`
- `Document / File Access Inventory`
- `Report / Search / Notification / Event Path Inventory`
- `Implementation Tracking Checklist`
- `Feature Flag / Rollout Strategy`
- `Rollback Strategy`
- `Baseline Test Snapshot Plan`

### Validation requirements
- Every protected domain has an owner, source inventory entry, and remediation phase.
- Every direct protected frontend read/mutation is recorded.
- Every existing function/service is classified as protected or not protected.
- Every known document/report/search/notification/event path is inventoried.
- No implementation task begins during Phase 0.

### Rollback / containment considerations
No production rollback should be needed because Phase 0 is planning/inventory only. Containment action for accidental implementation work: stop work, revert any non-document change, log the deviation, and re-run the Phase 0 gate.

### Exit criteria
- current entity inventory complete
- current page inventory complete
- current function/service inventory complete
- all direct frontend reads/mutations in protected domains identified
- protected domains classified
- migration candidate inventory complete
- document/file access paths inventoried
- report/search/notification/event paths inventoried
- implementation tracking checklist populated
- feature flag and rollout strategy documented
- rollback strategy documented
- baseline test snapshot complete
- zero unresolved P0 planning gaps

### Approval gate
Phase 0 may complete only when all exit criteria are marked PASS by the build owner and security/scope reviewer.

## Phase 1 — Data Model and Scope Foundation

### Objective
Prepare the data model foundation needed for certified MGA scoping.

### Scope
MGA entities, membership mapping, `master_general_agent_id` propagation fields, indexes, audit foundations, staging fields, and quarantine records.

### Out of scope
UI rollout, frontend refactors, production migration cutover, and replacing application workflows.

### Dependencies
Phase 0 PASS; completed entity and migration candidate inventories.

### Major tasks
- Define `MasterGeneralAgent` model.
- Define MGA membership/user mapping.
- Map scope fields to all Scoped - Direct entities.
- Define inherited scope paths for Scoped - Inherited artifacts.
- Define indexes for scoped query paths.
- Define quarantine record structure.
- Define audit foundations and correlation fields.

### Required deliverables
- Scope schema implementation checklist
- Entity propagation checklist
- Indexing plan
- Quarantine data model plan
- Audit foundation plan

### Validation requirements
- All scoped entities from the certified classification table are covered.
- No schema path contradicts certified entity classification.
- Index plan covers protected list/detail/search/report paths.

### Rollback / containment considerations
Schema rollback plan must distinguish additive field rollback from data rollback. Any partially added scope field must remain non-authoritative until Phase 2 gate passes.

### Exit criteria
- scope model supports certified architecture
- all scoped entities identified for migration
- no classification contradiction
- indexing plan complete
- audit/quarantine foundations planned
- zero unresolved P0 data-model gaps

### Approval gate
Proceed only after schema plan is reviewed against the certified entity classification table.

## Phase 2 — Canonical Scope Resolution and Authorization Layer

### Objective
Create the mandatory authorization foundation used by all protected services.

### Scope
Canonical scope resolver, role/permission resolver, universal protected scope gate, fail-closed behavior, platform admin rules, read-only impersonation, audit correlation IDs.

### Out of scope
Feature UI, broad service migration, data migration cutover.

### Dependencies
Phase 1 PASS; scope fields and membership strategy approved.

### Major tasks
- Define canonical scope resolver behavior.
- Define RBAC permission resolver.
- Define universal gate integration pattern.
- Define fail-closed outcomes.
- Define platform admin and read-only support behavior.
- Define audit event shape and correlation ID requirements.

### Required deliverables
- Scope resolver design
- Permission resolver design
- Universal gate checklist
- Impersonation control checklist
- Audit correlation plan

### Validation requirements
- Cross-MGA denial returns standardized failure.
- Missing/conflicting/stale scope fails closed.
- Impersonation is read-only by default.
- Audit event required for allow, deny, and blocked attempts.

### Rollback / containment considerations
Gate rollout must be feature-flagged. If unexpected denial occurs, contain by disabling newly gated surfaces, not by bypassing authorization globally.

### Exit criteria
- no protected service can execute without scope design
- cross-MGA denial behavior defined
- impersonation behavior matches certified policy
- audit correlation defined
- zero unresolved P0 authorization gaps

### Approval gate
Proceed only after security/scope reviewer signs off on fail-closed resolver behavior.

## Phase 3 — Scoped Service Layer

### Objective
Replace protected direct access patterns with scoped service contracts.

### Scope
Scoped services for MGA, MasterGroup, cases, census, quotes, TXQuote, enrollment, documents/files, signed links, reports, dashboards, search, notifications, exports, webhooks, background jobs, audit logs, and scoped help/manual activity.

### Out of scope
Full UI conversion before services exist, production migration finalization, uncontrolled direct frontend reads.

### Dependencies
Phase 2 PASS.

### Major tasks
- Map each protected operation to a scoped service.
- Define request/response/error contracts.
- Add idempotency where required.
- Add concurrency controls where required.
- Add audit requirements.
- Define cross-scope denial behavior.

### Required deliverables
- Scoped service replacement matrix
- Service contract conformance checklist
- Idempotency/concurrency checklist
- Protected operation audit checklist

### Validation requirements
- 100% protected services conform to contract matrix.
- No protected domain relies on frontend-only filtering.
- Cross-scope requests fail closed.

### Rollback / containment considerations
Services must be introduced behind feature flags and route-level adoption. Containment: revert affected protected surface to disabled state, not unscoped direct access.

### Exit criteria
- every protected service mapped
- idempotency/concurrency assigned where required
- audit requirements assigned
- zero unresolved P0 service-contract gaps

### Approval gate
Proceed only after service conformance review passes.

## Phase 4 — Migration and Backfill

### Objective
Safely assign existing records to MGA scope and quarantine unresolved anomalies.

### Scope
Dry-run migration, MasterGroup-to-MGA mapping, downstream propagation, orphan/conflict detection, quarantine handling, reconciliation, rollback triggers, cutover planning, monitoring.

### Out of scope
UI release and production cutover before dry-run thresholds pass.

### Dependencies
Phase 1 and Phase 2 PASS; Phase 3 service paths available for validation.

### Major tasks
- Execute dry-run migration plan.
- Validate business-approved MasterGroup-to-MGA mapping.
- Detect orphaned records and conflicting parent chains.
- Quarantine unresolved records.
- Generate reconciliation report.
- Confirm rollback path.

### Required deliverables
- Dry-run migration report
- Mapping approval register
- Anomaly/quarantine report
- Reconciliation report
- Rollback runbook
- Cutover plan

### Validation requirements
- 100% MasterGroups mapped or blocked.
- 100% protected operational entities scoped or quarantined.
- 0 unresolved P0 anomalies.
- Reconciliation thresholds pass.

### Rollback / containment considerations
Rollback must restore pre-migration data state or disable migrated surfaces while preserving quarantine/audit records.

### Exit criteria
- dry-run migration reconciliation passed
- business mapping approvals complete
- no unresolved P0 anomalies
- rollback path confirmed executable

### Approval gate
Proceed only after migration owner, security reviewer, and business owner approve dry-run results.

## Phase 5 — MGA UI, Navigation, and Onboarding

### Objective
Introduce MGA-facing UI only after scoped service paths exist.

### Scope
MGA onboarding, dashboard, detail, MasterGroups, cases, quote pipeline, census workflows, documents, reporting, users, settings, audit log, and role-based navigation.

### Out of scope
Any protected UI data load using direct entity reads.

### Dependencies
Phase 3 PASS; relevant Phase 4 migration readiness for displayed data.

### Major tasks
- Map every protected page load to scoped services.
- Define RBAC navigation visibility.
- Remove protected direct reads from screens before release.
- Validate backend denial even if UI is bypassed.

### Required deliverables
- UI/service mapping checklist
- RBAC navigation checklist
- Direct-read removal checklist
- UI access validation plan

### Validation requirements
- All protected page loads use scoped services.
- No direct entity reads remain in protected screens.
- Navigation visibility matches RBAC matrix.

### Rollback / containment considerations
Feature flags must disable MGA UI surfaces without disabling underlying safe services.

### Exit criteria
- protected UI scoped-service coverage 100%
- direct protected UI reads 0
- RBAC navigation test PASS
- zero unresolved P0 UI access gaps

### Approval gate
Proceed only after UI access audit passes.

## Phase 6 — Documents, Reports, Search, Notifications, and Real-Time Hardening

### Objective
Prevent leakage through derived data, metadata, cached content, links, and events.

### Scope
Document previews, thumbnails, signed links, exports, report snapshots, cached dashboards, global search, autocomplete, snippets, notifications, email deep links, real-time subscriptions, event streams.

### Out of scope
Releasing any derived-data feature before scope-safe validation passes.

### Dependencies
Phase 3 PASS; Phase 4 migration readiness; Phase 5 UI mapping where applicable.

### Major tasks
- Scope document-derived metadata.
- Require signed-link reauthorization.
- Scope report/cache keys.
- Scope search indexes/snippets/autocomplete.
- Scope notifications and deep links.
- Scope real-time subscriptions and event streams.

### Required deliverables
- Document metadata protection checklist
- Search leakage test plan
- Notification/deep-link authorization plan
- Real-time event scope plan
- Report cache scope-key plan

### Validation requirements
- No document-derived metadata leaks cross-scope.
- Search/autocomplete/snippets return zero out-of-scope data.
- Notifications and links reauthorize on access.
- No protected event reaches out-of-scope users.

### Rollback / containment considerations
Disable derived-data surfaces independently: previews, thumbnails, global search, notifications, real-time streams, exports.

### Exit criteria
- no cross-scope document metadata leakage detected
- search leakage test PASS
- notification/deep-link test PASS
- real-time leakage test PASS
- report cache scope validation PASS

### Approval gate
Proceed only after derived-data security validation passes.

## Phase 7 — Testing, Validation, and Certification

### Objective
Run the full certification test suite before rollout.

### Scope
RBAC, service contract conformance, cross-MGA denial, migration reconciliation, document access, signed links, exports, reporting, search, notifications, real-time events, async scope re-resolution, TXQuote retry/idempotency, performance, audit completeness.

### Out of scope
Production rollout before certification PASS.

### Dependencies
Phases 1–6 PASS.

### Major tasks
- Execute full validation suite.
- Record pass/fail outcomes.
- Remediate failures.
- Produce certification report.

### Required deliverables
- Validation results register
- Certification report
- Performance benchmark report
- Audit completeness report
- P0 remediation tracker

### Validation requirements
- 100% protected service conformance.
- 100% RBAC matrix pass.
- 0 cross-scope leakage.
- Performance targets met or formally remediated.
- Audit completeness validated.

### Rollback / containment considerations
Any P0 failure blocks rollout and requires containment by disabling affected feature flags.

### Exit criteria
- all P0 tests PASS
- zero unresolved P0 findings
- performance targets PASS or remediation approved
- audit coverage validated

### Approval gate
Proceed only after final build certification GO.

## Phase 8 — Controlled Rollout

### Objective
Release MGA capability gradually with monitoring, rollback windows, and support readiness.

### Scope
Internal admin rollout, pilot MGA rollout, limited production release, broader release, monitoring dashboards, incident response, rollback windows, post-release audit review.

### Out of scope
Broad release with unresolved P0 issues.

### Dependencies
Phase 7 PASS.

### Major tasks
- Enable internal admin pilot.
- Enable pilot MGA cohort.
- Monitor scope denials, audit events, performance, migration anomalies.
- Expand release only after gates pass.
- Conduct post-release audit review.

### Required deliverables
- Rollout checklist
- Monitoring dashboard plan
- Incident response runbook
- Rollback window schedule
- Post-release audit report

### Validation requirements
- No unresolved P0 issues.
- Monitoring active.
- Support procedures ready.
- Production release approved.

### Rollback / containment considerations
Use feature flags for immediate containment. Use data rollback only for confirmed data migration defects. Use communication plan for affected users.

### Exit criteria
- internal rollout PASS
- pilot rollout PASS
- monitoring active
- support ready
- production release approved

### Approval gate
Proceed only by explicit production release approval.

## B. Phase 0 Required Inventory Formats

### Current Entity Inventory
Must include: entity name; current scope field if any; parent entity; classification as direct, inherited, global, or platform-only; migration required YES/NO; indexing required YES/NO; audit coverage YES/NO; notes/anomalies.

### Current Page Inventory
Must include: page name; route; protected domain; current data source; direct entity reads YES/NO; direct entity mutations YES/NO; scoped service replacement required YES/NO; RBAC visibility requirement; notes.

### Current Function / Service Inventory
Must include: function/service name; domain; protected operation YES/NO; current scope enforcement; required scoped replacement; idempotency required; audit required; concurrency requirement; file/document implication; notes.

### Direct Frontend Read / Mutation Inventory
Must include: page/component; entity accessed; read/list/detail/create/update/delete/export/transmit action; risk level; replacement scoped service; priority; remediation phase.

### Protected Domain Identification
Must classify: MGA; MasterGroup; cases; census; quotes; TXQuote; enrollment; documents; signed links; reports; dashboards; search; autocomplete; notifications; email links; real-time events; exports; webhooks; background jobs; audit logs; help/manual activity.

### Migration Candidate Inventory
Must include: entity; migration source; target scope rule; parent dependency; anomaly risk; backfill method; validation method; rollback consideration.

### Existing Document / File Access Inventory
Must include: file/document entity; storage location; metadata fields; thumbnail/preview behavior; signed-link generation path; download path; export path; current authorization behavior; required scoped replacement.

### Existing Report / Search / Notification / Event Path Inventory
Must include: path name; type as report/search/notification/event/email/export; current scope behavior; cache behavior; authorization behavior; leakage risk; replacement approach; validation method.

### Implementation Tracking Checklist
Each item must track: identified; classified; scoped replacement designed; implementation phase assigned; test assigned; audit requirement assigned; rollback/containment assigned.

### Feature Flag / Rollout Strategy
Must define placeholders for MGA surfaces, scoped services, migration state, reports/search/documents, TXQuote, and real-time/event features. Must define pilot access, fast-disable procedure, partial-rollout leakage prevention, and migration-state interaction.

### Rollback Strategy
Must define rollback triggers, rollback owners, rollback steps, data rollback vs feature rollback distinction, containment for partially migrated records, and communication requirements.

### Baseline Test Snapshot Plan
Must capture current case workflow, census workflow, quote workflow, TXQuote workflow, document access, reporting, search if applicable, notification/email if applicable, audit behavior, and performance baseline.

## C. Expanded Implementation Risk Register

| Risk ID | Risk description | Impact | Likelihood | Phase addressed | Mitigation | Validation method | Containment / rollback | Owner / function | Status |
|---|---|---|---|---|---|---|---|---|---|
| R-01 | legacy direct frontend reads | cross-scope leakage | High | 0,3,5 | inventory and replace with scoped services | direct-read scan | disable affected UI | frontend/service owners | Open |
| R-02 | direct frontend mutations | unauthorized writes | High | 0,3,5 | route writes through scoped contracts | mutation inventory | disable actions | frontend/service owners | Open |
| R-03 | incomplete entity propagation | inconsistent scope | Medium | 1,4 | use entity classification checklist | migration validation | quarantine records | data owner | Open |
| R-04 | migration anomalies | ownership errors | High | 4 | dry-run and approval mapping | reconciliation | rollback migration | migration owner | Open |
| R-05 | orphaned downstream records | inaccessible/leaky data | Medium | 4 | anomaly detection | orphan report | quarantine | migration owner | Open |
| R-06 | conflicting parent chains | wrong MGA assignment | Medium | 4 | lineage validation | conflict report | block cutover | migration owner | Open |
| R-07 | performance degradation from scoped queries | slow workflows | Medium | 1,7 | indexes and benchmarks | P95 tests | disable slow surfaces | platform/data owners | Open |
| R-08 | missing scope indexes | full-table scans | Medium | 1,7 | index plan | query review | block release | data owner | Open |
| R-09 | report cache leakage | cross-MGA report exposure | High | 6,7 | scope-key caches | cache leakage tests | invalidate caches | reporting owner | Open |
| R-10 | document metadata leakage | filename/preview exposure | High | 6,7 | protect metadata as document | document leakage tests | disable previews | document owner | Open |
| R-11 | signed-link leakage | unauthorized downloads | High | 6,7 | reauthorize links | signed-link tests | revoke links | document owner | Open |
| R-12 | thumbnail / preview leakage | derived metadata exposure | High | 6,7 | scoped preview service | preview tests | disable thumbnails | document owner | Open |
| R-13 | notification leakage | cross-scope content | Medium | 6,7 | scoped rendering | notification tests | suppress sends | notification owner | Open |
| R-14 | stale email / deep-link leakage | link bypass | High | 6,7 | reauth on click | deep-link tests | invalidate links | notification owner | Open |
| R-15 | async job scope drift | stale scoped execution | Medium | 3,6,7 | re-resolve before execute | async tests | pause queues | jobs owner | Open |
| R-16 | scheduled job scope drift | wrong scheduled scope | Medium | 3,6,7 | configured scope validation | schedule tests | disable schedule | jobs owner | Open |
| R-17 | webhook ownership ambiguity | wrong ownership | Medium | 3,4,6 | resolve owner or quarantine | webhook tests | quarantine | integration owner | Open |
| R-18 | webhook quarantine visibility | leaked quarantined data | Medium | 4,6,7 | platform-only quarantine | quarantine tests | hide queue | security owner | Open |
| R-19 | admin/support misuse | overbroad access | Medium | 2,7 | read-only impersonation | impersonation tests | revoke sessions | security owner | Open |
| R-20 | write-capable impersonation misuse | unauthorized writes | Low | 2,7 | disabled by default | break-glass audit | disable break-glass | security owner | Open |
| R-21 | TXQuote retry duplication | duplicate transmissions | Medium | 3,7 | idempotency keys | retry tests | pause TXQuote | TXQuote owner | Open |
| R-22 | TXQuote cross-scope transmission risk | external data leakage | High | 3,7 | scope gate before transmit | cross-scope TXQuote tests | disable transmit | TXQuote owner | Open |
| R-23 | RBAC drift | UI/backend mismatch | Medium | 2,5,7 | backend authority | RBAC tests | disable action | security/frontend owners | Open |
| R-24 | permission matrix implementation drift | unauthorized permissions | Medium | 2,7 | matrix-driven checks | matrix tests | block release | security owner | Open |
| R-25 | audit gaps | no traceability | Medium | 2,3,7 | audit checklist | audit completeness tests | block release | audit owner | Open |
| R-26 | audit redaction gaps | sensitive log exposure | Medium | 2,7 | redaction rules | audit review | mask logs | compliance owner | Open |
| R-27 | search/autocomplete leakage | identifier leakage | High | 6,7 | scoped search index | search tests | disable search | search owner | Open |
| R-28 | search snippet leakage | content leakage | High | 6,7 | snippets from scoped records only | snippet tests | disable snippets | search owner | Open |
| R-29 | real-time event leakage | event exposure | High | 6,7 | scoped channels/tokens | event tests | disable streams | realtime owner | Open |
| R-30 | event stream unscoped channel leakage | global event exposure | High | 6,7 | no global protected channels | channel tests | disable channels | realtime owner | Open |
| R-31 | export bundle leakage | bundled out-of-scope data | High | 6,7 | per-artifact validation | export tests | disable exports | export owner | Open |
| R-32 | generated PDF/ZIP leakage | derived artifact exposure | High | 6,7 | scoped artifact generation | artifact tests | revoke artifacts | export owner | Open |
| R-33 | help/manual activity scope leakage | user activity exposure | Medium | 1,3,7 | scope activity logs | help activity tests | hide activity logs | help owner | Open |
| R-34 | platform catalog misuse | operational data in global catalog | Medium | 1,6,7 | catalog governance | catalog review | remove global access | platform owner | Open |
| R-35 | rollout/feature-flag misconfiguration | partial unsafe release | Medium | 0,8 | flag plan and pilot gates | rollout tests | disable flags | release owner | Open |

## D. Preserved Dependency Rules

- UI work cannot begin before scoped service paths exist.
- Migration cannot finalize before scope fields and entity classification are implemented.
- Reports, search, documents, notifications, and real-time features cannot release before scope-safe access paths exist.
- TXQuote cannot release before idempotency, audit, retry, and cross-scope validation pass.
- Rollout cannot begin before validation and certification pass.

## E. Phase 0 Exit Gate

Phase 0 may not complete unless all of the following are PASS:
- current entity inventory is complete
- current page inventory is complete
- current function/service inventory is complete
- all direct frontend reads/mutations in protected domains are identified
- protected domains are classified
- migration candidate inventory is complete
- document/file access paths are inventoried
- report/search/notification/event paths are inventoried
- implementation tracking checklist is populated
- feature flag and rollout strategy is documented
- rollback strategy is documented
- baseline test snapshot is complete
- no unresolved P0 planning gaps remain

## F. Revision Round 1 Planning Audit Rerun

### Phase completeness
PASS. Each phase now includes objective, scope, out of scope, dependencies, major tasks, required deliverables, validation requirements, rollback/containment considerations, exit criteria, and approval gate.

### Risk register completeness
PASS. The risk register now includes risk ID, description, impact, likelihood, phase addressed, mitigation, validation method, containment/rollback, owner/function, and status for all required risk categories.

### Phase 0 readiness
PASS. Phase 0 now includes concrete inventory formats, protected-domain classification requirements, direct-read/mutation discovery, rollout strategy, rollback strategy, and baseline test snapshot plan.

### Build-planning audit status
PASS.

### Is Phase 0 ready to begin?
YES, after explicit user approval to start Phase 0.

### Remaining blockers before Phase 0
None from the planning package.

### Confirmation
No code, schema, UI, service, entity, database, or behavior changes were made by this revision.