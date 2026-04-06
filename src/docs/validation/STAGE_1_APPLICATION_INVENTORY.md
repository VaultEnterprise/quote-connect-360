# Stage 1 — Application Route and Page Inventory

Status: In Progress
Date: 2026-04-06
Scope: Full application inventory baseline for staged forensic validation

## Routes and Pages

### Broker Routes (AppLayout)
- `/` — Dashboard
- `/cases` — Cases
- `/cases/new` — CaseNew
- `/cases/:id` — CaseDetail
- `/census` — Census
- `/quotes` — Quotes
- `/enrollment` — Enrollment
- `/renewals` — Renewals
- `/tasks` — Tasks
- `/employers` — Employers
- `/plans` — PlanLibrary
- `/plans/:id` — PlanDetail
- `/proposals` — ProposalBuilder
- `/exceptions` — ExceptionQueue
- `/contributions` — ContributionModeling
- `/employee-management` — EmployeeManagement
- `/help` — HelpCenter
- `/aca-library` — ACALibrary
- `/settings` — Settings

### Admin-Only Broker Routes
- `/help-admin` — HelpAdmin
- `/help-dashboard` — HelpDashboard
- `/help-coverage` — HelpCoverageReport
- `/help-analytics` — HelpSearchAnalytics
- `/help-target-registry` — HelpTargetRegistry
- `/help-manual-manager` — HelpManualManager
- `/plan-rate-editor` — PlanRateEditor
- `/plan-analytics` — PlanAnalyticsDashboard
- `/plan-compliance` — PlanComplianceCenter
- `/plan-rating` — PlanRatingEngine
- `/policymatch` — PolicyMatchAI
- `/integration-infra` — IntegrationInfrastructure
- `/salesforce` — SalesforceIntegration

### Portal Routes (PortalLayout)
- `/employee-portal` — EmployeePortal
- `/employee-enrollment` — EmployeeEnrollment
- `/employee-benefits` — EmployeeBenefits
- `/employer-portal` — EmployerPortal

### Public Routes
- `/employee-portal-login` — EmployeePortalLogin

## Feature Inventory by Page

- Dashboard: KPI dashboard, presets, refresh, filtered operational overview
- Cases: list/pipeline views, bulk actions, analytics panels, quick create
- CaseDetail: overview, stage advance, edit/clone/close, census/quotes/tasks/docs/activity tabs
- Census: case selector, import workspace, version history, member table, risk and AI analysis
- Quotes: scenario management, calculation, compare, bulk actions, saved views
- Enrollment: enrollment windows, urgent filters, create modal
- Renewals: list/pipeline/calendar, KPI filtering, bulk actions, detail modal
- Tasks: grouped task operations, bulk complete/delete, task modal
- Employers: employer CRUD, import, bulk actions, renewal dashboard, detail drawer
- PlanLibrary: plan CRUD, imports, compare, analytics, reports, negotiation, guide modes
- PlanDetail: plan workspace, schedules, rate detail, exports, edit
- ProposalBuilder: proposal CRUD/view/reject, analytics, filters, bulk actions, pipeline
- ExceptionQueue: exception queue, resolve/create, board, analytics, settings
- ContributionModeling: model creation, ACA risk review, compare/export
- EmployeePortal: enrollment entry/dashboard flow for employees
- EmployeeManagement: roster, windows, status, DocuSign, analytics tabs
- EmployeePortalLogin: token-based employee portal access
- EmployeeEnrollment: portal enrollment wizard
- EmployeeBenefits: portal benefits dashboard
- EmployerPortal: employer-facing overview, proposals, enrollment, tasks, docs, communication
- PolicyMatchAI: AI optimization runs, results, analytics, guide
- IntegrationInfrastructure: infra reference and tooling panels
- HelpCenter: searchable help topics and manual topics
- HelpAdmin: help governance console and editor
- HelpDashboard: help governance analytics dashboard
- HelpCoverageReport: help coverage reporting
- HelpSearchAnalytics: help search and AI analytics
- HelpTargetRegistry: help target registry
- HelpManualManager: long-form help topic manager
- ACALibrary: ACA rules reference by state and federal rules
- PlanRateEditor: rate schedule and legacy rate management
- PlanAnalyticsDashboard: plan analytics
- PlanComplianceCenter: plan compliance review
- PlanRatingEngine: rating engine management
- SalesforceIntegration: sync operations and sync visibility
- Settings: settings panels (not yet fully inventoried)

## Workflow Inventory
- Case creation
- Case lifecycle progression
- Census import and validation
- Quote scenario calculation
- Proposal creation/review/rejection
- Enrollment window management
- Employee enrollment portal workflow
- Renewal planning and status management
- Task assignment/completion
- Employer CRUD and employer-to-case workflow
- Plan creation/import/rating/compliance workflow
- Exception triage and resolution
- Contribution modeling and ACA review
- Help authoring and AI-assisted help generation
- Salesforce sync workflow

## Role Access Matrix (Initial)
- Admin-only route guard enforced in App.jsx for listed admin routes
- Broker routes available to authenticated users
- Employee/employer portal routes are separately laid out
- Additional page-level role enforcement exists on some pages and requires further validation

## Dependency Map (Initial)
- Shared layouts: AppLayout, PortalLayout
- Shared UI primitives: shadcn ui components
- Shared data access: `base44.entities.*`, `base44.functions.invoke`, auth context
- Domain models present for dashboard, cases, renewals, tasks, exceptions
- Heavy use of modal/tab/drawer child components across page surfaces
- Backend dependencies include quote calculation, help system functions, token verification, Salesforce sync, imports

## Initial High-Risk Findings to Validate in Stage 2
- Direct destructive actions still using browser confirm/alert in multiple pages
- Several pages fetch broad datasets client-side and may need stronger backend/page-level role/data scoping validation
- Some portal/help/infra surfaces appear documentation-heavy and need action-by-action validation, not load-only review
- Some pages appear oversized and may hide incomplete subflows inside child components

## Stage Boundary
This document is inventory only.
No major remediation is approved or completed yet.
Next stage: page-by-page forensic inspection records and defect log.