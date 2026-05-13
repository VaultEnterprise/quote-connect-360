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
    const { source_file_url, mapping = {}, header_row_index = 0 } = payload || {};
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });
    if (!mapping || Object.keys(mapping).length === 0) return Response.json({ error: 'mapping is required' }, { status: 400 });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });

    const csvText = await fileResponse.text();
    const rawRows = extractRowsFromCsv(csvText).map(row => row.map(cell => normalizeCell(cell)));
    const dataRows = rawRows.slice(header_row_index + 1).filter(row => row.some(cell => cell && cell.trim()));

    // Reverse mapping: system_field -> source_column_index
    const reverseMapping = {};
    Object.entries(mapping).forEach(([sourceIndex, systemField]) => {
      if (systemField && systemField !== 'ignore') {
        reverseMapping[systemField] = parseInt(sourceIndex, 10);
      }
    });

    // Preview mapped rows
    const preview = dataRows.slice(0, 3).map((row) => {
      const mapped = {};
      Object.entries(reverseMapping).forEach(([field, colIndex]) => {
        mapped[field] = row[colIndex] || '';
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