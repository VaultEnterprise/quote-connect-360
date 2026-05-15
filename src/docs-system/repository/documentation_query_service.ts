import type { DocumentationRepository } from "./documentation_repository.types";
import type { DocumentationDataset } from "../shared/documentation_types";

/**
 * Convenience query service for assembling full documentation datasets
 * from the repository with all related pages, features, controls, and workflows
 */
export class DocumentationQueryService {
  constructor(private readonly repo: DocumentationRepository) {}

  /**
   * Loads complete documentation dataset from repository
   * Assembles pages + features + controls + workflows + sections
   */
  async loadFullDataset(masterPrompt: string): Promise<DocumentationDataset> {
    console.log("📖 Loading full documentation dataset...");

    const pages = await this.repo.listPages();
    console.log(`  ✓ ${pages.length} pages loaded`);

    const features = (
      await Promise.all(pages.map((p) => this.repo.listFeaturesByPage(p.page_code)))
    ).flat();
    console.log(`  ✓ ${features.length} features loaded`);

    const controls = (
      await Promise.all(pages.map((p) => this.repo.listControlsByPage(p.page_code)))
    ).flat();
    console.log(`  ✓ ${controls.length} controls loaded`);

    const sectionOutline = await this.repo.listWordSectionOutline();
    console.log(`  ✓ ${sectionOutline.length} sections loaded`);

    const workflowCodes = [...new Set(pages.flatMap((p) => p.related_workflows))];
    const workflows = (
      await Promise.all(workflowCodes.map((code) => this.repo.getWorkflowByCode(code)))
    ).filter(Boolean) as any[];
    console.log(`  ✓ ${workflows.length} workflows loaded`);

    return {
      pages,
      features,
      controls,
      workflows,
      sections: sectionOutline,
      master_prompt: masterPrompt,
    };
  }

  /**
   * Search HelpAI chunks by query term
   * Uses full-text search with ranking
   */
  async searchHelp(term: string, limit = 10) {
    return this.repo.searchHelpAiChunks(term, limit);
  }
}