// runtime/bootstrap.ts
// Runtime composition root—assembles all layers

import { CommandBus } from "./command_bus";
import { WorkflowRuntime } from "./workflow_runtime";
import { RuntimeOrchestrator } from "./orchestrator";
import { RuntimeRegistry } from "./registry";
import { JobScheduler } from "./jobs/job_scheduler";
import { DashboardProjectionRuntime } from "./projections/dashboard_projection";
import { RuntimeHealthService } from "./health_runtime";
import { DeadLetterService } from "./dead_letter";

export interface RuntimeDependencies {
  handlers: Record<string, any>;
  jobs: Record<string, any>;
  repositories: {
    audit: any;
    exception: any;
    workflow: any;
  };
  logger: any;
}

export class RuntimeBootstrap {
  static async initialize(deps: RuntimeDependencies) {
    const {
      handlers,
      jobs,
      repositories,
      logger,
    } = deps;

    // Create command bus
    const commandBus = new CommandBus();
    RuntimeRegistry.registerCommandHandlers(commandBus, handlers);

    // Create workflow runtime
    const workflowRuntime = new WorkflowRuntime();
    // Register workflow transitions and guard rules here
    // workflowRuntime.registerTransitions("case_workflow", [...]); // see SYSTEM_DESIGN.md

    // Create projections
    const projectionRuntime = new DashboardProjectionRuntime(logger);

    // Create orchestrator
    const orchestrator = new RuntimeOrchestrator({
      command_bus: commandBus,
      workflow_runtime: workflowRuntime,
      audit_repo: repositories.audit,
      exception_repo: repositories.exception,
      projection_runtime: projectionRuntime,
      logger,
    });

    // Create job scheduler
    const jobScheduler = new JobScheduler(logger);
    RuntimeRegistry.registerScheduledJobs(jobScheduler, jobs);

    // Create health service
    const healthService = new RuntimeHealthService(logger);

    // Create dead-letter service
    const deadLetterService = new DeadLetterService(logger);

    logger.info("runtime_bootstrap_complete", {
      commands_registered: commandBus.listRegisteredCommands().length,
      jobs_registered: jobScheduler.listRegisteredJobs().length,
    });

    return {
      commandBus,
      orchestrator,
      workflowRuntime,
      jobScheduler,
      projectionRuntime,
      healthService,
      deadLetterService,
    };
  }
}

// Export convenience function
export async function initializeRuntime(deps: RuntimeDependencies) {
  return RuntimeBootstrap.initialize(deps);
}