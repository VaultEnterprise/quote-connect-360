# P0 Repair Registry

## Purpose
This registry is the authoritative control ledger for P0 repair sequencing, status, dependencies, blockers, validation requirements, and certification state.

## Status Legend
- NOT_STARTED
- PREFLIGHT_BLOCKED
- PREFLIGHT_READY
- IMPLEMENTATION_AUTHORIZED
- IMPLEMENTED_PENDING_VALIDATION
- STATICALLY_COMPLIANT_EXECUTION_PENDING
- CERTIFIED_PASS
- DEFERRED_LOCKED
- BLOCKED_OPERATOR_INPUT_REQUIRED

## Known P0 Repair Items

| Repair ID | Title | Current Status | Last Known Evidence | Runtime Evidence Required | Dependencies | Blockers | Next Authorized Action |
|---|---|---|---|---|---|---|---|
| P0 Repair 2/4 | Carrier Analyze Workflow Harness | DEFERRED_LOCKED / STATICALLY_COMPLIANT_EXECUTION_PENDING | Root-cause audit completed; CommonJS require removed; static ESM mocks/imports added; async dynamic imports removed; static scans clean; production code unchanged; Gates 6I-B, 6J-B, 6J-C untouched | ls, ESLint, and Vitest execution results using locked command sequence | Missing runtime test dependency installation and command execution evidence | No terminal execution evidence available | Execution validation only when operator resumes this item |

## Confirmed Entry Details

### P0 Repair 2/4: Carrier Analyze Workflow Harness

**Current Status:**
```
DEFERRED_LOCKED / STATICALLY_COMPLIANT_EXECUTION_PENDING
```

**Last Known Evidence:**
- Root-cause audit completed
- CommonJS `require()` patterns removed from test harness
- Static ESM imports implemented for all Vitest and testing library utilities
- Async dynamic imports removed; all imports are now static
- Production code remains unchanged
- Routes, schemas, feature flags, backend functions untouched
- Gates 6I-B, 6J-B, 6J-C remain untouched

**Runtime Evidence Required:**
1. `ls tests/p0-repair-2-4-carrier-analyze-workflow-harness.test.jsx`
2. `npx eslint tests/p0-repair-2-4-carrier-analyze-workflow-harness.test.jsx`
3. `npx vitest run tests/p0-repair-2-4-carrier-analyze-workflow-harness.test.jsx --environment jsdom`

**Dependencies:**
- Missing: Runtime test dependency installation
- Missing: ESLint command execution evidence
- Missing: Vitest command execution evidence

**Blockers:**
- No terminal execution capability available in current session
- Cannot generate runtime evidence without operator-provided command outputs

**Next Authorized Action:**
- Execution validation only when operator resumes this item
- Provide exact ESLint and Vitest outputs in required format
- Only then: Runtime Execution Certification and status update to CERTIFIED_PASS

**Deferral Terms:**
- No code modifications authorized under this repair item
- No production code, routes, schemas, feature flags, or backend functions touched
- No certification granted until runtime evidence supplied
- No broader claim of PASS may be made until evidence is provided

---

## Unknown / Unconfirmed Repair Items

**P0 Repair 2/1, 2/2, 2/3, 2/5, and later items:**

No authoritative evidence is currently available identifying these repair items. They must not be:
- Created or sequenced without operator-provided source evidence
- Implemented without explicit authorization
- Certified without exact validation evidence
- Used as dependencies for other work without confirmation

---

## Operator Input Required

To proceed to the next P0 repair item, the following information is required:

1. **Existing P0 repair ledger path** (if one already exists in docs or elsewhere)
2. **The next authorized P0 repair ID** (e.g., P0 Repair 2/5, or alternative)
3. **Repair title** (descriptive name)
4. **Current defect/gap** (what is broken or missing)
5. **Affected files/workflow** (pages, components, functions, entities involved)
6. **Current status** (NOT_STARTED, PREFLIGHT_BLOCKED, etc.)
7. **Authorization level** (preflight-only vs. implementation-authorized)

---

## Guardrails

- ✓ Do not infer or guess the next P0 repair item
- ✓ Do not proceed to unrelated gates (6I-B, 6J-B, 6J-C, 7A, etc.)
- ✓ Do not modify production code without explicit authorization
- ✓ Do not modify tests except for registry/report documentation
- ✓ Do not mark any P0 repair as PASS without exact validation evidence
- ✓ Do not create fictional repair history
- ✓ Do not continue implementation until operator provides next authorized repair item

---

## First-Class Broker Agency Model Planning Status

**Separate Artifact Status (Non-P0 Work Order):**
- Status: PHASED_EXECUTION_PLAN_COMPLETE / IMPLEMENTATION_NOT_STARTED
- Document: `docs/FIRST_CLASS_BROKER_AGENCY_MODEL_PHASED_EXECUTION_PLAN.md`
- Gap-to-Implementation: `docs/FIRST_CLASS_BROKER_AGENCY_MODEL_GAP_TO_IMPLEMENTATION_WORK_ORDER.md`
- Phase 1 (Data Model) identified as mandatory starting point
- No P0 repair item assigned to this work; this is separate engineering initiative

## Last Updated
2026-05-14 — Registry created; P0 Repair 2/4 locked and documented; First-Class Broker Agency Model phased plan complete; awaiting operator identification of next P0 repair item