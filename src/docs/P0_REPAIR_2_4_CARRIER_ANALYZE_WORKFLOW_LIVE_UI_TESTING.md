# P0 Repair 2/4 — Carrier Analyze Workflow Live UI Testing

**Status**: LIVE UI TESTING PHASE  
**Date Created**: 2026-05-13  
**Timezone**: America/Los_Angeles  

---

## Executive Testing Summary

| Field | Value |
|-------|-------|
| **P0 Repair** | 2/4 |
| **Feature Area** | Carrier Census Analyze Workflow |
| **Testing Phase** | LIVE UI VALIDATION |
| **Scope** | AST / SUS / Triad / MEC-MVP carrier cards |
| **Backend Activation** | Existing census analysis functions only |
| **External Carrier Submission** | NOT AUTHORIZED |
| **Dalton Rules Execution** | NOT AUTHORIZED |
| **Document Persistence** | NOT AUTHORIZED |
| **Test Environment** | Live preview / staging |

---

## Pre-Test Requirements

Before starting live UI testing, confirm all prerequisites:

- [ ] Case Census tab opens successfully
- [ ] Carrier Census Submission Checklist is visible
- [ ] AST checkbox is visible and toggleable
- [ ] SUS checkbox is visible and toggleable
- [ ] Triad checkbox is visible and toggleable
- [ ] MEC / MVP checkbox is visible and toggleable
- [ ] Existing CensusUploadModal remains visible (non-carrier workflow untouched)
- [ ] No Gate 6I-B work started (scheduler)
- [ ] No Gate 6J-B work started (email delivery)
- [ ] No Gate 6J-C work started (webhook delivery)

---

## Test Files Available for Live Testing

Use available census files for live testing:

- [ ] SUS template CSV (if available)
- [ ] VAULT census CSV (if available)
- [ ] Generic CSV census (generic.csv)
- [ ] XLSX census file (if available)
- [ ] XLS census file (if available)

### Known Parser Limitations

**XLSX Binary Parsing Issue** (P0 Repair 5 — OUT OF SCOPE):
- If XLSX file displays `PK` or `[Content_Types].xml` in the mapper, record it as a **known P0 parser defect**.
- Do not treat parser artifacts as carrier-card UI failures.
- This is a separate repair (P0 Repair 5) — not part of 2/4.

---

## Carrier Card Live Test Matrix

Record PASS / FAIL for each carrier:

| Carrier | Checkbox | Card Appears | File Selected | Analyze Enabled | Analyze Click | Loading State | Response Received | Map Tab Opens | Real Headers | Mock Hidden | Error Handling | State Isolated | Result | Notes |
|---------|----------|--------------|---------------|-----------------|---------------|---------------|-------------------|---------------|--------------|-------------|----------------|----------------|--------|-------|
| **AST** | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PASS/FAIL | |
| **SUS** | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PASS/FAIL | |
| **Triad** | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PASS/FAIL | |
| **MEC / MVP** | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | PASS/FAIL | |

---

## AST Census Import — Live Test Steps

### Carrier Card Activation

1. [ ] Open Case Census tab
2. [ ] Locate "Carrier Census Submission Checklist"
3. [ ] Check "Send to AST" checkbox
4. [ ] Confirm **AST Census Import** card appears below checklist
5. [ ] Confirm card has header "AST Census Import" with purple badge

### File Selection

6. [ ] In AST card, upload/select a census file (CSV recommended)
7. [ ] Confirm file appears in the card (file name shown)
8. [ ] Confirm file size displayed
9. [ ] Confirm Replace button is available

### Analyze Button Behavior

10. [ ] Confirm **Analyze Census** button is visible and **ENABLED**
11. [ ] Click "Analyze Census"
12. [ ] Confirm button text changes to "Analyzing census..." with spinner
13. [ ] Confirm button becomes **DISABLED** during analysis
14. [ ] Wait for analysis to complete

### Analysis Result

15. [ ] Confirm loading state disappears
16. [ ] Confirm button returns to "Analyze Census" (enabled)
17. [ ] **Confirm active tab automatically switches to "Map Columns"**
18. [ ] Confirm "Map Columns" tab content displays

### Header Validation

19. [ ] Confirm **real detected headers appear** in the mapping UI (e.g., "First Name", "Last Name", "DOB", etc.)
20. [ ] Confirm headers are **NOT hardcoded mock columns** (no placeholder "Relationship (EMP/SPS/DEP)" unless detected from file)
21. [ ] Confirm each header has a dropdown for system field mapping
22. [ ] Confirm required fields indicator shows progress

### State Isolation

23. [ ] Do **NOT** select SUS, Triad, or MEC-MVP yet
24. [ ] Confirm AST card state is **independent** (analyzing SUS later will not affect AST headers)

### Evidence

- [ ] Screenshot of AST card with real headers displayed
- [ ] Note detected header count
- [ ] Record any errors encountered

---

## SUS Census Import — Live Test Steps

### Carrier Card Activation

1. [ ] In Carrier Census Submission Checklist, check "Send to SUS" checkbox
2. [ ] Confirm **SUS Census Import** card appears below AST card
3. [ ] Confirm card has header "SUS Census Import" with blue badge
4. [ ] Confirm SUS-specific Required Forms section is visible

### SUS Required Forms

5. [ ] Confirm checkbox for "SARA Form" is visible
6. [ ] Confirm checkbox for "Employee Questionnaire" is visible
7. [ ] Confirm checkbox for "SARA Checklist" is visible
8. [ ] (Do not check these yet — will validate in separate phase)

### File Selection

9. [ ] Upload/select a **different census file** than AST (CSV or SUS template)
10. [ ] Confirm file name appears in SUS card
11. [ ] Confirm file is **different** from AST file (verify file name is distinct)

### Analyze Button Behavior

12. [ ] Confirm **Analyze Census** button is visible and **ENABLED**
13. [ ] Click "Analyze Census"
14. [ ] Confirm button shows "Analyzing census..." with spinner
15. [ ] Confirm button is **DISABLED** during analysis
16. [ ] Wait for analysis to complete

### Analysis Result

17. [ ] Confirm loading state disappears
18. [ ] Confirm active tab switches to "Map Columns"
19. [ ] Confirm "Map Columns" tab displays

### Header Validation

20. [ ] Confirm **real headers from SUS file appear** (should be different from AST headers if file was different)
21. [ ] Confirm headers are **NOT mock columns**
22. [ ] Confirm mapping dropdowns are available

### State Isolation from Other Carriers

23. [ ] **Return to AST card** (click AST tab or header)
24. [ ] Confirm AST's "Map Columns" tab **still shows AST-specific headers** (not affected by SUS analysis)
25. [ ] Confirm AST state remains on "Map Columns" tab (SUS analysis did not reset it)
26. [ ] Return to SUS card
27. [ ] Confirm SUS headers are still visible

### Evidence

- [ ] Screenshot of SUS card with real headers displayed
- [ ] Screenshot of AST card showing state was preserved
- [ ] Note SUS header count and confirm different from AST

---

## Triad Census Import — Live Test Steps

### Carrier Card Activation

1. [ ] Check "Send to Triad" checkbox in Checklist
2. [ ] Confirm **Triad Census Import** card appears
3. [ ] Confirm card has header "Triad Census Import" with green badge

### File Selection

4. [ ] Upload/select a census file (CSV recommended)
5. [ ] Confirm file name appears in card

### Analyze Button Behavior

6. [ ] Confirm **Analyze Census** button is **ENABLED**
7. [ ] Click "Analyze Census"
8. [ ] Confirm loading state appears with spinner
9. [ ] Confirm button is **DISABLED** during analysis

### Analysis Result

10. [ ] Confirm analysis completes
11. [ ] Confirm active tab switches to "Map Columns"
12. [ ] Confirm real headers display

### Header Validation

13. [ ] Confirm **real detected headers appear**
14. [ ] Confirm no mock columns
15. [ ] Confirm Triad headers are **independent** (different from or unrelated to AST/SUS)

### State Isolation

16. [ ] Confirm AST card state unchanged
17. [ ] Confirm SUS card state unchanged
18. [ ] Confirm Triad has its own isolated state

### Evidence

- [ ] Screenshot of Triad card with headers displayed
- [ ] Confirm no cross-carrier state contamination

---

## MEC / MVP Census Import — Live Test Steps

### Carrier Card Activation

1. [ ] Check "Send to MEC / MVP" checkbox in Checklist
2. [ ] Confirm **MEC / MVP Census Import** card appears
3. [ ] Confirm card has header "MEC / MVP Census" with orange badge
4. [ ] Confirm "Attachments" section is visible in card header

### File Selection

5. [ ] Upload/select a census file (CSV recommended)
6. [ ] Confirm file name appears in card

### Analyze Button Behavior

7. [ ] Confirm **Analyze Census** button is **ENABLED**
8. [ ] Click "Analyze Census"
9. [ ] Confirm loading state with spinner appears
10. [ ] Confirm button is **DISABLED** during analysis

### Analysis Result

11. [ ] Confirm analysis completes
12. [ ] Confirm active tab switches to "Map Columns"
13. [ ] Confirm real headers display

### Header Validation

14. [ ] Confirm **real detected headers appear**
15. [ ] Confirm no mock columns
16. [ ] Confirm headers are specific to MEC/MVP file

### State Isolation

17. [ ] Confirm AST / SUS / Triad cards remain unchanged
18. [ ] Confirm each carrier maintains independent state

### Evidence

- [ ] Screenshot of MEC / MVP card with headers displayed
- [ ] Confirm all four carriers remain isolated

---

## Multi-Carrier State Isolation Test

This test confirms that analyzing different files in different carriers does not cause cross-contamination.

### Sequence

1. [ ] **AST**: Select and analyze **FILE_A** (e.g., `ast_census.csv`)
   - [ ] Confirm headers appear for FILE_A
   - [ ] Move to "Map Columns" tab
   - [ ] Note the specific headers detected

2. [ ] **SUS**: Select and analyze **FILE_B** (e.g., `sus_census.csv` — **different** file)
   - [ ] Confirm headers appear for FILE_B
   - [ ] Note headers are different from AST if files differ
   - [ ] Move to "Map Columns" tab

3. [ ] **Triad**: Select and analyze **FILE_C** (e.g., `generic_census.csv`)
   - [ ] Confirm headers appear for FILE_C
   - [ ] Confirm headers are specific to FILE_C

4. [ ] **MEC / MVP**: Select and analyze **FILE_D** (or reuse FILE_A, different content)
   - [ ] Confirm headers display

### Isolation Verification

5. [ ] Return to **AST card**
   - [ ] [ ] Confirm Map Columns tab still shows **FILE_A headers** (not FILE_B, FILE_C, FILE_D)

6. [ ] Return to **SUS card**
   - [ ] [ ] Confirm Map Columns tab still shows **FILE_B headers** (not FILE_A, FILE_C, FILE_D)

7. [ ] Return to **Triad card**
   - [ ] [ ] Confirm headers are **Triad-specific** (FILE_C)

8. [ ] Return to **MEC / MVP card**
   - [ ] [ ] Confirm headers are **MEC-MVP-specific**

### Card Removal Test

9. [ ] In Checklist, **uncheck SUS** checkbox
10. [ ] Confirm **SUS card is removed** from the display
11. [ ] Confirm **AST / Triad / MEC-MVP cards remain intact** and unaffected
12. [ ] Confirm their headers and state are preserved
13. [ ] Re-check SUS (optional — confirm card reappears with fresh state or preserved state, document behavior)

### Result

- [ ] PASS: All carriers maintain isolated state
- [ ] FAIL: State contamination detected (record which carriers affected)

---

## Error Handling Test

This test validates that errors are visible and recoverable.

### Test Case 1: No File Selected

1. [ ] In a carrier card (e.g., Triad), **do not select any file**
2. [ ] Confirm "Analyze Census" button is **NOT visible** (or disabled)
3. [ ] This confirms Analyze is unavailable without file
4. [ ] **PASS**: Button correctly requires file

### Test Case 2: Unsupported File Type (Optional)

5. [ ] Try uploading a non-census file (e.g., `.txt`, `.doc`) if supported
6. [ ] Confirm rejection or error handling
7. [ ] Record behavior

### Test Case 3: Backend Analyze Error

8. [ ] With a valid file selected, click Analyze
9. [ ] If backend returns an error (intentional or unexpected):
   - [ ] Confirm **visible error message appears** (red box with "Analysis Failed")
   - [ ] Confirm **error text is readable**
   - [ ] Confirm **user remains on Upload Census tab** (does not switch to Map Columns)
   - [ ] Confirm **Analyze button recovers** (is re-clickable after error)

10. [ ] Select a **different file**
11. [ ] Confirm error message **clears**
12. [ ] Click "Analyze Census" again
13. [ ] Confirm retry works or error reappears with correct message

### Test Case 4: No Silent Failures

14. [ ] During all tests, confirm **no silent failures** occur:
   - [ ] No page hangs or freezes
   - [ ] No console errors (check browser DevTools if possible)
   - [ ] No unhandled exceptions
   - [ ] Errors are always visible in UI

### Result

- [ ] PASS: Errors visible and recoverable
- [ ] FAIL: Silent failures, crashes, or unhandled errors detected

---

## Evidence Capture

For each successful carrier test, document:

### AST Evidence

| Item | Value |
|------|-------|
| File Name | _________________ |
| File Type | [ ] CSV [ ] XLSX [ ] XLS |
| Analyze Fired | [ ] Yes |
| Backend Called | [ ] Yes |
| Tab Transitioned | [ ] Yes |
| Header Count | _________ |
| Sample Headers | _________________ |
| Errors | None / _________________ |
| Screenshots | Attached / Not Attached |
| Notes | _________________ |

### SUS Evidence

| Item | Value |
|------|-------|
| File Name | _________________ |
| File Type | [ ] CSV [ ] XLSX [ ] XLS |
| Analyze Fired | [ ] Yes |
| Backend Called | [ ] Yes |
| Tab Transitioned | [ ] Yes |
| Header Count | _________ |
| Sample Headers | _________________ |
| Different from AST | [ ] Yes [ ] N/A (same file) |
| AST State Preserved | [ ] Yes |
| Errors | None / _________________ |
| Screenshots | Attached / Not Attached |
| Notes | _________________ |

### Triad Evidence

| Item | Value |
|------|-------|
| File Name | _________________ |
| File Type | [ ] CSV [ ] XLSX [ ] XLS |
| Analyze Fired | [ ] Yes |
| Tab Transitioned | [ ] Yes |
| Header Count | _________ |
| Errors | None / _________________ |
| Notes | _________________ |

### MEC / MVP Evidence

| Item | Value |
|------|-------|
| File Name | _________________ |
| File Type | [ ] CSV [ ] XLSX [ ] XLS |
| Analyze Fired | [ ] Yes |
| Tab Transitioned | [ ] Yes |
| Header Count | _________ |
| Errors | None / _________________ |
| Notes | _________________ |

---

## Known Issues Not in Scope

Record but do **NOT** fix during this test. These are separate P0 repairs:

- [ ] **XLSX Binary Parser Issue (P0 Repair 5)**
  - [ ] If XLSX shows `PK` or `[Content_Types].xml`, record as known defect
  - [ ] Do not treat as carrier-card failure

- [ ] **Validation-to-Execution Link Missing (P0 Repair 3)**
  - [ ] Validation tab exists but does not trigger import
  - [ ] Out of scope for this test

- [ ] **Dalton Rules Engine Not Implemented (P0 Repair 6)**
  - [ ] Checkbox visible but no rule application
  - [ ] Out of scope for this test

- [ ] **Document Persistence Not Implemented**
  - [ ] SUS Required Forms / MEC Attachments not saved to backend
  - [ ] Out of scope for this test

- [ ] **SARA Forms Backend Storage**
  - [ ] Forms visible but not persisted
  - [ ] Out of scope for this test

- [ ] **External Carrier Submission**
  - [ ] Not authorized for this repair phase
  - [ ] Out of scope for this test

- [ ] **Gate 6I-B Scheduler Work**
  - [ ] Deferred to later phase
  - [ ] Out of scope for this test

- [ ] **Gate 6J-B Email Delivery**
  - [ ] Deferred to later phase
  - [ ] Out of scope for this test

- [ ] **Gate 6J-C Webhook Delivery**
  - [ ] Deferred to later phase
  - [ ] Out of scope for this test

---

## Pass / Fail Criteria

### P0 Repair 2/4 Passes Live UI Testing Only If:

✅ **File Selection Works**
- [ ] All four carriers can select/upload files
- [ ] File names appear in cards
- [ ] Replace button available

✅ **Analyze Button Enablement**
- [ ] All four Analyze buttons enable after file selection
- [ ] Buttons are disabled without file
- [ ] No placeholder or hardcoded disabled state

✅ **Analyze Click Behavior**
- [ ] All four analyze clicks fire without errors
- [ ] Backend function is called (confirm via logs or response)
- [ ] No network failures or timeouts (unless intentional test)

✅ **Loading State Display**
- [ ] All four carriers show "Analyzing census..." with spinner
- [ ] Button disabled during loading
- [ ] Spinner animates
- [ ] State clears on completion

✅ **Tab Transition**
- [ ] All four successful analyses open "Map Columns" tab
- [ ] Tab switches automatically (not manual)
- [ ] Transition is smooth (no blank screen)

✅ **Real Detected Headers**
- [ ] Headers from `analysisResult.headers` appear
- [ ] Not hardcoded mock columns
- [ ] Headers match uploaded file structure (if detectable)
- [ ] All four carriers show distinct headers (if different files used)

✅ **Mock Columns Removed**
- [ ] No hardcoded ["Relationship", "First Name", ...] appear
- [ ] When no real headers, show placeholder message only
- [ ] Placeholder says "Click Analyze Census to detect columns"

✅ **Carrier State Independence**
- [ ] AST headers remain AST-specific when SUS/Triad/MEC analyzed
- [ ] SUS headers remain SUS-specific
- [ ] Triad and MEC/MVP remain isolated
- [ ] Unchecking carrier removes only that card
- [ ] Other carriers unaffected

✅ **Error Handling**
- [ ] Errors are visible (red boxes, not silent failures)
- [ ] Error messages are readable
- [ ] User remains on Upload tab (not "Map Columns")
- [ ] Buttons recover after error
- [ ] Retry works

✅ **No Raw Axios Calls**
- [ ] All file uploads use base44 SDK (no direct axios)
- [ ] No hardcoded API endpoints
- [ ] Uses censusImportClient module

✅ **Existing CensusUploadModal Untouched**
- [ ] Non-carrier census upload modal still visible/functional
- [ ] No regressions to existing workflow

✅ **No Unrelated Gates Touched**
- [ ] 6I-B scheduler work: NOT STARTED
- [ ] 6J-B email delivery: NOT STARTED
- [ ] 6J-C webhook delivery: NOT STARTED

### Fail Criteria (Any one causes FAIL):

❌ A carrier card doesn't appear after checkbox selected  
❌ Analyze button doesn't enable after file selection  
❌ Analyze button click does nothing (no loading state)  
❌ Loading state doesn't appear  
❌ Map Columns tab doesn't open after successful analyze  
❌ Mock columns appear instead of real headers  
❌ Real headers don't appear when analysis succeeds  
❌ One carrier's state affects another carrier  
❌ Errors are silent or cause page crash  
❌ Unrelated gates (6I-B, 6J-B, 6J-C) are modified  

---

## Operator Decision Block

### OPERATOR LIVE TEST DECISION — P0 REPAIR 2/4

**Test Completion Date**: ____________________  
**Operator Name**: ____________________  
**Test Environment**: [ ] Staging [ ] Local [ ] Production (NOT AUTHORIZED)  

### Test Result

- [ ] **PASS** — All criteria met, approve P0 Repair 2/4 live UI behavior
- [ ] **CONDITIONAL PASS** — Minor issues, document remediation plan
- [ ] **FAIL** — Critical issues, remediation required before closure
- [ ] **HOLD** — Additional testing required, see notes

### Operator Test Summary

**Carriers Tested**:
- [ ] AST: PASS / FAIL / NOT TESTED
- [ ] SUS: PASS / FAIL / NOT TESTED
- [ ] Triad: PASS / FAIL / NOT TESTED
- [ ] MEC / MVP: PASS / FAIL / NOT TESTED

**State Isolation**:
- [ ] PASS: All carriers maintain independent state
- [ ] FAIL: Cross-carrier contamination detected

**Error Handling**:
- [ ] PASS: Errors visible and recoverable
- [ ] FAIL: Silent failures or unhandled errors

**Mock Column Removal**:
- [ ] PASS: Only real headers display
- [ ] FAIL: Mock columns still present

### Operator Notes

```
[Space for detailed operator observations, screenshots, logs, or issues encountered]

```

### Approval Signature

**Operator Approval**: ____________________  
**Date Approved**: ____________________  
**Next Repair**: [ ] P0 Repair 5 (XLSX Parser) [ ] Remediation Required [ ] Hold  

---

## Post-Test Completion Report

After completing live UI testing, fill out this completion report:

### Test Completion Summary

| Item | Status |
|------|--------|
| Document Created | [ ] Complete |
| AST Testing | [ ] PASS [ ] FAIL [ ] NOT TESTED |
| SUS Testing | [ ] PASS [ ] FAIL [ ] NOT TESTED |
| Triad Testing | [ ] PASS [ ] FAIL [ ] NOT TESTED |
| MEC / MVP Testing | [ ] PASS [ ] FAIL [ ] NOT TESTED |
| State Isolation Testing | [ ] PASS [ ] FAIL [ ] NOT TESTED |
| Error Handling Testing | [ ] PASS [ ] FAIL [ ] NOT TESTED |

### Carriers Tested

**AST Census Import**:
- File Used: _________________
- Result: PASS / FAIL
- Notes: _________________

**SUS Census Import**:
- File Used: _________________
- Result: PASS / FAIL
- Notes: _________________

**Triad Census Import**:
- File Used: _________________
- Result: PASS / FAIL
- Notes: _________________

**MEC / MVP Census Import**:
- File Used: _________________
- Result: PASS / FAIL
- Notes: _________________

### Key Findings

**State Isolation Result**: PASS / FAIL
- One carrier's analysis did not affect others: [ ] Yes [ ] No

**Real Headers Display**: PASS / FAIL
- Headers from analysis result appeared: [ ] Yes [ ] No
- Mock columns removed: [ ] Yes [ ] No

**Error Handling Result**: PASS / FAIL
- Errors were visible: [ ] Yes [ ] No
- Users could recover/retry: [ ] Yes [ ] No

**Loading State**: PASS / FAIL
- Spinner appeared during analyze: [ ] Yes [ ] No
- Button disabled during loading: [ ] Yes [ ] No

### Known Issues Encountered

- [ ] None
- [ ] XLSX binary parser issue (P0 Repair 5)
- [ ] Other (document below):

```
[Space for any unexpected issues or blockers]

```

### Build & Environment Status

- Lint: [ ] PASS [ ] FAIL
- Build: [ ] PASS [ ] FAIL
- Tests Run: [ ] Yes [ ] No
- Feature Flags Changed: [ ] Yes [ ] No
- Routes Changed: [ ] Yes [ ] No
- Gates Touched: 6I-B [ ] Yes [ ] No | 6J-B [ ] Yes [ ] No | 6J-C [ ] Yes [ ] No

### Operator Recommendation

- [ ] **APPROVE** P0 Repair 2/4 for closure
- [ ] **CONDITIONAL APPROVE** with documented remediation plan
- [ ] **REJECT** — Remediation required
- [ ] **HOLD** — Additional testing or investigation needed

**Recommendation Details**:
```
[Space for operator's recommendation and any conditions]

```

### Next Steps

If APPROVED:
- [ ] Proceed to P0 Repair 5 (XLSX binary parser fix)

If CONDITIONAL or HOLD:
- [ ] Execute remediation plan documented above
- [ ] Re-test affected carriers
- [ ] Provide updated completion report

---

**Document Status**: LIVE UI TESTING READY  
**Operator Action Required**: Complete live testing and sign operator decision block  
**Strict Boundaries**: Do not proceed to XLSX parser, validation-to-execution, Dalton Rules, document persistence, scheduler, email delivery, or webhook delivery until this testing is complete and approved.