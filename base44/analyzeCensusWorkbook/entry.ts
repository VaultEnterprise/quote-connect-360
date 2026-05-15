/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Inline utility functions (cannot import from /lib in deployed functions)
function normalizeCell(value) {
  if (value === null || value === undefined || value === false) return '';
  if (typeof value === 'number') return String(value);
  return String(value).replace(/\r/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeHeaderLabel(value) {
  return normalizeCell(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function detectFileType({ source_file_name = '', content_type = '', file_type = '', magic_bytes = null }) {
  const fileName = source_file_name.toLowerCase();
  const type = content_type.toLowerCase();
  const clientType = file_type.toLowerCase();
  
  // Check magic bytes first (highest confidence)
  if (magic_bytes && magic_bytes.length >= 2) {
    const pk = magic_bytes[0] === 0x50 && magic_bytes[1] === 0x4B;
    if (pk) return 'xlsx'; // ZIP magic = XLSX
  }
  
  // Check by extension
  if (fileName.endsWith('.xlsx')) return 'xlsx';
  if (fileName.endsWith('.xls')) return 'xls';
  if (fileName.endsWith('.csv')) return 'csv';
  
  // Check by MIME type
  if (type.includes('spreadsheetml')) return 'xlsx';
  if (type === 'application/vnd.ms-excel') return 'xls';
  if (clientType.includes('spreadsheetml')) return 'xlsx';
  if (clientType === 'application/vnd.ms-excel') return 'xls';
  
  return 'csv';
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { source_file_url, source_file_name = '', file_type = '' } = payload || {};
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });

    // Read as buffer first to detect magic bytes
    const buffer = await fileResponse.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const magicBytes = uint8.slice(0, 4);
    
    // Detect file type from extension, MIME, and magic bytes
    const contentType = fileResponse.headers.get('content-type') || '';
    const detectedType = detectFileType({ 
      source_file_name: source_file_name || '', 
      content_type: contentType,
      file_type: file_type || '',
      magic_bytes: Array.from(magicBytes)
    });

    // Parse based on file type
    let rawRows = [];
    if (detectedType === 'xls' || detectedType === 'xlsx') {
      rawRows = await extractRowsFromXls(buffer);
    } else {
      // For CSV, decode buffer as text
      const text = new TextDecoder().decode(uint8);
      rawRows = extractRowsFromCsv(text);
    }
    
    // Normalize all cells
    rawRows = rawRows.map(row => row.map(cell => normalizeCell(cell)));
    
    if (rawRows.length === 0) return Response.json({ error: 'File is empty or unsupported format' }, { status: 400 });

    // Detect VAULT layout first
    let headerRowIndex = 0;
    let isVaultLayout = false;
    const VAULT_CENSUS_MARKER = 'CENSUS:';
    
    // Scan for VAULT CENSUS: marker
    let vaultMarkerIndex = -1;
    for (let i = 0; i < rawRows.length; i++) {
      const firstCell = rawRows[i][0]?.trim?.() || '';
      if (firstCell.toUpperCase() === VAULT_CENSUS_MARKER) {
        vaultMarkerIndex = i;
        isVaultLayout = true;
        break;
      }
    }

    if (isVaultLayout && vaultMarkerIndex >= 0 && vaultMarkerIndex + 1 < rawRows.length) {
      // VAULT layout: use row immediately after CENSUS: marker as header
      headerRowIndex = vaultMarkerIndex + 1;
    } else {
      // Standard layout: look for common census headers
      const commonHeaders = ['relationship', 'first name', 'last name', 'dob', 'date of birth', 'first_name', 'last_name', 'employee', 'dependent'];
      for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const normalized = rawRows[i].map(normalizeHeaderLabel);
        const matches = normalized.filter(h => commonHeaders.some(ch => h.includes(ch))).length;
        if (matches >= 2) {
          headerRowIndex = i;
          break;
        }
      }
    }

    const headers = rawRows[headerRowIndex] || [];
    const dataRows = rawRows.slice(headerRowIndex + 1).filter(row => row.some(cell => cell && cell.trim()));

    // Extract VAULT group metadata
    let groupMetadata = null;
    if (isVaultLayout) {
      const fieldMap = {
        'legal group name': 'legal_group_name',
        'tax id': 'tax_id',
        'sic code': 'sic_code',
        'address': 'address',
        'city': 'city',
        'state': 'state',
        'zip': 'zip',
        'eligible employees': 'total_eligible_employees',
        'employees on current plan': 'total_employees_current_plan',
        'current carrier': 'current_carrier',
        'desired effective date': 'desired_effective_date',
        'years with carrier': 'years_with_carrier',
      };
      groupMetadata = {};
      const groupInfoStart = rawRows.findIndex((r) => normalizeCell(r[0] || '').includes('GROUP') || normalizeCell(r[1] || '').includes('GROUP'));
      if (groupInfoStart >= 0) {
        const endIdx = vaultMarkerIndex;
        for (let i = groupInfoStart + 1; i < endIdx; i++) {
          const row = rawRows[i] || [];
          for (let j = 1; j < row.length - 1; j += 2) {
            const key = normalizeCell(row[j] || '').toLowerCase().replace(/[^a-z0-9\s]/g, '');
            const value = normalizeCell(row[j + 1] || '');
            if (key && value) {
              for (const [matchKey, fieldName] of Object.entries(fieldMap)) {
                if (key.includes(matchKey)) {
                  groupMetadata[fieldName] = value;
                  break;
                }
              }
            }
          }
        }
      }
    }

    return Response.json({
      file_type: fileType,
      layout: isVaultLayout ? 'vault' : 'standard',
      headers: headers.map((h, i) => ({ index: i, name: h, normalized: normalizeHeaderLabel(h) })),
      preview_rows: dataRows.slice(0, 5),
      total_rows: dataRows.length,
      header_row_index: headerRowIndex,
      vault_marker_index: vaultMarkerIndex,
      group_metadata: groupMetadata,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});