# MGA Phase 4A Blocker Remediation Plan — Planning Only

Report date: 2026-05-04
Author: Base44 AI agent
Phase: 4A — Blocker Remediation Planning
Status: PLANNING ONLY — NO REMEDIATION EXECUTED — PENDING PLAN AUDIT

Canonical documents:
- Architecture: `docs/MGA_ENTERPRISE_ARCHITECTURE_PACKAGE.md`
- Build planning: `docs/MGA_BUILD_PLANNING_PACKAGE.md`
- Phase 0 report: `docs/MGA_PHASE_0_BASELINE_AND_SAFETY_REPORT.md`
- Phase 1 report: `docs/MGA_PHASE_1_DATA_MODEL_AND_SCOPE_FOUNDATION_REPORT.md`
- Phase 1 audit: `docs/MGA_PHASE_1_COMPLETION_AUDIT_REPORT.md`
- Phase 2 report: `docs/MGA_PHASE_2_SCOPE_RESOLUTION_AND_AUTHORIZATION_REPORT.md`
- Phase 2 audit: `docs/MGA_PHASE_2_COMPLETION_AUDIT_REPORT.md`
- Phase 3 report: `docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md`
- Phase 3 audit: `docs/MGA_PHASE_3_COMPLETION_AUDIT_REPORT.md`
- Mini-pass report: `docs/MGA_SCOPE_PENDING_ENTITY_MINI_PASS_REPORT.md`
- Mini-pass audit: `docs/MGA_SCOPE_PENDING_ENTITY_MINI_PASS_COMPLETION_AUDIT_REPORT.md`
- Phase 4A report: `docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md`
- Phase 4A audit: `docs/MGA_PHASE_4A_COMPLETION_AUDIT_REPORT.md`
- Dry-run report: `docs/MGA_PHASE_4A_DRY_RUN_EXECUTION_REPORT.md`
- Dry-run audit: `docs/MGA_PHASE_4A_DRY_RUN_COMPLETION_AUDIT_REPORT.md`
- Remediation plan: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_PLAN.md` (this file)

---

## Non-Destructive Planning Control Statement

**This document is a planning artifact only.**

No remediation, seeding, record repair, quarantine execution, index creation, migration, backfill, MGA ownership assignment, record movement, record deletion, UI change, navigation change, permission change, TXQuote change, reporting change, document change, service activation, or end-user behavior change has been or will be executed as part of this planning step.

All proposed remediation actions documented here are **future actions only**. Each action requires explicit, separate approval before execution.

---

## Section 1 — Baseline Confirmation

| Item | Value |
|---|---|
| Dry-run completion audit status | **PASS** |
| Dry-run valid | **YES** |
| Dry-run non-destructive | **CONFIRMED** |
| Phase 4B ready | **NO** |
| Total records scanned | **52** |
| Total blocked records | **52** |
| Total deterministic mappings | **0** |
| Records recommended for quarantine | **33** |
| Phase 4B P0 blockers | **6** |
| Acceptance thresholds passed / failed | **9 / 14** |
| Tests executed / passed / failed | **23 / 20 / 3** |
| No migration, backfill, seeding, repair, index creation, or behavior change has occurred | **CONFIRMED** |

### Confirmed live data state at planning time

| Entity | Live record count | Relevant IDs / notes |
|---|---|---|
| MasterGeneralAgent | **0** | Root anchor missing |
| MasterGroup | **0** | Second-tier anchor missing |
| MasterGeneralAgentUser | **0** | No MGA-scoped users |
| Agency | **2** | NBG (69e169f498a89c653c72cd6b), SCP (69e169f498a89c653c72cd6c) |
| EmployerGroup | **4** | All have agency_id; none have master_group_id |
| BenefitCase | **9** | 2 have valid employer_group_id to live EGs; 3 have empty string; 4 have stale IDs not in live EG set |
| CensusVersion | **6** | 2 link to live BenefitCase; 4 link to missing cases |
| CensusMember | **4** | All link to live BenefitCase + live CensusVersion |
| QuoteScenario | **3** | All link to missing BenefitCase IDs (cd77, cd78, cd7a) |
| Proposal | **2** | 1 links to live case (empty EG ref); 1 links to missing case |
| EnrollmentWindow | **2** | Both link to missing BenefitCase |
| RenewalCycle | **2** | Both link to missing BenefitCase |
| CaseTask | **4** | All link to missing BenefitCase |
| ExceptionItem | **2** | Both link to missing BenefitCase |
| ActivityLog | **8** | 3 link to live cases; 3 link to missing cases; 2 are system events (null actor) |

### EmployerGroup agency signal summary

| EmployerGroup | Name | agency_id | Agency name | State |
|---|---|---|---|---|
| 69e16a0a98a89c653c72cd90 | Redwood Family Dental | 69e169f498a89c653c72cd6b | Northstar Benefits Group (NBG) | CA |
| 69e16a0a98a89c653c72cd91 | Pacific Harbor Tech | 69e169f498a89c653c72cd6b | Northstar Benefits Group (NBG) | CA |
| 69e16a0a98a89c653c72cd92 | Summit Outdoor Supply | 69e169f498a89c653c72cd6c | Summit Coverage Partners (SCP) | CO |
| 69e16a0a98a89c653c72cd93 | Front Range Manufacturing | 69e169f498a89c653c72cd6c | Summit Coverage Partners (SCP) | CO |

### BenefitCase reference state summary

| BenefitCase ID | Employer name | employer_group_id | EG exists in live set | Case number | Stage |
|---|---|---|---|---|---|
| 69f4d0a77e7ff1ee2ddccfe0 | Vault New Case 1 | `""` (empty) | N/A | BC-MON40EKL | census_in_progress |
| 69f4cc2fbf3351b119d33be0 | Vault New Group | `""` (empty) | N/A | BC-MON3BWD0 | draft |
| 69efe29ffecddbea94de8002 | Redwood Family Dental | 69e16a0a98a89c653c72cd90 | **YES** | — | ready_for_quote |
| 69efe258aac90f6694b1c19e | New Client | `""` (empty) | N/A | BC-MOHRMTLJ | draft |
| 69e16cc064b94008398a8846 | Pacific Harbor Tech | 69e16a0a98a89c653c72cd91 | **YES** | BC-MO23FYUV | census_in_progress |
| 69e16a3998a89c653c72cd9a | Redwood Family Dental | 69e16a7b98a89c653c72cd73 | **NO** — stale ID | NBG-1001 | ready_for_quote |
| 69e16a3998a89c653c72cd9b | Pacific Harbor Tech | 69e16a7b98a89c653c72cd74 | **NO** — stale ID | NBG-1002 | proposal_ready |
| 69e16a3998a89c653c72cd9c | Summit Outdoor Supply | 69e16a7b98a89c653c72cd75 | **NO** — stale ID | SCP-2001 | census_in_progress |
| 69e16a3998a89c653c72cd9d | Front Range Manufacturing | 69e16a7b98a89c653c72cd76 | **NO** — stale ID | SCP-2002 | approved_for_enrollment |

### Missing BenefitCase IDs referenced by 21 downstream records

| Missing case ID | Referenced by | Downstream records | Employer signal |
|---|---|---|---|
| 69e16af398a89c653c72cd77 | QuoteScenario(1), CensusVersion(1), ActivityLog(1), CaseTask(1), ExceptionItem(1) | 5 records | employer_name = 'Redwood Family Dental'; case_number = 'NBG-1001' in downstream |
| 69e16af398a89c653c72cd78 | QuoteScenario(1), CensusVersion(1), ActivityLog(1), CaseTask(1), Proposal(1) | 5 records | employer_name = 'Pacific Harbor Tech'; case_number = 'NBG-1002' in downstream |
| 69e16af398a89c653c72cd79 | CensusVersion(1), CaseTask(1), ExceptionItem(1) | 3 records | employer_name = 'Summit Outdoor Supply'; case_number = 'SCP-2001' in downstream |
| 69e16af398a89c653c72cd7a | QuoteScenario(1), CensusVersion(1), ActivityLog(1), CaseTask(1), EnrollmentWindow(1), RenewalCycle(1), Proposal(1) | 8 records | employer_name = 'Front Range Manufacturing'; case_number = 'SCP-2002' in downstream |

**Critical observation:** The 4 missing BenefitCase IDs (cd77–cd7a) correspond to the same employer names as the 4 live EmployerGroup records. The downstream records' embedded `employer_name` and `case_number` fields (NBG-1001, NBG-1002, SCP-2001, SCP-2002) suggest a strong mapping signal: these missing cases were the original seeded records and were likely superseded or not fully imported into the current live dataset. The 4 stale EmployerGroup IDs in the live BenefitCases (cd73–cd76) match the pattern — they correspond to a previous seeding event where EmployerGroup IDs were different.

**Hypothesis (for business owner review, not assumed):** The 4 missing BenefitCase IDs (cd77–cd7a) are the "original" seeded cases for the same employers represented in the 4 live EmployerGroups. The live BenefitCases with stale EG IDs (NBG-1001, NBG-1002, SCP-2001, SCP-2002) and the missing cases may be duplicates of each other — the same employers, different creation events. This must be confirmed by business owner review, not assumed.

---

## Section 2 — MasterGeneralAgent Seed Plan (B4B-01)

### Planning summary

| Field | Value |
|---|---|
| Blocker | B4B-01 |
| Issue | 0 MasterGeneralAgent records exist |
| Effect | All 52 records have proposed_mga_id = NULL; no downstream chain can resolve |
| Remediation category | Business decision + seed data |
| Execution gate | Explicit business approval required before any seeding |

### Required MGA records — inference from available data signals

The following two MGA candidates are inferred from the live Agency data. These are **planning signals only** — not approved seed records. Business owner must confirm or correct.

| Candidate # | Inferred MGA name | Source signal | Agency code | States observed | Employers served (signal) |
|---|---|---|---|---|---|
| MGA-CAND-01 | Northstar Benefits Group (or its parent MGA) | Agency `NBG` (69e169f498a89c653c72cd6b); serves CA employers; case numbers prefixed NBG- | NBG | CA | Redwood Family Dental, Pacific Harbor Tech |
| MGA-CAND-02 | Summit Coverage Partners (or its parent MGA) | Agency `SCP` (69e169f498a89c653c72cd6c); serves CO employers; case numbers prefixed SCP- | SCP | CO | Summit Outdoor Supply, Front Range Manufacturing |

**Planning note:** Agency and MGA are distinct concepts. An Agency may be the MGA itself, or it may be a sub-agency under a separate MGA entity. The business owner must clarify: are NBG and SCP the MGAs, or are they agencies under a larger MGA umbrella? This decision determines whether 1 or 2 (or more) MasterGeneralAgent records are seeded.

### Required fields before seeding

| Field | Required | Source |
|---|---|---|
| name | YES | Business decision |
| legal_entity_name | YES | Business / legal records |
| code | YES | Must be unique; business-assigned |
| primary_contact_name | YES | Business records |
| primary_contact_email | YES | Business records |
| status | YES — `pending_onboarding` at seed time | System default |
| onboarding_status | YES — `not_started` at seed time | System default |

### Optional fields that can be completed later

| Field | Completable later | Notes |
|---|---|---|
| dba_name | YES | Can be added during onboarding |
| tax_id_ein | YES — sensitive | Audit-restricted; complete during banking setup |
| producer_license_number | YES | Licensing/compliance phase |
| licensed_states | YES | Compliance phase |
| commission_structure_type | YES | Agreement phase |
| banking_setup_status | YES — defaults to `not_started` | Banking phase |
| agreement_status | YES — defaults to `not_started` | Agreement phase |
| compliance_status | YES — defaults to `pending_review` | Compliance review |
| activation_date | YES | Set at Phase 5/6 activation, not at migration seeding |
| mga_migration_batch_id | YES | Set at time of seeding by migration engine |
| mga_migration_status | YES — `not_migrated` at seed time | Updated when validation complete |

### Onboarding and compliance status at seed time

Seeded MGAs start with:
- `status: pending_onboarding`
- `onboarding_status: not_started`
- `compliance_status: pending_review`
- `agreement_status: not_started`
- `banking_setup_status: not_started`
- `carrier_access_status: pending`
- `mga_migration_status: not_migrated`

MGAs seeded for migration purposes are **not activated** at seed time. Activation is a separate Phase 5/6 step.

### Audit requirements

- MGA creation is a governance event requiring audit record via `createGovernanceAuditEvent()`
- Seeding actor email must be recorded in `created_by_platform_user`
- `mga_migration_batch_id` must be set to the Phase 4B backfill batch ID at time of seeding
- Business approval record must exist before seeding is executed

### Rollback plan

| Rollback scenario | Action |
|---|---|
| Seeded with wrong identity | Delete seeded MGA record; void migration batch; re-approve with correct data |
| Seeded with duplicate code | Detect via unique code constraint; reject at creation; require re-approval |
| Seeded before business approval | Block at execution gate; audit as unauthorized seeding attempt |

### Validation method after seeding

1. Confirm `MasterGeneralAgent.code` is unique across all records
2. Confirm all required fields are non-null
3. Confirm `status = pending_onboarding` (not active)
4. Confirm `mga_migration_status = not_migrated`
5. Confirm no fake/placeholder names (e.g. "Test MGA", "Default", "UNKNOWN")
6. Confirm record count matches the business-approved MGA count

### Second dry-run impact

After B4B-01 is resolved:
- MasterGeneralAgent records will exist as root anchors
- `computeMasterGroupMapping` will have real MGA IDs to propose
- Downstream chains will have a terminus to resolve toward
- All 5 failed acceptance thresholds will become re-evaluable (they will not all pass until all 6 blockers are resolved, but the root anchor is the prerequisite for all others)

### Rules confirmed

- No MGA may be seeded without business-approved identity: **CONFIRMED**
- No default or placeholder MGA may be used to force mapping: **CONFIRMED**
- If the business cannot confirm MGA ownership, affected records remain unmapped or quarantined: **CONFIRMED**

---

## Section 3 — MasterGroup Seed and Mapping Plan (B4B-02)

### Planning summary

| Field | Value |
|---|---|
| Blocker | B4B-02 |
| Issue | 0 MasterGroup records exist |
| Effect | EmployerGroups cannot be linked; downstream chains cannot be established |
| Prerequisite | B4B-01 must be resolved first (MGA root must exist) |
| Remediation category | Seed data + mapping approval |

### Required MasterGroups — inference from available data signals

Based on the agency signal pattern, the following MasterGroup candidates are inferred. **These are planning signals only.** Business owner must confirm.

| Candidate # | Inferred MasterGroup name | Source signal | Proposed MGA | EmployerGroups expected to link | State | Confidence |
|---|---|---|---|---|---|---|
| MG-CAND-01 | Northstar Benefits Group — Master Group | Agency NBG (69e169f498a89c653c72cd6b); 2 EmployerGroups share this agency_id | MGA-CAND-01 | Redwood Family Dental (cd90), Pacific Harbor Tech (cd91) | CA | Medium — signal from agency grouping |
| MG-CAND-02 | Summit Coverage Partners — Master Group | Agency SCP (69e169f498a89c653c72cd6c); 2 EmployerGroups share this agency_id | MGA-CAND-02 | Summit Outdoor Supply (cd92), Front Range Manufacturing (cd93) | CO | Medium — signal from agency grouping |

**Planning note:** It is possible that NBG and SCP each map to a single MasterGroup, or that each employer has its own MasterGroup, or that both agencies roll up under a single MasterGroup. The agency grouping is the best available non-authoritative signal. Business owner confirmation is required.

### Mapping method per candidate

| Candidate | Mapping method | Signal | Confidence | Deterministic | Approval required |
|---|---|---|---|---|---|
| MG-CAND-01 | Inferred — agency grouping + employer name matching | agency_id shared by 2 EmployerGroups | Medium | NO — not deterministic without business confirmation | YES — migration_owner + business_owner |
| MG-CAND-02 | Inferred — agency grouping + employer name matching | agency_id shared by 2 EmployerGroups | Medium | NO | YES |

### Mapping record fields (per MasterGroup at seeding time)

- `master_general_agent_id` — set to approved MGA record ID after B4B-01 seeding
- `name` — business-approved name
- `code` — unique, business-assigned
- `status` — `active` (operational groups) or `inactive` (migration-only staging)
- `ownership_status` — `unassigned` until formally approved; changes to `assigned` after business approval
- `mga_migration_status` — `not_migrated` at seed time
- `mga_business_approval_status` — `pending` at seed time; changes to `approved` after sign-off
- `mga_business_approver` — email of approving business owner
- `mga_business_approved_at` — timestamp of approval

### Quarantine condition

| Condition | Quarantine action |
|---|---|
| MasterGroup has conflicting signals (multiple MGAs suggested) | Quarantine; block downstream |
| MasterGroup has no usable signal after review | Quarantine; block downstream |
| Business owner rejects proposed MasterGroup-to-MGA mapping | Quarantine; block downstream |
| MasterGroup has duplicate code | Reject creation; require re-approval |

### Rollback plan

| Rollback scenario | Action |
|---|---|
| Seeded with wrong MGA parent | Update `master_general_agent_id` via approved batch revert; re-execute mapping |
| Seeded before business approval | Void; quarantine; re-approve |
| Code conflict detected post-seeding | Audit; resolve code; governance event |

### Validation method after seeding

1. All MasterGroups have non-null `master_general_agent_id` pointing to a valid MGA record
2. All MasterGroups have `ownership_status = assigned`
3. All MasterGroups have `mga_business_approval_status = approved`
4. Code uniqueness confirmed
5. No placeholder/default names
6. Count matches business-approved MasterGroup list

### Rules confirmed

- No MasterGroup may be created by guesswork: **CONFIRMED — medium-confidence signal requires business owner approval**
- Every MasterGroup must belong to exactly one approved MGA: **CONFIRMED**
- Ambiguous MasterGroups remain blocked until manually approved or quarantined: **CONFIRMED**
- No downstream record may be remediated until MasterGroup/MGA chain is deterministic: **CONFIRMED**

---

## Section 4 — EmployerGroup Repair Plan (B4B-03)

### Planning summary

| Field | Value |
|---|---|
| Blocker | B4B-03 |
| Issue | All 4 live EmployerGroup records have `master_group_id = null` |
| Effect | EmployerGroups cannot propagate MGA scope downstream |
| Prerequisite | B4B-01 and B4B-02 must be resolved first |
| Remediation category | Reference repair (data update) |

### Affected records and proposed MasterGroup assignments

| EmployerGroup ID | Name | agency_id | Agency | State | Proposed MasterGroup | Confidence | Approval required |
|---|---|---|---|---|---|---|---|
| 69e16a0a98a89c653c72cd90 | Redwood Family Dental | 69e169f498a89c653c72cd6b | NBG | CA | MG-CAND-01 (NBG Master Group) | Medium | YES |
| 69e16a0a98a89c653c72cd91 | Pacific Harbor Tech | 69e169f498a89c653c72cd6b | NBG | CA | MG-CAND-01 (NBG Master Group) | Medium | YES |
| 69e16a0a98a89c653c72cd92 | Summit Outdoor Supply | 69e169f498a89c653c72cd6c | SCP | CO | MG-CAND-02 (SCP Master Group) | Medium | YES |
| 69e16a0a98a89c653c72cd93 | Front Range Manufacturing | 69e169f498a89c653c72cd6c | SCP | CO | MG-CAND-02 (SCP Master Group) | Medium | YES |

**Assignment method:** `agency_id` grouping is the primary available signal. Both NBG-agency EmployerGroups would link to the NBG MasterGroup; both SCP-agency EmployerGroups would link to the SCP MasterGroup. This assignment is consistent and internally coherent but requires business owner confirmation to be deterministic.

### Available parent signals for each EmployerGroup

| Signal | Strength | Notes |
|---|---|---|
| `agency_id` on EmployerGroup | Medium | Direct field; unambiguous; groups employers by agency but does not confirm MasterGroup assignment |
| `employer_name` matching to downstream BenefitCase data | Medium | Downstream records confirm employer names match the EmployerGroup names |
| State/geography (CA vs CO) | Low | Consistent with agency split but not authoritative |
| Case number prefixes (NBG- vs SCP-) | Medium | Downstream case numbers suggest agency/MasterGroup alignment |

### Records requiring manual review

All 4 EmployerGroup records require manual review because none have `master_group_id` set and the proposed assignment is inferred (not pre-stamped). Confidence is medium, not high — business owner sign-off is required for each.

### Records requiring quarantine if unresolved

| Condition | Quarantine action |
|---|---|
| Business owner cannot confirm MasterGroup assignment for an EmployerGroup | EmployerGroup quarantined; downstream cases for that EmployerGroup blocked |
| Proposed assignment conflicts with a second business signal | Quarantine pending conflict resolution |

### Downstream impact of EmployerGroup repair

After linking EmployerGroups to MasterGroups (post B4B-01, B4B-02):
- BenefitCase `69efe29ffecddbea94de8002` (Redwood Family Dental) — currently `missing_upstream_owner_mapping` — becomes **deterministically resolvable** once cd90 has a MasterGroup
- BenefitCase `69e16cc064b94008398a8846` (Pacific Harbor Tech) — same pattern — becomes resolvable once cd91 has a MasterGroup
- All 4 CensusMember records (which link through 69efe29...) become resolvable
- 2 CensusVersion records (linked to 69efe29...) become resolvable

### Rollback plan

| Rollback scenario | Action |
|---|---|
| Incorrect MasterGroup assigned | Revert `master_group_id` via rollback marker; re-approve correct assignment |
| Assignment applied before MasterGroup exists | Referential integrity failure; reject; re-sequence |

### Validation method

1. All 4 EmployerGroups have non-null `master_group_id` pointing to a valid MasterGroup record
2. Each MasterGroup assignment is traced to an approved mapping record
3. MasterGroup's `master_general_agent_id` is non-null and valid
4. Downstream BenefitCase records for these EmployerGroups can resolve the full chain

---

## Section 5 — BenefitCase Reference Repair Plan (B4B-04)

### Planning summary

| Field | Value |
|---|---|
| Blocker | B4B-04 |
| Issue | 8 of 9 BenefitCase records have invalid or missing `employer_group_id` |
| Effect | 8 cases cannot inherit MGA scope; 21 downstream records are blocked |
| Prerequisite | B4B-01, B4B-02, B4B-03 must be resolved first |
| Remediation category | Reference repair or quarantine |

### Affected BenefitCase detail

#### Group A — Empty string employer_group_id (3 cases)

| BenefitCase ID | Employer name | Case # | Stage | employer_group_id | Best available EG match | Confidence | Repair option |
|---|---|---|---|---|---|---|---|
| 69f4d0a77e7ff1ee2ddccfe0 | Vault New Case 1 | BC-MON40EKL | census_in_progress | `""` | UNKNOWN — "Vault New Case 1" does not match any live EmployerGroup name | LOW | Requires business identification of correct EmployerGroup; may be quarantine candidate |
| 69f4cc2fbf3351b119d33be0 | Vault New Group | BC-MON3BWD0 | draft | `""` | UNKNOWN — "Vault New Group" does not match any live EmployerGroup name | LOW | Requires business identification; may be quarantine candidate |
| 69efe258aac90f6694b1c19e | New Client | BC-MOHRMTLJ | draft | `""` | UNKNOWN — "New Client" is not a specific employer name; matches the Proposal anomaly (Proposal has title "Pacific Harbor" but employer_name = "New Client") | LOW | Likely a test/placeholder case; business review required; may be quarantine candidate |

**Note on "New Client" case:** This BenefitCase is referenced by Proposal record `69e16a3998a89c653c72cda1` (title: "Pacific Harbor 2026 Renewal Proposal"; employer_name: "New Client"). This is the data inconsistency identified in the dry-run. Business owner must confirm whether this case is a test/placeholder or a real case for Pacific Harbor.

#### Group B — Stale employer_group_id referencing non-existent EmployerGroups (5 cases)

| BenefitCase ID | Employer name | Case # | Stage | Stale EG ID | Probable live EG match | Confidence | Proposed repair |
|---|---|---|---|---|---|---|---|
| 69e16a3998a89c653c72cd9a | Redwood Family Dental | NBG-1001 | ready_for_quote | 69e16a7b98a89c653c72cd73 | 69e16a0a98a89c653c72cd90 (Redwood Family Dental) | **HIGH** — same employer name, same agency_id prefix | Update `employer_group_id` to cd90 (requires business approval) |
| 69e16a3998a89c653c72cd9b | Pacific Harbor Tech | NBG-1002 | proposal_ready | 69e16a7b98a89c653c72cd74 | 69e16a0a98a89c653c72cd91 (Pacific Harbor Tech) | **HIGH** — same employer name, same agency_id prefix | Update `employer_group_id` to cd91 |
| 69e16a3998a89c653c72cd9c | Summit Outdoor Supply | SCP-2001 | census_in_progress | 69e16a7b98a89c653c72cd75 | 69e16a0a98a89c653c72cd92 (Summit Outdoor Supply) | **HIGH** — same employer name, same agency_id prefix | Update `employer_group_id` to cd92 |
| 69e16a3998a89c653c72cd9d | Front Range Manufacturing | SCP-2002 | approved_for_enrollment | 69e16a7b98a89c653c72cd76 | 69e16a0a98a89c653c72cd93 (Front Range Manufacturing) | **HIGH** — same employer name, same agency_id prefix | Update `employer_group_id` to cd93 |
| 69e16cc064b94008398a8846 | Pacific Harbor Tech | BC-MO23FYUV | census_in_progress | 69e16a0a98a89c653c72cd91 | 69e16a0a98a89c653c72cd91 (Pacific Harbor Tech) | **VALID** — EG ID resolves correctly; NOT an orphan | No repair needed for EG ref — already points to live EmployerGroup |

**Important correction on BC-MO23FYUV:** BenefitCase `69e16cc064b94008398a8846` (Pacific Harbor Tech, BC-MO23FYUV) has `employer_group_id = 69e16a0a98a89c653c72cd91` which IS a valid live EmployerGroup (Pacific Harbor Tech, cd91). This case was classified in the dry-run as `missing_upstream_owner_mapping` — correctly — because the parent EmployerGroup exists but has no `master_group_id`. The BenefitCase itself does not need a reference repair; it will resolve once B4B-03 links cd91 to a MasterGroup.

**Revised B4B-04 count clarification:**
- Group A: 3 cases — empty EG ref — require business identification or quarantine
- Group B: 4 cases — stale EG ID — high-confidence repair to live EG IDs, pending business approval
- BC-MO23FYUV: NOT included in the 8 as a reference repair candidate — it has a valid EG ref; it resolves via B4B-03

This means the 8 "invalid/missing employer_group_id" cases are: 3 empty-string + 5 stale-ID cases. The stale-ID cases include the 4 named above (NBG-1001, NBG-1002, SCP-2001, SCP-2002) plus BC-MO23FYUV — however, BC-MO23FYUV is already valid. This reconciles to exactly 4 stale-ID cases needing repair + 3 empty-string cases = 7 requiring repair. The 8th case in the dry-run count (BC-MO23FYUV classified as P0 via `missing_upstream_owner_mapping`) will be resolved by B4B-03 without a direct reference repair. The net repair or quarantine actions for B4B-04 are: **4 stale-ID repairs (high confidence) + 3 empty-string resolutions (require business review)**.

### Repair option classification

| Repair option | Applicable cases | Conditions |
|---|---|---|
| Reference repair — update employer_group_id to correct live EG | NBG-1001, NBG-1002, SCP-2001, SCP-2002 | High confidence; employer name match confirmed; requires business approval |
| Business identification — identify correct EmployerGroup | BC-MON40EKL ("Vault New Case 1"), BC-MON3BWD0 ("Vault New Group"), BC-MOHRMTLJ ("New Client") | Low confidence; employer name does not match any live EmployerGroup; requires business owner to identify correct EG or confirm as quarantine candidate |
| Quarantine | Any of the above if business owner cannot confirm assignment | Quarantine condition: business cannot identify correct EmployerGroup within remediation window |

### Source of truth for EmployerGroup relationship

| Source | Reliability | Use |
|---|---|---|
| `employer_name` on BenefitCase matching live EmployerGroup.name | High for Group B; N/A for Group A | Primary repair signal for Group B cases |
| `case_number` prefix (NBG- vs SCP-) on BenefitCase | Medium | Agency-level confirmation of ownership group |
| `agency_id` on BenefitCase matching EmployerGroup.agency_id | High | Cross-validation that case and employer share same agency |
| Business owner attestation | Authoritative | Required for all; mandatory for Group A cases |

### Rules confirmed

- BenefitCase references must resolve deterministically through EmployerGroup / MasterGroup / MGA: **CONFIRMED**
- If a BenefitCase cannot be safely repaired, it must remain blocked or be quarantined: **CONFIRMED**
- No downstream quote, census, enrollment, document, TXQuote, report, or notification record may inherit scope from an invalid BenefitCase: **CONFIRMED**

---

## Section 6 — Missing BenefitCase Dependency Plan (B4B-05)

### Planning summary

| Field | Value |
|---|---|
| Blocker | B4B-05 |
| Issue | 21 downstream records reference 4 BenefitCase IDs that do not exist in the live entity |
| Effect | 21 downstream records are orphaned — they cannot receive MGA scope through any parent chain |
| Prerequisite | B4B-01, B4B-02, B4B-03 should be resolved first; B4B-04 remediation may affect this blocker |
| Remediation category | Seed data (restore) or quarantine |

### Affected downstream records by missing case ID

| Missing case ID | Case # signal | Employer signal | Downstream records affected | Count |
|---|---|---|---|---|
| 69e16af398a89c653c72cd77 | NBG-1001 (inferred from QuoteScenario "Redwood Base Market") | Redwood Family Dental | QuoteScenario (cd9e), CensusVersion (cdab), ActivityLog (cdaf), CaseTask (cdb3), ExceptionItem (cda7) | **5** |
| 69e16af398a89c653c72cd78 | NBG-1002 (inferred from QuoteScenario "Pacific Harbor Renewal Match") | Pacific Harbor Tech | QuoteScenario (cd9f), CensusVersion (cdac), ActivityLog (cdb0), CaseTask (cdb4), Proposal (cda1) | **5** |
| 69e16af398a89c653c72cd79 | SCP-2001 (inferred from ExceptionItem "Summit Outdoor Supply") | Summit Outdoor Supply | CensusVersion (cdad), CaseTask (cdb5 — wait, cdb4 is Pacific Harbor; see below), ExceptionItem (cda8) | **3** |
| 69e16af398a89c653c72cd7a | SCP-2002 (inferred from QuoteScenario "Front Range Renewal Final") | Front Range Manufacturing | QuoteScenario (cda0), CensusVersion (cdae), ActivityLog (cdb1), CaseTask (cdb5), EnrollmentWindow, RenewalCycle, Proposal (cda2) | **8** |

**Total downstream orphaned records: 21**

### Remediation options

#### Option A — Restore missing BenefitCase records

Restore the 4 missing BenefitCase records (cd77–cd7a) with their original IDs, linking them to the correct live EmployerGroup records (after B4B-03 repairs EmployerGroups).

| Condition | Value |
|---|---|
| Applicable when | Business owner can confirm the missing cases represent real, active cases that should exist in the system |
| Source of truth required | Original case data, case numbers (NBG-1001, NBG-1002, SCP-2001, SCP-2002), employer confirmation |
| Key consideration | If the live BenefitCases with stale EG IDs (cd9a, cd9b, cd9c, cd9d) are the SAME cases as the missing ones, restoring the missing IDs would create duplicates. Business owner must confirm whether these are duplicates or distinct cases before proceeding. |
| Risk | Creating duplicate cases if B4B-04 stale-ID cases already represent the same employers |
| Confidence required | HIGH — authoritative confirmation only |
| Post-restore action | Link restored cases to live EmployerGroups (same repair as B4B-04 Group B) |

#### Option B — Remap downstream records to existing live BenefitCases

Remap the 21 downstream records to reference the live BenefitCases that represent the same employers (the Group B cases in B4B-04, once their employer_group_id references are repaired).

| Condition | Value |
|---|---|
| Applicable when | Business owner confirms the missing cases and the live stale-ID cases are duplicates representing the same employers — i.e., the downstream records should belong to the live cases, not to the missing IDs |
| Downstream remapping | QuoteScenario for Redwood → case_id = cd9a (NBG-1001 case); QuoteScenario for Pacific Harbor → cd9b; etc. |
| Risk | If cases are NOT duplicates, remapping could incorrectly merge case histories |
| Confidence required | HIGH — duplicate confirmation required |

#### Option C — Quarantine all 21 downstream records

Quarantine all 21 records referencing the missing case IDs.

| Condition | Value |
|---|---|
| Applicable when | Business owner cannot confirm the identity of the missing cases, OR the missing cases are confirmed as stale/deleted/invalid |
| Effect | 21 records are quarantined; their data is preserved but invisible to operational users |
| Risk | Loss of active operational data (QuoteScenarios, CensuVersions, EnrollmentWindows, Proposals) |
| Preferred? | Only if Options A and B cannot be confirmed |

### Evidence required before repair

| Evidence item | Required for | Notes |
|---|---|---|
| Confirmation that missing case IDs (cd77–cd7a) correspond to real cases that should exist | Option A | Authoritative — business owner only |
| Confirmation that live stale-ID cases (cd9a–cd9d) ARE or ARE NOT the same cases as the missing ones | Options A and B | Critical deduplication decision |
| Original case creation records or migration logs for the cd77–cd7a cases | Option A | Establishes ground truth for restoration |
| Approval of downstream remapping target for each of 21 records | Option B | Per-record or per-case-group approval |

### Quarantine condition

If Options A and B cannot be confirmed within the remediation window, all 21 records are quarantine candidates. Quarantine must be executed via Phase 4B quarantine plan — not during planning.

### Rollback plan

| Rollback scenario | Action |
|---|---|
| Restored cases have wrong data | Delete restored records; re-approve with correct data; audit event |
| Remapped downstream records point to wrong case | Revert case_id via rollback marker; re-approve |
| Quarantine incorrectly applied | Release via MGAQuarantineRecord approval flow |

---

## Section 7 — Index Creation Plan (B4B-06)

### Planning summary

| Field | Value |
|---|---|
| Blocker | B4B-06 |
| Issue | All 30 required indexes remain deferred |
| Effect | Phase 4B final backfill cannot execute safely without indexes |
| Prerequisite | No data prerequisite — indexes can be created at any point; but should not be created before data blockers are understood |
| Remediation category | Index creation |

### Index #27 — Special requirement

Index #27 (MasterGeneralAgentUser: master_general_agent_id, user_email, status) is confirmed non-duplicate. It was first identified as a missing prerequisite in the Phase 4A audit when auditing `scopeResolver.js`, which calls `MasterGeneralAgentUser.filter({ user_email, status: 'active' })` at every protected gate call. It was not defined in Phase 1 or the mini-pass index sets. It is therefore a new, non-overlapping index.

**Why it is required:** Without this index, every scope gate call at production scale performs a full-table scan on `MasterGeneralAgentUser`. At 0 records this is trivial; at hundreds of MGA users it becomes a critical performance bottleneck on every single protected API call.

**Required before second dry-run:** NO — at current scale (0 MasterGeneralAgentUser records), the second dry-run can safely execute without index #27. It is recommended but not required for the second dry-run. **Required before Phase 4B final backfill: YES.**

### Indexes required before second dry-run

| Index # | Entity | Fields | Reason required before re-run | Notes |
|---|---|---|---|---|
| 27 | MasterGeneralAgentUser | (master_general_agent_id, user_email, status) | RECOMMENDED but not required | At current 0 records, no performance risk; required if MGA users are added before re-run |

**Conclusion: 0 indexes are strictly required before the second dry-run at current data scale. Index #27 is recommended if MGA users are added during B4B-01/02 remediation.**

### Indexes required before Phase 4B final backfill — all 30

| # | Entity | Fields | Purpose | Creation priority | Risk if missing |
|---|---|---|---|---|---|
| 1 | MasterGeneralAgent | (code, status) | Unique code enforcement; status filter | HIGH — must exist before any MGA lookup | Full-table scan on code lookup at backfill |
| 2 | MasterGroup | (master_general_agent_id, status) | MGA-scoped group listing | HIGH | Cross-MGA scan risk during backfill |
| 3 | EmployerGroup | (master_general_agent_id, status) | MGA-scoped employer listing | HIGH | Cross-MGA scan risk |
| 4 | BenefitCase | (master_general_agent_id, stage, status) | MGA-scoped case pipeline | HIGH | Performance degradation; cross-MGA scan |
| 5 | CensusVersion | (master_general_agent_id, case_id, status) | MGA-scoped census listing | HIGH | Scan risk |
| 6 | CensusMember | (master_general_agent_id, case_id) | MGA-scoped PII member listing | HIGH | PII scan risk |
| 7 | QuoteScenario | (master_general_agent_id, case_id, status) | MGA-scoped quote listing | HIGH | Scan risk |
| 8 | EnrollmentWindow | (master_general_agent_id, case_id, status) | MGA-scoped enrollment listing | HIGH | Scan risk |
| 9 | EmployeeEnrollment | (master_general_agent_id, case_id, status) | MGA-scoped PII employee listing | HIGH | PII scan risk |
| 10 | Document | (master_general_agent_id, case_id) | MGA-scoped document listing | HIGH | File access scan risk |
| 11 | CaseTask | (master_general_agent_id, case_id, status) | MGA-scoped task listing | MEDIUM | Scan risk |
| 12 | ExceptionItem | (master_general_agent_id, case_id, severity) | MGA-scoped exception triage | MEDIUM | Scan risk |
| 13 | ActivityLog | (master_general_agent_id, case_id) | MGA-scoped audit trail | MEDIUM | Audit scan risk |
| 14 | RenewalCycle | (master_general_agent_id, case_id) | MGA-scoped renewal listing | MEDIUM | Scan risk |
| 15 | Proposal | (master_general_agent_id, case_id, status) | MGA-scoped proposal listing | HIGH | Artifact scan risk |
| 16 | MGAMigrationBatch | (master_general_agent_id, status) | Migration batch tracking | HIGH | Migration tracking failure |
| 17 | Tenant | (master_general_agent_id, master_group_id, status) | Tenant scoping via MasterGroup | LOW (0 tenants) | Tenant scan risk at scale |
| 18 | CensusImportJob | (master_general_agent_id, case_id, status) | Scoped job tracking | MEDIUM | Job scan risk |
| 19 | CensusImportAuditEvent | (master_general_agent_id, census_import_job_id) | Scoped audit event lookup | MEDIUM | Audit scan risk |
| 20 | CensusValidationResult | (master_general_agent_id, census_import_id, status) | Scoped validation results | MEDIUM | Validation scan risk |
| 21 | UserManual | (master_general_agent_id, scope_type) | Discriminated manual listing | LOW (0 records) | Scope bleed risk |
| 22 | HelpSearchLog | (master_general_agent_id, user_email, created_date) | Scoped search activity | LOW (0 records) | Activity scan risk |
| 23 | HelpAIQuestionLog | (master_general_agent_id, user_email, created_date) | Scoped question activity | LOW (0 records) | PII scan risk |
| 24 | HelpCoverageSnapshot | (master_general_agent_id, scope_type, snapshot_date) | Discriminated snapshot listing | LOW (0 records) | Scope bleed risk |
| 25 | HelpAuditLog | (master_general_agent_id, event_type, created_date) | Scoped help audit | LOW (0 records) | Audit scan risk |
| 26 | HelpAITrainingQueue | (master_general_agent_id, scope_type, queue_status) | Discriminated queue processing | LOW (0 records) | Queue contamination risk |
| 27 | MasterGeneralAgentUser | (master_general_agent_id, user_email, status) | Membership lookup at every scopeGate call | **CRITICAL** | Every gate call becomes full-table scan |
| 28 | MGAQuarantineRecord | (master_general_agent_id, entity_type, status) | Quarantine triage and release | HIGH | Quarantine management failure |
| 29 | TxQuoteCase | (master_general_agent_id, case_id) | TXQuote scoping | MEDIUM (0 TxQuoteCases) | TXQuote scan risk |
| 30 | EnrollmentMember | (master_general_agent_id, enrollment_window_id) | Enrollment member scoping | MEDIUM (0 records) | Enrollment scan risk |

### Index creation rollback/containment

- Index creation is non-destructive — dropping an index does not affect data
- Rollback = drop index; no data loss
- Validation = query execution plan confirms index is used for scoped lookups

### Validation method

After creating all 30 indexes:
1. Query each indexed entity with a `master_general_agent_id` filter — confirm index is used (not full-table scan)
2. Confirm index count = 30 before Phase 4B trigger
3. Confirm index #27 is used by `resolveScope()` membership lookup

---

## Section 8 — Business Approval Queue

All items requiring human approval before remediation can execute. **Status = PENDING for all — no approvals have been requested or granted.**

| ID | Blocker | Entity | Category | Proposed action | Proposed MGA | Proposed MasterGroup | Source signal | Confidence | Approval owner | Priority | Downstream affected | Blocks 2nd dry-run | Blocks Phase 4B | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BA-01 | B4B-01 | MasterGeneralAgent | MGA root seed | Seed MGA record: "Northstar Benefits Group" | Self | — | Agency NBG; CA employers; NBG- case numbers | Medium | Executive / Platform Owner | **P0 — Critical** | All 52 records | YES (indirectly) | YES | PENDING |
| BA-02 | B4B-01 | MasterGeneralAgent | MGA root seed | Seed MGA record: "Summit Coverage Partners" | Self | — | Agency SCP; CO employers; SCP- case numbers | Medium | Executive / Platform Owner | **P0 — Critical** | All 52 records | YES (indirectly) | YES | PENDING |
| BA-03 | B4B-02 | MasterGroup | MasterGroup seed | Seed MasterGroup for NBG MGA; link to BA-01 MGA | MGA-CAND-01 | MG-CAND-01 | Agency NBG grouping | Medium | Business Owner | **P0** | 2 EmployerGroups; downstream cases | YES | YES | PENDING |
| BA-04 | B4B-02 | MasterGroup | MasterGroup seed | Seed MasterGroup for SCP MGA; link to BA-02 MGA | MGA-CAND-02 | MG-CAND-02 | Agency SCP grouping | Medium | Business Owner | **P0** | 2 EmployerGroups; downstream cases | YES | YES | PENDING |
| BA-05 | B4B-03 | EmployerGroup | EG link | Link Redwood Family Dental (cd90) → NBG MasterGroup | MGA-CAND-01 | MG-CAND-01 | agency_id = NBG | Medium | Business Owner / Migration Owner | P0 | BenefitCase 69efe29...; 4 CensusMembers | YES | YES | PENDING |
| BA-06 | B4B-03 | EmployerGroup | EG link | Link Pacific Harbor Tech (cd91) → NBG MasterGroup | MGA-CAND-01 | MG-CAND-01 | agency_id = NBG | Medium | Business Owner / Migration Owner | P0 | BenefitCase 69e16cc0...; 0 downstream (case has valid EG ref already) | YES | YES | PENDING |
| BA-07 | B4B-03 | EmployerGroup | EG link | Link Summit Outdoor Supply (cd92) → SCP MasterGroup | MGA-CAND-02 | MG-CAND-02 | agency_id = SCP | Medium | Business Owner / Migration Owner | P0 | 0 direct cases with valid EG ref | YES | YES | PENDING |
| BA-08 | B4B-03 | EmployerGroup | EG link | Link Front Range Manufacturing (cd93) → SCP MasterGroup | MGA-CAND-02 | MG-CAND-02 | agency_id = SCP | Medium | Business Owner / Migration Owner | P0 | 0 direct cases with valid EG ref | YES | YES | PENDING |
| BA-09 | B4B-04 | BenefitCase | Reference repair | Update employer_group_id for NBG-1001 (cd9a) → cd90 (Redwood Family Dental EG) | MGA-CAND-01 | MG-CAND-01 | employer_name match + agency_id match | High | Migration Owner | P0 | QuoteScenario(cd9e), ActivityLog(cdaf), CaseTask(cdb3)... via B4B-05 missing case resolution | YES | YES | PENDING |
| BA-10 | B4B-04 | BenefitCase | Reference repair | Update employer_group_id for NBG-1002 (cd9b) → cd91 (Pacific Harbor Tech EG) | MGA-CAND-01 | MG-CAND-01 | employer_name match | High | Migration Owner | P0 | Proposal(cda2) and others via B4B-05 | YES | YES | PENDING |
| BA-11 | B4B-04 | BenefitCase | Reference repair | Update employer_group_id for SCP-2001 (cd9c) → cd92 (Summit Outdoor Supply EG) | MGA-CAND-02 | MG-CAND-02 | employer_name match | High | Migration Owner | P0 | ExceptionItem(cda8) and others via B4B-05 | YES | YES | PENDING |
| BA-12 | B4B-04 | BenefitCase | Reference repair | Update employer_group_id for SCP-2002 (cd9d) → cd93 (Front Range Manufacturing EG) | MGA-CAND-02 | MG-CAND-02 | employer_name match | High | Migration Owner | P0 | EnrollmentWindow, RenewalCycle, Proposal(cda2), others | YES | YES | PENDING |
| BA-13 | B4B-04 | BenefitCase | Business review | Identify correct EmployerGroup for BC-MON40EKL ("Vault New Case 1") or confirm quarantine | Unknown | Unknown | No name match to live EGs | Low | Business Owner | P0 | 0 downstream with valid chain | NO | YES | PENDING |
| BA-14 | B4B-04 | BenefitCase | Business review | Identify correct EmployerGroup for BC-MON3BWD0 ("Vault New Group") or confirm quarantine | Unknown | Unknown | No name match to live EGs | Low | Business Owner | P0 | 0 downstream | NO | YES | PENDING |
| BA-15 | B4B-04 | BenefitCase | Business review | Identify correct EmployerGroup for BC-MOHRMTLJ ("New Client") — likely related to Pacific Harbor; confirm or quarantine | Possibly MGA-CAND-01 | Possibly MG-CAND-01 | Proposal title "Pacific Harbor 2026"; employer_name = "New Client" | Low | Business Owner | P0 | Proposal(cda1) | NO | YES | PENDING |
| BA-16 | B4B-05 | BenefitCase (missing) | Duplicate/restore decision | Confirm whether missing cases cd77–cd7a are duplicates of cd9a–cd9d OR distinct cases requiring restoration | Unknown | Unknown | case_number + employer_name signal | Medium | Business Owner + Migration Owner | **P0 — Critical** | 21 downstream orphaned records | YES | YES | PENDING |
| BA-17 | B4B-05 | Multiple downstream | Restore or quarantine | Based on BA-16 outcome: restore missing cases OR remap 21 records to live cases OR quarantine | Derived from BA-16 | Derived from BA-16 | Dependent on BA-16 | Derived | Migration Owner | P0 | 21 records | YES | YES | PENDING |
| BA-18 | — | Agency | Classification | Classify Northstar Benefits Group (NBG) as global catalog or MGA-scoped entity | MGA-CAND-01 (if scoped) | — | Agency data; EmployerGroup references | Medium | Business Owner | P1 | 4 EmployerGroups | NO | NO (P1) | PENDING |
| BA-19 | — | Agency | Classification | Classify Summit Coverage Partners (SCP) as global catalog or MGA-scoped entity | MGA-CAND-02 (if scoped) | — | Agency data; EmployerGroup references | Medium | Business Owner | P1 | 4 EmployerGroups | NO | NO (P1) | PENDING |

**Total business approval queue: 19 items**
**P0 items blocking Phase 4B: 17 (BA-01 through BA-17)**
**P1 items: 2 (BA-18, BA-19)**

---

## Section 9 — Quarantine Decision Plan

Quarantine decisions below are planning-only. No quarantine is executed during this planning step.

### QD-01 — BenefitCase Group A (empty employer_group_id, no employer name match)

| Field | Value |
|---|---|
| Entity type | BenefitCase |
| Affected records | 3: BC-MON40EKL ("Vault New Case 1"), BC-MON3BWD0 ("Vault New Group"), BC-MOHRMTLJ ("New Client") |
| Quarantine reason | employer_group_id is empty string; employer name does not match any live EmployerGroup; no reliable parent chain signal |
| Parent chain issue | Cannot resolve to EmployerGroup → MasterGroup → MGA without business identification |
| Suspected MGA | UNKNOWN — may be NBG scope based on agency_id = NBG on 2 of the 3 cases; business confirmation required |
| Suspected MasterGroup | UNKNOWN |
| Downstream dependencies | Proposal `cda1` references BC-MOHRMTLJ (1 proposal blocked) |
| Approval owner | Business Owner |
| Release condition | Business owner identifies correct EmployerGroup and provides approval for repair; or confirms case is test/placeholder and approves formal quarantine |
| Audit required | YES — governance event |
| Blocks Phase 4B | YES — unresolved P0 anomalies block Phase 4B regardless of count |
| Blocks Phase 5 | YES |

### QD-02 — QuoteScenario, CensusVersion, CaseTask, ExceptionItem, ActivityLog linked to missing cases

| Field | Value |
|---|---|
| Entity types | QuoteScenario(3), CensusVersion(4), CaseTask(4), ExceptionItem(2), ActivityLog(3) |
| Affected record count | **16** |
| Quarantine reason | Parent case_id does not resolve to a live BenefitCase record |
| Parent chain issue | 4 BenefitCase IDs (cd77–cd7a) are referenced but do not exist |
| Suspected MGA | Inferable from employer name signals: NBG scope (Redwood, Pacific Harbor), SCP scope (Summit, Front Range) |
| Suspected MasterGroup | MG-CAND-01 (NBG) or MG-CAND-02 (SCP) depending on employer |
| Downstream dependencies | No further children below these entities |
| Approval owner | Migration Owner |
| Release condition | Option A: Restore missing BenefitCase records and link them correctly → releases all 16 records via valid parent chain. Option B: Remap case_id references to live BenefitCases → releases all 16 via remapping. Option C: No option available → quarantine confirmed. |
| Audit required | YES |
| Blocks Phase 4B | YES — these are P0 orphan anomalies |
| Blocks Phase 5 | YES |

### QD-03 — EnrollmentWindow (2), RenewalCycle (2), Proposal (1) linked to missing case SCP-2002 (cd7a)

| Field | Value |
|---|---|
| Entity types | EnrollmentWindow(2), RenewalCycle(2), Proposal(1) |
| Affected record count | **5** |
| Quarantine reason | Parent case_id cd7a does not exist in live BenefitCase |
| Suspected MGA | SCP (Front Range Manufacturing) |
| Suspected MasterGroup | MG-CAND-02 |
| Downstream dependencies | Proposal has file artifact implications; EnrollmentWindow has access link implications |
| Approval owner | Migration Owner + Compliance (for Proposal file artifact and EnrollmentWindow access links) |
| Release condition | Restore or remap parent BenefitCase cd7a; or quarantine with access link revocation |
| Audit required | YES — Proposal and EnrollmentWindow have external artifact implications |
| Blocks Phase 4B | YES |
| Blocks Phase 5 | YES |

**Total quarantine candidates: 24 records across 3 categories**

Note: The dry-run reported 33 quarantine recommendations. The difference between 33 (dry-run) and 24 (quarantine decision plan) is because the dry-run's 33 included all 4 EmployerGroups (QC-2 category) and 8 BenefitCases as quarantine-recommended. This plan refines the classification:
- 4 EmployerGroups: proposed for **repair** (link to MasterGroup) rather than quarantine, subject to approval
- 4 Group B BenefitCases (NBG-1001, NBG-1002, SCP-2001, SCP-2002): proposed for **repair** rather than quarantine (high confidence employer name match)
- 1 BenefitCase (BC-MO23FYUV): NOT a quarantine candidate — resolves via B4B-03
- Remaining 24 records: quarantine decision plan items

The quarantine decision plan carries **24** candidates. All 33 original dry-run quarantine candidates have a documented disposition: 9 have a repair path (4 EGs + 4 stale-ID BenefitCases + BC-MO23FYUV), 24 have a quarantine or quarantine-or-restore path.

---

## Section 10 — Remediation Execution Order

### Ordered remediation steps

| Step | Action | Owner | Prerequisite | Action type | Data affected | Approval required | Validation method | Rollback | Blocker resolved |
|---|---|---|---|---|---|---|---|---|---|
| **RE-01** | Business decision: confirm MGA identities (NBG, SCP) and authorize seeding | Executive / Platform Owner | None | Business decision | None — decision only | YES | Business owner sign-off documented | N/A — no data changed | B4B-01 gate |
| **RE-02** | Seed approved MasterGeneralAgent records (NBG, SCP) | Migration Owner | RE-01 | Data creation | MasterGeneralAgent entity | YES (BA-01, BA-02) | Required field check; unique code; status = pending_onboarding; governance audit event | Delete seeded records; void batch | B4B-01 |
| **RE-03** | Business decision: confirm MasterGroup structure (1 per agency or other) | Business Owner | RE-01 | Business decision | None | YES | Business owner sign-off | N/A | B4B-02 gate |
| **RE-04** | Seed approved MasterGroup records linked to approved MGAs | Migration Owner | RE-02, RE-03 | Data creation | MasterGroup entity | YES (BA-03, BA-04) | All required fields; master_general_agent_id non-null; ownership_status = assigned; mga_business_approval_status = approved | Delete seeded records; revert master_general_agent_id | B4B-02 |
| **RE-05** | Link 4 EmployerGroups to approved MasterGroups (update master_group_id) | Migration Owner | RE-04 | Reference repair | EmployerGroup entity (4 records) | YES (BA-05 through BA-08) | All EGs have non-null master_group_id; chain verifiable | Revert master_group_id to null via rollback marker | B4B-03 |
| **RE-06** | Business decision on B4B-04 Group A cases (3 empty EG ref cases): identify EmployerGroup or confirm quarantine | Business Owner | RE-04 | Business decision | None | YES (BA-13, BA-14, BA-15) | Sign-off documented per case | N/A | B4B-04 (Group A) gate |
| **RE-07** | Repair employer_group_id on 4 Group B BenefitCases (NBG-1001, NBG-1002, SCP-2001, SCP-2002) | Migration Owner | RE-05 | Reference repair | BenefitCase entity (4 records) | YES (BA-09 through BA-12) | All 4 cases have valid employer_group_id resolving to live EG; full chain verifiable to MGA | Revert employer_group_id via rollback marker | B4B-04 (Group B) |
| **RE-08** | Apply outcome of RE-06: repair or quarantine Group A cases | Migration Owner | RE-06 | Reference repair or quarantine marking | BenefitCase entity (3 records) | YES (BA-13–BA-15 outcomes) | Repaired cases have valid chain; quarantined cases have mga_migration_status = quarantined | Revert repair or release quarantine via approval | B4B-04 (Group A) |
| **RE-09** | Business decision on B4B-05: duplicate vs. distinct determination for missing cases cd77–cd7a | Business Owner + Migration Owner | RE-07 | Business decision | None | YES (BA-16) | Sign-off documented; determines Option A, B, or C | N/A | B4B-05 gate |
| **RE-10** | Execute B4B-05 outcome: restore/remap/quarantine 21 downstream orphaned records | Migration Owner | RE-08, RE-09 | Data creation + repair + quarantine marking | Multiple entities (21 records) | YES (BA-17 outcome) | All 21 records have valid parent chain or confirmed quarantine status | Rollback per entity type; revert case_id or void restored records | B4B-05 |
| **RE-11** | Create all 30 required indexes (B4B-06) | Platform Admin | No data prerequisite; execute after RE-01 at earliest; must be complete before Phase 4B | Index creation | Database index layer | YES — Platform Admin authorization | Query plan verification for each index | Drop indexes | B4B-06 |
| **RE-12** | Execute second non-destructive dry-run | Migration Owner | RE-01 through RE-11 complete | Dry-run (read-only) | None — read-only | NO | Dry-run reconciliation report; all 14 thresholds evaluated | N/A — dry-run is read-only | Validation |
| **RE-13** | Review second dry-run reconciliation report | Migration Owner + Business Owner | RE-12 complete | Review | None | YES — sign-off | All 14 acceptance thresholds pass; P0 anomaly count = 0 | N/A | Phase 4B gate |
| **RE-14** | Request Phase 4B approval if and only if second dry-run passes all thresholds | Executive / Platform Owner | RE-13: all thresholds pass | Approval request | None | YES — explicit Phase 4B approval | All 12 Phase 4B re-approval criteria met | N/A — approval cannot be undone; no data affected | Phase 4B authorization |

---

## Section 11 — Second Dry-Run Plan

The second dry-run must be a complete re-execution of the Phase 4A dry-run engine after all 6 P0 blockers are resolved.

### Verification checklist for second dry-run

| Verification | What to check | Pass condition |
|---|---|---|
| MGA root anchor exists | MasterGeneralAgent record count > 0 | ≥ 1 valid MGA record with required fields |
| MasterGroup root anchor exists | MasterGroup record count > 0; all have valid master_general_agent_id | 100% of MasterGroups resolve to valid MGA |
| EmployerGroups resolve to MasterGroups | All 4 live EGs have non-null master_group_id | 100% of EGs have valid chain |
| BenefitCases resolve to EmployerGroups | All 9 BenefitCases have valid employer_group_id resolving to live EG | 100% or quarantined |
| Downstream records resolve to valid BenefitCases | All downstream case_id references resolve to live cases | 100% or quarantined |
| Missing BenefitCase references repaired | cd77–cd7a: restored, remapped, or quarantined | 0 unresolved orphaned references |
| Required indexes exist | All 30 indexes confirmed | 30 / 30 |
| Deterministic mappings valid | All proposed_mga_id values are real MasterGeneralAgent IDs | 0 null proposed IDs for non-quarantined records |
| Unresolved records quarantined | All records that could not be deterministically mapped have mga_migration_status = quarantined | 0 records in limbo |
| No fake/default MGA assignments | Safety guard confirms all proposed IDs are valid MGA record IDs | fake_default_mga_detected = 0 |
| All 14 acceptance thresholds re-evaluated | Each threshold re-run against post-remediation dataset | Target: all 14 PASS |
| No P0 Phase 4B blocker remains | B4B-01 through B4B-06 all resolved | 0 active P0 blockers |

### Required second dry-run output

- Updated total records scanned
- Updated total deterministic mappings (target: equal to non-quarantined record count)
- Updated total already compliant (target: 0 → will be 0 until Phase 4B backfill actually runs)
- Updated total quarantine recommendations (expected to be lower than 33 after repair)
- Updated anomaly counts (P0 target: 0; P1 target: ≤ 2 — Agency classification)
- Updated MasterGroup mapping table (all MasterGroups deterministically mapped)
- Updated acceptance threshold results (target: 14 / 14 PASS)
- Updated Phase 4B blocker register (target: 0 active P0 blockers)
- Updated business approval queue status (target: 0 pending Phase 4B-blocking items)
- Updated rollback readiness (must remain READY)
- Updated reconciliation report

---

## Section 12 — Phase 4B Re-Approval Criteria

All 12 criteria must be satisfied before Phase 4B final backfill can be requested. **None are currently met.**

| # | Criterion | Required condition | Current state | Met |
|---|---|---|---|---|
| 1 | 100% of MGA root records approved and seeded | All MasterGeneralAgent records exist; required fields non-null; governance audit event recorded | 0 records | NO |
| 2 | 100% of required MasterGroups approved and seeded | All MasterGroups exist; master_general_agent_id non-null; business approval recorded | 0 records | NO |
| 3 | 100% of EmployerGroups linked or quarantined | All 4 EGs have master_group_id; 0 EGs in limbo | 0 of 4 linked | NO |
| 4 | 100% of BenefitCases valid, repaired, or quarantined | All 9 cases have valid employer_group_id; 0 in limbo | 1 of 9 valid | NO |
| 5 | 100% of downstream missing-parent references repaired or quarantined | All 21 orphaned downstream records have valid parent chain or confirmed quarantine | 0 of 21 resolved | NO |
| 6 | 100% of required Phase 4B indexes created | All 30 indexes exist and verified | 0 of 30 created | NO |
| 7 | 0 unresolved P0 anomalies | P0 anomaly count = 0 in second dry-run | 42 P0 anomalies | NO |
| 8 | 0 unresolved P0 blockers | All 6 B4B blockers resolved | 6 active | NO |
| 9 | 0 fake/default MGA assignments | fake_default_mga_detected = 0; safety guard confirmed | 0 (currently passing) | YES |
| 10 | Second dry-run completed | RE-12 executed | Not started | NO |
| 11 | Second dry-run acceptance thresholds pass | All 14 thresholds PASS | Not evaluated | NO |
| 12 | Rollback readiness remains ready | 100% rollback markers available; before-state snapshots current | READY (trivially) | YES |
| 13 | Business approval queue contains no Phase 4B-blocking pending items | All 17 P0 approval queue items resolved | All 17 pending | NO |

**Phase 4B criteria met: 2 / 13 (criteria 9 and 12 trivially pass at current empty state)**
**Phase 4B criteria not met: 11 / 13**

---

## Section 13 — Risk Register Update

### P0 Blockers (6 active)

| Blocker ID | Severity | Domain | Affected records | Remediation action | Owner | Blocks 2nd dry-run | Blocks Phase 4B | Validation method | Status |
|---|---|---|---|---|---|---|---|---|---|
| B4B-01 | **P0** | MasterGeneralAgent | All 52 downstream | Seed approved MGA records (RE-02) | Executive / Platform Owner → Migration Owner | YES (root for all mapping) | YES | MGA record count > 0; required fields; governance audit | **ACTIVE** |
| B4B-02 | **P0** | MasterGroup | All 52 downstream | Seed approved MasterGroup records (RE-04) | Business Owner → Migration Owner | YES | YES | MasterGroup count > 0; MGA link valid; business approval recorded | **ACTIVE** |
| B4B-03 | **P0** | EmployerGroup | 4 records + 2 linked cases | Update master_group_id on 4 EGs (RE-05) | Migration Owner | YES (2 cases unblock) | YES | All 4 EGs: master_group_id non-null; chain to MGA valid | **ACTIVE** |
| B4B-04 | **P0** | BenefitCase | 8 cases + 21 downstream | Repair 4 stale-ID cases (RE-07); resolve 3 empty-EG cases (RE-08) | Migration Owner + Business Owner | YES | YES | All 9 cases: employer_group_id resolves to live EG | **ACTIVE** |
| B4B-05 | **P0** | Multiple downstream | 21 records | Restore/remap/quarantine (RE-10) | Migration Owner + Business Owner | YES | YES | All 21: valid parent chain or confirmed quarantine | **ACTIVE** |
| B4B-06 | **P0** | Indexes | 30 indexes | Create all 30 indexes (RE-11) | Platform Admin | NO (not required before 2nd dry-run at current scale) | YES | 30 indexes confirmed; query plan verified | **ACTIVE** |

### P1 Blockers (2 active)

| Blocker ID | Severity | Domain | Affected records | Remediation action | Owner | Blocks 2nd dry-run | Blocks Phase 4B | Status |
|---|---|---|---|---|---|---|---|---|
| B4B-07 | P1 | Agency | 2 Agency records | Classify NBG and SCP as global or scoped (BA-18, BA-19) | Business Owner | NO | NO (blocks Phase 5) | **ACTIVE** |
| B4B-08 | P1 (informational) | Proposal | 1 Proposal record | Correct employer_name inconsistency on proposal cda1 | Migration Owner | NO | NO | **ACTIVE** |

### P2 items (3 active, monitoring only)

| Item | Domain | Count | Notes | Blocks 2nd dry-run | Blocks Phase 4B |
|---|---|---|---|---|---|
| audit_log_missing_context | ActivityLog | 3 | 3 activity log records reference non-live case IDs; overlaps with B4B-05 orphan records; acceptable as platform-admin events if cases cannot be restored | NO | NO |

**Updated totals:**
- P0 blockers: **6** (unchanged — none resolved yet)
- P1 blockers: **2** (unchanged)
- P2 items: **3** (monitoring only)

---

## Section 14 — Non-Destructive Planning Confirmation

| Rule | Status |
|---|---|
| Records NOT seeded | CONFIRMED |
| Records NOT repaired | CONFIRMED |
| Records NOT quarantined | CONFIRMED |
| Indexes NOT created | CONFIRMED |
| Migration/backfill NOT run | CONFIRMED |
| Final MGA ownership NOT assigned | CONFIRMED |
| Records NOT moved | CONFIRMED |
| Records NOT deleted | CONFIRMED |
| App behavior NOT changed | CONFIRMED |
| Scoped services NOT activated | CONFIRMED |
| MGA UI NOT exposed | CONFIRMED |
| Frontend reads NOT replaced | CONFIRMED |
| Permissions NOT changed | CONFIRMED |
| TXQuote behavior NOT changed | CONFIRMED |
| Reporting behavior NOT changed | CONFIRMED |
| Document behavior NOT changed | CONFIRMED |
| End-user behavior NOT changed | CONFIRMED |

---

## Final Required Output

| Item | Value |
|---|---|
| **Confirmation this was planning only** | **CONFIRMED** |
| **Confirmation no remediation, seeding, repair, quarantine, index creation, migration/backfill, UI, navigation, permission, TXQuote, reporting, document, service activation, or end-user behavior changes were made** | **CONFIRMED** |
| Remediation plan path | `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_PLAN.md` |
| | |
| B4B-01 status | PLANNED — MGA seed plan documented; 2 MGA candidates identified from Agency signals; business approval required before execution (BA-01, BA-02) |
| B4B-02 status | PLANNED — MasterGroup seed plan documented; 2 MasterGroup candidates identified; depends on B4B-01 approval; business approval required (BA-03, BA-04) |
| B4B-03 status | PLANNED — EmployerGroup repair plan documented; 4 EGs mapped to proposed MasterGroups via agency_id signal; medium confidence; depends on B4B-01 + B4B-02; business approval required (BA-05 through BA-08) |
| B4B-04 status | PLANNED — 4 stale-ID cases have high-confidence repair path (employer name match); 3 empty-EG cases require business identification; quarantine condition defined (BA-09 through BA-15) |
| B4B-05 status | PLANNED — 3 remediation options defined (restore / remap / quarantine); critical deduplication decision required from business owner (BA-16, BA-17) |
| B4B-06 status | PLANNED — all 30 indexes documented with priority, risk, and validation; 0 required before second dry-run; all 30 required before Phase 4B |
| | |
| Business approval queue count | **19 items** (17 P0-blocking, 2 P1) |
| Quarantine decision count | **3 categories, 24 records** |
| Indexes required before second dry-run | **0 strictly required** (index #27 recommended if MGA users are added) |
| Indexes required before Phase 4B | **All 30** |
| Remediation execution order status | COMPLETE — 14 ordered steps (RE-01 through RE-14) with owner, prerequisite, action type, approval requirement, validation, and rollback defined |
| Second dry-run plan status | COMPLETE — 12 verification checkpoints; required output defined |
| Phase 4B re-approval criteria status | COMPLETE — 13 criteria defined; 2 trivially met; 11 not yet met |
| Updated P0 blocker count | **6** (unchanged) |
| Updated P1 blocker count | **2** (unchanged) |
| Updated P2 item count | **3** (monitoring only) |
| Blockers to remediation planning itself | **NONE** — planning completed without obstruction |
| Remediation plan ready for audit | **YES** |

---

**Do not execute any remediation step until the plan is audited and each step is explicitly approved.**

*End of MGA Phase 4A Blocker Remediation Plan.*
*Report path: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_PLAN.md`*