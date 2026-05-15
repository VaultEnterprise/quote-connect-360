/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { canonicalCensusSchema } from '../lib/census/canonicalSchema.ts';
import { normalizeDateValue, normalizeCell } from '../lib/census/importPipeline.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { census_import_id, record } = payload || {};
    if (!census_import_id) return Response.json({ error: 'census_import_id is required' }, { status: 400 });
    if (!record) return Response.json({ error: 'record is required' }, { status: 400 });

    const normalized = { ...record };
    Object.entries(canonicalCensusSchema).forEach(([field, config]) => {
      if (field === 'dob') {
        normalized[field] = normalizeDateValue(normalized[field]);
      } else if (typeof config.transform === 'function') {
        normalized[field] = config.transform(normalized[field]);
      }
      if (typeof normalized[field] === 'string') {
        normalized[field] = normalizeCell(normalized[field]);
      }
    });

    return Response.json({ census_import_id, record: normalized });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});