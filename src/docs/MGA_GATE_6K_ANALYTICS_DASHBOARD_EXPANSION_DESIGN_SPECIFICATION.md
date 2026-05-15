# MGA Gate 6K — Analytics Dashboard Expansion
## Design Specification

**Date:** 2026-05-12  
**Status:** DESIGN_SPEC_COMPLETE  
**Phase:** 6 (Post Gate 6J-A Lock)  
**Implementation:** NOT_STARTED (awaiting work order approval)  

---

## Executive Summary

Gate 6K defines a read-only, scope-safe analytics dashboard for MGA administrators and managers. The dashboard aggregates metrics from validated gates (6A–6J-A, 6L-A) without exposing raw data, signed URLs, private file URIs, or exported content. Implementation follows a hybrid service + component model with strict scope isolation and role-based widget visibility.

---

## 1. Final Analytics Scope

### In Scope
✅ Read-only aggregation of existing validated data  
✅ 9 metric categories across 8+ gates  
✅ Scope-safe queries (MGA/Broker-Agency isolation)  
✅ Permission-based widget visibility  
✅ 5-minute metric caching  
✅ Activity log analysis (no live table reads)  
✅ Responsive dashboard layout  
✅ Audit trail logging (analytics access)  

### Out of Scope (Non-Negotiable)
❌ No mutations (create/update/delete)  
❌ No new entities or schema migration  
❌ No document access or storage  
❌ No signed URLs or private file URIs  
❌ No exported content exposure  
❌ No email/webhook delivery  
❌ No background jobs or recurring execution  
❌ No MasterGroup/master_group_id renaming  
❌ No scopeGate/scopeResolver/permissionResolver changes  

---

## 2. Metric Category Definitions

### Category 1: MGA Command Summary (Gate 6A)
**Metrics:**
- Total users by role (mga_admin, mga_manager, mga_user, mga_read_only)
- Users invited (last 7, 30 days)
- Active users (last 24h, 7d, 30d)
- Cross-MGA access attempts (blocked)
- User invite acceptance rate (%)

**Data Source:** User entity + ActivityLog (action = 'user_invited', 'user_login')  
**Aggregation Method:** Count distinct + date filtering  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed` (permission check only)  

---

### Category 2: Broker / Agency Lifecycle Metrics (Gate 6H)
**Metrics:**
- Total Broker/Agency organizations (active, inactive, suspended)
- Lifecycle events (created, edited, deactivated, reactivated) last 30d
- Avg Broker/Agency age (days)
- Status distribution (%)

**Data Source:** MasterGroup entity + ActivityLog (action = 'master_group_*')  
**Aggregation Method:** Count by status + date range filtering  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  

---

### Category 3: Broker / Agency Contacts & Settings Metrics (Gate 6L-A)
**Metrics:**
- Total contacts by type (primary, billing, operations, compliance, technical)
- Contact status distribution (active, deactivated)
- Settings update frequency (last 7, 30 days)
- Broker/Agency with incomplete contact info (%)

**Data Source:** BrokerAgencyContact entity + ActivityLog (action = 'contact_*', 'settings_*')  
**Aggregation Method:** Count + group by contact_type + date filtering  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  

---

### Category 4: Invite Metrics (Gate 6F)
**Metrics:**
- Total invites sent (last 7, 30 days)
- Invites by role distribution (%)
- Invites by Broker/Agency distribution
- Invite acceptance rate (%)
- Pending invites (awaiting acceptance)

**Data Source:** User entity invite fields + ActivityLog (action = 'user_invited')  
**Aggregation Method:** Count + filter by status  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  

---

### Category 5: TXQuote Transmit Metrics (Gate 6B)
**Metrics:**
- Total transmissions by status (pending, sent, failed)
- Transmission success rate (%)
- Avg transmission latency (minutes)
- Carrier delivery confirmations received (count)
- Top failing carriers (last 30 days)

**Data Source:** QuoteTransmission entity + ActivityLog (action = 'txquote_transmit_*')  
**Aggregation Method:** Count by status + timestamp diff (latency) + group by carrier  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  

---

### Category 6: Report Export Metrics (Gate 6C)
**Metrics:**
- Total exports by format (PDF, CSV, XLSX)
- Export count by report type (case summary, activity log, metrics)
- Avg export generation time (seconds)
- Export format distribution (%)
- User export frequency (last 7, 30 days)

**Data Source:** ActivityLog (action = 'export_initiated', 'export_completed')  
**Aggregation Method:** Count by format/type + timestamp diff (duration)  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  
**Security:** Users see own exports only (filter by created_by)  

---

### Category 7: Export History Metrics (Gate 6D)
**Metrics:**
- Export retention (days stored)
- History records by MGA (count)
- Most recent exports (top 5 by date)
- Archive/cleanup event frequency (last 30d)

**Data Source:** ActivityLog (action = 'export_history_*')  
**Aggregation Method:** Count + date range filtering  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  

---

### Category 8: Saved Templates & Schedule Definitions Metrics (Gate 6I-A)
**Metrics:**
- Total report templates by MGA
- Total schedule definitions (draft, active, inactive)
- Template usage count (executions last 30d)
- Filter safety enforcement events (whitelist/blacklist violations caught)
- Most used templates (top 5)

**Data Source:** MGAReportTemplate + MGAReportSchedule entities + ActivityLog  
**Aggregation Method:** Count by status + group by template_id + filter enforcement audit  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  

---

### Category 9: Delivery Governance Metrics (Gate 6J-A)
**Metrics:**
- Total deliveries by status (pending, sent, failed, cancelled)
- Delivery success rate (%)
- Retry attempt frequency (avg per export)
- Cancel/resend action counts (last 30 days)
- Failure reason distribution (top 5)

**Data Source:** ActivityLog (action = 'export_delivery_*')  
**Aggregation Method:** Count by status + count retries + group by failure_reason  
**Freshness:** 5 minutes (cache TTL)  
**Audit Event:** `analytics_accessed`  

---

## 3. Data Sources by Gate/Capability

| Gate | Entity | Activity Log Actions | Metric Count |
|------|--------|----------------------|--------------|
| **6A** | User | user_invited, user_login, user_deactivated | 5 |
| **6B** | QuoteTransmission | txquote_transmit_initiated, txquote_transmit_sent, txquote_transmit_failed | 5 |
| **6C** | ActivityLog | export_initiated, export_completed | 4 |
| **6D** | ActivityLog | export_history_* | 3 |
| **6H** | MasterGroup | master_group_created, master_group_edited, master_group_deactivated | 4 |
| **6I-A** | MGAReportTemplate, MGAReportSchedule | template_created, schedule_created, schedule_executed | 5 |
| **6J-A** | ActivityLog | export_delivery_tracked, export_delivery_retry_initiated, export_delivery_cancelled, export_delivery_resent | 4 |
| **6L-A** | BrokerAgencyContact | contact_created, contact_updated, contact_deactivated, settings_updated | 4 |

**Total Metrics:** 34 across 8 gates (9 categories)

---

## 4. Permission Model

### Role-Based Access Control

**Master Role Definition:**

| Role | Analytics Access | Widget Visibility | Scope |
|------|------------------|-------------------|-------|
| **mga_admin** | ✅ Full | All 9 categories | Own MGA |
| **mga_manager** | ✅ Limited | Categories 2, 3, 4, 5, 6, 7, 8, 9 | Own MGA + Broker/Agency |
| **mga_user** | ✅ Own Only | Category 6 only (own exports) | Own exports |
| **mga_read_only** | ✅ Own Only | Category 6 only (own exports) | Own exports |
| **platform_super_admin** | ✅ Cross-MGA | All 9 categories | All MGAs |

### Widget-to-Permission Mapping

**MGA Command Summary** (Category 1)
- Allowed Roles: mga_admin, platform_super_admin
- Permission: `analytics.read` + `domain: mga_users`
- Default: DENIED for others

**Broker/Agency Lifecycle** (Category 2)
- Allowed Roles: mga_admin, mga_manager, platform_super_admin
- Permission: `analytics.read` + `domain: master_groups`
- Scope Constraint: mga_manager sees assigned Broker/Agencies only

**Contacts & Settings** (Category 3)
- Allowed Roles: mga_admin, mga_manager, platform_super_admin
- Permission: `analytics.read` + `domain: broker_contacts`
- Scope Constraint: mga_manager scoped to assigned Broker/Agencies

**Invite Metrics** (Category 4)
- Allowed Roles: mga_admin, platform_super_admin
- Permission: `analytics.read` + `domain: invites`
- Default: DENIED for others

**TXQuote Transmit** (Category 5)
- Allowed Roles: mga_admin, mga_manager, platform_super_admin
- Permission: `analytics.read` + `domain: txquote_transmit`
- Default: DENIED for others

**Export Metrics** (Category 6)
- Allowed Roles: mga_admin, mga_manager, mga_user, mga_read_only, platform_super_admin
- Permission: `analytics.read` + `domain: exports`
- Scope Constraint: Non-admin users see own exports only

**Export History** (Category 7)
- Allowed Roles: mga_admin, mga_manager, platform_super_admin
- Permission: `analytics.read` + `domain: export_history`
- Default: DENIED for others

**Templates & Schedules** (Category 8)
- Allowed Roles: mga_admin, mga_manager, platform_super_admin
- Permission: `analytics.read` + `domain: report_templates`
- Default: DENIED for others

**Delivery Governance** (Category 9)
- Allowed Roles: mga_admin, mga_manager, platform_super_admin
- Permission: `analytics.read` + `domain: delivery`
- Default: DENIED for others

---

## 5. ScopeGate & Security Model

### Scope Isolation Enforcement

**Request Authorization Flow:**

```
1. Actor Request (email, role, mga_id, broker_agency_id_optional)
   ↓
2. ScopeGate Validation
   - Verify actor's role is permitted for analytics domain
   - Verify actor's MGA matches requested MGA
   - Verify actor's scope includes requested Broker/Agency (if scoped query)
   ↓
3. PermissionResolver Check
   - Confirm analytics.read permission for specific widget/category
   - Enforce role-based widget visibility
   ↓
4. Query Execution (with scope filters applied)
   - WHERE master_general_agent_id = :mga_id
   - AND (master_group_id = :broker_agency_id OR :broker_agency_id IS NULL)
   ↓
5. Response (metadata only, no signed URLs or content)
   - Return aggregated metrics
   - Log analytics_accessed event
```

### Cross-MGA Access Prevention

**If actor's MGA ≠ requested MGA:**
- Return 404 masked not found (not 403)
- Log unauthorized access attempt as `activity_log` event
- Increment security metrics counter

**If actor lacks permission for widget:**
- Return empty dataset or DENIED_PERMISSION response
- Log permission denial as `analytics_access_denied`
- Widget is hidden in frontend UI

---

## 6. Safe Aggregation Policy

### Data Protection Guarantees

✅ **No PII Exposure:**
- No names, emails, SSNs in aggregated results
- Only role names, contact types (primary, billing, etc.)
- Actor email logged (for audit, not in response)

✅ **No Signed URLs:**
- Never computed or returned in analytics response
- File URLs are external data, not in scope

✅ **No Private File URIs:**
- No file:// paths or private storage URIs
- Document management (Gate 6L-B) is separate scope

✅ **No Exported Content:**
- Aggregations contain only metrics, counts, percentages
- Raw export data never included in analytics response

✅ **No Sensitive Failure Details:**
- Failure reasons are coded (EXPORT_NOT_FOUND, PERMISSION_DENIED)
- Error messages not exposed in aggregated metrics

---

## 7. Backend Analytics Service Design

### Service Layer Architecture

**File:** `lib/mga/services/mgaAnalyticsService.js`  
**Scope:** ~400 lines  

**Core Functions:**

```javascript
/**
 * getMGACommandSummary(actor_email, mga_id, days=30)
 * Returns: { total_users, users_by_role, active_users, invite_rate, ... }
 */
async function getMGACommandSummary(actor_email, mga_id, days = 30) {
  // 1. ScopeGate check
  // 2. Permission check (analytics.read + mga_users domain)
  // 3. Query ActivityLog with filters
  // 4. Aggregate counts and percentages
  // 5. Return metadata only
}

/**
 * getBrokerAgencyLifecycleMetrics(actor_email, mga_id, days=30)
 * Returns: { total_agencies, lifecycle_events, status_distribution, ... }
 */
async function getBrokerAgencyLifecycleMetrics(actor_email, mga_id, days = 30) {
  // Similar pattern: scope → permission → query → aggregate
}

/**
 * getContactsSettingsMetrics(actor_email, mga_id, broker_agency_id_optional, days=30)
 * Returns: { total_contacts, by_type, settings_updates, completeness, ... }
 */
async function getContactsSettingsMetrics(actor_email, mga_id, broker_agency_id, days = 30) {
  // Scope constraint: mga_manager must have broker_agency_id
}

/**
 * getInviteMetrics(actor_email, mga_id, days=30)
 * Returns: { total_invites, by_role, acceptance_rate, pending_count, ... }
 */
async function getInviteMetrics(actor_email, mga_id, days = 30) {
  // Query User entity + ActivityLog for invite events
}

/**
 * getTXQuoteTransmitMetrics(actor_email, mga_id, days=30)
 * Returns: { total_transmissions, success_rate, latency_avg, carriers, ... }
 */
async function getTXQuoteTransmitMetrics(actor_email, mga_id, days = 30) {
  // Query QuoteTransmission + ActivityLog for transmit events
}

/**
 * getReportExportMetrics(actor_email, mga_id, days=30, show_all=false)
 * Returns: { total_exports, by_format, avg_duration, user_frequency, ... }
 */
async function getReportExportMetrics(actor_email, mga_id, days = 30, show_all = false) {
  // show_all=false: user sees own exports only
  // show_all=true: allowed for mga_admin only
}

/**
 * getExportHistoryMetrics(actor_email, mga_id, days=30)
 * Returns: { retention_days, history_count, cleanup_frequency, ... }
 */
async function getExportHistoryMetrics(actor_email, mga_id, days = 30) {
  // Read-only aggregation from ActivityLog
}

/**
 * getTemplateScheduleMetrics(actor_email, mga_id, days=30)
 * Returns: { total_templates, total_schedules, usage_count, safety_events, top_templates, ... }
 */
async function getTemplateScheduleMetrics(actor_email, mga_id, days = 30) {
  // Query MGAReportTemplate + MGAReportSchedule entities
}

/**
 * getDeliveryGovernanceMetrics(actor_email, mga_id, days=30)
 * Returns: { total_deliveries, success_rate, retry_avg, cancel_count, failure_reasons, ... }
 */
async function getDeliveryGovernanceMetrics(actor_email, mga_id, days = 30) {
  // Query ActivityLog for delivery governance events (Gate 6J-A)
}

/**
 * getFullDashboardMetrics(actor_email, mga_id, days=30)
 * Returns: all 9 categories (respecting role-based visibility)
 */
async function getFullDashboardMetrics(actor_email, mga_id, days = 30) {
  // Call all 9 functions; filter by permission; return combined
}
```

### Caching Strategy

**Cache Key:** `analytics:${mga_id}:${actor_role}:${category}:${days}`  
**TTL:** 5 minutes  
**Invalidation:**
- On create/update/delete events (ActivityLog changes)
- On cache expiration (5 min)
- Manual flush (admin action)

**Implementation:**
```javascript
async function getCachedMetrics(key, fetchFn, ttl = 300) {
  const cached = await cache.get(key);
  if (cached) return cached;
  
  const result = await fetchFn();
  await cache.set(key, result, ttl);
  return result;
}
```

---

## 8. Frontend Dashboard/Widget Design

### Dashboard Layout Structure

**File:** `components/mga/MGAAnalyticsDashboard.jsx`  
**Scope:** ~600 lines  

**Layout Grid:**
```
┌─────────────────────────────────────────┐
│ MGA Analytics Dashboard                 │
├─────────────────────────────────────────┤
│ [Filters: Date Range, MGA, Broker/Agency]
├─────────────────────────────────────────┤
│ ┌────────────────┐  ┌────────────────┐  │
│ │ MGA Command    │  │ Broker/Agency  │  │
│ │ Summary        │  │ Lifecycle      │  │
│ └────────────────┘  └────────────────┘  │
│ ┌────────────────┐  ┌────────────────┐  │
│ │ Contacts &     │  │ Invite         │  │
│ │ Settings       │  │ Metrics        │  │
│ └────────────────┘  └────────────────┘  │
│ ┌────────────────┐  ┌────────────────┐  │
│ │ TXQuote        │  │ Report Export  │  │
│ │ Transmit       │  │ Metrics        │  │
│ └────────────────┘  └────────────────┘  │
│ ┌────────────────┐  ┌────────────────┐  │
│ │ Export History │  │ Templates &    │  │
│ │ Metrics        │  │ Schedules      │  │
│ └────────────────┘  └────────────────┘  │
│ ┌────────────────────────────────────┐  │
│ │ Delivery Governance Metrics        │  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Widget Component Design

**File:** `components/mga/MGAAnalyticsMetricCard.jsx`  
**Scope:** ~150 lines  

**Props:**
```javascript
{
  title: string,           // e.g. "MGA Users by Role"
  metric: number,          // e.g. 42
  label: string,           // e.g. "Total Active Users"
  trend: number,           // % change (positive, negative, neutral)
  items: Array,            // breakdown items (optional)
  loading: boolean,
  error: Error | null,
  onRefresh: () => void,
}
```

**Display:**
- Metric value (large, bold)
- Label
- Trend indicator (↑ / ↓ / →)
- Breakdown list (if provided)
- Refresh button
- Loading spinner
- Error state

### Trend Panel Component

**File:** `components/mga/MGAAnalyticsTrendPanel.jsx`  
**Scope:** ~200 lines  

**Features:**
- Line/bar chart (recharts)
- Time range picker (7d, 30d, 90d)
- Compare previous period toggle
- Metric selector dropdown

---

## 9. Role-Based Widget Visibility

### Widget Visibility Matrix

| Widget | mga_admin | mga_manager | mga_user | mga_read_only | platform_super_admin |
|--------|-----------|-------------|----------|---------------|----------------------|
| MGA Command Summary | ✅ | ❌ | ❌ | ❌ | ✅ |
| Broker/Agency Lifecycle | ✅ | ✅ | ❌ | ❌ | ✅ |
| Contacts & Settings | ✅ | ✅ | ❌ | ❌ | ✅ |
| Invite Metrics | ✅ | ❌ | ❌ | ❌ | ✅ |
| TXQuote Transmit | ✅ | ✅ | ❌ | ❌ | ✅ |
| Report Exports | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ |
| Export History | ✅ | ✅ | ❌ | ❌ | ✅ |
| Templates & Schedules | ✅ | ✅ | ❌ | ❌ | ✅ |
| Delivery Governance | ✅ | ✅ | ❌ | ❌ | ✅ |

### Frontend Implementation

```javascript
// components/mga/MGAAnalyticsDashboard.jsx

function MGAAnalyticsDashboard({ user, mga_id }) {
  const [permissions, setPermissions] = useState({});
  
  useEffect(() => {
    // Fetch user's analytics permissions
    const perms = await base44.functions.invoke('getAnalyticsPermissions', { mga_id });
    setPermissions(perms);
  }, [user.role, mga_id]);
  
  return (
    <div className="analytics-grid">
      {permissions.can_view_mga_command && <MGACommandWidget />}
      {permissions.can_view_broker_lifecycle && <BrokerAgencyLifecycleWidget />}
      {permissions.can_view_contacts && <ContactsSettingsWidget />}
      {/* ... etc */}
    </div>
  );
}
```

---

## 10. Caching & Performance Approach

### Cache Architecture

**Storage:** In-memory cache (node-cache or Redis if deployed)  
**Key Pattern:** `analytics:${mga_id}:${category}:${days}`  
**TTL:** 5 minutes (configurable)  

**Invalidation Triggers:**
- ActivityLog write events (entity-triggered automation)
- Cache expiration (5 min)
- Manual flush (admin action via feature flag)

### Performance Optimization

**Query Patterns:**
- Index `ActivityLog` on (master_general_agent_id, created_date, action)
- Index `QuoteTransmission` on (master_general_agent_id, status)
- Index `MasterGroup` on (master_general_agent_id, status)

**Aggregation Limits:**
- Max 90-day lookback (prevents large aggregations)
- Batch aggregation queries (group by category)
- Limit breakdown items to top 10

**Frontend Optimization:**
- Lazy load widgets (viewport intersection)
- Skeleton loading states
- Error boundaries per widget
- Responsive grid (mobile-first)

---

## 11. Audit & Logging Requirements

### Audit Events

**Event:** `analytics_accessed`
```javascript
{
  event: "analytics_accessed",
  actor_email: "user@example.com",
  actor_role: "mga_admin",
  master_general_agent_id: "mga-123",
  widget_category: "mga_command_summary",  // or null for full dashboard
  days: 30,
  timestamp: "2026-05-12T10:30:00Z",
  outcome: "success",  // or "denied", "error"
}
```

**Event:** `analytics_access_denied`
```javascript
{
  event: "analytics_access_denied",
  actor_email: "user@example.com",
  actor_role: "mga_user",
  master_general_agent_id: "mga-123",
  requested_widget: "mga_command_summary",
  reason: "PERMISSION_DENIED",  // or "SCOPE_MISMATCH"
  timestamp: "2026-05-12T10:30:00Z",
}
```

**Logging Requirements:**
- All analytics access logged (success + denied)
- No sensitive data in logs (no metric values, no raw export data)
- Retention: 90 days (standard activity log retention)

---

## 12. Validation & Test Plan

### Unit Tests

**File:** `tests/mga/gate6k-analytics-dashboard-expansion.test.js`  
**Test Count:** 40–50 tests  

**Test Categories:**

1. **Authorization Tests (10)**
   - Authorized user can access widget
   - Unauthorized user blocked
   - Cross-MGA access returns 404
   - Permission check enforced

2. **Scope Isolation Tests (8)**
   - MGA scope filters applied
   - Broker/Agency scope respected (mga_manager)
   - User sees own exports only (non-admin)

3. **Aggregation Tests (12)**
   - Count aggregation correct
   - Percentage calculation accurate
   - Time range filtering works
   - Breakdown items (top 10) correct

4. **Caching Tests (6)**
   - Cache hit returns same result
   - Cache miss refetches data
   - Cache invalidation on write
   - TTL expiration works

5. **Data Safety Tests (8)**
   - No PII in response
   - No signed URLs exposed
   - No private file URIs exposed
   - No export content included

6. **Regression Tests (6)**
   - Gates 6A–6J-A unaffected
   - Gate 6L-A unaffected
   - No breaking changes to existing services

### Integration Tests

**Dashboard Integration:**
- Widget rendering with mock data
- Permission check triggers widget visibility
- Error states handled gracefully
- Responsive layout on mobile

### Performance Tests

- Query execution <500ms for 30-day aggregation
- Cache hit <10ms
- Dashboard load <2 seconds (all 9 widgets)

---

## 13. Rollback Strategy

### Phase 1: Feature Flag Disable (Immediate)
- Disable feature flag: `MGA_ANALYTICS_ENABLED = false`
- Effect: Analytics button hidden; dashboard inaccessible
- Time: <1 minute

### Phase 2: Service Disable (30 minutes)
- Comment out analyticsService calls
- Return 404 on /analytics endpoints
- Effect: All analytics requests fail gracefully
- Time: <5 minutes

### Phase 3: Component Removal (1 hour)
- Delete MGAAnalyticsDashboard and related components
- Remove analytics route from App.jsx
- Effect: Reverts to pre-Gate 6K state
- Time: <10 minutes

### Full Removal (if critical)
- Delete all Gate 6K files and references
- Revert registry to DESIGN_SPEC_COMPLETE
- Time: <10 minutes

---

## 14. Recommendation

### Implementation Approach

**Recommended:** Hybrid Service + Component Model

**Rationale:**
- Service layer (`mgaAnalyticsService.js`) isolates business logic
- Component layer (`MGAAnalyticsDashboard.jsx`) isolates UI
- Testability: Service logic testable independently of UI
- Maintainability: Clear separation of concerns
- Reusability: Service can be called from other pages/agents

**Implementation Steps:**

1. **Backend Service** (150–200 lines)
   - 9 metric aggregation functions
   - Caching layer
   - Permission/scope checks integrated

2. **Frontend Components** (600–800 lines)
   - MGAAnalyticsDashboard.jsx (layout, state management)
   - MGAAnalyticsMetricCard.jsx (metric display)
   - MGAAnalyticsTrendPanel.jsx (charts)
   - MGAAnalyticsFilterBar.jsx (date/scope filters)

3. **Tests** (400–500 lines)
   - 40–50 unit + integration tests
   - Regression coverage for Gates 6A–6J-A, 6L-A

4. **Activation**
   - Feature flag: `MGA_ANALYTICS_ENABLED` (default: false)
   - Route: `/mga/analytics` (scoped to authenticated mga_admin+)
   - Audit logging: All access + denials

**Estimated Effort:**
- Backend service + tests: 2–3 days
- Frontend components + tests: 3–4 days
- Integration + rollback setup: 1–2 days
- **Total: 6–9 days**

---

## Summary

Gate 6K defines a secure, read-only analytics dashboard for MGA administrators. The design maintains all 19 guardrails, ensures scope isolation, and provides role-based widget visibility. Implementation follows a hybrid service + component model with comprehensive testing and rollback strategy.

**Status:** DESIGN_SPEC_COMPLETE  
**Next Step:** Implementation Work Order (awaiting operator approval)  

---

**Prepared by:** Platform Engineering  
**Date:** 2026-05-12  
**Status:** DESIGN_SPEC_COMPLETE — Ready for Operator Review & Work Order Approval