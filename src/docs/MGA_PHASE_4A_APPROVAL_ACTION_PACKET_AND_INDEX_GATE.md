# MGA Phase 4A Approval Action Packet and Index Authorization Gate

Report date: 2026-05-04
Author: Base44 AI agent
Phase: 4A — Approval Action Packet and Index Authorization Gate
Remediation batch ID: REMEDIATION-BATCH-4A-20260504
Status: **APPROVAL PACKET AND INDEX AUTHORIZATION GATE ONLY — No data mutations, seeding, repair, quarantine, index creation, migration, or behavior changes made.**

Canonical documents:
- Remediation plan: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_PLAN.md`
- Remediation plan audit: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_PLAN_AUDIT_REPORT.md`
- Remediation execution report: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_EXECUTION_REPORT.md`
- Business approval and index readiness: `docs/MGA_PHASE_4A_BUSINESS_APPROVAL_AND_INDEX_READINESS_REPORT.md`
- Parallel advancement report: `docs/MGA_PHASE_4A_PARALLEL_ADVANCEMENT_REPORT.md`
- This report: `docs/MGA_PHASE_4A_APPROVAL_ACTION_PACKET_AND_INDEX_GATE.md`

---

## Non-Destructive Control Statement

**This step is strictly limited to:**
1. Final business approval decision packet for BA-01 through BA-19 (Track B)
2. Final platform-admin index authorization package for the 29 ready indexes (Track A)
3. Capturing any explicit approval, rejection, deferral, or pending status provided in this step

**No approval was inferred. No action was taken on any item without explicit human authorization.**

**This step did NOT:**
- Seed, repair, quarantine, move, or delete any record
- Create any index
- Run migration, backfill, or the second dry-run
- Activate scoped services or expose MGA UI
- Modify navigation, permissions, TXQuote, reporting, documents, or any end-user behavior

---

## Entering State

| Metric | Value |
|---|---|
| Business approvals: approved / rejected / deferred / pending | **0 / 0 / 0 / 19** |
| P0-blocking approvals: approved / pending / rejected | **0 / 17 / 0** |
| Indexes: ready / conditional / created | **29 / 1 / 0** |
| Remediation rerun approved | **NO** |
| Second dry-run approved | **NO** |
| Phase 4B | **BLOCKED** |

---

## Track A — Platform Admin Index Authorization Package

### Authorization gate

**The 29 ready indexes may be created ONLY after the Platform Admin signs the following authorization block.**

---

```
PLATFORM ADMIN INDEX AUTHORIZATION — REMEDIATION-BATCH-4A-20260504
==================================================================
I, [Platform Admin full name], [Platform Admin email], hereby authorize
creation of the 29 ready MGA Phase 4A database indexes listed below.

I confirm:
  - These indexes are non-destructive. They do not modify any entity record.
  - Rollback = DROP INDEX. No data loss occurs on rollback.
  - Index #27 (MasterGeneralAgentUser) is EXCLUDED from this authorization
    until: (a) MasterGeneralAgentUser record count is confirmed > 0 after
    RE-04 MasterGroup seeding, and (b) I provide a separate explicit
    authorization for index #27.
  - These indexes are required before Phase 4B final backfill.
  - Index creation does not authorize any remediation, seeding, repair,
    quarantine, second dry-run, or Phase 4B execution.

Authorization date/time: [YYYY-MM-DD HH:MM TZ]
Signature / confirmation: [Platform Admin confirmation]
```

**Platform Admin authorization status: NOT YET RECEIVED**

No authorization was provided as of this report. If Platform Admin provides the above, index creation may proceed for all 29 ready indexes immediately. Track A result is updated to APPROVED and creation executes under batch `REMEDIATION-BATCH-4A-20260504`.

---

### Index authorization detail — all 29 ready indexes

| # | Entity | Fields | Purpose | Required before Phase 4B | Safe to create now | Perf impact if missing | Rollback | Validation method | Approval status |
|---|---|---|---|---|---|---|---|---|---|
| 1 | MasterGeneralAgent | (code, status) | Unique MGA code enforcement; status filter | YES | YES — no records affected | Full-table scan on code lookup at backfill | DROP INDEX | Query plan: index used for code+status filter | **Pending PA** |
| 2 | MasterGroup | (master_general_agent_id, status) | MGA-scoped MasterGroup listing | YES | YES | Cross-MGA scan during backfill | DROP INDEX | Query plan confirms | **Pending PA** |
| 3 | EmployerGroup | (master_general_agent_id, status) | MGA-scoped employer listing | YES | YES | Cross-MGA scan | DROP INDEX | Query plan confirms | **Pending PA** |
| 4 | BenefitCase | (master_general_agent_id, stage, status) | MGA-scoped case pipeline | YES | YES | Performance degradation; cross-MGA scan | DROP INDEX | Query plan confirms | **Pending PA** |
| 5 | CensusVersion | (master_general_agent_id, case_id, status) | MGA-scoped census listing | YES | YES | Scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 6 | CensusMember | (master_general_agent_id, case_id) | MGA-scoped PII member listing | YES | YES | PII scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 7 | QuoteScenario | (master_general_agent_id, case_id, status) | MGA-scoped quote listing | YES | YES | Scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 8 | EnrollmentWindow | (master_general_agent_id, case_id, status) | MGA-scoped enrollment listing | YES | YES | Scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 9 | EmployeeEnrollment | (master_general_agent_id, case_id, status) | MGA-scoped PII enrollment listing | YES | YES | PII scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 10 | Document | (master_general_agent_id, case_id) | MGA-scoped document listing | YES | YES | File access scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 11 | CaseTask | (master_general_agent_id, case_id, status) | MGA-scoped task listing | YES | YES | Scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 12 | ExceptionItem | (master_general_agent_id, case_id, severity) | MGA-scoped exception triage | YES | YES | Scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 13 | ActivityLog | (master_general_agent_id, case_id) | MGA-scoped audit trail | YES | YES | Audit scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 14 | RenewalCycle | (master_general_agent_id, case_id) | MGA-scoped renewal listing | YES | YES | Scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 15 | Proposal | (master_general_agent_id, case_id, status) | MGA-scoped proposal listing | YES | YES | Artifact scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 16 | MGAMigrationBatch | (master_general_agent_id, status) | Migration batch tracking | YES | YES | Migration tracking failure | DROP INDEX | Query plan confirms | **Pending PA** |
| 17 | Tenant | (master_general_agent_id, master_group_id, status) | Tenant scoping via MasterGroup | YES | YES | Negligible at 0 records; scan risk at scale | DROP INDEX | Query plan confirms | **Pending PA** |
| 18 | CensusImportJob | (master_general_agent_id, case_id, status) | Scoped job tracking | YES | YES | Job scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 19 | CensusImportAuditEvent | (master_general_agent_id, census_import_job_id) | Scoped audit event lookup | YES | YES | Audit scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 20 | CensusValidationResult | (master_general_agent_id, census_import_id, status) | Scoped validation results | YES | YES | Validation scan risk | DROP INDEX | Query plan confirms | **Pending PA** |
| 21 | UserManual | (master_general_agent_id, scope_type) | Discriminated manual listing | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |
| 22 | HelpSearchLog | (master_general_agent_id, user_email, created_date) | Scoped search activity | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |
| 23 | HelpAIQuestionLog | (master_general_agent_id, user_email, created_date) | Scoped AI question activity | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |
| 24 | HelpCoverageSnapshot | (master_general_agent_id, scope_type, snapshot_date) | Discriminated snapshot listing | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |
| 25 | HelpAuditLog | (master_general_agent_id, event_type, created_date) | Scoped help audit | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |
| 26 | HelpAITrainingQueue | (master_general_agent_id, scope_type, queue_status) | Discriminated queue processing | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |
| 28 | MGAQuarantineRecord | (master_general_agent_id, entity_type, status) | Quarantine triage and release | YES | YES | Quarantine management failure | DROP INDEX | Query plan confirms | **Pending PA** |
| 29 | TxQuoteCase | (master_general_agent_id, case_id) | TXQuote scoping | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |
| 30 | EnrollmentMember | (master_general_agent_id, enrollment_window_id) | Enrollment member scoping | YES | YES | Negligible at 0 records | DROP INDEX | Query plan confirms | **Pending PA** |

### Index #27 — Excluded (conditional)

| Field | Value |
|---|---|
| Entity | MasterGeneralAgentUser |
| Fields | (master_general_agent_id, user_email, status) |
| Conditional prerequisite | MasterGeneralAgentUser count > 0 after RE-04 (MasterGroup seeding) |
| Current status | **EXCLUDED — 0 MasterGeneralAgentUser records; RE-04 not yet executed** |
| Required before Phase 4B | YES — unconditionally |
| Required before 2nd dry-run | CONDITIONAL — required if count > 0 after seeding |
| Authorization trigger | After RE-04 complete: check count; if > 0, Platform Admin provides separate index #27 authorization |

### Track A summary

| Item | Value |
|---|---|
| Platform Admin authorization received | **NO** |
| Indexes created | **0** |
| Indexes pending PA authorization | **29** |
| Indexes excluded (conditional) | **1** (index #27) |
| Track A result | **PENDING PLATFORM ADMIN AUTHORIZATION** |

---

## Track B — Business Approval Decision Packet

### Decision packet for BA-01 through BA-19

For each item: evidence, confidence, dependency, available decisions, recommended decision where signal supports one, risk of each decision, and effect on execution gates.

---

#### BA-01 — NBG MGA Root Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-01 |
| Blocker ID | B4B-01 |
| Required owner | Executive / Platform Owner |
| Entity | MasterGeneralAgent (new record) |
| Proposed action | Seed "Northstar Benefits Group" MGA (or business-confirmed name) |
| Source signal | Agency `69e169f498a89c653c72cd6b` name = "Northstar Benefits Group", code = NBG; 2 EmployerGroups carry agency_id = NBG; downstream case numbers prefixed NBG- |
| Confidence | **Medium** — agency grouping is coherent but not a legal entity confirmation |
| Dependency | None — this is a root decision |
| Downstream affected | All 52 records (root anchor for all downstream mapping) |
| Current approval status | **PENDING** |

**Available decisions:**

| Decision | Effect on remediation | Effect on 2nd dry-run | Effect on Phase 4B | Recommended |
|---|---|---|---|---|
| **APPROVE** — confirm NBG as real MGA entity; provide legal entity name, unique code, primary contact name and email | RE-01 gate clears; RE-02 (MGA seeding) can execute once owner provides required fields | Prerequisite toward eligibility | Prerequisite toward eligibility | **YES — if NBG is a real MGA entity** |
| **REJECT** — NBG is not a valid MGA | All NBG-scope records (cd90, cd91, all their cases) remain blocked or become quarantine-eligible; NBG branch of remediation terminates | No change | No change | Only if NBG is confirmed not an MGA |
| **DEFER** — pending legal/entity confirmation | NBG-scope records remain blocked; no seeding | No change | No change | Only if legal identity is genuinely unclear |

**Risk of approving:** If NBG is a sub-agency of a larger MGA rather than an independent MGA, a seeded record may need correction. Rollback = delete seeded record + re-approve. Low risk because seeding is reversible.

**Risk of rejecting:** All NBG-scope records (cd90, cd91, cases NBG-1001, NBG-1002, and 21 downstream orphaned records) become permanently blocked or quarantine-bound. Loss of active case data in the NBG branch.

**Risk of deferring:** Remediation remains completely blocked for the NBG branch. Phase 4B cannot proceed. Time cost of continued blocking.

**Required from approving owner if APPROVED:**
- Confirmed MGA name (may differ from "Northstar Benefits Group")
- Legal entity name (for legal_entity_name field)
- Unique business code (e.g., "NBG" or another code)
- Primary contact name
- Primary contact email
- Structural answer: is NBG an independent MGA or does it roll up under a larger parent MGA?

---

#### BA-02 — SCP MGA Root Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-02 |
| Blocker ID | B4B-01 |
| Required owner | Executive / Platform Owner |
| Entity | MasterGeneralAgent (new record) |
| Proposed action | Seed "Summit Coverage Partners" MGA (or business-confirmed name) |
| Source signal | Agency `69e169f498a89c653c72cd6c` name = "Summit Coverage Partners", code = SCP; 2 EmployerGroups carry agency_id = SCP; downstream case numbers prefixed SCP- |
| Confidence | **Medium** |
| Dependency | None — root decision, parallel to BA-01 |
| Downstream affected | All 52 records |
| Current approval status | **PENDING** |

**Available decisions:** Same structure as BA-01.

| Decision | Effect on remediation | Effect on 2nd dry-run | Effect on Phase 4B | Recommended |
|---|---|---|---|---|
| **APPROVE** — confirm SCP as real MGA; provide legal entity name, code, contacts | RE-01 gate clears for SCP branch | Prerequisite toward eligibility | Prerequisite toward eligibility | **YES — if SCP is a real MGA entity** |
| **REJECT** | All SCP-scope records blocked or quarantine-eligible | No change | No change | Only if confirmed not an MGA |
| **DEFER** | SCP branch remains blocked | No change | No change | Only if genuinely unclear |

**Joint BA-01 + BA-02 structural question (required from owner):** Are NBG and SCP two independent MGAs, or do they share a parent MGA entity? If a parent MGA exists, a third MGA record may need to be seeded before BA-03/BA-04 can proceed.

**Required from approving owner if APPROVED:** Same fields as BA-01 for SCP.

---

#### BA-03 — NBG MasterGroup Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-03 |
| Blocker ID | B4B-02 |
| Required owner | Business Owner |
| Entity | MasterGroup (new record) |
| Proposed action | Seed NBG MasterGroup linked to BA-01 approved MGA |
| Source signal | Agency NBG grouping; 2 EmployerGroups share agency_id = NBG |
| Confidence | **Medium** |
| Dependency | **BA-01 must be APPROVED and RE-02 executed first** |
| Downstream affected | Redwood Family Dental (cd90), Pacific Harbor Tech (cd91), and all their downstream cases |
| Current approval status | **PENDING — blocked on BA-01** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** — confirm 1 MasterGroup for NBG; provide name and code | RE-03 gate clears; RE-04 (MasterGroup seeding) executes | **YES — if 1 MasterGroup per NBG agency is the correct structure** |
| **REJECT** — NBG structure differs from proposed | Provide alternative: how many MasterGroups? What are their names? | Only if business structure differs |
| **DEFER** | NBG EmployerGroups and cases remain blocked | Only if genuinely unclear |

**Structural decision required from owner:** Is 1 MasterGroup per agency correct, or does each employer (Redwood Family Dental, Pacific Harbor Tech) have its own separate MasterGroup?

**Risk of approving:** Incorrect MasterGroup structure requires rollback and re-approval. Rollback = delete seeded MasterGroup + revert EmployerGroup links.

**Risk of rejecting / deferring:** All BA-05, BA-06, BA-09, BA-10 remain blocked; NBG branch of remediation cannot advance.

---

#### BA-04 — SCP MasterGroup Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-04 |
| Blocker ID | B4B-02 |
| Required owner | Business Owner |
| Entity | MasterGroup (new record) |
| Proposed action | Seed SCP MasterGroup linked to BA-02 approved MGA |
| Source signal | Agency SCP grouping; 2 EmployerGroups share agency_id = SCP |
| Confidence | **Medium** |
| Dependency | **BA-02 must be APPROVED and RE-02 executed first** |
| Downstream affected | Summit Outdoor Supply (cd92), Front Range Manufacturing (cd93), and their cases |
| Current approval status | **PENDING — blocked on BA-02** |

**Available decisions:** Same structure as BA-03.

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** — confirm 1 MasterGroup for SCP; provide name and code | RE-03 gate clears for SCP; RE-04 executes | **YES — if 1 MasterGroup per SCP agency is correct** |
| **REJECT** | BA-07, BA-08, BA-11, BA-12 remain blocked | Only if structure differs |
| **DEFER** | SCP branch remains blocked | Only if unclear |

---

#### BA-05 — EmployerGroup Link: Redwood Family Dental → NBG MasterGroup

| Field | Value |
|---|---|
| Approval item ID | BA-05 |
| Blocker ID | B4B-03 |
| Required owner | Business Owner / Migration Owner |
| Entity | EmployerGroup `69e16a0a98a89c653c72cd90` — Redwood Family Dental, CA |
| Proposed action | Set master_group_id → NBG MasterGroup (BA-03) |
| Source signal | agency_id = NBG; state = CA; employer_name confirmed in downstream BenefitCase records |
| Confidence | **Medium** |
| Dependency | **BA-01 approved, BA-03 approved, RE-04 executed** |
| Downstream affected | BenefitCase `69efe29ffecddbea94de8002` (Redwood, ready_for_quote); 4 CensusMember records; 2 CensusVersion records |
| Current approval status | **PENDING — blocked on BA-03** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | RE-05 executes for this EG; cd90 gains valid MGA chain; downstream case + census records become resolvable | **YES — agency_id signal is internally consistent** |
| **REJECT** | Provide correct MasterGroup; cd90 remains blocked | Only if Redwood belongs to a different MasterGroup |
| **DEFER** | cd90 and its cases remain blocked | |
| **QUARANTINE** | cd90 and dependents quarantined; downstream case blocked | Only if ownership is genuinely disputed |

**Risk of approving:** If Redwood Family Dental belongs to a different MasterGroup, rollback = revert master_group_id to null.

**Risk of rejecting / deferring:** BenefitCase `69efe29...` (active ready_for_quote case) and 4 CensusMembers remain blocked.

---

#### BA-06 — EmployerGroup Link: Pacific Harbor Tech → NBG MasterGroup

| Field | Value |
|---|---|
| Approval item ID | BA-06 |
| Blocker ID | B4B-03 |
| Required owner | Business Owner / Migration Owner |
| Entity | EmployerGroup `69e16a0a98a89c653c72cd91` — Pacific Harbor Tech, CA |
| Proposed action | Set master_group_id → NBG MasterGroup (BA-03) |
| Source signal | agency_id = NBG; state = CA |
| Confidence | **Medium** |
| Dependency | **BA-01 approved, BA-03 approved, RE-04 executed** |
| Downstream affected | BenefitCase `69e16cc064b94008398a8846` (BC-MO23FYUV, census_in_progress) |
| Current approval status | **PENDING — blocked on BA-03** |

**Available decisions:** Same structure as BA-05.

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | cd91 gains valid MGA chain; BC-MO23FYUV resolves without direct repair | **YES** |
| **REJECT** | Provide alternative MasterGroup | Only if Pacific Harbor belongs elsewhere |
| **DEFER / QUARANTINE** | cd91 and BC-MO23FYUV remain blocked | |

---

#### BA-07 — EmployerGroup Link: Summit Outdoor Supply → SCP MasterGroup

| Field | Value |
|---|---|
| Approval item ID | BA-07 |
| Blocker ID | B4B-03 |
| Required owner | Business Owner / Migration Owner |
| Entity | EmployerGroup `69e16a0a98a89c653c72cd92` — Summit Outdoor Supply, CO |
| Proposed action | Set master_group_id → SCP MasterGroup (BA-04) |
| Source signal | agency_id = SCP; state = CO |
| Confidence | **Medium** |
| Dependency | **BA-02 approved, BA-04 approved, RE-04 executed** |
| Downstream affected | 0 direct cases with valid EG ref currently; resolves via B4B-04/B4B-05 |
| Current approval status | **PENDING — blocked on BA-04** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | cd92 gains valid MGA chain; enables BA-11 BenefitCase repair | **YES** |
| **REJECT** | Provide alternative MasterGroup | Only if Summit belongs elsewhere |
| **DEFER / QUARANTINE** | cd92 and SCP-2001 case branch remain blocked | |

---

#### BA-08 — EmployerGroup Link: Front Range Manufacturing → SCP MasterGroup

| Field | Value |
|---|---|
| Approval item ID | BA-08 |
| Blocker ID | B4B-03 |
| Required owner | Business Owner / Migration Owner |
| Entity | EmployerGroup `69e16a0a98a89c653c72cd93` — Front Range Manufacturing, CO |
| Proposed action | Set master_group_id → SCP MasterGroup (BA-04) |
| Source signal | agency_id = SCP; state = CO |
| Confidence | **Medium** |
| Dependency | **BA-02 approved, BA-04 approved, RE-04 executed** |
| Downstream affected | 0 direct valid-EG cases currently; resolves via B4B-04/B4B-05 |
| Current approval status | **PENDING — blocked on BA-04** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | cd93 gains valid MGA chain; enables BA-12 BenefitCase repair | **YES** |
| **REJECT** | Provide alternative | |
| **DEFER / QUARANTINE** | cd93 and SCP-2002 branch remain blocked | |

---

#### BA-09 — BenefitCase Repair: NBG-1001 (Redwood, stale EG ID)

| Field | Value |
|---|---|
| Approval item ID | BA-09 |
| Blocker ID | B4B-04 |
| Required owner | Migration Owner |
| Entity | BenefitCase `69e16a3998a89c653c72cd9a` — Redwood Family Dental, NBG-1001, ready_for_quote |
| Proposed action | Update employer_group_id: stale `cd73` → live `cd90` |
| Source signal | employer_name exact match ("Redwood Family Dental"); case_number prefix = NBG; agency_id alignment |
| Confidence | **High** |
| Dependency | **BA-05 approved and RE-05 executed (cd90 linked to MasterGroup)** |
| Downstream affected | QuoteScenario, ActivityLog, CaseTask, ExceptionItem (via B4B-05 cd77) |
| Current approval status | **PENDING — blocked on BA-05** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | employer_group_id corrected; NBG-1001 resolves through EG → MG → MGA chain; upstream of 4 B4B-05 orphaned downstream records | **YES — high confidence employer_name match** |
| **REJECT** | Provide correct EG ID; case remains blocked | Only if Redwood belongs to a different EG |
| **DEFER** | Case and downstream remain blocked | |
| **QUARANTINE** | Case quarantined; active ready_for_quote data blocked | Only if ownership is unresolvable |

**Risk of approving:** If stale EG was intentionally set, rollback = revert employer_group_id to `cd73` (non-existent EG, so effective re-block). Low risk.

---

#### BA-10 — BenefitCase Repair: NBG-1002 (Pacific Harbor, stale EG ID)

| Field | Value |
|---|---|
| Approval item ID | BA-10 |
| Blocker ID | B4B-04 |
| Required owner | Migration Owner |
| Entity | BenefitCase `69e16a3998a89c653c72cd9b` — Pacific Harbor Tech, NBG-1002, proposal_ready |
| Proposed action | Update employer_group_id: stale `cd74` → live `cd91` |
| Source signal | employer_name exact match; NBG- prefix |
| Confidence | **High** |
| Dependency | **BA-06 approved and RE-05 executed** |
| Downstream affected | QuoteScenario, CensusVersion, ActivityLog, CaseTask, Proposal (via B4B-05 cd78) |
| Current approval status | **PENDING — blocked on BA-06** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | NBG-1002 resolves; upstream of 5 B4B-05 orphaned records | **YES — high confidence** |
| **REJECT / DEFER / QUARANTINE** | Case and downstream remain blocked or quarantined | |

---

#### BA-11 — BenefitCase Repair: SCP-2001 (Summit, stale EG ID)

| Field | Value |
|---|---|
| Approval item ID | BA-11 |
| Blocker ID | B4B-04 |
| Required owner | Migration Owner |
| Entity | BenefitCase `69e16a3998a89c653c72cd9c` — Summit Outdoor Supply, SCP-2001, census_in_progress |
| Proposed action | Update employer_group_id: stale `cd75` → live `cd92` |
| Source signal | employer_name exact match; SCP- prefix |
| Confidence | **High** |
| Dependency | **BA-07 approved and RE-05 executed** |
| Downstream affected | ExceptionItem, CensusVersion, CaseTask (via B4B-05 cd79) |
| Current approval status | **PENDING — blocked on BA-07** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | SCP-2001 resolves; upstream of 3 B4B-05 orphaned records | **YES — high confidence** |
| **REJECT / DEFER / QUARANTINE** | Case and downstream remain blocked | |

---

#### BA-12 — BenefitCase Repair: SCP-2002 (Front Range, stale EG ID)

| Field | Value |
|---|---|
| Approval item ID | BA-12 |
| Blocker ID | B4B-04 |
| Required owner | Migration Owner |
| Entity | BenefitCase `69e16a3998a89c653c72cd9d` — Front Range Manufacturing, SCP-2002, approved_for_enrollment |
| Proposed action | Update employer_group_id: stale `cd76` → live `cd93` |
| Source signal | employer_name exact match; SCP- prefix |
| Confidence | **High** |
| Dependency | **BA-08 approved and RE-05 executed** |
| Downstream affected | EnrollmentWindow, RenewalCycle, Proposal, CensusVersion, ActivityLog, CaseTask (via B4B-05 cd7a — 8 records) |
| Current approval status | **PENDING — blocked on BA-08** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE** | SCP-2002 resolves; upstream of 8 B4B-05 orphaned records — largest single downstream impact | **YES — high confidence; highest downstream value** |
| **REJECT / DEFER / QUARANTINE** | 8 downstream records including EnrollmentWindow and Proposal remain blocked | |

---

#### BA-13 — BenefitCase Review: "Vault New Case 1" (empty EG ref)

| Field | Value |
|---|---|
| Approval item ID | BA-13 |
| Blocker ID | B4B-04 |
| Required owner | Business Owner |
| Entity | BenefitCase `69f4d0a77e7ff1ee2ddccfe0` — "Vault New Case 1", BC-MON40EKL, census_in_progress |
| Current employer_group_id | `""` (empty string) |
| Source signal | None — "Vault New Case 1" matches no live EmployerGroup name |
| Confidence | **Low** |
| Dependency | None — this decision is independent of BA-01 through BA-08 |
| Downstream affected | 0 downstream records directly linked |
| Current approval status | **PENDING** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE REPAIR** — provide the correct EmployerGroup ID for this case | employer_group_id corrected; case becomes resolvable if EG has valid MGA chain | Only if business can identify the correct employer |
| **APPROVE QUARANTINE** — confirm this is a test or placeholder case | Case quarantined; preserved but invisible to operational users | **RECOMMENDED IF CANNOT IDENTIFY EMPLOYER — prevents Phase 4B block** |
| **DEFER** | Case remains blocked; Phase 4B continues to be blocked by this unresolved P0 anomaly | Not recommended — deferral has no benefit over quarantine if employer is genuinely unknown |

**Default recommendation:** If the business cannot identify which real employer "Vault New Case 1" belongs to, **APPROVE QUARANTINE** is the correct path. It resolves the P0 anomaly without data loss.

---

#### BA-14 — BenefitCase Review: "Vault New Group" (empty EG ref)

| Field | Value |
|---|---|
| Approval item ID | BA-14 |
| Blocker ID | B4B-04 |
| Required owner | Business Owner |
| Entity | BenefitCase `69f4cc2fbf3351b119d33be0` — "Vault New Group", BC-MON3BWD0, draft |
| Current employer_group_id | `""` (empty string) |
| Source signal | None |
| Confidence | **Low** |
| Dependency | Independent |
| Downstream affected | 0 |
| Current approval status | **PENDING** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE REPAIR** | Provide EG ID; case becomes resolvable | Only if employer is identifiable |
| **APPROVE QUARANTINE** | Case quarantined; P0 anomaly resolved | **RECOMMENDED IF CANNOT IDENTIFY EMPLOYER** |
| **DEFER** | Phase 4B remains blocked by this anomaly | Not recommended |

---

#### BA-15 — BenefitCase Review: "New Client" (empty EG ref, Pacific Harbor signal)

| Field | Value |
|---|---|
| Approval item ID | BA-15 |
| Blocker ID | B4B-04 |
| Required owner | Business Owner |
| Entity | BenefitCase `69efe258aac90f6694b1c19e` — "New Client", BC-MOHRMTLJ, draft |
| Current employer_group_id | `""` (empty string) |
| Source signal | Linked Proposal `69e16a3998a89c653c72cda1` has title "Pacific Harbor 2026 Renewal Proposal" — possible mismatch between case employer_name ("New Client") and the real employer |
| Confidence | **Low** |
| Dependency | Independent for this decision; repair to cd91 requires BA-06 if approved |
| Downstream affected | Proposal `69e16a3998a89c653c72cda1` (1 record) |
| Current approval status | **PENDING** |

**Available decisions:**

| Decision | Effect | Recommended |
|---|---|---|
| **APPROVE REPAIR to cd91** — confirm this is Pacific Harbor Tech's case | employer_group_id = cd91; case resolves once BA-06 + RE-05 complete; Proposal is preserved | **CONDITIONALLY RECOMMENDED** if business confirms this is the Pacific Harbor case |
| **APPROVE QUARANTINE** — this is a test case or the employer_name mismatch is not correctable | Case + linked Proposal quarantined | Recommended if Pacific Harbor connection cannot be confirmed |
| **DEFER** | Case and Proposal remain blocked | Not recommended |

---

#### BA-16 — Missing BenefitCase Deduplication Decision (cd77–cd7a)

| Field | Value |
|---|---|
| Approval item ID | BA-16 |
| Blocker ID | B4B-05 |
| Required owner | Business Owner + Migration Owner |
| Entity | 4 missing BenefitCase IDs: `cd77` (NBG-1001), `cd78` (NBG-1002), `cd79` (SCP-2001), `cd7a` (SCP-2002) |
| Source signal | employer_name + case_number prefix alignment between missing IDs and live stale-ID cases (cd9a, cd9b, cd9c, cd9d); same 4 employers referenced in both sets |
| Confidence | **Medium — hypothesis; authoritative confirmation required** |
| Dependency | BA-09–BA-12 must be decided first (live stale-ID cases resolved) |
| Downstream affected | **21 records**: QuoteScenario(3), CensusVersion(4), CaseTask(4), ExceptionItem(2), ActivityLog(3), EnrollmentWindow(2), RenewalCycle(2), Proposal(2) |
| Current approval status | **PENDING** |

**Available decisions — choose ONE:**

| Option | Decision | Effect | Risk | Recommended |
|---|---|---|---|---|
| **Option A — RESTORE** | cd77–cd7a are DISTINCT cases that should exist. Restore them with original IDs. Link to live EGs after B4B-03. | All 21 downstream records resolve via valid parent chain. No remapping needed. | Creates 8 duplicate cases if cd77–cd7a are actually the same cases as cd9a–cd9d. Cannot be undone easily. | Only if original case data can be produced and confirmed non-duplicate |
| **Option B — REMAP** | cd77–cd7a are DUPLICATES of cd9a–cd9d. Remap 21 downstream records to live cases after B4B-04 repairs. | All 21 downstream records resolve by pointing to existing live cases. | Incorrect merge of case histories if cd77–cd7a are actually distinct. | **RECOMMENDED** if business confirms the 4 employers had only one set of cases and the stale IDs were a seeding artifact |
| **Option C — QUARANTINE** | Cannot confirm either above. Quarantine all 21 records. | 21 records preserved but invisible to operational users until released via approved quarantine flow. | Potential loss of active operational data (active QuoteScenarios, EnrollmentWindows, Proposals). | Only if A and B cannot be confirmed within the remediation window |

**Default recommendation if evidence is unavailable:** **Option C — Quarantine** is the safe default. It preserves data integrity and does not create cross-case contamination. Records can be released via the quarantine approval flow once the business can confirm ownership.

---

#### BA-17 — Downstream Missing-BenefitCase Execution Decision

| Field | Value |
|---|---|
| Approval item ID | BA-17 |
| Blocker ID | B4B-05 |
| Required owner | Migration Owner |
| Entity | 21 downstream orphaned records across multiple entity types |
| Proposed action | Execute the outcome of BA-16 (Option A, B, or C) per record or per case group |
| Dependency | **BA-16 must be decided first** |
| Downstream affected | All 21 records directly |
| Current approval status | **PENDING — blocked on BA-16** |

**Available decisions:** Derived from BA-16.
- If BA-16 = Option A: Migration Owner confirms which original case data is used for each of cd77–cd7a
- If BA-16 = Option B: Migration Owner confirms the per-case remap target (cd77→cd9a, cd78→cd9b, cd79→cd9c, cd7a→cd9d)
- If BA-16 = Option C: Migration Owner confirms quarantine scope (all 21, or per-case-group)

---

#### BA-18 — Agency Classification: Northstar Benefits Group (P1)

| Field | Value |
|---|---|
| Approval item ID | BA-18 |
| Blocker ID | B4B-07 (P1) |
| Required owner | Business Owner |
| Entity | Agency `69e169f498a89c653c72cd6b` — Northstar Benefits Group (NBG) |
| Proposed action | Classify as global catalog entry or MGA-scoped entity |
| Source signal | Agency record; 2 EmployerGroups reference this agency_id |
| Confidence | Medium |
| Dependency | Independent — P1; does not block remediation execution |
| Downstream affected | 2 EmployerGroups (cd90, cd91) |
| Current approval status | **PENDING** |

| Decision | Effect | Recommended |
|---|---|---|
| **GLOBAL CATALOG** | Agency remains a platform-wide entity; no MGA scoping applied | If NBG is a shared brokerage used across multiple MGAs |
| **MGA-SCOPED** | Agency is linked to NBG MGA; visible only within that MGA's scope | If NBG is the sole agency under the NBG MGA |
| **DEFER** | Classification decision deferred to Phase 5 | Acceptable — does not block Phase 4B |

---

#### BA-19 — Agency Classification: Summit Coverage Partners (P1)

| Field | Value |
|---|---|
| Approval item ID | BA-19 |
| Blocker ID | B4B-07 (P1) |
| Required owner | Business Owner |
| Entity | Agency `69e169f498a89c653c72cd6c` — Summit Coverage Partners (SCP) |
| Proposed action | Classify as global catalog or MGA-scoped |
| Source signal | Agency record; 2 EmployerGroups reference this agency_id |
| Confidence | Medium |
| Dependency | Independent — P1 |
| Downstream affected | 2 EmployerGroups (cd92, cd93) |
| Current approval status | **PENDING** |

| Decision | Effect | Recommended |
|---|---|---|
| **GLOBAL CATALOG** | Shared entity; no MGA scoping | If SCP is shared |
| **MGA-SCOPED** | Linked to SCP MGA | If SCP is the sole agency under SCP MGA |
| **DEFER** | Deferred to Phase 5 | Acceptable |

---

### Required Decision Summary

#### Dependency order

```
LEVEL 0 (Independent — can be decided immediately):
  BA-01 (NBG MGA root)
  BA-02 (SCP MGA root)
  BA-13 (Vault New Case 1 — quarantine/repair)
  BA-14 (Vault New Group — quarantine/repair)
  BA-15 (New Client — quarantine/repair)
  BA-18 (Agency NBG classification — P1)
  BA-19 (Agency SCP classification — P1)

LEVEL 1 (Requires BA-01 approved first):
  BA-03 (NBG MasterGroup)

LEVEL 1 (Requires BA-02 approved first):
  BA-04 (SCP MasterGroup)

LEVEL 2 (Requires BA-03 approved and seeded):
  BA-05 (EG cd90 Redwood → NBG MG)
  BA-06 (EG cd91 Pacific Harbor → NBG MG)

LEVEL 2 (Requires BA-04 approved and seeded):
  BA-07 (EG cd92 Summit → SCP MG)
  BA-08 (EG cd93 Front Range → SCP MG)

LEVEL 3 (Requires respective EG approval and RE-05 executed):
  BA-09 (BC NBG-1001 repair) — requires BA-05
  BA-10 (BC NBG-1002 repair) — requires BA-06
  BA-11 (BC SCP-2001 repair) — requires BA-07
  BA-12 (BC SCP-2002 repair) — requires BA-08

LEVEL 4 (Requires BA-09 through BA-12 decided):
  BA-16 (cd77–cd7a deduplication decision)

LEVEL 5 (Requires BA-16 decided):
  BA-17 (Downstream 21 records — execute BA-16 outcome)
```

#### Items that can be approved independently (Level 0)

| Item | Owner | Can approve now | Notes |
|---|---|---|---|
| BA-01 | Executive / Platform Owner | **YES** | Requires legal entity details from owner |
| BA-02 | Executive / Platform Owner | **YES** | Requires legal entity details from owner |
| BA-13 | Business Owner | **YES** | Quarantine is likely the correct path |
| BA-14 | Business Owner | **YES** | Quarantine is likely the correct path |
| BA-15 | Business Owner | **YES** | Quarantine if Pacific Harbor connection cannot be confirmed |
| BA-18 | Business Owner | **YES** | P1 — defer is acceptable |
| BA-19 | Business Owner | **YES** | P1 — defer is acceptable |

#### Items that default to quarantine if business evidence is unavailable

| Item | Quarantine default rationale |
|---|---|
| BA-13 | Employer name matches no live EG; no downstream dependents; safe to quarantine |
| BA-14 | Same as BA-13 |
| BA-15 | Low-confidence connection to Pacific Harbor; 1 downstream Proposal; safer to quarantine than misassign |
| BA-16 (Option C) | If deduplication evidence unavailable, quarantine all 21 orphaned downstream records |
| BA-05 through BA-08 | If EG ownership disputed, quarantine EG and its downstream cases |

#### Minimum approval set required for remediation execution rerun

| Required | Items |
|---|---|
| Minimum P0 approvals for full remediation rerun | BA-01, BA-02, BA-03, BA-04, BA-05, BA-06, BA-07, BA-08, BA-09, BA-10, BA-11, BA-12, BA-16, BA-17 *(14 items)* |
| Minimum P0 approvals if Group A cases are quarantined | BA-13 (quarantine), BA-14 (quarantine), BA-15 (quarantine) — replaces need for business identification |
| Platform Admin index authorization | All 29 ready indexes authorized *(Track A)* |
| **Total minimum for remediation rerun** | **14 P0 approvals + 3 quarantine decisions + Platform Admin index authorization** |

#### Minimum approval set required for second dry-run

Same as remediation rerun PLUS remediation execution rerun must complete successfully.

Second dry-run cannot start until:
1. All minimum approvals above are received
2. Remediation execution rerun completes under `REMEDIATION-BATCH-4A-20260504`
3. RE-11a conditional check on MasterGeneralAgentUser count is passed
4. Explicit second dry-run approval is granted

#### Minimum approval set required to request Phase 4B

Same as second dry-run PLUS:
1. Second dry-run report is generated
2. All 14 acceptance thresholds pass
3. P0 anomaly count = 0 in second dry-run output
4. All 30 indexes created and confirmed (including index #27)
5. Separate Phase 4B approval is granted by Executive / Platform Owner

---

## Track B Summary

| Metric | Value |
|---|---|
| Total approval items | **19** |
| Approved | **0** |
| Rejected | **0** |
| Deferred | **0** |
| Pending | **19** |
| P0-blocking approvals approved / pending / rejected / deferred | **0 / 17 / 0 / 0** |
| P1 approvals pending | **2** (BA-18, BA-19) |
| Items that can be decided independently right now | **7** (BA-01, BA-02, BA-13, BA-14, BA-15, BA-18, BA-19) |

---

## Updated B4B-01 through B4B-06 Status

| Blocker | Status | Gate |
|---|---|---|
| B4B-01 | **ACTIVE — BLOCKED** | BA-01, BA-02 pending |
| B4B-02 | **ACTIVE — BLOCKED** | BA-03, BA-04 pending + B4B-01 prerequisite |
| B4B-03 | **ACTIVE — BLOCKED** | BA-05–BA-08 pending + B4B-02 prerequisite |
| B4B-04 | **ACTIVE — BLOCKED** | BA-09–BA-15 pending + B4B-03 prerequisite (Group B) |
| B4B-05 | **ACTIVE — BLOCKED** | BA-16, BA-17 pending + B4B-04 prerequisite |
| B4B-06 | **INDEX-ONLY ELIGIBLE — PENDING PA AUTHORIZATION** | 29 Ready; 1 Conditional excluded; awaiting Platform Admin written authorization |

---

## Approval Capture — Provided in This Step

No approving owner has provided explicit decisions in this step. No approval, rejection, deferral, or quarantine decision was inferred. All 19 items remain PENDING.

If approving owners provide decisions, they must include:
- Owner name and role
- Decision (Approve / Reject / Defer / Quarantine)
- Timestamp
- Decision reason
- Approval item ID
- Affected records
- Execution implication

---

## Next-Step Determination

### Assessment

| Gate | Status |
|---|---|
| Platform Admin authorization for 29 indexes received | NO |
| BA-01 and BA-02 (MGA roots) decided | NO |
| All required P0 approvals complete | NO |
| Minimum approval set for remediation rerun complete | NO |
| Remediation execution rerun approved | NO |
| Second dry-run approved | NO |
| Phase 4B eligible | NO |

### Determined next step

**Result: STILL BLOCKED — approvals remain pending.**

The project cannot advance to remediation execution rerun, partial remediation, second dry-run, or Phase 4B until the minimum approval set is received.

**The only forward movement available is:**

**Track A:** Platform Admin provides explicit written authorization for the 29 ready indexes. Once provided, index creation executes immediately under `REMEDIATION-BATCH-4A-20260504`. This is independent of all business approval gates.

**Track B:** Approving owners submit decisions beginning at Level 0 (items that can be decided independently):
1. Executive / Platform Owner → BA-01 (NBG) and BA-02 (SCP) with full legal entity details if approving
2. Business Owner → BA-13, BA-14, BA-15 (likely quarantine) — independent; can proceed now
3. Business Owner → BA-18, BA-19 (P1 Agency classification — defer is acceptable)
4. Once BA-01/BA-02 approved → Business Owner → BA-03, BA-04
5. Once BA-03/BA-04 approved and seeded → BA-05–BA-08
6. Once BA-05–BA-08 approved and RE-05 executed → BA-09–BA-12
7. Once BA-09–BA-12 decided → BA-16
8. Once BA-16 decided → BA-17

**When Track A and Track B both complete (or unresolved items are quarantine-approved):**
→ Request **MGA Phase 4A Blocker Remediation Execution Rerun** under batch `REMEDIATION-BATCH-4A-20260504`

**Do not run the second dry-run until the remediation execution rerun completes.**
**Do not request Phase 4B until the second dry-run passes all 14 acceptance thresholds.**
**Phase 4B remains blocked.**

---

## Non-Destructive Final Confirmation

| Rule | Status |
|---|---|
| Records seeded | **NO** |
| Records repaired | **NO** |
| Records quarantined | **NO** |
| Indexes created | **NO** |
| Migration / backfill run | **NO** |
| MGA ownership assigned | **NO** |
| Records moved or deleted | **NO** |
| UI / navigation changed | **NO** |
| Permissions changed | **NO** |
| TXQuote / reporting / document behavior changed | **NO** |
| Scoped services activated | **NO** |
| MGA UI exposed | **NO** |
| Frontend reads replaced | **NO** |
| End-user behavior changed | **NO** |

---

## Final Required Output

| Item | Value |
|---|---|
| **Confirmation this was limited to approval packet and index authorization gate** | **CONFIRMED** |
| **Confirmation no unapproved seeding, repair, quarantine, migration/backfill, UI, navigation, permissions, TXQuote, reporting, documents, service activation, or end-user behavior changes were made** | **CONFIRMED** |
| Report path | `docs/MGA_PHASE_4A_APPROVAL_ACTION_PACKET_AND_INDEX_GATE.md` |
| | |
| Platform Admin index approval status | **NOT RECEIVED — pending Platform Admin written authorization** |
| Indexes created | **0** |
| Indexes pending PA authorization | **29** |
| Indexes excluded (conditional) | **1** (index #27 — prerequisite not satisfied) |
| | |
| BA-01 through BA-19 approval status | **All 19 PENDING** |
| P0-blocking approvals approved / pending / rejected / deferred | **0 / 17 / 0 / 0** |
| | |
| Minimum approval set for remediation rerun | **BA-01, BA-02, BA-03, BA-04, BA-05–BA-08, BA-09–BA-12, BA-16, BA-17 (14 P0 items) + BA-13/BA-14/BA-15 quarantine decisions + Platform Admin index authorization** |
| Minimum approval set for second dry-run | Same as remediation rerun + remediation execution rerun must complete |
| Minimum approval set for Phase 4B request | Same as second dry-run + second dry-run must pass all 14 thresholds + all 30 indexes created |
| | |
| B4B-01 | **ACTIVE — BLOCKED** (BA-01, BA-02 pending) |
| B4B-02 | **ACTIVE — BLOCKED** (BA-03, BA-04 pending + B4B-01 prerequisite) |
| B4B-03 | **ACTIVE — BLOCKED** (BA-05–BA-08 pending + B4B-02 prerequisite) |
| B4B-04 | **ACTIVE — BLOCKED** (BA-09–BA-15 pending + B4B-03 prerequisite) |
| B4B-05 | **ACTIVE — BLOCKED** (BA-16, BA-17 pending + B4B-04 prerequisite) |
| B4B-06 | **INDEX-ONLY ELIGIBLE — PENDING PA AUTHORIZATION** |
| | |
| Remediation execution rerun approved | **NO** |
| Second dry-run approved | **NO** |
| **Phase 4B remains blocked** | **YES — confirmed** |
| | |
| **Recommended next controlled step** | **STILL BLOCKED — two independent unblocking actions available: (A) Platform Admin provides written authorization for 29 ready indexes → index creation executes; (B) Approving owners begin Level 0 decisions: Executive/Platform Owner decides BA-01 and BA-02 (with legal entity details); Business Owner decides BA-13, BA-14, BA-15 (likely quarantine), BA-18, BA-19. All other items follow in dependency order. When minimum approval set is complete → request MGA Phase 4A Blocker Remediation Execution Rerun under REMEDIATION-BATCH-4A-20260504.** |

*End of MGA Phase 4A Approval Action Packet and Index Authorization Gate.*
*Report path: `docs/MGA_PHASE_4A_APPROVAL_ACTION_PACKET_AND_INDEX_GATE.md`*