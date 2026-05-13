/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function normalizeCell(value) {
  if (value === null || value === undefined || value === false) return '';
  if (typeof value === 'number') return String(value);
  return String(value).replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractRowsFromCsv(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      rows.push(current);
      current = '';
      if (char === '\r' && next === '\n') i += 1;
    } else {
      current += char;
    }
  }
  if (current.length) rows.push(current);
  return rows.map((line) => {
    const cells = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        cells.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { caseId, census_import_id, source_file_url, source_file_name, mapping = {}, header_row_index = 0 } = payload || {};

    if (!caseId || !source_file_url) {
      return Response.json({ error: 'Missing caseId or source_file_url' }, { status: 400 });
    }

    // Fetch file
    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });

    const csvText = await fileResponse.text();
    const rawRows = extractRowsFromCsv(csvText).map(row => row.map(cell => normalizeCell(cell)));
    const dataRows = rawRows.slice(header_row_index + 1).filter(row => row.some(cell => cell && cell.trim()));

    // Reverse mapping
    const reverseMapping = {};
    Object.entries(mapping).forEach(([sourceIndex, systemField]) => {
      if (systemField && systemField !== 'ignore') {
        reverseMapping[systemField] = parseInt(sourceIndex, 10);
      }
    });

    // Parse members
    const records = [];
    const seenHouseholds = new Set();
    let householdSequence = 0;
    let activeHouseholdKey = '';

    dataRows.forEach((row, rowOffset) => {
      const relIdx = reverseMapping['relationship'];
      const firstNameIdx = reverseMapping['first_name'];
      const lastNameIdx = reverseMapping['last_name'];
      const dobIdx = reverseMapping['dob'];

      if (relIdx === undefined || firstNameIdx === undefined || lastNameIdx === undefined || dobIdx === undefined) {
        return;
      }

      const rel = (row[relIdx] || '').toUpperCase().trim();
      if (!['EMP', 'SPS', 'DEP', 'EMPLOYEE', 'SPOUSE', 'DEPENDENT'].includes(rel)) return;

      const firstName = row[firstNameIdx] || '';
      const lastName = row[lastNameIdx] || '';
      const dob = row[dobIdx] || '';

      if (!firstName || !lastName || !dob) return;

      const relCode = { EMP: 'EMP', EMPLOYEE: 'EMP', SPS: 'SPS', SPOUSE: 'SPS', DEP: 'DEP', DEPENDENT: 'DEP' }[rel] || rel;

      let householdKey = `${firstName}|${lastName}|${dob}`.toLowerCase();
      if (relCode === 'EMP') {
        if (seenHouseholds.has(householdKey)) {
          householdSequence += 1;
          householdKey = `${householdKey}_${householdSequence}`;
        }
        seenHouseholds.add(householdKey);
        activeHouseholdKey = householdKey;
      }

      records.push({
        relationship_code: relCode,
        first_name: firstName,
        last_name: lastName,
        dob,
        household_key: relCode === 'EMP' ? householdKey : activeHouseholdKey,
      });
    });

    // Create job
    const job = await base44.asServiceRole.entities.CensusImportJob.create({
      case_id: caseId,
      census_import_id: census_import_id || crypto.randomUUID(),
      status: 'completed',
      source_file_name: source_file_name || 'census.csv',
      source_file_url,
      employee_count: records.filter(r => r.relationship_code === 'EMP').length,
      dependent_count: records.filter(r => r.relationship_code !== 'EMP').length,
    });

    return Response.json({
      success: true,
      census_import_job_id: job.id,
      records_imported: records.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});