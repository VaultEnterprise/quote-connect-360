# Enterprise Schema Specification
**Version:** 2.0  
**Status:** PRODUCTION  
**Last Updated:** 2026-03-21  
**Compliance:** HIPAA, SOC2, PCI-DSS Ready

---

## SECTION 1: NAMING CONVENTIONS

### 1.1 Entity Naming

| Category | Pattern | Example | Rationale |
|----------|---------|---------|-----------|
| **Tables/Entities** | `PascalCase` | `CensusMember`, `BenefitPlan` | Domain-driven design |
| **Fields/Properties** | `snake_case` | `created_date`, `employer_name` | SQL/JSON interop |
| **Enums** | `UPPER_SNAKE_CASE` | `EMPLOYMENT_STATUS_ACTIVE` | Constant convention |
| **IDs** | `{entity}_{uuid}` | `mbr_550e8400e29b41d4a716446655440000` | Traceable, sortable |
| **Status Fields** | `*_status` | `case_status`, `enrollment_status` | Consistent location |
| **Timestamps** | `*_date` or `*_at` | `created_at`, `effective_date` | ISO 8601 |
| **Booleans** | `is_*` or `has_*` | `is_eligible`, `has_dependents` | Query-friendly |
| **Counts** | `*_count` | `member_count`, `dependent_count` | Explicit cardinality |

### 1.2 ID Format Specification

```
Format: {entity_prefix}_{uuid_v4}

Prefixes:
  case      → cs_
  member    → mbr_
  window    → ew_
  proposal  → prp_
  scenario  → qs_
  plan      → pln_
  renewal   → rnl_
  exception → exc_
  task      → tsk_
  document  → doc_
  agency    → agc_
  employer  → egp_
  
Example: mbr_550e8400e29b41d4a716446655440000
         ├─ Prefix: mbr_
         └─ UUID4: 550e8400-e29b-41d4-a716-446655440000
```

### 1.3 Status Enum Patterns

```typescript
// CASE STATUS (mutually exclusive states)
enum CaseStatus {
  DRAFT = "draft",
  CENSUS_IN_PROGRESS = "census_in_progress",
  CENSUS_VALIDATED = "census_validated",
  READY_FOR_QUOTE = "ready_for_quote",
  QUOTING = "quoting",
  PROPOSAL_READY = "proposal_ready",
  EMPLOYER_REVIEW = "employer_review",
  APPROVED_FOR_ENROLLMENT = "approved_for_enrollment",
  ENROLLMENT_OPEN = "enrollment_open",
  ENROLLMENT_COMPLETE = "enrollment_complete",
  ACTIVE = "active",
  RENEWAL_PENDING = "renewal_pending",
  CLOSED = "closed"
}

// ENROLLMENT STATUS (funnel stages)
enum EnrollmentStatus {
  INVITED = "invited",
  STARTED = "started",
  COMPLETED = "completed",
  WAIVED = "waived",
  TERMINATED = "terminated"
}

// EMPLOYMENT STATUS (current state)
enum EmploymentStatus {
  ACTIVE = "active",
  LEAVE = "leave",
  TERMINATED = "terminated"
}
```

---

## SECTION 2: CORE ENTITY SCHEMAS

### 2.1 BenefitCase Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BenefitCase",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^cs_[0-9a-f]{32}$",
      "description": "Unique case identifier, format: cs_{uuid4}"
    },
    "agency_id": {
      "type": "string",
      "pattern": "^agc_[0-9a-f]{32}$",
      "description": "Parent agency ID"
    },
    "employer_group_id": {
      "type": "string",
      "pattern": "^egp_[0-9a-f]{32}$",
      "description": "Employer reference"
    },
    "case_number": {
      "type": "string",
      "pattern": "^[A-Z0-9]{8,12}$",
      "example": "CS202603001",
      "description": "Human-readable reference (sequential per agency)"
    },
    "case_type": {
      "type": "string",
      "enum": ["new_business", "renewal", "mid_year_change", "takeover"],
      "description": "Case classification"
    },
    "case_status": {
      "type": "string",
      "enum": [
        "draft",
        "census_in_progress",
        "census_validated",
        "ready_for_quote",
        "quoting",
        "proposal_ready",
        "employer_review",
        "approved_for_enrollment",
        "enrollment_open",
        "enrollment_complete",
        "active",
        "renewal_pending",
        "closed"
      ],
      "description": "Current stage in lifecycle"
    },
    "effective_date": {
      "type": "string",
      "format": "date",
      "example": "2026-06-01",
      "description": "Coverage effective date (ISO 8601)"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "normal", "high", "urgent"],
      "default": "normal",
      "description": "Case priority level"
    },
    "assigned_to": {
      "type": "string",
      "format": "email",
      "description": "Broker/rep assigned to case"
    },
    "products_requested": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["medical", "dental", "vision", "life", "std", "ltd", "voluntary"]
      },
      "minItems": 1,
      "description": "Requested benefit products"
    },
    "employer_name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200,
      "description": "Denormalized employer name for display"
    },
    "employee_count": {
      "type": "integer",
      "minimum": 1,
      "maximum": 500000,
      "description": "Total eligible employees"
    },
    "census_status": {
      "type": "string",
      "enum": ["not_started", "uploaded", "validated", "issues_found"],
      "default": "not_started",
      "description": "Census data quality status"
    },
    "quote_status": {
      "type": "string",
      "enum": ["not_started", "in_progress", "completed", "expired"],
      "default": "not_started",
      "description": "Quote generation status"
    },
    "enrollment_status": {
      "type": "string",
      "enum": ["not_started", "open", "in_progress", "completed", "closed"],
      "default": "not_started",
      "description": "Employee enrollment status"
    },
    "target_close_date": {
      "type": "string",
      "format": "date",
      "description": "Expected close date"
    },
    "closed_date": {
      "type": "string",
      "format": "date-time",
      "description": "When case was closed (ISO 8601)"
    },
    "closed_reason": {
      "type": "string",
      "enum": [
        "successfully_implemented",
        "employer_declined",
        "market_failure",
        "carrier_denial",
        "withdrawn"
      ],
      "description": "Reason for closure"
    },
    "created_by": {
      "type": "string",
      "format": "email",
      "description": "User who created the case"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Creation timestamp (ISO 8601)"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "description": "Last modification timestamp"
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true,
      "description": "Flexible storage for future fields"
    }
  },
  "required": [
    "id",
    "agency_id",
    "employer_group_id",
    "case_type",
    "case_status",
    "effective_date",
    "employee_count"
  ]
}
```

### 2.2 CensusMember Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CensusMember",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^mbr_[0-9a-f]{32}$"
    },
    "census_version_id": {
      "type": "string",
      "pattern": "^cv_[0-9a-f]{32}$",
      "description": "Version of census this member belongs to"
    },
    "case_id": {
      "type": "string",
      "pattern": "^cs_[0-9a-f]{32}$"
    },
    "employee_id": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "description": "Employer's internal ID (unique per census)"
    },
    "first_name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "pattern": "^[a-zA-Z\\-'\\s]+$",
      "description": "First name (no special characters)"
    },
    "last_name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50,
      "pattern": "^[a-zA-Z\\-'\\s]+$",
      "description": "Last name (no special characters)"
    },
    "date_of_birth": {
      "type": "string",
      "format": "date",
      "description": "DOB (age must be 18-120)"
    },
    "gender": {
      "type": "string",
      "enum": ["male", "female", "other"],
      "description": "Gender identity"
    },
    "ssn_last4": {
      "type": "string",
      "pattern": "^\\d{4}$",
      "description": "Last 4 digits of SSN (PII: encrypted at rest)"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Employee email"
    },
    "phone": {
      "type": "string",
      "pattern": "^\\+?1?\\d{10,15}$",
      "description": "Phone number (E.164 format)"
    },
    "hire_date": {
      "type": "string",
      "format": "date",
      "description": "Employment start date"
    },
    "employment_status": {
      "type": "string",
      "enum": ["active", "leave", "terminated"],
      "default": "active"
    },
    "employment_type": {
      "type": "string",
      "enum": ["full_time", "part_time", "contractor"],
      "default": "full_time"
    },
    "hours_per_week": {
      "type": "number",
      "minimum": 0,
      "maximum": 168,
      "description": "Typical hours per week"
    },
    "annual_salary": {
      "type": "number",
      "minimum": 0,
      "maximum": 5000000,
      "description": "Annual salary (USD)"
    },
    "job_title": {
      "type": "string",
      "maxLength": 100,
      "description": "Job position"
    },
    "department": {
      "type": "string",
      "maxLength": 100,
      "description": "Department name"
    },
    "class_code": {
      "type": "string",
      "maxLength": 20,
      "description": "Employee class/tier"
    },
    "is_eligible": {
      "type": "boolean",
      "default": true,
      "description": "Benefit eligibility status"
    },
    "eligibility_reason": {
      "type": "string",
      "enum": [
        "probationary",
        "part_time_not_qualified",
        "contractor",
        "waived",
        "other"
      ],
      "description": "Reason if ineligible"
    },
    "dependent_count": {
      "type": "integer",
      "minimum": 0,
      "maximum": 20,
      "default": 0
    },
    "coverage_tier": {
      "type": "string",
      "enum": [
        "employee_only",
        "employee_spouse",
        "employee_children",
        "family"
      ],
      "description": "Coverage level"
    },
    "validation_status": {
      "type": "string",
      "enum": ["pending", "valid", "has_warnings", "has_errors"],
      "default": "pending"
    },
    "validation_issues": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "field": { "type": "string" },
          "severity": { "enum": ["error", "warning"] },
          "code": { "type": "string" },
          "message": { "type": "string" }
        }
      }
    },
    "gradient_ai_data": {
      "type": "object",
      "properties": {
        "risk_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 100,
          "description": "0=best, 100=worst"
        },
        "risk_tier": {
          "type": "string",
          "enum": ["preferred", "standard", "elevated", "high"]
        },
        "predicted_annual_claims": {
          "type": "number",
          "minimum": 0,
          "description": "Estimated annual claims (USD)"
        },
        "confidence_score": {
          "type": "number",
          "minimum": 0,
          "maximum": 1,
          "description": "0-1 confidence level of prediction"
        },
        "risk_factors": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "factor": { "type": "string" },
              "weight": { "type": "number" },
              "value": { "type": ["string", "number"] }
            }
          }
        },
        "analyzed_at": {
          "type": "string",
          "format": "date-time",
          "description": "When analysis was performed"
        }
      }
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "id",
    "census_version_id",
    "case_id",
    "employee_id",
    "first_name",
    "last_name",
    "date_of_birth"
  ]
}
```

---

## SECTION 3: SQL TABLE DEFINITIONS

### 3.1 Core Tables

```sql
-- ============================================================================
-- TABLE: benefit_case
-- PURPOSE: Master case records
-- RETENTION: 7 years (compliance requirement)
-- PARTITIONING: By created_at (monthly)
-- ============================================================================
CREATE TABLE benefit_case (
    id VARCHAR(40) PRIMARY KEY,
    agency_id VARCHAR(40) NOT NULL,
    employer_group_id VARCHAR(40) NOT NULL,
    case_number VARCHAR(12) NOT NULL,
    case_type ENUM('new_business', 'renewal', 'mid_year_change', 'takeover') NOT NULL,
    case_status VARCHAR(30) NOT NULL DEFAULT 'draft',
    effective_date DATE NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    assigned_to VARCHAR(255),
    products_requested JSON NOT NULL,
    employer_name VARCHAR(200) NOT NULL,
    employee_count INT NOT NULL CHECK (employee_count >= 1 AND employee_count <= 500000),
    census_status ENUM('not_started', 'uploaded', 'validated', 'issues_found') DEFAULT 'not_started',
    quote_status ENUM('not_started', 'in_progress', 'completed', 'expired') DEFAULT 'not_started',
    enrollment_status ENUM('not_started', 'open', 'in_progress', 'completed', 'closed') DEFAULT 'not_started',
    target_close_date DATE,
    closed_date DATETIME,
    closed_reason ENUM('successfully_implemented', 'employer_declined', 'market_failure', 'carrier_denial', 'withdrawn'),
    created_by VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_case_agency FOREIGN KEY (agency_id) REFERENCES agency(id),
    CONSTRAINT fk_case_employer FOREIGN KEY (employer_group_id) REFERENCES employer_group(id),
    INDEX idx_agency_status (agency_id, case_status),
    INDEX idx_effective_date (effective_date),
    INDEX idx_created_at (created_at),
    INDEX idx_case_number (case_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: census_member
-- PURPOSE: Employee census records
-- RETENTION: 7 years (compliance + renewal history)
-- PARTITIONING: By census_version_id
-- ============================================================================
CREATE TABLE census_member (
    id VARCHAR(40) PRIMARY KEY,
    census_version_id VARCHAR(40) NOT NULL,
    case_id VARCHAR(40) NOT NULL,
    employee_id VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender ENUM('male', 'female', 'other'),
    ssn_last4 VARCHAR(4),
    email VARCHAR(255),
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    employment_status ENUM('active', 'leave', 'terminated') DEFAULT 'active',
    employment_type ENUM('full_time', 'part_time', 'contractor') DEFAULT 'full_time',
    hours_per_week DECIMAL(5,2),
    annual_salary DECIMAL(12,2),
    job_title VARCHAR(100),
    department VARCHAR(100),
    class_code VARCHAR(20),
    is_eligible BOOLEAN DEFAULT TRUE,
    eligibility_reason ENUM('probationary', 'part_time_not_qualified', 'contractor', 'waived', 'other'),
    dependent_count INT DEFAULT 0 CHECK (dependent_count >= 0 AND dependent_count <= 20),
    coverage_tier ENUM('employee_only', 'employee_spouse', 'employee_children', 'family'),
    validation_status ENUM('pending', 'valid', 'has_warnings', 'has_errors') DEFAULT 'pending',
    validation_issues JSON,
    gradient_ai_data JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_member_census FOREIGN KEY (census_version_id) REFERENCES census_version(id),
    CONSTRAINT fk_member_case FOREIGN KEY (case_id) REFERENCES benefit_case(id),
    CONSTRAINT uc_member_employee_id UNIQUE(census_version_id, employee_id),
    CONSTRAINT ck_age CHECK (YEAR(CURDATE()) - YEAR(date_of_birth) BETWEEN 18 AND 120),
    INDEX idx_case_status (case_id, employment_status),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: enrollment_window
-- PURPOSE: Enrollment period configuration
-- RETENTION: 7 years
-- ============================================================================
CREATE TABLE enrollment_window (
    id VARCHAR(40) PRIMARY KEY,
    case_id VARCHAR(40) NOT NULL,
    status ENUM('scheduled', 'open', 'closing_soon', 'closed', 'finalized') DEFAULT 'scheduled',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    total_eligible INT NOT NULL,
    invited_count INT DEFAULT 0,
    enrolled_count INT DEFAULT 0,
    waived_count INT DEFAULT 0,
    pending_count INT DEFAULT 0,
    participation_rate DECIMAL(5,2),
    employer_name VARCHAR(200),
    reminder_sent_at DATETIME,
    finalized_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_window_case FOREIGN KEY (case_id) REFERENCES benefit_case(id),
    CONSTRAINT ck_dates CHECK (start_date < end_date AND end_date < effective_date),
    INDEX idx_case_dates (case_id, start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLE: employee_enrollment
-- PURPOSE: Individual employee enrollment records
-- RETENTION: 7 years
-- ============================================================================
CREATE TABLE employee_enrollment (
    id VARCHAR(40) PRIMARY KEY,
    enrollment_window_id VARCHAR(40) NOT NULL,
    case_id VARCHAR(40) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    employee_name VARCHAR(200) NOT NULL,
    access_token VARCHAR(255),
    status ENUM('invited', 'started', 'completed', 'waived') DEFAULT 'invited',
    coverage_tier ENUM('employee_only', 'employee_spouse', 'employee_children', 'family'),
    selected_plan_id VARCHAR(40),
    selected_plan_name VARCHAR(200),
    waiver_reason VARCHAR(500),
    date_of_birth DATE,
    acknowledged_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_enrollment_window FOREIGN KEY (enrollment_window_id) REFERENCES enrollment_window(id),
    CONSTRAINT fk_enrollment_case FOREIGN KEY (case_id) REFERENCES benefit_case(id),
    CONSTRAINT ck_completion CHECK (
        (status = 'completed' AND selected_plan_id IS NOT NULL) OR
        (status = 'waived' AND waiver_reason IS NOT NULL) OR
        status IN ('invited', 'started')
    ),
    INDEX idx_window_status (enrollment_window_id, status),
    INDEX idx_email (employee_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## SECTION 4: API RESPONSE FORMATS

### 4.1 Standard API Response Envelope

```typescript
// SUCCESS RESPONSE
interface ApiResponse<T> {
  status: "success" | "error" | "partial";
  data: T;
  metadata: {
    timestamp: string; // ISO 8601
    request_id: string; // Correlation ID (uuid4)
    duration_ms: number;
    version: string;
  };
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// ERROR RESPONSE
interface ErrorResponse {
  status: "error";
  error: {
    code: string; // CENSUS_VALIDATION_FAILED, QUOTE_NOT_FOUND, etc.
    message: string;
    details: Record<string, unknown>;
    path?: string;
    timestamp: string;
  };
  metadata: {
    request_id: string;
    timestamp: string;
  };
}

// PARTIAL RESPONSE (with warnings)
interface PartialResponse<T> {
  status: "partial";
  data: T;
  warnings: Array<{
    code: string;
    message: string;
    severity: "warning" | "info";
  }>;
  metadata: {
    request_id: string;
    timestamp: string;
  };
}
```

### 4.2 Census Upload Response

```json
{
  "status": "success",
  "data": {
    "census_version": {
      "id": "cv_550e8400e29b41d4a716446655440000",
      "case_id": "cs_123456789abcdef",
      "version_number": 1,
      "file_url": "s3://bucket/census/cv_550e8400.csv",
      "file_name": "employee_roster_2026.csv",
      "status": "uploaded",
      "total_employees": 250,
      "total_dependents": 125,
      "eligible_employees": 240,
      "validation_errors": 0,
      "validation_warnings": 3,
      "uploaded_by": "broker@agency.com",
      "uploaded_at": "2026-03-21T14:32:00Z"
    },
    "members_created": 250,
    "validation_summary": {
      "total_rows": 250,
      "valid_rows": 250,
      "invalid_rows": 0,
      "warnings": 3,
      "errors": 0
    }
  },
  "metadata": {
    "timestamp": "2026-03-21T14:32:05Z",
    "request_id": "req_8f8a9b0c1d2e3f4g",
    "duration_ms": 4250,
    "version": "2.0"
  }
}
```

### 4.3 Risk Analysis Response

```json
{
  "status": "success",
  "data": {
    "analysis_id": "rsk_550e8400e29b41d4a716446655440000",
    "census_version_id": "cv_550e8400e29b41d4a716446655440000",
    "status": "completed",
    "processed_count": 250,
    "succeeded": 250,
    "failed": 0,
    "risk_summary": {
      "total_members": 250,
      "preferred_count": 45,
      "preferred_pct": 18.0,
      "standard_count": 155,
      "standard_pct": 62.0,
      "elevated_count": 40,
      "elevated_pct": 16.0,
      "high_count": 10,
      "high_pct": 4.0,
      "average_risk_score": 52.3,
      "total_predicted_claims_annual": 1250000
    },
    "high_risk_members": [
      {
        "id": "mbr_550e8400e29b41d4a716446655440000",
        "employee_id": "EMP123",
        "first_name": "John",
        "last_name": "Doe",
        "risk_score": 87,
        "risk_tier": "high",
        "predicted_annual_claims": 45000,
        "exception_created": true,
        "exception_id": "exc_550e8400e29b41d4a716446655440000"
      }
    ],
    "analyzed_at": "2026-03-21T14:35:00Z",
    "duration_seconds": 325
  },
  "metadata": {
    "timestamp": "2026-03-21T14:35:30Z",
    "request_id": "req_8f8a9b0c1d2e3f4h",
    "duration_ms": 28750,
    "version": "2.0"
  }
}
```

---

## SECTION 5: CONFIGURATION TEMPLATES

### 5.1 TypeScript Configuration Type Definitions

```typescript
// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================
interface ValidationConfig {
  census: {
    fields: {
      first_name: {
        required: boolean;
        minLength: number;
        maxLength: number;
        pattern: RegExp;
      };
      last_name: {
        required: boolean;
        minLength: number;
        maxLength: number;
        pattern: RegExp;
      };
      date_of_birth: {
        required: boolean;
        minAge: number;
        maxAge: number;
      };
      email: {
        required: boolean;
        format: "email";
      };
      employment_status: {
        required: boolean;
        enum: string[];
      };
      annual_salary: {
        required: boolean;
        min: number;
        max: number;
      };
    };
    uniqueness: {
      employee_id: "per_census"; // Unique within this version
    };
    crossField: {
      rules: Array<{
        condition: string;
        requirement: string;
        severity: "error" | "warning";
      }>;
    };
  };
  quote: {
    fields: {
      effective_date: {
        required: boolean;
        minDaysOut: number; // 30 days minimum
      };
      contribution_strategy: {
        required: boolean;
        enum: string[];
      };
      carriers_included: {
        required: boolean;
        minItems: number; // At least 1
      };
    };
  };
  enrollment: {
    window: {
      maxDaysOpen: number; // Typically 14
      minDaysBeforeEffective: number; // Typically 7
    };
    member: {
      requiresCoverageTier: boolean;
      allowsWaiverOnly: boolean;
    };
  };
}

// ============================================================================
// SLA CONFIGURATION
// ============================================================================
interface SLAConfig {
  operations: {
    census_upload: {
      p50_ms: number;
      p95_ms: number;
      p99_ms: number;
      slo: string; // "99.5% within 5s"
    };
    risk_scoring: {
      p50_ms: number;
      p95_ms: number;
      p99_ms: number;
      batchSize: number; // Members per API call
      slo: string;
    };
    quote_generation: {
      p50_ms: number;
      p95_ms: number;
      p99_ms: number;
      slo: string;
    };
    enrollment_portal: {
      pageLoad_p50_ms: number;
      pageLoad_p95_ms: number;
      slo: string;
    };
  };
  availability: {
    targetUptime: number; // 0.9999 = 99.99%
    errorBudget_pct: number;
    allowedDowntime_minutes_per_month: number;
  };
}

// ============================================================================
// ERROR HANDLING CONFIGURATION
// ============================================================================
interface ErrorHandlingConfig {
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
    maxDelayMs: number;
    retryableErrors: string[]; // Timeout, ServiceUnavailable, etc.
  };
  circuitBreaker: {
    failureThreshold: number; // % failures before opening
    successThreshold: number; // Successes needed to close
    timeout_ms: number; // How long to wait before retry
  };
  fallback: {
    gradientAI: "rule_based_scoring"; // If API down
    carriers: "cached_rates"; // If API down
    email: "queue_for_retry"; // If service down
  };
}

// ============================================================================
// AUDIT & COMPLIANCE CONFIGURATION
// ============================================================================
interface AuditConfig {
  logging: {
    level: "debug" | "info" | "warn" | "error";
    redactPII: boolean;
    redactFields: string[]; // ssn_last4, email, etc.
    retention_days: number; // 90 days
  };
  audit_trail: {
    captureEvents: string[]; // case_created, census_uploaded, etc.
    retention_years: number; // 7 years
    immutable: boolean; // Append-only
  };
  compliance: {
    hipaaMode: boolean;
    soc2: boolean;
    pciDss: boolean; // If payment processing
  };
}
```

### 5.2 Environment Configuration (YAML)

```yaml
# config/production.yaml
application:
  name: "Connect Quote 360"
  version: "2.0.0"
  environment: "production"

server:
  port: 3000
  timeout_ms: 30000
  max_payload_mb: 50

database:
  host: "${DB_HOST}"
  port: 3306
  name: "benefits_platform"
  max_connections: 100
  connection_timeout_ms: 5000
  pool:
    min: 10
    max: 100
    idle_timeout_ms: 30000

external_apis:
  gradient_ai:
    base_url: "https://api.gradientai.com/v1"
    api_key: "${GRADIENT_AI_KEY}"
    timeout_ms: 30000
    batch_size: 100
    retry_policy:
      max_retries: 3
      backoff_multiplier: 2
      initial_delay_ms: 1000
      max_delay_ms: 30000
  
  carriers:
    timeout_ms: 20000
    cache_ttl_minutes: 60
    fallback: "cached_rates"

validation:
  census:
    strict_mode: true
    require_email: false
    require_phone: false
    allow_future_hire_date: false
  
  quote:
    min_days_to_effective: 30
    max_days_to_effective: 365

enrollment:
  window_max_days: 14
  grace_period_days: 3
  session_timeout_minutes: 480 # 8 hours
  reminder_days_before_close: 3

security:
  encryption:
    at_rest: true
    algorithm: "AES-256-GCM"
  
  authentication:
    method: "oauth2"
    timeout_minutes: 120
  
  rate_limiting:
    requests_per_minute: 1000
    burst_limit: 2000

audit:
  enabled: true
  retention_years: 7
  redact_pii: true
  redacted_fields:
    - "ssn_last4"
    - "email"
    - "phone"
    - "date_of_birth"

monitoring:
  metrics:
    enabled: true
    interval_seconds: 60
  
  logs:
    level: "info"
    format: "json"
    output: "stdout"
    retention_days: 90
```

---

## SECTION 6: CONSISTENCY GUARANTEES

### 6.1 Data Consistency Rules

| Entity | Property | Rule | Enforcement |
|--------|----------|------|-------------|
| **BenefitCase** | `case_status` → `case_type` | Status transitions allowed only in sequence | Database CHECK + App logic |
| **CensusMember** | `dependent_count` ↔ `coverage_tier` | Dependents must match tier | Validation on save |
| **EnrollmentWindow** | `start_date` < `end_date` < `effective_date` | Date ordering | Database CHECK + UI validation |
| **EmployeeEnrollment** | `status=completed` → requires `selected_plan_id` OR `waiver_reason` | Completion requires selection or waiver | CHECK constraint |
| **RenewalCycle** | `renewal_premium` ÷ `current_premium` = `1 + (rate_change_percent/100)` | Rate math checks out | Trigger + App validation |

### 6.2 Audit Trail Requirements

```typescript
// Every state-changing operation must log:
interface AuditLogEntry {
  id: string; // audit_log_id
  timestamp: string; // ISO 8601, UTC
  actor: {
    user_id: string;
    email: string;
    role: string;
  };
  action: string; // ENUM: created, updated, deleted, approved, etc.
  entity: {
    type: string; // CensusMember, BenefitCase, etc.
    id: string;
  };
  changes: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    fields_changed: string[];
  };
  context: {
    ip_address: string;
    user_agent: string;
    request_id: string;
  };
  immutable: true; // Append-only, no updates/deletes
}
```

---

## SECTION 7: ID GENERATION & INDEXING

### 7.1 Sortable ID Generation Algorithm

```typescript
/**
 * Generate sortable, traceable ID with timestamp ordering
 * Format: {prefix}_{timestamp}_{random}
 * 
 * Benefits:
 *   - Chronologically sortable (leads with timestamp)
 *   - Prefix reveals entity type
 *   - Random suffix prevents collisions
 *   - No sequential number exposure (security)
 * 
 * Example: mbr_20260321143200_550e8400e29b41d4
 */
function generateID(prefix: string): string {
  const timestamp = new Date().toISOString()
    .replace(/[:-]/g, '')
    .slice(0, 15); // YYYYMMDDHHmmss
  
  const random = crypto
    .randomUUID()
    .replace(/-/g, '')
    .slice(0, 16);
  
  return `${prefix}_${timestamp}_${random}`;
}

// Indexing Strategy:
// PRIMARY: (id)
// COMPOSITE: (entity_id, created_at) - For time-based queries
// COMPOSITE: (status, updated_at) - For status tracking
// COMPOSITE: (case_id, employment_status) - For case-level queries
// SINGLE: (email) - For lookup by email
```

---

## SECTION 8: COPY-PASTE READY EXAMPLES

### 8.1 Minimal Valid Census Member (JSON)

```json
{
  "employee_id": "EMP001",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1985-06-15",
  "hire_date": "2020-01-01",
  "employment_status": "active",
  "employment_type": "full_time",
  "is_eligible": true
}
```

### 8.2 Minimal Valid Enrollment Window (JSON)

```json
{
  "case_id": "cs_550e8400e29b41d4a716446655440000",
  "start_date": "2026-04-01",
  "end_date": "2026-04-15",
  "effective_date": "2026-05-01",
  "total_eligible": 150
}
```

### 8.3 Minimal Valid Quote Scenario (JSON)

```json
{
  "case_id": "cs_550e8400e29b41d4a716446655440000",
  "name": "Standard Medical + Dental",
  "effective_date": "2026-05-01",
  "census_version_id": "cv_550e8400e29b41d4a716446655440000",
  "products_included": ["medical", "dental"],
  "carriers_included": ["Aetna", "UnitedHealth"],
  "contribution_strategy": "percentage",
  "employer_contribution_ee": 80,
  "employer_contribution_dep": 50
}
```

---

## SECTION 9: VERSIONING & MIGRATION

### 9.1 Schema Version Management

```sql
-- Track schema changes for backward compatibility
CREATE TABLE schema_version (
    version_number INT PRIMARY KEY,
    table_name VARCHAR(100),
    change_type ENUM('add_column', 'remove_column', 'rename_column', 'add_table'),
    change_description VARCHAR(500),
    migration_date DATETIME,
    rollback_possible BOOLEAN,
    applied_at DATETIME
);

-- Example versions:
-- v1.0: Initial schema
-- v2.0: Added gradient_ai_data to CensusMember
-- v2.1: Added metadata JSON field (backward compatible)
-- v2.2: Added audit_trail table (non-breaking)
```

### 9.2 API Versioning Strategy

```
GET /api/v2/census-members/{id}
└─ Version 2 (current, recommended)
└─ Supports gradient_ai_data

GET /api/v1/census-members/{id}
└─ Version 1 (deprecated, end-of-life: 2027-03-21)
└─ Does NOT include gradient_ai_data
```

---

## SECTION 10: COMPLIANCE CHECKLIST

| Item | Requirement | Status |
|------|-------------|--------|
| **Data Retention** | 7-year retention for compliance | ✅ Configured |
| **Encryption** | AES-256-GCM at rest, TLS 1.3 in transit | ✅ Configured |
| **Audit Trail** | Immutable, tamper-proof, 7-year retention | ✅ Configured |
| **PII Redaction** | SSN, email, phone, DOB redacted in logs | ✅ Configured |
| **Access Control** | RBAC per role, audit all access | ✅ Implemented |
| **Data Segregation** | Agency data isolated per tenant | ✅ Configured |
| **Disaster Recovery** | RTO 4h, RPO 1h | ✅ Configured |
| **Backup Verification** | Weekly restore tests | ✅ Process |