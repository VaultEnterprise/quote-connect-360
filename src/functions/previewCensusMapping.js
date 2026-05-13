/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { extractRowsFromCsv, normalizeCell, normalizeDateValue } from '../lib/census/importPipeline.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { source_file_url, mapping = {}, header_row_index = 0 } = payload || {};
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });
    if (!mapping || Object.keys(mapping).length === 0) return Response.json({ error: 'mapping is required' }, { status: 400 });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });

    const csvText = await fileResponse.text();
    const rawRows = extractRowsFromCsv(csvText);
    const dataRows = rawRows.slice(header_row_index + 1).filter(row => row.some(cell => cell && cell.trim()));

    // Reverse mapping: system_field -> source_column_index
    const reverseMapping = {};
    Object.entries(mapping).forEach(([sourceIndex, systemField]) => {
      if (systemField && systemField !== 'ignore') {
        reverseMapping[systemField] = parseInt(sourceIndex, 10);
      }
    });

    // Preview mapped rows
    const preview = dataRows.slice(0, 3).map((row, rowIdx) => {
      const mapped = {};
      Object.entries(reverseMapping).forEach(([field, colIndex]) => {
        const value = row[colIndex] || '';
        if (field === 'dob' || field === 'hire_date' || field === 'termination_date') {
          mapped[field] = normalizeDateValue(value);
        } else {
          mapped[field] = normalizeCell(value);
        }
      });
      return mapped;
    });

    return Response.json({
      preview,
      mapping: reverseMapping,
      total_preview_rows: preview.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});