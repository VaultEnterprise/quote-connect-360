# Phase 7A-1.3 Duplicate Detection Amendment

**Date:** 2026-05-13  
**Phase:** 7A-1.3 — Broker Duplicate Detection (Amendment)  
**Status:** AMENDMENT CORRECTION COMPLETE  
**Issues Fixed:** Feature flag gating, applicant non-disclosure  

---

## Executive Summary

✅ **Phase 7A-1.3 Amendment COMPLETE**

Two material issues have been corrected:

1. ✅ **Feature flag gating added:** Duplicate detection now checks `BROKER_DUPLICATE_DETECTION_ENABLED` (false)
2. ✅ **Applicant non-disclosure enforced:** Removed `duplicate_risk_level` from applicant response; internal storage only
3. ✅ **Audit safety improved:** Candidate details redacted in broadly-readable audit payloads

---

## 1. Exact Files Modified

✅ **src/lib/contracts/brokerDuplicateDetectionContract.js**
- Added `FEATURE_FLAGS` constant: `BROKER_DUPLICATE_DETECTION_ENABLED: false`
- Updated `runDuplicateBrokerDetection()` to check feature flag before execution
- Modified return format: `duplicate_risk_level_internal` (internal) + `applicant_message` (generic)
- Updated `getDuplicateDetectionCandidates()` with feature flag check
- Updated `recordDuplicateResolution()` with feature flag check
- Redacted candidate details in audit event (`BROKER_DUPLICATE_CANDIDATE_FOUND`)

✅ **src/lib/contracts/brokerSignupContract.js**
- Updated duplicate detection integration to handle feature-disabled response
- Changed storage to `duplicate_risk_level` (internal) + `duplicate_detection_status`
- Removed applicant exposure of risk level

---

## 2. Feature Flag Gating

✅ **BROKER_DUPLICATE_DETECTION_ENABLED constant added:**
```javascript
const FEATURE_FLAGS = {
  BROKER_DUPLICATE_DETECTION_ENABLED: false,
};
```

✅ **Fail-closed behavior when BROKER_DUPLICATE_DETECTION_ENABLED = false:**
- `runDuplicateBrokerDetection()` returns `NOT_EXECUTED_FEATURE_DISABLED` status
- No live duplicate lookup executed
- No candidate query performed
- Returns safe internal default: `duplicate_risk_level_internal: 'NO_MATCH'`
- Applicant receives generic message only

✅ **Feature flag check in all public methods:**
1. `runDuplicateBrokerDetection()` — Checks flag at start; returns no-op if disabled
2. `getDuplicateDetectionCandidates()` — Throws 403 NOT_AUTHORIZED_FOR_GATE_7A_1 if disabled
3. `recordDuplicateResolution()` — Throws 403 NOT_AUTHORIZED_FOR_GATE_7A_1 if disabled

✅ **Integration with submitStandaloneBrokerSignup():**
- Calls `runDuplicateBrokerDetection()` regardless of feature flag state
- Handles `NOT_EXECUTED_FEATURE_DISABLED` response
- Stores internal status: `duplicate_detection_status: 'NOT_EXECUTED_FEATURE_DISABLED'` or `'EXECUTED'` or `'ERROR'`
- Signup continues normally (duplicate detection is advisory, non-blocking)

✅ **All feature flags remain false:**
- `BROKER_DUPLICATE_DETECTION_ENABLED: false` ✓
- `BROKER_SIGNUP_ENABLED: false` (unchanged) ✓
- `BROKER_ONBOARDING_ENABLED: false` (unchanged) ✓
- `BROKER_COMPLIANCE_DOCUMENT_ENFORCEMENT: false` (unchanged) ✓
- No feature flag was enabled

---

## 3. Applicant Non-Disclosure

✅ **Applicant response no longer exposes duplicate_risk_level:**

**Before (Non-Compliant):**
```javascript
return {
  duplicate_risk_level: riskLevel,  // ❌ EXPOSED
  message: 'Your application is being processed. Thank you for your patience.',
};
```

**After (Compliant):**
```javascript
return {
  duplicate_risk_level_internal: riskLevel,  // ✓ Internal only, not returned
  applicant_message: 'Your application is being processed. Thank you for your patience.',
};
```

✅ **Applicant receives only generic message:**
- No risk level indicator
- No candidate count
- No match details
- No signal of duplicate status
- No "needs review" indicator

✅ **Risk level stored internally only:**
- `onboardingCase.duplicate_risk_level` — Internal field for platform use
- `onboardingCase.duplicate_detection_status` — Execution status (NOT_EXECUTED_FEATURE_DISABLED / EXECUTED / ERROR)
- Never returned in applicant-facing responses

---

## 4. Platform Reviewer Visibility

✅ **Permission-gated access to duplicate details:**
- `getDuplicateDetectionCandidates()` enforces `platform_broker.duplicate_review` (fail-closed, default false)
- Permission violation returns 403 PERMISSION_DENIED
- Feature flag check returns 403 NOT_AUTHORIZED_FOR_GATE_7A_1 if disabled

✅ **Scope enforcement on reviewer access:**
- `assertScopeAccess(context, profile)` checks cross-tenant isolation
- Scope violation returns masked 404 (no cross-tenant leakage)
- Applicant cannot access this method (permission-gated)

✅ **Reviewer sees detailed candidates:**
- Broker legal name, NPN, email, phone (internal reviewer view only)
- Match scores, matching signals
- Created date of candidate broker
- All details remain restricted to authorized reviewers

---

## 5. Audit Safety

✅ **Audit events are append-only and redacted:**

**BROKER_DUPLICATE_CHECK_RUN (safe):**
```javascript
detail: `Duplicate check completed: ${riskLevel} (${candidates.length} potential matches found)`
// No sensitive candidate details exposed
```

**BROKER_DUPLICATE_CANDIDATE_FOUND (redacted for safety):**
```javascript
// BEFORE (Non-Compliant):
detail: `Top candidate: ${candidates[0].broker_legal_name} (score: ${candidates[0].match_score})`

// AFTER (Compliant):
detail: `Duplicate candidate detected: risk level ${riskLevel}, top score ${Math.round(candidates[0].match_score)}`
// Broker name, NPN, email, phone not exposed
```

✅ **Sensitive identifiers never logged in audit:**
- No NPN logged
- No EIN token logged
- No email/phone logged
- No complete broker names in multi-reader audit
- Score and risk level only (safe internal signal)

✅ **Audit events restricted to platform visibility:**
- Append-only (no update/delete)
- Tenant-scoped (no cross-tenant leakage)
- Actor/role tracked for compliance
- Audit trace ID propagated for correlation

---

## 6. Signup Integration

✅ **submitStandaloneBrokerSignup() integration:**
- Calls `runDuplicateBrokerDetection()` after onboarding case creation
- Handles feature-disabled response gracefully
- Stores internal status: `duplicate_detection_status`
- Signup proceeds regardless of duplicate detection result (advisory, non-blocking)

✅ **Duplicate detection does NOT auto-merge:**
- No record consolidation
- No data merge between profiles
- Advisory finding only

✅ **Duplicate detection does NOT auto-reject:**
- Signup completes regardless of duplicate risk
- Unresolved probable/confirmed duplicates remain platform-review items
- `approveStandaloneBroker()` still requires explicit approval

✅ **Unresolved duplicates route to platform review:**
- High-risk cases remain in review queue
- Platform reviewer can document resolution via `recordDuplicateResolution()`
- Decision options: proceed / hold_for_merge / reject

---

## 7. Guardrails

✅ **No Gate 7A-2 implementation:**
- No workspace code added
- No broker book of business
- No employer/case/census/quote workspace actions
- Gate 7A-2 NOT STARTED ✓

✅ **No UI route exposure:**
- No /broker-signup route created
- No /broker-onboarding route
- No /command-center/broker-agencies/pending route
- Service contract layer only ✓

✅ **No /broker-signup exposure while flags false:**
- All feature flags false
- Contract methods fail-closed
- No public route activation ✓

✅ **No /broker exposure:**
- No broker portal routes created
- Deferred to Gate 7A-2 ✓

✅ **No broker workspace activation:**
- No workspace components
- No workspace routes
- BROKER_WORKSPACE_ENABLED remains false ✓

✅ **No feature flags enabled:**
- `BROKER_DUPLICATE_DETECTION_ENABLED: false`
- `BROKER_SIGNUP_ENABLED: false`
- `BROKER_ONBOARDING_ENABLED: false`
- `BROKER_COMPLIANCE_DOCUMENT_ENFORCEMENT: false`
- All remain false ✓

✅ **No Quote Connect 360 runtime change:**
- Quote/case workflows untouched
- TxQuote system untouched
- Quote transmission untouched ✓

✅ **No Benefits Admin bridge change:**
- Benefits admin setup untouched
- Benefits admin bridge untouched
- Enrollment workflow untouched ✓

✅ **No production backfill:**
- No entity backfill executed
- No production data mutated ✓

✅ **No destructive migration:**
- No migration performed
- No record consolidation ✓

✅ **Gate 7A-0 regression preserved:**
- No Gate 7A-0 contracts modified
- No scope resolver changes
- No permission resolver changes
- No audit writer changes ✓

✅ **Gate 6K untouched:**
- MGA analytics dashboard untouched
- Gate 6K remains COMPLETE / ACTIVE ✓

✅ **Gate 6L-A untouched:**
- Broker agency contacts & settings untouched
- Gate 6L-A remains COMPLETE / ACTIVE ✓

✅ **Deferred gates untouched:**
- Gate 6I-B remains NOT_STARTED
- Gate 6J-B remains NOT_STARTED
- Gate 6J-C remains NOT_STARTED
- Gate 6L-B remains NOT_STARTED ✓

---

## Amendment Summary

| Correction | Status | Evidence |
|---|---|---|
| Feature flag constant added | ✅ | BROKER_DUPLICATE_DETECTION_ENABLED: false |
| Feature flag check in runDuplicateBrokerDetection | ✅ | Returns NOT_EXECUTED_FEATURE_DISABLED if disabled |
| Feature flag check in getDuplicateDetectionCandidates | ✅ | Throws 403 NOT_AUTHORIZED_FOR_GATE_7A_1 if disabled |
| Feature flag check in recordDuplicateResolution | ✅ | Throws 403 NOT_AUTHORIZED_FOR_GATE_7A_1 if disabled |
| No live lookup when disabled | ✅ | Feature flag early return prevents query execution |
| Applicant response removed duplicate_risk_level | ✅ | Returns applicant_message only (generic) |
| Risk level stored internally | ✅ | duplicate_risk_level_internal + duplicate_detection_status on onboarding case |
| Audit event redaction | ✅ | Candidate name removed; score and risk level only |
| Permission-gated reviewer access | ✅ | platform_broker.duplicate_review enforced |
| Scope isolation maintained | ✅ | assertScopeAccess enforces cross-tenant blocking |
| All flags remain false | ✅ | No flag activation |
| No UI/routes/runtime | ✅ | Service contract layer only |
| Gate 7A-0 preserved | ✅ | No Gate 7A-0 code modified |
| Gate 6K untouched | ✅ | No analytics dashboard changes |
| Gate 6L-A untouched | ✅ | No contacts & settings changes |
| Deferred gates untouched | ✅ | 6I-B, 6J-B, 6J-C, 6L-B NOT_STARTED |

---

## Authorization Requirements

**Phase 7A-1.3 Amendment:** ✅ COMPLETE

**Operator Approval Required:**
- ✅ Accept Phase 7A-1.3 Amendment
- Proceed to Phase 7A-1.4 (NPN/License Validation)

OR

- Request further amendments before Phase 7A-1.4

---

**Amendment Status:** ✅ READY FOR OPERATOR ACCEPTANCE

**Next Phase:** Gate 7A-1.4 NPN/License Validation (upon operator approval).