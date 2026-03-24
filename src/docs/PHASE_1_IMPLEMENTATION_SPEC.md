# Phase 1: Critical Workflow Gaps - Detailed Implementation Spec

**Goal**: Make core workflows (cases → quotes → proposals → enrollment) faster & more reliable

---

## 1. CASES PAGE

### Feature: Bulk Operations
**What**: Select multiple cases, apply status/assignment changes in batch
**Components to Build**:
- `CaseSelectionBar` — Checkboxes, select all toggle, bulk action menu
- `BulkCaseUpdateModal` — Dialog for bulk status/assignment changes
**Data Changes**:
- Add API endpoint: `PATCH /api/cases/bulk` for batch updates
**Estimated Effort**: 4 hours

### Feature: Advanced Filters
**What**: Search + filter by status, stage, broker, date range, employer name (save presets)
**Components to Build**:
- `CaseFilterPanel` — Collapsible filter UI with date pickers, dropdowns, text search
- `SavedFilterButtons` — Quick access to saved filter presets
**Data Changes**:
- Add `UserFilterPreset` entity to save filter configurations
**Estimated Effort**: 6 hours

### Feature: Case Timeline/History
**What**: Visual timeline showing progression (draft → census → quote → proposal → enrollment → active)
**Components to Build**:
- `CaseProgressTimeline` — Vertical/horizontal timeline with stage cards
- `ActivityFeed` — Recent changes with timestamps and user names
**Data Changes**:
- Ensure `ActivityLog` entity is populated on case stage changes
**Estimated Effort**: 5 hours

### Feature: Duplicate Case Detection
**What**: When creating case, warn if employer already has active case
**Components to Build**:
- `DuplicateCaseWarning` — Alert modal on case creation
**Data Changes**:
- Add validation check on case creation
**Estimated Effort**: 2 hours

### Feature: Case Templates
**What**: Copy settings (products, contributions, assumptions) from previous case
**Components to Build**:
- `CaseTemplateSelector` — Choose past case as template on creation
- `TemplatePreview` — Show settings before creating
**Data Changes**:
- None (use existing BenefitCase data)
**Estimated Effort**: 3 hours

---

## 2. CENSUS PAGE

### Feature: Field Mapping UI
**What**: Let brokers map CSV columns to system fields on upload (e.g., "Col A" → first_name)
**Components to Build**:
- `CensusColumnMapper` — Drag-drop or dropdown to map CSV headers
- `MappingPreview` — Show sample rows with mapped fields
**Data Changes**:
- Add `CensusMappingProfile` entity to save mapping templates
**Estimated Effort**: 7 hours

### Feature: Data Quality Dashboard
**What**: Summary of missing fields, invalid formats, missing SSN, etc. with drill-down
**Components to Build**:
- `DataQualityScore` — Overall % of data completeness by field
- `IssueTable` — Sortable list of issues with member details
- `QualityTrend` — Chart showing quality improvement over versions
**Data Changes**:
- Populate `CensusMember.validation_issues` on upload
**Estimated Effort**: 6 hours

### Feature: Member Edit Inline
**What**: Edit individual census rows without re-uploading
**Components to Build**:
- `CensusMemberRow` — Make fields editable with validation
- `QuickEditModal` — For editing dependent details, class codes
**Data Changes**:
- Add API endpoint: `PATCH /api/census-members/:id`
**Estimated Effort**: 5 hours

### Feature: Batch Operations
**What**: Mark eligible/ineligible, assign class codes in bulk
**Components to Build**:
- `CensusSelectionBar` — Multi-select with bulk update menu
- `BulkClassCodeAssignment` — Modal to assign class to selected members
**Data Changes**:
- Add API endpoint: `PATCH /api/census-members/bulk`
**Estimated Effort**: 4 hours

### Feature: Demographics Chart
**What**: Visual summary of census composition (age, gender, coverage tier distribution)
**Components to Build**:
- `CensusDemographicsChart` — Age distribution bar chart
- `CoverageDistribution` — Pie chart (EE only, EE+spouse, family)
- `DepartmentSummary` — Table showing count by dept/location
**Data Changes**:
- None (aggregate existing CensusMember data)
**Estimated Effort**: 4 hours

### Feature: Duplicate Member Detection
**What**: Flag same SSN or name+DOB appearing twice
**Components to Build**:
- `DuplicateAlert` — Badge on duplicate members in table
- `DuplicateReview` — Dialog to merge or delete duplicates
**Data Changes**:
- Add duplicate detection logic on upload/validation
**Estimated Effort**: 3 hours

---

## 3. QUOTES PAGE

### Feature: Quote Comparison Matrix
**What**: Side-by-side plan details, costs, coverage
**Components to Build**:
- `QuoteComparisonTable` — Rows: plans, carriers, deductible, copay, premium, etc.
- `ComparisonToggle` — Select which scenarios to compare
**Data Changes**:
- None (aggregate existing QuoteScenario + ScenarioPlan data)
**Estimated Effort**: 5 hours

### Feature: What-If Modeling
**What**: Sliders for contribution %, deductible, see impact in real-time
**Components to Build**:
- `ContributionSlider` — Adjust % live, recalculate totals
- `DeductibleSlider` — Filter plans by max deductible
- `ImpactSummary` — Show cost changes, member impact
**Data Changes**:
- Add temporary "draft" scenario state for unsaved changes
**Estimated Effort**: 8 hours

### Feature: Quote Expiration Tracking
**What**: Show which quotes are expiring soon, countdown timer
**Components to Build**:
- `ExpirationBadge` — Red/yellow warning on scenario card
- `ExpiringQuotesAlert` — Dashboard widget listing expiring quotes
**Data Changes**:
- Add `expires_at` timestamp to QuoteScenario
**Estimated Effort**: 3 hours

### Feature: Rate Lock Management
**What**: Lock rates for X days, show countdown, option to extend
**Components to Build**:
- `RateLockCard` — Shows lock expiry with extend button
- `LockExtensionModal` — Confirm extension (may cost extra)
**Data Changes**:
- Add `rate_locked_until` timestamp to QuoteScenario
- Add API endpoint: `POST /api/quotes/:id/extend-lock`
**Estimated Effort**: 4 hours

### Feature: Scenario Versioning
**What**: Track quote edits, revert to previous versions
**Components to Build**:
- `VersionHistory` — List of edits with timestamps
- `VersionCompare` — Show changes between versions
- `RevertButton` — Restore previous version
**Data Changes**:
- Add `QuoteScenarioVersion` entity to track changes
**Estimated Effort**: 6 hours

### Feature: Broker Notes/Assumptions
**What**: Attach assumptions, caveats, special considerations to scenario
**Components to Build**:
- `NotesPanel` — Rich text editor for broker assumptions
- `AssumptionsCheckbox` — Pre-built assumption templates (e.g., "waiving coverage for over-65")
**Data Changes**:
- Add `assumptions_notes` field to QuoteScenario
**Estimated Effort**: 3 hours

---

## 4. PROPOSALS PAGE

### Feature: Proposal Templates
**What**: Pre-built cover letters, plan summaries by product type
**Components to Build**:
- `TemplateLibrary` — Browse templates by product (medical, dental, vision)
- `TemplateEditor` — Edit and save templates with placeholders {{employer_name}}, {{date}}, etc.
- `TemplateSelector` — Choose template when creating proposal
**Data Changes**:
- Add `ProposalTemplate` entity
**Estimated Effort**: 6 hours

### Feature: Version Control
**What**: Track changes between proposal versions
**Components to Build**:
- `VersionTimeline` — Show v1, v2, v3 edits with user/date
- `VersionDiff` — Highlight what changed between versions
**Data Changes**:
- Increment `Proposal.version` on updates
- Track `updated_by`, `updated_at` in Proposal
**Estimated Effort**: 4 hours

### Feature: Delivery Tracking
**What**: Email open/click tracking, PDF views, when opened
**Components to Build**:
- `DeliveryStatus` — Shows sent/delivered/opened/viewed status
- `TrackingTimeline` — When email opened, PDF downloaded, etc.
**Data Changes**:
- Add `opened_at`, `pdf_viewed_at`, `link_clicked_at` to Proposal
- Track via email/PDF link webhooks
**Estimated Effort**: 7 hours

### Feature: Approval Workflows
**What**: Require manager sign-off before sending
**Components to Build**:
- `ApprovalRequest` — Send for review modal
- `ApprovalQueue` — Managers see pending approvals
- `ApprovalStatus` — Pending/approved/rejected badge
**Data Changes**:
- Add `approval_status`, `approved_by`, `approved_at` to Proposal
**Estimated Effort**: 5 hours

### Feature: SBC Integration
**What**: Automatically attach Summary of Benefits & Coverage PDFs
**Components to Build**:
- `SBCSelector` — Choose which plans to attach SBCs for
- `SBCPreview` — Show SBC documents to be attached
**Data Changes**:
- Add `sbc_documents` array to Proposal
- Link to carrier SBC URLs or stored PDFs
**Estimated Effort**: 4 hours

---

## 5. ENROLLMENT PAGE

### Feature: Pre-Enrollment Checklist
**What**: Plan educational materials, communication schedule
**Components to Build**:
- `EnrollmentChecklist` — Tasks: materials ready, emails scheduled, dates set
- `MaterialsLibrary` — Video links, PDF guides by product
- `CommunicationSchedule` — Calendar of planned emails to employees
**Data Changes**:
- Add `EnrollmentChecklistItem` entity
**Estimated Effort**: 5 hours

### Feature: Employee Engagement Dashboard
**What**: % enrolled, % pending, % waived by department/location
**Components to Build**:
- `EngagementMeter` — Progress bar showing enrollment rate
- `DepartmentTable` — Breakdown by dept/location with % enrolled
- `EmployeeRoster` — Filter by status (invited, enrolled, waived, pending)
**Data Changes**:
- Aggregate counts from EnrollmentMember
**Estimated Effort**: 5 hours

### Feature: Reminder Scheduler
**What**: Auto-send emails at X days before deadline
**Components to Build**:
- `ReminderScheduleForm` — Set X reminder dates before deadline
- `ReminderPreview` — Show scheduled emails in calendar
**Data Changes**:
- Add `EnrollmentReminder` entity with dates and email template
- Add backend task to send reminders on schedule
**Estimated Effort**: 6 hours

### Feature: Life Event Triggers
**What**: Allow mid-year changes (marriage, birth, hire)
**Components to Build**:
- `LifeEventModal` — Form for employee to report event
- `SpecialEnrollmentPeriod` — Extend enrollment outside normal window
**Data Changes**:
- Add `EmployeeLifeEvent` entity
- Allow enrollment after window close if life event recorded
**Estimated Effort**: 4 hours

### Feature: Communication Templates
**What**: Email/SMS for invitations, reminders, confirmations
**Components to Build**:
- `EmailTemplateEditor` — Create/edit templates with preview
- `SMSTemplateEditor` — Short message templates
**Data Changes**:
- Add `EnrollmentEmailTemplate`, `EnrollmentSMSTemplate` entities
**Estimated Effort**: 4 hours

---

## 6. EMPLOYEE ENROLLMENT (Portal)

### Feature: Plan Comparison Tool
**What**: Side-by-side plans with cost calculators
**Components to Build**:
- `PlanComparisonGrid` — Select 2-3 plans, see side-by-side
- `CostCalculator` — Input doctor visits, show employee cost for each plan
**Data Changes**:
- None (use existing BenefitPlan data)
**Estimated Effort**: 6 hours

### Feature: Provider Directory Search
**What**: Look up doctors/hospitals in network
**Components to Build**:
- `ProviderSearch` — Enter provider name, show results by plan
- `NetworkMap` — Map of providers near employee
**Data Changes**:
- Integrate with carrier provider APIs (Anthem, UHC, etc.)
**Estimated Effort**: 8 hours

### Feature: Dependent Management
**What**: Add/edit spouses and children with validation
**Components to Build**:
- `DependentForm` — Add spouse/child with name, DOB, SSN
- `DependentTable` — Edit/remove dependents, show coverage tiers
- `DependentValidation` — Warn if SSN duplicate, age inconsistency
**Data Changes**:
- Enhance `EmployeeEnrollment.dependents` JSONB structure
**Estimated Effort**: 5 hours

### Feature: Coverage Summary PDF
**What**: Generate what-if coverage document before submission
**Components to Build**:
- `SummaryButton` — Generate PDF preview of coverage
**Data Changes**:
- Add PDF generation backend function
**Estimated Effort**: 4 hours

### Feature: Enrollment Confirmation
**What**: Post-selection review page before submission
**Components to Build**:
- `ConfirmationPage` — Review selected plan, dependents, cost, terms
- `AcceptanceCheckbox` — Agree to coverage terms
**Data Changes**:
- None (UI enhancement)
**Estimated Effort**: 3 hours

### Feature: Session Timeout Warning
**What**: Alert before session expires (security)
**Components to Build**:
- `SessionTimeoutWarning` — Modal warning 5 mins before logout
**Data Changes**:
- None (use existing auth library)
**Estimated Effort**: 2 hours

---

## 7. RENEWALS PAGE

### Feature: Renewal Timeline
**What**: Countdown to renewal date with milestone checklist
**Components to Build**:
- `RenewalCountdown` — Days until renewal with progress bar
- `MilestoneChecklist` — Market, options ready, decision, install
**Data Changes**:
- Add `RenewalMilestone` entity to track completion dates
**Estimated Effort**: 4 hours

### Feature: Rate Change Analysis
**What**: Show % increase, impact per employee
**Components to Build**:
- `RateChangeCard` — % increase, total increase, per-employee impact
- `ImpactChart` — Cost comparison this year vs. next year
**Data Changes**:
- Add `previous_premium`, `renewal_premium` to RenewalCycle
**Estimated Effort**: 3 hours

### Feature: Disruption Scoring
**What**: Flag high-disruption renewals (major plan changes)
**Components to Build**:
- `DisruptionScore` — 0-100 score, color-coded (green/yellow/red)
- `DisruptionBreakdown` — What's changing (network, copays, formulary)
**Data Changes**:
- Add `disruption_score` to RenewalCycle
**Estimated Effort**: 3 hours

### Feature: Renewal Options
**What**: Renew as-is vs. market vs. terminate
**Components to Build**:
- `RenewalOptionsCard` — 3 radio buttons showing cost/timeline for each
**Data Changes**:
- Add `renewal_decision` enum field to RenewalCycle
**Estimated Effort**: 2 hours

### Feature: Retention Strategy Recommendations
**What**: Suggest actions to retain employer
**Components to Build**:
- `RetentionSuggestions` — List of tactics (e.g., improve network, adjust copay)
**Data Changes**:
- Add retention logic (based on rate increase, disruption, competitor intel)
**Estimated Effort**: 5 hours

---

## 8. POLICY MATCH AI PAGE

### Feature: Confidence Score
**What**: Show % confidence in recommendation
**Components to Build**:
- `ConfidenceBadge` — "95% confident this is right plan"
**Data Changes**:
- Add `confidence_score` to PolicyMatchResult
**Estimated Effort**: 2 hours

### Feature: Broker Talking Points
**What**: Auto-generate sales arguments
**Components to Build**:
- `TalkingPointsCard` — Bullet list of why member should choose plan
**Data Changes**:
- Add `broker_talking_points` array to PolicyMatchResult
**Estimated Effort**: 4 hours

### Feature: Cost Impact Summary
**What**: How much the AI recommendation saves/costs vs. current
**Components to Build**:
- `CostImpactCard` — "$X/month savings" or "$Y/month increase"
- `ROI` — "Employee saved X%, employer saved Y%"
**Data Changes**:
- Add `cost_delta_pmpm`, `savings_summary` to PolicyMatchResult
**Estimated Effort**: 3 hours

### Feature: Member-Level Breakdown
**What**: Show which members drive the recommendation
**Components to Build**:
- `MemberBreakdown` — List of high-impact members and why
**Data Changes**:
- Add member-specific risk scoring in policy match logic
**Estimated Effort**: 4 hours

### Feature: Acceptance Tracking
**What**: Track which recommendations were used vs. rejected
**Components to Build**:
- `AcceptanceButton` — Accept/reject recommendation, note reason
- `AcceptanceHistory` — View past accepted/rejected matches
**Data Changes**:
- Add `accepted`, `accepted_at`, `rejected_reason` to PolicyMatchResult
**Estimated Effort**: 3 hours

---

## Implementation Order (Dependencies)

### Week 1
1. **Cases**: Bulk ops, filters, timeline (foundation for other features)
2. **Census**: Field mapping, data quality (needed before quoting)

### Week 2
3. **Census**: Member edit, batch ops, demographics, duplicate detection
4. **Quotes**: Comparison matrix, what-if modeling (core to quoting)

### Week 3
5. **Quotes**: Expiration, rate lock, versioning, notes
6. **Proposals**: Templates, version control, delivery tracking

### Week 4
7. **Proposals**: Approval workflows, SBC integration
8. **Enrollment**: Checklist, engagement dashboard, reminders

### Week 5
9. **Enrollment**: Life events, communication templates
10. **EmployeeEnrollment**: Plan comparison, provider search, dependent mgmt

### Week 6
11. **EmployeeEnrollment**: Coverage PDF, confirmation, session timeout
12. **Renewals**: Timeline, rate change, disruption, options
13. **PolicyMatchAI**: All features

---

## Total Effort Estimate
- **Components to Build**: ~70 new components
- **Backend Changes**: ~15 new API endpoints, 5 new entities
- **Total Effort**: ~200 hours (5 weeks for one developer)

---

## Next Steps

**Ready to proceed?** I can:
1. ✅ Start building Week 1 features (Cases + Census)
2. ⚠️ Adjust order/scope if you have different priorities
3. 🔄 Dive deeper into specific features
4. ❌ Skip to different phase

Which would you prefer?