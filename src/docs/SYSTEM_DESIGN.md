# Connect Quote 360 - System Design & Engineering Document

**Version:** 1.0  
**Last Updated:** 2026-03-21  
**Status:** Active Architecture

---

## 1. ENTITIES, RELATIONSHIPS & SCHEMAS

### 1.1 Core Entity Hierarchy

```
Agency
├── EmployerGroup
│   ├── BenefitCase
│   │   ├── CensusVersion
│   │   │   └── CensusMember
│   │   ├── QuoteScenario
│   │   │   ├── ScenarioPlan
│   │   │   └── ContributionModel
│   │   ├── PolicyMatchResult
│   │   ├── Proposal
│   │   ├── EnrollmentWindow
│   │   │   ├── EnrollmentMember
│   │   │   └── EmployeeEnrollment
│   │   ├── RenewalCycle
│   │   ├── CaseTask
│   │   ├── Document
│   │   └── ActivityLog
│   └── RenewalCycle
├── BenefitPlan
│   └── PlanRateTable
├── User (built-in entity)
├── ExceptionItem
└── Timesheet (optional future)
```

### 1.2 Entity Dependency Matrix

| Entity | Dependencies | Depends On | Relationship |
|--------|--------------|-----------|--------------|
| **BenefitCase** | CensusVersion, QuoteScenario, Proposal, EnrollmentWindow, RenewalCycle | Agency, EmployerGroup | 1:N |
| **CensusVersion** | CensusMember | BenefitCase | 1:N |
| **CensusMember** | (none) | CensusVersion | N:1 |
| **QuoteScenario** | ScenarioPlan, ContributionModel, PolicyMatchResult | BenefitCase | 1:N |
| **ScenarioPlan** | BenefitPlan, PlanRateTable | QuoteScenario | N:1 |
| **PolicyMatchResult** | (none) | BenefitCase, QuoteScenario | N:1 |
| **Proposal** | QuoteScenario | BenefitCase | 1:1 (logical) |
| **EnrollmentWindow** | EnrollmentMember, EmployeeEnrollment | BenefitCase | 1:N |
| **EmployeeEnrollment** | BenefitPlan | EnrollmentWindow | N:1 |
| **RenewalCycle** | (none) | BenefitCase, EmployerGroup | N:1 |
| **BenefitPlan** | PlanRateTable | (none) | 1:N |
| **PlanRateTable** | (none) | BenefitPlan | N:1 |
| **CaseTask** | (none) | BenefitCase | 1:N |
| **ExceptionItem** | (none) | BenefitCase | 1:N |
| **ActivityLog** | (none) | BenefitCase | 1:N |
| **Document** | (none) | BenefitCase, EmployerGroup | 1:N |

### 1.3 Enhanced Entity Schemas (with GradientAI Support)

#### CensusMember (Enhanced)
```json
{
  "id": "string",
  "census_version_id": "string",
  "case_id": "string",
  "first_name": "string",
  "last_name": "string",
  "date_of_birth": "date",
  "email": "string",
  "employment_status": "active|leave|terminated",
  "is_eligible": "boolean",
  
  "gradient_ai_data": {
    "risk_score": "number (0-100)",
    "risk_tier": "preferred|standard|elevated|high",
    "risk_factors": [
      {
        "factor": "string",
        "weight": "number",
        "impact": "number"
      }
    ],
    "predicted_claims_cost": "number",
    "confidence_score": "number (0-1)",
    "last_analyzed": "date-time"
  },
  
  "validation_status": "pending|valid|has_warnings|has_errors",
  "validation_issues": "[object]"
}
```

#### PolicyMatchResult (Enhanced)
```json
{
  "case_id": "string",
  "scenario_id": "string",
  "member_id": "string",
  "employer_name": "string",
  
  "gradient_ai_enrichment": {
    "risk_tier": "string",
    "risk_adjusted_cost": "number",
    "claim_probability": "number"
  },
  
  "risk_score": "number (0-100)",
  "base_plan_id": "string",
  "optimized_plan_id": "string",
  "base_monthly_cost": "number",
  "cost_delta_pmpm": "number",
  "status": "pending|analyzing|optimized|accepted|declined"
}
```

---

## 2. API CONTRACTS & REQUEST/RESPONSE MODELS

### 2.1 Backend Function Call Patterns

#### Pattern: Entity CRUD via SDK
```javascript
// Frontend
const response = await base44.functions.invoke('processGradientAI', {
  census_version_id: "cv_123",
  member_ids: ["m_1", "m_2"],
  force_reanalysis: false
});

// Response Structure
{
  status: "success|pending|error",
  data: {
    processed: number,
    succeeded: number,
    failed: number,
    errors: [{ member_id: string, message: string }],
    risk_summary: {
      high_risk_count: number,
      elevated_risk_count: number,
      standard_count: number,
      preferred_count: number
    }
  },
  timestamp: "date-time"
}
```

#### Pattern: Bulk Operations
```javascript
// Bulk Census Import
const response = await base44.functions.invoke('processCensusImport', {
  case_id: "case_123",
  census_version_id: "cv_456",
  file_url: "https://...",
  mapping_profile: { ... },
  validate_duplicates: true,
  auto_analyze_gradient: true
});

// Response
{
  status: "success|partial|error",
  import_result: {
    total_rows: number,
    valid_count: number,
    error_count: number,
    warning_count: number
  },
  gradient_analysis: {
    processed: number,
    succeeded: number,
    failed: number
  },
  duplicates_found: [{ email: string, count: number }],
  errors: [{ row: number, field: string, message: string }]
}
```

#### Pattern: Quote Generation
```javascript
// Generate Quote Scenario
const response = await base44.functions.invoke('generateQuoteScenario', {
  case_id: "case_123",
  scenario_name: "Scenario A",
  census_version_id: "cv_456",
  products: ["medical", "dental", "vision"],
  carriers: ["aetna", "united"],
  contribution_strategy: "percentage",
  ee_contribution_pct: 80,
  dep_contribution_pct: 60,
  use_gradient_risk_data: true
});

// Response
{
  status: "success|error",
  scenario_id: "qs_789",
  quote_result: {
    total_monthly_premium: number,
    employer_monthly_cost: number,
    employee_avg_cost: number,
    plan_count: number,
    member_count: number
  },
  policy_matches: {
    total: number,
    succeeded: number,
    failed: number
  },
  timestamp: "date-time"
}
```

### 2.2 External API Contracts

#### GradientAI API
```javascript
// Request
POST https://api.gradientai.com/v1/risk-analysis/batch
Authorization: Bearer {API_KEY}
Content-Type: application/json

{
  "members": [
    {
      "id": "m_123",
      "first_name": "John",
      "last_name": "Doe",
      "dob": "1985-05-15",
      "employment_status": "active",
      "job_title": "Engineer",
      "annual_salary": 85000
    }
  ],
  "analysis_type": "comprehensive|quick",
  "return_factors": true
}

// Response
{
  "request_id": "req_123",
  "status": "completed|partial|error",
  "results": [
    {
      "member_id": "m_123",
      "risk_score": 45,
      "risk_tier": "standard",
      "predicted_claims_cost": 8500,
      "confidence": 0.94,
      "factors": [
        { "name": "Age", "weight": 0.35 },
        { "name": "Occupation", "weight": 0.25 }
      ],
      "processed_at": "2026-03-21T21:14:28Z"
    }
  ]
}
```

#### DocuSign API
```javascript
// Send Envelope
POST https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes
Authorization: Bearer {ACCESS_TOKEN}

{
  "emailSubject": "Please sign proposal",
  "documents": [{
    "documentBase64": "...",
    "documentId": "1",
    "name": "Proposal.pdf"
  }],
  "recipients": {
    "signers": [{
      "name": "Jane Employer",
      "email": "jane@employer.com",
      "clientUserId": "unique-id"
    }]
  },
  "status": "sent"
}

// Webhook Response
{
  "envelope_id": "env_123",
  "status": "signed|declined|voided",
  "signers": [{
    "email": "jane@employer.com",
    "status": "completed",
    "signed_date_time": "2026-03-21T22:00:00Z"
  }],
  "metadata": {
    "case_id": "case_123",
    "proposal_id": "prop_456"
  }
}
```

---

## 3. SERVICE LAYER ARCHITECTURE

### 3.1 Logical Layers

```
┌─────────────────────────────────────────────────────────┐
│              PRESENTATION LAYER (React)                  │
│  Pages, Components, State Management, User Interactions   │
└────────────────┬──────────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────────┐
│           API ORCHESTRATION LAYER                         │
│  base44.functions.invoke() | React Query | TanStack       │
└────────────────┬──────────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────────┐
│         BACKEND FUNCTION LAYER (Deno/Functions/)          │
│ - Business Logic                                           │
│ - Data Transformation                                     │
│ - External API Calls (GradientAI, DocuSign, Carriers)    │
│ - Webhook Handlers                                        │
│ - Background Job Processing                              │
└────────────────┬──────────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────────┐
│       DATABASE ACCESS LAYER (Base44 SDK)                  │
│  base44.entities.* | base44.asServiceRole.entities.*      │
└────────────────┬──────────────────────────────────────────┘
                 │
┌────────────────▼──────────────────────────────────────────┐
│      DATA PERSISTENCE LAYER (Base44 Database)             │
│  Entities, Relationships, Audit Logs                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Service Modules

#### 1. **Census Management Service**
- **Responsibilities:**
  - Upload & parse CSV/XLSX files
  - Field mapping & data transformation
  - Duplicate detection & deduplication
  - Data validation & quality scoring
  - Version control & archiving
  - GradientAI integration

- **Core Functions:**
  - `processCensusImport()` — Main entry point
  - `validateCensusData()` — Validation rules engine
  - `detectDuplicates()` — Deduplication logic
  - `analyzeWithGradientAI()` — Risk scoring
  - `createCensusVersion()` — Version management

#### 2. **Quote Generation Service**
- **Responsibilities:**
  - Scenario creation & configuration
  - Plan assignment & rate table lookup
  - Premium calculation (composite & age-banded)
  - Contribution modeling
  - Cost comparison & analysis
  - Scenario optimization recommendations

- **Core Functions:**
  - `generateQuoteScenario()` — Main orchestrator
  - `calculatePremiums()` — Rate calculation engine
  - `optimizeContribution()` — Contribution strategy optimization
  - `compareScenarios()` — Multi-scenario analysis

#### 3. **Policy Match Service**
- **Responsibilities:**
  - Risk assessment per member
  - Plan recommendation algorithm
  - Enhancement suggestions (ancillary benefits)
  - Broker talking points generation
  - Auto-bindability determination
  - GradientAI risk tier integration

- **Core Functions:**
  - `matchPolicies()` — Main matching logic
  - `scoreRisk()` — Risk calculation
  - `recommendEnhancements()` — Enhancement suggestions
  - `generateTalkingPoints()` — Sales content

#### 4. **Enrollment Service**
- **Responsibilities:**
  - Enrollment window creation & management
  - Employee invitation & token generation
  - Plan selection & dependent management
  - Waiver processing
  - Completion tracking
  - Employee portal access

- **Core Functions:**
  - `createEnrollmentWindow()` — Window setup
  - `inviteEmployees()` — Batch invitations
  - `processEnrollment()` — Submission handling
  - `processWaiver()` — Waiver logic
  - `finalizeEnrollment()` — Completion workflow

#### 5. **Renewal Cycle Service**
- **Responsibilities:**
  - Renewal initiation & milestone tracking
  - Rate analysis & change prediction
  - Marketing & options preparation
  - Employer decision workflow
  - Install processing
  - Renewal analytics

- **Core Functions:**
  - `initiateRenewalCycle()` — Setup
  - `analyzeRateChange()` — Rate impact analysis
  - `predictDisruption()` — Disruption scoring
  - `trackRenewalProgress()` — Status management

#### 6. **Exception Management Service**
- **Responsibilities:**
  - Exception detection & auto-categorization
  - Severity assessment
  - Assignment & escalation
  - Resolution tracking
  - Bulk operations
  - Exception analytics

- **Core Functions:**
  - `createException()` — Exception logging
  - `triageException()` — Auto-categorization
  - `resolveException()` — Resolution workflow
  - `bulkUpdateStatus()` — Bulk operations

#### 7. **Proposal Service**
- **Responsibilities:**
  - Proposal generation from quote scenarios
  - DocuSign integration for e-signature
  - Version management & tracking
  - Status monitoring (sent, viewed, signed)
  - Expiration handling
  - Audit trail maintenance

- **Core Functions:**
  - `generateProposal()` — Create from scenario
  - `sendProposal()` — DocuSign submission
  - `trackProposalStatus()` — Status monitoring
  - `expireProposal()` — Expiration workflow

#### 8. **Integration Infrastructure Service**
- **Responsibilities:**
  - Endpoint health monitoring
  - Service dependency tracking
  - Retry logic & circuit breakers
  - Payload validation
  - Structured logging
  - Secrets management

- **Core Functions:**
  - `healthCheck()` — Endpoint monitoring
  - `retryWithBackoff()` — Retry strategy
  - `validatePayload()` — Request validation
  - `logStructured()` — Audit logging

---

## 4. VALIDATION LOGIC & CONSTRAINTS

### 4.1 Entity-Level Validation Rules

#### CensusMember Validation
```javascript
VALIDATION_RULES: {
  first_name: {
    type: "string",
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: "^[a-zA-Z\\s'-]*$"
  },
  last_name: {
    type: "string",
    required: true,
    minLength: 1,
    maxLength: 100
  },
  date_of_birth: {
    type: "date",
    required: true,
    minAge: 16,
    maxAge: 100,
    validRange: [1920-01-01, 2010-12-31]
  },
  email: {
    type: "string",
    required: true,
    format: "email",
    uniqueWithin: "census_version_id"
  },
  ssn_last4: {
    type: "string",
    required: false,
    pattern: "^[0-9]{4}$"
  },
  employment_status: {
    enum: ["active", "leave", "terminated"],
    required: true
  },
  employment_type: {
    enum: ["full_time", "part_time", "contractor"],
    required: true
  },
  hire_date: {
    type: "date",
    required: true,
    mustBeBefore: "today"
  }
}

CROSS_FIELD_VALIDATION: {
  active_employment: {
    rule: "employment_status === 'active' => hire_date <= today",
    message: "Active employees must have valid hire date"
  },
  eligibility_reason: {
    rule: "is_eligible === false => eligibility_reason is required",
    message: "Ineligible members must have eligibility reason"
  },
  dependent_coverage: {
    rule: "coverage_tier contains 'spouse|children' => dependent_count > 0",
    message: "Coverage tier must match dependent count"
  }
}
```

#### BenefitCase Validation
```javascript
VALIDATION_RULES: {
  case_number: {
    type: "string",
    pattern: "^CASE-[0-9]{6}$",
    required: true,
    autoGenerate: true
  },
  effective_date: {
    type: "date",
    required: true,
    mustBeAfter: "today",
    mustBeFirstOfMonth: true
  },
  stage: {
    enum: [
      "draft", "census_in_progress", "census_validated",
      "ready_for_quote", "quoting", "proposal_ready",
      "employer_review", "approved_for_enrollment",
      "enrollment_open", "enrollment_complete",
      "install_in_progress", "active", "renewal_pending",
      "renewed", "closed"
    ],
    required: true,
    defaultValue: "draft"
  },
  case_type: {
    enum: ["new_business", "renewal", "mid_year_change", "takeover"],
    required: true
  },
  priority: {
    enum: ["low", "normal", "high", "urgent"],
    required: true,
    defaultValue: "normal"
  }
}

STAGE_TRANSITIONS: {
  "draft" => ["census_in_progress"],
  "census_in_progress" => ["census_validated", "census_in_progress"],
  "census_validated" => ["ready_for_quote"],
  "ready_for_quote" => ["quoting"],
  "quoting" => ["proposal_ready", "quoting"],
  "proposal_ready" => ["employer_review"],
  "employer_review" => ["approved_for_enrollment", "ready_for_quote"],
  "approved_for_enrollment" => ["enrollment_open"],
  "enrollment_open" => ["enrollment_complete"],
  "enrollment_complete" => ["install_in_progress"],
  "install_in_progress" => ["active"],
  "active" => ["renewal_pending"],
  "renewal_pending" => ["renewed", "quoting"],
  "renewed" => ["active"],
  "active" => ["closed"]
}
```

#### QuoteScenario Validation
```javascript
VALIDATION_RULES: {
  name: {
    type: "string",
    required: true,
    minLength: 1,
    maxLength: 50,
    uniqueWithin: "case_id"
  },
  census_version_id: {
    type: "string",
    required: true,
    mustExist: "CensusVersion"
  },
  effective_date: {
    type: "date",
    required: true,
    mustMatch: "BenefitCase.effective_date"
  },
  products_included: {
    type: "array",
    required: true,
    minItems: 1,
    items: {
      enum: ["medical", "dental", "vision", "life", "std", "ltd"]
    }
  },
  carriers_included: {
    type: "array",
    required: true,
    minItems: 1
  },
  contribution_strategy: {
    enum: ["percentage", "flat_dollar", "defined_contribution", "custom"],
    required: true
  }
}

BUSINESS_RULES: {
  require_medical: "products_included must include 'medical'",
  min_plans_per_product: "Each product must have >= 1 plan",
  contribution_coverage: "Contribution must not exceed 100%",
  aca_compliance: "EE-only plans must meet ACA affordability (<=9.12% FPL)"
}
```

### 4.2 Data Quality Constraints

```javascript
DUPLICATE_DETECTION_RULES: {
  email_exact: {
    weight: 1.0,
    threshold: "EXCLUDE",
    message: "Duplicate email within census"
  },
  email_ssn_match: {
    weight: 0.95,
    threshold: "FLAG_WARNING",
    message: "Same SSN with different email"
  },
  name_dob_match: {
    weight: 0.85,
    threshold: "FLAG_WARNING",
    message: "Same name and DOB with different email"
  },
  fuzzy_name_match: {
    weight: 0.70,
    threshold: "FLAG_REVIEW",
    algorithm: "levenshtein",
    message: "Similar names detected"
  }
}

REFERENTIAL_INTEGRITY: {
  CensusMember.census_version_id => CensusVersion(id) [REQUIRED],
  CensusMember.case_id => BenefitCase(id) [REQUIRED],
  QuoteScenario.census_version_id => CensusVersion(id) [REQUIRED],
  ScenarioPlan.plan_id => BenefitPlan(id) [REQUIRED],
  EmployeeEnrollment.selected_plan_id => BenefitPlan(id) [OPTIONAL],
  PolicyMatchResult.scenario_id => QuoteScenario(id) [REQUIRED]
}
```

---

## 5. MODULE DEPENDENCIES & MAPPING

### 5.1 Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│  Dashboard | Cases | Census | Quotes | Enrollment | Renewals │
└────────┬────────────────────────────────┬────────────────────┘
         │                                │
    ┌────▼──────────────────┐    ┌────────▼─────────────────┐
    │  Page Components      │    │   Shared Components       │
    │  - CaseDetail         │    │   - StatusBadge           │
    │  - Census             │    │   - EmptyState            │
    │  - Quotes             │    │   - LoadingSkeleton       │
    │  - Enrollment         │    │   - PageHeader            │
    │  - Renewals           │    │   - MetricCard            │
    └────┬──────────────────┘    └────────┬─────────────────┘
         │                                │
    ┌────▼──────────────────────────────────▼──────────────┐
    │     REACT QUERY HOOKS & STATE MANAGEMENT              │
    │  - useQuery() for data fetching                       │
    │  - useMutation() for API calls                        │
    │  - queryClientInstance for caching                   │
    └────┬──────────────────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────────────────────┐
    │     BASE44 SDK CLIENT (api/base44Client.js)            │
    │  - base44.functions.invoke()                          │
    │  - base44.entities.*                                  │
    │  - base44.auth.me()                                   │
    │  - base44.analytics.track()                           │
    └────┬──────────────────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────────────────────┐
    │       BACKEND FUNCTION LAYER (functions/)              │
    │  ┌───────────────────────────────────────────────┐    │
    │  │  processGradientAI()                          │    │
    │  │  ├─ Calls GradientAI API                      │    │
    │  │  ├─ Updates CensusMember.gradient_ai_data   │    │
    │  │  └─ Creates exceptions for high-risk         │    │
    │  │                                               │    │
    │  │  processCensusImport()                        │    │
    │  │  ├─ Parses file (CSV/XLSX)                   │    │
    │  │  ├─ Maps fields                              │    │
    │  │  ├─ Validates data                           │    │
    │  │  ├─ Detects duplicates                       │    │
    │  │  └─ Calls processGradientAI()                │    │
    │  │                                               │    │
    │  │  generateQuoteScenario()                      │    │
    │  │  ├─ Fetches census & plans                   │    │
    │  │  ├─ Calculates premiums                      │    │
    │  │  ├─ Runs policy matching                     │    │
    │  │  └─ Creates ContributionModel                │    │
    │  │                                               │    │
    │  │  matchPolicies()                              │    │
    │  │  ├─ Integrates gradient_ai_data              │    │
    │  │  ├─ Scores risk & value                      │    │
    │  │  ├─ Recommends enhancements                  │    │
    │  │  └─ Returns talking points                   │    │
    │  │                                               │    │
    │  │  generateProposal()                           │    │
    │  │  ├─ Fetches scenario & contribution data    │    │
    │  │  ├─ Builds PDF                               │    │
    │  │  └─ Sends via DocuSign                       │    │
    │  │                                               │    │
    │  │  createException()                            │    │
    │  │  ├─ Triggered from multiple services         │    │
    │  │  ├─ Auto-categorizes severity                │    │
    │  │  └─ Assigns to queue                         │    │
    │  │                                               │    │
    │  │  healthCheck()                                │    │
    │  │  ├─ Pings external endpoints                 │    │
    │  │  ├─ Tracks response times                    │    │
    │  │  └─ Records status                           │    │
    │  └───────────────────────────────────────────────┘    │
    └────┬──────────────────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────────────────────┐
    │    EXTERNAL API INTEGRATIONS                           │
    │  ├─ GradientAI (Risk Scoring)                         │
    │  ├─ DocuSign (E-Signature)                            │
    │  ├─ Carrier APIs (Rate Submission)                    │
    │  ├─ TPA Export (Claims Data)                          │
    │  ├─ Payroll Deductions (Billing)                      │
    │  ├─ Email Service (Notifications)                     │
    │  └─ SMS Gateway (Alerts)                              │
    └────┬──────────────────────────────────────────────────┘
         │
    ┌────▼──────────────────────────────────────────────────┐
    │    BASE44 DATABASE                                     │
    │  ├─ Entities (all schemas)                            │
    │  ├─ Audit Logs (ActivityLog)                          │
    │  ├─ User Management (User entity)                     │
    │  └─ Real-time Subscriptions                           │
    └────────────────────────────────────────────────────────┘
```

### 5.2 Critical Dependencies

| Module | Depends On | Risk | Mitigation |
|--------|-----------|------|-----------|
| **Policy Match** | Census, Quote Scenario, GradientAI | High | Cache gradient data; async processing |
| **Quote Generation** | Census, Plans, Rate Tables | High | Validate data; version rate tables |
| **Proposal** | Quote Scenario, DocuSign | Medium | Queue-based; webhook monitoring |
| **Enrollment** | Plans, Employee Portal API | Medium | Circuit breaker; retry logic |
| **Renewal** | Active Case, Historical Data | Low | Batch processing; scheduled tasks |
| **GradientAI** | External API | Critical | Fallback scoring; circuit breaker |
| **DocuSign** | External API | Critical | Async queuing; webhook retry |

---

## 6. SCALE DESIGN (10K–100K+ Users)

### 6.1 Scalability Targets

| Metric | Target | Implementation |
|--------|--------|-----------------|
| **Concurrent Users** | 10K–100K | Connection pooling, load balancing |
| **Cases (Active)** | 50K–500K | Database indexing, sharding strategy |
| **Census Members** | 5M–50M | Bulk processing, archive strategy |
| **API Latency** | <500ms p95 | Caching, CDN, edge computing |
| **Function Throughput** | 1K–10K/minute | Queue-based processing, batching |
| **Data Ingestion** | 100K+ rows/hour | Parallel processing, streaming |
| **Report Generation** | <5 min for 10K members | Background jobs, incremental updates |

### 6.2 Database Optimization

#### Indexing Strategy
```javascript
// CensusMember Indexes
db.CensusMember.createIndex({ case_id: 1, census_version_id: 1 })
db.CensusMember.createIndex({ census_version_id: 1, validation_status: 1 })
db.CensusMember.createIndex({ email: 1 }, { unique: true })
db.CensusMember.createIndex({ "gradient_ai_data.risk_tier": 1 })

// BenefitCase Indexes
db.BenefitCase.createIndex({ employer_group_id: 1, stage: 1 })
db.BenefitCase.createIndex({ assigned_to: 1, stage: 1 })
db.BenefitCase.createIndex({ last_activity_date: -1 })

// QuoteScenario Indexes
db.QuoteScenario.createIndex({ case_id: 1, status: 1 })
db.QuoteScenario.createIndex({ is_recommended: 1, case_id: 1 })
```

#### Query Optimization
```javascript
// Avoid N+1 queries via aggregation
// Bad: Loop through cases, fetch scenarios per case
for (const case of cases) {
  const scenarios = await QuoteScenario.find({ case_id: case.id });
}

// Good: Aggregate with lookup
const data = await BenefitCase.aggregate([
  { $match: { stage: "ready_for_quote" } },
  { $lookup: {
    from: "quote_scenarios",
    localField: "id",
    foreignField: "case_id",
    as: "scenarios"
  } }
]);
```

#### Sharding Strategy (Future)
```javascript
// Shard by agency_id for multi-tenant isolation
db.collection.createIndex({ agency_id: 1, case_id: 1 }, { unique: true })

// Allows horizontal scaling:
// Shard 1: agency_id 001-100 (10M members)
// Shard 2: agency_id 101-200 (10M members)
// ...
// Shard N: agency_id X-Y (10M members)
```

### 6.3 Caching Strategy

```javascript
CACHE_LAYERS: {
  1_EDGE_CDN: {
    ttl: "5 minutes",
    items: ["BenefitPlan", "PlanRateTable", "Agency"],
    strategy: "immutable content"
  },
  2_APPLICATION: {
    ttl: "30 minutes",
    items: ["CensusVersion (partial)", "QuoteScenario"],
    tool: "React Query",
    invalidateOn: ["update", "delete"]
  },
  3_DATABASE: {
    ttl: "read replica lag",
    strategy: "write to primary, read from replica"
  }
}

// Cache Invalidation
// On CensusMember update:
queryClient.invalidateQueries({
  queryKey: ['census', caseId]
});

// On gradient_ai_data update:
base44.entities.CensusMember.subscribe((event) => {
  if (event.data.gradient_ai_data) {
    broadcastCacheInvalidation('policy-match');
  }
});
```

### 6.4 Async Processing & Queues

```javascript
// Heavy operations moved to background jobs
ASYNC_OPERATIONS: {
  // Census import: Process in background
  processCensusImport: {
    maxProcessingTime: "30 minutes",
    batching: "1000 rows/batch",
    parallelism: "10 parallel batches",
    retry: "3 attempts with exponential backoff",
    progressTracking: true
  },

  // Gradient AI analysis: Queue-based
  analyzeWithGradientAI: {
    queueType: "priority queue",
    batchSize: "100 members/API call",
    maxRetries: 3,
    backoffStrategy: "exponential (2s, 4s, 8s)"
  },

  // Proposal generation: Background task
  generateProposal: {
    queueType: "FIFO",
    timeout: "10 minutes",
    notifyOnCompletion: true
  }
}
```

### 6.5 Load Balancing

```javascript
// Function invocation distribution
LOAD_DISTRIBUTION: {
  geographic: "Route to nearest regional function",
  probabilistic: "Gradual rollout (5% -> 25% -> 100%)",
  circuitBreaker: {
    failureThreshold: "5 consecutive failures",
    timeout: "30 seconds",
    recoveryTime: "5 minutes"
  }
}
```

---

## 7. ERROR HANDLING & RETRY LOGIC

### 7.1 Error Classification

```javascript
ERROR_CATEGORIES: {
  VALIDATION_ERROR: {
    statusCode: 400,
    retryable: false,
    example: "Invalid email format",
    action: "Fix input and resubmit"
  },

  AUTHENTICATION_ERROR: {
    statusCode: 401,
    retryable: false,
    example: "Invalid API key",
    action: "Refresh credentials"
  },

  AUTHORIZATION_ERROR: {
    statusCode: 403,
    retryable: false,
    example: "Insufficient permissions",
    action: "Contact admin"
  },

  NOT_FOUND_ERROR: {
    statusCode: 404,
    retryable: false,
    example: "Case not found",
    action: "Verify case ID"
  },

  RATE_LIMIT_ERROR: {
    statusCode: 429,
    retryable: true,
    backoffStrategy: "exponential",
    maxRetries: 5,
    example: "Too many requests"
  },

  SERVER_ERROR: {
    statusCode: 500,
    retryable: true,
    backoffStrategy: "exponential",
    maxRetries: 3,
    example: "Internal server error"
  },

  TIMEOUT_ERROR: {
    statusCode: 504,
    retryable: true,
    backoffStrategy: "exponential",
    maxRetries: 3,
    timeout: "30 seconds"
  },

  EXTERNAL_API_ERROR: {
    statusCode: "varies",
    retryable: true,
    examples: ["GradientAI unavailable", "DocuSign rate limit"],
    fallback: "queue for retry"
  }
}
```

### 7.2 Retry Strategy

```javascript
RETRY_HANDLER: {
  async retryWithBackoff(fn, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      jitter = true
    } = options;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (!isRetryable(error) || attempt === maxRetries) {
          throw error;
        }

        let delay = initialDelay * Math.pow(backoffMultiplier, attempt);
        if (jitter) {
          delay += Math.random() * delay * 0.1; // ±10% jitter
        }
        delay = Math.min(delay, maxDelay);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

### 7.3 Error Response Format

```javascript
ERROR_RESPONSE_STRUCTURE: {
  success: false,
  status: "error",
  error: {
    code: "GRADIENT_AI_UNAVAILABLE",
    message: "GradientAI service temporarily unavailable",
    details: {
      external_service: "gradientai",
      http_status: 503,
      retry_after: 60
    },
    timestamp: "2026-03-21T21:14:28.123Z",
    request_id: "req_123abc",
    correlation_id: "corr_456def"
  },
  
  // Optional fallback
  fallback: {
    used: true,
    method: "cached_gradient_data",
    age_minutes: 5
  },

  // User-facing message
  userMessage: "Risk analysis temporarily unavailable. Using previous results.",
  
  // For client retry
  retryable: true,
  retryAfter: 60
}
```

### 7.4 Circuit Breaker Pattern

```javascript
CIRCUIT_BREAKER: {
  CLOSED: {
    description: "Normal operation",
    onSuccess: "Keep closed",
    onFailure: "Track failure count",
    failureThreshold: 5,
    action: "Transition to OPEN after 5 failures"
  },

  OPEN: {
    description: "Service unavailable, failing fast",
    action: "Reject all requests immediately",
    timeout: 60000, // 1 minute
    action: "Transition to HALF_OPEN after timeout"
  },

  HALF_OPEN: {
    description: "Testing service recovery",
    action: "Allow 1 test request",
    onSuccess: "Transition to CLOSED",
    onFailure: "Transition back to OPEN"
  }
}

// Example: GradientAI circuit breaker
const gradientBreaker = new CircuitBreaker({
  failureThreshold: 5,
  timeout: 60000,
  onOpen: () => useGradientDataCache()
});
```

---

## 8. AUDIT LOGGING & TRACEABILITY

### 8.1 Audit Log Schema

```javascript
ACTIVITY_LOG_STRUCTURE: {
  id: "unique identifier",
  case_id: "string (required)",
  timestamp: "date-time (auto)",
  actor_email: "string (current user)",
  actor_name: "string (user full name)",
  
  // Action metadata
  action: "string (e.g., 'case_created', 'census_uploaded')",
  action_type: "create|update|delete|view|export",
  action_category: "case|census|quote|enrollment|proposal|renewal",
  
  // Entity details
  entity_type: "string (BenefitCase, CensusMember, etc.)",
  entity_id: "string",
  
  // Change tracking
  old_value: "string (JSON)",
  new_value: "string (JSON)",
  changed_fields: ["stage", "priority"],
  
  // Request context
  request_id: "string",
  correlation_id: "string",
  ip_address: "string",
  user_agent: "string",
  session_id: "string",
  
  // System context
  function_name: "string (if triggered by function)",
  external_service: "string (if external API involved)",
  status: "success|failure",
  error_message: "string (if failure)",
  
  // Custom fields
  detail: "string",
  metadata: {
    custom_key: "custom_value"
  }
}
```

### 8.2 Critical Events to Log

```javascript
CRITICAL_EVENTS: [
  // Case lifecycle
  { action: "case_created", severity: "info" },
  { action: "case_stage_advanced", severity: "info" },
  { action: "case_closed", severity: "info" },

  // Census operations
  { action: "census_imported", severity: "info" },
  { action: "census_validated", severity: "info" },
  { action: "census_member_updated", severity: "info" },
  { action: "duplicate_detected", severity: "warning" },

  // Risk analysis
  { action: "gradient_ai_analyzed", severity: "info" },
  { action: "high_risk_member_flagged", severity: "warning" },
  { action: "risk_exception_created", severity: "warning" },

  // Quote & Proposal
  { action: "quote_scenario_created", severity: "info" },
  { action: "proposal_generated", severity: "info" },
  { action: "proposal_sent", severity: "info" },
  { action: "proposal_signed", severity: "info" },

  // Enrollment
  { action: "enrollment_opened", severity: "info" },
  { action: "employee_enrolled", severity: "info" },
  { action: "enrollment_completed", severity: "info" },
  { action: "waiver_submitted", severity: "info" },

  // Authorization
  { action: "user_permission_denied", severity: "warning" },
  { action: "unauthorized_access_attempted", severity: "critical" },

  // External integrations
  { action: "external_api_call", severity: "info" },
  { action: "external_api_failure", severity: "error" },
  { action: "webhook_received", severity: "info" },

  // System operations
  { action: "data_export", severity: "info" },
  { action: "bulk_operation", severity: "info" },
  { action: "scheduled_job_executed", severity: "info" }
]
```

### 8.3 Structured Logging Format

```javascript
STRUCTURED_LOG_FORMAT: {
  timestamp: "2026-03-21T21:14:28.123Z",
  level: "info|warn|error|critical",
  
  // Trace context
  request_id: "req_abc123",
  correlation_id: "corr_xyz789",
  trace_id: "trace_001",
  span_id: "span_001",
  
  // Service context
  service: "quote-connect-360",
  function: "generateQuoteScenario",
  version: "1.0.0",
  environment: "production|staging|development",
  
  // User context
  user_id: "user_123",
  user_email: "broker@agency.com",
  session_id: "sess_456",
  
  // Request context
  method: "invoke",
  endpoint: "generateQuoteScenario",
  status_code: 200,
  duration_ms: 1234,
  
  // Business context
  case_id: "case_789",
  entity_type: "QuoteScenario",
  entity_id: "qs_012",
  action: "quote_scenario_created",
  
  // Performance metrics
  query_count: 5,
  api_calls: [
    {
      service: "gradientai",
      duration_ms: 450,
      status: "success"
    }
  ],
  
  // Message & data
  message: "Quote scenario generated successfully",
  details: {
    scenario_name: "Scenario A",
    plan_count: 12,
    total_premium: 45000
  },
  
  // Error (if applicable)
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid effective date",
    stack_trace: "..."
  }
}
```

### 8.4 Audit Log Queries

```javascript
// User audit trail
base44.entities.ActivityLog.filter({
  actor_email: "broker@agency.com",
  case_id: "case_123"
}, '-timestamp', 50)

// Case history
base44.entities.ActivityLog.filter({
  case_id: "case_123"
}, '-timestamp', 100)

// Failed operations
base44.entities.ActivityLog.filter({
  status: "failure",
  created_date: { $gte: "2026-03-20" }
}, '-timestamp', 50)

// High-risk events
base44.entities.ActivityLog.filter({
  action: "high_risk_member_flagged"
}, '-timestamp', 100)

// External API calls
base44.entities.ActivityLog.filter({
  external_service: "gradientai",
  created_date: { $gte: "2026-03-21" }
}, '-timestamp', 200)
```

### 8.5 Audit Trail Compliance

```javascript
RETENTION_POLICY: {
  "default": {
    retention_days: 365,
    archive_after_days: 90,
    deletion_allowed: false
  },
  "financial_events": {
    retention_days: 2555, // 7 years
    archive_after_days: 365,
    deletion_allowed: false
  },
  "sensitive_operations": {
    retention_days: 2555,
    archive_after_days: 180,
    deletion_allowed: false,
    encrypted: true
  }
}

IMMUTABLE_REQUIREMENTS: {
  description: "Audit logs must be immutable after creation",
  implementation: [
    "No UPDATE or DELETE operations on ActivityLog",
    "Database-level write-once enforcement",
    "Daily snapshots to immutable storage",
    "Cryptographic signatures for integrity verification"
  ]
}
```

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Now)
- [x] Entity schemas & relationships
- [x] API contracts & request/response models
- [x] Service layer architecture
- [x] Validation rules & constraints
- [x] Basic error handling
- [x] Audit logging framework

### Phase 2: Optimization (Next Quarter)
- [ ] Database indexing & query optimization
- [ ] Caching layer (React Query + CDN)
- [ ] Circuit breaker implementation
- [ ] GradientAI integration (Phase 1)
- [ ] Structured logging deployment

### Phase 3: Scale (Q2-Q3)
- [ ] Async queue-based processing
- [ ] Database sharding strategy
- [ ] Load balancing & distribution
- [ ] Advanced monitoring & alerting
- [ ] GradientAI Phase 2 & 3 integration

### Phase 4: Hardening (Q4)
- [ ] Disaster recovery procedures
- [ ] Failover testing
- [ ] Security audit & penetration testing
- [ ] Performance benchmarking
- [ ] Compliance certification

---

## 10. MONITORING & OBSERVABILITY

### Key Metrics to Track

```javascript
METRICS: {
  // Availability
  "uptime_percent": "99.9%",
  "function_success_rate": "percentage",
  "api_error_rate": "percentage",

  // Performance
  "function_latency_p50": "milliseconds",
  "function_latency_p95": "milliseconds",
  "function_latency_p99": "milliseconds",
  "database_query_time": "milliseconds",
  "external_api_call_time": "milliseconds",

  // Business
  "cases_created_per_day": "count",
  "census_members_imported": "count",
  "quotes_generated": "count",
  "enrollments_completed": "count",
  "proposals_signed": "count",

  // Quality
  "data_validation_error_rate": "percentage",
  "duplicate_detection_rate": "percentage",
  "gradient_ai_risk_distribution": "histogram",
  "exception_auto_resolution_rate": "percentage",

  // Cost
  "function_invocations": "count",
  "external_api_calls": "count",
  "data_transferred_gb": "gigabytes"
}
```

---

## 11. SECURITY CONSIDERATIONS

### Data Classification

```javascript
DATA_CLASSIFICATION: {
  PUBLIC: ["Agency name", "Plan information"],
  INTERNAL: ["Case numbers", "Stage transitions"],
  CONFIDENTIAL: ["Member names", "Salary data", "Health info"],
  RESTRICTED: ["SSN", "Medical diagnoses", "Claims data"]
}

ENCRYPTION: {
  transit: "TLS 1.3",
  rest: {
    pii: "AES-256",
    sensitive: "AES-256",
    at_rest_key_rotation: "90 days"
  }
}
```

---

## 12. DISASTER RECOVERY

### RTO/RPO Targets

```javascript
RECOVERY_TARGETS: {
  data: {
    RPO: "5 minutes", // Recovery Point Objective
    RTO: "15 minutes" // Recovery Time Objective
  },
  
  critical_functions: {
    RPO: "1 minute",
    RTO: "5 minutes"
  },
  
  backup_strategy: {
    frequency: "continuous",
    replication: "multi-region",
    testing: "monthly"
  }
}
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-21 | Engineering | Initial system design |
| | | | |