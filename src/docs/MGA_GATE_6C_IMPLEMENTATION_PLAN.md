# MGA Gate 6C — Report Exports Implementation Plan

**Gate ID:** `GATE-6C-PENDING`  
**Gate Name:** Report Exports / MGA Dashboard Reporting  
**Document Type:** Implementation Plan (Pre-Approval)  
**Date:** 2026-05-11  
**Status:** 🔴 NOT APPROVED — INACTIVE — DO NOT ACTIVATE  
**Gate 6B Status:** 🟢 CLOSED — Unaffected

> **GUARDRAIL:** This document defines the controlled activation path for Gate 6C. No exports are active, no UI is exposed, no routes are callable. Implementation must not begin until formal operator approval is granted.

---

## Section 1 — Scope

### 1.1 Export Types Covered by Gate 6C

Gate 6C covers **MGA-scoped operational reporting exports** only. It does not cover proposal exports (`exportProposalPDF`) or help/documentation exports (`fullDocumentationExport`), which are independently scoped and already active under separate gates.

| Export Type | Level | Included in Gate 6C |
|---|---|---|
| Case summary export | Case-level | ✅ Yes |
| Quote scenario export | Quote-level | ✅ Yes |
| Census version export | Census-level | ✅ Yes |
| Audit/activity log export | Audit-level | ✅ Yes |
| MGA performance summary | MGA-level | ✅ Yes |
| Proposal PDF | Proposal-level | ❌ No (existing gate) |
| Help/documentation export | System-level | ❌ No (existing gate) |

### 1.2 File Formats

| Format | Use Case | Priority |
|---|---|---|
| CSV | Case list, census member, audit log | P0 — Required |
| XLSX | Multi-sheet case + quote summary | P1 — Required |
| PDF | MGA performance summary, formal reports | P1 — Required |
| JSON | Machine-readable audit export | P2 — Optional |
| ZIP | Bundled multi-format export | P3 — Future |

### 1.3 Delivery Model

| Delivery Method | When Used | Notes |
|---|---|---|
| Synchronous download | Small datasets (< 1,000 rows) | Direct response with Content-Disposition header |
| Async job + signed URL | Large datasets (≥ 1,000 rows) | Backend generates artifact, stores privately, returns signed URL |
| Email delivery | User-requested async jobs | Optional; requires `SendEmail` integration; not P0 |

**Default model:** Synchronous download for all P0 exports. Async job pattern available for large datasets.  
**Signed URL expiry:** 300 seconds (matches existing `CreateFileSignedUrl` pattern).

---

## Section 2 — Feature Flag Strategy

### 2.1 Flag Definition

```
MGA_REPORT_EXPORTS_ENABLED = false
```

- **Default value:** `false`
- **Location (UI gate):** Export modal component (to be created: `components/mga/MGAReportExportModal.jsx`)
- **Location (service gate):** Backend function (to be created: `functions/exportMGAReport.js`)
- **Both gates must independently check the flag.** UI-only gating is insufficient.

### 2.2 Fail-Closed Behavior

| Condition | Behavior |
|---|---|
| Flag is `false` | Export button hidden; modal not mounted; backend returns `FEATURE_DISABLED` |
| Flag is `undefined` | Treat as `false` — fail closed |
| Flag is `null` | Treat as `false` — fail closed |
| Flag is malformed | Treat as `false` — fail closed |
| Flag is `true` but role check fails | Backend returns 403; no export data returned |

### 2.3 Relationship to Gate 6B

`MGA_REPORT_EXPORTS_ENABLED` is entirely independent of `TXQUOTE_TRANSMIT_ENABLED`. Changing one must never affect the other. They reside in separate component files and separate backend functions.

---

## Section 3 — Authorization Model

### 3.1 Required Roles

| Role | Export Access |
|---|---|
| `mga_admin` | ✅ Full export access within own MGA scope |
| `mga_manager` | ✅ Full export access within own MGA scope |
| `platform_super_admin` | ✅ Full export access, all MGAs |
| `admin` | ✅ Full export access, all MGAs |
| `mga_user` | ❌ No export access |
| `mga_read_only` | ❌ No export access |
| Any unauthenticated user | ❌ Blocked — 401 Unauthorized |

### 3.2 ScopeGate Enforcement

Every export action must pass through `lib/mga/scopeGate.js` before any data query executes. The scope check must validate:

1. `master_general_agent_id` matches the authenticated user's resolved MGA scope
2. `master_group_id` (if provided) belongs to the resolved MGA
3. `case_id` (if provided) belongs to the resolved MGA scope
4. Cross-MGA access is blocked at scope resolution, not after data retrieval

### 3.3 Tenant / Boundary Confirmation

| Boundary | Enforcement |
|---|---|
| MGA boundary | Enforced via `scopeGate.js` before query |
| MasterGroup boundary | Enforced — `master_group_id` validated against MGA |
| Case boundary | Enforced — `case_id` validated against MGA |
| Tenant boundary | Enforced — platform admin scoped separately from MGA users |

### 3.4 No Frontend-Only Authorization

All role and scope checks must be independently enforced in the backend function. Frontend RBAC controls (hiding buttons, not mounting modals) are UX affordances only and do not constitute security controls.

---

## Section 4 — Export Inventory

### 4.1 New Files to Create

| File | Type | Purpose |
|---|---|---|
| `components/mga/MGAReportExportModal.jsx` | Component | User-facing export configuration, format selection, download trigger |
| `functions/exportMGAReport.js` | Backend function | Scoped data retrieval, serialization, storage, signed URL generation |

### 4.2 Existing Files to Modify (When Approved)

| File | Change | Notes |
|---|---|---|
| `components/mga/MGAAuditPanel.jsx` | Add export trigger button | Gated behind `MGA_REPORT_EXPORTS_ENABLED` |
| `components/mga/MGACaseWorkflowPanel.jsx` | Add export trigger button (cases/quotes) | Gated behind flag; must not touch `TXQUOTE_TRANSMIT_ENABLED` |
| `lib/mga/services/reportingService.js` | Add export dispatch logic | Currently a stub |
| `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` | Update Gate 6C status upon approval | Documentation only |

### 4.3 Files That Must NOT Be Touched

| File | Reason |
|---|---|
| `components/mga/MGACaseWorkflowPanel.jsx` line 13 | `TXQUOTE_TRANSMIT_ENABLED` — Gate 6B flag; must not be modified |
| `components/mga/MGATXQuoteTransmitModal.jsx` | Gate 6B implementation; no changes |
| `functions/exportProposalPDF.js` | Separate gate; not in scope |
| `functions/fullDocumentationExport.js` | Separate gate; not in scope |

---

## Section 5 — Data Governance

### 5.1 Exportable Fields by Export Type

**Case Export (CSV/XLSX):**  
`case_number`, `employer_name`, `stage`, `case_type`, `priority`, `effective_date`, `assigned_to`, `census_status`, `quote_status`, `enrollment_status`, `last_activity_date`, `target_close_date`

**Quote Export (CSV/XLSX):**  
`name`, `status`, `total_monthly_premium`, `employer_monthly_cost`, `employee_monthly_cost_avg`, `plan_count`, `confidence_level`, `is_recommended`, `quoted_at`, `expires_at`, `approval_status`

**Census Export (CSV):**  
`file_name`, `version_number`, `status`, `total_employees`, `eligible_employees`, `validation_errors`, `validation_warnings`, `uploaded_by`, `validated_at`

**Audit Export (CSV):**  
`action`, `actor_email`, `actor_role`, `entity_type`, `outcome`, `created_date` (detail and old/new values must be reviewed before inclusion — see 5.2)

### 5.2 Restricted / Excluded Fields

| Field | Reason | Action |
|---|---|---|
| `ssn_last4` | PII | Exclude from all exports |
| `date_of_birth` | PII/PHI | Exclude unless explicitly required and approved |
| `annual_salary` | Sensitive financial | Exclude from default exports |
| `tax_id_ein` | Audit-sensitive | Exclude from all non-admin exports |
| `access_token` | Security credential | Never export |
| `old_value` / `new_value` (ActivityLog) | May contain sensitive data | Redact or exclude from audit exports |
| `banking_setup_status` details | Financial | Exclude |
| `gradient_ai_data` (risk scores) | PHI-adjacent | Exclude from default exports; require explicit approval |

### 5.3 PII/PHI Handling

- All exports containing employee-level data must be flagged as containing PII
- PHI (health-adjacent data including risk scores, claims predictions) must not be exported without a separate PHI export approval
- PII fields not explicitly listed in 5.1 must default to excluded

### 5.4 Filename Sanitization

Export filenames must:
- Contain only alphanumeric characters, underscores, and hyphens
- Include MGA code and export date: `mga_{code}_cases_{YYYYMMDD}.csv`
- Never include raw user input without sanitization
- Never include internal record IDs in the filename

### 5.5 Download Expiration

- Signed URLs expire after **300 seconds** (consistent with existing `CreateFileSignedUrl` pattern)
- Expired artifacts must return 403/410 — no re-generation without a new authorized request
- Artifacts stored in private storage; no public URLs

---

## Section 6 — Audit Requirements

Every export operation must write to `ActivityLog` with the following fields:

| Event | Fields Logged |
|---|---|
| Export requested | `actor_email`, `actor_role`, `entity_type: "export"`, `action: "export_requested"`, `detail: export_type + format`, `master_general_agent_id` |
| Authorization decision | `action: "export_authorized"` or `"export_denied"`, `outcome: "success"` or `"blocked"` |
| Scope decision | `action: "export_scope_resolved"` or `"export_scope_denied"`, MGA ID confirmed |
| Export success | `action: "export_completed"`, `detail: record_count + file_type + file_size_kb`, `outcome: "success"` |
| Export failure | `action: "export_failed"`, `detail: error_class` (no stack trace), `outcome: "failed"` |

**What must NOT be logged:**
- Exported data content or row values
- File contents or previews
- PII/PHI field values
- Signed URLs (transient — log only that a URL was generated)

---

## Section 7 — Idempotency / Duplicate Protection

### 7.1 Idempotency Model

Export requests are **not strictly idempotent** for synchronous downloads (each click generates a fresh export of current data). However, duplicate protection must be implemented as follows:

| Scenario | Behavior |
|---|---|
| Duplicate click within 5 seconds | Button disabled after first click; spinner shown; second click ignored |
| Same export type requested within 60 seconds | Return cached signed URL if artifact still valid; do not re-generate |
| Export in progress | Button shows "Generating…" state; subsequent clicks no-op until complete or failed |
| Retry after failure | User must explicitly re-trigger; no auto-retry |

### 7.2 Idempotency Key Storage

- Generated per export request: `{mga_id}_{export_type}_{format}_{YYYYMMDDHHMMSS}`
- Stored in `ActivityLog.correlation_id` for audit correlation
- Not exposed to the user

---

## Section 8 — Failure Handling

| Failure Scenario | Required Behavior |
|---|---|
| Unauthenticated request | Return 401; log denial; no data returned |
| Unauthorized role | Return 403; log denial with actor and role; no data returned |
| Missing or wrong MGA scope | Return 403; log scope denial; no data returned |
| Invalid case/report binding | Return 400; log invalid binding; no partial data returned |
| Empty result set | Return 200 with empty file and user-facing message "No records found for the selected filters." No broken download link. |
| Partial export failure | Abort entire export; return 500; no partial file stored or delivered; log failure |
| Storage write failure | Return 500; no URL generated; no partial artifact accessible; log failure |
| Signed URL generation failure | Return 500; do not expose storage path; log failure |
| Export function timeout | Return 504; no partial artifact accessible; log timeout |

---

## Section 9 — Rollback Strategy

### 9.1 Flag-Only Rollback (Primary)

1. Set `MGA_REPORT_EXPORTS_ENABLED = false` in export modal component
2. Set `MGA_REPORT_EXPORTS_ENABLED = false` in backend export function
3. Re-deploy (no database changes required)

### 9.2 Post-Rollback State

| Component | State After Rollback |
|---|---|
| Export button(s) | Hidden |
| Export modal | Unmounted |
| Backend export function | Returns `FEATURE_DISABLED` on any call |
| Signed URLs already delivered | Expire naturally within 300s |
| Audit logs | Preserved (no rollback of logs) |
| Gate 6B TXQuote transmit | ✅ Unaffected — entirely separate flag and files |

### 9.3 What Rollback Does NOT Affect

- `TXQUOTE_TRANSMIT_ENABLED` (Gate 6B)
- `MGAInviteUserModal` (Gate 6A)
- Proposal exports (`exportProposalPDF`)
- Help exports (`fullDocumentationExport`)

---

## Section 10 — Approval Gates

All of the following must be satisfied before Gate 6C activation:

| Gate | Requirement | Status |
|---|---|---|
| **G1** | Static scan pass (no syntax errors, all imports resolve) | ⏳ Pending implementation |
| **G2** | Build pass (zero errors) | ⏳ Pending implementation |
| **G3** | Unit tests pass (all test matrix cases — see `MGA_GATE_6C_TEST_MATRIX.md`) | ⏳ Pending implementation |
| **G4** | RBAC/scope tests pass (cross-MGA blocked, unauthorized roles blocked) | ⏳ Pending implementation |
| **G5** | Negative tests pass (failure modes, empty sets, expired URLs) | ⏳ Pending implementation |
| **G6** | Rollback test pass (flag false hides UI, blocks backend, Gate 6B unaffected) | ⏳ Pending implementation |
| **G7** | Data governance review (restricted fields excluded, PII handling verified) | ⏳ Pending review |
| **G8** | Operator/business owner approval | ⏳ Awaiting implementation completion |

**Current status: 0/8 gates satisfied. Gate 6C remains NOT APPROVED.**

---

*End of Gate 6C Implementation Plan*  
*Commit reference: `docs(qc360): define Gate 6C report exports implementation plan`*