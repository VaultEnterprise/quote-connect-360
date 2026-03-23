import type { DbAdapter } from "./db_adapter";
import type {
  DependencyGraphCacheRecord,
  DocumentationRepository,
  GenerationRunItemRecord,
  GenerationRunRecord,
  HelpAiChunkRecord,
  ScreenshotTargetRecord,
} from "./documentation_repository.types";
import type {
  ControlDictionaryItem,
  FeatureInventoryItem,
  ManualSectionOutline,
  PageInventoryItem,
  WorkflowDocumentationItem,
} from "../shared/documentation_types";

export class PostgresDocumentationRepository implements DocumentationRepository {
  constructor(private readonly db: DbAdapter) {}

  async upsertPageInventory(rows: PageInventoryItem[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_page_inventory (
            page_code, page_name, route, parent_page_code, module, page_type,
            access_roles, is_hidden, entry_points, child_pages, related_workflows,
            related_entities, backend_services, dependencies_inbound,
            dependencies_outbound, description, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6,
            $7::jsonb, $8, $9::jsonb, $10::jsonb, $11::jsonb,
            $12::jsonb, $13::jsonb, $14::jsonb,
            $15::jsonb, $16, NOW()
          )
          ON CONFLICT (page_code) DO UPDATE SET
            page_name = EXCLUDED.page_name,
            route = EXCLUDED.route,
            parent_page_code = EXCLUDED.parent_page_code,
            module = EXCLUDED.module,
            page_type = EXCLUDED.page_type,
            access_roles = EXCLUDED.access_roles,
            is_hidden = EXCLUDED.is_hidden,
            entry_points = EXCLUDED.entry_points,
            child_pages = EXCLUDED.child_pages,
            related_workflows = EXCLUDED.related_workflows,
            related_entities = EXCLUDED.related_entities,
            backend_services = EXCLUDED.backend_services,
            dependencies_inbound = EXCLUDED.dependencies_inbound,
            dependencies_outbound = EXCLUDED.dependencies_outbound,
            description = EXCLUDED.description,
            updated_at = NOW()
          `,
          [
            row.page_code,
            row.page_name,
            row.route,
            row.parent_page_code ?? null,
            row.module,
            row.page_type,
            JSON.stringify(row.access_roles ?? []),
            row.is_hidden,
            JSON.stringify(row.entry_points ?? []),
            JSON.stringify(row.child_pages ?? []),
            JSON.stringify(row.related_workflows ?? []),
            JSON.stringify(row.related_entities ?? []),
            JSON.stringify(row.backend_services ?? []),
            JSON.stringify(row.dependencies_inbound ?? []),
            JSON.stringify(row.dependencies_outbound ?? []),
            row.description,
          ],
        );
      }
    });
  }

  async upsertFeatureInventory(rows: FeatureInventoryItem[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_feature_inventory (
            feature_code, feature_name, page_code, feature_type, trigger_type,
            user_roles, description, input_data, output_data, backend_process,
            workflow_impact, notification_impact, validation_rules,
            success_result, failure_conditions, dependencies, audit_logged, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6::jsonb, $7, $8::jsonb, $9::jsonb, $10,
            $11::jsonb, $12::jsonb, $13::jsonb,
            $14, $15::jsonb, $16::jsonb, $17, NOW()
          )
          ON CONFLICT (feature_code) DO UPDATE SET
            feature_name = EXCLUDED.feature_name,
            page_code = EXCLUDED.page_code,
            feature_type = EXCLUDED.feature_type,
            trigger_type = EXCLUDED.trigger_type,
            user_roles = EXCLUDED.user_roles,
            description = EXCLUDED.description,
            input_data = EXCLUDED.input_data,
            output_data = EXCLUDED.output_data,
            backend_process = EXCLUDED.backend_process,
            workflow_impact = EXCLUDED.workflow_impact,
            notification_impact = EXCLUDED.notification_impact,
            validation_rules = EXCLUDED.validation_rules,
            success_result = EXCLUDED.success_result,
            failure_conditions = EXCLUDED.failure_conditions,
            dependencies = EXCLUDED.dependencies,
            audit_logged = EXCLUDED.audit_logged,
            updated_at = NOW()
          `,
          [
            row.feature_code,
            row.feature_name,
            row.page_code,
            row.feature_type,
            row.trigger_type,
            JSON.stringify(row.user_roles ?? []),
            row.description,
            JSON.stringify(row.input_data ?? []),
            JSON.stringify(row.output_data ?? []),
            row.backend_process,
            JSON.stringify(row.workflow_impact ?? []),
            JSON.stringify(row.notification_impact ?? []),
            JSON.stringify(row.validation_rules ?? []),
            row.success_result,
            JSON.stringify(row.failure_conditions ?? []),
            JSON.stringify(row.dependencies ?? []),
            row.audit_logged,
          ],
        );
      }
    });
  }

  async upsertControlDictionary(rows: ControlDictionaryItem[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_control_dictionary (
            control_code, page_code, control_name, control_type, visible_roles,
            visible_conditions, action_triggered, backend_flow, data_written,
            data_read, validations, success_behavior, error_behavior,
            dependencies, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5::jsonb,
            $6::jsonb, $7, $8::jsonb, $9::jsonb,
            $10::jsonb, $11::jsonb, $12, $13,
            $14::jsonb, NOW()
          )
          ON CONFLICT (control_code) DO UPDATE SET
            page_code = EXCLUDED.page_code,
            control_name = EXCLUDED.control_name,
            control_type = EXCLUDED.control_type,
            visible_roles = EXCLUDED.visible_roles,
            visible_conditions = EXCLUDED.visible_conditions,
            action_triggered = EXCLUDED.action_triggered,
            backend_flow = EXCLUDED.backend_flow,
            data_written = EXCLUDED.data_written,
            data_read = EXCLUDED.data_read,
            validations = EXCLUDED.validations,
            success_behavior = EXCLUDED.success_behavior,
            error_behavior = EXCLUDED.error_behavior,
            dependencies = EXCLUDED.dependencies,
            updated_at = NOW()
          `,
          [
            row.control_code,
            row.page_code,
            row.control_name,
            row.control_type,
            JSON.stringify(row.visible_roles ?? []),
            JSON.stringify(row.visible_conditions ?? []),
            row.action_triggered,
            JSON.stringify(row.backend_flow ?? []),
            JSON.stringify(row.data_written ?? []),
            JSON.stringify(row.data_read ?? []),
            JSON.stringify(row.validations ?? []),
            row.success_behavior,
            row.error_behavior,
            JSON.stringify(row.dependencies ?? []),
          ],
        );
      }
    });
  }

  async upsertWorkflowDocumentation(rows: WorkflowDocumentationItem[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_workflow_documentation (
            workflow_code, workflow_name, description, trigger_event, updated_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (workflow_code) DO UPDATE SET
            workflow_name = EXCLUDED.workflow_name,
            description = EXCLUDED.description,
            trigger_event = EXCLUDED.trigger_event,
            updated_at = NOW()
          `,
          [row.workflow_code, row.workflow_name, row.description, row.trigger_event],
        );

        await tx.query(`DELETE FROM doc_workflow_states WHERE workflow_code = $1`, [row.workflow_code]);
        await tx.query(`DELETE FROM doc_workflow_transitions WHERE workflow_code = $1`, [row.workflow_code]);
        await tx.query(`DELETE FROM doc_workflow_notifications WHERE workflow_code = $1`, [row.workflow_code]);
        await tx.query(`DELETE FROM doc_workflow_exceptions WHERE workflow_code = $1`, [row.workflow_code]);

        for (let i = 0; i < row.states.length; i++) {
          const state = row.states[i];
          await tx.query(
            `
            INSERT INTO doc_workflow_states (
              workflow_code, state_code, state_name, available_actions,
              responsible_roles, next_states, sort_order, updated_at
            )
            VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, NOW())
            `,
            [
              row.workflow_code,
              state.state_code,
              state.state_name,
              JSON.stringify(state.available_actions ?? []),
              JSON.stringify(state.responsible_roles ?? []),
              JSON.stringify(state.next_states ?? []),
              i,
            ],
          );
        }

        for (let i = 0; i < row.transitions.length; i++) {
          const transition = row.transitions[i];
          await tx.query(
            `
            INSERT INTO doc_workflow_transitions (
              workflow_code, from_state, to_state, trigger,
              validations, actions, sort_order, updated_at
            )
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, NOW())
            `,
            [
              row.workflow_code,
              transition.from_state,
              transition.to_state,
              transition.trigger,
              JSON.stringify(transition.validations ?? []),
              JSON.stringify(transition.actions ?? []),
              i,
            ],
          );
        }

        for (let i = 0; i < row.notifications.length; i++) {
          const n = row.notifications[i];
          await tx.query(
            `
            INSERT INTO doc_workflow_notifications (
              workflow_code, trigger, template, recipients, sort_order, updated_at
            )
            VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
            `,
            [
              row.workflow_code,
              n.trigger,
              n.template,
              JSON.stringify(n.recipients ?? []),
              i,
            ],
          );
        }

        for (let i = 0; i < row.exceptions.length; i++) {
          const e = row.exceptions[i];
          await tx.query(
            `
            INSERT INTO doc_workflow_exceptions (
              workflow_code, condition, resolution, sort_order, updated_at
            )
            VALUES ($1, $2, $3, $4, NOW())
            `,
            [row.workflow_code, e.condition, e.resolution, i],
          );
        }
      }
    });
  }

  async upsertWordSectionOutline(rows: ManualSectionOutline[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_word_section_outline (
            section_code, heading_level, title, description, sort_order, is_repeatable, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (section_code) DO UPDATE SET
            heading_level = EXCLUDED.heading_level,
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            sort_order = EXCLUDED.sort_order,
            is_repeatable = EXCLUDED.is_repeatable,
            updated_at = NOW()
          `,
          [
            row.section_code,
            row.heading_level,
            row.title,
            row.description,
            row.sort_order,
            row.is_repeatable,
          ],
        );
      }
    });
  }

  async upsertScreenshotTargets(rows: ScreenshotTargetRecord[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_screenshot_targets (
            screenshot_code, page_code, page_name, route, capture_type,
            selector, state_label, required_role, output_file_name, sort_order, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (screenshot_code) DO UPDATE SET
            page_code = EXCLUDED.page_code,
            page_name = EXCLUDED.page_name,
            route = EXCLUDED.route,
            capture_type = EXCLUDED.capture_type,
            selector = EXCLUDED.selector,
            state_label = EXCLUDED.state_label,
            required_role = EXCLUDED.required_role,
            output_file_name = EXCLUDED.output_file_name,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
          `,
          [
            row.screenshot_code,
            row.page_code,
            row.page_name,
            row.route,
            row.capture_type,
            row.selector ?? null,
            row.state_label,
            row.required_role,
            row.output_file_name,
            row.sort_order,
          ],
        );
      }
    });
  }

  async upsertHelpAiChunks(rows: HelpAiChunkRecord[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_helpai_chunks (
            chunk_id, doc_type, source_code, title, route, roles, keywords,
            body_markdown, body_plaintext, dependencies, related_codes,
            embedding_text, updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb,
            $8, $9, $10::jsonb, $11::jsonb,
            $12, NOW()
          )
          ON CONFLICT (chunk_id) DO UPDATE SET
            doc_type = EXCLUDED.doc_type,
            source_code = EXCLUDED.source_code,
            title = EXCLUDED.title,
            route = EXCLUDED.route,
            roles = EXCLUDED.roles,
            keywords = EXCLUDED.keywords,
            body_markdown = EXCLUDED.body_markdown,
            body_plaintext = EXCLUDED.body_plaintext,
            dependencies = EXCLUDED.dependencies,
            related_codes = EXCLUDED.related_codes,
            embedding_text = EXCLUDED.embedding_text,
            updated_at = NOW()
          `,
          [
            row.chunk_id,
            row.doc_type,
            row.source_code,
            row.title,
            row.route ?? null,
            JSON.stringify(row.roles ?? []),
            JSON.stringify(row.keywords ?? []),
            row.body_markdown,
            row.body_plaintext,
            JSON.stringify(row.dependencies ?? []),
            JSON.stringify(row.related_codes ?? []),
            row.embedding_text,
          ],
        );
      }
    });
  }

  async upsertDependencyGraphCache(record: DependencyGraphCacheRecord): Promise<void> {
    await this.db.query(
      `
      INSERT INTO doc_dependency_graph_cache (
        graph_code, graph_name, nodes_json, edges_json,
        mermaid_text, generated_from_hash, generated_at, updated_at
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, NOW(), NOW())
      ON CONFLICT (graph_code) DO UPDATE SET
        graph_name = EXCLUDED.graph_name,
        nodes_json = EXCLUDED.nodes_json,
        edges_json = EXCLUDED.edges_json,
        mermaid_text = EXCLUDED.mermaid_text,
        generated_from_hash = EXCLUDED.generated_from_hash,
        generated_at = NOW(),
        updated_at = NOW()
      `,
      [
        record.graph_code,
        record.graph_name,
        JSON.stringify(record.nodes_json ?? []),
        JSON.stringify(record.edges_json ?? []),
        record.mermaid_text,
        record.generated_from_hash,
      ],
    );
  }

  async createGenerationRun(record: GenerationRunRecord): Promise<void> {
    await this.db.query(
      `
      INSERT INTO doc_generation_runs (
        run_code, application_name, version, run_type, status,
        output_path, error_text, metadata_json, started_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW(), NOW())
      ON CONFLICT (run_code) DO UPDATE SET
        application_name = EXCLUDED.application_name,
        version = EXCLUDED.version,
        run_type = EXCLUDED.run_type,
        status = EXCLUDED.status,
        output_path = EXCLUDED.output_path,
        error_text = EXCLUDED.error_text,
        metadata_json = EXCLUDED.metadata_json,
        updated_at = NOW()
      `,
      [
        record.run_code,
        record.application_name,
        record.version,
        record.run_type,
        record.status,
        record.output_path ?? null,
        record.error_text ?? null,
        JSON.stringify(record.metadata_json ?? {}),
      ],
    );
  }

  async upsertGenerationRunItem(rows: GenerationRunItemRecord[]): Promise<void> {
    if (!rows.length) return;

    await this.db.transaction(async (tx) => {
      for (const row of rows) {
        await tx.query(
          `
          INSERT INTO doc_generation_run_items (
            run_code, item_type, item_code, status, message, sort_order, metadata_json, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
          ON CONFLICT (run_code, item_type, item_code) DO UPDATE SET
            status = EXCLUDED.status,
            message = EXCLUDED.message,
            sort_order = EXCLUDED.sort_order,
            metadata_json = EXCLUDED.metadata_json,
            updated_at = NOW()
          `,
          [
            row.run_code,
            row.item_type,
            row.item_code,
            row.status,
            row.message ?? null,
            row.sort_order,
            JSON.stringify(row.metadata_json ?? {}),
          ],
        );
      }
    });
  }

  async completeGenerationRun(runCode: string, outputPath?: string | null): Promise<void> {
    await this.db.query(
      `
      UPDATE doc_generation_runs
      SET status = 'completed',
          output_path = COALESCE($2, output_path),
          completed_at = NOW(),
          updated_at = NOW()
      WHERE run_code = $1
      `,
      [runCode, outputPath ?? null],
    );
  }

  async failGenerationRun(runCode: string, errorText: string): Promise<void> {
    await this.db.query(
      `
      UPDATE doc_generation_runs
      SET status = 'failed',
          error_text = $2,
          completed_at = NOW(),
          updated_at = NOW()
      WHERE run_code = $1
      `,
      [runCode, errorText],
    );
  }

  async getPageByCode(pageCode: string): Promise<PageInventoryItem | null> {
    const result = await this.db.query<any>(
      `SELECT * FROM doc_page_inventory WHERE page_code = $1 LIMIT 1`,
      [pageCode],
    );
    return result.rows[0] ? this.mapPage(result.rows[0]) : null;
  }

  async listPages(): Promise<PageInventoryItem[]> {
    const result = await this.db.query<any>(
      `SELECT * FROM doc_page_inventory ORDER BY module, page_code`,
    );
    return result.rows.map((r) => this.mapPage(r));
  }

  async listFeaturesByPage(pageCode: string): Promise<FeatureInventoryItem[]> {
    const result = await this.db.query<any>(
      `SELECT * FROM doc_feature_inventory WHERE page_code = $1 ORDER BY feature_code`,
      [pageCode],
    );
    return result.rows.map((r) => this.mapFeature(r));
  }

  async listControlsByPage(pageCode: string): Promise<ControlDictionaryItem[]> {
    const result = await this.db.query<any>(
      `SELECT * FROM doc_control_dictionary WHERE page_code = $1 ORDER BY control_code`,
      [pageCode],
    );
    return result.rows.map((r) => this.mapControl(r));
  }

  async getWorkflowByCode(workflowCode: string): Promise<WorkflowDocumentationItem | null> {
    const header = await this.db.query<any>(
      `SELECT * FROM doc_workflow_documentation WHERE workflow_code = $1 LIMIT 1`,
      [workflowCode],
    );
    if (!header.rows[0]) return null;

    const [states, transitions, notifications, exceptions] = await Promise.all([
      this.db.query<any>(
        `SELECT * FROM doc_workflow_states WHERE workflow_code = $1 ORDER BY sort_order, state_code`,
        [workflowCode],
      ),
      this.db.query<any>(
        `SELECT * FROM doc_workflow_transitions WHERE workflow_code = $1 ORDER BY sort_order, from_state, to_state`,
        [workflowCode],
      ),
      this.db.query<any>(
        `SELECT * FROM doc_workflow_notifications WHERE workflow_code = $1 ORDER BY sort_order, template`,
        [workflowCode],
      ),
      this.db.query<any>(
        `SELECT * FROM doc_workflow_exceptions WHERE workflow_code = $1 ORDER BY sort_order, condition`,
        [workflowCode],
      ),
    ]);

    return {
      workflow_code: header.rows[0].workflow_code,
      workflow_name: header.rows[0].workflow_name,
      description: header.rows[0].description,
      trigger_event: header.rows[0].trigger_event,
      states: states.rows.map((r) => ({
        state_code: r.state_code,
        state_name: r.state_name,
        available_actions: r.available_actions ?? [],
        responsible_roles: r.responsible_roles ?? [],
        next_states: r.next_states ?? [],
      })),
      transitions: transitions.rows.map((r) => ({
        from_state: r.from_state,
        to_state: r.to_state,
        trigger: r.trigger,
        validations: r.validations ?? [],
        actions: r.actions ?? [],
      })),
      notifications: notifications.rows.map((r) => ({
        trigger: r.trigger,
        template: r.template,
        recipients: r.recipients ?? [],
      })),
      exceptions: exceptions.rows.map((r) => ({
        condition: r.condition,
        resolution: r.resolution,
      })),
    };
  }

  async listWordSectionOutline(): Promise<ManualSectionOutline[]> {
    const result = await this.db.query<any>(
      `SELECT * FROM doc_word_section_outline ORDER BY sort_order, section_code`,
    );
    return result.rows.map((r) => ({
      section_code: r.section_code,
      heading_level: r.heading_level,
      title: r.title,
      description: r.description,
      sort_order: r.sort_order,
      is_repeatable: r.is_repeatable,
    }));
  }

  async searchHelpAiChunks(queryText: string, limit = 10): Promise<HelpAiChunkRecord[]> {
    const result = await this.db.query<any>(
      `
      SELECT *
      FROM doc_helpai_chunks
      WHERE search_vector @@ plainto_tsquery('english', $1)
         OR title ILIKE '%' || $1 || '%'
         OR source_code ILIKE '%' || $1 || '%'
      ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC, title
      LIMIT $2
      `,
      [queryText, limit],
    );

    return result.rows.map((r) => ({
      chunk_id: r.chunk_id,
      doc_type: r.doc_type,
      source_code: r.source_code,
      title: r.title,
      route: r.route,
      roles: r.roles ?? [],
      keywords: r.keywords ?? [],
      body_markdown: r.body_markdown,
      body_plaintext: r.body_plaintext,
      dependencies: r.dependencies ?? [],
      related_codes: r.related_codes ?? [],
      embedding_text: r.embedding_text,
    }));
  }

  private mapPage(r: any): PageInventoryItem {
    return {
      page_code: r.page_code,
      page_name: r.page_name,
      route: r.route,
      parent_page_code: r.parent_page_code,
      module: r.module,
      page_type: r.page_type,
      access_roles: r.access_roles ?? [],
      is_hidden: r.is_hidden,
      entry_points: r.entry_points ?? [],
      child_pages: r.child_pages ?? [],
      related_workflows: r.related_workflows ?? [],
      related_entities: r.related_entities ?? [],
      backend_services: r.backend_services ?? [],
      dependencies_inbound: r.dependencies_inbound ?? [],
      dependencies_outbound: r.dependencies_outbound ?? [],
      description: r.description,
    };
  }

  private mapFeature(r: any): FeatureInventoryItem {
    return {
      feature_code: r.feature_code,
      feature_name: r.feature_name,
      page_code: r.page_code,
      feature_type: r.feature_type,
      trigger_type: r.trigger_type,
      user_roles: r.user_roles ?? [],
      description: r.description,
      input_data: r.input_data ?? [],
      output_data: r.output_data ?? [],
      backend_process: r.backend_process,
      workflow_impact: r.workflow_impact ?? [],
      notification_impact: r.notification_impact ?? [],
      validation_rules: r.validation_rules ?? [],
      success_result: r.success_result,
      failure_conditions: r.failure_conditions ?? [],
      dependencies: r.dependencies ?? [],
      audit_logged: r.audit_logged,
    };
  }

  private mapControl(r: any): ControlDictionaryItem {
    return {
      control_code: r.control_code,
      page_code: r.page_code,
      control_name: r.control_name,
      control_type: r.control_type,
      visible_roles: r.visible_roles ?? [],
      visible_conditions: r.visible_conditions ?? [],
      action_triggered: r.action_triggered,
      backend_flow: r.backend_flow ?? [],
      data_written: r.data_written ?? [],
      data_read: r.data_read ?? [],
      validations: r.validations ?? [],
      success_behavior: r.success_behavior,
      error_behavior: r.error_behavior,
      dependencies: r.dependencies ?? [],
    };
  }
}