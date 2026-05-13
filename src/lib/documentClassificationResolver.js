/**
 * Document Classification Resolver (Gate 6L-B.2)
 * 
 * Determines document classification: direct_broker_owned, mga_affiliated, platform_admin, or system_internal
 * Classification is assigned at document creation and never changed.
 */

export function classifyDocument(attrs) {
  const { broker_agency_id, mga_relationship_id, distribution_channel_context_id, creator_role } = attrs;

  // Platform admin documents
  if (creator_role && creator_role.startsWith('platform_')) {
    return 'platform_admin';
  }

  // System/internal documents
  if (!broker_agency_id) {
    return 'system_internal';
  }

  // Direct broker-owned documents
  if (!mga_relationship_id) {
    return 'direct_broker_owned';
  }

  // MGA-affiliated documents
  return 'mga_affiliated';
}

export function determineVisibilityScope(attrs) {
  const { broker_agency_id, mga_relationship_id } = attrs;

  // No relationship → broker only
  if (!broker_agency_id || !mga_relationship_id) {
    return 'broker_only';
  }

  // MGA-affiliated → relationship bound
  return 'relationship_bound';
}

export function classifyFromDocument(doc) {
  return classifyDocument({
    broker_agency_id: doc.broker_agency_id,
    mga_relationship_id: doc.mga_relationship_id,
    distribution_channel_context_id: doc.distribution_channel_context_id,
    creator_role: doc.creator_role
  });
}