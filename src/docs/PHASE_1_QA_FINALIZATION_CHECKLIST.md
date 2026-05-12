# Phase 1 QA Finalization Checklist

**Date:** 2026-05-12  
**Operator:** [NAME]  
**Environment:** [LOCAL/STAGING/PROD]

---

## ✅ Pre-Execution Verification

### Documentation Reconciliation
- [ ] `PHASE_1_SMOKE_TEST_CHECKLIST.md` — Updated to reflect hybrid model (8 auto + 6 manual)
- [ ] `PHASE_1_READINESS_SUMMARY.md` — Updated to reference automation
- [ ] `PHASE_1_AUTOMATED_SMOKE_TEST.md` — Complete automation guide available
- [ ] `PHASE_1_SMOKE_TEST_SUMMARY.md` — Testing strategy documented
- [ ] `PHASE_1_AUTOMATION_IMPLEMENTATION_SUMMARY.md` — Implementation details recorded
- [ ] **Stale expectations removed:**
  - [ ] No ambiguity remaining about duplicate behavior (now: BLOCKED)
  - [ ] No confusion about BrokerAgencyUser (now: Phase 2 deferred)
  - [ ] No reference to "full 60-minute manual walkthrough" (now: 25–35 min hybrid)

### Routes Verified
- [ ] `/broker-signup` — PUBLIC (unauthenticated access allowed)
  - [ ] Route defined in App.jsx
  - [ ] No auth required
  - [ ] Hard refresh works
- [ ] `/command-center/broker-agencies` — ADMIN-ONLY
  - [ ] Route defined in App.jsx
  - [ ] Protected: `user?.role === 'admin' || user?.role === 'platform_super_admin'`
  - [ ] Returns PageNotFound for unauthorized users
  - [ ] Hard refresh works (auth state preserved)
- [ ] `/command-center/qa/phase-1-broker-smoke-test` — ADMIN-ONLY
  - [ ] Route defined in App.jsx
  - [ ] Protected: same as `/command-center/broker-agencies`
  - [ ] Phase1BrokerSmokeTest component imported
  - [ ] Accessible to admin/platform_super_admin only

### Backend Functions Ready
- [ ] `brokerSignup` — Duplicate prevention implemented
  - [ ] Returns `error_code: DUPLICATE_BROKER_SIGNUP` on duplicate
  - [ ] No profile/relationship created on duplicate
  - [ ] Service-role calls used appropriately
- [ ] `approveBrokerProfile` — Idempotency implemented
  - [ ] Admin-only enforcement (403 on non-admin)
  - [ ] Does not create duplicate BrokerPlatformRelationship
  - [ ] Updates existing relationship if present
- [ ] `runPhase1BrokerSmokeTest` — Orchestrator ready
  - [ ] 8-step automation with structured results
  - [ ] Returns overall_status, step results, database IDs
  - [ ] Generates unique runId for test isolation
  - [ ] Calls actual backend functions (not mocked)
- [ ] `cleanupPhase1BrokerSmokeTestData` — Cleanup ready
  - [ ] Admin-only access
  - [ ] Dry-run mode (preview-only default)
  - [ ] Only targets smoke-test records
  - [ ] Safety rules enforced (@broker.local, .example.test)

---

## ✅ Automated Smoke Test Execution

**Expected Duration:** 2–3 minutes

### Execute Test
- [ ] **Time Started:** ________________
- [ ] Navigate to `/command-center/qa/phase-1-broker-smoke-test` (as admin)
- [ ] Click "Run Smoke Test" button
- [ ] Wait for automated execution to complete

### Verify Results
- [ ] **Overall Status:** [ ] PASS / [ ] FAIL
- [ ] **Run ID Generated:** PHASE1-________________
- [ ] **All 8 Steps Visible:**
  1. [ ] Step 1: Broker 1 seeded — [ ] PASS / [ ] FAIL
  2. [ ] Step 2: Broker 1 validated pending — [ ] PASS / [ ] FAIL
  3. [ ] Step 3: Duplicate blocked — [ ] PASS / [ ] FAIL
  4. [ ] Step 4: Broker 2 seeded — [ ] PASS / [ ] FAIL
  5. [ ] Step 5: Broker 1 approved — [ ] PASS / [ ] FAIL
  6. [ ] Step 6: Broker 1 active — [ ] PASS / [ ] FAIL
  7. [ ] Step 7: Idempotency verified — [ ] PASS / [ ] FAIL
  8. [ ] Step 8: Broker 2 remains pending — [ ] PASS / [ ] FAIL

### Record Critical Data
- [ ] **Run ID:** PHASE1-________-________ (copy for cleanup)
- [ ] **Broker 1 Profile ID:** ________________
- [ ] **Broker 1 Email:** john.smith+phase1-[runId]@broker.local
- [ ] **Broker 2 Profile ID:** ________________
- [ ] **Broker 2 Email:** jane.doe+phase1-[runId]@broker.local
- [ ] **Test Start Time:** ________________
- [ ] **Test End Time:** ________________

**If any step FAILS:**
- [ ] Record error details from step row
- [ ] Stop execution
- [ ] Do NOT proceed to manual checks
- [ ] Escalate for debugging

---

## ✅ Manual Checks Execution

**Expected Duration:** 10–15 minutes  
**Executor:** QA Lead or Tester

### M.1 Hard Refresh `/broker-signup`
- [ ] Navigate to `/broker-signup`
- [ ] Press Ctrl+Shift+R (hard refresh)
- [ ] **Expected:** Fresh form loads, no console errors
- [ ] **Result:** [ ] PASS / [ ] FAIL

### M.2 Hard Refresh `/command-center/broker-agencies` (as admin)
- [ ] Ensure logged in as admin
- [ ] Navigate to `/command-center/broker-agencies`
- [ ] Press Ctrl+Shift+R (hard refresh)
- [ ] **Expected:** Broker list loads with automated test data
- [ ] **Result:** [ ] PASS / [ ] FAIL

### M.3 Access Control: Deny Non-Admin
- [ ] Log out OR open incognito window
- [ ] Navigate to `/command-center/broker-agencies`
- [ ] **Expected:** 404 PageNotFound or Access Denied
- [ ] **Expected:** No broker data visible
- [ ] **Result:** [ ] PASS / [ ] FAIL

### M.4 Access Control: Deny Logged-Out User
- [ ] While logged out, try to access `/command-center/qa/phase-1-broker-smoke-test`
- [ ] **Expected:** 404 PageNotFound or redirect to login
- [ ] **Expected:** Cannot execute test
- [ ] **Result:** [ ] PASS / [ ] FAIL

### M.5 Verify Test Brokers Display Correctly
- [ ] Log back in as admin
- [ ] Navigate to `/command-center/broker-agencies`
- [ ] **Expected:**
  - [ ] Broker 1 (Acme Benefits) visible with status "active" (approved by automation)
  - [ ] Broker 2 (Premier Health) visible with status "pending_profile_completion"
- [ ] **Result:** [ ] PASS / [ ] FAIL

### M.6 Verify QA Harness UI and Controls
- [ ] Navigate to `/command-center/qa/phase-1-broker-smoke-test`
- [ ] **Expected:**
  - [ ] Page loads (admin user)
  - [ ] "Run Smoke Test" button visible
  - [ ] Results table renders
  - [ ] "Copy Markdown Run Log" button visible
  - [ ] Cleanup section with dry-run checkbox visible
- [ ] **Result:** [ ] PASS / [ ] FAIL

---

## ✅ Database State Verification

### Broker 1 (Automated Approval)
- [ ] Base44 → Entities → BrokerAgencyProfile
- [ ] Search for Broker 1 email (john.smith+phase1-[runId]@broker.local)
- [ ] **Verify fields:**
  - [ ] `onboarding_status`: `active` ✅
  - [ ] `portal_access_enabled`: `true` ✅
  - [ ] `approved_by_user_email`: [admin email from automated test]
  - [ ] `approved_at`: [timestamp]
- [ ] **Result:** [ ] PASS / [ ] FAIL

### Broker 1 Relationship (Automated Approval)
- [ ] Base44 → Entities → BrokerPlatformRelationship
- [ ] Filter by broker_agency_id from Broker 1
- [ ] **Verify fields:**
  - [ ] `status`: `active` ✅
  - [ ] `approval_status`: `approved` ✅
  - [ ] **Count:** Exactly 1 record (idempotency verified)
- [ ] **Result:** [ ] PASS / [ ] FAIL

### Broker 2 (Remains Pending)
- [ ] Base44 → Entities → BrokerAgencyProfile
- [ ] Search for Broker 2 email (jane.doe+phase1-[runId]@broker.local)
- [ ] **Verify fields:**
  - [ ] `onboarding_status`: `pending_profile_completion` ✅
  - [ ] `portal_access_enabled`: `false` ✅
- [ ] **Result:** [ ] PASS / [ ] FAIL

### BrokerAgencyUser (Must Be Empty)
- [ ] Base44 → Entities → BrokerAgencyUser
- [ ] **Verify:** No records for automated test brokers
  - [ ] Count should be 0 ✅ (deferred to Phase 2)
- [ ] **Result:** [ ] PASS / [ ] FAIL

---

## ✅ Generate Run Log

### Run Log Generation
- [ ] On `/command-center/qa/phase-1-broker-smoke-test`, find "Copy Markdown Run Log" button
- [ ] Click button to copy markdown
- [ ] Paste into `docs/PHASE_1_SMOKE_TEST_RUN_LOG.md`

### Run Log Verification
- [ ] Run ID present
- [ ] Run start/end times recorded
- [ ] Admin/tester email recorded
- [ ] All 8 automated steps documented with PASS/FAIL status
- [ ] Manual check results documented (M.1–M.6)
- [ ] Test broker emails recorded
- [ ] Database IDs recorded (Profile IDs, Relationship IDs)
- [ ] Overall status clear (PASS or FAIL + reason)

---

## ✅ Cleanup Test Data

### Dry Run (Preview-Only)
- [ ] Return to `/command-center/qa/phase-1-broker-smoke-test`
- [ ] Enter Run ID from automated test
- [ ] Check "Dry run" checkbox
- [ ] Click "Preview Cleanup"
- [ ] **Expected:** Shows records to be deleted
  - [ ] 2 BrokerAgencyProfile records (Brokers 1 & 2)
  - [ ] 2 BrokerPlatformRelationship records
  - [ ] 0 BrokerAgencyUser records
- [ ] **Verify:** Only smoke-test records targeted (is_smoke_test: true)
- [ ] **Result:** [ ] PASS / [ ] FAIL

### Actual Cleanup
- [ ] Uncheck "Dry run" checkbox
- [ ] Click "Execute Cleanup"
- [ ] **Expected:** Records deleted
  - [ ] Total records deleted count shown
  - [ ] Deletion confirmed
- [ ] **Manual Verification:**
  - [ ] Base44 → BrokerAgencyProfile: No test broker emails found
  - [ ] Base44 → BrokerPlatformRelationship: No test relationships remain
- [ ] **Result:** [ ] PASS / [ ] FAIL

---

## ✅ Final QA Sign-Off

### QA Lead Review
- [ ] **Reviewed by:** ________________
- [ ] **Date/Time:** ________________
- [ ] **Automated smoke test:** [ ] ALL PASS
- [ ] **Manual checks:** [ ] ALL PASS
- [ ] **Database states:** [ ] Verified correct
- [ ] **Access control:** [ ] Properly enforced
- [ ] **Routes:** [ ] Function correctly
- [ ] **Cleanup:** [ ] Test data safely removed
- [ ] **No critical or high severity issues:** [ ] Confirmed

**QA Lead Sign-Off:**
- [ ] **Cleared for Phase 2:** YES / NO
- [ ] **Comments:** ____________________________________________________________

---

## ✅ Operator Approval Decision

### Final Gate
- [ ] **Overall Automated Status:** PASS / FAIL
- [ ] **Overall Manual Status:** PASS / FAIL
- [ ] **Critical/High Issues:** 0 remaining
- [ ] **Run Log Complete:** YES / NO
- [ ] **QA Lead Sign-Off:** YES / NO

### Operator Decision
- [ ] **ACCEPT Phase 1 PASS** → Authorize Phase 2 design
- [ ] **REQUEST FIXES** → Specify issues below
- [ ] **HOLD** → Specify reason below

**Decision Rationale:**
____________________________________________________________________________
____________________________________________________________________________

**Approved by (Operator):** ________________  
**Date/Time:** ________________  
**Email:** ________________

---

## SUMMARY

| Item | Status |
|---|---|
| Documentation Reconciled | [ ] YES |
| Routes Verified | [ ] YES |
| Automated Test Executed | [ ] PASS |
| Manual Checks Completed | [ ] PASS |
| Database States Verified | [ ] CORRECT |
| Run Log Generated | [ ] YES |
| Cleanup Executed | [ ] YES |
| QA Lead Sign-Off | [ ] APPROVED |
| Operator Approval | [ ] APPROVED |
| **Phase 1 READY FOR PHASE 2** | [ ] YES |

---

**Phase 1 QA Finalization Status:** [ ] ✅ COMPLETE / [ ] ❌ BLOCKED

**If COMPLETE:** Phase 2 authorization may proceed  
**If BLOCKED:** Document blockers and return to development

---

**End of Phase 1 QA Finalization Checklist**