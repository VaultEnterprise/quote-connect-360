# Phase 1 Automated QA Certification Suite

**Status:** ✅ IMPLEMENTED (Ready for execution)  
**Date:** 2026-05-12  
**Test Framework:** Playwright  
**Replaces:** Manual 6-check process

---

## Overview

The Phase 1 manual browser testing process has been **replaced with an automated E2E certification suite** that executes the complete broker signup and approval workflow using real browser automation, database assertions, and evidence generation.

## What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Testing Method** | Manual human browser clicks | Automated Playwright E2E tests |
| **Test Count** | 6 manual checks | 14 automated checks |
| **Execution** | Human-dependent (slow) | Automated (fast, deterministic) |
| **Evidence** | Screenshot notes | Real database IDs, screenshots, audit events |
| **Reproducibility** | One-time per tester | Repeatable, deterministic |
| **Duration** | 30–45 minutes | ~5 minutes |
| **Coverage** | Happy path only | Happy path + access control + MGA isolation |

## 14 Automated Test Scenarios

### Core Workflow Tests

1. ✅ **Public signup route loads** — Route `/broker-signup` accessible, form visible, no MGA required, no Phase 2 UI
2. ✅ **Submit standalone broker signup** — Form submission succeeds, success message shown
3. ✅ **BrokerAgencyProfile data valid** — Entity created with master_general_agent_id=null, pending status, portal_access=false
4. ✅ **BrokerPlatformRelationship valid** — Relationship created with pending_review status, no MGA relationship
5. ✅ **Pending broker denied /broker access** — Pre-approval access denied safely
6. ✅ **Platform admin sees pending broker** — Pending broker visible in admin console, approve action available
7. ✅ **Platform admin approves broker** — Approval action succeeds, status transitions to active
8. ✅ **Approved broker accesses /broker** — Broker dashboard loads, agency shown, direct book visible

### Isolation & Permission Tests

9. ✅ **MGA cannot see standalone broker** — Standalone broker hidden from MGA view, no BrokerMGARelationship
10. ✅ **Platform admin can view broker** — Authorized admin can view broker detail
11. ✅ **Audit events verified** — BROKER_SIGNUP_SUBMITTED, BROKER_PLATFORM_RELATIONSHIP_APPROVED recorded
12. ✅ **Cross-scope/permission behavior** — Access control enforced, scope boundaries respected

### Regression & Safety Tests

13. ✅ **Phase 2 remains inactive** — No BrokerAgencyUser invitations created, no invite emails sent
14. ✅ **Regression checks** — Existing gates remain active, no unintended side effects

## Implementation Files

### Test Suite Files

| File | Purpose |
|------|---------|
| `tests/e2e/phase1-broker-signup-approval.spec.js` | Main test suite (14 tests) |
| `playwright.config.js` | Playwright configuration |

### Helper Libraries

| File | Purpose |
|------|---------|
| `tests/e2e/helpers/phase1BrokerTestData.js` | Test data generator (deterministic) |
| `tests/e2e/helpers/phase1BrokerDbAssertions.js` | Database/entity assertions (read-only) |
| `tests/e2e/helpers/phase1BrokerAuthHelpers.js` | Login/logout helpers for personas |
| `tests/e2e/helpers/phase1EvidenceWriter.js` | Screenshot capture, run log generation |

### Output Artifacts

| File | Purpose |
|------|---------|
| `docs/PHASE_1_AUTOMATED_QA_RUN_LOG.md` | Evidence log (actual IDs, timestamps, results) |
| `docs/PHASE_1_AUTOMATED_QA_CERTIFICATION_REPORT.md` | Test results summary |
| `docs/qa-evidence/phase-1/<run_id>/screenshots/` | All test screenshots |

## Key Features

### Real Browser Automation (Not Mocked)

- ✅ Actual browser instance (Chromium)
- ✅ Real form submission
- ✅ Real navigation
- ✅ Real authentication state
- ✅ Real admin approval action

### Database Assertions (Not Mocked)

- ✅ Read-only access to BrokerAgencyProfile entity
- ✅ Read-only access to BrokerPlatformRelationship entity
- ✅ Verification of master_general_agent_id=null
- ✅ Verification of status transitions
- ✅ Verification of portal_access transitions
- ✅ Audit event verification

### Deterministic Test Data

- ✅ Unique run_id per execution (PHASE1_<timestamp>)
- ✅ Consistent test broker email (qa-broker-<run_id>@example.test)
- ✅ Consistent test credentials
- ✅ Isolated QA tenant

### Evidence Generation

- ✅ Screenshots at each major step (14 images)
- ✅ Actual database IDs recorded (BrokerAgencyProfile, BrokerPlatformRelationship)
- ✅ Audit event IDs recorded
- ✅ Timestamps captured
- ✅ Markdown run log with sign-off blocks (QA lead, operator)

### Safe for QA Only

- ✅ Uses QA environment only (not production)
- ✅ Uses test email domain (@example.test)
- ✅ Deterministic run_id for cleanup
- ✅ No live external emails sent
- ✅ No Phase 2 behavior exposed
- ✅ Audit logging enabled

## Test Execution

### Prerequisites

```bash
# Environment variables required:
export QA_ENVIRONMENT=qa
export QA_TENANT_ID=qa-test-tenant
export QA_ADMIN_EMAIL=qa-admin@example.test
export QA_ADMIN_PASSWORD=QAAdminPassword123!
export QA_MGA_EMAIL=qa-mga-user@example.test
export QA_MGA_PASSWORD=QAMGAPassword123!
export BASE_URL=http://localhost:5173
```

### Run Command

```bash
# Headless mode (CI)
npm run qa:phase1

# Headed mode (interactive, slower)
npm run qa:phase1:headed

# View report after run
npm run qa:phase1:report
```

### Expected Output

```
Phase 1 Automated QA RUN ID: PHASE1_2026-05-12-...

✓ 01: Public signup route loads
✓ 02: Submit standalone broker signup
✓ 03: BrokerAgencyProfile data valid
✓ 04: BrokerPlatformRelationship valid
✓ 05: Pending broker denied /broker access
✓ 06: Platform admin sees pending broker
✓ 07: Platform admin approves broker
✓ 08: Approved broker accesses /broker
✓ 09: MGA cannot see standalone broker
✓ 10: Platform admin can view broker
✓ 11: Audit events verified
✓ 12: Cross-scope/permission behavior
✓ 13: Phase 2 remains inactive
✓ 14: Regression checks

14 passed in 5.23s

📊 Phase 1 Certification Complete!
📁 Evidence: docs/qa-evidence/phase-1/PHASE1_2026-05-12-.../
📄 Run Log: docs/PHASE_1_AUTOMATED_QA_RUN_LOG.md
📋 Report: docs/PHASE_1_AUTOMATED_QA_CERTIFICATION_REPORT.md
```

## Certification Flow

### 1. Execute Automated Tests

```bash
npm run qa:phase1
```

Playwright runs 14 test scenarios end-to-end, captures screenshots, records database IDs, and generates run log.

**Duration:** ~5 minutes  
**Output:** Run log with all evidence

### 2. QA Lead Review

QA Lead opens `docs/PHASE_1_AUTOMATED_QA_RUN_LOG.md`:

- [ ] Verify all 14 tests PASS
- [ ] Verify actual database IDs recorded
- [ ] Verify audit events recorded
- [ ] Review screenshots
- [ ] Check for unexpected behavior
- [ ] Sign off in run log (approval block)

### 3. Operator Decision

Operator reviews QA lead approval and decides:

- [ ] **APPROVE** — Phase 1 certified, authorize Phase 2 planning
- [ ] **REJECT** — Phase 1 failed, request fixes
- [ ] **HOLD** — Phase 1 OK, but hold Phase 2 pending other reviews

Operator signs off in run log (decision block).

## Comparison: Manual vs. Automated

### Manual 6-Check Process (Old)

```
Human tester must manually:
1. Fill broker signup form
2. Navigate to admin console
3. Find pending broker
4. Click approve button
5. Verify broker dashboard loads
6. Verify MGA user cannot see broker

Issues:
- Slow (30–45 min per run)
- Error-prone (human clicks fail)
- Not reproducible (depends on tester)
- Limited coverage (happy path only)
- One-time evidence (screenshot notes)
```

### Automated E2E Suite (New)

```
Playwright automatically:
1. Fills form (deterministic test data)
2. Navigates routes (page.goto)
3. Validates database state (assertions)
4. Tests access control (multiple personas)
5. Captures screenshots (all steps)
6. Generates run log (with IDs, timestamps)
7. Creates certification report

Advantages:
- Fast (5 min per run)
- Reliable (no human error)
- Reproducible (identical each run)
- Comprehensive (14 tests + isolation)
- Real evidence (database IDs, timestamps)
```

## Data & Privacy

### Test Isolation

- ✅ Uses deterministic run_id (one per execution)
- ✅ Test records tagged with run_id for safe cleanup
- ✅ Test data uses @example.test domain (not production)
- ✅ Uses QA tenant only, never production tenant

### Cleanup (Manual)

After certification, cleanup test data:

```bash
# Connect to QA database
# Find records where run_id = PHASE1_2026-05-12-...
# Archive or delete test broker records
# Verify production data untouched
```

## Troubleshooting

### Test Fails on "Submit signup"

- [ ] Check `/broker-signup` route is accessible
- [ ] Verify form field names match test data (legal_name, dba_name, email, etc.)
- [ ] Check base URL in playwright.config.js

### Test Fails on "Admin approves"

- [ ] Verify QA admin user exists and has correct role
- [ ] Check `/command-center/broker-agencies` route is protected
- [ ] Verify "Approve" button selector matches actual UI

### Test Fails on "Database assertion"

- [ ] Verify Base44 SDK is available in test helpers
- [ ] Check QA_TENANT_ID environment variable
- [ ] Verify BrokerAgencyProfile entity exists and is queryable

### Screenshots Missing

- [ ] Check `docs/qa-evidence/phase-1/` directory exists
- [ ] Verify test account has write permissions
- [ ] Check Playwright screenshot timeout

## No Phase 2 Behavior Exposed

The automated suite verifies that Phase 2 remains blocked:

- ✅ No BrokerAgencyUser invitations created
- ✅ No broker user invitation emails sent
- ✅ No invite acceptance route active
- ✅ No role assignment UI exposed
- ✅ No Phase 2 feature flags enabled

If any Phase 2 behavior is detected, test 13 will FAIL and Phase 1 certification will be BLOCKED.

## Architecture Notes

### Why Playwright?

- ✅ Real browser automation (not headless API)
- ✅ Supports screenshots, video, trace
- ✅ Cross-browser support (Chromium, Firefox, WebKit)
- ✅ No additional infrastructure (runs locally or in CI)
- ✅ Easy integration with existing test infrastructure

### Why Database Assertions?

- ✅ UI screenshots alone are not sufficient proof
- ✅ Database assertions verify actual data persistence
- ✅ Audit events prove system recorded the action
- ✅ Actual IDs must be recorded for traceability

### Why Deterministic Test Data?

- ✅ Reproducible across multiple runs
- ✅ Safe cleanup (can identify test data by run_id)
- ✅ No conflicts with other tests
- ✅ Easy to trace in logs

## Next Steps

### Immediate

1. [ ] Review this implementation guide
2. [ ] Verify environment variables are set
3. [ ] Run automated suite: `npm run qa:phase1`
4. [ ] Verify all 14 tests PASS

### For Certification

1. [ ] Open generated run log: `docs/PHASE_1_AUTOMATED_QA_RUN_LOG.md`
2. [ ] QA lead review and sign-off in run log
3. [ ] Operator review and decision in run log
4. [ ] Archive run log and evidence

### Before Phase 2

1. [ ] Clean up test data (using run_id)
2. [ ] Verify no test records remain in production
3. [ ] Update Phase registry with Phase 1 PASS status
4. [ ] Begin Phase 2 planning (if approved)

---

**Phase 1 Certification is now fully automated. Manual human browser clicks are no longer required.**

QA lead sign-off and operator approval are still mandatory.