import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const API_VERSION = 'v59.0';
const SALESFORCE_AUTH_HOSTS = [
  'https://login.salesforce.com',
  'https://test.salesforce.com',
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    const action = payload.action || 'status';
    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getConnection('salesforce');

    const authorizedFetch = async (url, options = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
    };

    const resolveInstanceBase = async () => {
      const configured = connectionConfig?.instance_url || connectionConfig?.instanceUrl || connectionConfig?.instance;
      if (configured) {
        return configured;
      }

      for (const host of SALESFORCE_AUTH_HOSTS) {
        const userInfoRes = await authorizedFetch(`${host}/services/oauth2/userinfo`);
        if (!userInfoRes.ok) {
          continue;
        }

        const userInfo = await userInfoRes.json();
        if (!userInfo?.organization_id || !userInfo?.user_id) {
          continue;
        }

        const identityRes = await authorizedFetch(`${host}/id/${userInfo.organization_id}/${userInfo.user_id}?version=latest`);
        if (!identityRes.ok) {
          continue;
        }

        const identity = await identityRes.json();
        const restUrl = identity?.urls?.rest || identity?.urls?.custom_domain;
        if (restUrl) {
          return String(restUrl).replace(/\/services\/data\/.*$/, '');
        }
      }

      throw new Error('Could not determine the Salesforce instance URL from the authorized connector.');
    };

    const instanceBase = await resolveInstanceBase();
    const sfApi = `${instanceBase}/services/data/${API_VERSION}`;

    const sfApiCall = async (path, options = {}) => {
      const res = await authorizedFetch(`${sfApi}${path}`, options);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`SF API ${res.status}: ${text}`);
      }
      return text ? JSON.parse(text) : {};
    };

    if (action === 'syncEmployers') {
      const employers = await base44.asServiceRole.entities.EmployerGroup.list('-updated_date', 200);
      let created = 0;
      let updated = 0;
      const errors = [];

      for (const emp of employers) {
        try {
          const sfPayload = {
            Name: emp.name,
            BillingStreet: emp.address,
            BillingCity: emp.city,
            BillingStateCode: emp.state,
            BillingPostalCode: emp.zip,
            BillingCountryCode: 'US',
            Phone: emp.phone,
            Website: emp.website,
            NumberOfEmployees: emp.employee_count,
            Description: `EIN: ${emp.ein || ''} | Industry: ${emp.industry || ''} | Eligible: ${emp.eligible_count || ''}`,
            Type: emp.status === 'active' ? 'Customer' : 'Prospect',
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
        } catch (error) {
          errors.push(`${emp.name}: ${error.message}`);
        }
      }

      return Response.json({ action, created, updated, errors, total: employers.length });
    }

    if (action === 'syncCases') {
      const [cases, employers] = await Promise.all([
        base44.asServiceRole.entities.BenefitCase.list('-updated_date', 200),
        base44.asServiceRole.entities.EmployerGroup.list('-updated_date', 500),
      ]);
      const employerMap = new Map(employers.map((emp) => [emp.id, emp]));
      let created = 0;
      let updated = 0;
      const errors = [];

      const STAGE_MAP = {
        draft: 'Prospecting',
        census_in_progress: 'Needs Analysis',
        census_validated: 'Needs Analysis',
        ready_for_quote: 'Value Proposition',
        quoting: 'Value Proposition',
        proposal_ready: 'Id. Decision Makers',
        employer_review: 'Perception Analysis',
        approved_for_enrollment: 'Proposal/Price Quote',
        enrollment_open: 'Negotiation/Review',
        enrollment_complete: 'Negotiation/Review',
        install_in_progress: 'Closed Won',
        active: 'Closed Won',
        renewed: 'Closed Won',
        closed: 'Closed Lost',
      };

      for (const bc of cases) {
        try {
          const employer = employerMap.get(bc.employer_group_id);
          const sfPayload = {
            Name: `${bc.employer_name || employer?.name || 'Unknown'} — ${bc.case_type?.replace(/_/g, ' ')} (${bc.case_number || bc.id.slice(-6)})`,
            StageName: STAGE_MAP[bc.stage] || 'Prospecting',
            CloseDate: bc.target_close_date || bc.effective_date || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            Type: bc.case_type?.replace(/_/g, ' '),
            Description: `Stage: ${bc.stage} | Priority: ${bc.priority} | Employees: ${bc.employee_count || '?'}`,
            LeadSource: 'QuoteConnect360',
            ...(employer?.sf_account_id ? { AccountId: employer.sf_account_id } : {}),
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
        } catch (error) {
          errors.push(`Case ${bc.case_number || bc.id.slice(-6)}: ${error.message}`);
        }
      }

      return Response.json({ action, created, updated, errors, total: cases.length });
    }

    if (action === 'syncProposals') {
      const [proposals, cases] = await Promise.all([
        base44.asServiceRole.entities.Proposal.list('-updated_date', 200),
        base44.asServiceRole.entities.BenefitCase.list('-updated_date', 500),
      ]);
      const caseMap = new Map(cases.map((item) => [item.id, item]));
      let created = 0;
      let updated = 0;
      const errors = [];

      for (const prop of proposals) {
        try {
          const linkedCase = caseMap.get(prop.case_id);
          const opportunityId = linkedCase?.sf_opportunity_id;
          const sfPayload = {
            Name: prop.title || `Proposal ${prop.id.slice(-6)}`,
            Status: prop.status === 'approved' ? 'Accepted' : prop.status === 'rejected' ? 'Rejected' : 'Draft',
            ExpirationDate: prop.expires_at ? String(prop.expires_at).slice(0, 10) : null,
            Description: `Version: ${prop.version || 1} | Employer: ${prop.employer_name || ''} | ${prop.notes || ''}`,
          };

          if (prop.sf_quote_id) {
            await sfApiCall(`/sobjects/Quote/${prop.sf_quote_id}`, {
              method: 'PATCH',
              body: JSON.stringify(sfPayload),
            });
            updated++;
          } else {
            if (!opportunityId) {
              errors.push(`${sfPayload.Name}: linked case is not synced to a Salesforce opportunity yet`);
              continue;
            }
            const result = await sfApiCall('/sobjects/Quote', {
              method: 'POST',
              body: JSON.stringify({ ...sfPayload, OpportunityId: opportunityId }),
            });
            await base44.asServiceRole.entities.Proposal.update(prop.id, { sf_quote_id: result.id });
            created++;
          }
        } catch (error) {
          errors.push(`Proposal ${prop.id.slice(-6)}: ${error.message}`);
        }
      }

      return Response.json({ action, created, updated, errors, total: proposals.length });
    }

    if (action === 'syncContacts') {
      const employers = await base44.asServiceRole.entities.EmployerGroup.list('-updated_date', 200);
      let created = 0;
      let updated = 0;
      const errors = [];

      for (const emp of employers) {
        if (!emp.primary_contact_email) continue;
        try {
          const nameParts = (emp.primary_contact_name || '').trim().split(/\s+/).filter(Boolean);
          const sfPayload = {
            FirstName: nameParts.slice(0, -1).join(' ') || '',
            LastName: nameParts.slice(-1)[0] || emp.primary_contact_name || emp.name || 'Unknown',
            Email: emp.primary_contact_email,
            Phone: emp.primary_contact_phone,
            ...(emp.sf_account_id ? { AccountId: emp.sf_account_id } : {}),
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
        } catch (error) {
          errors.push(`${emp.name} contact: ${error.message}`);
        }
      }

      return Response.json({ action, created, updated, errors, total: employers.length });
    }

    if (action === 'pullAccounts') {
      const result = await sfApiCall('/query?q=' + encodeURIComponent('SELECT Id, Name, BillingStreet, BillingCity, BillingState, BillingPostalCode, Phone, Website, NumberOfEmployees FROM Account ORDER BY LastModifiedDate DESC LIMIT 200'));
      const records = result.records || [];
      let created = 0;
      let skipped = 0;
      const errors = [];

      const existingEmployers = await base44.asServiceRole.entities.EmployerGroup.list('-created_date', 500);
      const existingSfIds = new Set(existingEmployers.map((item) => item.sf_account_id).filter(Boolean));
      const agencies = await base44.asServiceRole.entities.Agency.list('-created_date', 1);
      const defaultAgencyId = agencies[0]?.id || existingEmployers[0]?.agency_id;

      if (!defaultAgencyId) {
        return Response.json({ error: 'No agency found to attach imported accounts.' }, { status: 400 });
      }

      for (const rec of records) {
        if (existingSfIds.has(rec.Id)) {
          skipped++;
          continue;
        }

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
        } catch (error) {
          errors.push(`${rec.Name}: ${error.message}`);
        }
      }

      return Response.json({ action, created, skipped, errors, total: records.length });
    }

    if (action === 'status') {
      const [accountCount, oppCount, contactCount] = await Promise.all([
        sfApiCall('/query?q=' + encodeURIComponent('SELECT COUNT() FROM Account')),
        sfApiCall('/query?q=' + encodeURIComponent('SELECT COUNT() FROM Opportunity')),
        sfApiCall('/query?q=' + encodeURIComponent('SELECT COUNT() FROM Contact')),
      ]);

      return Response.json({
        action,
        connected: true,
        api_version: API_VERSION,
        instance_url: instanceBase,
        sf_counts: {
          accounts: accountCount.totalSize,
          opportunities: oppCount.totalSize,
          contacts: contactCount.totalSize,
        },
      });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});