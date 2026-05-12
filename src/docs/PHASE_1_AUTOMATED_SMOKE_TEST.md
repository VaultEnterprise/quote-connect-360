# Phase 1 Automated Smoke Test

## Overview

Phase 1 broker signup and approval has been converted from a manual walkthrough into an **automated admin-only QA harness**. This document describes how to run, interpret, and cleanup the automated smoke test.

## What Is Automated

The following checks run automatically in the harness:

1. **Broker 1 Seeding** — Create Acme Benefits test broker via `brokerSignup`
2. **Broker 1 Profile Validation** — Verify pending state, null MGA scope, false portal access
3. **Duplicate Prevention** — Attempt duplicate Broker 1 signup and validate it is blocked
4. **Broker 2 Seeding** — Create Premier Health test broker via `brokerSignup`
5. **Broker 1 Approval** — Approve Broker 1 via `approveBrokerProfile`
6. **Broker 1 Active State** — Verify active state, true portal access, approved_by_user_email present
7. **Approval Idempotency** — Re-approve Broker 1 and validate no duplicate relationship created
8. **Broker 2 Remains Pending** — Verify Broker 2 is still pending after approving Broker 1

**Total automated steps:** 8  
**Success criteria:** All steps PASS, no FAIL or BLOCKED

## What Remains Manual

These checks require human browser/auth interaction:

- Hard refresh `/broker-signup` and verify public form loads
- Hard refresh `/command-center/broker-agencies` as admin and verify list renders
- Attempt `/broker-signup` as anonymous user and verify public access works
- Attempt `/command-center/broker-agencies` as non-admin user and verify 403/404
- Approved Broker 1: hard refresh `/broker` and verify broker dashboard loads
- Visual verification of broker approval UI in admin dashboard

## How to Run the Automated Smoke Test

### 1. Navigate to QA Page

Admin users only:

```
/command-center/qa/phase-1-broker-smoke-test
```

### 2. Click "Run Smoke Test"

- A unique `runId` is generated: `PHASE1-YYYYMMDD-HHMMSS`
- The harness creates two test brokers
- All 8 automated steps execute
- Results are displayed in a table
- Manual checks remaining are listed

### 3. Interpret Results

**All PASS:** ✅ All automated steps passed. Proceed to manual checks.

**One or more FAIL:** ❌ A defect was found. See "Details" column for the issue. Fix the defect, re-run, and retest.

**BLOCKED:** A step could not continue (rare). Check logs for infrastructure issues.

### 4. Copy the Markdown Run Log

Click "Copy Markdown Run Log" to copy a structured markdown summary. Paste this into:

```
docs/PHASE_1_SMOKE_TEST_RUN_LOG.md
```

## Test Data and Uniqueness

Test data is created with a unique runId to allow multiple test runs:

**Broker 1 (Acme Benefits):**
- Email: `john.smith+phase1-[runId]@broker.local`
- Legal Name: `Acme Benefits Consulting LLC [runId]`

**Broker 2 (Premier Health):**
- Email: `jane.doe+phase1-[runId]@broker.local`
- Legal Name: `Premier Health Solutions Inc [runId]`

Records are marked with:
- `is_smoke_test: true`
- `smoke_test_run_id: [runId]`
- `smoke_test_source: phase1_automated_smoke_test`

This allows easy filtering and cleanup.

## Expected Status Values

### After Signup (Before Approval)

**BrokerAgencyProfile:**
```
onboarding_status: "pending_profile_completion"
portal_access_enabled: false
master_general_agent_id: null  ← Must be null (no MGA)
```

**BrokerPlatformRelationship:**
```
status: "invited"
approval_status: "pending"
relationship_type: "direct_platform"
```

### After Approval

**BrokerAgencyProfile:**
```
onboarding_status: "active"
portal_access_enabled: true
approved_by_user_email: "[admin email]"
approved_at: "[timestamp]"
```

**BrokerPlatformRelationship:**
```
status: "active"
approval_status: "approved"
approved_by_user_email: "[admin email]"
approved_at: "[timestamp]"
```

## Duplicate Prevention

**Expected Behavior:** Duplicate broker signup should be blocked.

When `brokerSignup` is called with the same `primary_contact_email` as an existing broker:

```json
{
  "success": false,
  "error_code": "DUPLICATE_BROKER_SIGNUP",
  "message": "A broker agency signup already exists for this email."
}
```

The automated test validates this by:
1. Creating Broker 1
2. Attempting to create Broker 1 again with the same email
3. Asserting the duplicate attempt returns `error_code: DUPLICATE_BROKER_SIGNUP`
4. Asserting no duplicate profile was created

**No duplicate BrokerAgencyProfile:** The same email will only have one profile record.  
**No duplicate BrokerPlatformRelationship:** Approving does not create multiple relationships.

## Approval Idempotency

**Expected Behavior:** Approving an already-active broker should not create a duplicate relationship.

The automated test validates this by:
1. Approving Broker 1 (creates relationship)
2. Counting relationships: `count_before = 1`
3. Approving Broker 1 again
4. Counting relationships: `count_after = 1`
5. Asserting `count_before === count_after`

If a duplicate relationship was accidentally created, `count_after` would be 2, causing the test to FAIL.

## Cleanup Test Data

After testing, delete test brokers using the cleanup tool:

### Option 1: Cleanup by Run ID

1. Copy the runId from test results (e.g., `PHASE1-20260512-143022`)
2. Enter it in the "Run ID" field
3. Check "Dry run" to preview what will be deleted
4. Click "Preview Cleanup"
5. Review the summary (profiles, relationships, users to delete)
6. Uncheck "Dry run"
7. Click "Execute Cleanup"

### Option 2: Cleanup by Email Pattern

1. Select "By Email Pattern"
2. Click "Preview Cleanup" to see all test brokers matching `@broker.local` or `.example.test`
3. Uncheck "Dry run" to execute
4. Click "Execute Cleanup"

### Safety Rules

- Only deletes records marked `is_smoke_test: true`
- Only deletes emails matching `@broker.local` or `.example.test` patterns
- Dry run is enabled by default (preview-only)
- Never deletes production data

## Interpreting Test Failures

If a test step **FAIL**s:

1. **Read the Details:** The "Details" column explains what was expected vs. actual.
2. **Identify the Root Cause:**
   - Status mismatch? Check the backend function or contract logic.
   - Duplicate not blocked? Check `brokerSignup` validation.
   - Approval idempotency? Check `approveBrokerProfile` relationship creation logic.
3. **Fix the Issue:** Make minimal changes to the backend function/contract.
4. **Cleanup Test Data:** Run a cleanup to remove the failed test's data.
5. **Re-run the Test:** Click "Run Smoke Test" again.
6. **Update the Run Log:** Paste the new results into the run log documentation.

## Phase 1 PASS Criteria

Phase 1 can be marked **PASS** only if **ALL** of the following are true:

- [ ] All 8 automated steps show **PASS** status
- [ ] Actual database IDs for both brokers are recorded
- [ ] All manual checks are completed and verified
- [ ] QA lead has reviewed the complete run log and approved
- [ ] No defects remain open

## After Phase 1 PASS

Once Phase 1 is certified PASS and QA-approved:

1. **Complete the run log** in `docs/PHASE_1_SMOKE_TEST_RUN_LOG.md`
2. **QA lead signs off** with name, date, and notes
3. **Operator reviews** and decides: ACCEPT, HOLD, or REQUEST FIXES
4. **If ACCEPT:** Operator approves Phase 2 authorization

## Phase 2 Remains Blocked

Until Phase 1 PASS + QA sign-off + operator approval:

- ❌ No BrokerAgencyUser creation
- ❌ No broker user invitation flow
- ❌ No broker user invitation emails
- ❌ No Phase 2 feature flags enabled
- ❌ No "Invite Broker User" UI exposed

## Troubleshooting

### "Admin access required"

Only admins can access `/command-center/qa/phase-1-broker-smoke-test`.  
Contact a platform admin.

### "Run Smoke Test" button does nothing

Check the browser console for errors. The function may have failed to invoke.

### Test step fails with "Profile not found"

The `brokerSignup` function may not be returning the correct profile ID.  
Check the `brokerSignup` function logs.

### Cleanup doesn't find test data

Verify:
- Run ID is correct (case-sensitive)
- Test brokers were created (visible in database)
- Email pattern is `@broker.local` or `.example.test`

### Phase 2 features are visible

Verify Phase 2 feature flags are disabled in the system config.  
Do not enable Phase 2 before Phase 1 PASS + QA sign-off + operator approval.

## Files Involved

- **Backend functions:**
  - `src/functions/brokerSignup.js` — Signup with duplicate prevention
  - `src/functions/approveBrokerProfile.js` — Approval logic
  - `src/functions/runPhase1BrokerSmokeTest.js` — Automated orchestrator
  - `src/functions/cleanupPhase1BrokerSmokeTestData.js` — Cleanup logic

- **Frontend:**
  - `pages/Phase1BrokerSmokeTest.jsx` — QA harness UI
  - `src/lib/broker/phase1SmokeTestFixtures.js` — Test data generator
  - `src/lib/broker/phase1SmokeTestRunLog.js` — Run log markdown generator

- **Entities:**
  - `BrokerAgencyProfile`
  - `BrokerPlatformRelationship`

## Next Steps

1. ✅ **Run automated smoke test** via QA page
2. ✅ **Review results** — all steps should PASS
3. ✅ **Complete manual checks** — browser and auth verification
4. ✅ **Generate run log** — copy markdown from QA page
5. ✅ **QA lead review** — sign off in run log
6. ✅ **Operator approval** — authorize Phase 2 design/work order
7. ✅ **Cleanup test data** — before committing to production