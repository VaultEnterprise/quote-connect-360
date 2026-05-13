/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { name, mapping, description } = payload || {};

    if (!name || !mapping) {
      return Response.json({ error: 'Missing required fields: name, mapping' }, { status: 400 });
    }

    const profile = {
      id: crypto.randomUUID(),
      name,
      mapping,
      description: description || '',
      created_by: user.email,
      created_at: new Date().toISOString(),
    };

    return Response.json(profile);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});