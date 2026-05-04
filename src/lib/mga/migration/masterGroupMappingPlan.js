/**
 * MGA Phase 4A — MasterGroup-to-MGA Mapping Plan
 * lib/mga/migration/masterGroupMappingPlan.js
 *
 * Defines the authoritative mapping logic for assigning existing MasterGroups to MGAs.
 * NO actual mapping is committed here. This is planning/dry-run logic only.
 *
 * PHASE 4A CONSTRAINT: No MasterGroup.master_general_agent_id is written.
 *
 * @see docs/MGA_PHASE_4A_MIGRATION_READINESS_AND_DRY_RUN_REPORT.md Section 3
 */

import { base44 } from '@/api/base44Client';

// ─── Mapping method constants ─────────────────────────────────────────────────

export const MAPPING_METHODS = {
  AUTOMATIC: 'automatic',       // MasterGroup.master_general_agent_id already set; verified non-null
  INFERRED: 'inferred',         // Single indirect signal; migration owner review required
  MANUAL: 'manual',             // No signals or conflicting signals; business owner approval required
  EXCLUDED: 'excluded',         // Platform/test/seed record; platform admin approval required
  QUARANTINED: 'quarantined',   // No safe mapping exists after all methods exhausted
};

// ─── Mapping record builder ───────────────────────────────────────────────────

/**
 * buildMappingRecord — Create a dry-run MasterGroup mapping record.
 * NOT written to MasterGroup entity. Written to dry-run batch output only.
 *
 * @param {Object} options
 * @returns {Object} mappingRecord
 */
export function buildMappingRecord({
  masterGroupId,
  masterGroupName,
  proposedMgaId,
  mappingMethod,
  signalSources,
  confidenceLevel,
  isDeterministic,
  conflictDetected,
  conflictDescription,
  approvalStatus,
  approvalOwner,
  downstreamBlockedCount,
  quarantineReason,
  dryRunBatchId,
}) {
  // Safety guard: proposed MGA must not be a placeholder
  const safeMgaId = (typeof proposedMgaId === 'string' && proposedMgaId.length > 0)
    ? proposedMgaId
    : null;

  return {
    master_group_id: masterGroupId,
    master_group_name: masterGroupName || null,
    proposed_mga_id: safeMgaId,
    mapping_method: mappingMethod,
    signal_sources: signalSources || [],
    confidence_level: confidenceLevel || 'low',
    is_deterministic: isDeterministic === true,
    conflict_detected: conflictDetected === true,
    conflict_description: conflictDescription || null,
    approval_status: approvalStatus || 'pending',  // pending | approved | rejected
    approval_owner: approvalOwner || null,
    approval_date: null,  // set when approved
    rollback_marker: null,  // set before Phase 4B write
    quarantine_reason: quarantineReason || null,
    downstream_blocked_count: downstreamBlockedCount || 0,
    dry_run_batch_id: dryRunBatchId,
    created_at: new Date().toISOString(),
    _dry_run_only: true,
    _must_not_write_to_mastergroup: true,
  };
}

/**
 * computeMasterGroupMapping — Compute proposed MGA assignment for a single MasterGroup.
 * DOES NOT write to any record.
 *
 * Signal priority:
 *   1. MasterGroup.master_general_agent_id (already stamped) → AUTOMATIC
 *   2. MasterGeneralAgentUser.allowed_master_group_ids pattern → INFERRED
 *   3. BenefitCase → EmployerGroup → MasterGroup pattern (indirect) → INFERRED
 *   4. No signal → MANUAL (human review required)
 *   5. Multiple conflicting signals → MANUAL with conflict flag
 *
 * @param {Object} masterGroup
 * @param {string} dryRunBatchId
 * @returns {Promise<Object>} mappingRecord
 */
export async function computeMasterGroupMapping(masterGroup, dryRunBatchId) {
  const signals = [];
  let proposedMgaId = null;
  let mappingMethod = MAPPING_METHODS.MANUAL;
  let confidenceLevel = 'low';
  let isDeterministic = false;
  let conflictDetected = false;
  let conflictDescription = null;
  const mgaIdCandidates = new Set();

  // Signal 1: Already stamped
  if (masterGroup.master_general_agent_id) {
    mgaIdCandidates.add(masterGroup.master_general_agent_id);
    signals.push({ source: 'mastergroup.master_general_agent_id', mga_id: masterGroup.master_general_agent_id });
    mappingMethod = MAPPING_METHODS.AUTOMATIC;
    confidenceLevel = 'high';
    isDeterministic = true;
  }

  // Signal 2: MasterGeneralAgentUser.allowed_master_group_ids membership
  try {
    const memberships = await base44.entities.MasterGeneralAgentUser.filter({ status: 'active' });
    for (const m of (memberships || [])) {
      if ((m.allowed_master_group_ids || []).includes(masterGroup.id)) {
        mgaIdCandidates.add(m.master_general_agent_id);
        signals.push({ source: 'MasterGeneralAgentUser.allowed_master_group_ids', mga_id: m.master_general_agent_id, user_email: m.user_email });
      }
    }
  } catch {
    signals.push({ source: 'MasterGeneralAgentUser:lookup_failed', mga_id: null });
  }

  // Resolve from candidates
  if (mgaIdCandidates.size === 1) {
    proposedMgaId = [...mgaIdCandidates][0];
    if (mappingMethod !== MAPPING_METHODS.AUTOMATIC) {
      mappingMethod = MAPPING_METHODS.INFERRED;
      confidenceLevel = 'medium';
      isDeterministic = false; // inferred still requires review
    }
  } else if (mgaIdCandidates.size > 1) {
    conflictDetected = true;
    conflictDescription = `Multiple MGA candidates found: ${[...mgaIdCandidates].join(', ')}`;
    proposedMgaId = null;
    mappingMethod = MAPPING_METHODS.MANUAL;
    confidenceLevel = 'low';
    isDeterministic = false;
  }

  return buildMappingRecord({
    masterGroupId: masterGroup.id,
    masterGroupName: masterGroup.name,
    proposedMgaId,
    mappingMethod,
    signalSources: signals,
    confidenceLevel,
    isDeterministic,
    conflictDetected,
    conflictDescription,
    approvalStatus: mappingMethod === MAPPING_METHODS.AUTOMATIC ? 'approved' : 'pending',
    approvalOwner: mappingMethod === MAPPING_METHODS.AUTOMATIC ? 'system' : (mappingMethod === MAPPING_METHODS.INFERRED ? 'migration_owner' : 'business_owner'),
    quarantineReason: conflictDetected ? conflictDescription : null,
    dryRunBatchId,
  });
}

export default {
  MAPPING_METHODS,
  buildMappingRecord,
  computeMasterGroupMapping,
};