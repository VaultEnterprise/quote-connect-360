# MGA Gate 6C — Activation Runbook

**Document Type:** Operational Activation Runbook  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** READY FOR USE — NO ACTIVATION UNTIL OPERATOR EXECUTES  
**Prepared By:** Platform Engineering — MGA Program Management  
**Registry:** `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`  
**Approval Packet:** `docs/MGA_GATE_6C_OPERATOR_APPROVAL_PACKET.md`  
**Ledger:** `docs/MGA_GATE_STATUS_LEDGER.md`

> This is the exact operational checklist to be used on Gate 6C activation day.  
> This runbook does not activate Gate 6C.  
> This runbook does not activate Gate 6D.  
> This runbook does not change any runtime behavior.  
> Feature flags remain unchanged until the operator explicitly initiates the activation execution sequence below.

---

## Section 1 — Activation Preconditions

All items below must be confirmed BEFORE the activation sequence begins. A single unchecked item is a hard stop.

| # | Precondition | Status | Confirmed By |
|---|-------------|--------|-------------|
| P-01 | Operator approval packet completed (Section 3 of approval packet signed) | [ ] CONFIRMED | |
| P-02 | Operator approval explicitly granted — APPROVE decision documented in approval packet | [ ] CONFIRMED | |
| P-03 | Rollback owner assigned — name, email, and response window on record | [ ] CONFIRMED | |
| P-04 | Smoke test executor assigned — name and email on record | [ ] CONFIRMED | |
| P-05 | Activation window approved and current time is within the approved window | [ ] CONFIRMED | |
| P-06 | Registry backed up or committed to version control before flag change | [ ] CONFIRMED | |
| P-07 | Current `MGA_REPORT_EXPORTS_ENABLED` confirmed `false` in source before touching flag | [ ] CONFIRMED | |
| P-08 | `MGA_EXPORT_HISTORY_ENABLED` confirmed `false` — Gate 6D remains disabled | [ ] CONFIRMED | |
| P-09 | Gate 6A regression baseline available — invite user flow confirmed working | [ ] CONFIRMED | |
| P-10 | Gate 6B regression baseline available — TXQuote transmit confirmed working | [ ] CONFIRMED | |

**Precondition Sign-Off:**  
All 10 preconditions confirmed by: _______________________________________________  
Date/Time: _______________________________________________  
Proceed to Section 2? [ ] YES — all 10 confirmed / [ ] NO — hard stop, do not continue

---

## Section 2 — Pre-Activation Snapshot

The following values must be captured and recorded **before** the flag is changed. This snapshot serves as the rollback baseline.

| Item | Pre-Activation Value | Captured By | Timestamp |
|------|---------------------|-------------|-----------|
| Gate 6C registry `status` | `IMPLEMENTED_ACTIVATION_PENDING` | | |
| Gate 6C registry `activationDecision` | `OPERATOR_REVIEW_PENDING` | | |
| Gate 6C registry `activation` | `INACTIVE` | | |
| Gate 6C registry `reportExports` | `DISABLED` | | |
| Gate 6D registry `status` | `IMPLEMENTED_ACTIVATION_PENDING` | | |
| Gate 6D registry `activation` | `INACTIVE` | | |
| `MGA_REPORT_EXPORTS_ENABLED` value | `false` | | |
| `MGA_EXPORT_HISTORY_ENABLED` value | `false` | | |
| Build/test state | All 59 Gate 6C tests PASS | | |
| Export UI visible in app | NO — export button not rendered | | |
| Export backend behavior | Returns `503 Feature not enabled` | | |
| History UI visible in app | NO — history tab not rendered | | |
| History backend behavior | Returns `503 Feature not enabled` | | |
| Rollback owner on record | _____________________________ | | |
| Smoke test executor on record | _____________________________ | | |
| Activation timestamp (planned) | _____________________________ | | |

**Snapshot recorded by:** _______________________________________________  
**Snapshot timestamp:** _______________________________________________

---

## Section 3 — Activation Steps

Execute the following steps in strict order. Do not skip steps. Do not proceed past a FAIL result — execute rollback (Section 5) immediately.

| Step | Action | Owner | Expected Result | Result |
|------|--------|-------|----------------|--------|
| 1 | Confirm operator approval packet Section 3 is signed with APPROVE decision | Activation Lead | Signed packet on record | [ ] PASS / [ ] FAIL |
| 2 | Confirm rollback owner is present and reachable during activation window | Activation Lead | Verbal/written confirmation from rollback owner | [ ] PASS / [ ] FAIL |
| 3 | Confirm smoke test executor is present and ready to execute Section 4 checklist | Activation Lead | Confirmation from executor | [ ] PASS / [ ] FAIL |
| 4 | Confirm `MGA_EXPORT_HISTORY_ENABLED` is still `false` — Gate 6D remains disabled | Activation Lead | Source confirmed `false` | [ ] PASS / [ ] FAIL |
| 5 | **Set `MGA_REPORT_EXPORTS_ENABLED = true`** in `components/mga/MGACaseWorkflowPanel.jsx` | Platform Engineering | Flag value changed to `true` in source | [ ] PASS / [ ] FAIL |
| 6 | Confirm report export UI appears for `mga_admin` role — export button/modal rendered | Smoke Test Executor | Export action visible in MGA command panel | [ ] PASS / [ ] FAIL |
| 7 | Confirm report export UI appears for `platform_super_admin` role | Smoke Test Executor | Export action visible | [ ] PASS / [ ] FAIL |
| 8 | Confirm report export UI is hidden for `mga_manager` role | Smoke Test Executor | Export action not rendered | [ ] PASS / [ ] FAIL |
| 9 | Confirm report export UI is hidden for `mga_user` and `mga_read_only` roles | Smoke Test Executor | Export action not rendered for both | [ ] PASS / [ ] FAIL |
| 10 | Run scoped valid export smoke test — authorized `mga_admin` exports in-scope MGA data | Smoke Test Executor | Export completes; response received | [ ] PASS / [ ] FAIL |
| 11 | Run cross-MGA denial test — actor from MGA-A attempts to export MGA-B data | Smoke Test Executor | Request denied; 403 or scope error returned | [ ] PASS / [ ] FAIL |
| 12 | Run cross-tenant denial test — actor without MGA membership attempts export | Smoke Test Executor | Request denied; membership error returned | [ ] PASS / [ ] FAIL |
| 13 | Run missing-permission denial test — unauthorized role's direct API call blocked | Smoke Test Executor | Request denied; permission error returned | [ ] PASS / [ ] FAIL |
| 14 | Confirm audit events are written — check audit log for export request and result records | Smoke Test Executor | Audit records present in log entity | [ ] PASS / [ ] FAIL |
| 15 | Confirm restricted fields excluded — PII and prohibited fields absent from export response | Smoke Test Executor | Field policy enforced; no prohibited fields in output | [ ] PASS / [ ] FAIL |
| 16 | Confirm rollback: set `MGA_REPORT_EXPORTS_ENABLED = false`, verify UI hides and backend returns 503 | Rollback Owner | UI gone; backend closed | [ ] PASS / [ ] FAIL |
| 17 | Restore `MGA_REPORT_EXPORTS_ENABLED = true` if rollback test passed and all prior steps PASS | Platform Engineering | Flag restored to `true` | [ ] PASS / [ ] FAIL |
| 18 | Record activation evidence — complete Section 4 checklist and this step log | Smoke Test Executor | All results documented | [ ] PASS / [ ] FAIL |

**Activation Steps Summary:**  
Total Steps: 18 / PASS: _____ / FAIL: _____  
Overall Result: [ ] ALL PASS — proceed to Section 6 registry update / [ ] FAIL — execute Section 5 rollback immediately

---

## Section 4 — Smoke Test Checklist

To be completed by the designated smoke test executor after Step 5 (flag set to `true`). Every item must be PASS before activation is declared successful. A single FAIL triggers immediate rollback.

| # | Smoke Test Item | Result | Notes |
|---|----------------|--------|-------|
| ST-01 | Authorized MGA user (`mga_admin`) can see export action in MGA command panel | [ ] PASS / [ ] FAIL | |
| ST-02 | Unauthorized user (`mga_manager`) cannot see export action | [ ] PASS / [ ] FAIL | |
| ST-03 | Read-only / export-denied user (`mga_read_only`) cannot see or execute export | [ ] PASS / [ ] FAIL | |
| ST-04 | Cross-MGA export blocked — MGA-A actor cannot access MGA-B records | [ ] PASS / [ ] FAIL | |
| ST-05 | Cross-tenant export blocked — actor without active MGA membership denied | [ ] PASS / [ ] FAIL | |
| ST-06 | Missing scope blocked — direct API call without valid scope returns denied response | [ ] PASS / [ ] FAIL | |
| ST-07 | Valid scoped export succeeds — authorized actor receives expected export payload | [ ] PASS / [ ] FAIL | |
| ST-08 | Empty dataset handled safely — no error or crash when MGA has zero exportable records | [ ] PASS / [ ] FAIL | |
| ST-09 | Duplicate click protection works — rapid re-submission does not produce duplicate artifacts | [ ] PASS / [ ] FAIL | |
| ST-10 | Export artifact / download is safe — no raw DB references, no internal IDs, no system fields | [ ] PASS / [ ] FAIL | |
| ST-11 | Restricted fields excluded — PII and prohibited fields absent from all export responses | [ ] PASS / [ ] FAIL | |
| ST-12 | No signed URLs logged — signed download URLs not written to audit or log records | [ ] PASS / [ ] FAIL | |
| ST-13 | No private file URIs logged — private storage URIs not written to audit or log records | [ ] PASS / [ ] FAIL | |
| ST-14 | Export request audit event logged — audit record written at time of request | [ ] PASS / [ ] FAIL | |
| ST-15 | Export success audit event logged — audit record written on successful export completion | [ ] PASS / [ ] FAIL | |
| ST-16 | Export failure / denial audit event logged — audit record written when request is denied or fails | [ ] PASS / [ ] FAIL | |
| ST-17 | Rollback: setting flag to `false` immediately hides export UI for all roles | [ ] PASS / [ ] FAIL | |
| ST-18 | Rollback: setting flag to `false` causes backend export actions to return `503 Feature not enabled` | [ ] PASS / [ ] FAIL | |
| ST-19 | Gate 6A unaffected — invite user flow functions normally during and after activation | [ ] PASS / [ ] FAIL | |
| ST-20 | Gate 6B unaffected — TXQuote transmit button active and functional during and after activation | [ ] PASS / [ ] FAIL | |
| ST-21 | Gate 6D still inactive — history tab not rendered; `MGA_EXPORT_HISTORY_ENABLED` confirmed `false` | [ ] PASS / [ ] FAIL | |

**Smoke Test Summary:**  
Total Items: 21 / PASS: _____ / FAIL: _____  
Overall Result: [ ] ALL PASS — proceed to Section 6 / [ ] FAIL — execute Section 5 rollback immediately  
Executor: _______________________________________________  
Execution Date/Time: _______________________________________________

---

## Section 5 — Rollback Procedure

Execute immediately if any activation step or smoke test item returns FAIL, or if a production issue is detected at any point after activation. The rollback owner must complete all 8 steps within the agreed response window.

| Step | Action | Confirmation |
|------|--------|-------------|
| 1 | Set `MGA_REPORT_EXPORTS_ENABLED = false` in `components/mga/MGACaseWorkflowPanel.jsx` | Flag confirmed `false` in source |
| 2 | Confirm report export UI disappears — export button no longer rendered for any role | Visual / functional confirmation |
| 3 | Confirm export modal unmounts — `MGAReportExportModal` not present in rendered DOM | Inspect rendered output |
| 4 | Confirm backend export actions fail closed — `mgaReportExport` returns `503 Feature not enabled` | Direct invocation test |
| 5 | Confirm no new export artifact can be generated after rollback | Check audit log for post-rollback export records — should be none |
| 6 | Confirm Gate 6A user invites unaffected — invite modal still accessible to `mga_admin` | Functional test of invite flow |
| 7 | Confirm Gate 6B TXQuote transmit unaffected — transmit button still active for authorized roles | Functional test of transmit button |
| 8 | Record rollback result — rollback owner name, timestamp, trigger reason, and all 7 confirmation results | Update registry and approval packet |

**Rollback Result Record:**

| Field | Value |
|-------|-------|
| Rollback triggered | [ ] YES / [ ] NO |
| Rollback owner | |
| Rollback timestamp | |
| Trigger reason | |
| Steps 1–7 all confirmed | [ ] YES / [ ] NO |
| Gate 6A confirmed unaffected | [ ] YES / [ ] NO |
| Gate 6B confirmed unaffected | [ ] YES / [ ] NO |
| Notes | |

---

## Section 6 — Post-Activation Registry Update

**This section applies only if all 18 activation steps PASS and all 21 smoke test items PASS.**

If activation smoke validation passes, the registry entry for Gate 6C may be updated to reflect the activated-but-not-yet-closed state. Do not mark Gate 6C `CLOSED` until the operator provides final written sign-off after reviewing the smoke test results.

Permitted registry field updates upon successful smoke validation:

```json
{
  "gateId": "GATE-6C-COMPLETE",
  "status": "ACTIVATED_VALIDATION_PASSING",
  "activationDecision": "APPROVED",
  "activationState": "ACTIVE",
  "reportExports": "ENABLED",
  "featureFlag": {
    "name": "MGA_REPORT_EXPORTS_ENABLED",
    "value": true
  },
  "activationDate": "<date of activation>",
  "activatedBy": "<operator name>",
  "smokeTestResult": "PASS",
  "smokeTestDate": "<date of smoke test>",
  "smokeTestExecutor": "<executor name>",
  "nextStep": "Operator final sign-off required to mark gate CLOSED"
}
```

**Fields that must NOT be changed in the registry at this stage:**

- `"status"` must not be set to `"CLOSED"` — only the operator can authorize closure
- Gate 6D fields must not be changed — Gate 6D remains `IMPLEMENTED_ACTIVATION_PENDING / INACTIVE`
- `MGA_EXPORT_HISTORY_ENABLED` must not appear as `true` anywhere in the registry

**Registry update authorized by:** _______________________________________________  
**Registry update timestamp:** _______________________________________________

---

## Section 7 — Gate 6D Hold Confirmation

> Gate 6D must remain inactive during and after Gate 6C activation until Gate 6C smoke validation is explicitly declared PASS.

| Constraint | Enforcement |
|-----------|------------|
| `MGA_EXPORT_HISTORY_ENABLED` must remain `false` | Flag is a separate constant in `MGACaseWorkflowPanel.jsx`; Gate 6C activation does not touch it |
| Gate 6D history tab must not render | `canViewHistory` evaluates to `false` while flag is `false`; this is unaffected by Gate 6C flag change |
| Gate 6D backend must remain fail-closed | `mgaExportHistoryContract` returns `503 Feature not enabled` while flag is `false` |
| Gate 6D activation may only be considered after Gate 6C smoke validation PASS | Gate 6D operator approval packet has not been issued; no activation path exists for Gate 6D until Gate 6C closes |
| Gate 6D activation requires its own separate operator approval | The Gate 6C approval packet and this runbook do not authorize Gate 6D activation |

**Gate 6D status during Gate 6C activation:**  
`MGA_EXPORT_HISTORY_ENABLED` = `false` — confirmed: [ ] YES / [ ] NO  
History tab not rendered — confirmed: [ ] YES / [ ] NO  
History backend fail-closed — confirmed: [ ] YES / [ ] NO

---

## Section 8 — No-Activation Certification

---

### Gate 6C Activation Runbook Certification

**Certification Date:** 2026-05-12  
**Certified By:** Platform Engineering — MGA Program Management

- **This runbook does not activate Gate 6C.**
- **This runbook does not activate Gate 6D.**
- **This runbook does not change any runtime behavior.**
- **Both feature flags remain `false`** — `MGA_REPORT_EXPORTS_ENABLED = false`, `MGA_EXPORT_HISTORY_ENABLED = false` — until the operator explicitly initiates the activation sequence by completing all preconditions in Section 1 and authorizing Step 5.
- **No permissions were broadened.** No RBAC matrix entries were added or changed.
- **No UI was exposed.** No new components were mounted or made visible.
- **Gate 6A and Gate 6B remain unaffected.**

This runbook becomes operational only when the operator has completed the approval packet (Section 3 signed), all 10 preconditions in Section 1 are confirmed, and the activation window is active.

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_GATE_6C_ACTIVATION_RUNBOOK |
| Version | 1.0 |
| Created | 2026-05-12 |
| Last Modified | 2026-05-12 |
| Author | Platform Engineering — MGA Program Management |
| Registry | `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` |
| Approval Packet | `docs/MGA_GATE_6C_OPERATOR_APPROVAL_PACKET.md` |
| Ledger | `docs/MGA_GATE_STATUS_LEDGER.md` |
| Checklist | `docs/MGA_GATES_6C_6D_PRE_ACTIVATION_EVIDENCE_CHECKLIST.md` |
| Gap Closure Plan | `docs/MGA_GATES_6C_6D_EVIDENCE_GAP_CLOSURE_PLAN.md` |
| Next Update Trigger | Operator initiates activation execution |