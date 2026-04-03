/**
 * syncEmployerToZohoCRM
 * Syncs an EmployerGroup to Zoho CRM as a Contact/Account
 * 
 * SETUP REQUIRED:
 * 1. Set ZOHO_CRM_API_KEY secret (from https://accounts.zoho.com/developerconsole)
 * 2. Set ZOHO_CRM_ORG_ID secret (your Zoho CRM Organization ID)
 * 3. Set ZOHO_CRM_REGION (e.g., "com" for US, "eu" for EU)
 * 
 * Usage: base44.functions.invoke('syncEmployerToZohoCRM', { employer_group_id: 'xyz' })
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { employer_group_id } = await req.json();

    if (!employer_group_id) {
      return Response.json({ error: 'Missing employer_group_id' }, { status: 400 });
    }

    // Get employer details
    const employer = await base44.entities.EmployerGroup.get(employer_group_id);

    if (!employer) {
      return Response.json({ error: 'Employer not found' }, { status: 404 });
    }

    // Get Zoho credentials
    const apiKey = Deno.env.get('ZOHO_CRM_API_KEY');
    const orgId = Deno.env.get('ZOHO_CRM_ORG_ID');
    const region = Deno.env.get('ZOHO_CRM_REGION') || 'com';

    if (!apiKey || !orgId) {
      return Response.json({
        error: 'Zoho CRM credentials not configured. Set ZOHO_CRM_API_KEY and ZOHO_CRM_ORG_ID secrets.',
        setup_url: 'https://accounts.zoho.com/developerconsole'
      }, { status: 500 });
    }

    // Prepare contact data for Zoho
    const zohoContact = {
      Last_Name: employer.name,
      Company: employer.dba_name || employer.name,
      Email: employer.email || '',
      Phone: employer.phone || '',
      Mailing_Street: employer.address || '',
      Mailing_City: employer.city || '',
      Mailing_State: employer.state || '',
      Mailing_Zip: employer.zip || '',
      Description: `EIN: ${employer.ein || 'N/A'} | Employees: ${employer.employee_count || 0}`,
      // Custom fields (adjust based on your Zoho setup)
      Custom_Field_1: employer.ein || '', // Adjust field name as needed
    };

    // Call Zoho CRM API
    const zohoUrl = `https://www.zohoapis.${region}/crm/v3/contacts`;
    const zohoResponse = await fetch(zohoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${apiKey}`,
        'X-CRM-ORG': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [zohoContact],
      }),
    });

    const zohoData = await zohoResponse.json();

    if (!zohoResponse.ok) {
      return Response.json({
        error: 'Failed to sync to Zoho CRM',
        details: zohoData,
      }, { status: 500 });
    }

    // Store Zoho contact ID for reference
    if (zohoData.data && zohoData.data[0]) {
      const zohoContactId = zohoData.data[0].id;
      // Optionally: store zoho_contact_id in employer metadata
      console.log(`Synced employer ${employer_group_id} to Zoho contact ${zohoContactId}`);
    }

    return Response.json({
      success: true,
      message: 'Employer synced to Zoho CRM',
      zoho_response: zohoData,
    });
  } catch (error) {
    console.error('Error syncing to Zoho:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});