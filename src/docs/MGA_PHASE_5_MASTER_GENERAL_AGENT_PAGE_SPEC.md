# MGA Phase 5 — Master General Agent Command Page Specification

Report date: 2026-05-04
Author: Base44 AI agent
Phase: 5 — MGA UI, Navigation, and Onboarding (NOT YET STARTED)
Status: **SPECIFICATION ONLY — No UI implemented. No route created. No navigation added. Phase 5 UI implementation blocked until explicit approval.**

Canonical documents:
- Architecture: `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`
- Phase 3 scoped services: `docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md`
- Active approval routing: `docs/MGA_PHASE_4A_ACTIVE_APPROVAL_ROUTING_REPORT.md`
- This spec: `docs/MGA_PHASE_5_MASTER_GENERAL_AGENT_PAGE_SPEC.md`

---

## Non-Implementation Control Statement

**No UI was created in this step.**
**No route was added to App.jsx.**
**No navigation entry was added.**
**No MGA UI was exposed.**
**No scoped service was activated in a live user flow.**
**No frontend entity reads, mutations, permissions, TXQuote, reporting, document, or end-user behavior was changed.**

This document is a planning and readiness specification only. Implementation is blocked until Phase 5 is explicitly approved — which requires Phase 4A approval routing, remediation rerun, second dry-run, and all Phase 4B gates to complete successfully.

---

## Current State Confirmation

| Check | Status |
|---|---|
| Live MasterGeneralAgent page exists | **NO** |
| Route for MGA page exists in App.jsx | **NO** |
| Navigation entry for MGA exists | **NO** |
| MGA UI exposed to any user | **NO** |
| Phase 5 started | **NO** |
| Phase 4B complete | **NO — blocked** |
| Phase 5 implementation approved | **NO — blocked** |

This is expected and correct. The MGA page belongs to Phase 5, which has not started.

---

## Phase 5 Prerequisites (Must All Be True Before Implementation)

| Prerequisite | Status |
|---|---|
| Phase 4A Level 0 approvals captured (BA-01 through BA-19) | **NOT COMPLETE** |
| Platform Admin index authorization (PA-INDEX-01) | **NOT COMPLETE** |
| Remediation execution rerun (RE-01 through RE-11) | **NOT STARTED** |
| Second dry-run passes all 14 acceptance thresholds | **NOT STARTED** |
| Phase 4B final backfill approved and complete | **BLOCKED** |
| All 30 indexes created and confirmed | **0 / 30** |
| Phase 5 explicit approval granted by Executive/Platform Owner | **NOT RECEIVED** |

---

## Page Identity

| Field | Value |
|---|---|
| Page name | **MasterGeneralAgentCommandPage** |
| File path (when implemented) | `pages/MasterGeneralAgentCommand.jsx` |
| **Recommended route** | **`/mga/command`** |
| Route rationale | Hierarchical, enterprise-grade, extensible (`/mga/settings`, `/mga/users`, `/mga/audit` can follow). Avoids collision with generic `/mga` root reserved for future index/landing. Clearly signals scoped command context. |
| Alternative routes considered | `/mga`, `/master-general-agent`, `/master-general-agent/command` — all rejected: `/mga` too generic, `/master-general-agent` verbose, `/master-general-agent/command` unnecessarily long |
| App.jsx entry (when implemented) | `<Route path="/mga/command" element={user?.role === 'mga_admin' \|\| user?.role === 'mga_manager' \|\| user?.role === 'mga_user' \|\| user?.role === 'mga_read_only' ? <MasterGeneralAgentCommandPage /> : <PageNotFound />} />` |
| Navigation label | Master General Agent |
| Navigation icon | `Building2` (Lucide) |
| Navigation section | Admin / MGA Operations |

---

## Page Purpose

The MasterGeneralAgentCommandPage is the primary operating dashboard for authorized MGA users. It enables an authenticated, scoped user to view and manage only the MasterGroups, cases, census imports, quotes, TXQuote transmissions, enrollment windows, documents, reports, users, and audit events that belong to their assigned MGA.

**The page must enforce:**
- Scope isolation: an MGA user sees only their MGA's data
- No client-trusted `master_general_agent_id`
- All data loads through Phase 3 scoped services
- All actions through scoped service contracts
- No cross-MGA visibility under any condition
- Fail-closed on missing or ambiguous scope

---

## Page Hierarchy

```
MasterGeneralAgent (root — from scoped service: getMGADetail)
  └── MasterGroup[] (from: listMasterGroups)
        └── BenefitCase[] (from: listCases)
              ├── CensusVersion[] (from: listCensusVersions)
              ├── CensusMember[] (from: listCensusMembers)
              ├── QuoteScenario[] (from: listQuoteScenarios — quoteService)
              ├── TXQuote workflow (from: txquoteService)
              ├── EnrollmentWindow[] (from: enrollmentService)
              ├── Document[] (from: documentService)
              ├── Report snapshots (from: reportingService)
              └── ActivityLog[] (from: auditService)
```

---

## Required Page Sections

### Section 1 — MGA Header

**Purpose:** Establish MGA identity and compliance context at the top of every page load.

**Fields to display:**

| Field | Source service | Notes |
|---|---|---|
| MGA legal name | `getMGADetail` → `legal_entity_name` | Primary identity |
| Display / trade name | `getMGADetail` → `name` | Used for UI labels |
| DBA name | `getMGADetail` → `dba_name` | Show if non-null |
| MGA status | `getMGADetail` → `status` | Badge: pending_onboarding / active / inactive / suspended |
| Onboarding status | `getMGADetail` → `onboarding_status` | Progress indicator |
| Compliance status | `getMGADetail` → `compliance_status` | Alert if issues_found or suspended |
| Agreement status | `getMGADetail` → `agreement_status` | Alert if not signed |
| Primary contact name | `getMGADetail` → `primary_contact_name` | |
| Primary contact email | `getMGADetail` → `primary_contact_email` | |
| Assigned platform owner | Platform admin metadata (if exposed by service) | Read-only; platform-admin-visible only |
| MGA code | `getMGADetail` → `code` | System reference |
| Activation date | `getMGADetail` → `activation_date` | Show if active |

**Safety rules:**
- No `tax_id_ein` displayed unless actor has explicit financial permission in RBAC matrix
- No `banking_setup_status` details beyond summary unless financial permission granted
- `created_by_platform_user` visible to platform super admin only

---

### Section 2 — KPI / Summary Widgets

**Purpose:** Give MGA users an immediate operational health view.

**Required widgets:**

| Widget | Service | Field / Computed |
|---|---|---|
| Total MasterGroups | `listMasterGroups` | count |
| Active MasterGroups | `listMasterGroups` | filter status = active |
| Active Cases | `listCases` | filter stage != closed |
| Pending Census Imports | `listCensusVersions` | filter status = uploaded or mapping or validating |
| Quotes In Progress | `quoteService.listQuoteScenarios` | filter status = draft or running |
| TXQuote Transmissions | `txquoteService` | count in_progress or pending |
| Enrollment Activity | `enrollmentService` | open enrollment windows count |
| Documents Pending Review | `documentService` | count with pending review flag |
| Open Exceptions | `exceptionService` (via auditService) | count status = new or triaged |
| Pending Approvals | `quoteService` | approval_status = pending |
| Recent Activity (last 7 days) | `auditService.listActivity` | count |

**UI behavior:**
- Each widget is a clickable card that deep-links into the relevant panel
- Widgets show a loading skeleton while scoped services resolve
- If scope gate denies: widget shows "Access restricted" — never throws an unhandled error

---

### Section 3 — Master Group Management Panel

**Purpose:** Let authorized MGA users see and manage MasterGroups under their MGA.

**List columns:**

| Column | Source |
|---|---|
| MasterGroup name | `listMasterGroups` → `name` |
| Code | `code` |
| Status | `status` badge |
| Ownership status | `ownership_status` |
| Assigned users (count) | `userAdminService` or denormalized |
| Case count | `listCases` filter by master_group_id |
| Quote count | `quoteService` filter by master_group_id |
| Last activity date | `auditService` or `updated_date` |
| Drill-in action | → opens MasterGroup detail drawer or sub-route |

**Actions:**

| Action | Service to call | RBAC required |
|---|---|---|
| Create MasterGroup | `createMasterGroupUnderMGA` (Phase 3 masterGroupService) | mga_admin only |
| Edit MasterGroup | `updateMasterGroup` | mga_admin, mga_manager |
| Archive MasterGroup | `archiveMasterGroup` | mga_admin only |
| View MasterGroup summary | `getMasterGroupSummary` | all MGA roles |
| View activity | `listMasterGroupActivity` | mga_admin, mga_manager |

**Critical implementation note:**
> The "Create MasterGroup" button MUST call `createMasterGroupUnderMGA` from the Phase 3 scoped masterGroupService. It MUST NOT use `base44.entities.MasterGroup.create()` directly. Direct entity mutation bypasses scope gate, audit, idempotency, and RBAC enforcement.

---

### Section 4 — Case / Quote / Census Workflow Panel

**Purpose:** Surface active operational workflows across all MasterGroups under the MGA.

**Sub-panels:**

#### 4a — Recent Cases
- Source: `caseService.listCases`
- Columns: employer name, case number, stage, priority, assigned to, last activity, census status, quote status
- Actions: view case detail, reassign, advance stage — all via caseService

#### 4b — Census Import Status
- Source: `censusService.listCensusVersions`
- Columns: case, version, file name, status, employee count, validation errors/warnings, uploaded by, uploaded at
- Actions: view detail via `getCensusVersionDetail`
- Note: `createCensusImportJob_PLACEHOLDER` remains fail-closed until mini-pass scope resolution completes

#### 4c — Quote Status
- Source: `quoteService.listQuoteScenarios`
- Columns: case, scenario name, status, total premium, employer cost, confidence, is_recommended, approval status, expires at
- Actions: view scenario, request approval, compare — all via quoteService

#### 4d — TXQuote Readiness and Transmission Status
- Source: `txquoteService`
- Columns: case, TXQuote case ID, destination, readiness status, transmission status, submitted at
- Actions: view readiness result, view transmission log — all via txquoteService
- Note: TXQuote transmit action requires RBAC permission + idempotency key

#### 4e — Exception Flags
- Source: `auditService` or `exceptionService`
- Columns: entity type, entity name, severity, status, assigned to, due by
- Actions: triage, assign, resolve — all via scoped service

---

### Section 5 — Documents and Reports Panel

**Purpose:** Surface MGA-scoped documents and generated report artifacts.

**Sub-panels:**

#### 5a — Recent Documents
- Source: `documentService.listDocuments`
- Columns: name, document type, case, employer, uploaded by, uploaded at, access status
- Actions: view signed URL via `documentService` (never direct file_url exposure), download

#### 5b — Generated PDFs / Exports
- Source: `documentService` or `reportingService`
- Columns: report name, type, generated at, generated by, status, expiry
- Actions: download via signed URL only; never expose raw storage URL

#### 5c — Report Snapshots
- Source: `reportingService`
- Columns: snapshot type, scope, generated at, status
- Actions: view, regenerate — via reportingService only

**Critical safety rule:**
> All document metadata, thumbnails, previews, signed links, exports, and reports MUST be loaded only through scoped services. Direct `file_url` exposure from entity records is NOT permitted on this page. Document access status must reflect RBAC permission state.

---

### Section 6 — User and Role Panel

**Purpose:** Let MGA admins manage users within their MGA scope.

**User list columns:**

| Column | Source |
|---|---|
| User email | `userAdminService` → `user_email` |
| Role | `role` badge |
| Status | `status` badge |
| Allowed MasterGroups | `allowed_master_group_ids` count or list |
| Last login | `last_login_at` |
| Invited by | `invited_by` |
| Invited at | `invited_at` |

**Actions:**

| Action | Service | RBAC |
|---|---|---|
| Invite user | `userAdminService.inviteUserToMGA` | mga_admin only |
| Update user role | `userAdminService.updateMGAUserRole` | mga_admin only |
| Restrict user to MasterGroups | `userAdminService.setAllowedMasterGroups` | mga_admin only |
| Disable user | `userAdminService.disableMGAUser` | mga_admin only |
| View permissions | `userAdminService.getUserPermissions` | mga_admin, mga_manager |

**Safety rule:**
> User management MUST use scoped services and the RBAC permission matrix. No direct `MasterGeneralAgentUser` entity mutation from the frontend. Invite action must not bypass platform invite flow.

---

### Section 7 — Audit / Activity Panel

**Purpose:** Surface the operational and security audit trail for the MGA scope.

**Event types to show:**

| Event category | Description | Visible to |
|---|---|---|
| Operational audit | Case stage changes, quote approvals, enrollment opens, document uploads | mga_admin, mga_manager (own scope only) |
| Security audit | Scope gate denials, cross-MGA attempts, failed auth | mga_admin; platform super admin |
| Governance audit | MGA creation, MasterGroup seeding, status changes, onboarding steps | mga_admin; platform super admin |
| Impersonation events | Support impersonation sessions | Platform super admin only |

**Source:** `auditService.listMGAActivity`, `auditService.listSecurityEvents`

**Safety rule:**
> Audit access itself is scope-gated. An MGA user can view only audit events within their own MGA. Platform super admin audit events (including impersonation) are not visible to MGA users under any condition.

---

## Required Scoped Services

The page MUST use only Phase 3 scoped services. No direct `base44.entities.*` calls are permitted on this page.

| Domain | Service module | Key methods |
|---|---|---|
| MGA management | `mgaService` | `getMGADetail`, `listMGAs`, `updateMGA`, `changeMGAStatus`, `manageMGAOnboarding` |
| MasterGroup | `masterGroupService` | `createMasterGroupUnderMGA`, `listMasterGroups`, `getMasterGroupDetail`, `updateMasterGroup`, `archiveMasterGroup`, `getMasterGroupSummary`, `listMasterGroupActivity` |
| Cases | `caseService` | `listCases`, `getCaseDetail`, `updateCase`, `reassignCase`, `advanceCaseStage`, `getCaseStatusSummary` |
| Census | `censusService` | `listCensusVersions`, `getCensusVersionDetail`, `listCensusMembers`, `getCensusMemberDetail` |
| Quotes | `quoteService` | `listQuoteScenarios`, `getQuoteScenarioDetail`, `requestApproval`, `approveScenario` |
| TXQuote | `txquoteService` | `getTXQuoteReadiness`, `getTransmissionStatus`, `listTXQuoteCases` |
| Enrollment | `enrollmentService` | `listEnrollmentWindows`, `getEnrollmentSummary` |
| Documents / files | `documentService` | `listDocuments`, `getDocumentSignedUrl`, `listReports` |
| Reporting / dashboard | `reportingService` | `getDashboardSummary`, `getKPIWidgets`, `getReportSnapshot` |
| Search / autocomplete | `searchService` | `searchWithinMGA`, `autocompleteCase`, `autocompleteEmployer` |
| Notifications / deep links | `notificationService` | `listNotifications`, `getDeepLink` |
| Audit / activity | `auditService` | `listMGAActivity`, `listSecurityEvents`, `listGovernanceEvents` |
| User / RBAC / settings | `userAdminService` | `listMGAUsers`, `inviteUserToMGA`, `updateMGAUserRole`, `disableMGAUser` |

---

## Required RBAC Visibility Model

| Role | Visible sections | Allowed actions |
|---|---|---|
| `mga_admin` | All sections | Full create, edit, invite, approve, transmit, export — subject to scoped service permission matrix |
| `mga_manager` | Header, KPIs, MasterGroups, Cases/Quotes/Census, Documents, Reports, Audit (operational only) | Edit cases, manage census, manage quotes, view documents — subject to permission matrix; cannot invite users, change MGA settings, or view security/governance audit |
| `mga_user` | Header (summary), KPIs (limited), assigned operational workflows only | Act only on assigned or permitted workflows; no user management, no audit, no settings |
| `mga_read_only` | Header, KPIs, all panels in read-only mode | View permitted data only; cannot create, edit, export, transmit, invite, or change any setting |
| `platform_super_admin` | All sections including governance, security, impersonation audit | Full access under explicit platform permission with mandatory audit logging |
| Support impersonation | Read-only view of permitted sections under impersonated subject's scope | Read-only; no write, transmit, export, or invite actions; all events logged |

---

## Required Safety Rules — Implementation Gate

When Phase 5 is approved and implementation begins, the page MUST comply with all of the following. Failure to comply with any rule is a blocking defect.

| Rule | Requirement |
|---|---|
| No direct frontend entity reads | All data loaded through scoped services only |
| No direct frontend entity mutations | All writes through scoped service contracts only |
| No client-trusted master_general_agent_id | `master_general_agent_id` resolved server-side via scopeGate only |
| No cross-MGA visibility | An MGA user must never see data from another MGA under any condition |
| Fail closed on missing scope | If scopeGate returns denied or scope is ambiguous, page shows access restricted — never leaks data |
| scopeGate required for every operation | Every page load, data fetch, and action must pass through scopeGate before any data is returned |
| Audit metadata on all material actions | Create, edit, approve, transmit, export, invite — all must produce audit records |
| No document metadata leakage | File URLs, signed links, metadata never exposed unless RBAC permits |
| No report/search/autocomplete leakage | Search and autocomplete results scoped to MGA; no cross-MGA result possible |
| No TXQuote action without RBAC + idempotency | TXQuote transmit requires explicit permission + idempotency_key |
| No access without active MGA membership | User must have an active MasterGeneralAgentUser record for the correct MGA |
| Impersonation read-only | Support impersonation sessions cannot trigger any write, transmit, export, or invite action |
| No fake or placeholder MGA assignment | Page must validate that the MGA record is real, active, and has passed scope validation |
| Document signed URLs expire | Signed document/report URLs must use time-limited signed links; never raw storage URLs |
| Session-scoped access only | Page access does not persist scope between sessions; re-resolved on every load |

---

## Phase 5 Implementation Plan (When Approved)

### Step order when Phase 5 is approved:

1. Create `pages/MasterGeneralAgentCommand.jsx` — layout and routing skeleton only (no live service calls yet)
2. Add route `/mga/command` to `App.jsx` with RBAC gate
3. Add navigation entry (sidebar) with role visibility guard
4. Wire MGA Header section → `mgaService.getMGADetail`
5. Wire KPI widgets → respective scoped services
6. Wire MasterGroup Management Panel → `masterGroupService`
7. Wire Case / Quote / Census Workflow Panel → `caseService`, `censusService`, `quoteService`
8. Wire TXQuote panel → `txquoteService`
9. Wire Documents and Reports Panel → `documentService`, `reportingService`
10. Wire User and Role Panel → `userAdminService`
11. Wire Audit / Activity Panel → `auditService`
12. Implement RBAC visibility guards per section
13. Implement fail-closed error boundaries
14. Test all scopeGate paths (allowed, denied, scope-pending, cross-MGA attempt)
15. Generate Phase 5 completion audit report

**None of these steps may begin until Phase 5 is explicitly approved.**

---

## Required Output Confirmation

| Item | Value |
|---|---|
| **Live MasterGeneralAgent page currently exists** | **NO — confirmed** |
| **UI implementation created in this step** | **NO — confirmed** |
| **Route added to App.jsx** | **NO — confirmed** |
| **Navigation modified** | **NO — confirmed** |
| Spec path | `docs/MGA_PHASE_5_MASTER_GENERAL_AGENT_PAGE_SPEC.md` |
| Recommended route | **`/mga/command`** |
| Recommended page name | **`MasterGeneralAgentCommandPage`** |
| Required page file (future) | `pages/MasterGeneralAgentCommand.jsx` |
| Required sections | MGA Header, KPI Widgets, MasterGroup Management, Case/Quote/Census Workflows, Documents/Reports, User/Role, Audit/Activity — 7 sections |
| Required scoped services | 13 service domains — mgaService, masterGroupService, caseService, censusService, quoteService, txquoteService, enrollmentService, documentService, reportingService, searchService, notificationService, auditService, userAdminService |
| Required RBAC roles | mga_admin, mga_manager, mga_user, mga_read_only, platform_super_admin, support_impersonation |
| Required safety rules | 15 mandatory implementation rules |
| Phase 5 implementation blocked | **YES — until explicit Phase 5 approval** |
| **Phase 4B remains blocked** | **YES — confirmed** |
| UI, navigation, service activation, migration/backfill, seeding, repair, quarantine, permission, TXQuote, reporting, document, or end-user behavior changes made | **NONE — confirmed** |

*End of MGA Phase 5 Master General Agent Command Page Specification.*
*Report path: `docs/MGA_PHASE_5_MASTER_GENERAL_AGENT_PAGE_SPEC.md`*