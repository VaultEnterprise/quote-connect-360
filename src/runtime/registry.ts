// runtime/registry.ts
// Wires commands, handlers, and jobs together

import { CommandBus } from "./command_bus";
import { JobScheduler } from "./jobs/job_scheduler";
import { ALL_COMMANDS } from "./commands";

export class RuntimeRegistry {
  static registerCommandHandlers(
    commandBus: CommandBus,
    handlers: Record<string, any>
  ): void {
    // Census commands
    commandBus.register(
      ALL_COMMANDS.UPLOAD_CENSUS,
      handlers.census.upload_census.bind(handlers.census)
    );
    commandBus.register(
      ALL_COMMANDS.VALIDATE_CENSUS,
      handlers.census.validate_census.bind(handlers.census)
    );
    commandBus.register(
      ALL_COMMANDS.CREATE_CENSUS_VERSION,
      handlers.census.create_census_version.bind(handlers.census)
    );

    // Quote commands
    commandBus.register(
      ALL_COMMANDS.BUILD_QUOTE_REQUEST,
      handlers.quote.build_quote_request.bind(handlers.quote)
    );
    commandBus.register(
      ALL_COMMANDS.RUN_QUOTE_SCENARIO,
      handlers.quote.run_quote_scenario.bind(handlers.quote)
    );
    commandBus.register(
      ALL_COMMANDS.GENERATE_QUOTE_COMPARISON,
      handlers.quote.generate_quote_comparison.bind(handlers.quote)
    );

    // Enrollment commands
    commandBus.register(
      ALL_COMMANDS.OPEN_ENROLLMENT,
      handlers.enrollment.open_enrollment.bind(handlers.enrollment)
    );
    commandBus.register(
      ALL_COMMANDS.INVITE_ELIGIBLE_MEMBERS,
      handlers.enrollment.invite_eligible_members.bind(handlers.enrollment)
    );
    commandBus.register(
      ALL_COMMANDS.FINALIZE_ENROLLMENT,
      handlers.enrollment.finalize_enrollment.bind(handlers.enrollment)
    );

    // Additional commands follow same pattern...
  }

  static registerScheduledJobs(
    jobScheduler: JobScheduler,
    jobs: Record<string, any>
  ): void {
    jobScheduler.registerJob("enrollment_reminder", jobs.enrollmentReminder.run.bind(jobs.enrollmentReminder));
    jobScheduler.registerJob("renewal_trigger", jobs.renewalTrigger.run.bind(jobs.renewalTrigger));
    jobScheduler.registerJob("install_reconciliation", jobs.installReconciliation.run.bind(jobs.installReconciliation));
    jobScheduler.registerJob("endpoint_health_check", jobs.endpointHealth.run.bind(jobs.endpointHealth));
    jobScheduler.registerJob("dead_letter_retry", jobs.deadLetterRetry.run.bind(jobs.deadLetterRetry));
  }
}