# MGA Gate 6C — Static Inventory & Implementation Footprint Map

**Gate ID:** `GATE-6C-PENDING`  
**Gate Name:** Report Exports / MGA Dashboard Reporting  
**Document Type:** Static Inventory (Pre-Implementation)  
**Date:** 2026-05-11  
**Status:** 🔴 NOT APPROVED — INACTIVE — DO NOT ACTIVATE  
**Gate 6B Status:** 🟢 CLOSED — Unaffected

> **GUARDRAIL:** This document is a planning artifact only. No files are created, modified, or activated by this inventory. All listed "proposed" files are hypothetical until formal operator approval is granted.

---

## Section 1 — Current Files / Components Review

### 1.1 `components/mga/*`

| File | Relevant to Gate 6C | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `MGACaseWorkflowPanel.jsx` | YES | MODIFY | HIGH | Will need export trigger button for cases/quotes. Contains Gate 6B `TXQUOTE_TRANSMIT_ENABLED` flag — must not be disturbed. |
| `MGAAuditPanel.jsx` | YES | MODIFY | MEDIUM | Will need export trigger button for audit log exports. |
| `MGAMasterGroupPanel.jsx` | POSSIBLE | MODIFY | LOW | May need export trigger for master group summary. Low priority. |
| `MGAKPIBar.jsx` | POSSIBLE | NONE | LOW | Could source record counts for export scope, but no direct change required. |
| `MGAHeader.jsx` | NO | NONE | NONE | Identity display only; no data export relevance. |
| `MGADocumentsPanel.jsx` | NO | NONE | NONE | Documents panel handles file display, not report export. |
| `MGAUsersPanel.jsx` | NO | NONE | NONE | User roster; not an export source for Gate 6C. |
| `MGAScopeErrorBoundary.jsx` | YES | READ ONLY | LOW | Must wrap any new export modal to ensure fail-closed error containment. |
| `MGATXQuoteTransmitModal.jsx` | NO | NONE | NONE | Gate 6B artifact — must not be touched. |
| `MGAInviteUserModal.jsx` | NO | NONE | NONE | Gate 6A artifact — must not be touched. |

### 1.2 `pages/mga/*` / `pages/MasterGeneralAgentCommand.jsx`

| File | Relevant to Gate 6C | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `pages/MasterGeneralAgentCommand.jsx` | YES | MODIFY | MEDIUM | Top-level page that renders all MGA panels. May need to pass export flag/props down to modified panels. Must not alter RBAC routing logic. |

### 1.3 `functions/*` (Backend Functions)

| File | Relevant to Gate 6C | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `exportProposalPDF.js` | POSSIBLE | READ ONLY | LOW | Reference pattern only — separate gate, not to be modified. |
| `fullDocumentationExport.js` | POSSIBLE | READ ONLY | LOW | Reference pattern only — separate gate, not to be modified. |
| `sendTxQuote.js` | NO | NONE | NONE | Gate 6B artifact — must not be touched. |
| All other existing functions | NO | NONE | NONE | No relevance to MGA report export flow. |
| `mgaReportExport.js` *(proposed)* | YES | NEW | HIGH | Primary backend function for scoped export generation. Does not exist yet. |

### 1.4 `lib/mga/*`

| File | Relevant to Gate 6C | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `lib/mga/scopeGate.js` | YES | READ ONLY | LOW | Must be called by the new export function — no modification expected; consumption only. |
| `lib/mga/scopeResolver.js` | YES | READ ONLY | LOW | Used for MGA/actor scope resolution; called via scopeGate. |
| `lib/mga/permissionResolver.js` | YES | READ ONLY | MEDIUM | Will need to recognize new export permission keys (see Section 3). May require update if permission keys are new. |
| `lib/mga/errorModel.js` | YES | READ ONLY | LOW | Error classes (`FEATURE_DISABLED`, `SCOPE_DENIED`, `FORBIDDEN`) should be reused. |
| `lib/mga/auditDecision.js` | YES | READ ONLY | LOW | Audit logging helper — should be reused for export audit events. |
| `lib/mga/asyncScopeRules.js` | POSSIBLE | READ ONLY | LOW | May contain scope validation helpers reusable for async export jobs. |
| `lib/mga/impersonationControl.js` | POSSIBLE | READ ONLY | LOW | Review needed — impersonation context must not bypass export scope. |
| `lib/mga/migration/*` | NO | NONE | NONE | Migration utilities; no export relevance. |

### 1.5 `lib/mga/services/*`

| File | Relevant to Gate 6C | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `lib/mga/services/reportingService.js` | YES | MODIFY | MEDIUM | Currently a stub. Will need export dispatch logic added. |
| `lib/mga/services/caseService.js` | YES | READ ONLY | LOW | Data source for case-level exports. No modification — consumption only. |
| `lib/mga/services/quoteService.js` | YES | READ ONLY | LOW | Data source for quote-level exports. No modification — consumption only. |
| `lib/mga/services/censusService.js` | YES | READ ONLY | LOW | Data source for census-level exports. No modification — consumption only. |
| `lib/mga/services/auditService.js` | YES | READ ONLY | LOW | Data source for audit-level exports. No modification — consumption only. |
| `lib/mga/services/masterGroupService.js` | POSSIBLE | READ ONLY | LOW | May be needed for MGA-level summary exports. |
| `lib/mga/services/txquoteService.js` | NO | NONE | NONE | Gate 6B artifact — must not be touched. |
| `lib/mga/services/userAdminService.js` | NO | NONE | NONE | User management — not an export source for Gate 6C. |
| `lib/mga/services/serviceContract.js` | YES | READ ONLY | LOW | Service call contract patterns should be followed for new export service. |

### 1.6 `docs/*`

| File | Relevant to Gate 6C | Expected Change | Risk | Reason |
|---|---|---|---|---|
| `MGA_GATE_6C_PREFLIGHT_REPORT.md` | YES | READ ONLY | NONE | Source of Gate 6C scope definition. |
| `MGA_GATE_6C_IMPLEMENTATION_PLAN.md` | YES | READ ONLY | NONE | Governing plan for this inventory. |
| `MGA_GATE_6C_TEST_MATRIX.md` | YES | READ ONLY | NONE | 59 tests to satisfy before approval. |
| `QUOTE_CONNECT_360_GATE_REGISTRY.json` | YES | MODIFY | LOW | Registry must be updated as milestones are reached. |
| `QUOTE_CONNECT_360_FRAMEWORK.md` | YES | READ ONLY | LOW | Framework reference — update when gate status changes. |
| `MGA_GATE_6B_AMENDED_CLOSEOUT_REPORT.md` | NO | NONE | NONE | Closed gate — must not be touched. |

---

## Section 2 — Export Entry Point Inventory

All entry points listed below are **INACTIVE** and must remain so until Gate 6C is approved.

### 2.1 UI Entry Points

| Entry Point | Type | Current State | Gate 6C Desired State | Required Guard |
|---|---|---|---|---|
| "Export Cases" button | Button | Missing | Inactive until approved | `MGA_REPORT_EXPORTS_ENABLED` + `mga.reports.export` + scopeGate |
| "Export Quotes" button | Button | Missing | Inactive until approved | `MGA_REPORT_EXPORTS_ENABLED` + `mga.reports.export` + scopeGate |
| "Export Census" button | Button | Missing | Inactive until approved | `MGA_REPORT_EXPORTS_ENABLED` + `mga.reports.export_csv` + scopeGate |
| "Export Audit Log" button | Button | Missing | Inactive until approved | `MGA_REPORT_EXPORTS_ENABLED` + `mga.reports.audit` + scopeGate |
| "Export MGA Summary" button | Button | Missing | Inactive until approved | `MGA_REPORT_EXPORTS_ENABLED` + `mga.reports.export_pdf` + scopeGate |
| Export format selector | Modal/Dropdown | Missing | Inactive until approved | Rendered only inside export modal; guarded by same flags |
| Export modal (`MGAReportExportModal`) | Modal | Missing | Inactive until approved | Not mounted when `MGA_REPORT_EXPORTS_ENABLED = false` |
| Download link (signed URL) | Link | Missing | Inactive until approved | Generated server-side only; not exposed in UI until flag active |

### 2.2 Server / Backend Entry Points

| Entry Point | Type | Current State | Gate 6C Desired State | Required Guard |
|---|---|---|---|---|
| `functions/mgaReportExport.js` | Backend function | Missing | Inactive until approved | Feature flag check + role check + scopeGate — all three required |
| `lib/mga/services/reportingService.js` export dispatch | Service method | Stub | Inactive until approved | Called only through approved backend function |
| Storage write helper (private file upload) | Storage | Missing | Inactive until approved | Only callable from approved backend function |
| `CreateFileSignedUrl` integration call | Integration | Inactive | Inactive until approved | Only callable from approved backend function post-storage-write |
| Email delivery for async exports | Email | Inactive | Optional — inactive until approved | `SendEmail` integration; requires separate sub-approval |

### 2.3 Confirmed Non-Entry-Points (Must Not Be Used)

| Item | Reason |
|---|---|
| Direct entity reads from frontend for export | Prohibited — all exports must go through backend function |
| Public/unsigned file storage URLs | Prohibited — all artifacts use private storage + signed URLs |
| `exportProposalPDF.js` | Separate gate; not callable for MGA report exports |
| `fullDocumentationExport.js` | Separate gate; not callable for MGA report exports |
| `sendTxQuote.js` | Gate 6B only; never an export route |

---

## Section 3 — Permission / Role Inventory

### 3.1 Proposed Permission Keys

All keys below are **proposed only** — they do not exist in the current codebase.

| Permission Key | Purpose | Proposed Roles | Exists Today |
|---|---|---|---|
| `mga.reports.view` | View/access the reports section | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | ❌ No — proposed |
| `mga.reports.export` | General export action gate | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | ❌ No — proposed |
| `mga.reports.export_csv` | CSV format specifically | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | ❌ No — proposed |
| `mga.reports.export_xlsx` | XLSX format specifically | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | ❌ No — proposed |
| `mga.reports.export_pdf` | PDF format specifically | `mga_admin`, `mga_manager`, `platform_super_admin`, `admin` | ❌ No — proposed |
| `mga.reports.audit` | Audit log export specifically | `mga_admin`, `platform_super_admin`, `admin` | ❌ No — proposed |

### 3.2 Permission Enforcement Rules

- **No frontend-only permissions.** UI hiding is a UX convenience only; backend must enforce independently.
- **No hardcoded role-only checks.** All export actions must resolve through `lib/mga/permissionResolver.js` (or its Gate 6C equivalent), not inline role string comparisons.
- **All export actions must pass:** feature flag check → permission key check → scopeGate → then data retrieval. In that order. Short-circuit on first failure.

### 3.3 Existing Role-to-Permission Mapping (Current State)

| Role | Current Export-Adjacent Access | Gate 6C Addition Required |
|---|---|---|
| `mga_admin` | Full MGA management access | ✅ Grant all `mga.reports.*` keys |
| `mga_manager` | Case/workflow management | ✅ Grant `mga.reports.export`, `mga.reports.export_csv`, `mga.reports.export_xlsx`, `mga.reports.export_pdf` |
| `mga_user` | Read-only operational access | ❌ No export access |
| `mga_read_only` | Read-only | ❌ No export access |
| `platform_super_admin` | Full platform access | ✅ Grant all keys, all MGAs |
| `admin` | Platform admin | ✅ Grant all keys, all MGAs |

---

## Section 4 — Scope Boundary Inventory

Every export request must resolve and validate all applicable boundaries before any data is queried. Failure at any boundary = fail closed.

| Boundary | Field | Required For | Fail Behavior if Missing/Wrong |
|---|---|---|---|
| MGA boundary | `master_general_agent_id` | All exports | 403 — scope denied |
| MasterGroup boundary | `master_group_id` | MasterGroup-filtered exports | 403 — scope denied |
| Tenant boundary | `tenant_id` (resolved server-side) | All exports | 403 — scope denied |
| Case boundary | `case_id` | Case-level, quote-level, census-level exports | 403 — scope denied |
| Quote boundary | `quote_id` | Quote-specific exports | 400 if provided but mismatched; 403 if out of scope |
| Census boundary | `census_id` | Census-specific exports | 400 if provided but mismatched; 403 if out of scope |
| Report type boundary | `report_type` | All exports | 400 — invalid or unknown report type |
| Requesting user | `requesting_user_id` (from session) | All exports — for audit logging | 401 if unauthenticated |
| Authenticated role | `authenticated_role` (from session) | All exports — for permission check | 403 if role insufficient |

### 4.1 Scope Resolution Order

```
1. Authenticate user (401 if no session)
2. Resolve actor's MGA scope via scopeGate.js
3. Check feature flag (FEATURE_DISABLED if false)
4. Check permission key (403 if denied)
5. Validate all provided IDs against resolved scope (403 if mismatch)
6. Execute data query
7. Serialize and deliver export
8. Write audit log
```

No step may be skipped. No step may be reordered.

---

## Section 5 — Data Field Inventory

### 5.1 Allowed Fields (Export Safe)

| Entity | Allowed Fields |
|---|---|
| BenefitCase | `case_number`, `employer_name`, `stage`, `case_type`, `priority`, `effective_date`, `assigned_to`, `census_status`, `quote_status`, `enrollment_status`, `last_activity_date`, `target_close_date`, `employee_count` |
| QuoteScenario | `name`, `status`, `total_monthly_premium`, `employer_monthly_cost`, `employee_monthly_cost_avg`, `plan_count`, `confidence_level`, `is_recommended`, `quoted_at`, `expires_at`, `approval_status` |
| CensusVersion | `file_name`, `version_number`, `status`, `total_employees`, `eligible_employees`, `validation_errors`, `validation_warnings`, `uploaded_by`, `validated_at` |
| ActivityLog | `action`, `actor_email`, `actor_role`, `entity_type`, `outcome`, `created_date` |
| MasterGroup | `name`, `code`, `status`, `ownership_status`, `city`, `state` |

### 5.2 Conditionally Allowed Fields

These fields may only be exported with explicit format/scope approval and elevated role.

| Field | Entity | Condition |
|---|---|---|
| `detail` (ActivityLog) | ActivityLog | Allowed only in audit exports by `mga_admin` / platform admin; must be reviewed for sensitive content before inclusion |
| `notes` | BenefitCase, QuoteScenario | Allowed; must be stripped of any embedded tokens or links |
| `recommendation` | RenewalCycle | Allowed for renewal exports; not default |
| `date_of_birth` | CensusMember | Only if PHI export explicitly approved as a separate gate |

### 5.3 Masked Fields

| Field | Entity | Masking Rule |
|---|---|---|
| `ssn_last4` | CensusMember | Mask as `****` if included; default is excluded |
| `phone` | CensusMember, MasterGroup | Export with last 4 only: `***-***-XXXX` |
| `email` | CensusMember | Partial mask if bulk export: `u***@domain.com` |

### 5.4 Restricted Fields (Excluded from Exports)

| Field | Entity | Reason |
|---|---|---|
| `annual_salary` | CensusMember | Sensitive financial — excluded from default exports |
| `tax_id_ein` | MasterGeneralAgent | Audit-sensitive — excluded from non-platform exports |
| `old_value` / `new_value` | ActivityLog | May contain sensitive data; excluded pending review |
| `banking_setup_status` detail | MasterGeneralAgent | Financial — excluded |
| `gradient_ai_data` | CensusMember | PHI-adjacent — excluded unless PHI export separately approved |

### 5.5 Never-Export Fields

| Field | Entity | Reason |
|---|---|---|
| `access_token` | EmployeeEnrollment | Security credential — never export |
| `docusign_envelope_id` | EmployeeEnrollment | Internal system ID — never export |
| `docusign_document_url` | EmployeeEnrollment | Signed artifact URL — never export |
| `rate_locked_by` token context | QuoteScenario | Internal lock context — never export |
| `mga_migration_batch_id` | All entities | Internal migration artifact — never export |
| `mga_migration_status` | All entities | Internal migration state — never export |

### 5.6 Never-Log Fields

| Field | Reason |
|---|---|
| Authentication tokens | Security credential |
| Magic links | Security credential |
| Internal session IDs | Session security |
| Raw authorization context | Security |
| Sensitive audit body content | PII/PHI risk |
| Unredacted PHI/PII | Regulatory |
| Backend-only retention fields | Internal only |
| Source-file fields (raw census data) | PII risk |
| Signed URLs | Transient credential |
| Private file URIs | Storage path leak risk |

---

## Section 6 — Proposed New Files

All files below are **proposed only**. None should be created until this inventory is approved.

### 6.1 `components/mga/MGAReportExportModal.jsx`

| Attribute | Detail |
|---|---|
| **Purpose** | User-facing modal for export configuration: report type, format selection, date range, download trigger |
| **Why Needed** | No current export UI exists; cannot reuse proposal or documentation export modals |
| **Can Be Avoided?** | No — a dedicated, scoped modal is required to enforce flag + permission checks at mount time |
| **Risk if Omitted** | Export UX would require ad-hoc inline buttons with no centralized guard point |

### 6.2 `lib/mga/reportExportPermissions.js`

| Attribute | Detail |
|---|---|
| **Purpose** | Centralizes permission key definitions and role-to-permission mappings for Gate 6C exports |
| **Why Needed** | Prevents hardcoded role checks scattered across components and backend functions |
| **Can Be Avoided?** | Partially — could inline into `permissionResolver.js`, but separation is cleaner and lower risk |
| **Risk if Omitted** | Permission logic fragmentation; harder to audit; increased risk of bypass |

### 6.3 `lib/mga/reportExportFieldPolicy.js`

| Attribute | Detail |
|---|---|
| **Purpose** | Defines allowed, masked, restricted, and never-export field sets per export type |
| **Why Needed** | Centralizes data governance; prevents field inclusion errors in export serialization |
| **Can Be Avoided?** | No — without this, each export implementation would independently decide field inclusion, creating inconsistency and PII risk |
| **Risk if Omitted** | High — restricted fields could be inadvertently included in exports |

### 6.4 `lib/mga/reportExportAudit.js`

| Attribute | Detail |
|---|---|
| **Purpose** | Wraps `ActivityLog` writes for export-specific audit events (request, auth, scope, success, failure) |
| **Why Needed** | Enforces consistent audit schema across all export types; prevents missing or malformed audit entries |
| **Can Be Avoided?** | Partially — could inline into backend function, but centralization is strongly preferred |
| **Risk if Omitted** | Medium — audit inconsistencies would make the test matrix harder to satisfy |

### 6.5 `lib/mga/services/reportExportService.js`

| Attribute | Detail |
|---|---|
| **Purpose** | Service layer orchestrating export data queries: calls `caseService`, `quoteService`, `censusService`, `auditService` with scoped filters, applies field policy, returns serialized output |
| **Why Needed** | Keeps backend function thin; separates data orchestration from HTTP handling |
| **Can Be Avoided?** | Technically yes, but would produce an oversized backend function with mixed concerns |
| **Risk if Omitted** | Medium — testability reduced; harder to enforce field policy consistently |

### 6.6 `functions/mgaReportExport.js`

| Attribute | Detail |
|---|---|
| **Purpose** | HTTP handler: authenticates user, checks flag, checks permission, calls scopeGate, delegates to `reportExportService`, writes audit log, returns signed URL or direct download |
| **Why Needed** | Required backend entry point for all Gate 6C exports |
| **Can Be Avoided?** | No — a dedicated function is required; reusing other export functions is out of scope |
| **Risk if Omitted** | Blocking — no export path exists without this function |

### 6.7 `tests/mga/gate6c-report-export.test.js`

| Attribute | Detail |
|---|---|
| **Purpose** | Implements all 59 test cases defined in `MGA_GATE_6C_TEST_MATRIX.md` |
| **Why Needed** | Required for Gate 6C approval — 59/59 tests must pass |
| **Can Be Avoided?** | No — test matrix is a hard gate requirement |
| **Risk if Omitted** | Blocking — Gate 6C cannot be approved without test pass |

---

## Section 7 — Zero-Activation Confirmation

### Gate 6C Static Inventory Certification

| Criterion | Status |
|---|---|
| Gate 6C status | 🔴 NOT APPROVED |
| Report exports | 🔴 INACTIVE |
| Export UI activated | 🔴 NO — no export button, modal, or link has been added |
| Production export route/action enabled | 🔴 NO — `functions/mgaReportExport.js` does not exist |
| Feature flag turned on | 🔴 NO — `MGA_REPORT_EXPORTS_ENABLED` is not set anywhere in the codebase |
| Gate 6B TXQuote Transmit | 🟢 UNAFFECTED — `TXQUOTE_TRANSMIT_ENABLED = true` in `MGACaseWorkflowPanel.jsx` unchanged |
| Gate 6A Invite User | 🟢 UNAFFECTED — `MGAInviteUserModal.jsx` unchanged |
| Any runtime change made | 🔴 NO — this document is planning only |

**This inventory is a documentation artifact. Zero runtime activation has occurred.**

---

*End of Gate 6C Static Inventory & Implementation Footprint Map*  
*Commit reference: `docs(qc360): Gate 6C static inventory and footprint map`*