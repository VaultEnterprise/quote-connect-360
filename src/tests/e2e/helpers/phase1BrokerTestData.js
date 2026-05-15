/* global process */
/**
 * Phase 1 QA Test Data Generator
 * Deterministic test data for automated broker signup certification
 */

export class Phase1TestDataGenerator {
  constructor() {
    this.runId = `PHASE1_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    this.tenantId = process.env.QA_TENANT_ID || 'qa-test-tenant';
  }

  generateBrokerData() {
    return {
      runId: this.runId,
      tenantId: this.tenantId,
      legalName: `Phase 1 QA Broker ${this.runId}`,
      dbaName: `QA Broker Direct ${this.runId}`,
      email: `qa-broker-${this.runId}@example.test`,
      phone: '555-0100',
      npn: `QA-NPN-${this.runId}`,
      licenseState: 'CO',
      licenseExpiration: '2027-12-31',
      licenseStates: ['CO', 'CA', 'NY'],
      insuranceLines: ['health', 'dental', 'vision'],
      employerSizeMin: 1,
      employerSizeMax: 5000,
    };
  }

  generateAdminCredentials() {
    return {
      email: process.env.QA_ADMIN_EMAIL || 'qa-admin@example.test',
      password: process.env.QA_ADMIN_PASSWORD || 'QAAdminPassword123!',
    };
  }

  generateMGAUserCredentials() {
    return {
      email: process.env.QA_MGA_EMAIL || 'qa-mga-user@example.test',
      password: process.env.QA_MGA_PASSWORD || 'QAMGAPassword123!',
    };
  }

  generateTestUserCredentials() {
    return {
      email: process.env.QA_TEST_EMAIL || 'qa-test-user@example.test',
      password: process.env.QA_TEST_PASSWORD || 'QATestPassword123!',
    };
  }

  getEnvironment() {
    return {
      environment: process.env.QA_ENVIRONMENT || 'qa',
      baseUrl: process.env.BASE_URL || 'http://localhost:5173',
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    };
  }

  getBuild() {
    return {
      buildId: process.env.BUILD_ID || 'local',
      branch: process.env.GIT_BRANCH || 'main',
      commit: process.env.GIT_COMMIT || 'unknown',
    };
  }
}

export const testDataGenerator = new Phase1TestDataGenerator();