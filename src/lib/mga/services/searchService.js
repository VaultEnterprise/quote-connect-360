/**
 * MGA Phase 3 — Search / Autocomplete Scoped Service
 * lib/mga/services/searchService.js
 * PHASE 3 CONSTRAINT: Inert until wired in Phase 6.
 */
import { base44 } from '@/api/base44Client';
import { buildScopedResponse, checkScope } from './serviceContract.js';

export async function scopedSearch(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'cases', action: 'list', target_entity_type: 'BenefitCase', target_entity_id: 'search_operation' });
  if (denied) return response;
  const query = request.payload?.query || '';
  const filters = { master_general_agent_id: decision.effective_mga_id };
  const cases = await base44.entities.BenefitCase.filter(filters);
  const results = cases.filter(c => JSON.stringify(c).toLowerCase().includes(query.toLowerCase()));
  return buildScopedResponse({ data: results, correlation_id: decision.correlation_id });
}

export async function scopedAutocomplete(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'cases', action: 'list', target_entity_type: 'BenefitCase', target_entity_id: 'autocomplete_operation' });
  if (denied) return response;
  const query = (request.payload?.query || '').toLowerCase();
  const entityType = request.payload?.entity_type || 'BenefitCase';
  // Only scope-safe entities can be autocompleted
  const allowedTypes = ['BenefitCase', 'EmployerGroup', 'MasterGroup'];
  if (!allowedTypes.includes(entityType)) return buildScopedResponse({ success: false, reason_code: 'UNSUPPORTED_OPERATION', correlation_id: decision.correlation_id });
  const records = await base44.entities[entityType].filter({ master_general_agent_id: decision.effective_mga_id });
  const suggestions = records.filter(r => (r.name || r.employer_name || '').toLowerCase().includes(query)).slice(0, 10).map(r => ({ id: r.id, label: r.name || r.employer_name }));
  return buildScopedResponse({ data: suggestions, correlation_id: decision.correlation_id });
}

export async function authorizeSearchSnippet(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'cases', action: 'read', target_entity_type: 'BenefitCase' });
  if (denied) return response;
  const records = await base44.entities.BenefitCase.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: { authorized: true, snippet_source: request.target_entity_id }, correlation_id: decision.correlation_id });
}

export async function staticHelpSearch(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: 'mga', action: 'read', target_entity_type: 'HelpContent', target_entity_id: 'help_search' });
  if (denied) return response;
  const query = (request.payload?.query || '').toLowerCase();
  const content = await base44.entities.HelpContent.filter({});
  const results = content.filter(c => (c.content || '').toLowerCase().includes(query) || (c.title || '').toLowerCase().includes(query));
  return buildScopedResponse({ data: results, correlation_id: decision.correlation_id });
}

export default { scopedSearch, scopedAutocomplete, authorizeSearchSnippet, staticHelpSearch };