import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * getDocuSignSigningURL
 * Returns an embedded signing ceremony URL for in-app signing.
 *
 * Payload: { enrollment_id: string, return_url: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { enrollment_id, return_url } = await req.json();
    if (!enrollment_id) {
      return Response.json({ error: "enrollment_id is required" }, { status: 400 });
    }

    const integrationKey = Deno.env.get("DOCUSIGN_INTEGRATION_KEY");
    const accountId      = Deno.env.get("DOCUSIGN_ACCOUNT_ID");
    const baseUrl        = Deno.env.get("DOCUSIGN_BASE_URL") || "https://demo.docusign.net/restapi";
    const userId         = Deno.env.get("DOCUSIGN_USER_ID");
    const privateKeyPem  = Deno.env.get("DOCUSIGN_PRIVATE_KEY");

    if (!integrationKey || !accountId || !userId || !privateKeyPem) {
      return Response.json({ error: "DocuSign credentials not configured" }, { status: 503 });
    }

    const enrollment = await base44.asServiceRole.entities.EmployeeEnrollment.get(enrollment_id);
    if (!enrollment?.docusign_envelope_id) {
      return Response.json({ error: "No DocuSign envelope found for this enrollment" }, { status: 404 });
    }

    const accessToken = await getJWTToken({ integrationKey, userId, privateKeyPem, baseUrl });

    // Create embedded signing view
    const viewRes = await fetch(
      `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${enrollment.docusign_envelope_id}/views/recipient`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: return_url || "https://app.base44.com",
          authenticationMethod: "none",
          email: enrollment.employee_email,
          userName: enrollment.employee_name,
          recipientId: "1",
          clientUserId: enrollment_id,
          frameAncestors: ["https://*.base44.com", "http://localhost:3000"],
          messageOrigins: ["https://*.base44.com", "http://localhost:3000"],
        }),
      }
    );

    if (!viewRes.ok) {
      const errText = await viewRes.text();
      return Response.json({ error: `DocuSign view error: ${errText}` }, { status: 502 });
    }

    const viewData = await viewRes.json();

    // Update status to delivered
    await base44.asServiceRole.entities.EmployeeEnrollment.update(enrollment_id, {
      docusign_status: "delivered",
    });

    return Response.json({ signing_url: viewData.url });
  } catch (error) {
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
  if (!tokenData.access_token) throw new Error(`DocuSign JWT failed: ${JSON.stringify(tokenData)}`);
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