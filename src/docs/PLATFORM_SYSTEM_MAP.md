# Platform System Map

## Current Control Planes
- **Cases**: primary workflow orchestrator and stage authority for operational lifecycle movement.
- **Census**: authoritative versioned population snapshot source for downstream pricing and enrollment readiness.
- **Rates**: authoritative rate table and pricing governance source for plan pricing inputs.
- **Quotes**: scenario-based pricing, contribution, and decision pipeline engine.
- **Enrollment**: execution layer for approved quote outcomes and employee elections.
- **Renewals**: renewal comparison and decision flow for active groups.
- **Employers**: employer-level configuration and readiness context.
- **Dashboard**: operational visibility layer consuming all major domains.

## Page-by-Page Dependency Map

### Dashboard
**Purpose**
- Unified command center for active workflows, bottlenecks, health, and routed platform navigation.

**Upstream dependencies**
- BenefitCase
- CaseTask
- EnrollmentWindow
- ExceptionItem
- CensusVersion
- QuoteScenario
- RenewalCycle
- Document
- EmployerGroup
- Proposal
- EmployeeEnrollment

**Downstream consumers**
- Human operations teams using dashboard metrics to route work into Cases, Census, Quotes, Enrollment, Renewals, Employers, Proposals, and Exceptions.

**Observed gaps**
- Read-only orchestration; no central workflow runtime driving automatic corrective actions.
- No shared platform-level dependency registry feeding this page.
- Metrics are entity-driven but not yet backed by a formal cross-domain health model.

### Cases
**Purpose**
- Operational system-of-record for case lifecycle, dependency visibility, and stage transitions.

**Upstream dependencies**
- EmployerGroup
- CensusVersion
- QuoteScenario
- EnrollmentWindow
- RenewalCycle
- CaseTask
- ExceptionItem
- ActivityLog

**Downstream consumers**
- Census intake
- Quote generation
- Enrollment creation
- Renewal execution
- Exception remediation
- Dashboard and employer rollups

**Observed gaps**
- Strong stage visibility exists, but no backend orchestration enforces state transitions platform-wide.
- Bulk operations are UI-driven instead of runtime-policy-driven.
- Missing automatic case exception creation from cross-domain failures.

### Census
**Purpose**
- Canonical versioned census snapshot intake, validation, and readiness control.

**Upstream dependencies**
- BenefitCase
- CensusVersion
- CensusMember
- ActivityLog

**Downstream consumers**
- Quotes pricing inputs
- Enrollment eligibility population
- Renewals population continuity
- Dashboard system health
- Cases stage readiness

**Observed gaps**
- Snapshot model exists, but no universal downstream subscription/orchestration layer consumes census change events.
- No automatic exception generation for blocking census issues.
- No explicit employer-level propagation summary after import.

### Rates
**Purpose**
- Versioned plan/rate configuration authority and pricing governance source.

**Upstream dependencies**
- BenefitPlan
- PlanRateTable

**Downstream consumers**
- QuoteScenario calculation
- ScenarioPlan pricing
- Enrollment selected plan pricing
- Renewal premium comparison
- Dashboard/financial reporting

**Observed gaps**
- Shared pricing governance utilities now exist, but enrollment and renewals do not yet fully consume the same engine.
- No formal plan-rate version audit stream.
- No automated blocking when quoted plans lose valid effective-date pricing.

### Quotes
**Purpose**
- Scenario pricing engine, comparison workspace, contribution modeling surface, and decision pipeline.

**Upstream dependencies**
- BenefitCase
- CensusVersion
- ScenarioPlan
- BenefitPlan
- PlanRateTable
- EnrollmentWindow
- RenewalCycle

**Downstream consumers**
- ProposalBuilder
- Enrollment
- Renewals
- Cases stage progression
- Dashboard quote metrics

**Observed gaps**
- Governance layer added, but quote-to-enrollment conversion is not yet formalized as a dedicated workflow.
- Scenario versioning exists in-record only; no full audit entity/system stream.
- No strict downstream compatibility registry for payroll/carrier/billing handoff.

### Enrollment
**Purpose**
- Open enrollment window management and employee election execution.

**Upstream dependencies**
- BenefitCase
- EnrollmentWindow
- EmployeeEnrollment
- QuoteScenario
- BenefitPlan
- ScenarioPlan
- DocuSign workflow

**Downstream consumers**
- Employee portals
- Employer visibility
- Payroll deductions
- Billing/install workflows
- Dashboard metrics

**Observed gaps**
- Enrollment UI does not yet fully pull deterministic quote/rate governance for every selected plan.
- Missing centralized deduction engine bound to approved quote outputs.
- Payroll/billing/export integrations remain incomplete.

### Renewals
**Purpose**
- Renewal pipeline, rate change comparison, employer decision support, and continuity management.

**Upstream dependencies**
- RenewalCycle
- BenefitCase
- CensusMember
- Quote outputs
- Rate inputs

**Downstream consumers**
- Cases renewal stages
- Employers renewal visibility
- Future quote generation
- Dashboard workload and risk indicators

**Observed gaps**
- Renewal detail remains partly manual around premium comparison.
- Missing direct linkage to versioned rate governance for current-vs-renewal comparison.
- Missing structured conversion from renewal outcome back into quotes/enrollment workflows.

### Employers
**Purpose**
- Employer account workspace and control plane summary for configuration, lifecycle context, and renewals.

**Upstream dependencies**
- EmployerGroup
- Agency
- BenefitCase
- CensusMember
- Proposal
- EnrollmentWindow
- RenewalCycle
- Document

**Downstream consumers**
- Cases creation
- Renewal planning
- Employer portal
- Enrollment readiness
- Dashboard aggregate visibility

**Observed gaps**
- Employer control plane is present, but no single employer orchestration layer pushes config constraints into quotes/enrollment/rates automatically.
- Payroll, billing, and carrier settings are configuration-only, not execution-backed.

### Proposal Builder
**Purpose**
- Proposal generation, review, and distribution based on quote scenarios.

**Upstream dependencies**
- QuoteScenario
- ScenarioPlan
- BenefitCase
- EmployerGroup
- Proposal

**Downstream consumers**
- Employer review
- Case stage progression
- Enrollment approval handoff
- Dashboard proposal metrics

**Observed gaps**
- Proposal acceptance is not yet a universal workflow trigger for enrollment conversion.
- Limited system-level traceability back to quote versions and census versions.

### Exception Queue
**Purpose**
- Central queue for cross-domain operational issues.

**Upstream dependencies**
- ExceptionItem
- BenefitCase
- All operational domains as potential issue sources

**Downstream consumers**
- Operations team remediation
- Dashboard health
- Case management

**Observed gaps**
- Exception surfacing exists, but auto-generation coverage is incomplete across census/quotes/rates/enrollment/renewals.
- No unified policy engine deciding when to generate or escalate exceptions.

### Employee Management / Employee Enrollment / Employee Benefits / Portals
**Purpose**
- Employee-facing and admin-facing benefit election, document signing, and benefit visibility.

**Upstream dependencies**
- EmployeeEnrollment
- EnrollmentWindow
- BenefitPlan
- Quote/Scenario selections
- DocuSign status

**Downstream consumers**
- Employer reporting
- Payroll/billing/install handoff
- Dashboard signature and enrollment metrics

**Observed gaps**
- Incomplete shared pricing/deduction propagation from approved quote outputs.
- Missing carrier/payroll/billing export layer.
- Portal experience depends on execution data that is only partially normalized.

### Settings / Integration Infrastructure
**Purpose**
- Configuration and infrastructure visibility for integrations, settings, and operational controls.

**Upstream dependencies**
- App settings
- Secrets/connectors/functions
- Domain entities for display

**Downstream consumers**
- Entire platform configuration and future integration workflows

**Observed gaps**
- Infrastructure/admin surfaces are informational but not yet tied to an enforceable integration orchestration framework.
- Payroll/carrier/EDI/billing integrations are not completed end-to-end.

## Cross-Page Workflow Map

### 1. Employer → Case
EmployerGroup config feeds BenefitCase creation and case operating context.

### 2. Case → Census
BenefitCase stage drives census upload/validation and readiness.

### 3. Census → Quotes
Validated CensusVersion feeds QuoteScenario calculation and pricing traceability.

### 4. Rates → Quotes
BenefitPlan + PlanRateTable effective-date pricing drives scenario calculations.

### 5. Quotes → Proposals
Calculated/reviewed scenarios feed proposal generation and employer-facing recommendation workflows.

### 6. Quotes / Proposal Approval → Enrollment
Approved quote decisions should produce deterministic enrollment-ready outputs and plan selection constraints.

### 7. Enrollment → Employee Execution
EnrollmentWindow and EmployeeEnrollment power employee portals, benefit selection, and signing.

### 8. Active Business → Renewals
Active cases and employer groups should roll into structured renewal cycles using current pricing and census continuity.

### 9. Exceptions / Dashboard
All domains should emit signals into Exception Queue and Dashboard for unified operational control.

## Global Gaps Identified

### Missing orchestration
- No single platform orchestration layer enforcing cross-page workflow transitions.
- Cross-domain readiness rules are still distributed across pages/components.

### Missing audit normalization
- Quote and rate versioning are partly embedded in records, not fully normalized into a platform-wide audit model.
- Cross-domain lineage exists conceptually but not yet as a single audit-safe trace model.

### Missing downstream execution integrations
- Payroll integration incomplete
- Carrier/EDI integration incomplete
- Billing/install integration incomplete
- Reporting/export orchestration incomplete

### Missing exception automation
- No comprehensive automation creating ExceptionItem records from all blocking domain failures.

### Missing control-plane alignment
- Employers, Cases, Census, Rates, Quotes, Enrollment, Renewals each have partial control-plane behavior, but there is no platform master control layer coordinating them.

## Required Feature Build List
1. Platform orchestration engine for cross-domain stage/readiness enforcement.
2. Unified dependency registry/service used by dashboard, cases, quotes, enrollment, renewals, and employers.
3. Quote-to-enrollment conversion workflow with deterministic selected-plan mapping.
4. Renewal-to-quote / renewal-to-enrollment structured rollover workflow.
5. Exception automation coverage across census, rates, quotes, enrollment, renewals.
6. Shared deduction/pricing execution engine across quotes, enrollment, renewals.
7. Normalized audit/version model for quotes and rates.
8. Integration execution framework for payroll, carrier/EDI, billing, reporting.

## Dependency Correction Plan
1. Establish platform orchestration + dependency services.
2. Normalize shared financial execution logic.
3. Formalize downstream conversion workflows.
4. Add automated exception generation.
5. Complete integration endpoints and admin controls.
6. Backfill dashboard/system summaries from shared services instead of page-local logic.

## Execution Plan
### Phase 1
- Platform dependency/orchestration layer
- Shared readiness registry
- Cross-domain exception automation

### Phase 2
- Quote → Enrollment deterministic conversion
- Renewal continuity workflow
- Shared deduction/rating execution engine

### Phase 3
- Normalized audit/version tracking for rates and quotes
- Integration framework for payroll/carrier/billing/reporting

### Phase 4
- Replace remaining page-local dependency logic with shared platform services
- Final regression hardening across all operational pages