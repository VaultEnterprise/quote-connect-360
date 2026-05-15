// runtime/orchestrator.ts
// Central runtime control tower

import { CommandBus } from "./command_bus";
import { WorkflowRuntime } from "./workflow_runtime";
import { DashboardProjectionRuntime } from "./projections/dashboard_projection";
import { CommandResult, RuntimeContext } from "./models";

interface OrchestratorDependencies {
  command_bus: CommandBus;
  workflow_runtime: WorkflowRuntime;
  audit_repo: any; // Base44 entity: ActivityLog
  exception_repo: any; // Base44 entity: ExceptionItem
  projection_runtime: DashboardProjectionRuntime;
  logger: any;
}

export class RuntimeOrchestrator {
  private command_bus: CommandBus;
  private workflow_runtime: WorkflowRuntime;
  private audit_repo: any;
  private exception_repo: any;
  private projection_runtime: DashboardProjectionRuntime;
  private logger: any;

  constructor(deps: OrchestratorDependencies) {
    this.command_bus = deps.command_bus;
    this.workflow_runtime = deps.workflow_runtime;
    this.audit_repo = deps.audit_repo;
    this.exception_repo = deps.exception_repo;
    this.projection_runtime = deps.projection_runtime;
    this.logger = deps.logger;
  }

  async execute(options: {
    command_name: string;
    payload: Record<string, any>;
    context: RuntimeContext;
    workflow_code?: string;
    current_state?: string;
    transition_code?: string;
    workflow_facts?: Record<string, any>;
  }): Promise<CommandResult> {
    const {
      command_name,
      payload,
      context,
      workflow_code,
      current_state,
      transition_code,
      workflow_facts,
    } = options;

    this.logger.info("runtime_command_received", {
      command_name,
      correlation_id: context.correlation_id,
      user_id: context.user_id,
    });

    try {
      // Step 1: Validate workflow transition if provided
      if (workflow_code && current_state && transition_code) {
        const decision = this.workflow_runtime.evaluateTransition(
          workflow_code,
          current_state,
          transition_code,
          workflow_facts || {}
        );

        if (!decision.allowed) {
          await this.exception_repo.create({
            benefit_case_id: payload.benefit_case_id,
            entity_type: "Workflow",
            entity_id: payload.benefit_case_id,
            exception_code: "WORKFLOW_TRANSITION_BLOCKED",
            category_code: "rules_failure",
            severity: "high",
            owner_role_code: "ops",
            root_cause: decision.reason,
            status: "open",
          });

          this.logger.warn("workflow_transition_blocked", {
            command_name,
            reason: decision.reason,
            correlation_id: context.correlation_id,
          });

          return {
            success: false,
            error: decision.reason,
            error_code: "WORKFLOW_BLOCKED",
          };
        }
      }

      // Step 2: Dispatch command
      const result = await this.command_bus.dispatch(command_name, payload, context);

      if (!result.success) {
        this.logger.error("command_execution_failed", {
          command_name,
          error: result.error,
          correlation_id: context.correlation_id,
        });
        return result;
      }

      // Step 3: Emit audit event
      await this.audit_repo.create({
        benefit_case_id: payload.benefit_case_id,
        entity_type: "RuntimeCommand",
        entity_id: payload.benefit_case_id,
        event_code: `COMMAND_${command_name.toUpperCase()}_COMPLETED`,
        actor_user_id: context.user_id,
        source_system_code: context.source_system_code,
        correlation_id: context.correlation_id,
        after_json: { payload, result: result.data },
      });

      // Step 4: Refresh dashboard projections
      if (payload.benefit_case_id) {
        await this.projection_runtime.refresh_for_case(payload.benefit_case_id);
      }

      this.logger.info("command_execution_succeeded", {
        command_name,
        correlation_id: context.correlation_id,
      });

      return result;
    } catch (error) {
      this.logger.error("orchestrator_error", {
        command_name,
        error: error instanceof Error ? error.message : String(error),
        correlation_id: context.correlation_id,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "ORCHESTRATOR_ERROR",
      };
    }
  }
}