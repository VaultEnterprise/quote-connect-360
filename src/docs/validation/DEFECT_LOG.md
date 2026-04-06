# Defect Log

Status: Open

| Defect ID | Page | Severity | Description | Root Cause | Impact | Proposed Fix | Status |
|---|---|---:|---|---|---|---|---|
| D-001 | Multiple pages | Medium | Destructive actions still rely on browser alert/confirm patterns | Legacy interaction pattern | Inconsistent UX, weak confirmation flow | Replace with structured dialogs during remediation stage | Open |
| D-002 | Review scope | High | Several pages appear to rely on broad client-side listing/filtering for scoped data | Data access pattern requires deeper validation | Potential data exposure or incorrect role scoping | Validate each affected page and move sensitive checks server-side/page-level as needed | Open |