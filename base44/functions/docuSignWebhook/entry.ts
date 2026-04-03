import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * docuSignWebhook
 * Receives DocuSign Connect webhook events and updates enrollment records.
 *
 * Configure in DocuSign Connect:
 *   URL: https://<your-app>.base44.com/api/functions/docuSignWebhook
 *   Trigger events: envelope-sent, envelope-delivered, envelope-completed, envelope-declined, envelope-voided
 *   Data format: JSON
 *
 * IMPORTANT: Set DOCUSIGN_WEBHOOK_SECRET in secrets for HMAC validation (recommended).
 */
Deno.serve(async (req) => {
  try {
    const body = await req.text();

    // HMAC validation — required when DOCUSIGN_WEBHOOK_SECRET is set.
    // If the secret is configured but no signature header is present, reject the request.
    const webhookSecret = Deno.env.get("DOCUSIGN_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signature = req.headers.get("x-docusign-signature-1");
      if (!signature) {
        console.warn("DocuSign webhook: secret configured but no signature header — rejecting");
        return Response.json({ error: "Missing HMAC signature" }, { status: 401 });
      }
      const keyData = new TextEncoder().encode(webhookSecret);
      const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
      const msgData = new TextEncoder().encode(body);
      const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      const valid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes, msgData);
      if (!valid) {
        console.warn("DocuSign webhook: HMAC signature invalid — rejecting");
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch (_) {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // DocuSign Connect sends event in different structures depending on version
    const envelopeId = event.envelopeId || event.data?.envelopeId || event.EnvelopeId;
    const eventType  = (event.event || event.data?.event || "").toLowerCase();

    if (!envelopeId) {
      return Response.json({ received: true, note: "No envelope ID found" });
    }

    // Find enrollment by envelope ID
    const enrollments = await base44.asServiceRole.entities.EmployeeEnrollment.filter(
      { docusign_envelope_id: envelopeId },
      "-created_date",
      1
    );

    const enrollment = enrollments?.[0];
    if (!enrollment) {
      // Not our envelope — still return 200 to prevent DocuSign retries
      return Response.json({ received: true, note: "Enrollment not found for this envelope" });
    }

    const updates = {};

    if (eventType.includes("completed")) {
      updates.docusign_status = "completed";
      updates.docusign_signed_at = new Date().toISOString();

      // Attempt to fetch signed document URL from DocuSign
      try {
        const accountId = Deno.env.get("DOCUSIGN_ACCOUNT_ID");
        const baseUrl   = Deno.env.get("DOCUSIGN_BASE_URL") || "https://demo.docusign.net/restapi";
        const integrationKey = Deno.env.get("DOCUSIGN_INTEGRATION_KEY");
        const userId = Deno.env.get("DOCUSIGN_USER_ID");
        const privateKeyPem = Deno.env.get("DOCUSIGN_PRIVATE_KEY");

        if (accountId && integrationKey && userId && privateKeyPem) {
          const accessToken = await getJWTToken({ integrationKey, userId, privateKeyPem, baseUrl });

          // Get document list
          const docsRes = await fetch(
            `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (docsRes.ok) {
            const docsData = await docsRes.json();
            const docId = docsData.envelopeDocuments?.[0]?.documentId;

            if (docId) {
              // Download and re-upload to our storage
              const pdfRes = await fetch(
                `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/${docId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );

              if (pdfRes.ok) {
                const pdfBlob = await pdfRes.blob();
                const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: pdfBlob });
                if (uploadResult?.file_url) {
                  updates.docusign_document_url = uploadResult.file_url;

                  // Also store in Documents entity
                  await base44.asServiceRole.entities.Document.create({
                    case_id: enrollment.case_id,
                    name: `Signed Enrollment Form — ${enrollment.employee_name}`,
                    document_type: "enrollment_form",
                    file_url: uploadResult.file_url,
                    file_name: `enrollment_${enrollment.employee_name?.replace(/\s/g, "_")}.pdf`,
                    notes: `DocuSign envelope ${envelopeId}`,
                    uploaded_by: "docusign_webhook",
                    employer_name: enrollment.employer_name,
                  });
                }
              }
            }
          }
        }
      } catch (docErr) {
        console.warn("Could not fetch signed document:", docErr.message);
      }

    } else if (eventType.includes("declined")) {
      updates.docusign_status = "declined";
      updates.docusign_declined_reason = event.data?.recipientDeclineReason || "No reason provided";

    } else if (eventType.includes("voided")) {
      updates.docusign_status = "voided";

    } else if (eventType.includes("delivered")) {
      updates.docusign_status = "delivered";

    } else if (eventType.includes("sent")) {
      updates.docusign_status = "sent";
    }

    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.EmployeeEnrollment.update(enrollment.id, updates);
    }

    return Response.json({ received: true, envelope_id: envelopeId, event: eventType });
  } catch (error) {
    console.error("DocuSign webhook error:", error);
    // Return 500 so DocuSign retries on genuine server errors.
    // We only return 200 for "envelope not found" cases (handled above).
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getJWTToken({ integrationKey, userId, privateKeyPem, baseUrl }) {
  const oauthBase = baseUrl.includes("demo")
    ? "https://account-d.docusign.com"
    : "https://account.docusign.com";

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: integrationKey,
    sub: userId,
    aud: oauthBase.replace("https://", ""),
    iat: now,
    exp: now + 3600,
    scope: "signature impersonation",
  };

  const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${b64(header)}.${b64(payload)}`;

  const keyData = pemToArrayBuffer(privateKeyPem);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${unsigned}.${sigB64}`;
  const tokenRes = await fetch(`${oauthBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`JWT failed: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}