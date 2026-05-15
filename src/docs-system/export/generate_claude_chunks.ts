#!/usr/bin/env node

/**
 * GENERATE_CLAUDE_CHUNKS
 *
 * Produces complete documentation chunks from dataset
 * Outputs formatted text files ready to paste into Claude
 *
 * Usage: npx ts-node generate_claude_chunks.ts
 */

import fs from "node:fs";
import path from "node:path";
import { PageInventorySeed } from "../seed/page_inventory.seed";
import { FeatureInventorySeed } from "../seed/feature_inventory.seed";
import { ControlDictionarySeed } from "../seed/control_dictionary.seed";
import { WorkflowDocumentationSeed } from "../seed/workflow_documentation.seed";
import { ManualGenerationPromptSeed } from "../seed/manual_generation_prompt.seed";

interface DocumentationChunk {
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

function buildDocumentationChunks(): DocumentationChunk[] {
  const modules = new Map<string, (typeof PageInventorySeed)>();

  // Group pages by module
  for (const page of PageInventorySeed) {
    if (!modules.has(page.module)) {
      modules.set(page.module, []);
    }
    modules.get(page.module)!.push(page);
  }

  // Build chunks
  const chunks: DocumentationChunk[] = [];
  let chunkIndex = 0;
  const totalChunks = modules.size;

  for (const [moduleName, modulePages] of modules) {
    const chunk: DocumentationChunk = {
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
      module_name: moduleName,
      content: {
        module: moduleName,
        pages: modulePages.map((page) => ({
          page_code: page.page_code,
          page_name: page.page_name,
          route: page.route,
          description: page.description,
          access_roles: page.access_roles,
          sections: buildPageSections(page),
          fields: buildPageFields(page),
          workflows: buildPageWorkflows(page),
          api_endpoints: buildApiEndpoints(page),
          dependencies_inbound: page.dependencies_inbound,
          dependencies_outbound: page.dependencies_outbound,
        })),
      },
    };

    chunks.push(chunk);
    chunkIndex++;
  }

  return chunks;
}

function buildPageSections(
  page: (typeof PageInventorySeed)[0],
): DocumentationChunk["content"]["pages"][0]["sections"] {
  const pageControls = ControlDictionarySeed.filter((c) => c.page_code === page.page_code);

  return [
    {
      section_code: `${page.page_code}_controls`,
      controls: pageControls.map((c) => ({
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

function buildPageFields(
  page: (typeof PageInventorySeed)[0],
): DocumentationChunk["content"]["pages"][0]["fields"] {
  const pageControls = ControlDictionarySeed.filter((c) => c.page_code === page.page_code);

  return pageControls
    .filter((c) => c.control_type === "field")
    .map((c) => ({
      field_name: c.control_name,
      data_type: "string",
      required: c.validations.length > 0,
      validation_rules: c.validations,
    }));
}

function buildPageWorkflows(
  page: (typeof PageInventorySeed)[0],
): DocumentationChunk["content"]["pages"][0]["workflows"] {
  return page.related_workflows
    .map((code) => WorkflowDocumentationSeed.find((w) => w.workflow_code === code))
    .filter(Boolean)
    .map((w) => ({
      workflow_code: w!.workflow_code,
      workflow_name: w!.workflow_name,
      trigger_event: w!.trigger_event,
      states: w!.states.map((s) => ({
        state_code: s.state_code,
        state_name: s.state_name,
        next_states: s.next_states,
      })),
      transitions: w!.transitions.map((t) => ({
        from_state: t.from_state,
        to_state: t.to_state,
        trigger: t.trigger,
      })),
    }));
}

function buildApiEndpoints(
  page: (typeof PageInventorySeed)[0],
): DocumentationChunk["content"]["pages"][0]["api_endpoints"] {
  const pageFeatures = FeatureInventorySeed.filter((f) => f.page_code === page.page_code);

  return pageFeatures.map((f) => ({
    endpoint: `POST /${page.module.toLowerCase()}/${f.feature_code.toLowerCase()}`,
    method: "POST",
    backend_service: f.backend_process,
    description: f.description,
  }));
}

function formatChunksForClaude(chunks: DocumentationChunk[]): string {
  const systemPrompt = ManualGenerationPromptSeed.prompt_text;

  let output = `# DOCUMENTATION GENERATION PROMPT FOR CLAUDE\n\n`;
  output += `## MASTER PROMPT\n\n`;
  output += systemPrompt;
  output += `\n\n---\n\n`;
  output += `## DATA CHUNKS\n\n`;
  output += `**Total Chunks:** ${chunks.length}\n\n`;

  for (const chunk of chunks) {
    output += `### CHUNK ${chunk.chunk_index + 1} of ${chunk.total_chunks}\n`;
    output += `**Module:** ${chunk.module_name}\n`;
    output += `**Pages:** ${chunk.content.pages.length}\n\n`;
    output += `\`\`\`json\n`;
    output += JSON.stringify(chunk, null, 2);
    output += `\n\`\`\`\n\n`;
    output += `---\n\n`;
  }

  return output;
}

function writeChunkFiles(chunks: DocumentationChunk[], outputDir: string): void {
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write master prompt
  const systemPrompt = ManualGenerationPromptSeed.prompt_text;
  fs.writeFileSync(path.join(outputDir, "00_MASTER_PROMPT.txt"), systemPrompt);

  // Write each chunk as separate JSON file
  for (const chunk of chunks) {
    const filename = `chunk_${String(chunk.chunk_index + 1).padStart(2, "0")}_${chunk.module_name.replace(/ /g, "_")}.json`;
    fs.writeFileSync(path.join(outputDir, filename), JSON.stringify(chunk, null, 2));
  }

  // Write concatenated file for easy pasting
  const concatenated = formatChunksForClaude(chunks);
  fs.writeFileSync(path.join(outputDir, "00_ALL_CHUNKS_FOR_CLAUDE.md"), concatenated);

  // Write import instructions
  const instructions = `# Documentation Export Instructions

## Files Generated

1. **00_MASTER_PROMPT.txt** - System prompt for Claude
2. **chunk_01_*.json, chunk_02_*.json, etc.** - Individual module chunks
3. **00_ALL_CHUNKS_FOR_CLAUDE.md** - All chunks concatenated (recommended for copying)

## How to Use

### Option A: Full Export (Recommended)
1. Open \`00_ALL_CHUNKS_FOR_CLAUDE.md\`
2. Copy entire contents
3. Paste into Claude
4. Ask Claude to generate manual using the structure

### Option B: One Chunk at a Time
1. Tell Claude: "Wait for all chunks before generating"
2. Paste chunk 1
3. Paste chunk 2
4. ... (continue for all chunks)
5. Tell Claude: "All chunks received. Now generate the complete manual"

## Claude Prompt

Use this prompt after pasting the chunks:

\`\`\`
You are generating a complete enterprise operations manual for a benefits platform.

You have been provided with structured data about:
- All modules and pages in the application
- All user controls and form fields
- All workflows and state machines
- All API endpoints and backend services
- All dependencies between components

Follow the MASTER PROMPT structure exactly.

Do NOT summarize or abbreviate.
Expand each section into:
- User workflows and step-by-step procedures
- Admin workflows
- UI behavior and error handling
- Validation rules and constraints
- System dependencies and integrations
- Edge cases and troubleshooting

Maintain the document structure from the outline.

Generate a 400-600 page operations manual suitable for:
- New employee training
- Support team reference
- System administrators
- Developers

Use clear headings, code examples, screenshots references, and diagrams.
\`\`\`

## Next Steps

1. Generate manual from chunks
2. Run \`npx ts-node example_orchestrator.ts\` to convert to .docx
3. Add screenshots (map provided in export)
4. Distribute to team
`;

  fs.writeFileSync(path.join(outputDir, "INSTRUCTIONS.md"), instructions);
}

async function main() {
  console.log("🚀 Generating documentation chunks for Claude...\n");

  const chunks = buildDocumentationChunks();
  console.log(`✓ Built ${chunks.length} chunks from ${PageInventorySeed.length} pages\n`);

  // Write files
  const outputDir = path.resolve("./docs-system/export/claude_chunks");
  writeChunkFiles(chunks, outputDir);
  console.log(`✓ Chunks written to ${outputDir}\n`);

  // Print summary
  console.log("📋 SUMMARY\n");
  console.log(`Total Modules: ${chunks.length}`);
  console.log(`Total Pages: ${PageInventorySeed.length}`);
  console.log(`Total Features: ${FeatureInventorySeed.length}`);
  console.log(`Total Controls: ${ControlDictionarySeed.length}`);
  console.log(`Total Workflows: ${WorkflowDocumentationSeed.length}\n`);

  console.log("📦 FILES CREATED:\n");
  console.log(`  - 00_MASTER_PROMPT.txt`);
  console.log(`  - 00_ALL_CHUNKS_FOR_CLAUDE.md (COPY THIS)`);
  for (let i = 0; i < chunks.length; i++) {
    console.log(`  - chunk_${String(i + 1).padStart(2, "0")}_${chunks[i].module_name}.json`);
  }
  console.log(`  - INSTRUCTIONS.md\n`);

  console.log("✅ READY FOR CLAUDE\n");
  console.log("Next: Open 00_ALL_CHUNKS_FOR_CLAUDE.md and paste into Claude");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});