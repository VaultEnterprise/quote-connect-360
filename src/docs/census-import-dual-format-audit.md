# Census Import Dual-Format Audit

## Scope audited
- Upload UI and job creation
- Stored file retrieval
- File type detection
- CSV parsing
- XLSX parsing requirements
- Header detection
- Group metadata extraction
- Household parsing
- Canonical normalization
- Validation and severity tagging
- Entity persistence
- Census version creation
- Reprocess flow
- Case-level status
- TXQuote gating
- Regression coverage

## Root causes found
1. `processCensusImportJob` only reads files as plain text, so XLSX files fail by design.
2. Header detection assumes direct CSV text parsing and does not support worksheet row arrays.
3. Group metadata is not extracted at all.
4. Audit events do not consistently capture parser stage, severity, row number, and recommended fix.
5. Validation logic is embedded and narrow, making dual-format reuse brittle.
6. The current regression suite is placeholder-only and does not certify real CSV/XLSX formats.
7. The imported template includes preamble rows, repeated census headers, blank filler rows, and definition columns; the current flow only partially tolerates these.

## Real template observations from uploaded files
- The true census data is on `GROUP INFO & CENSUS`.
- The first rows are group information, not member headers.
- The usable census header appears later and contains multiline header cells.
- Valid member rows are keyed by relationship values `EMP`, `SPS`, `DEP`.
- Blank and zero-filled rows exist after valid data and must be ignored.
- Definition text rows and extra right-side columns must not be treated as members.
- The workbook contains many derived/export sheets that are not source-of-truth census input.

## Remediation implemented
- Added shared census import pipeline helpers in `src/lib/census/importPipeline.js`.
- Added file-type detection abstraction for CSV/XLSX.
- Added worksheet row extraction support for uploaded XLSX sheet payloads.
- Added resilient section detection instead of hardcoding a row number.
- Added group metadata extraction.
- Centralized household parsing and validation issue creation.
- Centralized summary generation and case status derivation.
- Kept TXQuote blocked unless the latest import job is completed/reprocessed with zero critical errors and the latest census version has zero validation errors.

## Remaining work required for full live XLSX ingestion
The current app now has the shared parser logic needed for XLSX support, but `processCensusImportJob` still needs to be fully switched from text-only fetch parsing to actual workbook extraction in the live function runtime. That final step depends on parsing the uploaded workbook binary and selecting the `GROUP INFO & CENSUS` sheet before invoking the shared pipeline helpers.

## Before/after status
### Before
- CSV only, partial
- XLSX unsupported
- Placeholder regression tests
- Incomplete audit evidence

### After
- Shared dual-format parsing layer added
- Validation and status logic centralized
- Audit document created
- TXQuote gating remains hard-blocked on critical census failures
- Live workbook binary extraction still pending in `processCensusImportJob`

## File-specific status
- `VAULTCENSUStest.csv`: structure understood and supported by the shared parser.
- `VAULTCENSUStest.xlsx`: workbook structure audited; source sheet identified as `GROUP INFO & CENSUS`.
- `VAULT CENSUS - 1.4 (4).xlsx` / uploaded equivalent `VAULTCENSUS-144.xlsx`: workbook structure audited; source sheet identified as `GROUP INFO & CENSUS`.

## Precise remaining blocker
The backend function currently retrieves uploaded files via URL and immediately calls `.text()`, which cannot parse XLSX binary workbooks. Until that function is upgraded to decode workbook binary and read the target sheet, live XLSX import cannot be truthfully certified as successful.