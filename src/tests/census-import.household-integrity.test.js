/* global describe, test, expect */
import { locateCensusSection, normalizeCensusHeaders, parseHouseholds, buildValidationIssues, extractRowsFromWorksheet } from '../lib/census/importPipeline.js';

const baseSheet = [
  { col_0: 'Relationship', col_1: 'First Name', col_2: 'Last Name', col_3: 'DOB', col_4: 'Coverage Type (EE, ES, EC, EF, W)' },
];

function parseRows(extraRows) {
  const rows = extractRowsFromWorksheet([...baseSheet, ...extraRows]);
  const section = locateCensusSection(rows);
  const headers = normalizeCensusHeaders(rows[section.headerIndex]);
  return parseHouseholds(rows.slice(section.headerIndex + 1), headers, section.headerIndex);
}

describe('household integrity', () => {
  test('supports EMP only', () => {
    const records = parseRows([{ col_0: 'EMP', col_1: 'John', col_2: 'Smith', col_3: '1980-01-01', col_4: 'EE' }]);
    expect(records).toHaveLength(1);
    expect(records[0].household_key).toBeTruthy();
  });

  test('supports EMP plus spouse and dependents', () => {
    const records = parseRows([
      { col_0: 'EMP', col_1: 'John', col_2: 'Smith', col_3: '1980-01-01', col_4: 'EF' },
      { col_0: 'SPS', col_1: 'Jane', col_2: 'Smith', col_3: '1982-02-02', col_4: 'EF' },
      { col_0: 'DEP', col_1: 'Ava', col_2: 'Smith', col_3: '2015-03-03', col_4: 'EF' },
      { col_0: 'DEP', col_1: 'Max', col_2: 'Smith', col_3: '2017-04-04', col_4: 'EF' },
    ]);
    expect(new Set(records.map((item) => item.household_key)).size).toBe(1);
  });

  test('flags dependent before employee', () => {
    const records = parseRows([
      { col_0: 'DEP', col_1: 'Ava', col_2: 'Smith', col_3: '2015-03-03', col_4: 'EC' },
      { col_0: 'EMP', col_1: 'John', col_2: 'Smith', col_3: '1980-01-01', col_4: 'EC' },
    ]);
    const issues = buildValidationIssues(records[0], { hasActiveEmployee: false, isDuplicateMember: false });
    expect(issues.some((item) => item.code === 'DEPENDENT_BEFORE_EMPLOYEE')).toBe(true);
  });

  test('flags missing employee for spouse', () => {
    const records = parseRows([
      { col_0: 'SPS', col_1: 'Jane', col_2: 'Smith', col_3: '1982-02-02', col_4: 'ES' },
    ]);
    const issues = buildValidationIssues(records[0], { hasActiveEmployee: false, isDuplicateMember: false });
    expect(issues.some((item) => item.code === 'SPOUSE_BEFORE_EMPLOYEE')).toBe(true);
  });
});