import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Saves/updates HelpContent and writes a version history snapshot.
 * Handles create, update, activate, deactivate.
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
      // Fetch existing to snapshot
      const existing = await base44.asServiceRole.entities.HelpContent.filter(
        { id: content_id }, "-created_date", 1
      );

      const prev = existing[0];
      const newVersionNo = (prev?.version_no || 1) + 1;

      if (action === 'activate') {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, { status: 'active', last_updated_by: user.email });
        changeType = 'activate'; eventType = 'HELP_CONTENT_ACTIVATED';
      } else if (action === 'deactivate') {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, { status: 'inactive', last_updated_by: user.email });
        changeType = 'deactivate'; eventType = 'HELP_CONTENT_DEACTIVATED';
      } else if (action === 'archive') {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, { status: 'inactive', last_updated_by: user.email });
        changeType = 'archive'; eventType = 'HELP_CONTENT_ARCHIVED';
      } else {
        result = await base44.asServiceRole.entities.HelpContent.update(content_id, {
          ...data,
          content_source: 'admin_updated',
          version_no: newVersionNo,
          last_updated_by: user.email,
        });
      }

      // Write version snapshot
      await base44.asServiceRole.entities.HelpContentVersion.create({
        help_content_id: content_id,
        help_target_code: prev?.help_target_code || target_code,
        version_no: newVersionNo,
        snapshot_payload: prev || {},
        change_type: changeType,
        changed_by: user.email,
        change_notes: action || 'admin edit',
      });

    } else {
      // New record
      result = await base44.asServiceRole.entities.HelpContent.create({
        ...data,
        help_target_code: target_code,
        module_code,
        page_code,
        content_source: 'admin_created',
        version_no: 1,
        last_updated_by: user.email,
      });
      changeType = 'create'; eventType = 'HELP_CONTENT_CREATED';

      // Initial version snapshot
      await base44.asServiceRole.entities.HelpContentVersion.create({
        help_content_id: result.id,
        help_target_code: target_code,
        version_no: 1,
        snapshot_payload: result,
        change_type: 'create',
        changed_by: user.email,
      });
    }

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