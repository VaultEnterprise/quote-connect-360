import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Saves/updates HelpContent with versioning + audit.
 * Uses spec-canonical field names (short_help_text, detailed_help_text, etc.)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { content_id, target_code, module_code, page_code, data, action } = await req.json();

    let result;
    let changeType = 'update';
    let eventType = 'HELP_CONTENT_UPDATED';

    if (content_id) {
      const existing = await base44.asServiceRole.entities.HelpContent.filter(
        {}, "-created_date", 500
      ).then(all => all.find(c => c.id === content_id));

      const newVersionNo = (existing?.version_no || 1) + 1;

      if (action === 'activate') {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, { content_status: 'active', is_active: true, last_updated_by: user.email });
        changeType = 'activate'; eventType = 'HELP_CONTENT_ACTIVATED';
      } else if (action === 'deactivate') {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, { content_status: 'inactive', is_active: false, last_updated_by: user.email });
        changeType = 'deactivate'; eventType = 'HELP_CONTENT_DEACTIVATED';
      } else if (action === 'archive') {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, { content_status: 'archived', is_active: false, last_updated_by: user.email });
        changeType = 'archive'; eventType = 'HELP_CONTENT_ARCHIVED';
      } else if (action === 'review_required') {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, { content_status: 'review_required', review_required: true, last_updated_by: user.email });
        changeType = 'update'; eventType = 'HELP_CONTENT_UPDATED';
      } else {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, {
          ...data,
          content_source_type: 'admin_updated',
          version_no: newVersionNo,
          last_updated_by: user.email,
        });
      }

      // Version snapshot
      await base44.asServiceRole.entities.HelpContentVersion.create({
        help_content_id: content_id,
        help_target_code: existing?.help_target_code || target_code,
        version_no: newVersionNo,
        snapshot_payload: existing || {},
        change_type: changeType,
        changed_by: user.email,
        change_summary: action || 'admin edit',
      });

    } else {
      result = await base44.asServiceRole.entities.HelpContent.create({
        ...data,
        help_target_code: target_code,
        module_code,
        page_code,
        content_source_type: 'admin_created',
        version_no: 1,
        last_updated_by: user.email,
      });
      changeType = 'create'; eventType = 'HELP_CONTENT_CREATED';

      await base44.asServiceRole.entities.HelpContentVersion.create({
        help_content_id: result.id,
        help_target_code: target_code,
        version_no: 1,
        snapshot_payload: result,
        change_type: 'create',
        changed_by: user.email,
      });
    }

    // Queue for AI reindex
    await base44.asServiceRole.entities.HelpAITrainingQueue.create({
      source_entity_type: 'HelpContent',
      source_entity_id: result.id,
      source_target_code: target_code,
      change_reason: eventType,
      queue_status: 'queued',
      queued_at: new Date().toISOString(),
    });

    // Audit log
    await base44.asServiceRole.entities.HelpAuditLog.create({
      event_type: eventType,
      entity_type: 'HelpContent',
      entity_id: result.id,
      target_code,
      actor_email: user.email,
      actor_role: user.role,
    });

    return Response.json({ success: true, record: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});