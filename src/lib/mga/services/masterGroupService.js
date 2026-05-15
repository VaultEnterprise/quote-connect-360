/**
 * MGA Phase 3 — MasterGroup Scoped Service
 * lib/mga/services/masterGroupService.js
 *
 * PHASE 3 CONSTRAINT: Inert until wired into live flows in Phase 5.
 * @see docs/MGA_PHASE_3_SCOPED_SERVICE_LAYER_REPORT.md Section 6.1-B
 */

import { base44 } from '@/api/base44Client';
import { validateServiceRequest, buildScopedResponse, checkScope, prepareAndRecordAudit } from './serviceContract.js';

const DOMAIN = 'mastergroup';

export async function createMasterGroup(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'create', target_entity_type: 'MasterGroup' });
  if (denied) return response;
  const existing = await base44.entities.MasterGroup.filter({ idempotency_key: request.idempotency_key, master_general_agent_id: decision.effective_mga_id });
  if (existing?.length) return buildScopedResponse({ data: existing[0], idempotency_result: 'already_processed', correlation_id: decision.correlation_id });
  const created = await base44.entities.MasterGroup.create({ ...request.payload, master_general_agent_id: decision.effective_mga_id, idempotency_key: request.idempotency_key });
  await prepareAndRecordAudit(decision, { outcome: 'success', after: created }, request.idempotency_key);
  return buildScopedResponse({ data: created, idempotency_result: 'created', correlation_id: decision.correlation_id });
}

export async function getMasterGroupDetail(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'detail', target_entity_type: 'MasterGroup' });
  if (denied) return response;
  const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  return buildScopedResponse({ data: records[0], correlation_id: decision.correlation_id });
}

export async function listMasterGroups(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'list', target_entity_type: 'MasterGroup', target_entity_id: 'list_operation' });
  if (denied) return response;
  const filters = decision.effective_mga_id !== 'platform_scope'
    ? { master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) }
    : request.filters || {};
  const groups = await base44.entities.MasterGroup.filter(filters);
  return buildScopedResponse({ data: groups, correlation_id: decision.correlation_id });
}

export async function updateMasterGroup(request) {
   const v = validateServiceRequest(request, { requireIdempotency: true });
   if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'edit', target_entity_type: 'MasterGroup' });
   if (denied) return response;
   const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
   if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
   if (request.expected_updated_date && records[0].updated_date !== request.expected_updated_date) return buildScopedResponse({ success: false, reason_code: 'STALE_UPDATE', detail: 'Organization was updated by another user. Please refresh and try again.', correlation_id: decision.correlation_id });
   const updated = await base44.entities.MasterGroup.update(request.target_entity_id, request.payload);
   await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
   return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function archiveMasterGroup(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'delete', target_entity_type: 'MasterGroup' });
  if (denied) return response;
  const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const updated = await base44.entities.MasterGroup.update(request.target_entity_id, { status: 'archived' });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function getMasterGroupSummary(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'read', target_entity_type: 'MasterGroup' });
  if (denied) return response;
  const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  const cases = await base44.entities.BenefitCase.filter({ master_general_agent_id: decision.effective_mga_id, master_group_id: request.target_entity_id });
  return buildScopedResponse({ data: { masterGroup: records[0], caseCount: cases.length }, correlation_id: decision.correlation_id });
}

export async function listMasterGroupActivity(request) {
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'view_audit', target_entity_type: 'MasterGroup' });
  if (denied) return response;
  const records = await base44.entities.MasterGeneralAgentActivityLog.filter({ master_group_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  return buildScopedResponse({ data: records, correlation_id: decision.correlation_id });
}

export async function deactivateBrokerAgency(request) {
  const v = validateServiceRequest(request, { requireIdempotency: true });
  if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
  const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'deactivate', target_entity_type: 'MasterGroup' });
  if (denied) return response;
  const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
  if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
  if (records[0].status !== 'active') return buildScopedResponse({ success: false, reason_code: 'INVALID_STATE', detail: 'Organization is already inactive', correlation_id: decision.correlation_id });
  const updated = await base44.entities.MasterGroup.update(request.target_entity_id, { status: 'inactive' });
  await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated, detail: `Deactivated Broker / Agency '${updated.name}'` }, request.idempotency_key);
  return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function reactivateBrokerAgency(request) {
   const v = validateServiceRequest(request, { requireIdempotency: true });
   if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'reactivate', target_entity_type: 'MasterGroup' });
   if (denied) return response;
   const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
   if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
   if (records[0].status !== 'inactive') return buildScopedResponse({ success: false, reason_code: 'INVALID_STATE', detail: 'Organization is already active', correlation_id: decision.correlation_id });
   const updated = await base44.entities.MasterGroup.update(request.target_entity_id, { status: 'active' });
   await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated, detail: `Reactivated Broker / Agency '${updated.name}'` }, request.idempotency_key);
   return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

// Gate 6L-A: Contacts Management
export async function listBrokerAgencyContacts(request) {
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'contacts_view', target_entity_type: 'BrokerAgencyContact' });
   if (denied) return response;
   const filters = { master_group_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id, ...(request.filters || {}) };
   const contacts = await base44.entities.BrokerAgencyContact.filter(filters);
   return buildScopedResponse({ data: contacts, correlation_id: decision.correlation_id });
}

export async function createBrokerAgencyContact(request) {
   const v = validateServiceRequest(request, { requireIdempotency: true });
   if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'contacts_manage', target_entity_type: 'BrokerAgencyContact' });
   if (denied) return response;
   const payload = { ...request.payload, master_group_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id };
   const created = await base44.entities.BrokerAgencyContact.create(payload);
   await prepareAndRecordAudit(decision, { outcome: 'success', after: created, detail: `Created contact: ${created.full_name}` }, request.idempotency_key);
   return buildScopedResponse({ data: created, correlation_id: decision.correlation_id });
}

export async function updateBrokerAgencyContact(request) {
   const v = validateServiceRequest(request, { requireIdempotency: true });
   if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'contacts_manage', target_entity_type: 'BrokerAgencyContact' });
   if (denied) return response;
   const records = await base44.entities.BrokerAgencyContact.filter({ id: request.contact_id, master_group_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
   if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
   const updated = await base44.entities.BrokerAgencyContact.update(request.contact_id, request.payload);
   await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
   return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function deactivateBrokerAgencyContact(request) {
   const v = validateServiceRequest(request, { requireIdempotency: true });
   if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'contacts_manage', target_entity_type: 'BrokerAgencyContact' });
   if (denied) return response;
   const records = await base44.entities.BrokerAgencyContact.filter({ id: request.contact_id, master_group_id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
   if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
   const updated = await base44.entities.BrokerAgencyContact.update(request.contact_id, { status: 'inactive' });
   await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
   return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

// Gate 6L-A: Settings Management
export async function getBrokerAgencySettings(request) {
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'settings_view', target_entity_type: 'MasterGroup' });
   if (denied) return response;
   const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
   if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
   const settings = { notification_email_frequency: records[0].notification_email_frequency, notification_channels: records[0].notification_channels, default_invite_role: records[0].default_invite_role, updated_at: records[0].updated_date };
   return buildScopedResponse({ data: settings, correlation_id: decision.correlation_id });
}

export async function updateBrokerAgencySettings(request) {
   const v = validateServiceRequest(request, { requireIdempotency: true });
   if (!v.valid) return buildScopedResponse({ success: false, reason_code: 'MALFORMED_TARGET' });
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'settings_manage', target_entity_type: 'MasterGroup' });
   if (denied) return response;
   const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
   if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
   const updated = await base44.entities.MasterGroup.update(request.target_entity_id, request.payload);
   await prepareAndRecordAudit(decision, { outcome: 'success', before: records[0], after: updated }, request.idempotency_key);
   return buildScopedResponse({ data: updated, correlation_id: decision.correlation_id });
}

export async function getBrokerAgencyNotes(request) {
   const { decision, denied, response } = await checkScope({ ...request, domain: DOMAIN, action: 'notes_view', target_entity_type: 'MasterGroup' });
   if (denied) return response;
   const records = await base44.entities.MasterGroup.filter({ id: request.target_entity_id, master_general_agent_id: decision.effective_mga_id });
   if (!records?.length) return buildScopedResponse({ success: false, reason_code: 'NOT_FOUND_IN_SCOPE', masked_not_found: true, correlation_id: decision.correlation_id });
   return buildScopedResponse({ data: { internal_notes: records[0].internal_notes, updated_at: records[0].updated_date }, correlation_id: decision.correlation_id });
}

export default { createMasterGroup, getMasterGroupDetail, listMasterGroups, updateMasterGroup, archiveMasterGroup, getMasterGroupSummary, listMasterGroupActivity, deactivateBrokerAgency, reactivateBrokerAgency, listBrokerAgencyContacts, createBrokerAgencyContact, updateBrokerAgencyContact, deactivateBrokerAgencyContact, getBrokerAgencySettings, updateBrokerAgencySettings, getBrokerAgencyNotes };