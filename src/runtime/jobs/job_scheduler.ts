// runtime/jobs/job_scheduler.ts
// Background job orchestration

import { JobDefinition } from "../models";

type JobHandler = () => Promise<void> | void;

export class JobScheduler {
  private job_registry: Map<string, JobHandler> = new Map();
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  registerJob(job_code: string, handler: JobHandler): void {
    this.job_registry.set(job_code, handler);
  }

  async runDueJobs(due_jobs: JobDefinition[]): Promise<void> {
    for (const job of due_jobs) {
      const handler = this.job_registry.get(job.job_code);
      if (!handler) {
        this.logger.warn("scheduled_job_missing_handler", { job_code: job.job_code });
        continue;
      }

      this.logger.info("scheduled_job_started", { job_code: job.job_code });

      try {
        await handler();
        this.logger.info("scheduled_job_completed", { job_code: job.job_code });
      } catch (error) {
        this.logger.error("scheduled_job_failed", {
          job_code: job.job_code,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  listRegisteredJobs(): string[] {
    return Array.from(this.job_registry.keys());
  }
}