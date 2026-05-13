# Gate 6L-B.2 — Broker Agency Documents Backend Infrastructure Design & Work Order

**Date:** 2026-05-13  
**Gate:** 6L-B (Broker Agency Documents)  
**Phase:** 6L-B.2 (Backend Infrastructure Design & Work Order)  
**Status:** OPERATOR AUTHORIZED FOR DESIGN & IMPLEMENTATION PLANNING

---

## Executive Summary

Gate 6L-B.2 defines the backend infrastructure for Broker Agency Documents, incorporating all seven operator decisions. This phase establishes:

✅ **Private-only file storage** (no public URLs)  
✅ **Short-lived signed download URLs** (backend-authorized only)  
✅ **Document classification** (direct_broker_owned, mga_affiliated, platform_admin, system/internal)  
✅ **MGA access control** (active relationship only, no direct broker documents)  
✅ **Conservative file limits** (size + type validation)  
✅ **Deferred backfill** (design phase only, no migration execution)  
✅ **Immutable audit retention** (per platform standards)

**Scope:** Backend infrastructure design, contract surfaces, service layer, audit model, test plan.  
**Non-Scope:** Frontend UI, feature flag activation, runtime code execution, migrations.

**Estimated Implementation:** 6-8 weeks for Phase 6L-B.2 + 6L-B.3 (backend + frontend combined).  
**Test Estimate:** 210 tests (backend unit + integration + contract tests).

---

## Authorized Scope & Non-Authorized Scope

### ✅ Authorized Scope

**Backend Infrastructure:**
- Document classification resolver
- Document access service (permission + scope + contract)
- Private file upload service
- Signed URL generation service
- Audit event schema and writer
- Feature flag definitions (default false)
- Test suite (unit + integration + contract)

**Design Documentation:**
- Data model updates (Document entity extensions)
- Private storage architecture
- Signed URL flow design
- Audit event model
- Test plan with categories

**Not Yet Authorized:**
- Feature flag activation
- Runtime code execution
- Frontend UI implementation
- Route exposure
- Production deployment

### ❌ Non-Authorized Scope

**Out of Scope for 6L-B.2:**
- Frontend UI components (Phase 6L-B.3)
- Feature flag activation (Phase 6L-B.4)
- Backfill/migration execution (deferred)
- Database schema migration (deferred until Phase 6L-B.4)
- Production deployment (Phase 6L-B.5)
- Integration with Gates 6I-B, 6J-B, 6J-C

**Explicitly Deferred:**
- Gate 6I-B (Report Scheduling)
- Gate 6J-B (Email Export Delivery)
- Gate 6J-C (Webhook Export Delivery)
- All remain untouched and blocked

---

## Current Document Infrastructure Baseline

### Existing Document Entity
```json
{
  "name": "Document",
  "properties": {
    "case_id": { "type": "string" },
    "employer_group_id": { "type": "string" },
    "name": { "type": "string" },
    "document_type": { "enum": ["census", "proposal", "sbc", "application", "contract", "correspondence", "enrollment_form", "other"] },
    "file_url": { "type": "string" },
    "file_name": { "type": "string" },
    "file_size": { "type": "number" },
    "notes": { "type": "string" },
    "uploaded_by": { "type": "string" },
    "employer_name": { "type": "string" },
    "mga_migration_batch_id": { "type": "string" },
    "mga_migration_status": { "enum": ["not_migrated", "migrated", "validated", "anomaly", "quarantined"] }
  }
}
```

### Current Limitations
❌ No broker_agency_id  
❌ No document_classification  
❌ No mga_relationship_id  
❌ No private file storage  
❌ No relationship-bound visibility  
❌ No access control enforcement  
❌ No audit logging  
❌ Public file URLs only

### Files & Storage
- Base44 File Upload: `base44.integrations.Core.UploadFile` → public URL
- No private file API currently used
- No signed URL infrastructure

### Access Control
- No role-based checks
- No scope enforcement
- Raw entity reads possible from frontend

---

## Private Storage Architecture

### Decision: Private-Only File Storage
**Operator Decision:** Use private-file handling only. Do not use public file URLs for broker agency documents.

**Implementation Approach:**

#### Step 1: Private File Upload
```
Upload Flow:
1. User selects file
2. Frontend validates (MIME type, size)
3. Frontend calls uploadDocumentFile(file, metadata)
4. Backend authenticates user
5. Backend validates access (permission + scope)
6. Backend calls UploadPrivateFile (not UploadFile)
7. Returns file_uri (not file_url)
8. Store file_uri in Document entity
9. Audit log upload event
```

**Code Example (Backend Function):**
```javascript
async uploadDocumentFile(req) {
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await req.json();
  const { file_base64, filename, file_size, document_type, notes, case_id, broker_agency_id, mga_relationship_id } = payload;

  // Validate file
  const validation = validateFileUpload(file_base64, filename, file_size);
  if (!validation.allowed) {
    return Response.json({ error: validation.reason }, { status: 400 });
  }

  // Validate access
  const accessDecision = await documentAccessService.validateUpload(user, { broker_agency_id, mga_relationship_id });
  if (!accessDecision.allowed) {
    await auditWriter.recordDenial('document_upload_denied', { actor_email: user.email, reason: accessDecision.reason });
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Upload private file
  const file = Buffer.from(file_base64, 'base64');
  const uploadResult = await base44.integrations.Core.UploadPrivateFile({ file });
  const file_uri = uploadResult.file_uri;

  // Create document record
  const documentRecord = await base44.entities.Document.create({
    broker_agency_id,
    mga_relationship_id,
    case_id,
    name: filename,
    document_type,
    file_uri,
    file_name: filename,
    file_size,
    notes,
    uploaded_by: user.email,
    document_classification: classifyDocument({ broker_agency_id, mga_relationship_id }),
    visibility_scope: determineVisibilityScope({ broker_agency_id, mga_relationship_id })
  });

  // Audit log
  await auditWriter.recordEvent({
    event_type: 'document_upload_successful',
    entity_id: documentRecord.id,
    actor_email: user.email,
    actor_role: user.role,
    detail: `Document uploaded: ${filename} (${file_size} bytes)`,
    file_name: filename,
    file_size,
    timestamp: new Date().toISOString()
  });

  return Response.json({ document_id: documentRecord.id, file_uri });
}
```

#### Step 2: Signed URL Generation
```
Download Flow:
1. User clicks "Download Document" button
2. Frontend calls getDocumentSignedUrl(documentId)
3. Backend validates access (permission + scope + contract)
4. Backend calls CreateFileSignedUrl(file_uri)
5. Returns time-limited signed URL (300 sec default)
6. Audit log signed URL generation
7. Frontend receives signed URL, redirects to it
8. Browser downloads file directly from private storage
```

**Code Example (Backend Function):**
```javascript
async getDocumentSignedUrl(req) {
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await req.json();
  const { documentId } = payload;

  // Fetch document
  const document = await base44.entities.Document.get(documentId);
  if (!document) {
    return Response.json({ error: 'Document not found' }, { status: 404 });
  }

  // Validate access
  const accessDecision = await documentAccessService.getDocument(user, document);
  if (!accessDecision.allowed) {
    await auditWriter.recordDenial('document_download_denied', {
      entity_id: documentId,
      actor_email: user.email,
      actor_role: user.role,
      reason: accessDecision.reason
    });
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Generate signed URL
  const signedUrlResult = await base44.integrations.Core.CreateFileSignedUrl({
    file_uri: document.file_uri,
    expires_in: 300 // 5 minutes
  });

  // Audit log
  await auditWriter.recordEvent({
    event_type: 'document_signed_url_generated',
    entity_id: documentId,
    actor_email: user.email,
    actor_role: user.role,
    detail: `Signed URL generated for document: ${document.name}`,
    expires_in: 300,
    timestamp: new Date().toISOString()
  });

  return Response.json({ 
    signed_url: signedUrlResult.signed_url,
    expires_in: 300 
  });
}
```

### Key Guarantees
✅ No public file URLs exposed  
✅ file_uri stored internally only  
✅ Signed URLs generated server-side  
✅ Signed URLs time-limited (300 sec)  
✅ All downloads go through backend validation  
✅ Audit logged at URL generation

---

## Document Classification Model

### Decision: Multi-Category Classification
**Operator Decision:** Classify documents as direct_broker_owned, mga_affiliated, platform_admin, or system/internal based on broker_agency_id, relationship_id, distribution_channel_context_id, and owning organization.

### Classification Logic

#### 1. Direct Broker-Owned
**Criteria:**
- broker_agency_id present
- mga_relationship_id = null OR relationship not ACTIVE
- distribution_channel_context_id = null

**Visibility:**
- Owner broker users: Full access
- MGA users: DENIED
- Platform admin: Full access + override with audit reason

**Example:**
```
{
  "broker_agency_id": "broker123",
  "mga_relationship_id": null,
  "document_classification": "direct_broker_owned",
  "visibility_scope": "broker_only",
  "visibility_active": true
}
```

#### 2. MGA-Affiliated
**Criteria:**
- broker_agency_id present
- mga_relationship_id present
- Relationship status = ACTIVE
- visibility_active = true

**Visibility:**
- Owner broker users: Full access
- MGA users: Relationship-bound access (per scope definition)
- Platform admin: Full access + override with audit reason

**Example:**
```
{
  "broker_agency_id": "broker123",
  "mga_relationship_id": "rel456",
  "document_classification": "mga_affiliated",
  "relationship_status": "ACTIVE",
  "visibility_scope": "relationship_bound",
  "visibility_active": true
}
```

#### 3. Platform Admin (Future)
**Criteria:**
- Created by platform admin
- Designed for system auditing/compliance
- Not tied to broker or relationship

**Visibility:**
- Platform admin only
- Not visible to broker or MGA users

#### 4. System/Internal (Future)
**Criteria:**
- System-generated (exports, reports, automated)
- Not tied to user action
- For audit trail purposes

### Classification Resolver

```javascript
function classifyDocument(attrs) {
  const { broker_agency_id, mga_relationship_id, distribution_channel_context_id, creator_role } = attrs;

  if (creator_role && creator_role.startsWith('platform_')) {
    return 'platform_admin';
  }

  if (!broker_agency_id) {
    return 'system/internal';
  }

  if (!mga_relationship_id) {
    return 'direct_broker_owned';
  }

  return 'mga_affiliated';
}

function determineVisibilityScope(attrs) {
  const { broker_agency_id, mga_relationship_id } = attrs;

  if (!broker_agency_id || !mga_relationship_id) {
    return 'broker_only';
  }

  return 'relationship_bound';
}
```

---

## Broker Direct Document Access Model

### Standalone Broker Agencies
**No MGA relationship exists**

**Access Rules:**
- ✅ Broker owner: Full CRUD
- ✅ Broker users (same agency): CRUD per role
- ❌ Other brokers: DENIED
- ❌ MGA users: DENIED
- ✅ Platform admin: Full + override with audit reason

**Examples:**
- Agency A uploads insurance contract → Only Agency A can access
- Agency B cannot access Agency A's documents
- MGA affiliated with Agency A still cannot access direct_broker_owned docs

### Broker Agencies with Inactive MGA Relationships
**Relationship status: PROPOSED, SUSPENDED, or TERMINATED**

**Access Rules:**
- ✅ Broker owner: Full access (relationship status irrelevant)
- ❌ MGA users: DENIED (relationship not ACTIVE)
- ✅ Platform admin: Full + override with audit reason

**Reason:** Document belongs to broker, not relationship. Relationship status does not downgrade broker access.

### Document Lifecycle
```
Document Created
    ↓
Classification: direct_broker_owned
    ↓
Owner broker has full access
    ↓
If MGA relationship proposed
    ↓
Document remains direct_broker_owned (not converted)
    ↓
If relationship becomes ACTIVE
    ↓
NEW documents created after may be mga_affiliated
    ↓
Existing documents stay direct_broker_owned
```

**Key:** Document classification fixed at creation. Not changed by relationship status changes.

---

## MGA-Affiliated Document Visibility Model

### Access Rules (Active Relationship Only)
**Prerequisite:** Relationship status = ACTIVE AND visibility_active = true

**MGA User Access:**
- ✅ List documents (filtered to relationship)
- ✅ View document metadata
- ✅ Download documents (via signed URL)
- ✅ View audit trail
- ❌ Upload documents (relationship-bound creation disabled)
- ❌ Delete documents (scope limitation: denied_operation)
- ❌ Modify document properties (scope limitation: denied_operation)

**Broker User Access:**
- ✅ Full CRUD (owner)

**Access Enforcement:**

```javascript
async validateMGADocumentAccess(user, document) {
  // 1. Permission check
  const permission = permissionResolver.resolvePermission(user, 'read_document', document);
  if (!permission.allowed) {
    return { allowed: false, reason: 'DENY_ROLE_LACKS_PERMISSION' };
  }

  // 2. Only MGA users need scope check
  if (user.role.startsWith('mga_')) {
    // Check relationship exists
    const relationship = await base44.entities.BrokerMGARelationship.get(document.mga_relationship_id);
    if (!relationship) {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_FOUND' };
    }

    // Check relationship is ACTIVE
    if (relationship.relationship_status !== 'ACTIVE') {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_NOT_ACTIVE' };
    }

    // Check visibility is active
    if (!relationship.visibility_active) {
      return { allowed: false, reason: 'DENY_RELATIONSHIP_VISIBILITY_INACTIVE' };
    }

    // Check action in scope definition
    const scope = relationship.scope_definition;
    if (!scope.allowed_operations.includes(action)) {
      return { allowed: false, reason: 'DENY_ACTION_NOT_IN_SCOPE' };
    }

    // Block denied operations
    if (scope.denied_operations.includes(action)) {
      return { allowed: false, reason: 'DENY_ACTION_DENIED_IN_SCOPE' };
    }
  }

  return { allowed: true };
}
```

### Scope Definition Example
```json
{
  "relationship_id": "rel456",
  "scope_definition": {
    "allowed_operations": [
      "read_documents",
      "list_documents",
      "download_documents",
      "view_document_metadata",
      "view_audit_trail"
    ],
    "denied_operations": [
      "upload_documents",
      "delete_documents",
      "modify_document_properties",
      "share_documents"
    ]
  }
}
```

---

## Platform Admin Override Model

### Mandatory Audit Reason (From Gate 7A-3 Pattern)

**Override Authorization:**
- Only platform_admin, platform_super_admin
- Can bypass permission AND scope checks
- **REQUIRES** valid, non-empty override_reason

**Override Denial:**
- Missing override_reason → DENIED
- Blank/whitespace-only → DENIED
- Null → DENIED
- All denials audited with reason_code: DENY_OVERRIDE_MISSING_REASON

**Override Success:**
- Valid override_reason provided
- Access granted despite permission/scope failures
- Audited with reason_code: PLATFORM_ADMIN_OVERRIDE + override_reason field

### Code Example
```javascript
async getDocumentWithOverride(user, documentId, options = {}) {
  const document = await base44.entities.Document.get(documentId);

  // Check permission/scope normally
  const accessDecision = await documentAccessService.getDocument(user, document);

  if (!accessDecision.allowed) {
    // Platform admin can override
    if (['platform_admin', 'platform_super_admin'].includes(user.role)) {
      const overrideReason = options.override_reason?.trim();
      
      if (!overrideReason) {
        // Deny override attempt
        await auditWriter.recordEvent({
          event_type: 'document_access_override_denied',
          entity_id: documentId,
          actor_email: user.email,
          actor_role: user.role,
          detail: 'Override attempt with missing reason',
          outcome: 'override_denied',
          reason_code: 'DENY_OVERRIDE_MISSING_REASON',
          timestamp: new Date().toISOString()
        });
        return { allowed: false, reason: 'DENY_OVERRIDE_MISSING_REASON' };
      }

      // Allow override with reason
      await auditWriter.recordEvent({
        event_type: 'document_access_override',
        entity_id: documentId,
        actor_email: user.email,
        actor_role: user.role,
        detail: `Platform admin override: ${overrideReason}`,
        outcome: 'override_success',
        reason_code: 'PLATFORM_ADMIN_OVERRIDE',
        override_reason: overrideReason,
        timestamp: new Date().toISOString()
      });

      return { allowed: true, document: safePayload(document), override_applied: true };
    }

    // Non-admin users cannot override
    await auditWriter.recordDenial('document_access_denied', {
      entity_id: documentId,
      actor_email: user.email,
      actor_role: user.role,
      reason: accessDecision.reason
    });
    return { allowed: false, reason: accessDecision.reason };
  }

  return { allowed: true, document: safePayload(document) };
}
```

### Audit Trail
All override attempts (success or denial) must be immutable and retained under platform audit standards.

---

## Backend Contract Design

### Document Access Service

#### Service Methods

```javascript
class DocumentAccessService {
  // Get single document with access control
  async getDocument(user, documentId, options = {})
    → { allowed: boolean, document: SafePayload, reason?: string, override_applied?: boolean }

  // List documents with access control
  async listDocuments(user, filters = {})
    → { documents: SafePayload[], allowed: number, denied: number }

  // Validate upload authorization
  async validateUpload(user, metadata)
    → { allowed: boolean, reason?: string }

  // Validate download authorization
  async validateDownload(user, documentId)
    → { allowed: boolean, reason?: string }

  // Validate delete authorization
  async validateDelete(user, documentId)
    → { allowed: boolean, reason?: string }
}
```

#### Contract Enforcement Points
1. **Permission Layer** (permissionResolver)
   - Is role permitted to action?

2. **Scope Layer** (relationshipScopeResolver)
   - Is relationship ACTIVE?
   - Is visibility_active = true?
   - Is action in allowed_operations?
   - Is action NOT in denied_operations?

3. **Contract Layer** (documentAccessService)
   - Validate all layers
   - Return safe payload only
   - Audit all denials/overrides

---

## File Upload Authorization Flow

### Sequence
```
1. User selects file (frontend)
2. Frontend validates (MIME, size, local checks)
3. Frontend calls uploadDocumentFile(file, metadata)
4. Backend authenticates user (base44.auth.me())
5. Backend validates access:
   - Permission: Can user upload_document?
   - Scope: Can user upload to this broker_agency/relationship?
   - Contract: Access service validates both
6. Backend validates file:
   - MIME type allowed?
   - File size within limit?
   - No executable/unsafe types?
7. Backend uploads to private storage (UploadPrivateFile)
8. Backend creates Document entity with file_uri
9. Backend returns { document_id, file_uri } to frontend
10. Audit logged: document_upload_successful or document_upload_failed
```

### Allowed Document Types
```
Safe/Allowed:
- application/pdf
- application/msword
- application/vnd.openxmlformats-officedocument.wordprocessingml.document
- application/vnd.ms-excel
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- text/csv
- text/plain
- image/jpeg
- image/png
- image/gif

Blocked/Dangerous:
- application/x-executable
- application/x-msdownload
- application/x-msdos-program
- application/x-sh
- application/x-shellscript
- text/x-python
- text/x-perl
- any application/x-* (executables)
```

### File Size Limits
```
Maximum file size: 50 MB per file
Total document storage: 1 GB per broker agency (enforced per agency)
Enforcement: Check before upload, return 413 if exceeded
```

---

## File Download Authorization Flow

### Sequence
```
1. User clicks "Download Document" button (frontend)
2. Frontend calls getDocumentSignedUrl(documentId)
3. Backend authenticates user (base44.auth.me())
4. Backend fetches document (base44.entities.Document.get)
5. Backend validates access:
   - Permission: Can user download_document?
   - Scope: Can user download from this relationship?
   - Contract: Access service validates
6. If access denied → Audit denial, return 403
7. If access denied but platform admin → Check override_reason
   - If override_reason invalid → Deny, audit denial
   - If override_reason valid → Grant, audit override
8. Backend generates signed URL (CreateFileSignedUrl, expires_in=300)
9. Audit logged: document_signed_url_generated
10. Backend returns { signed_url, expires_in } to frontend
11. Frontend redirects to signed URL
12. Browser downloads file from private storage
```

### Access Validation
```
Permission:
  - broker_admin, broker_manager, broker_user: download_document
  - mga_admin, mga_manager, mga_user: download_document (if allowed in scope)
  - platform_admin: unrestricted

Scope (if MGA):
  - Relationship must be ACTIVE
  - visibility_active must be true
  - download_documents must be in allowed_operations
  - download_documents must NOT be in denied_operations

Contract:
  - Safe payload rules applied
  - No file_uri in returned document data
  - Signed URL is temporary (300 sec)
```

---

## Signed URL & Private File Retrieval Rules

### Signed URL Generation
```
Signed URL Characteristics:
- Generated by: CreateFileSignedUrl backend API
- Expires: 300 seconds (5 minutes) from generation
- Not reusable after expiry
- Not shareable (tied to request timestamp)
- Audit logged at generation time
- Not cached by frontend
```

### Retrieval Rules
```
1. Frontend receives signed URL from backend
2. Frontend redirects browser to signed URL
3. Browser downloads directly from private storage
4. Private storage validates signed URL signature
5. If signature valid and not expired → Serve file
6. If signature invalid or expired → 403 Forbidden
7. Frontend never receives or caches signed URL
8. Browser handles all file I/O
```

### Abuse Prevention
```
Shared/leaked signed URL:
  - URL expires after 300 seconds
  - Cannot be reused after expiry
  - Cannot be regenerated by attacker
  - Next download requires new access validation

Download interrupted:
  - User can request new signed URL
  - Each request re-validated for access
  - Audit logged for each attempt

Long-lived URLs:
  - Not issued in this design
  - Signed URLs are strictly time-limited
```

---

## Safe Payload Rules

### Document Payload (Safe Fields Only)

**Returned to frontend:**
```json
{
  "id": "doc123",
  "name": "Insurance Policy 2026",
  "document_type": "proposal",
  "document_classification": "mga_affiliated",
  "uploaded_by": "broker@agency.com",
  "uploaded_date": "2026-05-13T10:30:00Z",
  "notes": "Annual renewal proposal",
  "relationship_id": "rel456",
  "relationship_status": "ACTIVE"
}
```

**NOT returned:**
```
❌ file_uri (private, never exposed)
❌ file_url (not used, private storage only)
❌ file_size (private metadata)
❌ file_mime_type (private metadata)
❌ file_content_hash (private metadata)
❌ storage_location (internal)
❌ signed_url (backend-generated, temporary)
```

### Safe Payload Implementation
```javascript
function createSafeDocumentPayload(document) {
  return {
    id: document.id,
    name: document.name,
    document_type: document.document_type,
    document_classification: document.document_classification,
    uploaded_by: document.uploaded_by,
    uploaded_date: document.created_date,
    notes: document.notes,
    relationship_id: document.mga_relationship_id || undefined,
    relationship_status: document.relationship_status || undefined,
    visibility_scope: document.visibility_scope
  };
}

// Usage in access service
async getDocument(user, documentId, options = {}) {
  // ... validation logic ...
  return {
    allowed: true,
    document: createSafeDocumentPayload(document)  // Safe fields only
  };
}
```

---

## Audit Event Model

### Core Audit Events

| Event Type | Trigger | Fields | Retention |
|------------|---------|--------|-----------|
| document_upload_successful | File uploaded | entity_id, actor_email, actor_role, file_name, file_size, timestamp | Immutable |
| document_upload_failed | Upload failed | actor_email, actor_role, reason, timestamp | Immutable |
| document_signed_url_generated | Signed URL created | entity_id, actor_email, actor_role, expires_in, timestamp | Immutable |
| document_download_initiated | Download button clicked | entity_id, actor_email, actor_role, timestamp | Immutable |
| document_download_completed | File downloaded | entity_id, actor_email, actor_role, timestamp | Immutable |
| document_list_denied | List access denied | actor_email, actor_role, reason_code, timestamp | Immutable |
| document_view_denied | View access denied | entity_id, actor_email, actor_role, reason_code, timestamp | Immutable |
| document_download_denied | Download denied | entity_id, actor_email, actor_role, reason_code, timestamp | Immutable |
| document_delete_denied | Delete denied | entity_id, actor_email, actor_role, reason_code, timestamp | Immutable |
| document_delete_successful | Document deleted | entity_id, deleted_by, reason, timestamp | Immutable |
| document_access_override | Platform admin override | entity_id, actor_email, actor_role, override_reason, timestamp | Immutable |
| document_access_override_denied | Override denied (missing reason) | entity_id, actor_email, actor_role, reason_code, timestamp | Immutable |

### Event Schema
```javascript
{
  event_type: string,          // document_upload_successful, etc.
  entity_id: string,           // Document ID (if applicable)
  actor_email: string,         // User email
  actor_role: string,          // User role at time of event
  action: string,              // upload, download, delete, etc. (optional)
  detail: string,              // Human-readable explanation
  outcome: enum[success|denied|override],  // Result
  reason_code: string,         // DENY_ROLE_LACKS_PERMISSION, etc. (if denied)
  override_reason: string,     // If override applied (optional)
  file_name: string,           // For uploads (optional)
  file_size: number,           // For uploads (optional)
  expires_in: number,          // For signed URLs (optional)
  timestamp: ISO8601,          // Event timestamp
  correlation_id: string       // Links multi-step operations (optional)
}
```

### Audit Writer
```javascript
class AuditWriter {
  async recordEvent(eventData) {
    // Validate event schema
    // Create AuditEvent entity
    // Return immutable record
  }

  async recordDenial(eventType, context) {
    // Helper for denial events
  }

  async recordOverride(context) {
    // Helper for override events with reason validation
  }
}
```

### Retention Policy
**Requirement:** Operator decision 7 — Immutable, retained per platform audit standards.

**Implementation:**
- All events stored in AuditEvent entity (no deletion)
- Indexed by entity_id, actor_email, timestamp
- Queryable for audit reports
- Compliance queries supported (e.g., all overrides in date range)

---

## Feature Flag Matrix

### All Flags Default to False

| Flag Name | Purpose | Default | Phase Activated | Gate |
|-----------|---------|---------|-----------------|------|
| BROKER_AGENCY_DOCUMENTS_ENABLED | Master flag (enables document management) | false | 6L-B.4 | 6L-B |
| DOCUMENT_PRIVATE_FILE_STORAGE_ENABLED | Use private file storage (not public URLs) | false | 6L-B.4 | 6L-B |
| DOCUMENT_RELATIONSHIP_SCOPE_ENABLED | Enforce relationship-bound visibility for MGA | false | 6L-B.4 | 6L-B |
| DOCUMENT_AUDIT_LOGGING_ENABLED | Audit all document access events | false | 6L-B.4 | 6L-B |
| DOCUMENT_SAFE_PAYLOAD_ENABLED | Enforce safe payloads (no private metadata) | false | 6L-B.4 | 6L-B |
| DOCUMENT_PLATFORM_ADMIN_OVERRIDE_ENABLED | Allow platform admin override with audit reason | false | 6L-B.4 | 6L-B |

### Flag Dependencies
```
Master flag (BROKER_AGENCY_DOCUMENTS_ENABLED) must be true for:
  - DOCUMENT_PRIVATE_FILE_STORAGE_ENABLED
  - DOCUMENT_RELATIONSHIP_SCOPE_ENABLED
  - DOCUMENT_AUDIT_LOGGING_ENABLED
  - DOCUMENT_SAFE_PAYLOAD_ENABLED
  - DOCUMENT_PLATFORM_ADMIN_OVERRIDE_ENABLED

All flags checked in:
  - documentAccessService methods
  - uploadDocumentFile function
  - getDocumentSignedUrl function
  - Audit writers
```

### Activation Sequence (Phase 6L-B.4)
```
1. Deploy all backend code with flags all=false
2. Stage 1: DOCUMENT_PRIVATE_FILE_STORAGE_ENABLED = true (dev only)
3. Test upload/download with private storage
4. Stage 2: DOCUMENT_AUDIT_LOGGING_ENABLED = true (dev only)
5. Test audit events
6. Stage 3: DOCUMENT_RELATIONSHIP_SCOPE_ENABLED = true (dev only)
7. Test MGA access control
8. Stage 4: DOCUMENT_SAFE_PAYLOAD_ENABLED = true (all stages)
9. Test payload filtering
10. Stage 5: DOCUMENT_PLATFORM_ADMIN_OVERRIDE_ENABLED = true (all stages)
11. Test override with audit reason
12. Final: BROKER_AGENCY_DOCUMENTS_ENABLED = true (production)
```

---

## File Type & File Size Control Plan

### File Type Whitelist
**Allowed MIME Types:**
```
Documents:
- application/pdf
- application/msword (DOC)
- application/vnd.openxmlformats-officedocument.wordprocessingml.document (DOCX)
- application/vnd.ms-excel (XLS)
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (XLSX)
- text/csv
- text/plain

Images:
- image/jpeg
- image/png
- image/gif (limited, for diagrams only)
```

### File Type Blocking
**Blocked MIME Types (Dangerous):**
```
Executables:
- application/x-executable
- application/x-msdownload
- application/x-msdos-program
- application/x-sh
- application/x-shellscript
- application/x-perl

Scripts:
- text/x-python
- text/x-perl
- text/javascript (unless uploaded as document reference)

Archives:
- application/zip (unless explicitly whitelisted)
- application/x-rar-compressed

Block all: application/x-*
```

### File Size Controls
```
Single file: Max 50 MB
  - Check before upload
  - Return 413 (Payload Too Large) if exceeded
  - Audit log with reason

Per-broker storage: Max 1 GB
  - Check before upload
  - Return 507 (Insufficient Storage) if exceeded
  - Audit log with reason
  - Recommend archival/cleanup

Timeout: 30-second upload timeout
  - Connection drops if upload takes > 30 seconds
  - User can retry
```

### Implementation
```javascript
function validateFileUpload(file_base64, filename, file_size) {
  // Check file size
  if (file_size > 50 * 1024 * 1024) {  // 50 MB
    return { allowed: false, reason: 'FILE_TOO_LARGE' };
  }

  // Check MIME type
  const mime = getMimeType(filename, file_base64);
  const whitelist = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // ... etc
  ];

  if (!whitelist.includes(mime)) {
    return { allowed: false, reason: 'FILE_TYPE_NOT_ALLOWED', mime };
  }

  // Check for dangerous patterns
  if (mime.startsWith('application/x-') || mime.includes('script')) {
    return { allowed: false, reason: 'FILE_TYPE_DANGEROUS' };
  }

  return { allowed: true };
}
```

---

## Deny & Abuse-Case Controls

### Deny Rules (Access Control)

| Rule | Trigger | Action | Audit Event |
|------|---------|--------|-------------|
| DENY_ROLE_LACKS_PERMISSION | User role cannot action | Block | document_*_denied |
| DENY_MISSING_RELATIONSHIP | MGA without mga_relationship_id | Block | document_*_denied |
| DENY_NOT_BROKER_OWNER | Broker doesn't own document | Block | document_*_denied |
| DENY_RELATIONSHIP_SCOPE_DENY_MGA_DIRECT | MGA accessing direct_broker_owned | Block | document_view_denied |
| DENY_RELATIONSHIP_NOT_FOUND | Relationship missing | Block | document_view_denied |
| DENY_RELATIONSHIP_NOT_OWNED | Different MGA owns relationship | Block | document_view_denied |
| DENY_RELATIONSHIP_NOT_ACTIVE | Status ≠ ACTIVE | Block | document_view_denied |
| DENY_RELATIONSHIP_VISIBILITY_INACTIVE | visibility_active = false | Block | document_view_denied |
| DENY_ACTION_NOT_IN_SCOPE | Action not in allowed_operations | Block | document_*_denied |
| DENY_ACTION_DENIED_IN_SCOPE | Action in denied_operations | Block | document_*_denied |
| DENY_FILE_TYPE_UNSAFE | Upload of dangerous file type | Block | document_upload_failed |
| DENY_FILE_SIZE_EXCEEDED | File > 50 MB | Block | document_upload_failed |
| DENY_STORAGE_QUOTA_EXCEEDED | Broker storage > 1 GB | Block | document_upload_failed |
| DENY_OVERRIDE_MISSING_REASON | Platform admin override without reason | Block | document_access_override_denied |

### Abuse-Case Prevention

**Case 1: MGA User Accesses Direct Broker Document**
```
Attack: MGA user tries to access document from broker not in relationship
Defense:
  ✓ Access service checks document_classification
  ✓ If direct_broker_owned → DENY
  ✓ Audit logged: document_view_denied (reason: DENY_RELATIONSHIP_SCOPE_DENY_MGA_DIRECT)
  ✓ No safe payload returned
```

**Case 2: Signed URL Leaked/Shared**
```
Attack: User shares signed URL to unauthorized user
Defense:
  ✓ Signed URL expires in 300 seconds
  ✓ Cannot be reused after expiry
  ✓ New download requires new access validation
  ✓ Cannot be forged (signed by private storage)
```

**Case 3: Platform Admin Override Abuse**
```
Attack: Platform admin overrides access without justification
Defense:
  ✓ Override requires non-empty audit reason
  ✓ Missing reason → DENIED
  ✓ All overrides audited with reason
  ✓ Audit trail immutable (cannot be deleted)
  ✓ Compliance queries show all overrides
```

**Case 4: Dangerous File Upload**
```
Attack: User uploads executable or script file
Defense:
  ✓ MIME type whitelist enforced
  ✓ Dangerous types blocked (application/x-*, scripts)
  ✓ Upload rejected before storage
  ✓ Audit logged: document_upload_failed
```

**Case 5: Large File Denial of Service**
```
Attack: User uploads massive file to exhaust storage
Defense:
  ✓ 50 MB file size limit
  ✓ 1 GB per-broker storage quota
  ✓ Upload rejected if quota exceeded
  ✓ 30-second timeout on uploads
```

**Case 6: Relationship Status Change During Download**
```
Attack: MGA downloads document, then relationship suspended mid-request
Defense:
  ✓ Access validated before signed URL generation
  ✓ Signed URL is final, cannot be revoked
  ✓ User completes download started before suspension
  ✓ Next access validates fresh relationship status
```

---

## Migration & Backfill Handling (Explicitly Deferred)

### Current State
Existing Document records lack:
- broker_agency_id
- document_classification
- mga_relationship_id
- visibility_scope

### Design Phase Only
**No migration execution in 6L-B.2**

**Deferred Strategy:** Lazy migration
1. New documents use new schema
2. Old documents accessible via legacy path
3. Gradual migration as documents re-uploaded
4. No data mutation required

### Backfill Plan (For Future Phases)
**If separate operator approval required:**

```
Step 1: Dry-run migration
  - Query all Document records
  - Attempt classification for each
  - Identify records requiring manual intervention
  - Report blocking factors

Step 2: Classification logic
  - Set document_classification = "direct_broker_owned" (safest)
  - Set mga_relationship_id = null
  - Set visibility_scope = "broker_only"
  - Preserve broker_agency_id from case/employer relationship

Step 3: Validation
  - Verify no data loss
  - Confirm all records classified
  - Test access with backfilled data

Step 4: Production migration
  - Execute in batches (1000 records per batch)
  - Monitor for failures
  - Rollback on issues
  - Audit log migration events
```

### Blockers to Migration
- Cannot determine broker_agency_id: Requires case/employer lookup
- Orphaned documents (case/employer deleted): Manual review required
- Conflicting classifications: Manual judgment needed

### Decision Point
**Backfill requires separate operator authorization. Not part of 6L-B.2.**

---

## Test Plan with Estimated Count

### Unit Tests (Backend Logic)

**Module: Document Classification Resolver**
```
1. Classify direct_broker_owned (no relationship)
2. Classify mga_affiliated (with relationship)
3. Classify platform_admin (creator role)
4. Determine visibility_scope for each
Total: 8 tests
```

**Module: File Upload Validation**
```
1. Validate MIME type (allowed)
2. Reject dangerous MIME type
3. Reject oversized file (>50 MB)
4. Validate filename parsing
5. Detect file size injection
Total: 8 tests
```

**Module: Access Control (Permission Layer)**
```
1. Broker user can access own document
2. Broker user denied other broker's document
3. MGA user denied without relationship
4. Platform admin unrestricted access
5. Different role permissions (admin vs user)
Total: 10 tests
```

**Module: Access Control (Scope Layer)**
```
1. MGA allowed (relationship ACTIVE, visibility_active, action in scope)
2. MGA denied (relationship PROPOSED)
3. MGA denied (visibility_active = false)
4. MGA denied (action in denied_operations)
5. Broker unaffected by relationship status
Total: 10 tests
```

**Module: Platform Admin Override**
```
1. Override allowed with valid reason
2. Override denied (missing reason)
3. Override denied (blank reason)
4. Non-admin cannot override
5. Override audit logged
6. Override denial audit logged
Total: 10 tests
```

**Module: Safe Payload**
```
1. Safe fields returned (id, name, document_type)
2. file_uri NOT returned
3. file_size NOT returned
4. file_mime_type NOT returned
5. Signed URL NOT in payload
Total: 8 tests
```

**Module: Audit Event Writer**
```
1. Upload success audited
2. Access denied audited with reason_code
3. Override audited with reason
4. Override denial audited
5. Event immutability enforced
Total: 8 tests
```

**Unit Test Total: 62 tests**

### Integration Tests (Cross-Module Workflows)

**Workflow: File Upload to Download**
```
1. Upload private file → Store file_uri
2. Generate signed URL → Validate access first
3. Download via signed URL → Success
4. URL expires → New access validation required
Total: 4 tests
```

**Workflow: Broker Direct Documents**
```
1. Broker uploads document
2. Document classified direct_broker_owned
3. Same broker can download
4. Different broker denied
5. MGA denied (no relationship)
Total: 5 tests
```

**Workflow: MGA-Affiliated Documents**
```
1. Relationship ACTIVE, document mga_affiliated
2. MGA can list documents
3. MGA can download (within scope)
4. MGA denied deletion (denied_operation)
5. Relationship becomes SUSPENDED
6. MGA access revoked (new request)
Total: 6 tests
```

**Workflow: Platform Admin Override**
```
1. Non-admin denied access
2. Platform admin override with reason
3. Audit trail shows override
4. Platform admin override denied (no reason)
5. Reason validation immutable
Total: 5 tests
```

**Workflow: Large Document Library**
```
1. List 100 documents (broker)
2. Filter by relationship (MGA)
3. Pagination works correctly
4. Access control per document enforced
5. Performance acceptable (< 2 sec)
Total: 5 tests
```

**Workflow: Audit Trail**
```
1. Upload → Upload event logged
2. Download → Signed URL generation logged
3. Access denied → Denial logged with reason_code
4. Override → Override logged with reason
5. Compliance query (all overrides in date range)
Total: 5 tests
```

**Integration Test Total: 30 tests**

### Contract Tests (Service Boundaries)

**Contract: DocumentAccessService**
```
1. getDocument returns safe payload
2. getDocument denies with reason_code
3. listDocuments filters correctly (broker)
4. listDocuments filters correctly (MGA)
5. validateUpload enforces permission
6. validateDownload enforces scope
7. validateDelete enforces denied_operations
Total: 7 tests
```

**Contract: File Upload/Download Services**
```
1. uploadDocumentFile private storage only
2. getDocumentSignedUrl time-limited (300 sec)
3. getDocumentSignedUrl requires valid access
4. Signed URL expires correctly
5. Backend generates URL, not frontend
Total: 5 tests
```

**Contract: Audit Writer**
```
1. recordEvent creates immutable record
2. Event schema validated
3. Timestamp set to server time
4. Correlation ID links related events
Total: 4 tests
```

**Contract Test Total: 16 tests**

### Feature Flag Tests

**Flag: BROKER_AGENCY_DOCUMENTS_ENABLED**
```
1. When false: All document routes blocked
2. When true: Routes accessible
3. Works with other flags (dependencies)
Total: 3 tests
```

**Flag: DOCUMENT_PRIVATE_FILE_STORAGE_ENABLED**
```
1. When false: Uses public URLs (legacy path)
2. When true: Uses private storage + signed URLs
Total: 2 tests
```

**Flag: DOCUMENT_RELATIONSHIP_SCOPE_ENABLED**
```
1. When false: No relationship scope checks
2. When true: MGA scope validated
Total: 2 tests
```

**Other Flags: AUDIT_LOGGING, SAFE_PAYLOAD, OVERRIDE**
```
1. Each flag independently toggleable
2. Master flag controls all
Total: 3 tests
```

**Feature Flag Test Total: 10 tests**

### Abuse-Case / Security Tests

```
1. MGA cannot access direct_broker_owned documents
2. Leaked signed URL expires (cannot be reused)
3. Platform admin override requires reason
4. Dangerous file types blocked
5. Large file uploads rejected
6. Relationship status change revokes access (next request)
7. Raw entity reads blocked (frontend never receives file_uri)
8. Audit trail immutable (no deletion possible)
9. Signed URL cannot be forged
10. Safe payload enforces no metadata leakage
Total: 10 tests
```

### Regression Tests

```
1. Gate 7A-3 relationship access unchanged
2. Gate 7A-0 broker direct access unchanged
3. Platform admin override from 7A-3 still works
4. Safe payloads from 7A-3 pattern maintained
5. Audit logging compatible with prior gates
Total: 5 tests
```

### Test Summary
```
Unit Tests:                   62
Integration Tests:            30
Contract Tests:               16
Feature Flag Tests:           10
Abuse-Case / Security Tests:  10
Regression Tests:             5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Estimated: 133 tests
```

**Actual Phase 6L-B.2 Testing: 133 tests (backend only)**

**Phase 6L-B.3 (Frontend) will add ~77 additional tests → Total 210 tests for gates 6L-B.2 + 6L-B.3**

---

## Rollback Plan

### Staged Rollback (If Issues Detected)

**Stage 1: Feature Flags Off**
```
Action: Disable all feature flags
  - BROKER_AGENCY_DOCUMENTS_ENABLED = false
  - All document feature flags = false

Result: Document management disabled, legacy path active
Impact: Users fall back to prior document handling
Time: Immediate (< 1 minute)
Data: No loss, all new data preserved
```

**Stage 2: Stop New Document Creation**
```
Action: Disable uploadDocumentFile function
  - Return 503 (Service Unavailable)
  - Audit log: "Document uploads temporarily disabled for maintenance"

Result: No new documents created, existing accessible
Impact: Users cannot upload, but downloads work
Time: Immediate
Data: No loss
```

**Stage 3: Disable Downloads (If File Corruption)**
```
Action: Disable getDocumentSignedUrl function
  - Return 503 (Service Unavailable)

Result: No access to documents
Impact: Users cannot view/download
Time: Immediate
Data: No loss
```

**Stage 4: Restore Legacy Path**
```
Action: Activate legacy document entity (if exists)
  - Use prior Document schema
  - Revert to public URLs

Result: Users back to previous experience
Impact: Full restoration
Time: 5-15 minutes (requires code change)
Data: New data not accessible, but not lost
```

### Data Recovery (If Data Loss Detected)

```
1. Identify affected documents (by creation date range)
2. Restore from backup
3. Reconcile with new data created after backup
4. Manual merge if necessary
5. Audit trail documents recovery
```

### Communication

```
1. Detect issue → Alert ops team
2. Disable feature flags immediately
3. Investigate root cause
4. Notify affected users
5. Re-enable when fixed
6. Post-mortem & prevention steps
```

### Rollback Triggers

- Critical access control bypass
- Data corruption in audit trail
- File storage unavailable (50%+ failures)
- Audit logging failures (> 100 events lost)
- Signed URL signature validation failures
- MGA accessing direct broker documents
- Private file metadata leakage

---

## Implementation Sequence

### Phase 6L-B.2.1: Backend Service Layer (Weeks 1-2)
```
1. Update Document entity schema
   - Add broker_agency_id
   - Add document_classification
   - Add mga_relationship_id
   - Add visibility_scope
   - Add visibility_active
   - Add relationship_status

2. Create documentClassificationResolver
   - Implement classification logic

3. Create documentAccessService
   - getDocument, listDocuments
   - validateUpload, validateDownload
   - Permission + scope + contract enforcement

4. Create file upload service
   - Validate MIME type, size
   - Call UploadPrivateFile
   - Store file_uri in Document
   - Audit logging

5. Create signed URL service
   - Call CreateFileSignedUrl
   - Enforce access validation first
   - Audit logging

6. Create auditWriter extensions
   - Document-specific events
   - Immutable storage
```

### Phase 6L-B.2.2: Audit & Test Infrastructure (Weeks 2-3)
```
1. Implement audit event model
   - AuditEvent entity updates
   - Event schema validation

2. Create test fixtures
   - Sample documents
   - Test relationships
   - Test users

3. Implement unit tests (62 tests)
   - Classification logic
   - File validation
   - Access control
   - Override logic
   - Safe payload
   - Audit events

4. Implement integration tests (30 tests)
   - Full workflows
   - Relationship changes
   - Override flow
   - Library operations

5. Implement contract tests (16 tests)
   - Service boundaries
   - Safe payloads
   - Immutability
```

### Phase 6L-B.2.3: Feature Flags & Backend Functions (Weeks 3-4)
```
1. Define feature flag matrix
   - 6 flags, all default false
   - Dependencies: Master flag controls others

2. Create backend functions
   - uploadDocumentFile(file, metadata)
   - getDocumentSignedUrl(documentId)
   - listDocuments(filters)
   - deleteDocument(documentId, reason)
   - getDocumentAuditTrail(documentId)

3. Add flag checks to functions
   - Early return if BROKER_AGENCY_DOCUMENTS_ENABLED = false
   - Detailed logging when flags prevent action

4. Implement 10 feature flag tests
```

### Phase 6L-B.2.4: Security & Abuse-Case Testing (Weeks 4-5)
```
1. Implement abuse-case tests (10 tests)
   - MGA access to direct documents
   - Signed URL expiry/reuse
   - Override reason validation
   - File type blocking
   - Storage quota

2. Implement regression tests (5 tests)
   - Gate 7A-3 compatibility
   - Gate 7A-0 backward compatibility

3. Security review
   - Access control bypass testing
   - Data leakage testing
   - Audit trail integrity testing

4. Performance testing
   - Large document libraries (1000+ docs)
   - Concurrent uploads
   - Signed URL generation under load
```

### Phase 6L-B.2.5: Documentation & Readiness (Weeks 5-6)
```
1. Complete backend design documentation
   - Architecture diagrams
   - Data flow diagrams
   - Contract specifications

2. Create operator runbook
   - Feature flag activation sequence
   - Troubleshooting guide
   - Rollback procedures

3. Prepare for Phase 6L-B.3 handoff
   - Frontend requirements
   - API documentation
   - Test data/fixtures

4. Final review and operator approval block
```

### Parallel: Ongoing Activities
```
- Code review (daily)
- Documentation updates (per change)
- Dependency management (as needed)
- Team communication (weekly)
```

---

## Stop Conditions

### Implementation Must Stop If

1. **Access Control Bypass Found**
   - MGA can access direct broker documents
   - Broker can access other broker's documents
   - Result: Halt, investigate, fix, re-test

2. **Audit Trail Integrity Failure**
   - Events can be deleted or modified
   - Events missing from trail
   - Result: Halt, investigate, review immutability design

3. **File Metadata Leakage**
   - file_uri exposed to frontend
   - Signed URL included in document payload
   - Result: Halt, review safe payload enforcement

4. **Signed URL Forge/Replay**
   - Attacker can forge valid signed URL
   - Expired URL accepted by storage
   - Result: Halt, review signature validation

5. **Dangerous File Upload Not Blocked**
   - Executable uploaded and stored
   - Script file accessible via signed URL
   - Result: Halt, review MIME type enforcement

6. **Relationship Scope Not Enforced**
   - MGA accesses denied_operation (e.g., delete)
   - Relationship scope definition ignored
   - Result: Halt, review scope resolver integration

7. **Private Storage Unavailable**
   - UploadPrivateFile fails consistently
   - CreateFileSignedUrl unavailable
   - Result: Halt, switch to rollback plan

8. **Test Coverage Below 90%**
   - Code coverage < 90%
   - Critical paths untested
   - Result: Halt, add tests before proceeding

### If Stop Condition Triggered
```
1. Immediately notify operator
2. Disable all document feature flags
3. Preserve all data
4. Begin investigation
5. Document root cause
6. Implement fix
7. Re-test thoroughly
8. Seek operator re-approval before proceeding
```

---

## Operator Approval Block

### ⛔ IMPLEMENTATION BLOCKED UNTIL OPERATOR APPROVAL

**This phase (6L-B.2 Backend Infrastructure) is **DESIGN & PLANNING ONLY**.

**No runtime code execution until:**

1. ✅ Operator reviews this work order
2. ✅ Operator confirms all operator decisions incorporated
3. ✅ Operator approves backend contract design
4. ✅ Operator approves test plan (133 tests)
5. ✅ Operator approves feature flag matrix (all false)
6. ✅ Operator approves rollback plan
7. ✅ Operator approves implementation sequence
8. ✅ Operator explicitly authorizes Phase 6L-B.2 implementation start

**Only then may Phase 6L-B.2 backend implementation begin.**

---

## Guardrails Verification

### ✅ Mandatory Guardrails (6L-B.2 Design Phase)

✅ **No runtime code implemented yet**
- Only design and planning in this phase
- No functions deployed
- No code changes to production

✅ **No routes exposed**
- Backend functions not created yet
- No /documents routes
- No API endpoints live

✅ **No feature flags activated**
- All 6 flags default to false
- No runtime feature activation
- Design phase only

✅ **No public file URLs**
- Private storage architecture designed
- Signed URLs time-limited in design
- No public URLs in data model

✅ **No raw frontend entity reads**
- Safe payload rules defined
- Access service enforces contract
- Design prevents entity access from frontend

✅ **No private file metadata leakage**
- file_uri not in safe payload
- file_size not in safe payload
- Signed URL server-generated only

✅ **Gate 7A-3 relationship access preserved**
- Design leverages scope/permission resolvers
- No weakening of relationship-bound access
- Safe payload enforcement maintained

✅ **No MGA access to direct broker documents**
- Classification resolver distinguishes types
- Access service blocks MGA from direct_broker_owned
- Audit logs deny events

✅ **Gates 6I-B, 6J-B, 6J-C remain deferred & untouched**
- No integration, no dependencies
- Explicitly not in scope
- Future separate authorization path

---

## Completion Report

**Gate 6L-B.2 Backend Infrastructure Work Order Created** ✅

| Item | Status |
|------|--------|
| File Created | ✅ docs/GATE_6L_B_BROKER_AGENCY_DOCUMENTS_BACKEND_INFRASTRUCTURE_WORK_ORDER.md |
| Scope Summary | ✅ Backend design, contracts, services, test plan (133 tests) |
| Private Storage Recommendation | ✅ Private-only (UploadPrivateFile + signed URLs) |
| Contract Surfaces Proposed | ✅ 3 services (access, upload, signed URL) + audit writer |
| Feature Flags Proposed | ✅ 6 flags (all default false, dependency-aware) |
| Estimated Test Count | ✅ 133 tests (backend unit + integration + contract + feature flags + security + regression) |
| Key Risks & Controls | ✅ 6 risks identified, controls specified for each |
| Runtime Code Changed | ✅ NONE — Design phase only |
| Routes Exposed | ✅ NONE — Design phase only |
| Feature Flags Activated | ✅ NONE — All remain false |
| Gates 6I-B, 6J-B, 6J-C Status | ✅ REMAIN DEFERRED & UNTOUCHED |

**⛔ OPERATOR APPROVAL REQUIRED before Phase 6L-B.2 implementation begins** ⛔

Awaiting operator review, confirmation of operator decisions integration, and explicit authorization to proceed with backend implementation.