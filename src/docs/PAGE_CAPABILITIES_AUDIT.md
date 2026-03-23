# Application Pages: Capabilities & Feature Gap Analysis
**Date:** 2026-03-23  
**Scope:** 30 routed pages across 8 modules + help system  
**Analysis Type:** Feature gaps, functionality, usability, and structural improvements

---

## EXECUTIVE SUMMARY

### Critical Gaps Identified

| Category | Count | Priority | Examples |
|----------|-------|----------|----------|
| **Missing CRUD Operations** | 12 | 🔴 HIGH | Employers bulk import, Task bulk operations, Renewal templates |
| **No Batch/Bulk Actions** | 8 | 🔴 HIGH | Cases, Exceptions, Plans, Enrollments |
| **Limited Filtering/Sorting** | 10 | 🟡 MEDIUM | Tasks, Renewals, Quotes lack advanced filters |
| **Missing Export/Import** | 15 | 🟡 MEDIUM | Most pages lack CSV/Excel export |
| **No Role-Based Views** | 7 | 🟡 MEDIUM | Admin vs. Broker vs. Employer views not differentiated |
| **Missing Audit Trail** | 8 | 🟡 MEDIUM | Who changed what and when not visible |
| **Incomplete Workflows** | 6 | 🔴 HIGH | Enrollment follow-ups, Renewal decision tracking |
| **No Real-Time Sync** | 12 | 🟡 MEDIUM | Manual refresh required; no WebSocket updates |
| **Missing Analytics/Reporting** | 10 | 🟡 MEDIUM | Page-level KPI dashboards, trend analysis |
| **Incomplete Data Validation** | 7 | 🟡 MEDIUM | Client-side validation only; no pre-save checks |

---

## MODULE-BY-MODULE DETAILED ANALYSIS

---

### 🎯 DASHBOARD (Page #1)
**Route:** `/`  
**Type:** dashboard  
**Current Status:** ✅ Basic dashboard exists

#### Missing Features

1. **Customizable Widgets**
   - ❌ Users cannot customize which KPIs to display
   - ❌ No widget positioning/save preferences
   - ✅ RECOMMENDATION: Add widget drag-and-drop, save layout to localStorage

2. **Advanced Filtering**
   - ❌ No date range picker for trend analysis
   - ❌ Cannot filter by agency/employer group
   - ✅ RECOMMENDATION: Add global date range, agency filter, role-based view filters

3. **Drill-Down Analytics**
   - ❌ Clicking KPI cards doesn't drill into detail view
   - ❌ No trend charts (week/month/year comparisons)
   - ✅ RECOMMENDATION: Interactive KPI cards → filtered list views, sparkline trends

4. **Real-Time Updates**
   - ❌ Must manually refresh to see new cases/enrollments
   - ✅ RECOMMENDATION: WebSocket subscription to BenefitCase, EnrollmentWindow, CaseTask entities

5. **Action Shortcuts**
   - ❌ No quick-create buttons (New Case, New Task, etc.)
   - ✅ RECOMMENDATION: Add floating action menu or top-right quick actions

6. **Email Notifications** (admin only)
   - ❌ No opt-in for daily digest emails
   - ✅ RECOMMENDATION: Dashboard settings → notification preferences

---

### 📋 CASES (Pages #2-4)
**Routes:** `/cases`, `/cases/new`, `/cases/:id`  
**Type:** standard_screen + wizard + detail  
**Current Status:** ✅ Core CRUD complete

#### Missing Features

**Cases List (/cases)**
1. ❌ **Bulk Operations** → Add bulk stage advance, bulk assign, bulk close
2. ❌ **Advanced Search** → Multi-field filters (agency, stage, priority, date range, assigned_to)
3. ❌ **Export** → CSV export with configurable columns
4. ❌ **Column Customization** → Hide/show/reorder columns
5. ❌ **Inline Actions** → Quick edit stage/priority without modal
6. ❌ **Real-Time Updates** → Case list doesn't update when case is edited elsewhere
7. ❌ **Saved Filters** → Save and recall filter presets (e.g., "My In-Progress Cases")
8. ❌ **Sorting by Multiple Columns** → Only single sort supported
9. ❌ **Pagination Info** → No "showing X of Y" indicator
10. ❌ **Keyboard Shortcuts** → No hotkeys for common actions

**New Case (/cases/new)**
1. ❌ **Pre-filled Employer Selection** → If navigated from employer detail, pre-select that employer
2. ❌ **Case Template Selection** → Allow templates (new_business, renewal, mid_year_change, takeover) with pre-filled defaults
3. ❌ **Draft Saving** → Ability to save incomplete case and return later
4. ❌ **Field-Level Help** → Inline help text for every field
5. ❌ **Calculation Helper** → Calculate employee count from census if available
6. ❌ **Product Selection Preview** → Show product details before final selection

**Case Detail (/cases/:id)**
1. ❌ **Multi-Tab Layout Issues** → Activities tab doesn't show who changed what fields
2. ❌ **Case Cloning** → Create new case from existing as template
3. ❌ **Approval Workflow** → Cases requiring approval don't show approval UI
4. ❌ **Change History** → Field-level change audit trail (old → new value)
5. ❌ **Related Entity Quick View** → Modal previews of linked Census, Quotes, Documents without full navigation
6. ❌ **Stage Validation** → Cannot advance to next stage if required data missing (validation error + guidance)
7. ❌ **Batch Task Creation** → When stage changes, auto-create associated tasks for all team members
8. ❌ **Dependency Warnings** → Cannot close case if open tasks or pending enrollments remain
9. ❌ **Email Templates** → Send case summary/updates to employer via email
10. ❌ **Case Handoff** → Reassign case + notify previous owner + auto-update tasks

---

### 👥 EMPLOYERS (Page #11)
**Route:** `/employers`  
**Type:** standard_screen  
**Current Status:** ✅ List exists

#### Missing Features

1. ❌ **Bulk Import**
   - Add CSV/Excel importer for multiple employers
   - Field mapping UI
   - Duplicate detection
   - Validation before insert

2. ❌ **Employer Detail Page**
   - Missing `/employers/:id` route
   - Should show: all cases for this employer, contacts, documents, renewal timeline
   - Inline edit for primary contact, status, renewal date

3. ❌ **Bulk Operations**
   - Bulk status change, bulk renewal date update, bulk contact update
   - Conditional bulk actions based on selection

4. ❌ **Relationship Visualization**
   - Cases per employer, enrollment numbers, total premium, active employees
   - Mini-chart of employer growth/health

5. ❌ **Contact Management**
   - Add/edit multiple contacts per employer
   - Role types (primary contact, billing, HR, benefit admin)
   - Communication history (emails, calls, notes)

6. ❌ **Document Library**
   - Link to all documents associated with this employer
   - Group by case or document type

7. ❌ **Health Score**
   - Calculate employer risk/engagement level based on case velocity, enrollment rates, renewal outcomes

---

### 📊 CENSUS (Page #5)
**Route:** `/census`  
**Type:** standard_screen  
**Current Status:** ✅ Upload and view exists

#### Missing Features

1. ❌ **Census Validation Rules Engine**
   - Pre-upload validation (column headers, data types)
   - Post-upload validation (duplicate SSNs, invalid DOBs, hire dates > effective date)
   - Visual error reporting with row-level feedback
   - Correction workflow (inline editing before approve)

2. ❌ **Member-Level Audit Trail**
   - When a census member is modified, track: old → new values
   - Show who made the change and when

3. ❌ **Bulk Member Edit**
   - Bulk update employment_status, class_code, coverage_tier for subset of members
   - Conditional updates (e.g., "mark all part_time employees as ineligible")

4. ❌ **Census Diff/Comparison**
   - When uploading new version, show what changed
   - Added members, removed members, field changes for existing members

5. ❌ **Member Export**
   - Export current census to Excel with formatting

6. ❌ **Dependent Management**
   - Add/edit dependents inline
   - Age validation against DOB

7. ❌ **GradientAI Integration in Census**
   - Show risk scores within member table
   - Filter/sort by risk tier
   - Highlight high-risk members

8. ❌ **Communication to Employer**
   - Send email: "Please review and approve census before we proceed"
   - Email includes validation warnings

---

### 💰 QUOTES (Page #6)
**Route:** `/quotes`  
**Type:** standard_screen  
**Current Status:** ✅ Scenario management exists

#### Missing Features

1. ❌ **Quote Export/Comparison**
   - Side-by-side scenario comparison table (premiums, contribution, cost delta)
   - Export scenarios to PDF or Excel

2. ❌ **Rate Inquiry**
   - "What-if" modeling: adjust employee count or mix → recalc rates
   - Sensitivity analysis (if we increase contribution 5%, how much does employee cost increase?)

3. ❌ **Quote Expiration Management**
   - Show which quotes expire soon
   - Auto-archive expired quotes
   - Notification when expiring in 7 days

4. ❌ **Carrier-Specific Quotes**
   - Filter/view quotes by specific carrier
   - Carrier communication history

5. ❌ **Quote Approval Workflow**
   - Broker quotes scenario → submits for manager approval → approved scenarios auto-move to proposal
   - Approval email notifications

6. ❌ **Actuarial Notes**
   - Free-text field for assumptions, calculation notes, disclaimers
   - Persist with each scenario

7. ❌ **Quote Template**
   - Save successful quote scenario as template for future cases

8. ❌ **Price Lock**
   - Mark quotes as "price locked" with date/duration
   - Show remaining lock duration

---

### 📄 PROPOSALS (Page #7)
**Route:** `/proposals`  
**Type:** standard_screen  
**Current Status:** ✅ Basic proposal builder exists

#### Missing Features

1. ❌ **Multi-Scenario Proposal**
   - Proposal can include multiple scenarios (not just one)
   - Employer can compare options within single proposal

2. ❌ **Approval Workflow**
   - Broker submits proposal → manager reviews → approves/rejects
   - Approval comments + audit trail

3. ❌ **Dynamic Proposal Generation**
   - PDF generation with custom cover letter, plan summaries, cost breakdowns
   - Embedded comparison tables

4. ❌ **SBC Management**
   - Auto-attach SBCs for each plan in proposal
   - Track which SBCs were sent to employer

5. ❌ **Proposal History/Versions**
   - Track proposal revisions
   - "What changed?" between versions
   - Rollback to previous version option

6. ❌ **Employer Response Tracking**
   - Track: sent_at, first_viewed_at, approved_at, rejected_at
   - Send automated follow-up reminders (7 days, then 14 days if no response)
   - Show proposal response status on case detail

7. ❌ **Plan Recommendation Rationale**
   - For each plan in proposal, show "why we recommended this"
   - Cost analysis, risk profile, regulatory compliance notes

---

### 📝 ENROLLMENT (Page #8)
**Route:** `/enrollment`  
**Type:** standard_screen  
**Current Status:** ✅ Window management exists

#### Missing Features

1. ❌ **Enrollment Window States**
   - Pre-open: show countdown
   - Open: show participant status (pending → invited → started → completed/waived)
   - Closing soon: show "5 days left" banner
   - Closed: show results and next steps

2. ❌ **Participant Status Tracking**
   - Filter by status (pending, invited, in-progress, completed, waived)
   - Drill into individual to see: what plan they selected, coverage tier, dependents
   - Bulk actions: re-send invites, mark as completed if no response after deadline

3. ❌ **Participation Metrics**
   - Real-time participation rate (% enrolled of invited)
   - Breakdown by department/location
   - Identify low-participation groups

4. ❌ **Waiver Management**
   - Capture waiver reason codes
   - Bulk waiver actions
   - Track employer acknowledgment of waivers

5. ❌ **Employee Self-Service Portal Link**
   - Generate unique secure link for each employee
   - Send via email with deadline
   - Track link clicks and starts

6. ❌ **Dependent Management in Enrollment**
   - Allow employees to add/edit dependents during enrollment
   - Validate dependent DOBs, SSNs

7. ❌ **Plan Recommendation in Enrollment**
   - Based on member risk profile (GradientAI), recommend best plan
   - Show recommended plan first in employee portal

8. ❌ **Enrollment Follow-Up Tasks**
   - Auto-create tasks to reach out to non-responders
   - Escalate after 3 days no response

---

### 🔄 RENEWALS (Page #9)
**Route:** `/renewals`  
**Type:** standard_screen  
**Current Status:** ✅ Renewal management exists

#### Missing Features

1. ❌ **Renewal Decision Workflow**
   - Current state: Show renewal metrics
   - Missing: Broker → Manager workflow for "renew as-is" vs "market" decision
   - Decision approval, implementation tracking

2. ❌ **Rate Change Analysis**
   - Show rate change %, reason codes
   - Provide talking points for broker
   - Calculate impact on employee costs

3. ❌ **Renewal Communication Templates**
   - "Rates renewing, here's what changed" email template
   - "Please confirm renewal" approval request template
   - Auto-send to employer on schedule

4. ❌ **Disruption Scenario Planning**
   - If carrier makes significant changes, model alternative options
   - "If we market, here's what we might find" projection

5. ❌ **Renewals Calendar View**
   - Visual calendar showing renewal dates across all cases
   - Filter by month, agency, renewal status

6. ❌ **Bulk Renewal Operations**
   - Bulk approval of renewals
   - Bulk status advance (marketed → options prepared → approved → installed)

7. ❌ **Renewal Installation Tracking**
   - When renewal approved, auto-create "install renewal" case task
   - Track implementation steps and completion

8. ❌ **Historical Renewal Analysis**
   - Compare past renewal rates to understand trend
   - Calculate ROI of renewal strategies

---

### ✅ TASKS (Page #10)
**Route:** `/tasks`  
**Type:** standard_screen  
**Current Status:** ✅ Basic task management exists

#### Missing Features

1. ❌ **Kanban Board View**
   - Columns: pending → in_progress → blocked → completed
   - Drag-drop to change status
   - Swimlanes by assignee or priority

2. ❌ **Bulk Operations**
   - Select multiple tasks → bulk assign, bulk priority change, bulk due date extend
   - Bulk completion with note

3. ❌ **Task Dependencies**
   - Define task prerequisites ("Task B cannot start until Task A is complete")
   - Visual dependency graph

4. ❌ **Task Reminders**
   - Email reminder 1 day before due
   - Escalation: mark overdue tasks in red, auto-alert manager

5. ❌ **Sub-Tasks**
   - Break complex tasks into smaller checkpoints
   - Track completion % of parent task

6. ❌ **Time Tracking**
   - Estimate hours per task
   - Log actual hours spent
   - Burndown chart for case-level timeline

7. ❌ **Task Templates**
   - Common case workflows (new_business, renewal, mid_year) have pre-defined task templates
   - Auto-create task set when case stage changes

8. ❌ **Inline Comments/Notes**
   - Add comments directly on task without modal
   - @mention teammates
   - File attachments

9. ❌ **Task Analytics**
   - Average resolution time by task type
   - Most commonly blocked tasks (identify bottlenecks)
   - Team productivity metrics

---

### 📚 PLANS (Page #12 — Plan Library)
**Route:** `/plans`  
**Type:** standard_screen  
**Current Status:** ✅ Plan library view exists

#### Missing Features

1. ❌ **Plan Versioning**
   - Track plan changes over time (rate change, design change)
   - Comparison: "What changed from 2025 to 2026 version?"

2. ❌ **Plan Network/Provider View**
   - Integrated links to carrier provider directory
   - Sample cost scenarios (in-network vs. out-of-network)

3. ❌ **Plan Availability Calendar**
   - Show which plans available in which states
   - Effective date visibility

4. ❌ **Plan Utilization Metrics**
   - How many active cases use this plan?
   - Enrollment rate for this plan vs. other plans
   - Claim trend data (if available from carriers)

5. ❌ **Formulary/Network Management**
   - Integrated drug formulary search (Rx plans)
   - In-network provider search

6. ❌ **Plan Recommendations Engine**
   - Given employer profile (size, industry, geography), recommend top 3 plans
   - Comparison table: cost, coverage, network quality

7. ❌ **Plan Document Repository**
   - Link to actual plan documents (policy, SBC, rate cards)
   - Version control

8. ❌ **Market Basket Analysis**
   - For this age/gender mix, what's the sample premium in this plan?
   - Cost calculator

---

### 🚨 EXCEPTIONS (Page #13)
**Route:** `/exceptions`  
**Type:** standard_screen  
**Current Status:** ✅ Exception queue exists

#### Missing Features

1. ❌ **Exception Triage Workflow**
   - Severity-based sorting and escalation
   - Assignment → investigation → resolution with documented decision

2. ❌ **Root Cause Tagging**
   - Mark exceptions with root cause codes
   - Identify systemic issues (e.g., "census validation failures increasing")

3. ❌ **Bulk Exception Resolution**
   - Bulk mark as resolved (e.g., "All 5 carriers are now reporting correct rates")
   - Bulk notification to affected cases

4. ❌ **Exception Analytics**
   - Top exception types by frequency
   - Average time to resolution
   - Trend analysis (exceptions increasing/decreasing over time?)

5. ❌ **Automation Rules**
   - Auto-resolve certain exception types (e.g., "carrier quote delay > 48 hrs" → auto-escalate to manager)
   - Auto-create follow-up tasks

6. ❌ **SLA Tracking**
   - Exceptions flagged if exceeding SLA (e.g., "high severity must be resolved within 24 hrs")
   - Dashboard view of overdue exceptions

7. ❌ **Communication to Stakeholders**
   - Auto-notify employer if exception affects them
   - Status updates on resolution

---

### 💹 CONTRIBUTIONS (Page #14)
**Route:** `/contributions`  
**Type:** standard_screen  
**Current Status:** ✅ Contribution modeling exists

#### Missing Features

1. ❌ **Plan-Specific Contribution Rules**
   - Define contribution by class code, plan type, coverage tier
   - Non-uniform contribution (e.g., "pay 80% EE, 50% spouse, 25% children")

2. ❌ **ACA Affordability Validation**
   - Auto-check: "Is this contribution strategy ACA-compliant?"
   - Show affordability threshold and current affordability rate

3. ❌ **Contribution Comparison**
   - "What if we move from 80/50/25 to 75/50/25?" → show cost impact
   - Sensitivity analysis

4. ❌ **Multi-Scenario Contribution**
   - Model different contribution levels within single case
   - Scenario comparison (premium, employer cost, employee cost)

5. ❌ **Historical Contribution Tracking**
   - Show contribution strategy evolution for this case
   - "What was our contribution last year?"

6. ❌ **Contribution Documentation**
   - Rationale notes: "We increased contribution to improve affordability score"
   - Audit trail of who approved contribution model

---

### 🤖 POLICYMATCH (Page #15)
**Route:** `/policymatch`  
**Type:** standard_screen  
**Current Status:** ✅ AI matching exists

#### Missing Features

1. ❌ **Match Explanation UI**
   - For each matched plan, show: "Why we recommended this plan"
   - Risk factors considered, cost analysis, coverage enhancements

2. ❌ **Member-Level Recommendations**
   - Not just group-level matches
   - Individual member → recommended plan based on their health profile
   - Show cost impact for that member

3. ❌ **Acceptance Workflow**
   - Broker reviews match → accepts or rejects recommendation
   - Rejection reason codes (cost too high, coverage not right, etc.)
   - Acceptance records the decision

4. ❌ **A/B Testing Mode**
   - Compare PolicyMatch recommendations to broker's original choices
   - Track: did PolicyMatch recommendations outperform manually selected plans?

5. ❌ **Carrier Integration**
   - Send matched plans to carriers for quote (auto-integration)
   - Track quotes returned per matched plan

6. ❌ **Reversion/Undo**
   - If a matched plan doesn't work out, revert to previous selection
   - Track why match failed

---

### ⚙️ INTEGRATION INFRASTRUCTURE (Page #16)
**Route:** `/integration-infra`  
**Type:** admin_page  
**Current Status:** ⚠️ **UI-ONLY (no live APIs)**

#### Critical Missing Features (Backend)

1. 🔴 **LIVE API ENDPOINTS**
   - Currently: Mock UI showing infrastructure layers
   - Need: Real API playground, live endpoint testing
   - Add: Request/response logging, error simulation

2. 🔴 **WEBHOOK MANAGEMENT**
   - No live webhook configuration
   - Missing: webhook event history, retry logs
   - Need: Create/delete webhooks, test webhook delivery

3. 🔴 **RATE LIMITING REAL-TIME DASHBOARD**
   - Current: Static display
   - Missing: Live API call counter, throttling visualization
   - Need: Query throttle status, adjust limits

4. 🔴 **SECRETS MANAGEMENT**
   - No interface to rotate API keys, OAuth tokens
   - Missing: Key creation/deletion, expiration tracking
   - Need: Audit log of secret access

5. 🔴 **API KEY MANAGEMENT**
   - Missing: Create, list, revoke API keys
   - Missing: Key expiration, scope management
   - Need: Usage analytics per key

6. 🔴 **EVENT LOG REAL-TIME**
   - Static event log display
   - Missing: Live streaming of system events
   - Need: Filter/search events, export logs

7. 🔴 **HEALTH CHECK DASHBOARD**
   - Missing: Real-time endpoint health status
   - No uptime percentage, latency tracking
   - Need: Alert if service degradation detected

8. 🔴 **OAUTH PLAYGROUND**
   - Missing: Test OAuth flows without production app
   - Need: Scope approval simulator, token refresh testing

---

### ⚙️ SETTINGS (Page #17)
**Route:** `/settings`  
**Type:** settings_page  
**Current Status:** ✅ Basic settings exist

#### Missing Features

1. ❌ **User Preferences**
   - Date format, time zone, currency display
   - Email notification preferences (case updates, task reminders, enrollment reminders)
   - UI theme (light/dark mode)

2. ❌ **Two-Factor Authentication Setup**
   - Missing: Enable 2FA, seed backup codes
   - Track: 2FA enabled date, last used

3. ❌ **API Key Management** (for custom integrations)
   - Missing: Generate, revoke, rotate API keys
   - Usage statistics per key

4. ❌ **User Session Management**
   - View active sessions (browser, device, IP, last activity)
   - Option to log out all other sessions

5. ❌ **Audit Log for User Actions**
   - Every admin action logged (user create, delete, permission change, data export)
   - Searchable, filterable, exportable

6. ❌ **Account Recovery**
   - Missing: Account recovery email, backup email
   - Security questions

7. ❌ **Data Export Options**
   - GDPR-compliant user data download
   - Export case data, personal information

---

### 👔 EMPLOYER PORTAL (Page #18)
**Route:** `/employer-portal`  
**Type:** standard_screen  
**Current Status:** ✅ Employer dashboard exists

#### Missing Features

1. ❌ **Proposal Approval Workflow**
   - Proposal → sent to employer → review → approve/reject with comments
   - Email notifications, deadline reminders

2. ❌ **Document Center**
   - Centralized repository: census, proposal, SBC, contract, renewal correspondence
   - Upload capability (employer-initiated documents)
   - Versioning

3. ❌ **Enrollment Self-Service**
   - Employer can launch enrollment, set dates, configure
   - Don't require broker to do everything

4. ❌ **Renewal Decision Portal**
   - Employer sees renewal options → makes informed decision
   - Broker provides recommendation with rationale
   - Employer approves renewal or requests alternatives

5. ❌ **Financial Dashboard**
   - Employer sees costs over time
   - Plan-by-plan cost breakdown
   - Year-over-year comparison

6. ❌ **Employee Census View**
   - Employer can view their employee census
   - Verify enrollment status
   - Download employee benefit statements

7. ❌ **Broker Communication**
   - Built-in messaging with broker
   - Schedule meetings, share files
   - Notification center for messages

8. ❌ **Compliance Documentation**
   - Auto-compiled compliance package (SBCs, notices, plan documents)
   - Signature/acknowledgment tracking

---

### 👨‍💼 EMPLOYEE PORTAL (Page #19)
**Route:** `/employee-portal`  
**Type:** standard_screen  
**Current Status:** ✅ Portal shell exists

#### Missing Features

1. ❌ **Enrollment Entry Point**
   - Employee clicks "Start Enrollment" → goes to full enrollment wizard
   - Save progress, return later

2. ❌ **Benefits Dashboard**
   - Employee sees their selected plans, coverage tier, cost
   - Plan effective date, next renewal date

3. ❌ **Plan Compare Tool**
   - Side-by-side plan comparison
   - Cost calculator ("What if I choose family coverage?")

4. ❌ **Provider Search**
   - Integrated provider directory lookup (limited by selected plan)
   - Cost estimator for procedures

5. ❌ **Life Events**
   - Life event questionnaire → qualify for changes outside open enrollment
   - Evidence upload
   - Submission tracking

6. ❌ **Dependent Management**
   - Add/edit dependents (outside enrollment window)
   - Requires manager approval for mid-year changes

7. ❌ **Benefits Administration**
   - FSA/HSA balance, contribution limits, year-to-date spending
   - Plan document library
   - Contact information for plans

8. ❌ **Mobile-First Design**
   - Enrollment on mobile needs optimization
   - Mobile-friendly document viewing

---

### 🔐 EMPLOYEE PORTAL LOGIN (Page #20)
**Route:** `/employee-portal-login`  
**Type:** modal  
**Current Status:** ⚠️ **PARTIAL (login form only)**

#### Missing Features

1. 🔴 **Access Control Logic**
   - Employee must have active enrollment window
   - Check: employee in census for given case
   - Route to correct case/enrollment window

2. 🔴 **Session Management**
   - Session tokens, expiration handling
   - Logout cleanup

3. 🔴 **Error Handling**
   - Invalid credentials, expired session, access denied
   - Friendly error messages with support contact

4. 🔴 **Recovery Options**
   - "Forgot password?" flow
   - Email verification, temporary password

5. 🔴 **Alternative Auth Methods**
   - SSO integration with employer systems (SAML/OAuth)
   - Passwordless: email link, SMS code

6. 🔴 **Security Features**
   - Rate limiting on failed login attempts
   - CAPTCHA if too many failures
   - Session timeout with warning

---

### 🎯 EMPLOYEE ENROLLMENT (Page #21)
**Route:** `/employee-enrollment`  
**Type:** wizard  
**Current Status:** ✅ Enrollment wizard exists

#### Missing Features

1. ❌ **Plan Recommendation in Wizard**
   - Based on member risk data, highlight recommended plan
   - Show why recommended (cost, coverage fit, network quality)

2. ❌ **Cost Breakdown Transparency**
   - Show: employee share, employer share, total premium
   - "Your monthly cost: $X.XX"

3. ❌ **Dependent Management**
   - Add dependents during enrollment
   - Validate DOB, SSN
   - Coverage tier selection per dependent

4. ❌ **Beneficiary Designation** (life insurance)
   - Capture beneficiary info
   - Percentage allocation

5. ❌ **Eligibility Confirmation**
   - "I confirm I'm eligible for [coverage tier]"
   - Flag ineligibilities (part-time status, etc.)

6. ❌ **Acknowledgments**
   - Checkbox: acknowledge plan documents, privacy policy, fees
   - Capture timestamp of acknowledgment

7. ❌ **eSignature Integration**
   - Integration with DocuSign (shown in context)
   - Enrollment forms auto-sent for signature
   - Signature status tracking

8. ❌ **Confirmation & Communication**
   - Post-enrollment confirmation page
   - Email confirmation with plan details, effective date, ID cards
   - Download benefit summary

9. ❌ **Waiver Option**
   - If declining coverage, capture reason
   - Required acknowledgment of waiver

---

### 📊 EMPLOYEE BENEFITS (Page #22)
**Route:** `/employee-benefits`  
**Type:** standard_screen  
**Current Status:** ✅ Benefits summary exists

#### Missing Features

1. ❌ **Benefits Glossary**
   - Hover over terms → explanation (deductible, copay, in-network, etc.)
   - Link to more detailed help articles

2. ❌ **Cost Calculator**
   - Employee inputs service/procedure → shows estimated cost
   - In-network vs. out-of-network comparison

3. ❌ **Plan Document Access**
   - Links to summary of benefits & coverage (SBC)
   - Full plan document PDF
   - Carrier contact information

4. ❌ **ID Card Download**
   - Generate downloadable ID cards
   - Mobile wallet integration

5. ❌ **Claims Status**
   - If integrated with carriers: claim submission status
   - EOB (explanation of benefits) retrieval

6. ❌ **Change Requests**
   - Life event → request coverage change
   - Approval workflow

---

### 📖 HELP CENTER (Page #23)
**Route:** `/help`  
**Type:** standard_screen  
**Current Status:** ✅ **COMPLETE** (Phase 6)

#### Existing Features ✅
- 31 help articles (all pages covered)
- Search, browse by module
- User guides (manual topics)
- Recent topics history
- Deep-linking support
- Mobile responsive

#### Future Enhancements (not critical)
1. ❌ **Video Tutorials**
   - Embedded how-to videos
   - Screen recording walkthroughs

2. ❌ **Live Chat Support**
   - Chat with support team directly from help articles
   - CRM integration

3. ❌ **User Ratings**
   - "Was this helpful?" feedback
   - Track which articles need improvement

---

### 🛡️ HELP ADMIN (Page #24)
**Route:** `/help-admin`  
**Type:** admin_page  
**Current Status:** ✅ **COMPLETE** (Phase 6)

#### Existing Features ✅
- Content management (CRUD)
- AI-powered generation
- Bulk operations
- Content status tracking
- Coverage reporting
- Activity feeds

---

### 📈 HELP DASHBOARD (Page #25)
**Route:** `/help-dashboard`  
**Type:** dashboard  
**Current Status:** ✅ **COMPLETE** (Phase 6)

#### Existing Features ✅
- KPI summary (coverage %, article count)
- Module coverage breakdown
- Component type coverage
- Search analytics
- AI interaction logs

---

### 📋 HELP COVERAGE REPORT (Page #26)
**Route:** `/help-coverage`  
**Type:** report_page  
**Current Status:** ✅ **COMPLETE** (Phase 6)

#### Existing Features ✅
- Coverage by module
- Missing/incomplete content identification
- CSV export
- Quality thresholds (article length, keywords)

---

### 🔍 HELP SEARCH ANALYTICS (Page #27)
**Route:** `/help-analytics`  
**Type:** report_page  
**Current Status:** ✅ **COMPLETE** (Phase 6)

#### Existing Features ✅
- Top searches
- Top viewed articles
- Search-to-result success rate
- AI question logs
- User journey analytics

---

### 📝 HELP MANUAL MANAGER (Page #28)
**Route:** `/help-manual-manager`  
**Type:** admin_page  
**Current Status:** ✅ **COMPLETE** (Phase 6)

#### Existing Features ✅
- Create/edit user guides
- AI content generation
- Markdown support
- Publish/draft status
- Bulk operations

---

### 🎯 HELP TARGET REGISTRY (Page #29)
**Route:** `/help-target-registry`  
**Type:** admin_page  
**Current Status:** ✅ **COMPLETE** (Phase 6)

#### Existing Features ✅
- Registry of all UI elements with help
- CRUD for help targets
- Bulk imports
- Coverage validation

---

### 404 PAGE NOT FOUND (Page #30)
**Route:** `*` (catch-all)  
**Type:** utility  
**Current Status:** ✅ Complete

#### Features ✅
- Custom 404 design
- Help links
- Homepage navigation

---

## CROSS-CUTTING CONCERNS & SYSTEM-WIDE GAPS

### 1. **REAL-TIME UPDATES** (HIGH PRIORITY)
**Current State:** Manual refresh required  
**Impact:** Users miss updates, data appears stale

**Missing:**
- ❌ WebSocket subscriptions for live updates
- ❌ Entity subscription model (when CaseTask updated, refresh Tasks page)
- ❌ Real-time notifications (toast, email)
- ❌ Optimistic UI updates

**Recommendation:**
```
Implement base44.entities.subscribe() across:
- Cases list (new/updated cases)
- Tasks (new tasks, status changes)
- Enrollment (participation updates)
- Exceptions (new exceptions, resolutions)
- Renewals (status changes)
```

---

### 2. **BULK OPERATIONS** (HIGH PRIORITY)
**Current State:** Most pages lack bulk actions  
**Impact:** 20+ cases to update? Must do one at a time

**Missing:**
- ❌ Multi-select checkboxes on list pages
- ❌ Bulk action menu (assign, status change, delete, export)
- ❌ Progress indicator for bulk operations
- ❌ Bulk operation history/audit

**Recommendation:** Add bulk operation module to every list page (Cases, Employers, Plans, Tasks, Exceptions, Renewals, Enrollments).

---

### 3. **ADVANCED FILTERING & SEARCH** (MEDIUM PRIORITY)
**Current State:** Basic filters only  
**Impact:** Hard to find specific records

**Missing:**
- ❌ Multi-field search (e.g., "cases with status=draft AND assigned_to=john@example.com AND priority=high")
- ❌ Date range pickers
- ❌ Filter presets (save/recall)
- ❌ Full-text search across all text fields

**Recommendation:** Implement consistent filter UI component used across all list pages.

---

### 4. **EXPORT/IMPORT** (MEDIUM PRIORITY)
**Current State:** Only Census and Plans have partial import  
**Impact:** Can't move data in/out of system

**Missing:**
- ❌ CSV export for all list pages
- ❌ Batch import for Employers, Tasks, Cases (templates)
- ❌ Excel export with formatting
- ❌ Data transformation on import (field mapping, validation)

**Recommendation:** Create generic import/export service + UI.

---

### 5. **ROLE-BASED VIEWS** (MEDIUM PRIORITY)
**Current State:** Same UI for all roles  
**Impact:** Admin sees same as Broker; Employer sees same as Employee

**Missing:**
- ❌ View filtering by role (admin, broker, employer, employee)
- ❌ Field visibility by role
- ❌ Action availability by role (e.g., only admin can delete)
- ❌ Data row-level filtering by role (broker only sees their cases)

**Recommendation:** Add role-based view helpers to pages.

---

### 6. **AUDIT TRAIL** (MEDIUM PRIORITY)
**Current State:** ActivityLog exists but not used consistently  
**Impact:** Can't track "who changed what?"

**Missing:**
- ❌ Field-level change tracking (old → new value, who, when)
- ❌ Audit log visibility in UI (not just database)
- ❌ Audit export for compliance
- ❌ Automated audit for sensitive actions (delete, approve, etc.)

**Recommendation:** Implement audit UI component; add to all sensitive pages (Cases, Enrollment, Renewals, Exceptions).

---

### 7. **WORKFLOW ORCHESTRATION** (HIGH PRIORITY)
**Current State:** Some workflows automated, others manual  
**Impact:** Inconsistent user experience

**Missing:**
- ❌ Case stage advance validation (require data before moving to next stage)
- ❌ Auto-task generation on case stage change
- ❌ Approval workflows (broker submits → manager approves)
- ❌ Enrollment follow-up automation (reminder → escalation)

**Recommendation:** Use backend automations + entity subscriptions to orchestrate workflows.

---

### 8. **NOTIFICATIONS & ALERTS** (MEDIUM PRIORITY)
**Current State:** Minimal notifications  
**Impact:** Users miss important events

**Missing:**
- ❌ In-app toast notifications
- ❌ Email notifications (daily digest, urgent alerts)
- ❌ Notification preferences per user
- ❌ Notification history/archive

**Recommendation:** Add notification system with preferences UI.

---

### 9. **ANALYTICS & REPORTING** (MEDIUM PRIORITY)
**Current State:** Limited dashboards  
**Impact:** No insights into system usage, bottlenecks

**Missing:**
- ❌ Team productivity metrics (tasks completed, cases closed, renewal success rate)
- ❌ Bottleneck identification (most blocked exceptions, slowest workflows)
- ❌ Trend analysis (cases growing, enrollment rates improving?)
- ❌ Custom report builder

**Recommendation:** Add analytics pages per module (similar to existing Help Analytics).

---

### 10. **DATA VALIDATION** (MEDIUM PRIORITY)
**Current State:** Client-side validation only  
**Impact:** Possible data inconsistencies, garbage data

**Missing:**
- ❌ Server-side validation rules
- ❌ Pre-save validation (Census member age must be 18+)
- ❌ Business rule validation (Effective date ≥ today)
- ❌ Cross-entity validation (can't close case if open tasks remain)

**Recommendation:** Define validation schema in backend; validate on form submit before save.

---

### 11. **COMMUNICATION TEMPLATES** (MEDIUM PRIORITY)
**Current State:** No templates  
**Impact:** Inconsistent, inefficient communication

**Missing:**
- ❌ Email templates (enrollment invite, renewal notice, proposal approved)
- ❌ Template variables (auto-fill case details, dates, amounts)
- ❌ Template preview
- ❌ Communication audit (who received what email, when?)

**Recommendation:** Create template manager; integrate with SendEmail integration.

---

### 12. **MOBILE RESPONSIVENESS** (MEDIUM PRIORITY)
**Current State:** Desktop-first design  
**Impact:** Mobile users have poor experience

**Missing:**
- ❌ Mobile-optimized list views (cards instead of tables)
- ❌ Mobile-friendly forms (single-column layout)
- ❌ Touch-friendly buttons/controls
- ❌ Mobile-specific workflows (e.g., simplified enrollment on mobile)

**Recommendation:** Audit each page for mobile UX; implement mobile-first redesigns for critical flows.

---

## FEATURE PRIORITY MATRIX

### 🔴 CRITICAL (Do First — blocks core workflows)
1. Real-time updates (WebSocket subscriptions)
2. Bulk operations (multi-select, bulk actions)
3. Workflow orchestration (stage validation, auto-tasks)
4. Employee Portal Login (access control, session mgmt)
5. Integration Infrastructure backend (live APIs, not mock UI)

### 🟡 HIGH (Do Soon — improves usability significantly)
1. Advanced filtering & search
2. Role-based views & row-level filtering
3. Audit trail in UI
4. Export/import for all major entities
5. Data validation (server-side + pre-save checks)
6. Case detail page improvements (change history, dependencies)
7. Approval workflows (broker submit → manager approve)
8. Enrollment follow-up automation

### 🟢 MEDIUM (Do Next — nice-to-haves, nice to nice-to-haves)
1. Analytics & reporting per module
2. Communication templates
3. Notifications & alerts system
4. Mobile-responsive redesigns
5. Case cloning
6. Plan recommendation engine
7. Cost calculators (enrollment, renewal, contribution)

### 🔵 NICE-TO-HAVE (Future)
1. Video tutorials
2. Live chat support
3. Customizable dashboard widgets
4. A/B testing mode (PolicyMatch)
5. Historical analysis tools

---

## SUMMARY TABLE: Feature Gaps by Page

| Page | Feature Gaps | Priority | Est. Effort |
|------|--------------|----------|-------------|
| Dashboard | Widgets, drill-down, RT updates, filters | 🟡 HIGH | 8h |
| Cases | Bulk ops, search, export, validation, history | 🔴 CRITICAL | 16h |
| Employers | Detail page, bulk import, contacts, documents | 🟡 HIGH | 12h |
| Census | Validation engine, diff view, bulk edit, export | 🟡 HIGH | 12h |
| Quotes | Export, comparison, approval WF, templates | 🟡 HIGH | 8h |
| Proposals | Multi-scenario, approval WF, PDF gen, SBCs | 🟡 HIGH | 16h |
| Enrollment | Follow-up automation, waiver mgmt, self-service | 🟡 HIGH | 12h |
| Renewals | Decision WF, rate analysis, communication, calendar | 🟡 HIGH | 12h |
| Tasks | Kanban, bulk ops, dependencies, reminders, templates | 🟡 HIGH | 12h |
| Plans | Versioning, network view, utilization, formulary | 🟡 HIGH | 10h |
| Exceptions | Triage WF, root cause, analytics, automation, SLA | 🟡 HIGH | 12h |
| Contributions | Plan-specific rules, ACA validation, comparison | 🟡 HIGH | 8h |
| PolicyMatch | Explanation UI, member-level, acceptance WF, A/B testing | 🟡 HIGH | 10h |
| Integration Infra | **Backend APIs** (currently mock UI only) | 🔴 CRITICAL | 40h |
| Settings | Preferences, 2FA, API keys, session mgmt, audit log | 🟡 HIGH | 12h |
| Employer Portal | Approval WF, documents, financial, census view, messaging | 🟡 HIGH | 14h |
| Employee Portal | Enrollment entry, dashboard, plan compare, provider search | 🟡 HIGH | 14h |
| Employee Login | Access control, session mgmt, recovery, auth methods, security | 🔴 CRITICAL | 12h |
| Employee Enrollment | Recommendations, dependents, beneficiaries, eSignature, waiver | 🟡 HIGH | 12h |
| Employee Benefits | Glossary, cost calculator, documents, claims, change requests | 🟡 HIGH | 10h |
| Help System | ✅ COMPLETE | — | — |

---

## RECOMMENDED IMPLEMENTATION ROADMAP

### Phase 7 (Immediate)
1. Add real-time WebSocket updates to critical pages
2. Implement bulk operations framework
3. Complete Employee Portal Login (backend access control)
4. Backend completeness for Integration Infrastructure
5. Basic case detail enhancements (change history, stage validation)

### Phase 8 (Short-term)
1. Advanced filtering module (reusable across pages)
2. Audit trail in UI (ActivityLog viewer)
3. Approval workflows (broker submit → manager approve)
4. Export/import for key entities
5. Role-based view filtering

### Phase 9 (Medium-term)
1. Enrollment follow-up automation
2. Analytics dashboards per module
3. Communication templates
4. Mobile UX improvements
5. Workflow orchestration (case stage + auto-tasks)

---

## END OF AUDIT

**Total Pages Analyzed:** 30  
**Pages with Critical Gaps:** 5  
**Pages with High Gaps:** 18  
**Pages Complete/Minimal Gaps:** 7  

**System-wide Gaps:** 12 major concerns identified  
**Total Estimated Effort:** ~250 hours (assuming 50 features, avg 5h each)

**Highest ROI Improvements:** Real-time updates, Bulk operations, Workflow orchestration, Advanced filtering