import type {
  ControlDictionaryItem,
  FeatureInventoryItem,
  PageInventoryItem,
  WorkflowDocumentationItem,
} from "../shared/documentation_types";
import type { DependencyEdge, DependencyGraph, DependencyNode } from "./dependency_graph_types";

export class DependencyGraphGeneratorService {
  generate(
    pages: PageInventoryItem[],
    features: FeatureInventoryItem[],
    controls: ControlDictionaryItem[],
    workflows: WorkflowDocumentationItem[],
  ): DependencyGraph {
    const nodes: DependencyNode[] = [];
    const edges: DependencyEdge[] = [];

    const addNode = (node: DependencyNode) => {
      if (!nodes.find((n) => n.id === node.id)) nodes.push(node);
    };

    const addEdge = (edge: DependencyEdge) => {
      if (!edges.find((e) => e.from === edge.from && e.to === edge.to && e.label === edge.label)) {
        edges.push(edge);
      }
    };

    // Pages
    for (const page of pages) {
      addNode({ id: page.page_code, label: page.page_name, category: "page" });

      for (const child of page.child_pages) {
        addEdge({ from: page.page_code, to: child, label: "child_page" });
      }

      for (const service of page.backend_services) {
        addNode({ id: service, label: service, category: "service" });
        addEdge({ from: page.page_code, to: service, label: "uses_service" });
      }

      for (const entity of page.related_entities) {
        addNode({ id: entity, label: entity, category: "entity" });
        addEdge({ from: page.page_code, to: entity, label: "reads_or_writes" });
      }

      for (const wf of page.related_workflows) {
        addNode({ id: wf, label: wf, category: "workflow" });
        addEdge({ from: page.page_code, to: wf, label: "participates_in" });
      }
    }

    // Features
    for (const feature of features) {
      addNode({ id: feature.feature_code, label: feature.feature_name, category: "feature" });
      addEdge({ from: feature.page_code, to: feature.feature_code, label: "has_feature" });
    }

    // Controls
    for (const control of controls) {
      addNode({ id: control.control_code, label: control.control_name, category: "control" });
      addEdge({ from: control.page_code, to: control.control_code, label: "has_control" });

      for (const dep of control.dependencies) {
        addNode({ id: dep, label: dep, category: "service" });
        addEdge({ from: control.control_code, to: dep, label: "depends_on" });
      }
    }

    const mermaidLines = ["graph TD"];
    for (const edge of edges) {
      const label = edge.label ? `|${edge.label}|` : "";
      mermaidLines.push(`  ${sanitize(edge.from)} -->${label} ${sanitize(edge.to)}`);
    }

    return {
      nodes,
      edges,
      mermaid: mermaidLines.join("\n"),
    };
  }
}

function sanitize(input: string): string {
  return input.replace(/[^A-Za-z0-9_]/g, "_");
}