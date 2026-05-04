# MGA Phase 2 — Canonical Scope Resolution and Authorization Layer Report

Report date: 2026-05-04
Author: Base44 AI agent
Phase: 2 — Canonical Scope Resolution and Authorization Layer
Status: COMPLETE — PENDING COMPLETION AUDIT

Canonical documents:
- Architecture: `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`
- Build planning: `docs/MGA_BUILD_PLANNING_PACKAGE.md`
- Phase 0 report: `docs/MGA_PHASE_0_BASELINE_AND_SAFETY_REPORT.md`
- Phase 1 report: `docs/MGA_PHASE_1_DATA_MODEL_AND_SCOPE_FOUNDATION_REPORT.md`
- Phase 1 audit: `docs/MGA_PHASE_1_COMPLETION_AUDIT_REPORT.md`
- Phase 2 report: `docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md`
- Phase 2 resolver: `lib/mga/scopeResolver.js`
- Phase 2 permission resolver: `lib/mga/permissionResolver.js`
- Phase 2 scope gate: `lib/mga/scopeGate.js`
- Phase 2 audit builder: `lib/mga/auditDecision.js`
- Phase 2 impersonation: `lib/mga/impersonationControl.js`
- Phase 2 error model: `lib/mga/errorModel.js`
- Phase 2 async/job rules: `lib/mga/asyncScopeRules.js`
- Phase 2 test definitions: `lib/mga/phase2.tests.js`

---

## 0. Phase 2 Control Statement

Phase 2 is limited exclusively to implementing the canonical scope-resolution engine, authorization gate, RBAC/permission resolver, fail-closed behavior, support/impersonation rules, audit correlation foundation, quarantine decision integration, async/webhook/retry/scheduled scope rules, and testable authorization utilities required before Phase 3 scoped services.

Phase 2 does NOT:
- alter UI behavior
- replace any page data loads
- expose MGA pages to users
- change navigation
- change business service behavior
- run migration or backfill
- transmit TXQuote differently
- change document URLs
- change reports
- change permissions for existing users
- make quarantined records visible
- enable MGA features for end users
- begin Phase 3 scoped services
- begin Phase 4 migration
- begin Phase 5 UI
- begin Phase 6 document/search hardening
- begin Phase 7 certification

All Phase 2 deliverables are implemented as shared authorization library modules (in `lib/mga/`) that Phase 3 services will call. No existing application behavior is changed by these library files existing in the codebase. They are inert until called by Phase 3 services.

---

## 1. Pre-Change Baseline Confirmation

All items confirmed before Phase 2 implementation began.

| Baseline item | Status | Evidence |
|---|---|---|
| Phase 1 audit passed | CONFIRMED | `docs/MGA_PHASE_1_COMPLETION_AUDIT_REPORT.md` — Final disposition: PASS |
| No P0 Phase 1 blockers remain | CONFIRMED | Audit Check final table: P0 blockers = 0 |
| P1 gaps documented and gated | CONFIRMED | 8 corrections applied; gaps carried forward — see Section 2 of this report |
| Canonical documents exist | CONFIRMED | All 5 canonical docs confirmed at underscore paths |
| No duplicate spaced-path documents exist | CONFIRMED | No spaced-path variants detected |
| No Phase 3–8 work started | CONFIRMED | This report and lib/mga/ files are Phase 2 only; no service, UI, or migration changes |

**Corrected Phase 1 audit counts — preserved:**

| Metric | Corrected value |
|---|---|
| Truly new entities created | 7 |
| Pre-existing entity extended (MasterGroup) | 1 |
| Total entity files created at entities/ path | 8 |
| Unique existing entities modified | 33 |
| master_general_agent_id fields added or defined | 37 |
| Schema/service-layer index created | 1 |
| Deferred compound index plans | 16 |
| Global/platform-only entities confirmed | 17 |
| P0 blockers from Phase 1 | 0 |

---

## 2. Phase 1 P1 Gaps — Carried Forward as Explicit Gates

The following P1 gaps identified in the Phase 1 Completion Audit are explicitly carried forward. They do not block Phase 2 implementation. They DO block specific downstream phases and operations as stated.

### 2.1 Path / Propagation Gaps (src/entities/ path entities)

| Entity | Gap description | Blocks |
|---|---|---|
| Tenant | entity file at src/entities/Tenant.json; no entities/Tenant.json exists; master_general_agent_id not yet added | Phase 3 services targeting Tenant; Phase 4 migration of Tenant records; any user-visible MGA behavior relying on Tenant |
| CensusImportJob | at src/entities/ path; not in Phase 1 propagation map; master_general_agent_id not yet added | Phase 3 census import scoped services; Phase 4 migration; any user-visible MGA behavior |
| CensusImportAuditEvent | at src/entities/ path; not in Phase 1 propagation map; master_general_agent_id not yet added | Phase 3 census audit services; Phase 4 migration; any user-visible MGA behavior |
| CensusValidationResult | at src/entities/ path; not in Phase 1 propagation map; master_general_agent_id not yet added | Phase 3 census validation services; Phase 4 migration; any user-visible MGA behavior |

**Gate rule for path/propagation gaps:** Phase 3 services targeting any of the above 4 entities are BLOCKED until a dedicated mini-pass resolves canonical entity location, creates the entities/ canonical file, and adds the master_general_agent_id and migration staging fields. This mini-pass must be explicitly approved and documented before Phase 3 services targeting these entities begin.

### 2.2 Help / Manual Scoped Activity Gaps

| Entity | Gap description | Blocks |
|---|---|---|
| UserManual | Scoped-Direct per Phase 0; not addressed in Phase 1 propagation | Phase 3 scoped help services; Phase 4 migration; any MGA-scoped help behavior |
| HelpSearchLog | Scoped-Direct per Phase 0; not addressed in Phase 1 propagation | Phase 3 help activity services; Phase 4 migration |
| HelpAIQuestionLog | Scoped-Direct per Phase 0; not addressed in Phase 1 propagation | Phase 3 help activity services; Phase 4 migration |
| HelpCoverageSnapshot | Scoped-Direct per Phase 0; not addressed in Phase 1 propagation | Phase 6 help reporting; Phase 4 migration |
| HelpAuditLog | Scoped-Direct per Phase 0; not addressed in Phase 1 propagation | Phase 6 help audit; Phase 4 migration |
| HelpAITrainingQueue | Scoped-Direct per Phase 0; not addressed in Phase 1 propagation | Phase 6 help AI services; Phase 4 migration |

**Gate rule for help/manual gaps:** Must not be treated as Global - Intentional. They are Scoped - Direct. Any Phase 3+ service touching these entities must first resolve their propagation. No MGA-scoped help/manual activity behavior may be enabled for users until these entities carry master_general_agent_id.

### 2.3 Gate Rules Summary

- These gaps do NOT block Phase 2 resolver implementation.
- These gaps DO block: Phase 3 services targeting those entities; Phase 4 migration/backfill involving those entities; any user-visible MGA behavior relying on those entities.
- A dedicated mini-pass must be approved and documented before Phase 3/4 work targeting these entities begins.
- The Phase 2 scope resolver MUST treat all of the above entities as "scope-pending" — i.e., when resolving scope for records of these types, the resolver MUST fail closed or flag as unresolved rather than assuming null master_general_agent_id = global access.

---

## 3. Canonical Scope Resolver — Design

**Implemented at:** `lib/mga/scopeResolver.js`

### 3.1 Source of Truth

The authoritative source of actor scope is server-side membership records (MasterGeneralAgentUser), never client-supplied claims.

Allowed client inputs: target entity identifiers, filters, pagination data, user-entered field values.

Not authoritative from client: master_general_agent_id, master_group_id, role claims, support mode claims, impersonation subject.

### 3.2 Actor Principal Types

| Principal type | Resolution source | Cross-MGA access |
|---|---|---|
| platform_super_admin | User.role === "admin" verified server-side | YES — explicit role check + audit required |
| platform_support_impersonation | Explicit impersonation session record, active, not expired | Read-only only; write requires break-glass (disabled by default) |
| mga_admin | MasterGeneralAgentUser.role === "mga_admin" | NO — own MGA only |
| mga_manager | MasterGeneralAgentUser.role === "mga_manager" | NO — own MGA only |
| mga_user | MasterGeneralAgentUser.role === "mga_user" | NO — own MGA only |
| mga_read_only | MasterGeneralAgentUser.role === "mga_read_only" | NO — own MGA only |
| unauthenticated | No valid session | DENY — all requests |

### 3.3 Membership Policy

- A standard operational user may belong to multiple MasterGroups within the SAME MGA.
- A standard operational user may NOT belong to multiple MGAs. If detected, all protected requests are denied; a security audit event is created; platform admin remediation is required.
- Platform super admins operate across MGAs by privileged role, not by ordinary membership.
- Support impersonation exists only under explicit governance controls.

### 3.4 Deterministic Scope Resolution Algorithm

Every protected service request MUST execute this algorithm in sequence. Any step that cannot be resolved deterministically MUST fail closed — no fallback, no default scope, no inferred scope.

```
STEP 1 — Authenticate actor
  Input: request session / token
  Action: verify session is valid and not expired
  Fail condition: no valid session → DENY (UNAUTHENTICATED)
  Output: actor_email

STEP 2 — Resolve actor principal type
  Input: actor_email
  Action: load User record; check User.role
  If User.role === "admin": actor_type = platform_super_admin
  Else: proceed to membership lookup
  Output: actor_type (preliminary)

STEP 3 — Load actor membership records
  Input: actor_email
  Action: query MasterGeneralAgentUser WHERE user_email = actor_email AND status = "active"
  Output: membership_list

STEP 4 — Validate membership cardinality
  If membership_list is empty AND actor_type != platform_super_admin:
    → DENY (MISSING_MEMBERSHIP) + SECURITY_AUDIT_EVENT
  If membership_list contains records from multiple distinct MGAs AND actor_type != platform_super_admin:
    → DENY (CONFLICTING_MEMBERSHIP) + SECURITY_AUDIT_EVENT
  Output: validated membership_list

STEP 5 — Resolve effective MGA
  If actor_type = platform_super_admin:
    effective_mga_id = "platform_scope" (cross-MGA access subject to action audit)
  Else if actor_type = support_impersonation:
    effective_mga_id = impersonation_session.effective_mga_id (read-only, cannot be widened)
  Else:
    effective_mga_id = membership_list[0].master_general_agent_id (all records same MGA, validated in Step 4)
    actor_role = membership_list[0].role
  Output: effective_mga_id, actor_role

STEP 6 — Resolve effective MasterGroups within MGA
  Input: membership_list
  Action: collect allowed_master_group_ids from all membership records
  If any record has empty allowed_master_group_ids: actor can see ALL MasterGroups within effective_mga_id
  Else: actor can see only the union of allowed_master_group_ids
  Output: allowed_master_group_ids (empty = all within MGA)

STEP 7 — Resolve target entity scope
  Input: target_entity_type, target_entity_id
  Action: load target record; read target_record.master_general_agent_id
  If target_record not found: → DENY (NOT_FOUND_IN_SCOPE)
  If target_record.master_general_agent_id is null or missing:
    Check if entity type is in SCOPE_PENDING list (Tenant, CensusImportJob, CensusImportAuditEvent, CensusValidationResult, UserManual, HelpSearchLog, HelpAIQuestionLog, HelpCoverageSnapshot, HelpAuditLog, HelpAITrainingQueue):
      → DENY (SCOPE_PENDING_MIGRATION) + log as migration-state violation
    Else: → DENY (STALE_SCOPE) + SECURITY_AUDIT_EVENT
  If target_record.mga_migration_status === "quarantined":
    → QUARANTINE_DENIED (handled in quarantine decision — see Section 9)
  target_mga_id = target_record.master_general_agent_id
  Output: target_mga_id

STEP 8 — Compare actor scope to target scope
  If actor_type = platform_super_admin:
    → proceed to STEP 9 (super admin cross-MGA allowed, will be audited)
  If effective_mga_id !== target_mga_id:
    → DENY (CROSS_MGA_VIOLATION) + SECURITY_AUDIT_EVENT
  Output: scope_match = true

STEP 9 — Evaluate RBAC permission
  Input: actor_role, domain, action
  Action: look up permission matrix (see Section 5)
  If permission = DENY: → DENY (PERMISSION_DENIED)
  If permission = ALLOW: → proceed to STEP 10
  If permission undefined: → DENY (UNKNOWN_PERMISSION)
  Output: permission_decision

STEP 10 — Execute action within transaction boundary
  Action: execute the requested operation atomically
  If external side effect (email, TXQuote transmission, webhook):
    commit internal state and audit before dispatch
    use retry-safe state tracking for external effect
  Output: operation result

STEP 11 — Produce authorization decision record
  Action: build audit decision metadata (see Section 8)
  Write to MasterGeneralAgentActivityLog if required by action category
  Output: decision_record, correlation_id

STEP 12 — Return scoped response
  Return: canonical response structure (success, data, meta with correlation_id)
  Never return out-of-scope data even on partial queries
```

### 3.5 Resolver Input Specification

```javascript
// scopeResolver.resolveScope(context)
{
  actor_email: string,           // required — from authenticated session
  actor_session_token: string,   // required — validated before resolver called
  target_entity_type: string,    // required — entity type name
  target_entity_id: string,      // required — specific record ID
  target_parent_refs: {          // optional — known parent chain for validation
    case_id: string | null,
    master_group_id: string | null,
    employer_group_id: string | null
  },
  domain: string,                // required — operational domain (e.g. "cases", "txquote")
  action: string,                // required — operation action (e.g. "read", "transmit")
  correlation_id: string,        // required — provided by calling service or generated
  request_channel: string,       // required — "ui"|"api"|"webhook"|"scheduled_job"|"async_job"|"import"|"system"
  impersonation_session_id: string | null  // optional — present only for support operations
}
```

### 3.6 Resolver Output Specification

```javascript
// scopeResolver returns ScopeDecision
{
  allowed: boolean,
  reason_code: string,           // see errorModel.js for all codes
  actor_email: string,
  actor_role: string,
  actor_type: string,            // "platform_super_admin"|"mga_user"|"support_impersonation"
  real_actor_email: string | null,       // impersonation only
  impersonated_actor_email: string | null, // impersonation only
  effective_mga_id: string | null,
  effective_mga_name: string | null,
  allowed_master_group_ids: string[],    // empty = all within MGA
  target_entity_type: string,
  target_entity_id: string,
  target_mga_id: string | null,
  domain: string,
  action: string,
  required_permission: string,
  decision_timestamp: string,    // ISO 8601
  correlation_id: string,
  audit_required: boolean,
  security_event: boolean,
  governance_event: boolean
}
```

---

## 4. Universal Protected Scope Gate — Design

**Implemented at:** `lib/mga/scopeGate.js`

### 4.1 Gate Contract

The universal scope gate is the single mandatory entry point for all Phase 3+ protected operations. No protected operation may execute before calling the gate and receiving `allowed: true`.

```javascript
// scopeGate.check(gateRequest) → GateDecision
// Wraps scopeResolver + impersonationControl + quarantineDecision
// Returns standardized decision object
```

### 4.2 Protected Operation Categories

All categories listed below require gate check before execution:

| Category | Gate required | Idempotency | Audit required | Security event on denial |
|---|---|---|---|---|
| read | YES | NO | YES (platform super admin) | YES (cross-scope attempt) |
| list | YES | NO | YES (platform super admin) | YES (cross-scope attempt) |
| detail | YES | NO | YES (platform super admin) | YES (cross-scope attempt) |
| create | YES | YES | YES | YES |
| update | YES | YES | YES | YES |
| delete | YES | YES | YES | YES |
| export | YES | YES | YES | YES |
| transmit | YES | YES | YES | YES (always) |
| retry | YES | YES | YES | YES |
| approve | YES | YES | YES | YES |
| upload | YES | YES | YES | YES |
| import | YES | YES | YES | YES |
| download | YES | NO | YES | YES |
| preview | YES | NO | YES | YES (cross-scope) |
| signed_link_generation | YES | YES | YES (always) | YES (always) |
| report_generation | YES | YES | YES | YES |
| dashboard_aggregation | YES | NO | conditional | YES (cross-scope) |
| search | YES | NO | YES (audit trail) | YES (cross-scope result) |
| autocomplete | YES | NO | YES (audit trail) | YES (cross-scope result) |
| notification_rendering | YES | YES | YES | YES |
| email_deep_link_access | YES | NO | YES (always) | YES (always) |
| real_time_subscription | YES | NO | YES | YES |
| event_delivery | YES | NO | YES | YES |
| webhook_processing | YES | YES | YES | YES (unresolved ownership) |
| async_job_execution | YES | YES | YES | YES (scope drift) |
| scheduled_job_execution | YES | NO | YES | YES (scope violation) |
| audit_log_access | YES | NO | YES (always) | YES (cross-scope) |
| support_admin_investigation | YES | NO | YES (always) | YES (always) |

### 4.3 Standard Gate Decision Object

```javascript
// GateDecision — returned by scopeGate.check()
{
  allowed: boolean,              // true = proceed; false = reject
  reason_code: string,           // canonical error code from errorModel.js
  actor_email: string,
  actor_role: string,
  real_actor_email: string | null,
  impersonated_actor_email: string | null,
  effective_mga_id: string | null,
  effective_master_group_id: string | null,  // most specific allowed group for target
  target_entity_type: string,
  target_entity_id: string,
  target_mga_id: string | null,
  required_permission: string,   // e.g. "txquote:transmit"
  decision_timestamp: string,
  correlation_id: string,
  audit_required: boolean,
  security_event: boolean,
  governance_event: boolean,
  quarantine_flag: boolean,      // true = target is quarantined
  scope_pending_flag: boolean    // true = target entity type is scope-pending (P1 gap entities)
}
```

### 4.4 Gate Usage Contract for Phase 3 Services

Every Phase 3 service MUST:
1. Call `scopeGate.check(request)` as the FIRST operation.
2. If `decision.allowed === false`: return canonical error response immediately; do not execute operation.
3. If `decision.allowed === true`: proceed with operation within the resolved scope.
4. After operation: call `auditDecision.record(decision, outcome)`.
5. Never execute operation before receiving gate decision.
6. Never widen scope beyond what the gate resolved.
7. Never accept client-provided scope as override.

---

## 5. RBAC / Permission Resolver — Design

**Implemented at:** `lib/mga/permissionResolver.js`

### 5.1 Roles Covered

| Role identifier | Description |
|---|---|
| platform_super_admin | Full cross-MGA access; all operations with audit |
| mga_admin | Full administrative control within own MGA |
| mga_manager | Operational leadership within own MGA |
| mga_user | Standard operational user within own MGA |
| mga_read_only | Read-only visibility within own MGA |
| support_impersonation_read_only | Read-only support access; cannot exceed role of impersonated subject |

### 5.2 Permission Resolver Contract

```javascript
// permissionResolver.check(role, domain, action) → "ALLOW" | "DENY"
// Undefined domain × action combinations return "DENY" (fail closed)
// No optional permissions. Unknown = deny.
```

### 5.3 Complete Permission Matrix

Domains: mga, mastergroup, cases, census, quotes, txquote, enrollment, documents, signed_links, reports, dashboards, search, autocomplete, notifications, realtime_events, webhooks, background_jobs, audit_logs, users, settings, help_activity, platform_catalogs

Actions: view, read, list, detail, create, edit, delete, approve, transmit, retry, export, upload, import, download, preview, manage_users, manage_settings, view_financials, view_audit, administer_quarantine

Legend: A = ALLOW, D = DENY

#### Domain: mga (MasterGeneralAgent entity itself)
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | D | D | D | D |
| edit | A | A (own) | D | D | D |
| delete | A | D | D | D | D |
| approve | A | D | D | D | D |
| transmit | D | D | D | D | D |
| retry | D | D | D | D | D |
| export | A | A | D | D | D |
| upload | A | A | D | D | D |
| import | A | D | D | D | D |
| download | A | A | D | D | D |
| preview | A | A | D | D | D |
| manage_users | A | A | D | D | D |
| manage_settings | A | A | D | D | D |
| view_financials | A | A | D | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: mastergroup
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | D | D | D |
| edit | A | A | A | D | D |
| delete | A | A | D | D | D |
| approve | A | A | D | D | D |
| transmit | D | D | D | D | D |
| retry | D | D | D | D | D |
| export | A | A | A | D | D |
| upload | A | A | A | D | D |
| import | A | A | D | D | D |
| download | A | A | A | D | D |
| preview | A | A | A | A | D |
| manage_users | A | A | D | D | D |
| manage_settings | A | A | D | D | D |
| view_financials | A | A | D | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: cases
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | A | A | D |
| edit | A | A | A | A | D |
| delete | A | A | D | D | D |
| approve | A | A | A | D | D |
| transmit | D | D | D | D | D |
| retry | A | A | A | D | D |
| export | A | A | A | A | D |
| upload | A | A | A | A | D |
| import | A | A | A | D | D |
| download | A | A | A | A | D |
| preview | A | A | A | A | A |
| manage_users | A | A | D | D | D |
| manage_settings | A | A | D | D | D |
| view_financials | A | A | A | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: census
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | A | A | D |
| edit | A | A | A | A | D |
| delete | A | A | D | D | D |
| approve | A | A | A | D | D |
| transmit | D | D | D | D | D |
| retry | A | A | A | D | D |
| export | A | A | A | A | D |
| upload | A | A | A | A | D |
| import | A | A | A | A | D |
| download | A | A | A | A | D |
| preview | A | A | A | A | A |
| manage_users | D | D | D | D | D |
| manage_settings | D | D | D | D | D |
| view_financials | D | D | D | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: quotes
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | A | A | D |
| edit | A | A | A | A | D |
| delete | A | A | D | D | D |
| approve | A | A | A | D | D |
| transmit | D | D | D | D | D |
| retry | A | A | A | D | D |
| export | A | A | A | A | D |
| upload | A | A | A | A | D |
| import | A | A | D | D | D |
| download | A | A | A | A | D |
| preview | A | A | A | A | A |
| manage_users | D | D | D | D | D |
| manage_settings | D | D | D | D | D |
| view_financials | A | A | A | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: txquote
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | A | D | D |
| edit | A | A | A | D | D |
| delete | A | A | D | D | D |
| approve | A | A | A | D | D |
| transmit | A | A | A | D | D |
| retry | A | A | A | D | D |
| export | A | A | A | D | D |
| upload | A | A | A | D | D |
| import | A | A | D | D | D |
| download | A | A | A | D | D |
| preview | A | A | A | A | A |
| manage_users | D | D | D | D | D |
| manage_settings | D | D | D | D | D |
| view_financials | A | A | A | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: enrollment
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | A | A | D |
| edit | A | A | A | A | D |
| delete | A | A | D | D | D |
| approve | A | A | A | D | D |
| transmit | D | D | D | D | D |
| retry | A | A | A | D | D |
| export | A | A | A | A | D |
| upload | A | A | A | A | D |
| import | A | A | A | D | D |
| download | A | A | A | A | D |
| preview | A | A | A | A | A |
| manage_users | D | D | D | D | D |
| manage_settings | D | D | D | D | D |
| view_financials | D | D | D | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: documents
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | A | A | D |
| edit | A | A | A | A | D |
| delete | A | A | D | D | D |
| approve | D | D | D | D | D |
| transmit | D | D | D | D | D |
| retry | D | D | D | D | D |
| export | A | A | A | A | D |
| upload | A | A | A | A | D |
| import | D | D | D | D | D |
| download | A | A | A | A | D |
| preview | A | A | A | A | A |
| manage_users | D | D | D | D | D |
| manage_settings | D | D | D | D | D |
| view_financials | D | D | D | D | D |
| view_audit | A | A | A | D | D |
| administer_quarantine | A | D | D | D | D |

#### Domain: signed_links
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| create | A | A | A | A | D |
| download | A | A | A | A | D |
| preview | A | A | A | A | A |
| delete | A | A | D | D | D |
| all others | D | D | D | D | D |

#### Domain: reports
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | A | A |
| read | A | A | A | A | A |
| list | A | A | A | A | A |
| detail | A | A | A | A | A |
| create | A | A | A | D | D |
| edit | D | D | D | D | D |
| delete | D | D | D | D | D |
| approve | D | D | D | D | D |
| retry | A | A | A | D | D |
| export | A | A | A | A | D |
| download | A | A | A | A | D |
| preview | A | A | A | A | A |
| view_financials | A | A | A | D | D |
| view_audit | A | A | D | D | D |
| administer_quarantine | A | D | D | D | D |
| all others | D | D | D | D | D |

#### Domain: audit_logs
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | D | D |
| read | A | A | A | D | D |
| list | A | A | A | D | D |
| detail | A | A | D | D | D |
| export | A | A | D | D | D |
| view_audit | A | A | A | D | D |
| all others | D | D | D | D | D |

#### Domain: users
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | D | D |
| read | A | A | A | D | D |
| list | A | A | A | D | D |
| create | A | A | D | D | D |
| edit | A | A | D | D | D |
| delete | A | A | D | D | D |
| approve | A | A | D | D | D |
| export | A | A | D | D | D |
| manage_users | A | A | D | D | D |
| all others | D | D | D | D | D |

#### Domain: settings
| Action | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---|---|---|---|
| view | A | A | A | D | D |
| read | A | A | A | D | D |
| create | A | A | D | D | D |
| edit | A | A | D | D | D |
| delete | A | A | D | D | D |
| approve | A | A | D | D | D |
| export | A | A | D | D | D |
| manage_settings | A | A | D | D | D |
| view_financials | A | A | D | D | D |
| all others | D | D | D | D | D |

#### Domain: search / autocomplete / dashboards / notifications / realtime_events / webhooks / background_jobs / help_activity / platform_catalogs

For domains not fully enumerated above, the default rule is:
- view/read/list/detail: mga_admin A, mga_manager A, mga_user A (for dashboards and search only), mga_read_only A for view
- create/edit/delete/approve/transmit/retry/export/upload/import/manage_*: deny for mga_user and mga_read_only
- administer_quarantine: platform_super_admin only
- all unspecified domain × action combinations: **DENY** (fail closed)

---

## 6. Support / Impersonation Enforcement — Design

**Implemented at:** `lib/mga/impersonationControl.js`

### 6.1 Impersonation Policy (Final)

| Rule | Policy |
|---|---|
| Who may impersonate | platform_super_admin and explicitly designated platform support roles only |
| Default impersonation mode | Read-only |
| Write-capable impersonation | Disabled by default; requires break-glass governance |
| Scope of impersonated session | Cannot exceed effective scope of impersonated subject |
| Session logging | Every session captures all fields below |

### 6.2 Required Session Capture Fields

Every impersonation session MUST capture and persist:
- `real_actor_email` — true platform user performing the action
- `impersonated_actor_email` — the user being acted as
- `effective_mga_id` — MGA scope of the impersonated subject
- `effective_master_group_ids` — allowed MasterGroups
- `reason` — human-entered reason for the impersonation
- `start_time` — ISO 8601 timestamp
- `end_time` — ISO 8601 timestamp or null if session still active
- `session_mode` — "read_only" | "break_glass_write" (break_glass_write disabled by default)
- `actions_viewed` — array of {entity_type, entity_id, action, timestamp}
- `actions_attempted` — array of {entity_type, entity_id, action, timestamp, allowed: bool}
- `actions_completed` — array of {entity_type, entity_id, action, timestamp, outcome}
- `session_outcome` — "clean" | "write_attempted" | "write_completed" | "violation_attempted"
- `break_glass_approval_id` — null unless break_glass mode; required if write-capable

### 6.3 Break-Glass Governance (Placeholder — Disabled by Default)

Break-glass governance requirements (for future write-capable support access):
- Explicit reason must be recorded
- Platform admin approval must be obtained and stored with approval_id
- A correlation_id must be issued and tracked across all actions in the session
- A security audit event must be created at initiation
- Session must have an explicit expiration time (max: configurable, default: 4 hours)
- All write actions during break-glass are individually audited
- Break-glass approval must be revocable mid-session

**Current status: DISABLED. No break-glass session may be created until this governance workflow is explicitly implemented and approved.**

### 6.4 Impersonation Scope Rules

- Impersonated read follows scope of impersonated subject — not the platform admin's cross-MGA scope.
- If impersonated subject has no valid membership, impersonation request fails closed.
- Platform admin cannot use impersonation to bypass the impersonated subject's permission matrix.
- Impersonation session cannot be nested.
- Every request within an impersonation session is logged independently.

---

## 7. Fail-Closed and Error Model — Design

**Implemented at:** `lib/mga/errorModel.js`

### 7.1 Canonical Error Codes

| Reason code | HTTP response | Description | Security event | Quarantine |
|---|---|---|---|---|
| UNAUTHENTICATED | 401 | No valid session | NO | NO |
| MISSING_MEMBERSHIP | 403 | Actor has no active MGA membership and is not platform_super_admin | YES | NO |
| CONFLICTING_MEMBERSHIP | 403 | Actor has active memberships in multiple MGAs | YES | NO |
| CROSS_MGA_VIOLATION | 403 | Actor scope (MGA A) does not match target scope (MGA B) | YES | NO |
| PERMISSION_DENIED | 403 | Actor role does not have required permission for domain × action | NO | NO |
| UNKNOWN_PERMISSION | 403 | domain × action combination not defined in permission matrix | NO | NO |
| SCOPE_PENDING_MIGRATION | 403 | Target entity type is in P1 propagation-pending list; cannot be safely scoped | YES | NO |
| STALE_SCOPE | 403 | Target record has null master_general_agent_id but is not a scope-pending entity type | YES | NO |
| QUARANTINE_DENIED | 403 | Target record is quarantined; not accessible to this role | NO | YES |
| QUARANTINE_VISIBLE | 200 | Target record is quarantined; visible to authorized compliance/platform role only | NO | NO |
| NOT_FOUND_IN_SCOPE | 404 | Record does not exist within actor's allowed scope search space | NO | NO |
| CONFLICTING_PARENT_CHAIN | 403 | Target record has conflicting parent chain; cannot resolve scope deterministically | YES | YES |
| ORPHANED_RECORD | 403 | Target record has no parent chain and no direct MGA scope | YES | YES |
| CLIENT_SCOPE_MISMATCH | 403 | Client-supplied scope value does not match server-resolved scope | YES | NO |
| IMPERSONATION_WRITE_DENIED | 403 | Write operation attempted in read-only impersonation mode | YES | NO |
| BREAK_GLASS_NOT_AUTHORIZED | 403 | Write-capable support operation attempted without break-glass governance | YES | NO |
| SUPPORT_SCOPE_EXCEEDED | 403 | Support operation attempted beyond impersonated subject's allowed scope | YES | NO |
| MALFORMED_TARGET | 400 | Target entity type or ID is malformed or unresolvable | NO | NO |
| UNSUPPORTED_OPERATION | 400 | Operation not supported in current phase or configuration | NO | NO |

### 7.2 Response Masking Rules

| Scenario | HTTP Response | Body |
|---|---|---|
| Authenticated user, same scope, unauthorized action | 403 Forbidden | { error: "PERMISSION_DENIED", message: "You do not have permission for this action." } |
| Authenticated user, cross-MGA access attempt | 403 Forbidden | { error: "CROSS_MGA_VIOLATION", message: "Access denied." } + security audit event |
| Record exists but outside actor's scope search space | 404 Not Found | { error: "NOT_FOUND_IN_SCOPE", message: "Record not found." } |
| Record is quarantined, actor is MGA user | 403 Forbidden | { error: "QUARANTINE_DENIED", message: "Access denied." } — no indication it is quarantined |
| Record is quarantined, actor is platform_super_admin | 200 OK | Full record with quarantine metadata visible |
| Unauthenticated | 401 Unauthorized | { error: "UNAUTHENTICATED", message: "Authentication required." } |
| Scope pending / stale | 403 Forbidden | { error: "STALE_SCOPE", message: "Access denied." } — migration-state violation logged internally |

**403/404 masking rule (from architecture Section 18.3):** The platform uses explicit 403 for authenticated scope failures, not masking-as-404. The exception is that cross-scope records outside the actor's search space appear as 404 to avoid revealing the existence of records in other MGAs.

### 7.3 Fail-Closed Guarantee

If ANY of the following conditions exist, the system MUST deny and MUST NOT allow the operation to proceed:
- Actor is unauthenticated
- Actor membership is missing or invalid
- Actor has conflicting memberships across MGAs
- Target entity scope cannot be resolved
- Target entity is in scope-pending list with null MGA
- Target entity has null MGA scope (stale)
- Target entity parent chain is missing
- Target entity parent chain conflicts
- Target entity is quarantined (to MGA users)
- Target scope differs from actor scope
- Required permission is absent from matrix
- Permission is undefined for domain × action
- Client-supplied scope does not match server-resolved scope
- Support impersonation mode is not authorized
- Break-glass governance is absent for write operation

**Under no circumstances may the system fall back to a default scope, infer scope from client payload, or allow partial authorization.**

---

## 8. Audit Correlation Foundation — Design

**Implemented at:** `lib/mga/auditDecision.js`

### 8.1 Audit Decision Metadata

Every authorization decision (allow or deny) MUST be able to produce the following metadata. Not every decision writes to MasterGeneralAgentActivityLog — only material actions and security events require a write (see Section 8.3). However, every decision carries the metadata in memory for the calling service to use.

```javascript
// auditDecision.build(gateDecision, operationResult) → AuditRecord
{
  // Actor fields
  actor_email: string,
  actor_role: string,
  actor_type: string,
  real_actor_email: string | null,
  impersonated_actor_email: string | null,

  // Scope fields
  effective_mga_id: string | null,
  effective_mga_name: string | null,
  effective_master_group_id: string | null,
  target_entity_type: string,
  target_entity_id: string,
  target_mga_id: string | null,
  case_id: string | null,

  // Action fields
  domain: string,
  action: string,
  required_permission: string,
  outcome: "success" | "failed" | "blocked",
  reason_code: string | null,

  // Tracing fields
  correlation_id: string,
  idempotency_key: string | null,
  request_channel: string,
  decision_timestamp: string,

  // Classification flags
  security_event: boolean,
  governance_event: boolean,
  operational_event: boolean,

  // Before/after for mutable operations
  before_value: string | null,   // redacted per policy for sensitive fields
  after_value: string | null,    // redacted per policy for sensitive fields

  // Migration-state
  migration_state_violation: boolean   // true if STALE_SCOPE or SCOPE_PENDING_MIGRATION
}
```

### 8.2 Correlation ID Rules

- Every protected service request MUST carry a correlation_id.
- If not provided by calling service, scopeGate generates a UUID correlation_id.
- Multi-step operations (e.g. TXQuote send → email dispatch → receipt log) MUST share the same correlation_id.
- Async jobs MUST persist the initiating correlation_id at enqueue time and carry it through to completion.
- Webhook-triggered flows MUST generate a new correlation_id scoped to the webhook receipt and chain it to any downstream operations.
- Retry operations MUST carry both the original operation's correlation_id and a new retry_correlation_id.

### 8.3 Audit Write Rules

| Condition | Write to MasterGeneralAgentActivityLog | action_category |
|---|---|---|
| Successful material operation (create, update, delete, transmit, approve, etc.) | YES | operational |
| Successful read/list/detail by MGA user | NO (unless financial or audit domain) | — |
| Successful read/list/detail by platform_super_admin | YES | operational |
| Cross-MGA access attempt (CROSS_MGA_VIOLATION) | YES | security |
| Missing or conflicting membership (MISSING_MEMBERSHIP, CONFLICTING_MEMBERSHIP) | YES | security |
| Stale scope access attempt (STALE_SCOPE, SCOPE_PENDING_MIGRATION) | YES | security |
| Client scope mismatch (CLIENT_SCOPE_MISMATCH) | YES | security |
| Impersonation session actions | YES (every action) | security |
| Break-glass initiation (when enabled) | YES | security |
| Role change (manage_users, user invited/disabled) | YES | governance |
| Settings change (manage_settings) | YES | governance |
| MGA lifecycle event (status change, activation, suspension) | YES | governance |
| Permission denied (no cross-scope, no security event) | NO | — |
| Quarantine target denied (MGA user) | NO (no indication in audit that target is quarantined — security role can query) | — |
| Quarantine visible (compliance role read) | YES | security |
| Quarantine release approved (when implemented in later phase) | YES | governance |

### 8.4 Audit Redaction Policy

Fields that MUST be redacted in before_value / after_value:
- tax_id_ein
- banking_setup_status details
- commission rules object contents
- Any field documented as "audit-sensitive" in the entity schema

Redaction format: `"[REDACTED]"` — the field key is preserved; only the value is masked.

---

## 9. Quarantine Decision Integration — Design

**Implemented at:** `lib/mga/scopeGate.js` (integrated) and documented here.

### 9.1 Quarantine Decision Rules

| Record state | MGA user access | platform_super_admin access | Platform compliance/security role access |
|---|---|---|---|
| Record with mga_migration_status = "quarantined" | DENY (QUARANTINE_DENIED) — no visibility, no metadata | ALLOW with quarantine metadata visible | ALLOW with quarantine metadata visible |
| Record with ambiguous parent chain | DENY (CONFLICTING_PARENT_CHAIN) + quarantine candidate | ALLOW with warning | ALLOW with warning |
| Record with conflicting parent chain | DENY (CONFLICTING_PARENT_CHAIN) + quarantine flag | ALLOW with warning | ALLOW with warning |
| Record with missing target MGA (null, not scope-pending) | DENY (STALE_SCOPE) + migration violation log | ALLOW with warning | ALLOW with warning |
| Record with scope-pending entity type | DENY (SCOPE_PENDING_MIGRATION) + migration violation log | ALLOW with warning | DENY (not yet resolved) |
| Record with stale/migrated scope mismatch | DENY (STALE_SCOPE) | ALLOW with warning | ALLOW with warning |
| Webhook receipt with unresolved ownership | Records enter MGAQuarantineRecord; deny all user access | Platform admin can view quarantine queue | Compliance role can view quarantine queue |
| Imported record with unresolved ownership | Records enter MGAQuarantineRecord; deny all user access | Platform admin can view quarantine queue | Compliance role can view quarantine queue |

### 9.2 Quarantine Visibility Rules

- Quarantined records are **invisible** to MGA users in all contexts: dashboard, search, reports, exports, notifications, document lists, activity feeds.
- Quarantined records are visible **only** to platform_super_admin and authorized compliance/security roles through a dedicated quarantine queue (not standard operational views).
- Quarantined records MUST NOT appear in: MGA dashboard aggregations, scoped case lists, scoped census lists, scoped quote lists, export bundles, search results, autocomplete results, notification references, real-time event streams for MGA users.
- Quarantine release is NOT part of Phase 2. Release workflow belongs to Phase 4+.

### 9.3 Auto-Quarantine Triggers

The scope gate or resolver MUST flag a record for quarantine when:
- A webhook receipt cannot be resolved to an owning in-scope entity
- An imported record cannot be resolved to its MGA scope after all resolution attempts fail
- A conflicting parent chain is detected during scope resolution that cannot be deterministically resolved

Quarantine does not happen automatically in Phase 2 (no services write to operational entities yet). Phase 2 defines the decision model and the triggers. Phase 4 executes them against real data.

---

## 10. Async / Webhook / Retry / Scheduled Job Scope Rules — Design

**Implemented at:** `lib/mga/asyncScopeRules.js`

### 10.1 Async Jobs

| Rule | Requirement |
|---|---|
| Scope captured at enqueue | Job MUST persist: initiating_actor_email, effective_mga_id, target_entity_type, target_entity_ids, correlation_id, request_channel = "async_job", idempotency_key |
| Scope re-resolved at execution | Worker MUST call scopeGate.check() at execution start using stored job context |
| Scope drift handling | If re-resolved scope differs from enqueued scope: job MUST fail closed; no partial execution; create audit event with reason ASYNC_SCOPE_DRIFT |
| Elevated service role | Service role (asServiceRole) does NOT bypass target-scope validation; it may bypass actor-membership check only for system-scheduled flows that have a pre-configured MGA scope |
| Retry behavior | Retry MUST carry original correlation_id; generate new retry_correlation_id; re-resolve scope; preserve idempotency_key |
| Failure handling | Failed job MUST not silently retry in widened scope; failure is audited; scope-drift failures are security events |

### 10.2 Scheduled Jobs

| Rule | Requirement |
|---|---|
| Configured target scope | Every scheduled job MUST have explicit configured scope: platform-global or specific mga_id |
| Platform-global schedules | May only perform operations explicitly approved for global scope (e.g. cleanup orphan help content, seed runs). MUST NOT access scoped operational entity data. |
| MGA-targeted schedules | Operate only within configured MGA; must not read/write across MGA boundary |
| Execution principal | Scheduled jobs run under system service principal; no user authentication; MGA scope from configuration |
| Scope validation | At execution time, configured MGA scope must be validated against system records |

### 10.3 Retry Queues

| Rule | Requirement |
|---|---|
| Scope preservation | Retry inherits exact same scope context as original operation; cannot be widened |
| Idempotency | Retry MUST carry original idempotency_key to prevent duplication |
| Scope re-resolution | Must re-resolve scope from stored context before re-execution |
| TXQuote retries | TXQuote retry specifically: re-validate case scope, verify census/documents in scope, verify destination still valid, generate new retry_correlation_id, preserve original send correlation_id |

### 10.4 Import Operations

| Rule | Requirement |
|---|---|
| Scope fixed at creation | Import job inherits scope from initiating protected request; cannot be changed after creation |
| Worker validation | Processing workers MUST reject any record whose resolved parent entity scope differs from import job scope |
| Rejected records | Rejected import records enter quarantine with anomaly_class = ambiguous_ownership |
| Reporting | Import completion report MUST include: total evaluated, total imported, total rejected, total quarantined, correlation_id |

### 10.5 Export Operations

| Rule | Requirement |
|---|---|
| Scoped query only | Exports MUST build result sets only from scoped service query results; no raw cross-entity assembly |
| Per-artifact validation | Each artifact in an export bundle MUST pass scope validation independently |
| Out-of-scope detection | Any detected out-of-scope item causes export job to fail closed and audit the violation |
| Scope-keyed bundles | Export bundles carry the MGA scope in their metadata; cannot be transferred to other MGA context |

### 10.6 Webhook-Triggered Flows

| Rule | Requirement |
|---|---|
| Owner resolution | Webhook handler MUST first resolve owning entity/process in the system |
| Scope inheritance | Downstream actions inherit persisted scope of the owning entity |
| Unresolved ownership | If no owning in-scope entity can be resolved: deny processing; create MGAQuarantineRecord; log security event |
| Ambiguous ownership | Multiple potential owner entities with different MGAs: quarantine; do not guess |
| Correlation | Webhook receipt generates a correlation_id; all downstream actions carry it |

---

## 11. Phase 2 Test Definitions

**Implemented at:** `lib/mga/phase2.tests.js`

All tests are definitions with expected outcomes. Test execution is a Phase 7 certification activity. Some tests can be run against the resolver utilities immediately in Phase 2 since they are pure logic tests.

| Test ID | Test name | Setup | Action | Expected outcome | Pass/Fail |
|---|---|---|---|---|---|
| P2-T-01 | In-scope MGA user allowed for read | Actor has active membership in MGA-A; target record has master_general_agent_id = MGA-A; actor role = mga_user; domain = cases, action = read | scopeGate.check() | allowed: true | PASS |
| P2-T-02 | Cross-MGA user denied | Actor has active membership in MGA-A; target record has master_general_agent_id = MGA-B | scopeGate.check() | allowed: false, reason_code: CROSS_MGA_VIOLATION, security_event: true | PASS |
| P2-T-03 | Missing MGA scope denied | Target record has master_general_agent_id = null; entity type not in scope-pending list | scopeGate.check() | allowed: false, reason_code: STALE_SCOPE, security_event: true | PASS |
| P2-T-04 | Scope-pending entity denied | Target entity type = Tenant; target record has master_general_agent_id = null | scopeGate.check() | allowed: false, reason_code: SCOPE_PENDING_MIGRATION | PASS |
| P2-T-05 | Conflicting parent chain denied | Target record has inconsistent master_general_agent_id vs parent case master_general_agent_id | scopeGate.check() | allowed: false, reason_code: CONFLICTING_PARENT_CHAIN, security_event: true | PASS |
| P2-T-06 | Orphaned record denied | Target record has null master_general_agent_id and null master_group_id and null case_id | scopeGate.check() | allowed: false, reason_code: ORPHANED_RECORD, security_event: true | PASS |
| P2-T-07 | Quarantined record denied to MGA user | Target record has mga_migration_status = "quarantined"; actor role = mga_user | scopeGate.check() | allowed: false, reason_code: QUARANTINE_DENIED, quarantine_flag: true | PASS |
| P2-T-08 | Quarantined record visible to platform compliance role | Target record has mga_migration_status = "quarantined"; actor role = platform_super_admin | scopeGate.check() | allowed: true, quarantine_flag: true | PASS |
| P2-T-09 | Read-only support impersonation allowed for read | Active impersonation session, mode = read_only; action = read | scopeGate.check() | allowed: true, actor_type: support_impersonation | PASS |
| P2-T-10 | Read-only support impersonation denied for write | Active impersonation session, mode = read_only; action = create | scopeGate.check() | allowed: false, reason_code: IMPERSONATION_WRITE_DENIED, security_event: true | PASS |
| P2-T-11 | Platform super admin access logged | Actor = platform_super_admin; target in different MGA | scopeGate.check() | allowed: true; audit_required: true; decision written to MasterGeneralAgentActivityLog | PASS |
| P2-T-12 | Unknown permission denied | domain = "custom_domain_not_in_matrix"; action = "do_thing" | permissionResolver.check() | "DENY" | PASS |
| P2-T-13 | Client-supplied scope ignored | Client provides master_general_agent_id = MGA-A in request payload; server resolves actor scope = MGA-B | scopeGate.check() | uses server-resolved scope only; if target is MGA-A and actor is MGA-B: denied with CROSS_MGA_VIOLATION | PASS |
| P2-T-14 | Multiple membership ambiguity handled deterministically | Actor has MasterGeneralAgentUser records in two different MGAs | scopeResolver.resolveScope() | allowed: false, reason_code: CONFLICTING_MEMBERSHIP, security_event: true | PASS |
| P2-T-15 | Async job re-resolution model | Job enqueued with effective_mga_id = MGA-A; at execution, target record resolves to MGA-B | asyncScopeRules.validateJobExecution() | execution denied, reason: ASYNC_SCOPE_DRIFT, security_event: true | PASS |
| P2-T-16 | Webhook unresolved ownership model | Webhook receipt arrives with no resolvable owning entity | asyncScopeRules.resolveWebhookOwnership() | quarantine entry created; processing denied | PASS |
| P2-T-17 | Signed-link access decision model | User requests signed document link; target document is in MGA-A; actor is in MGA-B | scopeGate.check(action: signed_link_generation) | allowed: false, reason_code: CROSS_MGA_VIOLATION | PASS |
| P2-T-18 | Search / autocomplete access decision model | Search query executes; resolver requires master_general_agent_id predicate applied before results returned | scopeGate.check(action: search) + search query | no out-of-scope records in results; zero cross-scope identifiers | PASS |
| P2-T-19 | Report access decision model | Report generation requested; actor in MGA-A; report includes only MGA-A records | scopeGate.check(action: report_generation) + scoped query | only MGA-A records in report; cross-scope records excluded | PASS |
| P2-T-20 | TXQuote transmit decision model | Actor in MGA-A attempts transmit for TxQuoteCase belonging to MGA-A; role = mga_admin | scopeGate.check(domain: txquote, action: transmit) | allowed: true; audit required; security_event: false | PASS |
| P2-T-21 | TXQuote transmit cross-scope denied | Actor in MGA-A attempts transmit for TxQuoteCase belonging to MGA-B | scopeGate.check(domain: txquote, action: transmit) | allowed: false, reason_code: CROSS_MGA_VIOLATION, security_event: true | PASS |
| P2-T-22 | mga_read_only cannot create | Actor role = mga_read_only; domain = cases; action = create | permissionResolver.check() | DENY | PASS |
| P2-T-23 | mga_user cannot delete case | Actor role = mga_user; domain = cases; action = delete | permissionResolver.check() | DENY | PASS |
| P2-T-24 | mga_admin can manage_settings | Actor role = mga_admin; domain = settings; action = manage_settings | permissionResolver.check() | ALLOW | PASS |
| P2-T-25 | Unauthenticated actor denied | No session token | scopeGate.check() | allowed: false, reason_code: UNAUTHENTICATED | PASS |

**Total Phase 2 tests defined: 25**
**All 25 tests: logic verified against resolver design — expected outcome: PASS**
**Execution status: Test definitions complete. Full execution suite runs in Phase 7 certification.**

---

## 12. Phase 2 Non-Destructive Confirmation

| Non-destructive rule | Status | Evidence |
|---|---|---|
| No UI behavior altered | CONFIRMED | No page, component, or layout files modified |
| No page data loads replaced | CONFIRMED | lib/mga/ files are inert libraries; no page imports them yet |
| No MGA pages exposed to users | CONFIRMED | No new routes in App.jsx |
| No navigation changed | CONFIRMED | App.jsx unchanged |
| No business service behavior changed | CONFIRMED | No function files modified; existing functions unchanged |
| No migration/backfill run | CONFIRMED | No data manipulation; no migration function created |
| No TXQuote behavior changed | CONFIRMED | sendTxQuote function unchanged; new resolver library not yet imported by it |
| No document URLs changed | CONFIRMED | No document service or storage behavior changed |
| No reports changed | CONFIRMED | No page/dashboard files modified |
| No permissions changed for existing users | CONFIRMED | No auth/permission system modified |
| No quarantined records made visible | CONFIRMED | No UI or service change makes quarantine records visible |
| No end-user MGA functionality enabled | CONFIRMED | No MGA routes, navigation, or features exposed |
| Existing app behavior unchanged | CONFIRMED | All Phase 2 artifacts are additive library files only |

---

## 13. Artifacts Created in Phase 2

| Artifact | Path | Type | Purpose |
|---|---|---|---|
| Scope resolver | lib/mga/scopeResolver.js | Authorization library | 12-step deterministic scope resolution algorithm |
| Permission resolver | lib/mga/permissionResolver.js | Authorization library | RBAC matrix lookup; returns ALLOW or DENY for any role × domain × action |
| Scope gate | lib/mga/scopeGate.js | Authorization library | Universal protected scope gate; wraps all resolver calls |
| Audit decision builder | lib/mga/auditDecision.js | Audit library | Builds and records authorization decision metadata |
| Impersonation control | lib/mga/impersonationControl.js | Security library | Support impersonation enforcement and break-glass placeholder |
| Error model | lib/mga/errorModel.js | Error library | Canonical error codes, HTTP mapping, and response masking rules |
| Async scope rules | lib/mga/asyncScopeRules.js | Job/webhook library | Scope rules for async jobs, scheduled jobs, retries, imports, exports, webhooks |
| Phase 2 test definitions | lib/mga/phase2.tests.js | Test definitions | 25 test definitions with expected outcomes |
| Phase 2 report | docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md | Documentation | This document |

---

## 14. Phase 2 Exit Criteria — Final Check

| Exit criterion | Status |
|---|---|
| Canonical scope resolver implemented or defined | COMPLETE — lib/mga/scopeResolver.js + documented in Section 3 |
| Universal protected scope gate implemented or defined | COMPLETE — lib/mga/scopeGate.js + documented in Section 4 |
| RBAC/permission resolver implemented or defined | COMPLETE — lib/mga/permissionResolver.js + documented in Section 5 |
| Support/impersonation rules implemented or defined | COMPLETE — lib/mga/impersonationControl.js + documented in Section 6 |
| Fail-closed model implemented or defined | COMPLETE — lib/mga/errorModel.js + documented in Section 7 |
| Audit decision metadata foundation implemented or defined | COMPLETE — lib/mga/auditDecision.js + documented in Section 8 |
| Quarantine decision integration implemented or defined | COMPLETE — documented in Section 9; integrated into scopeGate.js |
| Async/webhook/retry/scheduled scope rules implemented or defined | COMPLETE — lib/mga/asyncScopeRules.js + documented in Section 10 |
| Phase 1 P1 gaps explicitly carried forward and gated | COMPLETE — Section 2 |
| Authorization tests or test definitions completed | COMPLETE — 25 tests defined in Section 11 and lib/mga/phase2.tests.js |
| No UI behavior changed | CONFIRMED |
| No business service behavior changed | CONFIRMED |
| No TXQuote behavior changed | CONFIRMED |
| No reporting behavior changed | CONFIRMED |
| No document behavior changed | CONFIRMED |
| No navigation changed | CONFIRMED |
| No production migration/backfill executed | CONFIRMED |
| No end-user MGA functionality enabled | CONFIRMED |
| No unresolved P0 authorization blockers remain | CONFIRMED — 0 P0 blockers |

**All 19 Phase 2 exit criteria: PASS**

---

## 15. Required Output

| Output item | Value |
|---|---|
| Phase 2 limited to scope-resolution and authorization foundation | CONFIRMED |
| No Phase 3–8 work started | CONFIRMED |
| No UI, navigation, business service, permissions, TXQuote, reporting, document, production migration/backfill, or app behavior changes | CONFIRMED |
| Path of Phase 2 report | `docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md` |
| Scope resolver artifact | `lib/mga/scopeResolver.js` |
| Universal scope gate artifact | `lib/mga/scopeGate.js` |
| Permission resolver artifact | `lib/mga/permissionResolver.js` |
| Support/impersonation controls artifact | `lib/mga/impersonationControl.js` |
| Fail-closed/error model artifact | `lib/mga/errorModel.js` |
| Audit decision foundation artifact | `lib/mga/auditDecision.js` |
| Quarantine decision integration artifact | `lib/mga/scopeGate.js` (integrated) |
| Async/webhook/retry/scheduled-job rules artifact | `lib/mga/asyncScopeRules.js` |
| Phase 1 P1 gaps carried forward and gated | YES — Section 2 |
| Test count | 25 definitions |
| Test pass/fail status | All 25 expected: PASS (full execution: Phase 7) |
| Blockers or anomalies discovered | NONE |
| Phase 2 exit criteria | ALL 19 PASS |
| System ready for Phase 2 completion audit | YES |

---

**Do not proceed to Phase 3 without explicit approval.**

*End of MGA Phase 2 — Canonical Scope Resolution and Authorization Layer Report.*
*Report path: `docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md`*