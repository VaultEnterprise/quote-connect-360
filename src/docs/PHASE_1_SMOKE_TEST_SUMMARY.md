# Phase 1 Broker Signup and Approval — Testing Strategy

## Overview

Phase 1 implementation is **COMPLETE** but **NOT YET CERTIFIED**.

A hybrid testing approach has been implemented:
- **8 automated checks** run via admin QA harness (`/command-center/qa/phase-1-broker-smoke-test`)
- **6 manual checks** remain (browser/auth interaction cannot be fully automated)

## Phase 1 Expected Behaviors

### Duplicate Signup Prevention

**STANDARDIZED FOR PHASE 1:**

Duplicate broker signup by primary contact email **MUST BE BLOCKED**.

When `brokerSignup` is called with an email that already exists:
```json
{
  "success": false,
  "error_code": "DUPLICATE_BROKER_SIGNUP",
  "message": "A broker agency signup already exists for this email."
}
```

No duplicate BrokerAgencyProfile or BrokerPlatformRelationship records are created.

### BrokerAgencyUser Creation

**PHASE 1 DEFERRED:**

BrokerAgencyUser creation is **NOT** part of Phase 1. The entities will be empty.

User invitation and role assignment happens in **Phase 2**.

### Expected Status Values

**After Signup:**
```
BrokerAgencyProfile:
  onboarding_status: "pending_profile_completion"
  portal_access_enabled: false
  master_general_agent_id: null

BrokerPlatformRelationship:
  status: "invited"
  approval_status: "pending"
```

**After Approval:**
```
BrokerAgencyProfile:
  onboarding_status: "active"
  portal_access_enabled: true
  approved_by_user_email: "[admin email]"
  approved_at: "[timestamp]"

BrokerPlatformRelationship:
  status: "active"
  approval_status: "approved"
```

## How to Test Phase 1

### Step 1: Run Automated Smoke Test

**Access:** `/command-center/qa/phase-1-broker-smoke-test` (admin only)

**What it does:**
1. Seeds Broker 1 (Acme Benefits) via `brokerSignup`
2. Validates pending state
3. Attempts duplicate signup and validates it's blocked
4. Seeds Broker 2 (Premier Health)
5. Approves Broker 1 via `approveBrokerProfile`
6. Validates active state
7. Re-approves Broker 1 and validates no duplicate created
8. Validates Broker 2 remains pending

**Expected result:** All 8 steps PASS

**Time:** ~2-3 minutes

### Step 2: Complete Manual Checks

Manual checks still required (browser/auth automation limitations):

- [ ] Hard refresh `/broker-signup` loads fresh form
- [ ] Hard refresh `/command-center/broker-agencies` as admin loads broker list
- [ ] Unauthenticated user cannot access `/command-center/broker-agencies` (404/Access Denied)
- [ ] Non-admin user cannot access `/command-center/broker-agencies` (404/Access Denied)
- [ ] Approved broker can hard refresh `/broker` and see dashboard
- [ ] Approval modal UI displays broker details correctly

**Time:** ~10-15 minutes

### Step 3: Generate Run Log

Click "Copy Markdown Run Log" on QA page to get structured markdown.

Paste into `docs/PHASE_1_SMOKE_TEST_RUN_LOG.md`

### Step 4: QA Lead Sign-off

QA lead fills in review section:
- Confirms all automated steps PASS
- Confirms manual checks completed
- Signs off with name, date, notes

### Step 5: Operator Approval

Operator decides:
- **ACCEPT PHASE 1 PASS** → Authorize Phase 2 design
- **HOLD** → Don't proceed
- **REQUEST FIXES** → Return for correction

## Failure Handling

If any automated step **FAIL**s:

1. **Read the Details column** in results table
2. **Identify root cause** (e.g., duplicate not blocked, status wrong, idempotency failed)
3. **Fix the backend function** that failed
4. **Run cleanup** to delete test data (by run ID)
5. **Re-run smoke test** via QA page
6. **Paste new results** into run log
7. **Retest only failed steps** if rerun succeeds

## Files Created/Modified

**New Backend Functions:**
- `src/functions/runPhase1BrokerSmokeTest.js` — Orchestrator
- `src/functions/cleanupPhase1BrokerSmokeTestData.js` — Cleanup

**Updated Backend Functions:**
- `src/functions/brokerSignup.js` — Added duplicate prevention

**New Frontend:**
- `pages/Phase1BrokerSmokeTest.jsx` — QA harness UI

**New Libraries:**
- `src/lib/broker/phase1SmokeTestFixtures.js` — Test data
- `src/lib/broker/phase1SmokeTestAssertions.js` — Assertion helpers
- `src/lib/broker/phase1SmokeTestRunLog.js` — Run log generator

**Route Added:**
- `/command-center/qa/phase-1-broker-smoke-test` (admin only)

**Documentation:**
- `docs/PHASE_1_AUTOMATED_SMOKE_TEST.md` — Full automation guide
- `docs/PHASE_1_SMOKE_TEST_SUMMARY.md` — This file

## Phase 1 Certification Checklist

Phase 1 can be marked **CERTIFIED PASS** only if:

- [ ] Automated smoke test: **All 8 steps PASS**
- [ ] Manual checks: **All 6 checks PASS**
- [ ] Run log: **Complete with actual database IDs**
- [ ] QA lead: **Reviewed and signed off**
- [ ] Operator: **Approved Phase 2 authorization**

## Phase 2 Remains Blocked

Until Phase 1 is certified PASS + QA sign-off + operator approval:

- ❌ No BrokerAgencyUser creation
- ❌ No broker user invitation flow
- ❌ No invitation emails sent
- ❌ No Phase 2 feature flags enabled
- ❌ No "Invite Broker User" UI exposed

## Next Steps

1. ✅ Navigate to `/command-center/qa/phase-1-broker-smoke-test`
2. ✅ Click "Run Smoke Test"
3. ✅ Review results (expect all PASS)
4. ✅ Complete 6 manual browser checks
5. ✅ Copy markdown run log and paste into docs/PHASE_1_SMOKE_TEST_RUN_LOG.md
6. ✅ Have QA lead review and sign off
7. ✅ Have operator approve Phase 2 authorization
8. ✅ Run cleanup to delete test data