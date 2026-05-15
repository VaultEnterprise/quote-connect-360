/**
 * syncZohoContactsToEmployers
 * Fetches contacts from Zoho CRM and syncs them to EmployerGroup
 * 
 * SETUP REQUIRED:
 * 1. Set ZOHO_CRM_API_KEY secret
 * 2. Set ZOHO_CRM_ORG_ID secret
 * 3. Set ZOHO_CRM_REGION (e.g., "com" for US, "eu" for EU)
 * 
 * Usage: base44.functions.invoke('syncZohoContactsToEmployers', { agency_id: 'xyz' })
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
        setup_url: 'https://accounts.zoho.com/developerconsole'
      }, { status: 500 });
    }

    // Fetch contacts from Zoho
    const zohoUrl = `https://www.zohoapis.${region}/crm/v3/contacts?per_page=200`;
    const zohoResponse = await fetch(zohoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${apiKey}`,
        'X-CRM-ORG': orgId,
      },
    });

    const zohoData = await zohoResponse.json();

    if (!zohoResponse.ok) {
      return Response.json({
        error: 'Failed to fetch from Zoho CRM',
        details: zohoData,
      }, { status: 500 });
    }

    const contacts = zohoData.data || [];
    let syncedCount = 0;
    const errors = [];

    // Sync each contact to EmployerGroup
    for (const contact of contacts) {
      try {
        // Check if employer already exists by email or name
        const existing = await base44.asServiceRole.entities.EmployerGroup.filter({
          agency_id,
          email: contact.Email,
        }, '-created_date', 1);

        const employerData = {
          agency_id,
          name: contact.Company || contact.Last_Name,
          email: contact.Email,
          phone: contact.Phone,
          address: contact.Mailing_Street,
          city: contact.Mailing_City,
          state: contact.Mailing_State,
          zip: contact.Mailing_Zip,
          status: 'prospect',
          primary_contact_name: `${contact.First_Name || ''} ${contact.Last_Name || ''}`.trim(),
          primary_contact_email: contact.Email,
          primary_contact_phone: contact.Phone,
        };

        if (existing.length > 0) {
          // Update existing
          await base44.asServiceRole.entities.EmployerGroup.update(existing[0].id, employerData);
        } else {
          // Create new
          await base44.asServiceRole.entities.EmployerGroup.create(employerData);
        }

        syncedCount++;
      } catch (err) {
        errors.push({
          contact_id: contact.id,
          contact_name: contact.Last_Name,
          error: err.message,
        });
      }
    }

    return Response.json({
      success: true,
      message: `Synced ${syncedCount} contacts from Zoho`,
      total_contacts: contacts.length,
      synced_count: syncedCount,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('Error syncing from Zoho:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});