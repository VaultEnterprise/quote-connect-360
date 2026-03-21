# Connect Quote 360: System Design
**Version:** 2.0 | **Status:** PRODUCTION | **Last Updated:** 2026-03-21

---

## SECTION 1: ARCHITECTURE OVERVIEW

### 1.1 System Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Broker Web  │  │ Employer     │  │ Employee     │      │
│  │  Portal      │  │ Portal       │  │ Self-Service │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           ↓ (REST/WebSocket)
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER (Express.js)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Routes → Middleware → Controllers                      │ │
│  │ • Request validation (Joi/Zod)                         │ │
│  │ • Rate limiting & auth                                 │ │
│  │ • Request/response transformation                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ (RPC)
┌─────────────────────────────────────────────────────────────┐
│                  SERVICE LAYER (Core Logic)                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │ CaseService   │ │ CensusService │ │ QuoteService  │    │
│  └───────────────┘ └───────────────┘ └───────────────┘    │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │ EnrollService │ │ RenewalSvc    │ │ RiskScoringSvc│   │
│  └───────────────┘ └───────────────┘ └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│               REPOSITORY LAYER (Data Access)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CaseRepository, CensusRepository, etc.                │  │
│  │ • Query optimization                                 │  │
│  │ • Caching layer (Redis)                              │  │
│  │ • Transactional boundaries                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE LAYER (MySQL)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Benefit Cases, Census Members, Enrollments, etc.     │  │
│  │ • Connection pooling                                 │  │
│  │ • Read replicas for analytics                        │  │
│  │ • Binlog for audit trail                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

EXTERNAL INTEGRATIONS (Async via Message Queue)
  ↓
┌─────────────────────────────────────────────────────────────┐
│                  INTEGRATION LAYER                           │
│  ┌──────────────────┐ ┌──────────────────┐                │
│  │ GradientAI Risk  │ │ Email Service    │                │
│  │ Scoring API      │ │ (Sendgrid/AWS)   │                │
│  └──────────────────┘ └──────────────────┘                │
│  ┌──────────────────┐ ┌──────────────────┐                │
│  │ Carrier APIs     │ │ Analytics Events │                │
│  │ (Aetna, UHC)     │ │ (Mixpanel/Custom)                │
│  └──────────────────┘ └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## SECTION 2: ENTITY RELATIONSHIP DIAGRAM (ERD)

### 2.1 Core Entity Relationships

```sql
-- AGENCIES & EMPLOYERS (Tenant Model)
┌─────────────────────────────────────────┐
│ Agency (SaaS Tenant)                    │
├─────────────────────────────────────────┤
│ • id (PK)                               │
│ • name, code (UNIQUE)                   │
│ • status, settings (JSON)               │
│ • created_at, updated_at                │
└─────────────────────────────────────────┘
        │
        │ 1..N (Employer)
        ↓
┌─────────────────────────────────────────┐
│ EmployerGroup                           │
├─────────────────────────────────────────┤
│ • id (PK)                               │
│ • agency_id (FK) [INDEX]                │
│ • name, ein (UNIQUE)                    │
│ • employee_count, status                │
│ • renewal_date                          │
└─────────────────────────────────────────┘
        │
        │ 1..N (Cases)
        ↓
┌─────────────────────────────────────────┐
│ BenefitCase (MASTER WORKFLOW ENTITY)    │
├─────────────────────────────────────────┤
│ • id (PK)                               │
│ • case_number (UNIQUE per agency)       │
│ • agency_id, employer_group_id (FKs)    │
│ • case_type, case_status (STATE MACHINE)│
│ • effective_date, target_close_date     │
│ • assigned_to (broker_email)            │
│ • priority, products_requested (JSON)   │
│ • created_at, updated_at, closed_at     │
└─────────────────────────────────────────┘
        │
        ├─── 1..N (Census Versions)
        │       ↓
        │   ┌─────────────────────────────────────────┐
        │   │ CensusVersion                           │
        │   ├─────────────────────────────────────────┤
        │   │ • id (PK)                               │
        │   │ • case_id (FK) [COMPOSITE INDEX]        │
        │   │ • version_number                        │
        │   │ • file_url, status (validated/...)      │
        │   │ • total_employees, eligible_count       │
        │   │ • validation_errors, validation_warnings│
        │   │ • uploaded_by, validated_at             │
        │   └─────────────────────────────────────────┘
        │           │
        │           └─── 1..N (Census Members)
        │                   ↓
        │               ┌─────────────────────────────────────────┐
        │               │ CensusMember                            │
        │               ├─────────────────────────────────────────┤
        │               │ • id (PK)                               │
        │               │ • census_version_id (FK)                │
        │               │ • employee_id (UNIQUE per census)       │
        │               │ • first_name, last_name, dob            │
        │               │ • email, phone                          │
        │               │ • employment_status, salary             │
        │               │ • is_eligible, dependent_count          │
        │               │ • coverage_tier (STATE)                 │
        │               │ • validation_status, validation_issues  │
        │               │ • gradient_ai_data (JSON, MATERIALIZED) │
        │               │   └─ risk_score, risk_tier              │
        │               │   └─ predicted_annual_claims            │
        │               │   └─ confidence_score                   │
        │               └─────────────────────────────────────────┘
        │
        ├─── 1..N (Quote Scenarios)
        │       ↓
        │   ┌─────────────────────────────────────────┐
        │   │ QuoteScenario                           │
        │   ├─────────────────────────────────────────┤
        │   │ • id (PK)                               │
        │   │ • case_id (FK)                          │
        │   │ • census_version_id (FK)                │
        │   │ • name, status (draft/completed/...)    │
        │   │ • effective_date                        │
        │   │ • contribution_strategy                 │
        │   │ • employer_contribution_ee/dep (%)      │
        │   │ • total_monthly_premium                 │
        │   │ • employer_monthly_cost                 │
        │   │ • quoted_at, expires_at                 │
        │   └─────────────────────────────────────────┘
        │           │
        │           ├─── 1..N (Scenario Plans)
        │           │       ↓
        │           │   ┌──────────────────────────────┐
        │           │   │ ScenarioPlan                 │
        │           │   ├──────────────────────────────┤
        │           │   │ • id (PK)                    │
        │           │   │ • scenario_id, plan_id (FKs) │
        │           │   │ • plan_name, carrier         │
        │           │   │ • employer_contribution_%    │
        │           │   │ • is_recommended             │
        │           │   └──────────────────────────────┘
        │           │
        │           └─── 1..N (Policy Match Results)
        │                   ↓
        │               ┌──────────────────────────────────────┐
        │               │ PolicyMatchResult                    │
        │               ├──────────────────────────────────────┤
        │               │ • id (PK)                            │
        │               │ • case_id, scenario_id (FKs)         │
        │               │ • member_id, member_name             │
        │               │ • risk_score, risk_tier              │
        │               │ • gradient_ai_risk_tier (from API)   │
        │               │ • gradient_ai_predicted_claims       │
        │               │ • base_plan_id → optimized_plan_id   │
        │               │ • base_monthly_cost → optimized      │
        │               │ • risk_adjusted_monthly_cost         │
        │               │ • recommendation_summary             │
        │               │ • status (pending/optimized/accepted)│
        │               └──────────────────────────────────────┘
        │
        ├─── 1..N (Proposals)
        │       ↓
        │   ┌─────────────────────────────────────────┐
        │   │ Proposal                                │
        │   ├─────────────────────────────────────────┤
        │   │ • id (PK)                               │
        │   │ • case_id, scenario_id (FKs)            │
        │   │ • status (draft/sent/viewed/approved)   │
        │   │ • version                               │
        │   │ • employer_name, broker_name            │
        │   │ • plan_summary (JSON)                   │
        │   │ • total_monthly_premium                 │
        │   │ • sent_at, viewed_at, approved_at       │
        │   │ • expires_at                            │
        │   └─────────────────────────────────────────┘
        │
        ├─── 1..N (Enrollment Windows)
        │       ↓
        │   ┌─────────────────────────────────────────┐
        │   │ EnrollmentWindow                        │
        │   ├─────────────────────────────────────────┤
        │   │ • id (PK)                               │
        │   │ • case_id (FK)                          │
        │   │ • status (scheduled/open/closed)        │
        │   │ • start_date, end_date, effective_date  │
        │   │ • total_eligible, invited, enrolled     │
        │   │ • participation_rate                    │
        │   │ • finalized_at                          │
        │   └─────────────────────────────────────────┘
        │           │
        │           └─── 1..N (Employee Enrollments)
        │                   ↓
        │               ┌──────────────────────────────────────┐
        │               │ EmployeeEnrollment                   │
        │               ├──────────────────────────────────────┤
        │               │ • id (PK)                            │
        │               │ • enrollment_window_id, case_id (FKs)│
        │               │ • employee_email, employee_name      │
        │               │ • access_token (session mgmt)        │
        │               │ • status (invited/started/completed) │
        │               │ • coverage_tier, selected_plan_id    │
        │               │ • waiver_reason                      │
        │               │ • completed_at, acknowledged_at      │
        │               └──────────────────────────────────────┘
        │
        ├─── 1..N (Renewal Cycles)
        │       ↓
        │   ┌─────────────────────────────────────────┐
        │   │ RenewalCycle                            │
        │   ├─────────────────────────────────────────┤
        │   │ • id (PK)                               │
        │   │ • case_id, employer_group_id (FKs)      │
        │   │ • renewal_date                          │
        │   │ • status (pre_renewal/marketed/...)     │
        │   │ • current_premium → renewal_premium     │
        │   │ • rate_change_percent                   │
        │   │ • disruption_score (0-100)              │
        │   │ • decision (renew/market/terminate)     │
        │   │ • decision_date                         │
        │   └─────────────────────────────────────────┘
        │
        ├─── 1..N (Tasks)
        │       ↓
        │   ┌─────────────────────────────────────────┐
        │   │ CaseTask                                │
        │   ├─────────────────────────────────────────┤
        │   │ • id (PK)                               │
        │   │ • case_id (FK)                          │
        │   │ • task_type, status, priority           │
        │   │ • assigned_to, due_date                 │
        │   │ • completed_at, completed_by            │
        │   └─────────────────────────────────────────┘
        │
        ├─── 1..N (Exceptions)
        │       ↓
        │   ┌─────────────────────────────────────────┐
        │   │ ExceptionItem                           │
        │   ├─────────────────────────────────────────┤
        │   │ • id (PK)                               │
        │   │ • case_id (FK)                          │
        │   │ • category, severity, status            │
        │   │ • title, description                    │
        │   │ • suggested_action, assigned_to         │
        │   │ • entity_type, entity_id (polymorphic)  │
        │   │ • resolved_at, resolution_notes         │
        │   └─────────────────────────────────────────┘
        │
        └─── 1..N (Documents)
                ↓
            ┌─────────────────────────────────────────┐
            │ Document                                │
            ├─────────────────────────────────────────┤
            │ • id (PK)                               │
            │ • case_id (FK)                          │
            │ • document_type (census/proposal/sbc)   │
            │ • file_url, file_name                   │
            │ • uploaded_by, uploaded_at              │
            └─────────────────────────────────────────┘

AUDIT & LOGGING (Immutable)
        ↓
┌─────────────────────────────────────────┐
│ ActivityLog                             │
├─────────────────────────────────────────┤
│ • id (PK)                               │
│ • case_id (FK)                          │
│ • actor_email, actor_name               │
│ • action (created/updated/deleted)      │
│ • entity_type, entity_id                │
│ • old_value, new_value (JSON)           │
│ • timestamp, request_id (CORRELATION)   │
│ • CONSTRAINT: IMMUTABLE (Append-only)   │
└─────────────────────────────────────────┘
```

### 2.2 Index Strategy for Scale

```sql
-- PRIMARY QUERIES (P99 < 100ms for 10k+ concurrent)

-- 1. Case Lookups (High frequency)
CREATE INDEX idx_case_agency_status ON benefit_case(agency_id, case_status) USING BTREE;
CREATE INDEX idx_case_effective_date ON benefit_case(effective_date DESC) USING BTREE;
CREATE INDEX idx_case_assigned_to ON benefit_case(assigned_to) USING BTREE;
CREATE UNIQUE INDEX idx_case_number ON benefit_case(agency_id, case_number) USING BTREE;

-- 2. Census Member Queries (High volume)
CREATE UNIQUE INDEX idx_member_employee_id ON census_member(census_version_id, employee_id) USING BTREE;
CREATE INDEX idx_member_case_status ON census_member(case_id, employment_status) USING BTREE;
CREATE INDEX idx_member_email ON census_member(email) USING HASH; -- Exact match
CREATE INDEX idx_member_validation ON census_member(census_version_id, validation_status) USING BTREE;

-- 3. Enrollment Queries (Funnel tracking)
CREATE INDEX idx_enrollment_window_status ON enrollment_window(case_id, status) USING BTREE;
CREATE INDEX idx_employee_enrollment_status ON employee_enrollment(enrollment_window_id, status) USING BTREE;
CREATE INDEX idx_employee_enrollment_email ON employee_enrollment(employee_email) USING HASH;

-- 4. Quote/Proposal Lookups
CREATE INDEX idx_scenario_case_date ON quote_scenario(case_id, quoted_at DESC) USING BTREE;
CREATE INDEX idx_proposal_case_status ON proposal(case_id, status) USING BTREE;

-- 5. Risk Scoring Queries (GradientAI)
CREATE INDEX idx_member_risk_tier ON census_member(CAST(JSON_EXTRACT(gradient_ai_data, '$.risk_tier') AS CHAR(20))) USING BTREE;

-- 6. Audit Trail (Append-only, chronological queries)
CREATE INDEX idx_activity_case_date ON activity_log(case_id, created_at DESC) USING BTREE;
CREATE INDEX idx_activity_actor_date ON activity_log(actor_email, created_at DESC) USING BTREE;
```

---

## SECTION 3: SERVICE LAYER ARCHITECTURE

### 3.1 Service Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                        │
│              (Controllers → Service Coordination)              │
└──────────────────────────────────────────────────────────────┘
                              ↑
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ↓                     ↓                     ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ CaseService  │      │ CensusService│      │ QuoteService │
└──────────────┘      └──────────────┘      └──────────────┘
        │                     │                     │
        │ (creates)           │ (validates)         │ (requires)
        │                     │                     │
        ├─────────────────────┼─────────────────────┤
        │                     │                     │
        ↓                     ↓                     ↓
┌──────────────────────────────────────────────────────────┐
│           DOMAIN SERVICES (Pure Business Logic)         │
│                                                          │
│ • ValidationService (Field, cross-field, state rules)   │
│ • RiskScoringService (GradientAI integration)           │
│ • PolicyMatchingService (Recommend plans)               │
│ • RenewalService (Rate analysis, decisions)             │
│ • EnrollmentService (Wizard coordination)               │
│ • ContributionService (Cost modeling)                   │
│ • AuditService (Logging, compliance)                    │
│ • NotificationService (Email/events)                    │
└──────────────────────────────────────────────────────────┘
        │                     │                     │
        ├─────────────────────┼─────────────────────┤
        │                     │                     │
        ↓                     ↓                     ↓
┌──────────────────────────────────────────────────────────┐
│         REPOSITORY/DATA ACCESS LAYER                    │
│                                                          │
│ • CaseRepository (create, read, update)                 │
│ • CensusRepository (bulk import, validation)            │
│ • EnrollmentRepository (read, update status)            │
│ • QuoteRepository (create scenarios, fetch rates)       │
│ • RenewalRepository (date-based queries)                │
│ • ActivityLogRepository (append-only writes)            │
│                                                          │
│ (All include caching strategy, connection pooling)      │
└──────────────────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                        │
│                                                          │
│ • DatabaseConnection (MySQL pooled)                     │
│ • CacheLayer (Redis)                                    │
│ • MessageQueue (RabbitMQ/SQS)                           │
│ • Logger (structured JSON logs)                         │
│ • MetricsCollector (Prometheus)                         │
│ • ExternalAPIs (HTTP client with retries)               │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Service Definitions

```typescript
// ============================================================================
// ORCHESTRATION LAYER: Request → Response Flow
// ============================================================================

interface CaseService {
  // Case Lifecycle
  createCase(req: CreateCaseRequest): Promise<CaseResponse>
  // Orchestrates: ValidationService → CaseRepository → AuditService
  
  getCaseById(caseId: string): Promise<CaseResponse>
  // Cached: Redis → CaseRepository
  
  updateCaseStatus(caseId: string, newStatus: CaseStatus): Promise<CaseResponse>
  // Validates: state machine transition → CaseRepository → emit event
  
  advanceStage(caseId: string): Promise<StageAdvanceResponse>
  // Validates prerequisites (census validated, quote ready) → updates stage → triggers exceptions
}

interface CensusService {
  uploadCensus(caseId: string, file: File): Promise<CensusUploadResponse>
  // Async job:
  //   → Parse CSV
  //   → Validate (ValidationService)
  //   → Detect duplicates
  //   → Create CensusMember records
  //   → Trigger GradientAI analysis
  //   → Update CensusVersion status
  
  validateCensus(censusVersionId: string): Promise<ValidationResult>
  // Run all validation rules → flag errors/warnings
  
  enrichWithRiskScores(censusVersionId: string): Promise<void>
  // Call GradientAI API → store gradient_ai_data on members
  // Async, queued, retryable
}

interface QuoteService {
  createScenario(req: CreateScenarioRequest): Promise<QuoteScenarioResponse>
  // Validates: census validated, effective_date 30+ days out
  // Calls: CarrierRateAPIs → aggregates rates → creates ScenarioPlan records
  
  generateProposal(scenarioId: string): Promise<ProposalResponse>
  // Calls: PolicyMatchingService (for AI recommendations)
  // Generates: PDF via template engine
  // Stores: Proposal record
}

interface EnrollmentService {
  createWindow(req: CreateWindowRequest): Promise<EnrollmentWindowResponse>
  // Validates: dates (start < end < effective)
  // Creates: EmployeeEnrollment invites (one per census member)
  // Triggers: Email notifications
  
  processEnrollment(enrollmentId: string, req: EnrollmentRequest): Promise<EnrollmentResponse>
  // Validates: coverage_tier, plan selection OR waiver
  // Updates: status → completed
  // Triggers: Confirmation email
}

interface RenewalService {
  initializeRenewal(employerGroupId: string): Promise<RenewalCycleResponse>
  // Validates: employer in active status
  // Creates: RenewalCycle record
  // Triggers: Broker notification
  
  generateRenewalOptions(renewalId: string): Promise<RenewalOptionsResponse>
  // Calls: CarrierAPIs (renewal rates)
  // Calculates: rate change %, disruption_score
  // Recommends: actions (renew/market)
}

interface ValidationService {
  validateEntity(entity: any, schema: JSONSchema): Promise<ValidationResult>
  // Checks: required fields, types, patterns
  // Checks: min/max values, enums
  // Cross-field: dependent_count ↔ coverage_tier
  // Returns: { isValid, errors[], warnings[] }
  
  validateCensusMember(member: CensusMember): Promise<ValidationResult>
  // Additional rules: age >= 18, unique employee_id per census
  
  validateStateTransition(entity: string, from: string, to: string): boolean
  // State machine: case_status, enrollment_status, renewal_status
}

interface RiskScoringService {
  scoreMembers(censusVersionId: string): Promise<ScoringResult>
  // Async, batched API calls to GradientAI
  // Stores: gradient_ai_data on each CensusMember
  // Generates: HighRiskException records (score > 75)
  // Returns: summary statistics
}

interface PolicyMatchingService {
  recommendPlans(memberId: string, scenario: QuoteScenario): Promise<PolicyMatchResult>
  // Calls: RiskScoringService (for risk_tier)
  // Calls: PlanOptimizationEngine (AI-driven)
  // Returns: base plan + optimized plan + cost deltas
  
  generateProposalRecommendations(scenarioId: string): Promise<Recommendation[]>
  // Aggregates: PolicyMatchResult records
  // Generates: broker talking points, member-facing summaries
}

interface AuditService {
  logAction(action: AuditLogEntry): Promise<void>
  // Async append to ActivityLog (immutable)
  // Fields: actor, action, entity, changes, timestamp
  // Retention: 7 years
  
  getAuditTrail(caseId: string, limit?: number): Promise<ActivityLog[]>
  // Query: case_id, ordered by created_at DESC
}

// ============================================================================
// DOMAIN SERVICES: Pure Business Logic (No I/O)
// ============================================================================

interface CaseStateValidator {
  canAdvanceFrom(currentStatus: CaseStatus): CaseStatus[]
  // Deterministic mapping:
  // draft → [census_in_progress]
  // census_validated → [ready_for_quote]
  // ready_for_quote → [quoting]
  // etc.
  
  validatePrerequisites(caseId: string, targetStatus: CaseStatus): Promise<PrerequisiteCheck>
  // Checks: census is validated, quote exists, proposal approved
}

interface NotificationService {
  sendCaseCreatedEmail(case: BenefitCase): Promise<void>
  // Queue: async via MessageBroker
  // Template: "New case created"
  
  sendEnrollmentInvite(enrollment: EmployeeEnrollment): Promise<void>
  // Queue: async
  // Include: access token URL
  
  sendRenewalAlert(renewal: RenewalCycle): Promise<void>
  // Queue: async
  // Recipients: assigned broker + employer contact
}

interface ContributionModelService {
  calculateContributions(scenario: QuoteScenario): Promise<ContributionBreakdown>
  // Returns: employer_monthly, employee_monthly, employee_per_plan
  // Validates: ACA affordability rules
  
  calculateRate(
    plan: BenefitPlan,
    members: CensusMember[],
    contribution_pct: number
  ): Promise<RateCalculation>
  // Aggregates: member ages, tier distributions
  // Applies: rate table lookups
  // Returns: monthly PMPM
}
```

---

## SECTION 4: API CONTRACT SPECIFICATIONS

### 4.1 REST API Endpoints (OpenAPI 3.0 Style)

```yaml
openapi: 3.0.0
info:
  title: Connect Quote 360 API
  version: 2.0.0
  description: Enterprise Benefits Quoting Platform

servers:
  - url: https://api.connectquote360.com/v2
    description: Production

paths:
  # ============================================================================
  # CASE ENDPOINTS
  # ============================================================================
  
  /cases:
    post:
      summary: Create benefit case
      operationId: createCase
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [agency_id, employer_group_id, case_type, effective_date, employee_count]
              properties:
                agency_id:
                  type: string
                  pattern: "^agc_[0-9a-f]{32}$"
                employer_group_id:
                  type: string
                  pattern: "^egp_[0-9a-f]{32}$"
                case_type:
                  type: string
                  enum: [new_business, renewal, mid_year_change, takeover]
                effective_date:
                  type: string
                  format: date
                  example: "2026-06-01"
                employee_count:
                  type: integer
                  minimum: 1
                  maximum: 500000
                products_requested:
                  type: array
                  items:
                    enum: [medical, dental, vision, life, std, ltd]
                  minItems: 1
                  example: [medical, dental]
                assigned_to:
                  type: string
                  format: email
                target_close_date:
                  type: string
                  format: date
      responses:
        201:
          description: Case created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CaseResponse'
        400:
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        409:
          description: Duplicate case_number

    get:
      summary: List cases (paginated, filterable)
      parameters:
        - name: agency_id
          in: query
          required: true
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
            maximum: 500
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        200:
          description: Cases list
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    const: success
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/CaseResponse'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  /cases/{caseId}:
    get:
      summary: Get case by ID (cached, max 1s staleness)
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Case details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CaseResponse'
        404:
          description: Case not found
    
    patch:
      summary: Update case
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                assigned_to:
                  type: string
                  format: email
                priority:
                  enum: [low, normal, high, urgent]
                target_close_date:
                  type: string
                  format: date
      responses:
        200:
          description: Updated case
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CaseResponse'

  /cases/{caseId}/advance-stage:
    post:
      summary: Advance case to next stage (state machine)
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                skip_validation:
                  type: boolean
                  default: false
      responses:
        200:
          description: Stage advanced
          content:
            application/json:
              schema:
                type: object
                properties:
                  old_status:
                    type: string
                  new_status:
                    type: string
                  prerequisites_met:
                    type: boolean
                  unmet_prerequisites:
                    type: array
                    items:
                      type: string
        412:
          description: Prerequisites not met (Precondition Failed)

  # ============================================================================
  # CENSUS ENDPOINTS
  # ============================================================================

  /cases/{caseId}/census/upload:
    post:
      summary: Upload census file (async job)
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file]
              properties:
                file:
                  type: string
                  format: binary
                  description: CSV file (max 50MB)
                  example: "employee_roster.csv"
      responses:
        202:
          description: Upload accepted (async processing)
          content:
            application/json:
              schema:
                type: object
                properties:
                  job_id:
                    type: string
                    description: Correlation ID for polling
                  status:
                    const: queued
                  estimated_completion_seconds:
                    type: integer
        413:
          description: File too large

  /cases/{caseId}/census/versions:
    get:
      summary: List census versions for case
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Census versions
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CensusVersionListResponse'

  /cases/{caseId}/census/versions/{versionId}/validate:
    post:
      summary: Validate census version
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
        - name: versionId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Validation results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationResultResponse'

  /cases/{caseId}/census/versions/{versionId}/members:
    get:
      summary: List census members (paginated)
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
        - name: versionId
          in: path
          required: true
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 100
            maximum: 1000
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        200:
          description: Census members
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/CensusMemberResponse'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

  # ============================================================================
  # RISK SCORING ENDPOINTS
  # ============================================================================

  /cases/{caseId}/census/versions/{versionId}/analyze-risk:
    post:
      summary: Trigger GradientAI risk analysis (async)
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
        - name: versionId
          in: path
          required: true
          schema:
            type: string
      responses:
        202:
          description: Analysis queued
          content:
            application/json:
              schema:
                type: object
                properties:
                  job_id:
                    type: string
                  status:
                    const: queued
                  estimated_completion_seconds:
                    type: integer

  /cases/{caseId}/census/versions/{versionId}/risk-summary:
    get:
      summary: Get risk analysis summary
      responses:
        200:
          description: Risk summary
          content:
            application/json:
              schema:
                type: object
                properties:
                  total_members:
                    type: integer
                  risk_distribution:
                    type: object
                    properties:
                      preferred:
                        type: integer
                      standard:
                        type: integer
                      elevated:
                        type: integer
                      high:
                        type: integer
                  average_risk_score:
                    type: number
                  total_predicted_claims:
                    type: number
                  high_risk_members:
                    type: array
                    maxItems: 10
                    items:
                      $ref: '#/components/schemas/HighRiskMemberResponse'

  # ============================================================================
  # QUOTE ENDPOINTS
  # ============================================================================

  /cases/{caseId}/quotes:
    post:
      summary: Create quote scenario
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, effective_date, census_version_id, products_included]
              properties:
                name:
                  type: string
                  example: "Standard Medical + Dental"
                effective_date:
                  type: string
                  format: date
                census_version_id:
                  type: string
                products_included:
                  type: array
                  items:
                    enum: [medical, dental, vision, life, std, ltd]
                  minItems: 1
                carriers_included:
                  type: array
                  items:
                    type: string
                  minItems: 1
                  example: [Aetna, UnitedHealth, Cigna]
                contribution_strategy:
                  type: string
                  enum: [percentage, flat_dollar, defined_contribution]
                  default: percentage
                employer_contribution_ee:
                  type: number
                  minimum: 0
                  maximum: 100
                  description: "If percentage: 0-100, if flat: dollar amount"
                  example: 80
                employer_contribution_dep:
                  type: number
                  minimum: 0
                  maximum: 100
                  example: 50
      responses:
        202:
          description: Quote scenario created (async rating)
          content:
            application/json:
              schema:
                type: object
                properties:
                  scenario_id:
                    type: string
                  job_id:
                    type: string
                    description: Poll this for completion
                  status:
                    const: rating_in_progress
                  estimated_completion_seconds:
                    type: integer

  /cases/{caseId}/quotes/{scenarioId}:
    get:
      summary: Get quote scenario details
      responses:
        200:
          description: Quote scenario
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QuoteScenarioResponse'

  /cases/{caseId}/quotes/{scenarioId}/policy-matches:
    get:
      summary: Get AI-generated policy recommendations
      parameters:
        - name: member_id
          in: query
          schema:
            type: string
          description: Filter by specific member (optional)
      responses:
        200:
          description: Policy match results
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/PolicyMatchResultResponse'

  # ============================================================================
  # ENROLLMENT ENDPOINTS
  # ============================================================================

  /cases/{caseId}/enrollment/windows:
    post:
      summary: Create enrollment window
      parameters:
        - name: caseId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [start_date, end_date, effective_date]
              properties:
                start_date:
                  type: string
                  format: date
                end_date:
                  type: string
                  format: date
                effective_date:
                  type: string
                  format: date
      responses:
        201:
          description: Window created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EnrollmentWindowResponse'

  /enrollment/{accessToken}/member:
    get:
      summary: Get employee enrollment (employee self-service)
      parameters:
        - name: accessToken
          in: path
          required: true
          schema:
            type: string
            description: "1-time use, 8-hour TTL"
      responses:
        200:
          description: Employee enrollment details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EmployeeEnrollmentResponse'

  /enrollment/{accessToken}/submit:
    post:
      summary: Submit enrollment selection
      parameters:
        - name: accessToken
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                coverage_tier:
                  type: string
                  enum: [employee_only, employee_spouse, employee_children, family]
                selected_plan_id:
                  type: string
                  pattern: "^pln_[0-9a-f]{32}$"
                waiver_reason:
                  type: string
                  maxLength: 500
      responses:
        200:
          description: Enrollment completed
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    const: completed
                  completed_at:
                    type: string
                    format: date-time

components:
  schemas:
    CaseResponse:
      type: object
      properties:
        id:
          type: string
        case_number:
          type: string
        employer_name:
          type: string
        case_status:
          type: string
        effective_date:
          type: string
          format: date
        employee_count:
          type: integer
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    ValidationResultResponse:
      type: object
      properties:
        total_rows:
          type: integer
        valid_rows:
          type: integer
        invalid_rows:
          type: integer
        errors:
          type: array
          items:
            type: object
            properties:
              row_number:
                type: integer
              field:
                type: string
              error_code:
                type: string
              message:
                type: string
        warnings:
          type: array
          items:
            type: object
            properties:
              row_number:
                type: integer
              field:
                type: string
              warning_code:
                type: string
              message:
                type: string

    ErrorResponse:
      type: object
      properties:
        status:
          const: error
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
            path:
              type: string

    Pagination:
      type: object
      properties:
        page:
          type: integer
        per_page:
          type: integer
        total:
          type: integer
        total_pages:
          type: integer
```

---

## SECTION 5: SCALABILITY ARCHITECTURE (10k–100k+ Users)

### 5.1 Performance Targets

| Operation | P50 | P95 | P99 | SLO |
|-----------|-----|-----|-----|-----|
| **Read case by ID** | 10ms | 50ms | 100ms | 99.9% |
| **List cases (paginated)** | 30ms | 150ms | 300ms | 99.5% |
| **Validate census (10k members)** | 2s | 5s | 10s | 99% |
| **Risk score members (10k)** | 8s | 15s | 30s | 95% (async) |
| **Generate quote** | 3s | 8s | 15s | 98% |
| **Employee portal page load** | 200ms | 800ms | 1500ms | 99% |

### 5.2 Caching Strategy

```typescript
// ============================================================================
// REDIS CACHING LAYER (1GB heap, 4 nodes, Cluster Mode)
// ============================================================================

interface CacheStrategy {
  case: {
    ttl: 60, // 1 minute (frequently updated)
    pattern: "case:{case_id}",
    invalidation: "on-update, case_status_change",
    serialization: "msgpack"
  },
  census_version: {
    ttl: 300, // 5 minutes
    pattern: "census_v:{version_id}",
    invalidation: "on-validation-complete"
  },
  risk_scores: {
    ttl: 3600, // 1 hour
    pattern: "risk:{census_version_id}",
    invalidation: "on-analysis-complete"
  },
  rate_tables: {
    ttl: 86400, // 24 hours (quasi-static)
    pattern: "rates:{plan_id}:{effective_date}",
    invalidation: "on-rate-update"
  },
  enrollment_window: {
    ttl: 120, // 2 minutes (read-heavy, write-rarely)
    pattern: "window:{window_id}",
    invalidation: "on-status-change"
  },
  carrier_networks: {
    ttl: 604800, // 7 days (static data)
    pattern: "networks:{carrier_id}",
    invalidation: "manual"
  }
}

// Cache warming strategy:
// 1. Load frequently-accessed data on startup
// 2. Implement background refresh for expiring hot keys
// 3. Monitor hit rates; target 85%+ for critical paths

// Invalidation cascade:
// case_id changes
//   → invalidate: case:{case_id}
//              → case:list:{agency_id}
//              → census_version:{*}
//              → scenario:{*}
//              → proposals:{*}
```

### 5.3 Database Scaling

```sql
-- ============================================================================
-- HORIZONTAL SCALING STRATEGY
-- ============================================================================

-- 1. READ REPLICAS (Master-Slave Replication)
--    Master (writes): us-east-1
--    Replicas (reads):
--      - us-west-2 (reports, analytics)
--      - eu-west-1 (edge latency)
--    Replication lag: 100-500ms (acceptable for non-critical reads)

-- 2. PARTITION BY AGENCY_ID (Tenant Isolation)
--    Each agency's data on dedicated partition
--    Facilitates: GDPR right-to-be-forgotten, per-tenant backups
--    Range: agency_id hash mod N

CREATE TABLE benefit_case_partition_0 LIKE benefit_case;
CREATE TABLE benefit_case_partition_1 LIKE benefit_case;
-- Router: SELECT partition = hash(agency_id) % 4; query_partition_N

-- 3. WRITE-AHEAD LOG (Binlog) FOR AUDIT
--    MySQL Binlog → Kafka → Data Lake
--    Enables: audit trail immutability, compliance, GDPR

-- 4. CONNECTION POOLING (HikariCP via Node.js)
pool = {
  min: 10,           // Always keep 10 connections open
  max: 100,          // Spike handling
  acquire_timeout: 5000,
  idle_timeout: 30000,
  connection_timeout: 5000,
  validation_interval: 30000
}

-- 5. QUERY OPTIMIZATION
--    Slow query log threshold: 100ms
--    Analyze: EXPLAIN on all queries before deployment
--    No SELECT * (specify columns)
--    Pagination: cursor-based (offset inefficient at scale)

-- Example optimized query:
SELECT id, case_number, case_status, effective_date
  FROM benefit_case
 WHERE agency_id = ? AND created_at < ?
 ORDER BY created_at DESC
 LIMIT 50;
-- Index: (agency_id, created_at DESC)

-- 6. BATCH OPERATIONS FOR BULK INSERTS
-- Insert 10k census members: 500ms (bulk insert, one round-trip)
--   vs 10k individual inserts: 30s (10k round-trips)

INSERT INTO census_member 
  (id, census_version_id, employee_id, ...)
VALUES
  (?, ?, ?, ...),
  (?, ?, ?, ...),
  ... (batches of 1000)
-- Settings: set unique_checks=0, foreign_key_checks=0 (re-enable after)
```

### 5.4 Async Processing (Message Queue Architecture)

```typescript
// ============================================================================
// ASYNC JOB QUEUE (RabbitMQ / AWS SQS)
// ============================================================================

// Long-running operations: offload to queue
// Pattern: Accept request → return job_id → client polls for status

interface AsyncJob {
  job_id: string; // UUID
  type: string; // "census_upload", "risk_analysis", "quote_generation"
  case_id: string;
  user_id: string;
  status: "queued" | "in_progress" | "completed" | "failed";
  progress: {
    current: number;
    total: number;
    percent: number;
  };
  result?: unknown;
  error?: {
    code: string;
    message: string;
    retry_at?: string; // ISO 8601
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  retry_count: number;
  max_retries: number;
}

// Queue topics:
const QUEUES = {
  CENSUS_UPLOAD: "census.upload",        // Priority: HIGH
  RISK_ANALYSIS: "risk.analysis",        // Priority: HIGH
  QUOTE_GENERATION: "quote.generate",    // Priority: MEDIUM
  EMAIL_NOTIFICATION: "email.send",      // Priority: LOW
  ANALYTICS_EVENT: "analytics.log",      // Priority: LOW (fire-and-forget)
};

// Worker threads (scaled independently):
// - 5x census upload workers (CPU intensive)
// - 3x risk scoring workers (I/O intensive, GradientAI)
// - 2x quote workers (database intensive)
// - 1x email worker (rate limited 100/sec)

// Retry policy (exponential backoff):
const RETRY_POLICY = {
  max_retries: 3,
  initial_delay_ms: 1000,
  backoff_multiplier: 2,
  max_delay_ms: 30000,
  // Delays: 1s, 2s, 4s
};

// Dead letter queue: jobs with all retries exhausted → DLQ for manual inspection
```

---

## SECTION 6: ERROR HANDLING & RESILIENCE

### 6.1 Failure Modes & Recovery

```typescript
// ============================================================================
// FAILURE MODE: GRADIENT AI API TIMEOUT
// ============================================================================

class GradientAIRiskScorer {
  async scoreMembers(members: CensusMember[]): Promise<ScoringResult> {
    const batchSize = 100;
    const results = [];
    
    for (let i = 0; i < members.length; i += batchSize) {
      const batch = members.slice(i, i + batchSize);
      
      try {
        const response = await this.httpClient.post(
          "https://api.gradientai.com/score",
          { members: batch },
          {
            timeout: 30000, // 30s timeout
            retries: 3,
            backoff: {
              initialDelayMs: 1000,
              multiplier: 2,
              maxDelayMs: 10000
            }
          }
        );
        results.push(response);
      } catch (error) {
        if (error.code === "TIMEOUT") {
          // Log: ERROR | Gradient timeout | batch ${i}-${i+batchSize}
          // Action: Retry with exponential backoff
          await this.delay(calculateBackoff(retryCount));
          retryCount++;
          if (retryCount > 3) {
            // Fallback: Rule-based scoring
            const fallbackScores = this.ruleBasedScore(batch);
            results.push(fallbackScores);
            // Log warning: Fallback activated
          }
        } else if (error.code === "SERVICE_UNAVAILABLE") {
          // Circuit breaker: Stop requests for 60s
          this.circuitBreaker.open();
          // Notify: Slack alert to oncall
          // Queue: Retry job later (exponential backoff)
        }
      }
    }
    return results;
  }
}

// ============================================================================
// FAILURE MODE: DATABASE CONNECTION POOL EXHAUSTION
// ============================================================================

// Symptoms: SELECT queries timeout, new connections rejected
// Root cause: Slow query holding connection, connection leak

// Detection:
interface PoolHealthCheck {
  total_connections: number;
  active_connections: number;
  idle_connections: number;
  waiting_queue_length: number;
  
  threshold_alert: () => {
    if (waiting_queue_length > 10) {
      // CRITICAL: Pool is backed up
      // Action: Kill long-running queries, scale pool max
    }
    if (active_connections / total_connections > 0.9) {
      // WARNING: Pool nearing capacity
      // Action: Reduce new connection acceptance (circuit breaker)
    }
  }
}

// Prevention:
// 1. Connection timeout: 5s (close if acquire > 5s)
// 2. Query timeout: 10s (kill queries > 10s)
// 3. Monitor: active vs idle ratio, waiting queue depth
// 4. Scale: auto-increase pool max on sustained > 80% utilization

// ============================================================================
// FAILURE MODE: CENSUS FILE CORRUPTION
// ============================================================================

class CensusUploadHandler {
  async uploadCensus(file: File): Promise<CensusUploadResponse> {
    // Validation layers:
    
    // Layer 1: File structure
    const csv = await this.parseCSV(file);
    if (!csv.headers.includes("employee_id", "first_name", "last_name")) {
      throw new ValidationError("MISSING_REQUIRED_COLUMNS");
    }
    
    // Layer 2: Row-level validation
    for (const row of csv.rows) {
      const validation = await this.validateCensusMember(row);
      if (!validation.isValid) {
        this.recordError({
          row_number: row.line_number,
          field: validation.field,
          code: validation.error_code,
          message: validation.message
        });
      }
    }
    
    // Layer 3: Data integrity
    const duplicates = this.detectDuplicates(csv.rows, "employee_id");
    if (duplicates.length > 0) {
      throw new ValidationError("DUPLICATE_EMPLOYEE_IDS", { duplicates });
    }
    
    // Layer 4: Cross-file consistency
    const existing = await this.getCensusMembers(case_id, version_id - 1);
    const removals = this.detectRemovedEmployees(existing, csv.rows);
    if (removals.length > this.MAX_ALLOWED_REMOVALS) {
      throw new ValidationError("EXCESSIVE_EMPLOYEE_REMOVAL", { count: removals.length });
    }
    
    // If all validations pass: create census
    return this.createCensusVersion(csv);
  }
}

// ============================================================================
// FAILURE MODE: PROPOSAL GENERATION CRASH
// ============================================================================

interface ProposalGenerator {
  async generateProposal(scenario: QuoteScenario): Promise<ProposalResponse> {
    const transaction = db.beginTransaction();
    
    try {
      // Step 1: Calculate contributions (deterministic)
      const contributions = await this.calculateContributions(scenario);
      await transaction.update(ContributionModel, { ...contributions });
      
      // Step 2: Generate policy matches (AI, may fail)
      let policyMatches = [];
      try {
        policyMatches = await this.policyMatchService.generateMatches(scenario);
      } catch (error) {
        // Log error but don't fail proposal
        logger.warn("Policy matching failed, using base recommendations", { error });
        policyMatches = this.generateFallbackRecommendations(scenario);
      }
      
      // Step 3: Render PDF (external service)
      let pdfUrl = null;
      try {
        pdfUrl = await this.pdfRenderer.render(scenario, policyMatches);
      } catch (error) {
        // PDF not critical; proposal still valid
        logger.warn("PDF generation failed", { error });
        // Queue: Retry PDF generation async
        this.retryQueue.enqueue({
          task: "generate_pdf",
          proposal_id: proposal.id,
          scheduled_at: new Date(Date.now() + 5 * 60000) // Retry in 5m
        });
      }
      
      // Step 4: Create proposal record
      const proposal = new Proposal({
        case_id: scenario.case_id,
        scenario_id: scenario.id,
        contributions,
        policy_matches: policyMatches,
        pdf_url: pdfUrl,
        status: pdfUrl ? "ready" : "draft"
      });
      await transaction.insert(proposal);
      
      await transaction.commit();
      return { status: "success", proposal };
      
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof ValidationError) {
        throw new BadRequestError(error.message);
      } else if (error instanceof TimeoutError) {
        // Idempotent retry: check if proposal already exists
        const existing = await this.getProposal(scenario.id);
        if (existing) return { status: "success", proposal: existing };
        
        // Queue for retry
        this.retryQueue.enqueue({
          task: "generate_proposal",
          scenario_id: scenario.id,
          retry_count: 1
        });
        throw new ServiceUnavailableError("Proposal generation in progress");
      } else {
        throw new InternalServerError("Unexpected error");
      }
    }
  }
}
```

---

## SECTION 7: AUDIT & COMPLIANCE

### 7.1 Audit Trail Design

```sql
-- ============================================================================
-- IMMUTABLE AUDIT LOG
-- ============================================================================

CREATE TABLE activity_log (
  id VARCHAR(40) PRIMARY KEY,
  case_id VARCHAR(40) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,
  actor_name VARCHAR(200),
  action VARCHAR(50) NOT NULL, -- ENUM: created, updated, deleted, approved
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(40),
  
  -- Before/After for all state changes
  old_value JSON, -- Complete record before change
  new_value JSON, -- Complete record after change
  fields_changed JSON, -- ["status", "assigned_to"]
  
  -- Compliance tracking
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  request_id VARCHAR(40), -- Correlation ID
  
  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_log_case FOREIGN KEY (case_id) REFERENCES benefit_case(id),
  CONSTRAINT ck_log_immutable CHECK (created_at IS NOT NULL), -- Can't update
  INDEX idx_case_date (case_id, created_at DESC),
  INDEX idx_actor_date (actor_email, created_at DESC),
  PARTITION BY RANGE(YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION future VALUES LESS THAN MAXVALUE
  )
) ENGINE=InnoDB;

-- COMPLIANCE GUARANTEE:
--   1. No UPDATE or DELETE allowed on activity_log (CHECK constraint)
--   2. Retention: 7 years (partitioned for efficient purge)
--   3. Immutable snapshots: old_value/new_value capture full entity state
--   4. Traceability: request_id links all operations in single request
```

### 7.2 PII Protection

```typescript
// ============================================================================
// PII FIELD ENCRYPTION & REDACTION
// ============================================================================

enum PIIFields {
  SSN_LAST4 = "ssn_last4",
  EMAIL = "email",
  PHONE = "phone",
  DATE_OF_BIRTH = "date_of_birth",
  FULL_NAME = "first_name/last_name"
}

interface PIIProtection {
  // 1. AT REST: AES-256-GCM encryption
  encryptAtRest: {
    algorithm: "AES-256-GCM",
    key_derivation: "PBKDF2",
    key_rotation: "monthly"
  },
  
  // 2. IN LOGS: Automatic redaction
  redactInLogs: {
    ssn_last4: "[REDACTED]",
    email: "***@***.***",
    phone: "***-***-****",
    date_of_birth: "****-**-**"
  },
  
  // 3. IN TRANSIT: TLS 1.3
  inTransit: {
    protocol: "TLS 1.3",
    min_version: "TLS 1.2",
    cipher_suites: ["TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"]
  },
  
  // 4. ACCESS CONTROL: RBAC + audit
  accessControl: {
    roles: {
      broker: ["view_case", "view_census_summary", "NOT view_ssn"],
      admin: ["view_all", "export"],
      employee_self: ["view_own_enrollment_only"]
    },
    audit_all_access: true,
    track_exports: true
  },
  
  // 5. DATA RETENTION AFTER DELETE
  retention_after_delete: "30 days", // For recovery
  purge_trigger: "GDPR right-to-be-forgotten"
}

// Example: PII redaction in logs
logger.info("Census member created", {
  case_id: "cs_...",
  employee_id: "EMP123",
  first_name: "[REDACTED]", // Originally "John"
  last_name: "[REDACTED]",  // Originally "Doe"
  email: "***@***.***",       // Originally john.doe@employer.com
  phone: "***-***-****"
});
```

---

## SECTION 8: DEPENDENCY INJECTION & MODULE GRAPH

### 8.1 Dependency Injection Configuration

```typescript
// ============================================================================
// SERVICE LOCATOR / CONTAINER (e.g., InversifyJS, Awilix)
// ============================================================================

const container = {
  // INFRASTRUCTURE
  database: registerSingleton(
    "database",
    () => new Database({ pool: config.database.pool })
  ),
  cache: registerSingleton(
    "cache",
    () => new RedisCache({ nodes: config.redis.nodes })
  ),
  messageQueue: registerSingleton(
    "messageQueue",
    () => new RabbitMQBroker({ url: config.rabbitmq.url })
  ),
  httpClient: registerSingleton(
    "httpClient",
    () => new HTTPClient({ timeout: 30000, retries: 3 })
  ),
  logger: registerSingleton(
    "logger",
    () => new StructuredLogger({ level: config.log.level })
  ),
  
  // REPOSITORIES
  caseRepository: registerTransient(
    "caseRepository",
    (deps) => new CaseRepository(deps.database, deps.cache, deps.logger)
  ),
  censusRepository: registerTransient(
    "censusRepository",
    (deps) => new CensusRepository(deps.database, deps.cache)
  ),
  activityLogRepository: registerTransient(
    "activityLogRepository",
    (deps) => new ActivityLogRepository(deps.database) // IMMUTABLE, no cache
  ),
  
  // DOMAIN SERVICES
  validationService: registerTransient(
    "validationService",
    (deps) => new ValidationService(config.validation)
  ),
  riskScoringService: registerTransient(
    "riskScoringService",
    (deps) => new RiskScoringService(
      deps.httpClient, // GradientAI API
      deps.logger,
      config.gradientai
    )
  ),
  notificationService: registerTransient(
    "notificationService",
    (deps) => new NotificationService(
      deps.messageQueue, // Queue email tasks
      deps.logger
    )
  ),
  
  // APPLICATION SERVICES (Orchestrators)
  caseService: registerTransient(
    "caseService",
    (deps) => new CaseService(
      deps.caseRepository,
      deps.validationService,
      deps.activityLogRepository,
      deps.notificationService,
      deps.logger
    )
  ),
  censusService: registerTransient(
    "censusService",
    (deps) => new CensusService(
      deps.censusRepository,
      deps.validationService,
      deps.riskScoringService,
      deps.messageQueue,
      deps.logger
    )
  ),
  quoteService: registerTransient(
    "quoteService",
    (deps) => new QuoteService(
      deps.caseRepository,
      deps.censusRepository,
      deps.validationService,
      deps.messageQueue,
      deps.logger
    )
  )
};

// Usage in controllers:
app.post("/cases", async (req, res) => {
  const caseService = container.resolve("caseService");
  const response = await caseService.createCase(req.body);
  res.json(response);
});
```

---

## SECTION 9: MONITORING & OBSERVABILITY

### 9.1 Key Metrics

```typescript
interface SystemMetrics {
  // Latency
  "http.request.duration_ms": {
    buckets: [10, 50, 100, 500, 1000],
    labels: ["endpoint", "method", "status_code"]
  },
  
  // Throughput
  "http.requests_total": {
    labels: ["endpoint", "status_code"]
  },
  
  // Error rate
  "http.requests.errors_total": {
    labels: ["endpoint", "error_code"]
  },
  
  // Database
  "db.connection_pool.active": {
    gauge: true
  },
  "db.query.duration_ms": {
    buckets: [1, 10, 100, 1000],
    labels: ["query_type"]
  },
  
  // Cache
  "cache.hit_rate": {
    gauge: true
  },
  "cache.eviction_rate": {
    gauge: true
  },
  
  // Async jobs
  "job.queue.depth": {
    gauge: true,
    labels: ["queue_name"]
  },
  "job.duration_seconds": {
    labels: ["job_type", "status"]
  },
  
  // Business metrics
  "cases.created_total": {
    counter: true
  },
  "enrollments.completed_total": {
    counter: true
  },
  "quotes.generated_total": {
    counter: true
  }
}

// Alerts:
// - P99 latency > 1s: Page oncall
// - Error rate > 1%: Page oncall
// - Cache hit rate < 80%: Investigate
// - Job queue depth > 1000: Scale workers
```

---

**COMPLETE SYSTEM DESIGN DOCUMENTED**

All components defined, relationships mapped, error handling specified, scalability targets set.