/**
 * syncBulkEmployersToZoho
 * Syncs multiple employers from an agency to Zoho CRM in batch
 * 
 * Usage: base44.functions.invoke('syncBulkEmployersToZoho', { agency_id: 'xyz' })
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { agency_id } = await req.json();

    if (!agency_id) {
      return Response.json({ error: 'Missing agency_id' }, { status: 400 });
    }

    // Get Zoho credentials
    const apiKey = Deno.env.get('ZOHO_CRM_API_KEY');
    const orgId = Deno.env.get('ZOHO_CRM_ORG_ID');
    const region = Deno.env.get('ZOHO_CRM_REGION') || 'com';

    if (!apiKey || !orgId) {
      return Response.json({
        error: 'Zoho CRM credentials not configured.',
      }, { status: 500 });
    }

    // Fetch all employers for this agency
    const employers = await base44.asServiceRole.entities.EmployerGroup.filter(
      { agency_id },
      '-created_date',
      500
    );

    if (employers.length === 0) {
      return Response.json({
        success: true,
        message: 'No employers to sync',
        synced_count: 0,
      });
    }

    // Prepare batch data
    const zohoContacts = employers.map(emp => ({
      Last_Name: emp.name,
      Company: emp.dba_name || emp.name,
      Email: emp.email || '',
      Phone: emp.phone || '',
      Mailing_Street: emp.address || '',
      Mailing_City: emp.city || '',
      Mailing_State: emp.state || '',
      Mailing_Zip: emp.zip || '',
      Description: `EIN: ${emp.ein || 'N/A'} | Employees: ${emp.employee_count || 0}`,
    }));

    // Send in batches (Zoho has rate limits)
    const batchSize = 100;
    let syncedCount = 0;

    for (let i = 0; i < zohoContacts.length; i += batchSize) {
      const batch = zohoContacts.slice(i, i + batchSize);

      const zohoUrl = `https://www.zohoapis.${region}/crm/v3/contacts`;
      const response = await fetch(zohoUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${apiKey}`,
          'X-CRM-ORG': orgId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: batch }),
      });

      const data = await response.json();

      if (response.ok && data.data) {
        syncedCount += data.data.length;
      }

      // Rate limiting: wait between batches
      if (i + batchSize < zohoContacts.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    return Response.json({
      success: true,
      message: `Synced ${syncedCount} employers to Zoho`,
      total_employers: employers.length,
      synced_count: syncedCount,
    });
  } catch (error) {
    console.error('Error in bulk sync:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});