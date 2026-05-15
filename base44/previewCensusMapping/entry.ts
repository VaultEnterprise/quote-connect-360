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

async function extractRowsFromXls(buffer) {
  try {
    const XLSX = await import('npm:xlsx@0.18.5');
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    if (!workbook.SheetNames.length) return [];
    
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    return sheetRows.map(row => 
      (Array.isArray(row) ? row : [row]).map(cell => normalizeCell(cell))
    );
  } catch (biffError) {
    try {
      const view = new Uint8Array(buffer);
      const text = new TextDecoder().decode(view);
      if (text.includes(',') || text.includes('\n')) {
        return extractRowsFromCsv(text);
      }
    } catch {}
    return [];
  }
}

function detectFileType({ source_file_name = '', content_type = '', file_type = '', magic_bytes = null }) {
  const fileName = source_file_name.toLowerCase();
  const type = content_type.toLowerCase();
  const clientType = file_type.toLowerCase();
  
  if (magic_bytes && magic_bytes.length >= 2) {
    const pk = magic_bytes[0] === 0x50 && magic_bytes[1] === 0x4B;
    if (pk) return 'xlsx';
  }
  
  if (fileName.endsWith('.xlsx')) return 'xlsx';
  if (fileName.endsWith('.xls')) return 'xls';
  if (fileName.endsWith('.csv')) return 'csv';
  
  if (type.includes('spreadsheetml')) return 'xlsx';
  if (type === 'application/vnd.ms-excel') return 'xls';
  if (clientType.includes('spreadsheetml')) return 'xlsx';
  if (clientType === 'application/vnd.ms-excel') return 'xls';
  
  return 'csv';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { source_file_url, mapping = {}, header_row_index = 0, source_file_name = '', file_type = '' } = payload || {};
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });
    if (!mapping || Object.keys(mapping).length === 0) return Response.json({ error: 'mapping is required' }, { status: 400 });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });

    const buffer = await fileResponse.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const magicBytes = uint8.slice(0, 4);
    
    const contentType = fileResponse.headers.get('content-type') || '';
    const detectedType = detectFileType({ 
      source_file_name, 
      content_type: contentType,
      file_type,
      magic_bytes: Array.from(magicBytes)
    });

    let rawRows = [];
    if (detectedType === 'xls' || detectedType === 'xlsx') {
      rawRows = await extractRowsFromXls(buffer);
    } else {
      const text = new TextDecoder().decode(uint8);
      rawRows = extractRowsFromCsv(text);
    }
    
    rawRows = rawRows.map(row => row.map(cell => normalizeCell(cell)));
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