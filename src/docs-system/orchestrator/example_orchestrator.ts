#!/usr/bin/env node

/**
 * DOCUMENTATION ORCHESTRATOR EXAMPLE
 *
 * This script demonstrates how to wire together the complete documentation system:
 * 1. Load seed data (pages, features, controls, workflows)
 * 2. Generate Word manual (.docx)
 * 3. Map screenshots for each page
 * 4. Generate dependency graph (Mermaid)
 * 5. Format for HelpAI ingestion
 *
 * Usage: npx ts-node example_orchestrator.ts
 */

import path from "node:path";
import { DocxExportGeneratorService } from "../export/docx_export_generator.service";
import { DependencyGraphGeneratorService } from "../graph/dependency_graph_generator.service";
import { HelpAiIngestionFormatterService } from "../helpai/helpai_ingestion_formatter.service";
import { ScreenshotMappingService } from "../screenshots/screenshot_mapping.service";
import {
  buildDocumentationDataset,
  calculateDatasetStats,
  validateDataset,
} from "./documentation_orchestrator_utils";

import { ControlDictionarySeed } from "../seed/control_dictionary.seed";
import { FeatureInventorySeed } from "../seed/feature_inventory.seed";
import { ManualGenerationPromptSeed } from "../seed/manual_generation_prompt.seed";
import { PageInventorySeed } from "../seed/page_inventory.seed";
import { WorkflowDocumentationSeed } from "../seed/workflow_documentation.seed";
import { WordSectionOutlineSeed } from "../seed/word_section_outline.seed";

async function run(): Promise<void> {
  console.log("🚀 Base44 Documentation Orchestrator");
  console.log("=====================================\n");

  // STEP 1: Build dataset from seeds
  console.log("📦 Building documentation dataset from seeds...");
  const dataset = buildDocumentationDataset({
    pages: PageInventorySeed,
    features: FeatureInventorySeed,
    controls: ControlDictionarySeed,
    workflows: WorkflowDocumentationSeed,
    sections: WordSectionOutlineSeed,
    master_prompt: ManualGenerationPromptSeed.prompt_text,
  });

  // STEP 2: Validate dataset
  console.log("✓ Dataset built");
  console.log("\n🔍 Validating dataset...");
  const validation = validateDataset(dataset);
  if (!validation.valid) {
    console.error("❌ Validation failed:");
    validation.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }
  console.log("✓ Dataset valid");

  // STEP 3: Calculate statistics
  console.log("\n📊 Calculating dataset statistics...");
  const stats = calculateDatasetStats(dataset);
  console.log(`  Pages: ${stats.total_pages}`);
  console.log(`  Features: ${stats.total_features}`);
  console.log(`  Controls: ${stats.total_controls}`);
  console.log(`  Workflows: ${stats.total_workflows}`);
  console.log(`  Roles: ${stats.total_roles}`);
  console.log(`  Modules: ${Object.keys(stats.pages_by_module).join(", ")}`);

  // STEP 4: Initialize services
  console.log("\n🔧 Initializing export services...");
  const docxService = new DocxExportGeneratorService();
  const screenshotService = new ScreenshotMappingService();
  const graphService = new DependencyGraphGeneratorService();
  const helpAiService = new HelpAiIngestionFormatterService();
  console.log("✓ Services initialized");

  // STEP 5: Generate Word manual
  console.log("\n📄 Generating Word manual (.docx)...");
  const docxPath = await docxService.generate(dataset, {
    applicationName: "Connect Quote 360",
    manualTitle: "Complete Operations Manual",
    version: "1.0.0",
    author: "Base44 Documentation Engine",
    outputPath: path.resolve(process.cwd(), "docs/Connect_Quote_360_Manual.docx"),
  });
  console.log(`✓ Manual exported: ${docxPath}`);

  // STEP 6: Map screenshots
  console.log("\n📸 Mapping screenshot targets...");
  const screenshotMap = screenshotService.buildTargets(dataset.pages);
  console.log(`✓ ${screenshotMap.length} pages mapped for screenshots`);
  console.log(`  Total screenshot targets: ${screenshotMap.reduce((acc, r) => acc + r.screenshots.length, 0)}`);

  // STEP 7: Generate dependency graph
  console.log("\n📊 Generating dependency graph (Mermaid)...");
  const graph = graphService.generate(dataset.pages, dataset.features, dataset.controls, dataset.workflows);
  console.log(`✓ Graph generated`);
  console.log(`  Nodes: ${graph.nodes.length}`);
  console.log(`  Edges: ${graph.edges.length}`);

  // STEP 8: Format for HelpAI ingestion
  console.log("\n🤖 Formatting for HelpAI ingestion...");
  const helpPayload = helpAiService.format(dataset, "Connect Quote 360", "1.0.0");
  console.log(`✓ HelpAI payload formatted`);
  console.log(`  Chunks: ${helpPayload.chunks.length}`);
  console.log(`  - Pages: ${helpPayload.chunks.filter((c) => c.doc_type === "page").length}`);
  console.log(`  - Features: ${helpPayload.chunks.filter((c) => c.doc_type === "feature").length}`);
  console.log(`  - Controls: ${helpPayload.chunks.filter((c) => c.doc_type === "control").length}`);
  console.log(`  - Workflows: ${helpPayload.chunks.filter((c) => c.doc_type === "workflow").length}`);

  // STEP 9: Output results
  console.log("\n✅ COMPLETE DOCUMENTATION PACKAGE GENERATED\n");
  console.log("Outputs:");
  console.log(`  1. Word Manual:       ${docxPath}`);
  console.log(`  2. Screenshot Map:    ${screenshotMap.length} pages`);
  console.log(`  3. Dependency Graph:  ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
  console.log(`  4. HelpAI Payload:    ${helpPayload.chunks.length} chunks`);

  console.log("\nNext steps:");
  console.log("  1. Review and edit Connect_Quote_360_Manual.docx");
  console.log("  2. Capture screenshots for each page (use screenshotMap)");
  console.log("  3. Embed dependency graph in documentation");
  console.log("  4. Ingest helpPayload into HelpAI system");
  console.log("  5. Distribute manual to team members");
}

run().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});