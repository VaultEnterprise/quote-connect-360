// runtime/jobs/enrollment_reminder_job.ts
// Sends enrollment reminders to pending members

import { base44 } from "@/api/base44Client";

export class EnrollmentReminderJob {
  async run(): Promise<void> {
    const logger = console; // In production: use structured logger

    try {
      // Fetch open enrollment windows
      const enrollmentWindows = await base44.entities.EnrollmentWindow.filter({
        status: "open",
      });

      logger.log(`Found ${enrollmentWindows.length} open enrollment windows`);

      for (const window of enrollmentWindows) {
        // Find pending members
        const enrollmentMembers = await base44.entities.EnrollmentMember.filter({
          enrollment_window_id: window.id,
          status: "invited",
        });

        logger.log(
          `Found ${enrollmentMembers.length} pending members in window ${window.id}`
        );

        // Send reminders to each pending member
        for (const member of enrollmentMembers) {
          try {
            await base44.integrations.Core.SendEmail({
              to: member.email,
              subject: `Reminder: Complete Your Benefits Enrollment - ${window.employer_name}`,
              body: `Hi ${member.first_name},\n\nThis is a friendly reminder to complete your benefits enrollment by ${window.end_date}.\n\nClick here to enroll: [enrollment link]\n\nQuestions? Contact [HR contact]`,
            });

            logger.log(`Enrollment reminder sent to ${member.email}`);
          } catch (error) {
            logger.error(`Failed to send reminder to ${member.email}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error("Enrollment reminder job failed:", error);
      throw error;
    }
  }
}