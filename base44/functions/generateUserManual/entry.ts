import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { prompt, title, module } = await req.json();

    if (!prompt || !title) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use LLM to generate manual content
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a technical documentation expert. Create a comprehensive user manual based on this request:

Title: ${title}
Module: ${module}
Request: ${prompt}

Provide the response in the following JSON format:
{
  "description": "A 1-2 sentence description of the manual",
  "content": "Detailed markdown-formatted content covering the feature, including usage, tips, and guidance. Format with proper headings, lists, and code examples where relevant.",
  "best_practices": ["Practice 1", "Practice 2", "Practice 3"],
  "common_issues": [
    {"issue": "Problem description", "solution": "How to resolve it"},
    {"issue": "Another problem", "solution": "Solution details"}
  ]
}

Make the content thorough, clear, and helpful for end users.`,
      response_json_schema: {
        type: "object",
        properties: {
          description: { type: "string" },
          content: { type: "string" },
          best_practices: { type: "array", items: { type: "string" } },
          common_issues: {
            type: "array",
            items: {
              type: "object",
              properties: {
                issue: { type: "string" },
                solution: { type: "string" }
              }
            }
          }
        }
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});