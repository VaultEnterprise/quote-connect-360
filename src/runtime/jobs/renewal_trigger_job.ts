// runtime/jobs/renewal_trigger_job.ts
// Automatically triggers renewal workflow for approaching dates

import { base44 } from "@/api/base44Client";
import { RuntimeContext } from "../models";

export class RenewalTriggerJob {
  constructor(private orchestrator: any) {}

  async run(): Promise<void> {
    const logger = console;

    try {
      // Find cases with renewal dates approaching (90 days)
      const nineDaysAhead = new Date();
      nineDaysAhead.setDate(nineDaysAhead.getDate() + 90);

      const casesForRenewal = await base44.entities.BenefitCase.filter({
        case_status: "active",
      });

      const dueCases = casesForRenewal.filter((c) => {
        if (!c.target_close_date) return false;
        const closeDate = new Date(c.target_close_date);
        return closeDate <= nineDaysAhead && closeDate > new Date();
      });

      logger.log(`Found ${dueCases.length} cases due for renewal trigger`);

      for (const benefitCase of dueCases) {
        try {
          // Check if renewal already exists
          const existingRenewal = await base44.entities.RenewalCycle.filter({
            case_id: benefitCase.id,
            status: "pre_renewal",
          });

          if (existingRenewal.length > 0) {
            logger.log(`Renewal already exists for case ${benefitCase.id}`);
            continue;
          }

          // Create renewal cycle
          const renewal = await base44.entities.RenewalCycle.create({
            case_id: benefitCase.id,
            employer_group_id: benefitCase.employer_group_id,
            renewal_date: benefitCase.target_close_date,
            status: "pre_renewal",
            employer_name: benefitCase.employer_name,
          });

          logger.log(`Renewal cycle created for case ${benefitCase.id}`);

          // Trigger renewal command
          const context: RuntimeContext = {
            tenant_id: benefitCase.agency_id,
            user_id: "system",
            user_email: "system@qc360.local",
            correlation_id: `renewal_trigger_${Date.now()}`,
            source_system_code: "scheduler",
            timestamp: new Date(),
          };

          await this.orchestrator.execute({
            command_name: "launch_renewal_workflow",
            payload: {
              benefit_case_id: benefitCase.id,
              renewal_cycle_id: renewal.id,
            },
            context,
          });

          logger.log(`Renewal workflow triggered for case ${benefitCase.id}`);
        } catch (error) {
          logger.error(`Failed to trigger renewal for case ${benefitCase.id}:`, error);
        }
      }
    } catch (error) {
      logger.error("Renewal trigger job failed:", error);
      throw error;
    }
  }
}