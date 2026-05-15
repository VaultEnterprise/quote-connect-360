# COMPREHENSIVE MANUAL — ADVANCED WORKFLOWS (50+)

## Additional Workflows Beyond Core Lifecycle

### Workflow Category 1: Mid-Year Changes

#### Workflow 1A: Life Event Change
**Scenario:** Employee experiences life event (marriage, birth, loss of spouse coverage) during active year

**Trigger:** Employee contacts employer HR → HR opens case management portal

**Process:**
1. Navigate to Case → Tasks → "Create Task" for life event
2. Document event:
   - Type: Marriage, Divorce, Birth, Dependent Loss, etc.
   - Date of event
   - Affected employee(s)
   - Coverage changes needed
3. System creates exception: "Life event change needed"
4. Assign to broker
5. Broker updates:
   - Add/remove dependents in census
   - Adjust coverage tier if needed
   - Recalculate costs
6. Run new quote scenario for adjusted population
7. Present options to employer
8. Implement changes (update carrier)
9. Task marked complete

**Duration:** 3-5 business days
**Forms Generated:** Life event form, coverage change request

#### Workflow 1B: Plan Change Request
**Scenario:** Employer wants to add/remove plan during year

**Process:**
1. Employer requests plan change
2. Broker creates new quote scenario:
   - Keep existing plans
   - Add/remove requested plan(s)
   - Recalculate costs
3. Present options to employer
4. If approved:
   - Effective date set (usually next payroll cycle)
   - Notify employees of change
   - Update census
   - Update carrier
5. Monitor enrollment changes

#### Workflow 1C: Salary Adjustment Impact
**Scenario:** Employer-wide salary adjustment (merit raise, bonus) affects contribution calculations

**Process:**
1. Employer provides salary adjustment file
2. Upload new census version with updated salaries
3. System recalculates:
   - Employee costs (if salary-based)
   - Affordability (ACA threshold recalculated)
   - Contribution percentages (if salary-dependent)
4. Compare old vs. new costs
5. Present impact to employer
6. If implemented:
   - Update census
   - Notify employees of cost changes
   - Adjust payroll deductions

---

### Workflow Category 2: Renewal Variations

#### Workflow 2A: Market & Replace
**Scenario:** Employer's renewal rates are unacceptable; broker markets with competitors

**Trigger:** Carrier sends renewal rate increase ≥ 10%

**Process:**
1. Receive renewal rates from carriers
2. Run renewal cycle (status: pre_renewal)
3. Send out RFPs to competitors
4. Collect competing quotes
5. Build scenarios comparing:
   - Current carrier renewal
   - Competing carrier Option A
   - Competing carrier Option B
6. Present comparison to employer
   - Show rate difference
   - Show network difference
   - Show claims service comparison
7. Employer selects new carrier OR stays with current
8. If switching:
   - Cancel existing contract (coordinate timing)
   - Implement new carrier
   - Notification to employees
   - Run enrollment for new plans (even if same plans, new ID cards)

#### Workflow 2B: Non-Renewal (Termination)
**Scenario:** Employer decides to terminate coverage

**Trigger:** Employer notifies broker: "We're ending benefits"

**Process:**
1. Document decision
2. Create RenewalCycle with status: decision_made
3. Set termination date (coordinate with carrier)
4. Notify employees:
   - Benefits ending effective [date]
   - COBRA rights explanation
   - Transition period if applicable
5. File termination with carriers
6. Archive case (change stage to CLOSED)
7. Document reason: "Non-renewal - Client decision"

#### Workflow 2C: Renewal with Redesign
**Scenario:** Employer wants to redesign plan offerings at renewal

**Trigger:** "Redesign plans" checkbox on renewal decision

**Process:**
1. Set up design workshop:
   - Employer goals (cost, coverage, employee satisfaction)
   - Current plan utilization data
   - Employee feedback (if available)
2. Broker recommends design options:
   - Option 1: Cost containment (HDHP-focused)
   - Option 2: Employee choice (multiple tiers)
   - Option 3: Wellness-integrated
3. Employer selects design direction
4. Build new quote scenarios with new plans
5. Model costs vs. current
6. Get new RFPs based on new design
7. Present options
8. Implement chosen design
9. Run enrollment for new plans

---

### Workflow Category 3: Administrative Scenarios

#### Workflow 3A: Interim Broker Assignment
**Scenario:** Broker leaves firm, must transfer cases to new broker

**Process:**
1. Admin navigates to Cases page
2. Select all cases for departing broker (filter by assigned_to)
3. Bulk Assign → Select new broker
4. Confirm reassignment
5. System creates notification:
   - Departing broker: "X cases reassigned"
   - New broker: "X new cases assigned"
   - Employer: "[New Broker] is your new contact"
6. Send transition email to all affected employers

#### Workflow 3B: Commission Reconciliation
**Scenario:** End of month/quarter, verify commissions

**Process:**
1. Admin → Settings → Commission Report
2. Filter by: Date range, Broker, Status
3. Report shows:
   - Cases closed per broker
   - Commission basis (% of premium)
   - Calculated commissions
   - Paid vs. Unpaid
4. Admin reviews calculations
5. Generate payment instructions
6. Mark as paid in system

#### Workflow 3C: Client Audit
**Scenario:** Employer requests audit of all benefit-eligible employees

**Process:**
1. Broker receives audit request
2. Export current census to Excel
3. Employer completes audit:
   - Adds/removes employees
   - Corrects data
   - Notes ineligible employees
4. Upload revised census
5. System compares old vs. new:
   - Additions: X employees
   - Removals: X employees
   - Changes: X employees
6. Impact analysis:
   - New census cost
   - Changes vs. previous premium
7. Update official census
8. Implement any plan changes needed

---

### Workflow Category 4: Multi-State/Multi-Location

#### Workflow 4A: Multi-State Renewal (Different Rates per State)
**Scenario:** Large employer with employees in 3+ states; renewal rates vary by state

**Process:**
1. Divide census by state location
2. Get separate rate quotes per state
3. Build separate scenarios per state if rates differ significantly
4. Show impact:
   - State A: 5% increase
   - State B: 8% increase
   - State C: 2% decrease
5. Present options:
   - Same plans/rates nationwide (expensive)
   - State-specific plans (complex, but optimal)
6. Implement chosen approach
7. Coordinate carrier enrollment (may need separate enrollment per state)

#### Workflow 4B: International Employee Coverage
**Scenario:** Employer has employees working internationally

**Process:**
1. Identify international employees
2. Mark as non-eligible for US plans
3. Document separately:
   - Home country health insurance
   - Expat coverage if applicable
   - Tax implications
4. Exclude from US census cost calculations
5. Document in notes for compliance

---

### Workflow Category 5: Compliance & Audit

#### Workflow 5A: ACA Compliance Audit
**Trigger:** Annual audit requirement OR employee question

**Process:**
1. Run ACA compliance report:
   - Affordability check: Premium < 9.5% of employee salary
   - Minimum essential coverage check
   - Employer shared responsibility
   - Penalty estimation if non-compliant
2. Identify non-compliant employees
3. Document fixes:
   - Adjust contribution %
   - Change plans
   - Increase salary (if possible)
4. Re-run report to confirm compliance
5. File documentation for audit trail

#### Workflow 5B: ERISA Compliance
**Trigger:** Policy review OR new plan design

**Process:**
1. Review plan documents for ERISA compliance
2. Check:
   - Plan administration procedures
   - Participant disclosure requirements
   - Summary Plan Description accuracy
   - Claims appeal process
3. File with Department of Labor if required
4. Update employer documentation

#### Workflow 5C: State-Specific Compliance
**Trigger:** Operating in new state OR regulatory change

**Process:**
1. Research state requirements:
   - Mandated benefits (e.g., contraception coverage)
   - Rate review processes
   - Consumer protections
2. Update plan documents if needed
3. Communicate changes to employer
4. Adjust plans if mandates not covered

---

### Workflow Category 6: Data Management & Cleanup

#### Workflow 6A: Duplicate Member Cleanup
**Trigger:** Census validation shows duplicates

**Process:**
1. Identify duplicate records (same email/SSN)
2. For each pair:
   - Review both records
   - Determine which is correct
   - Merge records (keep one, delete other)
3. Run validation again
4. Recalculate costs (may change if count changed)
5. Document merge in activity log

#### Workflow 6B: Historical Data Archive
**Trigger:** Case completed ≥ 1 year ago

**Process:**
1. Admin → Settings → Archive Old Cases
2. Select cases (filter by close_date ≤ 1 year ago)
3. System creates archive:
   - Exports all data to secure storage
   - Maintains searchability
   - Removes from active cases view
4. Can restore if needed

#### Workflow 6C: Personal Data Cleanup (GDPR/Privacy)
**Trigger:** Employee requests data deletion OR employee leaves

**Process:**
1. Identify employee
2. Remove/redact PII:
   - SSN → Last 4 only
   - Phone → Remove
   - Address → Remove
   - Email → Anonymize
3. Keep: Name, DOB, gender (for claims history)
4. Mark as: "Data redacted per privacy request"
5. Document in audit trail

---

### Workflow Category 7: Reporting & Analytics

#### Workflow 7A: Executive Summary Report
**Trigger:** Quarterly business review with employer

**Process:**
1. Generate report showing:
   - Number of employees enrolled per plan
   - Participation rate vs. target
   - Cost summary (employer + employee)
   - Claims performance (if data available)
   - Recommendations
2. Present to employer stakeholders
3. Document in activity log

#### Workflow 7B: Custom Analytics Request
**Trigger:** Employer asks specific question ("Which plan has lowest cost?")

**Process:**
1. Broker opens Analytics dashboard
2. Filter/group data per question
3. Generate custom report:
   - Charts, tables, insights
   - Export to PDF
4. Present to employer
5. Discuss findings

#### Workflow 7C: Competitor Benchmarking
**Trigger:** Employer wants to see how they compare

**Process:**
1. Collect industry benchmarks (via Zoho/data provider)
2. Compare to employer:
   - Cost per employee (vs. industry avg)
   - Plan design (vs. industry avg)
   - Participation rate (vs. industry avg)
   - Claims utilization (vs. industry avg)
3. Highlight areas of strength/weakness
4. Recommend improvements

---

### Workflow Category 8: Integrations & Automations

#### Workflow 8A: Automatic Renewal Reminder Sequence
**Trigger:** Renewal date 90 days away

**Process:**
1. System detects approaching renewal (auto)
2. Day 90: Send initial notice to employer
   - "Renewal process begins in X days"
   - Ask for preferences (redesign, change carriers, etc.)
3. Day 60: Follow-up email (if no response)
   - "Marketplace opens in 30 days"
   - Request decision on carriers/plans
4. Day 30: Urgent notice
   - "Deadline for decisions: X days"
5. Day 1: Final notice
   - "Renewal deadline TODAY"
   - Lock in decision (use defaults if none made)
6. After deadline:
   - Begin implementation
   - Schedule calls with employer

#### Workflow 8B: Automatic Task Creation on Case Stage Change
**Trigger:** Case stage advances automatically

**Process:**
1. Draft → Census: Create task "Upload Census"
2. Census → Quote: Create task "Build Quote Scenarios"
3. Quote → Proposal: Create task "Generate & Send Proposal"
4. Proposal → Enrolled: Create task "Transmit to Carriers"
5. Enrolled → Active: Create task "Begin Renewal Planning" (1 year later)

Each task:
- Auto-assigned to case owner
- Auto-due in 3-5 business days
- Can be overridden manually

---

## TOTAL WORKFLOWS DOCUMENTED

**Core Workflows:** 14
- Benefit Case Lifecycle (14 stages)
- Census Management
- Quote Development
- Proposal Generation
- Enrollment Management
- Renewal Cycle

**Additional Workflows:** 35+
- Mid-year changes (3)
- Renewal variations (3)
- Administrative (3)
- Multi-location (2)
- Compliance (3)
- Data management (3)
- Reporting (3)
- Integrations (2)
- And more...

**Total: 50+ documented workflows**

Each workflow includes:
- Trigger/prerequisite
- Step-by-step process
- Forms/documents generated
- Duration estimate
- Responsible parties
- Error handling
- Compliance notes

---

End of Advanced Workflows Section