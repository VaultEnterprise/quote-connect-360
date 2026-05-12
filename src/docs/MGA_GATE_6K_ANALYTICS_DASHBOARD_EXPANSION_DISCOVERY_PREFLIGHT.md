# MGA Gate 6K — Analytics Dashboard Expansion
## Discovery & Preflight Report

**Date:** 2026-05-12  
**Status:** DISCOVERY_PREFLIGHT  
**Phase:** 6 (Post Gate 6J-A Lock)  
**Recommended Action:** Design Specification (pending approval)  

---

## Executive Summary

Gate 6K proposes a controlled, read-only analytics dashboard layer for MGA administrators and managers. This gate aggregates metrics from existing validated entities (Cases, Invites, TXQuotes, Exports, Delivery Governance) without exposing raw data, signed URLs, private file URIs, or exported content.

**Key Principles:**
- ✅ Read-only aggregation (no create/update/delete)
- ✅ Scope-safe queries (MGA/Broker-Agency isolation)
- ✅ Existing validated data only (no new storage)
- ✅ Permissioned visibility (role-based dashboard widgets)
- ✅ No external delivery (email, webhooks, background jobs)
- ✅ No signed URLs or private file URIs
- ✅ No schema migration or entity renaming

---

## Proposed Scope

### 1. MGA Command Analytics (Gate 6A)
**Metrics:**
- Total users by role (mga_admin, mga_manager, mga_user, mga_read_only)
- User invites sent (last 7, 30 days)
- Active users (last login)
- Cross-MGA access attempts (blocked count)

**Data Source:** User entity activity logs  
**Visibility:** mga_admin, platform_super_admin  
**Isolation:** Per-MGA scoped  

---

### 2. Broker / Agency Lifecycle Metrics (Gate 6H)
**Metrics:**
- Total Broker/Agency organizations (active, inactive, suspended)
- Lifecycle events (created, edited, deactivated, reactivated)
- Contact count by Broker/Agency
- Settings update frequency

**Data Source:** MasterGroup entity + activity logs  
**Visibility:** mga_admin, platform_super_admin  
**Isolation:** Per-MGA scoped  

---

### 3. Broker / Agency Contact & Settings Metrics (Gate 6L-A)
**Metrics:**
- Total contacts by type (primary, billing, operations, compliance, technical)
- Contact status (active, deactivated)
- Settings update history (notification preferences, defaults, notes)
- Last modification timestamp

**Data Source:** BrokerAgencyContact entity + activity logs  
**Visibility:** mga_admin, mga_manager, platform_super_admin  
**Isolation:** Per-MGA and per-Broker/Agency scoped  

---

### 4. Invite Metrics (Gate 6F)
**Metrics:**
- Total invites sent (by role, by Broker/Agency)
- Invite acceptance rate (%)
- Invite expiration rate (%)
- Pending invites by recipient

**Data Source:** User invitations + activity logs  
**Visibility:** mga_admin, platform_super_admin  
**Isolation:** Per-MGA scoped  

---

### 5. TXQuote Transmit Metrics (Gate 6B)
**Metrics:**
- Total transmissions by status (pending, sent, failed, received)
- Transmission success rate (%)
- Average transmission latency
- Carrier delivery confirmations received

**Data Source:** QuoteTransmission entity + activity logs  
**Visibility:** mga_admin, mga_manager, platform_super_admin  
**Isolation:** Per-MGA scoped  

---

### 6. Report Export Metrics (Gate 6C)
**Metrics:**
- Total exports by format (PDF, CSV, XLSX)
- Export count by report type (case summary, activity log, metrics)
- Average export generation time
- Export format distribution (%)

**Data Source:** Export audit logs (Gate 6C activity logs)  
**Visibility:** mga_admin, mga_manager, mga_user, platform_super_admin  
**Isolation:** Per-MGA scoped; users see own exports only  

---

### 7. Export History Metrics (Gate 6D)
**Metrics:**
- Export retention (days stored)
- History lookback by MGA (most recent exports)
- Export archive count
- Cleanup event frequency

**Data Source:** ExportHistory audit logs (Gate 6D activity logs)  
**Visibility:** mga_admin, mga_manager, platform_super_admin  
**Isolation:** Per-MGA scoped  

---

### 8. Saved Templates & Schedule Definitions Metrics (Gate 6I-A)
**Metrics:**
- Total report templates by MGA
- Total schedule definitions by status (draft, active, inactive)
- Template usage count (executions)
- Filter whitelist/blacklist enforcement events

**Data Source:** MGAReportTemplate, MGAReportSchedule entities + audit logs  
**Visibility:** mga_admin, mga_manager, platform_super_admin  
**Isolation:** Per-MGA scoped  

---

### 9. Delivery Governance Metrics (Gate 6J-A)
**Metrics:**
- Total deliveries by status (pending, sent, failed, cancelled)
- Delivery success rate (%)
- Retry attempt frequency
- Cancel/resend action counts

**Data Source:** ExportDelivery audit logs (Gate 6J-A activity logs)  
**Visibility:** mga_admin, mga_manager, platform_super_admin  
**Isolation:** Per-MGA scoped  

---

## Design Considerations

### Scope-Safe Aggregation

**Multi-Tenant Isolation:**
- All queries must include master_general_agent_id filter
- Cross-MGA queries return 404 masked not found
- SQL queries use `WHERE master_general_agent_id = :mga_id`

**Broker/Agency Isolation:**
- Queries can further filter by master_group_id
- mga_manager scoped to assigned Broker/Agency(ies)
- Result sets empty if user lacks scope

**Implementation Pattern:**
```javascript
const getMGAAnalytics = async (actor_email, actor_role, mga_id) => {
  // scopeGate validation
  const authorized = await permissionResolver.authorize({
    actor_email,
    actor_role,
    domain: 'analytics',
    action: 'read',
    target_entity_type: 'Analytics',
  });
  
  if (!authorized) return { error: 'UNAUTHORIZED' };
  
  // Scoped query
  const data = await base44.entities.ActivityLog.filter({
    master_general_agent_id: mga_id,
    created_date: { $gte: lastNDays(30) },
  });
  
  return aggregateMetrics(data);
};
```

---

### Permissioned Dashboard Visibility

**Role-Based Widget Access:**

| Widget | mga_admin | mga_manager | mga_user | mga_read_only | platform_super_admin |
|--------|-----------|-------------|----------|---------------|----------------------|
| MGA Users | ✅ | ❌ | ❌ | ❌ | ✅ |
| Broker/Agency Lifecycle | ✅ | ✅ | ❌ | ❌ | ✅ |
| Contacts & Settings | ✅ | ✅ | ❌ | ❌ | ✅ |
| Invites | ✅ | ❌ | ❌ | ❌ | ✅ |
| TXQuote Transmit | ✅ | ✅ | ❌ | ❌ | ✅ |
| Report Exports (own) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export History | ✅ | ✅ | ❌ | ❌ | ✅ |
| Saved Templates/Schedules | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delivery Governance | ✅ | ✅ | ❌ | ❌ | ✅ |

---

### Read-Only Data Access

**Security Model:**
- Analytics queries use `base44.asServiceRole` (service-level read)
- Enforce actor authorization via permissionResolver before returning data
- No direct entity modification via analytics layer
- All aggregations computed from audit logs, not live tables

**Data Freshness:**
- Activity logs update immediately on events
- Aggregated metrics cached up to 5 minutes
- Cache invalidation on write events (create/update/delete)

---

### Cross-MGA & Cross-Tenant Isolation

**Cross-MGA Boundary:**
- Analytics queries fail if actor's MGA ≠ requested MGA
- scopeGate returns 404 masked not found
- Audit trail logs unauthorized access attempts

**Cross-Tenant Boundary:**
- Platform admin queries segregated from MGA queries
- No MGA can see other MGA's analytics
- Tenant context validated on every request

---

## Implementation Candidates

### Option A: New Analytics Service Layer
**File:** `lib/mga/services/analyticsService.js`  
**Scope:** 250–400 lines  
**Tests:** 25–30 unit tests  
**Risk:** Low (read-only, scoped aggregation)

---

### Option B: Dashboard Component with Embedded Queries
**File:** `components/mga/MGAAnalyticsDashboard.jsx`  
**Scope:** 500–700 lines  
**Tests:** 10–15 integration tests  
**Risk:** Low–Medium (tight coupling, harder to refactor)

---

### Option C: Hybrid (Service + Component)
**Service:** `lib/mga/services/analyticsService.js` (core logic)  
**Component:** `components/mga/MGAAnalyticsDashboard.jsx` (UI + layout)  
**Tests:** 30+ combined tests  
**Risk:** Low (separation of concerns)

**Recommendation:** Option C (hybrid approach)

---

## Recommended Design Specification Next Steps

### Phase 1: Analytics Service Design
1. Define 9 metric aggregation functions
2. Implement scopeGate checks for each function
3. Design caching strategy (5-minute TTL)
4. Write permission enforcement tests

### Phase 2: Dashboard Component Design
1. Wireframe MGA analytics dashboard layout
2. Define widget components (metric cards, charts)
3. Implement role-based widget visibility
4. Add responsive design for mobile

### Phase 3: Integration & Testing
1. Service integration with ActivityLog entity
2. Dashboard integration with analyticsService
3. 30+ unit and integration tests
4. Cross-gate regression tests (6A–6J-A unaffected)

### Phase 4: Activation & Validation
1. Feature flag: `MGA_ANALYTICS_ENABLED` (default: false)
2. Rollback procedure (3 phases)
3. Closeout report and registry update

---

## Guardrails (Non-Negotiable)

✅ **Read-Only:** No create/update/delete operations  
✅ **Scoped:** All queries filter by master_general_agent_id  
✅ **Isolated:** Cross-MGA access returns 404 masked  
✅ **Permissioned:** Dashboard widgets respect role-based access  
✅ **No Data Exposure:** No signed URLs, private URIs, exported content  
✅ **No External Delivery:** No email, webhooks, background jobs  
✅ **No Schema Migration:** Use existing entities only  
✅ **No Renaming:** MasterGroup, master_group_id unchanged  
✅ **No Recurring Execution:** Analytics queries are synchronous  
✅ **Regression Safe:** Gates 6A–6J-A unaffected  

---

## Risk Assessment

### Low-Risk Areas
- ✅ Read-only aggregation (no write risk)
- ✅ Existing validated data (no new schema)
- ✅ Scope-safe queries (isolation guaranteed)
- ✅ Permissioned visibility (role-based access)

### Medium-Risk Areas
⚠️ Performance at scale (large activity logs)
- **Mitigation:** Implement caching; index master_general_agent_id + created_date

⚠️ Complex aggregations (queries with multiple joins)
- **Mitigation:** Use audit logs only; avoid live table joins

### No High-Risk Areas
✅ No external dependencies  
✅ No document storage  
✅ No signature/encryption  
✅ No background jobs  

---

## Recommended Next Action

**Proceed with Design Specification (Option C: Hybrid Service + Component)**

### If Approved:
1. Create `docs/MMA_GATE_6K_ANALYTICS_DASHBOARD_EXPANSION_DESIGN_SPECIFICATION.md`
2. Define 9 metric aggregation functions with pseudo-code
3. Wireframe dashboard layout and widget components
4. Document caching strategy and performance considerations
5. List implementation tasks and test plan

### If Additional Discovery Needed:
- Prototype specific metric queries (e.g., TXQuote transmit latency calculation)
- Performance test on large activity logs (1M+ records)
- Validate cross-MGA isolation with security team
- Finalize role-based widget access matrix

---

## Conclusion

Gate 6K is a low-risk, high-value analytics expansion that builds on existing validated Gates 6A–6J-A. It provides read-only insights without exposing data, external delivery, or schema changes. Ready for design specification if operator approves proceeding.

---

**Prepared by:** Platform Engineering  
**Date:** 2026-05-12  
**Status:** DISCOVERY_PREFLIGHT — Awaiting Operator Approval to Proceed with Design Specification