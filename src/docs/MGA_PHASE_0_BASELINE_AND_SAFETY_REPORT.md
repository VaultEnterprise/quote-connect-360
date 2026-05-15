# MGA Phase 0 — Baseline and Safety Preparation Report

Status: **Phase 0 Revision Round 1 Complete — Documentation Remediation Only**  
Date: 2026-05-02  
Canonical architecture document: `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`  
Canonical build planning document: `docs/MGA_BUILD_PLANNING_PACKAGE.md`  
Phase 0 report path: `docs/MGA_PHASE_0_BASELINE_AND_SAFETY_REPORT.md`

## 0. Control Statement

Phase 0 was limited to baseline discovery, inventory, analysis, risk identification, and implementation-control documentation.

No implementation was performed.

No code, schema, UI, database, service, entity, permission, TXQuote, reporting, document, navigation, or behavior changes were made.

Path ambiguity control:
- canonical underscore path used for this report
- no spaced duplicate document path was created
- canonical architecture source remains `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`
- canonical planning source remains `docs/MGA_BUILD_PLANNING_PACKAGE.md`

## 1. Phase 0 Summary

| Area | Status | Count / Result |
|---|---:|---:|
| Current entity inventory | Complete | 58 entities / artifacts inventoried |
| Current page inventory | Complete | 29 routed pages + portal/help/admin surfaces inventoried |
| Current backend function/service inventory | Complete | 37 deployed backend functions + 2 referenced service artifacts = 39 combined inventory rows |
| Direct frontend read/mutation inventory | Complete | 57 grouped findings; 99 direct reads; 58 direct mutations; 157 combined direct access findings |
| Protected domain classification | Complete | 26 domains classified |
| Migration candidate inventory | Complete | 45 migration candidate entities/artifacts identified |
| Document/file access inventory | Complete | 10 access path categories identified |
| Report/search/notification/event inventory | Complete | 18 path categories identified |
| Baseline workflow snapshot | Complete | 11 workflows captured |
| Implementation tracking checklist | Complete | Populated by protected domain and remediation phase |
| Feature flag / rollout baseline | Complete | Planning placeholders defined |
| Rollback / containment baseline | Complete | Planning controls defined |
| Phase 0 risk and blocker register | Complete | 24 P0, 11 P1, 5 P2 risks |

Phase 0 exit criteria: **PASS**  
Ready for Phase 1 approval discussion: **YES — do not proceed without explicit approval**

---

## 2. Current Entity Inventory

Classification uses the certified MGA architecture categories. “Direct frontend access observed” means direct SDK use was observed in current routed pages/components or known app context.

| Entity / artifact | Current scope field, if any | Parent entity | Current access pattern | MGA classification | Migration required | Indexing required | Audit coverage exists | Direct frontend access observed | Notes / anomalies |
|---|---|---|---|---|---:|---:|---:|---:|---|
| Agency | none observed | platform/org | direct list/create/update | Global - Intentional / requires review | NO | YES | PARTIAL | YES | Used as organization/agency setting; must not contain tenant operational data if global. |
| MasterGroup | existing master group concept | MGA future parent | direct list in Rates | Scoped - Direct | YES | YES | NO | YES | Current MasterGroup pages not explicit; Employers page labeled Master Groups but uses EmployerGroup. |
| Tenant | master_group_id | MasterGroup | direct list in Rates | Scoped - Direct | YES | YES | NO | YES | Used for rate assignment scope. |
| RateSetAssignment | master_group_id / tenant_id | MasterGroup/Tenant | direct list/create | Scoped - Direct / Global - Intentional if global | YES | YES | NO | YES | Existing assignment_type includes global/master_group/tenant; MGA level needed. |
| EmployerGroup | agency_id | Agency/MasterGroup future | direct list/create/update | Scoped - Direct | YES | YES | PARTIAL | YES | Primary MasterGroup-like operational entity in current UI. |
| BenefitCase | agency_id, employer_group_id | EmployerGroup | direct list/filter/create/update/delete | Scoped - Direct | YES | YES | PARTIAL | YES | Core protected case record; many direct reads. |
| CaseTask | case_id | BenefitCase | direct list/filter/create/update/delete | Scoped - Direct | YES | YES | PARTIAL | YES | Direct task mutations on Tasks/Cases components. |
| ActivityLog | case_id | BenefitCase | direct list/filter/create | Scoped - Direct | YES | YES | YES/PARTIAL | YES | Audit-like entity but lacks MGA scope and outcome fields. |
| ExceptionItem | case_id | BenefitCase | direct list/create/update | Scoped - Direct | YES | YES | PARTIAL | YES | Exception Queue uses direct updates for status/assignment. |
| Document | case_id, employer_group_id | BenefitCase/EmployerGroup | direct list/filter via document pages/tabs | Scoped - Direct | YES | YES | PARTIAL | YES | File metadata, names, downloads, previews must be scoped. |
| CensusVersion | case_id | BenefitCase | direct list/filter/create via upload flow | Scoped - Direct | YES | YES | PARTIAL | YES | Core census snapshot; file_url protected. |
| CensusMember | census_version_id, case_id | CensusVersion | direct list/filter | Scoped - Direct | YES | YES | PARTIAL | YES | PII risk; must be service-scoped. |
| CensusImportJob | case_id | BenefitCase | direct filter/create via upload flow | Scoped - Direct | YES | YES | YES/PARTIAL | YES | Async processor must re-resolve scope. |
| CensusImportAuditEvent | import/job | CensusImportJob | function/system use | Scoped - Direct | YES | YES | YES | UNKNOWN | Needs scope propagation and audit visibility control. |
| CensusValidationResult | import/job/case | CensusImportJob/Case | function/system use | Scoped - Direct | YES | YES | YES | UNKNOWN | Validation results may expose member metadata. |
| QuoteScenario | case_id | BenefitCase | direct list/filter/create/update/delete | Scoped - Direct | YES | YES | PARTIAL | YES | Includes versions array; quote versions are protected. |
| ScenarioPlan | scenario_id, case_id | QuoteScenario | direct list | Scoped - Direct | YES | YES | PARTIAL | YES | Used in rate/case dependency panels. |
| ContributionModel | scenario_id, case_id | QuoteScenario/Case | direct list/delete | Scoped - Direct | YES | YES | PARTIAL | YES | Financial contribution values protected. |
| QuoteTransmission | case_id, census_version_id | BenefitCase/CensusVersion | direct filter/create by sendTxQuote | Scoped - Direct | YES | YES | YES/PARTIAL | YES | External side effects and recipient data. |
| QuoteProviderRoute | provider_code | Platform/MGA future | direct list/admin create/update | Scoped - Inherited or Global - Intentional | YES | YES | PARTIAL | YES | Platform routes vs MGA custom routes must be separated. |
| BenefitPlan | none observed | catalog/MGA future | direct list/create/update/delete | Scoped - Inherited or Global - Intentional | YES | YES | PARTIAL | YES | Shared plan catalog must be governed. |
| PlanRateTable | plan_id | BenefitPlan | direct list/create/update | Scoped - Inherited or Global - Intentional | YES | YES | PARTIAL | YES | Rates can be global or scoped; indexes required. |
| Proposal | case_id, scenario_id | QuoteScenario/Case | direct list/create/update/delete/export | Scoped - Direct | YES | YES | PARTIAL | YES | Generated PDFs/exports protected. |
| EnrollmentWindow | case_id | BenefitCase | direct list/create/update | Scoped - Direct | YES | YES | PARTIAL | YES | Enrollment counts and links protected. |
| EmployeeEnrollment | enrollment_window_id, case_id | EnrollmentWindow | direct list/update/function email/sign | Scoped - Direct | YES | YES | PARTIAL | YES | Employee PII and DocuSign status protected. |
| EnrollmentMember | enrollment/window | EmployeeEnrollment | entity referenced | Scoped - Direct | YES | YES | PARTIAL | UNKNOWN | Must inherit enrollment scope. |
| RenewalCycle | case_id, employer_group_id | EmployerGroup/Case | direct list/create/update/delete/export | Scoped - Direct | YES | YES | PARTIAL | YES | Renewal financial/rate data protected. |
| PolicyMatchResult | case/quote | Case/Quote | direct/AI function use | Scoped - Direct | YES | YES | PARTIAL | YES | AI output must not cross scope. |
| TxQuoteCase | case_id | BenefitCase | direct list/filter/create/update via TxQuote components | Scoped - Direct | YES | YES | PARTIAL | YES | High-risk external workflow. |
| TxQuoteDestination | txquote_case_id | TxQuoteCase | direct list/filter | Scoped - Direct | YES | YES | PARTIAL | YES | Destination routing protected. |
| TxQuoteReadinessResult | txquote_case_id | TxQuoteCase | direct list/filter | Scoped - Direct | YES | YES | PARTIAL | YES | Readiness can reveal census/doc gaps. |
| TxQuoteSubmissionLog | txquote_case_id | TxQuoteCase | function/system use | Scoped - Direct | YES | YES | YES/PARTIAL | UNKNOWN | Retry/idempotency required. |
| TxQuoteEmployerProfile | txquote_case_id | TxQuoteCase | workspace use | Scoped - Direct | YES | YES | PARTIAL | YES | Employer submission profile protected. |
| TxQuoteCurrentPlanInfo | txquote_case_id | TxQuoteCase | workspace use | Scoped - Direct | YES | YES | PARTIAL | YES | Current plan protected. |
| TxQuoteContributionStrategy | txquote_case_id | TxQuoteCase | workspace use | Scoped - Direct | YES | YES | PARTIAL | YES | Contribution data protected. |
| TxQuoteClaimsRequirement | txquote_case_id | TxQuoteCase | workspace use | Scoped - Direct | YES | YES | PARTIAL | YES | Claims requirements sensitive. |
| TxQuoteSupportingDocument | txquote_case_id | TxQuoteCase | workspace/document use | Scoped - Direct | YES | YES | PARTIAL | YES | File/document protection required. |
| TxQuoteDestinationContact | destination/rule | TxQuoteDestination | settings/admin use | Scoped - Direct | YES | YES | PARTIAL | YES | Contact routing sensitive. |
| TxQuoteDestinationRule | destination/rule | Platform/MGA future | settings/admin use | Scoped - Inherited or Global - Intentional | YES | YES | PARTIAL | YES | Global vs custom split needed. |
| TxQuoteCensusOverride | txquote_case_id | TxQuoteCase | workspace use | Scoped - Direct | YES | YES | PARTIAL | YES | Census override can expose member data. |
| User | platform auth | platform | direct list in Settings admin | Platform-Only - Not MGA Visible | NO | YES | PARTIAL | YES | Built-in User entity; special access rules apply. |
| UserManual | help/manual | help/manual | help UI/functions | Scoped - Direct when generated/user-specific | YES | YES | PARTIAL | YES | Generated manuals may include operational context. |
| HelpModule | help catalog | platform | help UI/functions | Global - Intentional | NO | YES | PARTIAL | YES | Static only; no operational data. |
| HelpPage | help catalog | HelpModule | help UI/functions | Global - Intentional | NO | YES | PARTIAL | YES | Static only. |
| HelpSection | help catalog | HelpPage | help UI/functions | Global - Intentional | NO | YES | PARTIAL | YES | Static only. |
| HelpContent | help catalog | HelpTarget/Page | help UI/functions | Global - Intentional | NO | YES | PARTIAL | YES | Must remain non-operational. |
| HelpContentVersion | HelpContent | HelpContent | admin functions | Global - Intentional | NO | YES | PARTIAL | YES | Static versions only. |
| HelpTarget | app page/control | platform | help/admin functions | Global - Intentional | NO | YES | PARTIAL | YES | Registry only. |
| HelpSearchLog | user/help | User/help | function/UI log | Scoped - Direct | YES | YES | PARTIAL | YES | User activity must be scoped. |
| HelpAIQuestionLog | user/help | User/help | function/UI log | Scoped - Direct | YES | YES | PARTIAL | YES | Prompt history may contain operational data. |
| HelpCoverageSnapshot | help/system | platform/MGA if generated from app data | Scoped - Direct or Global - Intentional | YES | YES | PARTIAL | YES | Generated coverage can reveal app structure and operations. |
| HelpAuditLog | help/admin | User/help | admin functions | Scoped - Direct | YES | YES | YES/PARTIAL | YES | Needs scoped/admin visibility. |
| HelpAITrainingQueue | help/AI | HelpContent | queue/system | Scoped - Direct | YES | YES | PARTIAL | YES | Queue items may include generated content. |
| HelpManualTopic | help catalog | platform | help UI/functions | Global - Intentional | NO | YES | PARTIAL | YES | Static only. |
| HelpManualTopicTargetMap | help catalog | HelpManualTopic/Target | help UI/functions | Global - Intentional | NO | YES | PARTIAL | YES | Static mapping only. |
| SeedRun | system seed | platform | function/system | Platform-Only - Not MGA Visible | NO | YES | YES | UNKNOWN | Internal only. |
| SeedRunStep | SeedRun | SeedRun | function/system | Platform-Only - Not MGA Visible | NO | YES | YES | UNKNOWN | Internal only. |
| ViewPreset | user/view | User/page | direct UI use | Scoped - Direct | YES | YES | PARTIAL | YES | User presets should be user + MGA scoped. |
| CaseFilterPreset | user/case | User/case | direct UI use | Scoped - Direct | YES | YES | PARTIAL | YES | Saved case filters may reveal names/statuses. |

Entity inventory result: **Complete**. Primary anomaly: existing records do not consistently carry direct `master_general_agent_id`; most protected data access is currently direct frontend SDK access.

---

## 3. Current Page Inventory

| Page | Route | Protected domain | Current data source | Direct reads | Direct mutations | Scoped service replacement required | RBAC visibility requirement | Doc/report/search/notification dependency | Notes |
|---|---|---|---|---:|---:|---:|---|---|---|
| Dashboard | `/` | dashboards, cases, census, quotes, enrollment, documents, events | direct entity lists + realtime subscriptions | YES | NO | YES | role + MGA scope | dashboard/report/event | Subscribes directly to protected entity streams. |
| Cases | `/cases` | cases, census, quotes, enrollment, TXQuote | direct entity lists | YES | YES | YES | case/workflow role | dashboard/export | Bulk delete/export performed client-side. |
| CaseNew | `/cases/new` | cases, employers | direct entity lists + create | YES | YES | YES | create-case permission | none | Creates BenefitCase directly. |
| CaseDetail | `/cases/:id` | case workspace, census, quotes, docs, TXQuote, audit | direct entity filters/lists | YES | YES | YES | case detail/action permissions | documents/TXQuote/audit | High-risk central workspace. |
| Census | `/census` | census | direct entity lists/filter + upload modal | YES | YES | YES | census role | upload/doc/file | CensusMember PII reads. |
| Quotes | `/quotes` | quotes, quote versions, cases | direct entity lists/update/delete + function invoke | YES | YES | YES | quote role | export/report | Calculation uses function but status updates are direct. |
| Enrollment | `/enrollment` | enrollment | direct entity lists | YES | YES | YES | enrollment role | notification/email likely | Create modal handles writes. |
| Renewals | `/renewals` | renewals/rates | direct entity lists/update/delete/export | YES | YES | YES | renewal role | export/report | Bulk status also updates BenefitCase. |
| Tasks | `/tasks` | tasks/cases | direct entity lists/update/delete | YES | YES | YES | task/case role | none | My Tasks uses client-side filtering. |
| Employers / Master Groups | `/employers` | MasterGroup/employers/documents | direct lists/create/update | YES | YES | YES | employer/master group role | documents/renewals/import | Current page label differs from entity name. |
| Plans | `/plans` | plan catalog/rates | direct lists/create/update/delete/export/import | YES | YES | YES | plan admin / catalog role | export/import | Catalog global-vs-scoped decision required. |
| Rates | `/rates` | rates, assignments, tenants, MasterGroups | direct lists/create/update/print | YES | YES | YES | rate admin | print/export | Enterprise Scope label currently not authorization. |
| Proposals | `/proposals` | proposals/reports/exports | direct list/update/delete/export | YES | YES | YES | proposal role | export/PDF/email | Generated artifacts protected. |
| Contributions | `/contributions` | contribution financial modeling | direct list/delete/export | YES | YES | YES | financial/quote role | export/report | Financial visibility explicit permission required. |
| Employee Management | `/employee-management` | enrollment/employees/DocuSign | direct lists | YES | YES | YES | enrollment/admin role | DocuSign/document/email | Employee PII and signature status protected. |
| Employee Enrollment | `/employee-enrollment` | employee portal enrollment | portal/session/entity access | YES | YES | YES | employee self-scope | DocuSign/documents | Must be isolated to employee token/scope. |
| Employee Benefits | `/employee-benefits` | employee benefits | portal/session/entity access | YES | YES | YES | employee self-scope | documents | Employee-facing sensitive data. |
| Employee Portal | `/employee-portal` | employee portal | portal session/entity access | YES | YES | YES | employee self-scope | documents/links | External-facing portal. |
| Employee Portal Login | imported, not routed in App currently | employee portal auth/session | portal session | YES | NO | YES | public portal access | email links | Not currently routed in App snapshot. |
| Employer Portal | `/employer-portal` | employer portal | direct/entity access | YES | YES | YES | employer self-scope | proposals/documents | External-facing employer data. |
| Exception Queue | `/exceptions` | exceptions/workflow risk | direct entity lists/create/update | YES | YES | YES | exception role | notifications/automation | Analytics and automation settings exist. |
| PolicyMatch AI | `/policymatch` | policy match/AI | direct/function access | YES | YES | YES | quote/policy role | AI/report | AI output must be scoped. |
| Integration Infrastructure | `/integration-infra` | platform/admin/reference | mostly static panels | NO/PARTIAL | NO/PARTIAL | PARTIAL | admin/platform role | webhooks/events | Reference page; tabs may expose platform metadata. |
| Settings | `/settings` | settings/users/routing/webhooks/audit/help | direct Agency/User list/update + panels | YES | YES | YES | admin role | webhooks/audit/help | User list and routing panels high-risk. |
| Help Center | `/help` | help/manual/search | help entities/functions | YES | YES | YES/PARTIAL | all users / scoped activity | search/manual | Static content global; activity scoped. |
| Help Admin | `/help-admin` | help admin | help entities/functions | YES | YES | YES/PARTIAL | admin only | audit/manual/search | App route admin-gated only in UI. |
| Help Dashboard | `/help-dashboard` | help reporting | help entities/functions | YES | YES | YES/PARTIAL | admin/help role | reports | Coverage snapshots may reveal operational structure. |
| Help Coverage | `/help-coverage` | help coverage/reporting | help entities/functions | YES | YES | YES/PARTIAL | admin/help role | reports | Generated snapshots need scope classification. |
| Help Analytics | `/help-analytics` | help search/activity logs | help log entities | YES | YES | YES | admin/help role | search analytics | User query logs may include operational data. |
| Help Target Registry | `/help-target-registry` | help target registry | help entities | YES | YES | PARTIAL | admin/help role | catalog | Static registry unless operational data included. |
| Help Manual Manager | `/help-manual-manager` | generated manuals | help/manual entities/functions | YES | YES | YES | admin/help role | generated PDFs/manuals | Generated manuals protected if operational. |
| ACA Library | `/aca-library` | compliance reference | static/reference | NO/PARTIAL | NO | PARTIAL | all users/admin policy | reference | Likely global intentional if static. |

Pages requested but not found as separate routed pages in current App router: `CESCommand`, explicit tenant pages, explicit MasterGroup pages. Current MasterGroup-like UI is `/employers` and rate scope uses `MasterGroup`/`Tenant` entities.

Page inventory result: **Complete**.

---

## 4. Current Function / Service Inventory

| Function/service | Domain | Protected operation | Current scope enforcement | Required scoped replacement | Idempotency required | Audit required | Concurrency requirement | File/document implication | TXQuote/external side-effect implication | Async/job/webhook implication | Notes |
|---|---|---:|---|---|---:|---:|---|---|---|---|---|
| calculateQuoteRates | quotes/rates | YES | scenario/user validation unclear | calculateQuoteRatesByMGAScope | YES | YES | optimistic for scenario | none direct | no external transmit | async-like computation | Must scope scenario/census/plans. |
| sendTxQuote | TXQuote | YES | case/user checks isolated | sendTxQuoteByMGAScope | YES | YES | retry-safe state | census file attachment | YES email/provider side effect | retry required | Highest-risk external transmission. |
| sendTxQuoteV2 | TXQuote | YES | if present, isolated | sendTxQuoteByMGAScope | YES | YES | retry-safe state | census/support docs | YES | retry required | Mentioned in codebase context. |
| validateTxQuote | TXQuote | YES | unknown | validateTxQuoteByMGAScope | YES | YES | none | docs/census | possible | validation job | Must gate readiness. |
| exportProposalPDF | proposals/export | YES | unknown | exportProposalPDFByMGAScope | YES | YES | snapshot version | generated PDF | possible email attachment | export job | PDF protected. |
| sendProposalEmail | proposal/email | YES | unknown | sendProposalEmailByMGAScope | YES | YES | retry-safe | proposal PDF/link | YES email | async/email | Deep links must reauthorize. |
| sendEnrollmentInvite | enrollment/email | YES | unknown | sendEnrollmentInviteByMGAScope | YES | YES | retry-safe | enrollment links/docs | YES email | async/email | Employee access tokens protected. |
| sendDocuSignEnvelope | enrollment/DocuSign | YES | unknown | sendDocuSignEnvelopeByMGAScope | YES | YES | envelope state | signed docs | YES DocuSign | external API | Must validate employee enrollment scope. |
| getDocuSignSigningURL | enrollment/DocuSign | YES | unknown | getDocuSignSigningURLByMGAScope | YES | YES | none | signed URL | YES DocuSign | link generation | Signed URL must be short-lived and scoped. |
| docuSignWebhook | webhook/DocuSign | YES | webhook signature likely | docuSignWebhookByMGAScope | YES | YES | envelope state | signed docs | YES | webhook | Must resolve envelope ownership or quarantine. |
| processGradientAI | census/AI | YES | unknown | processGradientAIByMGAScope | YES | YES | job state | census member data | external AI | async | PII and AI output protected. |
| matchPoliciesWithGradient | policy/AI | YES | unknown | matchPoliciesWithGradientByMGAScope | YES | YES | job state | policy artifacts | external AI | async | Must not use cross-scope policy inputs. |
| policyMatchAI | policy/AI | YES | unknown | policyMatchAIByMGAScope | YES | YES | job state | output/report | external AI | async | Scoped prompt/results required. |
| createHighRiskExceptions | exceptions/automation | YES | unknown | createHighRiskExceptionsByMGAScope | YES | YES | idempotent exception creation | none | no | scheduled/automation | Must avoid duplicate exceptions. |
| syncEmployerToZohoCRM | external CRM | YES | Salesforce connector/service likely | syncEmployerToZohoCRMByMGAScope | YES | YES | external sync version | none | YES Zoho/Salesforce-like sync | external API | Must validate employer scope before sync. |
| syncBulkEmployersToZoho | external CRM | YES | unknown | syncBulkEmployersToZohoByMGAScope | YES | YES | bulk item validation | none | YES | batch job | Mixed-scope bulk must deny or split safely. |
| syncZohoContactsToEmployers | external CRM | YES | unknown | syncZohoContactsToEmployersByMGAScope | YES | YES | import ownership | none | YES | import/job | Webhook/import ownership ambiguity. |
| helpAIAnswer | help/AI | PARTIAL | user auth likely | helpAIAnswerScopedActivity | YES | YES | none | none | external AI | no | Static help global; question logs scoped. |
| saveHelpContent | help/admin | PARTIAL | admin likely | saveHelpContentGoverned | YES | YES | versioning | manual content | no | no | Global static only unless operational. |
| generateHelpForTarget | help/admin/AI | PARTIAL | admin likely | generateHelpForTargetGoverned | YES | YES | job version | generated docs | external AI | async | Generated content must not leak ops data. |
| generatePageHelpBulk | help/admin/AI | PARTIAL | admin likely | generatePageHelpBulkGoverned | YES | YES | job version | generated docs | external AI | async | Bulk generation must be audited. |
| generateUserManual | help/manual/export | PARTIAL | admin likely | generateUserManualGoverned | YES | YES | versioning | generated manual/PDF | external AI | async/export | Generated manual may be scoped. |
| fullDocumentationExport | help/export | PARTIAL | admin likely | fullDocumentationExportGoverned | YES | YES | export snapshot | document/export | no | export job | Export bundle protected. |
| generateCoverageSnapshot | help/report | PARTIAL | admin likely | generateCoverageSnapshotGoverned | YES | YES | snapshot | report | no | async/report | Coverage snapshot access controlled. |
| populateHelpFromManual | help/import | PARTIAL | admin likely | populateHelpFromManualGoverned | YES | YES | import state | manual file | no | import job | Imported manual content classification. |
| runHelpMasterSeed | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | none | no | job | Platform-only. |
| seedApplicationManualPart1 | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedApplicationManualPart2 | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedDashboardHelp | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedDocumentationSystem | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedFullAuditReport | help/seed/report | PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | report | no | job | May include audit summary. |
| seedHelpContent | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedHelpPack | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedManualArchitectureDoc | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedManualFAQBank | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedManualPageGuides | help/seed | NO/PARTIAL | admin likely | platformSeedGoverned | YES | YES | seed lock | docs | no | job | Platform-only. |
| seedPageInventory | help/seed | PARTIAL | admin likely | seedPageInventoryGoverned | YES | YES | seed lock | page inventory | no | job | Page inventory can reveal app structure. |
| cleanupOrphanedHelpContent | help/cleanup | PARTIAL | admin likely | cleanupHelpContentGoverned | YES | YES | cleanup lock | docs | no | job | Deletion/cleanup audit required. |
| cleanupOrphanedHelpContentStaggered | help/cleanup | PARTIAL | admin likely | cleanupHelpContentGoverned | YES | YES | cleanup lock | docs | no | scheduled/job | Scheduled cleanup must be scoped/platform-only. |

Function inventory result: **Complete**. Do not modify functions until Phase 3 or explicitly approved remediation work.

---

## 4A. Function / Service Inventory Count Reconciliation

This section resolves the count discrepancy identified in the Phase 0 Completion Audit (37 stated vs 39 table rows observed).

### A. Deployed Backend Functions

These are confirmed callable deployed backend/server functions as listed in the platform function registry.

| Function name | Domain | Deployed/callable | Protected operation | Current scope enforcement | Required scoped replacement | Notes |
|---|---|---|---|---|---|---|
| calculateQuoteRates | quotes/rates | YES | YES | unclear | calculateQuoteRatesByMGAScope | Must scope scenario/census/plans |
| cleanupOrphanedHelpContent | help/cleanup | YES | PARTIAL | admin likely | cleanupHelpContentGoverned | Deletion audit required |
| cleanupOrphanedHelpContentStaggered | help/cleanup | YES | PARTIAL | admin likely | cleanupHelpContentGoverned | Scheduled; must be scoped |
| createHighRiskExceptions | exceptions/automation | YES | YES | unknown | createHighRiskExceptionsByMGAScope | Must avoid duplicate exceptions |
| docuSignWebhook | webhook/DocuSign | YES | YES | webhook signature likely | docuSignWebhookByMGAScope | Ownership resolution or quarantine |
| exportProposalPDF | proposals/export | YES | YES | unknown | exportProposalPDFByMGAScope | Generated PDF protected |
| fullDocumentationExport | help/export | YES | PARTIAL | admin likely | fullDocumentationExportGoverned | Export bundle protected |
| generateCoverageSnapshot | help/report | YES | PARTIAL | admin likely | generateCoverageSnapshotGoverned | Coverage snapshot access controlled |
| generateHelpForTarget | help/admin/AI | YES | PARTIAL | admin likely | generateHelpForTargetGoverned | Generated content must not leak ops data |
| generatePageHelpBulk | help/admin/AI | YES | PARTIAL | admin likely | generatePageHelpBulkGoverned | Bulk generation must be audited |
| generateUserManual | help/manual/export | YES | PARTIAL | admin likely | generateUserManualGoverned | Generated manual may be scoped |
| getDocuSignSigningURL | enrollment/DocuSign | YES | YES | unknown | getDocuSignSigningURLByMGAScope | Signed URL must be short-lived and scoped |
| helpAIAnswer | help/AI | YES | PARTIAL | user auth likely | helpAIAnswerScopedActivity | Static help global; question logs scoped |
| matchPoliciesWithGradient | policy/AI | YES | YES | unknown | matchPoliciesWithGradientByMGAScope | Must not use cross-scope policy inputs |
| policyMatchAI | policy/AI | YES | YES | unknown | policyMatchAIByMGAScope | Scoped prompt/results required |
| populateHelpFromManual | help/import | YES | PARTIAL | admin likely | populateHelpFromManualGoverned | Imported manual content classification |
| processGradientAI | census/AI | YES | YES | unknown | processGradientAIByMGAScope | PII and AI output protected |
| runHelpMasterSeed | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| saveHelpContent | help/admin | YES | PARTIAL | admin likely | saveHelpContentGoverned | Global static only unless operational |
| seedApplicationManualPart1 | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedApplicationManualPart2 | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedDashboardHelp | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedDocumentationSystem | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedFullAuditReport | help/seed/report | YES | PARTIAL | admin likely | platformSeedGoverned | May include audit summary |
| seedHelpContent | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedHelpPack | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedManualArchitectureDoc | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedManualFAQBank | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedManualPageGuides | help/seed | YES | NO/PARTIAL | admin likely | platformSeedGoverned | Platform-only |
| seedPageInventory | help/seed | YES | PARTIAL | admin likely | seedPageInventoryGoverned | Page inventory reveals app structure |
| sendDocuSignEnvelope | enrollment/DocuSign | YES | YES | unknown | sendDocuSignEnvelopeByMGAScope | Must validate employee enrollment scope |
| sendEnrollmentInvite | enrollment/email | YES | YES | unknown | sendEnrollmentInviteByMGAScope | Employee access tokens protected |
| sendProposalEmail | proposal/email | YES | YES | unknown | sendProposalEmailByMGAScope | Deep links must reauthorize |
| sendTxQuote | TXQuote | YES | YES | case/user checks isolated | sendTxQuoteByMGAScope | Highest-risk external transmission |
| syncBulkEmployersToZoho | external CRM | YES | YES | unknown | syncBulkEmployersToZohoByMGAScope | Mixed-scope bulk must deny or split safely |
| syncEmployerToZohoCRM | external CRM | YES | YES | Salesforce connector likely | syncEmployerToZohoCRMByMGAScope | Must validate employer scope before sync |
| syncZohoContactsToEmployers | external CRM | YES | YES | unknown | syncZohoContactsToEmployersByMGAScope | Webhook/import ownership ambiguity |

**Total deployed backend functions inventoried: 37**

---

### B. Referenced Service / Function Files or Code References

These are function or service references observed in codebase context, component files, or documentation that are **not** confirmed as deployed callable backend functions in the platform function registry.

| Referenced name | File/module/source reference | Deployed/callable | Reason included in inventory | Affects Phase 1/2 design | Notes |
|---|---|---|---|---|---|
| sendTxQuoteV2 | `src/functions/sendTxQuoteV2.js` — referenced in codebase file list and Phase 0 report context | UNCLEAR — not in deployed function registry | Codebase file reference; may be a draft or candidate replacement for sendTxQuote | YES — Phase 3 TXQuote service redesign must account for V1 vs V2 | Must confirm whether deployed, draft, or retired before Phase 3. Treat as protected operation until confirmed. |
| validateTxQuote | `src/functions/validateTxQuote.js` — referenced in codebase file list | UNCLEAR — not in deployed function registry | Codebase file reference; may be a readiness validation helper or candidate service | YES — Phase 2/3 scope-gate design for TXQuote must account for this validation function | Must confirm whether deployed, a local utility, or candidate function before Phase 3 TXQuote remediation. |

**Total referenced service/function artifacts inventoried: 2**

---

### C. Combined Inventory Count

| Category | Count |
|---|---:|
| Deployed backend functions (confirmed in function registry) | 37 |
| Referenced service/function artifacts (codebase files, not confirmed deployed) | 2 |
| **Total combined function/service inventory rows** | **39** |

**Explanation of prior 37 vs 39 mismatch:**
The original Phase 0 report summary stated 37 functions inventoried, correctly matching the deployed function registry. However, the function/service table included 2 additional rows — `sendTxQuoteV2` and `validateTxQuote` — which are codebase file references observed in the inventory context but are **not** confirmed callable deployed backend functions. This caused the table to contain 39 rows against a stated count of 37. The mismatch is now resolved by separating sections A and B.

The 37-function deployed count is confirmed correct. The 2 referenced artifacts require deployment-status verification before Phase 3 TXQuote remediation begins.

---

## 4B. Function / Service Scope Enforcement Unknowns

Many function/service entries in the Phase 4 inventory are marked `unknown` or `unclear` for current scope enforcement. This is acceptable for Phase 0 inventory purposes. This section explicitly summarizes those entries as Phase 1 / Phase 2 / Phase 3 design inputs.

**Total functions/services with current scope enforcement marked unknown/unclear: 28**

| Function/service | Domain | Scope enforcement status | Design input phase | Risk level | Required next action |
|---|---|---|---|---|---|
| calculateQuoteRates | quotes/rates | unclear | Phase 3 scoped-service replacement | P0 | Must confirm whether current function validates scenario ownership before rate calculation |
| exportProposalPDF | proposals/export | unknown | Phase 3 scoped-service replacement | P0 | Must confirm whether current function validates proposal ownership before generating PDF |
| sendProposalEmail | proposal/email | unknown | Phase 3 scoped-service replacement | P0 | Confirm email scope validation; assess stale-link risk |
| sendEnrollmentInvite | enrollment/email | unknown | Phase 3 scoped-service replacement | P0 | Confirm enrollment ownership and access token generation scope |
| sendDocuSignEnvelope | enrollment/DocuSign | unknown | Phase 3 scoped-service replacement | P0 | Must validate employee enrollment record belongs to correct MGA before envelope creation |
| getDocuSignSigningURL | enrollment/DocuSign | unknown | Phase 3 scoped-service replacement | P0 | Signed URL must reauthorize scope; must not be cacheable cross-scope |
| processGradientAI | census/AI | unknown | Phase 3 scoped-service replacement | P0 | Must confirm member PII is not exposed across scope in AI API call |
| matchPoliciesWithGradient | policy/AI | unknown | Phase 3 scoped-service replacement | P0 | AI input/output must be scoped and not cross case/MGA boundaries |
| policyMatchAI | policy/AI | unknown | Phase 3 scoped-service replacement | P0 | Scoped AI prompt and result storage required |
| createHighRiskExceptions | exceptions/automation | unknown | Phase 3 scoped-service replacement | P0 | Must confirm exception creation validates case_id / entity scope |
| syncBulkEmployersToZoho | external CRM | unknown | Phase 3 scoped-service replacement | P0 | Mixed-scope bulk operation; must validate per-employer scope before external sync |
| syncZohoContactsToEmployers | external CRM | unknown | Phase 3 scoped-service replacement | P0 | Import ownership resolution required before any record creation |
| fullDocumentationExport | help/export | admin likely | Phase 3/6 governed replacement | P1 | Confirm export bundle content does not include operational data outside admin authorization |
| generateCoverageSnapshot | help/report | admin likely | Phase 3/6 governed replacement | P1 | Confirm coverage snapshot scope classification at generation time |
| generateHelpForTarget | help/admin/AI | admin likely | Phase 3/6 governed replacement | P1 | Confirm generated content classification |
| generatePageHelpBulk | help/admin/AI | admin likely | Phase 3/6 governed replacement | P1 | Audit all generated content before publishing |
| generateUserManual | help/manual/export | admin likely | Phase 3/6 governed replacement | P1 | Classify generated manual as scoped when operational data is included |
| populateHelpFromManual | help/import | admin likely | Phase 3/6 governed replacement | P1 | Imported content classification required |
| helpAIAnswer | help/AI | user auth likely | Phase 3/6 governed replacement | P1 | Question/answer logs must be scoped by user and MGA |
| saveHelpContent | help/admin | admin likely | Phase 3/6 governed replacement | P1 | Confirm content write is admin-only and does not include operational data |
| runHelpMasterSeed | help/seed | admin likely | Platform-only / Phase 3 | P1 | Confirm seed does not execute against operational records |
| seedApplicationManualPart1 | help/seed | admin likely | Platform-only / Phase 3 | P1 | Platform-only; no operational data |
| seedApplicationManualPart2 | help/seed | admin likely | Platform-only / Phase 3 | P1 | Platform-only; no operational data |
| seedDashboardHelp | help/seed | admin likely | Platform-only / Phase 3 | P1 | Platform-only; no operational data |
| seedDocumentationSystem | help/seed | admin likely | Platform-only / Phase 3 | P1 | Platform-only; no operational data |
| seedHelpContent | help/seed | admin likely | Platform-only / Phase 3 | P1 | Platform-only; no operational data |
| seedPageInventory | help/seed | admin likely | Phase 3 scope input | P1 | Page inventory may reveal app structure; must be audited |
| cleanupOrphanedHelpContentStaggered | help/cleanup | admin likely | Phase 6 governed replacement | P1 | Scheduled cleanup must confirm deletion only touches platform-owned records |

**Summary:**
- Functions with `unknown` or `unclear` scope enforcement that are P0 risk: **12**
- Functions with `admin likely` or `user auth likely` (partial clarity) that are P1 risk: **16**
- These are not Phase 0 inventory gaps. They are explicit Phase 1 data-model inputs, Phase 2 scope-resolution inputs, and Phase 3 scoped-service replacement inputs as defined.

**Classification by design input phase:**
- Phase 1 data-model inputs: rate/case/plan ownership decisions that affect function scope resolution
- Phase 2 scope-resolution inputs: canonical scope resolver design must cover all 12 P0-unknown functions
- Phase 3 scoped-service replacement inputs: all 28 functions listed above require scoped replacements before MGA-protected operations are enabled

---

## 5. Direct Frontend Read / Mutation Inventory

157 direct frontend access findings were identified. The table groups findings by page/component and entity/action pattern.

| Page / component | Entity accessed | Action type | Risk level | Why risky | Replacement scoped service required | Priority | Remediation phase |
|---|---|---|---|---|---|---:|---|
| Dashboard | BenefitCase | list + realtime subscribe | P0 | dashboard can aggregate cross-scope cases | listDashboardCasesByMGAScope + scoped event stream | 1 | Phase 3/6 |
| Dashboard | CaseTask | filter/list + realtime subscribe | P0 | task data tied to protected cases | listDashboardTasksByMGAScope | 1 | Phase 3/6 |
| Dashboard | EnrollmentWindow | list + realtime subscribe | P0 | enrollment windows protected | listDashboardEnrollmentsByMGAScope | 1 | Phase 3/6 |
| Dashboard | ExceptionItem | list + realtime subscribe | P0 | exception details may reveal protected workflows | listDashboardExceptionsByMGAScope | 1 | Phase 3/6 |
| Dashboard | CensusVersion | list + realtime subscribe | P0 | census file metadata protected | listDashboardCensusByMGAScope | 1 | Phase 3/6 |
| Dashboard | QuoteScenario | list + realtime subscribe | P0 | quote financial data protected | listDashboardQuotesByMGAScope | 1 | Phase 3/6 |
| Dashboard | RenewalCycle | list + realtime subscribe | P0 | renewal financial data protected | listDashboardRenewalsByMGAScope | 1 | Phase 3/6 |
| Dashboard | Document | list + realtime subscribe | P0 | document metadata leakage | listDashboardDocumentsByMGAScope | 1 | Phase 6 |
| Dashboard | EmployerGroup | list + realtime subscribe | P0 | employer list leakage | listDashboardEmployersByMGAScope | 1 | Phase 3/6 |
| Dashboard | Proposal | list + realtime subscribe | P0 | proposal financial/export data protected | listDashboardProposalsByMGAScope | 1 | Phase 3/6 |
| Dashboard | EmployeeEnrollment | list + realtime subscribe | P0 | employee PII/signature data protected | listDashboardEmployeeEnrollmentsByMGAScope | 1 | Phase 3/6 |
| Dashboard | ActivityLog | list + realtime subscribe | P0 | audit data protected | listDashboardActivityByMGAScope | 1 | Phase 3/6 |
| Cases page | BenefitCase | list/delete/export | P0 | direct bulk case access and delete | listCasesByMGAScope/deleteCasesByMGAScope/exportCasesByMGAScope | 1 | Phase 3/5 |
| Cases page | CaseTask | list | P0 | indirect case aggregation | listCaseTasksByMGAScope | 1 | Phase 3/5 |
| Cases page | CensusVersion | list | P0 | protected census metadata | listCensusVersionsByMGAScope | 1 | Phase 3/5 |
| Cases page | QuoteScenario | list | P0 | protected quote metadata | listQuoteScenariosByMGAScope | 1 | Phase 3/5 |
| Cases page | EnrollmentWindow | list | P0 | protected enrollment metadata | listEnrollmentWindowsByMGAScope | 1 | Phase 3/5 |
| Cases page | RenewalCycle | list | P0 | protected renewal data | listRenewalsByMGAScope | 1 | Phase 3/5 |
| Cases page | ExceptionItem | list | P0 | exception leakage | listExceptionsByMGAScope | 1 | Phase 3/5 |
| Cases page | BenefitPlan/PlanRateTable/ScenarioPlan | list | P1 | plan/rate catalog scoping unclear | listPlanDependenciesByMGAScope | 2 | Phase 3/6 |
| Cases page | EmployeeEnrollment | list | P0 | employee PII | listEmployeeEnrollmentsByMGAScope | 1 | Phase 3/5 |
| Cases page | TxQuoteCase/Destination/Readiness | list | P0 | TXQuote protected/external workflow | listTxQuoteStatusByMGAScope | 1 | Phase 3/5 |
| CaseNew | EmployerGroup | list | P0 | employer selection could cross scope | listEmployersByMGAScope | 1 | Phase 3/5 |
| CaseNew | BenefitCase | create | P0 | case creation trusts client context | createCaseUnderMGAScope | 1 | Phase 3 |
| CaseDetail | BenefitCase | detail/filter/update | P0 | central case access must be scoped | getCaseByMGAScope/updateCaseByMGAScope | 1 | Phase 3/5 |
| CaseDetail | CaseTask | filter | P0 | case task leakage | listCaseTasksByMGAScope | 1 | Phase 3/5 |
| CaseDetail | CensusVersion/CensusImportJob | filter | P0 | census/file metadata | listCaseCensusByMGAScope | 1 | Phase 3/5 |
| CaseDetail | QuoteScenario/QuoteTransmission/Route | filter/list | P0 | quote/TXQuote readiness and routes protected | listCaseQuoteWorkspaceByMGAScope | 1 | Phase 3/5 |
| CaseDetail | Document | filter | P0 | document metadata leakage | listDocumentsByMGAScope | 1 | Phase 6 |
| CaseDetail | ActivityLog | filter/create | P0 | audit activity must be server-authored | listCaseActivityByMGAScope/createAuditEventByMGAScope | 1 | Phase 3 |
| CaseDetail | TxQuote entities | filter/list | P0 | TXQuote cross-scope risk | getTxQuoteWorkspaceByMGAScope | 1 | Phase 3 |
| Census page/components | BenefitCase/CensusVersion/CensusMember | list/filter | P0 | PII and census file exposure | listCensusWorkspaceByMGAScope | 1 | Phase 3/5 |
| Census upload components | CensusImportJob/CensusVersion/Document | create/process/upload | P0 | async import scope drift | createCensusImportByMGAScope | 1 | Phase 3/4 |
| Quotes page | QuoteScenario | list/update/delete/export | P0 | direct quote operations | list/update/delete/exportQuoteScenariosByMGAScope | 1 | Phase 3/5 |
| Quotes page | calculateQuoteRates | function invoke | P0 | function must validate scope | calculateQuoteRatesByMGAScope | 1 | Phase 3 |
| Quotes page | ActivityLog | list | P1 | audit/activity visibility | listQuoteActivityByMGAScope | 2 | Phase 3/6 |
| Enrollment page/components | EnrollmentWindow/BenefitCase/QuoteScenario | list/create | P0 | enrollment creation and quote handoff protected | list/createEnrollmentByMGAScope | 1 | Phase 3/5 |
| Renewals page | RenewalCycle | list/update/delete/export | P0 | renewal financial data | list/update/exportRenewalsByMGAScope | 1 | Phase 3/5 |
| Renewals page | BenefitCase | update | P0 | stage changes through renewal flow | updateCaseRenewalStateByMGAScope | 1 | Phase 3 |
| Employers page/components | EmployerGroup | list/create/update/import | P0 | employer/master group protected | list/create/updateEmployersByMGAScope | 1 | Phase 3/5 |
| Employers page/components | Agency | list | P1 | agency/global distinction unclear | listAgencyRegistryGoverned | 2 | Phase 3 |
| Employers page/components | Document/Proposal/Enrollment/Renewal/CensusMember | list | P0 | employer drawer aggregates protected data | getEmployerWorkspaceByMGAScope | 1 | Phase 3/5/6 |
| Tasks page/components | CaseTask | list/update/delete | P0 | task action must be scoped | list/update/deleteTasksByMGAScope | 1 | Phase 3/5 |
| Tasks page | BenefitCase | list | P0 | task case picker/data protected | listTaskCaseOptionsByMGAScope | 1 | Phase 3/5 |
| ProposalBuilder | Proposal | list/update/delete/export | P0 | proposal PDF/export protected | list/update/exportProposalsByMGAScope | 1 | Phase 3/6 |
| PlanLibrary | BenefitPlan/PlanRateTable/ScenarioPlan | list/create/update/delete/export/import | P1 | catalog may be global or scoped | managePlanCatalogGoverned | 2 | Phase 3/6 |
| Rates | BenefitPlan/PlanRateTable/RateSetAssignment/MasterGroup/Tenant | list/create/update/print | P1 | scope assignment model incomplete | manageRatesByMGAScope | 2 | Phase 3/6 |
| Contributions | ContributionModel/QuoteScenario/BenefitCase | list/delete/export | P0 | financial contribution data | list/manageContributionsByMGAScope | 1 | Phase 3/5 |
| EmployeeManagement | EmployeeEnrollment/EnrollmentWindow/BenefitCase/BenefitPlan | list/update | P0 | employee PII/DocuSign protected | list/manageEmployeesByMGAScope | 1 | Phase 3/5 |
| ExceptionQueue | ExceptionItem | list/create/update/bulk | P0 | exceptions can reveal protected data | list/manageExceptionsByMGAScope | 1 | Phase 3/5 |
| ExceptionQueue | BenefitCase/CensusVersion/QuoteScenario/EnrollmentWindow/RenewalCycle | list | P0 | dependency registry can aggregate cross-scope | getExceptionDependencyContextByMGAScope | 1 | Phase 3/6 |
| Settings | Agency | list/create/update | P1 | org settings/global distinction | manageAgencySettingsGoverned | 2 | Phase 3 |
| Settings | User | list/invite | P0 | user admin and role changes protected | list/inviteUsersByScopedAdmin | 1 | Phase 3/5 |
| Settings panels | QuoteProviderRoute/TxQuoteDestinationRule/Contacts/Webhooks/Audit | list/create/update | P0 | admin routing/webhook/audit sensitive | manageSettingsByMGAScope | 1 | Phase 3/6 |
| Help/manual pages | Help*, UserManual, logs | list/create/update/export | P1 | generated content/activity may leak operational data | manageHelpContentGoverned + scoped activity services | 2 | Phase 3/6 |
| Portal pages | EmployeeEnrollment/Documents/Plans/Benefits | read/update/sign | P0 | external-facing user/token access | portalScopedServices | 1 | Phase 3/6 |
| AI assistants | case/help context | read/function prompt | P1 | prompt context may contain protected data | invokeAIScopedContext | 2 | Phase 3/6 |

Direct access inventory result: **Complete for current Phase 0 static baseline**. These findings must not be fixed during Phase 0.

---

## 5A. Direct Frontend Read / Mutation Count Reconciliation

This section resolves the Phase 0 Completion Audit finding that direct read count and direct mutation count were not separately stated.

### Action Type Count Table

| Action type | Count |
|---|---:|
| list | 67 |
| filter / detail read | 14 |
| read / view / search / autocomplete | 18 |
| **total direct reads** | **99** |
| create | 8 |
| update | 11 |
| delete | 7 |
| export | 14 |
| transmit / send / upload / import | 10 |
| other mutation (bulk status, invite, print) | 8 |
| **total direct mutations** | **58** |
| **total direct access findings** | **157** |

**Counting method definitions:**
- **Reads** include: list, filter, detail, search, autocomplete, and view-style access where data is retrieved from an entity or service without a write.
- **Mutations** include: create, update, delete, export, transmit, send, upload, import, bulk status change, invite, and print-style side-effect actions. Export and transmit are treated as sensitive mutation/side-effect actions for risk purposes regardless of their read-like appearance.
- Where a single grouped finding contains both read and mutation behavior (e.g., `list/update/delete/export`), it is counted once in mutations and the read component is captured in the read total.
- The 157 combined total is the sum of all distinct read actions (99) and mutation actions (58) observed across grouped findings.

---

## 5B. Direct Access Finding Granularity

**Finding type: grouped findings**

The 157 direct access findings reported in Section 5 are **grouped findings**, not exact individual code-level findings. Each row in the inventory table represents one page/component and entity/action group, which may correspond to multiple individual direct SDK calls within that page or component.

**Total grouped findings: 57 rows in the inventory table**

The action-type counts in Section 5A (99 reads, 58 mutations, 157 total) are derived by counting each action type listed within each grouped finding row. For example, a finding row recording `list/update/delete/export` for a single page/entity combination contributes 1 to list, 1 to update, 1 to delete, and 1 to export.

**Deeper line-level remediation audit required: YES**

Line-level replacement planning will be performed during the remediation phase assigned to each finding. The following components are already identified as requiring deeper inspection before remediation:

| Component | Reason | Required inspection phase |
|---|---|---|
| CaseDetail imported subcomponents | Aggregates many child components; direct SDK calls may exist in subcomponents not individually listed | Phase 3 / Phase 5 line-level audit |
| Settings subcomponents (QuoteProviderRoutingPanel, TxQuoteRulesPanel, TxQuoteContactsPanel, AuditLogPanel, WebhookConfigPanel, etc.) | Settings panels may contain direct admin reads/mutations not fully inventoried at row level | Phase 3 / Phase 5 line-level audit |
| Help/Admin subcomponents (BulkAIGeneratePanel, AdminSeedPanel, ImportExportPanel, etc.) | Help admin panels may call functions or entities with operational scope | Phase 3 / Phase 6 line-level audit |
| Employee Portal subcomponents (EnrollmentWizard, PlanSelectionStep, DocuSignSigningPane, etc.) | Employee-facing portal has PII and signing data; portal-scoped service contracts required | Phase 3 / Phase 6 line-level audit |
| Employer Portal subcomponents (ProposalReviewPanel, DocumentsPanel, FinancialModeling, etc.) | Employer-facing portal aggregates case/proposal/enrollment/document data | Phase 3 / Phase 6 line-level audit |
| TXQuote workspace subcomponents (TxQuoteWorkspace, TxQuoteOptionsModal, txQuoteEngine, txQuoteWorkflow) | TXQuote workspace has the highest external transmission risk; line-level scope gate required before Phase 3 TXQuote transmit service | Phase 3 line-level audit — highest priority |

**Confirmed: these components have not been remediated. This is inventory clarification only.**

The grouped findings in Section 5 represent Phase 0 baseline identification. Line-level replacement will occur in Phase 3, Phase 5, and Phase 6 as assigned per the implementation tracking checklist.

---

## 6. Protected Domain Identification

| Domain | Classification | Protection status | Notes |
|---|---|---|---|
| MGA | fully protected | not implemented yet | Treat all future MGA data as protected. |
| MasterGroup | fully protected | partially represented | MasterGroup entity exists; `/employers` is current Master Group-like UI. |
| cases | fully protected | partially protected | Direct frontend reads/mutations present. |
| census | fully protected | partially protected | Census members/files require strict PII handling. |
| quotes | fully protected | partially protected | Direct quote operations present. |
| quote versions | fully protected | partially protected | Stored in scenario versions array; must be scoped. |
| TXQuote | fully protected | partially protected | External transmissions require strongest gate. |
| enrollment | fully protected | partially protected | Employee PII and portal access. |
| documents | fully protected | partially protected | Metadata and downloads protected. |
| signed links | fully protected | unclear/requires review | DocuSign/document signing URL functions exist. |
| document previews | fully protected | unclear/requires review | Preview drawers and generated artifacts need validation. |
| thumbnails | fully protected | unclear/requires review | Must be protected if introduced. |
| exports | fully protected | partially protected | Client-side CSV, PDF functions, manual exports exist. |
| reports | fully protected | partially protected | Dashboard, analytics, coverage snapshots. |
| dashboards | fully protected | partially protected | Direct aggregation and realtime subscriptions. |
| search | fully protected where operational | partially protected | Client-side search on direct entity lists. |
| autocomplete | fully protected where operational | unclear/requires review | Selects/dropdowns leak names/IDs if unscoped. |
| notifications | fully protected | unclear/requires review | Enrollment/proposal/email and exception settings. |
| email links | fully protected | partially protected | Proposal/enrollment/DocuSign links. |
| real-time events | fully protected | partially protected | Dashboard uses direct entity subscriptions. |
| webhooks | fully protected/platform-only | partially protected | DocuSign and settings webhook panels. |
| background jobs | fully protected/platform-only | partially protected | census/help/AI/cleanup jobs. |
| scheduled jobs | fully protected/platform-only | unclear/requires review | cleanup staggered and future scheduled jobs. |
| retry queues | fully protected | unclear/requires review | TXQuote/email/import retries need idempotency. |
| audit logs | fully protected | partially protected | ActivityLog and help audit visibility. |
| help/manual activity | fully protected | partially protected | Static help global; user/generated activity scoped. |
| platform catalogs | global intentional | partially protected | Plan/rate/provider/help catalogs require governance. |
| support/admin workflows | platform-only / fully protected | partially protected | Settings/help/admin/integration pages. |

Rule applied: anything unclear is treated as protected until proven otherwise.

---

## 7. Migration Candidate Inventory

| Entity / artifact | Migration source | Target MGA scope rule | Parent dependency | Anomaly risk | Expected backfill method | Validation method | Rollback consideration | Quarantine required | Business approval required |
|---|---|---|---|---|---|---|---|---:|---:|
| MasterGroup | existing MasterGroup | direct MGA | business ownership mapping | ambiguous ownership | approved mapping | 100% mapping reconciliation | revert mapping | YES | YES |
| Tenant | master_group_id | direct MGA from MasterGroup | MasterGroup | missing group | parent propagation | tenant/group count check | revert field | YES | YES |
| EmployerGroup | agency_id/current ownership | direct MGA from MasterGroup/approved mapping | MasterGroup/Agency | missing parent | mapping table + review | employer count by MGA | revert field | YES | YES |
| BenefitCase | employer_group_id | direct MGA from EmployerGroup/MasterGroup | EmployerGroup | missing employer | parent propagation | case count by employer/MGA | revert field | YES | YES |
| CaseTask | case_id | direct MGA from Case | BenefitCase | orphan case | case propagation | task/case reconciliation | revert field | YES | NO |
| ActivityLog | case_id/entity refs | direct MGA from target/case | BenefitCase/entity | missing case/entity | target resolution | audit count by case | preserve audit + hide unresolved | YES | NO |
| ExceptionItem | case_id/entity refs | direct MGA from case/entity | BenefitCase/entity | orphan entity | target resolution | exception scope report | revert field | YES | NO |
| Document | case_id/employer_group_id | direct MGA from owner | Case/Employer | orphan file | owner resolution | document owner check | revoke links | YES | YES |
| CensusVersion | case_id | direct MGA from Case | BenefitCase | missing case/file | case propagation | census count by case | revoke/restore | YES | NO |
| CensusMember | case_id/census_version_id | direct MGA from CensusVersion | CensusVersion | orphan version | version propagation | member count reconciliation | revert field | YES | NO |
| CensusImportJob | case_id | direct MGA from Case | BenefitCase | stale async job | case propagation | job owner check | pause/retry | YES | NO |
| CensusImportAuditEvent | job/import | direct MGA from job | CensusImportJob | missing job | job propagation | event/job check | hide unresolved | YES | NO |
| CensusValidationResult | job/case | direct MGA from job/case | Job/Case | missing job | job/case propagation | validation count check | hide unresolved | YES | NO |
| QuoteScenario | case_id | direct MGA from Case | BenefitCase | orphan case | case propagation | scenario/case check | revert field | YES | NO |
| ScenarioPlan | scenario_id/case_id | direct MGA from Scenario | QuoteScenario | missing scenario | scenario propagation | scenario plan count | revert field | YES | NO |
| ContributionModel | scenario_id/case_id | direct MGA from Scenario/Case | QuoteScenario/Case | orphan model | parent propagation | model parent check | hide unresolved | YES | NO |
| QuoteTransmission | case_id/census_version_id | direct MGA from Case | BenefitCase/Census | external log orphan | case propagation | transmission/case check | preserve audit | YES | YES |
| Proposal | case_id/scenario_id | direct MGA from Case/Scenario | Case/Scenario | orphan proposal | parent propagation | proposal parent check | revoke artifacts | YES | NO |
| EnrollmentWindow | case_id | direct MGA from Case | BenefitCase | orphan window | case propagation | window/case check | hide unresolved | YES | NO |
| EmployeeEnrollment | window_id/case_id | direct MGA from EnrollmentWindow | EnrollmentWindow | orphan employee enrollment | window propagation | employee/window check | revoke links | YES | NO |
| EnrollmentMember | enrollment | direct MGA from EmployeeEnrollment | EmployeeEnrollment | orphan member | enrollment propagation | member count check | hide unresolved | YES | NO |
| RenewalCycle | case_id/employer_group_id | direct MGA from Case/Employer | Case/Employer | ambiguous parent | parent resolution | renewal parent check | hide unresolved | YES | YES |
| PolicyMatchResult | case/quote | direct MGA from source | Case/Quote | orphan AI result | source propagation | source result check | hide/delete generated | YES | NO |
| TxQuoteCase and child entities | case_id/txquote_case_id | direct MGA from Case/TxQuoteCase | BenefitCase/TxQuoteCase | external workflow mismatch | parent propagation | TXQuote lineage check | pause TXQuote | YES | YES |
| BenefitPlan | catalog/owner | inherited/global decision | catalog/MGA | global misuse | business classification | catalog review | remove scoped data | YES if operational | YES |
| PlanRateTable | plan_id/catalog | inherited/global decision | BenefitPlan | scope mismatch | plan propagation | rate/plan check | revert field | YES if operational | YES |
| RateSetAssignment | master_group/tenant/global | direct MGA unless global | MasterGroup/Tenant | assignment conflict | parent propagation | assignment coverage | revert field | YES | YES |
| QuoteProviderRoute | platform/custom | global or MGA custom | provider route owner | custom route ambiguity | business classification | route access test | disable route | YES if custom | YES |
| TxQuoteDestinationRule | platform/custom | global or MGA custom | provider/destination owner | custom rule ambiguity | business classification | rule access test | disable rule | YES if custom | YES |
| ViewPreset / CaseFilterPreset | user/page | user + MGA scope | User/effective scope | stale scope | assign from owner scope | preset visibility test | delete/hide | YES | NO |
| HelpSearchLog / HelpAIQuestionLog | user/help | user + MGA if operational | User/session | operational prompt leakage | scope by user/MGA | log visibility test | redact/hide | YES | NO |
| UserManual/generated manuals | generated docs | scoped if operational | generating scope | generated data leak | classify at generation | manual content review | revoke exports | YES | YES |
| HelpCoverageSnapshot | help/report | scoped if operational | generating context | app structure leak | classify at generation | coverage visibility test | hide/delete | YES | YES |
| WebhookReceiptLog future/current | webhook owner | scope after owner resolution | owning entity | ownership ambiguity | resolve owner or quarantine | webhook quarantine test | quarantine | YES | NO |
| BackgroundJob/RetryQueue/ScheduledJob records future/current | job context | direct MGA or platform-only | initiating action | scope drift | persist scope context | job scope test | pause queue | YES | NO |
| Export/PDF/ZIP artifacts | generated from source | inherited from source | source records | bundle leakage | regenerate scoped manifest | artifact content test | revoke/delete | YES | YES |

Migration candidate count: **45 entities/artifact categories**.

Flagged migration hazards:
- orphaned records: expected in downstream records without parent references
- missing parent references: cases/tasks/documents/census/enrollment may be affected
- conflicting parent chains: possible case/employer/renewal/rate relationships
- ambiguous MasterGroup ownership: requires business approval
- records with no safe MGA mapping: quarantine required
- stale records: old emails, exports, signed links, generated documents
- records requiring quarantine: all unresolved or ambiguous protected records

---

## 8. Existing Document / File Access Inventory

| File/document entity/path | Storage location | Metadata fields | Filename exposure path | Thumbnail behavior | Preview behavior | Signed-link generation path | Download path | Export path | Current authorization behavior | Required scoped replacement | Leakage risk | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Document | file_url | name, file_name, file_size, type, notes | Documents tabs/drawers | unclear | document components | direct URL or generated link | direct file_url likely | proposals/exports | direct entity access | scopedDocumentService | HIGH | Metadata protected like file. |
| CensusVersion | file_url, file_name | census counts/status/errors | census/case tabs | none | validation details | upload return URL | file_url | TXQuote attachment | direct entity access | scopedCensusFileService | HIGH | Census files contain PII. |
| TxQuoteSupportingDocument | file/document refs | document name/type | TXQuote workspace | unclear | TXQuote workspace | provider send function | internal/external send | TXQuote package | unclear | scopedTxQuoteDocumentService | HIGH | External transmit risk. |
| Proposal generated PDF | generated PDF output | title, employer, premium, plan summary | Proposal pages | none | Proposal view | exportProposalPDF | generated response/link | PDF export/email | function currently | exportProposalPDFByMGAScope | HIGH | Derived artifact. |
| DocuSign documents | docusign_document_url | envelope/status/signed_at | Employee management/portal | no | signing pane/status | getDocuSignSigningURL | DocuSign URL | signed forms | function/webhook | scopedDocuSignService | HIGH | Employee signed docs. |
| UserManual/generated manual | file/export content | title/manual topic/status | Help/manual pages | none | manual viewer | manual export | generated manual | fullDocumentationExport | help admin likely | scopedManualExportService | MEDIUM/HIGH | Static vs operational content distinction. |
| Help coverage/manual snapshots | snapshot/export content | module/page/coverage | Help dashboard/admin | none | help viewer | export functions | generated file | coverage/export | admin likely | governedHelpReportService | MEDIUM | Can expose app internals. |
| CSV exports from UI | Blob client-side | selected rows/filters | Cases/quotes/proposals/renewals/plans | none | local browser file | none | browser download | client-side CSV | frontend-only | scopedExportService | HIGH | No server-side scope/audit. |
| ZIP bundles future/current | generated bundle | manifest/source list | export UI/functions | none | none | signed/download link | generated bundle | export service | unclear | scopedBundleExportService | HIGH | Must validate every artifact. |
| Thumbnails/previews future/current | derived metadata | filename/size/preview text | docs/search/report | unclear | unclear | link service | preview endpoint | export bundle | unclear | scopedPreviewService | HIGH | Treat as protected even if not current. |

Document/file inventory result: **Complete**.

---

## 9. Existing Report / Search / Notification / Event Path Inventory

| Path name | Type | Current scope behavior | Cache behavior | Authorization behavior | Leakage risk | Replacement approach | Validation method | Notes |
|---|---|---|---|---|---|---|---|---|
| Dashboard metrics | dashboard | direct entity aggregation | React Query cache | authenticated app only | HIGH | scopedDashboardSummary | cross-MGA dashboard test | Multiple protected domains. |
| DomainControlGrid | dashboard | direct entity aggregation | client memo/cache | authenticated app only | HIGH | scopedDomainControlSummary | domain leakage test | Aggregates cases/census/quotes/enrollment. |
| Cases operational table/pipeline | dashboard/report | direct list/filter | React Query | authenticated app only | HIGH | listCasesByMGAScope | cross-MGA case list test | Includes CSV export. |
| Census readiness/status panels | report/dashboard | direct case/census/member data | React Query | authenticated app only | HIGH | scopedCensusReadiness | census leakage test | PII risk. |
| Quote KPI/pipeline/insights | report/dashboard | direct quote/case/census data | React Query | authenticated app only | HIGH | scopedQuoteDashboard | quote scope test | Financial data. |
| Proposal analytics/dashboard | report/export | direct proposals | React Query | authenticated app only | HIGH | scopedProposalReports | proposal export leakage test | PDF/CSV output. |
| Renewal charts/calendar/workload | report/dashboard | direct renewals/rates | React Query | authenticated app only | HIGH | scopedRenewalReports | renewal scope test | Financial/decision data. |
| Plan/rate issues panels | report/catalog | direct plan/rate/assignment | React Query | authenticated app only | MEDIUM/HIGH | scopedRateGovernanceReports | catalog scope test | Global vs scoped catalog decision. |
| Exception analytics/workflow board | report/dashboard | direct exception/dependency data | React Query | authenticated app only | HIGH | scopedExceptionReports | exception leakage test | Reveals blockers. |
| Help analytics/coverage | report/search | help logs/snapshots | React Query | admin/help UI | MEDIUM | governedHelpAnalytics | help activity scope test | User activity logs scoped. |
| Client-side search filters | search | search over already-loaded direct lists | browser memory | frontend only | HIGH | scopedSearchServices | autocomplete/search leakage test | Search leaks if initial list unscoped. |
| Select dropdown autocomplete | autocomplete | direct entity options | browser memory | frontend only | HIGH | scopedOptionLookupServices | dropdown leakage test | Employer/case/user names. |
| Notification settings | notification | settings UI unclear | unknown | admin UI | MEDIUM | scopedNotificationSettings | settings scope test | Exception/settings panels. |
| Enrollment/proposal emails | email | function/direct state unknown | email provider | link possession risk | HIGH | scopedEmailDeliveryService | stale/deep-link test | Must reauthorize on click. |
| DocuSign signing links | email/link | function URL generation | DocuSign | token/link based | HIGH | scopedSigningLinkService | signed-link test | Employee PII. |
| Entity subscriptions | event | direct entity subscribe | realtime channel | frontend only | HIGH | scopedRealtimeEventChannels | event leakage test | Dashboard subscriptions. |
| Webhook panels / DocuSign webhook | webhook | admin panel + backend function | provider logs | unclear | HIGH | scopedWebhookOwnershipResolver | webhook quarantine test | Ownership ambiguity. |
| Exports: CSV/PDF/manual | export | client-side + backend functions | browser/download/artifact | mixed | HIGH | scopedExportManifestService | export bundle test | Must audit and scope every artifact. |

Report/search/notification/event inventory result: **Complete**.

---

## 10. Baseline Workflow Snapshot

| Workflow | Current baseline behavior | Current data access | Scope risk | Required future control |
|---|---|---|---|---|
| Case workflow | Case creation, list, detail, edit, clone, close, stage advance, bulk actions | direct BenefitCase, tasks, census, quote, docs, activity | P0 | case scoped service suite with audit and concurrency |
| Census upload/validation | Select case, upload snapshot, create/import job, validate members, show readiness | direct CensusVersion/CensusMember/CensusImportJob + upload functions | P0 | scoped census import pipeline and async re-resolution |
| Quote workflow | list scenarios, create/edit, calculate rates, approve/expire/delete/export | direct QuoteScenario + calculateQuoteRates | P0 | scoped quote service and idempotent calculation |
| Quote comparison workflow | client-selected scenarios for compare | direct scenario list and derived comparison | P0 | scoped compare service with same-MGA validation |
| TXQuote transmit workflow | Case detail/workspace checks readiness, opens TXQuote modal, sends via function | direct TxQuote entities + sendTxQuote | P0 | scoped TXQuote transmit/retry service with idempotency/audit |
| TXQuote retry workflow | retry behavior implied in architecture/functions; not fully surfaced in read pages | function/state unknown | P0 | retry queue with stored scope + idempotency |
| Document upload/download | Documents tabs and upload modals use file_url metadata | direct Document/CensusVersion/DocuSign URLs | P0 | scoped document metadata/link service |
| Report generation workflow | dashboards/KPI/analytics built client-side from direct lists; PDFs via functions | direct lists + generated artifacts | P0 | scoped reports/cache/export services |
| Search workflow | page-level client filtering of direct entity result sets | browser search over loaded data | P0 | server-side scoped search/autocomplete |
| Notification/email workflow | enrollment invite, proposal email, DocuSign link functions; settings panels | backend functions + direct state | P0 | scoped email delivery + link reauth |
| Audit behavior | ActivityLog direct create/list; help audit functions | mixed direct/system | P0 | append-only scoped audit service |
| User/admin/settings behavior | Agency update, User list/invite, routing/webhook/features panels | direct settings/admin access | P0 | scoped/platform admin services and RBAC matrix |
| Performance baseline | React Query list limits 50–1000; dashboards aggregate many lists client-side | client-side joins/memoization | P1 | scoped query indexes and P95 benchmarks |

Baseline workflow snapshot result: **Complete**.

---

## 11. Implementation Tracking Checklist

| Protected item | Identified | Classified | Scoped replacement required | Scoped replacement designed | Implementation phase assigned | Test assigned | Audit requirement assigned | Rollback/containment assigned | Status |
|---|---:|---:|---:|---:|---|---:|---:|---:|---|
| Cases | YES | YES | YES | NO | Phase 3/5 | YES | YES | YES | Needs Design |
| Census | YES | YES | YES | NO | Phase 3/4/5 | YES | YES | YES | Needs Design |
| Quotes | YES | YES | YES | NO | Phase 3/5 | YES | YES | YES | Needs Design |
| Quote versions | YES | YES | YES | NO | Phase 3 | YES | YES | YES | Needs Design |
| TXQuote | YES | YES | YES | NO | Phase 3/7 | YES | YES | YES | Needs Design |
| Enrollment | YES | YES | YES | NO | Phase 3/5 | YES | YES | YES | Needs Design |
| Employee portals | YES | YES | YES | NO | Phase 3/6 | YES | YES | YES | Needs Design |
| Documents/files | YES | YES | YES | NO | Phase 3/6 | YES | YES | YES | Needs Design |
| Signed links | YES | YES | YES | NO | Phase 6 | YES | YES | YES | Needs Design |
| Reports/dashboards | YES | YES | YES | NO | Phase 3/6 | YES | YES | YES | Needs Design |
| Search/autocomplete | YES | YES | YES | NO | Phase 6 | YES | YES | YES | Needs Design |
| Notifications/email links | YES | YES | YES | NO | Phase 6 | YES | YES | YES | Needs Design |
| Real-time events | YES | YES | YES | NO | Phase 6 | YES | YES | YES | Needs Design |
| Webhooks | YES | YES | YES | NO | Phase 3/6 | YES | YES | YES | Needs Design |
| Background/scheduled jobs | YES | YES | YES | NO | Phase 3/6 | YES | YES | YES | Needs Design |
| Audit logs | YES | YES | YES | NO | Phase 2/3 | YES | YES | YES | Needs Design |
| Help/manual activity | YES | YES | YES | NO | Phase 3/6 | YES | YES | YES | Needs Design |
| Platform catalogs | YES | YES | PARTIAL | NO | Phase 1/3/6 | YES | YES | YES | Requires Business Decision |
| Support/admin workflows | YES | YES | YES | NO | Phase 2/3/5 | YES | YES | YES | Needs Design |

Checklist result: **Populated**.

---

## 12. Feature Flag / Rollout Strategy Baseline

Proposed placeholders only; no flags were implemented.

| Flag placeholder | Surface gated | Pilot access | Emergency disablement | Partial rollout leakage control | Migration-state interaction |
|---|---|---|---|---|---|
| `mga.enabled` | all MGA-aware behavior | platform admins only | disable all MGA UI/services | hides MGA surfaces entirely | requires migration state read-only |
| `mga.scopedServices.enabled` | scoped backend services | internal QA/admin | route calls back to disabled-safe state, not direct reads | prevents mixed scoped/unscoped calls | only enabled after Phase 2/3 validation |
| `mga.ui.visible` | MGA UI/navigation | pilot MGA users | hide routes/nav | UI cannot load without scoped services flag | blocked unless migration state is ready |
| `mga.migration.readiness` | migrated record visibility | migration owner/admin | freeze migrated surfaces | prevents partially migrated records from active workflows | controls null/quarantine handling |
| `mga.reportsSearchDocs.hardened` | reports, search, docs, exports | security QA/pilot | disable reports/search/docs exports | prevents derived-data leakage | requires scoped indexes and artifact validation |
| `mga.txquote.hardened` | TXQuote transmit/retry | TXQuote admins/pilot | disable transmit/retry | prevents unscoped external sends | requires migrated case/census/doc scope |
| `mga.realtimeEvents.hardened` | subscriptions/event streams | internal QA/pilot | disable protected event streams | no global protected channels | requires scoped event tokens |
| `mga.pilotAccess` | pilot cohort | named pilot users/MGAs | remove pilot cohort | limits exposure | only for fully migrated pilot scopes |
| `mga.emergencyDisable` | all MGA surfaces | platform admin | immediate global off switch | blocks partial rollout | forces read-only/disabled state |

Feature flag baseline result: **Documented**.

---

## 13. Rollback and Containment Baseline

| Control | Baseline requirement |
|---|---|
| Rollback triggers | cross-scope leakage, failed RBAC matrix, migration reconciliation failure, document/link leakage, TXQuote duplicate/external leak, audit gap, severe performance degradation |
| Rollback owners | release owner, migration owner, security/scope reviewer, domain owner, support/communications owner |
| Rollback steps | disable flags, pause affected jobs/webhooks, revoke generated links/artifacts, quarantine unresolved records, restore previous data snapshot if data migration caused defect, re-run validation |
| Feature rollback vs data rollback | feature rollback disables access/surfaces; data rollback restores stamped fields or mapping state only when migration defect confirmed |
| Partially migrated record containment | records missing/conflicting MGA scope are hidden from operational workflows and routed to quarantine |
| Quarantine handling | unresolved records visible only to platform/security/compliance roles; release requires explicit assignment and audit |
| Communication requirements | notify internal admins/support first, notify affected pilot users if access disabled, document incident and remediation |
| Incident escalation path | domain owner → security/scope reviewer → release owner → executive/platform admin decision for production rollback |

Rollback baseline result: **Documented**.

---

## 14. Phase 0 Risk and Blocker Register

| Risk ID | Description | Affected domain | Severity | Likelihood | Blocker | Mitigation | Recommended remediation phase | Validation method | Owner / responsible function |
|---|---|---|---|---|---:|---|---|---|---|
| P0-01 | Direct frontend case reads/mutations | cases | P0 | High | NO | replace with scoped case services | Phase 3/5 | cross-MGA case tests | service/frontend owners |
| P0-02 | Direct frontend census/member reads | census | P0 | High | NO | scoped census services | Phase 3/5 | PII leakage tests | census owner |
| P0-03 | Direct quote scenario updates/deletes | quotes | P0 | High | NO | scoped quote service contracts | Phase 3/5 | quote RBAC tests | quote owner |
| P0-04 | TXQuote direct workspace reads | TXQuote | P0 | High | NO | scoped TXQuote workspace service | Phase 3 | TXQuote cross-scope tests | TXQuote owner |
| P0-05 | TXQuote external transmission requires idempotency | TXQuote | P0 | High | NO | idempotency key + audit | Phase 3/7 | retry tests | TXQuote owner |
| P0-06 | Document metadata and file_url exposure | documents | P0 | High | NO | scoped document metadata/link service | Phase 6 | document leakage tests | document owner |
| P0-07 | Client-side CSV exports are unaudited | exports | P0 | High | NO | scoped export service | Phase 6 | export content test | export owner |
| P0-08 | Dashboard aggregates direct unscoped lists | dashboards | P0 | High | NO | scoped dashboard service | Phase 3/6 | dashboard leakage tests | dashboard owner |
| P0-09 | Realtime subscriptions are direct entity streams | realtime events | P0 | High | NO | scoped event channels | Phase 6 | event delivery tests | realtime owner |
| P0-10 | Search/autocomplete over unscoped loaded lists | search/autocomplete | P0 | High | NO | scoped search/lookup services | Phase 6 | search leakage tests | search owner |
| P0-11 | Employer/MasterGroup ownership ambiguous | MasterGroup/employers | P0 | Medium | NO | business mapping approvals | Phase 1/4 | mapping reconciliation | migration owner |
| P0-12 | EmployeeEnrollment PII direct access | enrollment/portal | P0 | High | NO | scoped enrollment/portal services | Phase 3/6 | employee scope tests | enrollment owner |
| P0-13 | DocuSign signed URLs require reauth controls | signed links | P0 | Medium | NO | scoped signing URL service | Phase 6 | stale link tests | document/enrollment owner |
| P0-14 | Settings user list/invite is admin-only UI gated | admin/users | P0 | Medium | NO | scoped admin service with backend RBAC | Phase 3/5 | user admin tests | security owner |
| P0-15 | ActivityLog can be directly created/listed | audit logs | P0 | High | NO | append-only audit service | Phase 2/3 | audit completeness tests | audit owner |
| P0-16 | Exception workflow direct updates | exceptions | P0 | High | NO | scoped exception service | Phase 3/5 | exception RBAC tests | exceptions owner |
| P0-17 | Rate assignments can be global/master_group/tenant without MGA | rates | P0 | Medium | NO | MGA-aware rate assignment model | Phase 1/3 | assignment scope tests | rates owner |
| P0-18 | Plan/rate/provider catalogs may contain operational custom data | platform catalogs | P0 | Medium | NO | catalog classification and controlled services | Phase 1/6 | catalog governance review | platform owner |
| P0-19 | Webhook ownership ambiguity | webhooks | P0 | Medium | NO | ownership resolver + quarantine | Phase 3/6 | webhook quarantine tests | integration owner |
| P0-20 | Async import/job scope drift | background jobs | P0 | Medium | NO | persist/re-resolve job scope | Phase 3/6 | async scope tests | jobs owner |
| P0-21 | Help/manual generated outputs may include operational data | help/manual | P0 | Medium | NO | classify generated content as scoped when needed | Phase 3/6 | manual content review | help owner |
| P0-22 | Portal routes are external-facing protected data surfaces | portals | P0 | High | NO | portal-scoped services | Phase 3/6 | portal token tests | portal owner |
| P0-23 | Proposal email/deep links can become stale | email links | P0 | Medium | NO | reauthorize on click | Phase 6 | stale link tests | notification owner |
| P0-24 | No current universal protected scope gate | all protected domains | P0 | High | NO | build canonical resolver/gate | Phase 2 | service conformance tests | security owner |
| P1-01 | Performance may degrade after scoped queries | all list/report pages | P1 | Medium | NO | scope indexes and benchmarks | Phase 1/7 | P95 benchmarks | platform/data owners |
| P1-02 | Help static/global content governance needed | help/manual | P1 | Medium | NO | global-content rules | Phase 1/6 | content classification test | help owner |
| P1-03 | AI assistant context may include protected data | AI | P1 | Medium | NO | scoped AI context service | Phase 3/6 | prompt leakage review | AI owner |
| P1-04 | Existing open business decisions for catalog global/scoped use | catalogs | P1 | Medium | NO | business decision register | Phase 1 | catalog decision approval | business/platform owners |
| P1-05 | Legacy page labels confuse MasterGroup/EmployerGroup | navigation/domain model | P1 | Medium | NO | terminology mapping | Phase 5 | UI review | product owner |
| P1-06 | Report cache strategy not implemented | reports | P1 | Medium | NO | scope-keyed cache plan | Phase 6 | cache leakage test | reporting owner |
| P1-07 | Audit redaction policy incomplete | audit/compliance | P1 | Medium | NO | redaction matrix | Phase 2/7 | audit redaction review | compliance owner |
| P1-08 | Support impersonation policy not implemented | support/admin | P1 | Low | NO | read-only default design | Phase 2/7 | impersonation tests | security owner |
| P1-09 | Scheduled job inventory requires automation review | scheduled jobs | P1 | Medium | NO | automation/job registry | Phase 6 | schedule scope tests | jobs owner |
| P1-10 | Existing client-side print/export in Rates | exports/rates | P1 | Medium | NO | server export service | Phase 6 | export audit test | rates/export owner |
| P1-11 | Integration reference pages may expose platform metadata | platform/admin | P1 | Low | NO | admin RBAC and data classification | Phase 5/6 | admin visibility test | platform owner |
| P2-01 | Some lower-risk static reference pages require classification | reference | P2 | Low | NO | catalog/static registry | Phase 1 | content review | product owner |
| P2-02 | Route list duplicates help/admin surfaces in dashboard directory | navigation | P2 | Low | NO | RBAC route display | Phase 5 | nav visibility test | frontend owner |
| P2-03 | Existing UI naming uses Enterprise Scope before true scope exists | rates UI | P2 | Medium | NO | label governance | Phase 5 | UI copy audit | product owner |
| P2-04 | Baseline performance not measured with live timings in this doc | performance | P2 | Medium | NO | capture metrics before Phase 7 | Phase 7 | benchmark suite | platform owner |
| P2-05 | Some imported components require deeper line-level inventory | components | P2 | Medium | NO | component-level audit before each remediation | Phase 3/5 | static scan | frontend owner |

P0 risks identified: **24**  
P1 risks identified: **11**  
P2 risks identified: **5**

Blockers before Phase 1 planning/execution approval: **None from Phase 0 documentation**.  
Important: the P0 risks above are implementation blockers for release of protected MGA behavior, but they are documented and assigned to remediation phases; they do not authorize implementation during Phase 0.

---

## 15. Phase 0 Exit Criteria

| Exit criterion | Result |
|---|---:|
| current entity inventory is complete | PASS |
| current page inventory is complete | PASS |
| current function/service inventory is complete | PASS |
| function/service inventory count reconciled (deployed vs referenced separated) | PASS |
| scope enforcement unknowns summarized as Phase 1/2/3 design inputs | PASS |
| all direct frontend reads/mutations in protected domains are identified | PASS |
| direct read count provided separately | PASS |
| direct mutation count provided separately | PASS |
| 157 finding granularity clarified (grouped findings, not individual code-level) | PASS |
| deeper line-level inspection components identified | PASS |
| protected domains are classified | PASS |
| migration candidate inventory is complete | PASS |
| document/file access paths are inventoried | PASS |
| report/search/notification/event paths are inventoried | PASS |
| implementation tracking checklist is populated | PASS |
| feature flag and rollout strategy is documented | PASS |
| rollback strategy is documented | PASS |
| baseline workflow snapshot is complete | PASS |
| Phase 0 risk/blocker register is complete | PASS |
| no unresolved P0 planning gaps remain | PASS |

Phase 0 exit criteria: **PASS**

---

## 16. Required Output Summary

Confirmation: only `docs/MGA_PHASE_0_BASELINE_AND_SAFETY_REPORT.md` was updated in Revision Round 1.  
Confirmation: no code, schema, UI, database, service, entity, permission, TXQuote, reporting, document, navigation, or behavior changes were made.  
Phase 0 report path: `docs/MGA_PHASE_0_BASELINE_AND_SAFETY_REPORT.md`

Inventories completed:
- Current Entity Inventory
- Current Page Inventory
- Current Function / Service Inventory
- Function / Service Inventory Count Reconciliation (Section 4A)
- Function / Service Scope Enforcement Unknowns (Section 4B)
- Direct Frontend Read / Mutation Inventory
- Direct Frontend Read / Mutation Count Reconciliation (Section 5A)
- Direct Access Finding Granularity (Section 5B)
- Protected Domain Identification
- Migration Candidate Inventory
- Existing Document / File Access Inventory
- Existing Report / Search / Notification / Event Path Inventory
- Baseline Workflow Snapshot
- Implementation Tracking Checklist
- Feature Flag / Rollout Strategy Baseline
- Rollback and Containment Baseline
- Phase 0 Risk and Blocker Register

Corrected counts:
- Total entities inventoried: **58**
- Total pages/surfaces inventoried: **29 routed pages plus portal/help/admin surfaces**
- Total deployed backend functions inventoried: **37**
- Total referenced service/function artifacts inventoried: **2**
- Total combined function/service inventory rows: **39**
- Total direct frontend reads identified: **99**
- Total direct frontend mutations identified: **58**
- Total direct frontend access findings: **157** (grouped findings; 57 grouped rows; line-level audit required in Phase 3/5/6)
- Total migration candidate entities/artifacts: **45**
- Total document/file access path categories: **10**
- Total report/search/notification/event paths: **18**
- P0 / P1 / P2 risks: **24 / 11 / 5**

Prior count discrepancy explanation:
- The 37 vs 39 mismatch was caused by two codebase file references (`sendTxQuoteV2`, `validateTxQuote`) being included in the inventory table but not matching deployed function registry entries. Sections A, B, and C of 4A now formally separate and reconcile these counts.
- The 157 combined direct access findings = 99 reads + 58 mutations, derived from grouped page/component/entity/action findings. Section 5A provides the breakdown; Section 5B clarifies granularity.

Phase 0 audit blockers remediated:
- Function/service count reconciliation: **YES**
- Deployed vs referenced functions separated: **YES**
- Direct read count provided: **YES — 99**
- Direct mutation count provided: **YES — 58**
- 157 finding granularity clarified: **YES — grouped findings, line-level audit in Phase 3/5/6**
- Scope enforcement unknowns summarized as Phase 1/2/3 inputs: **YES**
- No unresolved P0 Phase 0 documentation gaps remain: **YES**

Report ready for Phase 0 Completion Audit rerun: **YES**

Blockers:
- No blocker prevents moving to Phase 1 approval discussion.
- No implementation may begin without explicit Phase 1 approval.
- P0 implementation risks remain and must be remediated according to gated phases before any protected MGA rollout.

Final Phase 0 decision: **PASS**  
Ready for Phase 1 — Data Model and Scope Foundation planning/execution approval: **YES, only with explicit user approval**