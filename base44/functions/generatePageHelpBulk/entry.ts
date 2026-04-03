import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const PAGES_TO_GENERATE = [
  { code: "DASHBOARD", title: "Dashboard", desc: "Main landing page with KPIs, metrics, and quick actions" },
  { code: "CASES", title: "Cases", desc: "Browse and manage all benefit cases" },
  { code: "CASE_NEW", title: "New Case", desc: "Create a new benefit case" },
  { code: "CASE_DETAIL", title: "Case Details", desc: "View and manage individual case lifecycle" },
  { code: "CENSUS", title: "Census", desc: "Upload and manage employee census data" },
  { code: "QUOTES", title: "Quotes", desc: "Create and compare benefit plan quotes" },
  { code: "ENROLLMENT", title: "Enrollment", desc: "Manage employee enrollment windows" },
  { code: "RENEWALS", title: "Renewals", desc: "Track and manage plan renewals" },
  { code: "TASKS", title: "Tasks", desc: "View and manage case action items" },
  { code: "EMPLOYERS", title: "Employers", desc: "Manage employer group information" },
  { code: "PLANS", title: "Plan Library", desc: "Browse and manage benefit plans" },
  { code: "PROPOSALS", title: "Proposals", desc: "Create and send benefit proposals" },
  { code: "EXCEPTIONS", title: "Exception Queue", desc: "Manage system exceptions and issues" },
  { code: "CONTRIBUTIONS", title: "Contribution Modeling", desc: "Model employer/employee contribution scenarios" },
  { code: "EMPLOYEE_PORTAL", title: "Employee Portal", desc: "End-user benefit enrollment interface" },
  { code: "EMPLOYEE_MGMT", title: "Employee Management", desc: "Administer employee enrollment records" },
  { code: "EMPLOYEE_LOGIN", title: "Employee Portal Login", desc: "Employee portal access point" },
  { code: "EMPLOYEE_ENROLL", title: "Employee Enrollment", desc: "Guided employee benefit enrollment wizard" },
  { code: "EMPLOYEE_BENEFITS", title: "Employee Benefits", desc: "View enrolled benefits and plan details" },
  { code: "EMPLOYER_PORTAL", title: "Employer Portal", desc: "Employer-facing case management dashboard" },
  { code: "POLICYMATCH", title: "PolicyMatch AI", desc: "AI-driven plan optimization engine" },
  { code: "INTEGRATION_INFRA", title: "Integration Infrastructure", desc: "API platform, webhooks, and integration tools" },
  { code: "SETTINGS", title: "Settings", desc: "Organization and user settings" },
  { code: "HELP_CENTER", title: "Help Center", desc: "User-facing help and documentation" },
  { code: "HELP_ADMIN", title: "Help Admin", desc: "Manage help content and coverage" },
  { code: "HELP_DASHBOARD", title: "Help Governance", desc: "Help system analytics and metrics" },
  { code: "HELP_COVERAGE", title: "Help Coverage Report", desc: "Help content completeness analysis" },
  { code: "HELP_ANALYTICS", title: "Help Search Analytics", desc: "Help usage patterns and search behavior" },
  { code: "HELP_MANUAL", title: "Help Manual Manager", desc: "Create long-form help documentation" },
  { code: "HELP_REGISTRY", title: "Help Target Registry", desc: "Master registry of help-enabled UI elements" },
  { code: "ACA_LIBRARY", title: "ACA Rules Library", desc: "50-state ACA compliance reference" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // First, check which pages already have help content
    const allContent = await base44.entities.HelpContent.list("-updated_date", 500);
    const existingCodes = new Set(allContent.map(c => c.help_target_code));
    
    const pagesToGenerate = PAGES_TO_GENERATE.filter(p => !existingCodes.has(`PAGE_${p.code}`));
    
    if (pagesToGenerate.length === 0) {
      return Response.json({ 
        message: "All pages already have help content",
        total: PAGES_TO_GENERATE.length,
        skipped: PAGES_TO_GENERATE.length
      });
    }

    // Batch generate (process in chunks to avoid timeout)
    const results = [];
    const CHUNK_SIZE = 5;
    
    for (let i = 0; i < pagesToGenerate.length; i += CHUNK_SIZE) {
      const chunk = pagesToGenerate.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map(async (page) => {
        try {
          const res = await base44.integrations.Core.InvokeLLM({
            prompt: `Help content for CQ360 page "${page.title}": ${page.desc}

Return JSON:
{
  "short_help_text": "1-2 sentence concise overview",
  "help_body": "3-4 paragraphs covering: What is this page? What can you do? Key features. Tips.",
  "search_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`,
            response_json_schema: {
              type: "object",
              properties: {
                short_help_text: { type: "string" },
                help_body: { type: "string" },
                search_keywords: { type: "array", items: { type: "string" } }
              },
              required: ["short_help_text", "help_body", "search_keywords"]
            }
          });

          await base44.entities.HelpContent.create({
            help_target_code: `PAGE_${page.code}`,
            help_title: page.title,
            short_help_text: res.short_help_text,
            detailed_help_text: res.help_body,
            search_keywords: res.search_keywords.join(", "),
            content_status: "active",
            content_source_type: "ai_generated",
            version_no: 1,
            view_count: 0
          });
          return { page: page.title, status: "created" };
        } catch (e) {
          return { page: page.title, status: `error: ${e.message.substring(0, 100)}` };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return Response.json({ 
      message: "Help content generation complete",
      total: PAGES_TO_GENERATE.length,
      results 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});