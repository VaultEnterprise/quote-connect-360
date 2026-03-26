# Stabilization Remediation

## Remediation plan by file
- `src/pages/Cases.jsx` → move filtering/meta/KPI logic into `src/services/cases/casesDomain.js`, split toolbar/list/summary UI into focused case components.
- `src/pages/Dashboard.jsx` → move metric derivation into `src/services/dashboard/dashboardMetrics.js`, split metric/activity sections into focused dashboard components.
- `src/functions/planRatingEngine.js` → add hard action contracts, remove undefined-field writes, align aggregate writes to `CaseRatedResult` schema.
- `src/components/cases/CaseQuickLinks.jsx` → replace ad hoc links with route-contract-backed builders.
- `src/components/census/CensusUploadModal.jsx` → move parsing/import orchestration behind backend functions and shared import contracts.

## New shared layers
- Contract layer: `src/contracts/routeContracts.js`, `src/contracts/workflowRegistry.js`, `src/contracts/importContracts.js`
- Domain/service layer: `src/services/cases/casesDomain.js`, `src/services/dashboard/dashboardMetrics.js`, `src/services/import/censusImportClient.js`
- Validation layer: `src/validation/appContracts.js`
- Route context consumption: `src/hooks/useRouteContext.js`

## Before/after dependency map
### Before
Pages owned filtering, workflow truth, route params, and import persistence directly.

### After
Pages consume shared contracts/services; route generation is centralized; census import executes through backend functions; workflow stage definitions live in one registry.

## Blocked future patterns
- New page-level business logic
- New ad hoc query-parameter links
- Frontend-owned canonical import persistence
- Writes with undefined or unsupported fields
- Local workflow stage copies
- Multi-action payloads without explicit request contracts