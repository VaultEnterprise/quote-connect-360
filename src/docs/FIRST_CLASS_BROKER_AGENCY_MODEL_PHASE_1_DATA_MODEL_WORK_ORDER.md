# First-Class Broker Agency Model
## Phase 1: Data Model Completion — Implementation Work Order

**Status:** AUTHORIZED FOR PLANNING / READY FOR OPERATOR APPROVAL TO IMPLEMENT

**Date Created:** 2026-05-14

**Controlling Documents:**
- `FIRST_CLASS_BROKER_AGENCY_MODEL_GAP_TO_IMPLEMENTATION_WORK_ORDER.md`
- `FIRST_CLASS_BROKER_AGENCY_MODEL_PHASED_EXECUTION_PLAN.md`

**Phased Plan Reference:** Phase 1 of 8 — Data Model Completion

---

## 1. Objective

Stamp all major business records with distribution-channel context and ownership fields. Establish single source of truth for record ownership, visibility scope, and audit lineage. Enable downstream phases (2–8) to enforce RLS, broker scoping, and MGA boundaries.

**Post-Phase 1, all major records will be queryable by channel context, ownership, and visibility scope.**

---

## 2. In-Scope Entities

The following entities **MUST** be modified to include DistributionChannelContext stamping fields:

### Core Business Records (Employer Context)
1. **Employer** / **EmployerGroup** — employer identity records
2. **EmployerCase** / **BenefitCase** / **Case** — case records tied to employer (locate primary case entity)
3. **CensusVersion** — census file versions per case
4. **QuoteScenario** — quote scenarios per case
5. **Proposal** — proposals per quote scenario
6. **EnrollmentWindow** — enrollment windows per case
7. **RenewalCycle** — renewal cycles per employer

### Benefits Admin Records (to be stamped)
8. **QuoteToBenefitsPackage** (if exists) — handoff record
9. **BenefitsImplementationCase** (if exists, or equivalent BA case entity) — Benefits Admin cases
10. **EmployerBenefitsProfile** (if exists) — benefits-specific employer data
11. **BenefitDocument** (if exists, or Document subtype) — benefits-specific documents

### Cross-Cutting Records
12. **Task** — tasks tied to cases/employers
13. **Document** — documents tied to cases/employers (census, proposals, correspondence, compliance)
14. **Notification** — notifications tied to case/employer activities
15. **AuditEvent** — audit trail of changes to stamped records

### New Entity (To Create)
16. **BrokerEmployerRelationship** — relationship between broker and employer (for scoping broker's access to employer)

---

## 3. Out-of-Scope for Phase 1

The following items **MUST NOT** be touched in Phase 1:

- ❌ `/broker` workspace routes
- ❌ Broker dashboard pages
- ❌ Broker onboarding UI or workflow
- ❌ Broker approval workflow functions
- ❌ MGA broker affiliation UI
- ❌ Benefits Admin runtime bridge or handoff workflow
- ❌ Quote creation workflow logic
- ❌ Proposal creation workflow logic
- ❌ Renewal workflow logic
- ❌ Document upload runtime behavior
- ❌ Permission checking or RLS enforcement
- ❌ Feature flag activation
- ❌ Route protection or authentication logic
- ❌ Services, contracts, or permission resolvers
- ❌ Any changes to Gates 6I-B, 6J-B, 6J-C, 6L-B, 7A-*

---

## 4. Exact Fields to Add by Entity

### Field Set 1: Distribution Channel Context & Ownership (Required on all 16 entities)

```
distribution_channel_context_id: string (FK to DistributionChannelContext)
  — Identifies which distribution channel owns this record
  — Non-nullable after migration validation

master_general_agent_id: string (FK to MasterGeneralAgent)
  — MGA scope; nullable during migration staging
  — Required after Phase 4 validation in full production
  — Default: null

broker_agency_id: string (FK to BrokerAgencyProfile)
  — Broker scope; set only for standalone_broker or mga_affiliated_broker channel types
  — Nullable; only required if distribution_channel_context_id.channel_type != mga_only

owner_org_type: enum (required)
  — Possible values: 'mga', 'broker_standalone', 'broker_mga_affiliated', 'platform'
  — Determines which organization owns this record
  — Used for scoping access (RLS in Phase 3)

owner_org_id: string (required)
  — Foreign key to owning organization (MasterGeneralAgent.id or BrokerAgencyProfile.id)
  — Must match owner_org_type

servicing_org_type: enum (nullable)
  — Possible values: 'mga', 'broker', 'platform'
  — Secondary organization providing service (e.g., broker servicing for MGA)
  — Optional; used for audit trail only

servicing_org_id: string (nullable)
  — Foreign key to servicing organization
  — Only set if servicing_org_type is not null

supervising_org_type: enum (nullable)
  — Possible values: 'mga', 'platform'
  — Tertiary organization overseeing the record (e.g., MGA supervising broker)
  — Optional; used for audit trail only

supervising_org_id: string (nullable)
  — Foreign key to supervising organization
  — Only set if supervising_org_type is not null

visibility_scope: enum (required)
  — Possible values: 'private', 'org_only', 'org_and_service', 'platform'
  — Determines who can query this record
  — private: only owner
  — org_only: owner + org members
  — org_and_service: owner + servicing org + org members
  — platform: platform admins only

created_by_user_id: string (required)
  — Email or user ID of user who created the record
  — Audit trail only; not used for access control

created_by_role: string (required)
  — Role of creator at time of creation (e.g., 'broker', 'mga_admin', 'platform_admin')
  — Audit trail only; captures role at creation time

audit_trace_id: string (nullable)
  — Correlation ID linking this record to a migration batch or audit event
  — Phase 4 migration: set to migration_batch_id
  — Non-migration: null or auto-generated correlation ID

updated_at: string (datetime, auto-managed)
  — Timestamp of last update (auto-updated by ORM/database trigger)
  — Used to track when record was stamped

stamped_at: string (datetime, auto-managed)
  — Timestamp when distribution-channel context was first applied
  — Allows distinguishing pre-stamped vs. post-stamped records
```

### Field Set 2: Per-Entity Customizations

#### **Employer / EmployerGroup**
Add all Field Set 1 fields above.

**Additional fields:**
- None.

**Nullability rules:**
- `distribution_channel_context_id`: NOT NULL
- `master_general_agent_id`: NULLABLE (null for standalone brokers; set for MGA-only or MGA-affiliated)
- `broker_agency_id`: NULLABLE (null for MGA records; set for broker records)
- `owner_org_type`: NOT NULL
- `owner_org_id`: NOT NULL
- All visibility/audit fields: NOT NULL

#### **EmployerCase / BenefitCase / Case**
Add all Field Set 1 fields above.

**Additional fields:**
- `employer_group_id` (FK) — foreign key to parent EmployerGroup (if not already present)
- Backfill rule: inherit channel context from parent Employer

**Nullability rules:**
- Same as Employer

#### **CensusVersion**
Add all Field Set 1 fields above.

**Additional fields:**
- `case_id` (FK) — foreign key to parent Case
- Backfill rule: inherit channel context from parent Case

**Nullability rules:**
- Same as Employer

#### **QuoteScenario**
Add all Field Set 1 fields above.

**Additional fields:**
- `case_id` (FK) — foreign key to parent Case (if not already present)
- Backfill rule: inherit channel context from parent Case

**Nullability rules:**
- Same as Employer

#### **Proposal**
Add all Field Set 1 fields above.

**Additional fields:**
- `case_id` (FK) — foreign key to parent Case
- `quote_scenario_id` (FK) — foreign key to parent QuoteScenario
- Backfill rule: inherit channel context from parent Case

**Nullability rules:**
- Same as Employer

#### **EnrollmentWindow**
Add all Field Set 1 fields above.

**Additional fields:**
- `case_id` (FK) — foreign key to parent Case
- Backfill rule: inherit channel context from parent Case

**Nullability rules:**
- Same as Employer

#### **RenewalCycle**
Add all Field Set 1 fields above.

**Additional fields:**
- `employer_group_id` (FK) — foreign key to parent EmployerGroup
- Backfill rule: inherit channel context from parent EmployerGroup

**Nullability rules:**
- Same as Employer

#### **QuoteToBenefitsPackage** (if exists)
Add all Field Set 1 fields above.

**Additional fields:**
- `case_id` (FK) — foreign key to parent Case
- `proposal_id` (FK) — foreign key to parent Proposal
- Backfill rule: inherit channel context from parent Case

**Nullability rules:**
- Same as Employer

#### **BenefitsImplementationCase** (if exists)
Add all Field Set 1 fields above.

**Additional fields:**
- `employer_group_id` (FK) — foreign key to parent EmployerGroup
- Backfill rule: inherit channel context from parent EmployerGroup

**Nullability rules:**
- Same as Employer

#### **EmployerBenefitsProfile** (if exists)
Add all Field Set 1 fields above.

**Additional fields:**
- `employer_group_id` (FK) — foreign key to parent EmployerGroup
- Backfill rule: inherit channel context from parent EmployerGroup

**Nullability rules:**
- Same as Employer

#### **BenefitDocument** or **Document** (if subtyped)
Add all Field Set 1 fields above.

**Additional fields:**
- `case_id` (FK) — may already be present
- `employer_group_id` (FK) — may already be present
- Backfill rule: inherit from parent Case or EmployerGroup (determine based on document context)

**Nullability rules:**
- Same as Employer

#### **Task**
Add all Field Set 1 fields above.

**Additional fields:**
- `case_id` (FK) — foreign key to parent Case (if not already present)
- Backfill rule: inherit channel context from parent Case

**Nullability rules:**
- Same as Employer

#### **Notification**
Add all Field Set 1 fields above.

**Additional fields:**
- `related_entity_id` (string) — ID of the entity being notified about
- `related_entity_type` (string) — type of related entity (Case, Employer, etc.)
- Backfill rule: inherit from related entity, or use platform default if unknown

**Nullability rules:**
- Same as Employer (notifications should always be scoped)

#### **AuditEvent**
Add all Field Set 1 fields above.

**Additional fields:**
- `related_entity_id` (string) — ID of the entity being audited
- `related_entity_type` (string) — type of related entity
- `changed_fields` (array of strings) — list of fields that changed
- Backfill rule: inherit from related entity, or use platform default

**Nullability rules:**
- Same as Employer

### BrokerEmployerRelationship (New Entity to Create)

**Purpose:** Define broker access to employer records. Enables brokers to see only employers they have a relationship with.

**Required fields:**

```json
{
  "name": "BrokerEmployerRelationship",
  "type": "object",
  "properties": {
    "distribution_channel_context_id": {
      "type": "string",
      "description": "FK to DistributionChannelContext"
    },
    "broker_agency_id": {
      "type": "string",
      "description": "FK to BrokerAgencyProfile (the broker)"
    },
    "employer_group_id": {
      "type": "string",
      "description": "FK to EmployerGroup (the employer)"
    },
    "relationship_type": {
      "type": "string",
      "enum": ["direct_broker", "mga_affiliated_broker"],
      "description": "Type of broker relationship"
    },
    "mga_agency_id": {
      "type": "string",
      "nullable": true,
      "description": "If mga_affiliated_broker, the MGA broker works with"
    },
    "status": {
      "type": "string",
      "enum": ["active", "suspended", "terminated"],
      "default": "active"
    },
    "created_at": {
      "type": "string",
      "format": "date-time"
    },
    "terminated_at": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "visibility_scope": {
      "type": "string",
      "enum": ["private", "org_only", "org_and_service", "platform"]
    },
    "owner_org_type": {
      "type": "string",
      "enum": ["broker_standalone", "broker_mga_affiliated"]
    },
    "owner_org_id": {
      "type": "string",
      "description": "FK to broker_agency_id (broker owns this relationship)"
    }
  },
  "required": [
    "distribution_channel_context_id",
    "broker_agency_id",
    "employer_group_id",
    "relationship_type",
    "status",
    "visibility_scope",
    "owner_org_type",
    "owner_org_id"
  ]
}
```

---

## 5. Required Enum Values

### `owner_org_type` Enum
```
- 'mga': Owned by Master General Agent
- 'broker_standalone': Owned by standalone broker
- 'broker_mga_affiliated': Owned by MGA-affiliated broker
- 'platform': Owned by platform (admin-created records only)
```

### `visibility_scope` Enum
```
- 'private': Only the owning organization can see this record
- 'org_only': Owning organization + members of owning org can see
- 'org_and_service': Owning org + servicing org + their members can see
- 'platform': Platform admins only; hidden from brokers/MGAs
```

### `servicing_org_type` Enum
```
- 'mga': A Master General Agent is servicing
- 'broker': A Broker is servicing
- 'platform': Platform is servicing (null = no servicing org)
```

### `supervising_org_type` Enum
```
- 'mga': A Master General Agent is supervising
- 'platform': Platform is supervising (null = no supervising org)
```

---

## 6. Nullability Rules (Post-Migration)

**All entities must satisfy:**

| Field | NOT NULL | NULLABLE | Reason |
|---|---|---|---|
| `distribution_channel_context_id` | ✅ | ❌ | Every record must have a channel context |
| `master_general_agent_id` | ❌ | ✅ | Nullable for standalone broker records; required for MGA records |
| `broker_agency_id` | ❌ | ✅ | Nullable for MGA records; required for broker records |
| `owner_org_type` | ✅ | ❌ | Every record must have an owner type |
| `owner_org_id` | ✅ | ❌ | Every record must identify the owning organization |
| `servicing_org_type` | ❌ | ✅ | Optional; only set if a secondary org is servicing |
| `servicing_org_id` | ❌ | ✅ | Only set if servicing_org_type is not null |
| `supervising_org_type` | ❌ | ✅ | Optional; only set if an org is supervising |
| `supervising_org_id` | ❌ | ✅ | Only set if supervising_org_type is not null |
| `visibility_scope` | ✅ | ❌ | Every record must have a visibility scope |
| `created_by_user_id` | ✅ | ❌ | Audit trail requirement |
| `created_by_role` | ✅ | ❌ | Audit trail requirement |
| `audit_trace_id` | ❌ | ✅ | Optional; set by migration or null for manually-created records |
| `updated_at` | ✅ | ❌ | Auto-managed by ORM/trigger |
| `stamped_at` | ✅ | ❌ | Set during migration or on first creation |

**Validation rule:** If `owner_org_type = 'mga'`, then `master_general_agent_id` must NOT be null. If `owner_org_type != 'mga'`, then `master_general_agent_id` may be null.

---

## 7. Backward Compatibility Rules

### Rule 1: Existing Queries Must Still Work
- Old queries that do NOT filter by channel context should still return results
- Phase 2+ will add `WHERE distribution_channel_context_id = :context_id` filters
- Until Phase 2, all queries can run without channel context filters (permissive mode)

### Rule 2: Existing Records Must Be Backfilled
- All existing records before migration must have channel context stamped
- Orphaned records (no clear owner) go to platform default
- Migration audit trail must record which records were stamped and by which batch

### Rule 3: New Records Must Be Stamped at Creation
- After migration, any new record creation must include channel context fields
- Backend functions (Phase 2+) enforce stamping at creation time
- Until Phase 2 activation, field values can be provided by caller or backfilled to default

### Rule 4: No Breaking Changes to Existing APIs
- All new fields are added as nullable by default (unless required by nullability rules above)
- Existing endpoints that return records continue to return records (no filtering yet)
- New fields included in response payloads (not breaking)

---

## 8. Migration / Backfill Strategy

### Step 1: Validate Current State (No Changes)
- [ ] Identify all records per entity that exist pre-migration
- [ ] Count records per entity (baseline for reconciliation)
- [ ] Identify orphaned records (no clear parent/owner)
- [ ] Generate pre-migration audit report

### Step 2: Schema Changes (Offline or Schema Upgrade)
- [ ] Add all 13 stamping fields to each entity schema (in entities/*.json files)
- [ ] Set defaults: `owner_org_type = 'platform'`, `visibility_scope = 'platform'`, `master_general_agent_id = null`, etc.
- [ ] Create indexes (see Section 9 below)
- [ ] Test schema changes on staging database
- [ ] Document any ORM layer changes (if using SQLAlchemy, etc.)

### Step 3: Backfill Existing Records (Transactional)
- [ ] Write migration script that:
  1. Reads all existing records
  2. Determines owner_org_type, owner_org_id, and distribution_channel_context_id from parent record or defaults
  3. Sets visibility_scope based on owner_org_type
  4. Sets audit_trace_id to migration_batch_id for tracking
  5. Sets stamped_at to current timestamp
  6. Updates record in database

- [ ] Run migration in transaction: BEGIN → backfill → validate → COMMIT (or ROLLBACK)
- [ ] Per-entity backfill order (respect foreign key dependencies):
  1. DistributionChannelContext (must exist first)
  2. Employer / EmployerGroup
  3. EmployerCase / BenefitCase
  4. CensusVersion, QuoteScenario, Proposal, EnrollmentWindow, RenewalCycle (in any order, all depend on case)
  5. Task, Document, Notification, AuditEvent (depend on case/employer)
  6. BrokerEmployerRelationship (references broker_agency_id and employer_group_id)

### Step 4: Post-Migration Validation (Offline)
- [ ] Verify all records now have channel context fields filled
- [ ] Count records per entity; compare to pre-migration baseline (must match 100%)
- [ ] Spot-check 10–20 records per entity: validate owner_org_type/owner_org_id make sense
- [ ] Check for any NULL values in NOT NULL fields (must be zero)
- [ ] Verify no data type errors or schema mismatches
- [ ] Run validation queries (see Section 10 below)
- [ ] Generate post-migration audit report

### Step 5: Index Creation (Pre or Post Backfill)
- [ ] Indexes created BEFORE backfill if schema supports pre-population
- [ ] If indexes cause performance issues during backfill, create post-backfill
- [ ] See Section 9 for full index strategy

### Step 6: Rollback Preparation
- [ ] Test rollback script (reverse migration) on a copy of staging data
- [ ] Confirm rollback completes in < 30 minutes
- [ ] Document rollback decision tree (if error X, do Y)

### Migration Script Pseudocode
```sql
BEGIN TRANSACTION;

-- Ensure DistributionChannelContext exists
INSERT INTO distribution_channel_context (id, channel_type, channel_name, ...)
VALUES ('default-platform', 'platform', 'Platform Default', ...)
ON CONFLICT DO NOTHING;

-- Phase 1: Stamp Employer records
UPDATE employer_group 
SET 
  distribution_channel_context_id = 'default-platform',
  owner_org_type = 'platform',
  owner_org_id = 'default-platform',
  visibility_scope = 'platform',
  created_by_user_id = COALESCE(created_by_user_id, 'system'),
  created_by_role = 'platform_admin',
  audit_trace_id = 'migration-batch-001',
  stamped_at = NOW()
WHERE stamped_at IS NULL;

-- Phase 2: Stamp EmployerCase records (inherit from parent Employer)
UPDATE employer_case ec
SET
  distribution_channel_context_id = eg.distribution_channel_context_id,
  owner_org_type = eg.owner_org_type,
  owner_org_id = eg.owner_org_id,
  visibility_scope = eg.visibility_scope,
  master_general_agent_id = eg.master_general_agent_id,
  broker_agency_id = eg.broker_agency_id,
  created_by_user_id = COALESCE(ec.created_by_user_id, 'system'),
  created_by_role = COALESCE(ec.created_by_role, 'platform_admin'),
  audit_trace_id = 'migration-batch-001',
  stamped_at = NOW()
FROM employer_group eg
WHERE ec.employer_group_id = eg.id
  AND ec.stamped_at IS NULL;

-- ... (repeat for other entities)

-- Validate: Count records with NULL fields (should be 0)
SELECT 
  'employer_group' as entity,
  COUNT(*) as records_with_null_fields
FROM employer_group
WHERE distribution_channel_context_id IS NULL
  OR owner_org_type IS NULL
  OR owner_org_id IS NULL
UNION ALL
SELECT 
  'employer_case' as entity,
  COUNT(*) as records_with_null_fields
FROM employer_case
WHERE distribution_channel_context_id IS NULL
  OR owner_org_type IS NULL
  OR owner_org_id IS NULL
-- (repeat for all entities)
;

-- If validation passes (all counts = 0), COMMIT; else ROLLBACK
COMMIT;
```

---

## 9. Indexing Strategy

### Phase 1 Indexes (Must Be Created)
Create these indexes to support Phase 2+ scoping queries:

**On each stamped entity:**

```sql
-- Scope query: "Get all records in this channel context"
CREATE INDEX idx_{entity}_distribution_channel ON {entity}(distribution_channel_context_id);

-- Owner query: "Get all records owned by this org"
CREATE INDEX idx_{entity}_owner_org ON {entity}(owner_org_type, owner_org_id);

-- Composite: "Get all records in channel owned by org"
CREATE INDEX idx_{entity}_channel_owner ON {entity}(distribution_channel_context_id, owner_org_type, owner_org_id);

-- Broker query: "Get all records for this broker"
CREATE INDEX idx_{entity}_broker_agency ON {entity}(broker_agency_id) WHERE broker_agency_id IS NOT NULL;

-- MGA query: "Get all records for this MGA"
CREATE INDEX idx_{entity}_mga ON {entity}(master_general_agent_id) WHERE master_general_agent_id IS NOT NULL;

-- Audit: "Get all records stamped in this batch"
CREATE INDEX idx_{entity}_audit_trace ON {entity}(audit_trace_id) WHERE audit_trace_id IS NOT NULL;
```

**Example for Employer:**
```sql
CREATE INDEX idx_employer_group_distribution_channel ON employer_group(distribution_channel_context_id);
CREATE INDEX idx_employer_group_owner_org ON employer_group(owner_org_type, owner_org_id);
CREATE INDEX idx_employer_group_channel_owner ON employer_group(distribution_channel_context_id, owner_org_type, owner_org_id);
CREATE INDEX idx_employer_group_broker_agency ON employer_group(broker_agency_id) WHERE broker_agency_id IS NOT NULL;
CREATE INDEX idx_employer_group_mga ON employer_group(master_general_agent_id) WHERE master_general_agent_id IS NOT NULL;
```

**Rationale:**
- Phase 2 backend contracts will query by these fields
- Phase 3 RLS will filter by channel/owner/visibility_scope
- Indexes reduce query time from O(n) to O(log n)
- Partial indexes (WHERE clauses) save index space for nullable fields

---

## 10. Validation Rules

### Validation Rule Set 1: Field Presence
**After migration, all records must satisfy:**

For every entity record:
- [ ] `distribution_channel_context_id` is NOT NULL
- [ ] `owner_org_type` is NOT NULL and in enum {'mga', 'broker_standalone', 'broker_mga_affiliated', 'platform'}
- [ ] `owner_org_id` is NOT NULL and refers to a valid organization
- [ ] `visibility_scope` is NOT NULL and in enum {'private', 'org_only', 'org_and_service', 'platform'}
- [ ] `created_by_user_id` is NOT NULL
- [ ] `created_by_role` is NOT NULL
- [ ] `stamped_at` is NOT NULL

### Validation Rule Set 2: Cross-Field Consistency
**After migration:**

For every record:
- [ ] If `owner_org_type = 'mga'`, then `master_general_agent_id` must NOT be NULL
- [ ] If `owner_org_type = 'broker_standalone'` or `'broker_mga_affiliated'`, then `broker_agency_id` must NOT be NULL
- [ ] If `servicing_org_type` IS NOT NULL, then `servicing_org_id` must NOT be NULL
- [ ] If `servicing_org_id` IS NOT NULL, then `servicing_org_type` must NOT be NULL
- [ ] If `supervising_org_type` IS NOT NULL, then `supervising_org_id` must NOT be NULL
- [ ] If `supervising_org_id` IS NOT NULL, then `supervising_org_type` must NOT be NULL
- [ ] `owner_org_id` must NOT equal `servicing_org_id` (cannot own and service self)
- [ ] `owner_org_id` must NOT equal `supervising_org_id` (cannot own and supervise self)

### Validation Rule Set 3: Referential Integrity
**After migration:**

For every stamped entity:
- [ ] `distribution_channel_context_id` refers to a valid DistributionChannelContext record
- [ ] If `master_general_agent_id` is NOT NULL, refers to a valid MasterGeneralAgent record
- [ ] If `broker_agency_id` is NOT NULL, refers to a valid BrokerAgencyProfile record
- [ ] If `servicing_org_id` is NOT NULL, refers to a valid organization (lookup by type)
- [ ] If `supervising_org_id` is NOT NULL, refers to a valid organization (lookup by type)

### Validation Query Set (SQL)
```sql
-- Validation 1: Check for NULL required fields
SELECT 
  'Employer' as entity,
  COUNT(*) as null_count,
  STRING_AGG(DISTINCT CASE 
    WHEN distribution_channel_context_id IS NULL THEN 'distribution_channel_context_id'
    WHEN owner_org_type IS NULL THEN 'owner_org_type'
    WHEN owner_org_id IS NULL THEN 'owner_org_id'
    WHEN visibility_scope IS NULL THEN 'visibility_scope'
    WHEN created_by_user_id IS NULL THEN 'created_by_user_id'
    WHEN stamped_at IS NULL THEN 'stamped_at'
  END, ', ') as null_fields
FROM employer_group
WHERE distribution_channel_context_id IS NULL
  OR owner_org_type IS NULL
  OR owner_org_id IS NULL
  OR visibility_scope IS NULL
  OR created_by_user_id IS NULL
  OR stamped_at IS NULL;
-- Should return 0 rows

-- Validation 2: Check cross-field consistency
SELECT 
  'Consistency' as validation_type,
  COUNT(*) as violations
FROM employer_group
WHERE (
  (owner_org_type = 'mga' AND master_general_agent_id IS NULL)
  OR (owner_org_type IN ('broker_standalone', 'broker_mga_affiliated') AND broker_agency_id IS NULL)
  OR (servicing_org_type IS NOT NULL AND servicing_org_id IS NULL)
  OR (servicing_org_id IS NOT NULL AND servicing_org_type IS NULL)
  OR (owner_org_id = servicing_org_id)
);
-- Should return 0 rows

-- Validation 3: Check referential integrity
SELECT 
  'FK Integrity' as validation_type,
  COUNT(*) as missing_fk
FROM employer_group eg
LEFT JOIN distribution_channel_context dcc ON eg.distribution_channel_context_id = dcc.id
WHERE eg.distribution_channel_context_id IS NOT NULL
  AND dcc.id IS NULL;
-- Should return 0 rows
-- (repeat for other FK relationships)
```

---

## 11. Test Plan

### Unit Test Category 1: Schema Validation (5–8 tests)

```
Test 1.1: All entities have distribution_channel_context_id field
  - Assert: entity schema includes distribution_channel_context_id: string
  - Applies to: all 16 entities

Test 1.2: All required fields are present
  - Assert: entity schema includes owner_org_type, owner_org_id, visibility_scope, created_by_user_id, stamped_at
  - Applies to: all 16 entities

Test 1.3: Enum values are valid
  - Assert: owner_org_type enum = {mga, broker_standalone, broker_mga_affiliated, platform}
  - Assert: visibility_scope enum = {private, org_only, org_and_service, platform}
  - Applies to: all 16 entities

Test 1.4: Nullable fields are marked correctly
  - Assert: master_general_agent_id is nullable
  - Assert: broker_agency_id is nullable
  - Assert: servicing_org_type is nullable
  - Assert: distribution_channel_context_id is NOT nullable
  - Applies to: all 16 entities

Test 1.5: BrokerEmployerRelationship schema is valid
  - Assert: schema created correctly
  - Assert: all required fields present
  - Assert: enums correct
```

### Integration Test Category 2: Backfill Logic (10–15 tests)

```
Test 2.1: Employer records backfilled correctly
  - Setup: Create sample Employer records
  - Action: Run migration script
  - Assert: All records have distribution_channel_context_id = 'default-platform'
  - Assert: All records have owner_org_type = 'platform'
  - Assert: No NULL values in required fields

Test 2.2: Child records inherit from parent
  - Setup: Create Employer + EmployerCase
  - Action: Run migration script
  - Assert: EmployerCase has same distribution_channel_context_id as parent Employer
  - Assert: EmployerCase has same owner_org_id as parent Employer

Test 2.3: Orphaned records get default context
  - Setup: Create record with no parent
  - Action: Run migration script
  - Assert: Record gets distribution_channel_context_id = 'default-platform'

Test 2.4: Audit trail is recorded
  - Setup: Create sample records
  - Action: Run migration script with batch ID 'test-batch-001'
  - Assert: All migrated records have audit_trace_id = 'test-batch-001'

Test 2.5: Rollback preserves pre-migration state
  - Setup: Create sample records, run migration, then rollback
  - Assert: Records no longer have stamping fields (or values reset to NULL)

Test 2.6: Migration is idempotent
  - Setup: Create sample records, run migration twice
  - Assert: Second run does not double-stamp or duplicate records

Test 2.7: Foreign key dependencies respected
  - Setup: Create nested structure (Employer → Case → Census)
  - Action: Run migration
  - Assert: All levels stamped correctly in order
  - Assert: No foreign key constraint violations
```

### Validation Test Category 3: Post-Migration Validation (8–12 tests)

```
Test 3.1: All required fields populated
  - Assert: SELECT COUNT(*) FROM entity WHERE field IS NULL returns 0
  - Applies to: all required fields across all 16 entities

Test 3.2: Cross-field consistency rules enforced
  - Assert: No record has owner_org_type='mga' AND master_general_agent_id IS NULL
  - Assert: No record has owner_org_id = servicing_org_id

Test 3.3: Referential integrity maintained
  - Assert: All distribution_channel_context_id values refer to valid records
  - Assert: All master_general_agent_id values (non-NULL) refer to valid records

Test 3.4: Index queries perform well
  - Assert: Query by distribution_channel_context_id uses index
  - Assert: Query by owner_org returns < 100ms on 1M record table

Test 3.5: Backward compatibility preserved
  - Assert: Old queries without channel context filters still return results
  - Assert: Existing API endpoints don't break

Test 3.6: Record counts match
  - Assert: pre-migration record count = post-migration record count (per entity)
```

### Performance Test Category 4: Indexing (3–5 tests)

```
Test 4.1: Index creation completes in acceptable time
  - Assert: Index creation on 1M record table < 5 minutes

Test 4.2: Query performance with indexes
  - Assert: SELECT by distribution_channel_context_id on 1M records < 100ms
  - Assert: SELECT by owner_org on 1M records < 100ms

Test 4.3: Index space overhead acceptable
  - Assert: Total index size < 30% of table size
```

### **Total Expected Test Count: 30–50 tests**

---

## 12. Rollback Plan

### Rollback Trigger Conditions
Rollback is initiated if any of the following occur:

1. **Pre-migration validation fails:**
   - Pre-migration record count does not match database
   - Any entity has unsatisfiable migration logic

2. **Migration execution fails:**
   - Migration script errors mid-execution
   - Database lock timeout
   - Out of disk space during backfill

3. **Post-migration validation fails:**
   - > 0 records with NULL required fields
   - Referential integrity constraint violated
   - Record count mismatch (pre ≠ post)

4. **Production monitoring alerts (Phase 1 + after):**
   - API latency > 500ms on stamped-entity queries
   - Error rate > 1% on record reads
   - Database CPU > 80% sustained

### Rollback Steps

**Step 1: Decision (< 15 min)**
- [ ] On-call operator receives alert
- [ ] Determines if rollback is necessary
- [ ] Documents decision in incident log
- [ ] Notifies stakeholders

**Step 2: Prepare Rollback (< 15 min)**
- [ ] Verify rollback script tested and ready
- [ ] Ensure backup/snapshot available
- [ ] Confirm downtime window
- [ ] Alert all users

**Step 3: Execute Rollback (< 30 min)**
- [ ] Option A: Reverse migration script (preferred, < 10 min)
  ```sql
  BEGIN TRANSACTION;
  UPDATE employer_group SET 
    distribution_channel_context_id = NULL,
    owner_org_type = NULL,
    owner_org_id = NULL,
    visibility_scope = NULL,
    created_by_user_id = NULL,
    created_by_role = NULL,
    stamped_at = NULL
  WHERE audit_trace_id = 'migration-batch-001';
  -- (repeat for other entities)
  COMMIT;
  ```

- Option B: Restore from backup (if reverse script fails, 10–30 min)
  - Stop application
  - Restore database from pre-migration backup
  - Restart application

**Step 4: Verify Rollback (< 15 min)**
- [ ] Confirm records no longer stamped (or stamped values reset)
- [ ] Confirm API responses return old schema
- [ ] Confirm error rates back to normal
- [ ] Run post-rollback validation queries

**Step 5: Post-Incident Review (1 day)**
- [ ] Document root cause
- [ ] Update migration plan to prevent recurrence
- [ ] Schedule re-attempt with fixes

### Rollback Window
**Total rollback time: < 60 minutes** (all steps combined)

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Migration script bugs | Medium | High | Test script on staging 3x; peer review; transaction rollback |
| Data validation failure | Medium | High | Pre-migration audit; validation queries; test on 10% sample first |
| Index creation timeout | Low | Medium | Create indexes pre-migration; monitor disk space; increase timeout |
| Foreign key constraint violation | Low | High | Test migration order; backfill validation; audit referential integrity |
| Downtime during migration | Medium | High | Run off-hours; notify users 48 hrs ahead; have rollback ready |
| Performance regression | Medium | Medium | Monitor query latency during + after; index strategy pre-validated |
| Incomplete backfill (some records skipped) | Low | Critical | Count rows pre/post; validate 100% coverage; audit_trace_id tracking |
| User confusion from new fields | Low | Low | New fields hidden from user-facing queries until Phase 2; internal only |
| Backward compatibility break | Low | High | All new fields nullable; old queries unchanged; test against existing APIs |

---

## 14. Operator Approval Checkpoint

### Pre-Implementation Approval Required:

- [ ] **Phase 1 scope confirmed** — only data model, no routes/backend/features
- [ ] **Migration script reviewed** — code review by 2+ engineers + DBA
- [ ] **Migration tested on staging** — full backfill, validation, rollback tested
- [ ] **Pre-migration audit complete** — record count baseline established
- [ ] **Rollback plan documented and tested** — reverse script works in < 10 min
- [ ] **Off-hours window scheduled** — downtime window confirmed with stakeholders
- [ ] **Index strategy finalized** — index names, columns, retention tested
- [ ] **Validation queries ready** — all post-migration validation queries documented
- [ ] **Stakeholder notification** — broker, MGA, platform teams notified of migration
- [ ] **Rollback decision authority assigned** — on-call operator identified for go/no-go call
- [ ] **Test plan documented** — 30–50 tests identified and test environment ready

### Approval Sign-Off:

```
Phase 1 Implementation Approval

Prepared by: [Name/Date]
Reviewed by: [Name/Date]
Approved by: [Operator Name/Date]

Status: ☐ READY FOR IMPLEMENTATION
        ☐ DEFERRED (reason: ______)
        ☐ BLOCKED (reason: ______)
```

---

## 15. No-Implementation Certification

**This Phase 1 Work Order is a PLANNING DOCUMENT ONLY.**

### Certification of No Implementation:

```
✅ VERIFIED: No runtime code changes made
✅ VERIFIED: No entity schema files modified
✅ VERIFIED: No backend functions created
✅ VERIFIED: No routes activated
✅ VERIFIED: No feature flags changed
✅ VERIFIED: No production behavior changes
✅ VERIFIED: No Gates 6I-B, 6J-B, 6J-C touched
✅ VERIFIED: P0 Repair 2/4 remains locked/deferred
✅ VERIFIED: No database migrations executed
✅ VERIFIED: No indexes created
✅ VERIFIED: All scope remains planning only
```

**Status:** READY FOR OPERATOR REVIEW AND APPROVAL TO IMPLEMENT

---

## Summary

**Phase 1 Work Order:** Data Model Completion

**Objective:** Stamp 16 core business entities with distribution-channel context and ownership fields.

**Scope:** 
- 16 entities reviewed and defined for stamping
- 13 required fields per entity (distribution-channel context, ownership, visibility, audit)
- 1 new entity (BrokerEmployerRelationship)
- Migration strategy for backfill (transactional, with rollback)
- Index strategy for Phase 2+ scoping queries
- 30–50 validation tests
- Off-hours execution plan

**Out of Scope:**
- No runtime code, routes, features, or permissions
- No Gates touched
- No feature flags activated
- No production behavior changes

**Risk Level:** 🔴 HIGH (data migration critical path) — Mitigated by transaction rollback, validation, testing, off-hours execution

**Timeline:** 7 days (planning → approval → implementation → validation)

**Approval Gate:** Operator sign-off required on all 10 checkpoint items before implementation starts

**Next Action:** Request operator approval of Phase 1 Work Order; schedule Phase 1 implementation; proceed to Phase 2 Planning once Phase 1 complete and validated.