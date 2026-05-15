/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { extractRowsFromCsv, extractRowsFromXls, normalizeHeaderLabel, detectFileType } from '../lib/census/importPipeline.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { source_file_url, source_file_name } = payload || {};
    if (!source_file_url) return Response.json({ error: 'source_file_url is required' }, { status: 400 });

    const fileResponse = await fetch(source_file_url);
    if (!fileResponse.ok) return Response.json({ error: 'Could not fetch file' }, { status: 400 });

    // Detect file type from name or content-type
    const contentType = fileResponse.headers.get('content-type') || '';
    const fileType = detectFileType({ source_file_name: source_file_name || '', content_type: contentType });

    // Parse based on file type
    let rawRows = [];
    if (fileType === 'xls') {
      const buffer = await fileResponse.arrayBuffer();
      rawRows = await extractRowsFromXls(buffer);
    } else {
      const csvText = await fileResponse.text();
      rawRows = extractRowsFromCsv(csvText);
    }
    
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

    return Response.json({
      file_type: fileType,
      layout: isVaultLayout ? 'vault' : 'standard',
      headers: headers.map((h, i) => ({ index: i, name: h, normalized: normalizeHeaderLabel(h) })),
      preview_rows: dataRows.slice(0, 5),
      total_rows: dataRows.length,
      header_row_index: headerRowIndex,
      vault_marker_index: vaultMarkerIndex,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});