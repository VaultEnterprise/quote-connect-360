import type {
  ControlDictionaryItem,
  FeatureInventoryItem,
  ManualSectionOutline,
  PageInventoryItem,
  WorkflowDocumentationItem,
} from "../shared/documentation_types";

export interface HelpAiChunkRecord {
  chunk_id: string;
  doc_type: "page" | "feature" | "control" | "workflow" | "troubleshooting" | "overview";
  source_code: string;
  title: string;
  route?: string | null;
  roles: string[];
  keywords: string[];
  body_markdown: string;
  body_plaintext: string;
  dependencies: string[];
  related_codes: string[];
  embedding_text: string;
}

export interface ScreenshotTargetRecord {
  screenshot_code: string;
  page_code: string;
  page_name: string;
  route: string;
  capture_type: "full_page" | "modal" | "tab" | "section";
  selector?: string | null;
  state_label: string;
  required_role: string;
  output_file_name: string;
  sort_order: number;
}

export interface DependencyGraphCacheRecord {
  graph_code: string;
  graph_name: string;
  nodes_json: unknown[];
  edges_json: unknown[];
  mermaid_text: string;
  generated_from_hash: string;
}

export interface GenerationRunRecord {
  run_code: string;
  application_name: string;
  version: string;
  run_type: "manual_export" | "helpai_ingestion" | "graph_generation" | "screenshot_mapping" | "full_build";
  status: "pending" | "running" | "completed" | "failed";
  output_path?: string | null;
  error_text?: string | null;
  metadata_json?: Record<string, unknown>;
}

export interface GenerationRunItemRecord {
  run_code: string;
  item_type: "page" | "feature" | "control" | "workflow" | "section" | "chunk" | "graph" | "screenshot";
  item_code: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  message?: string | null;
  sort_order: number;
  metadata_json?: Record<string, unknown>;
}

export interface DocumentationRepository {
  upsertPageInventory(rows: PageInventoryItem[]): Promise<void>;
  upsertFeatureInventory(rows: FeatureInventoryItem[]): Promise<void>;
  upsertControlDictionary(rows: ControlDictionaryItem[]): Promise<void>;
  upsertWorkflowDocumentation(rows: WorkflowDocumentationItem[]): Promise<void>;
  upsertWordSectionOutline(rows: ManualSectionOutline[]): Promise<void>;
  upsertScreenshotTargets(rows: ScreenshotTargetRecord[]): Promise<void>;
  upsertHelpAiChunks(rows: HelpAiChunkRecord[]): Promise<void>;
  upsertDependencyGraphCache(record: DependencyGraphCacheRecord): Promise<void>;

  createGenerationRun(record: GenerationRunRecord): Promise<void>;
  upsertGenerationRunItem(rows: GenerationRunItemRecord[]): Promise<void>;
  completeGenerationRun(runCode: string, outputPath?: string | null): Promise<void>;
  failGenerationRun(runCode: string, errorText: string): Promise<void>;

  getPageByCode(pageCode: string): Promise<PageInventoryItem | null>;
  listPages(): Promise<PageInventoryItem[]>;
  listFeaturesByPage(pageCode: string): Promise<FeatureInventoryItem[]>;
  listControlsByPage(pageCode: string): Promise<ControlDictionaryItem[]>;
  getWorkflowByCode(workflowCode: string): Promise<WorkflowDocumentationItem | null>;
  listWordSectionOutline(): Promise<ManualSectionOutline[]>;
  searchHelpAiChunks(queryText: string, limit?: number): Promise<HelpAiChunkRecord[]>;
}