/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { extractRowsFromCsv, normalizeHeaderLabel } from '../lib/census/importPipeline.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { source_file_url } = payload || {};
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });

    const csvText = await fileResponse.text();
    const rawRows = extractRowsFromCsv(csvText);
    
    if (rawRows.length === 0) return Response.json({ error: 'File is empty' }, { status: 400 });

    // For now, support first sheet (CSV) or first sheet of XLSX
    // Detect header row: look for common census headers
    let headerRowIndex = 0;
    const commonHeaders = ['relationship', 'first name', 'last name', 'dob', 'date of birth', 'first_name', 'last_name', 'employee', 'dependent'];
    
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const normalized = rawRows[i].map(normalizeHeaderLabel);
      const matches = normalized.filter(h => commonHeaders.some(ch => h.includes(ch))).length;
      if (matches >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rawRows[headerRowIndex] || [];
    const dataRows = rawRows.slice(headerRowIndex + 1).filter(row => row.some(cell => cell && cell.trim()));

    return Response.json({
      headers: headers.map((h, i) => ({ index: i, name: h, normalized: normalizeHeaderLabel(h) })),
      preview_rows: dataRows.slice(0, 5),
      total_rows: dataRows.length,
      header_row_index: headerRowIndex,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});