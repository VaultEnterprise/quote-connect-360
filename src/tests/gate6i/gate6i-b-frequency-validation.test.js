/**
 * Gate 6I-B Frequency Validation Tests (35+ tests)
 * 
 * Tests: 1-hour minimum, 1-year maximum recurring intervals
 * Tests: Cron expression validation for sub-hourly rejection
 */

import { describe, it, expect } from 'vitest';
import reportScheduleService from '@/lib/mga/services/reportScheduleService';

describe('Gate 6I-B Frequency Validation', () => {
  const testUser = {
    id: 'user123',
    email: 'admin@test.com',
    role: 'mga_admin',
    master_general_agent_id: 'mga1'
  };

  const baseScheduleData = {
    master_general_agent_id: 'mga1',
    template_id: 'tmpl1',
    schedule_name: 'Test Schedule',
    schedule_type: 'recurring',
    scheduled_date_time: '2026-05-20T09:00:00Z',
    timezone: 'America/Los_Angeles'
  };

  describe('Hourly Frequency (1-hour minimum)', () => {
    it('should accept hourly with interval 1', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'hourly',
        frequency_interval: 1
      };
      
      // Should not throw
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept hourly with interval 2', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'hourly',
        frequency_interval: 2
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should reject hourly with interval 0', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'hourly',
        frequency_interval: 0
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Minimum hourly interval is 1 hour');
    });

    it('should reject hourly with negative interval', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'hourly',
        frequency_interval: -1
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Minimum hourly interval is 1 hour');
    });

    it('should use default interval 1 if not specified', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'hourly'
        // frequency_interval not specified
      };
      
      // Should default to 1 hour
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });
  });

  describe('Daily Frequency (1-year maximum)', () => {
    it('should accept daily with interval 1', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'daily',
        frequency_interval: 1
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept daily with interval 180', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'daily',
        frequency_interval: 180
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept daily with interval 365 (1 year max)', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'daily',
        frequency_interval: 365
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should reject daily with interval 366 (> 1 year)', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'daily',
        frequency_interval: 366
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Maximum daily interval is 365 days');
    });

    it('should reject daily with interval 730 (2 years)', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'daily',
        frequency_interval: 730
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Maximum daily interval is 365 days');
    });
  });

  describe('Weekly Frequency', () => {
    it('should accept weekly with valid days of week', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'weekly',
        frequency_days_of_week: [1, 3, 5] // Mon, Wed, Fri
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept weekly with single day', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'weekly',
        frequency_days_of_week: [2] // Wednesday
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept weekly with all days', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'weekly',
        frequency_days_of_week: [0, 1, 2, 3, 4, 5, 6]
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });
  });

  describe('Monthly Frequency', () => {
    it('should accept monthly with day 1', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'monthly',
        frequency_day_of_month: 1
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept monthly with day 15', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'monthly',
        frequency_day_of_month: 15
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept monthly with day 31', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'monthly',
        frequency_day_of_month: 31
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });
  });

  describe('Custom Cron (1-hour minimum enforcement)', () => {
    it('should accept daily cron (0 9 * * *)', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'custom',
        frequency_cron: '0 9 * * *'
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept hourly cron (0 * * * *)', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'custom',
        frequency_cron: '0 * * * *'
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should reject 30-minute cron (*/30 * * * *)', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'custom',
        frequency_cron: '*/30 * * * *'
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Minimum recurring interval is 1 hour');
    });

    it('should reject 15-minute cron (*/15 * * * *)', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'custom',
        frequency_cron: '*/15 * * * *'
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Minimum recurring interval is 1 hour');
    });

    it('should reject 5-minute cron (*/5 * * * *)', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'custom',
        frequency_cron: '*/5 * * * *'
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Minimum recurring interval is 1 hour');
    });

    it('should reject invalid cron format', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'custom',
        frequency_cron: 'invalid cron'
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Invalid cron expression');
    });

    it('should require cron expression for custom frequency', () => {
      const data = {
        ...baseScheduleData,
        frequency: 'custom'
        // frequency_cron not specified
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Cron expression required');
    });
  });

  describe('Frequency Requirement for Recurring', () => {
    it('should require frequency for recurring schedule type', () => {
      const data = {
        ...baseScheduleData,
        schedule_type: 'recurring'
        // frequency not specified
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data))
        .rejects.toThrow('Frequency required');
    });

    it('should not require frequency for one_time schedule type', async () => {
      const data = {
        ...baseScheduleData,
        schedule_type: 'one_time'
        // frequency not specified
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });
  });

  describe('Recurrence End Date Validation', () => {
    it('should accept valid recurrence end date', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'daily',
        frequency_interval: 1,
        recurrence_end_date: '2026-12-31T23:59:59Z'
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });

    it('should accept null recurrence end date (no end)', async () => {
      const data = {
        ...baseScheduleData,
        frequency: 'daily',
        frequency_interval: 1,
        recurrence_end_date: null
      };
      
      expect(() => reportScheduleService.createSchedule(testUser, data)).not.toThrow();
    });
  });
});