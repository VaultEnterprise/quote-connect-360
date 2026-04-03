import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

/**
 * FULL_DOCUMENTATION_EXPORT job
 *
 * Scans entire application and generates structured documentation dataset
 * Output: JSON chunks ready for Claude ingestion
 *
 * Payload: { scope?: "module" | "full", module_code?: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const payload = await req.json();
    const scope = payload.scope || "full";
    const moduleCode = payload.module_code;

    // 1. Load all pages from repository
    const pages = await base44.entities.PageInventory?.list?.() || [];
    console.log(`Loaded ${pages.length} pages`);

    // 2. Load features, controls, workflows grouped by page
    const features = await base44.entities.FeatureInventory?.list?.() || [];
    const controls = await base44.entities.ControlDictionary?.list?.() || [];
    const workflows = await base44.entities.WorkflowDocumentation?.list?.() || [];

    console.log(`Loaded ${features.length} features, ${controls.length} controls, ${workflows.length} workflows`);

    // 3. Filter by scope
    const filteredPages =
      scope === "module" && moduleCode ? pages.filter((p: any) => p.module === moduleCode) : pages;

    // 4. Build documentation chunks
    const chunks = buildDocumentationChunks(
      filteredPages,
      features,
      controls,
      workflows,
    );

    console.log(`Generated ${chunks.length} documentation chunks`);

    // 5. Store in generation run (optional - for tracking)
    const runCode = `export_${Date.now()}`;
    console.log(`Run code: ${runCode}`);

    return Response.json({
      success: true,
      run_code: runCode,
      scope,
      chunks_generated: chunks.length,
      chunks,
    });
  } catch (error) {
    console.error("Documentation export failed:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 },
    );
  }
});

function buildDocumentationChunks(pages: any[], features: any[], controls: any[], workflows: any[]) {
  const modules = new Map<string, any[]>();

  // Group pages by module
  for (const page of pages) {
    if (!modules.has(page.module)) {
      modules.set(page.module, []);
    }
    modules.get(page.module)!.push(page);
  }

  // Build chunks
  const chunks = [];
  let chunkIndex = 0;
  const totalChunks = modules.size;

  for (const [moduleName, modulePages] of modules) {
    const chunk = {
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      module_name: moduleName,
      content: {
        module: moduleName,
        pages: modulePages.map((page) => ({
          page_code: page.page_code,
          page_name: page.page_name,
          route: page.route,
          description: page.description,
          access_roles: page.access_roles || [],
          sections: buildPageSections(page, controls),
          fields: buildPageFields(page, controls),
          workflows: buildPageWorkflows(page, workflows),
          api_endpoints: buildApiEndpoints(page, features),
          dependencies_inbound: page.dependencies_inbound || [],
          dependencies_outbound: page.dependencies_outbound || [],
        })),
      },
    };

    chunks.push(chunk);
    chunkIndex++;
  }

  return chunks;
}

function buildPageSections(page: any, controls: any[]) {
  const pageControls = controls.filter((c) => c.page_code === page.page_code);

  return [
    {
      section_code: `${page.page_code}_controls`,
      controls: pageControls.map((c) => ({
        control_code: c.control_code,
        control_name: c.control_name,
        control_type: c.control_type,
        action_triggered: c.action_triggered,
        visible_roles: c.visible_roles || [],
        dependencies: c.dependencies || [],
      })),
    },
  ];
}

function buildPageFields(page: any, controls: any[]) {
  const pageControls = controls.filter((c) => c.page_code === page.page_code);

  return pageControls
    .filter((c) => c.control_type === "field")
    .map((c) => ({
      field_name: c.control_name,
      data_type: "string",
      required: c.validations?.length > 0 || false,
      validation_rules: c.validations || [],
    }));
}

function buildPageWorkflows(page: any, workflows: any[]) {
  return (page.related_workflows || [])
    .map((code: string) => workflows.find((w) => w.workflow_code === code))
    .filter(Boolean)
    .map((w: any) => ({
      workflow_code: w.workflow_code,
      workflow_name: w.workflow_name,
      trigger_event: w.trigger_event,
      states: (w.states || []).map((s: any) => ({
        state_code: s.state_code,
        state_name: s.state_name,
        next_states: s.next_states || [],
      })),
      transitions: (w.transitions || []).map((t: any) => ({
        from_state: t.from_state,
        to_state: t.to_state,
        trigger: t.trigger,
      })),
    }));
}

function buildApiEndpoints(page: any, features: any[]) {
  const pageFeatures = features.filter((f) => f.page_code === page.page_code);

  return pageFeatures.map((f) => ({
    endpoint: `POST /${page.module.toLowerCase()}/${f.feature_code.toLowerCase()}`,
    method: "POST",
    backend_service: f.backend_process,
    description: f.description,
  }));
}