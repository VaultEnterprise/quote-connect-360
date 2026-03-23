import { PageInventorySeed } from "../seed/page_inventory.seed";
import { FeatureInventorySeed } from "../seed/feature_inventory.seed";
import { ControlDictionarySeed } from "../seed/control_dictionary.seed";
import { WorkflowDocumentationSeed } from "../seed/workflow_documentation.seed";

export class SeedOrchestrator {
  async loadAllSeeds(base44: any): Promise<{
    success: boolean;
    counts: Record<string, number>;
    errors: any[];
  }> {
    const counts: Record<string, number> = {};
    const errors: any[] = [];

    try {
      console.log("Loading seed data...\n");

      // Load pages
      console.log(`Loading ${PageInventorySeed.length} pages...`);
      const pageResults = await base44.asServiceRole.entities.PageInventory?.bulkCreate?.(
        PageInventorySeed,
      );
      counts.pages = pageResults?.length || PageInventorySeed.length;
      console.log(`  ✓ ${counts.pages} pages loaded\n`);

      // Load features
      console.log(`Loading ${FeatureInventorySeed.length} features...`);
      const featureResults = await base44.asServiceRole.entities.FeatureInventory?.bulkCreate?.(
        FeatureInventorySeed,
      );
      counts.features = featureResults?.length || FeatureInventorySeed.length;
      console.log(`  ✓ ${counts.features} features loaded\n`);

      // Load controls
      console.log(`Loading ${ControlDictionarySeed.length} controls...`);
      const controlResults = await base44.asServiceRole.entities.ControlDictionary?.bulkCreate?.(
        ControlDictionarySeed,
      );
      counts.controls = controlResults?.length || ControlDictionarySeed.length;
      console.log(`  ✓ ${counts.controls} controls loaded\n`);

      // Load workflows
      console.log(`Loading ${WorkflowDocumentationSeed.length} workflows...`);
      const workflowResults = await base44.asServiceRole.entities.WorkflowDocumentation?.bulkCreate?.(
        WorkflowDocumentationSeed,
      );
      counts.workflows = workflowResults?.length || WorkflowDocumentationSeed.length;
      console.log(`  ✓ ${counts.workflows} workflows loaded\n`);

      return { success: true, counts, errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Error: ${message}`);
      errors.push({ entity: "seeds", error: message });
      return { success: false, counts, errors };
    }
  }

  async cleanupSeeds(base44: any): Promise<{ success: boolean; deleted: Record<string, number> }> {
    const deleted: Record<string, number> = {};

    try {
      console.log("Cleaning up existing seed data...\n");

      const entities = ["PageInventory", "FeatureInventory", "ControlDictionary", "WorkflowDocumentation"];

      for (const entity of entities) {
        const records = await base44.asServiceRole.entities[entity]?.list?.();
        const count = records?.length || 0;

        if (count > 0) {
          for (const record of records) {
            await base44.asServiceRole.entities[entity]?.delete?.(record.id);
          }
          deleted[entity] = count;
          console.log(`  ✓ Deleted ${count} ${entity} records`);
        }
      }

      console.log();
      return { success: true, deleted };
    } catch (error) {
      console.error(`Error during cleanup: ${error}`);
      return { success: false, deleted };
    }
  }
}