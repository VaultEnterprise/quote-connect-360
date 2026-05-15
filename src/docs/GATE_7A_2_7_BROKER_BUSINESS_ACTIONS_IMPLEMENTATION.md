# Gate 7A-2.7 Broker Business Actions Implementation — Phase 7A-2.7

## Scope & Implementation

### Contract Methods Implemented

| Method | Feature Flag | Parent Dependency | Status | Behavior |
|--------|--------------|-------------------|--------|----------|
| createBrokerEmployer | BROKER_EMPLOYER_CREATE_ENABLED | BROKER_WORKSPACE_ENABLED | FAIL-CLOSED | Creates direct_book employer; no MGA; tenant/broker scope stamped |
| createBrokerCase | BROKER_CASE_CREATE_ENABLED | BROKER_WORKSPACE_ENABLED | FAIL-CLOSED | Creates case for direct_book employer; preserves channel lineage |
| uploadBrokerCensus | BROKER_CENSUS_UPLOAD_ENABLED | BROKER_WORKSPACE_ENABLED | FAIL-CLOSED | Metadata-only upload; no raw rows, SSN, health data; private/signed file refs |
| manageBrokerTask | BROKER_TASKS_ENABLED | BROKER_WORKSPACE_ENABLED | FAIL-CLOSED | Create/update broker-scoped tasks; no cross-broker visibility |
| uploadBrokerDocument | BROKER_DOCUMENTS_ENABLED | BROKER_WORKSPACE_ENABLED | FAIL-CLOSED | Private/signed document refs only; no public URLs |
| updateBrokerAgencyProfile | BROKER_SETTINGS_ENABLED | BROKER_WORKSPACE_ENABLED | FAIL-CLOSED | Whitelisted field updates only; prevents escalation/override |

### Feature Flag Enforcement

**Parent Dependency:** `BROKER_WORKSPACE_ENABLED`
- Must be `true` for ANY broker action to execute
- Hardcoded `false` in Phase 7A-2.7
- Blocks all workspace features by default

**Action-Specific Flags:**
- BROKER_EMPLOYER_CREATE_ENABLED = false
- BROKER_CASE_CREATE_ENABLED = false
- BROKER_CENSUS_UPLOAD_ENABLED = false
- BROKER_TASKS_ENABLED = false
- BROKER_DOCUMENTS_ENABLED = false
- BROKER_SETTINGS_ENABLED = false

All default `false` and remain `false` during Phase 7A-2.7.

### Scope Enforcement

**Validation Steps (all methods):**
1. Feature flag check → return 403 FEATURE_DISABLED if flag false
2. Broker scope validation → return 404 (masked) if scope invalid
3. Permission check → return 403 if user lacks broker agency admin/owner role
4. Entity ownership verification → return 403 if entity not in scope

**Scope Failure Behavior:**
- Cross-tenant access attempts → masked 404
- Scope validation failures → masked 404
- Permission denied → explicit 403

### Permission Enforcement

**Required Roles:**
- broker_agency_admin
- broker_agency_owner
- platform_super_admin
- admin

**Enforced Checks:**
- User authentication required
- Role-based access control
- Agency membership verification
- Action-specific permission checks

### Direct Book Channel Stamping

**createBrokerEmployer:**
- Stamps `distribution_channel: 'direct_book'`
- Sets `master_general_agent_id: null`
- Classifies as standalone broker employer
- Prevents MGA visibility

**createBrokerCase:**
- Stamps `distribution_channel: 'direct_book'` from employer
- Sets `master_general_agent_id: null`
- Preserves channel lineage from employer
- Validates employer is direct_book before case creation
- Blocks case creation if employer not in scope

### DistributionChannelContext Handling

**Phase 7A-2.7 Behavior:**
- No DistributionChannelContext creation in this phase
- Direct book actions do not create multi-channel contexts
- MGA visibility prevented unless active BrokerMGARelationship exists
- Future gate authorization required before context resolution

### Employer Creation Behavior

**Method:** `createBrokerEmployer`
- Creates employer with broker agency scope
- Stamps tenant_id (default for Phase 7A-2.7)
- Stamps broker_agency_id
- Stamps distribution_channel: 'direct_book'
- master_general_agent_id: null (no MGA)
- Returns safe payload: id, name, address, city, state, zip, employee_count, status, distribution_channel, created_at
- **EIN masked as '****'** in returned payload
- No sensitive data exposure

**Audit Event:** BROKER_EMPLOYER_CREATED
- Logged with employer ID, name, channel, outcome

### Case Creation Behavior

**Method:** `createBrokerCase`
- Requires direct_book employer in scope
- Verifies employer ownership before case creation
- Creates case with distribution_channel: 'direct_book'
- master_general_agent_id: null
- Preserves employer name and employee count
- Returns safe payload: id, case_type, employer_name, effective_date, stage, priority, status, distribution_channel, created_at

**Audit Event:** BROKER_CASE_CREATED
- Logged with case ID, employer ID, channel, outcome

### Census Upload Metadata-Only / Safe Behavior

**Method:** `uploadBrokerCensus`
- Creates CensusVersion record (metadata only)
- **NO raw census rows** in database or payload
- **NO SSN, DOB, dependent health data** in CensusVersion
- **NO employee records** stored
- **File reference private/signed only** (no public URLs)
- Tracks upload metadata: version, file_name, status, total_employees, total_dependents, eligible_employees, uploaded_at
- Returns safe metadata payload:
  - id, version_number, file_name, status, total_employees, total_dependents, eligible_employees, validation_status, uploaded_at
  - **NO file_url**
  - **NO raw member data**
  - **NO SSN or health information**

**Audit Event:** BROKER_CENSUS_UPLOAD_ATTEMPTED
- Logged with census version ID, case ID, file_name, outcome

### Task Management Behavior

**Method:** `manageBrokerTask`
- Create new task: stores in CaseTask with broker scope
- Update existing task: modifies status, priority, due_date, description
- Restricts to authorized fields only
- Returns safe payload: id, title, description, status, priority, due_date, created_at
- No cross-broker task visibility

**Audit Events:**
- BROKER_TASK_CREATED (on new task)
- BROKER_TASK_UPDATED (on update)

### Document Upload Private/Signed Reference Behavior

**Method:** `uploadBrokerDocument`
- Creates Document record (metadata only)
- **NO public file_url** in payload
- **File reference private/signed only** via file_uri
- Returns safe metadata payload: id, name, document_type, file_name, file_size, uploaded_at, notes
- **NO file_url returned** (clients request signed URL separately)
- file_access property: 'requires_private_signed_url'

**Audit Event:** BROKER_DOCUMENT_UPLOADED
- Logged with document ID, case ID, document_type, outcome

### Broker Agency Profile Update Restrictions

**Method:** `updateBrokerAgencyProfile`
- Whitelisted fields only: name, phone, email, address, city, state, zip
- **Forbidden fields:** master_general_agent_id, portal_access_enabled, compliance_status
- Attempts to update forbidden fields return 403 UNAUTHORIZED_FIELD_UPDATE
- No self-approval capability
- No compliance override
- No escalation permitted
- Returns safe payload: id, name, phone, email, address, city, state, zip, updated_at

**Audit Event:** BROKER_AGENCY_PROFILE_UPDATED
- Logged with broker agency ID, updated_fields, outcome

### Audit Events Implemented

| Event | Trigger | Context |
|-------|---------|---------|
| BROKER_EMPLOYER_CREATED | Employer creation success | employer_id, name, channel |
| BROKER_CASE_CREATED | Case creation success | case_id, employer_id, channel |
| BROKER_CENSUS_UPLOAD_ATTEMPTED | Census upload attempt | census_version_id, case_id, file_name |
| BROKER_TASK_CREATED | New task creation | task_id, case_id |
| BROKER_TASK_UPDATED | Task update | task_id, case_id |
| BROKER_DOCUMENT_UPLOADED | Document upload success | document_id, case_id, document_type |
| BROKER_AGENCY_PROFILE_UPDATED | Profile update | broker_agency_id, updated_fields |
| BROKER_BUSINESS_ACTION_DENIED_FEATURE_DISABLED | Action blocked by flag | action_name, disabled_flag |
| BROKER_BUSINESS_ACTION_DENIED_SCOPE | Scope validation failed | action_name |
| BROKER_BUSINESS_ACTION_DENIED_PERMISSION | Permission check failed | action_name |
| BROKER_BUSINESS_ACTION_FAILED | Unexpected error | action_name, error |

All audit events logged to ActivityLog with case context, actor info, and outcome.

### Quote/Proposal Creation — EXPLICITLY BLOCKED

**NOT IMPLEMENTED IN PHASE 7A-2.7:**
- Quote creation workflow
- Quote editing workflow
- Quote submission workflow
- Proposal creation workflow
- Proposal editing workflow
- QuoteWorkspaceWrapper exposure

**Status:** All quote/proposal actions remain deferred to Gate 7A-4 (Quote Connect 360 Channel-Aware Wrapper).

**Feature Flags:**
- BROKER_QUOTE_CREATION_ENABLED = false (deferred)
- BROKER_PROPOSAL_CREATION_ENABLED = false (deferred)

### Security Guarantees

✅ **No raw frontend entity reads**
- All data flows through contract methods
- Service layer acts as authoritative source
- No direct base44.entities.* exposure

✅ **No hidden record metadata leaks**
- Error responses return masked 404s for scope failures
- Permission denied returns explicit 403
- No entity details in error messages

✅ **No public document URLs**
- All documents stored with private/signed references
- file_url never returned in safe payloads
- Clients must request signed URL separately

✅ **No raw census rows**
- CensusVersion stores metadata only
- No CensusMember rows created via this contract
- No raw member data exposed

✅ **No SSN/health/payroll/private identifier exposure**
- Validation forbids sensitive fields
- EIN masked in returned payloads
- No dependent health data stored
- No payroll information included

✅ **Applicant/onboarding data isolated**
- Workspace actions work on BenefitCase only
- BrokerAgencyOnboardingCase remains separate
- No bleed-through of onboarding context

✅ **Direct Book actions cannot create MGA visibility**
- master_general_agent_id always null
- distribution_channel always 'direct_book'
- No context resolution to MGA scope

✅ **Platform support actions require explicit audit**
- All actions logged to ActivityLog
- Actor info (email, role) captured
- Outcome tracked
- Correlation IDs supported

✅ **MGA cannot create/modify standalone records**
- Only broker-scoped users can call these methods
- MGA users receive 403 on permission check

## Compliance Status

**Phase 7A-2.7 Complete:**
- ✅ All 6 contract methods implemented
- ✅ Feature flags fail-closed
- ✅ Parent/child flag dependencies enforced
- ✅ Scope validation on all operations
- ✅ Permission checks enforced
- ✅ Direct Book channel stamping
- ✅ No MGA visibility leakage
- ✅ Safe payloads only
- ✅ Comprehensive audit logging
- ✅ No quote/proposal workflows
- ✅ No Benefits Admin exposure
- ✅ No QuoteWorkspaceWrapper

**Hard Guardrails Maintained:**
- No Gate 7A-3 implementation
- No Gate 7A-4 exposure (QuoteWorkspaceWrapper)
- No Gate 7A-5/7A-6 exposure (Benefits Admin)
- No feature flag activation
- No workspace runtime activation
- No production backfill
- No destructive migration
- Gate 7A-0, 7A-1, 6K, 6L-A regressions preserved
- Deferred gates 6I-B, 6J-B, 6J-C, 6L-B untouched