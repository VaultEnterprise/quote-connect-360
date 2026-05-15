# Application Rebuild Blueprint

## 1. Executive System Overview
The platform is a benefits operations system that manages employer groups, case lifecycles, census intake, pricing/rates, quote scenarios, proposals, enrollment execution, renewals, exceptions, portals, and administration. The business problem it solves is end-to-end benefits workflow coordination from employer setup through pricing, employee enrollment, renewals, and downstream operational tracking.

Major interaction chain:
Employer → Case → Census → Rates + Quotes → Proposal Decision → Enrollment → Renewal → Reporting / Integrations.

## 2. Module Breakdown
### Dashboard
Purpose: operational visibility and control.
Pages: `/`.
Dependencies: all major domain entities.
Outputs: metrics, alerts, action routing.

### Employers
Purpose: employer account, configuration, lifecycle context.
Pages: `/employers`, employer detail drawer.
Dependencies: Agency, EmployerGroup, BenefitCase, RenewalCycle, EnrollmentWindow, Proposal, Document.
Outputs: case creation context, employer control settings.

### Census
Purpose: population authority.
Pages: `/census`.
Dependencies: BenefitCase, CensusVersion, CensusMember.
Outputs: validated snapshot for quote and enrollment workflows.

### Rate Plans
Purpose: plan/rate governance.
Pages: `/plans`, `/rates`.
Dependencies: BenefitPlan, PlanRateTable, ScenarioPlan.
Outputs: deterministic pricing inputs.

### Quotes
Purpose: scenario pricing and decisioning.
Pages: `/quotes` and quote tabs inside cases.
Dependencies: BenefitCase, CensusVersion, ScenarioPlan, BenefitPlan, PlanRateTable, EnrollmentWindow, RenewalCycle.
Outputs: approved quote decision for proposal/enrollment/renewal workflows.

### Enrollment
Purpose: enrollment execution.
Pages: `/enrollment`, `/employee-management`, `/employee-enrollment`, `/employee-benefits`, `/employee-portal`.
Dependencies: EnrollmentWindow, EmployeeEnrollment, BenefitPlan, Quote decisions.
Outputs: elections, signatures, downstream exports.

### Renewals
Purpose: continuity and renewal decision support.
Pages: `/renewals`.
Dependencies: RenewalCycle, current pricing, census continuity, quote outputs.
Outputs: renewal decision and rollover actions.

### Cases
Purpose: master operational lifecycle.
Pages: `/cases`, `/cases/new`, `/cases/:id`.
Dependencies: all downstream operational entities.
Outputs: workflow states and readiness.

### Reports
Purpose: currently distributed across dashboard/analytics views; should become dedicated reporting module.
Pages: not yet formalized as one module.
Outputs: financial, operational, and system reporting.

### Admin / Configuration
Purpose: settings, team, branding, features, billing, manuals.
Pages: `/settings`.
Outputs: platform policy/config context.

### Integrations
Purpose: connector and infra management.
Pages: `/integration-infra` plus admin integration panels.
Outputs: external system connectivity and testing.

## 3. Page Inventory
### Dashboard (`/`)
Inputs: all major domain entities.
Outputs: alerts, KPIs, routed navigation.
Workflow role: operational command center.

### Cases (`/cases`)
Inputs: BenefitCase + downstream domain summaries.
Outputs: bulk stage movement, case selection.
Workflow role: case management hub.

### Case Detail (`/cases/:id`)
Inputs: BenefitCase, CaseTask, CensusVersion, QuoteScenario, EnrollmentWindow, RenewalCycle, Document, ActivityLog, ExceptionItem.
Outputs: detailed lifecycle actions.
Workflow role: per-group orchestration shell.

### Census (`/census`)
Inputs: BenefitCase, CensusVersion, CensusMember.
Outputs: validated snapshots and readiness.
Workflow role: canonical intake.

### Rates (`/rates`)
Inputs: BenefitPlan, PlanRateTable.
Outputs: rate governance.
Workflow role: pricing source maintenance.

### Quotes (`/quotes`)
Inputs: QuoteScenario, BenefitCase, CensusVersion, EnrollmentWindow, RenewalCycle, ActivityLog.
Outputs: scenarios, approvals, decision support.
Workflow role: pricing and decision engine.

### Enrollment (`/enrollment`)
Inputs: EnrollmentWindow, BenefitCase, QuoteScenario.
Outputs: enrollment window management.
Workflow role: execution control.

### Renewals (`/renewals`)
Inputs: RenewalCycle and financial/census context.
Outputs: renewal decisions and follow-up.
Workflow role: continuity planning.

### Employers (`/employers`)
Inputs: EmployerGroup, Agency, related case/enrollment/proposal/renewal data.
Outputs: employer setup and monitoring.
Workflow role: customer account layer.

### Proposals (`/proposals`)
Inputs: Proposal, quote-related inputs.
Outputs: employer review packages.
Workflow role: decision communication.

### Exceptions (`/exceptions`)
Inputs: ExceptionItem and generated issue context.
Outputs: remediation actions.
Workflow role: operational failure management.

### Settings (`/settings`)
Inputs: Agency, User, settings panels.
Outputs: admin configuration.
Workflow role: platform admin.

### Integration Infrastructure (`/integration-infra`)
Inputs: infra docs/panels.
Outputs: infrastructure reference/testing.
Workflow role: technical admin/reference.

## 4. Workflow Inventory
### Quote Workflow
Start: case reaches quote-ready stage.
Inputs: validated census, rates, plans, contributions.
Rules: census must be valid, plans must have rates.
Transitions: draft → running → reviewed → approved.
Outputs: approved quote decision.
Failure points: missing census, missing rates, stale pricing, blocked downstream compatibility.

### Enrollment Workflow
Start: approved quote / approved case.
Inputs: approved quote output, employer/case context.
Rules: quote must be enrollment compatible.
Transitions: scheduled → open → closing_soon → closed → finalized.
Outputs: employee elections and execution records.
Failure points: missing mapping, signature delays, incomplete downstream exports.

### Renewal Workflow
Start: active group approaching renewal date.
Inputs: current census, current pricing, renewal premium delta.
Rules: renewal date and comparison logic drive urgency.
Transitions: pre_renewal → marketed → options_prepared → employer_review → decision_made → completed.
Outputs: renewal decision / rollover action.
Failure points: missing pricing continuity, missing downstream conversions.

### Census Workflow
Start: census upload.
Inputs: file + case.
Rules: validation required before downstream use.
Transitions: uploaded → validating → validated / has_issues.
Outputs: canonical versioned snapshot.
Failure points: bad mapping, validation errors, stale downstream dependencies.

### Exception Workflow
Start: manual creation or policy-generated issue.
Inputs: domain failure context.
Rules: severity, status, and ownership management.
Transitions: new → triaged → in_progress → resolved / dismissed.
Outputs: remediation trace.
Failure points: missing automation and weak ownership.

## 5. Data Model Outline
Use canonical entities already present as the initial base, but add normalized version/audit/workflow entities in the rebuilt system.

Lifecycle data requirements:
- created/updated metadata
- status/stage ownership
- effective dates for rates, quotes, enrollments, renewals
- audit/version lineage
- canonical IDs linking downstream records back to source decisions

## 6. Integration Architecture Outline
Inbound: census imports, CRM/payroll sync, carrier/rate intake, webhooks.
Outbound: proposals, payroll exports, billing/install, carrier handoff, reporting extracts.
Requirements: validation, retries, reconciliation, run tracking, failure records.

## 7. Security / Roles Outline
Roles:
- admin
- user / operations
- broker
- employer
- employee
Permissions must exist at page level, action level, and workflow transition level.

## 8. Reporting / Dashboard Outline
Required KPI families:
- case pipeline
- census readiness
- quote throughput
- proposal status
- enrollment completion
- renewal risk
- exception backlog
- integration health
- financial exposure

## 9. Functional Gaps
### Exists
- all major operational modules
- substantial UI coverage
- foundational entities
- partial shared dependency services

### Partial
- quote readiness and versioning
- dashboard orchestration
- employer control plane
- proposal analytics
- renewal analytics
- exception analytics

### Missing
- platform workflow runtime
- normalized audit/version model
- deterministic quote-to-enrollment conversion service
- renewal rollover engine
- integration execution framework
- unified reporting module

## 10. Rebuild Recommendations
1. Rebuild shared domain services before UI-heavy pages.
2. Use Cases as the anchor workflow shell.
3. Rebuild Quotes, Enrollment, and Renewals on one financial engine.
4. Add normalized audit/version entities before migration.
5. Phase integrations after domain workflow stabilization.
6. Keep route names familiar but replace internals with clean module architecture.