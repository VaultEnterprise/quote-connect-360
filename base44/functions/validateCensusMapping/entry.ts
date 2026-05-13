/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { mapping = {} } = payload || {};

    // Required fields for census import
    const requiredFields = ['relationship', 'first_name', 'last_name', 'dob'];
    
    // Reverse mapping: system_field -> source_column_index
    const reverseMapping = {};
    Object.entries(mapping).forEach(([sourceIndex, systemField]) => {
      if (systemField && systemField !== 'ignore') {
        reverseMapping[systemField] = parseInt(sourceIndex, 10);
      }
    });

    const missingRequired = requiredFields.filter(field => !reverseMapping[field]);
    const isValid = missingRequired.length === 0;

    return Response.json({
      valid: isValid,
      missing_required: missingRequired,
      mapped_fields: Object.keys(reverseMapping),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});