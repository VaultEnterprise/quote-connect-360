import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Generates AI-drafted help content for a single HelpTarget.
 * Uses spec-canonical output field names.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const {
      target_code, target_label, module_code, page_code, target_type,
      component_key, field_name, action_code, workflow_code, description, allowed_values
    } = await req.json();

    if (!target_code || !target_label) {
      return Response.json({ error: 'target_code and target_label required' }, { status: 400 });
    }

    const typeKey = target_type || 'field';

    const templates = {
      page: `Write a comprehensive help guide for the "${target_label}" page (${page_code}) in the ${module_code} module of ConnectQuote 360, a benefits administration platform. Include: purpose of the page, key sections/features, typical user workflow, and important warnings.`,
      field: `Write detailed help for the "${target_label}" field${field_name ? ` (field: ${field_name})` : ''} in the ${module_code} module. Include: what it represents, why it matters, what to enter/select, allowed values${allowed_values ? ` (${allowed_values})` : ''}, formatting, downstream dependencies, and validation warnings.`,
      button: `Write help for the "${target_label}" button${action_code ? ` (action: ${action_code})` : ''} in ${module_code}. Include: what happens when clicked, prerequisites, workflow implications, irreversible warnings.`,
      action: `Write help for the "${target_label}" action${action_code ? ` (${action_code})` : ''} in ${module_code}. Include: what this action does, when to use it, prerequisites, consequences.`,
      workflow_step: `Write help for the "${target_label}" workflow step${workflow_code ? ` (${workflow_code})` : ''} in ${module_code}. Include: what this stage means, what must be done, who is responsible, what happens next, common blockers.`,
      status: `Write help explaining the "${target_label}" status in ${module_code}. Include: what this status means, how records reach it, available actions, what happens next.`,
      card: `Write help for the "${target_label}" card/panel in ${module_code}. Include: what data/metrics it shows, how to interpret values, available actions, key thresholds.`,
      section: `Write help for the "${target_label}" section in ${module_code}. Include: purpose, contents, how to use effectively, prerequisites.`,
      tab: `Write help for the "${target_label}" tab in ${module_code}. Include: what this tab contains, when to use it, key features within.`,
      grid_column: `Write help for the "${target_label}" column in ${module_code}. Include: what this column shows, data type, how to interpret values, sort/filter behavior.`,
      process_step: `Write help for the "${target_label}" process step in ${module_code}. Include: what this step means, what must be completed, who is responsible, what comes next.`,
    };

    const template = templates[typeKey] || templates.field;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${template}${description ? '\n\nAdditional context: ' + description : ''}

Respond with JSON (use exactly these field names — they are spec-canonical):
{
  "help_title": "concise title",
  "short_help_text": "1-2 sentence plain-language summary",
  "detailed_help_text": "full markdown (150-400 words, ## headers, bullets)",
  "feature_capabilities_text": "list of key capabilities or empty string",
  "process_meaning_text": "what this means in the business process, or empty string",
  "expected_user_action_text": "what should the user do here (1-3 sentences)",
  "allowed_values_text": "allowed values or valid ranges if applicable",
  "examples_text": "a concrete real-world example",
  "dependency_notes_text": "upstream/downstream dependencies if any",
  "warnings_text": "important warnings or cautions",
  "validation_notes_text": "validation rules or constraints",
  "related_topics_text": "comma-separated related topics",
  "search_keywords": "comma-separated searchable terms"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          help_title: { type: "string" },
          short_help_text: { type: "string" },
          detailed_help_text: { type: "string" },
          feature_capabilities_text: { type: "string" },
          process_meaning_text: { type: "string" },
          expected_user_action_text: { type: "string" },
          allowed_values_text: { type: "string" },
          examples_text: { type: "string" },
          dependency_notes_text: { type: "string" },
          warnings_text: { type: "string" },
          validation_notes_text: { type: "string" },
          related_topics_text: { type: "string" },
          search_keywords: { type: "string" }
        }
      }
    });

    await base44.asServiceRole.entities.HelpAuditLog.create({
      event_type: 'HELP_CONTENT_CREATED',
      entity_type: 'HelpContent',
      target_code,
      actor_email: user.email,
      actor_role: user.role,
      notes: `AI generated for ${target_code} (type: ${typeKey})`,
    });

    return Response.json({ success: true, content: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});