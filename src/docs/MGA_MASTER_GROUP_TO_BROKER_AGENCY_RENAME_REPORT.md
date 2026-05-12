# MGA — Master Group → Broker / Agency Rename Report

**Document Type:** Terminology Refactor Completion Report  
**Classification:** Internal — Platform Engineering / Program Management  
**Date:** 2026-05-12  
**Version:** 1.0  
**Status:** COMPLETE — USER-FACING RENAME APPLIED — BACKEND COMPATIBILITY PRESERVED  
**Prepared By:** Platform Engineering — MGA Program Management  
**Inventory:** `docs/MGA_MASTER_GROUP_TO_BROKER_AGENCY_RENAME_INVENTORY.md`

---

## 1. Objective

Rename all user-facing references to "Master Group" / "Master Groups" to "Broker / Agency" / "Broker / Agencies" across the MGA / Quote Connect 360 application, while preserving all internal, schema, scope, and security naming for full backward compatibility.

This is a UI language / business terminology refactor only. It is not a database migration, schema rename, or API contract change.

---

## 2. Inventory Summary

Full inventory documented in `docs/MGA_MASTER_GROUP_TO_BROKER_AGENCY_RENAME_INVENTORY.md`.

| Category | Count | Action Taken |
|----------|-------|-------------|
| USER-FACING occurrences | 4 | **Renamed** |
| INTERNAL CODE occurrences | ~40+ | Preserved |
| DATABASE / SCHEMA occurrences | ~20+ | Preserved — no migration |
| SCOPE / SECURITY occurrences | ~15+ | Preserved — not touched |
| TEST LABEL occurrences | ~10+ | Preserved — schema-dependent |
| DOCUMENTATION occurrences | ~100+ | Preserved — historical records |

**Total user-facing changes: 4 strings across 2 files.**

---

## 3. Files Changed

| File | Change Type |
|------|-------------|
| `components/mga/MGAMasterGroupPanel` | 3 user-facing string updates |
| `pages/MasterGeneralAgentCommand` | 1 tab trigger label update + 1 internal comment update |

No other files were modified. No file was renamed. No import was changed. No entity was renamed.

---

## 4. User-Facing Labels Changed

| Location | Before | After |
|----------|--------|-------|
| `MGAMasterGroupPanel` — denied state message | `MasterGroup list unavailable for your scope.` | `Broker / Agency list unavailable for your scope.` |
| `MGAMasterGroupPanel` — panel heading | `Master Groups` | `Broker / Agencies` |
| `MGAMasterGroupPanel` — empty state | `No master groups in scope.` | `No Broker / Agencies in scope.` |
| `MasterGeneralAgentCommand` — tab trigger | `Master Groups` | `Broker / Agencies` |

---

## 5. Internal Names Intentionally Preserved

The following internal names were reviewed and deliberately left unchanged to maintain backward compatibility:

| Name | Location | Reason Preserved |
|------|----------|-----------------|
| `MasterGroup` | Entity name | Database schema — migration required to rename |
| `master_group_id` | All child entities, scope objects | Database field — breaking rename without migration |
| `masterGroupService` | `lib/mga/services/masterGroupService.js` | Service contract name — breaking rename |
| `listMasterGroups` | Service export | API contract — breaking rename |
| `MGAMasterGroupPanel` | Component file name and import | Internal reference — no user visibility |
| `mastergroups` | Tab `value` / `defaultValue` keys | Internal React state — not user-visible |
| `allowed_master_group_ids` | scopeResolver decision object | Security scope field — must not be renamed |
| `mastergroup` | permissionResolver domain key | RBAC matrix key — must not be renamed |
| `master_general_agent_id` | All scoped entities | Core scope FK — must not be renamed |

---

## 6. Protected Backend / Schema Names

The following are explicitly protected from this refactor and may only be renamed under a separate approved migration plan:

- `MasterGroup` entity (database collection)
- `master_group_id` field on all child entities
- `master_general_agent_id` field on all scoped entities
- `masterGroupService.js` and all its exports
- `MGAMasterGroupPanel` component file name
- `scopeResolver.js` decision fields (`allowed_master_group_ids`, `target_mga_id`, etc.)
- `scopeGate.js` payload fields
- `permissionResolver.js` domain key `mastergroup`
- All existing gate IDs in the registry (`GATE-6A`, `GATE-6B`, `GATE-6C-COMPLETE`, `GATE-6D`)
- All audit event payload field names
- All test fixture schema references
- All historical documentation records

---

## 7. Validation Results

| Validation Item | Result |
|----------------|--------|
| MasterGeneralAgentCommand page loads | ✅ No structural changes — loads normally |
| Broker / Agency tab displays correctly | ✅ Tab label updated; `MGAMasterGroupPanel` renders as before |
| No user-facing "Master Group" text remains in updated components | ✅ Confirmed — 4 strings updated |
| Internal MasterGroup services still referenced correctly | ✅ All imports and service calls unchanged |
| scopeGate enforcement unchanged | ✅ No scope files modified |
| Cross-MGA access still blocked | ✅ scopeGate / scopeResolver untouched |
| Cross-tenant access still blocked | ✅ scopeGate / scopeResolver untouched |
| Build impact | ✅ String-only changes; no import/export modifications |
| Lint / static scan impact | ✅ No new lint issues introduced |
| navigationConfig | ✅ Already uses "Broker / Agency" — no change needed |

---

## 8. Gates Affected / Not Affected

| Gate | Status | Impact |
|------|--------|--------|
| Gate 6A — Invite User | **UNAFFECTED** | No files in Gate 6A scope were modified |
| Gate 6B — TXQuote Transmit | **UNAFFECTED** | No files in Gate 6B scope were modified |
| Gate 6C — Report Exports | **UNAFFECTED** | `MGA_REPORT_EXPORTS_ENABLED` remains `false`; no Gate 6C files modified |
| Gate 6D — Export History | **UNAFFECTED** | `MGA_EXPORT_HISTORY_ENABLED` remains `false`; no Gate 6D files modified |

---

## 9. Remaining Future Migration Options

The following work is deferred and requires a separate approved migration plan before execution:

| Future Work | Complexity | Risk | Notes |
|------------|-----------|------|-------|
| Rename `MasterGroup` entity to `BrokerAgency` | High | Breaking — requires data migration, all FK updates, service rewrites | Requires approved migration plan |
| Rename `master_group_id` field across all entities | High | Breaking — all scope logic depends on this field | Must coordinate with scopeGate / scopeResolver rename |
| Rename `masterGroupService.js` and exports | Medium | Breaking — all consumers must be updated atomically | Can be done with a safe alias layer first |
| Rename `MGAMasterGroupPanel` component file | Low | Low — internal only | Safe to do in a future UI cleanup pass |
| Rename `mastergroup` domain key in permissionResolver | High | Breaking — RBAC matrix entries depend on this key | Requires permissionResolver migration + test coverage |
| Rename `mastergroups` tab value keys | Low | Low — internal React state | Safe to do in a future UI cleanup pass |
| Update documentation historical records | Low | None — documentation only | Can be done gradually; mark with "formerly Master Group" notation |
| Update test fixtures | Medium | Medium — must validate against actual schema | Coordinate with schema rename |

**Recommended sequence (future):**
1. Create alias layer (`BrokerAgency` as UI alias for `MasterGroup`)
2. Migrate `masterGroupService` to support aliased name
3. Migrate `MGAMasterGroupPanel` import references
4. Migrate database field `master_group_id` with backward-compatible migration
5. Update permissionResolver domain key
6. Update scopeGate / scopeResolver
7. Update tests
8. Update all historical docs

---

## 10. Final Status

> **User-facing terminology changed from Master Group(s) to Broker / Agency.**  
> **Internal `MasterGroup` / `master_group_id` naming preserved for backward compatibility.**  
> **No gate activation performed.**  
> **No runtime scope model changed.**  
> `MGA_REPORT_EXPORTS_ENABLED` remains `false`.  
> `MGA_EXPORT_HISTORY_ENABLED` remains `false`.  
> Gate 6A active and unaffected.  
> Gate 6B active and unaffected.  
> Gate 6C inactive and unaffected.  
> Gate 6D inactive and unaffected.

---

## Document Control

| Field | Value |
|-------|-------|
| Document ID | MGA_MASTER_GROUP_TO_BROKER_AGENCY_RENAME_REPORT |
| Version | 1.0 |
| Created | 2026-05-12 |
| Author | Platform Engineering — MGA Program Management |
| Inventory | `docs/MGA_MASTER_GROUP_TO_BROKER_AGENCY_RENAME_INVENTORY.md` |
| Registry | `docs/QUOTE_CONNECT_360_GATE_REGISTRY.json` |