# COMPREHENSIVE OPERATIONS MANUAL — PART 2: WORKFLOWS

## Census Management Workflow

### Complete Census Lifecycle

```
DRAFT CASE
    ↓
[UPLOAD CENSUS] → File validation → Auto-detect columns
    ↓
[PARSE & MAP] → Confirm field mappings → Show preview
    ↓
[CREATE MEMBERS] → Generate CensusMember records → One per employee
    ↓
[AUTO-VALIDATE] → Check data quality → Generate error/warning list
    ↓
ISSUES?
├─ YES → [FIX ERRORS] → Re-upload new version → Re-validate
└─ NO → [APPROVE] → Mark validated
    ↓
[RISK ANALYSIS] → Run GradientAI → Score each member
    ↓
[CENSUS VALIDATED] → Ready for quoting
```

### Step-by-Step Census Upload

**1. Navigate to Case Detail → Census Tab**
- Case must be in DRAFT or CENSUS_IN_PROGRESS
- Click "Upload Census File"

**2. File Selection**
- Supported formats: CSV, Excel (.xlsx)
- Max file size: 10MB
- Max employees per file: 5,000

**3. Column Mapping**
System attempts auto-detection. Manual override available:
- Required: First Name, Last Name, DOB
- Highly Recommended: Email, Hire Date
- Optional: Employee ID, Department, Salary, Job Title

**4. Data Upload**
- Click "Upload"
- System processes file:
  - Parse rows
  - Extract data
  - Detect duplicates (by email/SSN)
  - Validate formats

**5. Validation Report** (Automatic)
Errors (must fix):
- Duplicate email/SSN
- Missing first/last name
- Invalid date format (DOB, hire date)
- Age invalid (< 16 or > 100)
- Hire date in future

Warnings (review):
- Missing email
- Missing DOB (affects rating)
- Unusual salary
- Coverage tier mismatch

**6. Fix and Re-upload**
- Fix errors in source file
- Re-upload → New version created (v1, v2, v3...)
- Each version validated independently
- Can compare versions to see changes

**7. Mark as Validated**
- When errors = 0
- Click "Validate"
- CensusVersion status = "validated"
- Case stage can advance to CENSUS_VALIDATED

### Census Validation Rules

| Rule | Severity | Details |
|------|----------|---------|
| **Required Fields** | ERROR | First, Last, DOB must exist |
| **Duplicate Email** | ERROR | No two employees same email |
| **Duplicate SSN** | ERROR | If SSN provided, must be unique |
| **Valid Email Format** | WARNING | Must match email@domain.com |
| **Age Range** | WARNING | Age 16-100 considered valid |
| **Hire Date** | ERROR | Cannot be in future |
| **Hire Date before DOB** | ERROR | Must be logical |
| **Coverage Tier Valid** | WARNING | Must be one of 4 types |
| **Salary Reasonable** | WARNING | < $20k or > $500k flagged |
| **Hours per week** | WARNING | 0-100 considered valid |

### Census Member Fields (CensusMember Entity)

| Field | Type | Notes |
|-------|------|-------|
| Census Version ID | UUID | Parent version |
| Case ID | UUID | Parent case |
| Employee ID | Text | Employer's ID (optional) |
| First Name | Text | Required |
| Last Name | Text | Required |
| Date of Birth | Date | Required for rating |
| Gender | Enum | M/F/Other |
| SSN Last 4 | Text | Privacy-conscious |
| Email | Email | Required for enrollment |
| Phone | Phone | Optional |
| Address | Text | Optional |
| City, State, Zip | Text | Optional |
| Hire Date | Date | Affects eligibility |
| Employment Status | Enum | active, leave, terminated |
| Employment Type | Enum | full_time, part_time, contractor |
| Hours per Week | Number | For part-time rates |
| Annual Salary | Currency | For contribution calcs |
| Job Title | Text | Optional |
| Department | Text | Optional |
| Location | Text | Optional |
| Class Code | Text | For class-based rating |
| Is Eligible | Boolean | Can be marked ineligible |
| Eligibility Reason | Text | Why ineligible if so |
| Dependent Count | Number | For family-tier rates |
| Coverage Tier | Enum | EE, ES, EC, Family |
| Validation Status | Enum | pending, valid, warnings, errors |
| Validation Issues | JSON | Array of issues found |
| GradientAI Data | JSON | Risk scoring results |

### GradientAI Risk Analysis

**Automatic:** Triggered when census validated

**Output per employee:**
- Risk Score: 0-100 (lower = better)
- Risk Tier: Preferred, Standard, Elevated, High
- Risk Factors: [list of factors contributing to score]
- Predicted Annual Claims: $ estimate
- Confidence Score: 0-1 (how confident in analysis)
- Analyzed Timestamp

**Broker Use Cases:**
- Identify high-risk individuals for underwriting review
- Estimate claims liability
- Assess pricing impact
- Flag unusual demographics

**Actions Available:**
- View by risk tier (filter all members)
- See details of top 10 risks
- Export risk report
- Discuss with underwriter

---

## Quote Scenario Development

### Quote Scenario Lifecycle

```
CASE READY FOR QUOTING
    ↓
[CREATE SCENARIO] → Name, effective date, carrier selection
    ↓
[SELECT PLANS] → Choose from Plan Library → Add/remove plans
    ↓
[LOAD RATES] → Fetch plan rate tables → Age-banded or composite
    ↓
[APPLY CENSUS] → Calculate costs for each member → Per plan
    ↓
[CONTRIBUTION MODEL] → Define employer/employee split
    ↓
[CALCULATE TOTALS]
├─ Total monthly premium
├─ Employer monthly cost
├─ Employee avg cost per tier
└─ ACA compliance check
    ↓
[REVIEW & ADJUST] → Change plans/rates/contributions → Re-calculate
    ↓
[SCENARIO COMPLETE] → Ready for proposal or comparison
```

### Creating Quote Scenario (Step-by-Step)

**1. Navigate to Case → Quotes Tab**
- Click "Create Scenario"

**2. Basic Info**
- Scenario Name: "80/50 PPO Option", "Cost-Effective", etc.
- Effective Date: Plans become active
- Carriers: Select 1-3 carriers to quote

**3. Select Plans**
Available plan types:
- Medical (HMO, PPO, HDHP, EPO)
- Dental (PPO, HMO)
- Vision (VSP, EyeMed)
- Life (Term, indexed)
- STD (Short-term disability)
- LTD (Long-term disability)
- Voluntary (Accident, critical illness)

For each plan:
- Choose specific plan from Plan Library
- Set plan-level employer contribution (% or $)
- Optional: Override rates per member class

**4. Contribution Strategy**
Three approaches available:

**A. Percentage-Based** (Most common)
- Employer pays 80% of EE premium
- Employer pays 50% of dependent premiums
- Employee pays remainder

Calculation:
```
Employee cost = (Plan premium × Employee age factor) × (100% - Employer %)
```

**B. Flat Dollar**
- Employer contributes fixed amount per employee
- Employee pays remainder
- Works if flat benefit budget

Calculation:
```
Employee cost = Plan premium - Flat employer amount
```

**C. Defined Contribution**
- Employer funds specific $ amount per month
- Multiple plan options at that price point
- Employee chooses plan within budget

**4. Calculate Costs**
- System applies census data
- Per employee, per plan calculation:
  - Base rate (age-banded or composite)
  - Apply gender modifier (if rated)
  - Apply location modifier (if multi-state)
  - Apply health modifier (if underwritten)
  - Apply family vs. individual rates
- Aggregate to company totals

**5. Cost Summary**
- Total Monthly Premium: All plans, all members, all tiers
- Employer Monthly Cost: Employer's contribution
- Employee Monthly Cost Average: Across all tiers
- Cost per Employee (avg)
- Cost per Employee (with dependent avg)

**6. ACA Compliance Check**
- Flag if employee coverage < 60% coinsurance
- Flag if coverage < 10% of cost
- Flag if not affordable (premium < 9.5% of income)

**7. Review Scenario**
- View by member (list all employees with their costs)
- View by plan (see enrollment assumptions)
- Compare with other scenarios
- Export for review

### Quote Scenario Comparison

**Side-by-Side View:**
| Metric | Scenario A | Scenario B | Scenario C |
|--------|-----------|-----------|-----------|
| PPO Plan | Yes | No | Yes |
| HDHP Plan | No | Yes | Optional |
| Dental | Yes | Yes | Yes |
| Vision | Yes | Yes | No |
| Employer Cost | $45,000 | $38,000 | $42,000 |
| Emp Avg Cost (EE) | $125 | $140 | $130 |
| Emp Avg Cost (Family) | $385 | $425 | $390 |
| Affordability Compliant | ✓ | ✓ | ✗ |

**Use Case:**
- Scenario A: "Full-service"
- Scenario B: "Cost-containment"
- Scenario C: "Employee choice"

### PolicyMatch AI Integration

**Automatic:** Runs when scenario completed

**Analysis:**
- Compares all scenarios
- Evaluates based on:
  - Cost efficiency
  - Plan variety
  - Enrollment likelihood (based on historical data)
  - ACA compliance
  - Renewal stability
- Scores each scenario (0-100)
- Marks recommended scenario

**Output:**
- Recommended scenario highlighted
- Recommendation score
- Why recommendation (factors)
- Risk assessment (claims, utilization)

**Broker Use:**
- Present recommended scenario to employer
- Provide rationale
- Discuss alternatives if employer prefers

---

## Proposal Generation & Tracking

### Proposal Lifecycle

```
SCENARIO COMPLETE
    ↓
[CREATE PROPOSAL] → Select scenario(s) → Write cover letter
    ↓
[PREVIEW] → Review format → Check accuracy
    ↓
[GENERATE PDF] → System creates formal document
    ↓
[SEND TO EMPLOYER] → Email link → Portal access
    ↓
[TRACK ENGAGEMENT]
├─ Email opened? (tracked)
├─ Portal viewed? (tracked)
├─ Questions asked? (tracked)
└─ Timeline to decision? (tracked)
    ↓
[EMPLOYER DECISION]
├─ APPROVED → Advance to enrollment
├─ REJECTED → Create new scenario
└─ REQUEST CHANGES → Create new version
    ↓
[ARCHIVED] → Stored for compliance
```

### Creating Proposal (Step-by-Step)

**1. Navigate to Quotes Tab → Scenario → "Create Proposal"**

**2. Proposal Wizard**

**Step 1: Scenario Selection**
- Include Scenario A? [checkbox]
- Include Scenario B? [checkbox]
- Include comparison? [checkbox]
- Each scenario gets its own section

**Step 2: Cover Letter**
- Template: [dropdown with 5+ pre-written templates]
- Custom message: [rich text editor]
- Broker signature: [auto-filled]
- Agency logo: [auto-fetched from settings]

Example template:
```
Dear [Employer name],

Thank you for the opportunity to present benefit solutions 
for your organization. Based on our analysis of your census 
data and your strategic objectives, we recommend the 
attached options.

Each option balances cost containment with comprehensive 
coverage, and all options comply with ACA requirements.

Please review at your convenience. We're happy to discuss 
any questions.

Best regards,
[Broker name]
```

**Step 3: Format Selection**
- Detailed (20-30 pages)
  - All plan details
  - Network info
  - Coverage examples
  - Rider explanations
- Summary (8-12 pages)
  - Key coverage only
  - High-level comparison
  - Cost summary
- Comparative (12-18 pages)
  - Side-by-side comparison
  - Cost comparison table
  - Recommended scenario highlighted

**Step 4: Preview**
- Review rendered PDF
- Check for errors
- Zoom/scroll to verify all content
- Check sponsor logos correct

**Step 5: Send**
- Employer email: [required]
- Send method:
  - Email link to portal (recommended)
  - Email with attachment (PDF)
  - Both
- Personal message: [optional]
- Scheduling: Send now / Schedule for later

**3. Proposal Created**
System generates:
- Proposal record (in database)
- PDF file (stored)
- EmployeeEnrollment records (one per employee, linked to proposal)
- Email sent (with tracking link)
- Case stage: Changes to EMPLOYER_REVIEW

**4. Proposal Tracking**

**In Portal:**
- View all proposals for case
- See status of each:
  - Sent [date]
  - Viewed [date + how many times]
  - Approved [date]
  - Rejected [date]
- Create new version if needed
- Send reminder email

**Engagement Metrics:**
- Email opened? (if enabled)
- Portal accessed? (if portal enabled)
- Time to decision: From sent to approval
- Download PDF? (if tracked)

### Proposal Content (What gets generated)

**Front Matter:**
- Title page: "2025 Benefit Proposal — [Employer Name]"
- Effective date
- Broker contact info
- Agency logo

**Executive Summary (1 page):**
- Recommendation: "We recommend Scenario A"
- Why: Balanced approach, 80/50 contribution
- Cost impact: $X employer / employee
- Key dates: Enrollment, effective, renewal

**Plan Summaries (varies by plan):**
For Medical:
- Network type: HMO/PPO/HDHP
- Deductible: Individual/Family
- Out-of-pocket max: Individual/Family
- Copays: PCP, Specialist, ER
- Coinsurance: %
- Preventive: Covered 100%
- Key exclusions (if any)

For Dental/Vision/Life:
- Coverage levels
- Limitations (e.g., 2 cleanings/year)
- Costs
- Network

**Cost Analysis (2-3 pages):**
- Total monthly premium: All plans
- Employer contribution: By plan, total
- Employee contribution: By coverage tier, plan
- Per-employee monthly cost (average)
- Annual cost impact
- Cost comparison vs. current (if renewal)

**Contribution Breakdown:**
Table showing cost by coverage tier:
| Coverage Tier | Emp Cost | Dep Cost | EE Only | EE+Spouse | EE+Kids | Family |
|---|---|---|---|---|---|---|
| Scenario A | $125 | $250 | $125 | $375 | $425 | $625 |
| Scenario B | $140 | $280 | $140 | $420 | $480 | $700 |

**SBC (Summary of Benefits and Coverage):**
- Required by law
- One-page summary per plan
- Standardized format
- Shows coverage examples

**Network Information:**
- Key network members
- Hospital list
- Specialist access
- Out-of-network costs

**Enrollment Timeline:**
- Enrollment dates: Start and end
- Effective date
- Open enrollment period
- Key deadlines

**Next Steps:**
- How to proceed: Approval process
- Questions contact: Broker email/phone
- Timeline for decision: Requested by [date]
- Enrollment process: How employees enroll

---

## Enrollment Management

### Enrollment Window Lifecycle

```
CASE APPROVED FOR ENROLLMENT
    ↓
[CREATE ENROLLMENT WINDOW]
├─ Dates: Enrollment starts/ends
├─ Effective date
├─ Total eligible employees
└─ Linked to case
    ↓
[GENERATE ENROLLMENT URLS] → Unique per employee
    ↓
[SEND INVITATIONS] → Email with link → Tracked
    ↓
ENROLLMENT_OPEN [← Employees begin electing benefits]
├─ Employee logs in
├─ Reviews plan options
├─ Elects coverage tier
├─ Selects specific plans
├─ Confirms selections
├─ Signs documents (if required)
└─ Status → "completed"
    ↓
[TRACK PROGRESS]
├─ Invited: Count
├─ Enrolled: Count
├─ Waived: Count
├─ Pending: Count
└─ Participation rate: Enrolled/Total
    ↓
[CLOSING DATE REACHED]
    ↓
[FINALIZE ENROLLMENT]
├─ Lock enrollment
├─ Generate summary report
├─ Generate participant files
└─ Advance case to ENROLLMENT_COMPLETE
```

### Creating Enrollment Window (Broker)

**1. Case must be in APPROVED_FOR_ENROLLMENT**

**2. Navigate to Case → Enrollment Tab**
- Click "Create Enrollment Window"

**3. Enrollment Window Details**

| Field | Type | Notes |
|-------|------|-------|
| Case ID | UUID | Auto-linked |
| Start Date | Date | Enrollment begins (required) |
| End Date | Date | Enrollment ends (required) |
| Effective Date | Date | Coverage starts (required) |
| Total Eligible | Number | Employees eligible |
| Invited Count | Number | Auto-populated |
| Enrolled Count | Number | Tracked from submissions |
| Waived Count | Number | Tracked from submissions |
| Pending Count | Number | Total - Enrolled - Waived |
| Participation Rate | % | Enrolled / Total |
| Employer Name | Text | Auto-pulled from case |
| Reminder Sent At | Timestamp | Auto-set on first reminder |
| Finalized At | Timestamp | Auto-set at end date |

**4. Generate Enrollment Access**

System creates:
- EmployeeEnrollment record per employee
- Status: "pending"
- Unique enrollment URL
- One-time access token

**5. Send Invitations**

Method 1: Bulk Email (from system)
- Recipient: Each employee email
- Subject: "[Employer] — 2025 Benefit Enrollment is Open"
- Body: Includes:
  - Enrollment dates
  - Link to enrollment portal
  - Unique access token
  - Effective date
  - Coverage deadline
  - Help contact info

Method 2: Manual Email (broker sends)
- Can customize message
- Broker downloads employee list with URLs
- Manually sends if needed

**6. Tracking**
- View enrollment status in real-time
- See list of employees (invited, enrolled, waived, pending)
- Send reminder emails
- Download participation report

### Employee Enrollment Portal Flow

**1. Employee receives email with link**

**2. Logs in with email + access token**
- System verifies token
- Shows employer name
- Shows enrollment window dates

**3. Home Screen Options:**
```
┌────────────────────────────┐
│ 2025 Benefits Enrollment   │
│ [Employer Name]            │
│                            │
│ Start: Jan 1, 2025         │
│ End:   Jan 31, 2025        │
│                            │
│ [ View Available Plans ]   │
│ [ Review My Elections ]    │
│ [ Help & FAQs ]            │
│ [ My Benefits Glossary ]   │
└────────────────────────────┘
```

**4. View Available Plans**
- Filter by type: Medical, Dental, Vision, Life, etc.
- Compare plans side-by-side
- View network information
- See costs per coverage tier

**5. Make Selections**
For Medical (example):
1. View available plans (PPO, HDHP)
2. Read coverage details
3. Compare costs by coverage tier
4. Click "Select This Plan"
5. Choose coverage tier:
   - Employee Only
   - Employee + Spouse
   - Employee + Children
   - Family
6. Confirm: "Elect this plan"

Repeat for Dental, Vision, Life, etc.

Option to Waive:
- "I decline medical coverage"
- Select reason (have other coverage, etc.)
- Confirm waiver

**6. Review & Confirm**
- Summary of all elections
- Cost per plan
- Monthly cost total
- Coverage tier for each
- Dependents (if applicable)

**7. Sign Documents** (if required)
- DocuSign integration triggered
- Employee receives signing request
- Opens DocuSign envelope
- Reviews document
- Signs electronically
- Completes enroll

**8. Confirmation**
- "Your enrollment is complete!"
- Receipt email sent
- Summary of selections

**9. Status Updated**
- EmployeeEnrollment.status → "completed"
- EnrollmentWindow.enrolled_count → incremented

### Enrollment Wizard Components (React)

Key components in Employee Portal:

1. **EnrollmentWizard** — Main container
   - State management (step tracking)
   - Wizard navigation (prev/next)
   - Progress bar

2. **PlanSelectionStep** — Choose plans
   - Plan comparison table
   - Filter by type
   - Plan details modal

3. **PlanComparisonGrid** — Side-by-side view
   - 2-3 plans displayed
   - Key metrics highlighted
   - Cost comparison

4. **CoverageSelectionStep** — Choose tier
   - 4 coverage tier options
   - Cost per tier displayed
   - Dependent management

5. **DependentForm** — Add family members
   - Name, DOB, relationship
   - Add/remove dependents
   - Validate data

6. **EnrollmentConfirmation** — Final review
   - Summary of all selections
   - Total monthly cost
   - Confirmation button

7. **DocuSignSigningPane** — eSignature
   - Embedded signing
   - Document navigation
   - Signature capture

### Enrollment Reminders & Escalation

**Automatic System:**

1 week before end date:
- Email reminder sent
- Pending count visible in broker portal
- Task created: "Follow up with non-respondents"

2 days before end date:
- Final reminder email
- "Enrollment closing soon"
- Urgent tone

On closing date:
- Enrollment window closes
- No new enrollments accepted
- System locks EmployeeEnrollment.status = "locked"

### Broker View of Enrollment

**Enrollment Tab in Case Detail:**

**Status Cards:**
- Total Invited: Count
- Enrolled: Count (+ %)
- Waived: Count
- Pending: Count
- Participation Rate: %

**Employee List Table:**
| Employee Name | Status | Plan Elected | Coverage Tier | Signed? | Action |
|---|---|---|---|---|---|
| John Doe | Completed | PPO | Family | ✓ | View |
| Jane Smith | Pending | — | — | — | Send Reminder |
| Bob Johnson | Waived | Declined | — | ✗ | N/A |

**Quick Actions:**
- Send Reminder: Email pending employees
- Download Report: CSV/Excel with results
- View Signed Documents: If DocuSign
- Finalize Enrollment: Close window

---

[Continued in next document section...]