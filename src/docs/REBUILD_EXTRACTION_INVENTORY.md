# Full Extraction Inventory

## Executive Summary
This application is a benefits operations platform centered on case-driven workflows. The current system already contains major functional domains for employers, cases, census, rates, quotes, enrollment, renewals, proposals, exceptions, settings, help, employee-facing flows, and integration infrastructure. The core business intent is valid, but business logic is spread across page components, audit/version patterns are inconsistent, and downstream execution layers are only partially normalized.

## Route Inventory
- `/` — Dashboard
- `/cases` — Cases workspace
- `/cases/new` — Case creation
- `/cases/:id` — Case detail workspace
- `/census` — Census management
- `/quotes` — Quote scenarios
- `/enrollment` — Enrollment operations
- `/renewals` — Renewal operations
- `/tasks` — Task operations
- `/employers` — Employer groups
- `/plans` — Plan library
- `/rates` — Rate governance
- `/proposals` — Proposal builder
- `/exceptions` — Exception queue
- `/contributions` — Contribution modeling
- `/employee-portal` — Employee portal
- `/employee-management` — Employee management
- `/employee-enrollment` — Employee enrollment
- `/employee-benefits` — Employee benefits
- `/employer-portal` — Employer portal
- `/policymatch` — Policy matching AI
- `/integration-infra` — Integration infrastructure
- `/settings` — Settings/admin
- `/help` — Help center
- `/help-admin` — Help admin
- `/help-dashboard` — Help dashboard
- `/help-coverage` — Help coverage report
- `/help-analytics` — Help search analytics
- `/help-target-registry` — Help target registry
- `/help-manual-manager` — Help manual manager
- `/aca-library` — ACA library

## Core Modules
### Dashboard
Purpose: cross-domain operational control center.
Dependencies: BenefitCase, CaseTask, EnrollmentWindow, ExceptionItem, CensusVersion, QuoteScenario, RenewalCycle, Document, EmployerGroup, Proposal, EmployeeEnrollment, ActivityLog.
Features: KPI cards, health strip, bottlenecks, action center, domain cards, activity feed, next best actions.

### Cases
Purpose: workflow system-of-record for group lifecycle.
Dependencies: EmployerGroup, BenefitCase, CaseTask, CensusVersion, QuoteScenario, Document, EnrollmentWindow, RenewalCycle, ExceptionItem, ActivityLog.
Features: pipeline/list views, filters, bulk operations, stage progression, dependency checks, tasking, audit, case tabs.

### Employers
Purpose: employer account management and configuration context.
Dependencies: EmployerGroup, Agency, BenefitCase, Document, CensusMember, Proposal, EnrollmentWindow, RenewalCycle.
Features: employer CRUD, control summary, dependency panel, quick case creation, renewals overview, import.

### Census
Purpose: canonical versioned population intake and validation.
Dependencies: BenefitCase, CensusVersion, CensusMember, EnrollmentWindow, RenewalCycle.
Features: case selector, snapshot history, readiness panel, member viewer, upload flow, risk dashboard, GradientAI analysis.

### Rates / Plan Governance
Purpose: pricing source of truth.
Dependencies: BenefitPlan, PlanRateTable, ScenarioPlan, QuoteScenario, EmployeeEnrollment, RenewalCycle.
Features: plan search/filter, plan CRUD, rate table management, dependency summary.

### Quotes
Purpose: pricing and scenario decision engine.
Dependencies: BenefitCase, QuoteScenario, CensusVersion, EnrollmentWindow, RenewalCycle, ScenarioPlan, ActivityLog.
Features: scenario creation, scenario compare, contribution modeling, pipeline status, validation decks, dependency trace, activity feed, version snapshots, approval.

### Enrollment
Purpose: open enrollment execution.
Dependencies: EnrollmentWindow, BenefitCase, QuoteScenario.
Features: KPI bar, urgent warnings, filters, create enrollment modal, quote readiness banner.

### Renewals
Purpose: renewal pipeline and decision operations.
Dependencies: RenewalCycle, BenefitCase, CensusMember, BenefitPlan, PlanRateTable, ScenarioPlan, QuoteScenario, EmployeeEnrollment.
Features: KPI-driven filters, workload view, charting, list/pipeline/calendar modes, bulk actions, risk forecast, create modal.

### Proposals
Purpose: employer-facing quote communication layer.
Dependencies: Proposal, QuoteScenario, ScenarioPlan, BenefitCase.
Features: analytics, pipeline, quality score, comparison matrix, workflow suggestions, bulk actions, export, expiry management.

### Exceptions
Purpose: cross-domain issue queue.
Dependencies: ExceptionItem, BenefitCase, CensusVersion, QuoteScenario, EnrollmentWindow, RenewalCycle.
Features: list/board/analytics/settings modes, triage, comments, bulk actions, automation rules, detail drawer, generated exception candidates.

### Settings / Admin
Purpose: org settings, team, feature toggles, billing, integration config, manuals.
Dependencies: Agency, User, Base44 team invite, help/manual content.
Features: organization config, account, integrations, webhooks, branding, team invites, billing, audit, help/manual management.

### Integration Infrastructure
Purpose: documentation-style infra control surface.
Dependencies: infra panels only.
Features: stack map, API/testing/reference tabs, compliance, AI integration assistant.

## Core Entities
- Agency
- EmployerGroup
- BenefitCase
- CaseTask
- CensusVersion
- CensusMember
- BenefitPlan
- PlanRateTable
- QuoteScenario
- ScenarioPlan
- Proposal
- EnrollmentWindow
- EnrollmentMember
- EmployeeEnrollment
- RenewalCycle
- Document
- ActivityLog
- ExceptionItem
- CaseFilterPreset
- ViewPreset

## Canonical Relationships
- Agency 1→many EmployerGroup
- EmployerGroup 1→many BenefitCase
- BenefitCase 1→many CensusVersion
- BenefitCase 1→many CaseTask
- BenefitCase 1→many QuoteScenario
- QuoteScenario 1→many ScenarioPlan
- ScenarioPlan many→1 BenefitPlan
- BenefitPlan 1→many PlanRateTable
- BenefitCase 1→many EnrollmentWindow
- BenefitCase 1→many RenewalCycle
- BenefitCase 1→many Document
- BenefitCase 1→many ActivityLog
- BenefitCase 1→many ExceptionItem

## Major Workflow Inventory
### Employer → Case
EmployerGroup establishes account context, then a BenefitCase is created for quoting/enrollment/renewal work.

### Case → Census
Case stage drives census upload, versioning, validation, and readiness.

### Census → Quotes
Validated CensusVersion becomes pricing input for QuoteScenario.

### Rates → Quotes
BenefitPlan and PlanRateTable drive scenario pricing.

### Quotes → Proposals
Scenarios feed proposal generation and employer review.

### Quotes / Proposal Approval → Enrollment
Approved quote output is expected to feed enrollment setup, but the workflow is only partially formalized.

### Active Business → Renewals
Active/renewal cases become RenewalCycle records for renewal decisioning.

### Cross-Domain → Exceptions / Dashboard
Operational failures and readiness issues surface into dashboard summaries and exception workflows.

## Business Rules Already Present
- Case stages govern readiness and next-stage validation.
- Census must be validated before quote creation.
- Quote readiness depends on census validity plus rated plans.
- Enrollment relies on approved/ready quote state.
- Renewals rely on date-based urgency and rate-change evaluation.
- Exception severity/status models exist with triage and resolution states.
- Proposal expiration and stale review detection exist.
- Quote scenario version snapshots exist inline in records.

## Reusable UI / UX Patterns
- PageHeader
- Metric/KPI cards
- Status badges
- Bulk action bars
- Empty states
- List cards + pipeline/kanban views
- Multi-tab detail workspaces
- Modal-driven create/edit flows
- Cross-domain dependency summary cards
- Filter bars with saved presets

## Structural Problems To Avoid Carrying Forward
- Page-level business logic mixed with UI rendering.
- Duplicate financial and readiness logic across modules.
- In-record versioning instead of normalized audit/version entities.
- Missing shared orchestration/state machine runtime.
- Partial downstream mapping from quotes to enrollment/renewals/payroll/billing.
- Integration surfaces that are informational, not operational.
- Inconsistent module boundaries and naming across related control planes.
- Excessively large page files coordinating too much logic directly.
- Exception automation not fully normalized across domains.
- Weak cross-domain dependency ownership.

## Functional Gaps Extracted
- No single workflow runtime enforcing state transitions across modules.
- Quote-to-enrollment conversion is not a dedicated canonical service.
- Renewal rollover to quotes/enrollment is incomplete.
- Payroll/carrier/EDI/billing/reporting execution integrations are incomplete.
- Shared audit trail for pricing/rates/version lineage is incomplete.
- Deterministic downstream cost/deduction engine is not centrally owned.
- Exception auto-generation coverage is incomplete.
- Role/security boundaries are UI-aware but not fully centralized as policies.