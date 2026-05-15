# COMPREHENSIVE MANUAL — REFERENCE: ENTITIES & STATE MACHINES

## Entity Reference Guide (30 Entities)

### Core Entities

#### 1. BenefitCase
**Purpose:** Central record for benefit administration project

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| agency_id | UUID | Parent agency |
| employer_group_id | UUID | Parent employer |
| case_number | String | Auto-generated (CQ-YYMMDD-XXXXX) |
| case_type | Enum | new_business, renewal, mid_year_change, takeover |
| effective_date | Date | When coverage starts |
| stage | Enum | 15 stages (draft → closed) |
| priority | Enum | low, normal, high, urgent |
| assigned_to | Email | Broker email |
| products_requested | Array | [medical, dental, vision, life, std, ltd] |
| notes | Text | Internal notes |
| employer_name | String | Denormalized for display |
| employee_count | Number | Census total |
| census_status | Enum | not_started, uploaded, validated, issues_found |
| quote_status | Enum | not_started, in_progress, completed, expired |
| enrollment_status | Enum | not_started, open, in_progress, completed, closed |
| last_activity_date | DateTime | Last update timestamp |
| target_close_date | Date | Broker's target close |
| closed_date | Date | When case closed |
| closed_reason | String | Reason for closure |

**Relationships:**
- ← Agency (parent)
- ← EmployerGroup (parent)
- → CensusVersion (many)
- → QuoteScenario (many)
- → Proposal (many)
- → EnrollmentWindow (many)
- → RenewalCycle (many)
- → CaseTask (many)
- → Document (many)
- → ActivityLog (many)
- → ExceptionItem (many)

**State Transition Rules:**
```
draft 
  ↓ (census_status = validated)
census_in_progress
  ↓ (all validation complete)
census_validated
  ↓ (manual advance OR deadline reached)
ready_for_quote
  ↓ (quote created)
quoting
  ↓ (scenario completed)
proposal_ready
  ↓ (proposal sent)
employer_review
  ↓ (employer approves)
approved_for_enrollment
  ↓ (enrollment window created + starts)
enrollment_open
  ↓ (enrollment window closes)
enrollment_complete
  ↓ (carrier setup begins)
install_in_progress
  ↓ (carrier confirms)
active
  ↓ (1 year later OR renewal initiated)
renewal_pending
  ├→ renewed (renewed case)
  └→ closed (not renewed)
closed (terminal)
```

**Validation Rules by Stage:**

| Stage | Must Have | Cannot Advance Without |
|-------|-----------|------------------------|
| draft | employer name, effective date | census ready |
| census_in_progress | ≥1 census version | all errors resolved |
| census_validated | validated census | quote ready |
| ready_for_quote | employee count ≥5 | quote completed |
| quoting | ≥1 scenario | scenario complete |
| proposal_ready | proposal generated | proposal sent |
| employer_review | proposal sent | employer approval |
| enrolled | ≥1 enrollment signup | enrollment complete |
| active | carrier confirm | N/A (manual) |

---

#### 2. CensusVersion
**Purpose:** Tracks census file uploads and versions

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| version_number | Number | 1, 2, 3... |
| file_url | String | Uploaded file location |
| file_name | String | Original filename |
| status | Enum | uploaded, mapping, validating, validated, has_issues, archived |
| total_employees | Number | Row count |
| total_dependents | Number | Dependent total |
| eligible_employees | Number | Benefit-eligible count |
| validation_errors | Number | Count of errors |
| validation_warnings | Number | Count of warnings |
| uploaded_by | Email | Uploader |
| validated_at | DateTime | Validation complete |
| notes | String | Upload notes |

**Relationships:**
- ← BenefitCase (parent)
- → CensusMember (many, one per employee)

**Validation Status Transitions:**
```
uploaded → mapping → validating → {
  validated (success) |
  has_issues (errors found)
}
```

---

#### 3. CensusMember
**Purpose:** Individual employee record from census

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| census_version_id | UUID | Parent version |
| case_id | UUID | Parent case |
| employee_id | String | Employer's ID |
| first_name | String | Required |
| last_name | String | Required |
| date_of_birth | Date | Required |
| gender | Enum | male, female, other |
| ssn_last4 | String | PII protection |
| email | Email | For enrollment |
| phone | Phone | Contact |
| address | String | Mailing |
| city, state, zip | String | Location |
| hire_date | Date | Benefit eligibility |
| employment_status | Enum | active, leave, terminated |
| employment_type | Enum | full_time, part_time, contractor |
| hours_per_week | Number | For rates |
| annual_salary | Currency | For contribution |
| job_title | String | Department |
| department | String | Org unit |
| location | String | Office location |
| class_code | String | Class-based rating |
| is_eligible | Boolean | Benefit eligible |
| eligibility_reason | String | Why ineligible |
| dependent_count | Number | Family count |
| coverage_tier | Enum | EE, ES, EC, Family |
| validation_status | Enum | pending, valid, has_warnings, has_errors |
| validation_issues | Array | Issues found |
| gradient_ai_data | Object | Risk scoring |

**GradientAI Data Structure:**
```json
{
  "risk_score": 45,  // 0-100, lower better
  "risk_tier": "standard",  // preferred, standard, elevated, high
  "risk_factors": [
    "age > 55",
    "BMI > 30",
    "multiple chronic conditions"
  ],
  "predicted_annual_claims": 12500,
  "confidence_score": 0.87,  // 0-1
  "analyzed_at": "2026-03-23T..."
}
```

---

#### 4. QuoteScenario
**Purpose:** Alternative benefit package with rates

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| name | String | "80/50 PPO Option" |
| status | Enum | draft, running, completed, error, expired |
| census_version_id | UUID | Which census |
| products_included | Array | [medical, dental, vision, life] |
| carriers_included | Array | [Carrier A, Carrier B] |
| effective_date | Date | Coverage start |
| contribution_strategy | Enum | percentage, flat_dollar, defined_contribution |
| employer_contribution_ee | Number | EE contribution % or $ |
| employer_contribution_dep | Number | Dependent contribution |
| total_monthly_premium | Currency | All plans |
| employer_monthly_cost | Currency | Employer's share |
| employee_monthly_cost_avg | Currency | Employee average |
| plan_count | Number | Number of plans |
| is_recommended | Boolean | By PolicyMatch |
| recommendation_score | Number | 0-100 recommendation |
| notes | String | Scenario notes |
| quoted_at | DateTime | Creation time |
| expires_at | DateTime | Quote validity |

**Relationships:**
- ← BenefitCase (parent)
- → ScenarioPlan (many)
- → ContributionModel (many)
- → Proposal (many)

**Status Transitions:**
```
draft → running → completed
           ↓
          error (optional)
           ↓
        (retry as new scenario)
```

---

#### 5. Proposal
**Purpose:** Formal benefit recommendation document

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| scenario_id | UUID | Which scenario |
| version | Number | 1, 2, 3... (resubmissions) |
| title | String | "2025 Proposal - ABC Corp" |
| status | Enum | draft, sent, viewed, approved, rejected, expired |
| employer_name | String | Display |
| effective_date | Date | Coverage start |
| broker_name | String | From user profile |
| broker_email | Email | Contact |
| agency_name | String | From settings |
| cover_message | String | Broker's letter |
| plan_summary | Array | Plan details array |
| contribution_summary | Object | Cost breakdown |
| total_monthly_premium | Currency | All plans |
| employer_monthly_cost | Currency | Employer's share |
| employee_avg_cost | Currency | Employee average |
| sent_at | DateTime | Send timestamp |
| viewed_at | DateTime | Portal open |
| approved_at | DateTime | Approval |
| expires_at | DateTime | Validity |
| notes | String | Internal notes |

**Relationships:**
- ← BenefitCase (parent)
- ← QuoteScenario (parent)
- → EmployeeEnrollment (many, one per employee)
- → Document (PDF stored)
- → ActivityLog (tracked)

**Status Transitions:**
```
draft → sent → viewed → {
                   approved (proceed to enrollment) |
                   rejected (create new scenario)
                 }
              → expired (beyond decision deadline)
```

---

#### 6. EnrollmentWindow
**Purpose:** Open enrollment period for employees

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| status | Enum | scheduled, open, closing_soon, closed, finalized |
| start_date | Date | Enrollment opens |
| end_date | Date | Enrollment closes |
| effective_date | Date | Coverage starts |
| total_eligible | Number | Employees eligible |
| invited_count | Number | Invitations sent |
| enrolled_count | Number | Completed |
| waived_count | Number | Declined coverage |
| pending_count | Number | Invited not completed |
| participation_rate | % | Enrolled / Total |
| employer_name | String | Display |
| reminder_sent_at | DateTime | 1st reminder |
| finalized_at | DateTime | Lock timestamp |

**Relationships:**
- ← BenefitCase (parent)
- → EmployeeEnrollment (many, one per employee)
- → EnrollmentMember (many, aggregated data)

**Status Transitions:**
```
scheduled (before start_date)
  ↓ (start_date reached)
open (actively enrolling)
  ↓ (≤7 days to end)
closing_soon
  ↓ (end_date reached OR manual)
closed (no new enrollments)
  ↓ (manual finalize)
finalized (locked, results generated)
```

---

#### 7. EmployeeEnrollment
**Purpose:** Individual employee's enrollment participation

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| enrollment_window_id | UUID | Parent window |
| case_id | UUID | Parent case |
| employee_email | Email | Unique key |
| employee_name | String | Display |
| access_token | String | One-time access |
| status | Enum | invited, started, completed, waived |
| coverage_tier | Enum | EE, ES, EC, Family |
| selected_plan_id | UUID | Plan chosen |
| selected_plan_name | String | Plan display |
| waiver_reason | String | Why declined |
| dependents | Array | Dependent records |
| date_of_birth | Date | Employee DOB |
| acknowledged_at | DateTime | Accessed portal |
| completed_at | DateTime | Submitted |
| employer_name | String | Display |
| effective_date | Date | Coverage start |
| docusign_envelope_id | String | DocuSign envelope ID |
| docusign_status | Enum | not_sent, sent, delivered, completed, declined |
| docusign_signed_at | DateTime | Signing completed |
| docusign_document_url | String | Signed doc |
| docusign_sent_at | DateTime | DocuSign sent |
| docusign_declined_reason | String | Why declined |

**Relationships:**
- ← EnrollmentWindow (parent)
- ← BenefitCase (parent)
- → CensusMember (reference)
- → Document (signed forms)

**Status Transitions:**
```
invited (sent link)
  ↓ (user accesses portal)
started (reviewing options)
  ↓ (user selects plans)
completed (submitted)
  ↓ (document signing if required)
  OR
  ↓ (no signing needed)
[final state: plan locked]

OR from invited/started:

waived (chose not to enroll)
[final state: no coverage]
```

---

#### 8. RenewalCycle
**Purpose:** Annual/periodic renewal process

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| employer_group_id | UUID | Parent employer |
| renewal_date | Date | Renewal effective date |
| status | Enum | pre_renewal, marketed, options_prepared, employer_review, decision_made, install_renewal, active_renewal, completed |
| current_premium | Currency | Current rates |
| renewal_premium | Currency | New rates |
| rate_change_percent | % | Increase/decrease |
| disruption_score | Number | 0-100 disruption level |
| recommendation | Enum | renew_as_is, renew_with_changes, market, terminate |
| decision | String | Final decision |
| decision_date | Date | When decided |
| employer_name | String | Display |
| assigned_to | Email | Renewal broker |
| notes | String | Renewal notes |

**Relationships:**
- ← BenefitCase (parent)
- ← EmployerGroup (parent)

**Status Transitions:**
```
pre_renewal (90 days before)
  ↓
marketed (quotes from carriers)
  ↓
options_prepared (scenarios built)
  ↓
employer_review (options presented)
  ↓
decision_made (employer chooses)
  ↓
install_renewal (implement)
  ↓
active_renewal (live for 1 year)
  ↓
completed (renewal cycle done)
```

---

#### 9. CaseTask
**Purpose:** Action items within case

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| title | String | Task description |
| description | String | Details |
| task_type | Enum | action_required, follow_up, review, approval, document, system |
| status | Enum | pending, in_progress, completed, cancelled, blocked |
| priority | Enum | low, normal, high, urgent |
| assigned_to | Email | Assignee |
| due_date | Date | When due |
| completed_at | DateTime | Completion time |
| completed_by | Email | Who completed |
| related_entity_type | String | Entity reference |
| related_entity_id | UUID | Entity reference |
| notes | String | Task notes |
| employer_name | String | Display |

**Relationships:**
- ← BenefitCase (parent)
- → Related entity (generic)

**Status Transitions:**
```
pending (created)
  ↓ (user starts work)
in_progress
  ↓ (work done)
completed
[terminal]

OR from pending/in_progress:

cancelled (not needed)
[terminal]

OR:

blocked (waiting for something)
  ↓ (unblocked)
pending (retry)
```

**Auto-Created Tasks:**

The system auto-creates tasks for workflow steps:

| Trigger | Task | Notes |
|---------|------|-------|
| Case created | Upload Census | Task 1 |
| Census validated | Build Quote Scenarios | Task 2 |
| Quote completed | Generate Proposal | Task 3 |
| Proposal sent | Follow up with employer | Task 4 |
| Employer approves | Create Enrollment Window | Task 5 |
| Enrollment closed | Transmit to carriers | Task 6 |
| Carriers confirm | Distribute ID cards | Task 7 |
| Effective date reached | Begin renewal planning | Task 8 (1 year) |

---

#### 10. ExceptionItem
**Purpose:** Issues requiring attention

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| employer_name | String | Display |
| category | Enum | census, quote, enrollment, carrier, document, billing, system |
| severity | Enum | low, medium, high, critical |
| status | Enum | new, triaged, in_progress, waiting_external, resolved, dismissed |
| title | String | Exception title |
| description | String | Details |
| suggested_action | String | Recommended fix |
| assigned_to | Email | Assignee |
| due_by | Date | Resolution deadline |
| resolved_at | DateTime | When fixed |
| resolution_notes | String | How fixed |
| entity_type | String | Related entity |
| entity_id | UUID | Related entity |

**Relationships:**
- ← BenefitCase (parent)
- → Related entity

**Examples of Auto-Created Exceptions:**

| Trigger | Exception | Severity |
|---------|-----------|----------|
| Census upload fails | File format error | High |
| Member age invalid | Invalid DOB | Medium |
| Quote expires | Expired quote | High |
| Proposal rejected | Employer declined | High |
| Enrollment low | Low participation | Medium |
| Carrier delay | Carrier not responding | Critical |

---

#### 11. Document
**Purpose:** File storage and versioning

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| employer_group_id | UUID | Parent employer |
| name | String | Document title |
| document_type | Enum | census, proposal, sbc, application, contract, correspondence, enrollment_form, other |
| file_url | String | Storage location |
| file_name | String | Original filename |
| file_size | Number | Bytes |
| notes | String | Doc notes |
| uploaded_by | Email | Uploader |
| employer_name | String | Display |

**Relationships:**
- ← BenefitCase (parent)
- ← EmployerGroup (parent)

---

#### 12. ActivityLog
**Purpose:** Audit trail of all changes

**Key Fields:**
| Field | Type | Purpose |
|-------|------|---------|
| case_id | UUID | Parent case |
| actor_email | Email | Who made change |
| actor_name | String | Display |
| action | String | What happened |
| detail | String | Details |
| entity_type | String | What changed |
| entity_id | UUID | Record ID |
| old_value | String | Before |
| new_value | String | After |

**Relationships:**
- ← BenefitCase (parent)

**Auto-Logged Events:**
- Case created
- Case stage changed
- Census uploaded
- Quote scenario created
- Proposal sent/approved
- Enrollment opened/closed
- Exception created/resolved
- Task completed
- Case closed

---

## Other Entities (Abbreviated)

| Entity | Purpose |
|--------|---------|
| Agency | Parent agency/group |
| EmployerGroup | Company/employer record |
| BenefitPlan | Plan library (medical, dental, etc.) |
| PlanRateTable | Rates per plan |
| ScenarioPlan | Plan selection in scenario |
| ContributionModel | Contribution strategy calculation |
| EnrollmentMember | Aggregated enrollment data |
| HelpContent | Help articles |
| HelpTarget | Help target definitions |
| ... | (10+ more) |

---

End of Entities Reference Section