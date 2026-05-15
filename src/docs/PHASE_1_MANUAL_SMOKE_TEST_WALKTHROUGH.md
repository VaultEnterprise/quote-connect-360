# Phase 1 Standalone Broker Signup — Manual Smoke Test Walkthrough

**For Human Testers | Step-by-Step Instructions**

**Date:** 2026-05-12  
**Test Duration:** ~60 minutes  
**Required Roles:** Admin (platform tester account)

---

## PART 1: PRE-TEST SETUP

### Step 1.1 — Verify Your Test Account

**In Base44 Dashboard:**
1. Click **Settings** (top-right profile menu)
2. Verify your email address is displayed
3. Verify your role is **"admin"** or **"platform_super_admin"**
4. If not admin, you cannot execute this test (request elevated access)

**Expected:** Role shows as "admin" or "platform_super_admin"  
**If blocked:** Contact platform admin to grant admin role

---

### Step 1.2 — Clear Prior Test Data (First Time Only)

If you've run this test before, delete old test brokers to avoid data collision.

**In Base44 Dashboard → Entities → BrokerAgencyProfile:**
1. Search for emails matching pattern: `john.smith+test*@broker.local` or `jane.doe+test*@broker.local`
2. For each matching record:
   - Click the record
   - Click **Delete** (if available)
   - Confirm deletion
3. Repeat for **BrokerPlatformRelationship** entity (filter by `broker_agency_id` if available)

**Expected:** No test broker emails remain  
**If unable to delete:** Note the record ID and proceed (duplicate email will test re-submission)

---

### Step 1.3 — Open Required Browser Tabs

Open 3 browser tabs and bookmark them for quick switching:

**Tab 1: Broker Signup Form**
- URL: `http://localhost:5173/broker-signup` (or your app domain)
- Label: "Broker Signup"
- Auth State: **Not logged in** (no auth required)

**Tab 2: Platform Broker Agencies Management**
- URL: `http://localhost:5173/command-center/broker-agencies`
- Label: "Platform Brokers"
- Auth State: **Logged in as admin**

**Tab 3: Base44 Dashboard Entities**
- URL: Open your Base44 dashboard
- Navigate to: **Entities** section
- Label: "Entity Inspector"
- Keep this tab ready to inspect database records

**Expected:** All 3 tabs open without errors  
**If blocked:** Check that the app is running and you have the correct URLs

---

### Step 1.4 — Prepare Test Data

Write down these exact values for reference. You'll use them throughout the test.

**Test Broker #1 (Acme Benefits):**
```
Legal Name:            Acme Benefits Consulting LLC
DBA Name:              Acme Broker
Primary Contact Name:  John Smith
Contact Email:         john.smith+test1@broker.local
Phone:                 (555) 123-4567
State of Operation:    CA
ZIP Code:              94107
Licensed States:       CA, NY, TX (select all 3)
Insurance Lines:       health, dental, vision (select these 3)
Industry Specialties:  healthcare, finance
Min Employer Size:     10
Max Employer Size:     500
```

**Test Broker #3 (Premier Health):**
```
Legal Name:            Premier Health Solutions Inc
DBA Name:              Premier Health
Primary Contact Name:  Jane Doe
Contact Email:         jane.doe+test3@broker.local
Phone:                 (555) 987-6543
State of Operation:    FL
ZIP Code:              33101
Licensed States:       FL, GA, IL (select all 3)
Insurance Lines:       health, life, disability (select these 3)
Industry Specialties:  healthcare
Min Employer Size:     5
Max Employer Size:     1000
```

**Write these down on paper** so you can reference without switching tabs.

---

## PART 2: SECTION A — PUBLIC BROKER SIGNUP

### Step A.1 — Access Signup Form (Unauthenticated)

**Browser Tab 1: Broker Signup**
1. Click on the "Broker Signup" tab
2. You should see the form without being logged in
3. Verify the page title: "Broker Agency Signup"
4. Verify the subtitle: "Join our platform as a standalone broker agency"

**Expected Results:**
- ✅ Page loads without redirect to login
- ✅ 4-step form visible
- ✅ Step 1 title shows: "Step 1 of 4: Business Identity"
- ✅ No login button visible (unauthenticated access confirmed)

**If BLOCKED:**
- Page redirects to login → Broker signup route requires auth (unexpected)
- Page doesn't load → Check URL, check network errors in browser console

**Record in Run Log:**
- Section A.1 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Actual page title: ________________
- Required auth to access: [ ] Yes / [ ] No

---

### Step A.2 — Enter Broker #1 Identity (Step 1 of 4)

**Form Fields — Step 1: Business Identity**

1. **Legal Business Name field**
   - Clear any existing text
   - Type: `Acme Benefits Consulting LLC`
   - Press Tab or click next field

2. **DBA Name field**
   - Type: `Acme Broker`
   - Press Tab

3. **State of Operation dropdown**
   - Click dropdown
   - Scroll and select: `CA`
   - Verify selection shows "CA"

4. **ZIP Code field**
   - Type: `94107`
   - Press Tab

5. **Click "Next" button** (bottom right)

**Expected Results:**
- ✅ No validation errors
- ✅ Form advances to Step 2
- ✅ Step 2 title shows: "Step 2 of 4: Contact Information"
- ✅ Previous values are retained (if you go back)

**If BLOCKED:**
- Validation error appears (missing required field) → Go back, verify all fields filled
- Next button disabled → Check if all required fields have values

**Record in Run Log:**
- Section A.2 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- State dropdown selected: ________________
- Validation errors encountered: [ ] Yes / [ ] No (list: ________________)

---

### Step A.3 — Enter Broker #1 Contact Info (Step 2 of 4)

**Form Fields — Step 2: Contact Information**

1. **First Name field**
   - Type: `John`

2. **Last Name field**
   - Type: `Smith`

3. **Email Address field**
   - Type: `john.smith+test1@broker.local`
   - (This is a valid email format with "+" for test purposes)

4. **Phone field**
   - Type: `(555) 123-4567`

5. **Click "Next" button**

**Expected Results:**
- ✅ No validation errors
- ✅ Form advances to Step 3
- ✅ Step 3 title shows: "Step 3 of 4: Service Details"

**If BLOCKED:**
- Email validation error → Check email format matches pattern
- Phone validation error → Try entering just digits: 5551234567

**Record in Run Log:**
- Section A.3 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Email field value: john.smith+test1@broker.local [ ] Correct / [ ] Incorrect

---

### Step A.4 — Enter Broker #1 Service Details (Step 3 of 4)

**Form Fields — Step 3: Service Details**

1. **License Expiration Date field**
   - Click date picker
   - Select a date 1-2 years in future (e.g., May 12, 2028)
   - Press Tab or click outside

2. **Licensed States checkboxes**
   - Checkboxes visible in a grid (4 columns)
   - Scroll if needed
   - Check: `CA`
   - Check: `NY`
   - Check: `TX`
   - Verify 3 boxes are checked

3. **Insurance Lines checkboxes**
   - Checkboxes visible in a grid (2 columns)
   - Check: `health`
   - Check: `dental`
   - Check: `vision`
   - Verify 3 boxes are checked

4. **Industry Specialties field**
   - Type: `healthcare, finance`

5. **Min Employer Size field**
   - Type: `10`

6. **Max Employer Size field**
   - Type: `500`

7. **Click "Next" button**

**Expected Results:**
- ✅ No validation errors
- ✅ Form advances to Step 4
- ✅ Step 4 title shows: "Step 4 of 4: Confirmation"

**If BLOCKED:**
- Checkboxes won't select → Try clicking directly on checkbox
- Date picker won't open → Try typing date directly in format shown

**Record in Run Log:**
- Section A.4 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Insurance lines selected: [ ] health / [ ] dental / [ ] vision (verify all 3)
- Licensed states selected: [ ] CA / [ ] NY / [ ] TX (verify all 3)

---

### Step A.5 — Confirm Broker #1 Submission (Step 4 of 4)

**Form Fields — Step 4: Confirmation**

1. **Review Summary**
   - Verify displayed data shows:
     - Business: `Acme Benefits Consulting LLC`
     - Contact: `John Smith (john.smith+test1@broker.local)`
     - Location: `CA 94107`
     - Licensed States: `CA, NY, TX`
     - Lines: `health, dental, vision`

2. **Terms & Conditions Checkbox**
   - Check: "I agree to the Master Service Agreement and broker terms of service"

3. **Compliance Checkbox**
   - Check: "I acknowledge that my profile will be reviewed for compliance and licensing verification"

4. **Verify "Submit Application" button is enabled** (both checkboxes checked)

5. **Click "Submit Application" button**

**Expected Results:**
- ✅ Loading spinner appears (animated circle)
- ✅ After ~2-3 seconds, success message appears:
   - Icon: Green checkmark
   - Title: "Signup Submitted"
   - Message: "Your broker profile has been submitted for review. We'll contact you within 2-3 business days."
   - Subtext: "Redirecting to login..."
- ✅ After another ~2 seconds, page redirects to `/broker/login` (or similar)

**If BLOCKED:**
- Submit button disabled → Verify both checkboxes are checked
- No loading spinner → Check browser console for JS errors
- Error message instead of success → Note exact error text

**Record in Run Log:**
- Section A.5 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Success message appeared: [ ] Yes / [ ] No
- Redirect destination: ________________
- Browser console errors: [ ] Yes / [ ] No (screenshot: ________________)

---

### Step A.6 — Database Verification (Broker #1 Created)

**You are now on login page (or back at signup). Switch to Tab 3: Entity Inspector**

**In Base44 Dashboard → Entities → BrokerAgencyProfile:**

1. **Search for the broker:**
   - Click "Search" or filter icon
   - Search by email: `john.smith+test1@broker.local`
   - OR scroll through list to find "Acme Benefits Consulting LLC"

2. **Click on the record** to view details

3. **Verify these exact fields:**

   | Field | Expected Value | Actual Value |
   |---|---|---|
   | `legal_name` | Acme Benefits Consulting LLC | ________ |
   | `dba_name` | Acme Broker | ________ |
   | `primary_contact_name` | John Smith | ________ |
   | `primary_contact_email` | john.smith+test1@broker.local | ________ |
   | `primary_phone` | (555) 123-4567 | ________ |
   | `state` | CA | ________ |
   | `zip_code` | 94107 | ________ |
   | `onboarding_status` | pending_profile_completion | ________ |
   | `relationship_status` | draft | ________ |
   | `compliance_status` | pending_review | ________ |
   | `portal_access_enabled` | false | ________ |

4. **Copy the Record ID** (at top of detail view or in list)
   - Record ID: ________________________________

5. **Verify insurance lines** (if visible in fields):
   - Should include: health, dental, vision

6. **Verify licensed states** (if visible in fields):
   - Should include: CA, NY, TX

**Expected Results:**
- ✅ Exactly 1 BrokerAgencyProfile record exists for this email
- ✅ `onboarding_status` = "pending_profile_completion"
- ✅ `relationship_status` = "draft"
- ✅ `portal_access_enabled` = false
- ✅ All field values match form input

**If FAILED:**
- Record not found → Signup did not persist to database (check browser console)
- Wrong status value → Database schema or form mapping issue
- Multiple records found → Duplicate prevention test (see Section B)

**Record in Run Log:**
- Section A.6 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- BrokerAgencyProfile Record ID: ________________
- onboarding_status: ________________ (expected: "pending_profile_completion")
- Actual field discrepancies: ________________

---

### Step A.7 — Verify BrokerPlatformRelationship Created

**In Base44 Dashboard → Entities → BrokerPlatformRelationship:**

1. **Filter or search** for this broker relationship:
   - Filter by `broker_agency_id` = [the Record ID from A.6]
   - OR search by broker email if search available

2. **Click on the record** to view details

3. **Verify these exact fields:**

   | Field | Expected Value | Actual Value |
   |---|---|---|
   | `broker_agency_id` | [ID from A.6] | ________ |
   | `status` | invited | ________ |
   | `approval_status` | pending | ________ |
   | `relationship_type` | direct_platform | ________ |
   | `invited_at` | [today's date/time] | ________ |

4. **Verify only 1 record exists** for this broker_agency_id
   - Count of records: ________

**Expected Results:**
- ✅ Exactly 1 BrokerPlatformRelationship record exists
- ✅ `status` = "invited"
- ✅ `approval_status` = "pending"
- ✅ `relationship_type` = "direct_platform"

**If FAILED:**
- No relationship found → brokerSignup function didn't create relationship
- Multiple relationships → Function called twice or idempotency issue
- Wrong status → Function returned wrong enum value

**Record in Run Log:**
- Section A.7 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- BrokerPlatformRelationship Record ID: ________________
- status: ________________ (expected: "invited")
- approval_status: ________________ (expected: "pending")

---

## PART 3: SECTION B — DUPLICATE SIGNUP PREVENTION TEST

### Step B.1 — Retry Signup with Same Data

**Browser Tab 1: Broker Signup**

1. If you were redirected to login page, navigate back to `/broker-signup`
2. You should see the fresh 4-step form (Step 1 of 4)
3. **Enter identical data to Section A (Broker #1):**
   - Legal Name: `Acme Benefits Consulting LLC`
   - DBA Name: `Acme Broker`
   - State: `CA`
   - ZIP: `94107`
   - First/Last Name: `John Smith`
   - Email: `john.smith+test1@broker.local` (same email as before)
   - Phone: `(555) 123-4567`
   - Continue through steps 2, 3
4. **Complete form and submit**

**Expected Results:**
- ✅ Form accepts submission (no error about duplicate email)
- ✅ Success message appears again
- ✅ Same flow as first submission

**OR**

- ✅ Error message appears: "This email is already registered" (if duplicate prevention is implemented)

**Record in Run Log:**
- Section B.1 Result: [ ] PASS / [ ] FAIL
- Duplicate submission behavior:
  - [ ] Allowed (no error)
  - [ ] Blocked (error message shown)
- Error message (if blocked): ________________

---

### Step B.2 — Database Verification (Duplicate Check)

**In Base44 Dashboard → Entities → BrokerAgencyProfile:**

1. **Search for email:** `john.smith+test1@broker.local`
2. **Count how many records exist** for this email address
   - Count: ________

**Expected Results:**

**Option A — If duplicate was allowed:**
- ✅ Exactly 2 BrokerAgencyProfile records exist for this email
- Both have status "pending_profile_completion"
- Both have same legal_name, contact info
- Record IDs are different

**Option B — If duplicate was blocked:**
- ✅ Exactly 1 BrokerAgencyProfile record exists for this email
- Record ID matches the original from Section A.6

**Record in Run Log:**
- Section B.2 Result: [ ] PASS / [ ] FAIL
- Record count for duplicate email: ________
- Expected count: [ ] 1 (blocked) / [ ] 2 (allowed)
- Duplicate creation status: [ ] Prevented / [ ] Allowed

---

### Step B.3 — Note on Duplicate Handling

This test determines whether the system prevents or allows duplicate submissions with the same email. Both behaviors may be acceptable depending on business rules:
- **Blocked:** More secure, prevents data pollution
- **Allowed:** More lenient, allows re-submission if needed

**For Phase 1, document the actual behavior.** If it doesn't match business expectations, this becomes a Phase 1.5 fix.

**Record in Run Log:**
- Duplicate handling behavior (as observed): ________________
- Is this the expected behavior: [ ] Yes / [ ] No / [ ] Needs clarification

---

## PART 4: SECTION C — ACCESS CONTROL

### Step C.1 — Unauthenticated User Denied Access

**Browser Tab 2: Platform Brokers (in a fresh/incognito window or after logout)**

1. **Sign out of your admin account:**
   - Click profile menu (top-right)
   - Click "Sign Out" or "Logout"
   - Verify you're logged out (no profile shown)

2. **Navigate to:** `http://localhost:5173/command-center/broker-agencies`

3. **Observe the result**

**Expected Results:**
- ✅ PageNotFound (404) appears
- OR ✅ Access Denied message
- ✅ No broker list visible
- ✅ No redirect to login (stays on 404 page)

**If BLOCKED:**
- Page loads broker list → Unauthenticated users can see admin data (security issue)
- Redirect to login → Route allows login, which is acceptable

**Record in Run Log:**
- Section C.1 Result: [ ] PASS / [ ] FAIL
- Actual response: [ ] PageNotFound / [ ] Access Denied / [ ] Redirect to Login / [ ] Page Loads
- Broker data visible to unauthenticated user: [ ] Yes / [ ] No

---

### Step C.2 — Non-Admin User Denied Access

1. **If you have a non-admin test account, log in as that user**
   - OR ask a colleague to test this step

2. **Navigate to:** `http://localhost:5173/command-center/broker-agencies`

**Expected Results:**
- ✅ PageNotFound (404) appears
- OR ✅ Access Denied message
- ✅ No broker list visible

**If BLOCKED:**
- Page loads → Non-admin users can access admin page (security issue)

**Record in Run Log:**
- Section C.2 Result: [ ] PASS / [ ] FAIL
- Actual response (non-admin): [ ] PageNotFound / [ ] Access Denied / [ ] Page Loads

---

### Step C.3 — Admin User Granted Access

1. **Log back in as admin** (use your original admin account)

2. **Navigate to:** `http://localhost:5173/command-center/broker-agencies`

3. **Observe the page**

**Expected Results:**
- ✅ Page loads without error
- ✅ Header shows: "Broker Agencies" and subtitle "Manage all broker agencies on the platform"
- ✅ Summary cards visible showing:
   - Total Brokers
   - Pending Review
   - Active
   - Suspended
- ✅ Broker list visible below
- ✅ Search bar and filter dropdown present

**If BLOCKED:**
- Access denied → Admin user should have access (auth issue)
- Page doesn't load → Check URL, network errors

**Record in Run Log:**
- Section C.3 Result: [ ] PASS / [ ] FAIL
- Page loaded for admin user: [ ] Yes / [ ] No
- Summary cards visible: [ ] Yes / [ ] No
- Broker list visible: [ ] Yes / [ ] No

---

## PART 5: SECTION D — PENDING BROKER REVIEW UI

### Step D.1 — Verify Summary Card Counts

**On Platform Brokers page (Tab 2):**

1. **Look at the 4 summary cards** at the top:
   - Total Brokers
   - Pending Review
   - Active
   - Suspended

2. **Read the counts shown**

**Expected Results** (assuming Broker #1 created, Broker #3 not yet created):
- Total Brokers: 1 or 2 (depends on duplicate test result)
- Pending Review: 1 (Acme, not yet approved)
- Active: 0 (no approvals yet)
- Suspended: 0

**OR if both Broker #1 and #3 already created:**
- Total Brokers: 2
- Pending Review: 2
- Active: 0
- Suspended: 0

**Record in Run Log:**
- Section D.1 Result: [ ] PASS / [ ] FAIL
- Summary card counts:
  - Total: ________
  - Pending: ________
  - Active: ________
  - Suspended: ________

---

### Step D.2 — Locate Broker #1 in List

**On Platform Brokers page:**

1. **Look at the broker list** (should show cards/rows)
2. **Find the Acme broker** by looking for:
   - Legal name: "Acme Benefits Consulting LLC"
   - Email: "john.smith+test1@broker.local"
   - Status badge: should show "pending profile completion"

3. **Click on the broker card** to open the detail drawer

**Expected Results:**
- ✅ Broker card visible with all key info
- ✅ Status badge shows: "pending profile completion" or similar
- ✅ Email visible: john.smith+test1@broker.local
- ✅ "Review" button visible (for approval action)
- ✅ Detail drawer opens when clicked

**If BLOCKED:**
- Broker not in list → Database wasn't queried or filter excluded it
- Status shows wrong value → Backend status mismatch
- Detail drawer doesn't open → UI event handler issue

**Record in Run Log:**
- Section D.2 Result: [ ] PASS / [ ] FAIL
- Acme broker visible in list: [ ] Yes / [ ] No
- Status badge text: ________________
- Detail drawer opens: [ ] Yes / [ ] No

---

### Step D.3 — Verify Detail Drawer Content

**In the detail drawer** (now open from D.2):

1. **Verify the title shows:** "Acme Benefits Consulting LLC" with status badge
2. **Check Contact Information section:**
   - Name: John Smith
   - Email: john.smith+test1@broker.local
   - Phone: (555) 123-4567

3. **Check Location & Operations section:**
   - Headquarters: CA 94107
   - Service States: CA, NY, TX

4. **Check Insurance Lines section:**
   - Badges showing: health, dental, vision

5. **Check Licensing & Compliance section:**
   - Compliance: pending_review

6. **Check for "Review & Approve" button** at bottom
   - Button should be visible and enabled (status is pending_profile_completion)

**Expected Results:**
- ✅ All sections render correctly
- ✅ Data matches form input from Section A
- ✅ "Review & Approve" button visible
- ✅ Button is enabled (not grayed out)

**If BLOCKED:**
- Sections not rendering → UI component issue
- Data missing or wrong → Database field mapping issue
- Button missing → Conditional rendering issue (check status value)

**Record in Run Log:**
- Section D.3 Result: [ ] PASS / [ ] FAIL
- Contact Name: ________________ (expected: John Smith)
- Status badge: ________________ (expected: pending_profile_completion)
- Review & Approve button visible: [ ] Yes / [ ] No
- Button enabled: [ ] Yes / [ ] No

---

### Step D.4 — Close Drawer and Continue

1. **Click "Close" button** (bottom right of drawer)
2. **Verify drawer closes** and you're back to the broker list

**Expected Results:**
- ✅ Drawer closes smoothly
- ✅ Broker list still visible
- ✅ No page reload

**Record in Run Log:**
- Section D.4 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED

---

## PART 6: SECTION E — APPROVAL FLOW

### Step E.1 — Create Broker #3 (Optional, If Not Done)

If you haven't yet created Broker #3 (Premier Health), do it now:

**Browser Tab 1: Broker Signup**
1. Navigate to `/broker-signup`
2. Fill out form with Broker #3 data:
   - Legal Name: `Premier Health Solutions Inc`
   - DBA Name: `Premier Health`
   - Contact: `Jane Doe (jane.doe+test3@broker.local)`
   - Phone: `(555) 987-6543`
   - State: `FL`
   - ZIP: `33101`
   - Licensed States: `FL, GA, IL`
   - Insurance Lines: `health, life, disability`
3. Submit

**Return to Tab 2 after submission.**

---

### Step E.2 — Open Broker #1 Detail Drawer Again

**On Platform Brokers page (Tab 2):**

1. **Find and click on Acme broker** to open detail drawer
2. Drawer should open showing Acme's information

---

### Step E.3 — Click "Review & Approve" Button

**In the detail drawer:**

1. **Click the "Review & Approve" button** (bottom of drawer)
2. **Approval modal should open**

**Expected Results:**
- ✅ Modal dialog appears with title: "Approve Broker Application"
- ✅ Broker preview visible showing: "Acme Benefits Consulting LLC"
- ✅ Broker email shows: john.smith+test1@broker.local
- ✅ Notes text field available (optional)
- ✅ "Approve Broker" button visible
- ✅ "Cancel" button visible

**If BLOCKED:**
- Modal doesn't open → UI event handler issue
- Modal doesn't show broker data → Props not passed correctly

**Record in Run Log:**
- Section E.3 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Modal opens: [ ] Yes / [ ] No
- Broker name in modal: ________________

---

### Step E.4 — Submit Approval

**In the approval modal:**

1. **In the "Approval Notes" text field**, type:
   - `Approved for Phase 1 smoke testing`

2. **Click "Approve Broker" button**

3. **Observe the response**

**Expected Results:**
- ✅ Loading spinner appears (animated)
- ✅ After ~1-2 seconds, success state appears:
   - Icon: Green checkmark
   - Message: "Broker approved successfully"
- ✅ Modal automatically closes after ~1.5 seconds
- ✅ You're back at the broker list (no full page reload)
- ✅ Broker list reloads silently

**If BLOCKED:**
- Error message appears → Backend function returned error (note exact message)
- Modal hangs with spinner → Backend timeout or crash
- Requires full page reload → Frontend not refreshing data automatically

**Record in Run Log:**
- Section E.4 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Loading spinner appeared: [ ] Yes / [ ] No
- Success state appeared: [ ] Yes / [ ] No
- Modal closed automatically: [ ] Yes / [ ] No
- Exact error (if failed): ________________

---

### Step E.5 — Verify Updated Broker List

**After modal closes:**

1. **Look at the broker list** (should have reloaded)
2. **Find the Acme broker** in the list
3. **Check the status badge** — should now show different status

**Expected Results:**
- ✅ Broker status changed from "pending profile completion" to "active"
- OR ✅ Broker moved from "Pending Review" section to "Active" section (if using tabs)
- ✅ Summary cards at top updated:
   - Pending Review: 1 (was 2) ← only Premier Health now
   - Active: 1 (was 0) ← Acme now approved

**If FAILED:**
- Status didn't change → Database not updated or UI not refreshed
- Summary cards didn't update → List refresh didn't occur

**Record in Run Log:**
- Section E.5 Result: [ ] PASS / [ ] FAIL
- Broker status changed: [ ] Yes / [ ] No
- New status: ________________ (expected: "active")
- Summary card update:
  - Pending count: ________ (expected: 1)
  - Active count: ________ (expected: 1)

---

### Step E.6 — Database Verification (BrokerAgencyProfile Updated)

**In Base44 Dashboard → Entities → BrokerAgencyProfile:**

1. **Search for:** `john.smith+test1@broker.local`
2. **Click the record** to view updated details
3. **Verify these fields changed:**

   | Field | Previous Value | Expected New Value | Actual Value |
   |---|---|---|---|
   | `onboarding_status` | pending_profile_completion | active | ________ |
   | `relationship_status` | draft | active | ________ |
   | `compliance_status` | pending_review | compliant | ________ |
   | `portal_access_enabled` | false | true | ________ |
   | `approved_by_user_email` | (none) | [your email] | ________ |
   | `approved_at` | (none) | [timestamp] | ________ |
   | `notes` | (empty) | Approved for Phase 1... | ________ |

**Expected Results:**
- ✅ All fields updated correctly
- ✅ `approved_by_user_email` shows your admin email
- ✅ `approved_at` shows today's date/time
- ✅ Only 1 record exists (no duplicates)

**If FAILED:**
- Status values not updated → Backend didn't persist changes
- No approval metadata → Approval metadata not saved
- Multiple records exist → Duplicate relationship created

**Record in Run Log:**
- Section E.6 Result: [ ] PASS / [ ] FAIL
- onboarding_status: ________________ (expected: "active")
- approved_by_user_email: ________________ (expected: your email)
- Record count for this broker: ________ (expected: 1)

---

### Step E.7 — Database Verification (BrokerPlatformRelationship Updated)

**In Base44 Dashboard → Entities → BrokerPlatformRelationship:**

1. **Filter by:** `broker_agency_id` = [Acme's Record ID from earlier]
2. **Click the record** to view updated details
3. **Verify these fields changed:**

   | Field | Previous Value | Expected New Value | Actual Value |
   |---|---|---|---|
   | `status` | invited | active | ________ |
   | `approval_status` | pending | approved | ________ |
   | `activated_at` | (none) | [timestamp] | ________ |
   | `approved_by_user_email` | (none) | [your email] | ________ |
   | `approved_at` | (none) | [timestamp] | ________ |

4. **Verify record count:** Only 1 relationship for this broker_agency_id
   - Count: ________

**Expected Results:**
- ✅ `status` = "active"
- ✅ `approval_status` = "approved"
- ✅ `approved_by_user_email` = your email
- ✅ `activated_at` timestamp present
- ✅ Only 1 relationship record exists

**If FAILED:**
- Status not updated → Backend didn't update relationship
- Multiple relationships exist → Duplicate created by approval function
- Approval metadata missing → Function not writing audit fields

**Record in Run Log:**
- Section E.7 Result: [ ] PASS / [ ] FAIL
- Relationship status: ________________ (expected: "active")
- Relationship count: ________ (expected: 1)

---

## PART 7: SECTION F — APPROVAL IDEMPOTENCY TEST

### Step F.1 — Attempt Second Approval (Same Broker)

**Scenario:** What happens if we try to approve the same broker again?

**Method 1 — Via UI (if possible):**
1. **Navigate back to broker list** (Tab 2)
2. **Find Acme broker** (now showing status "active")
3. **Click to open detail drawer**
4. **Check if "Review & Approve" button is still visible**
   - [ ] Button visible (can retry approval)
   - [ ] Button missing or disabled (cannot retry approval)

**If button is NOT visible** → UI correctly prevents retry (✅ PASS)  
**If button IS visible** → Continue with Method 2 below

**Method 2 — Via Backend Function Tester:**

1. **In Base44 Dashboard → Functions → approveBrokerProfile**
2. **Click "Test" or open the function tester**
3. **Enter this payload:**
   ```json
   {
     "broker_agency_id": "[Acme's Record ID]",
     "approver_email": "[your admin email]",
     "approver_role": "admin",
     "notes": "Idempotency test - second approval attempt"
   }
   ```
4. **Click "Execute" or "Test"**

**Expected Results:**
- ✅ Function returns 200 OK (succeeds)
- ✅ Function returns same success response as first approval
- ✅ No error message
- ✅ No "already approved" error

**Why this is expected:** Function should be idempotent — calling it twice with same broker is safe.

**Record in Run Log:**
- Section F.1 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- UI button available for retry: [ ] Yes / [ ] No
- Function tester response status: ________
- Error message (if any): ________________

---

### Step F.2 — Verify No Duplicate Created

**In Base44 Dashboard → Entities → BrokerPlatformRelationship:**

1. **Filter by:** `broker_agency_id` = [Acme's Record ID]
2. **Count the records** returned

**Expected Results:**
- ✅ Exactly 1 record exists (not 2)
- ✅ Record still shows `status: "active"` and `approval_status: "approved"`
- ✅ No duplicate relationship was created

**If FAILED:**
- 2 records exist → Function is not idempotent (bug)
- Status values conflicting → Inconsistent state

**Record in Run Log:**
- Section F.2 Result: [ ] PASS / [ ] FAIL
- Relationship record count: ________ (expected: 1)
- Idempotency status: [ ] PASS (safe to call twice) / [ ] FAIL (creates duplicate)

---

## PART 8: SECTION G — ROUTE HARD REFRESH

### Step G.1 — Hard Refresh Broker Signup Route

**Browser Tab 1: Broker Signup**

1. **Navigate to:** `/broker-signup`
2. **Press Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac) for hard refresh
   - This clears cache and reloads from server

3. **Observe the result**

**Expected Results:**
- ✅ Page reloads without error
- ✅ Fresh signup form appears (Step 1 of 4)
- ✅ No console errors
- ✅ Load time: < 5 seconds

**If BLOCKED:**
- Page doesn't load → Server error or route issue
- 404 error → Route not defined in App.jsx
- Console errors → Missing imports or syntax errors

**Record in Run Log:**
- Section G.1 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Page loads after hard refresh: [ ] Yes / [ ] No
- Load time: ________ seconds
- Browser console errors: [ ] Yes / [ ] No

---

### Step G.2 — Hard Refresh Platform Broker Agencies Route

**Browser Tab 2: Platform Brokers (as admin)**

1. **Make sure you're logged in as admin**
2. **Navigate to:** `/command-center/broker-agencies`
3. **Press Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)

**Expected Results:**
- ✅ Page reloads without error
- ✅ Broker list repopulates
- ✅ Summary cards show correct counts
- ✅ Admin access control still enforced
- ✅ Load time: < 5 seconds

**If BLOCKED:**
- Access denied after reload → Auth state lost
- Page doesn't load → Server error
- Broker list empty → Data query failed

**Record in Run Log:**
- Section G.2 Result: [ ] PASS / [ ] FAIL / [ ] BLOCKED
- Page loads after hard refresh: [ ] Yes / [ ] No
- Broker list repopulates: [ ] Yes / [ ] No
- Access control enforced: [ ] Yes / [ ] No

---

### Step G.3 — Hard Refresh as Non-Admin User

1. **Log out as admin**
2. **Try to navigate to:** `/command-center/broker-agencies`
3. **If somehow on page, press Ctrl+Shift+R** for hard refresh

**Expected Results:**
- ✅ Access denied (404 or Access Denied page)
- ✅ No broker data visible
- ✅ No auth bypass after reload

**Record in Run Log:**
- Section G.3 Result: [ ] PASS / [ ] FAIL
- Access denied to non-admin: [ ] Yes / [ ] No

---

## PART 9: SECTION H — FINAL DATABASE VERIFICATION TABLE

**Fill in this table with actual database values after all approvals are complete:**

### BrokerAgencyProfile Records

| Broker | Email | Record ID | onboarding_status | relationship_status | portal_access_enabled | approved_by | Notes |
|---|---|---|---|---|---|---|---|
| Acme Benefits | john.smith+test1@broker.local | ________ | active | active | true | [your email] | ✅ Approved |
| Premier Health | jane.doe+test3@broker.local | ________ | pending_profile_completion | draft | false | (none) | ⏳ Pending |

**Questions to Answer:**
1. Total BrokerAgencyProfile records created: ________
2. How many have status "pending_profile_completion": ________
3. How many have status "active": ________
4. Are all email addresses unique: [ ] Yes / [ ] No
5. Any duplicate records for same email: [ ] Yes / [ ] No

---

### BrokerPlatformRelationship Records

| Broker | Relationship ID | status | approval_status | activated_at | Notes |
|---|---|---|---|---|---|
| Acme Benefits | ________ | active | approved | [timestamp] | ✅ One record |
| Premier Health | ________ | invited | pending | (none) | ⏳ One record |

**Questions to Answer:**
1. Total BrokerPlatformRelationship records created: ________
2. Total per broker (should be 1 each): Acme ________, Premier ________
3. Any duplicate relationships: [ ] Yes / [ ] No
4. Idempotency verified (no duplicate after second approval): [ ] Yes / [ ] No

---

### BrokerAgencyUser Records

**Note:** BrokerAgencyUser creation is deferred to Phase 2. These should be EMPTY in Phase 1.

| Entity | Count | Expected | Match |
|---|---|---|---|
| BrokerAgencyUser | ________ | 0 | [ ] Yes / [ ] No |

**If any BrokerAgencyUser records exist, this is unexpected in Phase 1.**

---

## PART 10: TROUBLESHOOTING APPENDIX

### Problem: Signup Creates Wrong Status

**Symptom:** BrokerAgencyProfile has `onboarding_status: "pending_approval"` instead of `"pending_profile_completion"`

**Root Cause File:** `src/functions/brokerSignup.js` line 91

**Verification:**
```javascript
// Should be:
status: 'pending_profile_completion'

// NOT:
status: 'pending_approval'
```

**Fix:** Update response JSON to use correct status enum value

**After fix:** Clear test data, re-run Section A

---

### Problem: Duplicate Signup Allowed When Should Be Blocked

**Symptom:** 2 BrokerAgencyProfile records exist for same email after duplicate submission

**Root Cause File:** `src/functions/brokerSignup.js` (no duplicate check)

**Verification:** Function doesn't check if email already exists before creating

**Expected Behavior:** Depends on business rules:
- **If should block:** Add email uniqueness check in brokerSignup function
- **If should allow:** Document this as design (re-submission allowed)

**Record in run log:** Which behavior is correct?

---

### Problem: BrokerAgencyUser Not Created

**Symptom:** BrokerAgencyUser entity is empty after broker signup

**Root Cause:** BrokerAgencyUser creation is deferred to Phase 2

**Verification:** This is expected in Phase 1. User invitation happens in Phase 2.

**Do not fix in Phase 1.** Continue to Phase 2 for this feature.

---

### Problem: Pending Broker Does Not Appear in Platform UI

**Symptom:** Broker list on `/command-center/broker-agencies` is empty despite BrokerAgencyProfile records existing

**Root Cause Files:**
1. `pages/PlatformBrokerAgencies.jsx` — Not querying database
2. Entity list query failed — Network error or permission issue

**Verification Steps:**
1. Check browser Network tab for failed requests
2. Check browser Console for errors
3. Verify user is logged in as admin
4. Verify BrokerAgencyProfile entity query permissions

**Fix:** Debug database query in page component

**After fix:** Hard refresh page (Ctrl+Shift+R)

---

### Problem: Approval Button Missing

**Symptom:** Broker detail drawer doesn't show "Review & Approve" button

**Root Cause Files:**
1. `components/broker/BrokerDetailDrawer.jsx` — Conditional rendering logic
2. Status value doesn't match condition check

**Verification:**
```javascript
// Should show button when:
broker.onboarding_status === 'pending_profile_completion'

// Check actual database value:
// Does BrokerAgencyProfile have onboarding_status: 'pending_profile_completion'?
```

**Fix:** Update conditional check in BrokerDetailDrawer

**After fix:** Close and re-open detail drawer

---

### Problem: Approval Creates Duplicate Relationship

**Symptom:** 2 BrokerPlatformRelationship records exist for same broker after approval

**Root Cause Files:**
1. `src/functions/approveBrokerProfile.js` — Missing idempotency check

**Verification:** Function calls `base44.asServiceRole.entities.BrokerPlatformRelationship.update()` without checking if record already exists

**Fix:** Add idempotency check:
```javascript
// Before creating relationship, check if one already exists
const existing = await base44.asServiceRole.entities.BrokerPlatformRelationship.filter({
  broker_agency_id: broker_agency_id
}, '', 1);

if (existing.length > 0) {
  // Update existing record
} else {
  // Create new record
}
```

**After fix:** Re-test Section F (Idempotency)

---

### Problem: Platform Route Accessible to Unauthorized Users

**Symptom:** Non-admin user can access `/command-center/broker-agencies` and see broker list

**Root Cause Files:**
1. `App.jsx` — Missing role check on route
2. `pages/PlatformBrokerAgencies.jsx` — No auth guard in component

**Verification:** Check App.jsx route definition for `/command-center/broker-agencies`
```javascript
// Should have conditional:
user?.role === 'admin' ? <PlatformBrokerAgencies /> : <PageNotFound />
```

**Fix:** Add access control to route OR add guard in component

**After fix:** Re-test Section C (Access Control)

---

### Problem: Hard Refresh Fails with 404

**Symptom:** Hard refresh (Ctrl+Shift+R) results in 404 error on `/broker-signup` or `/command-center/broker-agencies`

**Root Cause Files:**
1. `App.jsx` — Route not defined
2. `vite.config.js` — SPA fallback not configured (for production builds)

**Verification:**
```javascript
// App.jsx should have:
<Route path="/broker-signup" element={<BrokerSignup />} />
<Route path="/command-center/broker-agencies" element={...} />
```

**Fix:** Add missing routes to App.jsx

**After fix:** Hard refresh again (Ctrl+Shift+R)

---

### Problem: Service Role / Backend Permission Errors

**Symptom:** Function fails with "Unauthorized" or "Permission Denied"

**Root Cause Files:**
1. `src/functions/approveBrokerProfile.js` — Using wrong service level
2. Calling user-scoped method instead of service-role method

**Verification:** Function should use:
```javascript
// Correct:
const result = await base44.asServiceRole.entities.BrokerPlatformRelationship.update(...)

// Wrong:
const result = await base44.entities.BrokerPlatformRelationship.update(...)
```

**Fix:** Use `base44.asServiceRole` for admin operations

**After fix:** Re-test approval (Section E)

---

## PART 11: RUN LOG INSTRUCTIONS

### How to Record Results in the Run Log

**File Location:** `docs/PHASE_1_SMOKE_TEST_RUN_LOG.md`

**At the start of the file:**
1. Fill in today's date
2. Fill in your name and email (tester)
3. Fill in your role (should be "admin" or "platform_super_admin")
4. Fill in the environment (local, staging, or prod)
5. Generate a session ID: `SMOKE-PHASE1-[DATE]-[TIME]` (e.g., `SMOKE-PHASE1-20260512-143000`)

**For each test section:**
- Find the corresponding section in the run log
- For each test step (e.g., A.1, A.2, etc.):
  1. **Result:** Select [ ] PASS / [ ] FAIL / [ ] BLOCKED
  2. **Actual:** Record what actually happened (copy from this walkthrough notes)
  3. **Database Values:** Paste exact values from Base44 dashboard
  4. **Screenshots:** If UI is unclear, take screenshot and reference
  5. **Notes:** Any deviations from expected behavior

**Example Entry:**
```
### Section A.1 — Access Signup Form (Unauthenticated)
**Result:** [X] PASS / [ ] FAIL / [ ] BLOCKED
**Page Loads:** [X] Yes / [ ] No
**Page Title:** "Broker Agency Signup" (matches expected)
**No Login Required:** [X] Yes / [ ] No
**Notes:** Page loaded quickly, form displayed correctly
```

**At the end of the file:**
1. **Overall Result:** [ ] ALL PASS / [ ] PASS WITH FIXES / [ ] BLOCKED
2. **Issue Count:** ________ (critical/high/medium/low)
3. **Recommendation:** Should Phase 2 begin? [ ] Yes / [ ] No / [ ] After fixes
4. **Sign-off:** Your name, email, date, time

---

### What Counts as PASS

Each section passes if:
- ✅ All expected UI elements appear
- ✅ Expected database records are created with correct status
- ✅ Form accepts valid input without errors
- ✅ Approval modal opens and succeeds
- ✅ Database is updated after approval
- ✅ No console errors or unhandled exceptions

---

### What Counts as FAIL

Each section fails if:
- ❌ Expected UI elements missing
- ❌ Database records created with wrong status values
- ❌ Form rejects valid input
- ❌ Approval fails with error
- ❌ Database not updated after approval
- ❌ Console shows errors (check developer tools)

---

### What Counts as BLOCKED

Each section is blocked if:
- 🚫 Cannot access page due to auth/route issue
- 🚫 Prerequisites not met (e.g., no admin account)
- 🚫 Environment issue prevents test execution
- 🚫 Prior section failed blocking this section

---

### How to Retest After Fixes

If a section fails:
1. Note the issue and root cause file
2. Request code fix from development
3. Clear test data (delete records from Base44)
4. Re-run the affected section from the beginning
5. Record retest result with "BEFORE / AFTER" format:
   - BEFORE: [FAILURE DESCRIPTION]
   - FIX APPLIED: [FILE CHANGED]
   - AFTER: [X] PASS / [ ] STILL FAILS

---

## FINAL CHECKLIST

Before finalizing the run log:

- [ ] All 8 sections executed (A–H)
- [ ] Each section has PASS/FAIL/BLOCKED recorded
- [ ] Database verification completed for all brokers
- [ ] No duplicate records created
- [ ] Approval idempotency verified
- [ ] Access control verified for unauthorized users
- [ ] Hard refresh tested on both routes
- [ ] Any failures documented with root cause
- [ ] Run log filled completely
- [ ] Screenshots attached (if needed)
- [ ] Tester signature/email on run log

---

## Summary for Test Executor

**You are here:** Ready to execute Phase 1 smoke test manually

**What you will do:**
1. Create 2 broker agencies via `/broker-signup` form
2. Verify they appear in `/command-center/broker-agencies` (admin-only page)
3. Verify access control prevents unauthorized users
4. Approve the first broker
5. Verify database state before and after approval
6. Test idempotency (approve again, verify no duplicate created)
7. Test hard refresh on both routes
8. Record all results in the run log

**Expected duration:** ~60 minutes (one person, one environment)

**Success criteria:** All 8 sections PASS

**Next step:** After completion, review the run log and decide:
- [ ] All PASS → Phase 2 authorized
- [ ] PASS with fixes → Apply fixes, retest affected sections, then Phase 2
- [ ] BLOCKED → Resolve critical issues before Phase 2

**Do NOT start Phase 2** until Phase 1 smoke test is complete and documented.

---

**END OF WALKTHROUGH GUIDE**

Ready to execute. Open this guide alongside the run log and start with Section A.1.