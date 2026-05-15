# COMPREHENSIVE MANUAL — APPENDICES (A-F)

## APPENDIX A: KEYBOARD SHORTCUTS & HOTKEYS

### Global Shortcuts (All Pages)

| Shortcut | Windows | Mac | Function |
|----------|---------|-----|----------|
| Search | Ctrl + F | Cmd + F | Open in-page search |
| Help | F1 | F1 | Open help sidebar |
| Menu | Alt + M | Opt + M | Open sidebar menu |
| New Case | Ctrl + N | Cmd + N | Create new case |
| Save | Ctrl + S | Cmd + S | Save current form |
| Undo | Ctrl + Z | Cmd + Z | Undo last action |
| Redo | Ctrl + Y | Cmd + Shift + Z | Redo last action |
| Print | Ctrl + P | Cmd + P | Print page |
| Refresh | F5 | Cmd + R | Reload page |
| Hard Refresh | Ctrl + Shift + R | Cmd + Shift + R | Clear cache & reload |

### Page-Specific Shortcuts

**Cases Page:**
| Shortcut | Function |
|----------|----------|
| L | Switch to List view |
| P | Switch to Pipeline view |
| F | Open Filter menu |
| S | Open Sort menu |
| N | New Case |
| A | Select All visible cases |
| D | Bulk Delete selected |
| E | Bulk Export selected |

**Case Detail:**
| Shortcut | Function |
|----------|----------|
| E | Edit case |
| C | Clone case |
| X | Close case |
| T | Go to Tasks tab |
| D | Go to Documents tab |
| A | Go to Activity tab |
| Z | Go to Census tab (if available) |
| Q | Go to Quotes tab (if available) |

**Census Page:**
| Shortcut | Function |
|----------|----------|
| U | Upload new census |
| R | Refresh data |
| V | View current version |
| E | Export members |
| F | Open filters |

**Enrollment Page:**
| Shortcut | Function |
|----------|----------|
| W | Create enrollment window |
| S | Send invitations |
| R | Send reminder |
| F | View finalize button |
| E | Export results |

### Navigation Shortcuts

| Shortcut | Destination |
|----------|-----------|
| G + D | Dashboard |
| G + C | Cases |
| G + E | Employers |
| G + S | Settings (admin) |
| G + H | Help Center |
| G + P | Plans |
| G + Q | Quotes |
| G + R | Renewals |
| G + T | Tasks |

### Form Input Shortcuts

| Shortcut | Function |
|----------|----------|
| Tab | Move to next field |
| Shift + Tab | Move to previous field |
| Enter | Submit form (if button focused) |
| Esc | Close modal/cancel form |
| Ctrl + Enter | Submit form (from any field) |
| Ctrl + Shift + L | Clear all form fields |

---

## APPENDIX B: GLOSSARY OF TERMS

### Benefit & Insurance Terms

**ACA (Affordable Care Act):**
Federal healthcare law setting requirements for employer-sponsored benefits. Key rules: individuals must have coverage, employers with 50+ employees must offer affordable coverage.

**Affordability (ACA):**
Coverage is affordable if employee's required contribution < 9.5% of household income. Employer must verify this annually.

**Benefits Broker:**
Licensed professional who represents employers to help select and manage benefit plans. Recommends carriers, builds quotes, manages enrollment.

**Carrier:**
Insurance company providing health plans (medical, dental, vision, life, etc.). Examples: UnitedHealth, Aetna, Cigna, Blue Cross.

**Census:**
Complete list of employees eligible for benefits, including demographics (age, salary, hire date, etc.). Used for rate calculations and enrollment tracking.

**Contribution:**
Amount employer pays toward employee's premiums. Example: Employer pays 80% of medical premium, employee pays 20%.

**Coverage Tier:**
Employee's election for who is covered: Employee only, Employee + Spouse, Employee + Children, Family.

**Deductible:**
Amount employee must pay before insurance starts covering claims. Example: $1,500 individual deductible means employee pays first $1,500 of medical costs.

**HMO (Health Maintenance Organization):**
Network-based plan requiring members to use in-network providers. No out-of-network coverage (except emergency). Lower cost, more restrictive.

**HDHP (High Deductible Health Plan):**
Medical plan with high deductible (≥$1,400 individual) but compatible with Health Savings Account (HSA). Enables tax-advantaged savings.

**Network (Provider):**
Group of doctors, hospitals, and specialists contracted with insurance company. In-network care is cheaper than out-of-network.

**OOP Max (Out-of-Pocket Maximum):**
Maximum total amount employee pays per year for covered services. After hitting OOP max, insurance covers 100% of remaining services.

**PPO (Preferred Provider Organization):**
Plan with network of preferred providers (lower cost) and out-of-network option (higher cost). More flexibility than HMO.

**Premium:**
Monthly cost of insurance paid by employer + employee combined. Example: $450/month total = $360 employer + $90 employee.

**Renewal:**
Annual process of re-quoting plans. Occurs when current year's plan year ends, usually 1 year from effective date.

**Underwriting:**
Insurance company's risk assessment process determining rates. Can be guaranteed issue (no underwriting) or underwritten (rates vary by health).

### System & Application Terms

**Case:**
Individual benefit project for an employer. Tracks all stages from initial contact through renewal.

**Case Type:**
- New Business: First time employer purchasing benefits
- Renewal: Existing customer continuing benefits next year
- Mid-Year Change: Change to existing benefits during active year
- Takeover: Broker taking over management from previous broker

**Case Stage:**
Position in benefit lifecycle (draft, census, quoting, proposal, enrollment, active, renewal, closed).

**Scenario:**
Alternative set of benefit plans with rates. Example: "Scenario A: 80/50 PPO option" vs "Scenario B: 70/40 with HDHP".

**Proposal:**
Formal document presented to employer showing selected plans, costs, coverage. Can have multiple versions if rejected/revised.

**Enrollment Window:**
Period when employees elect benefits. Example: Open Dec 1-31, effective Jan 1.

**GradientAI:**
Artificial Intelligence system analyzing census members and assigning risk scores. Predicts likelihood of claims and health costs.

**PolicyMatch AI:**
Artificial Intelligence recommending best plan scenario based on employer goals and employee population.

### Operational Terms

**Bulk Operation:**
Action applied to multiple cases/records at once. Example: Assign 50 cases to new broker.

**Activity Log:**
Chronological record of all case changes. Tracks who did what when.

**Audit Trail:**
Complete history of a record showing all edits, approvals, and key dates. Used for compliance.

**Exception:**
Issue requiring attention (high-risk employee, validation error, low enrollment, etc.).

**Task:**
Action item assigned to person with due date. Created automatically at workflow steps.

---

## APPENDIX C: DEPENDENCY MAPPING

### Data Dependencies (What Must Exist Before)

```
Case
├─ Employer (must exist first)
├─ Agency (admin must set)
└─ Census
    ├─ Census Members (auto-created from file)
    └─ GradientAI Risk Analysis (auto-created)
    
Quote Scenario
├─ Case (must exist)
├─ Census Version (to calculate costs)
├─ Plans (must select from Plan Library)
└─ Rates (must exist for plans, in chosen state/location)

Proposal
├─ Case (must exist)
├─ Scenario (must be completed)
├─ Case Stage ≥ "proposal_ready"
└─ Employer Address (for document)

Enrollment
├─ Case (must exist)
├─ Proposal (must be approved)
├─ Case Stage = "approved_for_enrollment"
├─ Census Members (to invite)
└─ Plans (selected plans employees choose from)

Renewal
├─ Case (must exist)
├─ Previous active period (≥1 year)
├─ Employer contact (for renewal notice)
└─ Carriers (to get renewal quotes)
```

### Process Dependencies (What Must Complete Before Next Step)

```
Case Creation
  ↓
Census Upload → Validation → GradientAI Analysis
  ↓
Quote Building → Rate Calculation → Scenario Complete
  ↓
Proposal Generation → Employer Review
  ↓
Enrollment Setup → Employee Elections → Signing (if required)
  ↓
Carrier Implementation → ID Card Distribution
  ↓
Active Status → [1 year] → Renewal
```

### Permission Dependencies

```
New Case Creation
├─ Employer Group must exist (admin creates if needed)
├─ User must have role = Admin or User
└─ Agency must be assigned (admin)

Case Assignment
├─ User must have role = Admin
├─ User being assigned must be active
└─ Case must exist

Bulk Operations
├─ User must have role = Admin
├─ Cases must match filter criteria
└─ Operation must be valid for stage

Zoho Sync
├─ Zoho integration must be configured (admin)
├─ Zoho API key must be valid
├─ Employer record must have basic info (name, email)
└─ User must have admin role
```

---

## APPENDIX D: PERMISSION MATRIX (DETAILED)

### Complete Feature Access Matrix

| Feature | Admin | User | Guest | Notes |
|---------|-------|------|-------|-------|
| **CASE MANAGEMENT** |
| View all cases | ✓ | ✗ | ✗ | Users see assigned only |
| View own cases | ✓ | ✓ | ✗ | |
| Create case | ✓ | ✓ | ✗ | |
| Edit case info | ✓ | ✓ (own) | ✗ | |
| Delete case | ✓ | ✗ | ✗ | |
| Assign case | ✓ | ✗ | ✗ | |
| Close case | ✓ | ✓ (own) | ✗ | |
| Advance stage | ✓ | ✓ (own) | ✗ | |
| View activity log | ✓ | ✓ (own) | ✓ (read-only) | |
| **CENSUS** |
| Upload census | ✓ | ✓ (own case) | ✗ | |
| View members | ✓ | ✓ (own case) | ✓ (no PII) | Guests see no email/phone |
| Edit member | ✓ | ✓ (own case) | ✗ | |
| Delete member | ✓ | ✗ | ✗ | |
| Validate census | ✓ | ✓ (own case) | ✗ | |
| Delete version | ✓ | ✗ | ✗ | |
| Export census | ✓ | ✓ (own case) | ✗ | |
| View risk analysis | ✓ | ✓ (own case) | ✗ | |
| **QUOTES** |
| Create scenario | ✓ | ✓ (own case) | ✗ | |
| Edit scenario | ✓ | ✓ (own case) | ✗ | |
| Delete scenario | ✓ | ✗ | ✗ | |
| View costs | ✓ | ✓ (own case) | ✓ (read-only) | |
| Export scenario | ✓ | ✓ (own case) | ✗ | |
| **PROPOSALS** |
| Create proposal | ✓ | ✓ (own case) | ✗ | |
| Send proposal | ✓ | ✓ (own case) | ✗ | |
| View proposal | ✓ | ✓ (own) | ✓ (read-only) | |
| Edit (draft) | ✓ | ✓ (own) | ✗ | |
| Delete proposal | ✓ | ✗ | ✗ | |
| **ENROLLMENT** |
| Create window | ✓ | ✓ (own case) | ✗ | |
| Send invitations | ✓ | ✓ (own case) | ✗ | |
| View participants | ✓ | ✓ (own case) | ✓ (read-only) | |
| Manually mark enrolled | ✓ | ✗ | ✗ | |
| Override election | ✓ | ✗ | ✗ | |
| Finalize window | ✓ | ✓ (own case) | ✗ | |
| **ADMIN FUNCTIONS** |
| User management | ✓ | ✗ | ✗ | Invite, roles, revoke |
| Integration setup | ✓ | ✗ | ✗ | Zoho, DocuSign, webhooks |
| Settings | ✓ | ✗ | ✗ | |
| API keys | ✓ | ✗ | ✗ | |
| Audit logs | ✓ | ✗ | ✗ | |
| Help console | ✓ | ✗ | ✗ | |

---

## APPENDIX E: INTEGRATION GUIDE (ZOHO CRM)

### Setup Instructions

**Step 1: Get Zoho API Credentials**
1. Log into Zoho CRM account
2. Go to: Setup → Developer Space → API Console
3. Create OAuth client:
   - Name: "ConnectQuote360"
   - Type: "Server-based Applications"
   - Authorized Redirect URL: https://connectquote360.com/oauth/zoho/callback
4. Save: Client ID + Client Secret

**Step 2: Configure in ConnectQuote360**
1. Admin → Settings → Integrations → Zoho CRM
2. Enter:
   - Client ID (from step 1)
   - Client Secret (from step 1)
   - Refresh Token (generated via OAuth flow)
3. Click "Authorize"
4. System redirects to Zoho → Approve access
5. Returns to ConnectQuote360 → Saves credentials

**Step 3: Test Sync**
1. Employers page → Select any employer
2. Click "Sync to Zoho" button
3. Check result: Should show "Synced to Zoho" message
4. Verify in Zoho: Record should appear in Zoho CRM

### Field Mapping

**Employer → Zoho Account:**
| ConnectQuote | Zoho | Notes |
|---|---|---|
| name | Account Name | |
| phone | Phone | |
| email | Email | |
| website | Website | |
| address | Billing Address | |
| city | Billing City | |
| state | Billing State | |
| zip | Billing Code | |
| employee_count | Employees | Custom field |
| industry | Industry | |

### Sync Frequency

**Manual Sync:**
- Employer detail → "Sync to Zoho" button
- Instant sync after button click

**Automated Sync:**
- Scheduled: Nightly at 2 AM (configurable)
- Entity trigger: When employer created/updated
- Both options available in settings

### Troubleshooting

**"Sync failed: Invalid credentials"**
- Credentials might have expired
- Re-authorize: Settings → Integrations → "Re-authorize Zoho"

**"Sync shows missing fields"**
- Zoho record might not have all fields
- Map missing fields: Settings → Integrations → "Field Mapping"

**"Employer not appearing in Zoho"**
- Check employer has required fields: name, email
- Check sync is enabled: Settings → Integrations → Verify "Zoho enabled"
- Manually re-sync: Employer detail → "Sync to Zoho"

---

## APPENDIX F: DATA IMPORT/EXPORT PROCEDURES

### Exporting Data

**Export Cases:**
1. Cases page → Select cases (or use "Select All")
2. Click "Export" button
3. Choose format: CSV, Excel
4. Choose columns: Case #, Name, Stage, Status, etc.
5. Download file

**Export Census:**
1. Census tab → "Export Members" button
2. Choose format: CSV, Excel, Carrier Format
3. Choose columns: Name, Email, Salary, Tier, etc.
4. Download file

**Export Proposals:**
1. Proposals page → Select proposals
2. Click "Export" button
3. Choose format: PDF (for downloading), Excel (for data)
4. Download

**Export Enrollments:**
1. Enrollment tab → "Export Results" button
2. Generates report with:
   - Total invited, enrolled, waived
   - Per-employee status
   - Participation rate
3. Export as: CSV, Excel, PDF

### Importing Data

**Import Employers:**
1. Employers page → "Import Employers" button
2. Prepare CSV with columns:
   - Company Name
   - EIN
   - Address
   - City, State, Zip
   - Phone
   - Email
3. Upload file
4. System imports records
5. Review results: Success count, errors (if any)

**Import Employees (Census):**
1. Case → Census tab → "Upload Census File"
2. Prepare CSV with columns:
   - First Name
   - Last Name
   - Date of Birth
   - Email
   - Hire Date
   - [Optional: Salary, Job Title, Department, etc.]
3. Upload file
4. System maps columns
5. Validates data
6. Creates census version

**Import Plans:**
1. Admin → Plans page → "Import Plans" button
2. Prepare Excel with sheets:
   - Sheet 1: Plan Details (name, carrier, type, network, etc.)
   - Sheet 2: Rates (plan_id, age, rate, etc.)
3. Upload file
4. System imports plans + rates
5. Verify: Plans page should show new plans

### Data Format Requirements

**CSV Format:**
- First row = column headers
- UTF-8 encoding
- One record per row
- Quoted strings if contain commas

**Excel Format:**
- First row = column headers
- One sheet per entity type
- No merged cells
- Simple data types (text, number, date)

**Date Format:**
- Accepted: MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY
- Example: 03/15/1985 or 1985-03-15

**Required Fields:**
- **Employers:** Name, EIN
- **Census:** First Name, Last Name, DOB
- **Plans:** Name, Carrier, Type

### Error Handling

**If import fails:**
1. Check file format: CSV or Excel?
2. Check encoding: Should be UTF-8
3. Check required fields: All present?
4. Check date format: Valid dates?
5. Try again with corrected file

**Error Report:**
- System shows which rows failed
- Reason for failure (missing field, invalid data, etc.)
- Can fix file and retry

---

## APPENDIX G: QUICK REFERENCE CARDS

### Daily Broker Checklist

**Morning:**
- [ ] Check Dashboard for overdue tasks
- [ ] Review new exceptions
- [ ] Check enrollment countdowns (closings soon?)
- [ ] Send renewal reminders (if scheduled)

**During Day:**
- [ ] Follow up on pending proposals
- [ ] Respond to employer questions
- [ ] Complete assigned tasks
- [ ] Update case notes

**End of Day:**
- [ ] Mark completed tasks
- [ ] Document any delays/issues
- [ ] Plan tomorrow's priorities

### Month-End Close Checklist

- [ ] Reconcile all cases (active, closed, pending renewal)
- [ ] Mark completed cases as closed
- [ ] Export commission report
- [ ] Verify all enrollments finalized
- [ ] Archive completed documents
- [ ] Backup critical files
- [ ] Report to manager

### Annual Audit Checklist

- [ ] Review all cases for accuracy
- [ ] Verify all documents stored
- [ ] Confirm all enrollments completed
- [ ] Check compliance (ACA, ERISA, etc.)
- [ ] Reconcile revenue vs. cases
- [ ] Review broker performance metrics
- [ ] Plan next year's cases

---

**End of Appendices**

---

# COMPREHENSIVE MANUAL SUMMARY

**Total Pages (Estimated):** 450-550 pages
**Sections:** 64 major sections
**Workflows Documented:** 50+
**UI Controls Catalogued:** 500+
**Entities Covered:** 30+
**Backend Functions:** 15+
**Troubleshooting Issues:** 100+
**Appendices:** 7 comprehensive

This manual provides complete documentation for Connect Quote 360, suitable for:
- New user onboarding
- Broker/Representative training
- Administrator reference
- Technical support
- Compliance documentation
- Internal knowledge base

---

**Document Version:** 1.0  
**Last Updated:** March 23, 2026  
**Maintainer:** Operations Team  
**Next Review:** Q2 2026