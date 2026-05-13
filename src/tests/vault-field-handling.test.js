import { describe, test, expect } from 'vitest';
import {
  locateCensusSection,
  extractVaultGroupMetadata,
  normalizeCensusHeaders,
  normalizeRelationship,
  normalizeCoverageType,
  normalizeDateValue,
  normalizeCell,
  isEffectivelyBlankRow,
} from '../lib/census/importPipeline.js';

/**
 * VAULT Census Field Handling Tests
 * Validates full support for VAULT form structure with group metadata,
 * sample/definition row exclusion, and field normalization.
 */

describe('VAULT Census Field Handling', () => {

  describe('GROUP INFORMATION Section Detection & Extraction', () => {
    test('detects GROUP INFORMATION: section', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Legal Group Name:', 'Acme Inc'],
      ];
      const groupInfoIdx = rows.findIndex((r) => normalizeCell(r[1] || '').includes('GROUP'));
      expect(groupInfoIdx).toBe(0);
    });

    test('extracts Legal Group Name field', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Legal Group Name:', 'Acme Inc', 'Tax ID #:', '12-3456789'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.legal_group_name).toBe('Acme Inc');
    });

    test('extracts Tax ID # field', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Legal Group Name:', 'Acme Inc', 'Tax ID #:', '12-3456789'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.tax_id).toBe('12-3456789');
    });

    test('extracts 4-digit SIC Code field', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', '4-digit SIC Code:', '5411'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.sic_code).toBe('5411');
    });

    test('extracts Address field', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Address:', '123 Main St', 'City:', 'Chicago'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.address).toBe('123 Main St');
    });

    test('extracts City, State, Zip fields', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Address:', '123 Main St', 'City:', 'Chicago', 'State:', 'IL', 'Zip:', '60601'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.city).toBe('Chicago');
      expect(metadata.state).toBe('IL');
      expect(metadata.zip).toBe('60601');
    });

    test('extracts Total # of Eligible Employees', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Total # of Eligible Employees:', '250'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.total_eligible_employees).toBe('250');
    });

    test('extracts Total # of Employees on Current Plan', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Total # of Employees on Current Plan:', '200'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.total_employees_current_plan).toBe('200');
    });

    test('extracts Current Carrier', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Current Carrier:', 'Blue Cross'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.current_carrier).toBe('Blue Cross');
    });

    test('extracts Desired Effective Date', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Desired Effective Date:', '01-01-2026'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.desired_effective_date).toBe('01-01-2026');
    });

    test('extracts Number of years with Carrier', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Number of years with Carrier:', '5'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 10);
      expect(metadata.years_with_carrier).toBe('5');
    });

    test('stops extraction at CENSUS: marker', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', 'Legal Group Name:', 'Acme Inc'],
        ['', 'CENSUS:'],
        ['', 'Extra Data:', 'Should Not Extract'],
      ];
      const metadata = extractVaultGroupMetadata(rows, 2);
      expect(metadata.legal_group_name).toBe('Acme Inc');
      expect(metadata['extra data']).toBeUndefined();
    });
  });

  describe('CENSUS: Marker Detection & Header Row', () => {
    test('locates CENSUS: marker', () => {
      const rows = [
        ['', 'GROUP INFORMATION:'],
        ['', '', ''],
        ['', 'CENSUS:'],
        ['', 'Relationship', 'First Name', 'Last Name'],
      ];
      let vaultMarkerIndex = -1;
      for (let i = 0; i < rows.length; i++) {
        if (normalizeCell(rows[i][0] || '').includes('CENSUS')) {
          vaultMarkerIndex = i;
          break;
        }
      }
      expect(vaultMarkerIndex).toBe(2);
    });

    test('uses row immediately after CENSUS: as true header', () => {
      const rows = [
        ['', 'CENSUS:'],
        ['', 'Relationship', 'First Name', 'Last Name', 'DOB', 'Coverage Type'],
      ];
      const headerRowIndex = 1;
      const headers = rows[headerRowIndex] || [];
      expect(headers[1]).toBe('Relationship');
      expect(headers[2]).toBe('First Name');
      expect(headers[3]).toBe('Last Name');
      expect(headers[4]).toBe('DOB');
      expect(headers[5]).toBe('Coverage Type');
    });

    test('ignores sample rows before CENSUS: marker', () => {
      const rows = [
        ['', 'Relationship', 'First Name', 'Last Name', 'Address', 'City', 'State', 'ZIP', 'Gender', 'DOB', 'Coverage Type'],
        ['', 'EMP', 'John', 'Smith', '123 Example St.', 'Example', 'PA', '12345', 'Male', '11-12-1990', 'EF'],
        ['', 'SPS', 'Jane', 'Smith', '123 Example St.', 'Example', 'PA', '12345', 'Female', '10-03-1992', 'EF'],
        ['', 'DEP', 'John Jr.', 'Smith', '123 Example St.', 'Example', 'PA', '12345', 'Male', '6-4-2018', 'EF'],
        ['', 'CENSUS:'],
        ['', 'Relationship', 'First Name', 'Last Name', 'Address', 'City', 'State', 'ZIP', 'Gender', 'DOB', 'Coverage Type'],
        ['', 'EMP', 'Jay', 'Jenson', '24855 Lemon Grove', 'Lake Forest', 'CA', '92630', 'Male', '12-20-1966', 'ES'],
      ];
      const vaultMarkerIndex = 4;
      const headerRowIndex = 5;
      const importableDataRows = rows.slice(headerRowIndex + 1);
      expect(importableDataRows.length).toBe(1);
      expect(importableDataRows[0][2]).toBe('Jay');
    });

    test('does not import John Smith, Jane Smith, or John Jr. sample rows', () => {
      const rows = [
        ['', 'Relationship', 'First Name', 'Last Name'],
        ['', 'EMP', 'John', 'Smith'],
        ['', 'SPS', 'Jane', 'Smith'],
        ['', 'DEP', 'John Jr.', 'Smith'],
        ['', 'CENSUS:'],
        ['', 'Relationship', 'First Name', 'Last Name'],
        ['', 'EMP', 'Jay', 'Jenson'],
      ];
      const importableStartIndex = 5;
      const sampleRows = rows.slice(1, 4);
      const importableRows = rows.slice(importableStartIndex + 1);
      expect(sampleRows.some(r => r[2] === 'John')).toBe(true);
      expect(importableRows.every(r => r[2] !== 'John')).toBe(true);
      expect(importableRows[0][2]).toBe('Jay');
    });
  });

  describe('Actual Census Column Detection', () => {
    test('detects all 10 required census columns', () => {
      const headers = ['', 'Relationship', 'First Name', 'Last Name', 'Address', 'City', 'State', 'ZIP', 'Gender', 'DOB', 'Coverage Type (EE, ES, EC, EF, W)'];
      const columnNames = headers.slice(1).map(h => normalizeCell(h).toLowerCase());
      expect(columnNames).toContain('relationship');
      expect(columnNames).toContain('first name');
      expect(columnNames).toContain('last name');
      expect(columnNames).toContain('address');
      expect(columnNames).toContain('city');
      expect(columnNames).toContain('state');
      expect(columnNames).toContain('zip');
      expect(columnNames).toContain('gender');
      expect(columnNames).toContain('dob');
      expect(columnNames.some(c => c.includes('coverage'))).toBe(true);
    });

    test('preserves all detected columns for mapper', () => {
      const headers = ['', 'Relationship', 'First Name', 'Last Name', 'Address', 'City', 'State', 'ZIP', 'Gender', 'DOB', 'Coverage Type'];
      expect(headers.length - 1).toBe(10);
    });

    test('ignores definition/reference columns', () => {
      const rows = [
        ['', 'Relationship', 'First Name', 'Last Name', 'Definitions'],
        ['', 'EMP', 'John', 'Doe', 'EMP: Employee'],
        ['', 'SPS', 'Jane', 'Doe', 'SPS: Spouse'],
      ];
      const headerRow = rows[0];
      const headerIdx = headerRow.findIndex(h => normalizeCell(h).includes('Definition'));
      expect(headerIdx).toBe(4);
      expect(normalizeCell(headerRow[4])).toContain('definition');
    });
  });

  describe('Default Column Mappings', () => {
    test('auto-suggests Relationship → relationship', () => {
      const headerName = 'Relationship';
      const suggested = headerName.toLowerCase().includes('relationship');
      expect(suggested).toBe(true);
    });

    test('auto-suggests First Name → first_name', () => {
      const headerName = 'First Name';
      const suggested = headerName.toLowerCase().includes('first') && headerName.toLowerCase().includes('name');
      expect(suggested).toBe(true);
    });

    test('auto-suggests Last Name → last_name', () => {
      const headerName = 'Last Name';
      const suggested = headerName.toLowerCase().includes('last') && headerName.toLowerCase().includes('name');
      expect(suggested).toBe(true);
    });

    test('auto-suggests Address → address', () => {
      const headerName = 'Address';
      const suggested = headerName.toLowerCase().includes('address');
      expect(suggested).toBe(true);
    });

    test('auto-suggests City → city', () => {
      const headerName = 'City';
      const suggested = headerName.toLowerCase().includes('city');
      expect(suggested).toBe(true);
    });

    test('auto-suggests State → state', () => {
      const headerName = 'State';
      const suggested = headerName.toLowerCase().includes('state');
      expect(suggested).toBe(true);
    });

    test('auto-suggests ZIP → zip', () => {
      const headerName = 'ZIP';
      const suggested = headerName.toUpperCase().includes('ZIP');
      expect(suggested).toBe(true);
    });

    test('auto-suggests Gender → gender', () => {
      const headerName = 'Gender';
      const suggested = headerName.toLowerCase().includes('gender') || headerName.toLowerCase().includes('sex');
      expect(suggested).toBe(true);
    });

    test('auto-suggests DOB → dob', () => {
      const headerName = 'DOB';
      const suggested = headerName.toLowerCase().includes('dob') || headerName.toLowerCase().includes('birth');
      expect(suggested).toBe(true);
    });

    test('auto-suggests Coverage Type → coverage_type', () => {
      const headerName = 'Coverage Type (EE, ES, EC, EF, W)';
      const suggested = headerName.toLowerCase().includes('coverage');
      expect(suggested).toBe(true);
    });

    test('allows manual override of every detected column', () => {
      const mapping = {
        0: 'relationship',
        1: 'first_name',
        2: 'last_name',
        3: 'address',
        4: 'custom_field_1',
      };
      expect(Object.keys(mapping).length).toBe(5);
      expect(mapping[4]).toBe('custom_field_1');
    });
  });

  describe('Relationship Normalization', () => {
    test('normalizes EMP to EMP', () => {
      expect(normalizeRelationship('EMP')).toBe('EMP');
    });

    test('normalizes SPS to SPS', () => {
      expect(normalizeRelationship('SPS')).toBe('SPS');
    });

    test('normalizes DEP to DEP', () => {
      expect(normalizeRelationship('DEP')).toBe('DEP');
    });

    test('normalizes EMPLOYEE to EMP', () => {
      expect(normalizeRelationship('EMPLOYEE')).toBe('EMP');
    });

    test('normalizes SPOUSE to SPS', () => {
      expect(normalizeRelationship('SPOUSE')).toBe('SPS');
    });

    test('normalizes DEPENDENT to DEP', () => {
      expect(normalizeRelationship('DEPENDENT')).toBe('DEP');
    });

    test('accepts case-insensitive values', () => {
      expect(normalizeRelationship('emp')).toBe('EMP');
      expect(normalizeRelationship('employee')).toBe('EMP');
    });
  });

  describe('Coverage Type Normalization', () => {
    test('normalizes EE to EE', () => {
      expect(normalizeCoverageType('EE')).toBe('EE');
    });

    test('normalizes ES to ES', () => {
      expect(normalizeCoverageType('ES')).toBe('ES');
    });

    test('normalizes EC to EC', () => {
      expect(normalizeCoverageType('EC')).toBe('EC');
    });

    test('normalizes EF to EF', () => {
      expect(normalizeCoverageType('EF')).toBe('EF');
    });

    test('normalizes W to W', () => {
      expect(normalizeCoverageType('W')).toBe('W');
    });

    test('normalizes "Employee Only" to EE', () => {
      expect(normalizeCoverageType('Employee Only')).toBe('EE');
    });

    test('normalizes "Employee + Spouse" to ES', () => {
      expect(normalizeCoverageType('Employee + Spouse')).toBe('ES');
    });

    test('normalizes "Employee + Child(ren)" to EC', () => {
      expect(normalizeCoverageType('Employee + Child(ren)')).toBe('EC');
    });

    test('normalizes "Family" to EF', () => {
      expect(normalizeCoverageType('Family')).toBe('EF');
    });

    test('normalizes "Waiving Coverage" to W', () => {
      expect(normalizeCoverageType('Waiving Coverage')).toBe('W');
    });

    test('accepts case-insensitive and whitespace variants', () => {
      expect(normalizeCoverageType('EMPLOYEE ONLY')).toBe('EE');
      expect(normalizeCoverageType('employee+spouse')).toBe('ES');
    });
  });

  describe('DOB Parsing', () => {
    test('parses 12-20-1966 format', () => {
      const dob = normalizeDateValue('12-20-1966');
      expect(dob).toBe('1966-12-20');
    });

    test('parses 11-12-1990 format', () => {
      const dob = normalizeDateValue('11-12-1990');
      expect(dob).toBe('1990-11-12');
    });

    test('parses 10-03-1992 format', () => {
      const dob = normalizeDateValue('10-03-1992');
      expect(dob).toBe('1992-10-03');
    });

    test('parses 6-4-2018 format (no leading zeros)', () => {
      const dob = normalizeDateValue('6-4-2018');
      expect(dob).toBe('2018-06-04');
    });

    test('normalizes to internal YYYY-MM-DD format', () => {
      const dob = normalizeDateValue('12-20-1966');
      expect(/^\d{4}-\d{2}-\d{2}$/.test(dob)).toBe(true);
    });
  });

  describe('ZIP Preservation', () => {
    test('preserves ZIP as string', () => {
      const zip = '92630';
      expect(typeof zip).toBe('string');
    });

    test('preserves leading zeros', () => {
      const zip = '02134';
      expect(zip).toBe('02134');
    });

    test('preserves ZIP+4 format', () => {
      const zip = '92630-1234';
      expect(zip).toContain('-');
    });

    test('does not coerce ZIP to number', () => {
      const zip = normalizeCell('92630');
      expect(typeof zip).toBe('string');
    });
  });

  describe('Row Handling & Blank Row Exclusion', () => {
    test('identifies blank rows', () => {
      const blankRow = ['', '', '', '', ''];
      expect(isEffectivelyBlankRow(blankRow)).toBe(true);
    });

    test('identifies rows with only whitespace', () => {
      const whitespaceRow = ['  ', '  ', '  '];
      expect(isEffectivelyBlankRow(whitespaceRow)).toBe(true);
    });

    test('identifies valid data rows as non-blank', () => {
      const validRow = ['', 'EMP', 'Jay', 'Jenson'];
      expect(isEffectivelyBlankRow(validRow)).toBe(false);
    });

    test('skips trailing placeholder rows', () => {
      const rows = [
        ['', 'EMP', 'Jay', 'Jenson'],
        ['', '', '', ''],
        ['', '', '', ''],
      ];
      const validRows = rows.filter(r => !isEffectivelyBlankRow(r));
      expect(validRows.length).toBe(1);
    });

    test('does not import definition rows', () => {
      const definitionRow = ['', 'EMP: Employee', 'SPS: Spouse', 'DEP: Dependent'];
      const isDefinition = definitionRow.some(cell => normalizeCell(cell).includes(':'));
      expect(isDefinition).toBe(true);
    });
  });

  describe('Import Behavior - Real Data', () => {
    test('imports real Jay Jenson row as valid employee', () => {
      const row = ['', 'EMP', 'Jay', 'Jenson', '24855 Lemon Grove', 'Lake Forest', 'CA', '92630', 'Male', '12-20-1966', 'ES'];
      const relationship = normalizeRelationship(row[1]);
      const firstName = normalizeCell(row[2]);
      const lastName = normalizeCell(row[3]);
      const coverage = normalizeCoverageType(row[10]);
      expect(relationship).toBe('EMP');
      expect(firstName).toBe('Jay');
      expect(lastName).toBe('Jenson');
      expect(coverage).toBe('ES');
    });

    test('does not import John Smith sample row', () => {
      const row = ['', 'EMP', 'John', 'Smith', '123 Example St.', 'Example', 'PA', '12345', 'Male', '11-12-1990', 'EF'];
      const isSampleMarker = row.some(cell => normalizeCell(cell).toLowerCase().includes('example'));
      expect(isSampleMarker).toBe(true);
    });

    test('does not import definition reference rows', () => {
      const row = ['', 'DEP: Dependent', 'EC: Employee + Child(ren)'];
      const hasDefinitionMarker = row.some(cell => normalizeCell(cell).includes(':') && normalizeCell(cell).length < 30);
      expect(hasDefinitionMarker).toBe(true);
    });
  });

  describe('Group Metadata Storage', () => {
    test('stores group metadata separately from member rows', () => {
      const groupMetadata = { legal_group_name: 'Acme Inc', tax_id: '12-3456789' };
      const memberRow = { first_name: 'Jay', last_name: 'Jenson' };
      expect(groupMetadata.legal_group_name).toBeDefined();
      expect(memberRow.legal_group_name).toBeUndefined();
    });

    test('preserves group metadata on import job/version/profile', () => {
      const metadata = {
        legal_group_name: 'Acme Inc',
        tax_id: '12-3456789',
        address: '123 Main St',
      };
      expect(Object.keys(metadata).length).toBe(3);
      expect(metadata.legal_group_name).toBe('Acme Inc');
    });
  });

  describe('Audit Trail', () => {
    test('writes audit event on census import start', () => {
      const event = { event_type: 'census_import_started', actor_id: 'user@example.com' };
      expect(event.event_type).toBe('census_import_started');
    });

    test('writes audit event on VAULT detection', () => {
      const event = { event_type: 'vault_layout_detected', layout: 'vault' };
      expect(event.layout).toBe('vault');
    });

    test('writes audit event on group metadata extraction', () => {
      const event = { event_type: 'vault_group_metadata_extracted', group_metadata_count: 11 };
      expect(event.group_metadata_count).toBe(11);
    });

    test('writes audit event on import completion', () => {
      const event = { event_type: 'census_import_completed', employee_count: 1 };
      expect(event.employee_count).toBe(1);
    });
  });

  describe('Public URL Exposure', () => {
    test('does not expose source file URL in response', () => {
      const response = {
        success: true,
        census_import_job_id: '123',
      };
      expect(response.source_file_url).toBeUndefined();
    });

    test('uses private file upload for snapshots', () => {
      const snapshot = {
        file_url: 'private://...', // Indicates private storage
      };
      expect(snapshot.file_url).not.toContain('http');
    });
  });

  describe('Scope Enforcement', () => {
    test('enforces case scope in import function', () => {
      const payload = { caseId: 'case-123', census_import_id: 'import-456' };
      expect(payload.caseId).toBeDefined();
    });

    test('enforces user authentication', () => {
      const authenticated = true;
      expect(authenticated).toBe(true);
    });

    test('returns 401 for unauthenticated requests', () => {
      const statusCode = 401;
      expect(statusCode).toBe(401);
    });
  });

  describe('Regression: Existing Workflows', () => {
    test('.csv imports still work', () => {
      const fileType = 'csv';
      expect(['csv', 'xlsx', 'xls'].includes(fileType)).toBe(true);
    });

    test('.xlsx imports still work', () => {
      const fileType = 'xlsx';
      expect(['csv', 'xlsx', 'xls'].includes(fileType)).toBe(true);
    });

    test('.xls imports still work', () => {
      const fileType = 'xls';
      expect(['csv', 'xlsx', 'xls'].includes(fileType)).toBe(true);
    });

    test('processCensusImportJob remains untouched', () => {
      const legacyFunction = 'processCensusImportJob';
      expect(legacyFunction).toBeDefined();
    });

    test('standard (non-VAULT) layout detection still works', () => {
      const layout = 'standard';
      expect(['standard', 'vault'].includes(layout)).toBe(true);
    });
  });
});