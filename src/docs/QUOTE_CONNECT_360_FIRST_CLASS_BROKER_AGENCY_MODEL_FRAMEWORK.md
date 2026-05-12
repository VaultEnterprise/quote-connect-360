# First-Class Broker Agency Model, Quote Connect 360, and Benefits Admin Bridge Framework

**Framework Name:** FIRST_CLASS_BROKER_AGENCY_MODEL  
**Status:** FRAMEWORK_SAVED  
**Runtime Status:** INACTIVE  
**Implementation Status:** NOT_STARTED  
**Created:** 2026-05-12  
**Supersedes:** Tenant → MGA → Broker Agency mandatory hierarchy  

---

## 1. Framework Purpose and Corrected Hierarchy

### Prior Hierarchy (Incorrect)

```
Tenant
  → MGA (required parent)
      → Broker Agency (required child of MGA)
```

This model forced all brokers into the MGA hierarchy and prevented independent broker agency operation.

### Corrected Hierarchy (This Framework)

```
Tenant / Platform
  ├─ Platform Direct Business
  ├─ Standalone Broker Agencies (first-class platform organizations)
  └─ Master General Agents
      ├─ MGA Direct Business
      └─ MGA-Affiliated Broker Relationships (optional)
```

**Core Principle:** Broker agencies are first-class platform organizations that can operate independently without an MGA parent.

---

## 2. Non-Negotiable Architecture Rules

### Rule 2.1: BrokerAgencyProfile Independence

**CRITICAL RULE:**

`BrokerAgencyProfile.master_general_agent_id` must NOT be required or identifying.

If `master_general_agent_id` exists on any broker-related record for legacy compatibility:

- It must be **nullable**
- It must be **non-identifying** (not part of unique constraints)
- It must not serve as the broker agency's identity anchor
- It must not be the required parent of the broker agency

### Rule 2.2: Standalone Broker Data Signature

Standalone broker records must support:

```
broker_agency_id: <valid_uuid>
master_general_agent_id: null
channel_type: "standalone_broker"
broker_platform_relationship_id: <valid_uuid>
distribution_channel_context_id: <valid_uuid>
```

### Rule 2.3: No MGA Parent Requirement

A broker agency record must be creatable and operable with:

```sql
INSERT INTO broker_agency_profile (
  tenant_id,
  broker_agency_id,
  legal_name,
  broker_platform_relationship_id,
  channel_type
)
VALUES (...)
-- master_general_agent_id is null, and that is valid
```

---

## 3. Required Broker Operating Modes

### standalone_broker

- Broker agency approved directly by CES/platform
- No MGA parent relationship
- No master_general_agent_id
- Can create employers, cases, quotes, proposals, Benefits Admin cases
- Full workspace access at `/broker`
- Visible on `/command-center/broker-agencies`
- Not visible on `/command-center/mga/broker-agencies` unless explicit access grant

### mga_affiliated_broker

- Broker agency operating under one or more `BrokerMGARelationship`
- Has `master_general_agent_id` for that relationship only
- Records created under `mga_affiliated_broker` channel are visible to that MGA
- Broker maintains independent workspace at `/broker`
- MGA can see affiliated broker business in `/command-center/mga/broker-agencies`
- Broker direct (standalone) business is separate and MGA-invisible

### hybrid_broker

- Broker agency with both direct platform business and one or more MGA-affiliated books
- Maintains separate `channel_type = "hybrid_broker_direct"` for direct business
- Maintains separate `channel_type = "hybrid_broker_mga"` for each affiliated MGA
- Broker workspace shows both books with clear separation
- MGA sees only the affiliated book

### inactive

- Broker agency not currently permitted to conduct active business
- Records archived or suspended
- Users cannot log in
- No new cases, quotes, or proposals can be created
- Historical records remain visible to authorized users for audit

---

## 4. DistributionChannelContext

### Purpose

`DistributionChannelContext` is the ownership and visibility control mechanism for all major business records. It replaces ambiguous ownership rules with explicit channel declaration.

### Definition

Every relevant record must include:

```typescript
distribution_channel_context_id: UUID         // FK to DistributionChannelContext
channel_type: enum                            // See channel types below
tenant_id: UUID
master_general_agent_id: UUID | null          // Only if MGA-involved
broker_agency_id: UUID | null                 // Only if broker-involved
broker_platform_relationship_id: UUID | null  // Only if standalone/direct broker
broker_mga_relationship_id: UUID | null       // Only if MGA-affiliated broker
employer_id: UUID
created_by_user_id: UUID
created_by_role: string
visibility_scope: enum
```

### Channel Types (Required)

- `platform_direct` — CES/platform-owned business
- `standalone_broker` — Standalone broker agency business
- `mga_direct` — MGA-owned business
- `mga_affiliated_broker` — Broker business under MGA relationship
- `hybrid_broker_direct` — Hybrid broker direct platform business
- `hybrid_broker_mga` — Hybrid broker MGA-affiliated business
- `employer_direct` — Employer self-service (future)

### Records That Must Carry DistributionChannelContext

1. `Employer`
2. `BenefitCase` / `BenefitsImplementationCase`
3. `CensusVersion`
4. `QuoteScenario`
5. `Proposal`
6. `EnrollmentWindow`
7. `RenewalCycle`
8. `QuoteToBenefitsPackage`
9. `EmployerBenefitsProfile`
10. `BenefitDocument`
11. `Task`
12. `Notification`
13. `AuditEvent`
14. `BenefitsRenewalCase`

### Examples by Channel

**Example 1: Standalone Broker Case**

```json
{
  "distribution_channel_context_id": "uuid_abc",
  "channel_type": "standalone_broker",
  "tenant_id": "tenant_001",
  "master_general_agent_id": null,
  "broker_agency_id": "broker_123",
  "broker_platform_relationship_id": "relationship_456",
  "broker_mga_relationship_id": null,
  "employer_id": "employer_789",
  "visibility_scope": "broker_agency",
  "created_by_user_id": "user_broker_001"
}
```

**Example 2: MGA-Affiliated Broker Case**

```json
{
  "distribution_channel_context_id": "uuid_def",
  "channel_type": "mga_affiliated_broker",
  "tenant_id": "tenant_001",
  "master_general_agent_id": "mga_111",
  "broker_agency_id": "broker_123",
  "broker_platform_relationship_id": "relationship_456",
  "broker_mga_relationship_id": "mga_relationship_222",
  "employer_id": "employer_789",
  "visibility_scope": "broker_and_mga",
  "created_by_user_id": "user_broker_001"
}
```

**Example 3: MGA Direct Case**

```json
{
  "distribution_channel_context_id": "uuid_ghi",
  "channel_type": "mga_direct",
  "tenant_id": "tenant_001",
  "master_general_agent_id": "mga_111",
  "broker_agency_id": null,
  "broker_platform_relationship_id": null,
  "broker_mga_relationship_id": null,
  "employer_id": "employer_999",
  "visibility_scope": "mga",
  "created_by_user_id": "user_mga_001"
}
```

**Example 4: Platform Direct Case**

```json
{
  "distribution_channel_context_id": "uuid_jkl",
  "channel_type": "platform_direct",
  "tenant_id": "tenant_001",
  "master_general_agent_id": null,
  "broker_agency_id": null,
  "broker_platform_relationship_id": null,
  "broker_mga_relationship_id": null,
  "employer_id": "employer_platform",
  "visibility_scope": "platform",
  "created_by_user_id": "user_platform_admin"
}
```

---

## 5. Required Core Objects

### 5.1 BrokerAgencyProfile

```typescript
BrokerAgencyProfile {
  id: UUID (PK)
  tenant_id: UUID (FK, required)
  broker_agency_id: UUID (UK with tenant, required)
  
  // Identity
  legal_name: string
  dba_name: string | null
  code: string (UK with tenant)
  
  // Primary Contact
  primary_contact_user_id: UUID | null
  primary_contact_email: string
  primary_contact_name: string
  primary_phone: string
  
  // Address
  business_address_json: JSON
  mailing_address_json: JSON
  
  // Service Geography
  zip_code: string
  state: string
  service_states_json: string[] // JSON array of states
  service_zip_codes_json: string[] // JSON array
  service_counties_json: string[] // JSON array
  service_radius_miles: number | null
  
  // Insurance Lines
  insurance_lines_json: string[] // JSON array
  active_for_lines_json: string[] // JSON array
  preferred_lines_json: string[] // JSON array
  restricted_lines_json: string[] // JSON array
  
  // Carrier & Specialty
  carrier_appointments_json: JSON
  carrier_access_json: JSON
  industry_specialties_json: string[] // JSON array
  employer_size_min: number | null
  employer_size_max: number | null
  
  // Licensing
  license_states_json: string[] // JSON array
  license_numbers_json: JSON
  license_expiration_json: JSON
  npn: string | null
  
  // Capacity & Operations
  delegation_enabled: boolean
  accepts_new_assignments: boolean
  capacity_status: enum // available, limited, at_capacity, over_capacity
  current_open_case_count: number
  current_open_quote_count: number
  max_open_case_capacity: number | null
  max_open_quote_capacity: number | null
  
  // Compliance
  compliance_status: enum // pending_review, compliant, issues_found, suspended
  onboarding_status: enum // draft, invited, pending_profile_completion, pending_approval, active, suspended, inactive, terminated, rejected
  relationship_status: enum // draft, pending, active, suspended, inactive, terminated
  portal_access_enabled: boolean
  
  // Approval & Lifecycle
  approved_by_user_id: UUID | null
  approved_at: timestamp | null
  suspended_at: timestamp | null
  suspension_reason: string | null
  self_signup_source: string | null
  
  // Audit
  created_at: timestamp
  updated_at: timestamp
  created_by_user_id: UUID
}
```

### 5.2 BrokerPlatformRelationship

Use this for direct broker business with CES/platform.

```typescript
BrokerPlatformRelationship {
  id: UUID (PK)
  tenant_id: UUID (FK, required)
  broker_agency_id: UUID (FK, required, UK with tenant)
  
  // Relationship Status
  status: enum // draft, invited, pending_approval, active, suspended, inactive, terminated
  approval_status: enum // pending, approved, rejected
  relationship_type: enum // direct_platform, marketplace, referral
  
  // Approval
  requested_at: timestamp
  requested_by_user_id: UUID
  approved_at: timestamp | null
  approved_by_user_id: UUID | null
  activated_at: timestamp | null
  
  // Scope & Permissions
  can_create_employers: boolean
  can_create_cases: boolean
  can_create_quotes: boolean
  can_create_proposals: boolean
  can_request_benefits_setup: boolean
  can_view_analytics: boolean
  can_export_data: boolean
  
  // Book of Business
  direct_employer_count: number
  direct_case_count: number
  direct_quote_count: number
  direct_premium_ytd: decimal | null
  
  // Compliance
  compliance_status: enum
  last_compliance_review_at: timestamp | null
  last_compliance_review_by: UUID | null
  
  // Audit
  created_at: timestamp
  updated_at: timestamp
  audit_trace_id: UUID
}
```

### 5.3 BrokerMGARelationship

Use this only for optional broker affiliation with an MGA.

```typescript
BrokerMGARelationship {
  id: UUID (PK)
  tenant_id: UUID (FK, required)
  broker_agency_id: UUID (FK, required)
  master_general_agent_id: UUID (FK, required)
  
  // Relationship Status
  status: enum // draft, invited, pending_broker_acceptance, pending_mga_approval, active, suspended, inactive, terminated
  relationship_type: enum // delegated_producer, captive, affiliated, preferred
  
  // Proposal & Approval
  proposed_at: timestamp
  proposed_by_user_id: UUID
  proposed_by_role: string
  broker_accepted_at: timestamp | null
  broker_accepted_by_user_id: UUID | null
  mga_approved_at: timestamp | null
  mga_approved_by_user_id: UUID | null
  
  // Governance
  can_broker_see_mga_direct_cases: boolean
  can_broker_see_mga_analytics: boolean
  can_mga_see_broker_direct_cases: boolean
  can_mga_reassign_broker_quotes: boolean
  can_mga_take_over_broker_cases: boolean
  
  // Book of Business
  affiliated_employer_count: number
  affiliated_case_count: number
  affiliated_quote_count: number
  affiliated_premium_ytd: decimal | null
  
  // Compliance
  compliance_status: enum
  
  // Termination
  end_date: timestamp | null
  termination_reason: string | null
  terminated_by_user_id: UUID | null
  terminated_at: timestamp | null
  
  // Audit
  created_at: timestamp
  updated_at: timestamp
  audit_trace_id: UUID
}
```

**CRITICAL RULE:** Creating a `BrokerMGARelationship` must NOT convert the broker's entire book into MGA-visible business. Only records created under `mga_affiliated_broker` channel are visible to that MGA.

### 5.4 BrokerAgencyUser

```typescript
BrokerAgencyUser {
  id: UUID (PK)
  tenant_id: UUID (FK, required)
  broker_agency_id: UUID (FK, required)
  user_id: UUID (FK, required)
  
  // Identity
  email: string (UK with tenant, broker, user)
  first_name: string
  last_name: string
  
  // Role
  role: enum // broker_agency_admin, broker_producer, broker_account_manager, broker_benefits_admin, broker_quote_user, broker_read_only
  
  // Status
  status: enum // invited, active, inactive, suspended
  
  // Lifecycle
  invited_at: timestamp
  accepted_at: timestamp | null
  last_login_at: timestamp | null
  
  // Audit
  created_at: timestamp
  updated_at: timestamp
}
```

### 5.5 BrokerEmployerRelationship

```typescript
BrokerEmployerRelationship {
  id: UUID (PK)
  tenant_id: UUID (FK, required)
  broker_agency_id: UUID (FK, required)
  employer_id: UUID (FK, required)
  
  // Relationship
  relationship_type: enum // producer_of_record, servicing_broker, quote_only, benefits_service, renewal_service, referral, shared_service, historical
  relationship_status: enum // active, suspended, inactive, transferred, terminated
  
  // Ownership
  assigned_by_user_id: UUID
  assigned_at: timestamp
  primary_service_owner_user_id: UUID | null
  producer_of_record_user_id: UUID | null
  commission_owner_user_id: UUID | null
  
  // Visibility
  service_level: enum // full_service, limited_service, read_only
  visibility_scope: enum // full, quote_only, renewal_only
  
  // Dates
  effective_date: date
  end_date: date | null
  
  // Notes
  notes: string | null
  
  // Audit
  created_at: timestamp
  updated_at: timestamp
}
```

### 5.6 BrokerScopeAccessGrant

```typescript
BrokerScopeAccessGrant {
  id: UUID (PK)
  tenant_id: UUID (FK, required)
  broker_agency_id: UUID (FK, required) // Broker getting access
  master_general_agent_id: UUID (FK, required) // MGA granting access
  
  // Grant Details
  access_type: enum // view_only, limited_edit, full_access
  target_record_type: enum // case, quote, proposal, document, analytics
  target_record_id: UUID | null // if specific record, else null for all
  
  // Lifecycle
  granted_at: timestamp
  granted_by_user_id: UUID
  expires_at: timestamp | null
  revoked_at: timestamp | null
  revoked_by_user_id: UUID | null
  reason: string | null
  
  // Audit
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 6. Required Scope Rules

### Rule 6.1: Platform / CES Admin

- Can see all records if permissioned
- Can create, update, archive, approve, suspend any broker or business record
- Can reassign ownership across channels
- Can view full audit trail

### Rule 6.2: Standalone Broker User

- Can see only their `broker_agency_id` records
- Cannot see another broker's records
- Cannot see MGA records unless explicit `BrokerScopeAccessGrant` exists
- Cannot see platform direct records
- Visibility scope: `standalone_broker` channel only

### Rule 6.3: Hybrid Broker User

- Can see direct platform business (`channel_type = "hybrid_broker_direct"`)
- Can see each MGA-affiliated book separately (`channel_type = "hybrid_broker_mga"`)
- Books must be separated in UI and scoped service calls
- Cannot see direct books of other MGA relationships without explicit grant

### Rule 6.4: MGA User

- Can see MGA direct business (`channel_type = "mga_direct"`)
- Can see broker business tied to active `BrokerMGARelationship` (`channel_type = "mga_affiliated_broker"`)
- **Cannot see standalone broker direct book** unless explicit `BrokerScopeAccessGrant` exists
- Visibility scope: `mga` or `broker_and_mga` only

### Rule 6.5: Employer User

- Can see only employer-scoped records
- Cannot see other employers
- Cannot see internal MGA or broker notes unless shared

### Rule 6.6: Employee User

- Can see only their own employee benefits records
- Cannot see employer internal data
- Cannot see other employees

### Rule 6.7: Scope Violations

**Must return masked 404** (not 403):

```
GET /api/cases/case_456 (belongs to different broker)
→ 404 Not Found (record appears not to exist)
```

### Rule 6.8: Permission Violations

**Must return 403** (within valid scope but no permission):

```
GET /api/cases/case_456 (user's broker, but lacks read permission)
→ 403 Forbidden (you don't have permission to view this record)
```

---

## 7. Required UI Framework

### 7.1 Platform Broker Management UI

**Route:** `/command-center/broker-agencies`

**Tabs:**
- All Broker Agencies
- Pending Broker Signups
- Standalone Brokers
- MGA-Affiliated Brokers
- Hybrid Brokers
- Compliance
- Direct Broker Business
- Reports
- Audit Log
- Settings

**Header Buttons:**
- Add Broker Agency
- Invite Broker
- Import Brokers
- View Pending Approvals
- Manage Platform Permissions
- View Audit Log

**Broker Row Actions:**
- View Profile
- View Direct Book
- View MGA Relationships
- Invite User
- Edit Compliance
- Suspend / Reactivate
- Message Broker

---

### 7.2 MGA Broker Management UI

**Route:** `/command-center/mga/broker-agencies`

**Important Rule:** Do not show standalone broker direct book here unless an explicit `BrokerScopeAccessGrant` exists.

**Tabs:**
- Affiliated Brokers
- Affiliate Requests (pending)
- Broker Employers
- Broker Cases
- Broker Quotes
- Broker Compliance
- Reports
- Audit Log

**Header Buttons:**
- Invite Broker to Affiliate
- View All Broker Relationships
- Manage Broker Permissions
- View Broker Workload
- View Audit Log

**Broker Row Actions (Affiliated Only):**
- View Affiliated Book
- View Employers
- View Cases
- View Quotes
- View Compliance
- Message Broker
- Manage Permissions
- Terminate Relationship

---

### 7.3 Broker Workspace

**Route:** `/broker`

**Broker Workspace Routes:**
- `/broker/book-of-business` (dashboard showing direct + affiliated books)
- `/broker/employers` (all employers under broker)
- `/broker/cases` (all cases under broker)
- `/broker/census` (all census versions)
- `/broker/quotes` (all quotes)
- `/broker/proposals` (all proposals)
- `/broker/benefits-admin` (all Benefits Admin setups)
- `/broker/renewals` (all renewals)
- `/broker/tasks` (all tasks assigned to broker)
- `/broker/documents` (all documents)
- `/broker/reports` (analytics, workload)
- `/broker/settings` (profile, users, preferences)

**Dashboard Cards (Book of Business):**
- Direct Platform Business (if standalone or hybrid)
  - Direct employers
  - Direct active cases
  - Direct quotes in progress
  - Direct proposals pending
- MGA-Affiliated Business (if mga_affiliated or hybrid)
  - Affiliated employers
  - Affiliated active cases
  - Affiliated quotes in progress
  - Affiliated proposals pending
  - Associated MGA(s) summary
- Renewal Pipeline
- Benefits Admin Pipeline
- Tasks Due
- Alerts

**Broker Actions:**
- Create Employer
- Create Case
- Create Quote
- Upload Census
- Create Proposal
- Request MGA Review
- Request Benefits Setup
- View Benefits Status

---

### 7.4 Quote Connect 360 Integration

The existing quote builder must be reused through `QuoteWorkspaceWrapper`.

**Do not build separate quote builders** for platform, MGA, and broker workflows.

**Supported Context Types:**
- `platform_direct` (CES/platform quote)
- `standalone_broker` (broker direct quote)
- `mga_direct` (MGA-owned quote)
- `mga_affiliated_broker` (broker quote under MGA)
- `hybrid_broker_direct` (hybrid broker direct quote)
- `hybrid_broker_mga` (hybrid broker affiliated quote)

**QuoteWorkspaceWrapper must support:**
1. Platform creates quote directly
2. Standalone broker creates quote
3. MGA creates quote for self
4. MGA creates quote and assigns to affiliated broker
5. MGA creates quote and assigns to standalone broker (with grant)
6. Broker creates quote for self
7. Broker requests MGA review
8. MGA reviews, returns, approves, or takes over
9. Sold quote requests Benefits Admin setup

---

### 7.5 Benefits Admin Bridge

The Benefits Admin bridge must support:
- Standalone broker cases
- MGA direct cases
- MGA-affiliated broker cases
- Hybrid broker direct cases
- Hybrid broker MGA cases
- Platform direct cases

**Phase 0 Naming:**

Use these button names:

- **"Start Benefits Admin Setup"** or **"Create Benefits Admin Case"**
- Do NOT call it **"Activate Benefits"**

Reason: Phase 0 creates an implementation case only. It does NOT activate live benefits, enrollment, payroll, EDI, or go-live.

---

## 8. Quote Connect 360 Integration Rules

### Rule 8.1: Reuse Quote Builder

The existing quote builder must be reused through `QuoteWorkspaceWrapper`.

**Do not create separate quote builders for platform, MGA, and broker.**

### Rule 8.2: Channel-Aware Quote Workspace

`QuoteWorkspaceWrapper` must accept context:

```typescript
QuoteWorkspaceWrapperContext {
  initiated_by: 'platform' | 'mga' | 'broker' | 'system',
  mode: 'create' | 'edit' | 'review' | 'assign' | 'renewal',
  quote_case_id: UUID | null,
  quote_scenario_id: UUID | null,
  selected_broker_agency_id: UUID | null,
  selected_employer_id: UUID,
  master_general_agent_id: UUID | null,
  distribution_channel_context_id: UUID | null,
  source_context: string,
  permissions: PermissionSet,
  lock_rules: LockRuleSet,
  return_url: string
}
```

### Rule 8.3: Quote Ownership & Assignment

All `QuoteScenario` records must include:

```typescript
distribution_channel_context_id: UUID
channel_type: enum // platform_direct, standalone_broker, mga_direct, etc.
broker_agency_id: UUID | null
master_general_agent_id: UUID | null
assigned_to_user_id: UUID | null
assigned_to_broker_agency_id: UUID | null
assigned_by_user_id: UUID
assignment_status: enum // pending_acceptance, accepted, in_progress, needs_mga_review, etc.
created_by_user_id: UUID
created_by_role: string
quote_owner_type: enum // created_by_user, assigned_to_user, assigned_to_broker
```

---

## 9. Benefits Admin Bridge Rules

### Rule 9.1: Bridge Object Naming

Use:

- `BenefitsImplementationCase` (not generic `BenefitCase`)

Reason: The system will eventually have renewal cases, COBRA cases, offboarding cases, EOI cases, and life-event cases. `BenefitsImplementationCase` is clearer.

### Rule 9.2: Bridge Lineage

`QuoteToBenefitsPackage` and `BenefitsImplementationCase` must preserve:

```typescript
source_broker_agency_id: UUID | null
source_broker_user_id: UUID | null
source_broker_mga_relationship_id: UUID | null
source_broker_employer_relationship_id: UUID | null
source_case_owner_type: enum // user, broker, mga
source_quote_owner_type: enum // created_by_user, assigned_to_broker
source_quote_assignment_id: UUID | null
source_delegation_audit_trace_id: UUID
```

### Rule 9.3: Phase 0 Scope

Phase 0 creates:
- `QuoteToBenefitsPackage` (immutable sold quote snapshot)
- `BenefitsImplementationCase` (implementation case record)
- Status sync back to Quote Connect 360
- Broker and MGA visibility per permissions
- Audit trail

Phase 0 does NOT create:
- Live Benefits Admin activation
- Employee enrollment flows
- Payroll mapping
- EDI transmission
- Policy / rate management
- Go-live approval
- Full Benefits Admin setup

These are Phase 6 and later.

### Rule 9.4: "Start Benefits Admin Setup" Button

When a quote is marked sold:

1. Quote status becomes `sold_pending_benefits_setup`
2. User clicks **"Start Benefits Admin Setup"** (not "Activate Benefits")
3. System validates sold quote package
4. System creates immutable `QuoteToBenefitsPackage`
5. System creates `BenefitsImplementationCase` (status: `activation_case_created`)
6. Quote status becomes `benefits_setup_case_created`
7. Broker and MGA can view status in their respective workspaces
8. No live activation or benefits deployment occurs in Phase 0

---

## 10. Phase Model

### Phase 0: Correct Core Model

**Objective:** Establish scope, hierarchy, and channel context.

**Deliverables:**
- Scope context and broker independence rules
- `DistributionChannelContext` definition and audit
- Broker operating modes (standalone, affiliated, hybrid, inactive)
- Required relationship objects (no implementation)
- Permission and scope rule framework
- Security and contract baseline
- Database indexes and migration rules
- Framework documentation

**Does not include:**
- Runtime code
- UI implementation
- Entity creation
- Schema changes

### Phase 1: Standalone Broker Signup

**Objective:** Enable independent broker signup and approval.

**Deliverables:**
- `BrokerAgencyProfile` entity
- `BrokerPlatformRelationship` entity
- `BrokerAgencyUser` entity
- Broker self-signup form
- Broker onboarding approval workflow
- Platform broker management UI (`/command-center/broker-agencies`)
- Broker compliance document upload

### Phase 2: Broker Direct Workspace

**Objective:** Enable standalone broker to operate independently.

**Deliverables:**
- `/broker` workspace
- Broker employers, cases, quotes, proposals management
- Broker analytics and reporting
- Broker task management
- Broker document management
- Broker settings

### Phase 3: MGA Relationship Support

**Objective:** Enable optional broker affiliation with MGAs.

**Deliverables:**
- `BrokerMGARelationship` entity
- `BrokerEmployerRelationship` entity
- `BrokerScopeAccessGrant` entity
- MGA broker affiliation workflow
- MGA broker relationship management UI
- Scope isolation enforcement

### Phase 4: Quote Connect 360 Channel-Aware Wrapper

**Objective:** Reuse quote builder across all channels.

**Deliverables:**
- Enhanced `QuoteScenario` with channel/assignment fields
- `QuoteAssignment` entity
- `QuoteAssignmentEvent` entity
- `QuoteWorkspaceWrapper` component
- Assignment routing and MGA review workflow
- Quote reassignment and takeover flows

### Phase 5: Benefits Admin Bridge Phase 0

**Objective:** Enable sold quote → Benefits Implementation Case pipeline.

**Deliverables:**
- `QuoteToBenefitsPackage` entity with broker lineage
- `BenefitsImplementationCase` entity with broker lineage
- "Start Benefits Admin Setup" button in Quote Connect 360
- Benefits status sync back to Quote Connect 360
- Benefits Admin placeholder case detail
- Activation validation and audit
- Broker/MGA visibility control

### Phase 6: Benefits Admin Foundation

**Objective:** Establish full Benefits Admin case setup structure.

**Deliverables:**
- `EmployerBenefitsProfile` entity
- `BenefitPolicyLibrary` and plan option framework
- `BenefitRateTable` and contribution model support
- Employer setup page
- Plans & Policies tab
- Rates tab
- Documents tab
- Audit tab
- Readiness gates

---

## 11. Permission Namespaces

All permissions must fall under these namespaces:

### platform_broker.*

- `platform_broker.create` (create broker agency)
- `platform_broker.read` (read broker profile)
- `platform_broker.update` (update broker profile)
- `platform_broker.approve` (approve broker)
- `platform_broker.suspend` (suspend broker)
- `platform_broker.view_all` (view all brokers)
- `platform_broker.manage_compliance` (manage broker compliance)
- `platform_broker.manage_users` (manage broker users)
- `platform_broker.view_direct_book` (view broker direct business)
- `platform_broker.view_audit` (view broker audit)

### broker_agency.*

- `broker_agency.create_employer` (create employer under broker)
- `broker_agency.create_case` (create case under broker)
- `broker_agency.create_quote` (create quote under broker)
- `broker_agency.create_proposal` (create proposal)
- `broker_agency.request_benefits_setup` (request Benefits Admin setup)
- `broker_agency.manage_team` (manage broker users)
- `broker_agency.view_analytics` (view broker analytics)
- `broker_agency.export_data` (export broker data)
- `broker_agency.view_audit` (view broker audit)

### broker_direct.*

- `broker_direct.view_own_book` (view own direct book)
- `broker_direct.manage_own_cases` (manage own cases)
- `broker_direct.manage_own_quotes` (manage own quotes)
- `broker_direct.manage_own_proposals` (manage own proposals)

### broker_mga.*

- `broker_mga.accept_mga_relationship` (accept MGA affiliation)
- `broker_mga.view_affiliated_book` (view MGA-affiliated book)
- `broker_mga.manage_affiliated_cases` (manage affiliated cases)
- `broker_mga.manage_affiliated_quotes` (manage affiliated quotes)
- `broker_mga.submit_to_mga` (submit quote to MGA review)

### quote_delegation.*

- `quote_delegation.create` (create quote assignment)
- `quote_delegation.assign` (assign quote to broker)
- `quote_delegation.reassign` (reassign quote)
- `quote_delegation.accept` (accept quote assignment)
- `quote_delegation.decline` (decline quote assignment)
- `quote_delegation.complete` (complete quote assignment)
- `quote_delegation.take_over` (take over broker quote)
- `quote_delegation.request_review` (request MGA review)
- `quote_delegation.approve` (approve quote)
- `quote_delegation.return_to_broker` (return quote to broker)
- `quote_delegation.view_audit` (view assignment audit)

### benefits_admin.*

- `benefits_admin.create_case` (create Benefits Implementation Case)
- `benefits_admin.start_setup` (initiate Benefits Admin setup from quote)
- `benefits_admin.view_case` (view Benefits case)
- `benefits_admin.validate_quote_package` (validate sold quote package)
- `benefits_admin.view_quote_package` (view quote-to-benefits package)
- `benefits_admin.approve_activation` (approve Benefits activation)
- `benefits_admin.manage_setup` (manage Benefits setup)
- `benefits_admin.view_audit` (view Benefits audit)

---

## 12. Backend Contract Namespaces

All protected backend operations must go through contracts:

### brokerSignupContract

- Validates broker self-signup
- Creates `BrokerAgencyProfile` (draft)
- Sends MGA approval request

### brokerAgencyContract

- Validates broker profile updates
- Stamps `distribution_channel_context_id`
- Enforces scope and permission rules
- Logs audit events

### brokerPlatformRelationshipContract

- Creates or updates `BrokerPlatformRelationship`
- Validates platform approval
- Enables/disables direct workspace access
- Enforces scope rules

### brokerMGARelationshipContract

- Creates or updates `BrokerMGARelationship`
- Validates MGA and broker acceptance
- Enables/disables affiliation visibility
- Enforces scope isolation rule: affiliated records only visible to MGA

### distributionChannelContract

- Validates channel context assignment
- Stamps `channel_type` on new records
- Enforces visibility scope rules
- Returns masked 404 on scope violations

### brokerWorkspaceContract

- Controls broker workspace access
- Scopes employer, case, quote queries
- Enforces visibility_scope
- Returns masked 404 on unauthorized access

### quoteDelegationContract

- Creates quote assignments
- Validates assignment status transitions
- Creates `QuoteAssignmentEvent` for audit
- Enforces broker acceptance/decline workflows
- Handles reassignment and takeover

### quoteBenefitsBridgeContract

- Validates sold quote eligibility
- Creates immutable `QuoteToBenefitsPackage` with broker lineage
- Creates `BenefitsImplementationCase` with broker lineage
- Syncs status back to Quote Connect 360
- Enforces Phase 0 limitations (no full activation)

### benefitsImplementationContract

- Controls Benefits Implementation Case access
- Enforces visibility rules per channel_type
- Scopes operations by broker/MGA/employer
- Logs all audit events

### scopeResolutionContract

- Resolves user's tenant, broker, MGA, employer scope
- Validates scope claims server-side
- Returns masked 404 on invalid scope
- Never trusts frontend scope claims

### auditContract

- Logs all material create/update/archive/assign/activate events
- Records actor, role, old/new values, reason
- Stamps `audit_trace_id` on related records
- Enforces immutability of audit trail

### notificationContract

- Sends notifications to brokers on quote assignment
- Sends notifications to MGA on submission/return
- Sends notifications to employer on case/quote status changes
- Respects visibility scope (broker cannot see MGA internal notes)

---

## 13. Audit Event Catalog

### Broker Platform Events

- `BROKER_AGENCY_SIGNED_UP` — Broker self-signup initiated
- `BROKER_AGENCY_PROFILE_SUBMITTED` — Broker submitted profile for approval
- `BROKER_AGENCY_APPROVED` — MGA/platform approved broker
- `BROKER_AGENCY_REJECTED` — MGA/platform rejected broker
- `BROKER_AGENCY_SUSPENDED` — Broker suspended by platform
- `BROKER_AGENCY_REACTIVATED` — Broker reactivated
- `BROKER_USER_INVITED` — New user invited to broker
- `BROKER_USER_ACTIVATED` — User accepted broker invite
- `BROKER_USER_ROLE_CHANGED` — User role changed
- `BROKER_USER_DEACTIVATED` — User deactivated
- `BROKER_COMPLIANCE_DOCUMENT_UPLOADED` — License/agreement uploaded
- `BROKER_COMPLIANCE_REVIEW_COMPLETED` — Compliance review finished
- `BROKER_CAPACITY_UPDATED` — Case/quote capacity changed

### Broker MGA Relationship Events

- `BROKER_MGA_AFFILIATION_PROPOSED` — MGA proposed broker affiliation
- `BROKER_MGA_AFFILIATION_ACCEPTED` — Broker accepted MGA relationship
- `BROKER_MGA_AFFILIATION_DECLINED` — Broker declined MGA relationship
- `BROKER_MGA_AFFILIATION_APPROVED` — MGA approved affiliation
- `BROKER_MGA_AFFILIATION_ACTIVE` — Affiliation activated
- `BROKER_MGA_AFFILIATION_SUSPENDED` — Affiliation suspended
- `BROKER_MGA_AFFILIATION_TERMINATED` — Affiliation terminated
- `BROKER_SCOPE_GRANT_CREATED` — MGA granted broker access to specific record
- `BROKER_SCOPE_GRANT_REVOKED` — MGA revoked broker access

### Broker Business Events

- `BROKER_EMPLOYER_CREATED` — Broker created employer
- `BROKER_EMPLOYER_ASSIGNED` — Employer assigned to broker
- `BROKER_CASE_CREATED` — Broker created case
- `BROKER_CASE_UPDATED` — Broker updated case
- `BROKER_CASE_TRANSFERRED` — Case transferred to another broker
- `BROKER_CASE_ARCHIVED` — Case archived

### Quote Delegation Events

- `QUOTE_ASSIGNMENT_CREATED` — Quote assigned to broker
- `QUOTE_ASSIGNMENT_NOTIFICATION_SENT` — Broker notified of assignment
- `QUOTE_ASSIGNMENT_ACCEPTED` — Broker accepted assignment
- `QUOTE_ASSIGNMENT_DECLINED` — Broker declined assignment
- `QUOTE_ASSIGNMENT_STARTED` — Broker started working quote
- `QUOTE_ASSIGNMENT_REASSIGNED` — Quote reassigned to different broker
- `QUOTE_SUBMITTED_TO_MGA` — Broker submitted quote to MGA
- `QUOTE_RETURNED_TO_BROKER` — MGA returned quote to broker
- `QUOTE_TAKEN_OVER_BY_MGA` — MGA took over broker quote
- `QUOTE_MARKED_SOLD` — Quote marked sold
- `QUOTE_ASSIGNMENT_CANCELLED` — Assignment cancelled

### Benefits Bridge Events

- `QUOTE_BENEFITS_PACKAGE_VALIDATED` — Sold quote package validated
- `QUOTE_BENEFITS_PACKAGE_CREATED` — `QuoteToBenefitsPackage` created
- `BENEFITS_IMPLEMENTATION_CASE_CREATED` — `BenefitsImplementationCase` created
- `BENEFITS_SETUP_STARTED` — "Start Benefits Setup" initiated
- `BENEFITS_STATUS_PUSHED_TO_QUOTE` — Benefits status synced to Quote Connect 360
- `BENEFITS_CASE_VIEWED_FROM_QUOTE` — User navigated from quote to Benefits case
- `QUOTE_VIEWED_FROM_BENEFITS_CASE` — User navigated from Benefits case back to quote
- `BENEFITS_ACTIVATION_VALIDATION_FAILED` — Validation failed
- `BENEFITS_ACTIVATION_CANCELLED` — Activation cancelled

**All material actions must create audit events.**

---

## 14. Migration and Backfill Rules

### 14.1 Existing MGA Direct Records

All existing records with:

```
master_general_agent_id = MGA_ID
broker_agency_id = null
```

Must be assigned:

```
channel_type: "mga_direct"
distribution_channel_context_id: <new context>
master_general_agent_id: MGA_ID (preserved)
broker_agency_id: null
broker_platform_relationship_id: null
broker_mga_relationship_id: null
```

### 14.2 Existing Broker-Under-MGA Records

All existing records with:

```
master_general_agent_id = MGA_ID
broker_agency_id = BROKER_ID
```

Must be assigned:

```
channel_type: "mga_affiliated_broker"
distribution_channel_context_id: <new context>
master_general_agent_id: MGA_ID
broker_agency_id: BROKER_ID
broker_platform_relationship_id: <FK to new BrokerPlatformRelationship>
broker_mga_relationship_id: <FK to new BrokerMGARelationship>
```

And a `BrokerMGARelationship` record must be created linking the broker to the MGA.

### 14.3 Existing Platform Direct Records

All existing records with:

```
master_general_agent_id = null
broker_agency_id = null
```

Must be assigned:

```
channel_type: "platform_direct"
distribution_channel_context_id: <new context>
master_general_agent_id: null
broker_agency_id: null
broker_platform_relationship_id: null
broker_mga_relationship_id: null
```

---

## 15. Required Indexes

These indexes are mandatory for performance and scope enforcement:

```sql
-- Tenant-based access
CREATE INDEX idx_tenant_id ON [core_tables] (tenant_id);
CREATE INDEX idx_tenant_distribution ON [core_tables] (tenant_id, distribution_channel_context_id);

-- MGA scope
CREATE INDEX idx_master_general_agent_id ON [core_tables] (master_general_agent_id) WHERE master_general_agent_id IS NOT NULL;
CREATE INDEX idx_tenant_mga ON [core_tables] (tenant_id, master_general_agent_id) WHERE master_general_agent_id IS NOT NULL;

-- Broker scope
CREATE INDEX idx_broker_agency_id ON [core_tables] (broker_agency_id) WHERE broker_agency_id IS NOT NULL;
CREATE INDEX idx_tenant_broker ON [core_tables] (tenant_id, broker_agency_id) WHERE broker_agency_id IS NOT NULL;

-- Relationship identifiers
CREATE INDEX idx_broker_platform_relationship_id ON [core_tables] (broker_platform_relationship_id) WHERE broker_platform_relationship_id IS NOT NULL;
CREATE INDEX idx_broker_mga_relationship_id ON [core_tables] (broker_mga_relationship_id) WHERE broker_mga_relationship_id IS NOT NULL;

-- Business records
CREATE INDEX idx_employer_id ON [core_tables] (employer_id);
CREATE INDEX idx_case_id ON [core_tables] (case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_quote_scenario_id ON [core_tables] (quote_scenario_id) WHERE quote_scenario_id IS NOT NULL;

-- Status and workflow
CREATE INDEX idx_status ON [core_tables] (status);
CREATE INDEX idx_channel_status ON [core_tables] (channel_type, status);

-- Audit
CREATE INDEX idx_created_at ON [core_tables] (created_at);
CREATE INDEX idx_audit_trace_id ON [core_tables] (audit_trace_id) WHERE audit_trace_id IS NOT NULL;
```

---

## 16. Required Security Rules

### Rule 16.1: No Raw Frontend Entity Reads

- Frontend must not call `base44.entities.Thing.list()` directly
- All entity reads must go through backend contracts
- Contracts enforce scope and permission rules
- Contracts return masked 404 on scope violations

### Rule 16.2: All Protected Actions Must Go Through Contracts

Protected actions:
- create
- update
- archive
- assign
- reassign
- cancel
- take_over
- approve
- request_review
- start_setup

### Rule 16.3: Tenant Scope Enforced Server-Side

- Every request must include `tenant_id`
- Backend validates user's `tenant_id` claim
- Mismatched tenant claim is rejected with 401
- All record operations filtered by `tenant_id`

### Rule 16.4: Distribution Channel Scope Enforced Server-Side

- Every record includes `channel_type` and `distribution_channel_context_id`
- User's scope resolved server-side before query
- Records outside user's channel scope hidden (masked 404)
- Cannot override channel scope from frontend

### Rule 16.5: Broker Scope Enforced Server-Side

- Broker user's `broker_agency_id` claim validated server-side
- All queries filtered by `broker_agency_id`
- Broker cannot see records outside their agency (masked 404)
- Unless explicit `BrokerScopeAccessGrant` exists

### Rule 16.6: MGA Scope Enforced Server-Side

- MGA user's `master_general_agent_id` claim validated server-side
- Queries filtered by `master_general_agent_id` and related records
- MGA cannot see standalone broker direct book (masked 404)
- Unless explicit `BrokerScopeAccessGrant` exists

### Rule 16.7: Sensitive Data Redacted

- Employee/census data tokenized or redacted in cross-organizational queries
- PII exposed only to authorized users
- Financial data (rates, premiums, payroll) redacted from cross-scope views

### Rule 16.8: Documents via Signed URLs

- Document access always through signed URLs
- URLs expire after 1 hour (configurable)
- Scope validated on URL generation
- Frontend never receives raw file paths

### Rule 16.9: Payroll & EDI Credentials Never Exposed to Frontend

- Payroll gateway credentials stored server-side only
- EDI transmission credentials never sent to frontend
- Payroll/EDI operations always initiated from backend
- Frontend receives only status, not credentials

### Rule 16.10: Audit Logging for All Material Actions

- Every create/update/archive/assign/approve/reassign/take_over/activate logs audit event
- Audit event includes:
  - Actor user_id and role
  - Action type
  - Record type and ID
  - Old values (for updates)
  - New values (for updates)
  - Reason (if provided)
  - Timestamp
  - Scope context (tenant, MGA, broker, employer)
  - `audit_trace_id` for correlation

### Rule 16.11: Scope Violations Return Masked 404

```
Broker A requests: GET /api/cases/case_999 (belongs to Broker B)
→ 404 Not Found (record appears not to exist)
NOT: 403 Forbidden (reveals record exists)
```

### Rule 16.12: Permission Violations Return 403

```
Broker A requests: GET /api/cases/case_123 (belongs to Broker A, but broker lacks read permission)
→ 403 Forbidden (user doesn't have permission)
NOT: 404 (would be confusing within valid scope)
```

---

## 17. Relationship to Gate 7A

This framework must be **incorporated into Gate 7A** before Gate 7A implementation planning.

### Rule 17.1: Gate 7A Must Not Assume MGA Parent

Gate 7A implementation must not assume:

```javascript
broker.master_general_agent_id // required
```

Instead, Gate 7A must support:

```javascript
broker.master_general_agent_id = null // standalone
broker.master_general_agent_id = MGA_ID // affiliated
```

### Rule 17.2: Gate 7A Benefits Admin Bridge

Gate 7A Benefits Admin bridge design must support all distribution channels:

- `platform_direct`
- `standalone_broker`
- `mga_direct`
- `mga_affiliated_broker`
- `hybrid_broker_direct`
- `hybrid_broker_mga`

### Rule 17.3: Phase 0 Gate 7A Scope

Gate 7A Phase 0 (in framework terms, Phase 5 Benefits Admin Bridge Phase 0) must:

- Create `QuoteToBenefitsPackage` with broker lineage
- Create `BenefitsImplementationCase` with broker lineage
- Preserve channel context from sold quote
- NOT activate full Benefits Admin setup
- NOT implement enrollment, payroll, EDI, or go-live

---

## 18. Framework Status

**Status:** FRAMEWORK_SAVED  
**Runtime Implementation Status:** INACTIVE  
**Code Implementation Status:** NOT_STARTED  

This document is a formal specification and governance framework. It does not constitute runtime code, entity definitions, schema changes, or UI implementation.

**Implementation must begin with Phase 0 (Correct Core Model)** per the phase model in Section 10.

---

## 19. Approval and Signature

**Framework Created:** 2026-05-12  
**Framework Author:** Base44 Platform Team  
**Framework Status:** AWAITING_IMPLEMENTATION_AUTHORIZATION  

This framework supersedes the requirement that all brokers must sit under MGAs.

**Next Step:** Await authorization to begin Phase 0 (Correct Core Model) implementation.