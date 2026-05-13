# Gate 6L-B — Broker Agency Documents Discovery & Preflight Report

**Date:** 2026-05-13  
**Gate:** 6L-B (Broker Agency Documents)  
**Status:** OPERATOR AUTHORIZED FOR DISCOVERY & CONTROLLED IMPLEMENTATION PATH  
**Phase:** Discovery / Preflight Analysis

---

## Executive Summary

Gate 6L-B (Broker Agency Documents) extends document management to the broker agency model established in Gates 7A-0 through 7A-3. This gate must support both standalone and MGA-affiliated broker agencies while preserving direct broker-owned document isolation and maintaining relationship-bound MGA visibility.

**Key Design Principles:**
- Direct broker-owned documents isolated from MGA users
- MGA users see only relationship-bound documents
- Safe payloads enforced (no private file metadata exposure)
- Audit-controlled document access
- Zero raw frontend file/entity reads
- All feature flags default to false

---

## Current Broker Agency Document Requirements

### From Gate 7A-0 (First-Class Broker Model)
- Broker agencies are first-class entities with profiles, contacts, and operational data
- Broker agencies have direct ownership of business records
- Broker users have unrestricted access to own agency records

### From Gates 7A-1 / 7A-2 (Broker Signup & Workspace)
- Broker agencies can be created, onboarded, and activated
- Broker workspace has agency-level settings and controls
- Broker users manage their own operational workspace

### From Gates 7A-3 (MGA Relationship Support)
- Broker agencies can form relationships with MGAs
- Relationships have status (PROPOSED, ACTIVE, SUSPENDED, TERMINATED)
- MGA visibility is relationship-bound (only ACTIVE relationships)
- Direct broker-owned records are isolated from MGA users
- Safe payloads enforced at backend contract boundary

### Documents Must Support
✅ Standalone broker documents (no MGA relationship)  
✅ Direct-broker-owned documents (with inactive/no MGA relationship)  
✅ MGA-affiliated documents (relationship-bound visibility)  
✅ Private document security (not public URLs)  
✅ Audit-controlled access and download  
✅ File metadata privacy (no exposure in frontend)

---

## Existing Document Infrastructure

### Current Entity Model
**Document Entity** (from context):
```json
{
  "name": "Document",
  "properties": {
    "case_id": { "type": "string" },
    "employer_group_id": { "type": "string" },
    "name": { "type": "string" },
    "document_type": { "enum": ["census", "proposal", "sbc", "application", ...] },
    "file_url": { "type": "string" },
    "file_name": { "type": "string" },
    "uploaded_by": { "type": "string" },
    "notes": { "type": "string" },
    "mga_migration_batch_id": { "type": "string" },
    "mga_migration_status": { "enum": ["not_migrated", "migrated", ...] }
  }
}
```

### Current File Storage
- Base44 file storage via base44.integrations.Core.UploadFile
- Returns file_url (public)
- No built-in private file handling

### Current Document Access
- No role-based access control
- No relationship scope enforcement
- No document-level audit logging
- Raw frontend entity reads possible

### Current Limitations to Remediate
❌ No broker agency scoping  
❌ No private document URLs  
❌ No relationship-bound MGA visibility  
❌ No audit-controlled downloads  
❌ No safe payload enforcement  
❌ No document classification (direct vs affiliated)

---

## Private File Handling Requirements

### Private Document Storage
**Requirement:** Documents must support private storage (not exposed as public URLs)

**Implementation Options:**
1. **Private File Storage + Signed URLs** (Recommended)
   - Use Base44 private file upload: `base44.integrations.Core.UploadPrivateFile`
   - Returns file_uri (not public URL)
   - Generate time-limited signed URLs: `base44.integrations.Core.CreateFileSignedUrl`
   - URL expires after configurable time (default 300 seconds)
   - Audit logging on signed URL generation

2. **Backend File Service**
   - Backend function handles all file downloads
   - Frontend never receives direct file URL
   - Backend validates access before serving
   - Requires streaming/proxy architecture

**Recommended Approach:** Option 1 (private file storage + signed URLs)
- Leverages existing Base44 infrastructure
- Minimal new backend code
- Supports time-limited access
- Natural audit point at signed URL generation

### Private Metadata Protection
**Requirement:** File metadata (size, upload date, uploader) must not leak to unauthorized users

**Safe Payload Fields (documents visible to user):**
- ✅ id, name, document_type, uploaded_by, uploaded_date, notes
- ❌ No file_uri (private)
- ❌ No file_size (private)
- ❌ No file_content_hash (private)
- ❌ No storage_location (private)

---

## Broker Direct Document Access Model

### Standalone Broker Agencies
**Access Rules:**
- Broker users can upload/download own documents
- Broker admins can manage agency documents
- No MGA relationship exists
- Documents have no mga_relationship_id

**Document Classification:**
```
{
  "broker_agency_id": "broker123",
  "document_classification": "direct_broker_owned",
  "mga_relationship_id": null,
  "visibility_scope": "broker_only"
}
```

**Access Control:**
- Owner broker agency can access (CRUD)
- Other brokers cannot access
- Platform admin can access with audit reason override
- MGA users cannot access

### Broker Agencies with Inactive MGA Relationships
**Access Rules:**
- Broker users retain full access (relationship not ACTIVE)
- Document belongs to broker, not relationship
- MGA users cannot access (relationship not ACTIVE)

**Document Classification:**
```
{
  "broker_agency_id": "broker123",
  "document_classification": "direct_broker_owned",
  "mga_relationship_id": "rel456",
  "relationship_status": "PROPOSED",  // or SUSPENDED, TERMINATED
  "visibility_scope": "broker_only"
}
```

---

## MGA-Affiliated Document Visibility Model

### Documents in Active MGA Relationships
**Access Rules:**
- Created/uploaded during active relationship
- Both broker and MGA can access (if relationship ACTIVE)
- Relationship status determines visibility
- Document remains bound to relationship for lifecycle

**Document Classification:**
```
{
  "broker_agency_id": "broker123",
  "document_classification": "mga_affiliated",
  "mga_relationship_id": "rel456",
  "relationship_status": "ACTIVE",
  "visibility_active": true,
  "visibility_scope": "relationship_bound"
}
```

**Access Control:**
- Broker users: Full access (own agency)
- MGA users: Access only if relationship ACTIVE + visibility_active = true
- Platform admin: Override access with audit reason
- Other users: Denied

### Scope Enforcement via Relationship
**Requirement:** MGA visibility controlled by relationship scope definition

**Relationship Scope Definition:**
```json
{
  "scope_definition": {
    "allowed_operations": [
      "read_documents",
      "download_documents",
      "view_document_metadata"
    ],
    "denied_operations": [
      "delete_documents",
      "modify_document_properties"
    ]
  }
}
```

**MGA Can:**
- ✅ Read documents (list, view metadata)
- ✅ Download documents (with signed URL)
- ✅ View audit trail

**MGA Cannot:**
- ❌ Delete documents
- ❌ Modify document properties
- ❌ Upload documents (broker/case-specific)

---

## Platform Admin Access Model

### Override Access with Mandatory Audit Reason
**Requirement:** Platform admin can override document access with mandatory audit reason (from Gate 7A-3)

**Override Logic:**
- platform_admin / platform_super_admin only
- Can bypass permission/scope checks with valid override_reason
- Missing/blank override_reason → DENIED
- Successful override → AUDITED with reason

**Example Audit Event:**
```json
{
  "event_type": "document_access_override",
  "entity_id": "doc789",
  "actor_email": "admin@platform.com",
  "actor_role": "platform_admin",
  "action": "download_document",
  "detail": "Platform admin override: compliance review",
  "outcome": "override",
  "reason_code": "PLATFORM_ADMIN_OVERRIDE",
  "override_reason": "compliance review",
  "timestamp": "2026-05-13T14:30:00Z"
}
```

---

## RBAC and Permission Requirements

### Role Hierarchy
| Role | Document Access | Scope |
|------|-----------------|-------|
| platform_admin | Full + override | All documents |
| platform_super_admin | Full + override | All documents |
| mga_admin | Relationship-bound | MGA's relationships only |
| mga_manager | Relationship-bound | MGA's relationships only |
| mga_user | Relationship-bound (read-only) | MGA's relationships only |
| broker_admin | Own agency | Own agency + relationships |
| broker_manager | Own agency | Own agency + relationships |
| broker_user | Own agency | Own agency documents |

### Permission Resolution
**Requirement:** Three-layer enforcement (from Gate 7A-3 pattern)

**Layer 1: Role Permission**
- Does role have permission to action? (read_document, download_document, delete_document)
- Platform admin: unrestricted
- Broker/MGA users: role-specific permissions

**Layer 2: Relationship Scope** (if MGA-affiliated)
- Is relationship ACTIVE?
- Is visibility_active = true?
- Is action in scope_definition.allowed_operations?

**Layer 3: Contract Enforcement**
- Backend service validates all checks
- Safe payload returned on success
- Denial audited with reason code

---

## Scope Resolver & Relationship Resolver Dependencies

### Scope Resolver (From Gate 7A-3)
**Current:** relationshipScopeResolver validates relationship status, visibility, and scope definition

**Usage in Documents:**
- Check if MGA can access relationship-bound documents
- Validate scope_definition.allowed_operations for action
- Enforce relationship status (ACTIVE only)

### Relationship Resolver (From Gate 7A-3)
**Current:** Retrieves relationship metadata, status, scope definition

**Usage in Documents:**
- Fetch relationship details when filtering documents
- Determine if document visibility should extend to MGA

### New Resolver: Document Classification Resolver
**Required:** Determine if document is direct_broker_owned or mga_affiliated

**Logic:**
- If document has no mga_relationship_id → direct_broker_owned
- If document has mga_relationship_id and relationship is ACTIVE → mga_affiliated
- If document has mga_relationship_id but relationship is not ACTIVE → direct_broker_owned (relationship ended)

---

## Safe Payload Requirements

### Document Payload Safe Fields
**Frontend receives only:**
- id, name, document_type, document_classification
- uploaded_by, uploaded_date, notes
- relationship_id (if mga_affiliated)
- relationship_status (if mga_affiliated)

**Frontend does NOT receive:**
- ❌ file_uri (private)
- ❌ file_size
- ❌ file_content_hash
- ❌ storage_location
- ❌ file_mime_type
- ❌ private file metadata

### Signed URL Safe Handling
**Requirement:** Signed URLs generated server-side, time-limited, audit-logged

**Frontend Never Receives:**
- ❌ file_uri directly
- ❌ Private file identifiers

**Frontend Receives:**
- ✅ Download button (calls backend function)
- ✅ Backend returns temporary signed URL (300 sec expiry)
- ✅ Frontend redirects to signed URL
- ✅ Audit logged at backend

---

## File Upload/Download Security Requirements

### File Upload
**Security Controls:**
- ✅ Authenticated user only (base44.auth.me())
- ✅ Virus scan on upload (if available)
- ✅ File size limit (e.g., 50MB)
- ✅ Allowed MIME types only (pdf, docx, xlsx, csv, jpg, png)
- ✅ Uploaded file stored as private (not public URL)
- ✅ Audit logged with uploader, timestamp, file metadata

**Upload Flow:**
1. User selects file + metadata (name, type, notes)
2. Frontend validates (size, MIME type)
3. Frontend calls backend upload function
4. Backend authenticates user + validates access
5. Backend calls UploadPrivateFile (not UploadFile)
6. Backend stores document record with file_uri (not file_url)
7. Audit event logged

### File Download
**Security Controls:**
- ✅ Access validation (permission + scope + contract)
- ✅ Time-limited signed URL (300 sec default)
- ✅ Audit logged with downloader, timestamp, signed URL generation
- ✅ URL expires automatically

**Download Flow:**
1. User clicks "Download Document" button
2. Frontend calls backend function (getDocumentSignedUrl)
3. Backend validates access:
   - Permission check (role has permission)
   - Scope check (relationship ACTIVE if MGA)
   - Contract check (safe payload rules)
4. Backend generates signed URL via CreateFileSignedUrl
5. Audit event logged
6. Backend returns signed URL to frontend
7. Frontend redirects user to signed URL
8. Browser handles download directly from private storage

---

## Audit Event Requirements

### Document Access Audit Events
| Event | Trigger | Fields |
|-------|---------|--------|
| document_list_denied | User denied access to list documents | event_type, actor_email, actor_role, action, reason_code |
| document_view_denied | User denied access to view document | event_type, entity_id, actor_email, actor_role, reason_code |
| document_download_initiated | User initiates download | event_type, entity_id, actor_email, actor_role, signed_url_gen_time |
| document_download_completed | User downloads file | event_type, entity_id, actor_email, timestamp |
| document_upload_successful | File uploaded | event_type, entity_id, actor_email, file_name, file_size, upload_time |
| document_upload_failed | Upload failed | event_type, actor_email, reason, timestamp |
| document_delete_denied | User denied delete access | event_type, entity_id, actor_email, actor_role, reason_code |
| document_delete_successful | Document deleted | event_type, entity_id, deleted_by, timestamp |
| document_access_override | Platform admin override | event_type, entity_id, actor_email, override_reason, timestamp |

**All events include:** timestamp (ISO 8601), actor_email, actor_role, entity_id (if applicable), outcome (success/denied/override)

---

## UI Surfaces Likely Needed

### 1. Document Library / List View
**Components:**
- DocumentListPage: Display all accessible documents
- DocumentFilterBar: Filter by type, date range, uploader
- DocumentCard: Display document summary
- DocumentDetailPanel: Side panel with full metadata + actions

**Features:**
- Role-aware visibility (show only accessible documents)
- Pagination (large document libraries)
- Search by name/type
- Filter by relationship (if MGA user)

### 2. Document Upload Modal
**Components:**
- DocumentUploadModal: Modal with file picker + metadata form
- FileValidationDisplay: Show file size, MIME type, validation status
- UploadProgressBar: Upload progress indicator

**Features:**
- File type validation (frontend)
- File size warning
- Document metadata (name, type, notes)
- Case/employer selection (if applicable)

### 3. Document Detail View
**Components:**
- DocumentDetailDrawer: Side panel with full metadata
- DocumentAuditPanel: Show access/download audit trail
- DownloadButton: Initiate signed URL generation + download

**Features:**
- Full document metadata (name, type, uploader, date, notes)
- Audit history (who accessed, when)
- Download button (with audit logging)
- Delete button (if authorized)

### 4. Relationship-Bound Document Filtering
**Components:**
- RelationshipDocumentFilter: Show documents for selected relationship
- ScopeLimitationBadge: Display scope restrictions (read-only, no-delete)

**Features:**
- Dropdown to select relationship (MGA user)
- Filter documents to relationship-bound only
- Show scope limitations (e.g., "Read-only" badge)

### 5. Platform Admin Override Panel
**Components:**
- DocumentOverrideButton: Override access with audit reason
- OverrideReasonModal: Modal for mandatory audit reason

**Features:**
- Override button (platform admin only)
- Reason text input (required, non-blank)
- Confirmation before override
- Audit logged immediately

---

## Backend Contract Surfaces Likely Needed

### 1. Document Access Service
**Similar to Phase 7A-3.4 access services**

```
documentAccessService.getDocument(user, documentId, options)
documentAccessService.listDocuments(user, filters)
documentAccessService.uploadDocument(user, file, metadata)
documentAccessService.deleteDocument(user, documentId, reason)
```

**Features:**
- Permission + scope + contract validation
- Safe payload return
- Audit logging for all denials/overrides
- Platform admin override with mandatory reason

### 2. Signed URL Service
```
getDocumentSignedUrl(user, documentId, expiresIn?)
```

**Features:**
- Validate access before generating URL
- Time-limited signed URL (default 300 sec)
- Audit log signed URL generation

### 3. File Upload Service
```
uploadDocumentFile(user, file, metadata)
```

**Features:**
- File validation (MIME type, size)
- Private file storage
- Virus scan (if available)
- Audit log upload with metadata

---

## Feature Flags Required (All Default False)

| Flag | Purpose | Default | Activation Phase |
|------|---------|---------|------------------|
| BROKER_AGENCY_DOCUMENTS_ENABLED | Enable document management | false | 6L-B Phase 2+ |
| DOCUMENT_PRIVATE_FILE_STORAGE_ENABLED | Use private file storage | false | 6L-B Phase 2+ |
| DOCUMENT_RELATIONSHIP_SCOPE_ENABLED | Enforce relationship-bound visibility | false | 6L-B Phase 2+ |
| DOCUMENT_AUDIT_LOGGING_ENABLED | Audit all document access | false | 6L-B Phase 2+ |
| DOCUMENT_SAFE_PAYLOAD_ENABLED | Enforce safe payloads | false | 6L-B Phase 2+ |
| DOCUMENT_OVERRIDE_ENABLED | Platform admin override | false | 6L-B Phase 2+ |

**All flags default to false. No runtime activation until explicit Phase 6L-B+ authorization.**

---

## Migration / Backfill Implications

### Current Document Records
**Existing documents (from cases/employers):**
- May lack broker_agency_id
- May lack document_classification
- May lack mga_relationship_id

### Backfill Strategy
**Option 1: Lazy Migration** (Recommended)
- No backfill required
- New documents use new schema
- Old documents accessible via legacy path
- Gradual migration as documents are re-uploaded

**Option 2: Active Migration**
- Backfill broker_agency_id from case/employer
- Set document_classification to "direct_broker_owned" (safest)
- Set mga_relationship_id to null
- Requires dry-run validation before production

**Recommended:** Option 1 (lazy migration)
- Lower risk
- No data mutation
- Better separation of concerns

---

## Risks & Abuse Cases

### Risk 1: Unauthorized MGA Document Access
**Risk:** MGA user accesses direct broker documents

**Mitigation:**
- ✅ Access service validates relationship scope
- ✅ MGA blocked if relationship not ACTIVE
- ✅ Audit logged with denial reason
- ✅ Contract enforcement prevents raw entity reads

### Risk 2: Leaked Private File Metadata
**Risk:** File URIs or metadata exposed to unauthorized users

**Mitigation:**
- ✅ Safe payload enforcement (no file_uri, file_size)
- ✅ Signed URLs time-limited (300 sec)
- ✅ Signed URL generation audit logged
- ✅ Backend controls all file access

### Risk 3: Unsigned File Download
**Risk:** User directly accesses private file without authorization

**Mitigation:**
- ✅ Signed URLs time-limited
- ✅ Private file storage (not public)
- ✅ Backend validates access before signing
- ✅ Audit logging on signed URL generation

### Risk 4: Platform Admin Override Abuse
**Risk:** Platform admin overrides access without justification

**Mitigation:**
- ✅ Mandatory audit reason (from Gate 7A-3)
- ✅ Missing/blank reason → DENIED
- ✅ All overrides audited with reason
- ✅ Audit trail immutable

### Risk 5: Direct Broker Book Conversion
**Risk:** MGA relationship changes direct-broker-owned classification

**Mitigation:**
- ✅ Document classification assigned at creation
- ✅ Not changed by relationship status
- ✅ Relationship status affects visibility only
- ✅ Backfill uses safest classification

### Risk 6: Recursive Relationship Visibility
**Risk:** MGA inherits visibility of all broker documents through relationship

**Mitigation:**
- ✅ Only mga_affiliated documents visible to MGA
- ✅ direct_broker_owned documents isolated
- ✅ Scope definition enforced per relationship
- ✅ No implicit visibility inheritance

---

## Minimum Acceptance Test Categories

### Unit Tests
1. **Access Control**
   - Broker can access own documents
   - MGA denied access to direct-broker documents
   - MGA allowed access to mga_affiliated documents (ACTIVE relationship)
   - MGA denied access when relationship not ACTIVE
   - Platform admin override with valid reason
   - Platform admin override denied for missing reason

2. **Payload Safety**
   - Safe fields returned (name, type, uploader, date)
   - No file_uri in payload
   - No file_metadata in payload
   - Signed URLs not included in document payload

3. **Permission Resolution**
   - Role permission checked (read_document, download_document)
   - Scope checked (allowed_operations, denied_operations)
   - Contract enforced (safe payload, audit logging)

### Integration Tests
1. **File Upload/Download**
   - File uploaded to private storage
   - File accessible via signed URL
   - Signed URL expires correctly
   - Audit logged on upload/download

2. **Relationship Scope**
   - Documents listed per relationship
   - Scope limitations enforced (read-only)
   - Denied operations blocked (delete)

3. **Audit Logging**
   - Access denied events logged
   - Override events logged with reason
   - Download initiated/completed logged

4. **Safe Payload**
   - No raw entity reads in components
   - Frontend receives only safe fields
   - Signed URL generated server-side

---

## Recommended Implementation Phases

### Phase 6L-B.1: Discovery & Design (Current)
- ✅ Complete discovery/preflight
- ✅ Identify operator decisions needed
- ✅ Finalize schema/contract design
- ✅ Awaiting operator approval to proceed

### Phase 6L-B.2: Backend Infrastructure
- Entity schema updates (broker_agency_id, classification, mga_relationship_id)
- Document access service (permission + scope + contract)
- Signed URL service (time-limited, audit-logged)
- File upload service (private storage, validation)
- Test suite (unit + integration, ~120 tests estimated)

### Phase 6L-B.3: Frontend UI Components
- Document list/filter view
- Document detail drawer
- Upload modal
- Relationship-bound filtering
- Download button (with signed URL)
- Audit trail panel
- Admin override panel
- Test suite (~71 tests estimated)

### Phase 6L-B.4: Feature Flag Activation & Testing
- Activate feature flags (controlled, staged)
- Smoke testing in dev/staging
- Performance testing (large document libraries)
- Security testing (abuse cases, override enforcement)

### Phase 6L-B.5: Production Deployment
- Gradual rollout (feature flags)
- Monitoring & alerting
- Backfill strategy execution (if needed)

---

## Operator Decisions Required Before Implementation

### 1. Private File Storage Approach
**Decision:** Confirm recommended approach (private storage + signed URLs)

**Options:**
- A) Private storage + signed URLs ← Recommended
- B) Backend proxy service
- C) Hybrid (both)

**Operator Input:** Approve approach or request alternative

### 2. Signed URL Expiry Time
**Decision:** Confirm time-limited expiry for signed URLs

**Options:**
- A) 300 seconds (5 minutes) ← Recommended
- B) 600 seconds (10 minutes)
- C) 3600 seconds (1 hour)
- D) Configurable per document type

**Operator Input:** Approve default or specify alternative

### 3. Document Classification Strategy
**Decision:** Confirm direct_broker_owned vs mga_affiliated classification

**Options:**
- A) Explicit at upload time (user selects)
- B) Automatic based on context (case/relationship)
- C) Hybrid (automatic + override)

**Operator Input:** Approve strategy

### 4. Scope Limitations for MGA
**Decision:** Confirm allowed operations for MGA users

**Options:**
- A) Read-only (view + download) ← Recommended
- B) Full access (except delete)
- C) Custom per relationship scope definition

**Operator Input:** Approve limitations

### 5. File Size / MIME Type Limits
**Decision:** Confirm file upload limits

**Options:**
- A) Max 50MB, allowed: PDF, DOCX, XLSX, CSV, JPG, PNG ← Recommended
- B) Max 100MB, broader MIME types
- C) Configurable per document type

**Operator Input:** Approve limits

### 6. Backfill Strategy
**Decision:** Confirm migration approach for existing documents

**Options:**
- A) Lazy migration (no backfill) ← Recommended
- B) Active migration (backfill all)
- C) Hybrid (backfill critical, lazy others)

**Operator Input:** Approve strategy

### 7. Audit Event Retention
**Decision:** Confirm audit event retention policy

**Options:**
- A) Retain indefinitely ← Recommended
- B) 1 year retention
- C) Configurable per event type

**Operator Input:** Approve retention

---

## Guardrails & Constraints

### 🔒 Mandatory Guardrails (Non-Negotiable)

✅ **No Raw Frontend Entity Reads**
- Frontend never reads Document entity directly
- All data via backend functions only
- Safe payloads enforced

✅ **No Private File Metadata Leakage**
- file_uri never exposed to frontend
- Signed URLs generated server-side only
- Audit logged on URL generation

✅ **Direct Broker Isolation**
- MGA cannot access direct-broker-owned documents
- Classification fixed at document creation
- Not changed by relationship status

✅ **Relationship-Bound Visibility**
- MGA sees only mga_affiliated documents in ACTIVE relationships
- Scope definition enforced (allowed/denied operations)
- Denied operations blocked (e.g., delete)

✅ **Platform Admin Override with Mandatory Audit Reason**
- From Gate 7A-3 pattern
- Missing/blank reason → DENIED
- All overrides audited and immutable

✅ **Gate 7A-3 Relationship Access Preserved**
- Document access respects relationship scope resolver
- No weakening of relationship-bound access
- Safe payload enforcement maintained

✅ **Feature Flags Default to False**
- All document feature flags default false
- No runtime activation without explicit approval
- No production changes until Phase 6L-B.4+

✅ **No Route Exposure**
- No new /documents, /broker-documents routes exposed
- UI surfaces component-based (feature-flag gated)
- Routes remain unchanged from Gate 7A-3

✅ **No Modification to Gates 6I-B, 6J-B, 6J-C**
- Remain deferred and untouched
- No dependencies or integration
- Independent implementation path

---

## Summary: Current State vs Gate 6L-B

| Aspect | Current | Gate 6L-B Required |
|--------|---------|-------------------|
| Document Scoping | Case/employer only | + Broker agency scoping |
| Access Control | None | Permission + scope + contract |
| MGA Visibility | Raw entity reads | Relationship-bound only |
| File Storage | Public URLs | Private storage + signed URLs |
| Audit Logging | Minimal | Comprehensive (all access) |
| Safe Payloads | Not enforced | Required (no file metadata) |
| Feature Flags | N/A | 6 flags (all false default) |
| Relationship Support | From 7A-3 | Leverage scope/permission resolvers |

---

## Conclusion & Next Steps

Gate 6L-B (Broker Agency Documents) is ready for controlled implementation. All dependencies (Gates 7A-0 through 7A-3) are in place. Scope is well-defined. Operator decisions required (see section above).

**Recommended Path Forward:**
1. ✅ Operator reviews discovery/preflight
2. ✅ Operator provides decisions on identified questions
3. ✅ Proceed to Phase 6L-B.2 (Backend Infrastructure)
4. ✅ Follow recommended implementation phases
5. ✅ Maintain all guardrails and constraints

**No runtime code changes, route exposure, or feature flag activation until Phase 6L-B.2+ authorization.**

---

**Gate 6L-B Discovery & Preflight Complete — Awaiting Operator Review & Decisions** 📋