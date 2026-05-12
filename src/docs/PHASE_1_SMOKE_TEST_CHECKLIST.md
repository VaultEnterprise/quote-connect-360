# Phase 1 Standalone Broker Signup — Manual Smoke Test Checklist

**Test Date:** [DATE]  
**Tester:** [NAME]  
**Environment:** [LOCAL/STAGING/PROD]  
**Test Status:** [ ] PASS | [ ] FAIL

---

## Test Data to Use

**Test Broker Agency #1 (Valid New)**
```
Legal Name: Acme Benefits Consulting LLC
DBA Name: Acme Broker
Primary Contact Name: John Smith
Primary Contact Email: john.smith+test1@broker.local
Primary Phone: (555) 123-4567
Service States: CA, NY, TX
Insurance Lines: Medical, Dental, Vision
Headquarters Zip: 94107
```

**Test Broker Agency #2 (For Duplicate Test)**
```
Same as #1 (to verify no duplicate is created)
```

**Test Broker Agency #3 (Different Data)**
```
Legal Name: Premier Health Solutions Inc
DBA Name: Premier Health
Primary Contact Name: Jane Doe
Primary Contact Email: jane.doe+test3@broker.local
Primary Phone: (555) 987-6543
Service States: FL, GA, IL
Insurance Lines: Medical, Life, Disability
Headquarters Zip: 33101
```

---

## 1️⃣ PUBLIC BROKER SIGNUP ROUTE

### 1.1 Unauthenticated Access
- [ ] Open app in incognito/private window
- [ ] Navigate to `/broker-signup`
- [ ] **Expected:** Page loads, signup form visible, no redirect to login
- [ ] **Verify:** Form has 4 steps (Business Info → Contact → Service Details → Agreements)

### 1.2 Submit Valid Signup (Test Broker #1)
- [ ] Fill in all required fields with Test Broker #1 data
- [ ] Confirm checkboxes for licensing and compliance
- [ ] Click "Submit Application"
- [ ] **Expected:** Loading spinner appears briefly
- [ ] **Expected:** Success message appears: "Application submitted successfully"
- [ ] **Expected:** Redirect to success page or modal with confirmation
- [ ] **Verify:** No form validation errors
- [ ] **Database Check:** Open Base44 dashboard → Entities → BrokerAgencyProfile
  - [ ] New record exists with email: `john.smith+test1@broker.local`
  - [ ] Status field: `pending_profile_completion`
  - [ ] Legal name: `Acme Benefits Consulting LLC`
  - [ ] Compliance status: `pending_review`
  - [ ] Portal access enabled: `false`

### 1.3 Verify BrokerPlatformRelationship Created
- [ ] In Base44 dashboard → Entities → BrokerPlatformRelationship
  - [ ] New record exists, linked to the BrokerAgencyProfile ID from above
  - [ ] Status: `invited`
  - [ ] Approval status: `pending`
  - [ ] Relationship type: `direct_platform`
- [ ] **Note:** Record timestamp should match broker profile created_date (within seconds)

### 1.4 Duplicate Submission Test (Test Broker #1 Again)
- [ ] Clear form and refresh page (or open new tab with `/broker-signup`)
- [ ] Fill in same data as Test Broker #1 (same email, name, phone)
- [ ] Click "Submit Application"
- [ ] **Expected:** Submission succeeds (backend allows re-submission)
- [ ] **Database Check:** Verify BrokerAgencyProfile entity
  - [ ] Only ONE record exists for email `john.smith+test1@broker.local`
  - [ ] OR two records exist with different IDs (acceptable if backend allows multiple submissions)
  - [ ] **Document result:** Which behavior is active?
- [ ] **Expected:** No error dialog or duplicate warning (or user gets clear feedback)

### 1.5 Valid Second Broker (Test Broker #3)
- [ ] Open `/broker-signup` in fresh tab
- [ ] Fill in Test Broker #3 data
- [ ] Click "Submit Application"
- [ ] **Expected:** Success message
- [ ] **Database Check:** Verify second BrokerAgencyProfile created with correct data
  - [ ] Email: `jane.doe+test3@broker.local`
  - [ ] Status: `pending_profile_completion`

---

## 2️⃣ PLATFORM BROKER MANAGEMENT ROUTE (Access Control)

### 2.1 Non-Admin User Access Denied
- [ ] Log in as a regular user (non-admin role)
- [ ] Try to navigate to `/command-center/broker-agencies`
- [ ] **Expected:** PageNotFound (404) or access denied message
- [ ] **Expected:** No broker list visible
- [ ] **Verify:** User is NOT redirected to login (access denied, not unauthenticated)

### 2.2 Admin Access Granted
- [ ] Log in as admin/platform_super_admin user
- [ ] Navigate to `/command-center/broker-agencies`
- [ ] **Expected:** Page loads successfully
- [ ] **Expected:** Header shows "Platform Broker Agencies" or similar
- [ ] **Expected:** Summary cards visible:
  - [ ] Total Agencies: 2 or 3 (from above tests)
  - [ ] Pending Agencies: 2 or 3
  - [ ] Active Agencies: 0 (no approvals yet)
  - [ ] Suspended Agencies: 0

### 2.3 Broker List Populated
- [ ] **Expected:** Broker list shows test brokers created above
  - [ ] Acme Benefits Consulting LLC visible
  - [ ] Premier Health Solutions Inc visible
  - [ ] Status badge shows "pending profile completion"
  - [ ] Primary contact email visible (john.smith+test1@..., jane.doe+test3@...)

### 2.4 Search/Filter Functionality (if implemented)
- [ ] [ ] Try searching for "Acme"
  - [ ] **Expected:** Acme Benefits Consulting LLC appears
  - [ ] **Expected:** Premier Health Solutions hidden or filtered out
- [ ] [ ] Try filtering by status "Pending"
  - [ ] **Expected:** Both test brokers shown
- [ ] [ ] Try filtering by status "Active"
  - [ ] **Expected:** No results (empty state)

---

## 3️⃣ DETAIL DRAWER

### 3.1 Open Detail Drawer (Acme Broker)
- [ ] Click on "Acme Benefits Consulting LLC" row in broker list
- [ ] **Expected:** Drawer/modal slides in from right (or opens centered)
- [ ] **Expected:** Modal title shows "Acme Benefits Consulting LLC"
- [ ] **Expected:** Status badge shows "pending profile completion"

### 3.2 Verify Agency Details Display
- [ ] **Check section: Contact Information**
  - [ ] Name: John Smith
  - [ ] Email: john.smith+test1@broker.local
  - [ ] Phone: (555) 123-4567
- [ ] **Check section: Location & Operations**
  - [ ] Headquarters shows state and zip: "CA 94107"
  - [ ] Service States listed: "CA, NY, TX"
  - [ ] Service Radius shown (if applicable)
- [ ] **Check section: Insurance Lines**
  - [ ] Badges show: Medical, Dental, Vision
- [ ] **Check section: Capacity**
  - [ ] Shows case and quote counts (0 if new)
  - [ ] Status shows capacity is available
- [ ] **Check section: Licensing & Compliance**
  - [ ] Compliance status: "pending_review"
  - [ ] NPN or license fields visible (may be empty for new broker)

### 3.3 Approval Button Conditional
- [ ] **Expected:** "Review & Approve" button appears
  - [ ] Only because status = `pending_profile_completion`
- [ ] **Expected:** Button is enabled (not grayed out)
- [ ] **Expected:** "Close" button is always visible

### 3.4 Close Drawer
- [ ] Click "Close" button or click outside modal
- [ ] **Expected:** Drawer closes, returns to broker list
- [ ] **Expected:** List is still visible and intact

---

## 4️⃣ APPROVAL MODAL

### 4.1 Open Approval Modal (Acme Broker)
- [ ] Click "Review & Approve" button on detail drawer for Acme broker
- [ ] **Expected:** Approval modal opens (centered or as drawer)
- [ ] **Expected:** Modal title: "Approve Broker Application"
- [ ] **Expected:** Agency preview card shows:
  - [ ] Legal name: "Acme Benefits Consulting LLC"
  - [ ] Email: "john.smith+test1@broker.local"

### 4.2 Submit Approval
- [ ] (Optional) Add approval notes: "Approved for platform integration"
- [ ] Click "Approve Broker" button
- [ ] **Expected:** Loading spinner appears
- [ ] **Expected:** Success state appears (checkmark icon + "Broker approved successfully")
- [ ] **Expected:** Modal closes automatically after ~1.5 seconds

### 4.3 Verify List Refreshed (No Full Browser Refresh)
- [ ] After modal closes, you should be back at broker list
- [ ] **Expected:** Acme broker status changed to "active" OR moved from pending tab
- [ ] **Expected:** Summary cards updated:
  - [ ] "Pending Agencies" count decreased (now 1 instead of 2)
  - [ ] "Active Agencies" count increased (now 1)
- [ ] **Expected:** No browser page reload / hard refresh occurred
  - [ ] Verify by checking if browser tab shows a loading spinner
  - [ ] Or check if unsaved data (if any) is preserved

### 4.4 Backend Verification - BrokerAgencyProfile
- [ ] Go to Base44 dashboard → Entities → BrokerAgencyProfile
- [ ] Find Acme broker record (search by email: john.smith+test1@...)
- [ ] **Verify fields updated:**
  - [ ] `onboarding_status`: `active` (was `pending_profile_completion`)
  - [ ] `relationship_status`: `active`
  - [ ] `compliance_status`: `compliant`
  - [ ] `portal_access_enabled`: `true` (was `false`)
  - [ ] `approved_by_user_email`: current logged-in admin user email
  - [ ] `approved_at`: current timestamp
  - [ ] Approval notes (if entered) visible in notes field

### 4.5 Backend Verification - BrokerPlatformRelationship
- [ ] Go to Base44 dashboard → Entities → BrokerPlatformRelationship
- [ ] Find relationship record linked to Acme broker (filter by `broker_agency_id`)
- [ ] **Verify fields:**
  - [ ] `status`: `active` (was `invited`)
  - [ ] `approval_status`: `approved` (was `pending`)
  - [ ] `activated_at`: current timestamp
  - [ ] `approved_by_user_email`: current admin email
  - [ ] `approved_at`: current timestamp

### 4.6 Idempotency Test - Approve Again
- [ ] Open detail drawer for Acme broker again
- [ ] **Expected:** "Review & Approve" button should NOT appear (status is now `active`)
- [ ] **Or:** Open Premier Health broker, approve it first
- [ ] Then, programmatically call `approveBrokerProfile` with same broker ID twice:
  - [ ] Use Base44 dashboard → Backend Functions → approveBrokerProfile
  - [ ] Payload:
    ```json
    {
      "broker_agency_id": "[ACME_BROKER_ID]",
      "approver_email": "[LOGGED_IN_USER_EMAIL]",
      "approver_role": "admin",
      "notes": "Idempotency test"
    }
    ```
  - [ ] Call it twice in quick succession
  - [ ] **Expected:** Both calls succeed without error
  - [ ] **Expected:** Only ONE BrokerPlatformRelationship record exists (not duplicated)
  - [ ] **Verify:** BrokerPlatformRelationship entity has exactly 1 record for this broker

### 4.7 Unauthorized User Rejection
- [ ] Attempt to approve with a non-admin user by:
  - [ ] Log out, then log in as regular user
  - [ ] Use Base44 dashboard → Backend Functions → approveBrokerProfile
  - [ ] Payload:
    ```json
    {
      "broker_agency_id": "[PREMIER_HEALTH_ID]",
      "approver_email": "regular.user@example.com",
      "approver_role": "user",
      "notes": "Test"
    }
    ```
  - [ ] **Expected:** Function returns error: "Forbidden: Admin access required" or similar
  - [ ] **Expected:** BrokerAgencyProfile status NOT changed
  - [ ] **Expected:** BrokerPlatformRelationship NOT created/updated

---

## 5️⃣ ROUTE SANITY

### 5.1 Broker Signup Hard Refresh
- [ ] Open `/broker-signup` in browser
- [ ] Confirm page loads
- [ ] Press `Ctrl+Shift+R` (hard refresh, clear cache) or `F5`
- [ ] **Expected:** Page reloads without errors
- [ ] **Expected:** Form is intact and ready
- [ ] **Expected:** No console errors in DevTools

### 5.2 Platform Broker Agencies Hard Refresh
- [ ] Navigate to `/command-center/broker-agencies`
- [ ] Confirm page loads with broker list
- [ ] Press `Ctrl+Shift+R` (hard refresh)
- [ ] **Expected:** Page reloads without errors
- [ ] **Expected:** Broker list repopulates
- [ ] **Expected:** Admin-only route still enforced
- [ ] **Expected:** No console errors

### 5.3 Dashboard & Navigation Links
- [ ] Open main Dashboard page
- [ ] Look for navigation link to `/command-center/broker-agencies` (if visible to admin)
- [ ] Click link if present
- [ ] **Expected:** Route resolves to correct page
- [ ] Alternatively, manually type URL: `[APP_URL]/command-center/broker-agencies`
- [ ] **Expected:** Page loads

### 5.4 App.jsx Routes Intact
- [ ] (Developer check) Open App.jsx source code
- [ ] Verify route definitions:
  - [ ] `<Route path="/broker-signup" element={<BrokerSignup />} />`
  - [ ] `<Route path="/command-center/broker-agencies" element={...} />`
- [ ] **Expected:** Routes match navigation links and URL paths
- [ ] **Expected:** No typos or mismatches

---

## 6️⃣ EDGE CASES & ADDITIONAL CHECKS

### 6.1 Missing Required Fields
- [ ] Open `/broker-signup`
- [ ] Try submitting form without filling in required fields
- [ ] **Expected:** Form validation appears (red error messages or highlights)
- [ ] **Expected:** Submit button disabled or API call prevented

### 6.2 Invalid Email Format
- [ ] Try submitting with email: `notanemail`
- [ ] **Expected:** Validation error appears
- [ ] **Expected:** Form does not submit

### 6.3 Empty Broker List (Future State)
- [ ] (Optional) Delete all test brokers from Base44 dashboard
- [ ] Return to `/command-center/broker-agencies`
- [ ] **Expected:** Empty state message appears (e.g., "No brokers found")
- [ ] **Expected:** Summary cards show 0s for all counts

### 6.4 Browser Back Button
- [ ] Complete a broker signup
- [ ] After success message, click browser back button
- [ ] **Expected:** Returns to signup form or expected previous page
- [ ] **Expected:** No console errors

### 6.5 Concurrent Requests (Optional Advanced)
- [ ] Open broker signup in two tabs
- [ ] Submit same broker data in both tabs simultaneously
- [ ] **Expected:** Both requests succeed without conflict
- [ ] **Expected:** Backend handles gracefully (no 500 errors)

---

## PASS/FAIL SUMMARY

| Test Section | Status | Notes |
|---|---|---|
| 1. Public Signup Route | [ ] PASS / [ ] FAIL | |
| 2. Platform Access Control | [ ] PASS / [ ] FAIL | |
| 3. Detail Drawer | [ ] PASS / [ ] FAIL | |
| 4. Approval Modal | [ ] PASS / [ ] FAIL | |
| 5. Route Sanity | [ ] PASS / [ ] FAIL | |
| 6. Edge Cases | [ ] PASS / [ ] FAIL | |

---

## OVERALL RESULT

### [ ] ✅ ALL TESTS PASSED
**Phase 1 ready for deployment**

### [ ] ⚠️ SOME TESTS FAILED
**Issues found (document below):**

1. Issue:
   - [ ] Expected:
   - [ ] Actual:
   - [ ] Steps to Reproduce:
   - [ ] Severity: [ ] Critical | [ ] High | [ ] Medium | [ ] Low

2. Issue:
   - [ ] Expected:
   - [ ] Actual:
   - [ ] Steps to Reproduce:
   - [ ] Severity: [ ] Critical | [ ] High | [ ] Medium | [ ] Low

---

## TEST COMPLETION

**Tester Signature:** ________________  
**Date/Time Completed:** ________________  
**Environment Notes:** ________________  
**Bugs Filed:** [ ] Yes / [ ] No (Ref: __________)