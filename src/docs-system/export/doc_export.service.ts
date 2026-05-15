import type { DocumentationDataset } from "../shared/documentation_types";

export interface DocumentationChunk {
  chunk_index: number;
  total_chunks: number;
  module_name: string;
  content: {
    module: string;
    pages: Array<{
      page_code: string;
      page_name: string;
      route: string;
      description: string;
      access_roles: string[];
      sections: Array<{
        section_code: string;
        controls: Array<{
          control_code: string;
          control_name: string;
          control_type: string;
          action_triggered: string;
          visible_roles: string[];
          dependencies: string[];
        }>;
      }>;
      fields: Array<{
        field_name: string;
        data_type: string;
        required: boolean;
        validation_rules: string[];
      }>;
      workflows: Array<{
        workflow_code: string;
        workflow_name: string;
        trigger_event: string;
        states: Array<{
          state_code: string;
          state_name: string;
          next_states: string[];
        }>;
        transitions: Array<{
          from_state: string;
          to_state: string;
          trigger: string;
        }>;
      }>;
      api_endpoints: Array<{
        endpoint: string;
        method: string;
        backend_service: string;
        description: string;
      }>;
      dependencies_inbound: string[];
      dependencies_outbound: string[];
    }>;
  };
}

export class DocumentationExportService {
  /**
   * Exports dataset as chunked JSON documentation
   * Each chunk ~40-60k tokens for Claude compatibility
   */
  async exportAsChunks(
    dataset: DocumentationDataset,
    chunkSizeTokens = 50000,
  ): Promise<DocumentationChunk[]> {
    const chunks: DocumentationChunk[] = [];
    const modules = this.groupByModule(dataset);

    let chunkIndex = 0;
    const modules_array = Array.from(modules.entries());

    for (const [moduleName, modulePages] of modules_array) {
      const moduleChunks = this.buildModuleChunks(
        moduleName,
        modulePages,
        dataset,
        chunkIndex,
        modules_array.length,
      );

      chunks.push(...moduleChunks);
      chunkIndex += moduleChunks.length;
    }

    return chunks;
  }

  /**
   * Exports as single JSON object (for smaller systems)
   */
  async exportAsJson(dataset: DocumentationDataset): Promise<DocumentationChunk> {
    const modules = this.groupByModule(dataset);
    const content = {
      module: "Complete Application",
      pages: Array.from(modules.values()).flat(),
    };

    return {
      chunk_index: 0,
      total_chunks: 1,
      module_name: "full_export",
      content,
    };
  }

  /**
   * Exports as markdown for manual review
   */
  async exportAsMarkdown(dataset: DocumentationDataset): Promise<string> {
    const modules = this.groupByModule(dataset);
    let markdown = "# Complete System Documentation\n\n";

    for (const [moduleName, modulePages] of modules) {
      markdown += `## ${moduleName}\n\n`;

      for (const page of modulePages) {
        markdown += `### ${page.page_name} (\`${page.page_code}\`)\n\n`;
        markdown += `**Route:** \`${page.route}\`\n\n`;
        markdown += `**Description:** ${page.description}\n\n`;

        if (page.access_roles.length > 0) {
          markdown += `**Access Roles:** ${page.access_roles.join(", ")}\n\n`;
        }

        // Controls
        const pageControls = dataset.controls.filter((c) => c.page_code === page.page_code);
        if (pageControls.length > 0) {
          markdown += `#### Controls\n\n`;
          for (const control of pageControls) {
            markdown += `- **${control.control_name}** (\`${control.control_type}\`)\n`;
            markdown += `  - Action: ${control.action_triggered}\n`;
            markdown += `  - Success: ${control.success_behavior}\n`;
            markdown += `  - Error: ${control.error_behavior}\n\n`;
          }
        }

        // Workflows
        for (const workflowCode of page.related_workflows) {
          const workflow = dataset.workflows.find((w) => w.workflow_code === workflowCode);
          if (workflow) {
            markdown += `#### Workflow: ${workflow.workflow_name}\n\n`;
            markdown += `**States:** ${workflow.states.map((s) => s.state_name).join(" → ")}\n\n`;
          }
        }

        // Dependencies
        if (page.dependencies_inbound.length > 0) {
          markdown += `**Depends On:** ${page.dependencies_inbound.join(", ")}\n\n`;
        }
        if (page.dependencies_outbound.length > 0) {
          markdown += `**Feeds Into:** ${page.dependencies_outbound.join(", ")}\n\n`;
        }
      }
    }

    return markdown;
  }

  private groupByModule(
    dataset: DocumentationDataset,
  ): Map<string, (typeof dataset.pages)> {
    const modules = new Map<string, (typeof dataset.pages)>();

    for (const page of dataset.pages) {
      if (!modules.has(page.module)) {
        modules.set(page.module, []);
      }
      modules.get(page.module)!.push(page);
    }

    return modules;
  }

  private buildModuleChunks(
    moduleName: string,
    modulePages: (typeof DocumentationExportService.prototype.buildModuleChunks),
    dataset: DocumentationDataset,
    chunkIndex: number,
    totalModules: number,
  ): DocumentationChunk[] {
    const chunks: DocumentationChunk[] = [];

    const enrichedPages = modulePages.map((page) => ({
      page_code: page.page_code,
      page_name: page.page_name,
      route: page.route,
      description: page.description,
      access_roles: page.access_roles,
      sections: this.buildPageSections(page, dataset),
      fields: this.buildPageFields(page, dataset),
      workflows: this.buildPageWorkflows(page, dataset),
      api_endpoints: this.buildApiEndpoints(page, dataset),
      dependencies_inbound: page.dependencies_inbound,
      dependencies_outbound: page.dependencies_outbound,
    }));

    chunks.push({
      chunk_index: chunkIndex,
      total_chunks: totalModules,
      module_name: moduleName,
      content: {
        module: moduleName,
        pages: enrichedPages,
      },
    });

    return chunks;
  }

  private buildPageSections(
    page: any,
    dataset: DocumentationDataset,
  ): DocumentationChunk["content"]["pages"][0]["sections"] {
    const controls = dataset.controls.filter((c) => c.page_code === page.page_code);

    return [
      {
        section_code: `${page.page_code}_controls`,
        controls: controls.map((c) => ({
          control_code: c.control_code,
          control_name: c.control_name,
          control_type: c.control_type,
          action_triggered: c.action_triggered,
          visible_roles: c.visible_roles,
          dependencies: c.dependencies,
        })),
      },
    ];
  }

  private buildPageFields(
    page: any,
    dataset: DocumentationDataset,
  ): DocumentationChunk["content"]["pages"][0]["fields"] {
    const controls = dataset.controls.filter((c) => c.page_code === page.page_code);
    return controls
      .filter((c) => c.control_type === "field")
      .map((c) => ({
        field_name: c.control_name,
        data_type: "string", // Would need to be enriched from entity schema
        required: c.validations.length > 0,
        validation_rules: c.validations,
      }));
  }

  private buildPageWorkflows(
    page: any,
    dataset: DocumentationDataset,
  ): DocumentationChunk["content"]["pages"][0]["workflows"] {
    return page.related_workflows
      .map((code: string) => dataset.workflows.find((w) => w.workflow_code === code))
      .filter(Boolean)
      .map((w: any) => ({
        workflow_code: w.workflow_code,
        workflow_name: w.workflow_name,
        trigger_event: w.trigger_event,
        states: w.states.map((s: any) => ({
          state_code: s.state_code,
          state_name: s.state_name,
          next_states: s.next_states,
        })),
        transitions: w.transitions.map((t: any) => ({
          from_state: t.from_state,
          to_state: t.to_state,
          trigger: t.trigger,
        })),
      }));
  }

  private buildApiEndpoints(
    page: any,
    dataset: DocumentationDataset,
  ): DocumentationChunk["content"]["pages"][0]["api_endpoints"] {
    const features = dataset.features.filter((f) => f.page_code === page.page_code);
    return features.map((f) => ({
      endpoint: `POST /${page.module.toLowerCase()}/${f.feature_code.toLowerCase()}`,
      method: "POST",
      backend_service: f.backend_process,
      description: f.description,
    }));
  }
}