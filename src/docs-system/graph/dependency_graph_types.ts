export interface DependencyNode {
  id: string;
  label: string;
  category: "page" | "feature" | "control" | "workflow" | "service" | "entity";
}

export interface DependencyEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  mermaid: string;
}