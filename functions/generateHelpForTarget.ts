import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Generates AI-drafted help content for a single HelpTarget.
 * Called from the Help Admin console's "AI Generate" button.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const {
      target_code, target_label, module_code, page_code, component_type,
      description, allowed_values
    } = await req.json();

    if (!target_code || !target_label) {
      return Response.json({ error: 'target_code and target_label are required' }, { status: 400 });
    }

    const templates = {
      page: `Write a comprehensive help guide for the "${target_label}" page in the ${module_code} module of ConnectQuote 360, a benefits administration platform.
Include: purpose of the page, key sections/features, typical user workflow, what users should do on this page, and any important warnings.`,

      field: `Write detailed help content for the "${target_label}" field in the ${module_code} module of ConnectQuote 360.
Include: what this field represents, why it matters, what the user should enter/select, allowed values${allowed_values ? ` (${allowed_values})` : ''}, formatting requirements, downstream dependencies, and validation warnings.`,

      button: `Write help content for the "${target_label}" button/action in the ${module_code} module of ConnectQuote 360.
Include: what happens when clicked, prerequisites/permissions needed, workflow implications, and any irreversible warnings.`,

      workflow_step: `Write help content for the "${target_label}" workflow step in the ${module_code} module of ConnectQuote 360.
Include: what this stage means, what must be completed at this stage, who is responsible, what happens next, and common blockers.`,

      status: `Write help content explaining the "${target_label}" status in the ${module_code} module of ConnectQuote 360.
Include: what this status means, how records reach this status, what actions are available in this status, and what happens next.`,

      card: `Write help content for the "${target_label}" card/panel in the ${module_code} module of ConnectQuote 360.
Include: what data/metrics this card shows, how to interpret the values, what actions are available, and key thresholds to watch.`,

      section: `Write help content for the "${target_label}" section in the ${module_code} module of ConnectQuote 360.
Include: the purpose of this section, what it contains, how to use it effectively, and any prerequisites.`,

      tab: `Write help content for the "${target_label}" tab in the ${module_code} module of ConnectQuote 360.
Include: what this tab contains, when to use it in the workflow, key features within the tab.`,
    };

    const template = templates[component_type] || templates.section;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${template}

${description ? `Additional context: ${description}` : ''}

Respond with a JSON object containing:
{
  "help_title": "concise title for this help item",
  "short_help": "1-2 sentence plain-language summary",
  "detailed_help": "full markdown explanation (use ## headers, bullet points). 150-400 words.",
  "expected_user_action": "what should the user do here? 1-3 sentences.",
  "allowed_values": "if applicable, list allowed values or valid ranges",
  "usage_example": "a concrete real-world example if helpful",
  "warnings": "important warnings or cautions (leave blank if none)",
  "validation_notes": "any validation rules or constraints (leave blank if none)",
  "related_topics": ["topic1", "topic2", "topic3"],
  "search_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`,
      response_json_schema: {
        type: "object",
        properties: {
          help_title: { type: "string" },
          short_help: { type: "string" },
          detailed_help: { type: "string" },
          expected_user_action: { type: "string" },
          allowed_values: { type: "string" },
          usage_example: { type: "string" },
          warnings: { type: "string" },
          validation_notes: { type: "string" },
          related_topics: { type: "array", items: { type: "string" } },
          search_keywords: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Log audit event
    await base44.asServiceRole.entities.HelpAuditLog.create({
      event_type: 'HELP_CONTENT_CREATED',
      entity_type: 'HelpContent',
      target_code,
      actor_email: user.email,
      actor_role: user.role,
      notes: `AI generated help content for ${target_code}`,
    });

    return Response.json({ success: true, content: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});