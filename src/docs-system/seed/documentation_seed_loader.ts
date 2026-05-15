import { ControlDictionarySeed } from "./control_dictionary.seed";
import { FeatureInventorySeed } from "./feature_inventory.seed";
import { ManualGenerationPromptSeed } from "./manual_generation_prompt.seed";
import { PageInventorySeed } from "./page_inventory.seed";
import { WorkflowDocumentationSeed } from "./workflow_documentation.seed";
import { WordSectionOutlineSeed } from "./word_section_outline.seed";

export interface SeedWriter {
  upsertMany: <T>(tableName: string, rows: T[], keyFields: string[]) => Promise<void>;
  upsertOne: <T>(tableName: string, row: T, keyFields: string[]) => Promise<void>;
}

export class DocumentationSeedLoader {
  constructor(private readonly writer: SeedWriter) {}

  async run(): Promise<void> {
    console.log("[Seed] Loading documentation seeds...");

    await this.writer.upsertOne("doc_manual_generation_prompts", ManualGenerationPromptSeed, ["prompt_code"]);
    console.log("✓ Manual generation prompt seeded");

    await this.writer.upsertMany("doc_page_inventory", PageInventorySeed, ["page_code"]);
    console.log("✓ Page inventory seeded");

    await this.writer.upsertMany("doc_feature_inventory", FeatureInventorySeed, ["feature_code"]);
    console.log("✓ Feature inventory seeded");

    await this.writer.upsertMany("doc_control_dictionary", ControlDictionarySeed, ["control_code"]);
    console.log("✓ Control dictionary seeded");

    await this.writer.upsertMany("doc_workflow_documentation", WorkflowDocumentationSeed, ["workflow_code"]);
    console.log("✓ Workflow documentation seeded");

    await this.writer.upsertMany("doc_word_section_outline", WordSectionOutlineSeed, ["section_code"]);
    console.log("✓ Word section outline seeded");

    console.log("[Seed] Documentation seeds loaded successfully");
  }
}