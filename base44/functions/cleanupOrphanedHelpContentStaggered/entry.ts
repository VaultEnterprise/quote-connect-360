import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const REMAINING_ORPHANED = [
  "FLD-RENEWAL-CASE-SUMMARY-STATUS",
  "FLD-RENEWAL-CASE-APPROVAL-DECISION",
  "BTN-RENEWAL-CASE-APPROVAL-SUBMIT",
  "ACT-CLAIMS-LIST-GRID-VIEW-DETAIL",
  "FLD-SETTINGS-NOTIFICATIONS-GENERAL-ENABLE-EMAIL",
  "BTN-RENEWAL-CASE-HEADER-SAVE",
  "COL-CLAIMS-LIST-GRID-STATUS",
  "COL-CLAIMS-LIST-GRID-CLAIM-NUMBER",
  "BTN-SETTINGS-NOTIFICATIONS-SAVE",
  "CMP-GLOBAL-CONTEXT-HELP-MODAL",
  "CMP-GLOBAL-HELP-AI-LAUNCHER",
  "TEST.FIELD",
  "FLD-SETTINGS-NOTIFICATIONS-GENERAL-ENABLE-SMS",
  "GRID-CLAIMS-LIST-GRID",
  "FLD-SETTINGS-NOTIFICATIONS-CHANNELS-FROM-EMAIL",
  "GRID-ADM-HELP-ANALYTICS-TARGETS",
  "FLD-CLAIMS-LIST-FILTER-MEMBER",
  "FLD-USR-HELP-MANUAL-TOPIC-TITLE",
  "FLD-EMP-DETAIL-PERSONAL-EMAIL",
  "FLD-USR-HELP-MANUAL-SEARCH",
  "FLD-EMP-DETAIL-EMPLOYMENT-STATUS",
  "FLD-EMP-DETAIL-PERSONAL-LAST-NAME",
  "BTN-EMP-DETAIL-HEADER-CANCEL",
  "BTN-EMP-DETAIL-HEADER-SAVE",
  "FLD-CLAIMS-LIST-FILTER-STATUS",
  "GRID-USR-HELP-MANUAL-RELATED",
  "BTN-USR-HELP-MANUAL-ASK-AI",
  "GRID-USR-HELP-MANUAL-NAV"
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let deleted = 0;

    for (const code of REMAINING_ORPHANED) {
      try {
        const records = await base44.entities.HelpContent.filter({ help_target_code: code });
        for (const record of records) {
          await base44.entities.HelpContent.delete(record.id);
          deleted++;
        }
      } catch (err) {
        // Silently skip if already deleted or error
      }
      // Long delay between each delete to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return Response.json({ deleted, remaining: REMAINING_ORPHANED.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});