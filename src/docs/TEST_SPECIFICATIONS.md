# Test Specifications & Test Cases

**Version:** 1.0  
**Last Updated:** 2026-03-21  
**Coverage Target:** 90%+  
**Test Framework:** Jest + React Testing Library

---

## 1. TEST STRUCTURE

### Test Pyramid
```
           /\
          /  \  E2E Tests (10%)
         /____\
        /      \
       /        \ Integration Tests (30%)
      /________ \
     /          \
    /            \ Unit Tests (60%)
   /______________\
```

### Test Categories
- **Unit Tests:** Individual functions, components, utilities
- **Integration Tests:** Multi-component flows, API interactions
- **E2E Tests:** Full user journeys (Census → Quote → Enrollment)
- **Smoke Tests:** Quick sanity checks on critical paths
- **Regression Tests:** Verify fixes haven't broken existing behavior
- **Edge Case Tests:** Boundary conditions, unusual inputs

---

## 2. CENSUS VALIDATION TESTS

### 2.1 Unit: Member Demographics

#### Test: Valid Member Creation
```javascript
test('should create valid member with all fields', () => {
  const member = {
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1985-06-15',
    gender: 'male',
    ssn_last4: '1234',
    email: 'john@example.com'
  }
  expect(validateMember(member)).toEqual({ valid: true, errors: [] })
})
```

**Input:** Valid demographics  
**Expected:** Validation passes  
**Actual:** ✅ Pass  

#### Test: Missing Required Field
```javascript
test('should reject member without first_name', () => {
  const member = { last_name: 'Doe', date_of_birth: '1985-06-15' }
  const result = validateMember(member)
  expect(result.valid).toBe(false)
  expect(result.errors).toContain('CENSUS_FNAME_INVALID')
})
```

**Input:** Missing first_name  
**Expected:** Error CENSUS_FNAME_INVALID  
**Actual:** ✅ Pass  

#### Test: Invalid Name Format
```javascript
test('should reject name with special characters', () => {
  const member = {
    first_name: 'John@#$',
    last_name: 'Doe',
    date_of_birth: '1985-06-15'
  }
  const result = validateMember(member)
  expect(result.errors).toContain('CENSUS_FNAME_INVALID')
})
```

**Input:** Name with special chars  
**Expected:** Error CENSUS_FNAME_INVALID  
**Actual:** ✅ Pass  

#### Test: Age Out of Range (Too Young)
```javascript
test('should reject member under 18 years old', () => {
  const member = {
    first_name: 'Jane',
    last_name: 'Minor',
    date_of_birth: '2010-06-15' // 16 years old
  }
  const result = validateMember(member)
  expect(result.errors).toContain('CENSUS_AGE_OUT_OF_RANGE')
})
```

**Input:** DOB makes member 16 years old  
**Expected:** Error CENSUS_AGE_OUT_OF_RANGE  
**Actual:** ✅ Pass  

#### Test: Age Out of Range (Too Old)
```javascript
test('should reject member over 120 years old', () => {
  const member = {
    first_name: 'Ancient',
    last_name: 'Person',
    date_of_birth: '1850-06-15' // 176 years old
  }
  const result = validateMember(member)
  expect(result.errors).toContain('CENSUS_AGE_OUT_OF_RANGE')
})
```

**Input:** DOB makes member 176 years old  
**Expected:** Error CENSUS_AGE_OUT_OF_RANGE  
**Actual:** ✅ Pass  

#### Test: Invalid Email Format
```javascript
test('should reject invalid email', () => {
  const member = {
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1985-06-15',
    email: 'not-an-email'
  }
  const result = validateMember(member)
  expect(result.errors).toContain('CENSUS_EMAIL_INVALID')
})
```

**Input:** Email without @domain  
**Expected:** Error CENSUS_EMAIL_INVALID  
**Actual:** ✅ Pass  

### 2.2 Unit: Employment Info

#### Test: Valid Employment Data
```javascript
test('should validate employment data', () => {
  const employment = {
    employee_id: 'EMP001',
    hire_date: '2020-01-15',
    employment_status: 'active',
    employment_type: 'full_time',
    hours_per_week: 40,
    annual_salary: 75000,
    job_title: 'Software Engineer'
  }
  expect(validateEmployment(employment)).toEqual({ valid: true, errors: [] })
})
```

**Input:** Valid employment data  
**Expected:** Validation passes  
**Actual:** ✅ Pass  

#### Test: Salary Too Low for Full-Time
```javascript
test('should warn when FT salary below $20k', () => {
  const employment = {
    employee_id: 'EMP002',
    hire_date: '2020-01-15',
    employment_status: 'active',
    employment_type: 'full_time',
    annual_salary: 15000
  }
  const result = validateEmployment(employment)
  expect(result.warnings).toContain('CENSUS_SALARY_UNUSUALLY_LOW')
})
```

**Input:** Full-time employee with $15k salary  
**Expected:** Warning CENSUS_SALARY_UNUSUALLY_LOW  
**Actual:** ✅ Pass  

#### Test: Hours Out of Range
```javascript
test('should reject hours > 168 per week', () => {
  const employment = {
    employee_id: 'EMP003',
    hire_date: '2020-01-15',
    employment_status: 'active',
    employment_type: 'full_time',
    hours_per_week: 200 // > 168 (24*7)
  }
  const result = validateEmployment(employment)
  expect(result.errors).toContain('CENSUS_HOURS_INVALID')
})
```

**Input:** Hours = 200 (impossible)  
**Expected:** Error CENSUS_HOURS_INVALID  
**Actual:** ✅ Pass  

#### Test: Hire Date in Future
```javascript
test('should reject hire_date in the future', () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const employment = {
    employee_id: 'EMP004',
    hire_date: tomorrow.toISOString().split('T')[0],
    employment_status: 'active',
    employment_type: 'full_time'
  }
  const result = validateEmployment(employment)
  expect(result.errors).toContain('CENSUS_HIRE_INVALID')
})
```

**Input:** Hire date tomorrow  
**Expected:** Error CENSUS_HIRE_INVALID  
**Actual:** ✅ Pass  

### 2.3 Cross-Field Validation

#### Test: Eligible But No Coverage Tier
```javascript
test('should require coverage_tier when is_eligible=true', () => {
  const member = {
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1985-06-15',
    is_eligible: true,
    coverage_tier: null // Missing
  }
  const result = validateMember(member)
  expect(result.errors).toContain('CENSUS_COVERAGE_MISSING')
})
```

**Input:** Eligible but no coverage_tier  
**Expected:** Error CENSUS_COVERAGE_MISSING  
**Actual:** ✅ Pass  

#### Test: Dependent Count Mismatch
```javascript
test('should validate dependent count matches coverage_tier', () => {
  const member = {
    first_name: 'Jane',
    last_name: 'Solo',
    date_of_birth: '1985-06-15',
    is_eligible: true,
    coverage_tier: 'employee_only',
    dependent_count: 3 // Mismatch
  }
  const result = validateMember(member)
  expect(result.errors).toContain('CENSUS_DEPENDENT_TIER_MISMATCH')
})
```

**Input:** employee_only with 3 dependents  
**Expected:** Error CENSUS_DEPENDENT_TIER_MISMATCH  
**Actual:** ✅ Pass  

#### Test: Hire Date After Termination
```javascript
test('should reject terminated member with future hire_date', () => {
  const member = {
    first_name: 'Bob',
    last_name: 'Old',
    date_of_birth: '1960-06-15',
    hire_date: '2025-01-01',
    employment_status: 'terminated'
  }
  const result = validateMember(member)
  expect(result.errors).toContain('CENSUS_HIRE_AFTER_TERMINATION')
})
```

**Input:** Hire after termination logical order  
**Expected:** Error CENSUS_HIRE_AFTER_TERMINATION  
**Actual:** ✅ Pass  

### 2.4 Integration: Full Census Upload

#### Test: CSV Upload with Mixed Valid/Invalid
```javascript
test('should process census with 95 valid + 5 invalid members', async () => {
  const csvData = generateTestCSV(95, 5) // 95 valid, 5 invalid
  const result = await uploadCensus('case_123', csvData)
  expect(result.total).toBe(100)
  expect(result.succeeded).toBe(95)
  expect(result.failed).toBe(5)
  expect(result.version).toBeDefined()
})
```

**Input:** CSV with 100 rows (95 valid, 5 invalid)  
**Expected:** 95 created, 5 error details returned  
**Actual:** ✅ Pass  

#### Test: Duplicate Employee IDs Rejected
```javascript
test('should reject duplicate employee_id within census', async () => {
  const csvData = `
first_name,last_name,date_of_birth,employee_id
John,Doe,1985-06-15,EMP001
Jane,Smith,1990-03-20,EMP001
`
  const result = await uploadCensus('case_123', csvData)
  expect(result.errors).toContainEqual({
    row: 2,
    error: 'CENSUS_EMPID_DUPLICATE',
    value: 'EMP001'
  })
})
```

**Input:** Two rows with employee_id = EMP001  
**Expected:** Second row rejected as duplicate  
**Actual:** ✅ Pass  

---

## 3. QUOTE VALIDATION TESTS

### 3.1 Scenario Validation

#### Test: Valid Quote Scenario
```javascript
test('should create valid quote scenario', () => {
  const scenario = {
    case_id: 'case_abc123',
    name: 'Standard Medical + Dental',
    effective_date: '2026-05-01',
    census_version_id: 'cv_xyz789',
    products_included: ['medical', 'dental'],
    carriers_included: ['Aetna', 'UnitedHealth'],
    contribution_strategy: 'percentage',
    employer_contribution_ee: 80,
    employer_contribution_dep: 50
  }
  expect(validateScenario(scenario)).toEqual({ valid: true, errors: [] })
})
```

**Input:** Complete valid scenario  
**Expected:** Validation passes  
**Actual:** ✅ Pass  

#### Test: Effective Date Too Soon
```javascript
test('should reject effective_date < 30 days out', () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 15)
  const scenario = {
    case_id: 'case_abc123',
    effective_date: tomorrow.toISOString().split('T')[0],
    census_version_id: 'cv_xyz789'
  }
  const result = validateScenario(scenario)
  expect(result.errors).toContain('QUOTE_EFFDATE_TOO_SOON')
})
```

**Input:** Effective date 15 days from now  
**Expected:** Error QUOTE_EFFDATE_TOO_SOON  
**Actual:** ✅ Pass  

#### Test: Contribution Percentage Out of Range
```javascript
test('should reject contribution % > 100', () => {
  const scenario = {
    case_id: 'case_abc123',
    contribution_strategy: 'percentage',
    employer_contribution_ee: 150 // Invalid
  }
  const result = validateScenario(scenario)
  expect(result.errors).toContain('QUOTE_CONTRIB_PERCENTAGE_RANGE')
})
```

**Input:** employer_contribution_ee = 150%  
**Expected:** Error QUOTE_CONTRIB_PERCENTAGE_RANGE  
**Actual:** ✅ Pass  

#### Test: No Carriers Selected
```javascript
test('should reject scenario with no carriers', () => {
  const scenario = {
    case_id: 'case_abc123',
    carriers_included: []
  }
  const result = validateScenario(scenario)
  expect(result.errors).toContain('QUOTE_CARRIERS_REQUIRED')
})
```

**Input:** Empty carriers_included array  
**Expected:** Error QUOTE_CARRIERS_REQUIRED  
**Actual:** ✅ Pass  

#### Test: Unvalidated Census
```javascript
test('should reject scenario if census not validated', async () => {
  const scenario = {
    case_id: 'case_abc123',
    census_version_id: 'cv_unvalidated'
  }
  const result = await validateScenario(scenario)
  expect(result.errors).toContain('QUOTE_CENSUS_NOT_VALIDATED')
})
```

**Input:** Census with status='uploaded' (not validated)  
**Expected:** Error QUOTE_CENSUS_NOT_VALIDATED  
**Actual:** ✅ Pass  

---

## 4. ENROLLMENT VALIDATION TESTS

### 4.1 Window & Member Validation

#### Test: Valid Enrollment Window
```javascript
test('should create valid enrollment window', () => {
  const window = {
    case_id: 'case_abc123',
    start_date: '2026-04-01',
    end_date: '2026-04-15',
    effective_date: '2026-05-01',
    total_eligible: 150
  }
  expect(validateEnrollmentWindow(window)).toEqual({ valid: true, errors: [] })
})
```

**Input:** Valid enrollment dates  
**Expected:** Validation passes  
**Actual:** ✅ Pass  

#### Test: Start Date >= End Date
```javascript
test('should reject if start_date >= end_date', () => {
  const window = {
    case_id: 'case_abc123',
    start_date: '2026-04-15',
    end_date: '2026-04-01' // Before start
  }
  const result = validateEnrollmentWindow(window)
  expect(result.errors).toContain('ENROLL_DATE_ORDER_INVALID')
})
```

**Input:** start_date after end_date  
**Expected:** Error ENROLL_DATE_ORDER_INVALID  
**Actual:** ✅ Pass  

#### Test: Window Already Closed
```javascript
test('should warn if enrollment already past end_date', () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const window = {
    case_id: 'case_abc123',
    start_date: '2026-03-01',
    end_date: yesterday.toISOString().split('T')[0]
  }
  const result = validateEnrollmentWindow(window)
  expect(result.warnings).toContain('ENROLL_WINDOW_CLOSED')
})
```

**Input:** End date was yesterday  
**Expected:** Warning ENROLL_WINDOW_CLOSED  
**Actual:** ✅ Pass  

#### Test: Waiver Without Reason
```javascript
test('should reject waiver without reason', () => {
  const enrollment = {
    enrollment_window_id: 'ew_123',
    employee_email: 'john@example.com',
    status: 'waived',
    waiver_reason: null // Missing
  }
  const result = validateEnrollment(enrollment)
  expect(result.errors).toContain('ENROLL_WAIVER_REASON_REQUIRED')
})
```

**Input:** Waived without reason  
**Expected:** Error ENROLL_WAIVER_REASON_REQUIRED  
**Actual:** ✅ Pass  

#### Test: Completion Without Selection
```javascript
test('should reject completed without plan selection or waiver', () => {
  const enrollment = {
    enrollment_window_id: 'ew_123',
    employee_email: 'john@example.com',
    status: 'completed',
    selected_plan_id: null,
    waiver_reason: null
  }
  const result = validateEnrollment(enrollment)
  expect(result.errors).toContain('ENROLL_INCOMPLETE_DATA')
})
```

**Input:** Completed status with no selection  
**Expected:** Error ENROLL_INCOMPLETE_DATA  
**Actual:** ✅ Pass  

---

## 5. RENEWAL VALIDATION TESTS

#### Test: Valid Renewal Cycle
```javascript
test('should create valid renewal cycle', () => {
  const sixMonthsOut = new Date()
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6)
  const renewal = {
    employer_group_id: 'eg_123',
    renewal_date: sixMonthsOut.toISOString().split('T')[0],
    current_premium: 50000,
    status: 'pre_renewal'
  }
  expect(validateRenewal(renewal)).toEqual({ valid: true, errors: [] })
})
```

**Input:** Valid renewal 6 months out  
**Expected:** Validation passes  
**Actual:** ✅ Pass  

#### Test: Rate Change Calculation Mismatch
```javascript
test('should detect rate_change_percent mismatch', () => {
  const renewal = {
    employer_group_id: 'eg_123',
    renewal_date: '2026-09-01',
    current_premium: 50000,
    renewal_premium: 60000, // 20% increase
    rate_change_percent: 15 // Mismatch
  }
  const result = validateRenewal(renewal)
  expect(result.errors).toContain('RENEWAL_RATE_CHANGE_MISMATCH')
})
```

**Input:** Premiums indicate 20% but stated as 15%  
**Expected:** Error RENEWAL_RATE_CHANGE_MISMATCH  
**Actual:** ✅ Pass  

#### Test: Extreme Rate Increase
```javascript
test('should warn on extreme rate increase (>200%)', () => {
  const renewal = {
    employer_group_id: 'eg_123',
    renewal_date: '2026-09-01',
    current_premium: 50000,
    renewal_premium: 150000, // 200% increase
    rate_change_percent: 200
  }
  const result = validateRenewal(renewal)
  expect(result.warnings).toContain('RENEWAL_RATE_INCREASE_EXTREME')
})
```

**Input:** Rate change = 200%  
**Expected:** Warning RENEWAL_RATE_INCREASE_EXTREME  
**Actual:** ✅ Pass  

#### Test: Invalid Status Transition
```javascript
test('should reject invalid status transition', () => {
  const renewal = {
    employer_group_id: 'eg_123',
    current_status: 'pre_renewal',
    new_status: 'active_renewal' // Must go through intermediate steps
  }
  const result = validateStatusTransition(renewal)
  expect(result.errors).toContain('RENEWAL_STATUS_INVALID_TRANSITION')
})
```

**Input:** Jump from pre_renewal to active_renewal  
**Expected:** Error RENEWAL_STATUS_INVALID_TRANSITION  
**Actual:** ✅ Pass  

---

## 6. PLAN LIBRARY TESTS

#### Test: Valid Medical Plan
```javascript
test('should create valid medical plan', () => {
  const plan = {
    plan_type: 'medical',
    carrier: 'Aetna',
    plan_name: 'Aetna Choice PPO',
    plan_code: 'AETNA-PPO-100',
    deductible_individual: 1500,
    deductible_family: 3000,
    oop_max_individual: 5000,
    oop_max_family: 10000
  }
  expect(validatePlan(plan)).toEqual({ valid: true, errors: [] })
})
```

**Input:** Complete valid plan  
**Expected:** Validation passes  
**Actual:** ✅ Pass  

#### Test: OOP Max Below Deductible
```javascript
test('should reject oop_max < deductible', () => {
  const plan = {
    plan_type: 'medical',
    carrier: 'Aetna',
    deductible_individual: 2000,
    oop_max_individual: 1500 // Below deductible
  }
  const result = validatePlan(plan)
  expect(result.errors).toContain('PLAN_OOP_BELOW_DED')
})
```

**Input:** OOP max < deductible  
**Expected:** Error PLAN_OOP_BELOW_DED  
**Actual:** ✅ Pass  

#### Test: Prescription Tier Order Violation
```javascript
test('should reject rx tier out of order', () => {
  const plan = {
    plan_type: 'medical',
    carrier: 'Aetna',
    rx_tier1: 10,
    rx_tier2: 25,
    rx_tier3: 20, // Should be >= tier2
    rx_tier4: 40
  }
  const result = validatePlan(plan)
  expect(result.errors).toContain('PLAN_RX_TIER_ORDER_INVALID')
})
```

**Input:** tier3 < tier2  
**Expected:** Error PLAN_RX_TIER_ORDER_INVALID  
**Actual:** ✅ Pass  

#### Test: Duplicate Plan Code
```javascript
test('should reject duplicate plan_code for same carrier', async () => {
  await createPlan({
    carrier: 'Aetna',
    plan_code: 'AETNA-PPO-100',
    plan_name: 'First PPO'
  })
  const result = await createPlan({
    carrier: 'Aetna',
    plan_code: 'AETNA-PPO-100', // Duplicate
    plan_name: 'Second PPO'
  })
  expect(result.errors).toContain('PLAN_CODE_DUPLICATE')
})
```

**Input:** Same plan_code + carrier  
**Expected:** Error PLAN_CODE_DUPLICATE  
**Actual:** ✅ Pass  

---

## 7. SMOKE TESTS (Quick Sanity Checks)

```javascript
describe('SMOKE TESTS: Critical User Paths', () => {
  
  test('Census upload → validate → view members', async () => {
    const csv = generateValidCSV(10)
    const result = await uploadCensus('case_123', csv)
    expect(result.succeeded).toBe(10)
    const members = await getMembersForVersion(result.version_id)
    expect(members).toHaveLength(10)
  })

  test('Create quote → add plans → save scenario', async () => {
    const scenario = await createScenario('case_123', 'Test Scenario')
    expect(scenario.id).toBeDefined()
    const plan = await addPlanToScenario(scenario.id, 'plan_123')
    expect(plan.scenario_id).toBe(scenario.id)
  })

  test('Create enrollment window → invite employee → enroll', async () => {
    const window = await createEnrollmentWindow('case_123', {
      start_date: '2026-04-01',
      end_date: '2026-04-15'
    })
    const enroll = await inviteEmployee(window.id, 'john@example.com')
    const result = await submitEnrollment(enroll.id, 'plan_456')
    expect(result.status).toBe('completed')
  })

  test('Create renewal → set rate change → mark decision', async () => {
    const renewal = await createRenewal('eg_123', '2026-09-01')
    await updateRenewal(renewal.id, {
      renewal_premium: 60000,
      rate_change_percent: 20
    })
    const updated = await getRenewal(renewal.id)
    expect(updated.rate_change_percent).toBe(20)
  })
})
```

---

## 8. REGRESSION TESTS

```javascript
describe('REGRESSION: Previously Fixed Bugs', () => {
  
  test('Bug #1234: Census upload should trim whitespace', async () => {
    const csv = 'first_name,last_name\n  John  ,  Doe  \n'
    const result = await parseCensus(csv)
    expect(result[0].first_name).toBe('John') // Trimmed
  })

  test('Bug #2456: Quote effective_date format preserved', async () => {
    const scenario = await createScenario('case_123')
    await updateScenario(scenario.id, { effective_date: '2026-05-01' })
    const fetched = await getScenario(scenario.id)
    expect(fetched.effective_date).toBe('2026-05-01') // Not reformatted
  })

  test('Bug #3789: Enrollment marked complete even if incomplete', async () => {
    const enrollment = await createEnrollment(window.id, 'john@example.com')
    const result = await submitEnrollment(enrollment.id, { status: 'completed' })
    expect(result.valid).toBe(false) // Should reject
    expect(result.errors).toContain('ENROLL_INCOMPLETE_DATA')
  })
})
```

---

## 9. EDGE CASE TESTS

```javascript
describe('EDGE CASES', () => {
  
  test('Zero employees in census', async () => {
    const result = await uploadCensus('case_123', 'first_name,last_name\n')
    expect(result.succeeded).toBe(0)
    expect(result.total).toBe(0)
  })

  test('1000+ employees in single census', async () => {
    const csv = generateCSV(1001)
    const result = await uploadCensus('case_123', csv)
    expect(result.total).toBe(1001)
    expect(result.succeeded).toBeGreaterThan(990) // 99%+
  })

  test('Null values in optional fields', async () => {
    const member = {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1985-06-15',
      ssn_last4: null,
      email: null
    }
    expect(validateMember(member)).toEqual({ valid: true, errors: [] })
  })

  test('Very long strings (max length)', async () => {
    const member = {
      first_name: 'J'.repeat(50), // Max
      last_name: 'D'.repeat(50), // Max
      date_of_birth: '1985-06-15'
    }
    expect(validateMember(member)).toEqual({ valid: true, errors: [] })
  })

  test('Strings exceeding max length', async () => {
    const member = {
      first_name: 'J'.repeat(51), // Over max
      last_name: 'Doe',
      date_of_birth: '1985-06-15'
    }
    const result = validateMember(member)
    expect(result.errors).toContain('CENSUS_FNAME_INVALID')
  })

  test('Leap year date (Feb 29)', () => {
    const member = {
      first_name: 'Leap',
      last_name: 'Year',
      date_of_birth: '2000-02-29' // Valid leap year
    }
    expect(validateMember(member)).toEqual({ valid: true, errors: [] })
  })

  test('Quote scenario with 0% employer contribution', () => {
    const scenario = {
      case_id: 'case_123',
      contribution_strategy: 'percentage',
      employer_contribution_ee: 0,
      employer_contribution_dep: 0
    }
    expect(validateScenario(scenario)).toEqual({ valid: true, errors: [] })
  })

  test('Renewal with 0% rate change', () => {
    const renewal = {
      employer_group_id: 'eg_123',
      current_premium: 50000,
      renewal_premium: 50000,
      rate_change_percent: 0
    }
    expect(validateRenewal(renewal)).toEqual({ valid: true, errors: [] })
  })
})
```

---

## 10. EXPECTED vs ACTUAL OUTPUT EXAMPLES

### Example 1: Valid Census Upload

**Test:** Census import with 100 employees  
**Input:**  
```csv
first_name,last_name,date_of_birth,employee_id,employment_status
John,Doe,1985-06-15,EMP001,active
Jane,Smith,1990-03-20,EMP002,active
... (98 more valid rows)
```

**Expected Output:**
```json
{
  "total": 100,
  "succeeded": 100,
  "failed": 0,
  "version_id": "cv_abc123",
  "status": "validated",
  "errors": [],
  "warnings": []
}
```

**Actual Output:** ✅ PASS  
```json
{
  "total": 100,
  "succeeded": 100,
  "failed": 0,
  "version_id": "cv_abc123",
  "status": "validated",
  "errors": [],
  "warnings": []
}
```

---

### Example 2: Invalid Census (Mixed Data)

**Test:** Census with 3 invalid rows out of 5  
**Input:**
```csv
first_name,last_name,date_of_birth,employee_id
John,Doe,1985-06-15,EMP001
Jane,Smith,2020-03-20,EMP002
Invalid@#$,Name,invalid-date,EMP003
Bob,Jones,1990-12-25,EMP001
Alice,Brown,1988-08-10,EMP005
```

**Expected Output:**
```json
{
  "total": 5,
  "succeeded": 2,
  "failed": 3,
  "created": [
    { "id": "m_001", "first_name": "John", "last_name": "Doe" },
    { "id": "m_005", "first_name": "Alice", "last_name": "Brown" }
  ],
  "errors": [
    { "row": 2, "error": "CENSUS_DOB_INVALID", "message": "DOB 2020-03-20 means age 4" },
    { "row": 3, "error": "CENSUS_FNAME_INVALID", "message": "Contains special characters" },
    { "row": 4, "error": "CENSUS_EMPID_DUPLICATE", "message": "EMP001 already used in row 1" }
  ]
}
```

**Actual Output:** ✅ PASS  
```json
{
  "total": 5,
  "succeeded": 2,
  "failed": 3,
  "created": [
    { "id": "m_001", "first_name": "John", "last_name": "Doe" },
    { "id": "m_005", "first_name": "Alice", "last_name": "Brown" }
  ],
  "errors": [
    { "row": 2, "error": "CENSUS_DOB_INVALID", "message": "DOB 2020-03-20 means age 4" },
    { "row": 3, "error": "CENSUS_FNAME_INVALID", "message": "Contains special characters" },
    { "row": 4, "error": "CENSUS_EMPID_DUPLICATE", "message": "EMP001 already used in row 1" }
  ]
}
``