# Gate 7A-P: Enterprise Integration Readiness and Design Freeze

**Date:** 2026-05-13  
**Status:** DESIGN_FREEZE (Awaiting Operator Approval)  
**Phase:** Pre-Implementation Planning (Gate 7A-0 Work Order Blocked)  
**Authority:** Base44 Enterprise Control Directive

---

## 1. Architecture Decision Record

### 1.1 Broker Agency as First-Class Platform Actor

**Decision:** CONFIRMED LOCKED

Broker Agency is elevated to first-class platform actor status, equivalent in architectural authority to MGA.

**Implication:**
- Broker Agency is not a subsidiary or sub-entity of MGA
- Broker Agency can exist and operate independently without MGA association
- Broker Agency has its own workspace, users, book of business, and audit trail
- Broker Agency access control is NOT derived from MGA membership

**Enforcement:**
- `BrokerAgencyProfile` is independently creatable via broker signup workflow
- `BrokerAgencyProfile` has its own status lifecycle (draft → pending_profile_completion → active)
- `BrokerAgencyProfile` has independent audit events and approval chain
- No MGA relationship is required for broker operation

---

### 1.2 BrokerAgencyProfile Ownership and Scope

**Decision:** CONFIRMED LOCKED

`BrokerAgencyProfile` is **not owned by MGA**. It is platform-scoped and self-owned.

**Implication:**
- Ownership: Platform (via Tenant scope)
- `BrokerAgencyProfile.master_general_agent_id` is **optional and nullable**
- `BrokerAgencyProfile.master_general_agent_id` is **non-identifying**
- A broker may never have an MGA (independent model)
- A broker may have an MGA via `BrokerMGARelationship` (optional, explicit)
- Ownership does NOT change based on MGA association

**Enforcement:**
- Schema: `master_general_agent_id` nullable, no NOT NULL constraint
- Scope resolver: Always checks `broker_agency_id` first; MGA scope is additive only
- Audit trail: BrokerAgencyProfile creation logged independently of any MGA
- Deletion rules: Can delete broker without deleting MGA and vice versa

---

### 1.3 DistributionChannelContext as Canonical Ownership and Lineage Context

**Decision:** CONFIRMED LOCKED

`DistributionChannelContext` (new entity, future phase) is the **canonical ownership, visibility, and lineage context** for all downstream business records (cases, quotes, proposals, census, documents, etc.).

**Implication:**
- Every business record carries a `distribution_channel_context_id` reference
- Ownership is determined by channel type + actor role, NOT by entity membership alone
- Visibility rules are derived from channel context, not from parent entity
- Lineage rules (who created what, which entity chain, which workflow) are channel-specific
- Legacy compatibility mode: If `distribution_channel_context_id` is null, scope resolver falls back to legacy rules (MGA → Broker inheritance)

**Enforcement:**
- New business records: Must have `distribution_channel_context_id` stamped at creation
- Legacy backfill: Shadow-stamp all existing records with inferred context
- Scope resolver: Checks channel context BEFORE checking parent entity hierarchy
- Feature flag: `DISTRIBUTION_CHANNEL_CONTEXT_ENABLED` gates new behavior; defaults to false
- Audit trail: Context type logged on every creation/update

---

## 2. Canonical Domain Model Map

### 2.1 Tenant (Root Scope)
- **id** (PK)
- **name**
- **status** (active/suspended/archived)
- **created_at**, **updated_at**
- **Scope:** All entities are tenant-scoped
- **Ownership:** Platform root

### 2.2 Platform (Administrative)
- **id** (PK)
- **platform_user_id** (FK to User)
- **role** (admin/super_admin/support/read_only)
- **permissions** (set of platform_*.* namespace permissions)
- **Scope:** Tenant-level access
- **Ownership:** Tenant

### 2.3 MasterGeneralAgent (MGA)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **name**, **legal_entity_name**, **code**
- **status** (pending_onboarding/active/suspended/inactive)
- **onboarding_status** (not_started/business_identity/.../activated)
- **master_group_id** (FK, optional, legacy compatibility)
- **created_by_platform_user** (audit trail)
- **Scope:** Tenant
- **Ownership:** Platform (independent entity)
- **Child relationships:** BrokerMGARelationship (0..many)

### 2.4 MasterGroup (Legacy Compatibility)
- **id** (PK)
- **master_general_agent_id** (FK, optional, nullable)
- **mga_assigned_at**, **mga_assigned_by**
- **ownership_status** (unassigned/assigned/disputed/quarantined)
- **name**, **code**, **status**
- **Scope:** Tenant (if MGA-associated); Platform (if unassigned)
- **Ownership:** MGA (if assigned); Platform (if unassigned)
- **Note:** Legacy entity; new brokers do NOT create MasterGroup records

### 2.5 BrokerAgencyProfile (First-Class Actor)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **master_general_agent_id** (FK, **NULLABLE**, optional, non-identifying)
- **legal_name**, **dba_name**, **code**
- **primary_contact_name**, **primary_contact_email**, **primary_phone**
- **state**, **zip_code**, **address**
- **license_states**, **license_expiration_date**
- **insurance_lines** (array: health/dental/vision/life/disability/etc.)
- **onboarding_status** (draft/pending_profile_completion/active/suspended)
- **portal_access_enabled** (boolean)
- **approved_by_user_email**, **approved_at**
- **is_smoke_test** (boolean, for QA cleanup)
- **Scope:** Tenant (independent ownership)
- **Ownership:** Platform / Self (not owned by MGA)
- **Child relationships:** BrokerPlatformRelationship (1), BrokerMGARelationship (0..1), BrokerAgencyUser (0..many)

### 2.6 BrokerPlatformRelationship (Broker ↔ Platform Contract)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **broker_agency_id** (FK to BrokerAgencyProfile, unique per broker)
- **status** (pending_approval/approved/suspended/inactive)
- **approval_status** (none/pending/approved/rejected)
- **approval_requested_by_user_email**, **approval_requested_at**
- **approved_by_user_email**, **approved_at**
- **compliance_status** (pending_review/compliant/issues_found/suspended)
- **Scope:** Tenant
- **Ownership:** Platform
- **Constraint:** One per BrokerAgencyProfile; cannot be deleted without broker deletion
- **Enforcement:** Must be active for broker to access workspace

### 2.7 BrokerMGARelationship (Broker ↔ MGA Association, Optional)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **broker_agency_id** (FK to BrokerAgencyProfile)
- **master_general_agent_id** (FK to MasterGeneralAgent)
- **relationship_type** (affiliated/delegated/hybrid)
- **status** (draft/active/suspended/terminated)
- **established_at**, **established_by_user_email**
- **Scope:** Tenant
- **Ownership:** MGA (relationship owned by MGA, not broker)
- **Constraint:** Optional (0..1 per broker); can be null
- **Enforcement:** If present and active, broker inherits some MGA scopes (via legacy compatibility)

### 2.8 BrokerScopeAccessGrant (Explicit Broker Access to MGA or Platform Resources)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **broker_agency_id** (FK to BrokerAgencyProfile)
- **target_entity_type** (MGA/Employer/Case/Document)
- **target_entity_id** (FK to target entity)
- **granted_by_user_id** (audit trail)
- **granted_at**, **expires_at** (optional, can be null for permanent)
- **Scope:** Tenant
- **Ownership:** Platform (administrator)
- **Enforcement:** Required for broker to access resources outside its direct book

### 2.9 DistributionChannelContext (Future: Canonical Ownership, Visibility, Lineage)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **channel_type** (platform_direct/standalone_broker/mga_direct/mga_affiliated_broker/hybrid_broker_direct/hybrid_broker_mga/employer_direct)
- **primary_actor_type** (platform/mga/broker/employer)
- **primary_actor_id** (FK to primary entity)
- **secondary_actor_type** (nullable)
- **secondary_actor_id** (nullable FK)
- **visibility_scope** (defines who can see records in this context)
- **ownership_scope** (defines who can modify records in this context)
- **lineage_chain** (JSON: ancestry of decision/approval chain)
- **created_at**, **created_by_user_id**
- **Scope:** Tenant
- **Ownership:** Platform
- **Feature Flag:** `DISTRIBUTION_CHANNEL_CONTEXT_ENABLED` (defaults false)

### 2.10 Employer (Case Owner)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **master_general_agent_id** (FK, optional, for MGA-direct employers)
- **broker_agency_id** (FK, optional, for broker-direct employers)
- **agency_id** (FK, legacy compatibility)
- **name**, **dba_name**, **ein**
- **address**, **city**, **state**, **zip**
- **phone**, **website**, **email**
- **employee_count**, **eligible_count**
- **status** (prospect/active/inactive/terminated)
- **Scope:** Tenant
- **Ownership:** Creator (broker/MGA/employer/platform user)
- **Child relationships:** BenefitCase (0..many)

### 2.11 BenefitCase / EmployerCase (Business Workflow)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **master_general_agent_id** (FK, optional, for MGA context)
- **broker_agency_id** (FK, optional, for broker context)
- **distribution_channel_context_id** (FK, future: canonical context)
- **employer_group_id** (FK to EmployerGroup)
- **case_number** (auto-generated reference)
- **case_type** (new_business/renewal/mid_year_change/takeover)
- **effective_date**, **stage**, **priority**
- **assigned_to** (user email)
- **products_requested** (array)
- **census_status**, **quote_status**, **enrollment_status**
- **target_close_date**, **closed_date**, **closed_reason**
- **Scope:** Tenant
- **Ownership:** Creator (broker/MGA user)
- **Constraint:** Cannot be deleted without cascading to census/quotes/proposals
- **Child relationships:** CensusVersion, QuoteScenario, Proposal, EmployeeEnrollment

### 2.12 CensusVersion
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **case_id** (FK to BenefitCase)
- **master_general_agent_id** (FK, inherited from case)
- **broker_agency_id** (FK, inherited from case)
- **version_number**
- **file_url**, **file_name**
- **status** (uploaded/mapping/validating/validated/has_issues/archived)
- **total_employees**, **total_dependents**, **eligible_employees**
- **validation_errors**, **validation_warnings**
- **uploaded_by**, **validated_at**
- **Scope:** Tenant, inherited from case
- **Ownership:** Case owner
- **Child relationships:** CensusMember (0..many)

### 2.13 QuoteScenario
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **case_id** (FK to BenefitCase)
- **master_general_agent_id** (inherited from case)
- **broker_agency_id** (inherited from case)
- **distribution_channel_context_id** (future: inherited from case)
- **name**, **description**
- **status** (draft/running/completed/error/expired)
- **census_version_id** (FK to CensusVersion)
- **products_included**, **carriers_included**
- **contribution_strategy**, **employer_contribution_ee**, **employer_contribution_dep**
- **total_monthly_premium**, **employer_monthly_cost**, **employee_monthly_cost_avg**
- **approval_status** (none/pending/approved/rejected)
- **Scope:** Tenant, inherited from case
- **Ownership:** Case owner
- **Child relationships:** Proposal (0..many), QuoteAssignment (0..many)

### 2.14 QuoteAssignment (Quote Delegation / Channel Wrapper)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **quote_scenario_id** (FK to QuoteScenario)
- **assigned_to_actor_type** (broker/mga/employer)
- **assigned_to_actor_id** (FK to actor entity)
- **assignment_type** (for_pricing/for_review/for_approval/for_implementation)
- **status** (pending/accepted/completed/rejected/expired)
- **created_at**, **created_by_user_id**
- **Scope:** Tenant
- **Ownership:** Quote owner (case owner or assigner)
- **Feature Flag:** `QUOTE_DELEGATION_ENABLED` (future)
- **Constraint:** Assignment cannot grant access outside assignment scope

### 2.15 Proposal
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **case_id** (FK to BenefitCase)
- **scenario_id** (FK to QuoteScenario)
- **distribution_channel_context_id** (future)
- **master_general_agent_id** (inherited)
- **broker_agency_id** (inherited)
- **title**, **version**
- **status** (draft/sent/viewed/approved/rejected/expired)
- **broker_name**, **broker_email**
- **agency_name**
- **cover_message**, **plan_summary**, **contribution_summary**
- **total_monthly_premium**, **employer_monthly_cost**, **employee_avg_cost**
- **sent_at**, **viewed_at**, **approved_at**, **expires_at**
- **Scope:** Tenant
- **Ownership:** Case owner

### 2.16 EmployeeEnrollment / EnrollmentMember
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **enrollment_window_id** (FK)
- **case_id** (FK to BenefitCase)
- **master_general_agent_id** (inherited)
- **broker_agency_id** (inherited)
- **employee_email**, **employee_name**, **access_token**
- **status** (invited/started/completed/waived)
- **coverage_tier**, **selected_plan_id**, **selected_plan_name**
- **docusign_envelope_id**, **docusign_status**, **docusign_signed_at**
- **Scope:** Tenant
- **Ownership:** Employer

### 2.17 Task
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **case_id** (FK to BenefitCase)
- **master_general_agent_id** (inherited)
- **broker_agency_id** (inherited)
- **title**, **description**, **task_type**
- **status** (pending/in_progress/completed/cancelled/blocked)
- **priority**, **assigned_to**, **due_date**
- **completed_at**, **completed_by**
- **Scope:** Tenant
- **Ownership:** Case owner

### 2.18 AuditEvent (Immutable Append-Only)
- **id** (PK)
- **tenant_id** (FK to Tenant)
- **actor_user_id** (FK to User), **actor_role**, **actor_email**
- **action**, **detail**, **outcome** (success/failed/blocked)
- **entity_type**, **entity_id**
- **old_value**, **new_value**
- **correlation_id** (links multi-step operations)
- **timestamp** (immutable, server-set)
- **Scope:** Tenant
- **Ownership:** Platform (read-only after creation)
- **Constraint:** Cannot be updated or deleted; only created/read

---

## 3. Entity Relationship Design

### 3.1 Required Fields (Non-Nullable)

| Entity | Required Fields |
|--------|-----------------|
| BrokerAgencyProfile | tenant_id, legal_name, primary_contact_email, state, zip_code |
| BrokerPlatformRelationship | tenant_id, broker_agency_id |
| BenefitCase | tenant_id, employer_group_id, case_type |
| CensusVersion | tenant_id, case_id |
| QuoteScenario | tenant_id, case_id, name |
| Proposal | tenant_id, case_id, title |
| AuditEvent | tenant_id, action, timestamp |

### 3.2 Nullable Fields (Optional)

| Entity | Nullable Fields |
|--------|-----------------|
| BrokerAgencyProfile | master_general_agent_id, dba_name, approved_at |
| BenefitCase | master_general_agent_id, broker_agency_id, assigned_to |
| CensusVersion | master_general_agent_id, broker_agency_id |
| QuoteScenario | master_general_agent_id, broker_agency_id |
| BrokerMGARelationship | (entire record optional per broker) |
| DistributionChannelContext | secondary_actor_type, secondary_actor_id, expires_at |

### 3.3 Legacy Compatibility Fields

| Entity | Legacy Field | Status | Migration Path |
|--------|--------------|--------|-----------------|
| BrokerAgencyProfile | agency_id (if backfilled) | Optional | Link to Agency.id or infer from relationships |
| BenefitCase | master_group_id | Optional | Map to master_general_agent_id via MasterGroup.master_general_agent_id |
| EmployerGroup | master_group_id | Optional | Map to MGA context if present |
| CensusMember | gradient_ai_data | Keep | Preserved as-is; not modified by new gates |

### 3.4 Standalone Broker Constraint

**Rule:** A `BrokerAgencyProfile` with `master_general_agent_id = NULL` is a **standalone broker**.

- Can create its own cases and census
- Can invite its own users
- Can manage its own book of business
- Does NOT see MGA records
- Does NOT see other brokers' records
- Does NOT have access to MGA workspace

**Enforcement:**
- Scope resolver: Requires explicit `BrokerScopeAccessGrant` for any cross-broker or cross-MGA access
- Permission resolver: Denies access to MGA-scoped operations if no BrokerMGARelationship exists
- Audit trail: Case creation logs as "standalone_broker" channel type (once DistributionChannelContext enabled)

---

## 4. Scope Resolver Decision Table

### 4.1 Access Matrix: Actor vs. Channel Type

**Legend:** ✅ Visible | ❌ Masked 404 | ⛔ 403 Permission Denied | 🔐 Requires BrokerScopeAccessGrant

| Actor Role | platform_direct | standalone_broker | mga_direct | mga_affiliated_broker | hybrid_broker_direct | hybrid_broker_mga | employer_direct |
|---|---|---|---|---|---|---|---|
| **Platform Admin** | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) | ✅ (all) |
| **Platform Support** | ✅ (read-only) | ✅ (read-only) | ✅ (read-only) | ✅ (read-only) | ✅ (read-only) | ✅ (read-only) | ✅ (read-only) |
| **MGA Admin** | ❌ | ❌ | ✅ (own MGA) | ✅ (own MGA) | ⛔ | ✅ (own MGA) | ❌ |
| **MGA User** | ❌ | ❌ | ✅ (own MGA) | ✅ (own MGA) | ⛔ | ✅ (own MGA) | ❌ |
| **Broker Agency Admin** | ❌ | ✅ (own broker) | ❌ | 🔐 (if linked) | ✅ (own broker) | 🔐 (if linked) | 🔐 (if employer-linked) |
| **Broker Producer** | ❌ | ✅ (own broker, read/write case) | ❌ | 🔐 (if linked) | ✅ (own broker) | 🔐 (if linked) | 🔐 (if assigned) |
| **Broker Benefits Admin** | ❌ | ✅ (own broker, benefits ops) | ❌ | 🔐 (if linked) | ✅ (own broker) | 🔐 (if linked) | 🔐 (if assigned) |
| **Broker Read-Only** | ❌ | ✅ (own broker, read-only) | ❌ | ❌ | ✅ (own broker) | ❌ | ❌ |
| **Employer User** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (own employer case) |

### 4.2 Scope Failure Behaviors

**Masked 404 (Preferred for security):**
- User requests record outside their scope
- System returns 404 Not Found (never 403)
- Audit log: Access attempt blocked (scope mismatch), not permission denied
- User perception: Record does not exist (no information leakage)

**403 Permission Denied:**
- User requests record within their scope but lacks permission
- System returns 403 Forbidden (explicit permission check failed)
- Audit log: Access attempt blocked (insufficient permission), not scope mismatch
- User perception: Access denied due to role (record exists, you don't have permission)

**403 vs 404 Decision:**
- If actor is in the **same tenant** but different **scope** (broker/MGA/channel) → 404
- If actor is in the **same scope** but lacks **permission** → 403
- If actor is in **different tenant** → 404 (never expose tenant existence)

---

## 5. Permission Matrix

### 5.1 platform_broker.* Namespace (Broker-Related Platform Admin Operations)

| Permission | Admin | Support | MGA Admin | Broker Admin | Broker User |
|---|---|---|---|---|---|
| platform_broker.view | ✅ | ✅ | ❌ | ❌ | ❌ |
| platform_broker.create | ✅ | ❌ | ❌ | ❌ | ❌ |
| platform_broker.approve | ✅ | ❌ | ❌ | ❌ | ❌ |
| platform_broker.suspend | ✅ | ❌ | ❌ | ❌ | ❌ |
| platform_broker.manage_compliance | ✅ | ❌ | ❌ | ❌ | ❌ |

### 5.2 broker_agency.* Namespace (Broker-Owned Operations)

| Permission | Broker Admin | Broker Producer | Broker Benefits Admin | Broker Read-Only |
|---|---|---|---|---|
| broker_agency.view | ✅ | ✅ | ✅ | ✅ |
| broker_agency.manage_users | ✅ | ❌ | ❌ | ❌ |
| broker_agency.view_financials | ✅ | ❌ | ✅ | ❌ |
| broker_agency.manage_settings | ✅ | ❌ | ❌ | ❌ |
| broker_agency.user.view | ✅ | ✅ | ✅ | ✅ |
| broker_agency.user.invite | ✅ | ❌ | ❌ | ❌ |
| broker_agency.user.manage_role | ✅ | ❌ | ❌ | ❌ |
| broker_agency.user.deactivate | ✅ | ❌ | ❌ | ❌ |

### 5.3 broker_direct.* Namespace (Broker Book-of-Business Operations)

| Permission | Broker Admin | Broker Producer | Broker Benefits Admin | Broker Read-Only |
|---|---|---|---|---|
| broker_direct.case.view | ✅ | ✅ | ✅ | ✅ |
| broker_direct.case.create | ✅ | ✅ | ❌ | ❌ |
| broker_direct.case.manage | ✅ | ✅ | ❌ | ❌ |
| broker_direct.census.upload | ✅ | ✅ | ✅ | ❌ |
| broker_direct.quote.create | ✅ | ✅ | ❌ | ❌ |
| broker_direct.quote.view | ✅ | ✅ | ✅ | ✅ |
| broker_direct.proposal.send | ✅ | ✅ | ❌ | ❌ |
| broker_direct.enrollment.manage | ✅ | ✅ | ✅ | ❌ |

### 5.4 broker_mga.* Namespace (Broker ↔ MGA Integration, If Relationship Exists)

| Permission | Broker Admin (MGA-Affiliated) | MGA Admin (Affiliated Broker Access) |
|---|---|---|
| broker_mga.view_mga_data | 🔐 (if relationship active) | ✅ |
| broker_mga.delegate_quote | 🔐 (if delegation enabled) | 🔐 (if delegation enabled) |
| broker_mga.access_mga_cases | ⛔ (default denied) | ✅ |

### 5.5 quote_delegation.* Namespace (Future: Quote Assignment/Channel Wrapper)

| Permission | Assigner | Assignee (Broker) | Assignee (MGA) |
|---|---|---|---|
| quote_delegation.assign | ✅ | ❌ | ❌ |
| quote_delegation.accept | ❌ | ✅ | ✅ |
| quote_delegation.revoke | ✅ | ❌ | ❌ |

### 5.6 benefits_admin.* Namespace (Benefits Admin Bridge, If Enabled)

| Permission | Broker Benefits Admin | MGA Benefits Admin |
|---|---|---|
| benefits_admin.case_shell.create | 🔐 (if bridge enabled) | ✅ |
| benefits_admin.enrollment.manage | ✅ | 🔐 (if broker-assigned) |
| benefits_admin.docusign.send | ✅ | 🔐 (if broker-assigned) |
| benefits_admin.bridge.switch | ✅ (between broker and admin) | 🔐 (with permission) |

---

## 6. Feature Flag Dependency Matrix

### 6.1 Feature Flag Registry

All feature flags default to **false** and **fail closed**.

| Flag | Default | Dependencies | Blocks |
|------|---------|--------------|--------|
| `FIRST_CLASS_BROKER_MODEL_ENABLED` | false | BROKER_SIGNUP_ENABLED | Broker workspace, cases, workspace dashboard |
| `DISTRIBUTION_CHANNEL_CONTEXT_ENABLED` | false | None (shadow backfill if enabled) | Case creation metadata, visibility rules |
| `BROKER_SIGNUP_ENABLED` | false | None | Broker signup route, profile creation |
| `BROKER_ONBOARDING_ENABLED` | false | BROKER_SIGNUP_ENABLED | Approval workflow, compliance checks |
| `BROKER_WORKSPACE_ENABLED` | false | FIRST_CLASS_BROKER_MODEL_ENABLED | /broker routes, dashboard, user workspace |
| `BROKER_PLATFORM_RELATIONSHIP_ENABLED` | false | BROKER_WORKSPACE_ENABLED | Platform relationship creation, approval chain |
| `BROKER_MGA_RELATIONSHIP_ENABLED` | false | BROKER_WORKSPACE_ENABLED, FIRST_CLASS_BROKER_MODEL_ENABLED | MGA affiliation, cross-scope access |
| `BROKER_SCOPE_ACCESS_GRANT_ENABLED` | false | BROKER_MGA_RELATIONSHIP_ENABLED | Explicit scope grants, cross-broker access |
| `QUOTE_CHANNEL_WRAPPER_ENABLED` | false | BROKER_WORKSPACE_ENABLED | Quote assignment, channel context stamping |
| `QUOTE_DELEGATION_ENABLED` | false | QUOTE_CHANNEL_WRAPPER_ENABLED | Quote delegation UI, assignment endpoints |
| `BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED` | false | BROKER_WORKSPACE_ENABLED | Benefits admin bridge, case shell creation |
| `BENEFITS_ADMIN_CASE_SHELL_ENABLED` | false | BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED | Enrollment workflow case shells |

### 6.2 Dependency Chain (Left → Right = "blocks" / "enables")

```
BROKER_SIGNUP_ENABLED
├─→ BROKER_ONBOARDING_ENABLED
│   └─→ BROKER_WORKSPACE_ENABLED
│       ├─→ BROKER_PLATFORM_RELATIONSHIP_ENABLED
│       ├─→ BROKER_MGA_RELATIONSHIP_ENABLED
│       │   ├─→ BROKER_SCOPE_ACCESS_GRANT_ENABLED
│       │   └─→ (MGA integration)
│       ├─→ FIRST_CLASS_BROKER_MODEL_ENABLED
│       │   └─→ BROKER_WORKSPACE_ENABLED (circular, both required)
│       ├─→ QUOTE_CHANNEL_WRAPPER_ENABLED
│       │   ├─→ DISTRIBUTION_CHANNEL_CONTEXT_ENABLED (shadow mode)
│       │   ├─→ QUOTE_DELEGATION_ENABLED
│       │   └─→ (quote assignment)
│       └─→ BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED
│           └─→ BENEFITS_ADMIN_CASE_SHELL_ENABLED
│               └─→ (enrollment workflows)
```

### 6.3 Fail-Closed Enforcement

**If flag is false:**
- Route is masked 404
- Permission resolver denies access
- Backend contract rejects request
- UI component not rendered
- No placeholder/disabled state shown
- Feature appears to not exist

**If flag is true but dependencies are false:**
- Feature enables but upstream functionality unavailable
- System logs warning/error
- User sees clear error message (not fallback)
- Feature degrades gracefully (e.g., can't assign quote if wrapper disabled)

---

## 7. Required Enterprise Enhancements Before Deployment

### 7.1 Required Before Gate 7A-0 Implementation

| Enhancement | Purpose | Status |
|---|---|---|
| Channel Context Banner | Show actor which channel/broker/MGA they're in | REQUIRED |
| Scope Explanation Modal | Help users understand access boundaries | REQUIRED |
| Broker Book Switcher | Allow broker admin to switch between owned brokers (if multi-owner) | REQUIRED |
| Frontend Raw Entity-Read Prevention | Intercept all direct entity reads, route through contract | REQUIRED |
| Audit Event Immutability Enforcement | Prevent updates to audit events post-creation | REQUIRED |
| Feature Flag Centralization | Single source of truth for all flags | REQUIRED |
| Scope Resolver Centralization | All scope checks via single contract | REQUIRED |
| Permission Resolver Centralization | All permission checks via single contract | REQUIRED |
| Audit Writer Centralization | All audit events via single contract | REQUIRED |
| Backend Contracts for Protected Access | Typed, validated contracts for all protected operations | REQUIRED |

### 7.2 Recommended But Optional (Can be deferred to Phase 3+)

| Enhancement | Purpose | Target Phase |
|---|---|---|
| Broker Compliance Expiration Center | Dashboard to track broker license/NPN expiration | Phase 3+ |
| NPN/License Validation Workflow | Automated license checks during onboarding | Phase 3+ |
| Duplicate Broker Detection | Flag potential duplicate broker agencies | Phase 3+ |
| Broker Relationship Conflict Detector | Alert if broker in conflicting MGA relationships | Phase 3+ |
| Lineage Inspector | Audit tool to trace record ownership/creation chain | Phase 3+ |
| Idempotency Warning for Duplicate Benefits Admin Setup | Warn if benefits admin bridge called multiple times | Phase 3+ |
| Benefits Bridge Recovery Dashboard | Admin tool to debug/recover failed bridge operations | Phase 3+ |
| Performance Indexes and Dashboard Caching | Optimize query performance, cache key dashboards | Phase 3+ |
| Production Observability Dashboard | Monitoring for errors, latency, audit completeness | Phase 3+ |
| Support Mode Audit Banner | Indicate when platform admin is viewing as broker | Phase 3+ |
| Canary Rollout Plan | Gradual feature flag rollout to subset of tenants | Phase 3+ |

### 7.3 Future Roadmap (Phase 4+)

- Advanced quote delegation with approval workflows
- Multi-tenant broker operations (same broker across tenants)
- Broker commission tracking and reconciliation
- Direct employer onboarding without broker
- Broker API for third-party integrations
- Advanced analytics and predictive modeling

---

## 8. Migration Safety Plan

### 8.1 Schema Expansion Only (No Destructive Changes)

**Rule:** All schema changes are **additive only**.

- Add new columns/entities
- Do NOT remove or rename existing columns/entities
- Do NOT change field types
- Do NOT add non-nullable constraints without default values
- Do NOT modify existing indexes

**Backward Compatibility:**
- Existing queries continue to work
- Legacy code paths remain functional
- Feature flags gate new behavior (old behavior if flag false)

---

### 8.2 Shadow Stamping (Backfill New Fields)

**Process:**
1. Add new columns (e.g., `distribution_channel_context_id`, `master_general_agent_id` on legacy entities)
2. Populate with **inferred values** from existing relationships
3. **Do not update** existing row timestamps (`updated_at` stays original)
4. Mark as "shadow stamped" in audit trail (separate stamp_event)
5. Enable feature flag to activate new logic once stamping complete

**Example - BrokerAgencyProfile backfill:**
- For each broker created during Phase 1:
  - Check if `master_general_agent_id` is NULL (standalone) → keep NULL
  - Check if broker has MGA relationship → stamp with MGA ID
  - Check if broker created before MGA gates → infer from context
  - Log shadow-stamp event with inferred/provided reasoning

---

### 8.3 Dry-Run Backfill (Operator Review Before Execution)

**Steps:**
1. Execute backfill query in **read-only** mode
2. Generate reports:
   - Records to be stamped
   - Inferred values with confidence score
   - Anomalies/ambiguities detected
3. Operator reviews reports
4. Operator approves or requests adjustments
5. Execute actual backfill (with transactions, rollback capability)

**Reports Generated:**
- `shadow_stamp_dry_run_report.json` (records affected, inferred values)
- `duplicate_broker_candidates.json` (brokers that might be duplicates)
- `orphan_broker_report.json` (brokers with no MGA or broker relationships)
- `orphan_mga_report.json` (MGAs with no brokers)
- `unknown_channel_classification_report.json` (cases that can't be classified)

---

### 8.4 Anomaly Report

**Generated during dry-run, reviewed before execution:**

```json
{
  "anomalies": [
    {
      "type": "duplicate_broker_agency",
      "candidate_ids": ["broker_1", "broker_2"],
      "similarity_score": 0.95,
      "reason": "Same legal_name, email, state, zip",
      "recommended_action": "Manual review required; may consolidate or flag"
    },
    {
      "type": "orphan_broker",
      "broker_id": "broker_3",
      "reason": "No MGA relationship, no cases, no users",
      "recommended_action": "Deactivate or investigate"
    },
    {
      "type": "conflicting_mga_relationship",
      "broker_id": "broker_4",
      "mga_ids": ["mga_1", "mga_2"],
      "reason": "Multiple active MGA relationships detected",
      "recommended_action": "Resolve conflict before stamping"
    }
  ]
}
```

---

### 8.5 Duplicate Broker Candidate Report

**Generated pre-backfill to identify potential consolidation opportunities:**

```json
{
  "duplicate_candidates": [
    {
      "group_id": "dup_group_1",
      "brokers": [
        {"id": "broker_1", "legal_name": "Acme Benefits", "email": "contact@acme.com"},
        {"id": "broker_2", "legal_name": "ACME Benefits Inc", "email": "contact@acme.com"}
      ],
      "confidence": "high",
      "suggested_action": "Consolidate broker_2 into broker_1 (manual operator decision)",
      "impact": "Merge BrokerAgencyProfile, merge users, merge cases/census"
    }
  ]
}
```

---

### 8.6 Validation Queries (Post-Backfill)

**Run after backfill to verify correctness:**

```sql
-- Validate: No standalone brokers have MGA relationships
SELECT COUNT(*) FROM broker_agency_profile b
  LEFT JOIN broker_mga_relationship br ON b.id = br.broker_agency_id
  WHERE b.master_general_agent_id IS NULL AND br.id IS NOT NULL;
  -- Should return 0

-- Validate: All brokers have valid master_general_agent_id references
SELECT COUNT(*) FROM broker_agency_profile b
  WHERE b.master_general_agent_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM master_general_agent m WHERE m.id = b.master_general_agent_id);
  -- Should return 0

-- Validate: Shadow-stamped records have correct context
SELECT COUNT(*) FROM benefit_case c
  WHERE c.distribution_channel_context_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM distribution_channel_context d WHERE d.id = c.distribution_channel_context_id);
  -- Should return 0 (after DISTRIBUTION_CHANNEL_CONTEXT_ENABLED is true)
```

---

### 8.7 Dual-Read Compatibility Mode

**During transition, system reads both legacy and new fields:**

```javascript
// Example: Scope resolver in compatibility mode
function resolveBrokerScope(userId, requestedBrokerId) {
  // Check new channel context first (if enabled)
  if (DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    const channelContext = getChannelContext(requestedBrokerId);
    if (!userCanAccessChannel(userId, channelContext)) return MASKED_404;
  }
  
  // Fall back to legacy broker/MGA hierarchy
  const brokerMgaRelationship = getBrokerMgaRelationship(requestedBrokerId);
  if (!brokerMgaRelationship && !isStandaloneBroker(requestedBrokerId)) {
    return MASKED_404; // Legacy: broker must have MGA or be standalone
  }
  
  // Legacy check: user role permits access
  if (!userCanAccessBroker(userId, requestedBrokerId)) return MASKED_403;
  
  return ALLOWED;
}
```

**Transition phases:**
1. **Phase 1:** New fields populated, legacy logic active
2. **Phase 2:** New channel context logic in parallel (observability only)
3. **Phase 3:** Gradually shift traffic to new logic via feature flag
4. **Phase 4:** Legacy logic removed (after several quarters)

---

### 8.8 Rollback Through Feature Flags and Compatibility Mode

**If critical issue detected post-deployment:**

1. **Immediate:** Disable problematic feature flag(s)
   - `DISTRIBUTION_CHANNEL_CONTEXT_ENABLED = false` → scope resolver ignores new context
   - `BROKER_WORKSPACE_ENABLED = false` → broker workspace unavailable (safe state)
   - `BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED = false` → bridge disabled

2. **Short-term:** Run in compatibility mode
   - Legacy logic active
   - New fields exist but unused
   - Shadow-stamped data preserved

3. **Investigation:** Debug root cause, plan fix

4. **Redeployment:** Re-enable flags after fix validated

5. **No data loss:** Shadow-stamped records not deleted; can re-enable whenever ready

---

## 9. Professional Coding Standards

### 9.1 Strict Typing

**Requirement:** All code strictly typed (TypeScript / runtime validation).

```typescript
// Backend contract example
interface CreateCaseRequest {
  tenant_id: string;
  employer_group_id: string;
  case_type: "new_business" | "renewal" | "mid_year_change" | "takeover";
  effective_date: ISO8601Date;
  assigned_to?: string;
  master_general_agent_id?: string; // nullable
  broker_agency_id?: string; // nullable
}

interface CaseResponse {
  id: string;
  case_number: string;
  status: CaseStatus; // enum, not string
  stage: CaseStage; // enum, not string
  // Sensitive fields excluded from frontend response
}
```

---

### 9.2 Backend Contracts for All Protected Access

**Rule:** All operations that check permissions, scopes, or access control **must use a backend contract**.

**No direct frontend entity reads.**

```typescript
// ✅ CORRECT: Contract-based access
const caseData = await base44.functions.invoke('getCaseDetails', { caseId });

// ❌ WRONG: Direct entity read (violates contract enforcement)
const caseData = await base44.entities.BenefitCase.get(caseId);
```

**Contract must:**
- Accept typed request object
- Check permissions via `permissionResolver`
- Check scope via `scopeResolver`
- Log audit event
- Return sanitized response (no sensitive data)
- Enforce transactional consistency

---

### 9.3 No Raw Frontend Entity Reads

**Rule:** Frontend must never call `base44.entities.*.get()` or `base44.entities.*.list()` directly.

**Implementation:**
- Create backend function for each protected read
- Function enforces access control
- Function returns safe payload
- Frontend calls function via `base44.functions.invoke()`

**Example:**
```javascript
// ❌ WRONG (frontend)
const cases = await base44.entities.BenefitCase.filter({ broker_agency_id });

// ✅ CORRECT (frontend)
const cases = await base44.functions.invoke('listBrokerCases', { /* filtered params */ });

// ✅ CORRECT (backend function - listBrokerCases)
async function listBrokerCases(req) {
  const { broker_agency_id, limit = 20 } = req;
  
  // Check auth
  const user = await base44.auth.me();
  if (!user) return res.status(401);
  
  // Check permission & scope
  const hasAccess = await permissionResolver.check(user, 'broker_direct.case.view', broker_agency_id);
  if (!hasAccess) return res.status(403);
  
  // Scope-checked query
  const cases = await base44.entities.BenefitCase.filter({
    tenant_id: user.tenant_id,
    broker_agency_id
  }, '-created_at', limit);
  
  // Audit log
  await auditWriter.log({ action: 'CASES_LISTED', actor: user, scope: broker_agency_id });
  
  // Return safe payload (exclude sensitive fields)
  return res.json(cases.map(c => ({
    id: c.id,
    case_number: c.case_number,
    stage: c.stage,
    employer_name: c.employer_name,
    // Exclude: internal notes, pricing details, etc.
  })));
}
```

---

### 9.4 Safe Frontend Payloads Only

**Rule:** Backend contracts sanitize all responses; frontend never exposes raw entity data.

**Sensitive fields to always exclude:**
- Employee PII (SSN, full address, date of birth, email in bulk lists)
- Census member details
- Financial data (unless user has explicit `broker_agency.view_financials` permission)
- Internal audit notes
- Approval chain details (unless relevant to user's role)
- MGA/broker relationship metadata (unless necessary for UX)

**Example safe payload:**
```javascript
{
  id: 'case_123',
  case_number: 'CA-2026-001',
  stage: 'census_validated',
  status: 'active',
  employer_name: 'Acme Inc',
  employee_count: 50, // approximation, not exact
  effective_date: '2026-06-01',
  assigned_to_name: 'John Broker', // name only, no email
  // Excluded: internal notes, approval chain, pricing, census rows
}
```

---

### 9.5 Centralized Feature Flag Guard

**Single source of truth for all feature flags:**

```typescript
// lib/featureFlags.ts
export const featureFlags = {
  FIRST_CLASS_BROKER_MODEL_ENABLED: getEnvFlag('FIRST_CLASS_BROKER_MODEL_ENABLED', false),
  BROKER_SIGNUP_ENABLED: getEnvFlag('BROKER_SIGNUP_ENABLED', false),
  BROKER_WORKSPACE_ENABLED: getEnvFlag('BROKER_WORKSPACE_ENABLED', false),
  DISTRIBUTION_CHANNEL_CONTEXT_ENABLED: getEnvFlag('DISTRIBUTION_CHANNEL_CONTEXT_ENABLED', false),
  // ... all flags
};

export function requireFeatureFlag(flag: keyof typeof featureFlags, context?: any) {
  if (!featureFlags[flag]) {
    throw new FeatureFlagDisabledError(flag, context);
  }
}

// Usage
function brokerWorkspaceRoute() {
  requireFeatureFlag('BROKER_WORKSPACE_ENABLED');
  // ... route handler
}
```

---

### 9.6 Centralized Scope Resolver

**Single source of truth for all scope checks:**

```typescript
// lib/scopeResolver.ts
export async function resolveScope(
  userId: string,
  targetEntityType: 'broker' | 'mga' | 'case' | 'census' | 'quote',
  targetEntityId: string,
  action: 'view' | 'create' | 'update' | 'delete'
): Promise<{ allowed: boolean; reason?: string }> {
  const user = await getUser(userId);
  const targetEntity = await getEntity(targetEntityType, targetEntityId);
  
  // Check tenant scope
  if (user.tenant_id !== targetEntity.tenant_id) {
    return { allowed: false, reason: 'cross-tenant-access' };
  }
  
  // Check channel context (if enabled)
  if (featureFlags.DISTRIBUTION_CHANNEL_CONTEXT_ENABLED) {
    const channelContext = await getChannelContext(targetEntity.distribution_channel_context_id);
    if (!canUserAccessChannel(user, channelContext)) {
      return { allowed: false, reason: 'channel-access-denied' };
    }
  }
  
  // Legacy scope check
  if (user.role === 'broker_admin') {
    if (targetEntity.broker_agency_id !== user.broker_agency_id) {
      return { allowed: false, reason: 'cross-broker-access' };
    }
  }
  
  return { allowed: true };
}
```

---

### 9.7 Centralized Permission Resolver

**Single source of truth for all permission checks:**

```typescript
// lib/permissionResolver.ts
export async function checkPermission(
  userId: string,
  permission: string,
  context?: { scope?: string; entityId?: string }
): Promise<boolean> {
  const user = await getUser(userId);
  const userPermissions = await getUserPermissions(user.role);
  
  // Check if permission is granted
  if (!userPermissions.includes(permission)) {
    return false;
  }
  
  // Check scope context (if applicable)
  if (context?.scope && user.restricted_scope) {
    if (user.restricted_scope !== context.scope) {
      return false;
    }
  }
  
  return true;
}
```

---

### 9.8 Centralized Audit Writer

**Single source of truth for all audit events:**

```typescript
// lib/auditWriter.ts
export async function logAuditEvent(event: {
  actor_user_id: string;
  actor_role: string;
  action: string;
  detail?: string;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  outcome: 'success' | 'failed' | 'blocked';
  correlation_id?: string;
}): Promise<string> {
  const auditEvent = {
    ...event,
    tenant_id: (await base44.auth.me()).tenant_id,
    timestamp: new Date().toISOString(),
  };
  
  // Write to immutable audit table
  const created = await base44.entities.AuditEvent.create(auditEvent);
  
  return created.id; // Return audit_trace_id for correlation
}
```

---

### 9.9 Transactional Write Boundaries

**Critical operations use transactions:**

```typescript
// Backend function example
async function approveBrokerProfile(req) {
  const { broker_id, approver_user_id } = req;
  
  // Start transaction
  const tx = await startTransaction();
  
  try {
    // Update broker profile
    await tx.entities.BrokerAgencyProfile.update(broker_id, {
      onboarding_status: 'active',
      approved_by_user_email: approverEmail,
      approved_at: new Date().toISOString(),
    });
    
    // Create broker platform relationship
    await tx.entities.BrokerPlatformRelationship.create({
      broker_agency_id: broker_id,
      status: 'approved',
      approval_status: 'approved',
      approved_by_user_email: approverEmail,
      approved_at: new Date().toISOString(),
    });
    
    // Log audit event
    await tx.entities.AuditEvent.create({
      action: 'BROKER_APPROVED',
      entity_id: broker_id,
      outcome: 'success',
    });
    
    // Commit
    await tx.commit();
    return { status: 'approved', broker_id };
  } catch (err) {
    // Rollback
    await tx.rollback();
    throw err;
  }
}
```

---

### 9.10 Idempotency Keys for Critical Actions

**Prevent duplicate operations:**

```typescript
async function createBenefitCase(req) {
  const { employer_id, case_type, idempotency_key } = req;
  
  // Check if already created with this key
  const existing = await base44.entities.BenefitCase.filter({
    employer_id,
    idempotency_key,
  });
  
  if (existing.length > 0) {
    return { status: 'already_created', case_id: existing[0].id };
  }
  
  // Create new case
  const newCase = await base44.entities.BenefitCase.create({
    employer_id,
    case_type,
    idempotency_key,
    // ...
  });
  
  return { status: 'created', case_id: newCase.id };
}
```

---

### 9.11 Signed URL Document Access

**Never expose raw document URLs:**

```typescript
async function getDocumentSignedUrl(req) {
  const { document_id, requester_user_id } = req;
  
  // Check permission
  const doc = await base44.entities.BenefitDocument.get(document_id);
  const hasAccess = await scopeResolver.check(requester_user_id, 'document', document_id);
  if (!hasAccess) return res.status(403);
  
  // Log access attempt
  await auditWriter.log({ action: 'DOCUMENT_DOWNLOAD_REQUESTED', entity_id: document_id, outcome: 'success' });
  
  // Generate signed URL (expires in 15 minutes)
  const signedUrl = await base44.integrations.Core.CreateFileSignedUrl({
    file_uri: doc.file_uri,
    expires_in: 900,
  });
  
  return res.json({ signed_url: signedUrl.signed_url });
}
```

---

### 9.12 Census and Sensitive Employee Data Redaction/Tokenization

**Never expose raw PII:**

```typescript
function redactCensusMember(member: CensusMember) {
  return {
    id: member.id,
    census_version_id: member.census_version_id,
    employee_id: member.employee_id, // Employer's internal ID, safe
    // Exclude: first_name, last_name, date_of_birth, ssn_last4
    // Exclude: email, phone, address
    employment_status: member.employment_status,
    job_title: member.job_title,
    department: member.department,
    is_eligible: member.is_eligible,
    // Tokenize: ssn_last4 → hash("ssn:" + ssn) for audit only
  };
}
```

---

### 9.13 Immutable Append-Only Audit Events

**Audit table has no UPDATE or DELETE permissions:**

```sql
-- Schema enforcement
CREATE TABLE audit_event (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  action VARCHAR NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  -- ... other fields ...
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
  -- NO updated_at, NO deletion hooks
);

-- Prevent updates
REVOKE UPDATE ON audit_event FROM application_role;

-- Prevent deletes
REVOKE DELETE ON audit_event FROM application_role;

-- Only platform_super_admin can view/read
GRANT SELECT ON audit_event TO platform_admin;
```

---

### 9.14 Masked 404 for Scope Failures

**Never return 403 for scope failures; always 404:**

```typescript
async function getCase(req) {
  const { case_id } = req;
  const user = await base44.auth.me();
  
  const caseRecord = await base44.entities.BenefitCase.get(case_id);
  if (!caseRecord) return res.status(404); // Case doesn't exist
  
  // Check scope
  const hasScope = await scopeResolver.check(user.id, 'case', case_id);
  if (!hasScope) {
    // Log as scope blocked, not permission denied
    await auditWriter.log({ action: 'CASE_ACCESS_BLOCKED', entity_id: case_id, outcome: 'blocked' });
    return res.status(404); // Masked: scope failure looks like 404
  }
  
  // Check permission
  const hasPermission = await permissionResolver.check(user.id, 'broker_direct.case.view');
  if (!hasPermission) {
    return res.status(403); // Permission denied: user in scope but lacks permission
  }
  
  return res.json(caseRecord);
}
```

---

### 9.15 403 for Permission Failures

**Return 403 only when scope is correct but permission is missing:**

```typescript
// Same function as above, but permission failure case:
// User is a "broker_read_only" trying to create a case
const hasPermission = await permissionResolver.check(user.id, 'broker_direct.case.create');
if (!hasPermission) {
  await auditWriter.log({
    action: 'CASE_CREATION_BLOCKED',
    entity_type: 'case',
    outcome: 'failed',
    detail: 'insufficient_permission',
  });
  return res.status(403).json({
    error: 'You do not have permission to create cases. Contact your broker admin.',
  });
}
```

---

## 10. Testing Strategy

### 10.1 Schema Invariant Tests

**Verify schema correctness and constraints:**

```typescript
describe('Schema Invariants', () => {
  test('BrokerAgencyProfile.master_general_agent_id is nullable', async () => {
    const broker = await base44.entities.BrokerAgencyProfile.create({
      tenant_id: 'tenant_1',
      legal_name: 'Standalone Broker',
      primary_contact_email: 'contact@standalone.com',
      state: 'CA',
      zip_code: '90210',
      master_general_agent_id: null, // explicitly null
    });
    
    expect(broker.master_general_agent_id).toBeNull();
  });
  
  test('BenefitCase can exist with or without master_general_agent_id', async () => {
    const case1 = await base44.entities.BenefitCase.create({
      tenant_id: 'tenant_1',
      employer_group_id: 'emp_1',
      case_type: 'new_business',
      master_general_agent_id: null, // broker-direct
    });
    
    const case2 = await base44.entities.BenefitCase.create({
      tenant_id: 'tenant_1',
      employer_group_id: 'emp_2',
      case_type: 'new_business',
      master_general_agent_id: 'mga_1', // MGA-direct
    });
    
    expect(case1.master_general_agent_id).toBeNull();
    expect(case2.master_general_agent_id).toBe('mga_1');
  });
});
```

---

### 10.2 Contract Tests

**Verify backend contracts enforce access control:**

```typescript
describe('Backend Contracts', () => {
  test('getBrokerCases enforces broker scope', async () => {
    const brokerAToken = await loginAs('broker_a_admin');
    const brokerBCaseId = 'case_belongs_to_broker_b';
    
    const response = await base44.functions.invoke('getBrokerCases', {
      broker_agency_id: 'broker_b_id',
    }, { auth: brokerAToken });
    
    expect(response.status).toBe(403); // Permission denied (broker A cannot access broker B)
  });
  
  test('getBrokerCases returns masked 404 for scope mismatch', async () => {
    const mgaToken = await loginAs('mga_admin');
    const standaloneCase = 'case_from_standalone_broker';
    
    const response = await base44.functions.invoke('getCase', {
      case_id: standaloneCase,
    }, { auth: mgaToken });
    
    expect(response.status).toBe(404); // Masked: MGA cannot access standalone broker cases
  });
});
```

---

### 10.3 Scope Resolver Matrix Tests

**Test all combinations in scope resolver decision table:**

```typescript
describe('Scope Resolver', () => {
  test('Broker admin can view own broker cases', async () => {
    const result = await scopeResolver.check(
      'broker_admin_user_123',
      'case',
      'case_owned_by_broker_123'
    );
    expect(result.allowed).toBe(true);
  });
  
  test('Broker admin cannot view another broker case (masked 404)', async () => {
    const result = await scopeResolver.check(
      'broker_admin_user_123',
      'case',
      'case_owned_by_broker_456'
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('cross-broker-access');
  });
  
  test('MGA admin can view MGA cases but not standalone broker cases', async () => {
    const mgaCaseResult = await scopeResolver.check('mga_admin_user_1', 'case', 'mga_case_1');
    const standaloneCaseResult = await scopeResolver.check('mga_admin_user_1', 'case', 'standalone_case_1');
    
    expect(mgaCaseResult.allowed).toBe(true);
    expect(standaloneCaseResult.allowed).toBe(false);
  });
});
```

---

### 10.4 Permission Tests

**Verify permission resolver enforces role-based access:**

```typescript
describe('Permission Resolver', () => {
  test('Broker admin has broker_direct.case.create permission', async () => {
    const hasPermission = await permissionResolver.check(
      'broker_admin_user',
      'broker_direct.case.create'
    );
    expect(hasPermission).toBe(true);
  });
  
  test('Broker read-only cannot create cases', async () => {
    const hasPermission = await permissionResolver.check(
      'broker_readonly_user',
      'broker_direct.case.create'
    );
    expect(hasPermission).toBe(false);
  });
  
  test('Manager cannot update user roles (owner-only permission)', async () => {
    const hasPermission = await permissionResolver.check(
      'broker_manager_user',
      'broker_agency.user.update_role'
    );
    expect(hasPermission).toBe(false);
  });
});
```

---

### 10.5 Feature Flag Fail-Closed Tests

**Verify feature flags default to false and block access when disabled:**

```typescript
describe('Feature Flags', () => {
  test('Broker workspace route returns 404 if BROKER_WORKSPACE_ENABLED is false', async () => {
    featureFlags.BROKER_WORKSPACE_ENABLED = false;
    
    const response = await fetch('/broker/dashboard');
    expect(response.status).toBe(404);
  });
  
  test('Broker signup endpoint rejects if BROKER_SIGNUP_ENABLED is false', async () => {
    featureFlags.BROKER_SIGNUP_ENABLED = false;
    
    const response = await base44.functions.invoke('brokerSignup', {
      legal_name: 'Test Broker',
    });
    
    expect(response.status).toBe(403); // Feature disabled
  });
  
  test('All feature flags default to false', () => {
    const flags = Object.values(featureFlags);
    flags.forEach(flag => {
      expect(flag).toBe(false); // All must default to false
    });
  });
});
```

---

### 10.6 Migration Dry-Run Tests

**Verify dry-run backfill logic before execution:**

```typescript
describe('Migration Dry-Run', () => {
  test('Shadow-stamp dry-run identifies duplicate brokers', async () => {
    const report = await dryRunBackfill();
    
    expect(report.duplicate_candidates).toContainEqual(
      expect.objectContaining({
        confidence: 'high',
        suggested_action: expect.stringContaining('Consolidate'),
      })
    );
  });
  
  test('Shadow-stamp dry-run reports orphan brokers', async () => {
    const report = await dryRunBackfill();
    
    expect(report.orphan_brokers).toContainEqual(
      expect.objectContaining({
        broker_id: 'orphan_broker_1',
      })
    );
  });
});
```

---

### 10.7 Backfill Idempotency Tests

**Verify backfill can be run multiple times safely:**

```typescript
describe('Backfill Idempotency', () => {
  test('Running backfill twice produces same result', async () => {
    const snapshot1 = await takeSnapshot('broker_agencies');
    await executeBackfill();
    const after1 = await takeSnapshot('broker_agencies');
    
    await executeBackfill(); // Run again
    const after2 = await takeSnapshot('broker_agencies');
    
    expect(after1).toEqual(after2); // No changes on second run
  });
  
  test('Shadow-stamp does not update updated_at field', async () => {
    const broker = await base44.entities.BrokerAgencyProfile.get('broker_1');
    const originalUpdatedAt = broker.updated_at;
    
    await shadowStampBroker('broker_1');
    
    const brokerAfter = await base44.entities.BrokerAgencyProfile.get('broker_1');
    expect(brokerAfter.updated_at).toEqual(originalUpdatedAt); // Not changed
  });
});
```

---

### 10.8 Cross-Tenant Access Tests

**Verify tenant boundaries cannot be crossed:**

```typescript
describe('Cross-Tenant Access Prevention', () => {
  test('Tenant A user cannot access Tenant B case', async () => {
    const tenantAToken = await loginAs('tenant_a_user');
    const tenantBCaseId = 'case_in_tenant_b';
    
    const result = await scopeResolver.check('tenant_a_user', 'case', tenantBCaseId);
    
    expect(result.allowed).toBe(false);
  });
  
  test('Case query filters by tenant_id automatically', async () => {
    const cases = await base44.entities.BenefitCase.filter({
      tenant_id: 'tenant_a', // Explicit tenant scope
      broker_agency_id: 'broker_1',
    });
    
    cases.forEach(c => {
      expect(c.tenant_id).toBe('tenant_a');
    });
  });
});
```

---

### 10.9 Cross-Broker Access Tests

**Verify broker isolation:**

```typescript
describe('Cross-Broker Access Prevention', () => {
  test('Broker A admin cannot view Broker B users', async () => {
    const brokerAUsers = await base44.functions.invoke('listBrokerUsers', {
      broker_agency_id: 'broker_a',
    }, { auth: brokerAAdminToken });
    
    expect(brokerAUsers.status).toBe(200);
    expect(brokerAUsers.data.length).toBeGreaterThan(0);
    
    const brokerBUsers = await base44.functions.invoke('listBrokerUsers', {
      broker_agency_id: 'broker_b',
    }, { auth: brokerAAdminToken });
    
    expect(brokerBUsers.status).toBe(403); // Forbidden
  });
  
  test('Broker A producer cannot create case for Broker B', async () => {
    const result = await base44.functions.invoke('createCase', {
      broker_agency_id: 'broker_b',
      employer_id: 'emp_1',
    }, { auth: brokerAProducerToken });
    
    expect(result.status).toBe(403);
  });
});
```

---

### 10.10 Cross-MGA Access Tests

**Verify MGA isolation:**

```typescript
describe('Cross-MGA Access Prevention', () => {
  test('MGA A admin cannot view MGA B brokers', async () => {
    const mgaABrokers = await base44.functions.invoke('listBrokers', {
      mga_id: 'mga_a',
    }, { auth: mgaAAdminToken });
    
    expect(mgaABrokers.data.length).toBeGreaterThan(0);
    
    const mgaBBrokers = await base44.functions.invoke('listBrokers', {
      mga_id: 'mga_b',
    }, { auth: mgaAAdminToken });
    
    expect(mgaBBrokers.status).toBe(403); // Forbidden
  });
});
```

---

### 10.11 Audit Immutability Tests

**Verify audit events cannot be modified:**

```typescript
describe('Audit Immutability', () => {
  test('Audit event cannot be updated after creation', async () => {
    const event = await base44.entities.AuditEvent.create({
      action: 'CASE_CREATED',
      entity_id: 'case_1',
    });
    
    const updateResult = await base44.entities.AuditEvent.update(event.id, {
      action: 'CASE_DELETED', // Try to change action
    });
    
    expect(updateResult).toThrow('Cannot update audit events');
  });
  
  test('Audit event cannot be deleted', async () => {
    const event = await base44.entities.AuditEvent.create({
      action: 'CASE_CREATED',
    });
    
    const deleteResult = await base44.entities.AuditEvent.delete(event.id);
    
    expect(deleteResult).toThrow('Cannot delete audit events');
  });
});
```

---

### 10.12 No Raw Census Frontend Exposure Tests

**Verify census member PII is never exposed to frontend:**

```typescript
describe('Census Data Privacy', () => {
  test('Frontend cannot directly list census members', async () => {
    const result = await fetch('/api/census/members?census_id=census_1', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    
    expect(result.status).toBe(403); // Direct entity access blocked
  });
  
  test('Census endpoint redacts PII', async () => {
    const result = await base44.functions.invoke('getCensusMembers', {
      census_version_id: 'census_1',
    }, { auth: userToken });
    
    result.data.members.forEach(member => {
      expect(member).not.toHaveProperty('first_name');
      expect(member).not.toHaveProperty('last_name');
      expect(member).not.toHaveProperty('date_of_birth');
      expect(member).not.toHaveProperty('email');
      expect(member).not.toHaveProperty('phone');
    });
  });
});
```

---

### 10.13 Performance/Load Tests

**Verify system scales under load:**

```typescript
describe('Performance', () => {
  test('Case list retrieval < 1s for 100 cases', async () => {
    const start = Date.now();
    
    const result = await base44.functions.invoke('listBrokerCases', {
      broker_agency_id: 'broker_1',
      limit: 100,
    });
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
  
  test('No N+1 queries on case detail load', async () => {
    const queryCountBefore = await getQueryCount();
    
    await base44.functions.invoke('getCaseDetail', {
      case_id: 'case_1',
    });
    
    const queryCountAfter = await getQueryCount();
    expect(queryCountAfter - queryCountBefore).toBeLessThan(5); // Max 5 queries
  });
});
```

---

### 10.14 Regression Tests for Gate 6K and Gate 6L-A

**Verify existing gates remain unaffected:**

```typescript
describe('Regression Tests', () => {
  test('Gate 6K MGA analytics still functional', async () => {
    const mgaToken = await loginAs('mga_admin');
    
    const result = await base44.functions.invoke('mgaReportExport', {
      mga_id: 'mga_1',
      report_type: 'sales_pipeline',
    }, { auth: mgaToken });
    
    expect(result.status).toBe(200);
    expect(result.data.export_url).toBeDefined();
  });
  
  test('Gate 6L-A broker agency contacts still functional', async () => {
    const result = await base44.entities.BrokerAgencyContact.filter({
      broker_agency_id: 'broker_1',
    });
    
    expect(result.length).toBeGreaterThan(0);
  });
});
```

---

### 10.15 Confirmation That Deferred Gates Remain Untouched

**Verify Gates 6I-B, 6J-B, 6J-C, 6L-B are not activated:**

```typescript
describe('Deferred Gates', () => {
  test('Gate 6I-B report scheduling not exposed', async () => {
    const response = await fetch('/mga/reports/schedules');
    expect(response.status).toBe(404);
  });
  
  test('Gate 6J-B export delivery governance not active', async () => {
    expect(featureFlags.GATE_6J_B_ENABLED).toBe(false);
  });
  
  test('Gate 6J-C not activated', async () => {
    expect(featureFlags.GATE_6J_C_ENABLED).toBe(false);
  });
  
  test('Gate 6L-B not activated', async () => {
    expect(featureFlags.GATE_6L_B_ENABLED).toBe(false);
  });
});
```

---

## 11. Rollback and Deployment Readiness Plan

### 11.1 Disable Broker Signup

**Immediate rollback action:**

```typescript
// In brokerSignup function
if (!featureFlags.BROKER_SIGNUP_ENABLED) {
  return res.status(403).json({
    error: 'Broker signup is currently disabled',
    details: 'Please contact platform support',
  });
}
```

---

### 11.2 Disable Broker Workspace

**Immediate rollback action:**

```typescript
// In App.jsx routing
<Route path="/broker/*" element={
  featureFlags.BROKER_WORKSPACE_ENABLED ? <BrokerWorkspace /> : <PageNotFound />
} />
```

---

### 11.3 Disable Quote Channel Wrapper

**Immediate rollback action:**

```typescript
// In quote functions
if (!featureFlags.QUOTE_CHANNEL_WRAPPER_ENABLED) {
  // Use legacy quote logic
  return await legacyQuoteHandler(req);
}

// Use new channel wrapper logic
return await channelWrappedQuoteHandler(req);
```

---

### 11.4 Disable Benefits Admin Setup Action

**Immediate rollback action:**

```typescript
// In benefits admin UI
if (!featureFlags.BENEFITS_ADMIN_CHANNEL_BRIDGE_ENABLED) {
  // Hide setup button
  return null;
}

// Show setup button
return <SetupBenefitsAdminButton />;
```

---

### 11.5 Keep New Data Model Additions Inert

**Data added during rollback scenario remains but is not used:**

- New columns (e.g., `distribution_channel_context_id`) are populated but ignored
- Shadow-stamped records are preserved
- New entities (e.g., `BrokerMGARelationship`) exist but are not queried
- Feature flags gate all access to new data model

---

### 11.6 Preserve Backfilled DistributionChannelContext Records

**If rollback occurs, context records are not deleted:**

```typescript
// Rollback script
async function rollback() {
  // Disable feature flags
  featureFlags.DISTRIBUTION_CHANNEL_CONTEXT_ENABLED = false;
  
  // Do NOT delete distribution_channel_context records
  // They remain for potential re-enablement
  
  // Revert read paths to legacy logic
  scopeResolver.useCompatibilityMode = true;
}
```

---

### 11.7 Revert Read Paths to Legacy Compatibility Mode

**All scope/permission checks fall back to legacy logic:**

```typescript
// If rollback scenario
if (compatibilityMode) {
  // Use legacy MGA → Broker → Case hierarchy
  // Ignore new channel context logic
  // Ignore new scope access grants
}
```

---

### 11.8 No Destructive Rollback Without Operator Approval

**Destruc destructive actions (deleting records) require explicit approval:**

```typescript
// Rollback admin UI
async function deleteBackfilledRecords(req) {
  const { operator_approval_token } = req;
  
  // Verify operator approval
  if (!operator_approval_token) {
    return res.status(403).json({
      error: 'Operator approval required to delete backfilled records',
    });
  }
  
  // Log destructive action
  await auditWriter.log({
    action: 'BACKFILLED_RECORDS_DELETED',
    outcome: 'success',
    detail: 'Operator approved rollback deletion',
  });
  
  // Delete records
  await base44.entities.DistributionChannelContext.delete({
    // ...
  });
}
```

---

## 12. Operator Approval Block

### Status: AWAITING OPERATOR APPROVAL

**Before Gate 7A-0 implementation work order can be created, this document must be approved.**

**Approval Checklist:**

- [ ] Architecture decisions locked (Broker as first-class actor, MGA optional, channel context canonical)
- [ ] Domain model map reviewed and confirmed
- [ ] Entity relationships validated (nullable fields, legacy compatibility)
- [ ] Scope resolver matrix approved (access rules for all roles/channels)
- [ ] Permission matrix approved (all permissions mapped to roles)
- [ ] Feature flag dependency matrix validated
- [ ] Required enterprise enhancements identified and prioritized
- [ ] Migration safety plan acceptable (dry-run, backfill, validation, rollback)
- [ ] Professional coding standards met (strict typing, contracts, no raw entity reads, etc.)
- [ ] Testing strategy comprehensive (25+ test categories)
- [ ] Rollback plan sufficient (fail-closed, no data loss, feature flag gates)

**Approval Options:**

- [ ] **APPROVED** — Proceed to Gate 7A-0 implementation work order
- [ ] **APPROVED WITH REVISIONS** — Approved after following required changes (list below)
- [ ] **REJECTED** — Do not proceed; requires architectural redesign (reason below)

**Operator Comments:**

```
[Operator to fill in feedback, requirements, or reasons for rejection]
```

**Approving Operator:**

- Name: ________________
- Email: ________________
- Title: ________________
- Date/Time: ________________
- Signature: ________________

---

## Conclusion

This Gate 7A-P Enterprise Integration Readiness and Design Freeze document establishes all architectural, data, permission, testing, and rollback requirements before Gate 7A-0 implementation can proceed.

**Key Locked Decisions:**
1. Broker Agency elevated to first-class platform actor
2. `master_general_agent_id` nullable and non-identifying on BrokerAgencyProfile
3. DistributionChannelContext is canonical ownership/lineage context
4. Scope resolver enforces tenant, broker, MGA, and channel boundaries
5. All feature flags default to false and fail closed
6. All access control via backend contracts (no raw frontend entity reads)
7. Audit events immutable and append-only
8. Migration via dry-run, backfill, validation, with rollback via feature flags

**Pending Operator Sign-Off:**

Gate 7A-0 implementation work order creation is **blocked** until this document is approved by the operator.

---

**Document Status:** DESIGN_FREEZE / AWAITING_OPERATOR_APPROVAL  
**Date Created:** 2026-05-13  
**Version:** 1.0  
**Next Step:** Operator approval → Unblock Gate 7A-0 work order creation