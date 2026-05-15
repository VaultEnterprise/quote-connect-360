# MGA Gate 6C — Report Exports Test Matrix

**Gate ID:** `GATE-6C-PENDING`  
**Gate Name:** Report Exports / MGA Dashboard Reporting  
**Document Type:** Test Matrix (Pre-Approval)  
**Date:** 2026-05-11  
**Status:** 🔴 NOT APPROVED — Tests defined but NOT yet implemented or run  
**Gate 6B Status:** 🟢 CLOSED — Unaffected

> **GUARDRAIL:** This test matrix defines all required tests before Gate 6C can be approved. Tests must be implemented in `lib/mga/gate6c.tests.js`. No tests are currently passing — Gate 6C has zero implementation footprint.

**Required pass rate for approval: 100% (all cases must pass)**

---

## Section 1 — Visibility Tests

Tests confirming export UI is only shown under the correct flag + permission conditions.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| VIS-01 | Export button hidden when flag false | `MGA_REPORT_EXPORTS_ENABLED = false`, any authorized role | Export button not rendered in DOM | ⏳ Not implemented |
| VIS-02 | Export button visible when flag true and role authorized | `MGA_REPORT_EXPORTS_ENABLED = true`, `mga_admin` | Export button rendered | ⏳ Not implemented |
| VIS-03 | Export button hidden for unauthorized role even when flag true | `MGA_REPORT_EXPORTS_ENABLED = true`, `mga_user` | Export button not rendered | ⏳ Not implemented |
| VIS-04 | Export button hidden for read-only role even when flag true | `MGA_REPORT_EXPORTS_ENABLED = true`, `mga_read_only` | Export button not rendered | ⏳ Not implemented |
| VIS-05 | Export modal not mounted when flag false | `MGA_REPORT_EXPORTS_ENABLED = false` | Modal component not present in component tree | ⏳ Not implemented |
| VIS-06 | Export modal mounts only when flag true and button clicked by authorized user | `MGA_REPORT_EXPORTS_ENABLED = true`, `mga_admin`, button clicked | Modal mounts correctly | ⏳ Not implemented |
| VIS-07 | Gate 6B transmit button unaffected by export flag state | `MGA_REPORT_EXPORTS_ENABLED = false`, `TXQUOTE_TRANSMIT_ENABLED = true` | Transmit button still visible and functional | ⏳ Not implemented |

---

## Section 2 — Authorization Tests

Tests confirming only authorized roles can invoke export operations, enforced at the backend layer.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| AUTH-01 | Authorized MGA admin can request scoped export | `mga_admin`, valid MGA scope | Export proceeds; 200 returned | ⏳ Not implemented |
| AUTH-02 | Authorized MGA manager can request scoped export | `mga_manager`, valid MGA scope | Export proceeds; 200 returned | ⏳ Not implemented |
| AUTH-03 | Platform super admin can export any MGA scope | `platform_super_admin`, any MGA ID | Export proceeds; 200 returned | ⏳ Not implemented |
| AUTH-04 | MGA user role blocked | `mga_user`, valid MGA scope | 403 Forbidden; audit log entry written | ⏳ Not implemented |
| AUTH-05 | MGA read-only role blocked | `mga_read_only`, valid MGA scope | 403 Forbidden; audit log entry written | ⏳ Not implemented |
| AUTH-06 | Unauthenticated request blocked | No session token | 401 Unauthorized; no data returned | ⏳ Not implemented |
| AUTH-07 | Cross-MGA access blocked | `mga_admin` of MGA-A requests MGA-B export | 403 Forbidden; scope denial logged | ⏳ Not implemented |
| AUTH-08 | Cross-tenant access blocked | User from tenant A requests tenant B export | 403 Forbidden | ⏳ Not implemented |
| AUTH-09 | Frontend RBAC bypass does not grant access | Authorized UI bypassed; direct function call by `mga_user` | 403 Forbidden (backend enforces independently) | ⏳ Not implemented |

---

## Section 3 — ScopeGate Tests

Tests confirming `lib/mga/scopeGate.js` blocks all out-of-scope export requests before any data query runs.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| SCOPE-01 | Missing `mga_id` in request blocked | No `master_general_agent_id` provided | 403; scope gate blocks before query | ⏳ Not implemented |
| SCOPE-02 | Wrong `mga_id` blocked | `master_general_agent_id` does not match actor's scope | 403; scope gate blocks before query | ⏳ Not implemented |
| SCOPE-03 | Wrong `master_group_id` blocked | `master_group_id` does not belong to actor's MGA | 403; scope gate blocks before query | ⏳ Not implemented |
| SCOPE-04 | Wrong `case_id` blocked | `case_id` does not belong to actor's MGA | 403; scope gate blocks before query | ⏳ Not implemented |
| SCOPE-05 | Case/report mismatch blocked | `case_id` provided but belongs to different MGA than `master_general_agent_id` | 400 or 403; mismatch logged | ⏳ Not implemented |
| SCOPE-06 | Scope check runs before data retrieval | Valid request with timing probe | Data query does not execute if scope check fails | ⏳ Not implemented |

---

## Section 4 — Data Safety Tests

Tests confirming restricted fields are excluded and sensitive data is not exposed in exports.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| DATA-01 | `ssn_last4` excluded from all exports | Case export request | `ssn_last4` field absent from output file | ⏳ Not implemented |
| DATA-02 | `date_of_birth` excluded from default exports | Census export request | `date_of_birth` absent unless explicitly approved export type | ⏳ Not implemented |
| DATA-03 | `annual_salary` excluded from default exports | Census/case export | `annual_salary` absent from output | ⏳ Not implemented |
| DATA-04 | `tax_id_ein` excluded from non-admin exports | MGA export by `mga_admin` | `tax_id_ein` absent from output | ⏳ Not implemented |
| DATA-05 | `access_token` never exported | Any export type | `access_token` absent from all outputs | ⏳ Not implemented |
| DATA-06 | `gradient_ai_data` excluded from default exports | Census export | Risk score data absent from output | ⏳ Not implemented |
| DATA-07 | No raw internal record IDs exposed in filename | Export trigger | Filename matches `mga_{code}_{type}_{date}.{ext}` pattern | ⏳ Not implemented |
| DATA-08 | No sensitive content written to audit log | Export success | ActivityLog `detail` contains only count/type/format, not field values | ⏳ Not implemented |
| DATA-09 | PII flag set on employee-level exports | Census member export | Export metadata flagged as containing PII | ⏳ Not implemented |

---

## Section 5 — Export Format Tests

Tests confirming generated files are valid and complete for each supported format.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| FMT-01 | CSV export is valid and parseable | Case export, CSV format | Valid UTF-8 CSV; headers match defined field list; no extra fields | ⏳ Not implemented |
| FMT-02 | XLSX export is valid | Case+quote export, XLSX format | Valid XLSX; sheets present; data matches scoped query | ⏳ Not implemented |
| FMT-03 | PDF export is valid | MGA performance export, PDF format | Valid PDF; renders without error | ⏳ Not implemented |
| FMT-04 | JSON export is valid | Audit export, JSON format | Valid JSON array; schema matches defined exportable fields | ⏳ Not implemented |
| FMT-05 | Filename sanitized | Export with special characters in MGA name | Filename contains only alphanumeric, underscores, hyphens | ⏳ Not implemented |
| FMT-06 | Empty export handled safely | Export request with no matching records | 200 returned; empty file with headers; user message "No records found"; no broken download | ⏳ Not implemented |
| FMT-07 | Row count matches query result | Case export with known dataset | Row count in file equals rows returned by scoped query | ⏳ Not implemented |

---

## Section 6 — Failure Tests

Tests confirming all failure modes are handled safely with no partial artifacts delivered.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| FAIL-01 | Storage write failure fails safely | Simulated storage error | 500 returned; no partial artifact stored; no broken URL generated; failure logged | ⏳ Not implemented |
| FAIL-02 | Download generation failure fails safely | Simulated serialization error | 500 returned; no partial file delivered; failure logged | ⏳ Not implemented |
| FAIL-03 | Partial export fails safely | Export aborted mid-row | No partial file accessible; full failure returned to user | ⏳ Not implemented |
| FAIL-04 | Duplicate click within 5 seconds no-ops | Two export clicks < 5s apart | Second click ignored; single export generated; no duplicate artifact | ⏳ Not implemented |
| FAIL-05 | Expired signed URL cannot be downloaded | Attempt download after 300s | 403/410 returned; no re-generation without new authorized request | ⏳ Not implemented |
| FAIL-06 | Export function timeout fails safely | Simulated 30s timeout | 504 returned; no partial artifact accessible; timeout logged | ⏳ Not implemented |
| FAIL-07 | Invalid export type parameter rejected | Unsupported format string in request | 400 Bad Request; no export attempted | ⏳ Not implemented |

---

## Section 7 — Audit Tests

Tests confirming every export operation produces a complete and clean audit trail.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| AUDIT-01 | Export request logged | Authorized export request | `ActivityLog` record with `action: "export_requested"` created | ⏳ Not implemented |
| AUDIT-02 | Authorization decision logged — granted | Authorized user | `ActivityLog` record with `action: "export_authorized"`, `outcome: "success"` | ⏳ Not implemented |
| AUDIT-03 | Authorization decision logged — denied | Unauthorized user | `ActivityLog` record with `action: "export_denied"`, `outcome: "blocked"` | ⏳ Not implemented |
| AUDIT-04 | Scope denial logged | Wrong MGA scope | `ActivityLog` record with `action: "export_scope_denied"`, `outcome: "blocked"` | ⏳ Not implemented |
| AUDIT-05 | Export success logged with metadata | Successful export | `ActivityLog` record with record count, file type, file size | ⏳ Not implemented |
| AUDIT-06 | Export failure logged | Storage or serialization error | `ActivityLog` record with `action: "export_failed"`, `outcome: "failed"`, error class only | ⏳ Not implemented |
| AUDIT-07 | No sensitive exported content in log | Any export type | `ActivityLog.detail` does not contain exported row data, PII, or file contents | ⏳ Not implemented |
| AUDIT-08 | Signed URL not logged | Successful async export | Signed URL absent from all log fields | ⏳ Not implemented |

---

## Section 8 — Rollback Tests

Tests confirming the flag-only rollback completely disables Gate 6C without affecting other gates.

| ID | Test Case | Input | Expected Result | Status |
|---|---|---|---|---|
| RB-01 | Flag false hides export UI | `MGA_REPORT_EXPORTS_ENABLED = false` | Export button not rendered; modal not mounted | ⏳ Not implemented |
| RB-02 | Flag false blocks backend export action | Direct backend function call with flag false | Function returns `FEATURE_DISABLED`; no data returned; no artifact generated | ⏳ Not implemented |
| RB-03 | Flag false prevents modal mount | `MGA_REPORT_EXPORTS_ENABLED = false` | Export modal component not present in React tree | ⏳ Not implemented |
| RB-04 | Flag false does not affect Gate 6B TXQuote transmit | `MGA_REPORT_EXPORTS_ENABLED = false`, `TXQUOTE_TRANSMIT_ENABLED = true` | Transmit button visible; modal functional; transmit operations unaffected | ⏳ Not implemented |
| RB-05 | Flag false does not affect Gate 6A Invite User | `MGA_REPORT_EXPORTS_ENABLED = false` | Invite User button visible and functional | ⏳ Not implemented |
| RB-06 | Rollback requires no deploy | Flag changed; behavior verified without code push | All rollback behaviors activated by flag change alone | ⏳ Not implemented |

---

## Test Summary

| Section | Test Count | Status |
|---|---|---|
| Visibility Tests | 7 | ⏳ 0/7 — Not implemented |
| Authorization Tests | 9 | ⏳ 0/9 — Not implemented |
| ScopeGate Tests | 6 | ⏳ 0/6 — Not implemented |
| Data Safety Tests | 9 | ⏳ 0/9 — Not implemented |
| Export Format Tests | 7 | ⏳ 0/7 — Not implemented |
| Failure Tests | 7 | ⏳ 0/7 — Not implemented |
| Audit Tests | 8 | ⏳ 0/8 — Not implemented |
| Rollback Tests | 6 | ⏳ 0/6 — Not implemented |
| **TOTAL** | **59** | **⏳ 0/59 — Gate 6C NOT APPROVED** |

**Required for Gate 6C approval: 59/59 PASS**  
**Current state: 0/59 — Not implemented — Gate 6C remains NOT APPROVED**

---

## Implementation Notes

- All tests should be implemented in: `lib/mga/gate6c.tests.js`
- Tests must be run and pass before any operator approval is requested
- Rollback tests (Section 8) must be run last, after all other sections pass
- Gate 6B tests must be re-run after Gate 6C implementation to confirm no regression

---

*End of Gate 6C Test Matrix*  
*Commit reference: `docs(qc360): define Gate 6C report exports implementation plan`*