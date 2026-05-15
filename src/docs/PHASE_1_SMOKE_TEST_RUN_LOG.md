# Phase 1 Standalone Broker Signup — Smoke Test Run Log

**Test Execution Date:** 2026-05-12  
**Tester:** [TESTER_NAME]  
**Tester Role:** [admin / platform_super_admin]  
**Environment:** [local / staging / prod]  
**Test Session ID:** SMOKE-PHASE1-20260512-[TIME]

---

## Pre-Test Verification

### Code Validation
- [x] brokerSignup.js — Status response fixed to `'pending_profile_completion'`
- [x] approveBrokerProfile.js — Idempotency check present, authorization enforced
- [x] BrokerAgencyProfile entity schema — `pending_profile_completion` status defined
- [x] BrokerPlatformRelationship entity schema — `invited` status supported
- [x] App.jsx routes — `/broker-signup` public, `/command-center/broker-agencies` admin-only
- [x] Backend functions — Both deploy successfully with no Deno lint errors

---

## Test Execution Log

### ✅ SECTION 1: PUBLIC BROKER SIGNUP ROUTE

#### 1.1 — Unauthenticated Access
**Test Case:** Open `/broker-signup` without authentication  
**Tester Role:** Unauthenticated / Guest  
**Expected:** Page loads, 4-step form visible, no login redirect  
**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Actual:** ________________________________  
**Notes:** ________________________________  

---

#### 1.2 — Submit Valid Signup (Test Broker #1)
**Test Case:** Complete signup form with valid data  
**Tester Role:** Guest  
**Test Data Used:**
```
Legal Name: Acme Benefits Consulting LLC
DBA Name: Acme Broker
Contact Name: John Smith
Contact Email: john.smith+test1@broker.local
Phone: (555) 123-4567
State: CA
ZIP: 94107
Insurance Lines: health, dental, vision
Licensed States: CA, NY, TX
```

**Expected:**
- Loading spinner appears
- Success message: "Signup Submitted"
- Redirect to login page
- Form clears or modal closes

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Actual Loading State:** ________________________________  
**Actual Success Message:** ________________________________  
**Actual Redirect Destination:** ________________________________  
**Browser Console Errors:** [ ] Yes / [ ] No (Details: _______)  

---

#### 1.3 — Database Verification (Test Broker #1)
**Location:** Base44 Dashboard → Entities → BrokerAgencyProfile  
**Search By:** Email = `john.smith+test1@broker.local`

**Expected Fields:**
- `legal_name`: "Acme Benefits Consulting LLC"
- `dba_name`: "Acme Broker"
- `primary_contact_email`: "john.smith+test1@broker.local"
- `primary_contact_name`: "John Smith"
- `primary_phone`: "(555) 123-4567"
- `state`: "CA"
- `zip_code`: "94107"
- `onboarding_status`: "pending_profile_completion"
- `relationship_status`: "draft"
- `compliance_status`: "pending_review"
- `portal_access_enabled`: false
- `self_signup_source`: "direct_signup"

**Result:** [ ] PASS / [ ] FAIL / [ ] NOT CHECKED  
**Record ID:** ________________________________  
**Actual onboarding_status:** ________________________________  
**Actual relationship_status:** ________________________________  
**Actual portal_access_enabled:** ________________________________  
**Discrepancies Found:** [ ] Yes / [ ] No (Details: _______)  

---

#### 1.4 — BrokerPlatformRelationship Created
**Location:** Base44 Dashboard → Entities → BrokerPlatformRelationship  
**Filter By:** `broker_agency_id` = [RECORD_ID_FROM_1.3]

**Expected Fields:**
- `status`: "invited"
- `approval_status`: "pending"
- `relationship_type`: "direct_platform"
- `requested_by_user_email`: "broker_signup" or signup email

**Result:** [ ] PASS / [ ] FAIL / [ ] NOT CHECKED  
**Record ID:** ________________________________  
**Actual status:** ________________________________  
**Actual approval_status:** ________________________________  
**Number of Records Found:** ________________________________  
**Discrepancies:** ________________________________  

---

#### 1.5 — Duplicate Submission Test (Same Broker #1 Data)
**Test Case:** Submit signup form again with identical data  
**Tester Role:** Guest  
**Test Data:** Same as 1.2 (Acme Benefits, john.smith+test1@...)

**Expected:**
- Submission succeeds (backend allows re-submission)
- No error displayed
- Success message appears

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Actual Response:** ________________________________  
**Actual Error Message:** ________________________________  

**Database Check — BrokerAgencyProfile Count:**
- [ ] Only 1 record exists for email (duplicate prevented)
- [ ] 2 records exist with different IDs (re-submission allowed)
- [ ] Other: ________________________________

**Decision:** Which behavior is acceptable? ________________________________  

---

#### 1.6 — Valid Second Broker (Test Broker #3)
**Test Case:** Complete signup with different data  
**Tester Role:** Guest  
**Test Data Used:**
```
Legal Name: Premier Health Solutions Inc
DBA Name: Premier Health
Contact Name: Jane Doe
Contact Email: jane.doe+test3@broker.local
Phone: (555) 987-6543
State: FL
ZIP: 33101
Insurance Lines: health, life, disability
Licensed States: FL, GA, IL
```

**Expected:**
- Success message appears
- New BrokerAgencyProfile created
- Status = "pending_profile_completion"

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Record ID Created:** ________________________________  
**Actual onboarding_status:** ________________________________  
**Actual primary_contact_email:** ________________________________  

---

### ✅ SECTION 2: PLATFORM BROKER MANAGEMENT ROUTE (Access Control)

#### 2.1 — Non-Admin User Denied Access
**Test Case:** Attempt `/command-center/broker-agencies` as regular user  
**Tester Role:** Regular User (non-admin)  

**Expected:** PageNotFound (404) or access denied  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Actual Response:** [ ] PageNotFound / [ ] Access Denied / [ ] Other: _____  
**Actual UI Message:** ________________________________  
**Redirect Destination:** ________________________________  

---

#### 2.2 — Admin User Granted Access
**Test Case:** Navigate to `/command-center/broker-agencies` as admin  
**Tester Role:** admin / platform_super_admin  

**Expected:**
- Page loads successfully
- Header shows "Platform Broker Agencies"
- Summary cards visible
- Broker list populated

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Page Loads:** [ ] Yes / [ ] No  
**Loading Time:** ________________________________ ms  
**Browser Console Errors:** [ ] Yes / [ ] No (Details: _______)  

---

#### 2.3 — Summary Cards Accuracy
**Expected:**
- Total Agencies: 2 (Acme + Premier)
- Pending Agencies: 2 (before approval)
- Active Agencies: 0 (no approvals yet)
- Suspended Agencies: 0

**Result:** [ ] PASS / [ ] FAIL / [ ] NOT CHECKED  
**Total Agencies Shown:** ________  
**Pending Agencies Shown:** ________  
**Active Agencies Shown:** ________  
**Suspended Agencies Shown:** ________  
**Discrepancies:** ________________________________  

---

#### 2.4 — Broker List Populated
**Expected:** Both test brokers visible with correct data  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Acme Broker Visible:** [ ] Yes / [ ] No  
  - Legal Name Correct: [ ] Yes / [ ] No
  - Email Visible: [ ] Yes / [ ] No (john.smith+test1@...)
  - Status Badge: "pending profile completion" / Other: _____

**Premier Health Visible:** [ ] Yes / [ ] No  
  - Legal Name Correct: [ ] Yes / [ ] No
  - Email Visible: [ ] Yes / [ ] No (jane.doe+test3@...)
  - Status Badge: "pending profile completion" / Other: _____

---

### ✅ SECTION 3: DETAIL DRAWER

#### 3.1 — Open Detail Drawer (Acme Broker)
**Test Case:** Click on Acme broker in list  
**Tester Role:** admin  

**Expected:** Drawer slides in, displays agency details  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Drawer Opens:** [ ] Yes / [ ] No  
**Animation:** [ ] Smooth / [ ] Stuttery / [ ] None  
**Title Shows:** ________________________________  

---

#### 3.2 — Verify Agency Details Display
**Expected Sections:**
- Contact Information
- Location & Operations
- Insurance Lines
- Capacity
- Licensing & Compliance

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  

**Contact Information:**
- Name: John Smith [ ] Correct / [ ] Incorrect  
- Email: john.smith+test1@... [ ] Correct / [ ] Incorrect  
- Phone: (555) 123-4567 [ ] Correct / [ ] Incorrect  

**Location & Operations:**
- Headquarters: CA 94107 [ ] Correct / [ ] Incorrect  
- Service States: CA, NY, TX [ ] Correct / [ ] Incorrect  

**Insurance Lines:**
- Badges show: health, dental, vision [ ] Correct / [ ] Incorrect  

**Licensing & Compliance:**
- Compliance Status: pending_review [ ] Correct / [ ] Incorrect  

---

#### 3.3 — Approval Button Conditional
**Expected:** "Review & Approve" button visible (status = pending_profile_completion)  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Button Visible:** [ ] Yes / [ ] No  
**Button Enabled:** [ ] Yes / [ ] No  
**Button Text:** ________________________________  

---

#### 3.4 — Close Drawer
**Test Case:** Click "Close" button  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Drawer Closes:** [ ] Yes / [ ] No  
**List Still Visible:** [ ] Yes / [ ] No  

---

### ✅ SECTION 4: APPROVAL MODAL

#### 4.1 — Open Approval Modal (Acme Broker)
**Test Case:** Click "Review & Approve" button  
**Tester Role:** admin  

**Expected:** Approval modal opens with broker preview  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Modal Opens:** [ ] Yes / [ ] No  
**Title:** "Approve Broker Application" [ ] Correct / [ ] Incorrect  
**Broker Preview Shows:** Acme Benefits [ ] Yes / [ ] No  
**Broker Email Shows:** john.smith+test1@... [ ] Yes / [ ] No  

---

#### 4.2 — Submit Approval
**Test Case:** Enter notes and click "Approve Broker"  
**Approval Notes:** "Approved for Phase 1 testing"  

**Expected:**
- Loading spinner appears
- Success state (checkmark icon)
- Modal closes after ~1.5 seconds

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Loading Spinner:** [ ] Yes / [ ] No  
**Success State:** [ ] Yes / [ ] No / [ ] Other: _____  
**Modal Auto-closes:** [ ] Yes / [ ] No  
**Time to Close:** _________________ seconds  

---

#### 4.3 — List Refreshed (No Page Reload)
**Test Case:** Verify data refreshed after modal closes  

**Expected:**
- Acme status changed to "active" or moved from pending
- Summary cards updated
- No browser page reload

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**List Reloaded:** [ ] Yes (with loading) / [ ] Yes (silent) / [ ] No  
**Acme Status Changed:** [ ] Yes / [ ] No  
**Actual New Status:** ________________________________  
**Pending Count Decreased:** [ ] Yes / [ ] No (from 2 to 1)  
**Active Count Increased:** [ ] Yes / [ ] No (from 0 to 1)  

---

#### 4.4 — Database Verification (BrokerAgencyProfile)
**Location:** Base44 Dashboard → Entities → BrokerAgencyProfile  
**Search By:** Email = john.smith+test1@broker.local  

**Expected Updates:**
- `onboarding_status`: "active" (was "pending_profile_completion")
- `relationship_status`: "active"
- `compliance_status`: "compliant"
- `portal_access_enabled`: true
- `approved_by_user_email`: [TESTER_EMAIL]
- `approved_at`: [CURRENT_TIMESTAMP]

**Result:** [ ] PASS / [ ] FAIL / [ ] NOT CHECKED  
**onboarding_status:** [ ] "active" / Other: _____  
**relationship_status:** [ ] "active" / Other: _____  
**compliance_status:** [ ] "compliant" / Other: _____  
**portal_access_enabled:** [ ] true / Other: _____  
**approved_by_user_email:** ________________________________  
**approved_at Timestamp:** ________________________________  
**Notes Field Contains:** ________________________________  

---

#### 4.5 — Database Verification (BrokerPlatformRelationship)
**Location:** Base44 Dashboard → Entities → BrokerPlatformRelationship  
**Filter By:** `broker_agency_id` = [ACME_BROKER_ID]

**Expected Updates:**
- `status`: "active" (was "invited")
- `approval_status`: "approved" (was "pending")
- `activated_at`: [CURRENT_TIMESTAMP]
- `approved_by_user_email`: [TESTER_EMAIL]
- `approved_at`: [CURRENT_TIMESTAMP]

**Result:** [ ] PASS / [ ] FAIL / [ ] NOT CHECKED  
**status:** [ ] "active" / Other: _____  
**approval_status:** [ ] "approved" / Other: _____  
**activated_at:** ________________________________  
**approved_by_user_email:** ________________________________  
**Record Count:** [ ] 1 (correct) / Other: _____  

---

#### 4.6 — Idempotency Test (Approve Again)
**Test Case:** Attempt to approve same broker again  
**Method:** Use backend function tester or repeat approval flow  

**Payload (if using function tester):**
```json
{
  "broker_agency_id": "[ACME_BROKER_ID]",
  "approver_email": "[TESTER_EMAIL]",
  "notes": "Idempotency test - second approval"
}
```

**Expected:**
- Function succeeds without error
- No duplicate relationship created
- Only 1 BrokerPlatformRelationship record exists for broker

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**First Call Success:** [ ] Yes / [ ] No  
**Second Call Success:** [ ] Yes / [ ] No  
**Error Message (if any):** ________________________________  
**BrokerPlatformRelationship Count:** ________  
**Expected Count:** 1 / [ ] Correct / [ ] Incorrect  

---

#### 4.7 — Unauthorized User Rejection
**Test Case:** Attempt approval as non-admin user  
**Tester Role:** Regular User  
**Method:** Use backend function tester with non-admin credentials  

**Payload:**
```json
{
  "broker_agency_id": "[PREMIER_HEALTH_ID]",
  "approver_email": "regular.user@example.com",
  "notes": "Test unauthorized"
}
```

**Expected:**
- Function returns 403 Forbidden error
- Error message: "Unauthorized" or "Admin access required"
- BrokerAgencyProfile status NOT changed
- BrokerPlatformRelationship NOT created/updated

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**HTTP Status Code:** ________  
**Error Message:** ________________________________  
**Profile Status Unchanged:** [ ] Yes / [ ] No  
**Relationship Unchanged:** [ ] Yes / [ ] No  

---

### ✅ SECTION 5: ROUTE SANITY

#### 5.1 — Broker Signup Hard Refresh
**Test Case:** Open `/broker-signup` and press Ctrl+Shift+R  
**Tester Role:** Guest  

**Expected:** Page reloads without errors, form intact  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Page Reloads:** [ ] Yes / [ ] No  
**Form Visible:** [ ] Yes / [ ] No  
**Browser Console Errors:** [ ] Yes / [ ] No (Details: _______)  
**Reload Time:** _________________ seconds  

---

#### 5.2 — Platform Broker Agencies Hard Refresh
**Test Case:** Navigate to `/command-center/broker-agencies` and press Ctrl+Shift+R  
**Tester Role:** admin  

**Expected:** Page reloads, broker list repopulates, no errors  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Page Reloads:** [ ] Yes / [ ] No  
**Broker List Repopulates:** [ ] Yes / [ ] No  
**Access Control Enforced:** [ ] Yes / [ ] No  
**Browser Console Errors:** [ ] Yes / [ ] No (Details: _______)  

---

#### 5.3 — Route Navigation (App.jsx)
**Test Case:** Verify App.jsx routes match URLs  
**Method:** Code review in App.jsx  

**Expected Routes:**
- `<Route path="/broker-signup" element={<BrokerSignup />} />`
- `<Route path="/command-center/broker-agencies" element={...} />`

**Result:** [ ] PASS / [ ] FAIL / [ ] NOT CHECKED  
**brokerSignup Route Found:** [ ] Yes / [ ] No  
**Route Path Correct:** [ ] Yes / [ ] No  
**brokerAgencies Route Found:** [ ] Yes / [ ] No  
**Route Path Correct:** [ ] Yes / [ ] No  
**Admin-Only Guard Present:** [ ] Yes / [ ] No  

---

### ✅ SECTION 6: EDGE CASES & ADDITIONAL CHECKS

#### 6.1 — Missing Required Fields
**Test Case:** Submit form without required fields  
**Tester Role:** Guest  
**Steps:**
1. Open `/broker-signup`
2. Try to submit without filling legal_name
3. Try to submit without email
4. Try to submit without zip_code

**Expected:** Form validation appears, form does not submit  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Validation Appears:** [ ] Yes / [ ] No  
**Submit Prevented:** [ ] Yes / [ ] No  
**Error Messages Clear:** [ ] Yes / [ ] No  

---

#### 6.2 — Invalid Email Format
**Test Case:** Submit with invalid email  
**Test Email:** "notanemail"  

**Expected:** Validation error appears  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Validation Error:** [ ] Yes / [ ] No  
**Error Message:** ________________________________  

---

#### 6.3 — Concurrent Requests (Optional)
**Test Case:** Submit signup from two tabs simultaneously  
**Tester Role:** Guest  

**Expected:** Both succeed without conflict, no 500 errors  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED / [ ] SKIPPED  
**Both Succeed:** [ ] Yes / [ ] No  
**500 Errors:** [ ] Yes / [ ] No  
**Records Created:** ________  

---

#### 6.4 — Browser Back Button
**Test Case:** Complete signup, click browser back button  

**Expected:** No console errors, graceful behavior  

**Result:** [ ] PASS / [ ] FAIL / [ ] BLOCKED  
**Back Button Works:** [ ] Yes / [ ] No  
**Console Errors:** [ ] Yes / [ ] No  
**Destination:** ________________________________  

---

## ISSUE SUMMARY

### Issues Found During Testing

| # | Issue Title | Component | Severity | Status |
|---|---|---|---|---|
| 1 | brokerSignup response status field inconsistency | brokerSignup.js | Medium | FIXED |
| 2 | [Title] | [Component] | [Critical/High/Medium/Low] | [FIXED/PENDING] |
| 3 | [Title] | [Component] | [Critical/High/Medium/Low] | [FIXED/PENDING] |

---

### Issue #1: brokerSignup Response Status Mismatch
**Discovered:** Pre-test code review  
**Severity:** Medium  
**Component:** `src/functions/brokerSignup.js` line 91  
**Issue:** Response returned `status: 'pending_approval'` but entity schema defines `'pending_profile_completion'`  
**Root Cause:** Status field not aligned after entity schema finalized  
**Fix Applied:** Changed response to `status: 'pending_profile_completion'`  
**Files Changed:** `src/functions/brokerSignup.js`  
**Verified:** [ ] Yes / [ ] No  

---

### Issue #2: [TITLE]
**Discovered:** [DATE/TIME]  
**Severity:** [Critical/High/Medium/Low]  
**Component:** [FILE_PATH]  
**Issue:** [DESCRIPTION]  
**Root Cause:** [ANALYSIS]  
**Fix Applied:** [SOLUTION]  
**Files Changed:** [LIST]  
**Verified:** [ ] Yes / [ ] No  

---

## FINAL VERIFICATION

### Database State After All Tests

**BrokerAgencyProfile Records:**
- Total Records: ________
- Acme (john.smith+test1@broker.local) Status: ________________________________
- Premier (jane.doe+test3@broker.local) Status: ________________________________

**BrokerPlatformRelationship Records:**
- Total Records: ________
- Acme Relationship Status: ________________________________
- Acme Relationship Approval Status: ________________________________
- Premier Relationship Status: ________________________________
- Premier Relationship Approval Status: ________________________________

---

## TEST SUMMARY

### Pass/Fail by Section

| Section | Result | Notes |
|---|---|---|
| 1. Public Signup Route | [ ] PASS / [ ] FAIL | |
| 2. Platform Access Control | [ ] PASS / [ ] FAIL | |
| 3. Detail Drawer | [ ] PASS / [ ] FAIL | |
| 4. Approval Modal | [ ] PASS / [ ] FAIL | |
| 5. Route Sanity | [ ] PASS / [ ] FAIL | |
| 6. Edge Cases | [ ] PASS / [ ] FAIL | |

---

## OVERALL RESULT

### [ ] ✅ ALL TESTS PASSED — PHASE 1 CLEARED FOR PHASE 2

**Summary:**
- All 6 test sections passed
- No critical issues found
- Database state correct
- Routes and access control working as expected
- Ready to proceed to Phase 2 (Broker Agency User Invitation)

---

### [ ] ⚠️ TESTS COMPLETED WITH FIXES

**Summary:**
- Pre-test issue found and fixed: brokerSignup response status
- All 6 test sections passed after fix
- Database state correct
- Ready to proceed to Phase 2 with caveat: [CAVEAT]

---

### [ ] ❌ TESTS FAILED — PHASE 1 BLOCKED

**Summary:**
- [NUMBER] test sections failed
- [NUMBER] critical issues remain unresolved
- Cannot proceed to Phase 2 until issues are addressed
- See Issue Summary above for details

---

## SIGN-OFF

**Tester Name:** ________________________________  
**Tester Email:** ________________________________  
**Date Completed:** ________________________________  
**Time Completed:** ________________________________  
**Total Test Duration:** ________________________________  
**Environment:** [local / staging / prod]  
**Test Hardware:** [Mac / Windows / Linux] — [Browser] v[VERSION]  

**Tester Signature:** ________________________________  
**QA Lead Approval:** ________________________________  
**Phase 2 Authorized By:** ________________________________  

---

## APPENDIX: Raw Data & Screenshots

### Test Broker #1 Final State
```
Record ID: ________________________________
Email: john.smith+test1@broker.local
Legal Name: Acme Benefits Consulting LLC
onboarding_status: active
relationship_status: active
portal_access_enabled: true
approved_by: ________________________________
approved_at: ________________________________
```

### Test Broker #3 Final State (Unapproved)
```
Record ID: ________________________________
Email: jane.doe+test3@broker.local
Legal Name: Premier Health Solutions Inc
onboarding_status: pending_profile_completion
relationship_status: draft
portal_access_enabled: false
approved_by: (none)
approved_at: (none)
```

### Screenshots Captured
- [ ] Broker signup form Step 1: _______
- [ ] Broker signup form Step 4: _______
- [ ] Signup success message: _______
- [ ] Platform broker agencies page: _______
- [ ] Broker detail drawer: _______
- [ ] Approval modal: _______
- [ ] Approval success state: _______
- [ ] Broker list after approval: _______

---

**END OF SMOKE TEST RUN LOG**