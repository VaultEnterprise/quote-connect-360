/* global describe, test, expect */
import { getTxQuoteDisabledReason } from '../components/cases/txQuoteWorkflow';

describe('txquote census gating', () => {
  const caseData = {
    employer_name: 'Acme',
    effective_date: '2026-01-01',
    stage: 'census_validated',
    assigned_to: 'broker@example.com',
  };

  const user = { email: 'broker@example.com', role: 'user' };
  const routes = [{ active: true, destination_email: 'quotes@example.com' }];
  const censusVersions = [{ status: 'validated', file_url: 'https://example.com/file.csv', validation_errors: 0 }];

  test('blocks when no latest import job exists', () => {
    expect(getTxQuoteDisabledReason({ caseData, censusVersions, routes, user, latestImportJob: null })).toContain('Census must pass validation');
  });

  test('blocks when latest job has critical errors', () => {
    expect(getTxQuoteDisabledReason({
      caseData,
      censusVersions,
      routes,
      user,
      latestImportJob: { status: 'completed', critical_error_count: 2 },
    })).toContain('Census must pass validation');
  });

  test('allows txquote only when job and validated census are both clean', () => {
    expect(getTxQuoteDisabledReason({
      caseData,
      censusVersions,
      routes,
      user,
      latestImportJob: { status: 'completed', critical_error_count: 0 },
    })).toBe('');
  });
});