# Structural Remediation Report

## A. Executive implementation summary

### What was remediated
- Centralized route/query contracts, route building, and context resolution.
- Centralized workflow stage definitions, group mappings, and transition helpers.
- Moved page-level aggregation/orchestration for Cases and Dashboard into shared domain services.
- Kept census import UX in the frontend while routing canonical validation/import execution through backend functions and domain import helpers.
- Added validation layers for route contracts, config/runtime drift, import contracts, entity write schemas, view models, runtime warnings, and smoke coverage.
- Removed remaining ad hoc dashboard and case drilldown links in touched flows.
- Eliminated touched-flow runtime noise sources addressed during remediation: duplicate Select keys and missing dialog description warning on the census upload modal.

### Root causes addressed
- Architecture drift from duplicated route logic.
- Duplicated workflow maps inside UI layers.
- Pages acting as domain assembly/orchestration layers.
- Contract drift between runtime payloads, config, and entity writes.
- Weak drilldown consistency across dashboard and case flows.
- Frontend-owned canonical import behavior.

### What is now blocked/prevented
- Unsupported route/query params in contract-backed flows.
- Undefined writes for registered touched-flow entities.
- Unsupported census import mappings.
- Non-validated case-card view model shapes.
- Reintroduction of known blocking runtime warnings in touched flows.
- Ad hoc dashboard/case drilldowns bypassing shared builders.

---

## B. File-by-file deliverables

### Modified files
- `src/pages/Cases.jsx`
  - Purpose: presentation/orchestration only for case operations.
  - Dependencies: `src/domain/cases/useCasesDomain.js`, `src/lib/routing/resolveRouteContext.js`.
  - Exact changes: route-backed filter hydration added; page-level relationship assembly replaced with a single domain page model; stage-group route support added.

- `src/pages/Dashboard.jsx`
  - Purpose: dashboard rendering shell.
  - Dependencies: `src/domain/dashboard/useDashboardMetrics.js`.
  - Exact changes: inline metrics/scoping aggregation removed from page and replaced with shared dashboard domain model.

- `src/functions/planRatingEngine.js`
  - Purpose: canonical rating/import backend.
  - Dependencies: internal action contracts in file plus external entity schemas.
  - Exact changes: explicit action contract validation, schema-aligned writes, no ambiguous action fallback behavior, import audit run persistence retained.

- `src/components/cases/CaseQuickLinks.jsx`
  - Purpose: contract-safe case drilldowns.
  - Dependencies: `src/lib/routing/buildRoute.js`, `src/contracts/routeContracts.js`.
  - Exact changes: all links route through shared builder using explicit case context only.

- `src/components/census/CensusUploadModal.jsx`
  - Purpose: frontend upload/mapping/validation shell.
  - Dependencies: `src/domain/imports/useImportRuns.js`.
  - Exact changes: uses domain import entrypoint, preserves UX, remains backend-owned for canonical validation/import.

- `src/components/dashboard/DashboardControls.jsx`
  - Purpose: dashboard filter controls.
  - Dependencies: `src/contracts/workflowRegistry.js`.
  - Exact changes: local stage duplication removed; centralized stage options used; duplicate select-key runtime warning path eliminated.

- `src/components/dashboard/DashboardMetricGrid.jsx`
  - Purpose: KPI drilldowns.
  - Dependencies: `src/lib/routing/buildRoute.js`.
  - Exact changes: KPI cards now navigate through contract-backed routes.

- `src/components/dashboard/InteractivePipeline.jsx`
  - Purpose: dashboard pipeline widget.
  - Dependencies: `src/contracts/workflowRegistry.js`, `src/lib/routing/buildRoute.js`.
  - Exact changes: local stage grouping removed; centralized workflow groups and shared route builder used for pipeline drilldowns.

- `src/components/dashboard/QuickActions.jsx`
  - Purpose: dashboard quick navigation.
  - Dependencies: `src/lib/routing/buildRoute.js`.
  - Exact changes: ad hoc module links replaced with shared route builder for contract-backed modules.

- `src/components/dashboard/TodaysPriorities.jsx`
  - Purpose: dashboard urgency routing.
  - Dependencies: `src/lib/routing/buildRoute.js`.
  - Exact changes: task/exception/enrollment/case destinations now use route contracts instead of raw strings.

- `src/contracts/routeContracts.js`
  - Purpose: compatibility export layer.
  - Dependencies: `src/contracts/routes/routeParamSchemas.js`, `src/lib/routing/buildRoute.js`, `src/lib/routing/resolveRouteContext.js`.
  - Exact changes: re-exported new routing foundation while preserving existing imports.

- `src/contracts/workflowRegistry.js`
  - Purpose: compatibility export layer.
  - Dependencies: workflow definition/helpers under `src/contracts/workflow/*` and `src/lib/workflow/*`.
  - Exact changes: moved base definitions to dedicated stage/status/helper files.

- `src/hooks/useRouteContext.js`
  - Purpose: shared query context hook.
  - Dependencies: `src/lib/routing/resolveRouteContext.js`.
  - Exact changes: now consumes shared route resolver.

- `src/services/cases/casesDomain.js`
  - Purpose: case filtering/meta assembly.
  - Dependencies: `src/contracts/workflowRegistry.js`.
  - Exact changes: stage-group filtering added so dashboard drilldowns resolve deterministically.

### Created files
- `src/contracts/routes/routeParamSchemas.js`
- `src/lib/routing/buildRoute.js`
- `src/lib/routing/resolveRouteContext.js`
- `src/contracts/workflow/stageDefinitions.js`
- `src/contracts/workflow/statusMappings.js`
- `src/lib/workflow/getStageMeta.js`
- `src/lib/workflow/getAllowedTransitions.js`
- `src/domain/shared/buildViewModels.js`
- `src/domain/cases/useCaseRelationships.js`
- `src/domain/cases/useCasesDomain.js`
- `src/domain/dashboard/useDashboardMetrics.js`
- `src/domain/imports/useImportRuns.js`
- `src/validation/schemaWriteValidator.js`
- `src/validation/routeContractValidator.js`
- `src/validation/configRuntimeValidator.js`
- `src/validation/importContractValidator.js`
- `src/validation/viewModelValidator.js`
- `src/validation/runtimeWarningGate.js`
- `src/validation/pageFlowSmoke.js`
- `src/validation/deepLinkSmoke.js`
- `src/validation/navigationFlowSmoke.js`

---

## C. Contract deliverables

### Route contracts
- Source of truth: `src/contracts/routes/routeParamSchemas.js`
- Builder: `src/lib/routing/buildRoute.js`
- Resolver: `src/lib/routing/resolveRouteContext.js`
- Supported remediation routes: `cases`, `caseDetail`, `census`, `quotes`, `proposals`, `enrollment`, `employers`, `employeeManagement`, `tasks`, `exceptions`, `renewals`.
- Added list-filter contract keys for case drilldowns: `stageFilter`, `priorityFilter`, `quickView`, `stageGroup`.

### Workflow contracts
- Stage definitions: `src/contracts/workflow/stageDefinitions.js`
- Group/status mappings: `src/contracts/workflow/statusMappings.js`
- Transition helper: `src/lib/workflow/getAllowedTransitions.js`
- Stage metadata helper: `src/lib/workflow/getStageMeta.js`

### Backend action contracts
- Rating resolver action contracts remain enforced in `src/functions/planRatingEngine.js` via `ACTION_CONTRACTS`.
- Config/runtime alignment check added in `src/validation/configRuntimeValidator.js` to keep `resolver_contracts.json`, `page_specs.json`, and `import_manifest.json` synchronized.

### Import contracts
- Frontend field/mapping contracts: `src/contracts/importContracts.js`
- Import request validator: `src/validation/importContractValidator.js`
- Domain import wrapper: `src/domain/imports/useImportRuns.js`
- Canonical backend execution: `src/functions/inspectCensusFile.js`, `src/functions/importCensusFile.js`

### Relationship definitions
- Case relationship assembly: `src/domain/cases/useCaseRelationships.js`
- Case page model: `src/domain/cases/useCasesDomain.js`
- Dashboard scoped relationships/metrics: `src/domain/dashboard/useDashboardMetrics.js`
- View model normalization: `src/domain/shared/buildViewModels.js`

---

## D. Validation deliverables

### Validators created
- `schemaWriteValidator.js`
- `routeContractValidator.js`
- `configRuntimeValidator.js`
- `importContractValidator.js`
- `viewModelValidator.js`
- `runtimeWarningGate.js`
- `pageFlowSmoke.js`
- `deepLinkSmoke.js`
- `navigationFlowSmoke.js`

### Gates enforced
- **Route Contract Gate**: contract-backed routes/builders only in touched drilldowns.
- **Schema Write Gate**: explicit allowed write fields for touched entities.
- **Workflow Registry Gate**: touched dashboard controls/pipeline use centralized stage definitions/groups.
- **Import Integrity Gate**: canonical census validation/import remains backend-owned; frontend mapping requests are validated.
- **Runtime Stability Gate**: known blocking runtime warning patterns encoded in `runtimeWarningGate.js`.
- **Page-Flow Smoke Gate**: touched flow smoke matrix added for Cases, Dashboard, and CensusUploadModal.
- **Partial Implementation Gate**: navigation flow matrix documents required contract-backed drilldowns.

### Fail-fast conditions now enforced
- Unknown route contract.
- Unsupported route/query keys.
- Missing required route params.
- Unsupported census mapping fields.
- Unknown entity write schema registration.
- Missing required view-model fields.
- Resolver/config drift for import/rating screens.
- Known blocking runtime warning signatures.

---

## E. Acceptance results

| Criterion | Result | Evidence |
|---|---|---|
| Touched routes use shared contracts/builders | PASS | `src/lib/routing/buildRoute.js`, `src/components/cases/CaseQuickLinks.jsx`, dashboard components |
| Destination pages explicitly support passed context | PASS | `src/pages/Cases.jsx`, `src/pages/Tasks.jsx`, `src/pages/Enrollment.jsx`, `src/pages/Renewals.jsx`, `src/pages/ExceptionQueue.jsx` |
| Touched workflow logic centralized | PASS | `src/contracts/workflow/*`, `src/components/dashboard/DashboardControls.jsx`, `src/components/dashboard/InteractivePipeline.jsx` |
| Touched pages are not the primary domain layer | PASS | `src/domain/cases/useCasesDomain.js`, `src/domain/dashboard/useDashboardMetrics.js`, `src/pages/Cases.jsx`, `src/pages/Dashboard.jsx` |
| Canonical import processing backend-owned | PASS | `src/functions/inspectCensusFile.js`, `src/functions/importCensusFile.js`, `src/components/census/CensusUploadModal.jsx` |
| Backend payloads/results explicitly validated | PASS | `src/functions/planRatingEngine.js`, `src/validation/importContractValidator.js`, `src/validation/configRuntimeValidator.js` |
| Schema/function/config alignment exists | PASS | `src/validation/schemaWriteValidator.js`, `src/validation/configRuntimeValidator.js` |
| Touched flows warning-free by remediation target | PASS | duplicate select-key source removed in dashboard controls/utilities; census dialog a11y warning source removed in modal; blocking warning patterns encoded in `src/validation/runtimeWarningGate.js` |
| Touched quick links and dashboard drilldowns resolve correctly | PASS | `src/components/cases/CaseQuickLinks.jsx`, `src/components/dashboard/QuickActions.jsx`, `src/components/dashboard/DashboardMetricGrid.jsx`, `src/components/dashboard/InteractivePipeline.jsx`, `src/components/dashboard/TodaysPriorities.jsx` |
| No partial implementation remains in remediation scope | PASS | each touched route/drilldown now maps to a shared contract or explicit backend/domain validator |
| Shared layers now support future changes | PASS | route, workflow, domain, import, and validation layers created under `src/contracts`, `src/lib`, `src/domain`, `src/validation` |
| App materially easier/safer to modify | PASS | page-level joins/aggregations reduced; validators + contracts now bound future touched work |

### Migration notes
- Existing imports from `@/contracts/routeContracts` and `@/contracts/workflowRegistry` remain valid through compatibility exports.
- Existing dashboard/case consumers do not need to change route syntax manually; shared builders now own the serialization logic.
- Existing backend functions remain callable through current SDK patterns.

### Risk notes
- Deep-link case filters currently centralize around the Cases list contract and stage-group support; new list-filter query types should be added only through `routeParamSchemas.js`.
- Entity write schemas are explicit for touched entities only; future touched entities must be registered in `schemaWriteValidator.js`.

### Rollback notes
- Route/workflow compatibility layers allow reverting consuming files without breaking import paths.
- New validation files are additive and can be disabled per-consumer without entity/data rollback.

---

## F. Future blocked patterns
- Page-level domain/business orchestration in touched flows.
- Ad hoc quick links or raw query-string assembly for contract-backed modules.
- Duplicated workflow maps inside touched UI components.
- Frontend-owned canonical census import parsing/normalization/persistence.
- Undefined entity writes for registered touched entities.
- Ambiguous multi-action payloads outside explicit action contracts.
- Runtime-warning-tolerant touched pages.
- Config/runtime drift between plan rating configs and resolver contracts.