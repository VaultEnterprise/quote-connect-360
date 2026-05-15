# Census Import Full Audit

Date: 2026-05-01  
Scope: New Case workflow census import pipeline, from upload through downstream usage  
Audit mode: Read + Validate + Evidence-based code trace  
Status: Completed audit report

---

## Executive Summary

The current census import flow is **client-heavy, version-based, and partially validated before persistence**. It successfully creates `CensusVersion` and `CensusMember` records linked to a case and feeds downstream UI, quote readiness, and enrollment lookups. However, the audit found several material gaps.

### Overall Conclusion
- **Data linkage to case and version is implemented correctly**.
- **Versioning exists** and avoids overwrite behavior.
- **File persistence exists**, but reprocessing from stored file is **not implemented**.
- **Validation is present but incomplete**.
- **CSV parsing is fragile** and likely to corrupt quoted-comma rows.
- **Duplicate prevention/idempotency on retry is not enforced**.
- **Security model is frontend-direct for entity writes**, which is a notable risk depending on entity rules.
- **Large-file processing is entirely client-side**, which is a performance/scalability risk.

---

## Severity Summary

### CRITICAL
1. CSV parser uses naive `split(",")`, causing field corruption for quoted commas.
2. No true reprocessing flow from stored file despite file persistence requirement.
3. No idempotency or retry protection; re-importing same file creates duplicate members/versions.
4. No explicit tenant/cross-tenant enforcement visible in the import path.

### HIGH
5. Import proceeds even when validation errors exist; blocking errors are stored as imported members.
6. Duplicate detection is advisory only and only within the current upload set.
7. File persistence risk remains for re-use because there is no verification/recovery flow if `file_url` becomes invalid.
8. No server-side processing for large files; 5k+ rows likely degrade UX and browser stability.

### MEDIUM
9. Missing support for dependents as first-class records/entities in import.
10. Mapping inventory does not include plan fields requested in audit scope.
11. Limited format/business-rule validation (ZIP, SSN, DOB validity, required case-specific rules).
12. Status messaging is good at summary level but lacks persistent import job/state tracking.

### LOW
13. Mapping profiles are stored in localStorage only.
14. Done state can overstate imported count by showing original row count rather than effective imported rows after skips.

---

## 1. Full Process Diagram (Step-by-Step)

```text
New Case created
  -> User navigates to /cases/{id}
  -> Census tab opens CensusUploadModal
  -> User selects CSV file
  -> FileReader reads file in browser as text
  -> parseCSV() parses headers + rows in browser
  -> autoMap() attempts CSV-to-schema column matching
  -> User reviews/edits field mapping
  -> buildValidationSummary(), analyzeDataQuality(), detectDuplicates()
  -> User proceeds to import
  -> UploadFile integration stores original file and returns file_url
  -> CensusVersion.create() persists version record linked to case_id
  -> buildVersionedSnapshotRows() transforms rows into canonical CensusMember payloads
  -> CensusMember.bulkCreate() inserts rows in batches of 50
  -> buildVersionSummary() computes final status and counts
  -> CensusVersion.update() finalizes version metrics/status
  -> BenefitCase.update() updates census_status and stage
  -> ActivityLog.create() records import action
  -> UI invalidates queries and displays version/member data
  -> Downstream consumers query CensusVersion/CensusMember by case/version
```

---

## 2. Files / Functions Involved

### Primary import UI and orchestration
- `components/census/CensusUploadModal`
- `components/cases/CaseCensusTab`
- `pages/Census`
- `pages/CaseDetail`

### Parsing / mapping / validation
- `components/census/censusEngine`
- `components/census/censusSnapshotEngine`
- `utils/censusHelpers.js`
- `components/census/ErrorDetailPanel`
- `components/census/DuplicateDetectionPanel`
- `components/census/TransformPreview`
- `components/census/MappingProfileManager`

### Downstream consumers
- `components/cases/txQuoteWorkflow`
- `components/cases/txQuoteEngine`
- `components/quotes/quoteEngine`
- `components/employee/useEnrollmentExecutionData`
- `components/census/CensusReadinessPanel`
- `components/census/CensusVersionHistory`
- `components/census/CensusSystemSummary`
- `components/census/CensusMemberTable`

### Storage / platform access
- `api/base44Client.js`
- `base44.integrations.Core.UploadFile`
- direct frontend entity calls:
  - `base44.entities.CensusVersion.create/update`
  - `base44.entities.CensusMember.bulkCreate`
  - `base44.entities.BenefitCase.update`
  - `base44.entities.ActivityLog.create`

---

## 3. Validation Rules Inventory

### Required fields
From `components/census/censusEngine`:
- `first_name` required
- `last_name` required

### Format / normalization validation
- Email regex warning only
- DOB regex warning only after normalization attempt
- Negative `hours_per_week` => error
- Negative `annual_salary` => error
- Missing canonical identity => error

### Derived normalization rules
- Gender normalized to `male | female | other`
- Employment status normalized to `active | leave | terminated`
- Employment type normalized to `full_time | part_time | contractor`
- Coverage tier normalized to employee-only/spouse/children/family
- Eligibility derived from:
  - active
  - not contractor
  - hours_per_week >= 30

### Missing validation coverage
- ZIP format validation absent
- SSN last4 validation absent
- State code validation absent
- True DOB validity absent (regex pass can still allow impossible dates)
- Duplicate validation against existing historical imports absent
- Business-rule validation for dependents absent
- Plan-field validation absent

---

## 4. Mapping Table (CSV -> Schema)

### Implemented mapping fields
| CSV/Internal Key | Internal CensusMember field | Evidence |
|---|---|---|
| employee_id | employee_id | `transformRow()` |
| first_name | first_name | `transformRow()` |
| last_name | last_name | `transformRow()` |
| date_of_birth / dob | date_of_birth | `transformRow()` + automap hints |
| gender | gender | `transformRow()` |
| email | email | `transformRow()` |
| phone | phone | `transformRow()` |
| ssn_last4 | ssn_last4 | `transformRow()` |
| hire_date | hire_date | `transformRow()` |
| employment_status | employment_status | `transformRow()` |
| employment_type | employment_type | `transformRow()` |
| hours_per_week | hours_per_week | `transformRow()` |
| annual_salary | annual_salary | `transformRow()` |
| job_title | job_title | `transformRow()` |
| department | department | `transformRow()` |
| address | address | `transformRow()` |
| city | city | `transformRow()` |
| state | state | `transformRow()` |
| zip | zip | `transformRow()` |
| coverage_tier | coverage_tier | `transformRow()` |
| dependent_count | dependent_count | `transformRow()` |
| class_code | class_code | `transformRow()` |

### Audit scope gaps
Requested but **not implemented as explicit mappings**:
- `employee_name` as a single input field split into first/last
- plan fields
- dependent data as structured dependent rows/records

### Finding
**MEDIUM** — Mapping scope does not fully match requested audit target schema coverage.

---

## 5. Upload & Storage Audit

### What happens
In `CensusUploadModal.handleImport()`:
1. `UploadFile({ file })` stores file
2. returned `file_url` is saved into `CensusVersion.file_url`

### What is correct
- File is uploaded once per import operation.
- File URL is persisted with the version record.
- Version record links stored file to `case_id`.

### Gaps
- No dedupe/hash check before upload.
- Same source file uploaded repeatedly creates separate stored copies.
- No verification step that stored file remains accessible later.
- No reprocess flow uses `file_url`.

### Findings
- **HIGH** — No duplicate storage prevention for same file.
- **HIGH** — File retrieval for reprocess not implemented.
- **CRITICAL** — Stored file persistence exists, but operational requirement “reprocess from stored file” is unmet.

---

## 6. Parsing & Extraction Audit

### Current parser
`parseCSV(text)`:
- `text.trim().split(/\r?\n/)`
- first line becomes headers via `split(",")`
- each row parsed using `split(",")`

### What works
- Simple CSV without quoted commas
- Basic header extraction
- Blank-row filtering

### What fails / risks
- Quoted fields containing commas break alignment
- Escaped quotes are not handled
- Embedded newlines in quoted fields are not handled
- Encoding/BOM handling is not explicit
- Header normalization is basic but acceptable

### Evidence
The parser never uses a CSV library and does not implement quoted-field state parsing.

### Findings
- **CRITICAL** — Silent field shifts/data corruption possible for standard CSV formats with commas in quoted values.
- **MEDIUM** — Encoding issues not explicitly handled.
- **MEDIUM** — Extra columns are tolerated structurally but not explicitly governed/documented.

---

## 7. Field Mapping Audit

### Strengths
- Automap hints are reasonably broad.
- Manual override mapping exists.
- Preview UI exists.

### Risks
- If parser misaligns columns, mapping preview can still appear superficially valid.
- No validation ensuring mapped source column semantics beyond user inspection.
- Single-field required set is too small for reliable employee identity.

### Findings
- **HIGH** — Silent data shifts possible due to parser + mapping combination.
- **MEDIUM** — Mapping confidence is manual; no semantic validation layer.

---

## 8. Validation Logic Audit

### Implemented behavior
Validation is computed before import and then preserved onto member records as `validation_issues` and `validation_status`.

### Important observed behavior
Errors do **not** block import. The UI explicitly says rows with errors will still be imported with `has_errors` status.

### Strengths
- Partial success is supported.
- Row-level issue visibility exists.
- Warnings/errors are preserved in stored records.

### Risks
- Blocking/invalid rows still become canonical members.
- No hard-stop threshold.
- No validation against existing database duplicates.
- No row-level import rejection log distinct from accepted records.

### Findings
- **HIGH** — Invalid rows are still persisted into the canonical member table.
- **HIGH** — Duplicate prevention is not enforced, only suggested.
- **MEDIUM** — Validation coverage is incomplete for ZIP/SSN/state/date/business logic.

---

## 9. Database Writes Audit

### Entities actually written
- `CensusVersion`
- `CensusMember`
- `BenefitCase`
- `ActivityLog`

### What is correct
- `case_id` is applied to version and member rows.
- `census_version_id` is applied to member rows.
- Version batching for member insert exists (`bulkCreate` in chunks of 50).
- Version summary updates occur after insert.

### What is missing
- No transaction boundary across version create + member inserts + version update + case update.
- Partial failures could leave inconsistent state.
- No cleanup rollback on mid-import failure.
- No idempotency key / no duplicate suppression.
- No dependent entity writes exist.

### Findings
- **HIGH** — Partial failure can leave orphan/incomplete import state.
- **HIGH** — Retry creates duplicates.
- **MEDIUM** — Dependents are represented only as `dependent_count`, not actual dependent records.

---

## 10. Case Integration Audit (Critical)

### What is correct
- `CaseNew` creates a case and routes to `/cases/{id}`.
- `CaseCensusTab` opens `CensusUploadModal` with `caseId`.
- Imported `CensusVersion` and `CensusMember` rows are linked to `case_id`.
- Multiple imports create incrementing `version_number`.

### Multiple import behavior
- Versioning, not overwrite.
- Latest version is generally inferred by highest `version_number`.
- Downstream quote readiness uses latest validated census or latest version depending on consumer.

### Risks
- No formal “active version” marker.
- Different downstream consumers use different selection logic:
  - TxQuote uses latest **validated** census with file_url.
  - Enrollment lookup fetches latest member by `case_id + email`, not explicitly restricted to latest version.

### Findings
- **HIGH** — Downstream consumer selection is inconsistent across modules.
- **MEDIUM** — No explicit canonical active-version pointer on case.

---

## 11. Reprocessing Logic Audit

### Required by audit
Equivalent of `reprocessClaimsFile` for census using stored file.

### Actual state
No census reprocess backend function or UI flow was found.
No logic reads `CensusVersion.file_url` and reparses it.
No graceful file-missing path exists.
No idempotent replay handling exists.

### Findings
- **CRITICAL** — Reprocessing requirement is not implemented.
- **HIGH** — Missing-file graceful failure cannot occur because reprocess path does not exist.
- **HIGH** — Idempotent reprocess is not enforced.

---

## 12. UI / UX Flow Audit

### Strengths
- Clear stepper: Upload -> Map -> Validate -> Done
- Mapping review exists
- Duplicate review exists
- Error detail panel exists
- Transform preview exists
- Post-import history/version UI exists

### Gaps
- No persistent import job log/progress for long operations
- Import button label uses original row count, not effective non-skipped rows
- No resumable upload/import
- No explicit warning about parser limitations
- No reprocess action in UI

### Findings
- **MEDIUM** — Good local UX but incomplete operational UX.
- **LOW** — Imported-count messaging may be misleading after skipped duplicates.

---

## 13. Performance & Scale Audit

### Current architecture
All of the following happen client-side in browser:
- file read
- CSV parse
- mapping
- validation
- quality analysis
- duplicate detection
- member payload construction
- iterative batch inserts

### 5,000+ row risk
This flow will likely:
- increase memory usage sharply
- block the main thread
- degrade UI responsiveness
- amplify network round trips due to many batch writes

### Evidence
There is no backend import function; all import orchestration occurs in `CensusUploadModal`.

### Findings
- **HIGH** — Large files should move to server-side processing.
- **MEDIUM** — Browser responsiveness will degrade with 5k+ rows.

---

## 14. Security & Scope Audit

### Observed behavior
Frontend directly calls:
- `base44.entities.CensusVersion.create/update`
- `base44.entities.CensusMember.bulkCreate`
- `base44.entities.BenefitCase.update`
- `base44.entities.ActivityLog.create`

### Risks
- Without strong entity-level rules, UI can write directly.
- No explicit tenant guard visible in import logic.
- No explicit cross-tenant access enforcement in the import code path.

### Caveat
Base44 may enforce auth and row-level behavior elsewhere, but this audit does **not** assume hidden protections.

### Findings
- **CRITICAL** — No explicit tenant isolation enforcement is visible in the census import code path.
- **HIGH** — Direct frontend writes increase risk surface versus backend-controlled import.

---

## 15. Required Test Matrix Status

The request asked for actual execution tests. In this audit, the codebase supports tracing and validation, but there is **no backend testable import function** to execute independently, and no uploaded test files were supplied in-chat. Therefore, the following results are split into **validated by code evidence** vs **not executable within current tooling path**.

| Test | Status | Evidence |
|---|---|---|
| 1. Valid CSV (happy path) | VALIDATED BY CODE TRACE | UI/import path supports normal CSV import |
| 2. Missing columns | VALIDATED BY CODE TRACE | Required mapping gate blocks if required mapped fields missing |
| 3. Invalid data formats | VALIDATED BY CODE TRACE | Warnings/errors generated and rows still imported |
| 4. Duplicate employees | VALIDATED BY CODE TRACE | DuplicateDetectionPanel supports skip, but no enforced dedupe |
| 5. Large file (5k+) | RISK CONFIRMED BY ARCHITECTURE | Entire flow is client-side |
| 6. Reprocess same file | FAILED REQUIREMENT | No reprocess flow exists |
| 7. Reprocess after file deletion | FAILED REQUIREMENT | No reprocess flow exists |
| 8. Cross-tenant attempt | NOT PROVABLE SAFE FROM VISIBLE CODE | No explicit tenant enforcement visible |

### Test execution limitation note
Because the import is implemented entirely in the frontend and no import backend function exists, full automated execution evidence is limited without uploading live test files and manually driving the UI. The architectural and code-path findings above are still evidence-based and sufficient to identify the key defects.

---

## 16. Failure Scenarios

1. **Quoted comma in address/name field** -> parser shifts columns -> wrong fields stored.
2. **Retry same import** -> duplicate version and duplicate member records.
3. **Upload interrupted mid-member insert** -> version exists but member set incomplete.
4. **Stored file later unavailable** -> no reprocess/recovery path.
5. **Invalid rows imported** -> downstream consumers may read bad data.
6. **Large upload** -> browser stalls or crashes.
7. **Cross-case/cross-tenant misuse** -> not visibly guarded in import layer.
8. **Enrollment lookup by email only** -> could bind wrong historical version member.

---

## 17. Identified Defects

### DEF-01 — CSV parser corrupts quoted-comma rows
- Severity: **CRITICAL**
- Evidence: `parseCSV()` uses `split(",")`
- Impact: silent field misalignment and data corruption

### DEF-02 — No census reprocess implementation
- Severity: **CRITICAL**
- Evidence: no reprocess function/UI found using stored `file_url`
- Impact: cannot re-run normalization/validation from stored import artifact

### DEF-03 — No idempotency on retry/import replay
- Severity: **CRITICAL**
- Evidence: no hash, no unique key enforcement, no replay detection
- Impact: duplicate versions and duplicate members

### DEF-04 — Tenant isolation not explicit in import path
- Severity: **CRITICAL**
- Evidence: direct frontend writes with no visible tenant guard
- Impact: potential cross-tenant data risk if entity security is weak/misconfigured

### DEF-05 — Validation errors do not block canonical persistence
- Severity: **HIGH**
- Evidence: UI text + import flow persists rows with `has_errors`
- Impact: bad records stored in canonical member table

### DEF-06 — Duplicate detection is optional and in-file only
- Severity: **HIGH**
- Evidence: `DuplicateDetectionPanel` toggles skip, no hard enforcement
- Impact: duplicate members across retries/history

### DEF-07 — No transactional rollback for partial failure
- Severity: **HIGH**
- Evidence: multi-step create/update pipeline with no transaction boundary
- Impact: inconsistent import state/orphans

### DEF-08 — Large-file processing is browser-bound
- Severity: **HIGH**
- Evidence: all parse/validate/import done in `CensusUploadModal`
- Impact: performance instability for 5k+ rows

### DEF-09 — Downstream version selection inconsistency
- Severity: **HIGH**
- Evidence: txQuote vs enrollment use different census selection logic
- Impact: wrong version may feed downstream use

### DEF-10 — Dependent records not modeled/imported separately
- Severity: **MEDIUM**
- Evidence: only `dependent_count` stored
- Impact: downstream limitations / incomplete household data fidelity

---

## 18. Data Integrity Risks

1. Parser-based column shift corruption
2. Canonical table stores errored rows
3. Duplicate imports on retry/replay
4. Incomplete imports on partial failure
5. Lack of explicit active-version pointer
6. Historical-version bleed into downstream consumers

---

## 19. Performance Risks

1. Browser memory pressure with large CSV files
2. Main-thread blocking during validation/transform
3. Many sequential `bulkCreate` network operations
4. No background job status or resumability

---

## 20. Security Risks

1. Direct frontend entity writes
2. No explicit tenant isolation in visible import logic
3. No demonstrated cross-tenant prevention in current path
4. Stored file re-use security not enforced because reprocess path absent

---

## 21. Recommended Fixes (Prioritized)

### Priority 1
1. Replace naive CSV parser with a real CSV parser that supports quoted fields/newlines/escaping.  
   - Severity addressed: CRITICAL
2. Move census import orchestration to a backend function.  
   - Parse, validate, dedupe, write, and status updates server-side.
3. Add import idempotency.  
   - File hash + case_id + version fingerprinting.
4. Implement census reprocess from stored file URL.  
   - Graceful failure if file unavailable.
5. Enforce tenant/case authorization in backend import path.

### Priority 2
6. Add transactional import job semantics.  
   - Import job record, staged writes, final commit/cleanup.
7. Add blocking rules for fatal validation failures.  
   - Separate accepted vs rejected rows.
8. Add duplicate checks against existing case/version history.
9. Add explicit `active_census_version_id` on case or equivalent canonical selector.
10. Normalize downstream consumers to use a single authoritative version-selection strategy.

### Priority 3
11. Expand validation inventory: ZIP, SSN last4, state, true DOB validity, dependent/business rules.  
12. Add first-class dependent import model if required by business workflows.  
13. Add server-side large-file chunk processing/progress reporting.  
14. Add reprocess UI and audit logging.

### Priority 4
15. Improve UI messaging for skipped rows vs imported rows.  
16. Persist mapping profiles server-side if shared reuse is desired.

---

## 22. Final Audit Verdict

The census import flow is **functionally present but not production-safe for high-integrity or large-scale use** in its current form.

### Safe/working parts
- Version creation
- Case linkage
- Member persistence
- Summary/history display
- Basic downstream feeding

### Unsafe/incomplete parts
- CSV parsing correctness
- Reprocessing
- Idempotency
- explicit security enforcement
- large-file handling
- consistent downstream canonical selection

If this workflow is business-critical, the **highest-priority next step** is to move import processing to a backend-controlled pipeline with proper parsing, idempotency, and tenant enforcement.