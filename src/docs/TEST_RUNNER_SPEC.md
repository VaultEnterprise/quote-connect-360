# Automated Test Runner Specification

**Version:** 1.0  
**Last Updated:** 2026-03-21  
**Framework:** Jest + React Testing Library  
**CI/CD:** GitHub Actions / Base44 Platform

---

## 1. TEST INFRASTRUCTURE SETUP

### 1.1 Directory Structure
```
project/
├── tests/
│   ├── unit/
│   │   ├── census.test.js
│   │   ├── quotes.test.js
│   │   ├── enrollment.test.js
│   │   ├── renewals.test.js
│   │   ├── plans.test.js
│   │   └── utils.test.js
│   ├── integration/
│   │   ├── census-flow.test.js
│   │   ├── quote-flow.test.js
│   │   ├── enrollment-flow.test.js
│   │   ├── renewal-flow.test.js
│   │   └── gradient-ai.test.js
│   ├── e2e/
│   │   ├── user-journey-1.test.js (Census → Quote → Proposal)
│   │   ├── user-journey-2.test.js (Enrollment → Benefits)
│   │   ├── user-journey-3.test.js (Renewal → Rate Change)
│   │   └── smoke-tests.test.js
│   ├── fixtures/
│   │   ├── census-data.json
│   │   ├── scenario-data.json
│   │   ├── plan-library.json
│   │   └── mock-api.js
│   └── jest.config.js
├── src/
└── package.json
```

### 1.2 Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/main.jsx',
    '!src/index.jsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js'
  ]
}
```

### 1.3 Test Setup & Teardown
```javascript
// tests/setup.js
import '@testing-library/jest-dom'

// Mock Base44 SDK
jest.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      CensusMember: {
        create: jest.fn(),
        filter: jest.fn(),
        list: jest.fn(),
        update: jest.fn()
      },
      BenefitCase: {
        list: jest.fn(),
        filter: jest.fn()
      },
      // ... other entities
    },
    functions: {
      invoke: jest.fn()
    }
  }
}))

// Global test timeout
jest.setTimeout(10000)

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
```

---

## 2. UNIT TEST RUNNER

### 2.1 Command
```bash
npm test -- tests/unit --coverage
```

### 2.2 Sample Unit Test
```javascript
// tests/unit/census.test.js
import { validateMember } from '@/utils/validation'

describe('Census Validation - Member Demographics', () => {
  
  test('should validate complete member record', () => {
    const member = {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1985-06-15',
      gender: 'male'
    }
    
    const result = validateMember(member)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject missing required fields', () => {
    const member = {
      first_name: 'John'
      // missing last_name, date_of_birth
    }
    
    const result = validateMember(member)
    
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('CENSUS_LNAME_INVALID')
  })

  // ... more tests
})
```

### 2.3 Output
```
PASS tests/unit/census.test.js (1.2s)
  Census Validation - Member Demographics
    ✓ should validate complete member record (5ms)
    ✓ should reject missing required fields (3ms)
    ✓ should reject invalid email (2ms)
    ✓ should reject age < 18 (2ms)
    ✓ should warn on salary < $20k (2ms)

Test Suites: 5 passed, 5 total
Tests:       45 passed, 45 total
Snapshots:   0 total
Time:        2.3s
Coverage:    Lines 87%, Branches 85%, Functions 89%
```

---

## 3. INTEGRATION TEST RUNNER

### 3.1 Command
```bash
npm test -- tests/integration --coverage --forceExit
```

### 3.2 Sample Integration Test
```javascript
// tests/integration/census-flow.test.js
import { base44 } from '@/api/base44Client'
import { uploadCensus, getCensusVersion } from '@/lib/census-helpers'

jest.mock('@/api/base44Client')

describe('Integration: Census Upload Flow', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should upload, validate, and process census in sequence', async () => {
    // Setup mocks
    const mockVersionId = 'cv_test123'
    base44.entities.CensusVersion.create.mockResolvedValue({
      id: mockVersionId,
      status: 'uploaded'
    })
    
    base44.entities.CensusMember.bulkCreate.mockResolvedValue({
      created: 100
    })

    // Execute
    const csvData = generateTestCSV(100)
    const result = await uploadCensus('case_123', csvData)

    // Verify
    expect(result.total).toBe(100)
    expect(result.succeeded).toBe(100)
    expect(base44.entities.CensusVersion.create).toHaveBeenCalled()
    expect(base44.entities.CensusMember.bulkCreate).toHaveBeenCalled()
  })

  test('should create high-risk exceptions after analysis', async () => {
    base44.functions.invoke.mockResolvedValue({
      data: {
        risk_summary: {
          high_risk_count: 5
        }
      }
    })

    const result = await invokeProcessGradientAI('cv_test123')

    expect(result.data.risk_summary.high_risk_count).toBe(5)
  })
})
```

### 3.3 Output
```
PASS tests/integration/census-flow.test.js (2.1s)
  Integration: Census Upload Flow
    ✓ should upload, validate, and process census in sequence (45ms)
    ✓ should handle CSV parsing errors (32ms)
    ✓ should create high-risk exceptions after analysis (28ms)

PASS tests/integration/quote-flow.test.js (1.8s)
PASS tests/integration/enrollment-flow.test.js (2.3s)

Test Suites: 5 passed, 5 total
Tests:       28 passed, 28 total
Time:        4.2s
Coverage:    Lines 82%, Branches 78%, Functions 81%
```

---

## 4. E2E TEST RUNNER

### 4.1 Command
```bash
npm run test:e2e -- --headless --coverage
```

### 4.2 Playwright Config
```javascript
// playwright.config.js
export default {
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
}
```

### 4.3 Sample E2E Test
```javascript
// tests/e2e/user-journey-1.test.js
import { test, expect } from '@playwright/test'

test.describe('E2E: Census → Quote → Proposal', () => {
  
  test('should complete full case workflow', async ({ page }) => {
    // 1. Login
    await page.goto('/')
    await page.fill('input[type="email"]', 'user@example.com')
    await page.fill('input[type="password"]', 'password')
    await page.click('button:has-text("Login")')
    await page.waitForURL('/dashboard')

    // 2. Create case
    await page.click('button:has-text("New Case")')
    await page.fill('input[placeholder="Case Name"]', 'Test Case')
    await page.selectOption('select[name="case_type"]', 'new_business')
    await page.click('button:has-text("Create")')
    const caseId = page.url().split('/').pop()

    // 3. Upload census
    await page.click('text=Census')
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/census-100.csv')
    await page.click('button:has-text("Upload")')
    await page.waitForSelector('text=Census validated')
    expect(await page.textContent('text=100 members')).toBeTruthy()

    // 4. Run GradientAI analysis
    await page.click('button:has-text("Run Analysis")')
    await page.waitForSelector('text=Risk analysis complete')
    expect(await page.textContent('text=Preferred')).toBeTruthy()

    // 5. Create quote scenario
    await page.click('text=Quotes')
    await page.click('button:has-text("New Scenario")')
    await page.fill('input[placeholder="Scenario Name"]', 'Standard Medical')
    await page.selectOption('select[name="products"]', ['medical', 'dental'])
    await page.click('button:has-text("Create Scenario")')

    // 6. Create proposal
    await page.click('text=Proposals')
    await page.click('button:has-text("Generate Proposal")')
    await page.fill('textarea[name="cover_message"]', 'Here is our proposal...')
    await page.click('button:has-text("Send to Employer")')
    await page.waitForSelector('text=Proposal sent')
    expect(await page.textContent('text=Awaiting approval')).toBeTruthy()
  })
})
```

### 4.4 Output
```
Running E2E Tests (Chrome)...

✓ E2E: Census → Quote → Proposal
  ✓ should complete full case workflow (18.5s)

✓ E2E: Employee Enrollment Flow
  ✓ should enroll employee in benefits plan (12.3s)

✓ E2E: Renewal Rate Forecast
  ✓ should forecast renewal rates and create exceptions (15.2s)

3 passed (45.9s)

Report: tests/e2e/results/index.html
Videos: tests/e2e/videos/
```

---

## 5. SMOKE TEST RUNNER

### 5.1 Command
```bash
npm test -- tests/unit/smoke-tests.test.js --testNamePattern="SMOKE"
```

### 5.2 Sample Smoke Tests
```javascript
// tests/unit/smoke-tests.test.js
describe('SMOKE TESTS: Quick Critical Path Checks', () => {
  
  test('SMOKE: Census upload creates members', async () => {
    // Minimal test - just verify basic functionality works
    const result = await uploadCensus('case_123', minimalCSV(5))
    expect(result.succeeded).toBe(5)
  })

  test('SMOKE: Quote scenario creates successfully', async () => {
    const scenario = await createScenario('case_123')
    expect(scenario.id).toBeDefined()
  })

  test('SMOKE: Enrollment window opens', async () => {
    const window = await createEnrollmentWindow('case_123')
    expect(window.status).toBe('scheduled')
  })

  test('SMOKE: Renewal cycle creates', async () => {
    const renewal = await createRenewal('eg_123', '2026-09-01')
    expect(renewal.id).toBeDefined()
  })
})
```

### 5.3 Output
```
PASS tests/unit/smoke-tests.test.js (2.1s)
  SMOKE TESTS: Quick Critical Path Checks
    ✓ SMOKE: Census upload creates members (45ms)
    ✓ SMOKE: Quote scenario creates successfully (32ms)
    ✓ SMOKE: Enrollment window opens (28ms)
    ✓ SMOKE: Renewal cycle creates (35ms)

4 passed in 2.1s
```

---

## 6. REGRESSION TEST RUNNER

### 6.1 Command
```bash
npm test -- tests/unit/regression.test.js --testNamePattern="REGRESSION"
```

### 6.2 Output
```
PASS tests/unit/regression.test.js (3.2s)
  REGRESSION: Bug #1234 Fixes
    ✓ REGRESSION: Census whitespace trimming (8ms)
    ✓ REGRESSION: Quote date format preservation (6ms)
  
  REGRESSION: Bug #2456 Fixes
    ✓ REGRESSION: Enrollment completion validation (12ms)

3 passed in 3.2s
```

---

## 7. COVERAGE REPORT GENERATION

### 7.1 Command
```bash
npm test -- --coverage --collectCoverageFrom='src/**/*.{js,jsx}'
```

### 7.2 Output
```
-------|----------|----------|----------|----------|
File   | Statements | Branches | Functions | Lines |
-------|----------|----------|----------|----------|
All    | 85.2%    | 82.1%    | 86.5%     | 84.9% |
-------|----------|----------|----------|----------|

census.js           | 92.1% | 90.3% | 93.2% | 92.0%
quotes.js           | 88.4% | 85.2% | 89.1% | 88.2%
enrollment.js       | 83.2% | 80.1% | 84.5% | 82.9%
renewals.js         | 79.5% | 76.2% | 81.0% | 79.1%
plans.js            | 81.3% | 78.5% | 82.4% | 80.9%

Generated in: tests/coverage/index.html
```

---

## 8. CI/CD INTEGRATION

### 8.1 GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm test -- tests/unit --coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm test -- tests/integration --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/e2e/results/
```

### 8.2 Base44 Platform Integration
```javascript
// base44.test.js - Runs on deployment
import { listAutomations } from '@/base44'

test('Deployment: Verify test runner is active', async () => {
  const automations = await listAutomations({ type: 'scheduled' })
  const testRunner = automations.find(a => a.name === 'DailyTestRunner')
  expect(testRunner).toBeDefined()
  expect(testRunner.status).toBe('active')
})
```

---

## 9. TEST REPORTING

### 9.1 Report Types
| Report | Generated | Location | Access |
|--------|-----------|----------|--------|
| **Coverage** | After unit tests | `tests/coverage/index.html` | Web browser |
| **HTML Report** | After all tests | `tests/results/index.html` | Web browser |
| **JUnit XML** | For CI/CD | `tests/results/junit.xml` | CI dashboards |
| **Playwright** | After E2E | `tests/e2e/results/index.html` | Web browser |

### 9.2 Sample Report Summary
```
Test Run: 2026-03-21 14:32:00 UTC

SUMMARY
├── Unit Tests:        45 passed, 0 failed   ✅
├── Integration Tests: 28 passed, 1 flaky    ⚠️
├── E2E Tests:         12 passed, 0 failed   ✅
├── Smoke Tests:        4 passed, 0 failed   ✅
└── Total:             89 passed, 1 flaky, 0 failed

COVERAGE
├── Lines:            84.9% (goal: 80%)     ✅
├── Branches:         82.1% (goal: 75%)     ✅
├── Functions:        86.5% (goal: 80%)     ✅
└── Statements:       85.2% (goal: 80%)     ✅

SLOWEST TESTS
1. E2E: Census → Quote → Proposal     18.5s
2. E2E: Enrollment Flow               12.3s
3. Census Upload (1000+ members)      5.2s

⚠️  FLAKY TEST DETECTED
   - tests/integration/gradient-ai.test.js (passes 4/5 times)
   - Action: Investigate API timing issues

Generated: tests/results/index.html
```

---

## 10. TEST MAINTENANCE

### 10.1 Test Update Checklist
When code changes:
- [ ] Run unit tests locally
- [ ] Run integration tests
- [ ] Update mocks if API contracts change
- [ ] Add new test cases for new features
- [ ] Update regression tests if fixing bugs
- [ ] Verify coverage doesn't decrease
- [ ] Run full suite before push

### 10.2 Failing Test Response
```
IF test fails:
  1. Check recent code changes
  2. Verify mock data is current
  3. Check for timing/async issues
  4. Run test 3x to detect flakiness
  5. Add debug logging if needed
  6. Update test or fix code
  7. Re-run full suite
  8. Document fix in commit message
```

### 10.3 Performance Benchmarks
| Test Type | Target Time | Max Time | Alert |
|-----------|------------|----------|-------|
| Unit (single) | 10ms | 100ms | >100ms |
| Integration (single) | 50ms | 500ms | >500ms |
| E2E (single) | 5s | 30s | >30s |
| Full Unit Suite | - | 5s | >10s |
| Full Integration Suite | - | 10s | >20s |