# Stage 1 — Application Inventory

## Executive Baseline
- Audit date: 2026-04-07
- Scope started: full application forensic validation
- Current status: inventory established, page-by-page load validation in progress

## Route Map

### Broker routes — AppLayout
| Page | Route | Parent navigation | Role visibility |
|---|---|---|---|
| Dashboard | `/` | Core Workflow > Dashboard | authenticated |
| Cases | `/cases` | Core Workflow > Cases | authenticated |
| New Case | `/cases/new` | contextual | authenticated |
| Case Detail | `/cases/:id` | contextual from Cases | authenticated |
| Census | `/census` | Core Workflow > Census | authenticated |
| Quotes | `/quotes` | Core Workflow > Quotes | authenticated |
| Enrollment | `/enrollment` | Core Workflow > Enrollment | authenticated |
| Renewals | `/renewals` | Core Workflow > Renewals | authenticated |
| Tasks | `/tasks` | Tools & Reference > Tasks | authenticated |
| Employers | `/employers` | Core Workflow > Employers | authenticated |
| Plan Library | `/plans` | Tools & Reference > Plan Library | authenticated |
| Plan Detail | `/plans/:id` | contextual from Plan Library | authenticated |
| Proposals | `/proposals` | Core Workflow > Proposals | authenticated |
| Exceptions | `/exceptions` | Tools & Reference > Exceptions | authenticated |
| Contributions | `/contributions` | Core Workflow > Contributions | authenticated |
| Employee Management | `/employee-management` | Portals > Employee Mgmt | authenticated |
| Help Center | `/help` | footer nav | authenticated |
| ACA Library | `/aca-library` | Tools & Reference > ACA Library | authenticated |
| Settings | `/settings` | footer nav | authenticated |
| Help Admin | `/help-admin` | footer nav | admin only |
| Help Dashboard | `/help-dashboard` | hidden admin route | admin only |
| Help Coverage Report | `/help-coverage` | hidden admin route | admin only |
| Help Analytics | `/help-analytics` | hidden admin route | admin only |
| Help Target Registry | `/help-target-registry` | hidden admin route | admin only |
| Help Manual Manager | `/help-manual-manager` | hidden admin route | admin only |
| Plan Rate Editor | `/plan-rate-editor` | Tools & Reference > Rate Editor | admin only |
| Plan Analytics | `/plan-analytics` | Tools & Reference > Plan Analytics | admin only |
| Plan Compliance Center | `/plan-compliance` | Tools & Reference > Compliance Center | admin only |
| Plan Rating Engine | `/plan-rating` | Tools & Reference > Rating Engine | admin only |
| PolicyMatchAI | `/policymatch` | Tools & Reference > PolicyMatchAI | admin only |
| Integration Infrastructure | `/integration-infra` | Tools & Reference > Integration Infra | admin only |
| Salesforce CRM | `/salesforce` | Tools & Reference > Salesforce CRM | admin only |

### Portal routes — PortalLayout
| Page | Route | Parent navigation | Role visibility |
|---|---|---|---|
| Employee Portal | `/employee-portal` | Portals > Employee Portal | external portal users |
| Employee Enrollment | `/employee-enrollment` | contextual portal flow | external portal users |
| Employee Benefits | `/employee-benefits` | contextual portal flow | external portal users |
| Employer Portal | `/employer-portal` | Portals > Employer Portal | external portal users |

### Public routes
| Page | Route | Parent navigation | Role visibility |
|---|---|---|---|
| Employee Portal Login | `/employee-portal-login` | direct/public | public |
| Page Not Found | `*` | fallback | all |

## Navigation Map

### Sidebar groups
- Core Workflow: Dashboard, Cases, Employers, Census, Quotes, Contributions, Proposals, Enrollment, Renewals
- Tools & Reference: Plan Library, Rate Editor, Plan Analytics, Compliance Center, Rating Engine, PolicyMatchAI, Tasks, Exceptions, Integration Infra, Salesforce CRM, ACA Library
- Portals: Employer Portal, Employee Portal, Employee Mgmt
- Footer: Help Center, Help Console, Settings

## Role / View Matrix
- Authenticated standard user: broker pages except admin-only pages
- Admin user: all broker pages including admin-only screens
- External portal user: portal layout routes only
- Public user: employee portal login, fallback routes

## Shared Shell Dependencies
- `App.jsx` — source-of-truth router and role gating
- `components/layout/AppLayout.jsx` — broker shell
- `components/layout/PortalLayout.jsx` — portal shell
- `components/layout/Sidebar.jsx` + `components/layout/sidebarConfig.js` — primary navigation
- `components/layout/TopBar.jsx` — global search, alerts, user menu
- `components/shared/GlobalSearch.jsx` — cross-entity navigation helper
- `components/shared/NotificationBell.jsx` — alert surface
- `lib/routing/resolveRouteContext.js` / `hooks/useRouteContext.js` — shared route context

## Route Context Contracts
- case-linked routes: Census, Quotes, Proposals, Enrollment, Employers, Employee Management, Tasks, Exceptions, Renewals
- filter-linked route: Cases (`stageFilter`, `priorityFilter`, `quickView`, `stageGroup`)
- detail route: Case Detail via path param only

## High-Level Data Dependency Register
- Dashboard: BenefitCase, CaseTask, EnrollmentWindow, RenewalCycle, Proposal, DashboardViewPreset
- Cases: BenefitCase + related case-linked entities
- Census: BenefitCase, CensusVersion, CensusMember, Document, ExceptionItem
- Quotes: QuoteScenario, ScenarioPlan, ContributionModel, BenefitCase
- Proposals: Proposal, QuoteScenario, BenefitCase
- Enrollment: EnrollmentWindow, EnrollmentMember, EmployeeEnrollment, BenefitCase
- Renewals: RenewalCycle, BenefitCase, EmployerGroup
- Tasks: CaseTask, BenefitCase
- Employers: EmployerGroup, BenefitCase
- Plans / Rating: BenefitPlan, PlanRateSchedule, PlanRateDetail, PlanZipAreaMap, ImportRun, ImportException, CaseRatedResult
- Exceptions: ExceptionItem, BenefitCase
- Employee Management: EmployeeEnrollment, EnrollmentWindow, CensusMember
- Help stack: Help* entities + manual content entities
- Salesforce: Salesforce integration surface + employer/case linkage fields

## Inventory Totals
- Total explicit routed pages discovered: 37
- Broker routed pages: 31
- Portal routed pages: 4
- Public/fallback routes: 2
- Sidebar navigation links: 23
- Hidden contextual/detail/admin routes: 14

## Next Validation Sequence
1. Broker core pages
2. Admin-only broker pages
3. Portal pages
4. Public route pages
5. Shared hidden/contextual routes and deep-link behavior