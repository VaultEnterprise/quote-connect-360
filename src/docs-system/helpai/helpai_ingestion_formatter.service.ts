import type {
  ControlDictionaryItem,
  DocumentationDataset,
  FeatureInventoryItem,
  PageInventoryItem,
  WorkflowDocumentationItem,
} from "../shared/documentation_types";
import type { HelpAiChunk, HelpAiIngestionPayload } from "./helpai_types";

export class HelpAiIngestionFormatterService {
  format(dataset: DocumentationDataset, applicationName: string, version: string): HelpAiIngestionPayload {
    const chunks: HelpAiChunk[] = [
      ...dataset.pages.map((p) => this.fromPage(p, dataset)),
      ...dataset.features.map((f) => this.fromFeature(f, dataset)),
      ...dataset.controls.map((c) => this.fromControl(c, dataset)),
      ...dataset.workflows.map((w) => this.fromWorkflow(w)),
    ];

    return {
      application_name: applicationName,
      version,
      generated_on: new Date().toISOString(),
      chunks,
    };
  }

  private fromPage(page: PageInventoryItem, dataset: DocumentationDataset): HelpAiChunk {
    const controls = dataset.controls.filter((c) => c.page_code === page.page_code);
    const features = dataset.features.filter((f) => f.page_code === page.page_code);

    const body = [
      `# ${page.page_name}`,
      `Page code: ${page.page_code}`,
      `Route: ${page.route}`,
      `Module: ${page.module}`,
      `Purpose: ${page.description}`,
      `Roles: ${page.access_roles.join(", ")}`,
      `## Controls`,
      ...controls.map((c) => `- ${c.control_name}: ${c.action_triggered}`),
      `## Features`,
      ...features.map((f) => `- ${f.feature_name}: ${f.description}`),
    ].join("\n");

    return this.baseChunk({
      chunkId: `page-${page.page_code}`,
      docType: "page",
      sourceCode: page.page_code,
      title: page.page_name,
      route: page.route,
      roles: page.access_roles,
      keywords: [page.page_name, page.page_code, page.module, ...page.entry_points],
      body,
      dependencies: [...page.backend_services, ...page.related_entities, ...page.related_workflows],
      relatedCodes: [...controls.map((c) => c.control_code), ...features.map((f) => f.feature_code)],
    });
  }

  private fromFeature(feature: FeatureInventoryItem, dataset: DocumentationDataset): HelpAiChunk {
    const page = dataset.pages.find((p) => p.page_code === feature.page_code);

    const body = [
      `# ${feature.feature_name}`,
      `Feature code: ${feature.feature_code}`,
      `Page code: ${feature.page_code}`,
      `Description: ${feature.description}`,
      `Trigger type: ${feature.trigger_type}`,
      `Backend process: ${feature.backend_process}`,
      `Workflow impact: ${feature.workflow_impact.join(", ") || "None"}`,
      `Notification impact: ${feature.notification_impact.join(", ") || "None"}`,
      `Success result: ${feature.success_result}`,
      `Failure conditions: ${feature.failure_conditions.join(", ") || "None"}`,
    ].join("\n");

    return this.baseChunk({
      chunkId: `feature-${feature.feature_code}`,
      docType: "feature",
      sourceCode: feature.feature_code,
      title: feature.feature_name,
      route: page?.route,
      roles: feature.user_roles,
      keywords: [feature.feature_name, feature.feature_code, feature.feature_type, feature.trigger_type],
      body,
      dependencies: feature.dependencies,
      relatedCodes: [feature.page_code, ...feature.workflow_impact],
    });
  }

  private fromControl(control: ControlDictionaryItem, dataset: DocumentationDataset): HelpAiChunk {
    const page = dataset.pages.find((p) => p.page_code === control.page_code);

    const body = [
      `# ${control.control_name}`,
      `Control code: ${control.control_code}`,
      `Page code: ${control.page_code}`,
      `Control type: ${control.control_type}`,
      `Action triggered: ${control.action_triggered}`,
      `Visible roles: ${control.visible_roles.join(", ")}`,
      `Visible conditions: ${control.visible_conditions.join(", ") || "Always visible"}`,
      `Validations: ${control.validations.join(", ") || "None"}`,
      `Success behavior: ${control.success_behavior}`,
      `Error behavior: ${control.error_behavior}`,
      `Backend flow: ${control.backend_flow.join(" -> ")}`,
    ].join("\n");

    return this.baseChunk({
      chunkId: `control-${control.control_code}`,
      docType: "control",
      sourceCode: control.control_code,
      title: control.control_name,
      route: page?.route,
      roles: control.visible_roles,
      keywords: [control.control_name, control.control_code, control.control_type],
      body,
      dependencies: control.dependencies,
      relatedCodes: [control.page_code],
    });
  }

  private fromWorkflow(workflow: WorkflowDocumentationItem): HelpAiChunk {
    const body = [
      `# ${workflow.workflow_name}`,
      `Workflow code: ${workflow.workflow_code}`,
      `Description: ${workflow.description}`,
      `Trigger event: ${workflow.trigger_event}`,
      `States:`,
      ...workflow.states.map((s) => `- ${s.state_code} ${s.state_name}: actions=${s.available_actions.join(", ")}`),
      `Transitions:`,
      ...workflow.transitions.map((t) => `- ${t.from_state} -> ${t.to_state} by ${t.trigger}`),
    ].join("\n");

    return this.baseChunk({
      chunkId: `workflow-${workflow.workflow_code}`,
      docType: "workflow",
      sourceCode: workflow.workflow_code,
      title: workflow.workflow_name,
      route: undefined,
      roles: [...new Set(workflow.states.flatMap((s) => s.responsible_roles))],
      keywords: [workflow.workflow_name, workflow.workflow_code, "workflow", "state transition"],
      body,
      dependencies: workflow.notifications.map((n) => n.template),
      relatedCodes: workflow.states.map((s) => s.state_code),
    });
  }

  private baseChunk(args: {
    chunkId: string;
    docType: HelpAiChunk["doc_type"];
    sourceCode: string;
    title: string;
    route?: string;
    roles: string[];
    keywords: string[];
    body: string;
    dependencies: string[];
    relatedCodes: string[];
  }): HelpAiChunk {
    const bodyPlain = args.body.replace(/[#*`>-]/g, "").trim();

    return {
      chunk_id: args.chunkId,
      doc_type: args.docType,
      source_code: args.sourceCode,
      title: args.title,
      route: args.route,
      roles: args.roles,
      keywords: [...new Set(args.keywords.filter(Boolean))],
      body_markdown: args.body,
      body_plaintext: bodyPlain,
      dependencies: [...new Set(args.dependencies)],
      related_codes: [...new Set(args.relatedCodes)],
      embedding_text: [
        args.title,
        args.sourceCode,
        args.route ?? "",
        args.roles.join(" "),
        args.keywords.join(" "),
        bodyPlain,
        args.dependencies.join(" "),
        args.relatedCodes.join(" "),
      ].join("\n"),
    };
  }
}