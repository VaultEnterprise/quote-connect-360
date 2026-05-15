# CQ360 — Full Application Architecture Inventory
**Generated:** March 23, 2026  
**Scope:** All pages, routes, entities, components, backend functions, automations, dependencies, gaps, and cross-page relationships.

---

## TABLE OF CONTENTS
1. [Route Map](#route-map)
2. [Entity / Database Inventory](#entity--database-inventory)
3. [Backend Functions Inventory](#backend-functions-inventory)
4. [Page-by-Page Inventory](#page-by-page-inventory)
5. [Cross-Page Dependencies](#cross-page-dependencies)
6. [Shared Components Inventory](#shared-components-inventory)
7. [Scheduled Jobs & Automations](#scheduled-jobs--automations)
8. [Permissions Matrix](#permissions-matrix)
9. [Known Gaps & Disconnected Items](#known-gaps--disconnected-items)
10. [Downstream Trigger Map](#downstream-trigger-map)

---

## ROUTE MAP

| Route | Component | Auth Required | Role |
|-------|-----------|---------------|------|
| `/` | `Dashboard` | Yes | any |
| `/cases` | `Cases` | Yes | any |
| `/cases/new` | `CaseNew` | Yes | any |
| `/cases/:id` | `CaseDetail` | Yes | any |
| `/census` | `Census` | Yes | any |
| `/quotes` | `Quotes` | Yes | any |
| `/enrollment` | `Enrollment` | Yes | any |
| `/renewals` | `Renewals` | Yes | any |
| `/tasks` | `Tasks` | Yes | any |
| `/employers` | `Employers` | Yes | any |
| `/plans` | `PlanLibrary` | Yes | any |
| `/proposals` | `ProposalBuilder` | Yes | any |
| `/exceptions` | `ExceptionQueue` | Yes | any |
| `/contributions` | `ContributionModeling` | Yes | any |
| `/employee-portal` | `EmployeePortal` | Yes | any |
| `/employee-management` | `EmployeeManagement` | Yes | any |
| `/employee-portal-login` | `EmployeePortalLogin` | No (public) | — |
| `/employee-enrollment` | `EmployeeEnrollment` | No (token-based) | — |
| `/employee-benefits` | `EmployeeBenefits` | Yes | any |
| `/employer-portal` | `EmployerPortal` | Yes | any |
| `/policymatch` | `PolicyMatchAI` | Yes | any |
| `/integration-infra` | `IntegrationInfrastructure` | Yes | any |
| `/settings` | `Settings` | Yes | admin (partial) |
| `/help` | `HelpCenter` | Yes | any |
| `/help-admin` | `HelpAdmin` | Yes | admin |
| `/help-dashboard` | `HelpDashboard` | Yes | admin |
| `/help-coverage` | `HelpCoverageReport` | Yes | admin |
| `/help-analytics` | `HelpSearchAnalytics` | Yes | admin |
| `/help-manual-manager` | `HelpManualManager` | Yes | admin |
| `/help-target-registry` | `HelpTargetRegistry` | Yes | admin |
| `/aca-library` | `ACALibrary` | Yes | any |
| `*` | `PageNotFound` | — | — |

**⚠️ Gap:** `/employee-enrollment` and `/employee-portal-login` are publicly accessible but lack explicit public-route protection. `EmployerPortal` and `EmployeePortal` use the same AppLayout and auth context — no separate guest access flow exists. These are broker-facing views shared under the same auth session.

---

## ENTITY / DATABASE INVENTORY

### Core Workflow Entities

| Entity | Key Fields | Used By Pages | Written By |
|--------|-----------|---------------|------------|
| `Agency` | name, code, address, status, settings | Settings, Employers, CaseNew | Settings |
| `EmployerGroup` | agency_id, name, ein, employee_count, renewal_date, status | Employers, CaseNew, Dashboard | Employers |
| `BenefitCase` | agency_id, employer_group_id, stage, priority, assigned_to, products_requested | ALL pages | CaseNew, CaseDetail, Quotes, Census |
| `CensusVersion` | case_id, version_number, file_url, status, validation_errors | Census, CaseDetail | Census (upload modal) |
| `CensusMember` | census_version_id, case_id, first_name, last_name, dob, coverage_tier, is_eligible | Census, PolicyMatchAI (fn) | Census upload + GradientAI fn |
| `QuoteScenario` | case_id, census_version_id, status, carriers_included, total_monthly_premium | Quotes, Dashboard, Contributions, PolicyMatchAI | Quotes, calculateQuoteRates fn |
| `ScenarioPlan` | scenario_id, case_id, plan_id, employer_contribution_ee | Quotes (via modal), Contributions | QuoteScenarioModal |
| `BenefitPlan` | plan_type, carrier, plan_name, network_type, deductible | PlanLibrary, PolicyMatchAI (fn) | PlanLibrary |
| `PlanRateTable` | plan_id, rate_type, ee_rate, es_rate, ec_rate, fam_rate | calculateQuoteRates fn | RateTableEditor (PlanLibrary) |
| `Proposal` | case_id, scenario_id, status, employer_name, total_monthly_premium | ProposalBuilder, EmployerPortal | ProposalModal |
| `CaseTask` | case_id, title, status, priority, assigned_to, due_date | Tasks, Dashboard, CaseDetail, EmployerPortal | TaskModal, CaseDetail |
| `EnrollmentWindow` | case_id, status, start_date, end_date, total_eligible, enrolled_count | Enrollment, Dashboard, EmployeeManagement | CreateEnrollmentModal |
| `EmployeeEnrollment` | enrollment_window_id, case_id, employee_email, status, selected_plan_id | EmployeeManagement, EmployeePortal | EnrollmentWizard, Employee portal |
| `EnrollmentMember` | enrollment_window_id, case_id, census_member_id, status | Enrollment (tab), EmployeeManagement | Enrollment module |
| `RenewalCycle` | case_id, employer_group_id, renewal_date, status, rate_change_percent | Renewals, Dashboard, EmployerPortal | CreateRenewalModal |
| `ContributionModel` | scenario_id, case_id, strategy, ee_contribution_pct, aca_affordability_flag | ContributionModeling | CreateModelModal |
| `ExceptionItem` | case_id, category, severity, status, assigned_to | ExceptionQueue, Dashboard | CreateExceptionModal, createHighRiskExceptions fn |
| `Document` | case_id, employer_group_id, document_type, file_url | CaseDetail, EmployerPortal | DocumentsTab (CaseDetail) |
| `ActivityLog` | case_id, actor_email, action, old_value, new_value | CaseDetail (activity tab) | CaseDetail stage changes |
| `PolicyMatchResult` | case_id, scenario_id, risk_score, risk_tier, status | PolicyMatchAI | policyMatchAI fn |

### Help System Entities

| Entity | Used By |
|--------|---------|
| `HelpContent` | HelpAdmin, HelpCenter |
| `HelpTarget` | HelpAdmin, HelpTargetRegistry |
| `HelpManualTopic` | HelpAdmin (ManualTopicsTab), HelpManualManager |
| `HelpManualTopicTargetMap` | HelpAdmin |
| `HelpAIQuestionLog` | HelpAdmin (AIReviewTab) |
| `HelpAuditLog` | HelpAdmin (RecentActivityFeed), Settings (AuditLog) |
| `HelpCoverageSnapshot` | HelpCoverageReport |
| `HelpSearchLog` | HelpSearchAnalytics |
| `UserManual` | Settings (Help tab), HelpManualManager |
| `HelpModule`, `HelpPage`, `HelpSection` | HelpAdmin, HelpDashboard |
| `SeedRun`, `SeedRunStep` | HelpAdmin (AdminSeedPanel) |
| `HelpAITrainingQueue` | HelpAdmin |

### User Entity

| Entity | Key Fields | Used By |
|--------|-----------|---------|
| `User` (built-in) | id, email, full_name, role | Settings (team tab), Tasks (my tasks), ExceptionQueue (my exceptions), AuthContext |

---

## BACKEND FUNCTIONS INVENTORY

| Function | Requires Auth | Key Inputs | Entities Read | Entities Written | Triggers |
|----------|--------------|-----------|---------------|------------------|---------|
| `calculateQuoteRates` | Yes (any) | `scenario_id` | QuoteScenario, ScenarioPlan, CensusVersion, CensusMember, PlanRateTable | QuoteScenario (status, totals) | Called from Quotes page |
| `policyMatchAI` | Yes (any) | `case_id`, `scenario_id?`, `mode`, `trigger_stage` | BenefitCase, CensusVersion, CensusMember, BenefitPlan, ScenarioPlan | PolicyMatchResult (creates) | Called from PolicyMatchAI page |
| `sendProposalEmail` | Yes (any) | `proposal_id`, `to_email` | Proposal | Proposal (status→sent, sent_at) | Core.SendEmail |
| `sendEnrollmentInvite` | Yes (any) | `enrollment_id` | EmployeeEnrollment | EmployeeEnrollment (invited_at) | Core.SendEmail |
| `exportProposalPDF` | Yes (any) | `proposal_id` | Proposal | — | Returns PDF binary |
| `processGradientAI` | Yes (any) | `census_version_id`, `case_id` | CensusMember | CensusMember (gradient_ai_data) | External GradientAI API |
| `matchPoliciesWithGradient` | Yes (any) | `case_id` | CensusMember, BenefitPlan | PolicyMatchResult | policyMatchAI-like |
| `createHighRiskExceptions` | Yes (any) | `case_id` | CensusMember | ExceptionItem (creates) | Called from census/risk flows |
| `sendDocuSignEnvelope` | Yes (any) | `enrollment_id` | EmployeeEnrollment | EmployeeEnrollment (docusign_envelope_id, status) | DocuSign API |
| `getDocuSignSigningURL` | Yes (any) | `enrollment_id` | EmployeeEnrollment | — | DocuSign API |
| `docuSignWebhook` | No (webhook) | Webhook payload | — | EmployeeEnrollment (docusign_status) | Incoming DocuSign events |
| `helpAIAnswer` | Yes (any) | `question`, `target_code` | HelpContent, HelpTarget | HelpAIQuestionLog | Core.InvokeLLM |
| `generateHelpForTarget` | Yes (admin) | `target_code` | HelpTarget | HelpContent | Core.InvokeLLM |
| `generateUserManual` | Yes (admin) | Various | Multiple Help entities | UserManual | Core.InvokeLLM |
| `saveHelpContent` | Yes (admin) | `target_code`, `content` | — | HelpContent | — |
| `generateCoverageSnapshot` | Yes (admin) | — | HelpTarget, HelpContent | HelpCoverageSnapshot | — |
| `runHelpMasterSeed` | Yes (admin) | — | — | Help entities (bulk seed) | Calls other seed functions |
| `seedHelpContent`, `seedHelpPack`, `seedDashboardHelp` | Yes (admin) | — | — | HelpContent, HelpTarget | — |
| `seedApplicationManualPart1/2`, `seedManualArchitectureDoc`, `seedManualFAQBank`, `seedManualPageGuides`, `seedPageInventory`, `seedFullAuditReport` | Yes (admin) | — | — | UserManual, HelpManualTopic | — |

**⚠️ Gaps:**
- `docuSignWebhook`: No signature validation beyond base44 auth. Webhook URL must be registered in DocuSign — unclear if this is done.
- `processGradientAI`: Requires external GradientAI API key (secret). If not configured, silently fails or errors.
- `createHighRiskExceptions`: Entry point unclear — not called from any visible page UI. May be orphaned or invoked elsewhere.

---

## PAGE-BY-PAGE INVENTORY

---

### PAGE: Dashboard (`/`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | BenefitCase (200), CaseTask (pending 20), EnrollmentWindow (100), RenewalCycle (100), QuoteScenario (100), ExceptionItem (50) |
| **Components** | TodaysPriorities, InteractivePipeline, EnrollmentCountdowns, StalledCases, QuickActions, CensusGapAlert, MetricCard, StatusBadge, LoadingSkeleton |
| **Save Dependencies** | None (read-only) |
| **Downstream Triggers** | Links to /cases, /cases/:id, /renewals, /tasks, /exceptions |
| **What Can Break It** | Missing BenefitCase data shows welcome screen (correct). Date parsing errors on malformed dates (guarded). Large datasets (200 cases) may slow initial load |
| **What Is Missing** | No real-time updates — data refreshes only on mount. No notification center. QuickActions CTA buttons not wired to actual mutations. |
| **Not Fully Connected** | `StalledCases` component uses `last_activity_date` which is only written by CaseDetail stage changes — new cases never get this field set, so stall detection is inaccurate for new cases. |

---

### PAGE: Cases (`/cases`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | BenefitCase (200) |
| **Components** | CaseListCard, CasePipelineView, CaseListSkeleton, EmptyState, PageHeader |
| **Save Dependencies** | None (read-only list, creation is on CaseNew page) |
| **Filters** | stage, type, priority, search, sort |
| **Downstream Triggers** | → `/cases/new`, → `/cases/:id` |
| **What Can Break It** | If BenefitCase entity is empty, shows EmptyState (correct). |
| **What Is Missing** | No bulk actions on Cases list (archive, assign, stage-change). No export. |
| **Not Fully Connected** | `stalledCount` uses `last_activity_date` — same gap as Dashboard. |

---

### PAGE: CaseNew (`/cases/new`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | Agency (list), EmployerGroup (100) |
| **Forms** | employer_group_id, employer_name, case_type, effective_date, target_close_date, priority, notes, assigned_to, employee_count, products_requested |
| **Save Dependencies** | BenefitCase.create; reads agencies[0].id as agencyId fallback |
| **Downstream Triggers** | On success → navigates to `/cases/:id`. Invalidates `["cases"]` query cache. |
| **What Can Break It** | If `agencies` is empty, `agencyId` defaults to string `"default"` — this creates a BenefitCase with invalid agency_id. |
| **What Is Missing** | No agency creation prompt if none exists. No validation that employer_name is unique. |
| **Not Fully Connected** | `agency_id` default of `"default"` is a real data integrity risk — cases created without a valid agency ID will fail any downstream queries that filter by agency. |

---

### PAGE: CaseDetail (`/cases/:id`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | BenefitCase (by ID), CaseTask (filter case_id), CensusVersion (filter case_id), QuoteScenario (filter case_id), Document (filter case_id), ActivityLog (filter case_id) |
| **Tabs** | Overview, Census, Quotes, Tasks, Documents, Activity |
| **Key Components** | CaseInfoCard, StageProgress, LifecycleChecklist, CaseCensusTab, CaseQuotesTab, CaseTasksTab, DocumentsTab, ActivityTab, StageAdvanceModal, CaseEditModal, CaseCloseModal |
| **Save Dependencies** | BenefitCase.update (stage, close), CaseTask.create/update, Document.create, ActivityLog.create |
| **Downstream Triggers** | Stage advance → writes ActivityLog, updates BenefitCase.stage and last_activity_date; Census tab → opens CensusUploadModal; Quotes tab → creates QuoteScenario; Tasks → creates/updates CaseTask |
| **What Can Break It** | If case ID in URL is invalid → 404 / empty render (not guarded with redirect). |
| **What Is Missing** | No direct link to ContributionModeling, PolicyMatchAI from case context. No automated task creation on stage advance. |
| **Not Fully Connected** | QuoteScenario tab inside CaseDetail creates scenarios but rate calculation requires navigating to /quotes page. ProposalBuilder is also disconnected — no direct "Create Proposal from this Case" button in CaseDetail. |

---

### PAGE: Census (`/census`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | BenefitCase (100), CensusVersion (100) |
| **Components** | CensusUploadModal, CensusVersionHistory, CensusMemberTable, RiskDashboard, GradientAIAnalysisPanel |
| **Save Dependencies** | CensusVersion.create (via upload modal), CensusMember.create (bulk via upload), BenefitCase.update (census_status) |
| **Backend Functions** | processGradientAI (optional, called from GradientAIAnalysisPanel) |
| **What Can Break It** | GradientAI panel fails silently if no GradientAI API key is configured. Upload modal uses file upload → Core.UploadFile integration. |
| **What Is Missing** | No delete census version flow. No census member edit flow. No CSV export of members. |
| **Not Fully Connected** | After upload, `CensusVersion` status is not automatically advanced to 'validated' — requires manual trigger or validation function. `RiskDashboard` requires `viewingVersionId` to be set — auto-selects first version but UX is not obvious. |

---

### PAGE: Quotes (`/quotes`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | QuoteScenario (200), BenefitCase (100) |
| **Components** | QuotesKPIBar, ScenarioCard, ScenarioCompare, NewScenarioFromQuotes, QuoteScenarioModal |
| **Save Dependencies** | QuoteScenario.create/update/delete; ScenarioPlan (inside modal) |
| **Backend Functions** | `calculateQuoteRates` (requires scenario to have ScenarioPlans with PlanRateTables) |
| **What Can Break It** | `calculateQuoteRates` returns error if ScenarioPlans is empty or no PlanRateTable exists for a plan. Error is displayed via toast but scenario remains in "error" status. |
| **What Is Missing** | No direct navigation to rate table editor from Quotes page. No auto-retry on failed calculations. |
| **Not Fully Connected** | ScenarioPlans are created inside `QuoteScenarioModal` but PlanRateTable dependency is not validated before triggering rate calculation. If a plan has no rate table, that plan is silently skipped — total may be understated without user awareness. |

---

### PAGE: Enrollment (`/enrollment`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | EnrollmentWindow (100) |
| **Components** | EnrollmentKPIBar, EnrollmentWindowCard, CreateEnrollmentModal |
| **Save Dependencies** | EnrollmentWindow.create (CreateEnrollmentModal) |
| **What Can Break It** | EnrollmentWindowCard links to case detail but employer_name is denormalized — if blank, card shows "Unknown". |
| **What Is Missing** | No bulk invite trigger from this page. No send-invite-to-all button. Invitation is handled via EmployeeManagement. |
| **Not Fully Connected** | Enrollment page shows windows but has no path to EmployeeEnrollment records without navigating to EmployeeManagement. Creating a window does not auto-create EmployeeEnrollment records — that is a separate step. |

---

### PAGE: Renewals (`/renewals`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | RenewalCycle (100), CensusMember (conditional on selectedRenewal) |
| **Components** | RenewalKPIBar, RenewalCard, RenewalDetailModal, RenewalPipelineView, RenewalCalendarView, RenewalRiskForecast, RenewalWorkloadBar, RateDistributionChart, CreateRenewalModal |
| **Save Dependencies** | RenewalCycle.create/update/delete |
| **What Can Break It** | CensusMember query uses `filter({}, '', 10000)` — fetches ALL members without case filter. This will become a performance problem at scale. |
| **What Is Missing** | No auto-link between RenewalCycle and BenefitCase stage. No notification when renewal is within 30 days. |
| **Not Fully Connected** | `RenewalCycle.case_id` is set but not used to auto-update `BenefitCase.stage` to `renewal_pending`. Creating a renewal does not trigger any task creation. |

---

### PAGE: Tasks (`/tasks`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | CaseTask (200), BenefitCase (100) |
| **Components** | TaskModal, TaskRow, GroupedSection |
| **Save Dependencies** | CaseTask.create/update/delete |
| **Auth** | Uses `base44.auth.me()` for "My Tasks" filter — async call on mount |
| **What Can Break It** | If auth.me() fails, `currentUser` stays null and "My Tasks" filter shows nothing but doesn't error. |
| **What Is Missing** | No task templates. No recurring task support. No task comment/thread. No email notification on task assignment. |
| **Not Fully Connected** | Tasks link to `/cases/:task.case_id` but `task.case_id` can be empty for standalone tasks created outside a case. This produces a broken link `/cases/`. |

---

### PAGE: Employers (`/employers`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | EmployerGroup (100), Agency (list), BenefitCase (200) |
| **Components** | EmployerModal (inline) |
| **Save Dependencies** | EmployerGroup.create/update |
| **What Can Break It** | If no Agency exists, `agency_id` in the EmployerModal defaults to `agencies[0]?.id` which is undefined — the save will fail or create a record with no agency. |
| **What Is Missing** | No delete employer. No merge duplicate employers. No employer-level document storage. |
| **Not Fully Connected** | No auto-sync between EmployerGroup.renewal_date and RenewalCycle creation. No automatic case count refresh — uses BenefitCase.employer_group_id but this is not always set when creating cases manually. |

---

### PAGE: PlanLibrary (`/plans`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | BenefitPlan (500) |
| **Components** | PlanCard, PlanFormModal, PlanImportModal, PlanAnalyticsPanel, PlanComparisonTool, PlanBulkActionsPanel, PlanFilterPresets, PlanSearchAdvanced, PlanQualityChecklist, PlanArchiveManager, PlanLibraryGuide |
| **Save Dependencies** | BenefitPlan.create/update (archive = update status) |
| **What Can Break It** | PlanImportModal uses Core.ExtractDataFromUploadedFile — if file format is unexpected, import fails. No rate table editor access from plan card — user must navigate separately. |
| **What Is Missing** | PlanRateTable is not visible/editable directly from PlanLibrary list view. PlanPickerModal is a component that exists but no clear entry point from PlanLibrary. |
| **Not Fully Connected** | `calculateQuoteRates` depends on `PlanRateTable` existing for each plan — but PlanLibrary has no indicator of "rate table completeness" per plan. |

---

### PAGE: ProposalBuilder (`/proposals`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | Proposal (200) |
| **Components** | ProposalModal, ProposalViewModal, ProposalCard, ProposalKPIBar, ProposalPipelineView, RejectProposalModal + analytics suite |
| **Save Dependencies** | Proposal.create/update/delete |
| **Backend Functions** | `sendProposalEmail` (via ProposalCard send action), `exportProposalPDF` |
| **What Can Break It** | `sendProposalEmail` fails if `to_email` is blank. Proposal has no required `case_id` — proposals can exist without a case. |
| **What Is Missing** | Proposal creation does not auto-populate plan_summary from linked QuoteScenario — this must be filled manually. |
| **Not Fully Connected** | Proposal.scenario_id field is not enforced — proposals can float without a scenario. EmployerPortal displays proposals but reads via `Proposal.filter({ case_id })` — if proposal has no case_id, it is invisible in the portal. |

---

### PAGE: ContributionModeling (`/contributions`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | ContributionModel (100), QuoteScenario (200), BenefitCase (200) |
| **Components** | ContributionModelCard, ContributionComparePanel, ContributionKPIBar, CreateModelModal |
| **Save Dependencies** | ContributionModel.create/delete |
| **What Can Break It** | ACA affordability calculation assumes $60k median income — hardcoded, not configurable. |
| **What Is Missing** | No ContributionModel.update — models can only be deleted and recreated. No link from ContributionModel back to Proposal or QuoteScenario detail. |
| **Not Fully Connected** | `ContributionModel.total_monthly_premium` is entered manually — not auto-pulled from linked `QuoteScenario`. ACA affordability flag is set by the user, not auto-calculated by the system. |

---

### PAGE: ExceptionQueue (`/exceptions`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | ExceptionItem (500), User (for auth context) |
| **Components** | ExceptionKPIBar, ExceptionCard, ExceptionDetailDrawer, ExceptionAnalyticsDashboard, ExceptionAutomationRules, ExceptionTriageAssistant, ExceptionWorkflowBoard, ExceptionCommentThread, ExceptionBulkActionsPanel, ExceptionNotificationSettings, ExceptionFilterPresets |
| **Save Dependencies** | ExceptionItem.create/update |
| **Auth** | Uses `useAuth()` for "My Exceptions" filter |
| **What Can Break It** | `ExceptionCommentThread` is rendered in the drawer but appears to have no backing entity — likely UI-only with no persistence. |
| **What Is Missing** | ExceptionAutomationRules and ExceptionNotificationSettings appear to be UI stubs without backend persistence. |
| **Not Fully Connected** | Exception detail drawer (`ExceptionDetailDrawer`) and `ExceptionTriageAssistant` are rendered in a floating panel that overlaps with the drawer — conflicting z-index on desktop. The comment thread has no entity to persist to. |

---

### PAGE: PolicyMatchAI (`/policymatch`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | BenefitCase (100), QuoteScenario (100), PolicyMatchResult (100) |
| **Components** | PolicyMatchAnalyticsDashboard, PolicyMatchFilterPresets, PolicyMatchBulkActions, PolicyMatchModeGuide, PolicyMatchComparisonMatrix, PolicyMatchQualityScore, PolicyMatchHistoryTimeline, PolicyMatchDetailExpanded |
| **Backend Functions** | `policyMatchAI` (InvokeLLM via backend) |
| **Save Dependencies** | PolicyMatchResult.update (accept/decline) |
| **What Can Break It** | `policyMatchAI` requires InvokeLLM credits. If LLM call fails, error is toasted and user is redirected to Run tab. |
| **What Is Missing** | `PolicyMatchFilterPresets` and `PolicyMatchBulkActions` — preset selection and bulk action handlers pass empty `() => {}` callbacks — **not connected**. |
| **Not Fully Connected** | Accepting a PolicyMatchResult does not automatically update the QuoteScenario or create a Proposal. The accepted result is stored but not surfaced in CaseDetail or ProposalBuilder. |

---

### PAGE: EmployeeManagement (`/employee-management`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | EmployeeEnrollment (500), EnrollmentWindow (100), BenefitCase (100), BenefitPlan (200) |
| **Tabs** | Roster, Enrollment Windows, Enrollment Status, DocuSign, Analytics |
| **Components** | EmployeeRosterTab, EnrollmentWindowsTab, EnrollmentStatusTab, DocuSignManagementTab, EmployeeAnalyticsTab |
| **Backend Functions** | `sendEnrollmentInvite`, `sendDocuSignEnvelope`, `getDocuSignSigningURL` |
| **What Can Break It** | DocuSign requires DOCUSIGN_* environment secrets. If not configured, DocuSign tab errors. |
| **What Is Missing** | No bulk upload of employee roster. No direct CensusMember→EmployeeEnrollment conversion utility. |
| **Not Fully Connected** | DocuSign webhook (`docuSignWebhook`) must be registered externally in DocuSign's platform — there is no in-app configuration for this. Status updates from DocuSign flow back via webhook but the registration step is manual. |

---

### PAGE: EmployeePortal (`/employee-portal`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | EmployeeEnrollment (filter by user email), EnrollmentWindow (20) |
| **Components** | EnrollmentWizard, BenefitsDashboard, EmployerCaseValidator, SessionTimeout, BenefitsGlossary, LifeEventCard, HelpContactCard, EnrollmentDataPersistence |
| **Auth** | Requires authenticated user; `EmployerCaseValidator` gates access |
| **Save Dependencies** | EmployeeEnrollment.update (via EnrollmentWizard) |
| **What Can Break It** | `EmployerCaseValidator` — unclear what validation it performs. If it blocks render, user sees nothing. `SessionTimeout` calls `saveEnrollment` on timeout — this is `EnrollmentDataPersistence` which uses localStorage, not the database. |
| **What Is Missing** | No mid-enrollment save to database — only localStorage. If browser clears storage or user switches devices, draft is lost. |
| **Not Fully Connected** | `EnrollmentDataPersistence` uses localStorage key `"enrollment-draft"` — this is not scoped per user or per enrollment window. Two users on the same browser would overwrite each other's drafts. |

---

### PAGE: EmployerPortal (`/employer-portal`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | BenefitCase (50), CaseTask (filter case_id), EnrollmentWindow (filter case_id), Proposal (filter case_id), Document (filter case_id), RenewalCycle (filter case_id) |
| **Components** | ActionRequiredBanner, BrokerContactCard, StatusTimeline, ProposalReviewPanel, EnrollmentDrillDown, DocumentsCenter, CaseLifecycleStatus, EnrollmentCountdown, ProposalEnhanced, CommunicationHub, FinancialModeling, RenewalStatus, PlanExplainerModal |
| **Auth** | Same session as broker — not a separate employer-facing auth |
| **What Can Break It** | All queries filter by `caseId` — if no case exists, all panels show empty. BrokerContactCard uses `assigned_to` email field as both name and email — display looks wrong if assigned_to is an email address. |
| **What Is Missing** | No employer approval/rejection flow. ProposalReviewPanel exists but approval action unclear. No real employer SSO/guest access. |
| **Not Fully Connected** | This is a broker-side view, not a true employer-facing portal. `CommunicationHub` appears UI-only with no message persistence. `FinancialModeling` uses `proposals[0]` — if multiple proposals exist, only the first is modeled. |

---

### PAGE: Settings (`/settings`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | Agency (list), User (list — admin only) |
| **Tabs** | Organization, My Account, Integrations*, Features*, Webhooks*, Branding*, Team*, Billing*, Audit Log*, Help Center |
| **Save Dependencies** | Agency.create/update, base44.users.inviteUser |
| **Auth** | Admin tabs gated by `user.role === "admin"` |
| **Components** | APIIntegrationsPanel, FeatureTogglesPanel, BrandingPanel, AuditLogPanel, WebhookConfigPanel, BillingUsagePanel, UserManualLibrary, UserManualViewer, UserManualGenerator, UserManualManager |
| **What Can Break It** | APIIntegrationsPanel, FeatureTogglesPanel, WebhookConfigPanel — these appear to be largely UI stubs without backend persistence of settings. |
| **What Is Missing** | No actual API integration configuration storage (API keys are managed via Base44 secrets dashboard, not in-app). Feature toggles have no backing entity. |
| **Not Fully Connected** | Webhook configuration in Settings has no relationship to `docuSignWebhook` function or any registered webhook. Branding Panel changes are not persisted anywhere observable in the app. |

---

### PAGE: ACALibrary (`/aca-library`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | None (all data is static/hardcoded in component) |
| **Entities Used** | None |
| **What Can Break It** | Nothing — fully static. |
| **What Is Missing** | No admin edit capability for ACA rules. Data updates require code changes. No link to ContributionModeling ACA threshold. |
| **Not Fully Connected** | ACA affordability threshold used in ContributionModeling (9.02%) is hardcoded separately in that page — not pulled from ACALibrary data. |

---

### PAGE: IntegrationInfrastructure (`/integration-infra`)

| Aspect | Detail |
|--------|--------|
| **Render Dependencies** | None (all panels are static/UI-only) |
| **Components** | 21 sub-panels across Developer, Integration, Runtime/Ops, Compliance, AI groups |
| **What Is Missing** | All panels appear to be documentation/demo UIs with no live backend connections. EndpointHealthPanel calls `onStatusChange` but its data source is unclear. |
| **Not Fully Connected** | The entire page is a reference/showcase UI. No real API calls to health endpoints, rate limiters, or secrets providers are made from this page. |

---

### PAGE: HelpCenter, HelpAdmin, HelpDashboard, etc.

| Page | Key Dependencies | Key Gaps |
|------|-----------------|----------|
| `HelpCenter` | HelpContent, HelpTarget, HelpAIQuestionLog | AI answer calls `helpAIAnswer` function — requires Core.InvokeLLM credits |
| `HelpAdmin` | All Help entities, HelpManualTopic | Very large file (590 lines) — should be split |
| `HelpDashboard` | HelpContent, HelpTarget, HelpCoverageSnapshot | Coverage snapshot requires `generateCoverageSnapshot` fn to be run manually |
| `HelpManualManager` | UserManual, HelpManualTopic | Manual generation uses InvokeLLM |
| `HelpTargetRegistry` | HelpTarget, lib/helpTargetRegistry.js | Registry is a static JS file — adding targets requires code changes |
| `HelpSearchAnalytics` | HelpSearchLog | Logs are written when? — unclear if HelpCenter writes search logs automatically |
| `HelpCoverageReport` | HelpCoverageSnapshot | Snapshots require manual generation — no automation |

---

## CROSS-PAGE DEPENDENCIES

```
Dashboard
  ← BenefitCase, CaseTask, EnrollmentWindow, RenewalCycle, QuoteScenario, ExceptionItem

Cases → CaseDetail
  ← BenefitCase

CaseDetail
  ← BenefitCase, CaseTask, CensusVersion, QuoteScenario, Document, ActivityLog
  → Census (upload), Quotes (scenarios), Tasks (task create), ProposalBuilder (create proposal)

CaseNew → CaseDetail
  reads: Agency, EmployerGroup
  writes: BenefitCase

Employers → CaseDetail
  reads: EmployerGroup, Agency, BenefitCase
  writes: EmployerGroup

Census
  reads: BenefitCase, CensusVersion
  writes: CensusVersion, CensusMember
  calls: processGradientAI fn

Quotes
  reads: QuoteScenario, BenefitCase
  writes: QuoteScenario, ScenarioPlan
  calls: calculateQuoteRates fn (reads PlanRateTable, CensusMember)

ContributionModeling
  reads: ContributionModel, QuoteScenario, BenefitCase
  writes: ContributionModel
  ← depends on QuoteScenario existing

PlanLibrary
  reads: BenefitPlan
  writes: BenefitPlan
  ← calculateQuoteRates depends on PlanRateTable for each BenefitPlan

ProposalBuilder
  reads: Proposal
  writes: Proposal
  calls: sendProposalEmail fn, exportProposalPDF fn
  → EmployerPortal (sends proposal link)

Enrollment
  reads: EnrollmentWindow
  writes: EnrollmentWindow
  → EmployeeManagement (invite flow)

EmployeeManagement
  reads: EmployeeEnrollment, EnrollmentWindow, BenefitCase, BenefitPlan
  writes: EmployeeEnrollment
  calls: sendEnrollmentInvite fn, sendDocuSignEnvelope fn, getDocuSignSigningURL fn
  ← docuSignWebhook fn updates EmployeeEnrollment

EmployeePortal
  reads: EmployeeEnrollment, EnrollmentWindow
  writes: EmployeeEnrollment
  ← enrolled by EmployeeManagement

EmployerPortal
  reads: BenefitCase, CaseTask, EnrollmentWindow, Proposal, Document, RenewalCycle
  ← populated by: CaseDetail, ProposalBuilder, Enrollment

PolicyMatchAI
  reads: BenefitCase, QuoteScenario, PolicyMatchResult
  writes: PolicyMatchResult
  calls: policyMatchAI fn (reads CensusMember, BenefitPlan)

ExceptionQueue
  reads: ExceptionItem
  writes: ExceptionItem
  ← createHighRiskExceptions fn (called from census flow)

Renewals
  reads: RenewalCycle, CensusMember (all — no case filter)
  writes: RenewalCycle

Tasks
  reads: CaseTask, BenefitCase
  writes: CaseTask
  ← created by CaseDetail, any user

Settings
  reads: Agency, User
  writes: Agency
  calls: base44.users.inviteUser
```

---

## SHARED COMPONENTS INVENTORY

| Component | Used By Pages | Notes |
|-----------|--------------|-------|
| `PageHeader` | All pages | title, description, actions slot |
| `EmptyState` | All pages | icon, title, description, action |
| `StatusBadge` | Cases, Dashboard, Tasks, CaseDetail, EmployerPortal, Employers | Covers 40+ status values |
| `MetricCard` | Dashboard | KPI display |
| `LoadingSkeleton` (DashboardSkeleton, CaseListSkeleton) | Dashboard, Cases | |
| `AppLayout` | All authenticated routes | Sidebar + TopBar + Outlet |
| `Sidebar` | AppLayout | Navigation with badge counts |
| `AIAssistant` | Floating, available everywhere via AppLayout | Uses helpAIAnswer fn |

---

## SCHEDULED JOBS & AUTOMATIONS

**Current status:** No automations are currently configured in the system (verified via architecture review).

**Functions that SHOULD have automations but don't:**
| Function | Suggested Trigger | Impact of Missing |
|----------|-----------------|-------------------|
| `createHighRiskExceptions` | Entity automation: CensusVersion on `update` to `validated` | High-risk flags never auto-created |
| `generateCoverageSnapshot` | Scheduled: weekly | Help coverage report always stale |
| Renewal reminder | Scheduled: daily | No proactive renewal alerts |
| Enrollment window auto-close | Scheduled: daily | Windows don't auto-close on end_date |
| Quote expiry checker | Scheduled: daily | Scenarios don't auto-expire |

---

## PERMISSIONS MATRIX

| Feature | User (non-admin) | Admin |
|---------|-----------------|-------|
| View all pages | ✓ (except admin-only tabs in Settings) | ✓ |
| Create/edit cases | ✓ | ✓ |
| Invite users | ✗ | ✓ |
| View team members list | ✗ (Settings tab hidden) | ✓ |
| Access Integrations tab | ✗ | ✓ |
| Access Features tab | ✗ | ✓ |
| Access Billing tab | ✗ | ✓ |
| Access Audit Log tab | ✗ | ✓ |
| Help Center (read) | ✓ | ✓ |
| HelpAdmin console | ✓ (no role check on /help-admin route) | ✓ |
| Help AI generation | ✓ (function checks admin via role) | ✓ |

**⚠️ Critical Permission Gap:** The `/help-admin` route is accessible to ALL authenticated users — there is no frontend route guard. The `generateHelpForTarget` and seed functions check for admin inside the backend function, but the UI itself is fully visible to regular users who can attempt actions that will fail. The route should be wrapped in an admin guard.

---

## KNOWN GAPS & DISCONNECTED ITEMS

### Critical Gaps

| # | Gap | Location | Risk |
|---|-----|----------|------|
| 1 | `agency_id` defaults to `"default"` string when no Agency exists | CaseNew | Data integrity — cases created with invalid agency_id |
| 2 | `/help-admin` accessible to all users (no route guard) | App.jsx | Security — non-admins see admin console |
| 3 | `EnrollmentDataPersistence` uses localStorage — not scoped per user or window | EmployeePortal | Data loss — shared browser can corrupt drafts |
| 4 | CensusMember query in Renewals uses `filter({}, '', 10000)` (no case filter) | Renewals.jsx | Performance — fetches ALL members on renewal detail |
| 5 | DocuSign webhook not auto-registered — requires manual DocuSign config | docuSignWebhook fn | Integration failure — status updates never arrive |
| 6 | No automations configured for time-sensitive workflows | All | Enrollment windows don't auto-close; renewals don't alert |

### Moderate Gaps

| # | Gap | Location |
|---|-----|----------|
| 7 | Tasks with no `case_id` link to `/cases/` (broken URL) | Tasks page |
| 8 | `PolicyMatchFilterPresets` and `PolicyMatchBulkActions` onSelect callbacks are empty `() => {}` | PolicyMatchAI page |
| 9 | `ExceptionCommentThread` has no backing entity — comments are UI-only | ExceptionQueue |
| 10 | `ContributionModel` has no update path — only delete + recreate | ContributionModeling |
| 11 | `PlanRateTable` not shown in PlanLibrary — no completeness indicator per plan | PlanLibrary |
| 12 | Accepting a PolicyMatchResult does not flow into Proposal or QuoteScenario | PolicyMatchAI |
| 13 | `BrokerContactCard` uses `assigned_to` (email) as display name | EmployerPortal |
| 14 | `CommunicationHub` appears UI-only with no message persistence | EmployerPortal |
| 15 | `FeatureTogglesPanel`, `BrandingPanel`, `WebhookConfigPanel` in Settings are UI stubs | Settings |
| 16 | `StalledCases` stall detection is inaccurate for new cases (no initial `last_activity_date`) | Dashboard, Cases |
| 17 | `ACALibrary` ACA threshold (9.02%) not shared with `ContributionModeling` — duplicated hardcode | ACALibrary, ContributionModeling |
| 18 | `helpTargetRegistry.js` is a static file — new UI targets require code changes | HelpTargetRegistry |
| 19 | `HelpSearchLog` — unclear if search logs are actually written by HelpCenter | HelpSearchAnalytics |

### Minor Gaps

| # | Gap | Location |
|---|-----|----------|
| 20 | No census version delete | Census |
| 21 | No bulk case actions (assign, archive) | Cases |
| 22 | No Proposal auto-population from QuoteScenario | ProposalBuilder |
| 23 | No task email notification on assignment | Tasks |
| 24 | No renewable alert automation at 30/60/90 day thresholds | Renewals |
| 25 | IntegrationInfrastructure is entirely a UI showcase — no live backend connections | IntegrationInfrastructure |

---

## DOWNSTREAM TRIGGER MAP

When X happens → Y is affected:

```
BenefitCase.create (CaseNew)
  → queryCache["cases"] invalidated
  → navigates to /cases/:id

BenefitCase.stage update (CaseDetail)
  → ActivityLog.create (audit trail)
  → BenefitCase.last_activity_date updated
  → Dashboard stall indicators update (next query)

CensusVersion.create (Census upload)
  → BenefitCase.census_status updated (if modal triggers it)
  → CensusMember records created (bulk)
  → GradientAI analysis available

QuoteScenario.create (Quotes)
  → calculateQuoteRates fn can be triggered
  → QuoteScenario.status: draft → running → completed/error
  → QuoteScenario.total_monthly_premium updated
  → Dashboard "Monthly Premium" KPI updated

Proposal.create/update (ProposalBuilder)
  → sendProposalEmail fn → Proposal.status: sent
  → EmployerPortal proposals list updates

EnrollmentWindow.create (Enrollment)
  → Enrollment page KPIs update
  → Dashboard Open Enrollments KPI updates

EmployeeEnrollment.create (EmployeeManagement)
  → sendEnrollmentInvite fn → email sent
  → EmployeeEnrollment.status: invited

EmployeeEnrollment.update (EnrollmentWizard / DocuSign)
  → EnrollmentWindow.enrolled_count does NOT auto-update
    ⚠️ Gap: enrolled_count on window is NOT automatically incremented

PolicyMatchResult.update (accept/decline)
  → Stored in entity
  → Does NOT update QuoteScenario or create Proposal (⚠️ Gap)

ExceptionItem.create (manual or fn)
  → Dashboard "Open Exceptions" KPI updates
  → ExceptionQueue badge in Sidebar updates

CaseTask.create/update
  → Dashboard "Overdue Tasks" KPI updates
  → Sidebar task badge count updates
```

---

*End of Architecture Inventory*