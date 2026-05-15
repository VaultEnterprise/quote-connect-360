import { createClientFromRequest } from "npm:@base44/sdk@0.8.21";

export interface MigrationFile {
  version: string;
  name: string;
  sql: string;
}

export class MigrationRunner {
  private migrations: MigrationFile[] = [];

  constructor() {
    this.registerMigrations();
  }

  private registerMigrations() {
    // Migration 1: Core tables
    this.migrations.push({
      version: "001",
      name: "Create page_inventory table",
      sql: `
        CREATE TABLE IF NOT EXISTS page_inventory (
          id SERIAL PRIMARY KEY,
          page_code VARCHAR(100) UNIQUE NOT NULL,
          page_name VARCHAR(255) NOT NULL,
          module VARCHAR(100) NOT NULL,
          route VARCHAR(255) NOT NULL,
          description TEXT,
          access_roles TEXT[],
          page_type VARCHAR(50),
          ui_framework VARCHAR(50),
          related_workflows TEXT[],
          dependencies_inbound TEXT[],
          dependencies_outbound TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_page_inventory_module ON page_inventory(module);
        CREATE INDEX idx_page_inventory_code ON page_inventory(page_code);
      `,
    });

    this.migrations.push({
      version: "002",
      name: "Create feature_inventory table",
      sql: `
        CREATE TABLE IF NOT EXISTS feature_inventory (
          id SERIAL PRIMARY KEY,
          feature_code VARCHAR(100) UNIQUE NOT NULL,
          page_code VARCHAR(100) NOT NULL,
          feature_name VARCHAR(255) NOT NULL,
          description TEXT,
          feature_type VARCHAR(50),
          backend_process VARCHAR(255),
          triggers TEXT[],
          success_behavior TEXT,
          error_behavior TEXT,
          permissions TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (page_code) REFERENCES page_inventory(page_code)
        );
        CREATE INDEX idx_feature_inventory_page ON feature_inventory(page_code);
      `,
    });

    this.migrations.push({
      version: "003",
      name: "Create control_dictionary table",
      sql: `
        CREATE TABLE IF NOT EXISTS control_dictionary (
          id SERIAL PRIMARY KEY,
          control_code VARCHAR(100) UNIQUE NOT NULL,
          page_code VARCHAR(100) NOT NULL,
          control_name VARCHAR(255) NOT NULL,
          control_type VARCHAR(50),
          action_triggered VARCHAR(255),
          visible_roles TEXT[],
          validations TEXT[],
          dependencies TEXT[],
          ui_component VARCHAR(100),
          success_behavior TEXT,
          error_behavior TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (page_code) REFERENCES page_inventory(page_code)
        );
        CREATE INDEX idx_control_dictionary_page ON control_dictionary(page_code);
        CREATE INDEX idx_control_dictionary_type ON control_dictionary(control_type);
      `,
    });

    this.migrations.push({
      version: "004",
      name: "Create workflow_documentation table",
      sql: `
        CREATE TABLE IF NOT EXISTS workflow_documentation (
          id SERIAL PRIMARY KEY,
          workflow_code VARCHAR(100) UNIQUE NOT NULL,
          workflow_name VARCHAR(255) NOT NULL,
          description TEXT,
          trigger_event VARCHAR(255),
          initial_state VARCHAR(100),
          final_states TEXT[],
          states JSONB,
          transitions JSONB,
          notifications JSONB,
          exceptions JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_workflow_code ON workflow_documentation(workflow_code);
      `,
    });

    this.migrations.push({
      version: "005",
      name: "Create migration_history table",
      sql: `
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          version VARCHAR(10) NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(50) DEFAULT 'completed',
          error_message TEXT
        );
        CREATE UNIQUE INDEX idx_migration_version ON migration_history(version);
      `,
    });
  }

  async runMigrations(base44: any): Promise<{ success: boolean; executed: string[]; errors: any[] }> {
    const executed: string[] = [];
    const errors: any[] = [];

    for (const migration of this.migrations) {
      try {
        console.log(`Running migration ${migration.version}: ${migration.name}`);

        // Check if already executed
        const history = await base44.asServiceRole.entities.MigrationHistory?.filter?.(
          { version: migration.version },
        );

        if (history && history.length > 0) {
          console.log(`  ✓ Already executed`);
          continue;
        }

        // Execute migration
        const result = await base44.asServiceRole.integrations.Core.ExecuteSQL?.({
          sql: migration.sql,
        });

        // Record in history
        await base44.asServiceRole.entities.MigrationHistory?.create?.({
          version: migration.version,
          name: migration.name,
          status: "completed",
        });

        executed.push(`${migration.version}: ${migration.name}`);
        console.log(`  ✓ Completed`);
      } catch (error) {
        console.error(`  ✗ Failed: ${error}`);
        errors.push({
          migration: `${migration.version}: ${migration.name}`,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { success: errors.length === 0, executed, errors };
  }
}