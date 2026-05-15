# Gate 7A-1 Implementation Work Order
## Standalone Broker Signup and Approval Foundation

**Date:** 2026-05-13  
**Phase:** 7A-1 — Standalone Broker Signup & Approval  
**Status:** PLANNING AUTHORIZED (No Implementation Authorized Yet)  
**Prerequisite:** Gate 7A-0 Closure (APPROVED)  
**Parent Gate:** 7A (First-Class Broker Agency Model & Benefits Admin Bridge Foundation)

---

## 1. Purpose

Gate 7A-1 enables broker agencies to independently sign up, complete onboarding workflows, and be approved by platform operators. This phase builds directly on Gate 7A-0's data model, introducing the self-service broker signup pathway with compliance validation, NPN/license verification, and staged approval workflows.

**Primary Objectives:**
- Enable standalone broker self-service signup (no MGA required)
- Implement broker onboarding case workflow
- Add NPN/license validation
- Implement operator approval/reject/more-info workflow
- Add compliance document tracking
- Implement duplicate broker detection
- Provide portal access enablement
- Maintain feature-flag gating (all new features behind flags)
- Enforce scope/permission/audit on all new operations

---

## 2. Exact Files to Create

### 2.1 Broker Signup Entities (NEW)
```
src/entities/BrokerSignupApplication.json
src/entities/BrokerOnboardingCase.json
src/entities/BrokerInvitation.json
src/entities/BrokerComplianceDocument.json
src/entities/BrokerApprovalWorkflow.json
src/entities/BrokerPortalAccess.json
```

### 2.2 Broker Signup Routes & Pages (NEW)
```
pages/BrokerSignup.jsx
pages/BrokerOnboarding.jsx
pages/BrokerApprovalQueue.jsx
components/broker/BrokerSignupForm.jsx
components/broker/BrokerOnboardingWizard.jsx
components/broker/BrokerCompliancePanel.jsx
components/broker/BrokerApprovalModal.jsx
components/broker/NPNLicenseValidator.jsx
components/broker/DuplicateBrokerDetector.jsx
```

### 2.3 Broker Signup Contracts (NEW)
```
src/lib/contracts/brokerSignupContract.js
src/lib/contracts/brokerOnboardingContract.js
src/lib/contracts/brokerApprovalContract.js
src/lib/contracts/brokerComplianceContract.js
src/lib/contracts/npnLicenseContract.js
```

### 2.4 Broker Signup Backend Functions (NEW)
```
src/functions/brokerSignupSubmit.js
src/functions/brokerOnboardingStartCase.js
src/functions/brokerComplianceDocumentUpload.js
src/functions/brokerNPNLicenseValidate.js
src/functions/brokerApprovalSubmit.js
src/functions/brokerApprovalReject.js
src/functions/brokerApprovalRequestMoreInfo.js
src/functions/brokerDuplicateDetection.js
src/functions/brokerPortalAccessEnable.js
```

### 2.5 Broker Signup Tests (NEW)
```
src/tests/gate7a1/gate7a1-broker-signup-flow.test.js
src/tests/gate7a1/gate7a1-onboarding-workflow.test.js
src/tests/gate7a1/gate7a1-approval-workflow.test.js
src/tests/gate7a1/gate7a1-duplicate-detection.test.js
src/tests/gate7a1/gate7a1-npn-license-validation.test.js
src/tests/gate7a1/gate7a1-compliance-enforcement.test.js
src/tests/gate7a1/gate7a1-portal-access-control.test.js
src/tests/gate7a1/gate7a1-scope-permission-audit.test.js
src/tests/gate7a1/gate7a1-regression-guardrails.test.js
```

### 2.6 Documentation (NEW)
```
docs/GATE_7A_1_ENTITY_INVENTORY.md
docs/GATE_7A_1_PHASE_CHECKPOINTS.md
docs/GATE_7A_1_API_SPECIFICATION.md
docs/GATE_7A_1_WORKFLOW_DIAGRAMS.md
docs/GATE_7A_1_SECURITY_SPECIFICATION.md
```

---

## 3. Exact Files to Modify

### 3.1 Router (App.jsx)
```
src/App.jsx
- Add /broker-signup route (ONLY if BROKER_SIGNUP_ENABLED flag true)
- Add /broker-onboarding route (feature-flagged)
- Add /broker-approval-queue route (admin only, feature-flagged)
```

### 3.2 Existing Entities (Add Fields)
```
src/entities/BrokerAgencyProfile.json
- Add onboarding_case_id (nullable, FK to BrokerOnboardingCase)
- Add signup_application_id (nullable, FK to BrokerSignupApplication)
- Add approval_status (enum: pending, approved, rejected, more_info, compliance_hold)
- Add approval_workflow_id (nullable, FK to BrokerApprovalWorkflow)
```

### 3.3 Registry
```
docs/QUOTE_CONNECT_360_GATE_REGISTRY.json
- Update Gate 7A-1 entry with deliverables and status
```

---

## 4. Broker Signup Route Plan

### Endpoint: /broker-signup
**Feature Flag:** BROKER_SIGNUP_ENABLED

**Access:** Public (unauthenticated)

**Component:** BrokerSignup.jsx

**Workflow:**
1. User lands on /broker-signup
2. Displays BrokerSignupForm (company details, contact info, license info)
3. User submits signup
4. Backend: brokerSignupSubmit() validates and creates BrokerSignupApplication record
5. Redirect to /broker-onboarding with token

**Security:**
- Rate limiting on signup submission
- CAPTCHA or token-based abuse prevention
- Scope: Public; no user auth required yet
- Audit trail for all signup attempts

---

## 5. Onboarding Token Plan

### Token Generation
**Method:** Signed JWT or opaque session token

**Contains:**
- signup_application_id
- broker_email
- timestamp
- one-time use flag

**Lifetime:** 7 days (configurable)

**Usage:** /broker-onboarding?token=<token>

**Validation:**
- Token signature verified
- Not already used
- Not expired
- Email matches token

**Security:**
- Tokens invalidated after use
- HTTPS only
- Secure cookie storage

---

## 6. BrokerOnboardingCase Plan

### Entity: BrokerOnboardingCase
**Purpose:** Track broker onboarding workflow from signup through approval

**Fields:**
- broker_agency_id (FK to BrokerAgencyProfile; nullable during signup)
- status (enum: signup_submitted, profile_complete, documents_pending, compliance_review, awaiting_approval, approved, rejected, more_info_requested)
- signup_application_id (FK to BrokerSignupApplication)
- broker_invitation_id (nullable, FK to BrokerInvitation)
- npn_validated (boolean)
- licenses_validated (array of validated states)
- compliance_documents_submitted (boolean)
- compliance_hold (boolean, enum: none, pending_tax_id_verification, pending_license_verification, pending_bank_account_setup, other)
- approval_workflow_id (FK to BrokerApprovalWorkflow)
- assigned_approver (email of operator reviewing)
- notes (text)
- created_at, updated_at (timestamps)

**Timestamps:**
- submitted_at
- onboarding_started_at
- documents_submitted_at
- awaiting_approval_at
- approved_at / rejected_at

**Scope/Permission Fields:**
- 18 Channel-Lineage Stamp fields (for audit/compliance)

---

## 7. BrokerInvitation Plan

### Entity: BrokerInvitation
**Purpose:** Invitation records for broker users to complete onboarding

**Fields:**
- onboarding_case_id (FK)
- invited_email (email address)
- invited_name (name)
- invited_role (enum: owner, manager, admin)
- status (enum: invited, accepted, pending_verification, active)
- invitation_token (signed JWT or opaque token)
- invitation_sent_at (timestamp)
- invitation_accepted_at (nullable)
- expires_at (7-day expiration)

**Constraint:** One invitation per onboarding case; can create new invitation if expired

---

## 8. BrokerComplianceDocument Plan

### Entity: BrokerComplianceDocument
**Purpose:** Track uploaded compliance documents during onboarding

**Fields:**
- onboarding_case_id (FK)
- document_type (enum: tax_id_verification, license_copy, business_address_proof, bank_account_verification, insurance_requirements, other)
- file_url (URL to uploaded document)
- file_name (original filename)
- upload_status (enum: pending_review, approved, rejected, requires_reupload)
- review_notes (text)
- reviewed_by (email)
- reviewed_at (timestamp)
- expires_at (nullable, for documents with expiration dates)

**Validation:**
- File type restricted (PDF, image only)
- File size limit (10 MB)
- Virus scan on upload

---

## 9. Duplicate Broker Detection Plan

### Detection Methods
1. **Email Domain Match:** Existing BrokerAgencyProfile with same primary_contact_email domain
2. **Legal Name Match:** Fuzzy match on legal_name (Levenshtein distance < 2)
3. **NPN Match:** Same NPN across multiple brokers (invalid state)
4. **Tax ID Match:** Same tax_id/EIN (if provided; invalid state)

### Workflow
1. During signup, run duplicate detection
2. If matches found:
   - Log potential duplicate in system
   - Alert operator
   - Allow signup to proceed (operator decides merge/allow)
   - Mark BrokerSignupApplication with duplicate_flag
3. During approval, require operator to resolve duplicates

### Scope
- Query within same tenant only
- Do not block signup (report-only)
- Operator must approve even with duplicates

---

## 10. NPN/License Validation Plan

### NPN (National Producer Number) Validation
**Endpoint:** NAIC National Producer Registry (if available) or placeholder lookup

**Fields:**
- npn (required)
- state (required, licensed state)

**Validation Logic:**
1. Format check: NPN is 8 digits, state is valid
2. Lookup in registry (if available)
3. Verify status: Active/Inactive
4. Verify license line(s): Health, Property/Casualty, Life
5. Store validation result in BrokerOnboardingCase.npn_validated

**Fallback:** If external registry unavailable, accept NPN and mark for manual verification

### License Validation
**Fields:**
- license_states (array)
- insurance_lines (array of lines: health, dental, vision, life, disability, P&C, etc.)

**Validation:**
1. Check each state in license_states
2. Verify license is active (if registry available)
3. Cross-check insurance lines
4. Store: BrokerOnboardingCase.licenses_validated

**Scope:**
- Record validation results, not enforcement (allow workflow to continue)
- Operator reviews during approval

---

## 11. Broker Approval/Reject/More-Info Workflow Plan

### Entity: BrokerApprovalWorkflow
**Purpose:** Track approval workflow stages

**Fields:**
- onboarding_case_id (FK)
- status (enum: pending_initial_review, under_review, more_info_requested, awaiting_compliance_hold_resolution, ready_for_approval, approved, rejected)
- initial_review_at (timestamp when moved to under_review)
- more_info_requested_at (timestamp)
- more_info_response_due_at (30-day deadline)
- compliance_hold_reason (text)
- compliance_hold_expires_at (variable deadline)
- approval_decision_at (final approval/rejection timestamp)

### Approval Decision Workflow

**Step 1: Initial Review**
- Operator reviews BrokerOnboardingCase
- Checks NPN validation, licenses, documents, compliance
- Decides: approve, reject, or request_more_info

**Step 2: More Info Requested**
- Operator sends request via BrokerApprovalWorkflow
- More info due in 30 days
- Applicant resubmits documents
- Operator reviews and decides again

**Step 3: Compliance Hold**
- If missing bank account verification, tax ID verification, etc.
- Mark compliance_hold = true
- Provide hold_reason
- Set resolution deadline
- Block approval until resolved
- Applicant can upload documents to resolve
- Operator unblocks when resolved

**Step 4: Approved**
- Operator marks approved
- Triggers: BrokerAgencyProfile.approval_status = "approved"
- Creates BrokerPortalAccess record
- Sends approval email to broker
- Enables portal access

**Step 5: Rejected**
- Operator marks rejected with reason
- BrokerAgencyProfile.approval_status = "rejected"
- No portal access
- Applicant can re-apply after 90 days

---

## 12. Compliance Hold Behavior Plan

### Hold Reasons
1. **Pending Tax ID Verification:** Verify EIN/SSN before approval
2. **Pending License Verification:** Wait for official state verification
3. **Pending Bank Account Setup:** ACH setup not complete
4. **Pending Insurance Requirements:** E&O insurance not verified
5. **Pending Background Check:** (if applicable)
6. **Manual Review Required:** Operator-specified hold

### Resolution Path
1. Applicant uploads required document(s)
2. System updates BrokerComplianceDocument records
3. Operator reviews
4. Operator removes compliance_hold flag
5. Approval workflow continues

### Timeout
- Default hold timeout: 60 days
- If not resolved, BrokerOnboardingCase moves to "stalled" status
- Operator notified
- Can extend deadline or reject application

---

## 13. Portal Access Enablement Rules

### When Portal Access Enabled
1. Operator marks BrokerOnboardingCase as approved
2. Backend: brokerPortalAccessEnable() creates BrokerPortalAccess record
3. Set access_enabled = true
4. Set access_enabled_at = now
5. Generate portal login link
6. Send email to broker with instructions

### Portal Access Scope
- Broker can see own cases, quotes, documents
- Broker cannot see MGA records (unless relationship exists)
- Broker cannot see other broker records
- Scope enforced via brokerAgencyProfile.broker_agency_id match

### Entity: BrokerPortalAccess
**Fields:**
- broker_agency_id (FK)
- access_enabled (boolean)
- access_enabled_at (timestamp)
- portal_url (direct link to portal)
- password_reset_token (initially unused)
- last_login_at (nullable)
- status (enum: invited, active, suspended, inactive)

---

## 14. Feature Flags

### New Feature Flags for Gate 7A-1

| Flag | Default | Purpose | Scope |
|---|---|---|---|
| BROKER_SIGNUP_ENABLED | false | Enable /broker-signup route | Broker signup feature |
| BROKER_ONBOARDING_ENABLED | false | Enable onboarding workflow | Onboarding case workflow |
| BROKER_APPROVAL_QUEUE_ENABLED | false | Enable approval queue UI | Operator approval interface |
| BROKER_PORTAL_ACCESS_ENABLED | false | Enable broker portal access | Portal features |
| BROKER_NPN_LICENSE_VALIDATION_ENABLED | false | Enable NPN/license validation | Validation checks |
| BROKER_DUPLICATE_DETECTION_ENABLED | false | Enable duplicate detection alerts | Duplicate alerts (report-only) |
| BROKER_COMPLIANCE_DOCUMENT_ENFORCEMENT | false | Enforce compliance document uploads | Document requirements |

### Feature Flag Gating Rules
- All routes behind flags (no route exposure without flag)
- All UI components hidden when flags false
- Backend functions return 403 if flag false
- Fail-closed behavior for all flags

---

## 15. Scope/Permission/Audit Enforcement Plan

### Scope Enforcement
1. All BrokerOnboardingCase records scoped to broker_agency_id
2. Operators access approval_queue scoped to no specific broker (see all)
3. Brokers cannot see other brokers' onboarding cases
4. Cross-org access denied with masked 404

### Permission Enforcement
1. **broker_agency.onboarding_start** — Broker starts onboarding
2. **broker_agency.compliance_document_upload** — Broker uploads documents
3. **platform_broker.approval_queue_view** — Operator views approval queue
4. **platform_broker.approval_decide** — Operator approves/rejects/more-info
5. **broker_agency.portal_access_enable** — System enables portal access

All permissions default false (inactive during Phase 7A-1).

### Audit Enforcement
1. Every signup attempt audited
2. Every approval decision audited (before_json, after_json)
3. Every compliance document upload audited
4. audit_trace_id propagates through workflow
5. Audit records immutable (append-only)

---

## 16. Test Plan

### Test Suites (9 PLANNED)

1. **Broker Signup Flow (15 tests)**
   - Signup form validation
   - Duplicate detection
   - Email validation
   - Token generation
   - Rate limiting

2. **Onboarding Workflow (18 tests)**
   - Case creation
   - Stage transitions
   - Document uploads
   - Validation rules
   - Expiration handling

3. **Approval Workflow (16 tests)**
   - Approval decision logic
   - More-info flow
   - Compliance holds
   - Rejection handling
   - Timeouts

4. **Duplicate Detection (9 tests)**
   - Email domain match
   - Legal name fuzzy match
   - NPN collision detection
   - Tax ID collision detection

5. **NPN/License Validation (11 tests)**
   - Format validation
   - State validation
   - Registry lookup (mocked)
   - Validation result storage

6. **Compliance Enforcement (8 tests)**
   - Document type validation
   - File upload security
   - Virus scan integration (mocked)
   - Hold/release logic

7. **Portal Access Control (7 tests)**
   - Access enablement
   - Scope isolation
   - Broker visibility
   - Operator access

8. **Scope/Permission/Audit (13 tests)**
   - Cross-org access blocked
   - Permission enforcement
   - Audit trail completeness
   - audit_trace_id propagation

9. **Regression Guardrails (8 tests)**
   - Gate 7A-0 untouched
   - Gate 6K/6L-A untouched
   - Quote Connect 360 untouched
   - No hidden feature exposure

**Total Tests: 105 planned**

---

## 17. Rollback Plan

### Rollback Strategy: Feature-Flag & Compatibility Based

**Rollback is NON-DESTRUCTIVE.**

**Immediate Rollback (If Issues Found Pre-Approval):**
1. Set BROKER_SIGNUP_ENABLED = false
2. Set BROKER_ONBOARDING_ENABLED = false
3. Set BROKER_APPROVAL_QUEUE_ENABLED = false
4. Set BROKER_PORTAL_ACCESS_ENABLED = false
5. All features immediately hidden
6. Routes blocked by feature flags

**Data Preservation:**
- BrokerSignupApplication records preserved (not deleted)
- BrokerOnboardingCase records preserved (not deleted)
- BrokerComplianceDocument records preserved (not deleted)
- No destructive rollback

**Revert to Gate 7A-0 State:**
- No code reversion needed (feature flags already present)
- No database cleanup needed (additive schema only)
- Broker signup features hidden but code remains

---

## 18. Registry Update Plan

### Gate Registry Updates

**Gate 7A-1 Entry:**
```json
{
  "gate_id": "7A-1",
  "gate_name": "Standalone Broker Signup & Approval Foundation",
  "status": "PLANNING (planning authorized; implementation not authorized)",
  "runtimeStatus": "INACTIVE",
  "implementationStatus": "PLANNING",
  "parent_gate": "7A"
}
```

**Gate 7A (Parent) Update:**
```json
{
  "gate_id": "7A",
  "currentPhase": "7A-0",
  "nextPhase": "7A-1",
  "nextPhaseStatus": "PLANNING_AUTHORIZED"
}
```

---

## 19. Operator Stop Condition

⛔ **STOP: Gate 7A-1 Planning Work Order Complete**

**Current Status:**
- Gate 7A-0: ✅ CLOSED
- Gate 7A-1: Planning authorized (work order created)

**What Is Authorized:**
- ✅ Review Gate 7A-1 work order
- ✅ Request amendments to work order
- ✅ Approve work order for implementation

**What Is NOT Authorized:**
- ❌ Gate 7A-1 implementation code
- ❌ Broker signup route creation
- ❌ Feature flag enablement
- ❌ Runtime feature exposure
- ❌ Production backfill
- ❌ Any code changes

**Next Operator Action Required:**
Operator must review Gate 7A-1 planning work order and decide:

**Option A:** Approve Gate 7A-1 work order for implementation authorization
**Option B:** Request amendments to Gate 7A-1 work order
**Option C:** Hold Gate 7A program pending further review

**Do not proceed to Gate 7A-1 implementation until operator approves the work order.**

---

**Work Order Status:** PLANNING AUTHORIZED (Implementation Not Authorized)  
**Prepared by:** Base44 Gate 7A-0 Closure → Gate 7A-1 Planning  
**Date:** 2026-05-13  
**Next Action:** Await operator review and approval of Gate 7A-1 work order