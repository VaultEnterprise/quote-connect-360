import type { DocumentationRepository } from "./documentation_repository.types";

export abstract class BaseDocumentationRepository implements DocumentationRepository {
  abstract upsertPageInventory(rows: any[]): Promise<void>;
  abstract upsertFeatureInventory(rows: any[]): Promise<void>;
  abstract upsertControlDictionary(rows: any[]): Promise<void>;
  abstract upsertWorkflowDocumentation(rows: any[]): Promise<void>;
  abstract upsertWordSectionOutline(rows: any[]): Promise<void>;
  abstract upsertScreenshotTargets(rows: any[]): Promise<void>;
  abstract upsertHelpAiChunks(rows: any[]): Promise<void>;
  abstract upsertDependencyGraphCache(record: any): Promise<void>;
  abstract createGenerationRun(record: any): Promise<void>;
  abstract upsertGenerationRunItem(rows: any[]): Promise<void>;
  abstract completeGenerationRun(runCode: string, outputPath?: string | null): Promise<void>;
  abstract failGenerationRun(runCode: string, errorText: string): Promise<void>;
  abstract getPageByCode(pageCode: string): Promise<any>;
  abstract listPages(): Promise<any[]>;
  abstract listFeaturesByPage(pageCode: string): Promise<any[]>;
  abstract listControlsByPage(pageCode: string): Promise<any[]>;
  abstract getWorkflowByCode(workflowCode: string): Promise<any>;
  abstract listWordSectionOutline(): Promise<any[]>;
  abstract searchHelpAiChunks(queryText: string, limit?: number): Promise<any[]>;
}