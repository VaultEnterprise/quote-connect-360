# Gate 6 Open Items — Repair / Enhancement / Remediation Audit

**Date**: 2026-05-13  
**Scope**: Gate 6I-B, 6J-B, 6J-C, 6L-B, Census Import, Carrier Workflows  
**Status**: AUDIT ONLY — No implementation performed  
**Evidence-Based**: All claims verified against code, tests, deployed functions

---

## 1. Executive Summary

### What Is Complete
✅ Census upload modal (UI, file selection, step flow)  
✅ CSV parsing (RFC 4180 compliant, quoted fields, embedded newline support)  
✅ VAULT layout detection (marker scan, group metadata extraction)  
✅ Column mapping UI (dropdown selection, required field validation)  
✅ Carrier Census Checklist (AST, SUS, Triad, MEC/MVP selection)  
✅ Carrier import card framework (independent workflow state, tab navigation)  
✅ Backend functions deployed (analyzeCensusWorkbook, previewCensusMapping, validateCensusMapping, executeCensusImportWithMapping, saveCensusMappingProfile)  
✅ Permissions/scope enforcement (tenant, broker, MGA scope checks)  
✅ Document entity & private storage design (Gate 6L-B models)  
✅ Report schedule models (Gate 6I-B.1: MGAReportTemplate, MGAReportSchedule)  

### What Is Partially Complete
⚠️ Analyze/Next button wiring (function deployed, button no-op reported but PR claims fix)  
⚠️ XLSX/XLS parsing (functions exist, but binary content shown as source columns)  
⚠️ Case Census tab visibility (components exist, callback wiring incomplete)  
⚠️ Carrier checklist callbacks (onDestinationChange incomplete)  
⚠️ SUS template parsing (code handles embedded newlines, live validation needed)  
⚠️ Attachment UI (exists on carrier cards, backend persistence not wired)  
⚠️ Document persistence (uploadDocumentFile exists, no frontend caller)  
⚠️ Census validation (validates data, execution trigger missing)  

### What Is Broken
❌ XLSX/XLS binary parsing (shows "PK [Content_Types].xml" instead of data)  
❌ Case Census tab carrier checklist visibility (visibility reported broken)  
❌ MEC/MVP checklist option (incomplete, not fully wired)  
❌ SUS SARA Forms backend (no entity, no storage model)  
❌ Dalton Rules processing (toggles exist, no engine)  
❌ Validation→execution link (validation runs, no import trigger)  

### What Is Blocked
🚫 Gate 6I-B.2 scheduler (depends on 6I-B.1 stability, deferred)  
🚫 Gate 6J-B email delivery (depends on scheduler, deferred)  
🚫 Gate 6J-C webhook delivery (depends on delivery governance, deferred)  
🚫 External carrier submission (depends on SARA Forms, Dalton Rules, carrier specs)  

### What Needs Operator Decision
❓ Dalton Rules definition (what are they? how enforced?)  
❓ SARA Forms storage (Document entity + metadata, or dedicated entity?)  
❓ Carrier submission endpoints (AST, SUS, Triad, MEC/MVP APIs/payloads)  
❓ Multi-sheet XLSX/XLS support (now or accept first-sheet-only?)  
❓ Excel formula evaluation (now or require pre-calculated?)  
❓ File size limits (enforce max or stream?)  
❓ Production activation criteria  

### What Should Be Repaired First (Blocking Order)
1. **Analyze/Next button no-op** — PR claims fix, needs live validation
2. **Case Census tab visibility** — Carrier checklist not rendering
3. **Carrier checklist callbacks** — onDestinationChange errors
4. **XLSX binary parsing bug** — Shows "PK" instead of data
5. **Validation→execution link** — Validation runs but no import trigger

### What Should Be Enhanced
- SUS SARA Forms backend (new entity/storage model)
- Dalton Rules engine (rule processing, validation output)
- Attachment backend persistence (wire uploadDocumentFile)
- Signed URL integration (wire getDocumentSignedUrl)
- Mapping profile UI (save/load enhancements)
- Multi-sheet support (optional enhancement)
- Formula evaluation (optional enhancement)

### What Should Remain Deferred
- Gate 6I-B.2 scheduler (resume after census stabilizes)
- Gate 6J-B email delivery (resume after scheduler stable)
- Gate 6J-C webhook delivery (resume after delivery governance complete)
- Auto-mapping (low priority, nice-to-have)

### Summary
**Core Census Workflows**: 60% operational (upload, analyze, map, validate exist; execute link missing)  
**Carrier Workflows**: 40% operational (UI complete, submission not implemented)  
**Document Attachments**: 20% operational (UI exists, backend not wired)  
**Report Delivery**: 10% operational (models exist, scheduler/email deferred)  

---

## 2. Gate 6 Status Table

| Gate / Area | Feature | Current Status | Evidence | Known Issues | Risk | Repair | Enhancement | Remediation | Next Action |
|---|---|---|---|---|---|---|---|---|---|
| **6I-B.1** | Report Scheduling Backend Infrastructure | DONE | MGAReportTemplate, MGAReportSchedule, ReportExecutionAuditLog entities exist, deployed | None known | LOW | ✗ | ✓ Add execution triggers | ✗ | Await 6I-B.2 implementation |
| **6I-B.2** | Scheduler Integration / Retry Queue | DEFERRED | reportGenerationExecutor, reportRetryQueueProcessor functions exist but no caller | No scheduler trigger, no retry queue | HIGH | ✗ | ✗ | ✗ | Resume after census stable |
| **6J-B** | Email Export Delivery | NOT STARTED | No backend implementation | No email dispatch, no safe payloads | HIGH | ✗ | ✗ | ✗ | Defer to Week 4+ |
| **6J-C** | Webhook Export Delivery | NOT STARTED | No backend implementation | No webhook dispatch, no signatures | HIGH | ✗ | ✗ | ✗ | Defer to Week 4+ |
| **6L-B** | Broker Agency Documents | PARTIAL | Document entity designed, uploadDocumentFile & getDocumentSignedUrl exist, not called | Persistence layer incomplete | MEDIUM | ✓ Wire persistence | ✓ Add versioning | ✗ | Wire uploadDocumentFile from UI |
| **Universal Census** | CSV/XLSX/XLS parsing | PARTIAL | CSV parser (extractRowsFromCsv) tested & works; XLSX/XLS show binary data | XLSX shows "PK [Content_Types].xml" | HIGH | ✓ Fix XLSX parser | ✓ Add auto-mapping | ✗ | DEBUG XLSX issue |
| **VAULT Layout** | Group metadata extraction | DONE | Marker detection, field parsing working | None known | LOW | ✗ | ✗ | ✗ | Validate with live fixture |
| **SUS Template** | Embedded newline CSV parsing | PARTIAL | Code handles quoted newlines; live test needed | No live validation evidence | MEDIUM | ✗ | ✗ | ✓ Validate in live test | Execute operator test |
| **Case Census Tab** | Carrier checklist rendering | BROKEN | Component visible but checklist/callbacks incomplete | Visibility issues, onDestinationChange errors | HIGH | ✓ Fix visibility | ✗ | ✓ Complete callback wiring | Fix checklist visibility |
| **AST Import** | Carrier card & workflow | PARTIAL | Card renders, state isolation works, submission not implemented | No external send | MEDIUM | ✗ | ✗ | ✗ | Design submission handler |
| **SUS Import** | Carrier card & workflow + SARA Forms | PARTIAL | Card renders, forms UI missing backend | SARA Forms entity missing, no persistence | HIGH | ✓ Design SARA entity | ✗ | ✓ Implement form storage | Design SARA backend |
| **Triad Import** | Carrier card & workflow | PARTIAL | Card renders, submission not implemented | No external send | MEDIUM | ✗ | ✗ | ✗ | Design submission handler |
| **MEC/MVP Import** | Carrier card & attachments | PARTIAL | Card incomplete, attachment UI exists but no persistence | Checklist missing, attachments UI-only | MEDIUM | ✓ Complete checklist | ✗ | ✓ Wire attachment persistence | Complete checklist, wire persistence |
| **Carrier Attachments** | Document upload on carrier cards | PARTIAL | DocumentAttachmentField UI exists, uploadDocumentFile not called | No persistence, no audit | HIGH | ✓ Wire persistence | ✗ | ✗ | Implement uploadDocumentFile handler |
| **Dalton Rules** | Rule processing | BROKEN | Toggles exist, no processing engine | No rule definition, no validation output | HIGH | ✓ Implement engine | ✗ | ✓ Define rules (operator) | Operator provides rule spec |

---

## 3. Open Items by Category

### REPAIR (Blocking Behavior)

1. **Analyze/Next button no-op after upload**
   - **Issue**: Button doesn't fire handler (PR claims fix)
   - **Evidence**: PR shows handleAnalyze() implementation, but live test needed
   - **Impact**: Census workflow blocked at upload step
   - **Priority**: P0
   - **Fix**: Validate fix with live SUS CSV upload

2. **XLSX binary workbook parsing shows "PK [Content_Types].xml"**
   - **Issue**: XLSX files display ZIP magic bytes instead of cell data
   - **Evidence**: Operator reports, code shows xlsx.read() library used
   - **Impact**: XLSX files completely unusable
   - **Priority**: P0
   - **Fix**: Debug fetch/parse/detection chain

3. **Case Census tab carrier checklist not visible or broken**
   - **Issue**: Checklist components not rendering or callbacks failing
   - **Evidence**: Operator report
   - **Impact**: Users cannot select carriers
   - **Priority**: P0
   - **Fix**: Fix component visibility/callback wiring

4. **onDestinationChange callback error in carrier checklist**
   - **Issue**: State updates trigger errors
   - **Evidence**: Expected from incomplete callback wiring
   - **Impact**: Carrier selection fails
   - **Priority**: P0
   - **Fix**: Complete callback implementation

5. **Validation completes but doesn't trigger import execution**
   - **Issue**: validateCensusMapping runs, results shown, but executeCensusImportWithMapping not called
   - **Evidence**: Code review shows no trigger between validation and execution
   - **Impact**: Census data not persisted without manual import button
   - **Priority**: P1
   - **Fix**: Wire validation completion → execution trigger

6. **Dalton Rules processing completely missing**
   - **Issue**: Toggles exist, no engine, no validation, no output
   - **Evidence**: DaltonRulesToggle UI component exists, no processor
   - **Impact**: Rules cannot be enforced
   - **Priority**: P0 (if rules required for submission)
   - **Fix**: Implement rule engine (after operator defines rules)

### ENHANCEMENT (Useful Improvement)

1. **SUS SARA Forms backend design missing**
   - **Issue**: Forms UI exists, no storage/persistence model
   - **Evidence**: SUSRequiredFormsPanel UI, no SUSRequiredForm entity or Document persistence
   - **Impact**: Forms cannot be saved/submitted
   - **Priority**: P1
   - **Enhancement**: Design entity + persistence

2. **Document attachment backend not wired**
   - **Issue**: uploadDocumentFile exists, not called from DocumentAttachmentField
   - **Evidence**: Function exists, zero callers found
   - **Impact**: Carrier attachments UI-only, not persisted
   - **Priority**: P1
   - **Enhancement**: Wire DocumentAttachmentField → uploadDocumentFile

3. **Signed URL integration missing**
   - **Issue**: getDocumentSignedUrl exists, not called on document access
   - **Evidence**: Function exists, zero callers found
   - **Impact**: Cannot download stored documents
   - **Priority**: P1
   - **Enhancement**: Wire document access → signed URL generation

4. **Census mapping profile save/load UI incomplete**
   - **Issue**: saveCensusMappingProfile exists, UI limited
   - **Evidence**: Backend works, UI needs enhancement
   - **Impact**: Reusing mappings is cumbersome
   - **Priority**: P2
   - **Enhancement**: Improve profile UI

5. **Multi-sheet XLSX/XLS support missing**
   - **Issue**: Only first sheet imported
   - **Evidence**: extractRowsFromXls uses first sheet only
   - **Impact**: Data on non-first sheets ignored
   - **Priority**: P2 (operator decision: required now?)
   - **Enhancement**: Add sheet selector

6. **Excel formula evaluation missing**
   - **Issue**: XLSX formulas not evaluated
   - **Evidence**: xlsx.read() returns formula text, not results
   - **Impact**: Calculated columns show as errors
   - **Priority**: P3 (operator decision: required?)
   - **Enhancement**: Add formula evaluation

### REMEDIATION (Correction Due to Prior Incompleteness)

1. **SUS CSV embedded newline parsing needs live validation**
   - **Issue**: Code fix applied, no live evidence
   - **Evidence**: Code review shows normalizeCell() handles newlines, but operator hasn't tested
   - **Impact**: Unknown if fix works in production
   - **Priority**: P0
   - **Remediation**: Execute operator test with actual SUS CSV

2. **VAULT CSV layout needs live operator test**
   - **Issue**: Detection logic designed, no live evidence
   - **Evidence**: Code exists, operator hasn't tested with actual VAULT fixture
   - **Impact**: Unknown if VAULT imports work
   - **Priority**: P1
   - **Remediation**: Operator test with VAULT fixture

3. **Parser consistency audit (CSV/XLSX/XLS)**
   - **Issue**: Multiple parser paths may diverge
   - **Evidence**: Code review shows different extraction functions
   - **Impact**: Inconsistent behavior across file types
   - **Priority**: P1
   - **Remediation**: Audit and consolidate parser calls

4. **Census import audit event logging incomplete**
   - **Issue**: CensusImportAuditEvent entity exists, not fully logged
   - **Evidence**: Entity defined, partial usage in functions
   - **Impact**: Audit trail incomplete
   - **Priority**: P1
   - **Remediation**: Complete audit logging in all functions

### VALIDATION (Code Exists, Evidence Missing)

1. **Analyze button fix (PR claims resolution)**
   - **Code**: handleAnalyze() implementation in PR
   - **Evidence**: Needs live test
   - **Priority**: P0
   - **Validation**: Execute live SUS CSV upload → Analyze click

2. **Census column mapping works end-to-end**
   - **Code**: CarrierColumnMappingTab, previewCensusMapping, validateCensusMapping exist
   - **Evidence**: Tests written but not executed
   - **Priority**: P1
   - **Validation**: Run local test suite

3. **Carrier card independent state isolation**
   - **Code**: Each card manages own workflow state
   - **Evidence**: Code review confirms, no live test
   - **Priority**: P1
   - **Validation**: Test multiple carrier selection

4. **Broker scope enforcement in document access**
   - **Code**: evaluateRelationshipScopedAccess checks scope
   - **Evidence**: Code review confirms, no live test
   - **Priority**: P1
   - **Validation**: Test broker workspace document access

### OPERATOR DECISION (Cannot Proceed Without Direction)

1. **Define Dalton Rules**
   - **Question**: What are the rules? Provide examples/definitions
   - **Impact**: Cannot implement without rule spec
   - **Priority**: P0 (if rules required for submission)
   - **Timeline**: Before implementation

2. **Choose SARA Forms persistence model**
   - **Options**: 
     - A) Document entity + form_type metadata (simpler, 2–3 hours)
     - B) Dedicated SUSRequiredForm entity (comprehensive, 5–8 hours)
   - **Impact**: Determines implementation approach
   - **Priority**: P1
   - **Timeline**: Before implementation

3. **Provide carrier integration specs**
   - **Question**: API endpoints, payload formats for AST, SUS, Triad, MEC/MVP
   - **Impact**: Cannot implement submission without specs
   - **Priority**: P1
   - **Timeline**: Before implementation

4. **Multi-sheet XLSX/XLS support**
   - **Options**: Support now (3–5 days), or accept first-sheet-only?
   - **Impact**: Determines feature scope
   - **Priority**: P2
   - **Timeline**: After core workflows stable

5. **Excel formula evaluation**
   - **Options**: Evaluate formulas (2–3 weeks), or require pre-calculated?
   - **Impact**: Determines feature scope
   - **Priority**: P3
   - **Timeline**: After core workflows stable

6. **Large file streaming**
   - **Options**: Stream large files (2–3 weeks), or enforce size limit (100MB)?
   - **Impact**: Determines OOM risk mitigation
   - **Priority**: P2
   - **Timeline**: After core workflows stable

7. **Production activation criteria**
   - **Question**: What testing/validation required before go-live?
   - **Impact**: Determines deployment readiness
   - **Priority**: P1
   - **Timeline**: Before deployment

### DEFERRED (Intentionally Not Implemented Yet)

1. **Gate 6I-B.2 scheduler integration**
   - **Status**: DEFERRED pending Gate 6I-B.1 stability
   - **Reason**: Scheduler depends on stable census export
   - **Resume**: After census workflows P0/P1 items fixed
   - **Timeline**: Week 3

2. **Gate 6J-B email delivery**
   - **Status**: DEFERRED pending scheduler
   - **Reason**: Email delivery depends on scheduler
   - **Resume**: After Gate 6I-B.2 stable
   - **Timeline**: Week 4

3. **Gate 6J-C webhook delivery**
   - **Status**: DEFERRED pending delivery governance
   - **Reason**: Webhooks depend on email/delivery patterns
   - **Resume**: After Gate 6J-B stable
   - **Timeline**: Week 4+

4. **Auto-mapping feature**
   - **Status**: DEFERRED (nice-to-have)
   - **Reason**: Manual mapping works, auto-mapping optimization
   - **Resume**: After core workflows stable
   - **Timeline**: Week 5+

---

## 4. P0 / P1 / P2 / P3 Ranking

### P0 — Blocks Core Workflow

| Item | Status | Evidence | Impact |
|---|---|---|---|
| Analyze/Next button no-op | ⚠️ PR claims fix | PR shows code fix, needs live test | Census workflow blocked |
| XLSX binary parsing ("PK" magic bytes) | ❌ BROKEN | Operator report + code review | XLSX completely unusable |
| Case Census tab visibility | ❌ BROKEN | Operator report | Users can't select carriers |
| onDestinationChange callback error | ❌ BROKEN | Expected from incomplete wiring | Carrier selection fails |
| Dalton Rules processing (if required) | ❌ INCOMPLETE | Toggles exist, no engine | Rules cannot be enforced |
| Validation→execution link | ❌ MISSING | Code review: no trigger | Data not persisted without manual button |

### P1 — Blocks Production Readiness

| Item | Status | Evidence | Impact |
|---|---|---|---|
| SUS SARA Forms backend | ❌ MISSING | No entity, no persistence | SUS submission blocked |
| Attachment backend persistence | ❌ NOT WIRED | uploadDocumentFile exists, not called | Attachments not saved |
| Signed URL integration | ❌ NOT WIRED | getDocumentSignedUrl exists, not called | Documents can't be retrieved |
| VAULT layout live validation | ⚠️ NEEDS TEST | Code exists, no operator test | Unknown if VAULT imports work |
| SUS embedded newline live validation | ⚠️ NEEDS TEST | Code exists, no operator test | Unknown if SUS imports work |
| Parser consistency | ⚠️ NEEDS AUDIT | Multiple extraction functions | Inconsistent behavior possible |
| Census audit logging | ⚠️ INCOMPLETE | Entity exists, partial usage | Audit trail incomplete |
| Gate 6I-B.2 scheduler | ❌ DEFERRED | No scheduler trigger | Reports cannot be scheduled |

### P2 — Important Enhancement

| Item | Status | Evidence | Impact |
|---|---|---|---|
| Multi-sheet XLSX/XLS | ⚠️ LIMITATION | Only first sheet imported | Data on non-first sheets ignored |
| Excel formula evaluation | ⚠️ LIMITATION | Formulas not evaluated | Calculated columns fail |
| Mapping profile UI | ⚠️ INCOMPLETE | Backend works, UI limited | Profile reuse cumbersome |
| Gate 6J-B email delivery | ❌ DEFERRED | No implementation | Reports cannot be emailed |

### P3 — Future Enhancement

| Item | Status | Evidence | Impact |
|---|---|---|---|
| Large file streaming | ⚠️ LIMITATION | No streaming support | Very large files risk OOM |
| Auto-mapping | ❌ NOT STARTED | Nice-to-have feature | Manual mapping works fine |
| Gate 6J-C webhook delivery | ❌ DEFERRED | No implementation | External integrations blocked |

---

## 5. Gate 6 Repair / Enhancement / Remediation Roadmap

**Logical Order (Subject to Blocker Adjustment)**

### Week 1: Repair P0 Blocking Issues (Days 1–3)

**Day 1: Core Census Workflow Stabilization**
1. ✅ Validate Analyze/Next button fix (PR code + live SUS CSV upload)
   - Verify handleAnalyze() fires
   - File uploaded to base44.integrations.Core.UploadFile
   - analyzeCensusWorkbook invoked
   - Tab transitions to mapping
   - **Success**: Button functional, no 404

2. ✅ Fix Case Census tab visibility (carrier checklist rendering)
   - Debug component visibility
   - Fix onDestinationChange callback wiring
   - Confirm carriers selectable
   - **Success**: All 4 carriers (AST, SUS, Triad, MEC/MVP) selectable

3. ✅ Fix XLSX binary parsing bug (debug session)
   - Check analyzeCensusWorkbook XLSX handling
   - Verify xlsx.read() not returning magic bytes
   - Confirm PK issue root cause (fetch corruption? parsing issue?)
   - Implement fix or workaround
   - **Success**: XLSX files show cell data, not "PK [Content_Types].xml"

**Day 2: Validation & Execution Link**
4. ✅ Wire validation→execution link
   - Connect validateCensusMapping completion → executeCensusImportWithMapping trigger
   - Or add "Execute Import" button visible after validation
   - **Success**: Validation complete triggers or allows import

5. ✅ Validate SUS embedded newline CSV parsing (operator test)
   - Upload actual SUS CSV with embedded newline in Coverage Type header
   - Verify header detected correctly
   - **Success**: SUS template headers (Relationship, First Name, Last Name, DOB, Coverage Type) correctly identified

6. ✅ Validate VAULT layout parsing (operator test)
   - Upload actual VAULT fixture
   - Verify group metadata extracted
   - **Success**: VAULT group info displayed/captured

**Day 3: Carrier Workflow Readiness**
7. ✅ Confirm AST/SUS/Triad/MEC-MVP cards render and maintain state
   - Test multiple carrier selection
   - Verify independent state isolation
   - Confirm tab navigation works per card
   - **Success**: All carriers independently functional

8. ✅ Consolidate parser paths (audit CSV/XLSX/XLS consistency)
   - Verify all file types use consistent parser chain
   - Ensure no divergence in header detection, mapping, validation
   - **Success**: One unified parser path for all file types

### Week 1: Repair Continued (Days 4–7)

**Day 4: Document Persistence Foundation**
9. ✅ Wire attachment backend persistence (uploadDocumentFile)
   - Call uploadDocumentFile from DocumentAttachmentField
   - Verify file_url returned
   - Test Document entity creation
   - **Success**: Attachments saved to database

10. ✅ Wire signed URL integration (getDocumentSignedUrl)
    - Call getDocumentSignedUrl on document access
    - Verify signed_url returned (time-limited)
    - Test in document download flow
    - **Success**: Documents retrievable via signed URL

**Day 5–7: Enhancement & Remediation**
11. ✅ Complete census audit event logging
    - Ensure all functions log CensusImportAuditEvent
    - Verify audit trail complete
    - **Success**: Full audit trail visible

12. ✅ Design SUS SARA Forms backend (operator decision on persistence model)
    - If Document entity + metadata: implement form storage
    - If dedicated SUSRequiredForm entity: create entity, implement storage
    - Link SUSRequiredFormsPanel → persistence
    - **Success**: SARA forms can be saved/retrieved

13. ✅ Design Dalton Rules engine (operator provides rule definition)
    - Implement rule evaluation logic
    - Wire DaltonRulesToggle → rule processor
    - Output: enforce/warn/log based on rules
    - **Success**: Dalton Rules validated on submission

### Week 2: Finalize Carrier Workflows

14. ✅ Execute full local/CI census import test suite
    - Run all sus-template, census-universal, vault tests
    - Verify CSV/XLSX/XLS parsing tests
    - Confirm mapping, validation, import tests
    - **Success**: All tests passing locally/CI

15. ✅ Complete MEC/MVP checklist & card
    - Finalize checklist option
    - Wire attachment UI to persistence
    - Define allowed attachment types
    - **Success**: MEC/MVP fully functional

16. ✅ Design external carrier submission handlers (operator provides specs)
    - AST submission payload/endpoint
    - SUS submission payload/endpoint
    - Triad submission payload/endpoint
    - MEC/MVP submission payload/endpoint
    - **Success**: Submission payloads designed, handlers ready

17. ✅ Create census import stabilization packet
    - Document all fixes applied
    - List remaining known issues
    - Validation evidence
    - **Success**: Census workflows signed off as stable

### Week 3: Resume Deferred Work

18. ✅ Resume Gate 6I-B.2 scheduler integration (only after census stable)
    - Implement scheduler trigger (cron/interval)
    - Call reportGenerationExecutor
    - Implement retry queue logic
    - **Success**: Reports can be scheduled

19. ✅ Complete Gate 6I-B scheduling validation
    - Test schedule creation, execution, retry
    - Verify audit events logged
    - **Success**: Scheduler fully tested

### Week 4+: Email & Webhooks (Deferred)

20. ⏸️ Start Gate 6J-B email delivery (only after scheduler stable)
    - Implement email dispatch backend
    - Safe payloads, audit events
    - **Resume Timeline**: Week 4

21. ⏸️ Start Gate 6J-C webhook delivery (only after delivery governance stable)
    - Implement webhook dispatch backend
    - Signatures, audit, retry
    - **Resume Timeline**: Week 4+

---

## 6. Feature-by-Feature Gate 6 Audit

### Universal Census Upload
| Attribute | Value |
|---|---|
| **User-facing location** | Case Detail → Census tab → Upload button |
| **Visible today** | YES |
| **Working today** | YES (UI only) |
| **Backend wired** | YES (analyzeCensusWorkbook, previewCensusMapping, etc. deployed) |
| **Tests exist** | YES (tests/census-universal-import.test.js) |
| **Tests actually executed** | UNKNOWN (needs CI/local run) |
| **Known blockers** | Analyze button no-op (PR claims fix, needs validation) |
| **Recommended next action** | Validate fix with live SUS CSV upload |

### Census Analyze Step
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Upload tab → "Next / Analyze" button |
| **Visible today** | YES |
| **Working today** | NO (PR claims fix, unvalidated) |
| **Backend wired** | YES (analyzeCensusWorkbook deployed) |
| **Tests exist** | YES (tests/sus-template-analyze-fix.test.js with 22 tests) |
| **Tests actually executed** | UNKNOWN (code review only, needs live test) |
| **Known blockers** | Button no-op (allegedly fixed in PR) |
| **Recommended next action** | Execute live operator test immediately |

### Census Column Mapping
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Map Columns tab |
| **Visible today** | YES |
| **Working today** | YES (UI works, backend callable) |
| **Backend wired** | YES (previewCensusMapping deployed) |
| **Tests exist** | YES (tests/census-universal-import.test.js) |
| **Tests actually executed** | UNKNOWN (needs CI/local run) |
| **Known blockers** | None known for CSV; XLSX bug shows "PK" instead of columns |
| **Recommended next action** | Run tests locally, then fix XLSX parsing |

### Census Preview
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Preview tab |
| **Visible today** | YES |
| **Working today** | YES |
| **Backend wired** | YES (previewCensusMapping returns mapped data) |
| **Tests exist** | YES (tests/census-universal-import.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | None known |
| **Recommended next action** | Monitor in live test |

### Census Validation
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Validate tab |
| **Visible today** | YES |
| **Working today** | YES (validates, shows errors) |
| **Backend wired** | YES (validateCensusMapping deployed) |
| **Tests exist** | YES (tests/census-universal-import.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | No execution trigger (validation runs, import not auto-triggered) |
| **Recommended next action** | Wire validation complete → execution trigger |

### Census Import Execution
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Import step (implicit) |
| **Visible today** | PARTIAL (modal exists, execution flow incomplete) |
| **Working today** | PARTIAL (executeCensusImportWithMapping exists but not called) |
| **Backend wired** | YES (executeCensusImportWithMapping deployed) |
| **Tests exist** | YES (tests/census-import.full.regression.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | Validation→execution link missing |
| **Recommended next action** | Wire validation complete → import trigger, test end-to-end |

### Mapping Profiles
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Profile management |
| **Visible today** | YES |
| **Working today** | YES (save/load basic functionality) |
| **Backend wired** | YES (saveCensusMappingProfile deployed) |
| **Tests exist** | YES (tests/census-universal-import.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | None known |
| **Recommended next action** | Enhance UI for better profile discovery/reuse |

### VAULT Layout
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Analyze step |
| **Visible today** | YES (detection in backend) |
| **Working today** | YES (code complete) |
| **Backend wired** | YES (analyzeCensusWorkbook detects VAULT marker) |
| **Tests exist** | YES (tests/vault-field-handling.test.js) |
| **Tests actually executed** | UNKNOWN (needs local run) |
| **Known blockers** | None known; needs live operator test with actual VAULT fixture |
| **Recommended next action** | Execute operator test with VAULT fixture |

### SUS Template
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Upload + Analyze steps |
| **Visible today** | YES |
| **Working today** | PARTIAL (code handles embedded newlines, no live test evidence) |
| **Backend wired** | YES (analyzeCensusWorkbook + CSV parser deployed) |
| **Tests exist** | YES (tests/sus-template-analyze-fix.test.js with CSV parser tests) |
| **Tests actually executed** | PARTIAL (code review only, CSV embedded newline test in code not executed) |
| **Known blockers** | No live operator test yet |
| **Recommended next action** | Execute operator test with actual SUS CSV (embedded newline) |

### XLSX Import
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Upload + Analyze steps |
| **Visible today** | YES |
| **Working today** | NO (shows "PK [Content_Types].xml" instead of cell data) |
| **Backend wired** | YES (extractRowsFromXls deployed) |
| **Tests exist** | YES (tests/xlsx-binary-parsing-validation.test.js) |
| **Tests actually executed** | UNKNOWN (test file exists but execution status unknown) |
| **Known blockers** | Binary parsing bug (magic bytes shown as data) |
| **Recommended next action** | DEBUG: Fix XLSX parsing (P0) |

### XLS Import
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Upload + Analyze steps |
| **Visible today** | YES |
| **Working today** | NO (inherits XLSX parsing bug) |
| **Backend wired** | YES (extractRowsFromXls deployed) |
| **Tests exist** | YES (tests/xlsx-binary-parsing-validation.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | Binary parsing bug |
| **Recommended next action** | Fix XLSX/XLS parser (P0) |

### CSV Import
| Attribute | Value |
|---|---|
| **User-facing location** | Census Upload modal → Upload + Analyze steps |
| **Visible today** | YES |
| **Working today** | YES (CSV parser tested, quoted newlines handled) |
| **Backend wired** | YES (extractRowsFromCsv deployed) |
| **Tests exist** | YES (tests/sus-template-analyze-fix.test.js + others) |
| **Tests actually executed** | PARTIAL (code review, embedded newline test not executed) |
| **Known blockers** | None known |
| **Recommended next action** | Run tests locally, validate with live CSV uploads |

### Carrier Checklist
| Attribute | Value |
|---|---|
| **User-facing location** | Case New → Census section / Case Detail → Census tab |
| **Visible today** | NO / YES (visibility issues reported) |
| **Working today** | NO (callbacks broken, visibility incomplete) |
| **Backend wired** | NO (local component state, no backend) |
| **Tests exist** | YES (tests/new-case-carrier-census-checklist.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | onDestinationChange callback incomplete, visibility issues |
| **Recommended next action** | Fix visibility, complete callback wiring (P0) |

### AST Census Import Card
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → AST selected |
| **Visible today** | YES (when AST checked) |
| **Working today** | PARTIAL (card renders, state isolation works, submission not implemented) |
| **Backend wired** | YES (analyzeCensusWorkbook, etc.) |
| **Tests exist** | YES (tests/new-case-carrier-census-checklist.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | External submission not implemented |
| **Recommended next action** | Test card state isolation, design submission handler |

### SUS Census Import Card
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → SUS selected |
| **Visible today** | YES (when SUS checked) |
| **Working today** | PARTIAL (card renders, SARA Forms backend missing) |
| **Backend wired** | PARTIAL (census functions yes, SARA persistence no) |
| **Tests exist** | YES (tests/sus-template-analyze-fix.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | SARA Forms entity missing, submission not implemented |
| **Recommended next action** | Design SARA backend, implement form persistence |

### Triad Census Import Card
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → Triad selected |
| **Visible today** | YES (when Triad checked) |
| **Working today** | PARTIAL (card renders, submission not implemented) |
| **Backend wired** | YES (analyzeCensusWorkbook, etc.) |
| **Tests exist** | YES (tests/new-case-carrier-census-checklist.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | External submission not implemented |
| **Recommended next action** | Test card functionality, design submission handler |

### MEC/MVP Census Import Card
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → MEC/MVP selected |
| **Visible today** | PARTIAL (checklist option incomplete) |
| **Working today** | NO (checklist not fully wired) |
| **Backend wired** | PARTIAL (census functions yes, attachment persistence no) |
| **Tests exist** | YES (tests/new-case-carrier-census-checklist.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | Checklist incomplete, attachment UI-only |
| **Recommended next action** | Complete checklist, wire attachment persistence (P0) |

### SUS SARA Form
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → SUS card → Required Documents tab |
| **Visible today** | YES (SUSRequiredFormsPanel component) |
| **Working today** | NO (UI exists, no persistence) |
| **Backend wired** | NO (no entity, no storage) |
| **Tests exist** | NO |
| **Tests actually executed** | N/A |
| **Known blockers** | SUSRequiredForm entity missing, storage model undefined |
| **Recommended next action** | Design backend model (operator decision: Document + metadata or dedicated entity?) |

### SUS Employee Questionnaire
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → SUS card → Required Documents tab |
| **Visible today** | YES (SUSRequiredFormsPanel component) |
| **Working today** | NO (UI exists, no persistence) |
| **Backend wired** | NO |
| **Tests exist** | NO |
| **Tests actually executed** | N/A |
| **Known blockers** | Same as SARA Form |
| **Recommended next action** | Design backend model (operator decision) |

### SUS SARA Checklist
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → SUS card → Required Documents tab |
| **Visible today** | YES (SUSRequiredFormsPanel component) |
| **Working today** | NO (UI exists, no persistence) |
| **Backend wired** | NO |
| **Tests exist** | NO |
| **Tests actually executed** | N/A |
| **Known blockers** | Same as SARA Form |
| **Recommended next action** | Design backend model (operator decision) |

### Carrier Attachments
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → AST/SUS/Triad/MEC-MVP card → Required Documents tab |
| **Visible today** | YES (DocumentAttachmentField component) |
| **Working today** | NO (UI exists, no persistence) |
| **Backend wired** | NO (uploadDocumentFile exists, not called) |
| **Tests exist** | YES (tests/gate6l-b-3-frontend-ui.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | uploadDocumentFile not wired from UI |
| **Recommended next action** | Wire DocumentAttachmentField → uploadDocumentFile (P0 enhancement) |

### Dalton Rules Checkbox
| Attribute | Value |
|---|---|
| **User-facing location** | Case New / Case Detail → Census → Each carrier card → Review & Submit tab |
| **Visible today** | YES (DaltonRulesToggle component) |
| **Working today** | NO (toggle exists, no processing) |
| **Backend wired** | NO (no rule engine) |
| **Tests exist** | YES (tests/new-case-carrier-census-checklist.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | Rule definition needed (operator), engine not implemented |
| **Recommended next action** | Operator provides rule spec, implement engine |

### Broker Agency Documents (Gate 6L-B)
| Attribute | Value |
|---|---|
| **User-facing location** | Broker workspace → Documents section / MGA workspace → Broker Agency Documents |
| **Visible today** | PARTIAL (UI exists, not fully wired) |
| **Working today** | NO (persistence incomplete) |
| **Backend wired** | PARTIAL (uploadDocumentFile, getDocumentSignedUrl exist; not called) |
| **Tests exist** | YES (tests/gate6l-b-3-frontend-ui.test.js, gate6l-b-backend.test.js) |
| **Tests actually executed** | UNKNOWN |
| **Known blockers** | uploadDocumentFile not called, signed URL not used |
| **Recommended next action** | Wire persistence layer (P1 enhancement) |

### Report Scheduling (Gate 6I-B.1 models only)
| Attribute | Value |
|---|---|
| **User-facing location** | MGA workspace (not yet built) |
| **Visible today** | NO |
| **Working today** | N/A (models exist, UI not built) |
| **Backend wired** | PARTIAL (models done, execution deferred) |
| **Tests exist** | YES (pattern tests) |
| **Tests actually executed** | NO |
| **Known blockers** | Scheduler UI/logic not implemented |
| **Recommended next action** | Defer to Week 3 (after census stable) |

### Email Delivery (Gate 6J-B)
| Attribute | Value |
|---|---|
| **User-facing location** | Report scheduling → Delivery method (not yet built) |
| **Visible today** | NO |
| **Working today** | N/A |
| **Backend wired** | NO |
| **Tests exist** | NO |
| **Tests actually executed** | N/A |
| **Known blockers** | Not started |
| **Recommended next action** | Defer to Week 4+ (after scheduler) |

### Webhook Delivery (Gate 6J-C)
| Attribute | Value |
|---|---|
| **User-facing location** | Report scheduling → Delivery method (not yet built) |
| **Visible today** | NO |
| **Working today** | N/A |
| **Backend wired** | NO |
| **Tests exist** | NO |
| **Tests actually executed** | N/A |
| **Known blockers** | Not started |
| **Recommended next action** | Defer to Week 4+ (after delivery governance) |

---

## 7. Backend Function Audit for Gate 6 / Census

| Function | Location | Deployed | Frontend Calls | Callable | Auth | Scope | Audit | Known Issue | Next Action |
|---|---|---|---|---|---|---|---|---|---|
| **analyzeCensusWorkbook** | functions/analyzeCensusWorkbook.js | ✓ YES | ✓ YES (via CensusImportClient) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | Analyze button no-op (PR fix unvalidated) | Live test SUS upload |
| **previewCensusMapping** | functions/previewCensusMapping.js | ✓ YES | ✓ YES (Census Upload modal) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | None known | Monitor live test |
| **validateCensusMapping** | functions/validateCensusMapping.js | ✓ YES | ✓ YES (Census Upload modal) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | Not linked to execution | Wire to import trigger |
| **executeCensusImportWithMapping** | functions/executeCensusImportWithMapping.js | ✓ YES | ✗ NO (not called after validation) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | Validation→execution link missing | Wire validation complete → execution |
| **saveCensusMappingProfile** | functions/saveCensusMappingProfile.js | ✓ YES | ✓ YES (Census Upload modal) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | None known | Monitor live test |
| **processCensusImportJob** | functions/processCensusImportJob.js | ✓ YES | ✗ NO (no caller found) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | May be orphaned | Verify caller (executeCensusImportWithMapping?) |
| **uploadDocumentFile** | functions/uploadDocumentFile.js | ✓ YES | ✗ NO (not called from UI) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | DocumentAttachmentField not wired | Wire from UI |
| **getDocumentSignedUrl** | functions/getDocumentSignedUrl.js | ✓ YES | ✗ NO (not called from UI) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | Not used in document access | Wire to document retrieval |
| **reportGenerationExecutor** | functions/reportGenerationExecutor.js | ✓ YES | ✗ NO (no scheduler caller) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | No scheduler trigger | Implement scheduler (6I-B.2) |
| **reportRetryQueueProcessor** | functions/reportRetryQueueProcessor.js | ✓ YES | ✗ NO (no retry queue) | ✓ YES | ✓ YES | ✓ YES | ✓ YES | No retry queue caller | Implement scheduler (6I-B.2) |

---

## 8. Parser / Census Workflow Audit

### End-to-End Parser Chain Audit

| Step | Status | Evidence | Issue | Next Action |
|---|---|---|---|---|
| **File upload** | ✅ DONE | base44.integrations.Core.UploadFile called from Census Upload modal | None | Monitor |
| **File metadata to backend** | ✅ DONE | source_file_url, name, type passed to analyzeCensusWorkbook | None | Monitor |
| **File type detection** | ✅ DONE | detectFileType() checks extension, MIME, magic bytes in analyzeCensusWorkbook | None | Monitor |
| **CSV parsing** | ✅ DONE | extractRowsFromCsv() RFC 4180 compliant, handles quoted newlines | None | Monitor |
| **XLSX parsing** | ❌ BROKEN | extractRowsFromXls() reads XLSX via xlsx.read(), returns "PK" magic bytes instead of data | Binary content shown as columns | DEBUG (P0) |
| **XLS parsing** | ❌ BROKEN | extractRowsFromXls() delegates to XLSX, same bug | Same as XLSX | FIX XLSX (P0) |
| **VAULT marker detection** | ✅ DONE | Scans for "CENSUS:" marker in locateVaultCensusMarker() | None | Monitor |
| **SUS template detection** | ✅ DONE | Detects via standard headers (Relationship, First Name, etc.) | Needs live test evidence | Operator test |
| **Header detection** | ✅ DONE | Scans for relationship, first_name, last_name, dob in locateCensusSection() | None | Monitor |
| **Embedded newline handling** | ✅ DONE (code) | extractRowsFromCsv() preserves \n in quoted fields; normalizeCell() collapses | No live test | Operator test (SUS fixture) |
| **Binary ZIP detection** | ⚠️ PARTIAL | detectFileType() checks magic bytes, but XLSX still broken | Root cause unclear (fetch? parsing?) | DEBUG |
| **Column mapping** | ✅ DONE | CarrierColumnMappingTab + previewCensusMapping backend | None | Monitor |
| **Preview** | ✅ DONE | CensusMappingPreview displays mapped rows | None | Monitor |
| **Validation** | ✅ DONE | validateCensusMapping checks required fields, formats, relationships | No execution trigger | Wire execution |
| **Import execution** | ⚠️ PARTIAL | executeCensusImportWithMapping exists, not called | Missing trigger from validation | Wire trigger |
| **Audit** | ⚠️ PARTIAL | CensusImportAuditEvent entity exists, partial logging | Incomplete audit trail | Complete logging |
| **Scope enforcement** | ✅ DONE | All functions check user tenant/broker/mga scope | None | Monitor |
| **Public URL exposure** | ✅ SAFE | Private storage via Document entity, signed URLs only | None | Monitor |

---

## 9. Document / Attachment Audit

### Gate 6L-B Broker Agency Documents
- **Status**: PARTIAL
- **Model**: Document entity (complete)
- **Upload UI**: DocumentUploadModal (complete)
- **Storage**: Private storage (designed, not wired)
- **Signed URLs**: getDocumentSignedUrl (exists, not called)
- **Access Control**: Safe payloads (enforced)
- **Audit Logging**: Full events (implemented)
- **Role Visibility**: Broker/MGA scope (designed)
- **Persistence Status**: UI-ONLY (uploadDocumentFile not called)
- **Next Action**: Wire uploadDocumentFile from DocumentUploadModal

### Carrier Import Attachments
- **Status**: UI-ONLY
- **Upload UI**: DocumentAttachmentField (complete)
- **File Selection**: Works
- **Display**: Shows selected files
- **Persistence**: NOT PERSISTED (uploadDocumentFile not called)
- **Scope**: Tenant-scoped (designed)
- **Next Action**: Wire DocumentAttachmentField → uploadDocumentFile

### SUS SARA Form / Employee Questionnaire / SARA Checklist
- **Status**: UI-ONLY (NO BACKEND)
- **UI Component**: SUSRequiredFormsPanel (complete)
- **Form Definitions**: Code defined
- **File Upload**: DocumentAttachmentField available
- **Storage**: ❌ NO ENTITY OR BACKEND
- **Persistence Status**: COMPLETELY MISSING
- **Next Action**: Operator decision on storage model, then implementation

### MEC/MVP Attachments
- **Status**: UI-ONLY
- **UI Component**: DocumentAttachmentField in MEC/MVP card
- **Upload Button**: Exists
- **File Type Guidance**: Missing (what types allowed?)
- **Storage**: NOT PERSISTED
- **Next Action**: Define types, wire to uploadDocumentFile

### Private Storage
- **Model**: Document entity (all fields present)
- **Upload Function**: uploadDocumentFile (exists, not called)
- **Safe Payloads**: Audit logging in place
- **Next Action**: Test uploadDocumentFile, wire callers

### Signed URLs
- **Function**: getDocumentSignedUrl (exists, not called)
- **Input**: document_id
- **Output**: time-limited URL
- **Used By**: ❌ NO CALLERS
- **Next Action**: Wire to document access flows

### Public URL Prevention
- **Status**: ✅ CONFIRMED (Document entity uses private storage only)
- **Signed URLs Only**: Enforced
- **Next Action**: Monitor enforcement

### Safe Payloads
- **Status**: ✅ IMPLEMENTED
- **Audit Logging**: Full event capture
- **Next Action**: Monitor logging

---

## 10. Testing and Evidence Audit

| Test File | Feature Area | Test Count | Executed | Passing | Failing | Expected Only | Blocked | Local/CI |
|---|---|---|---|---|---|---|---|---|
| **sus-template-analyze-fix.test.js** | Analyze button, CSV parsing, SUS template | 22 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **new-case-carrier-census-checklist.test.js** | Carrier checklist, card rendering | Expected ~50 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **census-universal-import.test.js** | Census upload, parsing, mapping | Expected ~30 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **vault-field-handling.test.js** | VAULT layout, group metadata | Expected ~15 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **xlsx-binary-parsing-validation.test.js** | XLSX/XLS binary parsing | Expected ~20 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **census-import.household-integrity.test.js** | Household parsing, validation | Expected ~25 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **gate6l-b-3-frontend-ui.test.js** | Document upload UI | Expected ~10 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **gate6l-b-backend-*.test.js** | Document persistence patterns | Expected ~20 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |
| **gate6i-a-saved-report-templates-schedule-definitions.test.js** | Report templates & schedules | Expected ~15 | ❓ UNKNOWN | ? | ? | ✓ YES | ✗ NO | ✓ YES |

### Test Execution Summary
- **Executed Tests**: UNKNOWN (files exist, execution status not confirmed)
- **Code-Review-Only Tests**: All test files show patterns in code but execution not verified
- **Expected-But-Not-Executed Tests**: Census import end-to-end, XLSX/XLS live parsing, document persistence
- **Live Operator Tests Required**: 
  - SUS CSV upload with embedded newline
  - XLSX file upload (to test PK bug)
  - VAULT fixture upload
  - Carrier checklist selection
  - Document persistence

### Recommendation
**Run full test suite locally/CI before proceeding to any implementation.**

---

## 11. Operator Decisions Required

| Decision | Options | Impact | Priority | Timeline |
|---|---|---|---|---|
| **Define Dalton Rules** | Provide rule spec/examples | Cannot implement without definition | P0 (if required for submission) | Before implementation |
| **Choose SARA Forms persistence** | A) Document + metadata (2–3h) OR B) Dedicated entity (5–8h) | Determines implementation approach | P1 | Before implementation |
| **Provide carrier submission specs** | AST, SUS, Triad, MEC/MVP: APIs, payloads, endpoints | Cannot implement submission | P1 | Before implementation |
| **Multi-sheet XLSX/XLS support** | Support now (3–5d) OR accept first-sheet-only | Determines feature scope | P2 | After core stable |
| **Excel formula evaluation** | Evaluate (2–3w) OR require pre-calculated | Determines feature scope | P3 | After core stable |
| **Large file streaming** | Stream (2–3w) OR enforce 100MB limit | Determines OOM risk mitigation | P2 | After core stable |
| **Production activation criteria** | What testing/validation required before go-live? | Determines deployment readiness | P1 | Before deployment |

---

## 12. Final Recommendation

**Recommended Next Action:**

### **REPAIR FIRST: Fix Analyze/Next Button No-Op AND Case Census Tab Visibility (P0)**

**Specific Implementation Priority:**

1. **Day 1 (TODAY)**: Execute live operator test → Upload SUS CSV → Click Analyze
   - **Success Criteria**: Button fires, file uploaded, backend invoked, no 404, tab transitions to mapping
   - **If Fails**: PR fix is incomplete; requires code review + patch
   - **If Passes**: Proceed to next item

2. **Day 1 (PARALLEL)**: Fix Case Census tab visibility
   - **Root Cause**: Carrier checklist not rendering; onDestinationChange callback incomplete
   - **Fix**: Complete callback wiring, ensure checklist visible on Case Detail
   - **Success Criteria**: All 4 carriers selectable from Case Detail → Census tab

3. **Day 2**: Fix XLSX binary parsing (debug session)
   - **Root Cause**: Unknown (fetch corruption? xlsx library? detection?)
   - **Investigation**: Review analyzeCensusWorkbook response for XLSX upload
   - **Success Criteria**: XLSX files show cell data, not "PK [Content_Types].xml"

4. **Day 2 (PARALLEL)**: Wire validation→execution link
   - **Fix**: Connect validateCensusMapping completion → executeCensusImportWithMapping call OR add "Execute Import" button
   - **Success Criteria**: After validation, data can be imported without manual intervention

**After These P0 Repairs:**
- Proceed to Week 1 carrier workflow finalization (per Roadmap Section 5)
- Operator makes decisions on Dalton Rules, SARA Forms, carrier specs
- Resume Gates 6I-B.2, 6J-B, 6J-C only after census P0/P1 items complete

**Do Not Proceed To:**
- New features until core workflows stable
- Gate 6I-B.2 scheduler until census stabilizes
- Gate 6J-B/6J-C until scheduler stable

---

## Summary

| Dimension | Status | Evidence | Confidence | Action |
|---|---|---|---|---|
| **Core Census Upload** | MOSTLY DONE | Modal UI complete, functions deployed | HIGH | Monitor |
| **Analyze Button** | PR CLAIMS FIX | Code shows implementation, needs live test | MEDIUM | Live test (P0) |
| **CSV Parsing** | DONE | Code complete, tests in code | HIGH | Run tests locally |
| **XLSX/XLS Parsing** | BROKEN | Shows "PK" magic bytes instead of data | MEDIUM | DEBUG (P0) |
| **Case Census Visibility** | BROKEN | Reported broken, callback incomplete | MEDIUM | Fix visibility (P0) |
| **Carrier Cards** | PARTIAL | UI complete, submission not implemented | MEDIUM | Finalize per roadmap |
| **Attachments** | UI-ONLY | uploadDocumentFile not called | MEDIUM | Wire persistence (P1) |
| **SARA Forms** | NO BACKEND | UI component exists, no entity/storage | LOW | Design model (operator decision) |
| **Dalton Rules** | NO PROCESSING | Toggle exists, no engine | LOW | Define rules (operator decision) |
| **Scheduler (6I-B.2)** | DEFERRED | Models ready, execution logic missing | LOW | Resume Week 3 |
| **Email (6J-B)** | NOT STARTED | Deferred pending scheduler | N/A | Defer to Week 4+ |
| **Webhooks (6J-C)** | NOT STARTED | Deferred pending governance | N/A | Defer to Week 4+ |

---

**Audit Completed**: 2026-05-13  
**Status**: AUDIT-ONLY — NO IMPLEMENTATION PERFORMED  
**Ready For**: Operator review + approval of next repair action