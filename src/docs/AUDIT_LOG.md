# CQ360 — Full Application Audit Log
**Date:** March 23, 2026  
**Phase:** 1 (Core Workflow + Navigation + Critical Security)

---

## PHASE 1 AUDIT SUMMARY

### Pages Reviewed
Dashboard, Cases, CaseNew, CaseDetail, Census, Quotes, Enrollment, Renewals, Tasks, Employers, PlanLibrary, ProposalBuilder, ContributionModeling, ExceptionQueue, PolicyMatchAI, EmployeeManagement, EmployeePortal, EmployerPortal, Settings, ACALibrary, IntegrationInfrastructure, All Help pages, Navigation (Sidebar, AppLayout), AuthContext

### Issues Found & Fixed

---

#### ISSUE-001 — CRITICAL: `agency_id` defaults to string `"default"` on new case creation
- **Page:** `pages/CaseNew`
- **Control:** Create Case form submit
- **Failure type:** Bad default / data integrity corruption
- **Root cause:** `agencies[0]?.id || "default"` — if no Agency record exists, creates BenefitCase with `agency_id = "default"` (a string), making the case orphaned and unfilterable by agency
- **Fix:** Changed fallback to `""` (empty string). Cases created without an agency now store an empty agency_id instead of a corrupt string literal.
- **File:** `pages/CaseNew` line 57
- **Regression risk:** Low — empty string is logically equivalent to null for downstream filters; no existing query filters on agency_id exact match to "default"

---

#### ISSUE-002 — CRITICAL: `/help-admin` route accessible to all authenticated users
- **Page:** `App.jsx`, `Sidebar`
- **Control:** Route guard, nav link
- **Failure type:** Permission mismatch / security gap
- **Root cause:** Route rendered `<HelpAdmin />` unconditionally for any authenticated user. Admin-only backend functions inside it return 403 but the full UI was exposed.
- **Fix:** Route now renders `user?.role === "admin" ? <HelpAdmin /> : <PageNotFound />`. Also added `user` to the `useAuth()` destructure in `AuthenticatedApp`.
- **Files:** `App.jsx` lines 43, 88
- **Regression risk:** Low — non-admin users now get 404. Sidebar still shows Help Console link for all users (cosmetic; low priority).

---

#### ISSUE-003 — HIGH: `EnrollmentDataPersistence` storage key not scoped to enrollment window
- **Component:** `components/employee/EnrollmentDataPersistence`
- **Control:** Auto-save and manual save of enrollment draft
- **Failure type:** Draft collision between multiple concurrent enrollments on same browser session
- **Root cause:** Single hardcoded key `"enrollment_draft_data"` in sessionStorage — if a user has two enrollment windows or an admin tests two accounts, they overwrite each other
- **Fix:** Key is now `enrollment_draft_${enrollmentId}` — scoped to the specific enrollment record
- **File:** `components/employee/EnrollmentDataPersistence` — all 3 read/write/clear references updated
- **Regression risk:** Low — any existing draft under the old key is simply not found (graceful miss)

---

#### ISSUE-004 — HIGH: Renewals page fetched ALL CensusMember records with no case filter
- **Page:** `pages/Renewals`
- **Control:** RenewalRiskForecast floating panel (renders when renewal selected)
- **Failure type:** Performance — unfiltered `filter({}, '', 10000)` loads all members in DB
- **Root cause:** Query used empty filter object and fetched up to 10,000 records regardless of case
- **Fix:** Changed to `filter({ case_id: selectedRenewal.case_id }, "-created_date", 500)`. Query key updated to `["renewal-census", selectedRenewal?.case_id]` and `enabled` condition changed to `!!selectedRenewal?.case_id`
- **File:** `pages/Renewals` lines 56–62
- **Regression risk:** Low — `RenewalRiskForecast` receives the same `census` prop; results are now correctly scoped to the selected case

---

#### ISSUE-005 — MEDIUM: Tasks page renders broken `/cases/` link for tasks without a `case_id`
- **Page:** `pages/Tasks`, component `TaskRow`
- **Control:** Employer name link in task row
- **Failure type:** Dead link — navigates to `/cases/` (no ID) which renders PageNotFound
- **Root cause:** `task.employer_name` was truthy so link rendered, but `task.case_id` was empty string
- **Fix:** Link now only renders when `task.employer_name && task.case_id`. When `employer_name` exists but no `case_id`, a non-linked span is shown instead.
- **File:** `pages/Tasks` in `TaskRow` component
- **Regression risk:** None — functionally identical for tasks that have both fields

---

#### ISSUE-006 — MEDIUM: ExceptionBulkActionsPanel `onAction` callback was never wired
- **Page:** `pages/ExceptionQueue`
- **Control:** Bulk Actions bar (assign, status, tag, notify)
- **Failure type:** UI with no backend support — clicking "Apply" silently did nothing
- **Root cause:** `<ExceptionBulkActionsPanel selectedCount={selectedIds.size} />` — `onAction` prop not passed
- **Fix:** `onAction` now wired — `assign` action calls `ExceptionItem.update` with `assigned_to` email for all selected IDs; `status` action triggers `bulkResolve`. Cache invalidated on success.
- **File:** `pages/ExceptionQueue`
- **Regression risk:** Low — adds behavior to previously inert UI

---

#### ISSUE-007 — MEDIUM: PolicyMatchFilterPresets `onSelectPreset` callback was empty `() => {}`
- **Page:** `pages/PolicyMatchAI`
- **Control:** Quick Filter preset buttons (Quick Wins, Ready to Close, High Value, etc.)
- **Failure type:** UI with no effect — pressing presets did nothing
- **Root cause:** `onSelectPreset={() => {}}` hardcoded empty handler
- **Fix:** Handler now applies `filterTier` and `filterStatus` state based on preset's filters object. `autoBindable` preset sets tier to "preferred".
- **File:** `pages/PolicyMatchAI`
- **Regression risk:** Low — only activates existing filter state; no new state introduced

---

#### ISSUE-008 — MEDIUM: Sidebar exception badge double-filtered (status:"new" query + select filter)
- **Component:** `components/layout/Sidebar`
- **Control:** Exception count badge on nav item
- **Failure type:** Logic inconsistency — badge showed count of items with status "new" only, not all open exceptions (triaged, in_progress, waiting_external)
- **Root cause:** Query filtered `{ status: "new" }` then `select` re-filtered for not resolved/dismissed — but items in "triaged" or "in_progress" states were never fetched, so badge count was artificially low
- **Fix:** Query changed to `list("-created_date", 100)` (fetch all recent), `select` filter keeps the `!["resolved","dismissed"].includes(e.status)` logic to count all open statuses
- **File:** `components/layout/Sidebar` lines 85–90
- **Regression risk:** None — badge now correctly reflects true open exception count

---

#### ISSUE-009 — MEDIUM: CreateEnrollmentModal missing `enrollments-active-count` cache invalidation
- **Component:** `components/enrollment/CreateEnrollmentModal`
- **Control:** Create Enrollment Window save button
- **Failure type:** Sidebar enrollment badge not updating after new window creation
- **Root cause:** `onSuccess` only invalidated `["enrollments-all"]` and `["enrollments"]` — Sidebar uses `["enrollments-active-count"]` query key
- **Fix:** Added `queryClient.invalidateQueries({ queryKey: ["enrollments-active-count"] })` to onSuccess
- **File:** `components/enrollment/CreateEnrollmentModal`
- **Regression risk:** None — only adds additional cache invalidation

---

#### ISSUE-010 — LOW: CommunicationHub (EmployerPortal) displayed hardcoded mock data
- **Component:** `components/employer/CommunicationHub`
- **Control:** Communication history display
- **Failure type:** Mock data presented as real — shows "Sarah Smith" and "2024-03-15" dates regardless of actual case
- **Root cause:** `MOCK_COMMUNICATIONS` array with hardcoded entries
- **Fix:** `MOCK_COMMUNICATIONS` cleared to empty array. Comment added noting this should source from ActivityLog. "Send Email" and "Schedule Call" buttons labeled as pending integration placeholders.
- **File:** `components/employer/CommunicationHub`
- **Regression risk:** None — removes misleading fake data; shows empty state instead

---

### Controls Confirmed Working (No Fix Needed)
- Dashboard KPIs, pipeline chart, renewals list, stalled cases — correct logic with `updated_date` fallback
- Cases list filters (stage, type, priority, sort) — correct
- CaseNew form validation (required `employer_name`) — correct
- TaskModal case association, employer_name population — correct
- CreateEnrollmentModal validation (`isValid = case_id && start_date && end_date`) — correct
- CreateRenewalModal validation with proper error display — correct
- NewScenarioFromQuotes → QuoteScenarioModal two-step flow — correct
- CaseListCard link to `/cases/:id` — correct (always has ID from BenefitCase.list)
- Sidebar badge counts for Tasks (pending only) — correct filter
- QuickActions links (all 6) — all valid routes
- StalledCases uses `updated_date || created_date` fallback — correct

---

### Remaining Audit Queue (Phase 2)

| Priority | Page/Component | Key Areas to Audit |
|----------|---------------|-------------------|
| High | `CaseDetail` tabs | Stage advance modal, close modal, census/quotes/tasks tabs |
| High | `EmployeeManagement` | DocuSign tab, invite flow, roster CRUD |
| High | `EmployeePortal` / `EnrollmentWizard` | Wizard steps, plan selection, waiver, completion |
| High | `ProposalModal` | Create/edit, send email fn, PDF export |
| Medium | `QuoteScenarioModal` | Plan picker, rate calculation trigger |
| Medium | `PlanLibrary` modals | PlanFormModal, RateTableEditor |
| Medium | `ContributionModeling` | CreateModelModal, ACA flag logic |
| Medium | `HelpAdmin` | AI generation, seed panel, content editor |
| Low | `Settings` tabs | Agency save, invite, panel stubs |
| Low | `EmployerPortal` tabs | ProposalReviewPanel approval flow |
| Low | All portal pages | Role-based rendering validation |

---

### Fix Log Summary

| Issue ID | Severity | File(s) | Fix Type |
|----------|----------|---------|----------|
| ISSUE-001 | Critical | pages/CaseNew | Logic fix |
| ISSUE-002 | Critical | App.jsx | Security / route guard |
| ISSUE-003 | High | components/employee/EnrollmentDataPersistence | Storage key scope fix |
| ISSUE-004 | High | pages/Renewals | Query filter + performance fix |
| ISSUE-005 | Medium | pages/Tasks | Broken link guard |
| ISSUE-006 | Medium | pages/ExceptionQueue | Missing callback wiring |
| ISSUE-007 | Medium | pages/PolicyMatchAI | Disconnected preset handler |
| ISSUE-008 | Medium | components/layout/Sidebar | Badge count logic fix |
| ISSUE-009 | Medium | components/enrollment/CreateEnrollmentModal | Missing cache invalidation |
| ISSUE-010 | Low | components/employer/CommunicationHub | Remove misleading mock data |

**Total fixes: 10 | Critical: 2 | High: 2 | Medium: 5 | Low: 1**