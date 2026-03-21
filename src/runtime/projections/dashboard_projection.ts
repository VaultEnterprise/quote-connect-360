// runtime/projections/dashboard_projection.ts
// Dashboard projection refresh coordination

export class DashboardProjectionRuntime {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  async refresh_for_case(benefit_case_id: string | null): Promise<void> {
    if (!benefit_case_id) {
      return;
    }

    try {
      // Refresh all projections related to this case
      await this.refresh_case_dashboard(benefit_case_id);
      await this.refresh_exception_dashboard(benefit_case_id);
      await this.refresh_integration_dashboard(benefit_case_id);
      await this.refresh_renewal_dashboard(benefit_case_id);

      this.logger.info("dashboard_projections_refreshed", {
        benefit_case_id,
      });
    } catch (error) {
      this.logger.error("dashboard_projection_refresh_failed", {
        benefit_case_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async refresh_case_dashboard(benefit_case_id: string): Promise<void> {
    // Update case_dashboard_projection table with current state
    // Queries: case status, open exceptions, overdue tasks, etc.
  }

  private async refresh_exception_dashboard(benefit_case_id: string): Promise<void> {
    // Update exception_dashboard_projection with counts by severity
    // Queries: ExceptionItem filtered by benefit_case_id and status
  }

  private async refresh_integration_dashboard(benefit_case_id: string): Promise<void> {
    // Update integration_dashboard_projection with job queues, dead-letters, etc.
  }

  private async refresh_renewal_dashboard(benefit_case_id: string): Promise<void> {
    // Update renewal_dashboard_projection with renewal state and deltas
  }
}