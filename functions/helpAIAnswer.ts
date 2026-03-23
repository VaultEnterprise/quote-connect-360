import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { question, page_code, user_email } = await req.json();

    if (!question) return Response.json({ error: 'Missing question' }, { status: 400 });

    // 1. Fetch all active help content (up to 200 records as knowledge base)
    const allContent = await base44.asServiceRole.entities.HelpContent.filter(
      { status: "active" }, "-view_count", 200
    );

    // 2. Build a concise knowledge context from active help content
    const knowledgeContext = allContent.map(c =>
      `[${c.help_target_code}] ${c.help_title}: ${c.short_help}${c.detailed_help ? '\n' + c.detailed_help.substring(0, 300) : ''}`
    ).join('\n\n');

    // 3. Call LLM with governed context
    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are HelpAI — a governed help assistant for the ConnectQuote 360 benefits administration platform. Answer ONLY from the help knowledge base provided below. Do not invent behavior not described.

Current page/module context: ${page_code || 'GENERAL'}

HELP KNOWLEDGE BASE:
${knowledgeContext}

USER QUESTION: ${question}

Respond with a JSON object:
{
  "answer": "Your helpful, plain-language answer in markdown. If the knowledge base doesn't cover the question, say so clearly.",
  "sources": ["TARGET_CODE_1", "TARGET_CODE_2"],
  "confidence": 0.0 to 1.0,
  "related_topics": ["topic 1", "topic 2"]
}

Confidence guide: 1.0 = fully covered by knowledge base, 0.7 = partially covered, 0.3 = weak coverage, 0.1 = not found.`,
      response_json_schema: {
        type: "object",
        properties: {
          answer: { type: "string" },
          sources: { type: "array", items: { type: "string" } },
          confidence: { type: "number" },
          related_topics: { type: "array", items: { type: "string" } }
        }
      }
    });

    const result = response;
    const confidence = result.confidence || 0.5;
    const requiresReview = confidence < 0.4;

    // 4. Log the question
    const logRecord = await base44.asServiceRole.entities.HelpAIQuestionLog.create({
      user_email: user_email || 'anonymous',
      page_code: page_code || 'GENERAL',
      question_text: question,
      answer_text: result.answer,
      answer_confidence: confidence,
      source_target_codes: result.sources || [],
      requires_admin_review: requiresReview,
    });

    // 5. Log search
    await base44.asServiceRole.entities.HelpSearchLog.create({
      user_email: user_email || 'anonymous',
      page_code: page_code || 'GENERAL',
      search_text: question,
      result_count: (result.sources || []).length,
      answered_by_ai: true,
      confidence_score: confidence,
    });

    return Response.json({
      answer: result.answer,
      sources: result.sources || [],
      confidence,
      related_topics: result.related_topics || [],
      log_id: logRecord.id,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});