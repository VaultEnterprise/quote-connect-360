import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * sendDocuSignEnvelope
 * Creates and sends a DocuSign envelope for a completed enrollment.
 * Uses JWT Grant auth with RSA private key.
 *
 * Payload: { enrollment_id: string, resend?: boolean }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth — allow employee portal (no broker session) or broker
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enrollment_id, resend = false } = await req.json();
    if (!enrollment_id) {
      return Response.json({ error: "enrollment_id is required" }, { status: 400 });
    }

    // Load credentials
    const integrationKey = Deno.env.get("DOCUSIGN_INTEGRATION_KEY");
    const secretKey      = Deno.env.get("DOCUSIGN_SECRET_KEY");
    const accountId      = Deno.env.get("DOCUSIGN_ACCOUNT_ID");
    const baseUrl        = Deno.env.get("DOCUSIGN_BASE_URL") || "https://demo.docusign.net/restapi";
    const userId         = Deno.env.get("DOCUSIGN_USER_ID");
    const privateKeyPem  = Deno.env.get("DOCUSIGN_PRIVATE_KEY");

    if (!integrationKey || !accountId) {
      return Response.json(
        { error: "DocuSign credentials not configured. Set DOCUSIGN_INTEGRATION_KEY and DOCUSIGN_ACCOUNT_ID." },
        { status: 503 }
      );
    }

    // Fetch enrollment record
    const enrollment = await base44.asServiceRole.entities.EmployeeEnrollment.get(enrollment_id);
    if (!enrollment) {
      return Response.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Get JWT access token via RSA key
    let accessToken;
    if (privateKeyPem && userId) {
      accessToken = await getJWTToken({ integrationKey, userId, privateKeyPem, baseUrl });
    } else {
      return Response.json(
        { error: "DocuSign JWT credentials (DOCUSIGN_USER_ID, DOCUSIGN_PRIVATE_KEY) not configured." },
        { status: 503 }
      );
    }

    // If resending, void old envelope first
    if (resend && enrollment.docusign_envelope_id) {
      await fetch(`${baseUrl}/v2.1/accounts/${accountId}/envelopes/${enrollment.docusign_envelope_id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "voided", voidedReason: "Resending new envelope" }),
      });
    }

    // Build enrollment summary HTML document
    const dependentsList = (enrollment.dependents || [])
      .map(d => `<li>${d.name || `${d.firstName} ${d.lastName}`} (${d.relationship?.replace(/_/g, " ") || "Dependent"})</li>`)
      .join("");

    const htmlDoc = `
<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #222; margin: 40px; }
  h1 { font-size: 20px; color: #1a3c6d; border-bottom: 2px solid #1a3c6d; padding-bottom: 10px; }
  h2 { font-size: 15px; color: #333; margin-top: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td { padding: 8px 12px; border: 1px solid #ddd; }
  td:first-child { font-weight: bold; background: #f5f7fa; width: 35%; }
  .sig-block { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
  .sig-label { font-size: 11px; color: #666; margin-top: 4px; }
</style></head>
<body>
  <h1>Employee Benefits Enrollment Form</h1>
  <p>This document confirms the benefits enrollment elections made by the employee named below.</p>

  <h2>Employee Information</h2>
  <table>
    <tr><td>Name</td><td>${enrollment.employee_name || "—"}</td></tr>
    <tr><td>Email</td><td>${enrollment.employee_email || "—"}</td></tr>
    <tr><td>Employer</td><td>${enrollment.employer_name || "—"}</td></tr>
    <tr><td>Enrollment Date</td><td>${enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString() : "—"}</td></tr>
    <tr><td>Coverage Effective Date</td><td>${enrollment.effective_date || "—"}</td></tr>
  </table>

  <h2>Coverage Elections</h2>
  <table>
    <tr><td>Coverage Tier</td><td>${(enrollment.coverage_tier || "—").replace(/_/g, " ")}</td></tr>
    <tr><td>Selected Plan</td><td>${enrollment.selected_plan_name || "—"}</td></tr>
    <tr><td>Plan ID</td><td>${enrollment.selected_plan_id || "—"}</td></tr>
  </table>

  ${dependentsList ? `
  <h2>Covered Dependents</h2>
  <ul>${dependentsList}</ul>
  ` : ""}

  <h2>Acknowledgment</h2>
  <p>By signing below, I confirm that my benefit elections above are accurate and complete. 
  I understand that changes may not be permitted outside of a qualifying life event or open enrollment period.
  I authorize my employer to deduct the applicable employee contributions from my paycheck.</p>

  <div class="sig-block">
    <p>Employee Signature: <span style="color:white;">__sig1__</span></p>
    <p class="sig-label">Sign here</p>
    <br/>
    <p>Date: <span style="color:white;">__date1__</span></p>
    <p class="sig-label">Date signed</p>
  </div>
</body>
</html>`;

    // Base64 encode the document
    const encoder = new TextEncoder();
    const docBytes = encoder.encode(htmlDoc);
    const base64Doc = btoa(String.fromCharCode(...docBytes));

    // Build DocuSign envelope
    const envelopePayload = {
      emailSubject: `Benefits Enrollment Form — Please Sign`,
      emailBlurb: `Hello ${enrollment.employee_name}, please review and sign your benefits enrollment form for ${enrollment.employer_name}.`,
      status: "sent",
      documents: [
        {
          documentId: "1",
          name: "Benefits Enrollment Form.html",
          documentBase64: base64Doc,
          fileExtension: "html",
        },
      ],
      recipients: {
        signers: [
          {
            email: enrollment.employee_email,
            name: enrollment.employee_name,
            recipientId: "1",
            routingOrder: "1",
            clientUserId: enrollment_id,
            tabs: {
              signHereTabs: [
                {
                  anchorString: "__sig1__",
                  anchorUnits: "pixels",
                  anchorXOffset: "0",
                  anchorYOffset: "-10",
                },
              ],
              dateSignedTabs: [
                {
                  anchorString: "__date1__",
                  anchorUnits: "pixels",
                  anchorXOffset: "0",
                  anchorYOffset: "-10",
                },
              ],
            },
          },
        ],
      },
    };

    const createRes = await fetch(`${baseUrl}/v2.1/accounts/${accountId}/envelopes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(envelopePayload),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return Response.json({ error: `DocuSign API error: ${errText}` }, { status: 502 });
    }

    const envelopeData = await createRes.json();
    const envelopeId = envelopeData.envelopeId;

    // Update enrollment record
    await base44.asServiceRole.entities.EmployeeEnrollment.update(enrollment_id, {
      docusign_envelope_id: envelopeId,
      docusign_status: "sent",
      docusign_sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true, envelope_id: envelopeId });
  } catch (error) {
    console.error('[function' + '] error:', error.message, error.stack);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// ── JWT Grant helper ──────────────────────────────────────────────────────────
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

  // Import RSA private key
  const keyData = pemToArrayBuffer(privateKeyPem);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned)
  );

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const jwt = `${unsigned}.${sigB64}`;

  const tokenRes = await fetch(`${oauthBase}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`DocuSign JWT auth failed: ${JSON.stringify(tokenData)}`);
  }
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