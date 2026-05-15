# MGA — Master Group → Broker / Agency Rename Inventory

**Document Type:** Terminology Refactor Inventory  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** INVENTORY COMPLETE — USER-FACING CHANGES APPLIED  
**Prepared By:** Platform Engineering — MGA Program Management

---

## Purpose

This document inventories every occurrence of `Master Group`, `Master Groups`, `MasterGroup`, `masterGroup`, `master_group`, `master_group_id`, `MGAMasterGroupPanel`, and `masterGroupService` across the application, classifies each occurrence, and records which were changed vs. intentionally preserved.

---

## Classification Key

| Class | Meaning | Action |
|-------|---------|--------|
| **USER-FACING** | Visible to end users in UI labels, headings, empty states, errors | **RENAME NOW** |
| **INTERNAL CODE** | Component names, function names, variable names, imports | **LEAVE — backward compatibility** |
| **DATABASE / SCHEMA** | Entity names, field names, collection keys | **LEAVE — no migration yet** |
| **SCOPE / SECURITY** | scopeGate, scopeResolver, permissionResolver, security payloads | **LEAVE — do not touch** |
| **TEST LABEL** | Test fixtures and assertions referencing schema names | **LEAVE — schema-dependent** |
| **DOCUMENTATION** | Docs, reports, runbooks | **UPDATE with compatibility note** |

---

## Section 1 — `components/mga/MGAMasterGroupPanel`

| Line | Occurrence | Class | Action | Result |
|------|-----------|-------|--------|--------|
| 1 | `// MGA Phase 5 — Section 3: Master Group Management Panel` | INTERNAL CODE | Leave | Preserved |
| 2 | `// All data via Phase 3 masterGroupService.` | INTERNAL CODE | Leave | Preserved |
| 3 | `// Create MasterGroup action: INACTIVE…` | INTERNAL CODE | Leave | Preserved |
| 7 | `import { listMasterGroups } from '@/lib/mga/services/masterGroupService'` | INTERNAL CODE | Leave | Preserved |
| 48 | `"Access restricted — MasterGroup list unavailable for your scope."` | USER-FACING | **Rename** | → `"Broker / Agency list unavailable for your scope."` |
| 56 | `<h2>Master Groups</h2>` | USER-FACING | **Rename** | → `Broker / Agencies` |
| 59 | `{/* Create MasterGroup: INACTIVE… */}` | INTERNAL CODE | Leave | Preserved |
| 67 | `"No master groups in scope."` | USER-FACING | **Rename** | → `"No Broker / Agencies in scope."` |

---

## Section 2 — `pages/MasterGeneralAgentCommand`

| Line | Occurrence | Class | Action | Result |
|------|-----------|-------|--------|--------|
| 1–13 | File-level comment block referencing MGA/MasterGroup | INTERNAL CODE | Leave | Preserved |
| 19 | `import MGAMasterGroupPanel from '@/components/mga/MGAMasterGroupPanel'` | INTERNAL CODE | Leave | Preserved |
| 160 | `<Tabs defaultValue="mastergroups">` | INTERNAL CODE (value key) | Leave | Preserved |
| 162 | `<TabsTrigger value="mastergroups">Master Groups</TabsTrigger>` | USER-FACING | **Rename** | → `Broker / Agencies` |
| 169 | `{/* Section 3 — MasterGroup Management */}` | INTERNAL CODE | Updated comment | → `Broker / Agency Management (internal entity: MasterGroup)` |
| 170 | `<TabsContent value="mastergroups">` | INTERNAL CODE (value key) | Leave | Preserved |
| 172 | `<MGAMasterGroupPanel … />` | INTERNAL CODE | Leave | Preserved |

---

## Section 3 — `components/layout/navigationConfig`

| Line | Occurrence | Class | Action | Result |
|------|-----------|-------|--------|--------|
| 29 | `{ path: "/employers", label: "Broker / Agency", … }` | USER-FACING | Already correct | No change needed |

*Navigation already uses "Broker / Agency" — no change required.*

---

## Section 4 — `lib/mga/services/masterGroupService.js`

| Occurrence | Class | Action |
|-----------|-------|--------|
| File name: `masterGroupService.js` | INTERNAL CODE | Leave |
| All exported function names (`listMasterGroups`, `getMasterGroup`, etc.) | INTERNAL CODE | Leave |
| All internal variable names (`masterGroup`, `masterGroupId`) | INTERNAL CODE | Leave |
| JSDoc comments referencing MasterGroup | INTERNAL CODE | Leave |

---

## Section 5 — `lib/mga/scopeResolver.js`

| Occurrence | Class | Action |
|-----------|-------|--------|
| `allowed_master_group_ids` in scope decision object | SCOPE / SECURITY | **DO NOT TOUCH** |
| `MasterGeneralAgentUser` filter using `master_general_agent_id` | SCOPE / SECURITY | **DO NOT TOUCH** |
| All scope decision return fields | SCOPE / SECURITY | **DO NOT TOUCH** |

---

## Section 6 — `lib/mga/scopeGate.js`

| Occurrence | Class | Action |
|-----------|-------|--------|
| All `master_group_id` references in gate decisions | SCOPE / SECURITY | **DO NOT TOUCH** |
| All `allowed_master_group_ids` references | SCOPE / SECURITY | **DO NOT TOUCH** |

---

## Section 7 — `lib/mga/permissionResolver.js`

| Occurrence | Class | Action |
|-----------|-------|--------|
| All domain/action matrix entries | SCOPE / SECURITY | **DO NOT TOUCH** |
| `mastergroup` domain key | SCOPE / SECURITY | **DO NOT TOUCH** |

---

## Section 8 — `lib/mga/services/serviceContract.js`

| Occurrence | Class | Action |
|-----------|-------|--------|
| Service registry entries referencing MasterGroup | INTERNAL CODE | Leave |
| All contract field names | INTERNAL CODE | Leave |

---

## Section 9 — Entity Schema (`entities/MasterGroup.json`)

| Occurrence | Class | Action |
|-----------|-------|--------|
| Entity name: `MasterGroup` | DATABASE / SCHEMA | **DO NOT RENAME** |
| Field: `master_general_agent_id` | DATABASE / SCHEMA | **DO NOT RENAME** |
| Field: `master_group_id` (on child entities) | DATABASE / SCHEMA | **DO NOT RENAME** |
| Field: `ownership_status` | DATABASE / SCHEMA | Leave |
| All other MasterGroup schema fields | DATABASE / SCHEMA | **DO NOT RENAME** |

---

## Section 10 — `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json`

| Occurrence | Class | Action |
|-----------|-------|--------|
| All gate IDs | DOCUMENTATION | Leave — historical record |
| All `fileReferences` keys | DOCUMENTATION | Leave — internal keys |
| All status strings | DOCUMENTATION | Leave |

---

## Section 11 — Documentation Files (`docs/*.md`)

| File | Occurrences | Class | Action |
|------|-------------|-------|--------|
| All gate closeout reports | MasterGroup as technical term | DOCUMENTATION | Leave — historical record; compatibility note added to this inventory |
| All runbooks and activation packets | MasterGroup as technical term | DOCUMENTATION | Leave — operational documents reference internal naming |
| `MGA_GATE_STATUS_LEDGER.md` | MasterGroup references | DOCUMENTATION | Leave — ledger is historical |
| All migration reports | master_group_id, MasterGroup | DOCUMENTATION | Leave — migration history records |

*Rationale: Documentation files are historical records. Retroactively renaming them would invalidate audit trails and break cross-references. New documentation going forward should use "Broker / Agency" for user-facing terminology with internal names noted in parentheses.*

---

## Section 12 — `tests/mga/`

| Occurrence | Class | Action |
|-----------|-------|--------|
| `gate6c-report-export.test.js` — all fixture references | TEST LABEL | Leave — schema-dependent |
| `gate6d-export-history.test.js` — all fixture references | TEST LABEL | Leave — schema-dependent |
| Any assertions using `master_group_id` | TEST LABEL | Leave — validates actual schema |

---

## Section 13 — `functions/`

| File | Occurrence | Class | Action |
|------|-----------|-------|--------|
| `mgaReportExport.js` | Internal MasterGroup references | INTERNAL CODE | Leave |
| `mgaExportHistoryContract.js` | Internal MasterGroup references | INTERNAL CODE | Leave |

---

## Summary

### USER-FACING Changes Applied

| Location | Before | After |
|----------|--------|-------|
| `components/mga/MGAMasterGroupPanel` line 48 | `MasterGroup list unavailable for your scope` | `Broker / Agency list unavailable for your scope` |
| `components/mga/MGAMasterGroupPanel` line 56 | `Master Groups` (heading) | `Broker / Agencies` |
| `components/mga/MGAMasterGroupPanel` line 67 | `No master groups in scope.` | `No Broker / Agencies in scope.` |
| `pages/MasterGeneralAgentCommand` line 162 | `Master Groups` (tab trigger label) | `Broker / Agencies` |

### Items Intentionally Preserved

| Category | Items Preserved |
|----------|----------------|
| Entity / Schema | `MasterGroup` entity, `master_group_id`, all MasterGroup schema fields |
| Service Layer | `masterGroupService`, `listMasterGroups`, all service function names |
| Component File Name | `MGAMasterGroupPanel` (file name and import name) |
| Scope / Security | `allowed_master_group_ids`, `scopeGate` payloads, `scopeResolver` fields, `permissionResolver` domain `mastergroup` |
| Internal tab value keys | `defaultValue="mastergroups"`, `TabsContent value="mastergroups"` |
| Documentation / Historical records | All existing docs, gate reports, runbooks — historical naming preserved |
| Tests | All test fixtures referencing schema names |
| Navigation | Already uses "Broker / Agency" — no change needed |

---

## Protected — No Migration Authorized

The following may NOT be renamed without a separate approved migration plan:

- `MasterGroup` entity
- `master_group_id` field on all child entities
- `masterGroupService.js` file and exports
- `MGAMasterGroupPanel` component file name
- `scopeResolver.js` decision object fields
- `scopeGate.js` payload fields
- `permissionResolver.js` domain keys
- Existing gate IDs and registry keys
- Existing test fixtures
- Existing audit event payload fields
- Database collections / entity storage

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_MASTER_GROUP_TO_BROKER_AGENCY_RENAME_INVENTORY |
| Version | 1.0 |
| Created | 2026-05-12 |
| Author | Platform Engineering — MGA Program Management |
| Related Report | `docs/MGA_MASTER_GROUP_TO_BROKER_AGENCY_RENAME_REPORT.md` |