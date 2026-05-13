# Gate 7A-2 Broker Direct Workspace Implementation Work Order

**Date:** 2026-05-13  
**Status:** PLANNING AUTHORIZED ONLY (No implementation authorized)  
**Operator Authorization:** Planning & work order creation only  
**Implementation Authorization:** Pending separate operator approval

---

## 1. Purpose

Provide approved standalone brokers with their own `/broker` workspace and direct book of business capabilities.

**Goals:**
- Enable brokers approved in Gate 7A-1 to access their private workspace
- Allow direct employer and case creation under broker name
- Maintain separation between Direct Book (broker-owned) and MGA-Affiliated Book (MGA-owned)
- Preserve all Gate 7A-1 portal access rules and compliance enforcement
- Keep runtime features behind feature flags (all false until activated)

**Scope:**
- Broker workspace UI shell and access rules
- Direct book of business model
- Broker employer and case creation workflows
- Census upload for broker's employers
- Quote and proposal visibility to brokers
- Broker settings and profile management
- Feature flags for workspace activation

**Out of Scope:**
- Quote delegation (Gate 7A-3)
- Multi-tenant MGA hierarchy (Gate 7A-5)
- Advanced features (Gate 7A-6)
- Benefits Admin bridge (Gate 7A-4)

---

## 2. Exact Files to Create

### New Entities (2)

| Entity | File Path | Purpose |
|--------|-----------|---------|
| BrokerEmployer | `/src/entities/BrokerEmployer.json` | Employer owned by broker, tied to broker workspace |
| BrokerCase | `/src/entities/BrokerCase.json` | Case under broker ownership, tied to broker employer |

### New Backend Contracts (5)

| Contract | File Path | Purpose |
|----------|-----------|---------|
| brokerWorkspaceAccessContract.js | `/src/lib/contracts/brokerWorkspaceAccessContract.js` | Broker workspace access eligibility + state evaluation |
| brokerEmployerManagementContract.js | `/src/lib/contracts/brokerEmployerManagementContract.js` | Broker employer CRUD + direct book ownership |
| brokerCaseManagementContract.js | `/src/lib/contracts/brokerCaseManagementContract.js` | Broker case CRUD + direct book case management |
| brokerCensusUploadContract.js | `/src/lib/contracts/brokerCensusUploadContract.js` | Census upload for broker employers |
| brokerBookOfBusinessSeparationContract.js | `/src/lib/contracts/brokerBookOfBusinessSeparationContract.js` | Direct Book vs MGA-Affiliated Book separation enforcement |

### New Route Components (1)

| Component | File Path | Purpose |
|-----------|-----------|---------|
| BrokerWorkspaceShell.jsx | `/src/pages/BrokerWorkspaceShell.jsx` | Broker workspace route shell (fail-closed while disabled) |

### New Tests (7)

| Test Suite | File Path | Test Count |
|-----------|-----------|-----------|
| gate7a-2-broker-workspace-access.test.js | `/src/tests/gate7a/gate7a-2-broker-workspace-access.test.js` | 15 |
| gate7a-2-broker-employer-management.test.js | `/src/tests/gate7a/gate7a-2-broker-employer-management.test.js` | 18 |
| gate7a-2-broker-case-management.test.js | `/src/tests/gate7a/gate7a-2-broker-case-management.test.js` | 16 |
| gate7a-2-broker-census-upload.test.js | `/src/tests/gate7a/gate7a-2-broker-census-upload.test.js` | 14 |
| gate7a-2-book-of-business-separation.test.js | `/src/tests/gate7a/gate7a-2-book-of-business-separation.test.js` | 12 |
| gate7a-2-route-ui-fail-closed.test.js | `/src/tests/gate7a/gate7a-2-route-ui-fail-closed.test.js` | 10 |
| gate7a-2-regression-guardrails.test.js | `/src/tests/gate7a/gate7a-2-regression-guardrails.test.js` | 15 |

**Total files to create:** 15 (2 entities, 5 contracts, 1 route, 7 tests)

---

## 3. Exact Files to Modify

| File | Normalized Path | Change |
|------|-----------------|--------|
| App.jsx | `/src/App.jsx` | Add /broker route to AppLayout, mapped to BrokerWorkspaceShell |
| QUOTE_CONNECT_360_GATE_REGISTRY.json | `/docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` | Updated during Gate 7A-1 closure |

**Total files to modify:** 2

---

## 4. Route Plan

### Route Structure

| Route | Component | Shell Behavior | Feature Flag | Status |
|-------|-----------|-----------------|--------------|--------|
| /broker | BrokerWorkspaceShell | 403 Forbidden while disabled | BROKER_WORKSPACE_ENABLED | ✅ PLANNED |
| /broker/employers | (future sub-route) | Fail-closed while disabled | BROKER_WORKSPACE_ENABLED | ✅ PLANNED |
| /broker/cases | (future sub-route) | Fail-closed while disabled | BROKER_WORKSPACE_ENABLED | ✅ PLANNED |
| /broker/settings | (future sub-route) | Fail-closed while disabled | BROKER_WORKSPACE_ENABLED | ✅ PLANNED |

### Route Access Control

| Prerequisite | Enforcement | Status |
|-----------|---|---|
| Portal access eligible | evaluateBrokerPortalAccess() returns ACTIVE state | ✅ PLANNED |
| workspace_activated = true | Feature flag must be true, workspace must be activated | ✅ PLANNED |
| Valid BrokerAgencyUser role | User role validated | ✅ PLANNED |
| Scope isolation | Cross-tenant access masked 404 | ✅ PLANNED |

---

## 5. Broker Workspace Dashboard Plan

### Workspace Layout

| Section | Content | Status |
|---------|---------|--------|
| Header | Broker name, workspace status, logout | ✅ PLANNED |
| Left Nav | Employers, Cases, Census, Quotes, Proposals, Tasks, Documents, Settings | ✅ PLANNED |
| Dashboard | KPI cards (employees, cases, quotes), recent activity, next actions | ✅ PLANNED |
| Quick Actions | New employer, new case, upload census, create quote | ✅ PLANNED |

### Workspace KPI Cards

| KPI | Calculation | Access Control |
|-----|-------------|-----------------|
| Total Employers | Count of broker's employers | Broker only, own data |
| Total Cases | Count of broker's cases | Broker only, own data |
| Active Quotes | Count of open quotes | Broker only, own data |
| Enrolled Employees | Sum across employer censuses | Broker only, own data |

**Workspace Status:** ✅ PLANNED (fail-closed behind feature flag)

---

## 6. Book of Business Model

### Direct Book Ownership

| Component | Ownership | Access |
|-----------|-----------|--------|
| BrokerEmployer | Broker-owned | Broker only (scoped) |
| BrokerCase | Broker-owned | Broker only (scoped) |
| Census data | Broker employer's data | Broker only (scoped) |
| Quotes | Broker-created quotes | Broker only (scoped) |
| Proposals | Broker-generated proposals | Broker only (scoped) |
| Tasks | Broker-created tasks | Broker only (scoped) |

### Direct Book Access Control

| Rule | Enforcement | Status |
|------|------------|--------|
| Broker cannot access MGA employers | Scope validation blocks cross-ownership access | ✅ PLANNED |
| Broker cannot access other broker's employers | Scope validation + MGA isolation | ✅ PLANNED |
| Admin can view all (MGA + direct) | Platform admin scope enforcement | ✅ PLANNED |
| Audit logging of all direct book actions | Immutable audit trail | ✅ PLANNED |

---

## 7. Direct Book vs MGA-Affiliated Book Separation

### Book Types

| Book Type | Owner | Workspace | Access |
|-----------|-------|-----------|--------|
| Direct Book | Broker (standalone) | /broker | Broker only |
| MGA-Affiliated Book | MGA agency | /mga/command | MGA admin only |

### Separation Enforcement

| Separation | Mechanism | Status |
|-----------|-----------|--------|
| Query filtering | Direct Book queries filter by broker_id | ✅ PLANNED |
| Scope validation | Scope resolver prevents cross-book access | ✅ PLANNED |
| Audit tracking | All queries logged with book type | ✅ PLANNED |
| UI separation | /broker and /mga/command are separate routes | ✅ PLANNED |
| Permission enforcement | Role-based access control | ✅ PLANNED |

**Separation Model:** ✅ PLANNED (no mixing of book types)

---

## 8. Broker Employer Creation Plan

### BrokerEmployer Entity

| Field | Type | Purpose | Status |
|-------|------|---------|--------|
| broker_agency_id | FK | Tie to broker agency | ✅ PLANNED |
| name | String | Employer name | ✅ PLANNED |
| status | Enum | active/inactive | ✅ PLANNED |
| ein | String | Employer ID | ✅ PLANNED |
| employee_count | Number | Current headcount | ✅ PLANNED |
| primary_contact | Object | Contact info | ✅ PLANNED |
| audit_trace_id | String | Audit correlation | ✅ PLANNED |

### Creation Workflow

| Step | Owner | Status |
|------|-------|--------|
| 1. Broker submits employer data | Broker | ✅ PLANNED |
| 2. Validation (EIN uniqueness, data quality) | System | ✅ PLANNED |
| 3. BrokerEmployer record created | brokerEmployerManagementContract | ✅ PLANNED |
| 4. Audit event logged | Audit system | ✅ PLANNED |

---

## 9. Broker Case Creation Plan

### BrokerCase Entity

| Field | Type | Purpose | Status |
|-------|------|---------|--------|
| broker_agency_id | FK | Tie to broker agency | ✅ PLANNED |
| broker_employer_id | FK | Tie to broker employer | ✅ PLANNED |
| case_number | String | Auto-generated reference | ✅ PLANNED |
| case_type | Enum | new_business/renewal/mid_year_change | ✅ PLANNED |
| stage | Enum | draft/census_in_progress/ready_for_quote/etc. | ✅ PLANNED |
| effective_date | Date | Coverage start date | ✅ PLANNED |
| employee_count | Number | From census | ✅ PLANNED |
| audit_trace_id | String | Audit correlation | ✅ PLANNED |

### Creation Workflow

| Step | Owner | Status |
|------|-------|--------|
| 1. Broker selects employer | Broker | ✅ PLANNED |
| 2. Broker provides case details | Broker | ✅ PLANNED |
| 3. Validation (dates, employee count) | System | ✅ PLANNED |
| 4. BrokerCase record created | brokerCaseManagementContract | ✅ PLANNED |
| 5. Initial census import requested | System | ✅ PLANNED |
| 6. Audit event logged | Audit system | ✅ PLANNED |

---

## 10. Census Upload Plan

### Census Upload Workflow

| Step | Owner | Status |
|------|-------|--------|
| 1. Broker selects case | Broker | ✅ PLANNED |
| 2. Broker uploads census file | Broker | ✅ PLANNED |
| 3. File stored in private location | brokerCensusUploadContract | ✅ PLANNED |
| 4. CensusVersion record created (scoped to broker case) | System | ✅ PLANNED |
| 5. Validation begins (async) | System | ✅ PLANNED |
| 6. Results reported to broker | System | ✅ PLANNED |
| 7. Audit event logged | Audit system | ✅ PLANNED |

### Census Scope

| Scope | Control | Status |
|-------|---------|--------|
| Broker can only upload for own employers | Scope validation | ✅ PLANNED |
| Broker cannot upload for MGA employers | Scope validation | ✅ PLANNED |
| Broker can see only own census files | Scope filtering | ✅ PLANNED |
| Admin can see all census files | Admin scope | ✅ PLANNED |

---

## 11. Quote / Proposal Visibility Plan

### Quote Visibility

| Query | Visibility | Status |
|-------|-----------|--------|
| Broker views own quotes | Own cases only | ✅ PLANNED |
| Broker views other broker's quotes | Not visible (filtered out) | ✅ PLANNED |
| Admin views all quotes | All quotes (all scopes) | ✅ PLANNED |

### Proposal Visibility

| Query | Visibility | Status |
|-------|-----------|--------|
| Broker views own proposals | Own cases only | ✅ PLANNED |
| Broker views other broker's proposals | Not visible (filtered out) | ✅ PLANNED |
| Employer views proposals | Only if case belongs to their employer | ✅ PLANNED |
| Admin views all proposals | All proposals (all scopes) | ✅ PLANNED |

---

## 12. Task / Document / Report Shell Plan

### Broker Task Management

| Action | Owner | Scope | Status |
|--------|-------|-------|--------|
| Create task | Broker | Own cases only | ✅ PLANNED |
| Assign task | Broker | Own team only | ✅ PLANNED |
| View tasks | Broker | Own cases only | ✅ PLANNED |

### Broker Documents

| Document Type | Scope | Access | Status |
|-----------|-------|--------|--------|
| Census files | Own employer/case | Broker only | ✅ PLANNED |
| Proposals | Own cases | Broker + employer | ✅ PLANNED |
| Agreements | Own cases | Broker only | ✅ PLANNED |

### Broker Reports

| Report Type | Data Scope | Status |
|-----------|-----------|--------|
| Case summary | Own cases | ✅ PLANNED |
| Employee roster | Own census data | ✅ PLANNED |
| Quote history | Own quotes | ✅ PLANNED |

---

## 13. Broker Settings / Profile Plan

### Broker Settings

| Setting | Owner | Editable | Status |
|---------|-------|----------|--------|
| Workspace name/branding | Broker | Yes | ✅ PLANNED |
| Contact info | Broker | Yes | ✅ PLANNED |
| Team members | Broker | Yes (pending Gate 7A-5) | ✅ PLANNED |
| Portal access status | System | No (read-only) | ✅ PLANNED |
| Compliance status | System | No (read-only) | ✅ PLANNED |

### Broker Profile

| Field | Source | Status |
|-------|--------|--------|
| Agency name | From BrokerAgencyProfile | ✅ PLANNED |
| NPN/License | From onboarding | ✅ PLANNED |
| Compliance status | From compliance validation | ✅ PLANNED |
| Workspace activation date | From workspace_activated | ✅ PLANNED |

---

## 14. Feature Flag Plan

### Gate 7A-2 Feature Flags

| Flag | Phase | Default | Purpose | Status |
|------|-------|---------|---------|--------|
| BROKER_WORKSPACE_ENABLED | 7A-2 | FALSE | Enable /broker workspace access | ✅ PLANNED |
| BROKER_EMPLOYER_CREATION_ENABLED | 7A-2 | FALSE | Enable broker employer creation | ✅ PLANNED |
| BROKER_CASE_CREATION_ENABLED | 7A-2 | FALSE | Enable broker case creation | ✅ PLANNED |
| BROKER_CENSUS_UPLOAD_ENABLED | 7A-2 | FALSE | Enable census upload for brokers | ✅ PLANNED |
| BROKER_DIRECT_BOOK_ENABLED | 7A-2 | FALSE | Enable direct book of business features | ✅ PLANNED |

### Feature Flag Defaults

- All 5 new flags: FALSE (fail-closed)
- All 10 Gate 7A-1 flags: FALSE (remain from Gate 7A-1)
- All 10 Gate 7A-0 flags: FALSE (remain from Gate 7A-0)
- **Total flags: 25 (all FALSE)**

---

## 15. Scope / Permission / Audit Enforcement

### Scope Enforcement

| Rule | Mechanism | Status |
|------|-----------|--------|
| Broker scoped to own employers | Query filters by broker_agency_id | ✅ PLANNED |
| Broker scoped to own cases | Query filters by broker_agency_id | ✅ PLANNED |
| Broker scoped to own census data | Query filters by broker_case | ✅ PLANNED |
| Cross-broker access blocked | Scope validation + 404 masking | ✅ PLANNED |
| Cross-tenant access blocked | Scope validation + 404 masking | ✅ PLANNED |

### Permission Enforcement

| Permission | Required For | Status |
|-----------|-----------|--------|
| broker.workspace_access | Workspace entry | ✅ PLANNED |
| broker.employer_create | Employer creation | ✅ PLANNED |
| broker.case_create | Case creation | ✅ PLANNED |
| broker.census_upload | Census file upload | ✅ PLANNED |

### Audit Enforcement

| Event | Logging | Status |
|-------|---------|--------|
| Workspace access | Logged with broker ID and timestamp | ✅ PLANNED |
| Employer creation | Logged with details and broker actor | ✅ PLANNED |
| Case creation | Logged with details and broker actor | ✅ PLANNED |
| Census upload | Logged with file info and broker actor | ✅ PLANNED |
| All workspace queries | Logged with actor and scope | ✅ PLANNED |

---

## 16. Safe Payload & No Raw Frontend Entity-Read Plan

### Backend-Only Contract Enforcement

| Query Type | Allowed | Route | Status |
|-----------|---------|--------|--------|
| Direct entity.list() from UI | NO | Blocked | ✅ PLANNED |
| Direct entity.filter() from UI | NO | Blocked | ✅ PLANNED |
| Via broker workspace contract | YES | Through backend | ✅ PLANNED |

### Safe Response Payloads

| Response Type | PII Exposed | Status |
|-----------|----------|--------|
| Employer list | Name, EIN only (not NPN/tax details) | ✅ PLANNED |
| Case list | Case number, stage, dates (not compliance data) | ✅ PLANNED |
| Employee data | Masked (not full SSN) | ✅ PLANNED |
| Audit logs | Non-sensitive events only | ✅ PLANNED |

---

## 17. Route & UI Guardrails

### Route Status

| Route | Status | Behavior |
|-------|--------|----------|
| /broker | SHELL ONLY | Returns 403 while BROKER_WORKSPACE_ENABLED=false |
| /broker/employers | NOT EXPOSED | Reserved for Gate 7A-2 activation |
| /broker/cases | NOT EXPOSED | Reserved for Gate 7A-2 activation |
| /broker/settings | NOT EXPOSED | Reserved for Gate 7A-2 activation |

### UI Guardrails

| Guardrail | Implementation | Status |
|-----------|----------------|--------|
| Workspace shell fail-closed | Returns 403 "Service Unavailable" | ✅ PLANNED |
| Navigation hidden | No links to broker workspace while flag false | ✅ PLANNED |
| No direct book UI | Workspace UI not rendered while disabled | ✅ PLANNED |

---

## 18. Portal Access Prerequisite Enforcement

### Workspace Access Requirements

| Prerequisite | Status Check | Enforcement |
|-----------|-----------|---|
| Portal access eligible | evaluateBrokerPortalAccess() returns ACTIVE | Must be ACTIVE to enter workspace |
| Workspace activated | workspace_activated = true | Must be true to enter workspace |
| Compliance clear | No active compliance hold | Portal access rules enforce this |
| Valid user role | BrokerAgencyUser role present | Required for scope enforcement |

### Access Blocking

| Scenario | Result | Status |
|----------|--------|--------|
| Portal access not eligible | 403 Forbidden | ✅ PLANNED |
| workspace_activated = false | 403 Forbidden | ✅ PLANNED |
| Compliance hold active | 403 Forbidden | ✅ PLANNED |
| Invalid user role | 403 Forbidden | ✅ PLANNED |

---

## 19. Test Plan

### Test Suites (7 total)

| Suite | Tests | Coverage |
|-------|-------|----------|
| gate7a-2-broker-workspace-access.test.js | 15 | Access eligibility, state evaluation, feature flag gating |
| gate7a-2-broker-employer-management.test.js | 18 | Employer CRUD, ownership, scope validation |
| gate7a-2-broker-case-management.test.js | 16 | Case CRUD, ownership, stage transitions |
| gate7a-2-broker-census-upload.test.js | 14 | Census upload, validation, scope enforcement |
| gate7a-2-book-of-business-separation.test.js | 12 | Direct Book vs MGA separation, access control |
| gate7a-2-route-ui-fail-closed.test.js | 10 | Route gating, UI shells, fail-closed behavior |
| gate7a-2-regression-guardrails.test.js | 15 | Gate 7A-0/7A-1 regression, deferred gates, Q360/BA unchanged |

**Total: 100 test cases planned**

---

## 20. Rollback Plan

### Non-Destructive Rollback

| Action | Rollback | Status |
|--------|----------|--------|
| Keep feature flags false | No broker workspace activation | ✅ PLANNED |
| Keep runtime inactive | No direct book operations | ✅ PLANNED |
| Keep routes hidden | /broker returns 403 while disabled | ✅ PLANNED |
| Keep entities unused | BrokerEmployer and BrokerCase entities inert until activated | ✅ PLANNED |

### No Destructive Deletion

| Record Type | Deletion Authorized | Status |
|-----------|-------------------|--------|
| BrokerEmployer records | NO (unless explicitly approved) | ✅ PLANNED |
| BrokerCase records | NO (unless explicitly approved) | ✅ PLANNED |
| Audit events | NO (append-only) | ✅ PLANNED |

---

## 21. Registry Update Plan

### Registry Updates During Gate 7A-2 Work Order Acceptance

| Field | Old Value | New Value | Status |
|-------|-----------|-----------|--------|
| Gate 7A-1 status | IMPLEMENTED_TESTS_CREATED_PENDING_VALIDATION | CLOSED | ✅ UPDATED |
| Gate 7A currentPhase | 7A-1 | 7A-2 | ✅ UPDATED |
| Gate 7A-2 status | NOT_STARTED | PLANNING_AUTHORIZED_ONLY | ✅ UPDATED |

---

## 22. Enterprise Advisory Notes

### Usability Recommendations (Optional)

- Broker workspace onboarding tutorial
- Employer creation wizard
- Census upload validation feedback
- Direct book analytics dashboard

### Operational Considerations

- Database performance: Broker scoping queries may need indexing on broker_agency_id
- Audit volume: Direct book operations will generate significant audit events
- Test data: Consider seed data for broker workspace testing

### Security Considerations

- Scope validation critical: Misimplementation could expose cross-broker data
- Portal access prerequisite enforcement: Brokers must not bypass workspace access rules
- Audit trails: All direct book operations must be logged for compliance

---

## 23. Operator Stop Condition

Operator may request amendments to this work order if:

- Scope is unclear for any section
- Feature flag list is incomplete
- Test plan coverage is insufficient
- Rollback plan is inadequate
- Enterprise advisory notes require expansion
- Any hard guardrail is unclear or conflicts with design intent

---

## Hard Guardrails — ALL ENFORCED

The following restrictions remain in effect during ALL Gate 7A-2 work:

- ✅ Do not implement Gate 7A-2 runtime code
- ✅ Do not expose /broker
- ✅ Do not activate broker workspace
- ✅ Do not enable feature flags
- ✅ Do not expose broker book of business
- ✅ Do not enable broker employer creation
- ✅ Do not enable broker case creation
- ✅ Do not enable census upload
- ✅ Do not enable quote/proposal workflow changes
- ✅ Do not modify Quote Connect 360 runtime behavior
- ✅ Do not expose QuoteWorkspaceWrapper
- ✅ Do not expose Benefits Admin setup
- ✅ Do not modify Benefits Admin bridge behavior
- ✅ Do not execute production backfill
- ✅ Do not perform destructive migration
- ✅ Do not proceed to Gate 7A-3
- ✅ Do not touch deferred Gates 6I-B, 6J-B, 6J-C, or 6L-B
- ✅ Do not regress Gate 7A-0
- ✅ Do not regress Gate 7A-1
- ✅ Do not regress Gate 6K
- ✅ Do not regress Gate 6L-A

---

## Work Order Status

**Status:** PLANNING AUTHORIZED ONLY  
**Date Created:** 2026-05-13  
**Next Step:** Operator reviews and approves work order for implementation authorization (separate approval required)

**Implementation Authorization:** Pending separate operator approval  
**No runtime code implementation authorized at this time.**

---

## Summary

This work order defines the complete planning scope for Gate 7A-2 Broker Direct Workspace. Implementation is **NOT** authorized at this time. A separate operator approval is required before any code changes are implemented.

All sections (1-23) are complete and ready for operator review.