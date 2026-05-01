# MGA Enterprise Architecture Package

## 1. Executive Summary

This document defines the enterprise architecture for introducing a new **Master General Agent (MGA)** hierarchy layer above the existing **MasterGroup** structure in Quote Connect 360.

The target design is:

**MasterGeneralAgent → MasterGroup → Tenant / Employer / Case / Census / Quote / TXQuote / Enrollment / Reporting / Documents / Tasks / Exceptions**

This is a **server-enforced, production-grade, multi-tenant hierarchy**. It is **not** a UI grouping model and **not** a frontend filter pattern.

Non-negotiable architecture rules:
- No frontend-only filtering for security.
- No direct frontend entity mutations for sensitive business operations.
- All create/list/update/delete/transmit/import/report actions must pass through server-enforced scoped contracts for MGA-sensitive domains.
- Cross-MGA access attempts must be blocked and logged.
- Platform super admins may retain elevated access only through explicit role checks and audited actions.

---

## 2. Current-State Hierarchy Review

### 2.1 Current observable hierarchy
Based on the current application structure and entities, the effective hierarchy today is approximately:

**Agency / Platform Context → MasterGroup → Tenant → EmployerGroup / BenefitCase → downstream workflows**

Current relevant entities observed:
- `MasterGroup`
- `Tenant`
- `RateSetAssignment` with assignment types `global | master_group | tenant`
- `BenefitCase`
- `EmployerGroup`
- `CensusVersion`
- `CensusMember`
- `QuoteScenario`
- `QuoteTransmission`
- `Proposal`
- `EnrollmentWindow`
- `EmployeeEnrollment`
- `RenewalCycle`
- `Document`
- `CaseTask`
- `ExceptionItem`
- `ActivityLog`
- TxQuote entities (`TxQuoteCase`, `TxQuoteDestination`, `TxQuoteReadinessResult`, etc.)

### 2.2 Current application behavior
The current application is largely organized around workflow pages:
- Dashboard
- Employers / Master Groups
- Cases
- Census
- Quotes
- Proposals
- Enrollment
- Renewals
- Settings

Current data access patterns are broad and page-centric. Many pages use direct frontend reads such as:
- `base44.entities.BenefitCase.list()`
- `base44.entities.QuoteScenario.list()`
- `base44.entities.CensusVersion.list()`
- similar direct list/filter access for workflow entities

Current sensitive backend operations exist for selected actions, e.g.:
- `sendTxQuote`
- `calculateQuoteRates`
- `exportProposalPDF`

### 2.3 Current-state constraints
The present system appears optimized for a single operational domain with platform/admin visibility, but not yet for strict parent-scope enterprise segregation at the MGA level.

Key gaps for MGA introduction:
1. No top-level `MasterGeneralAgent` entity.
2. No explicit `master_general_agent_id` on `MasterGroup`.
3. No consistent downstream propagation of top-level parent scope.
4. Several pages directly query entities from the frontend with broad list operations.
5. Existing backend functions validate user/assignment in isolated ways, but not via a unified parent-scope authorization layer.
6. Navigation, dashboarding, reporting, and admin workflows are not partitioned by an MGA operating model.

Conclusion: the existing structure can support evolution into an MGA model, but only through a deliberate entity, RBAC, and service-layer redesign.

---

## 3. Future-State Enterprise Hierarchy

### 3.1 Target hierarchy
The future-state enterprise hierarchy will be:

**Platform / CES Super Admin**
→ **MasterGeneralAgent**
→ **MasterGroup**
→ **Tenant / Sub-Group / EmployerGroup**
→ **BenefitCase**
→ **Census / Quotes / TXQuote / Proposals / Enrollment / Renewals / Documents / Exceptions / Reporting**

### 3.2 Intended business meaning
- **MasterGeneralAgent** is the top operational business authority for a network of Master Groups.
- **MasterGroup** remains the next business layer below MGA.
- **Tenant** and other operational entities remain below MasterGroup.
- All downstream activity belongs to exactly one effective MGA scope.

### 3.3 Core design principle
Every downstream business record must either:
1. store `master_general_agent_id` directly, or
2. be accessed only through a service layer that resolves and enforces effective MGA scope from its parent chain.

For enterprise-grade security and reporting, the preferred design is:
- **store `master_general_agent_id` directly on all workflow-critical entities**
- preserve parent references for referential clarity
- use service-layer authorization on every sensitive operation

---

## 4. Core Architecture Principles

1. **Top-level parent scope is real and server enforced.**
2. **All sensitive business operations go through scoped backend contracts.**
3. **No cross-MGA read or write is allowed without platform-super-admin privilege.**
4. **Audit logging is mandatory for all material actions.**
5. **MGA scope must be queryable, reportable, and export-safe.**
6. **Direct entity access from frontend should be progressively reduced for sensitive domains.**
7. **Migration must preserve historical integrity.**
8. **Testing must include cross-scope abuse cases, not only happy paths.**

---

## 5. Required Entity / Schema Changes

## 5.1 New entities

### A. `MasterGeneralAgent`
Primary parent business entity.

Recommended fields:
- `name` (required)
- `legal_entity_name` (required)
- `dba_name` (optional)
- `code` (required, unique business code)
- `primary_contact_name` (required)
- `primary_contact_email` (required)
- `primary_contact_phone` (optional)
- `business_address_line1` (required)
- `business_address_line2` (optional)
- `city` (required)
- `state` (required)
- `zip` (required)
- `country` (required)
- `tax_id_ein` (audit-sensitive, optional/required by business policy)
- `producer_license_number` (optional)
- `resident_state` (optional)
- `licensed_states` (array)
- `commission_structure_type` (optional enum)
- `override_structure_type` (optional enum)
- `banking_setup_status` (enum)
- `carrier_access_status` (enum)
- `agreement_status` (enum)
- `compliance_status` (enum)
- `status` (`active | inactive | suspended | pending_onboarding`)
- `onboarding_status` (enum)
- `notes` (admin/internal)
- `created_by_user_id` or equivalent actor linkage

### B. `MasterGeneralAgentUser`
Optional explicit join entity between app users and MGA scopes.

Recommended fields:
- `master_general_agent_id`
- `user_email` or `user_id` reference pattern used by platform
- `role` (`mga_admin | mga_manager | mga_user | mga_read_only`)
- `status` (`invited | active | disabled`)
- `permissions_override` (optional object)
- `last_login_at`
- `invited_by`
- `invited_at`
- `disabled_at`
- `notes`

### C. `MasterGeneralAgentAgreement`
Agreement and compliance tracking.

Recommended fields:
- `master_general_agent_id`
- `agreement_type`
- `status`
- `effective_date`
- `expiration_date`
- `document_url`
- `signed_by`
- `signed_at`
- `notes`

### D. `MasterGeneralAgentCommissionProfile`
Commission and override settings.

Recommended fields:
- `master_general_agent_id`
- `profile_name`
- `commission_model`
- `override_model`
- `effective_date`
- `status`
- `rules` (object)
- `notes`

### E. `MasterGeneralAgentActivityLog`
MGA-specific audit/event stream for high-level governance.

Recommended fields:
- `master_general_agent_id`
- `master_group_id` (nullable)
- `actor_email`
- `actor_role`
- `action`
- `entity_type`
- `entity_id`
- `before_value`
- `after_value`
- `outcome`
- `request_context`
- `ip_hint` if available from platform pattern

## 5.2 Changes to existing entities

### `MasterGroup`
Add:
- `master_general_agent_id` (required after migration)
- optionally `ownership_status`
- optionally `mga_assigned_at`
- optionally `mga_assigned_by`

### `Tenant`
Add:
- `master_general_agent_id`

### `EmployerGroup`
Add:
- `master_general_agent_id`
- `master_group_id` if not already present indirectly in surrounding model

### `BenefitCase`
Add:
- `master_general_agent_id`
- `master_group_id`
- optionally `tenant_id` if not already managed elsewhere

### `CensusVersion`
Add:
- `master_general_agent_id`
- `master_group_id`

### `CensusMember`
Add:
- `master_general_agent_id`
- `master_group_id`

### `QuoteScenario`
Add:
- `master_general_agent_id`
- `master_group_id`

### `QuoteTransmission`
Add:
- `master_general_agent_id`
- `master_group_id`

### `Proposal`
Add:
- `master_general_agent_id`
- `master_group_id`

### `EnrollmentWindow`
Add:
- `master_general_agent_id`
- `master_group_id`

### `EmployeeEnrollment`
Add:
- `master_general_agent_id`
- `master_group_id`

### `RenewalCycle`
Add:
- `master_general_agent_id`
- `master_group_id`

### `Document`
Add:
- `master_general_agent_id`
- `master_group_id`

### `CaseTask`
Add:
- `master_general_agent_id`
- `master_group_id`

### `ExceptionItem`
Add:
- `master_general_agent_id`
- `master_group_id`

### `ActivityLog`
Add:
- `master_general_agent_id`
- `master_group_id`
- `actor_role`
- `outcome`

### TxQuote domain entities
At minimum add `master_general_agent_id` and `master_group_id` to:
- `TxQuoteCase`
- `TxQuoteDestination`
- `TxQuoteReadinessResult`
- `TxQuoteSubmissionLog`
- `TxQuoteEmployerProfile`
- `TxQuoteCurrentPlanInfo`
- `TxQuoteContributionStrategy`
- `TxQuoteClaimsRequirement`
- `TxQuoteSupportingDocument`
- `TxQuoteDestinationContact`
- `TxQuoteDestinationRule` where ownership should be scoped, if applicable
- `TxQuoteCensusOverride`

### Rate governance and assignment entities
Review for scope alignment:
- `RateSetAssignment`
  - add `master_general_agent_id`
  - potentially add `assignment_type = mga | master_group | tenant | global`

### User model
If user scoping is stored on `User`, consider adding:
- `scope_type`
- `master_general_agent_id`
- `master_group_id`
- `tenant_id`
- `role`

If not, keep this relationship in `MasterGeneralAgentUser` and possibly a corresponding `MasterGroupUser` structure.

---

## 6. master_general_agent_id Propagation Map

## 6.1 Direct propagation targets
These entities should carry `master_general_agent_id` directly for performance, reporting, and security:

### Top-level admin/business
- MasterGroup
- Tenant
- EmployerGroup
- MasterGeneralAgentAgreement
- MasterGeneralAgentCommissionProfile
- MasterGeneralAgentActivityLog

### Core workflow
- BenefitCase
- CaseTask
- ActivityLog
- Document
- ExceptionItem

### Census domain
- CensusVersion
- CensusMember
- CensusImportJob
- CensusImportAuditEvent
- CensusValidationResult

### Quote / proposal domain
- QuoteScenario
- ScenarioPlan
- ContributionModel
- Proposal
- QuoteTransmission

### TXQuote domain
- TxQuoteCase
- TxQuoteDestination
- TxQuoteReadinessResult
- TxQuoteSubmissionLog
- TxQuoteEmployerProfile
- TxQuoteCurrentPlanInfo
- TxQuoteContributionStrategy
- TxQuoteClaimsRequirement
- TxQuoteSupportingDocument
- TxQuoteDestinationContact
- TxQuoteCensusOverride

### Enrollment / renewal domain
- EnrollmentWindow
- EmployeeEnrollment
- RenewalCycle

### Reporting / analytics / exports
Any reporting snapshot, export manifest, KPI cache, or async reporting entity introduced later must also include `master_general_agent_id`.

## 6.2 Propagation rules
When a record is created:
- Parent scope must be resolved from the source MasterGroup or parent case.
- `master_general_agent_id` must be written immediately.
- The client may not be trusted to provide the final scope value.
- Service layer should derive and validate scope before persist.

Example:
- Create Case under MasterGroup X
- Service resolves MasterGroup X → MGA Y
- Creates `BenefitCase` with `master_group_id = X` and `master_general_agent_id = Y`

---

## 7. Server-Enforced Backend Contract / Service Model

## 7.1 Service-layer objective
Sensitive MGA-aware operations must move behind backend functions that:
1. authenticate the caller
2. determine caller role and allowed scope
3. validate target record scope
4. perform action only if scope is valid
5. create audit record
6. return only scoped result

## 7.2 Why this is required
Current frontend list/filter patterns are insufficient for enterprise parent-scope isolation. The service layer becomes the enforcement boundary.

## 7.3 Required backend service categories

### A. MGA management services
- `createMasterGeneralAgent`
- `updateMasterGeneralAgent`
- `listMasterGeneralAgents`
- `getMasterGeneralAgentDetail`
- `changeMasterGeneralAgentStatus`

### B. MGA user services
- `inviteMasterGeneralAgentUser`
- `listMasterGeneralAgentUsers`
- `updateMasterGeneralAgentUserRole`
- `disableMasterGeneralAgentUser`
- `removeMasterGeneralAgentUser`

### C. Master Group services under MGA
- `createMasterGroupUnderMGA`
- `listMasterGroupsByMGA`
- `getMasterGroupWithinMGAScope`
- `updateMasterGroupWithinMGAScope`
- `changeMasterGroupStatusWithinMGAScope`

### D. Case services
- `createCaseUnderMasterGroup`
- `listCasesByMGAScope`
- `getCaseByMGAScope`
- `updateCaseByMGAScope`
- `advanceCaseStageByMGAScope`

### E. Census services
- `createCensusImportUnderMGAScope`
- `listCensusImportsByMGAScope`
- `reprocessCensusImportByMGAScope`
- `validateCensusByMGAScope`

### F. Quote services
- `createQuoteScenarioByMGAScope`
- `listQuoteScenariosByMGAScope`
- `calculateQuoteRatesByMGAScope`
- `approveQuoteScenarioByMGAScope`

### G. TXQuote services
- `createTxQuoteCaseByMGAScope`
- `validateTxQuoteByMGAScope`
- `sendTxQuoteByMGAScope`
- `listTxQuoteActivityByMGAScope`

### H. Proposal / reporting services
- `exportProposalPDFByMGAScope`
- `listReportsByMGAScope`
- `generateMGASummaryReport`

### I. Audit and admin services
- `listMGAAuditLog`
- `listBlockedCrossScopeAttempts`
- `getMGAAccessSummary`

## 7.4 Contract rules for every scoped service
Every scoped service must:
- verify user is authenticated
- resolve the caller’s allowed scope set
- resolve the target entity’s MGA scope
- reject if mismatch
- audit success/failure
- avoid trusting raw client-provided `master_general_agent_id` without server verification

## 7.5 Frontend usage rule
Frontend should invoke only the contract/function for sensitive flows.
The frontend should not directly mutate entities for:
- master group creation
- case creation in scoped contexts
- census import initialization
- quote generation
- txquote transmission
- report generation
- user invitation / role changes
- commission and settings changes

---

## 8. Server-Side Authorization and Cross-MGA Isolation Rules

## 8.1 Principal scope model
Each authenticated user must resolve to one of these effective scope patterns:
- Platform super admin
- MGA-scoped user
- MasterGroup-scoped user
- Tenant-scoped user
- mixed/elevated internal support user if explicitly allowed

## 8.2 Isolation rule
A user scoped to MGA A may only access records where:
- `record.master_general_agent_id === MGA A`

No exception is granted based on frontend route, UI state, or manually entered IDs.

## 8.3 Cross-scope blocked actions
The following must be blocked if scope mismatches:
- list details
- exports
- report inclusion
- update
- delete/archive
- quote calculation
- txquote send
- census reprocess
- document retrieval for sensitive documents
- audit log viewing outside allowed scope

## 8.4 Super admin rule
Platform / CES super admins may access broader data only if:
- role explicitly indicates elevated access
- action is audited
- optional impersonation or support mode is explicit and visible

## 8.5 Anti-abuse requirement
All blocked cross-scope attempts should create an audit/security event with:
- actor
- role
- attempted entity
- requested scope
- actual scope
- action attempted
- timestamp
- result = blocked

---

## 9. MGA Onboarding / Sign-Up Design

## 9.1 Purpose
A dedicated onboarding path is required so MGA creation is structured, validated, and auditable.

## 9.2 Recommended pages
- `MGA Sign-Up / Onboarding`
- `MGA Review / Activation`
- `MGA Compliance & Agreements`
- `MGA Carrier/Product Access`

## 9.3 Required vs optional fields

### Required
- Legal entity name
- Business/display name
- Primary contact name
- Primary contact email
- Business address
- City
- State
- ZIP
- Country
- Status default (`pending_onboarding`)

### Usually required depending on business policy
- EIN / Tax ID
- Producer / license number
- Resident state
- licensed states

### Optional operational fields
- DBA name
- Phone
- notes
- onboarding checklist values

### Admin-only / audit-sensitive
- commission structure
- override structure
- banking setup status
- agreement status
- compliance documentation status
- internal review notes
- activation / suspension controls

## 9.4 Suggested onboarding stages
1. Business identity
2. Licensing/compliance
3. Agreements
4. Carrier access / products
5. Payment/banking readiness
6. Admin review
7. Activation

## 9.5 Approval model
Recommended approach:
- MGA can submit onboarding request
- platform admin reviews and activates
- no operational workflows available until activation criteria are met

---

## 10. MGA Dashboard and Navigation Model

## 10.1 New MGA pages
Recommended new pages:
- MGA Dashboard
- MGA Detail
- MGA Master Groups
- MGA Cases
- MGA Census Operations
- MGA Quotes Pipeline
- MGA TXQuote Operations
- MGA Reporting
- MGA Users
- MGA Settings
- MGA Audit Log
- MGA Onboarding / Sign-Up

## 10.2 MGA dashboard capabilities
The MGA command dashboard should provide:
- total Master Groups under MGA
- active/inactive Master Groups
- active cases
- cases by stage
- pending census imports
- census issues
- quote pipeline status
- txquote transmission status
- open enrollment windows
- open exceptions
- task backlog
- recent Master Groups created
- recently updated cases
- SLA/aging indicators
- carrier/provider transmission summary
- commission/revenue summary if enabled

## 10.3 Filtering model
Dashboard and downstream pages should support filters by:
- Master Group
- status
- provider
- case stage
- quote status
- census status
- assigned user
- state
- product
- date range

All filters operate within effective MGA scope only.

## 10.4 Navigation visibility rules
Suggested nav behavior:
- Platform super admins: full platform nav + MGA admin surfaces
- MGA roles: MGA-specific nav visible; only allowed modules visible
- MasterGroup-only users: existing operational views restricted to their group

## 10.5 Navigation structure proposal
Primary nav additions:
- MGA Command
- MGA Master Groups
- MGA Cases
- MGA Quotes
- MGA Reports
- MGA Users
- MGA Audit
- MGA Settings

---

## 11. MGA Role Model and RBAC Matrix

## 11.1 Proposed roles
- `platform_super_admin`
- `mga_admin`
- `mga_manager`
- `mga_user`
- `mga_read_only`

Potential existing roles below MGA scope remain possible but should be harmonized.

## 11.2 Role definitions

### platform_super_admin
- Full cross-MGA access
- Can create/update/suspend MGAs
- Can view all audit and security logs
- Can impersonate or support-view if feature approved

### mga_admin
- Full administrative control within own MGA
- Create/edit Master Groups under own MGA
- Invite/manage MGA users
- View all downstream operations in own MGA
- Access settings, audit, reporting, commission views if permitted

### mga_manager
- Operational leadership within own MGA
- View all own MGA operational data
- May create Master Groups if business permits
- May create cases, manage census/quotes/TXQuote workflows
- Limited settings authority

### mga_user
- Standard operational user within own MGA
- Can work cases, census, quotes, selected TXQuote operations per policy
- No broad settings or user admin

### mga_read_only
- Read-only visibility inside own MGA
- No create/update/transmit actions

## 11.3 RBAC matrix

| Capability | platform_super_admin | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---|---:|---:|---:|---:|
| View MGA dashboard | Yes | Yes | Yes | Yes | Yes |
| Create MGA | Yes | No | No | No | No |
| Edit MGA core profile | Yes | Yes (own) | Limited | No | No |
| Change MGA status | Yes | Limited/No | No | No | No |
| View MGA audit log | Yes | Yes | Yes | Limited | Optional |
| Invite MGA users | Yes | Yes | Optional | No | No |
| Change MGA user roles | Yes | Yes | No | No | No |
| Create Master Group | Yes | Yes | Optional | No | No |
| Edit Master Group | Yes | Yes | Yes | Limited | No |
| View all Master Groups in own MGA | Yes | Yes | Yes | Yes | Yes |
| Create case | Yes | Yes | Yes | Yes | No |
| Edit case | Yes | Yes | Yes | Yes | No |
| Census upload | Yes | Yes | Yes | Yes | No |
| Census validation action | Yes | Yes | Yes | Yes | No |
| Quote generation | Yes | Yes | Yes | Yes | No |
| TXQuote transmission | Yes | Yes | Yes | Optional | No |
| Proposal export | Yes | Yes | Yes | Yes | Optional |
| Reporting | Yes | Yes | Yes | Limited | Limited |
| Commission visibility | Yes | Yes | Optional | No | No |
| Settings | Yes | Yes | Limited | No | No |
| Cross-MGA visibility | Yes | No | No | No | No |

Open decision: whether `mga_manager` can create Master Groups and manage TXQuote transmissions should be finalized by business governance.

---

## 12. Audit Logging Model

## 12.1 Audit principle
All material MGA and downstream actions must be auditable from day one.

## 12.2 Events that must be logged

### MGA lifecycle
- MGA created
- MGA updated
- MGA status changed
- MGA activated/suspended
- MGA onboarding submitted
- MGA onboarding approved/rejected

### MGA users
- MGA user invited
- MGA user role changed
- MGA user disabled/removed

### Master Groups
- Master Group created under MGA
- Master Group reassigned (if ever allowed)
- Master Group updated
- Master Group status changed

### Cases and downstream workflow
- Case created
- Case reassigned
- Case stage changed
- Census upload created
- Census validation completed
- Quote generated/recalculated/approved
- TXQuote sent
- TXQuote failed/succeeded
- Proposal exported
- Enrollment window opened/closed
- Renewal updated
- exception resolved

### Security/audit events
- Cross-scope access blocked
- Unauthorized export blocked
- Unauthorized TXQuote attempt blocked
- Unauthorized user management attempt blocked
- Sensitive settings modified

## 12.3 Audit record shape
Recommended common fields:
- `master_general_agent_id`
- `master_group_id` (nullable)
- `case_id` (nullable)
- `entity_type`
- `entity_id`
- `action`
- `actor_email`
- `actor_role`
- `timestamp`
- `before_value`
- `after_value`
- `outcome` (`success | failed | blocked`)
- `reason` / `detail`
- `correlation_id` if possible for tracing multi-step operations

## 12.4 Storage strategy
Use both:
- `ActivityLog` for operational visibility
- `MasterGeneralAgentActivityLog` or equivalent higher-order audit stream for MGA governance and security-sensitive actions

---

## 13. Migration Plan for Existing Master Groups

## 13.1 Objective
Assign all existing Master Groups and downstream data to a valid MGA scope without losing operational integrity.

## 13.2 Migration approach

### Phase A: Schema readiness
- introduce MGA entities
- add nullable `master_general_agent_id` to all required entities
- add indexes needed for scoped filtering/reporting

### Phase B: Establish default mapping model
There are two likely strategies:

#### Option 1: Create one initial default MGA
- create a single default MGA for existing production data
- attach all existing MasterGroups to that MGA
- backfill all downstream records

#### Option 2: Business-defined batch mapping
- create target MGAs first
- map existing MasterGroups to their correct MGA owner
- backfill downstream records per mapping

Recommended enterprise approach: **Option 2**, if business ownership is already known. Use Option 1 only as a temporary bridge.

### Phase C: Backfill propagation
For each MasterGroup:
- resolve assigned MGA
- stamp `master_general_agent_id` on MasterGroup
- propagate to Tenants, EmployerGroups, Cases, Census, Quotes, TXQuote, Enrollment, Documents, Tasks, Exceptions, Logs

### Phase D: Validation
- ensure no null `master_general_agent_id` remains in required entities
- ensure each case’s MGA matches its MasterGroup’s MGA
- ensure each quote/census/transmission matches case MGA
- verify reporting counts before and after migration

### Phase E: Enforce required fields
After successful validation:
- make `master_general_agent_id` required on all selected entities
- switch services to mandatory scope enforcement

## 13.3 Migration audit requirements
Migration itself must log:
- migration batch id
- actor/system process
- entities updated count
- failures count
- unresolved entities list

## 13.4 Rollback plan
Before hard enforcement:
- snapshot all modified records
- preserve mapping file by MasterGroup
- use batch rollback procedure if validation fails

---

## 14. Validation and Test Strategy

## 14.1 Regression testing
Validate all existing workflows still function within a scoped model:
- case creation/editing
- census upload/import/reprocess
- quote creation/calculation
- TXQuote send flow
- proposal generation/export
- enrollment operations
- renewals
- reporting
- documents
- tasks/exceptions

## 14.2 RBAC testing
For each role:
- verify accessible pages
- verify inaccessible pages are blocked
- verify action buttons do not enable unauthorized actions
- verify backend blocks even if UI is bypassed

## 14.3 Cross-scope security testing
Mandatory abuse-case tests:
- user from MGA A requests MasterGroup of MGA B
- user from MGA A sends TXQuote on case of MGA B
- user from MGA A exports report including MGA B records
- user from MGA A edits settings of MGA B
- user tampers payload with another `master_general_agent_id`
- user tampers payload with another `master_group_id`

Expected result in all cases:
- request blocked server-side
- no data leakage
- blocked event logged

## 14.4 Workflow validation
Validate end-to-end flows entirely within one MGA:
- create MasterGroup under MGA
- create case under MasterGroup
- upload census
- validate census
- generate quote
- send TXQuote
- create/export proposal
- open enrollment
- renew case

## 14.5 Reporting validation
Ensure reports:
- show only in-scope records
- aggregate correctly by MGA and MasterGroup
- exclude cross-scope records from exports and dashboards

## 14.6 TXQuote-specific validation
Because TXQuote is externally sensitive, validate:
- transmission only allowed for in-scope case
- attachment/census file belongs to same MGA
- transmission log stamped with MGA scope
- failures and retries stay in scope

---

## 15. UI / Navigation Planning Summary

## 15.1 New page set
Recommended page inventory:
- `/mga-signup`
- `/mga-dashboard`
- `/mga/:id`
- `/mga-master-groups`
- `/mga-cases`
- `/mga-census`
- `/mga-quotes`
- `/mga-reports`
- `/mga-users`
- `/mga-audit`
- `/mga-settings`

## 15.2 Existing page strategy
Existing workflow pages may continue to exist, but should be enhanced to operate in one of these modes:
- platform admin mode
- MGA scoped mode
- MasterGroup scoped mode

## 15.3 Visibility model
Visibility is role-driven, not purely route-driven.
Nav items should be derived from effective role + scope.

---

## 16. Implementation Phases

## Phase 0 — Architecture approval
- approve hierarchy model
- approve RBAC model
- approve propagation strategy
- approve migration ownership rules

## Phase 1 — Data model foundation
- add MGA entities
- add `master_general_agent_id` fields
- define indexes and reporting supports
- define audit structure

## Phase 2 — Service-layer enforcement foundation
- create shared authorization/scoping pattern
- create MGA and MasterGroup scoped service contracts
- refactor highest-risk operations first

## Phase 3 — High-risk workflow migration
- case creation/update
- census import pipeline
- quote generation
- TXQuote transmission
- proposal/report export

## Phase 4 — MGA admin surfaces
- onboarding/signup
- MGA dashboard
- MGA master group management
- MGA users/settings/audit

## Phase 5 — Reporting and operational analytics
- MGA reporting pages
- scoped KPIs
- exception and SLA dashboards

## Phase 6 — Migration execution
- assign existing MasterGroups
- propagate scope to downstream entities
- validate and fix anomalies

## Phase 7 — Hard enforcement and cleanup
- enforce required `master_general_agent_id`
- remove/limit unsafe direct mutation patterns
- complete regression and security validation

---

## 17. Risks, Assumptions, and Open Decisions

## 17.1 Key risks
1. Existing direct frontend entity queries may bypass intended enterprise boundaries if not fully refactored.
2. Downstream entity propagation could become inconsistent if partial writes occur.
3. Historical records may have incomplete parent lineage.
4. TXQuote and export/reporting functions may leak scope if not fully hardened.
5. Role overlap between existing admin model and new MGA roles may create ambiguity.

## 17.2 Assumptions
- Each MasterGroup belongs to exactly one MGA.
- Downstream business records belong to exactly one effective MGA.
- Platform admins are a separate elevated authority.
- Existing MasterGroups can be mapped to MGAs through business ownership decisions.

## 17.3 Open decisions
1. Should MGA managers be allowed to create Master Groups?
2. Should MGA users be able to send TXQuote transmissions, or only managers/admins?
3. Should commission visibility be restricted to MGA admin only?
4. Should user-to-scope association live on `User`, join entities, or both?
5. Should legacy pages be reused with scoped mode or should MGA-specific pages be distinct operational surfaces?
6. Which existing entities can rely on derived scope vs must store direct `master_general_agent_id`? Recommended answer: direct storage for all workflow-critical entities.
7. Whether a formal impersonation model is needed for platform support users.

---

## 18. Final Recommendation

This MGA initiative is the correct enterprise direction **only if implemented as a real parent-scope security model**.

Recommended final position:
- Introduce `MasterGeneralAgent` as a first-class parent entity.
- Add `master_general_agent_id` to `MasterGroup` and all workflow-critical downstream entities.
- Move sensitive business operations to server-enforced scoped backend contracts.
- Introduce MGA-specific dashboards, user admin, settings, audit, and reporting surfaces.
- Enforce cross-MGA isolation server-side with explicit audit of blocked attempts.
- Execute a staged migration with validation gates before hard enforcement.

This should be treated as a **production multi-tenant enterprise architecture program**, not a simple feature addition.

---

## 18. Revision Round 1 Additions

This section is a precision hardening pass intended to remove ambiguity from core control areas and make the package implementation-ready.

## 18.1 Canonical Scope Resolution Model (P0)

### Authoritative policy
The platform shall use **one canonical scope-resolution algorithm** for every protected operation.

### Source of truth for user scope
The authoritative source of user scope shall be **server-side membership records**, not client claims and not frontend route context.

Primary source of truth:
1. `MasterGeneralAgentUser`
2. any approved lower-scope membership structure such as `MasterGroupUser` if introduced
3. platform-level `User.role` only for platform-super-admin or explicitly approved support/admin roles

The frontend must never be treated as a source of truth for scope.

### Membership policy
- A standard operational user may belong to **multiple MasterGroups within the same MGA**.
- A standard operational user may **not** belong to multiple MGAs.
- A platform super admin may operate across MGAs by privileged role, not by ordinary membership.
- A support/admin impersonation mode may exist only under explicit governance controls defined below.

### Precedence rules
Precedence order is fixed:
1. `platform_super_admin`
2. explicitly approved `platform_support_impersonation` mode
3. `mga_admin`
4. `mga_manager`
5. `mga_user`
6. `mga_read_only`
7. lower-scope group-specific restrictions if introduced

Where a user has multiple memberships within the same MGA:
- effective MGA scope is the single MGA shared by those memberships
- effective permissions are the union of allowed MasterGroup visibility but the **maximum role within that MGA does not automatically bypass domain restrictions** defined in the permission matrix

Where conflicting memberships are detected across multiple MGAs:
- the account is considered **invalid for operational access**
- all protected requests are denied
- a security audit event is created
- remediation is required by platform administration

### Impersonation / support policy
- Impersonation is **allowed only for `platform_super_admin` and explicitly designated platform support roles**.
- Default impersonation mode is **read-only**.
- Write-capable impersonation is allowed only through an explicit elevated support action with reason capture.
- Every impersonated request must be audited with:
  - true actor
  - impersonated subject
  - reason
  - timestamp
  - action
  - outcome

### Standardized scope passing rule
**Scope is derived internally by the service, not passed as an authoritative input.**

Allowed client inputs:
- target entity identifiers
- filters
- pagination data
- user-entered fields

Not authoritative:
- `master_general_agent_id`
- `master_group_id`
- role claims
- support mode claims

### Deterministic scope-resolution flow
For every protected service request:
1. Authenticate the caller.
2. Resolve caller principal type (`platform_super_admin`, support impersonation, or MGA-scoped principal).
3. Load server-side membership records.
4. If no valid membership exists, deny.
5. If multiple MGA memberships exist for a non-platform user, deny and audit as configuration violation.
6. Determine effective MGA scope.
7. Determine effective allowed MasterGroups within that MGA.
8. Resolve target entity scope from persisted data, never from client payload.
9. Compare effective caller scope to target scope.
10. If mismatch, deny and audit.
11. If match, apply permission matrix for the exact domain + action.
12. If action allowed, execute within transactional boundary.
13. Write audit event.
14. Return scoped response.

### Async and non-request flows
#### Synchronous requests
- scope resolved from authenticated user membership using the canonical flow above.

#### Async jobs
- job must persist initiating actor, initiating MGA scope, target entities, and correlation id at enqueue time.
- worker must re-validate scope from stored job context before execution.
- worker may not widen scope beyond stored initiating scope.

#### Scheduled workflows
- scheduled workflows must run under an explicit service principal.
- each schedule must have a configured target scope: platform-global or one specific MGA.
- platform-global schedules may only perform operations explicitly approved for global scope.
- MGA schedules may only operate inside their configured MGA.

#### Imports / exports
- import job inherits scope from the initiating protected request at creation time.
- processing workers must reject if referenced entities resolve to a different MGA.
- exports must build result sets only from scoped query services; no raw cross-entity assembly outside scope validation.

#### Webhook-triggered processes
- webhook handlers must first resolve the owning entity/process in the system.
- resulting downstream actions inherit the persisted scope of that owning entity.
- if no owning in-scope entity can be resolved, processing is denied and logged.

## 18.2 Complete Entity Coverage Table (P0)

All entities must have an explicit rule. No entity may be treated as implicitly in-scope.

| Entity | Has `master_general_agent_id` | Scope enforcement | Read rule | Write rule | Cross-scope behavior |
|---|---|---|---|---|---|
| MasterGeneralAgent | YES | direct field | platform admins or same MGA roles only | platform admin create/update; own-MGA admin limited updates | deny |
| MasterGeneralAgentUser | YES | direct field | platform admin or same-MGA user admin scope | only authorized user-management services | deny |
| MasterGeneralAgentAgreement | YES | direct field | same MGA only | admin/settings permission only | deny |
| MasterGeneralAgentCommissionProfile | YES | direct field | same MGA only, financial visibility required | admin/settings only | deny |
| MasterGeneralAgentActivityLog | YES | direct field | same MGA audit/security permission only | system/service writes only | deny |
| MasterGroup | YES | direct field | same MGA only | scoped service only | deny |
| Tenant | YES | direct field | same MGA only | scoped service only | deny |
| Agency | YES if operationally scoped, otherwise GLOBAL registry with explicit service gate | direct or global controlled | if scoped, same MGA only; if global, via admin registry service only | admin-only service | deny |
| EmployerGroup | YES | direct field | same MGA only | scoped service only | deny |
| BenefitCase | YES | direct field | same MGA and allowed group only | scoped service only | deny |
| CaseTask | YES | direct field | same MGA and allowed group only | scoped service only | deny |
| ActivityLog | YES | direct field | same MGA audit visibility only | system/service writes only | deny |
| ExceptionItem | YES | direct field | same MGA only | scoped service only | deny |
| Document | YES | direct field | same MGA only, document permission required | scoped service only | deny |
| CensusVersion | YES | direct field | same MGA only | scoped service only | deny |
| CensusMember | YES | direct field | same MGA only | system/import service writes only | deny |
| CensusImportJob | YES | direct field | same MGA only | import services only | deny |
| CensusImportAuditEvent | YES | direct field | same MGA audit visibility only | system writes only | deny |
| CensusValidationResult | YES | direct field | same MGA only | validation services only | deny |
| QuoteScenario | YES | direct field | same MGA only | scoped quote services only | deny |
| QuoteVersion / scenario version history | YES | direct field | same MGA only | quote services only | deny |
| ScenarioPlan | YES | direct field | same MGA only | quote services only | deny |
| ContributionModel | YES | direct field | same MGA only | quote services only | deny |
| QuoteTransmission | YES | direct field | same MGA only | transmission services only | deny |
| QuoteProviderRoute | YES when owned by MGA; GLOBAL only if explicitly designated platform route | direct field or global controlled registry | same MGA if custom; platform-controlled if global | route admin service only | deny |
| BenefitPlan | YES when plan library is MGA-owned; GLOBAL if shared catalog is approved | direct field or global controlled registry | same MGA or approved global plan catalog service | plan admin service only | deny |
| PlanRateTable | YES when MGA-scoped; GLOBAL if tied to approved shared catalog | direct field or global controlled registry | same MGA or approved global rate service | rate admin service only | deny |
| Proposal | YES | direct field | same MGA only | proposal services only | deny |
| EnrollmentWindow | YES | direct field | same MGA only | enrollment services only | deny |
| EmployeeEnrollment | YES | direct field | same MGA only | enrollment services only | deny |
| EnrollmentMember | YES | direct field | same MGA only | enrollment services only | deny |
| RenewalCycle | YES | direct field | same MGA only | renewal services only | deny |
| PolicyMatchResult | YES | direct field | same MGA only | policy match services only | deny |
| TxQuoteCase | YES | direct field | same MGA only | txquote services only | deny |
| TxQuoteDestination | YES | direct field | same MGA only | txquote services only | deny |
| TxQuoteReadinessResult | YES | direct field | same MGA only | txquote validation services only | deny |
| TxQuoteSubmissionLog | YES | direct field | same MGA only | txquote send/retry services only | deny |
| TxQuoteEmployerProfile | YES | direct field | same MGA only | txquote services only | deny |
| TxQuoteCurrentPlanInfo | YES | direct field | same MGA only | txquote services only | deny |
| TxQuoteContributionStrategy | YES | direct field | same MGA only | txquote services only | deny |
| TxQuoteClaimsRequirement | YES | direct field | same MGA only | txquote services only | deny |
| TxQuoteSupportingDocument | YES | direct field | same MGA only | txquote services only | deny |
| TxQuoteDestinationContact | YES | direct field | same MGA only | txquote/admin services only | deny |
| TxQuoteDestinationRule | YES if customized per MGA; GLOBAL only if centrally managed | direct field or global registry | same MGA if custom; admin/global service if global | controlled service only | deny |
| TxQuoteCensusOverride | YES | direct field | same MGA only | txquote services only | deny |
| RateSetAssignment | YES unless truly global | direct field or global controlled | same MGA or approved global rate service | controlled service only | deny |
| Notifications | YES | direct field | only recipients in same MGA | notification services only | deny |
| Email delivery log | YES | direct field | same MGA audit/ops visibility only | system writes only | deny |
| Export manifest / PDF bundle / ZIP bundle | YES | direct field | same MGA only | export services only | deny |
| Reporting snapshot | YES | direct field | same MGA only | reporting services only | deny |
| Reporting aggregate / KPI cache | YES | direct field | same MGA only | reporting services only | deny |
| Background job record / queue item | YES | direct field | admin/ops visibility in same MGA or platform admin | system/service writes only | deny |
| Retry queue item | YES | direct field | same MGA only | system/service writes only | deny |
| Webhook receipt log | YES once ownership resolved; unresolved items quarantined | direct field after resolution | scoped audit visibility only | system writes only | unresolved quarantined / deny |
| Security audit log | YES | direct field | audit permission only | system writes only | deny |

Policy conclusion:
- all operational entities, derived artifacts, logs, jobs, exports, and caches must carry `master_general_agent_id`
- global catalogs are permitted only by explicit designation and must be accessed through controlled registry services, never direct broad reads

## 18.3 Global Scoped Service Contract Standard (P0)

This contract standard applies to every scoped service.

### Request model
All protected service requests must follow a canonical structure:
- `target`: entity identifiers or domain-specific target selectors
- `payload`: user-supplied data for the action
- `query`: filters, search, sort, pagination
- `context`: optional client metadata only (never authoritative scope)
- `idempotency_key`: required for create/transmit/retry operations
- `if_match_version`: required for mutable updates where concurrency applies

Authoritative scope is never accepted from the client.

### Response model
All protected service responses must follow a canonical structure:
- `success`
- `data`
- `meta`
  - `correlation_id`
  - `page`
  - `page_size`
  - `total_count` where relevant
  - `sort`
- `error` when unsuccessful

### Error model
Standardized rule:
- **403 Forbidden** for authenticated users lacking permission or attempting cross-scope access
- **404 Not Found** only when the target truly does not exist within the allowed scoped search space

The platform will not use security-through-obscurity masking for known-scope authorization failures; the standard is explicit 403 with audit logging.

### Idempotency rules
Required for:
- create operations that may be retried by client or network
- TXQuote transmit
- retry / resend flows
- import job creation
- export job creation

If the same `idempotency_key` is submitted for the same actor + operation + target within retention window, the service must return the original logical result rather than creating duplicates.

### Pagination / filtering / sorting
- all list endpoints must scope-filter first, then apply user filters
- pagination is mandatory for list services above configured thresholds
- sorting must use an approved allowlist of sortable fields
- filters may not bypass scope predicates

### Bulk operation rules
- each record in a bulk operation must be individually scope-validated
- mixed-scope bulk actions are denied in full
- partial success is disallowed by default for destructive or externally sensitive actions
- partial success may be allowed for non-destructive maintenance actions only if explicitly documented and audited item-by-item

### Transaction boundaries
- scope validation and primary write must occur in one controlled operation boundary
- multi-entity writes must be atomic where platform capability permits
- if an external side effect exists (email, TXQuote transmission, webhook callback), internal audit + state transition must be committed before dispatch, with retry-safe state tracking

### Concurrency model
The standard concurrency model is **optimistic locking** using record version or updated timestamp comparison.
- mutable services must require `if_match_version` or equivalent
- stale writes are rejected
- rejected stale writes are audited as failed concurrency events where business-significant

### File / document access rules
- files inherit scope from owning persisted entity
- signed links may be generated only by scoped document services
- signed links must be short-lived and tied to in-scope authorization at generation time
- raw direct file references must not be exposed as permanent cross-scope-accessible URLs

### Audit requirements per operation
Every protected service must audit:
- actor
- effective role
- effective MGA scope
- target entity/domain
- action
- result (`success | failed | blocked`)
- correlation id
- idempotency key when relevant

## 18.4 Domain Permission Matrix (P0)

This matrix replaces optional interpretations with explicit allow/deny logic.

Legend: A = allow, D = deny

### Census
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | A | A |
| read | A | A | A | A |
| create | A | A | A | D |
| edit | A | A | A | D |
| delete | A | D | D | D |
| approve | A | A | D | D |
| transmit | D | D | D | D |
| retry | A | A | D | D |
| export | A | A | A | D |
| manage_users | D | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | D | D | D | D |

### Quotes
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | A | A |
| read | A | A | A | A |
| create | A | A | A | D |
| edit | A | A | A | D |
| delete | A | D | D | D |
| approve | A | A | D | D |
| transmit | D | D | D | D |
| retry | A | A | D | D |
| export | A | A | A | D |
| manage_users | D | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | A | A | D | D |

### TXQuote
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | A | A |
| read | A | A | A | A |
| create | A | A | D | D |
| edit | A | A | D | D |
| delete | A | D | D | D |
| approve | A | A | D | D |
| transmit | A | A | D | D |
| retry | A | A | D | D |
| export | A | A | D | D |
| manage_users | D | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | A | A | D | D |

### Enrollment
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | A | A |
| read | A | A | A | A |
| create | A | A | A | D |
| edit | A | A | A | D |
| delete | A | D | D | D |
| approve | A | A | D | D |
| transmit | D | D | D | D |
| retry | A | A | D | D |
| export | A | A | A | D |
| manage_users | D | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | D | D | D | D |

### Documents
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | A | A |
| read | A | A | A | A |
| create | A | A | A | D |
| edit | A | A | A | D |
| delete | A | D | D | D |
| approve | D | D | D | D |
| transmit | D | D | D | D |
| retry | D | D | D | D |
| export | A | A | A | D |
| manage_users | D | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | D | D | D | D |

### Reporting
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | A | A |
| read | A | A | A | A |
| create | A | A | D | D |
| edit | D | D | D | D |
| delete | D | D | D | D |
| approve | D | D | D | D |
| transmit | D | D | D | D |
| retry | A | A | D | D |
| export | A | A | A | D |
| manage_users | D | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | A | A | D | D |

### Users
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | D | D |
| read | A | A | D | D |
| create | A | D | D | D |
| edit | A | D | D | D |
| delete | A | D | D | D |
| approve | A | D | D | D |
| transmit | D | D | D | D |
| retry | D | D | D | D |
| export | A | D | D | D |
| manage_users | A | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | D | D | D | D |

### Settings
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | D | D |
| read | A | A | D | D |
| create | A | D | D | D |
| edit | A | D | D | D |
| delete | A | D | D | D |
| approve | A | D | D | D |
| transmit | D | D | D | D |
| retry | D | D | D | D |
| export | A | D | D | D |
| manage_users | D | D | D | D |
| manage_settings | A | D | D | D |
| view_financials | A | D | D | D |

### Audit
| Permission | mga_admin | mga_manager | mga_user | mga_read_only |
|---|---:|---:|---:|---:|
| view | A | A | D | D |
| read | A | A | D | D |
| create | D | D | D | D |
| edit | D | D | D | D |
| delete | D | D | D | D |
| approve | D | D | D | D |
| transmit | D | D | D | D |
| retry | D | D | D | D |
| export | A | D | D | D |
| manage_users | D | D | D | D |
| manage_settings | D | D | D | D |
| view_financials | D | D | D | D |

## 18.5 Cross-MGA Isolation Edge Case Rules (P0)

### Cloned cases / duplicated quotes
- clone/duplicate operations may only target records within the same MGA
- cross-MGA cloning is denied
- cloned records receive fresh IDs but retain the same `master_general_agent_id`

### Imported files processed asynchronously
- import file ownership is fixed at import-job creation
- async processors must reject if parent case/group resolves to a different MGA at processing time
- rejected items are quarantined and audited

### Background jobs with elevated roles
- background jobs may use service credentials only to execute pre-authorized scoped work
- service role is not a license for cross-MGA access
- job must carry persisted scope context and re-validate before each sensitive action

### Cached dashboards / reports
- cache keys must include `master_general_agent_id` and, where relevant, role or allowed group set
- cross-MGA shared caches are prohibited for scoped data
- stale cache entries from previous scope contexts must not be reused

### Search / indexing
- search indexes must include `master_general_agent_id`
- search queries must apply scope predicates before returning results
- global indexing without scoped filtering is prohibited

### Notifications and email references
- notifications must only reference in-scope entities
- email rendering must not include links or metadata for out-of-scope objects
- retrying a notification may not widen recipient scope

### Document URLs / signed links
- signed document links may only be generated through scoped services
- signed links must be short-lived
- links are generated only after authorization succeeds
- export-time document inclusion must re-validate scope record-by-record

### Export bundles (PDF / ZIP)
- export bundles must be assembled exclusively from scoped service query results
- each included artifact must pass scope validation
- any detected out-of-scope item causes the export job to fail closed and audit the violation

### Stale or partially migrated records
- records missing `master_general_agent_id` after enforcement are treated as **not operationally accessible**
- reads are denied through protected services
- writes are denied except approved migration remediation services
- each access attempt is logged as migration-state violation

## 18.6 Migration Plan Operational Hardening (P0)

### Pre-migration inventory
Before migration execution, produce a full inventory of:
- total records by entity
- records with null parent references
- records with missing `master_group_id`
- records with conflicting case/employer/group lineage
- records with external artifacts (documents, exports, transmissions)

### Anomaly classification
Every anomalous record must be categorized into exactly one of:
1. orphaned record
2. conflicting parent chain
3. missing `master_group_id`
4. missing upstream owner mapping
5. invalid duplicate lineage
6. unsupported legacy artifact

### Mapping ownership
- every existing MasterGroup → MGA mapping must have an explicit business owner approver
- no production mapping may be inferred silently for disputed ownership cases
- disputed mappings block cutover for affected records

### Dry-run migration
A dry-run is mandatory and must produce a reconciliation report including:
- total records evaluated
- total records mapped
- total anomalies by class
- unresolved records count
- before/after counts per entity and MGA

### Acceptance thresholds
Migration may proceed to cutover only if:
- 100% of MasterGroups have approved MGA mapping
- 100% of protected operational entities have resolved MGA scope or are formally quarantined
- 0 unresolved conflicting parent-chain records remain in active operational domains
- reporting reconciliation variance is <= 0.1% for non-financial counts and 0% for financial/control totals

### Rollback triggers
Rollback is triggered if any of the following occurs:
- unresolved conflicting parent-chain records appear in active data post-cutover
- cross-scope access validation fails
- reconciliation thresholds are breached
- protected services return inconsistent scope results in certification tests

### Cutover plan
- define freeze window for writes to affected domains
- execute final pre-cutover reconciliation
- run migration
- run post-migration validation suite
- release only after validation passes

### Post-migration monitoring
For a defined monitoring period:
- track blocked migration-state violations
- track scoped query failures
- track authorization denials by domain
- track export/report anomalies

### Dual-read / dual-write strategy
- dual-read may be used during transition if required for validation
- dual-write is permitted only for a temporary controlled period and must include reconciliation logging
- no long-term dual-write state is allowed

## 18.7 Validation Plan with Measurable Criteria (P0)

### RBAC test grid
Every role × domain × action combination in the permission matrix must be tested with explicit pass/fail outcomes.
Pass condition:
- allowed actions succeed only within scope
- denied actions fail with standardized authorization behavior

### Cross-scope violation tests
Required tests include:
- MGA A user attempts to read/write/export/transmit/report against MGA B data
Pass condition:
- request denied
- no data returned
- security audit event written

### Performance benchmarks
Scoped query performance must be benchmarked for major list/report domains.
Pass condition:
- agreed production performance thresholds are met under representative dataset volumes
- no scoped query introduces unacceptable degradation relative to baseline tolerance

### Reporting accuracy validation
Compare scoped reports to approved baseline datasets.
Pass condition:
- operational reports match baseline within approved reconciliation threshold
- financial/control totals match exactly where required

### Migration reconciliation thresholds
Pass condition:
- counts and totals meet thresholds defined in migration acceptance section
- quarantined records are fully enumerated and excluded from operational reports

### Negative tests
Required negative tests:
- invalid bulk action across mixed scopes
- repeated idempotent retry submission
- stale concurrency update
- failed external transmission retry
- invalid signed document request
Pass condition:
- system fails closed
- no unauthorized side effects occur
- audit trail is complete

### File/document access validation
Pass condition:
- only in-scope authorized users can obtain document metadata or signed links
- expired or invalid link behavior is enforced correctly

### Audit completeness validation
Pass condition:
- every protected operation class generates expected audit record(s)
- correlation ids connect multi-step operations end-to-end

### Impersonation tests
If impersonation is enabled:
Pass condition:
- impersonated reads follow scope of impersonated subject
- write impersonation requires elevated support mode and reason capture
- all impersonated operations are separately auditable

## 18.8 Onboarding Governance (P1)

- MGA creation is **invite-only or platform-admin-created**, not open public self-provisioning by default.
- A platform admin may create an MGA directly or invite a prospective MGA to complete onboarding.
- Approval workflow requires platform admin approval before activation.
- Required compliance data includes legal entity data, contact data, jurisdiction/licensing fields required by business policy, and agreement status.
- On activation, the first designated user must be assigned `mga_admin`.
- Incomplete onboarding leaves MGA in `pending_onboarding` and blocks operational workflows.
- Re-verification requirements must be defined for compliance-sensitive fields on a periodic basis.

## 18.9 Reporting Architecture (P1)

### Standard MGA report set
At minimum:
- MasterGroup operational summary
- case pipeline report
- census quality/status report
- quote pipeline report
- TXQuote transmission report
- enrollment progress report
- renewal pipeline report
- exception/SLA report
- user activity/audit summary

### Financial vs operational separation
- financial reports are distinct from operational reports
- financial visibility requires explicit permission

### Export permissions
- exports follow the same scoped permission model as reports
- no read-only export by default unless explicitly allowed in the permission matrix

### Cached vs real-time
- cached reports must be scope-keyed
- control/financial reports should prefer reproducible snapshot generation

### Report reproducibility
- major exported reports must persist generation metadata, filters, actor, timestamp, and scope for traceability

### Cross-MasterGroup comparison inside same MGA
- allowed within same MGA subject to reporting permissions

### Cross-MGA analytics
- allowed only for platform-super-admin and only through explicit platform reporting services

## 18.10 Audit Model Hardening (P1)

### Audit categories
1. **Operational audit** — workflow actions and state transitions
2. **Security audit** — blocked access, impersonation, policy violations, suspicious events
3. **Governance audit** — user-role changes, settings changes, MGA lifecycle approvals

### Retention policy
- retention periods must be formally defined by compliance policy
- security and governance audit should have the longest retention class

### Access control
- audit visibility is permission-controlled
- security audit access is more restricted than ordinary operational audit

### Tamper resistance expectations
- audit records are append-only from application perspective
- direct mutation/deletion of audit records through operational UI or standard services is prohibited

### Redaction rules
- sensitive values must be redacted or summarized where full raw payload retention creates privacy/compliance risk

### Correlation
- multi-step processes must share correlation ids across service, job, export, and notification actions

### Alerting thresholds
At minimum define alerting for:
- repeated blocked cross-scope attempts
- repeated impersonation write attempts
- repeated authorization failures against sensitive domains