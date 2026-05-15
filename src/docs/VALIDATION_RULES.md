# Input Validation Rules - Complete Specification

**Version:** 1.0  
**Last Updated:** 2026-03-21  
**Scope:** Census, Quotes, Enrollment, Renewals, Plans, Contributions

---

## 1. CENSUS DATA VALIDATION

### 1.1 Member Demographics
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `first_name` | String | Yes | Text | 1-50 chars, no special chars | CENSUS_FNAME_INVALID |
| `last_name` | String | Yes | Text | 1-50 chars, no special chars | CENSUS_LNAME_INVALID |
| `date_of_birth` | Date | Yes | YYYY-MM-DD | Age >= 18, Age <= 120 | CENSUS_DOB_INVALID |
| `gender` | Enum | No | - | male \| female \| other | CENSUS_GENDER_INVALID |
| `ssn_last4` | String | No | \d{4} | Exactly 4 digits | CENSUS_SSN_INVALID |
| `email` | String | No | Email | Valid email format | CENSUS_EMAIL_INVALID |
| `phone` | String | No | \+?1?\d{10} | Valid phone format | CENSUS_PHONE_INVALID |

### 1.2 Employment Info
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `employee_id` | String | Yes | Text | 1-50 chars, unique per census | CENSUS_EMPID_DUPLICATE |
| `hire_date` | Date | Yes | YYYY-MM-DD | <= today, >= 1900-01-01 | CENSUS_HIRE_INVALID |
| `employment_status` | Enum | Yes | - | active \| leave \| terminated | CENSUS_STATUS_INVALID |
| `employment_type` | Enum | Yes | - | full_time \| part_time \| contractor | CENSUS_EMPTYPE_INVALID |
| `hours_per_week` | Number | No | Float | 0 <= hours <= 168 | CENSUS_HOURS_INVALID |
| `annual_salary` | Number | No | Float | >= 0, <= 5,000,000 | CENSUS_SALARY_INVALID |
| `job_title` | String | No | Text | 1-100 chars | CENSUS_JOBTITLE_INVALID |
| `department` | String | No | Text | 1-100 chars | CENSUS_DEPT_INVALID |
| `class_code` | String | No | Text | 1-20 chars | CENSUS_CLASS_INVALID |

### 1.3 Coverage & Eligibility
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `is_eligible` | Boolean | No | - | true \| false | CENSUS_ELIGIBLE_INVALID |
| `dependent_count` | Number | No | Integer | 0 <= count <= 20 | CENSUS_DEPCOUNT_INVALID |
| `coverage_tier` | Enum | No | - | employee_only \| employee_spouse \| employee_children \| family | CENSUS_TIER_INVALID |

### 1.4 Address
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `address` | String | No | Text | 1-100 chars | CENSUS_ADDR_INVALID |
| `city` | String | No | Text | 1-50 chars | CENSUS_CITY_INVALID |
| `state` | String | No | [A-Z]{2} | US state code | CENSUS_STATE_INVALID |
| `zip` | String | No | \d{5}(-\d{4})? | Valid ZIP or ZIP+4 | CENSUS_ZIP_INVALID |

### 1.5 Validation Logic (Cross-Field)
```javascript
// Rule 1: If eligible=true, must have coverage_tier
if (member.is_eligible && !member.coverage_tier) {
  throw "CENSUS_COVERAGE_MISSING"
}

// Rule 2: If terminated, hire_date must be before termination
if (member.employment_status === 'terminated' && member.hire_date >= today) {
  throw "CENSUS_HIRE_AFTER_TERMINATION"
}

// Rule 3: Dependent count + coverage_tier alignment
if (member.coverage_tier === 'employee_only' && member.dependent_count > 0) {
  throw "CENSUS_DEPENDENT_TIER_MISMATCH"
}

// Rule 4: age >= 18 and < 120
const age = (today - member.date_of_birth) / 365.25
if (age < 18 || age > 120) {
  throw "CENSUS_AGE_OUT_OF_RANGE"
}

// Rule 5: Salary consistency
if (member.annual_salary < 20000 && member.employment_type === 'full_time') {
  throw "CENSUS_SALARY_UNUSUALLY_LOW" // Warning, not error
}
```

---

## 2. QUOTE & SCENARIO VALIDATION

### 2.1 Quote Scenario
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `case_id` | String | Yes | UUID | Must exist | QUOTE_CASE_NOTFOUND |
| `name` | String | Yes | Text | 1-100 chars, unique per case | QUOTE_NAME_REQUIRED |
| `effective_date` | Date | Yes | YYYY-MM-DD | >= today + 30 days | QUOTE_EFFDATE_INVALID |
| `census_version_id` | String | Yes | UUID | Must be validated | QUOTE_CENSUS_INVALID |
| `products_included` | Array | Yes | [String] | 1+ products, valid types | QUOTE_PRODUCTS_EMPTY |
| `carriers_included` | Array | Yes | [String] | 1+ carriers | QUOTE_CARRIERS_EMPTY |
| `contribution_strategy` | Enum | Yes | - | percentage \| flat_dollar \| defined_contribution \| custom | QUOTE_STRATEGY_INVALID |

### 2.2 Contribution Percentages
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `employer_contribution_ee` | Number | Yes | Float | 0-100 for %, or >= 0 for flat | QUOTE_CONTRIB_EE_INVALID |
| `employer_contribution_dep` | Number | Yes | Float | 0-100 for %, or >= 0 for flat | QUOTE_CONTRIB_DEP_INVALID |

### 2.3 Validation Logic
```javascript
// Rule 1: Effective date must be >= 30 days out
if (new Date(scenario.effective_date) < addDays(today, 30)) {
  throw "QUOTE_EFFDATE_TOO_SOON"
}

// Rule 2: For percentage strategy, contributions must be 0-100
if (scenario.contribution_strategy === 'percentage') {
  if (scenario.employer_contribution_ee < 0 || scenario.employer_contribution_ee > 100) {
    throw "QUOTE_CONTRIB_PERCENTAGE_RANGE"
  }
}

// Rule 3: Must have at least one carrier if quoting
if (!scenario.carriers_included || scenario.carriers_included.length === 0) {
  throw "QUOTE_CARRIERS_REQUIRED"
}

// Rule 4: Census must be validated before quoting
if (censusVersion.status !== 'validated') {
  throw "QUOTE_CENSUS_NOT_VALIDATED"
}

// Rule 5: Product list must match plan library
for (const product of scenario.products_included) {
  if (!validProducts.includes(product)) {
    throw `QUOTE_PRODUCT_UNKNOWN: ${product}`
  }
}
```

---

## 3. ENROLLMENT VALIDATION

### 3.1 Enrollment Window
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `case_id` | String | Yes | UUID | Must exist | ENROLL_CASE_NOTFOUND |
| `start_date` | Date | Yes | YYYY-MM-DD | < end_date | ENROLL_START_INVALID |
| `end_date` | Date | Yes | YYYY-MM-DD | > start_date, >= today | ENROLL_END_INVALID |
| `effective_date` | Date | Yes | YYYY-MM-DD | >= end_date + 1 day | ENROLL_EFFECTIVE_INVALID |
| `total_eligible` | Number | Yes | Integer | > 0 | ENROLL_ELIGIBLE_INVALID |

### 3.2 Employee Enrollment
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `employee_email` | String | Yes | Email | Valid, unique per window | ENROLL_EMAIL_INVALID |
| `employee_name` | String | Yes | Text | 1-100 chars | ENROLL_NAME_INVALID |
| `coverage_tier` | Enum | No | - | employee_only \| employee_spouse \| employee_children \| family | ENROLL_TIER_INVALID |
| `selected_plan_id` | String | No | UUID | Must exist if set | ENROLL_PLAN_NOTFOUND |
| `waiver_reason` | String | No | Text | 1-500 chars if waiving | ENROLL_WAIVER_INVALID |

### 3.3 Validation Logic
```javascript
// Rule 1: Window dates are in correct order
if (window.start_date >= window.end_date) {
  throw "ENROLL_DATE_ORDER_INVALID"
}

// Rule 2: Enrollment hasn't already closed
if (today > window.end_date) {
  throw "ENROLL_WINDOW_CLOSED"
}

// Rule 3: Enrollment not started yet
if (today < window.start_date) {
  throw "ENROLL_WINDOW_NOT_OPEN" // Info only
}

// Rule 4: If coverage_tier set, must be valid
if (enrollment.coverage_tier && !validTiers.includes(enrollment.coverage_tier)) {
  throw "ENROLL_COVERAGE_TIER_INVALID"
}

// Rule 5: If waiving, reason required
if (enrollment.status === 'waived' && !enrollment.waiver_reason) {
  throw "ENROLL_WAIVER_REASON_REQUIRED"
}

// Rule 6: Completion requires both plan selection OR waiver
if (enrollment.status === 'completed') {
  if (!enrollment.selected_plan_id && !enrollment.waiver_reason) {
    throw "ENROLL_INCOMPLETE_DATA"
  }
}
```

---

## 4. RENEWAL VALIDATION

### 4.1 Renewal Cycle
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `employer_group_id` | String | Yes | UUID | Must exist | RENEWAL_EMP_NOTFOUND |
| `renewal_date` | Date | Yes | YYYY-MM-DD | >= today, <= today + 730 days | RENEWAL_DATE_INVALID |
| `current_premium` | Number | Yes | Float | > 0 | RENEWAL_CURRENT_INVALID |
| `renewal_premium` | Number | No | Float | >= 0 if set | RENEWAL_NEW_INVALID |
| `rate_change_percent` | Number | No | Float | -100 <= x <= 500 | RENEWAL_RATE_INVALID |
| `disruption_score` | Number | No | Integer | 0-100 | RENEWAL_DISRUPTION_INVALID |

### 4.2 Validation Logic
```javascript
// Rule 1: Renewal date is future, not too far
if (renewal.renewal_date < today || renewal.renewal_date > addYears(today, 2)) {
  throw "RENEWAL_DATE_OUT_OF_RANGE"
}

// Rule 2: If renewal_premium set, rate_change must align
if (renewal.renewal_premium) {
  const calculated = (renewal.renewal_premium / renewal.current_premium - 1) * 100
  const actual = renewal.rate_change_percent
  if (Math.abs(calculated - actual) > 1) {
    throw "RENEWAL_RATE_CHANGE_MISMATCH"
  }
}

// Rule 3: Rate change must be reasonable
if (renewal.rate_change_percent > 200) {
  throw "RENEWAL_RATE_INCREASE_EXTREME" // Warning
}

// Rule 4: Status transition rules
const validTransitions = {
  pre_renewal: ['marketed', 'completed'],
  marketed: ['options_prepared', 'completed'],
  options_prepared: ['employer_review', 'completed'],
  employer_review: ['decision_made', 'completed'],
  decision_made: ['install_renewal', 'completed'],
  install_renewal: ['active_renewal', 'completed'],
  active_renewal: ['completed'],
  completed: []
}
if (!validTransitions[renewal.current_status]?.includes(newStatus)) {
  throw "RENEWAL_STATUS_INVALID_TRANSITION"
}
```

---

## 5. PLAN LIBRARY VALIDATION

### 5.1 Benefit Plan
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `plan_type` | Enum | Yes | - | medical \| dental \| vision \| life \| std \| ltd \| voluntary | PLAN_TYPE_INVALID |
| `carrier` | String | Yes | Text | 1-100 chars | PLAN_CARRIER_INVALID |
| `plan_name` | String | Yes | Text | 1-200 chars, unique per type/carrier | PLAN_NAME_DUPLICATE |
| `plan_code` | String | Yes | Text | 1-50 chars | PLAN_CODE_INVALID |
| `deductible_individual` | Number | No | Float | >= 0, <= 10000 | PLAN_DED_IND_INVALID |
| `deductible_family` | Number | No | Float | >= deductible_individual | PLAN_DED_FAM_INVALID |
| `oop_max_individual` | Number | No | Float | >= deductible_individual | PLAN_OOP_IND_INVALID |
| `oop_max_family` | Number | No | Float | >= oop_max_individual | PLAN_OOP_FAM_INVALID |

### 5.2 Prescription Rates
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `rx_tier1` | Number | No | Float | 0-500 (copay or coinsurance %) | PLAN_RX1_INVALID |
| `rx_tier2` | Number | No | Float | >= rx_tier1 | PLAN_RX2_INVALID |
| `rx_tier3` | Number | No | Float | >= rx_tier2 | PLAN_RX3_INVALID |
| `rx_tier4` | Number | No | Float | >= rx_tier3 | PLAN_RX4_INVALID |

### 5.3 Validation Logic
```javascript
// Rule 1: Deductible hierarchy
if (plan.deductible_family && plan.deductible_individual) {
  if (plan.deductible_family < plan.deductible_individual) {
    throw "PLAN_DED_HIERARCHY_INVALID"
  }
}

// Rule 2: OOP max >= deductible
if (plan.oop_max_individual && plan.deductible_individual) {
  if (plan.oop_max_individual < plan.deductible_individual) {
    throw "PLAN_OOP_BELOW_DED"
  }
}

// Rule 3: Prescription tier order
if (plan.rx_tier1 > plan.rx_tier2 || plan.rx_tier2 > plan.rx_tier3 || plan.rx_tier3 > plan.rx_tier4) {
  throw "PLAN_RX_TIER_ORDER_INVALID"
}

// Rule 4: Copay vs coinsurance consistency
if (plan.copay_pcp && plan.coinsurance) {
  // Can have both, but verify they make sense
  if (plan.copay_pcp > 200) {
    throw "PLAN_COPAY_UNUSUALLY_HIGH" // Warning
  }
}

// Rule 5: Unique plan_code per carrier
const duplicates = allPlans.filter(p => p.carrier === plan.carrier && p.plan_code === plan.plan_code)
if (duplicates.length > 1) {
  throw "PLAN_CODE_DUPLICATE"
}
```

---

## 6. CONTRIBUTION VALIDATION

### 6.1 Contribution Model
| Field | Type | Required | Format | Rules | Error Code |
|-------|------|----------|--------|-------|-----------|
| `scenario_id` | String | Yes | UUID | Must exist | CONTRIB_SCENARIO_NOTFOUND |
| `case_id` | String | Yes | UUID | Must exist | CONTRIB_CASE_NOTFOUND |
| `name` | String | Yes | Text | 1-100 chars | CONTRIB_NAME_INVALID |
| `strategy` | Enum | Yes | - | percentage \| flat_dollar \| defined_contribution \| custom | CONTRIB_STRATEGY_INVALID |
| `ee_contribution_pct` | Number | No | Float | 0-100 (if percentage strategy) | CONTRIB_EE_PCT_INVALID |
| `dep_contribution_pct` | Number | No | Float | 0-100 (if percentage strategy) | CONTRIB_DEP_PCT_INVALID |
| `ee_contribution_flat` | Number | No | Float | >= 0 (if flat_dollar strategy) | CONTRIB_EE_FLAT_INVALID |
| `dep_contribution_flat` | Number | No | Float | >= 0 (if flat_dollar strategy) | CONTRIB_DEP_FLAT_INVALID |
| `total_monthly_employer_cost` | Number | No | Float | >= 0, matches calculation | CONTRIB_COST_INVALID |

### 6.2 Validation Logic
```javascript
// Rule 1: Strategy determines which fields are required
if (model.strategy === 'percentage') {
  if (!model.ee_contribution_pct || model.ee_contribution_pct < 0 || model.ee_contribution_pct > 100) {
    throw "CONTRIB_PERCENTAGE_INVALID"
  }
} else if (model.strategy === 'flat_dollar') {
  if (!model.ee_contribution_flat || model.ee_contribution_flat < 0) {
    throw "CONTRIB_FLAT_INVALID"
  }
}

// Rule 2: Calculated costs match submitted costs
const calculatedCost = calculateTotalEmployerCost(model)
if (Math.abs(model.total_monthly_employer_cost - calculatedCost) > 1) {
  throw "CONTRIB_COST_CALCULATION_MISMATCH"
}

// Rule 3: ACA affordability check
if (model.aca_affordability_flag) {
  const percentOfSalary = model.total_ee_cost / calculateAverageSalary()
  if (percentOfSalary < 0.085) { // Less than 8.5% threshold
    throw "CONTRIB_ACA_FLAG_INCONSISTENT"
  }
}

// Rule 4: Dependent contribution can't exceed employee
if (model.strategy === 'percentage') {
  if (model.dep_contribution_pct > model.ee_contribution_pct) {
    throw "CONTRIB_DEP_EXCEEDS_EE" // Warning
  }
}
```

---

## 7. GLOBAL VALIDATION RULES

### 7.1 Common Rules (All Entities)
```javascript
// Required field check
if (!value || value.toString().trim() === '') {
  throw `${entityType}_REQUIRED_FIELD_MISSING`
}

// Enum validation
const validEnums = getValidEnumValues(fieldName)
if (!validEnums.includes(value)) {
  throw `${entityType}_${fieldName.toUpperCase()}_NOT_IN_ENUM`
}

// Date validation
if (!(value instanceof Date) || isNaN(value)) {
  throw `${entityType}_INVALID_DATE_FORMAT`
}

// UUID validation
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
  throw `${entityType}_INVALID_UUID_FORMAT`
}

// Email validation
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
  throw `${entityType}_INVALID_EMAIL_FORMAT`
}

// Phone validation
if (!/^\+?1?\d{10,15}$/.test(value.replace(/\D/g, ''))) {
  throw `${entityType}_INVALID_PHONE_FORMAT`
}

// String length
if (value.length > maxLength) {
  throw `${entityType}_STRING_TOO_LONG`
}
if (value.length < minLength) {
  throw `${entityType}_STRING_TOO_SHORT`
}

// Numeric range
if (value < min || value > max) {
  throw `${entityType}_OUT_OF_RANGE`
}
```

### 7.2 Special Validations
```javascript
// Uniqueness check
if (await isDuplicate(entity, field)) {
  throw `${entityType}_${field.toUpperCase()}_DUPLICATE`
}

// Foreign key check
if (!(await exists(referencedEntity, referencedId))) {
  throw `${entityType}_${refField}_NOT_FOUND`
}

// State code validation
if (!/^[A-Z]{2}$/.test(value)) {
  throw `INVALID_STATE_CODE`
}

// ZIP code validation (US)
if (!/^\d{5}(-\d{4})?$/.test(value)) {
  throw `INVALID_ZIP_CODE`
}
```

---

## 8. ERROR SEVERITY LEVELS

| Level | Definition | Action | Example |
|-------|-----------|--------|---------|
| **ERROR** | Fatal, blocks operation | Reject submission | Missing required field |
| **WARNING** | Unusual but allowed | Log & proceed with flag | Salary unusually low |
| **INFO** | FYI only | Log & proceed | Enrollment window not yet open |

---

## 9. VALIDATION EXECUTION ORDER

```
1. Parse input (JSON/CSV)
2. Type coercion (string → date, etc.)
3. Field-level validation (required, format, range)
4. Enum validation
5. Cross-field validation (relationships)
6. Foreign key validation (references)
7. Uniqueness checks
8. Business logic validation
9. Return: { errors: [...], warnings: [...], data: {...} }
``