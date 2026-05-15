# MGA Gate 6K — Analytics Dashboard Expansion
## Implementation Work Order

**Date:** 2026-05-12  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE  
**Phase:** 6 (Post Gate 6J-A Lock)  
**Runtime Status:** INACTIVE (not yet implemented)  
**Operator Approval:** PENDING  

---

## Executive Summary

This work order authorizes the implementation of Gate 6K—a read-only MGA Analytics Dashboard providing scoped, permissioned aggregations of validated activity from Gates 6A–6J-A and 6L-A. The implementation follows a hybrid service + component model with strict scope isolation, role-based widget visibility, and comprehensive rollback capability.

**Implementation Model:** Hybrid Service + Component  
**Estimated Effort:** 6–9 days  
**Feature Flag:** `MGA_ANALYTICS_DASHBOARD_ENABLED` (default: false, fail-closed)  
**Runtime Risk:** Low (read-only, no mutations, fully reversible)  

---

## 1. Gate Purpose

Expand MGA command with read-only analytics capabilities, providing administrators and managers with real-time insights into:
- MGA user activity and onboarding metrics
- Broker/Agency lifecycle and contact management
- Quote transmission and export performance
- Report export usage patterns
- Delivery governance and success rates
- Template/schedule utilization
- Audit trail and governance events

**Constraints:**
- ✅ Read-only aggregation only (no mutations)
- ✅ Scope-safe queries (MGA/Broker-Agency isolation)
- ✅ Permission-gated widget visibility
- ✅ Safe payload filtering (no PII, no raw data, no signed URLs)
- ✅ No external delivery (email, webhooks, background jobs)
- ✅ No schema migration or entity renaming
- ✅ Full rollback capability

---

## 2. Files Authorized for Modification

### New Backend Service Files

**File: `lib/mga/services/mgaAnalyticsService.js`**
- Status: NEW
- Scope: ~400 lines
- Purpose: Core analytics aggregation logic
- Functions: 9 metric aggregation functions + caching
- Responsibility: Scoped query execution, caching, safe-payload filtering

**File: `lib/mga/analyticsPermissions.js`**
- Status: NEW
- Scope: ~100 lines
- Purpose: Analytics-specific permission definitions
- Content: Read-only analytics permissions (analytics.view_summary, etc.)
- Integration: Called by permissionResolver before analytics queries

**File: `lib/mga/analyticsPayloadPolicy.js`**
- Status: NEW
- Scope: ~80 lines
- Purpose: Safe-payload filtering for analytics responses
- Content: Whitelist rules for aggregation response fields
- Rules: No PII, no raw records, only counts/percentages/trends

### New Frontend Component Files

**File: `components/mga/MGAAnalyticsDashboard.jsx`**
- Status: NEW
- Scope: ~600 lines
- Purpose: Main analytics dashboard layout and state management
- Features: Tab navigation, widget grid, error boundaries, loading states

**File: `components/mga/MGAAnalyticsMetricCard.jsx`**
- Status: NEW
- Scope: ~150 lines
- Purpose: Reusable metric card component
- Features: Value display, trend indicator, breakdown list, refresh button

**File: `components/mga/MGAAnalyticsTrendPanel.jsx`**
- Status: NEW
- Scope: ~200 lines
- Purpose: Time-series trend visualization
- Features: Recharts line/bar chart, date range picker, period comparison

**File: `components/mga/MGAAnalyticsFilterBar.jsx`**
- Status: NEW
- Scope: ~120 lines
- Purpose: Date range and scope filters
- Features: Date picker, MGA selector, Broker/Agency selector (if scoped)

**File: `components/mga/MGAAnalyticsErrorBoundary.jsx`**
- Status: NEW
- Scope: ~80 lines
- Purpose: Error boundary for analytics dashboard
- Features: Widget-level error handling, fallback UI, retry button

### New Test Files

**File: `tests/mga/gate6k-analytics-dashboard-expansion.test.js`**
- Status: NEW
- Scope: ~500 lines
- Purpose: Comprehensive test suite for Gate 6K
- Test Count: 40–50 unit and integration tests

### Modified Documentation Files

**File: `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`**
- Status: MODIFY (only GATE-6K entry)
- Change: Add GATE-6K entry with status IMPLEMENTATION_WORK_ORDER_COMPLETE
- No other gate entries modified

**File: `docs/MGA_GATE_STATUS_LEDGER.md`**
- Status: MODIFY (add Gate 6K entry only)
- Change: Add Gate 6K lifecycle entry; no changes to existing gates

---

## 3. Files Explicitly Prohibited

❌ **Delivery/Email/Webhook Files:**
- No modifications to `lib/mga/services/exportDeliveryService.js`
- No creation of email delivery functions
- No creation of webhook delivery functions
- No scheduler/background job files

❌ **Mutation Service Files:**
- No modifications to case/quote/export mutation services
- No new creation/update/delete workflows for analytics context
- No status change logic related to deliveries, exports, or enrollments

❌ **Permission Broadening:**
- No modifications to `lib/mga/permissionResolver.js` (read-only additions only)
- No new admin bypasses around scopeGate
- No permission elevation for non-analytics domains

❌ **Schema Migration:**
- No entity JSON schema modifications
- No table creation or alteration
- New service functions use existing entities only

---

## 4. Metric Categories (9 Approved Groups)

### Category 1: Case & Census Activity
**Metrics:**
- Case creation rate (7d, 30d)
- Cases by stage distribution
- Census upload count (last 30d)
- Census validation pass rate (%)
- Avg days to census validation

**Data Source:** ActivityLog (case_created, census_uploaded, census_validated)

---

### Category 2: Quote Activity
**Metrics:**
- Quote scenarios created (7d, 30d)
- Scenarios by approval status
- Quote transmissions sent (TXQuote success rate)
- Avg quote generation time
- Top 5 quote providers by usage

**Data Source:** QuoteScenario, QuoteTransmission entities + ActivityLog

---

### Category 3: Report Export Activity
**Metrics:**
- Total exports by format (PDF, CSV, XLSX)
- Export count by report type (case summary, activity log, metrics)
- Avg export generation time (seconds)
- User export frequency (7d, 30d)
- Export format distribution (%)

**Data Source:** ActivityLog (export_initiated, export_completed)

---

### Category 4: Export Delivery Activity
**Metrics:**
- Delivery success rate (%)
- Deliveries by status (pending, sent, failed, cancelled)
- Retry attempt frequency (avg per export)
- Cancel/resend action counts (7d, 30d)
- Failure reason distribution (top 5, coded)

**Data Source:** ActivityLog (export_delivery_* events from Gate 6J-A)

---

### Category 5: Broker/Agency Activity
**Metrics:**
- Total Broker/Agency organizations (active, inactive, suspended)
- Broker/Agency creation rate (7d, 30d)
- Lifecycle events (edited, deactivated, reactivated)
- Contact count by Broker/Agency (top 5)
- Settings update frequency (last 30d)

**Data Source:** MasterGroup entity + ActivityLog (master_group_* events)

---

### Category 6: User Invite Activity
**Metrics:**
- Total invites sent (7d, 30d)
- Invites by role distribution
- Invites by Broker/Agency distribution
- Invite acceptance rate (%)
- Pending invites (awaiting acceptance)

**Data Source:** User entity + ActivityLog (user_invited events from Gate 6A/6F)

---

### Category 7: Document/File Activity (if validated data exists)
**Metrics:**
- Document uploads by type (census, proposal, enrollment form)
- Document count by case (top 5)
- Document retention (avg days stored)

**Data Source:** Document entity + ActivityLog (document_uploaded, document_archived)  
**Note:** Gate 6L-B (documents) is DEFERRED; include only if existing validated data exists

---

### Category 8: Audit & Governance Activity
**Metrics:**
- Activity log events by type (7d, 30d)
- Access denials (unauthorized attempts)
- Scope violations (cross-MGA/cross-tenant blocked)
- User actions by role distribution
- Compliance events (audit trail completeness check)

**Data Source:** ActivityLog (all activity events + outcome field)

---

### Category 9: Operational Exception/Failure Activity
**Metrics:**
- Exception queue items by status (new, triaged, in_progress, resolved)
- Exception severity distribution
- Avg resolution time (hours)
- Top 5 exception categories
- Unresolved exceptions by age (>24h, >7d)

**Data Source:** ExceptionItem entity + ActivityLog (exception_* events)

---

## 5. Backend Service Contract

### Analytics Service Functions

**Service Module:** `lib/mga/services/mgaAnalyticsService.js`

#### Function 1: getMGACommandSummary()
```javascript
/**
 * Aggregate MGA user command activity
 * @param {string} actor_email - requesting user email
 * @param {string} mga_id - target MGA ID
 * @param {number} days - lookback days (default 30)
 * @returns {Object} safe payload with counts, percentages, trends
 */
async function getMGACommandSummary(actor_email, mga_id, days = 30) {
  // 1. ScopeGate: verify actor's MGA matches requested MGA
  // 2. PermissionResolver: check analytics.view_summary permission
  // 3. Query ActivityLog for user_invited, user_login events
  // 4. Aggregate: count users by role, active users, invite rate
  // 5. Apply safe-payload filter
  // 6. Log: analytics_accessed event
  // Returns: { total_users, users_by_role, active_users, invite_rate_pct, trend }
}
```

#### Function 2: getMGACaseAnalytics()
```javascript
/**
 * Aggregate MGA case/census activity
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @returns {Object} safe payload with case metrics
 */
async function getMGACaseAnalytics(actor_email, mga_id, days = 30) {
  // Query: BenefitCase creation rate, stage distribution
  // Query: CensusVersion upload count, validation pass rate
  // Aggregate: count by stage, avg days to validation
  // Apply safe-payload filter
  // Returns: { case_count, cases_by_stage, census_uploads, validation_rate_pct, avg_validation_days }
}
```

#### Function 3: getMGAQuoteAnalytics()
```javascript
/**
 * Aggregate MGA quote/transmission activity
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @returns {Object} safe payload with quote metrics
 */
async function getMGAQuoteAnalytics(actor_email, mga_id, days = 30) {
  // Query: QuoteScenario creation, approval status
  // Query: QuoteTransmission status, latency, carriers
  // Aggregate: success rate, latency avg, top carriers
  // Apply safe-payload filter
  // Returns: { scenarios_created, by_approval_status, transmissions_sent, success_rate_pct, latency_avg_min, top_carriers }
}
```

#### Function 4: getMGAExportAnalytics()
```javascript
/**
 * Aggregate MGA report export activity
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @param {boolean} show_all - if false, user sees own exports only
 * @returns {Object} safe payload with export metrics
 */
async function getMGAExportAnalytics(actor_email, mga_id, days = 30, show_all = false) {
  // Query: ActivityLog export_initiated, export_completed events
  // Scope: if show_all=false, filter by created_by=actor_email
  // Aggregate: count by format, type, avg duration, format distribution
  // Apply safe-payload filter
  // Returns: { total_exports, by_format, by_type, avg_duration_sec, format_distribution, user_frequency }
}
```

#### Function 5: getMGABrokerAgencyAnalytics()
```javascript
/**
 * Aggregate MGA Broker/Agency activity
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @returns {Object} safe payload with Broker/Agency metrics
 */
async function getMGABrokerAgencyAnalytics(actor_email, mga_id, days = 30) {
  // Query: MasterGroup count by status, creation rate
  // Query: ActivityLog master_group_* events
  // Query: BrokerAgencyContact count by type
  // Aggregate: lifecycle events, contact distribution
  // Apply safe-payload filter
  // Returns: { total_agencies, by_status, creation_rate_7d, lifecycle_events, contact_count, top_contacts_by_type }
}
```

#### Function 6: getMGAUserInviteAnalytics()
```javascript
/**
 * Aggregate MGA user invite activity
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @returns {Object} safe payload with invite metrics
 */
async function getMGAUserInviteAnalytics(actor_email, mga_id, days = 30) {
  // Query: User entity invite fields
  // Query: ActivityLog user_invited events
  // Aggregate: invites by role, by Broker/Agency, acceptance rate, pending
  // Apply safe-payload filter
  // Returns: { total_invites_7d, total_invites_30d, by_role_distribution, by_agency_distribution, acceptance_rate_pct, pending_count }
}
```

#### Function 7: getMGAAuditAnalytics()
```javascript
/**
 * Aggregate MGA audit trail and governance
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @returns {Object} safe payload with audit metrics
 */
async function getMGAAuditAnalytics(actor_email, mga_id, days = 30) {
  // Query: ActivityLog all events, outcome field (success, failed, blocked)
  // Aggregate: event type distribution, denial count, violation count
  // Apply safe-payload filter
  // Returns: { event_count, by_type_distribution, access_denials_count, scope_violations_count, by_role_distribution }
}
```

#### Function 8: getMGADeliveryAnalytics()
```javascript
/**
 * Aggregate MGA export delivery governance (Gate 6J-A)
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @returns {Object} safe payload with delivery metrics
 */
async function getMGADeliveryAnalytics(actor_email, mga_id, days = 30) {
  // Query: ActivityLog export_delivery_* events
  // Aggregate: delivery success rate, retry avg, cancel/resend counts, failure reasons
  // Apply safe-payload filter
  // Returns: { deliveries_by_status, success_rate_pct, retry_avg, cancel_count, resend_count, failure_reasons_top5 }
}
```

#### Function 9: getFullMGAAnalyticsDashboard()
```javascript
/**
 * Aggregate all 9 metric categories (respecting role-based visibility)
 * @param {string} actor_email
 * @param {string} mga_id
 * @param {number} days
 * @returns {Object} combined safe payloads for all authorized widgets
 */
async function getFullMGAAnalyticsDashboard(actor_email, mga_id, days = 30) {
  // Call all 9 functions
  // Filter results by actor's permission level
  // Combine into single dashboard response
  // Log: analytics_accessed event (full_dashboard)
  // Returns: { command_summary, case_analytics, quote_analytics, export_analytics, broker_agency_analytics, invite_analytics, audit_analytics, delivery_analytics, exception_analytics }
}
```

### Caching Strategy

**Cache Module:** Integrated into each function via `getCachedAnalytics()`

```javascript
async function getCachedAnalytics(key, fetchFn, ttl = 300) {
  const cached = await cache.get(key);
  if (cached) return cached;
  
  const result = await fetchFn();
  await cache.set(key, result, ttl);
  return result;
}
```

**Cache Key Pattern:** `analytics:${mga_id}:${category}:${days}`  
**TTL:** 5 minutes (configurable)  
**Invalidation:** On ActivityLog write + manual flush via feature flag

---

## 6. Permission Model

### Analytics-Specific Permissions

**File: `lib/mga/analyticsPermissions.js`**

```javascript
const analyticsPermissions = {
  // Read-only analytics permissions
  'analytics.view_summary': {
    description: 'View MGA command summary metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_operational': {
    description: 'View operational metrics (case, quote, export)',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_exports': {
    description: 'View export and delivery metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_broker_agency': {
    description: 'View Broker/Agency lifecycle metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
  'analytics.view_audit': {
    description: 'View audit trail and governance metrics',
    category: 'analytics',
    action: 'read',
    target_entity: 'Analytics',
  },
};
```

### Role-Based Widget Visibility Matrix

| Widget | mga_admin | mga_manager | mga_user | mga_read_only | platform_super_admin |
|--------|-----------|-------------|----------|---------------|----------------------|
| MGA Command Summary | ✅ | ❌ | ❌ | ❌ | ✅ |
| Case & Census Activity | ✅ | ✅ | ❌ | ❌ | ✅ |
| Quote Activity | ✅ | ✅ | ❌ | ❌ | ✅ |
| Report Exports (own) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Delivery | ✅ | ✅ | ❌ | ❌ | ✅ |
| Broker/Agency | ✅ | ✅ | ❌ | ❌ | ✅ |
| User Invites | ✅ | ❌ | ❌ | ❌ | ✅ |
| Audit & Governance | ✅ | ✅ | ❌ | ❌ | ✅ |
| Operational Exceptions | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 7. Safe Payload Rules

### File: `lib/mga/analyticsPayloadPolicy.js`

**Payload Whitelist:** Analytics responses may include ONLY:
- ✅ Aggregated counts (numeric)
- ✅ Aggregated percentages (0–100)
- ✅ Status totals (PENDING=10, SENT=25, etc.)
- ✅ Time buckets (daily, weekly, monthly aggregations)
- ✅ Trend values (up/down/flat indicators)
- ✅ Scoped IDs (mga_id, broker_agency_id) only when safe/required
- ✅ Coded strings (role names, failure_code, status_enum)

**Payload Blacklist:** Analytics responses MUST NOT include:
- ❌ Personally Identifiable Information (names, emails, SSNs)
- ❌ Sensitive census details (health conditions, dependents)
- ❌ Raw employee/member records
- ❌ Raw export files or content
- ❌ Unmasked recipient/contact personal data
- ❌ Cross-tenant or cross-MGA identifiers (outside scope)
- ❌ Signed URLs or private file URIs
- ❌ Raw data from ActivityLog actions (only aggregations)

**Implementation Pattern:**
```javascript
function applyAnalyticsPayloadPolicy(rawData, category, actor_role) {
  const whitelist = {
    mga_command_summary: ['total_users', 'users_by_role', 'active_users', 'invite_rate_pct', 'trend'],
    case_analytics: ['case_count', 'cases_by_stage', 'census_uploads', 'validation_rate_pct'],
    // ... etc for all 9 categories
  };
  
  const filtered = {};
  whitelist[category].forEach(field => {
    if (rawData[field] !== undefined) {
      filtered[field] = rawData[field];
    }
  });
  
  return filtered;
}
```

---

## 8. Frontend Component Plan

### Component Structure

**Primary Dashboard Component:** `MGAAnalyticsDashboard.jsx` (~600 lines)
- Layout: Tab navigation + widget grid
- State: Current MGA, date range, filter state, loading/error states
- Rendering: Conditional widget display based on user permissions
- Error Boundaries: Per-widget error handling

**Metric Card Component:** `MGAAnalyticsMetricCard.jsx` (~150 lines)
- Props: title, metric value, label, trend, items[], loading, error
- Features: Value display, trend indicator, breakdown list, refresh button
- Accessibility: ARIA labels, semantic HTML

**Trend Panel Component:** `MGAAnalyticsTrendPanel.jsx` (~200 lines)
- Features: Recharts line/bar chart, date range picker, period comparison
- Data: Time-series points with labels
- Interactions: Hover tooltips, axis labels, legend

**Filter Bar Component:** `MGAAnalyticsFilterBar.jsx` (~120 lines)
- Fields: Date range (7d/30d/90d), MGA selector, Broker/Agency selector
- Scope: mga_manager sees assigned Broker/Agencies only
- Events: onChange callbacks to parent dashboard

**Error Boundary Component:** `MGAAnalyticsErrorBoundary.jsx` (~80 lines)
- Catches: Widget-level errors (failed queries, permission denials)
- Display: Error message, retry button, fallback UI
- Logging: Widget error event (audit safe)

---

## 9. Navigation & UI Placement

### Recommended Placement

**Location:** New Analytics tab in MGA Command page

**Route:** `/mga/analytics` (accessible only to authorized roles)

**Tab Structure:**
```
┌─────────────────────────────────────────────┐
│ MGA Command > [Analytics] [Users] [Agencies]│
├─────────────────────────────────────────────┤
│ ┌────────────────────────────────────────┐  │
│ │ Analytics Dashboard                    │  │
│ │ [Filters: Date Range, MGA, Agency]     │  │
│ └────────────────────────────────────────┘  │
│ ┌────────┐ ┌────────┐ ┌──────────────────┐ │
│ │Command │ │Case    │ │Quote Activity    │ │
│ │Summary │ │Activity│ │                  │ │
│ └────────┘ └────────┘ └──────────────────┘ │
│ ┌────────┐ ┌────────┐ ┌──────────────────┐ │
│ │Exports │ │Broker/ │ │User Invites      │ │
│ │& Delivery│ │Agency │ │                  │ │
│ └────────┘ └────────┘ └──────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │ Audit & Governance Metrics             │ │
│ └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Tab Visibility:**
- mga_admin: all tabs visible (Analytics, Users, Agencies)
- mga_manager: Analytics + Agencies tabs visible
- mga_user: no Analytics tab (export metrics only via widget if available)
- platform_super_admin: all tabs visible

---

## 10. Role-Based Widget Visibility

### Implementation Pattern

```javascript
function shouldRenderWidget(widget, user_role, mga_id, actor_mga_id) {
  // Check scope
  if (mga_id !== actor_mga_id) return false;
  
  // Check role permission
  const permissions = {
    mga_command_summary: ['mga_admin', 'platform_super_admin'],
    case_analytics: ['mga_admin', 'mga_manager', 'platform_super_admin'],
    quote_analytics: ['mga_admin', 'mga_manager', 'platform_super_admin'],
    export_analytics: ['mga_admin', 'mga_manager', 'mga_user', 'mga_read_only', 'platform_super_admin'],
    broker_agency_analytics: ['mga_admin', 'mga_manager', 'platform_super_admin'],
    invite_analytics: ['mga_admin', 'platform_super_admin'],
    audit_analytics: ['mga_admin', 'mga_manager', 'platform_super_admin'],
    delivery_analytics: ['mga_admin', 'mga_manager', 'platform_super_admin'],
    exception_analytics: ['mga_admin', 'mga_manager', 'platform_super_admin'],
  };
  
  return permissions[widget].includes(user_role);
}
```

### Widget Visibility by Role

**mga_admin:** All 9 widgets  
**mga_manager:** Case, Quote, Export, Broker/Agency, Audit, Delivery, Exception (7 widgets)  
**mga_user:** Export (own exports only) (1 widget)  
**mga_read_only:** Export (own exports only) (1 widget)  
**platform_super_admin:** All 9 widgets (cross-MGA)  

---

## 11. Feature Flag

### Flag Definition

**Name:** `MGA_ANALYTICS_DASHBOARD_ENABLED`  
**Default:** `false` (fail-closed)  
**Type:** Boolean  
**Location:** Feature flag system (e.g., environment variable, feature flag service)  

**Behavior:**
- If `false`: Analytics tab hidden, dashboard not accessible, backend calls return 403 Forbidden
- If `true`: Analytics tab visible, dashboard accessible, analytics queries execute
- Rollback: Set to `false` to disable instantly

**Implementation:**
```javascript
function canAccessAnalytics(user_role, feature_flag) {
  if (!feature_flag) return false;  // Fail-closed
  
  const authorized_roles = ['mga_admin', 'mga_manager', 'platform_super_admin'];
  return authorized_roles.includes(user_role);
}
```

---

## 12. Testing Plan

### Test File: `tests/mga/gate6k-analytics-dashboard-expansion.test.js`

**Total Test Count:** 40–50 tests  

### Test Categories

#### 1. Scope Isolation Tests (8 tests)
- ✅ MGA scope filter applied to queries
- ✅ Broker/Agency scope respected (mga_manager scoped to assigned agencies)
- ✅ User sees own exports only (non-admin)
- ✅ Cross-MGA query returns 404 masked
- ✅ Cross-tenant query blocked
- ✅ Scope validation before aggregation
- ✅ scopeGate enforces MGA match
- ✅ Empty result if user lacks scope

#### 2. Permission Gating Tests (8 tests)
- ✅ Authorized user can view widget
- ✅ Unauthorized user blocked (403 or hidden)
- ✅ mga_admin can view all widgets
- ✅ mga_manager can view 7 widgets
- ✅ mga_user can view 1 widget (exports own)
- ✅ mga_read_only can view 1 widget (exports own)
- ✅ Permission denial logged as analytics_access_denied
- ✅ Unknown role defaults to deny

#### 3. Safe Payload Enforcement Tests (8 tests)
- ✅ No PII in response (names, emails, SSNs not included)
- ✅ No raw records exposed (only aggregated counts)
- ✅ No signed URLs returned
- ✅ No private file URIs in response
- ✅ No exported content included
- ✅ Coded strings only (no raw action text)
- ✅ Scoped IDs only (mga_id safe, raw user emails not)
- ✅ Whitelist enforcement applied

#### 4. Aggregation Logic Tests (8 tests)
- ✅ Count aggregation correct (sum of matching records)
- ✅ Percentage calculation accurate (0–100 scale)
- ✅ Time range filtering works (7d, 30d, 90d)
- ✅ Breakdown items correct (top 5 by frequency)
- ✅ Status distribution accurate
- ✅ Avg calculation correct (latency, duration)
- ✅ Rate calculation correct (success %, acceptance %)
- ✅ Empty dataset returns empty aggregation (not null)

#### 5. Caching Tests (5 tests)
- ✅ Cache hit returns same result
- ✅ Cache miss refetches data
- ✅ TTL expiration refreshes cache
- ✅ Cache invalidation on ActivityLog write
- ✅ Manual cache flush works

#### 6. No Mutation Behavior Tests (4 tests)
- ✅ Analytics queries are read-only (no INSERT/UPDATE/DELETE)
- ✅ No modification to underlying entities
- ✅ No export delivery state changes
- ✅ No retry/cancel/resend actions triggered

#### 7. Feature Flag Tests (3 tests)
- ✅ Feature flag disabled hides analytics tab
- ✅ Feature flag disabled returns 403 on analytics queries
- ✅ Feature flag enabled allows analytics access

#### 8. UI Rendering Tests (4 tests)
- ✅ Dashboard renders without errors
- ✅ Loading state shown during fetch
- ✅ Error state displayed on query failure
- ✅ Responsive layout (mobile/tablet/desktop)

#### 9. Existing Gate Regression Tests (6 tests)
- ✅ Gate 6A user invite unchanged
- ✅ Gate 6B TXQuote transmit unchanged
- ✅ Gate 6C export generation unchanged
- ✅ Gate 6D export history unchanged
- ✅ Gate 6J-A delivery governance unchanged
- ✅ Gate 6L-A contacts/settings unchanged

---

## 13. Rollback Plan

### Phase 1: Feature Flag Disable (Immediate)
**Action:** Set `MGA_ANALYTICS_DASHBOARD_ENABLED = false`  
**Effect:** Analytics tab hidden, all queries return 403  
**Time:** <1 minute  
**Data Loss:** None  
**Reversibility:** Full (re-enable flag restores access)  

### Phase 2: Service Disable (30 minutes)
**Action:** Comment out analyticsService function calls in dashboard component  
**Effect:** Dashboard renders but shows "Analytics unavailable" message  
**Time:** <5 minutes  
**Data Loss:** None  
**Reversibility:** Full  

### Phase 3: Component Removal (1 hour)
**Action:** Remove analytics tab/route from MGA command page  
**Effect:** Reverts to pre-Gate 6K state (Users, Agencies tabs only)  
**Time:** <10 minutes  
**Data Loss:** None  
**Reversibility:** Full  

### Full Removal (if critical, ~1 hour)
**Action:** Delete all Gate 6K files and references  
**Effect:** No analytics code in codebase  
**Time:** <10 minutes  
**Data Loss:** None (audit logs retained)  
**Reversibility:** Requires re-implementation

---

## 14. Registry Update Plan

### Current State

**Registry File:** `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`  
**Gate 6K Entry Status:** `DESIGN_SPEC_COMPLETE`

### Target State (After This Work Order)

**Status Update:**
```json
{
  "gateId": "GATE-6K",
  "gateName": "MGA Analytics Dashboard Expansion",
  "phase": "6",
  "status": "IMPLEMENTATION_WORK_ORDER_COMPLETE",
  "activation": "INACTIVE",
  "implementation": "NOT_STARTED",
  "runtimeStatus": "INACTIVE",
  "analyticsMode": "READ_ONLY_SCOPE_SAFE",
  "capability": "Read-only analytics dashboard aggregating metrics from Gates 6A–6J-A and 6L-A",
  "metricCategories": 9,
  "dependsOn": ["GATE-6A", "GATE-6B", "GATE-6C", "GATE-6D", "GATE-6E", "GATE-6F", "GATE-6G", "GATE-6H", "GATE-6I-A", "GATE-6J-A", "GATE-6L-A"],
  "featureFlag": "MGA_ANALYTICS_DASHBOARD_ENABLED",
  "featureFlagDefault": false,
  "implementationModel": "HYBRID_SERVICE_COMPONENT",
  "workOrderComplete": true,
  "workOrderDate": "2026-05-12",
  "readOnly": true,
  "noMutations": true,
  "noExternalDelivery": true,
  "noSchemaMigration": true,
  "rollbackReady": true,
  "notes": "Gate 6K IMPLEMENTATION_WORK_ORDER_COMPLETE. Approved files, metrics, service contract, permissions, safe-payload rules, UI plan defined. Feature flag disabled. No runtime implementation yet. Awaiting operator approval to proceed."
}
```

### Files to Update (After Approval)

**File:** `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`  
**Change:** Update GATE-6K entry from DESIGN_SPEC_COMPLETE → IMPLEMENTATION_WORK_ORDER_COMPLETE  

**File:** `docs/MGA_GATE_STATUS_LEDGER.md`  
**Change:** Add Gate 6K to ledger with status IMPLEMENTATION_WORK_ORDER_COMPLETE  

---

## 15. Operator Stop Directive

### ⛔ STOP — IMPLEMENTATION NOT AUTHORIZED

**DO NOT IMPLEMENT GATE 6K UNTIL EXPLICIT OPERATOR APPROVAL IS PROVIDED.**

This work order defines ONLY:
- ✅ What files may be created/modified
- ✅ What metric categories will be aggregated
- ✅ What backend service contract applies
- ✅ What permissions are required
- ✅ What safe-payload rules enforce
- ✅ What frontend components provide
- ✅ What testing will validate
- ✅ What rollback will enable

This work order does NOT authorize:
- ❌ Any code implementation
- ❌ Any file creation
- ❌ Any function deployment
- ❌ Any feature flag activation
- ❌ Any database schema changes
- ❌ Any entity modifications
- ❌ Any runtime behavior changes

### Required Operator Actions Before Implementation

1. **Review** this work order in full
2. **Confirm** all authorized and prohibited files are acceptable
3. **Approve** the metric categories, backend service contract, and permission model
4. **Approve** the testing plan and rollback strategy
5. **Authorize** implementation by providing explicit written approval

### Next Step

Upon operator approval, Platform Engineering will:
1. Create the 5 new backend service files
2. Create the 5 new frontend component files
3. Create the test file with 40–50 tests
4. Update registry to IMPLEMENTATION_WORK_ORDER_COMPLETE
5. Deploy all files with feature flag disabled (fail-closed)
6. Validate: build ✅, tests ✅, regressions ✅
7. Complete closeout report with activation plan
8. Await operator approval for activation

---

## Summary

**Gate 6K Implementation Work Order** defines the complete architecture, file plan, metric categories, backend service contract, permission model, UI component structure, and testing/rollback strategy for a read-only MGA Analytics Dashboard.

**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE  
**Operator Approval:** PENDING  
**Runtime Implementation:** NOT STARTED (awaiting approval)  
**Feature Flag:** `MGA_ANALYTICS_DASHBOARD_ENABLED` (disabled, fail-closed)  

---

**Prepared by:** Platform Engineering  
**Date:** 2026-05-12  
**Status:** IMPLEMENTATION_WORK_ORDER_COMPLETE — ⛔ AWAITING OPERATOR APPROVAL — DO NOT IMPLEMENT