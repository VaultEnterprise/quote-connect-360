# First-Class Broker Agency Model
## Phased Execution Plan

**Status:** PLANNING COMPLETE / IMPLEMENTATION_NOT_STARTED  
**Date Created:** 2026-05-14  
**Controlling Artifact:** FIRST_CLASS_BROKER_AGENCY_MODEL_GAP_TO_IMPLEMENTATION_WORK_ORDER.md

---

## Phase Overview

Eight controlled phases, each with discrete scope, dependencies, rollback strategy, and completion criteria. **Phase 1 is the mandatory starting point** — all downstream phases depend on DistributionChannelContext stamping.

---

## Phase 1: Data Model Completion

### Objective
Stamp all major business records with DistributionChannelContext and ownership fields. Establish single source of truth for record ownership, visibility scope, and audit lineage.

### Scope
**Entities to modify:**
- `Employer` / `EmployerGroup`
- `CensusVersion`
- `QuoteScenario`
- `Proposal`
- `EnrollmentWindow`
- `RenewalCycle`
- `Task`
- `Document`
- `AuditEvent`
- `Notification`
- Benefits Admin case entity (TBD)

**New entities to create:**
- `BrokerEmployerRelationship`

**Fields to add per entity:**
```
distribution_channel_context_id (FK)
master_general_agent_id (nullable)
broker_agency_id (nullable)
owner_org_type (enum)
owner_org_id
servicing_org_type (nullable)
servicing_org_id (nullable)
supervising_org_type (nullable)
supervising_org_id (nullable)
created_by_user_id
created_by_role
visibility_scope (enum)
audit_trace_id
```

### Files Likely Affected
- `src/entities/Employer.json` — modify schema
- `src/entities/CensusVersion.json` — modify schema
- `src/entities/QuoteScenario.json` — modify schema
- `src/entities/Proposal.json` — modify schema
- `src/entities/EnrollmentWindow.json` — modify schema
- `src/entities/RenewalCycle.json` — modify schema
- `src/entities/Task.json` — modify schema
- `src/entities/Document.json` — modify schema
- `src/entities/AuditEvent.json` — modify schema
- `src/entities/Notification.json` — modify schema
- `src/entities/BenefitCase.json` or equivalent — locate + modify
- `src/entities/BrokerEmployerRelationship.json` — create new
- Data migration scripts (1–2 scripts)

### Runtime Risk Level
🔴 **HIGH**

**Risk factors:**
- Existing records must be backfilled with default/inferred channel context
- Query indexes may need adjustment
- Backward compatibility: old queries not scoped by channel context may return wrong results
- If stamping incorrect values, visibility/RLS will be broken downstream

**Mitigation:**
- Run migration in transaction; validate before commit
- Run off-hours with rollback plan
- Audit all migrated records post-completion
- Add NOT NULL constraints only after validation passes

### Dependencies
- No prior phases
- P0 Repair Registry remains locked (no prior approval needed)
- Requires database migration capability

### Required Feature Flags
None yet. (Flags activated in Phase 8.)

### Expected Test Count
- Unit tests: 5–10 (schema validation, field presence)
- Integration tests: 10–15 (backfill logic, query filtering)
- **Total: 15–25 test cases**

### Rollback Method
1. Rollback database migration (restore from backup or run reverse script)
2. Revert schema files to prior version
3. Redeploy without code changes
4. Validate data integrity post-rollback

**Rollback window:** < 2 hours

### Operator Approval Gate
**Approval required before migration execution:**
- [ ] Data migration script reviewed and tested on staging
- [ ] Rollback plan documented and tested
- [ ] Stakeholders (platform, MGA, broker ops) notified
- [ ] Off-hours window confirmed
- [ ] Post-migration audit plan defined

### Completion Criteria
✅ All 10+ entities have DistributionChannelContext stamping fields  
✅ `BrokerEmployerRelationship` schema created and deployed  
✅ All existing records backfilled with channel context (audit trail of migration)  
✅ Queries validated: old records have correct owner_org_type / owner_org_id  
✅ New record creation includes channel context stamping  
✅ Zero records missing required fields  
✅ Integration tests pass (100%)  
✅ Rollback verified on staging  

---

## Phase 2: Backend Contract Layer

### Objective
Implement service contracts enforcing channel-context creation, validation, and safe payload handling. Enable backend to safely create/update stamped records and prevent cross-channel violations.

### Scope
**New service contracts to create:**
- `brokerChannelContextContract` — validate channel context on creation
- `brokerOwnershipContract` — enforce owner_org_type/owner_org_id consistency
- `brokerSafePayloadContract` — validate payload structure for broker operations
- `distributionChannelValidationContract` — ensure immutability of channel_type, validate visibility scope
- `brokerProfileLifecycleContract` — manage BrokerAgencyProfile status transitions
- `brokerPlatformRelationshipContract` — manage approval workflow
- `brokerMGARelationshipContract` — manage affiliation workflow
- `auditTraceContract` — enforce audit_trace_id lineage

**New backend functions to create:**
- `validateChannelContext` — utility to validate context structure
- `stampeRecordWithChannelContext` — utility to add stamps to records on creation
- `createBrokerApprovedRecord` — safely create records post-broker approval
- `validateBrokerPayload` — validate safe payload for broker operations

### Files Likely Affected
- `lib/contracts/brokerChannelContextContract.js` — new file
- `lib/contracts/brokerOwnershipContract.js` — new file
- `lib/contracts/brokerSafePayloadContract.js` — new file
- `lib/contracts/distributionChannelValidationContract.js` — new file
- `lib/contracts/brokerProfileLifecycleContract.js` — new file
- `lib/contracts/brokerPlatformRelationshipContract.js` — new file
- `lib/contracts/brokerMGARelationshipContract.js` — new file
- `lib/contracts/auditTraceContract.js` — new file
- `src/functions/approveBrokerProfile.js` — new backend function
- `src/functions/rejectBrokerProfile.js` — new backend function
- `src/functions/requestBrokerMoreInfo.js` — new backend function
- `src/functions/releaseBrokerComplianceHold.js` — new backend function
- `src/functions/validateBrokerPayload.js` — new backend function

### Runtime Risk Level
🟡 **MEDIUM**

**Risk factors:**
- Contract validation failures could block legitimate operations if overly restrictive
- Existing backend functions (brokerSignup, etc.) may need updates to use new contracts
- Safe payload enforcement may break if payload structure assumptions are wrong

**Mitigation:**
- Build contracts with logging; don't reject silently
- Extensive contract unit tests before integration
- Phased activation: warn-mode → strict-mode
- Backward compatibility layer for existing operations

### Dependencies
**Depends on:** Phase 1 (Data Model Completion)

**Prerequisite:** All entities stamped with channel context

### Required Feature Flags
- `BROKER_CHANNEL_VALIDATION_ENABLED` — enable contract enforcement (default: false)
- `BROKER_APPROVAL_WORKFLOW_ENABLED` — enable approval functions (default: false)

### Expected Test Count
- Unit tests (contracts): 30–40 (validation logic per contract)
- Integration tests (functions): 20–30 (workflow scenarios)
- **Total: 50–70 test cases**

### Rollback Method
1. Disable feature flags (`BROKER_CHANNEL_VALIDATION_ENABLED = false`)
2. Remove backend functions from deployment
3. Remove contract files from codebase
4. Redeploy existing brokerSignup and other functions without contract dependencies
5. Validate broker signup still works

**Rollback window:** < 1 hour

### Operator Approval Gate
**Approval required before contract activation:**
- [ ] All contracts reviewed for correctness
- [ ] Contract unit tests pass (100%)
- [ ] Integration tests pass with sample workflows
- [ ] Backward compatibility verified
- [ ] Feature flags documented and gated

### Completion Criteria
✅ All 8 service contracts implemented and deployed  
✅ 4+ backend approval workflow functions deployed  
✅ Contract validation tests pass (100%)  
✅ Integration tests pass (100%)  
✅ Feature flags created and default to false  
✅ Existing brokerSignup function updated to use contracts  
✅ No breaking changes to existing broker operations  
✅ Audit logging for contract validation in place  

---

## Phase 3: Permission & Scope Enforcement

### Objective
Implement broker access control layer. Brokers can only see their own records; MGAs see only affiliated brokers; platform admins see all. Hybrid brokers keep direct and MGA-affiliated books separate.

### Scope
**New service contracts to create:**
- `brokerRecordAccessContract` — field-level read/write permissions
- `brokerVisibilityContract` — visibility scope rules
- `brokerScopeResolverContract` — calculate scope for broker at runtime
- `brokerPermissionResolverContract` — resolve user permissions per role
- `brokerHybridBookSeparationContract` — separate direct from MGA-affiliated records
- `mgaBrokerVisibilityContract` — enforce MGA-only visibility to affiliated brokers

**New backend functions:**
- `canBrokerAccessRecord` — check access permission
- `getBrokerVisibilityScope` — resolve broker's visibility
- `filterRecordsByBrokerScope` — filter query results
- `resolveBrokerPermissions` — resolve user role permissions
- `validateChannelOwnership` — prevent cross-channel access

**Frontend integration points:**
- Query filtering in broker entity lists
- Permission checks in broker UI (disable buttons if no permission)
- Role badge on broker dashboard

### Files Likely Affected
- `lib/contracts/brokerRecordAccessContract.js` — new file
- `lib/contracts/brokerVisibilityContract.js` — new file
- `lib/contracts/brokerScopeResolverContract.js` — new file
- `lib/contracts/brokerPermissionResolverContract.js` — new file
- `lib/contracts/brokerHybridBookSeparationContract.js` — new file
- `lib/contracts/mgaBrokerVisibilityContract.js` — new file
- `src/functions/canBrokerAccessRecord.js` — new backend function
- `src/functions/getBrokerVisibilityScope.js` — new backend function
- `src/functions/resolveBrokerPermissions.js` — new backend function
- `lib/permissionResolver.js` — new utility (refactored if exists)
- `lib/scopeResolver.js` — new utility (refactored if exists)
- All broker entity list components (Employer, Case, Census, Quote, Proposal) — add scope filtering

### Runtime Risk Level
🔴 **HIGH**

**Risk factors:**
- RLS bugs could expose broker A's data to broker B
- Permission denials could block legitimate broker operations
- Hybrid broker separation could confuse users if UI not clear
- MGA visibility boundary breaks could expose standalone broker data to MGA

**Mitigation:**
- Kill tests: deliberately try to access other broker's records (must fail)
- Comprehensive unit tests per contract
- Audit logging for every access decision
- Feature flag with strict approval gate
- Phased rollout: warn-mode → strict-mode

### Dependencies
**Depends on:** Phase 2 (Backend Contract Layer)

**Prerequisite:** Channel validation contracts in place

### Required Feature Flags
- `BROKER_RLS_ENABLED` — enable record-level security (default: false)
- `BROKER_PERMISSION_CHECK_ENABLED` — enable permission enforcement (default: false)
- `MGA_BROKER_VISIBILITY_ENFORCEMENT_ENABLED` — enforce MGA boundaries (default: false)
- `HYBRID_BROKER_BOOK_SEPARATION_ENABLED` — separate direct/MGA books (default: false)

### Expected Test Count
- Unit tests (contracts): 50–70 (permission scenarios, visibility rules)
- Kill tests: 20–30 (access denial scenarios)
- Integration tests: 30–40 (workflows with permissions)
- **Total: 100–140 test cases**

### Rollback Method
1. Disable all RLS feature flags
2. Remove permission/scope contracts from codebase
3. Revert broker entity list components to non-filtered versions
4. Redeploy without scope enforcement
5. Validate all users can see all records (permissive mode)

**Rollback window:** < 1.5 hours

### Operator Approval Gate
**Approval required before RLS activation:**
- [ ] Kill tests pass (100%) — no unauthorized access possible
- [ ] Unit tests pass (100%)
- [ ] Integration tests pass (100%)
- [ ] Audit logging verified for all access decisions
- [ ] Security review completed
- [ ] MGA boundary rules reviewed by MGA stakeholders
- [ ] Hybrid broker rules reviewed by broker stakeholders
- [ ] Feature flags approved and ready for strict enforcement

### Completion Criteria
✅ All 6 RLS contracts implemented and deployed  
✅ 5+ backend permission/scope functions deployed  
✅ Kill tests pass (100%) — no data leaks possible  
✅ Unit tests pass (100%)  
✅ Integration tests pass (100%)  
✅ All feature flags created and default to false  
✅ Broker entity list components updated with scope filtering  
✅ Audit log entries for all access decisions  
✅ Zero unauthorized data access possible  

---

## Phase 4: Broker Workspace (`/broker` Portal)

### Objective
Build functional broker portal. Brokers can view their book of business, create employers, cases, quotes, proposals, and track renewals.

### Scope
**Routes to create/activate:**
- `/broker` — broker dashboard (protected by login + broker agency verification)
- `/broker/employers` — employer list + detail + creation
- `/broker/cases` — case list + detail + creation
- `/broker/census` — census upload + version history
- `/broker/quotes` — quote list + scenario management + proposal workflow
- `/broker/renewals` — renewal pipeline + status tracking
- `/broker/documents` — document library (uploaded, generated, compliance)
- `/broker/tasks` — task list (assigned, pending, completed)
- `/broker/account` — broker profile + settings
- `/broker/benefits-admin` — Benefits Admin entry point (Phase 7)

**Components to create:**
- `BrokerDashboard` — summary KPIs, quick actions
- `BrokerPageHeader` — common header with logo, nav, user menu
- `BrokerSidebar` — navigation menu
- `BrokerEmployerList` + `BrokerEmployerDetail` + `BrokerEmployerCreate`
- `BrokerCaseList` + `BrokerCaseDetail` + `BrokerCaseCreate`
- `BrokerCensusUpload` (reuse existing census import)
- `BrokerQuoteList` + `BrokerQuoteScenario` (reuse existing quote engine)
- `BrokerProposalWorkflow` (reuse existing proposal UI)
- `BrokerRenewalPipeline` (reuse existing renewal UI)
- `BrokerDocumentLibrary`
- `BrokerTaskList`
- `BrokerAccountSettings`

**Features:**
- Direct Book view (channel_type = standalone_broker)
- MGA-Affiliated Book view (channel_type = mga_affiliated_broker) [for hybrid brokers]
- All Business view (union of above)
- Quick action buttons (create employer, create case, upload census, start quote, view renewals)

### Files Likely Affected
- `pages/BrokerWorkspace.jsx` — new main route/layout
- `pages/BrokerDashboard.jsx` — new page
- `pages/BrokerEmployers.jsx` — new page
- `pages/BrokerCases.jsx` — new page
- `pages/BrokerCensus.jsx` — new page
- `pages/BrokerQuotes.jsx` — new page
- `pages/BrokerRenewals.jsx` — new page
- `pages/BrokerDocuments.jsx` — new page
- `pages/BrokerTasks.jsx` — new page
- `pages/BrokerAccount.jsx` — new page
- `components/broker/BrokerPageHeader.jsx` — new component
- `components/broker/BrokerSidebar.jsx` — new component
- `components/broker/BrokerDashboard*.jsx` — new component family
- `App.jsx` — add `/broker/*` routes
- `lib/AuthContext.js` — add broker-specific auth checks

### Runtime Risk Level
🟡 **MEDIUM**

**Risk factors:**
- New routes could break if auth/scope checks missing
- Reused components (census, quote, proposal) may have MGA-specific logic not suited for brokers
- UI complexity if hybrid broker separation not clear to users
- Performance issues if querying large broker books

**Mitigation:**
- All routes protected by broker agency verification
- Audit scope checking before rendering
- Clear visual indicators for Direct vs. MGA-Affiliated business
- Comprehensive integration tests on all broker workflows
- Performance testing with large datasets

### Dependencies
**Depends on:** Phase 3 (Permission & Scope Enforcement)

**Prerequisite:** RLS contracts + permission enforcement in place

### Required Feature Flags
- `BROKER_WORKSPACE_ENABLED` — enable broker portal (default: false)
- `BROKER_DIRECT_BUSINESS_ENABLED` — allow broker to create records (default: false)
- `HYBRID_BROKER_UI_ENABLED` — show Direct/MGA book separation (default: false)

### Expected Test Count
- Component unit tests: 40–50
- Route integration tests: 30–40 (each page flow)
- E2E tests: 15–20 (full user journeys)
- **Total: 85–110 test cases**

### Rollback Method
1. Remove `/broker` routes from `App.jsx`
2. Delete all broker workspace pages and components
3. Disable feature flags
4. Redeploy
5. Brokers redirected to auth page if they try to access `/broker`

**Rollback window:** < 30 minutes

### Operator Approval Gate
**Approval required before broker portal activation:**
- [ ] All routes protected by broker verification
- [ ] Scope filtering enforced on all entity lists
- [ ] Integration tests pass (100%)
- [ ] E2E tests pass (all user journeys)
- [ ] UI/UX reviewed by broker stakeholders
- [ ] Performance testing completed (query times acceptable)
- [ ] Hybrid broker UI clarity approved
- [ ] Feature flags created and default to false

### Completion Criteria
✅ All 10+ broker routes created and functional  
✅ All components updated with scope filtering  
✅ Broker can create employers, cases, census, quotes, proposals  
✅ Broker can view renewals and documents  
✅ Direct Book / MGA-Affiliated Book separation visible (for hybrid brokers)  
✅ Integration tests pass (100%)  
✅ E2E tests pass (100%)  
✅ Feature flags created and ready for activation  

---

## Phase 5: Broker Onboarding Completion

### Objective
Complete broker onboarding workflow. Brokers submit profile, upload compliance documents, verify email, and receive approval/rejection from platform admin.

### Scope
**Routes to create/activate:**
- `/broker-onboarding?token=` — multi-step onboarding form (Phase 1 shell exists; complete it)
- Admin detail modal updates (already partially exists in Phase 1)

**Steps in onboarding form:**
1. Email verification (resend logic, rate limit)
2. Profile completion (contact, address, service areas)
3. License information (states, expiration, NPN)
4. Insurance lines and specialties
5. Compliance document upload (E&O, W-9, license copies, broker agreement)
6. Compliance acknowledgement
7. Review and submit

**Components:**
- `BrokerOnboardingForm` — multi-step form with save-draft
- `BrokerDocumentUpload` — upload UI for each doc type
- `BrokerEmailVerification` — email verification step
- `BrokerComplianceReview` — admin review modal updates

**Backend functions:**
- `completeBrokerProfileStep` — save each step
- `uploadBrokerComplianceDocument` — handle document upload
- `validateNPN` — external NPN validation (stub)
- `validateLicenseStates` — external license validation (stub)
- `submitBrokerForReview` — finalize profile
- `approveBrokerProfile` — admin approval
- `rejectBrokerProfile` — admin rejection
- `requestBrokerMoreInfo` — admin requests info

### Files Likely Affected
- `pages/BrokerOnboardingShell.jsx` — update (currently placeholder)
- `pages/BrokerOnboarding.jsx` — new page (replace shell or use as route)
- `components/broker/BrokerOnboardingForm.jsx` — new component
- `components/broker/BrokerDocumentUpload.jsx` — new component
- `components/broker/BrokerEmailVerification.jsx` — new component
- `components/broker/BrokerApprovalModal.jsx` — update (review modal)
- `src/functions/completeBrokerProfileStep.js` — new backend function
- `src/functions/uploadBrokerComplianceDocument.js` — new backend function
- `src/functions/submitBrokerForReview.js` — new backend function
- `src/functions/approveBrokerProfile.js` — new backend function (Phase 2, reuse here)
- `src/functions/rejectBrokerProfile.js` — new backend function (Phase 2, reuse here)
- `src/functions/requestBrokerMoreInfo.js` — new backend function (Phase 2, reuse here)

### Runtime Risk Level
🟡 **MEDIUM**

**Risk factors:**
- Email verification could fail if email service is down
- Document upload could fail if storage service down
- NPN/license validation stubs could block legitimate brokers (if validation logic wrong)
- Token validation could reject valid tokens (if security contract too strict)
- Compliance hold logic could trap brokers in approval loop

**Mitigation:**
- Email service with retry logic
- Document upload with fallback storage
- Validation stubs return success by default (strict validation in Phase 3+)
- Token validation with detailed error logging
- Approval workflow with "request more info" option (not just approve/reject)

### Dependencies
**Depends on:** Phase 2 (Backend Contract Layer)

**Prerequisite:** Backend approval workflow functions exist

### Required Feature Flags
- `BROKER_ONBOARDING_ENABLED` — enable onboarding form (default: false)
- `EMAIL_VERIFICATION_ENABLED` — require email verification (default: false)
- `COMPLIANCE_DOCUMENT_VALIDATION_ENABLED` — validate document uploads (default: false)

### Expected Test Count
- Component unit tests: 30–40 (form steps, validation)
- Integration tests: 20–30 (onboarding workflows, approval loops)
- E2E tests: 10–15 (full signup-to-approval journey)
- **Total: 60–85 test cases**

### Rollback Method
1. Disable onboarding feature flags
2. Remove multi-step form components
3. Revert BrokerOnboardingShell to placeholder
4. Disable backend onboarding functions
5. Redeploy
6. Brokers can still sign up via `/broker-signup` but cannot complete onboarding

**Rollback window:** < 45 minutes

### Operator Approval Gate
**Approval required before onboarding activation:**
- [ ] Multi-step form complete and tested
- [ ] Email verification logic working
- [ ] Document upload tested (virus scan, storage, retrieval)
- [ ] Token validation contract verified
- [ ] NPN/license validation stubs tested
- [ ] Approval workflow (approve/reject/more-info) tested
- [ ] Integration tests pass (100%)
- [ ] E2E tests pass (full signup-to-approval)
- [ ] Feature flags created and default to false
- [ ] Broker stakeholders approved UX flow

### Completion Criteria
✅ Multi-step onboarding form implemented and functional  
✅ Email verification working  
✅ Document upload working (E&O, W-9, licenses, broker agreement)  
✅ Profile completion step validated  
✅ Admin approval workflow working (approve/reject/more-info)  
✅ Compliance document review modal updated  
✅ Integration tests pass (100%)  
✅ E2E tests pass (100%)  
✅ Feature flags created and ready for activation  
✅ All edge cases handled (expired tokens, duplicate emails, etc.)  

---

## Phase 6: MGA Broker Affiliation Workflow

### Objective
Enable MGAs to create and affiliate brokers. Implement strict visibility boundaries so MGAs only see affiliated brokers and their business.

### Scope
**Routes to create/activate:**
- `/command-center/mga/broker-agencies` — MGA broker management page (new)
- `/command-center/mga/broker-agencies/:id` — MGA broker detail (new)

**Components:**
- `MGABrokerAgencies` — list existing brokers + search + affiliate button
- `MGABrokerDetail` — broker detail with affiliation status
- `MGABrokerInvitation` — invite new broker form
- `BrokerAffiliationRequest` — affiliation request modal

**Backend functions:**
- `createBrokerInvitationByMGA` — MGA creates new broker profile invitation
- `searchExistingBrokersByMGA` — MGA searches for existing brokers
- `requestBrokerAffiliation` — MGA requests affiliation with existing broker
- `acceptBrokerAffiliationRequest` — broker accepts affiliation
- `rejectBrokerAffiliationRequest` — broker rejects affiliation
- `activateBrokerMGARelationship` — complete affiliation (Phase 2 contract uses this)

**Scope enforcement:**
- MGA sees only brokers with active `BrokerMGARelationship`
- MGA sees only employer/case/quote/proposal records with matching `broker_mga_relationship_id`
- MGA cannot see broker's standalone direct business

### Files Likely Affected
- `pages/MGABrokerAgencies.jsx` — new page
- `components/mga/MGABrokerList.jsx` — new component
- `components/mga/MGABrokerInvitation.jsx` — new component
- `components/mga/BrokerAffiliationRequest.jsx` — new component
- `src/functions/createBrokerInvitationByMGA.js` — new backend function
- `src/functions/searchExistingBrokersByMGA.js` — new backend function
- `src/functions/requestBrokerAffiliation.js` — new backend function
- `src/functions/acceptBrokerAffiliationRequest.js` — new backend function
- `src/functions/rejectBrokerAffiliationRequest.js` — new backend function
- `src/functions/activateBrokerMGARelationship.js` — new backend function
- `App.jsx` — add `/command-center/mga/broker-agencies` route
- `lib/contracts/mgaBrokerVisibilityContract.js` — activate (Phase 3)

### Runtime Risk Level
🔴 **HIGH**

**Risk factors:**
- Visibility boundary bug could expose standalone broker business to MGA
- Affiliation acceptance/rejection could get stuck if logic incomplete
- MGA could see old records from broker that was previously affiliated but is now standalone
- Affiliate request could be lost if async function fails

**Mitigation:**
- Kill tests: MGA deliberately tries to access non-affiliated broker business (must fail)
- Strict visibility contract validation per access
- Audit logging for all affiliation state changes
- Affiliation workflow with explicit confirmation steps
- Transactional affiliation logic (all-or-nothing)

### Dependencies
**Depends on:** Phase 3 (Permission & Scope Enforcement)

**Prerequisite:** MGA visibility contracts in place; broker RLS working

### Required Feature Flags
- `MGA_BROKER_AFFILIATION_ENABLED` — enable MGA broker management (default: false)
- `MGA_BROKER_VISIBILITY_ENFORCEMENT_ENABLED` — enforce MGA-only visibility (default: false) [from Phase 3]

### Expected Test Count
- Unit tests (contracts): 30–40 (visibility rules, affiliation logic)
- Kill tests: 20–30 (access denial scenarios)
- Integration tests: 25–35 (full affiliation workflows)
- E2E tests: 10–15 (MGA broker creation + affiliation)
- **Total: 85–120 test cases**

### Rollback Method
1. Disable affiliation feature flags
2. Remove `/command-center/mga/broker-agencies` routes
3. Remove MGA broker affiliation components and backend functions
4. Disable MGA visibility contract enforcement
5. Redeploy
6. MGAs cannot affiliate brokers (existing affiliations remain but inactive)

**Rollback window:** < 1 hour

### Operator Approval Gate
**Approval required before affiliation activation:**
- [ ] All affiliation backend functions implemented and tested
- [ ] MGA broker search working (filters correctly)
- [ ] Affiliation request workflow (request → accept/reject → activate) tested
- [ ] Kill tests pass (100%) — MGA cannot access non-affiliated broker
- [ ] Visibility contract enforced on all MGA queries
- [ ] Audit logging for affiliation state changes
- [ ] Integration tests pass (100%)
- [ ] E2E tests pass (full MGA affiliation journey)
- [ ] MGA stakeholders approved workflow
- [ ] Broker approval logic for affiliation (does broker have to accept?)
- [ ] Feature flags created and default to false

### Completion Criteria
✅ `/command-center/mga/broker-agencies` route created and functional  
✅ MGA can search and view existing brokers  
✅ MGA can send broker affiliation request  
✅ Broker can accept/reject affiliation  
✅ `BrokerMGARelationship` activated on acceptance  
✅ MGA sees only affiliated brokers and their business  
✅ Kill tests pass (100%) — no unauthorized MGA access  
✅ Integration tests pass (100%)  
✅ E2E tests pass (100%)  
✅ Audit logging for all affiliation events  

---

## Phase 7: Benefits Admin Bridge

### Objective
Connect Quote Connect 360 to Benefits Admin. Brokers can move approved quote to Benefits Admin setup. Benefits Admin cases are stamped with distribution channel context and broker-scoped.

### Scope
**Routes to create/activate:**
- `/broker/benefits-admin` — broker Benefits Admin dashboard entry point
- Quote scenario "Mark Sold" → Benefits Admin handoff flow

**Backend functions:**
- `initiateQuoteToBenefitsHandoff` — create Benefits Admin case from quote
- `stampBenefitsAdminCaseWithContext` — apply distribution-channel stamps
- `getBenefitsCasesForBroker` — retrieve broker-scoped Benefits Admin cases
- `linkBenefitsAdminRenewal` — connect renewal to Benefits Admin
- `createBenefitsAdminTask` — create task, scoped to distribution channel
- `createBenefitsAdminDocument` — upload document, scoped to distribution channel

**Scope stamping:**
- Benefits Admin case records stamped with `distribution_channel_context_id`, `broker_agency_id`, `owner_org_type`, `visibility_scope`, etc.
- Renewal, task, document, notification records similarly stamped
- Broker sees only own Benefits Admin cases
- MGA sees only affiliated broker's Benefits Admin cases

### Files Likely Affected
- `pages/BrokerBenefitsAdmin.jsx` — new page (entry point)
- `components/broker/BrokerBenefitsAdminDashboard.jsx` — new component
- `components/quotes/QuoteMarkSoldModal.jsx` — update (add "Mark Sold & Move to Benefits Admin" option)
- `src/functions/initiateQuoteToBenefitsHandoff.js` — new backend function
- `src/functions/stampBenefitsAdminCaseWithContext.js` — new backend function
- `src/functions/getBenefitsCasesForBroker.js` — new backend function
- Existing Benefits Admin entities (locate schema files) — update with distribution-channel stamps
- `App.jsx` — add `/broker/benefits-admin` route

### Runtime Risk Level
🟡 **MEDIUM–HIGH**

**Risk factors:**
- Quote-to-Benefits handoff could fail mid-process (quote marked sold but Benefits case not created)
- Benefits Admin case visibility could leak to wrong users if stamping incorrect
- Existing Benefits Admin workflows could break if not compatible with new stamping
- Renewal bridge could drop or duplicate renewals

**Mitigation:**
- Transactional handoff: all-or-nothing quote → Benefits Admin move
- Comprehensive stamping validation before case is visible
- Backward compatibility: existing Benefits Admin cases get default stamps + migration
- Renewal bridge with deduplication logic
- Extensive integration tests for quote-to-BA workflow

### Dependencies
**Depends on:** Phase 4 (Broker Workspace) + Phase 1 (Data Model)

**Prerequisite:** Broker workspace functional; distribution-channel stamping in place; Benefits Admin case schema updated

### Required Feature Flags
- `BROKER_BENEFITS_ADMIN_BRIDGE_ENABLED` — enable quote-to-BA handoff (default: false)
- `BENEFITS_ADMIN_CHANNEL_CONTEXT_ENABLED` — apply channel stamps to BA cases (default: false)

### Expected Test Count
- Unit tests (stamping logic): 20–30
- Integration tests (quote-to-BA handoff): 25–35
- Integration tests (BA visibility): 20–30
- Integration tests (renewal bridge): 15–20
- E2E tests (full quote → Benefits Admin journey): 10–15
- **Total: 90–130 test cases**

### Rollback Method
1. Disable Benefits Admin feature flags
2. Remove `/broker/benefits-admin` routes and components
3. Remove "Mark Sold & Move to BA" button from quote UI
4. Remove BA handoff backend functions
5. Disable Benefits Admin stamping
6. Redeploy
7. Existing Benefits Admin workflows continue (with old schema)

**Rollback window:** < 1 hour

### Operator Approval Gate
**Approval required before BA bridge activation:**
- [ ] Benefits Admin case schema updated with distribution-channel stamps
- [ ] Quote-to-BA handoff function implemented and tested (transactional)
- [ ] BA case visibility contract enforced (broker-scoped)
- [ ] Renewal bridge tested (no duplicates, all renewals created)
- [ ] Integration tests pass (100%)
- [ ] Backward compatibility verified (existing BA cases work with new stamps)
- [ ] E2E tests pass (full quote → BA journey)
- [ ] Benefits Admin stakeholders reviewed integration
- [ ] Feature flags created and default to false

### Completion Criteria
✅ Benefits Admin entities stamped with distribution-channel context  
✅ Quote-to-Benefits Admin handoff working (transactional)  
✅ Benefits Admin case created with correct channel context  
✅ Broker sees only own Benefits Admin cases  
✅ MGA sees only affiliated broker's BA cases  
✅ Renewal bridge working (renewals created, no duplicates)  
✅ Tasks, documents, notifications scoped to distribution channel  
✅ Integration tests pass (100%)  
✅ E2E tests pass (100%)  
✅ Feature flags created and ready for activation  

---

## Phase 8: Testing / Regression / Activation

### Objective
Comprehensive testing, regression validation, and phased feature flag activation. Ensure all phases work together without breaking existing workflows.

### Scope
**Test categories:**
1. **Schema tests** — all entities have required fields, correct types
2. **Scope tests** — records correctly stamped with channel context
3. **Permission kill tests** — unauthorized access is blocked
4. **Frontend route tests** — all broker/MGA routes protected and functional
5. **Broker onboarding smoke tests** — signup → approval → portal access
6. **Hybrid broker visibility tests** — Direct/MGA books correctly separated
7. **MGA boundary tests** — MGAs cannot see non-affiliated brokers
8. **Benefits Admin bridge tests** — quote → BA handoff working
9. **Regression tests** — existing platform workflows unaffected

**Feature flag activation plan:**
- Week 1: Enable data model flags (warn-mode)
- Week 2: Enable backend contract flags (warn-mode)
- Week 3: Enable RLS/permission flags (strict-mode, if kill tests pass)
- Week 4: Enable broker workspace flags (staged rollout 10% → 50% → 100%)
- Week 5: Enable onboarding flags (staged rollout)
- Week 6: Enable MGA affiliation flags (staged rollout)
- Week 7: Enable Benefits Admin bridge flags (staged rollout)
- Week 8: Full production validation + go/no-go

### Files Likely Affected
- `tests/schema/*.test.js` — new schema validation tests
- `tests/broker/*.test.js` — new broker tests
- `tests/permission/*.test.js` — new RLS/kill tests
- `tests/e2e/*.spec.js` — new E2E tests (Playwright)
- `docs/FEATURE_FLAG_ACTIVATION_SCHEDULE.md` — create flag activation runbook

### Runtime Risk Level
🟢 **LOW–MEDIUM**

**Risk factors:**
- Testing phase cannot reveal all bugs (some emerge only in production under load)
- Regression tests might miss interaction between phases
- Feature flag rollout could miss a subset of users

**Mitigation:**
- Comprehensive test coverage (all phases)
- Staged rollout: 10% → 50% → 100%
- Monitoring dashboard (errors, latency, audit logs)
- Rollback plan for each feature flag
- Support team on alert during rollout

### Dependencies
**Depends on:** All prior phases (1–7)

**Prerequisite:** All functionality implemented and phase-tested

### Required Feature Flags
All flags from Phases 1–7 + new combined activation flags:
- `FIRST_CLASS_BROKER_AGENCY_MODEL_ENABLED` — master kill-switch (default: false)
- `FIRST_CLASS_BROKER_FULL_ROLLOUT_ENABLED` — enable all features at once (default: false, for trusted environments)

### Expected Test Count
- **Total across all phases:** 600–800 test cases
- **Phase 8 adds:** 100–150 regression + E2E tests
- **Grand Total:** 700–950 test cases

### Rollback Method
1. Disable all First-Class Broker feature flags
2. Rollback each phase's database changes (if applicable)
3. Redeploy without Phases 1–7 code
4. Monitor error logs; scale up support
5. Generate post-incident report

**Rollback window:** < 2 hours (if all rollback scripts tested)

### Operator Approval Gate
**Approval required before each flag activation:**
- [ ] Phase-specific integration tests pass (100%)
- [ ] Kill tests pass (100%)
- [ ] Regression tests pass (100%)
- [ ] E2E tests pass (100%)
- [ ] Monitoring dashboard configured
- [ ] Support team trained and on alert
- [ ] Rollback plan documented and tested
- [ ] Stakeholder sign-off (platform, broker, MGA leadership)
- [ ] Flag activation runbook ready
- [ ] Staged rollout percentages approved

### Completion Criteria
✅ All schema tests pass (100%)  
✅ All scope tests pass (100%)  
✅ All permission kill tests pass (100%)  
✅ All frontend route tests pass (100%)  
✅ All broker onboarding smoke tests pass (100%)  
✅ All hybrid broker visibility tests pass (100%)  
✅ All MGA boundary tests pass (100%)  
✅ All Benefits Admin bridge tests pass (100%)  
✅ All regression tests pass (100%)  
✅ **All 700–950 tests pass (100%)**  
✅ Feature flags created and activation schedule ready  
✅ Staging environment fully validated  
✅ Production rollout schedule approved  
✅ Monitoring and alerting in place  
✅ Support team trained  
✅ Go/no-go decision documented  

---

## Recommended Starting Point: Phase 1 — Data Model Completion

### Rationale

**Phase 1 is mandatory starting point.** All downstream phases depend on it:

- ❌ **Cannot enforce RLS (Phase 3)** without knowing which org owns each record
- ❌ **Cannot build broker workspace (Phase 4)** without filtering records by ownership
- ❌ **Cannot scope Benefits Admin (Phase 7)** without knowing visibility rules
- ❌ **Cannot keep MGA books separate (Phase 6)** without channel context
- ❌ **Cannot verify hybrid broker separation (Phase 4)** without stamping

**Phase 1 is lowest-risk** because:
- ✅ No new routes, RLS, or permissions
- ✅ Backward-compatible: stamping new fields does not break old queries
- ✅ Can be done in off-hours with rollback plan
- ✅ Data validation clear and testable
- ✅ No feature flags needed yet

### Phase 1 Work Estimate
- Schema updates: 2 days
- Data migration design: 1 day
- Migration execution (staging): 1 day
- Validation + testing: 2 days
- Production migration: 1 day (off-hours)
- **Total: ~7 days (1 week)**

### Next Steps After Phase 1
Once Phase 1 complete and validated:
1. Proceed to **Phase 2** (Backend Contract Layer)
2. Allow 1 week per phase for implementation + testing
3. Allocate ~4 weeks (Phases 1–4) for core broker workspace
4. Allocate ~2 weeks (Phases 5–6) for onboarding + MGA features
5. Allocate ~1 week (Phase 7) for Benefits Admin bridge
6. Allocate ~2 weeks (Phase 8) for comprehensive testing + rollout

**Total project timeline: ~10 weeks** (if executed sequentially)

---

## Summary Table

| Phase | Objective | Risk | Effort (days) | Tests | Rollback Window | Blocker/Gate |
|---|---|---|---|---|---|---|
| 1 | Data Model Stamping | 🔴 HIGH | 7 | 15–25 | < 2 hrs | Data migration approval |
| 2 | Backend Contracts | 🟡 MEDIUM | 5 | 50–70 | < 1 hr | Contract review + tests |
| 3 | RLS / Scoping | 🔴 HIGH | 6 | 100–140 | < 1.5 hrs | Kill tests pass |
| 4 | Broker Workspace | 🟡 MEDIUM | 5 | 85–110 | < 30 min | Feature flag approval |
| 5 | Onboarding | 🟡 MEDIUM | 4 | 60–85 | < 45 min | Feature flag approval |
| 6 | MGA Affiliation | 🔴 HIGH | 4 | 85–120 | < 1 hr | Visibility contract + kill tests |
| 7 | BA Bridge | 🟡 MED–HIGH | 4 | 90–130 | < 1 hr | BA stakeholder sign-off |
| 8 | Testing / Activation | 🟢 LOW–MED | 8 | 700–950 | < 2 hrs | Full test pass + stakeholder sign-off |
| **TOTAL** | **Full Model** | — | **43 days (~10 weeks)** | **700–950** | — | — |

---

## Sign-Off

**Document Status:** PHASED EXECUTION PLAN READY FOR AUTHORIZATION

**Next Action:** Prioritize Phase 1 resources; prepare data migration strategy; schedule operator approval gate.

**Plan Review Date:** Weekly (every Monday)

**Update Frequency:** After each phase completion