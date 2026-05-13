/**
 * Broker Duplicate Detection Contract — Phase 7A-1.3
 * 
 * Detects potential duplicate brokers based on matching signals.
 * Advisory/review-based (no auto-merge, no auto-reject).
 * Feature-flag gated (BROKER_DUPLICATE_DETECTION_ENABLED must be true to execute).
 * Applicant-facing responses are generic (non-leaking).
 * Platform reviewers see duplicate candidate details (permission-gated).
 * Tenant-scoped, cross-tenant isolation enforced.
 * 
 * Matching signals:
 * - NPN (exact match, high weight)
 * - legal_name (normalized fuzzy match)
 * - dba_name (normalized fuzzy match)
 * - primary_contact_email (exact match)
 * - email domain (from email, informational)
 * - phone (exact match after normalization)
 * - business_address (normalized fuzzy match)
 * - mailing_address (normalized fuzzy match)
 * - EIN token reference (exact match if available, high weight)
 * 
 * Risk classifications:
 * - NO_MATCH (confidence < 40%)
 * - POSSIBLE_DUPLICATE (confidence 40-59%)
 * - PROBABLE_DUPLICATE (confidence 60-79%)
 * - CONFIRMED_DUPLICATE_CANDIDATE (confidence >= 80%)
 * - NEEDS_PLATFORM_REVIEW (awaiting operator decision)
 * 
 * @module brokerDuplicateDetectionContract
 */

import crypto from 'crypto';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const FEATURE_FLAGS = {
  BROKER_DUPLICATE_DETECTION_ENABLED: false,
};

const CONFIDENCE_THRESHOLDS = {
  NO_MATCH: 40,
  POSSIBLE_DUPLICATE: 60,
  PROBABLE_DUPLICATE: 80,
  CONFIRMED_DUPLICATE_CANDIDATE: 100, // >= 80 actual confidence
};

const MATCHING_WEIGHTS = {
  NPN_EXACT: 35,
  LEGAL_NAME_FUZZY: 15,
  DBA_NAME_FUZZY: 10,
  EMAIL_EXACT: 20,
  EMAIL_DOMAIN_ONLY: 5,
  PHONE_EXACT: 10,
  BUSINESS_ADDRESS_FUZZY: 10,
  MAILING_ADDRESS_FUZZY: 5,
  EIN_TOKEN_EXACT: 35,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize string for comparison: lowercase, trim, remove punctuation/extra spaces.
 * @param {string} value - Input string
 * @returns {string} Normalized string
 */
function normalizeString(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * Normalize phone number: remove non-digits.
 * @param {string} phone - Phone number
 * @returns {string} Digits only
 */
function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Simple Levenshtein distance for fuzzy matching.
 * @param {string} a - String 1
 * @param {string} b - String 2
 * @returns {number} Distance (lower = more similar)
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Calculate fuzzy match confidence (0-100).
 * Based on Levenshtein distance ratio.
 * @param {string} a - String 1
 * @param {string} b - String 2
 * @returns {number} Confidence 0-100
 */
function fuzzyMatchConfidence(a, b) {
  if (!a || !b) return 0;
  const normalized_a = normalizeString(a);
  const normalized_b = normalizeString(b);
  if (normalized_a === normalized_b) return 100;
  const distance = levenshteinDistance(normalized_a, normalized_b);
  const maxLength = Math.max(normalized_a.length, normalized_b.length);
  if (maxLength === 0) return 100;
  const similarity = 1 - distance / maxLength;
  return Math.max(0, Math.min(100, similarity * 100));
}

/**
 * Extract email domain from email address.
 * @param {string} email - Email address
 * @returns {string} Domain part
 */
function extractEmailDomain(email) {
  if (!email) return '';
  const parts = email.split('@');
  return parts.length > 1 ? parts[1].toLowerCase() : '';
}

/**
 * Assert scope access (cross-tenant isolation).
 * @param {object} context - Authenticated context
 * @param {string} tenant_id - Resource tenant ID
 * @throws {Error} 404 masked if cross-tenant
 */
function assertScopeAccess(context, tenant_id) {
  if (context.tenant_id !== tenant_id) {
    throw {
      status: 404,
      code: 'NOT_FOUND',
      message: 'Resource not visible in your scope',
    };
  }
}

/**
 * Assert permission (fail-closed).
 * @param {object} context - Authenticated context
 * @param {string} permission - Permission key
 * @throws {Error} 403 if denied
 */
function assertPermission(context, permission) {
  // All permissions default false during Gate 7A-1
  const hasPermission = false;
  if (!hasPermission) {
    throw {
      status: 403,
      code: 'PERMISSION_DENIED',
      message: `Permission denied: ${permission}`,
    };
  }
}

/**
 * Create audit event (append-only).
 * @param {object} base44 - SDK client
 * @param {object} event - Audit event data
 */
async function createAuditEvent(base44, event) {
  const auditEventData = {
    tenant_id: event.tenant_id,
    actor_user_id: event.actor_user_id || 'system',
    actor_role: event.actor_role || 'system',
    action: event.action,
    detail: event.detail || '',
    entity_type: event.entity_type || 'BrokerAgencyProfile',
    entity_id: event.entity_id || '',
    outcome: event.outcome || 'success',
    audit_trace_id: event.audit_trace_id || crypto.randomUUID(),
  };

  await base44.asServiceRole.entities.AuditEvent.create(auditEventData);
}

// ============================================================================
// MATCHING ALGORITHM
// ============================================================================

/**
 * Calculate match score between two broker profiles.
 * Returns total confidence and detailed match breakdown.
 * @param {object} applicant - New applicant profile
 * @param {object} existing - Existing broker profile
 * @returns {object} { total_score, matches: [...], confidence_level }
 */
function calculateMatchScore(applicant, existing) {
  let totalScore = 0;
  const matches = [];

  // 1. NPN exact match (high weight: 35)
  if (applicant.npn && existing.npn && applicant.npn === existing.npn) {
    const score = MATCHING_WEIGHTS.NPN_EXACT;
    totalScore += score;
    matches.push({ signal: 'NPN_EXACT', score, confidence: 100 });
  }

  // 2. Legal name fuzzy match (weight: 15)
  if (applicant.legal_name && existing.legal_name) {
    const confidence = fuzzyMatchConfidence(applicant.legal_name, existing.legal_name);
    if (confidence >= 75) {
      const score = MATCHING_WEIGHTS.LEGAL_NAME_FUZZY * (confidence / 100);
      totalScore += score;
      matches.push({ signal: 'LEGAL_NAME_FUZZY', score, confidence });
    }
  }

  // 3. DBA name fuzzy match (weight: 10)
  if (applicant.dba_name && existing.dba_name) {
    const confidence = fuzzyMatchConfidence(applicant.dba_name, existing.dba_name);
    if (confidence >= 75) {
      const score = MATCHING_WEIGHTS.DBA_NAME_FUZZY * (confidence / 100);
      totalScore += score;
      matches.push({ signal: 'DBA_NAME_FUZZY', score, confidence });
    }
  }

  // 4. Primary contact email exact match (weight: 20)
  if (applicant.primary_contact_email && existing.primary_contact_email) {
    if (applicant.primary_contact_email.toLowerCase() === existing.primary_contact_email.toLowerCase()) {
      const score = MATCHING_WEIGHTS.EMAIL_EXACT;
      totalScore += score;
      matches.push({ signal: 'EMAIL_EXACT', score, confidence: 100 });
    }
  }

  // 5. Email domain match (weight: 5 - informational only)
  const applicantDomain = extractEmailDomain(applicant.primary_contact_email);
  const existingDomain = extractEmailDomain(existing.primary_contact_email);
  if (applicantDomain && existingDomain && applicantDomain === existingDomain && !applicant.primary_contact_email?.toLowerCase() === existing.primary_contact_email?.toLowerCase()) {
    const score = MATCHING_WEIGHTS.EMAIL_DOMAIN_ONLY;
    totalScore += score;
    matches.push({ signal: 'EMAIL_DOMAIN_ONLY', score, confidence: 50 });
  }

  // 6. Phone exact match (weight: 10)
  if (applicant.phone && existing.phone) {
    const normApplicant = normalizePhone(applicant.phone);
    const normExisting = normalizePhone(existing.phone);
    if (normApplicant && normExisting && normApplicant === normExisting) {
      const score = MATCHING_WEIGHTS.PHONE_EXACT;
      totalScore += score;
      matches.push({ signal: 'PHONE_EXACT', score, confidence: 100 });
    }
  }

  // 7. Business address fuzzy match (weight: 10)
  if (applicant.business_address && existing.business_address) {
    const confidence = fuzzyMatchConfidence(applicant.business_address, existing.business_address);
    if (confidence >= 75) {
      const score = MATCHING_WEIGHTS.BUSINESS_ADDRESS_FUZZY * (confidence / 100);
      totalScore += score;
      matches.push({ signal: 'BUSINESS_ADDRESS_FUZZY', score, confidence });
    }
  }

  // 8. Mailing address fuzzy match (weight: 5)
  if (applicant.mailing_address && existing.mailing_address) {
    const confidence = fuzzyMatchConfidence(applicant.mailing_address, existing.mailing_address);
    if (confidence >= 75) {
      const score = MATCHING_WEIGHTS.MAILING_ADDRESS_FUZZY * (confidence / 100);
      totalScore += score;
      matches.push({ signal: 'MAILING_ADDRESS_FUZZY', score, confidence });
    }
  }

  // 9. EIN token reference exact match (high weight: 35)
  if (applicant.ein_token_reference && existing.ein_token_reference && applicant.ein_token_reference === existing.ein_token_reference) {
    const score = MATCHING_WEIGHTS.EIN_TOKEN_EXACT;
    totalScore += score;
    matches.push({ signal: 'EIN_TOKEN_EXACT', score, confidence: 100 });
  }

  // Determine confidence level based on total score
  let confidenceLevel = 'NO_MATCH';
  if (totalScore >= 80) {
    confidenceLevel = 'CONFIRMED_DUPLICATE_CANDIDATE';
  } else if (totalScore >= 60) {
    confidenceLevel = 'PROBABLE_DUPLICATE';
  } else if (totalScore >= 40) {
    confidenceLevel = 'POSSIBLE_DUPLICATE';
  }

  return {
    total_score: totalScore,
    matches,
    confidence_level: confidenceLevel,
  };
}

// ============================================================================
// CONTRACT METHODS
// ============================================================================

/**
 * Run duplicate broker detection (tenant-scoped, advisory-based, feature-flag gated).
 * 
 * Searches for potential duplicates within same tenant (if feature flag enabled).
 * Does NOT auto-merge or auto-reject.
 * Routes probable/confirmed duplicates to platform review.
 * Returns generic applicant-facing response (non-leaking).
 * Returns NOT_EXECUTED_FEATURE_DISABLED if feature flag is false.
 * 
 * @param {object} base44 - SDK client
 * @param {object} payload - { tenant_id, applicant_email, legal_name, dba_name, npn, phone, business_address, mailing_address, ein_token_reference }
 * @returns {object} { status: 'NOT_EXECUTED_FEATURE_DISABLED' } OR { duplicate_risk_level_internal, applicant_message }
 * @throws {Error} Validation error
 */
export async function runDuplicateBrokerDetection(base44, payload) {
  const { tenant_id, applicant_email, legal_name, dba_name, npn, phone, business_address, mailing_address, ein_token_reference } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    // 0. Feature flag check: fail-closed
    if (!FEATURE_FLAGS.BROKER_DUPLICATE_DETECTION_ENABLED) {
      // Return inert status (no live lookup, no result exposure)
      return {
        status: 'NOT_EXECUTED_FEATURE_DISABLED',
        duplicate_risk_level_internal: 'NO_MATCH', // Safe internal default
        applicant_message: 'Your application is being processed. Thank you for your patience.',
      };
    }

    // 1. Query existing brokers in same tenant
    const existingBrokers = await base44.asServiceRole.entities.BrokerAgencyProfile.filter(
      { tenant_id }
    );

    const applicantProfile = {
      primary_contact_email: applicant_email,
      legal_name,
      dba_name,
      npn,
      phone,
      business_address,
      mailing_address,
      ein_token_reference,
    };

    const candidates = [];

    // 2. Score each existing broker against applicant
    for (const existing of existingBrokers) {
      const matchResult = calculateMatchScore(applicantProfile, {
        primary_contact_email: existing.primary_contact_email,
        legal_name: existing.legal_name,
        dba_name: existing.dba_name,
        npn: existing.npn,
        phone: existing.phone,
        business_address: existing.business_address,
        mailing_address: existing.mailing_address,
        ein_token_reference: existing.ein_token_reference,
      });

      // Only include matches with some confidence
      if (matchResult.total_score > 0) {
        candidates.push({
          broker_agency_id: existing.id,
          broker_legal_name: existing.legal_name,
          broker_npn: existing.npn,
          match_score: matchResult.total_score,
          confidence_level: matchResult.confidence_level,
          matches: matchResult.matches,
        });
      }
    }

    // 3. Sort candidates by match score (highest first)
    candidates.sort((a, b) => b.match_score - a.match_score);

    // 4. Determine duplicate risk level
    let riskLevel = 'NO_MATCH';
    if (candidates.length > 0) {
      const topCandidate = candidates[0];
      riskLevel = topCandidate.confidence_level;
      if (riskLevel === 'CONFIRMED_DUPLICATE_CANDIDATE' || riskLevel === 'PROBABLE_DUPLICATE') {
        riskLevel = 'NEEDS_PLATFORM_REVIEW';
      }
    }

    // 5. Audit: BROKER_DUPLICATE_CHECK_RUN (safe internal audit only)
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: 'system',
      actor_role: 'system',
      action: 'BROKER_DUPLICATE_CHECK_RUN',
      detail: `Duplicate check completed: ${riskLevel} (${candidates.length} potential matches found)`,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    // 6. Audit: BROKER_DUPLICATE_CANDIDATE_FOUND (if candidates exist; redacted for safety)
    if (candidates.length > 0) {
      await createAuditEvent(base44, {
        tenant_id,
        actor_user_id: 'system',
        actor_role: 'system',
        action: 'BROKER_DUPLICATE_CANDIDATE_FOUND',
        detail: `Duplicate candidate detected: risk level ${riskLevel}, top score ${Math.round(candidates[0].match_score)}`,
        outcome: 'success',
        audit_trace_id: auditTraceId,
      });
    }

    // 7. Return generic applicant response (non-leaking; no risk level exposed)
    return {
      duplicate_risk_level_internal: riskLevel, // Stored internally only, not returned to applicant
      applicant_message: 'Your application is being processed. Thank you for your patience.',
      // Platform reviewers will see candidate details separately (not returned here)
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get duplicate detection candidates (platform reviewer only, feature-flag gated).
 * 
 * Returns detailed duplicate candidate information.
 * Platform reviewer permission-gated (platform_broker.duplicate_review).
 * Tenant-scoped (no cross-tenant leakage).
 * Feature flag must be enabled for access.
 * 
 * @param {object} base44 - SDK client
 * @param {object} context - Authenticated context { tenant_id, user_id, role }
 * @param {object} payload - { broker_agency_id }
 * @returns {object} { candidates: [...], top_candidate: {...} }
 * @throws {Error} Permission/scope error or feature disabled
 */
export async function getDuplicateDetectionCandidates(base44, context, payload) {
  // Feature flag check
  if (!FEATURE_FLAGS.BROKER_DUPLICATE_DETECTION_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'Duplicate detection review is not yet authorized for this phase',
    };
  }

  // Permission check: fail-closed
  assertPermission(context, 'platform_broker.duplicate_review');

  const { tenant_id } = context;
  const { broker_agency_id } = payload;

  try {
    // Scope check
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(
      broker_agency_id
    );
    assertScopeAccess(context, profile);

    // Get onboarding case
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length === 0) {
      throw { status: 404, message: 'Onboarding case not found' };
    }

    const onboardingCase = cases[0];

    // Query existing brokers (for detailed candidate comparison)
    const existingBrokers = await base44.asServiceRole.entities.BrokerAgencyProfile.filter(
      { tenant_id }
    );

    const applicantProfile = {
      primary_contact_email: profile.primary_contact_email,
      legal_name: profile.legal_name,
      dba_name: profile.dba_name,
      npn: profile.npn,
      phone: profile.phone,
      business_address: profile.business_address,
      mailing_address: profile.mailing_address,
      ein_token_reference: profile.ein_token_reference,
    };

    const candidates = [];
    for (const existing of existingBrokers) {
      if (existing.id === broker_agency_id) continue; // Skip self

      const matchResult = calculateMatchScore(applicantProfile, {
        primary_contact_email: existing.primary_contact_email,
        legal_name: existing.legal_name,
        dba_name: existing.dba_name,
        npn: existing.npn,
        phone: existing.phone,
        business_address: existing.business_address,
        mailing_address: existing.mailing_address,
        ein_token_reference: existing.ein_token_reference,
      });

      if (matchResult.total_score > 0) {
        candidates.push({
          broker_agency_id: existing.id,
          broker_legal_name: existing.legal_name,
          broker_npn: existing.npn,
          broker_email: existing.primary_contact_email,
          broker_phone: existing.phone,
          match_score: matchResult.total_score,
          confidence_level: matchResult.confidence_level,
          matches: matchResult.matches,
          created_at: existing.created_date,
        });
      }
    }

    candidates.sort((a, b) => b.match_score - a.match_score);

    return {
      applicant_broker_id: broker_agency_id,
      applicant_legal_name: profile.legal_name,
      candidates,
      top_candidate: candidates.length > 0 ? candidates[0] : null,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Record duplicate detection resolution decision (platform reviewer, feature-flag gated).
 * 
 * Allows platform reviewer to document duplicate resolution.
 * Permission-gated (platform_broker.duplicate_review).
 * Audit logged.
 * Feature flag must be enabled.
 * 
 * @param {object} base44 - SDK client
 * @param {object} context - Authenticated context { tenant_id, user_id, role }
 * @param {object} payload - { broker_agency_id, duplicate_candidate_id, decision: 'proceed' | 'hold_for_merge' | 'reject', audit_reason }
 * @returns {object} { success: true }
 * @throws {Error} Permission/scope error or feature disabled
 */
export async function recordDuplicateResolution(base44, context, payload) {
  // Feature flag check
  if (!FEATURE_FLAGS.BROKER_DUPLICATE_DETECTION_ENABLED) {
    throw {
      status: 403,
      code: 'NOT_AUTHORIZED_FOR_GATE_7A_1',
      message: 'Duplicate detection review is not yet authorized for this phase',
    };
  }

  // Permission check: fail-closed
  assertPermission(context, 'platform_broker.duplicate_review');

  const { tenant_id } = context;
  const { broker_agency_id, duplicate_candidate_id, decision, audit_reason } = payload;
  const auditTraceId = crypto.randomUUID();

  try {
    // Scope check
    const profile = await base44.asServiceRole.entities.BrokerAgencyProfile.read(
      broker_agency_id
    );
    assertScopeAccess(context, profile);

    // Update onboarding case with resolution
    const cases = await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.filter(
      { broker_agency_id, tenant_id }
    );
    if (cases.length > 0) {
      await base44.asServiceRole.entities.BrokerAgencyOnboardingCase.update(
        cases[0].id,
        {
          duplicate_resolution_status: decision,
          duplicate_resolution_notes: audit_reason || '',
          duplicate_resolution_at: new Date().toISOString(),
        }
      );
    }

    // Audit: BROKER_DUPLICATE_RESOLUTION_RECORDED
    await createAuditEvent(base44, {
      tenant_id,
      actor_user_id: context.user_id,
      actor_role: context.role,
      action: 'BROKER_DUPLICATE_RESOLUTION_RECORDED',
      detail: `Duplicate resolution: ${decision} (reason: ${audit_reason || 'none'})`,
      entity_type: 'BrokerAgencyOnboardingCase',
      entity_id: cases[0]?.id || broker_agency_id,
      outcome: 'success',
      audit_trace_id: auditTraceId,
    });

    return { success: true };
  } catch (error) {
    throw error;
  }
}

export default {
  runDuplicateBrokerDetection,
  getDuplicateDetectionCandidates,
  recordDuplicateResolution,
};