# Connect Quote 360: Base44 Integration Architecture
**Version:** 2.0 | **Date:** 2026-03-21 | **Scope:** Align with Base44 native platform patterns

---

## SECTION 1: BASE44 PLATFORM ALIGNMENT

### 1.1 Entity Integration with Base44 Backend

Connect Quote 360 leverages Base44's **built-in backend as a service** (no custom servers):

```typescript
// Base44 Native: Entities stored in Base44 database
// No custom REST API needed; Base44 SDK handles CRUD automatically

import { base44 } from "@/api/base44Client";

// ============================================================================
// ENTITY OPERATIONS (Base44 Native)
// ============================================================================

// Create case (Base44 auto-generates ID, created_at, created_by)
const newCase = await base44.entities.BenefitCase.create({
  agency_id: "agc_...",
  employer_group_id: "egp_...",
  case_type: "new_business",
  effective_date: "2026-06-01",
  employee_count: 250,
  products_requested: ["medical", "dental"]
  // Base44 auto-adds: id, created_at, updated_at, created_by (from auth)
});

// Read case (with caching via Base44)
const caseData = await base44.entities.BenefitCase.get(caseId);
// Base44 caches automatically (Redis backend)

// Update case (optimistic locking via version field)
const updated = await base44.entities.BenefitCase.update(caseId, {
  case_status: "census_validated",
  _version: 1  // Conflict detection if another user modified
});

// Filter cases by agency (queryable)
const cases = await base44.entities.BenefitCase.filter(
  { agency_id: "agc_...", case_status: "active" },
  "-created_at",  // Sort by created_at DESC
  100  // Limit
);

// Real-time subscriptions (webhook-like)
const unsubscribe = base44.entities.BenefitCase.subscribe((event) => {
  console.log(`Case ${event.id} was ${event.type}d`);
  // event.type: 'create' | 'update' | 'delete'
  // event.data: updated entity data
});
```

### 1.2 Business Logic Layer (Services)

Base44 **backend functions** handle complex logic (async, long-running):

```typescript
// File: functions/processGradientAI.js (Deno)
// This is ALREADY in the codebase - leverage existing pattern

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { census_version_id } = await req.json();
  
  // Step 1: Fetch census members from Base44
  const members = await base44.entities.CensusMember.filter({
    census_version_id
  }, undefined, 1000);
  
  // Step 2: Call GradientAI (external integration)
  const riskScores = await callGradientAI(members);
  
  // Step 3: Update members with risk data (Base44 SDK)
  for (const member of members) {
    await base44.entities.CensusMember.update(member.id, {
      gradient_ai_data: riskScores[member.id]
    });
  }
  
  // Step 4: Create exceptions for high-risk members
  const highRisk = members.filter(m => 
    riskScores[m.id].risk_score > 75
  );
  for (const member of highRisk) {
    await base44.entities.ExceptionItem.create({
      case_id: member.case_id,
      category: "census",
      severity: "high",
      title: `High-risk member: ${member.first_name} ${member.last_name}`,
      description: `GradientAI risk score: ${riskScores[member.id].risk_score}`,
      entity_type: "CensusMember",
      entity_id: member.id
    });
  }
  
  return Response.json({
    status: "success",
    members_analyzed: members.length,
    high_risk_count: highRisk.length
  });
});
```

### 1.3 Frontend Integration (React Components)

Connect Quote 360 pages use **Base44 auth + data bindings**:

```typescript
// File: pages/CaseDetail.jsx
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";

export default function CaseDetailPage({ caseId }) {
  // Query: Base44 data with caching
  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ["case", caseId],
    queryFn: () => base44.entities.BenefitCase.get(caseId)
  });
  
  // Mutation: Update case status (with optimistic locking)
  const { mutate: updateStatus } = useMutation({
    mutationFn: (newStatus) =>
      base44.entities.BenefitCase.update(caseId, {
        case_status: newStatus,
        _version: caseData.version
      }),
    onSuccess: () => {
      // Invalidate cache; Base44 will trigger subscription updates
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
    },
    onError: (error) => {
      if (error.status === 409) {
        // Conflict: case modified by another user
        toast.error("Case was modified by another user. Refresh to see changes.");
      }
    }
  });
  
  // Real-time sync (base44 subscriptions)
  const [realtimeData, setRealtimeData] = useState(null);
  useEffect(() => {
    const unsubscribe = base44.entities.CensusMember.subscribe((event) => {
      if (event.data.case_id === caseId && event.type === "create") {
        // New census member added in real-time
        setRealtimeData(event.data);
      }
    });
    return unsubscribe;
  }, [caseId]);
  
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <div>
      <h1>{caseData.employer_name}</h1>
      <p>Status: {caseData.case_status}</p>
      <button onClick={() => updateStatus("census_uploading")}>
        Start Census Upload
      </button>
    </div>
  );
}
```

---

## SECTION 2: WORKFLOWS ALIGNED WITH BASE44 PATTERNS

### 2.1 Case Creation Workflow (With Base44 Automations)

```typescript
// File: functions/onCaseCreated.js
// Trigger: Entity automation → case created

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { event, data } = await req.json();
  // event = { type: "create", entity_name: "BenefitCase", entity_id: "cs_..." }
  // data = the case object
  
  const newCase = data;
  const user = await base44.auth.me();
  
  // Step 1: Auto-create default tasks
  await base44.entities.CaseTask.create({
    case_id: newCase.id,
    title: "Upload census data",
    task_type: "action_required",
    priority: "high",
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60000).toISOString().split('T')[0],
    assigned_to: newCase.assigned_to
  });
  
  // Step 2: Send notification email
  await base44.integrations.Core.SendEmail({
    to: newCase.assigned_to,
    subject: `New case created: ${newCase.employer_name}`,
    body: `Case ${newCase.case_number} is ready for census upload.\nEffective date: ${newCase.effective_date}`
  });
  
  // Step 3: Log activity
  await base44.entities.ActivityLog.create({
    case_id: newCase.id,
    actor_email: user.email,
    action: "CASE_CREATED",
    entity_type: "BenefitCase",
    entity_id: newCase.id,
    new_value: JSON.stringify(newCase)
  });
  
  return Response.json({ status: "success" });
});
```

### 2.2 Census Validation Workflow (Async Job)

```typescript
// File: functions/validateCensus.js
// Called from: Census upload modal → invoke function

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { census_version_id, case_id } = await req.json();
  
  // Fetch all members in this version
  const members = await base44.entities.CensusMember.filter(
    { census_version_id },
    undefined,
    10000
  );
  
  const validationResults = {
    total: members.length,
    valid: 0,
    errors: [],
    warnings: []
  };
  
  // Validate each member against rules
  for (const member of members) {
    const result = validateCensusMember(member);
    
    if (result.isValid) {
      validationResults.valid++;
      // Update validation status
      await base44.entities.CensusMember.update(member.id, {
        validation_status: "valid"
      });
    } else {
      // Mark as error
      await base44.entities.CensusMember.update(member.id, {
        validation_status: "has_errors",
        validation_issues: result.errors
      });
      validationResults.errors.push({
        employee_id: member.employee_id,
        issues: result.errors
      });
    }
  }
  
  // Update census version status
  await base44.entities.CensusVersion.update(census_version_id, {
    status: validationResults.errors.length === 0 ? "validated" : "has_issues",
    validation_errors: validationResults.errors.length,
    validated_at: new Date().toISOString()
  });
  
  return Response.json(validationResults);
});

function validateCensusMember(member) {
  const errors = [];
  
  // Required fields
  if (!member.first_name) errors.push({ field: "first_name", code: "REQUIRED" });
  if (!member.last_name) errors.push({ field: "last_name", code: "REQUIRED" });
  if (!member.date_of_birth) errors.push({ field: "date_of_birth", code: "REQUIRED" });
  
  // Format validation
  const age = new Date().getFullYear() - new Date(member.date_of_birth).getFullYear();
  if (age < 18 || age > 120) {
    errors.push({ field: "date_of_birth", code: "INVALID_AGE" });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### 2.3 GradientAI Risk Scoring (Async, Queued)

```typescript
// File: functions/enrichWithRiskScores.js
// Queued async (expensive external API call)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { census_version_id, case_id } = await req.json();
  
  // Fetch members
  const members = await base44.entities.CensusMember.filter(
    { census_version_id },
    undefined,
    10000
  );
  
  // Batch call to GradientAI (10 at a time to avoid timeouts)
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);
    
    try {
      // Call GradientAI API (via integration or direct)
      const gradientResponse = await callGradientAI(batch);
      results.push(...gradientResponse.scores);
      
      // Update each member with risk score
      for (const score of gradientResponse.scores) {
        await base44.entities.CensusMember.update(score.member_id, {
          gradient_ai_data: {
            risk_score: score.risk_score,
            risk_tier: score.risk_tier,
            predicted_annual_claims: score.predicted_claims,
            confidence_score: score.confidence,
            analyzed_at: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error(`GradientAI error on batch ${i}:`, error);
      // Log error but continue with next batch
      await base44.entities.ExceptionItem.create({
        case_id,
        category: "system",
        severity: "medium",
        title: "GradientAI batch processing failed",
        description: `Batch ${i}-${i + batchSize} failed: ${error.message}`
      });
    }
  }
  
  // Update census version
  await base44.entities.CensusVersion.update(census_version_id, {
    status: "validated"  // Risk scoring complete
  });
  
  // Create exceptions for high-risk members
  const highRiskMembers = results.filter(r => r.risk_score > 75);
  for (const member of highRiskMembers) {
    await base44.entities.ExceptionItem.create({
      case_id,
      category: "census",
      severity: "high",
      title: `High-risk member detected: ${member.name}`,
      description: `Risk score: ${member.risk_score}, Predicted annual claims: $${member.predicted_claims}`,
      suggested_action: "Review with employer, consider wellness program",
      entity_type: "CensusMember",
      entity_id: member.member_id
    });
  }
  
  return Response.json({
    members_scored: results.length,
    high_risk_count: highRiskMembers.length,
    average_risk_score: results.reduce((a, b) => a + b.risk_score, 0) / results.length
  });
});
```

---

## SECTION 3: AUTOMATIONS SETUP (Base44 Native)

### 3.1 Entity Automations Configuration

```typescript
// Automation 1: Auto-create tasks when case created
const automation1 = await base44.createAutomation({
  automation_type: "entity",
  name: "Auto-create tasks on case creation",
  function_name: "onCaseCreated",
  entity_name: "BenefitCase",
  event_types: ["create"]
});

// Automation 2: Validate census when version created
const automation2 = await base44.createAutomation({
  automation_type: "entity",
  name: "Validate census on upload",
  function_name: "validateCensus",
  entity_name: "CensusVersion",
  event_types: ["create"],
  function_args: {
    // Optional args passed to function
  }
});

// Automation 3: Trigger GradientAI scoring when census validated
const automation3 = await base44.createAutomation({
  automation_type: "entity",
  name: "Enrich with GradientAI scores",
  function_name: "enrichWithRiskScores",
  entity_name: "CensusVersion",
  event_types: ["update"],
  function_args: {
    trigger_on_status: "validated"  // Only if status changes to "validated"
  }
});
```

### 3.2 Scheduled Automations (Daily/Weekly)

```typescript
// Automation 4: Send renewal reminders (daily)
await base44.createAutomation({
  automation_type: "scheduled",
  name: "Send renewal reminders",
  function_name: "sendRenewalReminders",
  repeat_interval: 1,
  repeat_unit: "days",
  start_time: "08:00",  // 8 AM PT
  schedule_type: "simple"
});

// Automation 5: Expire proposals weekly
await base44.createAutomation({
  automation_type: "scheduled",
  name: "Mark expired proposals",
  function_name: "expireProposals",
  repeat_interval: 1,
  repeat_unit: "weeks",
  repeat_on_days: [1],  // Monday
  start_time: "00:00",
  schedule_type: "simple"
});
```

---

## SECTION 4: NAMING CONVENTIONS (Base44 + Connect Quote 360)

### 4.1 Consistent Naming Pattern

```typescript
// FILE STRUCTURE:
// pages/[Page Name].jsx          (React pages)
// components/[Feature]/[Component].jsx  (Components)
// functions/[functionName].js    (Backend functions - camelCase)
// entities/[EntityName].json     (Entity schemas - PascalCase)

// ENTITY NAMING:
// Primary entity: PascalCase
//   BenefitCase, CensusMember, QuoteScenario, EnrollmentWindow

// ID FIELD: id (lowercase, generated by Base44)
// TIMESTAMPS: created_at, updated_at (UTC, DATETIME)
// STATUS: {entity}_status (lowercase enum)
//   case_status: "draft" | "active" | "closed"
//   enrollment_status: "invited" | "started" | "completed"

// FUNCTION NAMING: camelCase, action-based
//   onCaseCreated        (automation trigger)
//   enrichWithRiskScores (data enrichment)
//   validateCensus       (validation)
//   generateProposal     (business logic)

// API ENDPOINT PATTERN:
// POST   /cases                   (create case)
// GET    /cases/{caseId}          (get case)
// PATCH  /cases/{caseId}          (update case)
// POST   /cases/{caseId}/advance-stage  (action endpoint)
// POST   /cases/{caseId}/census/upload  (file upload)

// QUERY FILTER PATTERN:
// Filter by agency_id (required for multi-tenant isolation)
// Sort by created_at DESC (chronological)
// Pagination: limit, offset

const cases = await base44.entities.BenefitCase.filter(
  { agency_id: "agc_...", case_status: "active" },
  "-created_at",   // Sort desc by created_at
  50              // Limit to 50
);
```

### 4.2 Consistent Error Handling

```typescript
// Error Codes (machine-readable, prefixed with entity)
const ERROR_CODES = {
  CENSUS_VALIDATION_FAILED: "Validation failed for census",
  CENSUS_DUPLICATE_EMPLOYEE_ID: "Duplicate employee ID in census",
  QUOTE_NOT_FOUND: "Quote scenario not found",
  ENROLLMENT_ALREADY_COMPLETED: "Enrollment already completed",
  CASE_STATUS_INVALID_TRANSITION: "Invalid status transition",
  UNAUTHORIZED_ACCESS: "Insufficient permissions"
};

// Response format (consistent across all endpoints)
const errorResponse = {
  status: "error",
  error: {
    code: "CENSUS_VALIDATION_FAILED",
    message: "10 validation errors found",
    details: {
      field: "first_name",
      row: 5,
      message: "Required field missing"
    }
  },
  metadata: {
    request_id: "req_...",
    timestamp: "2026-03-21T14:32:00Z"
  }
};
```

---

## SECTION 5: BASE44 FEATURES LEVERAGE

### 5.1 Authentication (Base44 Native)

```typescript
// No custom auth needed - Base44 handles OAuth, login, roles

import { useAuth } from "@/lib/AuthContext";

export default function MyComponent() {
  const { user } = useAuth();
  // user = { email, full_name, role, id }
  // role = "admin" | "user" or custom (broker, employer, etc.)
  
  // Check permissions
  if (user.role !== "admin") {
    return <Unauthorized />;
  }
  
  // Use user in database operations
  const cases = await base44.entities.BenefitCase.filter({
    assigned_to: user.email
  });
}
```

### 5.2 File Storage (Base44 Native)

```typescript
// Upload file (census CSV)
const { file_url } = await base44.integrations.Core.UploadFile({
  file: csvFile
});

// Store URL in CensusVersion entity
await base44.entities.CensusVersion.create({
  case_id: caseId,
  file_url,  // Public URL
  file_name: "employee_roster.csv"
});

// If using private file storage (PII):
const { file_uri } = await base44.integrations.Core.UploadPrivateFile({
  file: sensitiveFile
});

// Later: Create signed URL for download
const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
  file_uri,
  expires_in: 3600  // 1 hour
});
```

### 5.3 Email (Base44 Native)

```typescript
// Send email via Base44 SMTP
await base44.integrations.Core.SendEmail({
  to: "broker@example.com",
  subject: "Quote ready: Acme Corp",
  body: "Your quote for Acme Corp (250 employees) is ready.\nLink: https://..."
});

// Template emails: Use backend functions to send contextual emails
// No custom email service needed
```

---

**COMPLETE: Base44-aligned integration architecture with native entity handling, automations, and consistent naming throughout Connect Quote 360.**