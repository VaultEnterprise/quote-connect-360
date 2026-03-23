import type {
  ControlDictionaryItem,
  DocumentationDataset,
  FeatureInventoryItem,
  PageInventoryItem,
  WorkflowDocumentationItem,
} from "../shared/documentation_types";

export interface DocxExportOptions {
  applicationName: string;
  manualTitle: string;
  version: string;
  author: string;
  generatedOnIso?: string;
  outputPath?: string;
}

export interface PageDocumentationContext {
  page: PageInventoryItem;
  features: FeatureInventoryItem[];
  controls: ControlDictionaryItem[];
  workflows: WorkflowDocumentationItem[];
}