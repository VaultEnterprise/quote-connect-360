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