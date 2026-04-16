import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { question, page_code, module_code, user_email, context_target_code } = await req.json();

    if (!question) return Response.json({ error: 'Missing question' }, { status: 400 });

    // 1. Fetch active help content as knowledge base
    const allContent = await base44.asServiceRole.entities.HelpContent.filter(
      { content_status: "active", is_active: true }, "-view_count", 300
    );

    // 2. Also fetch published manual topics
    const manualTopics = await base44.asServiceRole.entities.HelpManualTopic.filter(
      { is_published: true, is_active: true }, "-view_count", 50
    );

    // 3. Build knowledge context — prefer page/module-relevant content first
    const pageContent = allContent.filter(c => c.page_code === page_code || c.module_code === module_code);
    const otherContent = allContent.filter(c => c.page_code !== page_code && c.module_code !== module_code);
    const orderedContent = [...pageContent, ...otherContent].slice(0, 150);

    const knowledgeContext = orderedContent.map(c =>
      `[TARGET:${c.help_target_code}] ${c.help_title}: ${c.short_help_text || ''}${c.detailed_help_text ? '\n' + c.detailed_help_text.substring(0, 400) : ''}`
    ).join('\n\n');

    const topicContext = manualTopics.map(t =>
      `[TOPIC:${t.topic_code}] ${t.topic_title}: ${t.topic_summary || ''}${t.topic_body ? '\n' + t.topic_body.substring(0, 300) : ''}`
    ).join('\n\n');

    // 4. Call LLM with governed context
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are HelpAI — a governed help assistant for ConnectQuote 360, a benefits administration platform.
Answer ONLY from the approved knowledge base below. Do not invent behavior not described.

Current context: page=${page_code || 'GENERAL'}, module=${module_code || 'GENERAL'}
${context_target_code ? `Current UI element: ${context_target_code}` : ''}

=== HELP CONTENT KNOWLEDGE BASE ===
${knowledgeContext}

=== MANUAL TOPICS ===
${topicContext}

USER QUESTION: ${question}

Rules:
- Answer only from the knowledge base above
- If not covered, say clearly: "I don't have specific documentation on this. Please contact your administrator."
- Prefer target-specific help over general
- Cite your sources

Return JSON:
{
  "answer": "helpful markdown answer",
  "sources": ["TARGET_CODE_1", "TOPIC_CODE_2"],
  "confidence": 0.0,
  "related_topics": ["topic title 1", "topic title 2"],
  "answer_status": "answered|low_confidence|unanswered"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          sources: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          related_topics: { type: "array", items: { type: "string" } },
          answer_status: { type: "string" }
        }
      }
    });

    const result = response;
    const confidence = result.confidence || 0.5;
    const answerStatus = result.answer_status || (confidence < 0.4 ? "low_confidence" : "answered");
    const requiresReview = confidence < 0.4;

    // 5. Log the question with full spec-compliant fields
    const logRecord = await base44.asServiceRole.entities.HelpAIQuestionLog.create({
      user_email: user_email || 'anonymous',
      page_code: page_code || 'GENERAL',
      module_code: module_code || 'GENERAL',
      context_help_target_code: context_target_code || null,
      question_text: question,
      normalized_question_text: question.toLowerCase().trim(),
      answer_text: result.answer,
      confidence_score: confidence,
      answer_status: answerStatus,
      source_target_codes: result.sources || [],
      requires_admin_review: requiresReview,
    });

    // 6. Log search
    await base44.asServiceRole.entities.HelpSearchLog.create({
      user_email: user_email || 'anonymous',
      page_code: page_code || 'GENERAL',
      module_code: module_code || 'GENERAL',
      search_channel: 'help_ai',
      search_text: question,
      normalized_search_text: question.toLowerCase().trim(),
      result_count: (result.sources || []).length,
      answered_by_help_ai: true,
    });

    // 7. Audit log
    await base44.asServiceRole.entities.HelpAuditLog.create({
      event_type: requiresReview ? 'HELP_AI_LOW_CONFIDENCE_FLAGGED' : 'HELP_AI_QUESTION_ASKED',
      entity_type: 'HelpAIQuestionLog',
      entity_id: logRecord.id,
      actor_email: user_email || 'anonymous',
      notes: `Confidence: ${confidence}, Page: ${page_code}`,
    });

    return Response.json({
      answer: result.answer,
      sources: result.sources || [],
      confidence,
      answer_status: answerStatus,
      related_topics: result.related_topics || [],
      log_id: logRecord.id,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});