import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, ...params } = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('salesforce');

    const sfFetch = async (path, options = {}) => {
      const res = await fetch(`https://login.salesforce.com${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`SF API ${res.status}: ${text}`);
      return text ? JSON.parse(text) : {};
    };

    // First: get the SF instance URL from identity endpoint
    const identity = await sfFetch('/id');
    const instanceUrl = identity.urls?.rest?.replace('/services/data/{version}/', '').replace('/services/data/v', '').split('?')[0];
    // Actually parse instance from profile URL
    const instanceBase = identity.profile?.match(/^(https:\/\/[^/]+)/)?.[1] || 'https://login.salesforce.com';
    const apiVersion = 'v59.0';
    const sfApi = `${instanceBase}/services/data/${apiVersion}`;

    const sfApiCall = async (path, options = {}) => {
      const res = await fetch(`${sfApi}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`SF API ${res.status}: ${text}`);
      return text ? JSON.parse(text) : {};
    };

    // ── PUSH: Employers → SF Accounts ──────────────────────────────
    if (action === 'syncEmployers') {
      const employers = await base44.asServiceRole.entities.EmployerGroup.list('-updated_date', 200);
      let created = 0, updated = 0, errors = [];

      for (const emp of employers) {
        try {
          const sfPayload = {
            Name: emp.name,
            BillingStreet: emp.address,
            BillingCity: emp.city,
            BillingState: emp.state,
            BillingPostalCode: emp.zip,
            Phone: emp.phone,
            Website: emp.website,
            NumberOfEmployees: emp.employee_count,
            Description: `EIN: ${emp.ein || ''} | Industry: ${emp.industry || ''} | Eligible: ${emp.eligible_count || ''}`,
            Type: 'Prospect',
          };

          if (emp.sf_account_id) {
            await sfApiCall(`/sobjects/Account/${emp.sf_account_id}`, {
              method: 'PATCH',
              body: JSON.stringify(sfPayload),
            });
            updated++;
          } else {
            const result = await sfApiCall('/sobjects/Account', {
              method: 'POST',
              body: JSON.stringify(sfPayload),
            });
            await base44.asServiceRole.entities.EmployerGroup.update(emp.id, { sf_account_id: result.id });
            created++;
          }
        } catch (e) {
          errors.push(`${emp.name}: ${e.message}`);
        }
      }
      return Response.json({ action, created, updated, errors, total: employers.length });
    }

    // ── PUSH: BenefitCases → SF Opportunities ─────────────────────
    if (action === 'syncCases') {
      const cases = await base44.asServiceRole.entities.BenefitCase.list('-updated_date', 200);
      let created = 0, updated = 0, errors = [];

      const STAGE_MAP = {
        draft: 'Prospecting', census_in_progress: 'Needs Analysis', census_validated: 'Needs Analysis',
        ready_for_quote: 'Value Proposition', quoting: 'Value Proposition', proposal_ready: 'Id. Decision Makers',
        employer_review: 'Perception Analysis', approved_for_enrollment: 'Proposal/Price Quote',
        enrollment_open: 'Negotiation/Review', enrollment_complete: 'Negotiation/Review',
        install_in_progress: 'Closed Won', active: 'Closed Won', renewed: 'Closed Won',
        closed: 'Closed Lost',
      };

      for (const bc of cases) {
        try {
          const sfPayload = {
            Name: `${bc.employer_name || 'Unknown'} — ${bc.case_type?.replace(/_/g, ' ')} (${bc.case_number || bc.id.slice(-6)})`,
            StageName: STAGE_MAP[bc.stage] || 'Prospecting',
            CloseDate: bc.target_close_date || bc.effective_date || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            Type: bc.case_type?.replace(/_/g, ' '),
            Description: `Stage: ${bc.stage} | Priority: ${bc.priority} | Employees: ${bc.employee_count || '?'}`,
            LeadSource: 'QuoteConnect360',
          };

          if (bc.sf_opportunity_id) {
            await sfApiCall(`/sobjects/Opportunity/${bc.sf_opportunity_id}`, {
              method: 'PATCH',
              body: JSON.stringify(sfPayload),
            });
            updated++;
          } else {
            const result = await sfApiCall('/sobjects/Opportunity', {
              method: 'POST',
              body: JSON.stringify(sfPayload),
            });
            await base44.asServiceRole.entities.BenefitCase.update(bc.id, { sf_opportunity_id: result.id });
            created++;
          }
        } catch (e) {
          errors.push(`Case ${bc.case_number || bc.id.slice(-6)}: ${e.message}`);
        }
      }
      return Response.json({ action, created, updated, errors, total: cases.length });
    }

    // ── PUSH: Proposals → SF Quotes ───────────────────────────────
    if (action === 'syncProposals') {
      const proposals = await base44.asServiceRole.entities.Proposal.list('-updated_date', 200);
      let created = 0, updated = 0, errors = [];

      for (const prop of proposals) {
        try {
          const sfPayload = {
            Name: prop.title || `Proposal ${prop.id.slice(-6)}`,
            Status: prop.status === 'approved' ? 'Accepted' : prop.status === 'rejected' ? 'Rejected' : 'Draft',
            ExpirationDate: prop.expiration_date || null,
            Description: `Version: ${prop.version_number || 1} | Plans: ${prop.plan_count || '?'} | ${prop.notes || ''}`,
          };

          if (prop.sf_quote_id) {
            await sfApiCall(`/sobjects/Quote/${prop.sf_quote_id}`, {
              method: 'PATCH',
              body: JSON.stringify(sfPayload),
            });
            updated++;
          } else {
            // Quotes require an OpportunityId — try to link via case
            if (!prop.sf_opportunity_id && !prop.case_id) { errors.push(`${sfPayload.Name}: no linked opportunity`); continue; }
            const result = await sfApiCall('/sobjects/Quote', {
              method: 'POST',
              body: JSON.stringify({ ...sfPayload, OpportunityId: prop.sf_opportunity_id }),
            });
            await base44.asServiceRole.entities.Proposal.update(prop.id, { sf_quote_id: result.id });
            created++;
          }
        } catch (e) {
          errors.push(`Proposal ${prop.id.slice(-6)}: ${e.message}`);
        }
      }
      return Response.json({ action, created, updated, errors, total: proposals.length });
    }

    // ── PUSH: Contacts (primary employer contacts) → SF Contacts ──
    if (action === 'syncContacts') {
      const employers = await base44.asServiceRole.entities.EmployerGroup.list('-updated_date', 200);
      let created = 0, updated = 0, errors = [];

      for (const emp of employers) {
        if (!emp.primary_contact_name && !emp.primary_contact_email) continue;
        try {
          const nameParts = (emp.primary_contact_name || '').split(' ');
          const sfPayload = {
            FirstName: nameParts.slice(0, -1).join(' ') || '',
            LastName: nameParts.slice(-1)[0] || emp.primary_contact_name || 'Unknown',
            Email: emp.primary_contact_email,
            Phone: emp.primary_contact_phone,
            AccountId: emp.sf_account_id || undefined,
          };

          if (emp.sf_contact_id) {
            await sfApiCall(`/sobjects/Contact/${emp.sf_contact_id}`, {
              method: 'PATCH',
              body: JSON.stringify(sfPayload),
            });
            updated++;
          } else {
            const result = await sfApiCall('/sobjects/Contact', {
              method: 'POST',
              body: JSON.stringify(sfPayload),
            });
            await base44.asServiceRole.entities.EmployerGroup.update(emp.id, { sf_contact_id: result.id });
            created++;
          }
        } catch (e) {
          errors.push(`${emp.name} contact: ${e.message}`);
        }
      }
      return Response.json({ action, created, updated, errors, total: employers.length });
    }

    // ── PULL: SF Accounts → EmployerGroup (create missing ones) ───
    if (action === 'pullAccounts') {
      const result = await sfApiCall('/query?q=' + encodeURIComponent("SELECT Id,Name,BillingStreet,BillingCity,BillingState,BillingPostalCode,Phone,Website,NumberOfEmployees FROM Account ORDER BY LastModifiedDate DESC LIMIT 200"));
      const records = result.records || [];
      let created = 0, skipped = 0, errors = [];

      const existingEmployers = await base44.asServiceRole.entities.EmployerGroup.list('-created_date', 500);
      const existingSfIds = new Set(existingEmployers.map(e => e.sf_account_id).filter(Boolean));

      // Need agency_id — get first agency
      const agencies = await base44.asServiceRole.entities.Agency.list('-created_date', 1);
      const defaultAgencyId = agencies[0]?.id;
      if (!defaultAgencyId) return Response.json({ error: 'No agency found — create an agency first' }, { status: 400 });

      for (const rec of records) {
        if (existingSfIds.has(rec.Id)) { skipped++; continue; }
        try {
          await base44.asServiceRole.entities.EmployerGroup.create({
            agency_id: defaultAgencyId,
            name: rec.Name,
            address: rec.BillingStreet,
            city: rec.BillingCity,
            state: rec.BillingState,
            zip: rec.BillingPostalCode,
            phone: rec.Phone,
            website: rec.Website,
            employee_count: rec.NumberOfEmployees,
            sf_account_id: rec.Id,
            status: 'prospect',
          });
          created++;
        } catch (e) {
          errors.push(`${rec.Name}: ${e.message}`);
        }
      }
      return Response.json({ action, created, skipped, errors, total: records.length });
    }

    // ── STATUS: Check SF connection & org info ─────────────────────
    if (action === 'status') {
      const orgInfo = await sfApiCall('/');
      const accountCount = await sfApiCall('/query?q=' + encodeURIComponent('SELECT COUNT() FROM Account'));
      const oppCount = await sfApiCall('/query?q=' + encodeURIComponent('SELECT COUNT() FROM Opportunity'));
      const contactCount = await sfApiCall('/query?q=' + encodeURIComponent('SELECT COUNT() FROM Contact'));
      return Response.json({
        action,
        connected: true,
        api_version: apiVersion,
        instance_url: instanceBase,
        org_name: orgInfo.label,
        sf_counts: {
          accounts: accountCount.totalSize,
          opportunities: oppCount.totalSize,
          contacts: contactCount.totalSize,
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});