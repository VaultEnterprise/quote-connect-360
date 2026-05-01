# Census Import Post-Implementation Audit

## Certification
❌ NOT PRODUCTION READY

## Executive finding
The census import stack has improved shared parsing and validation logic, but the live end-to-end implementation still fails the non-negotiable production bar because real XLSX workbook ingestion is not completed in the backend execution path, import audit coverage is incomplete, and deterministic/idempotent reprocess behavior is not yet proven against persisted entity data.

---

## PASS / FAIL by audit category

### 1. File Intake Layer — FAIL
**Status:** FAIL
- Upload UI creates `CensusImportJob` and stores original file URL.
- Original file persistence exists through uploaded file URL storage.
- File type detection helper exists in `src/lib/census/importPipeline.js`.
- Live backend path still reads uploaded file via `fileResponse.text()` in `src/functions/processCensusImportJob.js`, so XLSX is not actually ingested.
- No explicit MIME mismatch or corrupt workbook handling exists in the live function.

**Defects**
- **CRITICAL**: XLSX binary files are treated as text.  
  **Root cause:** `processCensusImportJob` directly calls `.text()` on the fetched file response.  
  **Code reference:** `src/functions/processCensusImportJob.js` lines 165-174.
- **HIGH**: No explicit corrupt/partial file audit event with row/file stage context.  
  **Root cause:** failure handling is coarse and does not classify binary decode/parser failures.

### 2. Parsing Layer — FAIL
**Status:** FAIL
- CSV parsing helper exists and supports quotes/newlines.
- XLSX worksheet row parsing helpers now exist, but are not wired into the live function runtime.
- Multi-sheet XLSX handling is only identified in audit, not implemented in the live parser selection flow.
- No proven live handling for workbook encoding/format anomalies.

**Defects**
- **CRITICAL**: Live parser does not extract workbook sheets.  
  **Root cause:** no workbook binary decode step exists before parsing.  
  **Code reference:** `src/functions/processCensusImportJob.js`.
- **HIGH**: Sheet selection logic for `GROUP INFO & CENSUS` is not executed live.  
  **Code reference:** helper constant in `src/lib/census/importPipeline.js`, unused by live function.

### 3. Census Section Detection — PARTIAL FAIL
**Status:** FAIL
- Shared helper now finds delayed header rows without hardcoded positions.
- Logic is resilient to preamble rows and blank rows in helper layer.
- Live function still uses its own legacy `detectVaultHeader` path instead of the shared section detector.

**Defects**
- **HIGH**: Two competing header detection implementations create drift risk.  
  **Root cause:** live function still uses old inline detector while new helper exists separately.  
  **Code reference:** `src/functions/processCensusImportJob.js` vs `src/lib/census/importPipeline.js`.

### 4. Header Normalization — PARTIAL FAIL
**Status:** FAIL
- Shared header normalizer now handles multiline coverage header normalization.
- Variant header coverage remains incomplete for broader aliases like `Date of Birth`, `ZipCode`, `CoverageType` across workbook-derived tabs.

**Defects**
- **HIGH**: Canonical alias table is not broad enough for all real-world variants shown in attached workbooks.  
  **Root cause:** normalization map is still narrow and template-specific.  
  **Code reference:** `normalizeCensusHeaders` in `src/lib/census/importPipeline.js`.

### 5. Household Parsing Logic — PARTIAL PASS
**Status:** PARTIAL FAIL
- EMP/SPS/DEP grouping exists.
- Orphan dependent prevention exists through validation.
- Deterministic household linkage depends on row order and active household state.

**Defects**
- **MEDIUM**: Household linkage is stateful and assumes dependent rows follow EMP rows immediately enough to inherit active household key.  
  **Root cause:** parser uses `activeHouseholdKey` instead of stronger employee anchor logic.  
  **Code reference:** `parseHouseholds` in `src/lib/census/importPipeline.js`.

### 6. Data Normalization — PARTIAL PASS
**Status:** PARTIAL FAIL
- Date normalization supports text dates and Excel serials in shared helper.
- Zip normalization and field trimming exist.
- Default handling exists but is simplistic.

**Defects**
- **MEDIUM**: Gender/coverage/relationship normalization is not fully standardized across all workbook variants.  
  **Root cause:** current normalization remains tailored to the primary census sheet only.

### 7. Validation Engine — FAIL
**Status:** FAIL
- INFO/WARNING/CRITICAL levels exist.
- Row-level validation exists.
- File-level summary exists.
- Duplicate detection, eligibility validation, and stronger household integrity rules are not implemented in the live validation engine.

**Defects**
- **HIGH**: No true duplicate detection in backend validation.  
  **Root cause:** validation only checks required fields/date/ZIP/linkage.  
  **Code reference:** `src/functions/validateCensusRecords.js`, `buildValidationIssues`.
- **HIGH**: No eligibility validation despite being required by audit scope.
- **MEDIUM**: No file-level rule outcomes beyond aggregate counts.

### 8. Persistence Layer — FAIL
**Status:** FAIL
- Census version creation exists.
- Validation result persistence exists.
- Original file URL is stored.
- No separate persisted household entity exists.
- No proven idempotent cleanup/replacement behavior on reprocess.

**Defects**
- **CRITICAL**: Reprocess can duplicate `CensusMember` and `CensusValidationResult` records because old rows are not removed or versioned-out before persistence.  
  **Root cause:** persistence always bulk-creates fresh rows.  
  **Code reference:** `src/functions/persistCensusVersion.js`.
- **HIGH**: Parsed snapshot is uploaded but not represented as first-class entity state with replay guarantees.

### 9. Audit + Observability — FAIL
**Status:** FAIL
- `CensusImportJob` exists.
- `CensusImportAuditEvent` exists.
- Some stage events are written.
- Required audit fields are not consistently guaranteed on every failure path.

**Defects**
- **HIGH**: Audit payload schema is informal and not enforced.  
  **Root cause:** structured audit builder exists but is not wired into all events.  
  **Code reference:** `src/lib/census/importPipeline.js` helper unused by live function.
- **HIGH**: Validation row issues do not generate corresponding stage-level audit events for trace replay.

### 10. Case Integration — PARTIAL PASS
**Status:** PARTIAL FAIL
- Case status updates on persist.
- Import status UI exists in case census tab.
- Validation details dialog exists.

**Defects**
- **MEDIUM**: UI shows latest job and validation rows, but full parser-stage forensic trace is not surfaced.
- **MEDIUM**: Case visibility depends on latest import only; historical comparisons are limited.

### 11. TXQuote Gating — PASS WITH CONDITIONS
**Status:** PASS
- TXQuote is blocked unless latest import job is completed/reprocessed and has zero critical errors.
- Latest validated census version must also have zero validation errors.

**Residual risk**
- **MEDIUM**: Because reprocess/idempotency is unresolved, the underlying data certified for TXQuote may still be duplicated or stale even when gating passes.

### 12. Reprocess Flow — FAIL
**Status:** FAIL
- Reprocess uses stored file URL.
- Reprocess invokes the same backend function.
- Determinism is not proven.
- Duplicate prevention is absent.

**Defects**
- **CRITICAL**: Reprocess is not idempotent.  
  **Root cause:** old persisted records are not archived/deleted/replaced before reprocessing.  
  **Code reference:** `src/functions/reprocessCensusImport.js`, `src/functions/persistCensusVersion.js`.

### 13. Performance + Scale — FAIL
**Status:** FAIL
- No evidence of certified 1k / 5k / 10k end-to-end backend execution.
- Current flow performs per-record function invocation during normalization in live import path.

**Defects**
- **HIGH**: Per-row backend function calls create scale and timeout risk.  
  **Root cause:** `processCensusImportJob` invokes `normalizeCensusSchema` for every row.  
  **Code reference:** `src/functions/processCensusImportJob.js` lines 196-201.
- **HIGH**: No load test/certified benchmark for 10k-row import.

---

## Prioritized defect list

### CRITICAL
1. XLSX files are not actually parsed in live backend import path.
2. Reprocess is not idempotent and can duplicate persisted records.
3. Persistence layer does not guarantee deterministic replay-safe output.
4. Production readiness cannot be certified while binary workbook extraction is missing.

### HIGH
1. Duplicate detection missing from validation engine.
2. Eligibility validation missing.
3. Audit event coverage incomplete and inconsistently structured.
4. Header normalization aliases are too narrow for broader workbook-derived variants.
5. Per-row backend invocation creates scale risk.
6. Multi-sheet workbook source selection is audited but not live in execution.

### MEDIUM
1. Stateful household parsing relies on row order.
2. UI does not expose full parser-stage forensic trace.
3. Historical import comparison depth is limited.
4. Normalization coverage across variant field conventions remains incomplete.

### LOW
1. Cleanup/refactor needed to remove duplicate inline parser logic.
2. Audit payload schema should be standardized everywhere.

---

## Executable fix plan

### 1. Replace live text-only workbook intake
- Update `src/functions/processCensusImportJob.js` to:
  - detect file type from file name/content-type
  - if CSV: use `extractRowsFromCsv`
  - if XLSX: decode workbook binary, select `GROUP INFO & CENSUS`, transform sheet rows to row arrays, then use shared helpers
- Remove legacy inline CSV-only parser functions after migration to shared helpers.

### 2. Make parser pipeline single-source
- Refactor `processCensusImportJob` to call only:
  - `locateCensusSection`
  - `extractGroupMetadata`
  - `normalizeCensusHeaders`
  - `parseHouseholds`
- Delete duplicate header-detection and row-mapping logic from the function.

### 3. Enforce structured audit events
- Use `buildAuditEvent` for every stage:
  - file_intake
  - file_decode
  - sheet_select
  - section_detect
  - header_normalize
  - household_parse
  - validation
  - persistence
  - case_update
  - txquote_gate
- Include required fields on every failure:
  - import job ID
  - case ID
  - file name
  - parser stage
  - error message
  - severity
  - row number when available
  - recommended fix

### 4. Fix idempotent reprocess
- On reprocess, delete or archive prior `CensusMember` and `CensusValidationResult` rows tied to the same `census_import_id` before recreating.
- Decide deterministic versioning rule:
  - either replace same import artifacts in-place, or create a new version while archiving the old one.
- Do not leave both old and new active records for the same import snapshot.

### 5. Expand validation engine
- Add duplicate person detection using household/name/DOB composite keys.
- Add file-level validation outcomes.
- Add eligibility validation when required fields or coverage values conflict.
- Add orphan dependent validation tied to employee linkage.

### 6. Remove per-row backend function calls
- Inline normalization in the import pipeline or batch-normalize in-process.
- Keep backend boundary at stage level, not row level.

### 7. Add certification tests
- Real CSV delayed-header test
- XLSX worksheet delayed-header test
- blank-row ignore test
- multiline-header normalization test
- orphan-dependent rejection test
- duplicate detection test
- reprocess idempotency test
- TXQuote gating pass/fail tests
- performance smoke tests for 1k/5k/10k synthetic rows

---

## Evidence summary
- Attached XLSX files both show the source census sheet is `GROUP INFO & CENSUS`.
- CSV fixture shows delayed header row, repeated header row, definition columns, and blank rows.
- Shared helper layer now models delayed headers and worksheet row parsing.
- Live function still does not execute workbook extraction, so successful XLSX production import is not proven.

---

## Final certification statement
❌ NOT PRODUCTION READY

### Blocking defects
1. Live XLSX import path is not implemented end-to-end.
2. Reprocess can duplicate persisted records.
3. Validation engine is missing duplicate and eligibility controls.
4. Audit trace coverage is incomplete for forensic replay.
5. Scale certification for 1k/5k/10k rows is not proven.