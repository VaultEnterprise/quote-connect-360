# MGA Phase 4A Business Approval Capture and Index Execution Readiness Report

Report date: 2026-05-04
Author: Base44 AI agent
Phase: 4A — Business Approval Capture + Index Execution Readiness
Remediation batch ID: REMEDIATION-BATCH-4A-20260504
Status: **APPROVAL CAPTURE AND INDEX READINESS ONLY — No data mutations, seeding, repair, quarantine, index creation, migration, or behavior changes made.**

Canonical documents:
- Remediation plan: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_PLAN.md`
- Remediation plan audit: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_PLAN_AUDIT_REPORT.md`
- Remediation execution report: `docs/MGA_PHASE_4A_BLOCKER_REMEDIATION_EXECUTION_REPORT.md`
- This report: `docs/MGA_PHASE_4A_BUSINESS_APPROVAL_AND_INDEX_READINESS_REPORT.md`

---

## Non-Destructive Control Statement

**This document is an approval capture and index readiness package only.**

No records were seeded, repaired, quarantined, moved, or deleted.
No indexes were created.
No migration or backfill was executed.
No MGA ownership was assigned.
No UI, navigation, permission, TXQuote, reporting, document, scoped service, or end-user behavior was changed.

All approval items in this report reflect the real authorization state as of this report date. No approval is fabricated or assumed.

---

## Current System State

| Metric | Value |
|---|---|
| Total entity types scanned (dry-run) | 41 |
| Total records scanned | 52 |
| Total deterministic mappings | 0 |
| Approval items completed / rejected / pending | **0 / 0 / 19** |
| P0 / P1 / P2 blockers | **6 / 2 / 3** |
| Phase 4B ready | **NO** |
| Second dry-run ready | **NO** |
| Remediation execution status | **Blocked at approval gates** |
| Indexes created / deferred | **0 / 30** |
| MasterGeneralAgent records | **0** |
| MasterGroup records | **0** |
| MasterGeneralAgentUser records | **0** |

---

## Section 1 — Approval Decision Register

All 19 approval items from the remediation plan are listed below with the available signals, required decisions, and current status.

**Note on approval status:** No human business owner or platform admin has provided explicit sign-off on any item. The approval status for every item below is therefore **PENDING**. The decision options presented for each item are the choices the approving owner must make. This report presents those choices formally so that the approving owner can respond and enable the next controlled remediation execution rerun.

---

### BA-01 — NBG MGA Root Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-01 |
| Blocker ID | B4B-01 |
| Severity | **P0 — Critical** |
| Entity type | MasterGeneralAgent |
| Affected record | New record to be seeded: "Northstar Benefits Group" (or business-approved name) |
| Proposed action | Seed MasterGeneralAgent record for the NBG-aligned MGA |
| Proposed MGA | Northstar Benefits Group (inferred — confirmation required) |
| Proposed MasterGroup | N/A — this IS the MGA root |
| Source signal | Agency record `69e169f498a89c653c72cd6b` (name: Northstar Benefits Group, code: NBG); 2 EmployerGroups carry this agency_id; downstream case numbers prefixed NBG- |
| Confidence | **Medium — inferred from Agency signals; not deterministic** |
| Approving owner required | **Executive / Platform Owner** |
| **Approval status** | **PENDING** |
| Approval timestamp | — |
| Rejection reason | — |
| Deferral reason | — |
| Downstream records affected | All 52 records (root anchor for all downstream mapping) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Delete seeded MGA record; void REMEDIATION-BATCH-4A-20260504; re-approve with correct data |
| Validation method | Unique code; required fields non-null; status = pending_onboarding; governance audit event recorded |

**Decision options for approving owner:**
- **APPROVE** — Confirm NBG (or the correct legal MGA entity name, legal_entity_name, code, primary_contact_name, primary_contact_email) and authorize RE-02 seeding
- **REJECT** — NBG is not a valid MGA; no seeding; NBG-scope records remain blocked or quarantine-eligible
- **DEFER** — Pending legal/entity confirmation; NBG-scope records remain blocked

**Required fields from approving owner if APPROVED:**
- Confirmed MGA name (may differ from "Northstar Benefits Group")
- Legal entity name
- Unique business code (e.g. "NBG")
- Primary contact name and email
- Confirmation: is this MGA an independent entity or a sub-agency under a larger umbrella MGA?

---

### BA-02 — SCP MGA Root Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-02 |
| Blocker ID | B4B-01 |
| Severity | **P0 — Critical** |
| Entity type | MasterGeneralAgent |
| Affected record | New record to be seeded: "Summit Coverage Partners" (or business-approved name) |
| Proposed action | Seed MasterGeneralAgent record for the SCP-aligned MGA |
| Proposed MGA | Summit Coverage Partners (inferred — confirmation required) |
| Proposed MasterGroup | N/A |
| Source signal | Agency record `69e169f498a89c653c72cd6c` (name: Summit Coverage Partners, code: SCP); 2 EmployerGroups carry this agency_id; downstream case numbers prefixed SCP- |
| Confidence | **Medium — inferred from Agency signals** |
| Approving owner required | **Executive / Platform Owner** |
| **Approval status** | **PENDING** |
| Approval timestamp | — |
| Rejection reason | — |
| Deferral reason | — |
| Downstream records affected | All 52 records (co-root with BA-01) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Delete seeded MGA record; void batch; re-approve |
| Validation method | Same as BA-01 |

**Decision options:**
- **APPROVE** — Confirm SCP entity details and authorize seeding
- **REJECT** — SCP is not a valid MGA
- **DEFER** — Pending legal confirmation

**Additional decision required (BA-01 + BA-02 together):** Are NBG and SCP two separate MGA entities, or do they roll up under a single parent MGA? This determines whether 1 or 2 MasterGeneralAgent records are seeded. The current plan assumes 2 independent MGAs. If they share a parent, a third MGA record may be needed.

---

### BA-03 — NBG MasterGroup Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-03 |
| Blocker ID | B4B-02 |
| Severity | **P0** |
| Entity type | MasterGroup |
| Affected record | New record: "Northstar Benefits Group — Master Group" (or business-approved name) |
| Proposed action | Seed MasterGroup record linked to BA-01 approved MGA |
| Proposed MGA | MGA seeded under BA-01 |
| Proposed MasterGroup | MG-CAND-01 (NBG Master Group) |
| Source signal | Agency NBG grouping; 2 EmployerGroups share agency_id = NBG |
| Confidence | **Medium** |
| Approving owner required | **Business Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-01 must be APPROVED first |
| Downstream records affected | Redwood Family Dental (cd90), Pacific Harbor Tech (cd91), and all their downstream cases |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Delete seeded MasterGroup record; revert master_general_agent_id on any linked records |
| Validation method | master_general_agent_id non-null; ownership_status = assigned; mga_business_approval_status = approved; unique code |

**Decision options:**
- **APPROVE** — Confirm 1 MasterGroup for NBG and provide name, code; link to BA-01 MGA
- **REJECT** — NBG MasterGroup structure differs; provide alternative structure
- **DEFER** — Pending business confirmation

**Structural decision required:** Is 1 MasterGroup per agency correct, or does each employer (Redwood, Pacific Harbor) have its own separate MasterGroup?

---

### BA-04 — SCP MasterGroup Candidate

| Field | Value |
|---|---|
| Approval item ID | BA-04 |
| Blocker ID | B4B-02 |
| Severity | **P0** |
| Entity type | MasterGroup |
| Affected record | New record: "Summit Coverage Partners — Master Group" (or business-approved name) |
| Proposed action | Seed MasterGroup record linked to BA-02 approved MGA |
| Proposed MGA | MGA seeded under BA-02 |
| Proposed MasterGroup | MG-CAND-02 (SCP Master Group) |
| Source signal | Agency SCP grouping; 2 EmployerGroups share agency_id = SCP |
| Confidence | **Medium** |
| Approving owner required | **Business Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-02 must be APPROVED first |
| Downstream records affected | Summit Outdoor Supply (cd92), Front Range Manufacturing (cd93), and all their downstream cases |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Delete seeded MasterGroup; revert linked records |
| Validation method | Same as BA-03 |

**Decision options:** Same structure as BA-03. Approve, reject, or defer.

---

### BA-05 — EmployerGroup Link: Redwood Family Dental

| Field | Value |
|---|---|
| Approval item ID | BA-05 |
| Blocker ID | B4B-03 |
| Severity | **P0** |
| Entity type | EmployerGroup |
| Affected record | `69e16a0a98a89c653c72cd90` — Redwood Family Dental, CA |
| Proposed action | Set master_group_id → NBG MasterGroup (seeded under BA-03) |
| Proposed MGA | NBG MGA (BA-01) |
| Proposed MasterGroup | MG-CAND-01 (BA-03) |
| Source signal | agency_id = NBG; state = CA |
| Confidence | **Medium** |
| Approving owner required | **Business Owner / Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-01, BA-02, BA-03 approved and seeded (RE-04 complete) |
| Downstream records affected | BenefitCase `69efe29ffecddbea94de8002` (Redwood ready_for_quote); 4 CensusMember records; 2 CensusVersion records |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert master_group_id to null via rollback marker |
| Validation method | master_group_id non-null; MasterGroup.master_general_agent_id non-null; full chain to MGA verifiable |

**Decision options:** APPROVE link to NBG MasterGroup / REJECT (provide alternative MasterGroup) / DEFER / QUARANTINE (block this EG and dependents)

---

### BA-06 — EmployerGroup Link: Pacific Harbor Tech

| Field | Value |
|---|---|
| Approval item ID | BA-06 |
| Blocker ID | B4B-03 |
| Severity | **P0** |
| Entity type | EmployerGroup |
| Affected record | `69e16a0a98a89c653c72cd91` — Pacific Harbor Tech, CA |
| Proposed action | Set master_group_id → NBG MasterGroup (BA-03) |
| Proposed MGA | NBG MGA (BA-01) |
| Proposed MasterGroup | MG-CAND-01 |
| Source signal | agency_id = NBG; state = CA |
| Confidence | **Medium** |
| Approving owner required | **Business Owner / Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-03 approved and seeded |
| Downstream records affected | BenefitCase `69e16cc064b94008398a8846` (BC-MO23FYUV, Pacific Harbor census_in_progress) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert master_group_id to null |
| Validation method | Same as BA-05 |

**Decision options:** APPROVE / REJECT / DEFER / QUARANTINE

---

### BA-07 — EmployerGroup Link: Summit Outdoor Supply

| Field | Value |
|---|---|
| Approval item ID | BA-07 |
| Blocker ID | B4B-03 |
| Severity | **P0** |
| Entity type | EmployerGroup |
| Affected record | `69e16a0a98a89c653c72cd92` — Summit Outdoor Supply, CO |
| Proposed action | Set master_group_id → SCP MasterGroup (BA-04) |
| Proposed MGA | SCP MGA (BA-02) |
| Proposed MasterGroup | MG-CAND-02 |
| Source signal | agency_id = SCP; state = CO |
| Confidence | **Medium** |
| Approving owner required | **Business Owner / Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-04 approved and seeded |
| Downstream records affected | 0 direct cases with valid EG ref currently; resolves via B4B-04/B4B-05 |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert master_group_id to null |
| Validation method | Same as BA-05 |

**Decision options:** APPROVE / REJECT / DEFER / QUARANTINE

---

### BA-08 — EmployerGroup Link: Front Range Manufacturing

| Field | Value |
|---|---|
| Approval item ID | BA-08 |
| Blocker ID | B4B-03 |
| Severity | **P0** |
| Entity type | EmployerGroup |
| Affected record | `69e16a0a98a89c653c72cd93` — Front Range Manufacturing, CO |
| Proposed action | Set master_group_id → SCP MasterGroup (BA-04) |
| Proposed MGA | SCP MGA (BA-02) |
| Proposed MasterGroup | MG-CAND-02 |
| Source signal | agency_id = SCP; state = CO |
| Confidence | **Medium** |
| Approving owner required | **Business Owner / Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-04 approved and seeded |
| Downstream records affected | 0 direct valid-EG cases currently; resolves via B4B-04/B4B-05 |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert master_group_id to null |
| Validation method | Same as BA-05 |

**Decision options:** APPROVE / REJECT / DEFER / QUARANTINE

---

### BA-09 — BenefitCase Repair: NBG-1001 (Redwood Family Dental)

| Field | Value |
|---|---|
| Approval item ID | BA-09 |
| Blocker ID | B4B-04 |
| Severity | **P0** |
| Entity type | BenefitCase |
| Affected record | `69e16a3998a89c653c72cd9a` — Redwood Family Dental, NBG-1001, ready_for_quote |
| Proposed action | Update employer_group_id: `69e16a7b98a89c653c72cd73` (stale) → `69e16a0a98a89c653c72cd90` (cd90, live Redwood EG) |
| Proposed MGA | NBG MGA (BA-01) |
| Proposed MasterGroup | MG-CAND-01 (BA-03) |
| Source signal | employer_name = "Redwood Family Dental" matches EmployerGroup cd90 exactly; case_number prefix = NBG |
| Confidence | **High** |
| Approving owner required | **Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-05 (cd90 EG linked to MasterGroup) must be complete |
| Downstream records affected | QuoteScenario (cd9e via B4B-05), ActivityLog (cdaf), CaseTask (cdb3), ExceptionItem (cda7) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert employer_group_id to stale value `cd73` via rollback marker |
| Validation method | employer_group_id resolves to live EG; EG → MasterGroup → MGA chain fully verifiable |

**Decision options:** APPROVE repair / REJECT (provide alternative EG) / DEFER / QUARANTINE this case

---

### BA-10 — BenefitCase Repair: NBG-1002 (Pacific Harbor Tech)

| Field | Value |
|---|---|
| Approval item ID | BA-10 |
| Blocker ID | B4B-04 |
| Severity | **P0** |
| Entity type | BenefitCase |
| Affected record | `69e16a3998a89c653c72cd9b` — Pacific Harbor Tech, NBG-1002, proposal_ready |
| Proposed action | Update employer_group_id: `cd74` (stale) → `69e16a0a98a89c653c72cd91` (cd91, live Pacific Harbor EG) |
| Proposed MGA | NBG MGA |
| Proposed MasterGroup | MG-CAND-01 |
| Source signal | employer_name match; NBG- prefix |
| Confidence | **High** |
| Approving owner required | **Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-06 (cd91 EG linked) |
| Downstream records affected | QuoteScenario (cd9f via B4B-05), CensusVersion (cdac), ActivityLog (cdb0), CaseTask (cdb4), Proposal (cda2 via cd78 missing case) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert employer_group_id to `cd74` |
| Validation method | Same as BA-09 |

**Decision options:** APPROVE / REJECT / DEFER / QUARANTINE

---

### BA-11 — BenefitCase Repair: SCP-2001 (Summit Outdoor Supply)

| Field | Value |
|---|---|
| Approval item ID | BA-11 |
| Blocker ID | B4B-04 |
| Severity | **P0** |
| Entity type | BenefitCase |
| Affected record | `69e16a3998a89c653c72cd9c` — Summit Outdoor Supply, SCP-2001, census_in_progress |
| Proposed action | Update employer_group_id: `cd75` (stale) → `69e16a0a98a89c653c72cd92` (cd92, live Summit EG) |
| Proposed MGA | SCP MGA |
| Proposed MasterGroup | MG-CAND-02 |
| Source signal | employer_name match; SCP- prefix |
| Confidence | **High** |
| Approving owner required | **Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-07 (cd92 EG linked) |
| Downstream records affected | ExceptionItem (cda8 via cd79 missing case), CensusVersion (cdad), CaseTask (cdb5) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert employer_group_id to `cd75` |
| Validation method | Same as BA-09 |

**Decision options:** APPROVE / REJECT / DEFER / QUARANTINE

---

### BA-12 — BenefitCase Repair: SCP-2002 (Front Range Manufacturing)

| Field | Value |
|---|---|
| Approval item ID | BA-12 |
| Blocker ID | B4B-04 |
| Severity | **P0** |
| Entity type | BenefitCase |
| Affected record | `69e16a3998a89c653c72cd9d` — Front Range Manufacturing, SCP-2002, approved_for_enrollment |
| Proposed action | Update employer_group_id: `cd76` (stale) → `69e16a0a98a89c653c72cd93` (cd93, live Front Range EG) |
| Proposed MGA | SCP MGA |
| Proposed MasterGroup | MG-CAND-02 |
| Source signal | employer_name match; SCP- prefix |
| Confidence | **High** |
| Approving owner required | **Migration Owner** |
| **Approval status** | **PENDING** |
| Prerequisite | BA-08 (cd93 EG linked) |
| Downstream records affected | EnrollmentWindow, RenewalCycle, Proposal (cda2 via cd7a), CensusVersion (cdae), ActivityLog (cdb1), CaseTask (cdb5) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Revert employer_group_id to `cd76` |
| Validation method | Same as BA-09 |

**Decision options:** APPROVE / REJECT / DEFER / QUARANTINE

---

### BA-13 — BenefitCase Business Review: "Vault New Case 1"

| Field | Value |
|---|---|
| Approval item ID | BA-13 |
| Blocker ID | B4B-04 |
| Severity | **P0** |
| Entity type | BenefitCase |
| Affected record | `69f4d0a77e7ff1ee2ddccfe0` — "Vault New Case 1", BC-MON40EKL, census_in_progress |
| Current employer_group_id | `""` (empty string) |
| Proposed action | Business owner identifies the correct EmployerGroup, OR confirms this case should be quarantined |
| Best available EG match | NONE — "Vault New Case 1" does not match any live EmployerGroup name |
| Confidence | **Low** |
| Approving owner required | **Business Owner** |
| **Approval status** | **PENDING** |
| Downstream records affected | 0 currently linked downstream records |
| Blocks remediation execution | NO (does not block 2nd dry-run prerequisite path) |
| Blocks second dry-run | **NO** |
| Blocks Phase 4B | **YES** — unresolved P0 anomaly |
| Rollback requirement | If repaired: revert employer_group_id; if quarantined: release via MGAQuarantineRecord approval |
| Validation method | If repaired: full chain verification; if quarantined: mga_migration_status = quarantined confirmed |

**Decision options:**
- **APPROVE REPAIR** — Provide the correct EmployerGroup ID for this case
- **QUARANTINE** — Confirm this is a test/placeholder case and approve formal quarantine
- **DEFER** — Leave blocked pending further investigation

---

### BA-14 — BenefitCase Business Review: "Vault New Group"

| Field | Value |
|---|---|
| Approval item ID | BA-14 |
| Blocker ID | B4B-04 |
| Severity | **P0** |
| Entity type | BenefitCase |
| Affected record | `69f4cc2fbf3351b119d33be0` — "Vault New Group", BC-MON3BWD0, draft |
| Current employer_group_id | `""` (empty string) |
| Proposed action | Business owner identifies correct EmployerGroup, OR confirms quarantine |
| Best available EG match | NONE |
| Confidence | **Low** |
| Approving owner required | **Business Owner** |
| **Approval status** | **PENDING** |
| Downstream records affected | 0 |
| Blocks remediation execution | NO |
| Blocks second dry-run | **NO** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Same as BA-13 |
| Validation method | Same as BA-13 |

**Decision options:** APPROVE REPAIR (with EG ID) / QUARANTINE / DEFER

---

### BA-15 — BenefitCase Business Review: "New Client"

| Field | Value |
|---|---|
| Approval item ID | BA-15 |
| Blocker ID | B4B-04 |
| Severity | **P0** |
| Entity type | BenefitCase |
| Affected record | `69efe258aac90f6694b1c19e` — "New Client", BC-MOHRMTLJ, draft |
| Current employer_group_id | `""` (empty string) |
| Proposed action | Identify whether this is the Pacific Harbor case (linked Proposal has title "Pacific Harbor 2026 Renewal Proposal") OR quarantine |
| Best available EG match | Possibly `69e16a0a98a89c653c72cd91` (Pacific Harbor Tech) — low confidence from Proposal title |
| Confidence | **Low** |
| Approving owner required | **Business Owner** |
| **Approval status** | **PENDING** |
| Downstream records affected | Proposal `69e16a3998a89c653c72cda1` (1 record) |
| Blocks remediation execution | NO |
| Blocks second dry-run | **NO** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Same as BA-13 |
| Validation method | Same as BA-13 |

**Decision options:**
- **APPROVE REPAIR** — Confirm employer_group_id = cd91 (Pacific Harbor Tech) and authorize repair
- **QUARANTINE** — Confirm this is a test/placeholder and approve quarantine; downstream Proposal also quarantined
- **DEFER** — Leave blocked

---

### BA-16 — Missing BenefitCase Deduplication Decision (cd77–cd7a)

| Field | Value |
|---|---|
| Approval item ID | BA-16 |
| Blocker ID | B4B-05 |
| Severity | **P0 — Critical** |
| Entity type | BenefitCase (missing records) |
| Affected records | 4 missing BenefitCase IDs: `69e16af398a89c653c72cd77` (NBG-1001), `cd78` (NBG-1002), `cd79` (SCP-2001), `cd7a` (SCP-2002) |
| Proposed action | Determine: are cd77–cd7a the SAME cases as cd9a–cd9d (living stale-ID cases), or distinct cases requiring restoration? |
| Source signal | employer_name + case_number prefix match between missing IDs and live stale-ID cases; both sets reference same 4 employers |
| Confidence | **Medium — hypothesis; requires authoritative confirmation** |
| Approving owner required | **Business Owner + Migration Owner** |
| **Approval status** | **PENDING** |
| Downstream records affected | 21 records: QuoteScenario(3), CensusVersion(4), CaseTask(4), ExceptionItem(2), ActivityLog(3), EnrollmentWindow(2), RenewalCycle(2), Proposal(2) |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Depends on chosen option: revert restored records, revert remapped case_ids, or release quarantine |
| Validation method | Per chosen option — full chain verification or quarantine status confirmed |

**Decision options — Business owner must choose ONE:**

**Option A — RESTORE:** cd77–cd7a are DISTINCT cases that should exist. Restore them with their original IDs, link to live EmployerGroups (after B4B-03), and all 21 downstream records resolve via valid parent chain.
- Evidence required: Original case data for each of cd77–cd7a; confirmation these are not duplicates of cd9a–cd9d
- Risk: Creates duplicates if the live stale-ID cases actually represent the same cases

**Option B — REMAP:** cd77–cd7a are DUPLICATES of cd9a–cd9d. The 21 downstream records should be remapped to reference the live stale-ID cases (once those cases' employer_group_id references are repaired via B4B-04).
- Evidence required: Confirmation that cd9a = cd77's employer-case, cd9b = cd78's, cd9c = cd79's, cd9d = cd7a's
- Risk: Incorrect merge of case histories if they are actually distinct

**Option C — QUARANTINE:** Neither restoration nor remapping can be confirmed. Quarantine all 21 downstream records.
- Effect: All 21 records preserved but invisible to operational users until released via approved quarantine flow
- Risk: Potential loss of active operational data (active QuoteScenarios, EnrollmentWindows, Proposals)

---

### BA-17 — Downstream Missing-BenefitCase Restore/Remap/Quarantine Execution

| Field | Value |
|---|---|
| Approval item ID | BA-17 |
| Blocker ID | B4B-05 |
| Severity | **P0** |
| Entity type | Multiple: QuoteScenario, CensusVersion, CaseTask, ExceptionItem, ActivityLog, EnrollmentWindow, RenewalCycle, Proposal |
| Affected records | 21 downstream orphaned records |
| Proposed action | Execute the outcome of BA-16: restore, remap, or quarantine per approved option |
| Prerequisite | BA-16 decision completed |
| Approving owner required | **Migration Owner** |
| **Approval status** | **PENDING** — blocked on BA-16 |
| Downstream records affected | All 21 records directly |
| Blocks remediation execution | **YES** |
| Blocks second dry-run | **YES** |
| Blocks Phase 4B | **YES** |
| Rollback requirement | Per entity: revert case_id (if remapped), delete restored records (if restored), release quarantine (if quarantined) |
| Validation method | All 21 records have valid parent chain OR mga_migration_status = quarantined |

**Decision options:** Derived from BA-16. Once BA-16 is resolved, BA-17 selects the execution method and scope (per-record or per-case-group approval).

---

### BA-18 — Agency Classification: Northstar Benefits Group

| Field | Value |
|---|---|
| Approval item ID | BA-18 |
| Blocker ID | B4B-07 (P1) |
| Severity | **P1** |
| Entity type | Agency |
| Affected record | `69e169f498a89c653c72cd6b` — Northstar Benefits Group (NBG) |
| Proposed action | Classify NBG Agency as: (a) global platform catalog entry, or (b) MGA-scoped entity |
| Proposed MGA | MGA-CAND-01 if scoped |
| Source signal | Agency data; EmployerGroup references via agency_id |
| Confidence | **Medium** |
| Approving owner required | **Business Owner** |
| **Approval status** | **PENDING** |
| Downstream records affected | 2 EmployerGroups (cd90, cd91) reference this Agency |
| Blocks remediation execution | **NO** |
| Blocks second dry-run | **NO** |
| Blocks Phase 4B | **NO** (blocks Phase 5 routing) |
| Rollback requirement | Update Agency classification field; no structural rollback needed |
| Validation method | Agency record has confirmed classification; EmployerGroups aware of parent classification |

**Decision options:** GLOBAL CATALOG (no MGA scope) / MGA-SCOPED (link to NBG MGA) / DEFER

---

### BA-19 — Agency Classification: Summit Coverage Partners

| Field | Value |
|---|---|
| Approval item ID | BA-19 |
| Blocker ID | B4B-07 (P1) |
| Severity | **P1** |
| Entity type | Agency |
| Affected record | `69e169f498a89c653c72cd6c` — Summit Coverage Partners (SCP) |
| Proposed action | Classify SCP Agency as global catalog or MGA-scoped |
| Proposed MGA | MGA-CAND-02 if scoped |
| Source signal | Agency data; 2 EmployerGroups reference SCP agency_id |
| Confidence | **Medium** |
| Approving owner required | **Business Owner** |
| **Approval status** | **PENDING** |
| Downstream records affected | 2 EmployerGroups (cd92, cd93) |
| Blocks remediation execution | **NO** |
| Blocks second dry-run | **NO** |
| Blocks Phase 4B | **NO** (blocks Phase 5) |
| Rollback requirement | Same as BA-18 |
| Validation method | Same as BA-18 |

**Decision options:** GLOBAL CATALOG / MGA-SCOPED / DEFER

---

## Section 2 — Approval Summary and Execution Eligibility

| Metric | Value |
|---|---|
| Total approval items | **19** |
| Approved | **0** |
| Rejected | **0** |
| Deferred | **0** |
| Pending | **19** |
| P0-blocking approvals approved | **0** |
| P0-blocking approvals pending | **17** |
| P0-blocking approvals rejected | **0** |
| P1 approvals pending | **2** (BA-18, BA-19) |

### Execution eligibility

| Question | Answer |
|---|---|
| Can controlled remediation execution proceed (data mutations)? | **NO — 17 P0-blocking approvals pending** |
| Can second dry-run proceed? | **NO — remediation not yet executed** |
| Does Phase 4B remain blocked? | **YES — all 6 P0 blockers active** |

### Dependency tree for approval items

```
BA-01 (MGA NBG) ──────────────────────────────────────────────────────────┐
BA-02 (MGA SCP) ─────────────────────────────────────────────────────────┐│
                                                                          ││
  BA-03 (MG NBG) [requires BA-01] ───────────────────────────────────┐  ││
  BA-04 (MG SCP) [requires BA-02] ──────────────────────────────┐    │  ││
                                                                │    │  ││
    BA-05 EG cd90 [requires BA-03] ──────────────────────┐     │    │  ││
    BA-06 EG cd91 [requires BA-03] ─────────────────┐   │     │    │  ││
    BA-07 EG cd92 [requires BA-04] ──────────────┐  │   │     │    │  ││
    BA-08 EG cd93 [requires BA-04] ─────────┐    │  │   │     │    │  ││
                                            │    │  │   │     │    │  ││
      BA-09 BC cd9a [requires BA-05] ───────│────│──│───┘     │    │  ││
      BA-10 BC cd9b [requires BA-06] ───────│────│──┘         │    │  ││
      BA-11 BC cd9c [requires BA-07] ───────│────┘            │    │  ││
      BA-12 BC cd9d [requires BA-08] ───────┘                 │    │  ││
                                                              │    │  ││
      BA-13 BC empty [independent] (Phase 4B only)            │    │  ││
      BA-14 BC empty [independent] (Phase 4B only)            │    │  ││
      BA-15 BC empty [independent] (Phase 4B only)            │    │  ││
                                                              │    │  ││
      BA-16 cd77-cd7a [requires BA-09–BA-12 decided] ────────┘    │  ││
      BA-17 downstream exec [requires BA-16] ──────────────────────┘  ││
                                                                       ││
BA-18 Agency NBG [independent P1] ────────────────────────────────────│┘
BA-19 Agency SCP [independent P1] ─────────────────────────────────────┘
```

**Critical path for second dry-run:** BA-01 → BA-03 → BA-05/BA-06 → BA-09/BA-10 → BA-16 → BA-17 (and parallel BA-02 → BA-04 → BA-07/BA-08 → BA-11/BA-12)

---

## Section 3 — Index Execution Readiness Package

### Pre-confirmation checks

| Check | Result |
|---|---|
| 0 indexes strictly required before second dry-run at current scale | **CONFIRMED** — all indexed entities have ≤ 9 records; full-table scan risk is zero |
| All 30 indexes required before Phase 4B final backfill | **CONFIRMED** — non-negotiable per approved index plan |
| Index #27 (MasterGeneralAgentUser) remains non-duplicate | **CONFIRMED** — not defined in Phase 1 or mini-pass index sets; first identified in Phase 4A audit |
| Index #27 conditionally required after MasterGroup/MGA seed approval | **CONFIRMED** — create before RE-12 (second dry-run) if MasterGeneralAgentUser count > 0 after seeding |
| No indexes created in this step | **CONFIRMED** |

### Index Execution Package — All 30 Required Indexes

| # | Entity | Fields | Purpose | Priority | Required before 2nd dry-run | Required before Phase 4B | Perf impact if missing | Risk if missing | Creation method | Validation method | Rollback | Platform Admin owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | MasterGeneralAgent | (code, status) | Unique code enforcement; status filter for MGA lookup | HIGH | NO | YES | Full-table scan on code lookup | MGA code collisions undetected | DB index create via admin tooling | Query plan confirms index used for code+status filter | DROP INDEX; no data loss | Platform Admin | **Ready** |
| 2 | MasterGroup | (master_general_agent_id, status) | MGA-scoped MasterGroup listing | HIGH | NO | YES | Cross-MGA scan during backfill | Cross-tenant data bleed risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 3 | EmployerGroup | (master_general_agent_id, status) | MGA-scoped employer listing | HIGH | NO | YES | Cross-MGA scan | Cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 4 | BenefitCase | (master_general_agent_id, stage, status) | MGA-scoped case pipeline | HIGH | NO | YES | Performance degradation; cross-MGA scan | Cross-tenant risk + pipeline slowdown | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 5 | CensusVersion | (master_general_agent_id, case_id, status) | MGA-scoped census listing | HIGH | NO | YES | Scan risk | Data bleed | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 6 | CensusMember | (master_general_agent_id, case_id) | MGA-scoped PII member listing | HIGH | NO | YES | PII scan risk | PII cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 7 | QuoteScenario | (master_general_agent_id, case_id, status) | MGA-scoped quote listing | HIGH | NO | YES | Scan risk | Cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 8 | EnrollmentWindow | (master_general_agent_id, case_id, status) | MGA-scoped enrollment listing | HIGH | NO | YES | Scan risk | Cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 9 | EmployeeEnrollment | (master_general_agent_id, case_id, status) | MGA-scoped PII enrollment listing | HIGH | NO | YES | PII scan risk | PII cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 10 | Document | (master_general_agent_id, case_id) | MGA-scoped document listing | HIGH | NO | YES | File access scan risk | File access cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 11 | CaseTask | (master_general_agent_id, case_id, status) | MGA-scoped task listing | MEDIUM | NO | YES | Scan risk | Cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 12 | ExceptionItem | (master_general_agent_id, case_id, severity) | MGA-scoped exception triage | MEDIUM | NO | YES | Scan risk | Cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 13 | ActivityLog | (master_general_agent_id, case_id) | MGA-scoped audit trail | MEDIUM | NO | YES | Audit scan risk | Audit cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 14 | RenewalCycle | (master_general_agent_id, case_id) | MGA-scoped renewal listing | MEDIUM | NO | YES | Scan risk | Cross-tenant risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 15 | Proposal | (master_general_agent_id, case_id, status) | MGA-scoped proposal listing | HIGH | NO | YES | Artifact scan risk | Cross-tenant artifact risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 16 | MGAMigrationBatch | (master_general_agent_id, status) | Migration batch tracking | HIGH | NO | YES | Migration tracking failure | Migration integrity risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 17 | Tenant | (master_general_agent_id, master_group_id, status) | Tenant scoping via MasterGroup | LOW (0 records) | NO | YES | Negligible at 0 records | Tenant scan risk at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 18 | CensusImportJob | (master_general_agent_id, case_id, status) | Scoped job tracking | MEDIUM | NO | YES | Job scan risk | Cross-tenant job risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 19 | CensusImportAuditEvent | (master_general_agent_id, census_import_job_id) | Scoped audit event lookup | MEDIUM | NO | YES | Audit scan risk | Cross-tenant audit risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 20 | CensusValidationResult | (master_general_agent_id, census_import_id, status) | Scoped validation results | MEDIUM | NO | YES | Validation scan risk | Cross-tenant validation risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 21 | UserManual | (master_general_agent_id, scope_type) | Discriminated manual listing | LOW (0 records) | NO | YES | Negligible at 0 records | Scope bleed at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 22 | HelpSearchLog | (master_general_agent_id, user_email, created_date) | Scoped search activity | LOW (0 records) | NO | YES | Negligible | Activity scan risk at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 23 | HelpAIQuestionLog | (master_general_agent_id, user_email, created_date) | Scoped question activity | LOW (0 records) | NO | YES | Negligible | PII scan risk at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 24 | HelpCoverageSnapshot | (master_general_agent_id, scope_type, snapshot_date) | Discriminated snapshot listing | LOW (0 records) | NO | YES | Negligible | Scope bleed at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 25 | HelpAuditLog | (master_general_agent_id, event_type, created_date) | Scoped help audit | LOW (0 records) | NO | YES | Negligible | Audit scan risk at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 26 | HelpAITrainingQueue | (master_general_agent_id, scope_type, queue_status) | Discriminated queue processing | LOW (0 records) | NO | YES | Negligible | Queue contamination at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| **27** | **MasterGeneralAgentUser** | **(master_general_agent_id, user_email, status)** | **Membership lookup at every scopeGate call** | **CRITICAL** | **CONDITIONAL** — required before RE-12 (2nd dry-run) if MasterGeneralAgentUser count > 0 after seeding | **YES** | Every gate call becomes full-table scan at scale | Every protected API call degrades | DB index create | Query plan confirms; scopeResolver.js filter confirmed | DROP INDEX | Platform Admin | **Needs Review — conditional on post-seeding count** |
| 28 | MGAQuarantineRecord | (master_general_agent_id, entity_type, status) | Quarantine triage and release | HIGH | NO | YES | Quarantine management failure | Quarantine integrity risk | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 29 | TxQuoteCase | (master_general_agent_id, case_id) | TXQuote scoping | MEDIUM (0 records) | NO | YES | Negligible at 0 records | TXQuote scan risk at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |
| 30 | EnrollmentMember | (master_general_agent_id, enrollment_window_id) | Enrollment member scoping | MEDIUM (0 records) | NO | YES | Negligible at 0 records | Enrollment scan risk at scale | DB index create | Query plan confirms | DROP INDEX | Platform Admin | **Ready** |

### Index readiness summary

| Status | Count | Indexes |
|---|---|---|
| Ready (Platform Admin may create immediately if approved) | **29** | #1–26, #28–30 |
| Needs Review (conditional on post-seeding state) | **1** | #27 (MasterGeneralAgentUser) |
| Blocked | **0** | None |
| Created | **0** | None |

### Platform-admin index execution authorization

**Is platform-admin index execution approved in this step?**

**NO — Index creation has not been explicitly approved by Platform Admin in this step.** This package presents the index execution plan and readiness assessment only. Platform Admin must provide explicit approval before any index is created. Once Platform Admin approves, all 29 "Ready" indexes can be created immediately (independently of approval gate status for data actions). Index #27 should be created after RE-04 (MasterGroup seeding) if MasterGeneralAgentUser count > 0.

**Index creation is non-destructive:** Creating an index does not modify any entity record. Rollback = DROP INDEX. Index creation can therefore proceed in parallel with (or before) approval of data-affecting remediation steps.

---

## Section 4 — Updated Remediation Execution Eligibility

| Remediation action | Step | Classification | Reason |
|---|---|---|---|
| MGA seeding (B4B-01) | RE-02 | **Blocked pending approval** | BA-01, BA-02 PENDING |
| MasterGroup seeding (B4B-02) | RE-04 | **Blocked pending prerequisite + approval** | Requires RE-02 complete; BA-03, BA-04 PENDING |
| EmployerGroup linking (B4B-03) | RE-05 | **Blocked pending prerequisite + approval** | Requires RE-04 complete; BA-05–BA-08 PENDING |
| BenefitCase Group B repair (B4B-04) | RE-07 | **Blocked pending prerequisite + approval** | Requires RE-05 complete; BA-09–BA-12 PENDING |
| BenefitCase Group A resolution (B4B-04) | RE-08 | **Blocked pending approval** | BA-13–BA-15 PENDING (no prerequisite dependency for execution gate itself) |
| Downstream restore/remap/quarantine (B4B-05) | RE-10 | **Blocked pending prerequisite + approval** | BA-16 PENDING; requires RE-07/RE-08 complete |
| Index creation (B4B-06) | RE-11 | **Index-only execution eligible — awaiting Platform Admin approval** | No data prerequisite; non-destructive; 29 Ready; 1 conditional |
| Index #27 conditional (MDI-02) | RE-11a | **Conditional — blocked until post-seeding count confirmed** | Requires RE-04 complete |
| Second dry-run | RE-12 | **Blocked — remediation not yet executed** | Requires RE-01 through RE-11 complete |
| Phase 4B approval request | RE-14 | **NOT ALLOWED FROM THIS STEP** | Phase 4B remains blocked |

---

## Section 5 — Next-Step Decision

### Assessment

| Gate | Status |
|---|---|
| All P0-blocking approvals completed or records quarantined/blocked | **NOT MET — 17 P0-blocking approvals pending** |
| Root MGA and MasterGroup approvals completed | **NOT MET** |
| All EmployerGroup decisions resolved | **NOT MET** |
| All BenefitCase decisions resolved | **NOT MET** |
| All downstream missing-parent decisions resolved | **NOT MET** |
| All 30 indexes created or confirmed deferred | **NOT MET — awaiting Platform Admin approval** |
| No fake/default MGA values introduced | **MET** |
| Remediation execution rerun eligible | **NO** |
| Partial remediation execution eligible | **NO — no independent branch is fully approved** |
| Index-only execution eligible | **YES — if Platform Admin approves** |
| Second dry-run eligible | **NO** |
| Phase 4B approval allowed | **NO** |

### Next-step determination

**Chosen next step:**

> **Two concurrent next controlled steps are approved:**
>
> **Step A — Index-Only Execution (if Platform Admin approves):** Platform Admin may authorize creation of all 29 "Ready" indexes immediately. This is independent of all business approval gates, is non-destructive, and does not affect any entity data. Creation of index #27 should follow after RE-04 (MasterGroup seeding) if MasterGeneralAgentUser count > 0. This resolves B4B-06 in full.
>
> **Step B — Business Approval Collection:** The 19 approval items documented in this report must be sent to the appropriate approving owners (Executive / Platform Owner, Business Owner, Migration Owner) for decision. Once approvals, rejections, or deferrals are received, the remediation execution rerun can proceed for any approved branch.

**Step A and Step B are independent and may proceed concurrently.**

**Neither step runs the second dry-run. Neither step executes Phase 4B.**

---

## Non-Destructive Confirmation

| Rule | Status |
|---|---|
| Records seeded | **NO** |
| Records repaired | **NO** |
| Records quarantined | **NO** |
| Indexes created | **NO** |
| Migration/backfill run | **NO** |
| MGA ownership assigned | **NO** |
| Records moved or deleted | **NO** |
| UI/navigation changed | **NO** |
| Permissions changed | **NO** |
| TXQuote behavior changed | **NO** |
| Reporting behavior changed | **NO** |
| Document behavior changed | **NO** |
| Scoped services activated | **NO** |
| MGA UI exposed | **NO** |
| Frontend reads replaced | **NO** |
| End-user behavior changed | **NO** |

---

## Final Required Output

| Item | Value |
|---|---|
| **Confirmation this step was approval capture and index readiness only** | **CONFIRMED** |
| **Confirmation no unapproved remediation, seeding, repair, quarantine, migration/backfill, UI, navigation, permission, TXQuote, reporting, document, service activation, or end-user behavior changes were made** | **CONFIRMED** |
| Report path | `docs/MGA_PHASE_4A_BUSINESS_APPROVAL_AND_INDEX_READINESS_REPORT.md` |
| | |
| Approval items approved / rejected / deferred / pending | **0 / 0 / 0 / 19** |
| P0-blocking approvals approved / pending / rejected | **0 / 17 / 0** |
| | |
| B4B-01 execution eligibility | **BLOCKED — BA-01, BA-02 pending** |
| B4B-02 execution eligibility | **BLOCKED — BA-03, BA-04 pending + B4B-01 prerequisite** |
| B4B-03 execution eligibility | **BLOCKED — BA-05–BA-08 pending + B4B-02 prerequisite** |
| B4B-04 execution eligibility | **BLOCKED — BA-09–BA-15 pending + B4B-03 prerequisite (Group B)** |
| B4B-05 execution eligibility | **BLOCKED — BA-16, BA-17 pending + B4B-04 prerequisite** |
| B4B-06 execution eligibility | **INDEX-ONLY ELIGIBLE — 29 Ready; 1 conditional; awaiting Platform Admin approval** |
| | |
| Business approval blockers remaining | **17 P0-blocking items pending** |
| | |
| Indexes ready | **29** |
| Indexes needs review | **1** (Index #27 — conditional) |
| Indexes blocked | **0** |
| Indexes created | **0** |
| | |
| Platform-admin index execution approved | **NOT YET — awaiting explicit Platform Admin approval** |
| Remediation execution rerun approved | **NO** |
| Partial remediation execution approved | **NO** |
| Second dry-run approved | **NO** |
| **Phase 4B remains blocked** | **YES — confirmed** |
| | |
| **Recommended next controlled step** | **Two concurrent steps: (A) Index-Only Execution upon Platform Admin approval; (B) Business Approval Collection — send BA-01 through BA-19 to approving owners for decision. Once approvals received, proceed to remediation execution rerun under REMEDIATION-BATCH-4A-20260504.** |

*End of MGA Phase 4A Business Approval Capture and Index Execution Readiness Report.*
*Report path: `docs/MGA_PHASE_4A_BUSINESS_APPROVAL_AND_INDEX_READINESS_REPORT.md`*