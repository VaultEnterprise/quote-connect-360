# Quote Scenario Screen: Comprehensive Enhancement Guide

## Overview
The Quotes page displays QuoteScenario records with filtering, bulk operations, and comparison. This document outlines all missing features, improvements, and workflows that should logically exist on this screen.

---

## SECTION 1: Missing Core Features (High Priority)

### 1.1 Scenario Timeline & History
**Current State**: No version/history tracking
**Missing**:
- [ ] **Version history** — Track changes to scenario (contribution changed, plans modified, etc.)
- [ ] **Revert to previous version** — "This scenario was edited 3 days ago" with ability to restore
- [ ] **Who changed it** — Show user email + timestamp of last modification
- [ ] **Change log drawer** — Side panel showing edit timeline with diffs

**Implementation**:
- Add `versions` array to QuoteScenario entity (stores historical snapshots)
- Add `version_number` field (increments on each save)
- Add "View History" button in scenario dropdown menu
- Create HistoryTimeline component showing diffs

---

### 1.2 Rate Lock Management
**Current State**: Expiration tracked but no "lock" concept
**Missing**:
- [ ] **Lock rate button** — "Lock these rates for 30 days" (prevents accidental stale updates)
- [ ] **Lock status badge** — "Rates locked until Apr 23"
- [ ] **Lock countdown timer** — Shows remaining lock days
- [ ] **Unlock functionality** — For emergency rate refresh

**Implementation**:
- Add `rate_lock_expires_at` field to QuoteScenario
- Add `rate_locked_by` (user email) and `rate_locked_at` fields
- Button in actions menu to lock/unlock rates
- Visual "Locked 🔒" badge when locked

---

### 1.3 Contribution Modeling & What-If Scenarios
**Current State**: Contribution strategy is set but static
**Missing**:
- [ ] **Contribution slider UI** — Real-time cost modeling (drag to adjust % or $)
- [ ] **What-if calculator** — "If we pay 80% for EE, costs are…"
- [ ] **Scenario variants** — Save multiple contribution strategies per scenario
- [ ] **ACA affordability check** — Flag if EE premium > 9.12% of income
- [ ] **Cost impact graph** — Visual showing employer cost at different contribution levels

**Implementation**:
- Add expandable "Contribution Modeling" section in scenario card
- Create Slider component with onChange → recalculate costs in real-time
- Show employer cost, employee cost, and total premium updates
- Display ACA affordability status
- Link to full ContributionModeling page for deep analysis

---

### 1.4 Plan Detail & Network Analysis
**Current State**: Basic plan list with contribution %
**Missing**:
- [ ] **Plan details modal** — Full plan specs (deductible, copays, OOP max, pharmacy tiers)
- [ ] **Network comparison** — "Blue vs. Aetna: # of providers by specialty"
- [ ] **Plan quality score** — Rating (1-5 stars) based on coverage breadth
- [ ] **Member cost estimator** — "If an employee has $5k in medical costs, they pay…"
- [ ] **Plan exclusions** — What's NOT covered (maternity, fertility, etc.)

**Implementation**:
- Expand plan list row to show 2-3 key metrics (deductible, OOP max, in-network %age)
- Add "Details" button → opens full plan modal with all specs
- Create "Network Analysis" tab in modal comparing carriers

---

### 1.5 Recommendation Engine Transparency
**Current State**: Shows recommendation score but unclear how it's calculated
**Missing**:
- [ ] **Recommendation methodology** — "Why is this scenario recommended?"
- [ ] **Score breakdown** — Cost (40%), coverage (30%), risk (20%), network (10%)
- [ ] **Confidence level** — "High, Medium, Low" confidence in recommendation
- [ ] **Comparison to alternatives** — "This scenario saves $X vs. current plan"
- [ ] **Member feedback loop** — "Which plans did employees prefer?"

**Implementation**:
- Add "About this recommendation" expandable section
- Show score breakdown as horizontal bar chart
- Add confidence badge (High/Medium/Low)
- Compare total cost to previous scenario if available
- Link to PolicyMatchAI integration if run

---

### 1.6 Scenario Naming & Organization
**Current State**: Generic names like "Scenario 1", "Scenario 2"
**Missing**:
- [ ] **Smart naming templates** — "Conservative (Low Cost)", "Balance", "Rich Benefits"
- [ ] **Scenario tags** — "Employee-heavy", "Renewal", "Market", custom tags
- [ ] **Scenario categories** — Group by business strategy (cost control, competitive, etc.)
- [ ] **Description/assumptions field** — "Assumes 85% participation, 2.5% aging"
- [ ] **Broker talking points** — Auto-generate sales pitch for scenario

**Implementation**:
- Add `description`, `tags`, `talking_points` fields to QuoteScenario
- Inline editor in card title for quick renames
- Tag pill selection in modal
- Pre-filled talking points based on scenario type

---

### 1.7 ROI & Business Impact Analysis
**Current State**: Shows costs but no business context
**Missing**:
- [ ] **ROI vs. last year** — "This renewal is +8% vs. current contracts"
- [ ] **Disruption score** — High/medium/low (how much changes from current?)
- [ ] **Employee impact** — "Avg employee cost goes from $X to $Y (+15%)"
- [ ] **Retention impact** — "Based on industry data, turnover risk is HIGH"
- [ ] **Revenue/margin impact** — For PEO/consultant use cases

**Implementation**:
- Fetch current/previous scenario for comparison
- Calculate rate change % and employee cost change %
- Display in cards: "Current Plan vs. This Scenario"
- Add disruption score (% of employees affected by plan changes)

---

## SECTION 2: UI/UX Improvements (Medium Priority)

### 2.1 Enhanced Scenario Card Display

**Missing visuals**:
- [ ] **Side color bar** by status (already there!) — but enhance with gradient for locked/expired
- [ ] **Risk indicator** — "⚠️ High cost increase" warning
- [ ] **Availability status** — "Awaiting carrier approval", "Rates confirmed", "On hold"
- [ ] **Member count tooltip** — "123 employees, 47 spouses, 89 children"
- [ ] **Plan count visual** — Chart showing medical/dental/vision/life breakdown

**Implementation**:
- Add colored risk indicator (green/yellow/red)
- Add status badges for specific states (locked, pending approval, etc.)
- Add employee composition as small pie/donut chart in card
- Tooltip on hover showing breakdown

---

### 2.2 Scenario Comparison Matrix Enhancements
**Current State**: Basic 2-4 scenario compare
**Missing**:
- [ ] **Compare to "current" plan** — Baseline comparison available always
- [ ] **Column sorting** — Click header to sort by cost, coverage, etc.
- [ ] **Highlight differences** — Color rows where scenarios differ
- [ ] **PDF export** — Download comparison as professional PDF
- [ ] **Share comparison** — Generate shareable link to comparison
- [ ] **Employee view** — "How would my benefits change?" for individual employees

**Implementation**:
- Fetch current case's active scenario (if exists) as baseline
- Add to comparison UI as first column
- Allow 2-6 scenarios to compare (not just 4)
- Add export button (uses jsPDF)
- Generate shareable comparison URL

---

### 2.3 Advanced Filtering & Saved Views
**Current State**: Basic filters (status, employer, carrier)
**Missing**:
- [ ] **Filter presets/saved views** — "Show only expired quotes", "High cost scenarios"
- [ ] **Custom filters** — "Premium > $50k AND status = completed AND not recommended"
- [ ] **Smart saved views** — "My team's active scenarios", "Renewals this month"
- [ ] **Filter by recommendation** — "Show only recommended", "Show only rejected"
- [ ] **Filter by age** — "Created in last 7 days", "Not updated in 60+ days"
- [ ] **Filter by employer type** — "Small group < 50", "Large group > 500"

**Implementation**:
- Add "Save View" button → creates ViewPreset entity
- Allow user to save/load custom filter combinations
- Add pre-built views (Expired, Recommended, Recent, etc.)
- Show saved views in sidebar or dropdown

---

### 2.4 Bulk Operations Enhancements
**Current State**: Mark expired, delete, compare
**Missing**:
- [ ] **Bulk export to CSV** — Export selected scenarios with all details
- [ ] **Bulk PDF report** — Generate multi-scenario PDF report
- [ ] **Bulk recommend/unrecommend** — Mark multiple as recommended
- [ ] **Bulk lock rates** — Lock multiple scenarios' rates for X days
- [ ] **Bulk tag** — Add tags to multiple scenarios at once
- [ ] **Bulk assign** — "Assign these to broker John"
- [ ] **Bulk approval workflow** — "Approve selected for proposal"

**Implementation**:
- Extend bulk actions bar with more buttons
- Add export functions that respect selected scenarios
- Implement bulk update mutations for common operations

---

### 2.5 Dashboard/Summary Cards
**Current State**: KPI bar shows aggregate stats
**Missing**:
- [ ] **Total employer investment** — Sum of all employer costs
- [ ] **Completion rate** — % of scenarios that are "completed"
- [ ] **Recommendation rate** — % marked as recommended
- [ ] **Recent activity** — "Updated 4 hours ago", "Newest from today"
- [ ] **Expiration alerts** — "5 quotes expiring this week"
- [ ] **Cost trend** — Average premium trending up/down over time

**Implementation**:
- Enhance QuotesKPIBar component with more cards
- Add filters on KPI cards to show subset of data
- Add trend indicator (↑ up, ↓ down, → flat)

---

## SECTION 3: Workflow Features (Medium Priority)

### 3.1 Approval Workflows
**Current State**: No approval concept
**Missing**:
- [ ] **Send for approval** — Mark scenario as "pending approval" → notify manager
- [ ] **Approval status** — Pending, approved, rejected, revise
- [ ] **Approval history** — Who approved, when, notes
- [ ] **Conditional approval** — "Approve only if premium < $X"
- [ ] **Re-submission** — After rejection, resubmit with changes

**Implementation**:
- Add `approval_status` (pending, approved, rejected) field
- Add `approval_requested_by`, `approval_requested_at` fields
- Create notification on approval request
- Add approval/rejection modal with notes field
- Show approval timeline in expanded card

---

### 3.2 Scenario to Proposal Workflow
**Current State**: "Create Proposal" available when completed
**Missing**:
- [ ] **Proposal template selection** — Choose cover letter template before creating
- [ ] **Auto-SBC attachment** — Automatically include Summary of Benefits & Coverage
- [ ] **Review before send** — Preview proposal before dispatch
- [ ] **Schedule send** — "Send proposal tomorrow at 8 AM"
- [ ] **Track proposal status** — See if proposal was viewed/approved
- [ ] **Proposal versioning** — Track scenario → proposal → revised proposal chains

**Implementation**:
- Enhance CreateProposalFromScenario component with template picker
- Add step-by-step workflow UI
- Preview modal before sending
- Add scheduled send (requires backend support)
- Link to proposals page to show related proposals

---

### 3.3 Scenario Cloning & Variants
**Current State**: Clone button exists
**Missing**:
- [ ] **Smart clone options** — "Clone but change contribution %" or "Clone with different carriers"
- [ ] **Template cloning** — Start from saved template scenarios
- [ ] **Clone chain visualization** — Show scenario was cloned from X, which was cloned from Y
- [ ] **Diff after clone** — Highlight what changed compared to source
- [ ] **Bulk clone** — Clone scenario across multiple employers

**Implementation**:
- Expand CloneScenarioDialog with options
- Add template feature (save scenario as template)
- Show clone lineage in scenario details
- Add diff viewer for cloned scenarios

---

### 3.4 Integration with Census Data
**Current State**: Scenario references case but not census details
**Missing**:
- [ ] **Census snapshot** — Link to census used for this quote
- [ ] **Census validation status** — "Census has 5 validation issues"
- [ ] **Member risk summary** — "47% standard risk, 30% elevated, 23% high risk"
- [ ] **Demographic impact** — Scenario cost adjusted for older workforce, etc.
- [ ] **Census change detection** — "Census was updated; rates may have changed"

**Implementation**:
- Store `census_version_id` reference in scenario
- Fetch census summary on scenario card expansion
- Show risk tier breakdown from GradientAI data
- Flag if census updated after scenario creation

---

## SECTION 4: Analytics & Reporting (Lower Priority)

### 4.1 Scenario Performance Analytics
**Current State**: No analytics
**Missing**:
- [ ] **Acceptance rate** — % of scenarios that become proposals
- [ ] **Time to completion** — Average days from creation to "completed"
- [ ] **Cost evolution** — How does average scenario cost trend?
- [ ] **Carrier preferences** — Which carriers appear in recommended scenarios most?
- [ ] **Product mix trends** — Are more employers adding voluntary benefits?

**Implementation**:
- Create ScenarioAnalytics entity to track aggregates
- Build dashboard showing trends over time
- Add charts to Quotes KPI bar

---

### 4.2 Scenario Audit Trail
**Current State**: Only shows if notes exist
**Missing**:
- [ ] **Full change log** — Every field change with timestamp + user
- [ ] **Audit trail viewer** — Sidebar showing complete edit history
- [ ] **Who accessed it** — Track which brokers viewed scenario
- [ ] **Export audit log** — For compliance reporting

**Implementation**:
- Add ActivityLog record on scenario updates
- Create audit trail viewer modal
- Track access in application logs

---

### 4.3 Reporting & PDF Export
**Current State**: No native export
**Missing**:
- [ ] **Scenario report PDF** — Professional report with all scenario details
- [ ] **Comparison report** — Multi-scenario comparison as PDF
- [ ] **Executive summary** — One-pager with key metrics
- [ ] **Detailed specs** — Full plan details, network info, exclusions
- [ ] **Email report** — Send to employer/employee

**Implementation**:
- Add "Export as PDF" button in dropdown
- Use jsPDF to generate professional layouts
- Create template for different report types
- Add email option (requires backend support)

---

## SECTION 5: Mobile & Responsive Enhancements (Lower Priority)

### 5.1 Mobile Scenario Card
**Current State**: Likely cramped on mobile
**Missing**:
- [ ] **Responsive card design** — Stack info vertically on mobile
- [ ] **Touch-friendly buttons** — Larger tap targets
- [ ] **Mobile comparison** — Swipe to compare scenarios
- [ ] **Mobile filtering** — Slide-out filter panel instead of header

**Implementation**:
- Add mobile breakpoints to ScenarioCard
- Reorganize card layout for mobile
- Use Drawer component for filters on mobile

---

## SECTION 6: Integration Points

### 6.1 PolicyMatchAI Integration
**Current State**: Reference to PolicyMatchAI page exists
**Missing**:
- [ ] **Run AI matching from here** — "Analyze this scenario with AI"
- [ ] **Show AI results inline** — Display match confidence, risk score
- [ ] **AI recommendations badge** — "AI suggests alternative plan"
- [ ] **Accept/reject AI** — Track whether broker followed AI recommendation

**Implementation**:
- Add "Run AI Analysis" button
- Call `policyMatchAI` backend function
- Store result in PolicyMatchResult entity
- Show results in expandable card section

---

### 6.2 DocuSign Integration
**Current State**: No DocuSign on quotes
**Missing**:
- [ ] **Send for e-signature** — "Have employer sign-off on this scenario"
- [ ] **Track signature status** — See if scenario was signed
- [ ] **Signed document** — Store/retrieve signed proposal

**Implementation**:
- Add "Send for Signature" button
- Call DocuSign backend function
- Track envelope status
- Link to signed document

---

## SECTION 7: New Modals & Dialogs

### 7.1 Scenario Details Modal
**A comprehensive view replacing/enhancing dropdown menu:**
- Full scenario name/description
- All assumptions & notes
- Financial breakdown (charts)
- Plan details grid
- Contribution model visualization
- Approval workflow panel
- Audit trail
- Related proposals
- Related census

**Implementation**: Create `ScenarioDetailModal.jsx` component

---

### 7.2 Contribution Modeling Modal
**Deep dive into contribution strategy:**
- Slider for EE %, Dep %
- Class-based rules editor
- Real-time cost updates
- ACA affordability check
- Comparison to previous model
- Save model variants

**Implementation**: Expand ContributionModeling page or create inline modal

---

## SECTION 8: Quick Enhancements (Easy Wins)

### Low-effort, high-value additions:
- [ ] **Keyboard shortcuts** — 'N' for new, 'C' for compare, 'E' for expand
- [ ] **Copy scenario ID** — Click icon to copy to clipboard
- [ ] **Scenario templates** — "Start with Conservative" template
- [ ] **Search within scenario** — Search scenario name, notes, plan names
- [ ] **Scenario favorites/pin** — Mark favorites to show first
- [ ] **Last viewed scenarios** — Quick access to recently used scenarios
- [ ] **Scenario counts by status** — Dashboard showing draft/running/completed/error counts
- [ ] **Empty state illustrations** — Friendly graphics when no scenarios exist
- [ ] **Tooltips on columns** — Explain what each value means
- [ ] **Dark mode support** — Already in design system, ensure cards look good

---

## Implementation Priority Matrix

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Scenario Details Modal | Medium | HIGH | **1** |
| Rate Lock Management | Low | HIGH | **1** |
| Contribution Slider | Medium | HIGH | **1** |
| Saved Filter Views | Medium | MEDIUM | **2** |
| Scenario Versioning | Medium | MEDIUM | **2** |
| Approval Workflow | Medium | MEDIUM | **2** |
| Plan Detail Modal | Medium | MEDIUM | **2** |
| Bulk Export CSV | Low | MEDIUM | **2** |
| Recommendation Transparency | Medium | MEDIUM | **2** |
| Scenario Comparison Enhancements | Low | MEDIUM | **3** |
| ROI Analysis | Medium | MEDIUM | **3** |
| PolicyMatchAI Integration | Low | MEDIUM | **3** |
| PDF Export | Low | MEDIUM | **3** |
| Analytics Dashboard | High | LOW | **4** |
| Mobile Responsiveness | Medium | LOW | **4** |
| DocuSign Integration | Medium | LOW | **4** |

---

## Data Model Additions Required

### QuoteScenario (additional fields):
```json
{
  "versions": [{ version_number, created_at, created_by, data_snapshot }],
  "rate_lock_expires_at": "ISO date or null",
  "rate_locked_by": "user@email.com",
  "rate_locked_at": "ISO date",
  "description": "text",
  "tags": ["array", "of", "tags"],
  "approval_status": "pending|approved|rejected|none",
  "approval_requested_by": "user@email.com",
  "approval_requested_at": "ISO date",
  "approval_notes": "text",
  "census_version_id": "UUID",
  "talking_points": ["point1", "point2"],
  "disruption_score": 0-100,
  "confidence_level": "high|medium|low"
}
```

### New Entities:
- `ViewPreset` — Saved filter combinations
- `ScenarioTemplate` — Reusable scenario templates
- `ApprovalWorkflow` — Tracks approval requests/responses

---

## Recommended Rollout Plan

### Phase 1 (Week 1-2): Core UX Improvements
1. Scenario Details Modal
2. Rate Lock Management
3. Bulk CSV Export
4. Quick keyboard shortcuts

### Phase 2 (Week 3-4): Workflow Features
1. Approval Workflows
2. Contribution Modeling Slider
3. Saved Filter Views
4. Scenario Versioning

### Phase 3 (Week 5-6): Analytics & Integrations
1. Recommendation Transparency
2. ROI Analysis
3. PolicyMatchAI Integration
4. PDF Export

### Phase 4 (Beyond): Polish & Mobile
1. Mobile Responsiveness
2. DocuSign Integration
3. Analytics Dashboard
4. Template System

---

## Ready to Review

**Which phase should we focus on?**
- ✅ Approve Phase 1 only (quick wins)
- ✅ Approve Phase 1-2 (complete workflows)
- ✅ Approve Phase 1-3 (full feature set)
- ✅ Modifications needed — tell me what to adjust

**Or pick specific features** from the priority matrix you want me to implement first.