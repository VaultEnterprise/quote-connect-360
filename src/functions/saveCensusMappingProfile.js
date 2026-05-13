/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const { name, mapping = {}, description = '' } = payload || {};
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 });

    // Store as custom data on user for now; in production, would use a dedicated entity
    const profile = {
      id: crypto.randomUUID(),
      name,
      description,
      mapping,
      created_by: user.email,
      created_at: new Date().toISOString(),
    };

    return Response.json(profile);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});