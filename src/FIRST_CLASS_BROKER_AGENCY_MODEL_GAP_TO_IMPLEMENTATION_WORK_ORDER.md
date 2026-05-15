# First-Class Broker Agency Model
## Gap-to-Implementation Work Order

**Status:** PARTIALLY IMPLEMENTED / FOUNDATION ONLY  
**Date Created:** 2026-05-14  
**Last Updated:** 2026-05-14

---

## Executive Summary

The First-Class Broker Agency Model has foundational schemas and broker signup surfaces in place, but **the operating model is incomplete**. This work order catalogs all remaining gaps organized by implementation domain, enabling phased rollout without interrupting existing production workflows.

**Current Readiness:** 30% (schemas + signup) → **Target:** 100% (full operating model)

---

## 1. Data Model Gaps

### 1.1 Distribution Channel Stamping — CRITICAL

**Gap:** Core business records lack distribution-channel context fields required for visibility, ownership, and RLS enforcement.

**Affected Entities:**
- [ ] `Employer` / `EmployerGroup` — add stamps
- [ ] `CensusVersion` — add stamps
- [ ] `QuoteScenario` — add stamps
- [ ] `Proposal` — add stamps
- [ ] `EnrollmentWindow` — add stamps
- [ ] `RenewalCycle` — add stamps
- [ ] `Task` — add stamps
- [ ] `Document` — add stamps
- [ ] `AuditEvent` — add stamps
- [ ] `Notification` — add stamps
- [ ] Benefits Admin case entity (schema location TBD) — add stamps

**Required Fields per Entity:**
```
distribution_channel_context_id (FK to DistributionChannelContext)
tenant_id
master_general_agent_id (nullable)
broker_agency_id (nullable)
owner_org_type (enum: platform, broker, mga, employer)
owner_org_id
servicing_org_type (enum: broker, mga, employer, benefits_admin)
servicing_org_id
supervising_org_type (enum: mga, platform)
supervising_org_id
created_by_user_id
created_by_role
visibility_scope (enum: owner_only, owner_and_servicing, owner_and_supervising, owner_and_all_affiliates, platform_wide)
audit_trace_id
```

**Work Estimate:** 2–3 days (entity schema updates + data migration strategy)

---

### 1.2 BrokerEmployerRelationship — MISSING

**Gap:** No schema or entity for channel-aware broker-employer relationships.

**Entity to Create:**
```json
{
  "name": "BrokerEmployerRelationship",
  "properties": {
    "tenant_id": "string",
    "distribution_channel_context_id": "string (FK)",
    "broker_agency_id": "string (FK)",
    "employer_id": "string (FK)",
    "master_general_agent_id": "string (nullable)",
    "broker_platform_relationship_id": "string (nullable, FK)",
    "broker_mga_relationship_id": "string (nullable, FK)",
    "relationship_type": "enum: producer_of_record, servicing_broker, quote_only, benefits_admin_service, renewal_service, referral_partner, shared_service, historical",
    "relationship_status": "enum: draft, active, suspended, terminated",
    "effective_date": "date",
    "end_date": "date",
    "assigned_by_user_id": "string",
    "primary_service_owner_user_id": "string",
    "producer_of_record_user_id": "string",
    "commission_owner_user_id": "string",
    "service_level": "string",
    "visibility_scope": "enum",
    "notes": "string",
    "created_at": "date-time",
    "updated_at": "date-time"
  },
  "required": ["tenant_id", "broker_agency_id", "employer_id", "relationship_type"]
}
```

**Work Estimate:** 1 day (schema creation + backend entity generation)

---

### 1.3 Benefits Admin Case Entity Schema Review — MISSING

**Gap:** Benefits Admin case entity location and DistributionChannelContext integration unclear.

**Action Required:**
- [ ] Identify current Benefits Admin case entity or design new one
- [ ] Add all distribution-channel stamps
- [ ] Define visibility rules (broker-scoped, MGA-scoped, platform-scoped)
- [ ] Define ownership model (who created, who can edit, who can view)

**Work Estimate:** 1–2 days (discovery + schema alignment)

---

## 2. Backend Contract Gaps

### 2.1 Broker Approval Workflow — INCOMPLETE

**Gap:** Platform admin review UI exists, but approval backend is missing or incomplete.

**Required Backend Functions:**
- [ ] `approveBrokerProfile` — mark broker as approved, enable portal
- [ ] `rejectBrokerProfile` — reject application with reason
- [ ] `requestBrokerMoreInfo` — request additional information from broker
- [ ] `releaseBrokerComplianceHold` — release compliance hold
- [ ] `suspendBrokerProfile` — suspend broker (admin action)
- [ ] `updateBrokerProfileStatus` — generic status transitions

**Each function should:**
- Validate admin role
- Update `BrokerAgencyProfile` status fields
- Update `BrokerPlatformRelationship` status
- Send audit event
- Send email notification to broker contact
- Log decision reason

**Work Estimate:** 2–3 days (function design + implementation)

---

### 2.2 Broker Token Security Contract — INCOMPLETE

**Gap:** Referenced in code but not fully visible or functional.

**Required Functions:**
- [ ] `validateBrokerSignupToken` — validate onboarding token
- [ ] `generateBrokerSignupToken` — generate secure token for broker
- [ ] `revokeBrokerSignupToken` — revoke token (single-use, expiry enforcement)
- [ ] `checkTokenExpiry` — verify token not expired
- [ ] `checkTokenReplay` — prevent token reuse

**Implementation Notes:**
- Use HMAC-SHA256 hashing (never store plaintext)
- 7-day default expiry
- Single-use enforcement with consumed_at tracking
- Audit each token check

**Work Estimate:** 1–2 days (token security contract + storage)

---

### 2.3 Broker Profile Completion Workflow — INCOMPLETE

**Gap:** No backend logic for broker to complete profile, upload documents, validate licenses/NPN.

**Required Functions:**
- [ ] `completeBrokerProfileStep` — save step data (contact, license states, lines, etc.)
- [ ] `uploadBrokerComplianceDocument` — upload E&O, W-9, licenses, broker agreement
- [ ] `validateNPN` — call external NPN validation service (if available)
- [ ] `validateLicenseStates` — check against broker license database
- [ ] `performDuplicateDetection` — check for duplicate broker profiles
- [ ] `submitBrokerForReview` — finalize profile and request platform review

**Work Estimate:** 2–3 days (multi-step workflow + document handling)

---

### 2.4 Broker Permission Resolver Contract — MISSING

**Gap:** No backend contract enforcing broker access boundaries (RLS rules).

**Required Functions:**
- [ ] `canBrokerAccessRecord` — check if broker can read/edit/delete record based on channel context
- [ ] `canBrokerCreateEmployer` — verify broker is approved and permitted to create employers
- [ ] `getBrokerVisibilityScope` — return visibility scope for broker (direct, affiliated, or hybrid)
- [ ] `filterRecordsByBrokerScope` — filter query results to visible records only
- [ ] `enforceChannelOwnership` — prevent cross-channel visibility leaks

**Work Estimate:** 2 days (RLS contract design)

---

### 2.5 MGA Broker Affiliation Workflow — INCOMPLETE

**Gap:** No backend functions for MGA to create or invite brokers.

**Required Functions:**
- [ ] `createBrokerInvitationByMGA` — MGA creates new broker profile invitation
- [ ] `searchExistingBrokersByMGA` — MGA searches for existing brokers to affiliate
- [ ] `requestBrokerAffiliation` — MGA requests affiliation with existing broker
- [ ] `acceptBrokerAffiliationRequest` — broker accepts MGA affiliation
- [ ] `rejectBrokerAffiliationRequest` — broker rejects affiliation
- [ ] `activateBrokerMGARelationship` — complete affiliation setup

**Work Estimate:** 2–3 days

---

## 3. Frontend Route / Workspace Gaps

### 3.1 Broker Workspace (`/broker`) — NOT FUNCTIONAL

**Gap:** Route exists but no functional dashboard or operating surfaces.

**Required Pages / Components:**
- [ ] Broker dashboard (book-of-business summary, KPIs, quick actions)
- [ ] Broker profile / account settings
- [ ] Broker employer list + creation workflow
- [ ] Broker case list + case detail + case creation
- [ ] Broker census upload (reuse existing census import)
- [ ] Broker quote creation + scenario management
- [ ] Broker proposal workflow
- [ ] Broker sold-case / implementation handoff
- [ ] Broker renewals pipeline
- [ ] Broker documents (uploaded, created, compliance)
- [ ] Broker tasks (assigned, pending, completed)
- [ ] Broker Benefits Admin setup entry point
- [ ] Broker book-of-business analytics (if hybrid, separate Direct + MGA views)

**Shared Components to Create / Reuse:**
- Broker page header / breadcrumb
- Broker sidebar / navigation
- Broker action bar (common actions)
- Broker search bar (employers, cases, quotes, etc.)
- Broker status badge component
- Broker access-denied / upgrade-needed messages

**Work Estimate:** 5–7 days (discovery + phased rollout of pages)

---

### 3.2 Broker Onboarding Route Completion — INCOMPLETE

**Gap:** `/broker-onboarding?token=` route exists but feature flag is disabled and form is placeholder.

**Required Work:**
- [ ] Enable `BROKER_ONBOARDING_ENABLED` feature flag (when backend is ready)
- [ ] Implement onboarding form UI (multi-step):
  - Step 1: Email verification + resend logic
  - Step 2: Profile completion (contact, address, service areas)
  - Step 3: License information (states, expiration, NPN)
  - Step 4: Insurance lines and specialties
  - Step 5: Compliance document upload (E&O, W-9, license copies, broker agreement)
  - Step 6: Compliance acknowledgement
  - Step 7: Review and submit
- [ ] Add error handling and validation per step
- [ ] Add progress indicator
- [ ] Add save-draft functionality (allow resuming later)
- [ ] Add support contact / help link

**Work Estimate:** 3–4 days (form UI + state management)

---

### 3.3 Broker Detail Modal / Drawer Updates

**Gap:** Admin review modal exists but may lack full approval workflow UI.

**Required Updates:**
- [ ] Show broker compliance status clearly
- [ ] Show document upload status
- [ ] Show license validation results
- [ ] Show duplicate detection flag (if any)
- [ ] Add approval / rejection / more-info buttons with reason modal
- [ ] Add compliance hold button + reason
- [ ] Add suspension / reactivation buttons
- [ ] Show audit trail of broker events

**Work Estimate:** 1–2 days (component updates)

---

## 4. Permission & Scope Gaps

### 4.1 Broker Row-Level Access Contracts — MISSING

**Gap:** No service contracts enforcing broker access boundaries.

**Required Contracts:**
- [ ] `brokerRecordAccessContract` — defines what broker can access
- [ ] `brokerOwnershipContract` — defines record ownership rules
- [ ] `brokerVisibilityScopeContract` — defines scope rules (owner_only, owner_and_servicing, etc.)
- [ ] `brokerChannelSeparationContract` — enforces standalone vs. MGA-affiliated separation

**Each contract should:**
- Define field-level access (read, write, delete)
- Enforce tenant scope
- Enforce distribution-channel scope
- Support audit logging
- Support permission denial reasons

**Work Estimate:** 2 days (contract design + implementation)

---

### 4.2 Broker User Role & Permission Matrix — MISSING

**Gap:** `BrokerAgencyUser` role enum is minimal (owner, manager, viewer); full permission matrix missing.

**Required:**
- [ ] Define full broker roles (broker_agency_admin, broker_producer, broker_account_manager, broker_benefits_admin, broker_quote_user, broker_read_only)
- [ ] Define role-to-permission mapping (create employers, create cases, upload census, create quotes, etc.)
- [ ] Create permission resolver function to check user permissions per role
- [ ] Implement permission checks in frontend (disable UI if no permission)
- [ ] Implement permission checks in backend (reject if unauthorized)

**Work Estimate:** 1–2 days (role design + permission resolver)

---

### 4.3 MGA Broker Visibility Boundary Enforcement — MISSING

**Gap:** No enforcement preventing MGA from seeing broker's standalone business.

**Required:**
- [ ] Create `brokerMGAVisibilityContract` enforcing:
  - MGA only sees records with `broker_mga_relationship_id = active relationship`
  - MGA cannot see standalone broker records
  - MGA cannot see hybrid broker's direct book
- [ ] Update query filters in broker listing, case listing, etc. to enforce boundary

**Work Estimate:** 2 days

---

### 4.4 Hybrid Broker Book Separation — MISSING

**Gap:** No UI/backend logic to separate broker's direct book from MGA-affiliated book.

**Required:**
- [ ] Update broker dashboard to show:
  - "My Direct Business" (channel_type = standalone_broker)
  - "MGA-Affiliated Business" (channel_type = mga_affiliated_broker)
  - "All Business" (union of both)
- [ ] Add toggle/tabs to switch between views
- [ ] Update all broker entity lists (employers, cases, quotes) to support channel filtering
- [ ] Update broker analytics to show per-channel breakdowns

**Work Estimate:** 2–3 days

---

## 5. Benefits Admin Bridge Gaps

### 5.1 Quote-to-Benefits Admin Handoff — MISSING

**Gap:** No workflow to move approved quote into Benefits Admin case.

**Required:**
- [ ] Add "Mark Sold" button on broker quote scenario
- [ ] Create backend function `initiateQuoteToBenefitsHandoff`
- [ ] Create benefits admin case record (stamped with same distribution channel context)
- [ ] Link Benefits Admin case back to original quote/proposal
- [ ] Route broker to Benefits Admin setup flow

**Work Estimate:** 2 days

---

### 5.2 Benefits Admin Case Broker Scoping — MISSING

**Gap:** Benefits Admin cases not stamped with distribution-channel context or broker ownership.

**Required:**
- [ ] Stamp all Benefits Admin cases with distribution-channel fields
- [ ] Implement broker-only visibility (broker can only see own cases)
- [ ] Implement MGA-affiliated visibility (MGA can only see affiliated broker's cases)
- [ ] Implement hybrid visibility (broker sees all, MGA sees only affiliated)

**Work Estimate:** 2–3 days

---

### 5.3 Benefits Admin Document / Task / Renewal Bridges — MISSING

**Gap:** Benefits Admin documents, tasks, notifications, renewals not integrated with broker channel context.

**Required:**
- [ ] Stamp all Benefits Admin documents with distribution-channel context
- [ ] Stamp all Benefits Admin tasks with distribution-channel context
- [ ] Stamp all Benefits Admin renewals with distribution-channel context
- [ ] Implement same visibility rules as Benefits Admin cases
- [ ] Update broker workspace to show Benefits Admin documents, tasks, renewals

**Work Estimate:** 2–3 days

---

## 6. Test Coverage Gaps

### 6.1 Unit Tests — MISSING

**Required Test Coverage:**
- [ ] Broker permission resolver contract (all access scenarios)
- [ ] Broker RLS enforcement (query filtering)
- [ ] Distribution-channel stamping (correct fields on create/update)
- [ ] Broker visibility scope calculations
- [ ] MGA-affiliated broker visibility boundaries
- [ ] Hybrid broker book separation logic

**Work Estimate:** 2–3 days

---

### 6.2 Integration Tests — MISSING

**Required Test Coverage:**
- [ ] Standalone broker signup → approval → portal access
- [ ] MGA broker affiliation request → activation
- [ ] Hybrid broker creating direct case + MGA-affiliated case (separate channels)
- [ ] Broker creating employer, case, census, quote, proposal
- [ ] Quote-to-Benefits Admin handoff
- [ ] MGA viewing only affiliated broker business
- [ ] Platform admin viewing all brokers

**Work Estimate:** 3–4 days

---

### 6.3 End-to-End Tests (Playwright) — MISSING

**Required Scenarios:**
- [ ] Broker signup flow (all 4–7 steps)
- [ ] Admin approval workflow
- [ ] Broker login → dashboard → create case
- [ ] Broker quote creation → sold → Benefits Admin handoff

**Work Estimate:** 2–3 days

---

## 7. Activation / Feature Flag Gaps

### 7.1 Feature Flags Required

| Flag | Default | Purpose | Phase |
|---|---|---|---|
| `BROKER_ONBOARDING_ENABLED` | false | Enable/disable broker onboarding flow | 1 |
| `BROKER_WORKSPACE_ENABLED` | false | Enable/disable broker portal access | 1 |
| `BROKER_DIRECT_BUSINESS_ENABLED` | false | Allow brokers to create employers/cases/quotes | 1 |
| `HYBRID_BROKER_ENABLED` | false | Enable hybrid broker direct + MGA-affiliated business | 2 |
| `BROKER_BENEFITS_ADMIN_BRIDGE_ENABLED` | false | Enable quote-to-Benefits Admin handoff | 2 |
| `MGA_BROKER_AFFILIATION_ENABLED` | false | Enable MGA to create/affiliate brokers | 2 |

**Work Estimate:** 1 day (feature flag registry + conditional rendering)

---

### 7.2 Rollout Sequencing

**Phase 1 — Standalone Broker Operating Model (Weeks 1–2)**
1. Backend approval workflow + token security
2. Broker profile completion workflow + document upload
3. Data model stamping (Employer, CensusVersion, QuoteScenario, Proposal, EnrollmentWindow, RenewalCycle)
4. Broker RLS contract + permission resolver
5. Broker dashboard + basic workspace pages
6. Onboarding route activation + form UI
7. Integration tests for signup → approval → portal
8. Feature flags + staged rollout

**Phase 2 — Hybrid Broker + MGA Affiliation + Benefits Admin Bridge (Weeks 3–4)**
1. BrokerEmployerRelationship entity + queries
2. MGA broker affiliation workflow + backend functions
3. Hybrid broker book separation (UI + backend queries)
4. Benefits Admin case / document / task / renewal stamping
5. Quote-to-Benefits Admin handoff
6. Benefits Admin bridge integration
7. MGA-only visibility enforcement
8. Hybrid broker integration tests
9. E2E tests

**Phase 3 — Stabilization & Audit (Week 5)**
1. Full test coverage (unit + integration + E2E)
2. Security review (RLS contracts, permission enforcement)
3. Documentation (API, workflows, admin guide)
4. Performance testing (large broker books)
5. Rollout to production

---

## 8. Implementation Sequencing

### Step 1: Data Model Foundation (3 days)
1. Add distribution-channel stamps to all major entities
2. Create `BrokerEmployerRelationship` schema
3. Create data migration scripts (backfill existing records)

### Step 2: Backend Contracts & Functions (5 days)
1. Create broker approval workflow functions
2. Create broker token security contract
3. Create broker permission resolver contract
4. Create broker profile completion workflow
5. Create duplicate detection + NPN/license validation stubs

### Step 3: Broker RLS & Scoping (3 days)
1. Implement broker row-level access contract
2. Implement broker visibility scope calculations
3. Implement MGA boundary enforcement
4. Implement hybrid broker separation logic

### Step 4: Frontend Workspace (5 days)
1. Build broker dashboard + header/sidebar
2. Build broker employer list + creation
3. Build broker case list + detail
4. Build broker quote + proposal UI
5. Integrate with existing census/quote engines

### Step 5: Onboarding & Approval (3 days)
1. Complete onboarding form (multi-step UI)
2. Wire token validation
3. Wire document upload
4. Enable onboarding feature flag

### Step 6: Benefits Admin Bridge (3 days)
1. Stamp Benefits Admin entities with distribution channel
2. Implement quote-to-Benefits Admin handoff
3. Add Benefits Admin dashboard to broker workspace

### Step 7: Testing & Docs (4 days)
1. Unit tests (contracts, resolvers)
2. Integration tests (workflows)
3. E2E tests (user journeys)
4. Documentation (API, admin guide, FAQ)

---

## 9. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Data stamping on existing records may cause sync delays | Pre-plan migration window; run in off-hours; validate before commit |
| Broker RLS may break existing admin/MGA queries | Implement contracts + add comprehensive tests before activation |
| MGA affiliation workflow may introduce account takeover risk | Use secure tokens; enforce approval; audit all affiliation requests |
| Hybrid broker book separation may confuse users | Add clear visual indicators; provide help docs; offer support channel |
| Benefits Admin bridge breaks existing Benefits workflows | Build in isolation phase; test with sample data; soft-launch with feature flag |

---

## 10. Success Criteria

- [ ] All major entities stamped with distribution-channel context
- [ ] Broker can sign up, complete onboarding, be approved, and access portal
- [ ] Broker can create employers, cases, census, quotes, proposals
- [ ] Broker can mark quote sold and move to Benefits Admin
- [ ] Broker cannot see other brokers' business
- [ ] MGA can affiliate with broker and see only affiliated business
- [ ] Hybrid broker can keep direct and MGA-affiliated business separate
- [ ] Platform admin can review and approve all brokers
- [ ] All workflows covered by integration tests
- [ ] Zero RLS/permission violations in audit logs

---

## 11. Sign-Off

**Document Status:** READY FOR PHASED EXECUTION

**Next Action:** Prioritize Phase 1 work; assign resources; begin data model foundation.

**Review Date:** 2026-05-21 (weekly check-in)