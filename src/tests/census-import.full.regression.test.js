/* global describe, test, expect */
import {
  extractRowsFromCsv,
  extractRowsFromWorksheet,
  locateCensusSection,
  normalizeCensusHeaders,
  parseHouseholds,
  buildValidationIssues,
  extractGroupMetadata,
  summarizeValidation,
} from '../lib/census/importPipeline.js';
import fs from 'fs';

const csvFixture = fs.readFileSync('tests/fixtures/VAULTCENSUStest.csv', 'utf8');

const worksheetFixture = [
  { col_0: null, col_1: 'GROUP INFORMATION:', col_2: null },
  { col_0: null, col_1: 'Legal Group Name:', col_2: 'Acme Logistics', col_4: 'Tax ID #:', col_5: '12-3456789' },
  { col_0: null, col_1: 'Relationship', col_2: 'First Name', col_3: 'Last Name', col_4: 'Address', col_5: 'City', col_6: 'State', col_7: 'ZIP', col_8: 'Gender', col_9: 'DOB', col_10: 'Coverage Type (EE, ES, EC, EF, W)' },
  { col_0: null, col_1: 'EMP', col_2: 'Jay', col_3: 'Jenson', col_4: '24855 Lemon Grove', col_5: 'Lake Forest', col_6: 'CA', col_7: 92630, col_8: 'Male', col_9: 24461, col_10: 'ES' },
  { col_0: null, col_1: 'SPS', col_2: 'Jane', col_3: 'Jenson', col_4: '24855 Lemon Grove', col_5: 'Lake Forest', col_6: 'CA', col_7: 92630, col_8: 'Female', col_9: 25000, col_10: 'ES' },
  { col_0: null, col_1: 0, col_2: 0, col_3: 0, col_4: '   ' },
];

describe('census import regression', () => {
  test('detects delayed header section in csv fixture', () => {
    const rows = extractRowsFromCsv(csvFixture);
    const section = locateCensusSection(rows);
    expect(section.headerIndex).toBeGreaterThan(0);
  });

  test('extracts group metadata from worksheet-style rows', () => {
    const rows = extractRowsFromWorksheet(worksheetFixture);
    const metadata = extractGroupMetadata(rows.slice(0, 2));
    expect(metadata.legal_group_name).toBe('Acme Logistics');
  });

  test('parses households from worksheet rows with employee then spouse', () => {
    const rows = extractRowsFromWorksheet(worksheetFixture);
    const section = locateCensusSection(rows);
    const headerMap = normalizeCensusHeaders(rows[section.headerIndex]);
    const records = parseHouseholds(rows.slice(section.headerIndex + 1), headerMap, section.headerIndex);
    expect(records.length).toBe(2);
    expect(records[0].relationship_code).toBe('EMP');
    expect(records[1].relationship_code).toBe('SPS');
    expect(records[1].household_key).toBe(records[0].household_key);
  });

  test('ignores zero-filled rows after valid members', () => {
    const rows = extractRowsFromWorksheet(worksheetFixture);
    const section = locateCensusSection(rows);
    const headerMap = normalizeCensusHeaders(rows[section.headerIndex]);
    const records = parseHouseholds(rows.slice(section.headerIndex + 1), headerMap, section.headerIndex);
    expect(records.every((item) => item.first_name && item.last_name)).toBe(true);
  });

  test('builds validation issues with recommended fixes', () => {
    const issues = buildValidationIssues({ relationship_code: 'EMP', first_name: '', last_name: 'Smith', dob: '', household_key: 'x', zip: '12' });
    expect(issues.some((item) => item.recommended_fix)).toBe(true);
    expect(issues.some((item) => item.severity === 'critical')).toBe(true);
  });

  test('produces file-level summary counts from parsed households', () => {
    const rows = extractRowsFromWorksheet(worksheetFixture);
    const section = locateCensusSection(rows);
    const headerMap = normalizeCensusHeaders(rows[section.headerIndex]);
    const records = parseHouseholds(rows.slice(section.headerIndex + 1), headerMap, section.headerIndex);
    const results = records.map((record, index) => {
      const issues = buildValidationIssues(record);
      return {
        record_id: `r-${index + 1}`,
        critical_error_count: issues.filter((item) => item.severity === 'critical').length,
        warning_count: issues.filter((item) => item.severity === 'warning').length,
        informational_count: issues.filter((item) => item.severity === 'informational').length,
      };
    });
    const summary = summarizeValidation(records, results);
    expect(summary.employee_count).toBe(1);
    expect(summary.dependent_count).toBe(1);
    expect(summary.household_count).toBe(1);
  });
});