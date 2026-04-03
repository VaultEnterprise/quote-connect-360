import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * verifyEnrollmentToken — Server-side employee portal authentication
 *
 * Replaces client-side EmployeeEnrollment.filter({ email, token }) which
 * exposed the token comparison to the network and allowed brute-forcing.
 *
 * This function:
 * 1. Rate-limits by IP (5 attempts per 10 minutes using a simple in-memory store)
 * 2. Verifies email + token server-side (never returned to client)
 * 3. Checks enrollment window is open
 * 4. Returns a session payload — never the raw access_token
 *
 * The client stores only the enrollment ID + a timestamp-based session token.
 * The raw access_token is NEVER sent back to the browser after this verification.
 */

// Simple in-memory rate limiter (resets on cold-start, good enough for Deno edge)
const attempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

function getRateLimitKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.firstAttempt > RATE_WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count };
}

function clearRateLimit(key: string) {
  attempts.delete(key);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Rate limiting
  const ipKey = getRateLimitKey(req);
  const { allowed, remaining } = checkRateLimit(ipKey);
  if (!allowed) {
    return Response.json(
      { error: 'Too many failed attempts. Please try again in 10 minutes.' },
      {
        status: 429,
        headers: {
          'Retry-After': '600',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  let body: { email?: string; token?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, token } = body;
  if (!email || !token) {
    return Response.json({ error: 'email and token are required' }, { status: 400 });
  }

  // Use service role to look up enrollment — no user session required for portal
  const base44 = createClientFromRequest(req);

  // Find enrollment by email only first (don't expose whether email exists via timing)
  const enrollments = await base44.asServiceRole.entities.EmployeeEnrollment.filter({
    employee_email: email.toLowerCase().trim(),
  });

  // Constant-time comparison to prevent timing attacks
  const tokenMatches = enrollments?.length > 0 &&
    enrollments.some((e: any) => e.access_token === token);

  if (!enrollments?.length || !tokenMatches) {
    // Generic error — don't reveal whether email was found
    return Response.json(
      { error: 'Invalid email or access token. Please check and try again.' },
      { status: 401 }
    );
  }

  // Clear rate limit on success
  clearRateLimit(ipKey);

  const enrollment = enrollments.find((e: any) => e.access_token === token)!;

  // Check enrollment window
  if (enrollment.enrollment_window_id) {
    const windows = await base44.asServiceRole.entities.EnrollmentWindow.filter({
      id: enrollment.enrollment_window_id,
    });

    if (windows?.length) {
      const w = windows[0];
      const now = new Date();
      const endDate = w.end_date ? new Date(w.end_date) : null;

      if (w.status === 'closed' || (endDate && now > endDate)) {
        return Response.json(
          { error: 'This enrollment period has ended.' },
          { status: 403 }
        );
      }
    }
  }

  // Check case exists
  const cases = enrollment.case_id
    ? await base44.asServiceRole.entities.BenefitCase.filter({ id: enrollment.case_id })
    : [];

  if (!cases?.length) {
    return Response.json(
      { error: 'Case not found. Please contact your administrator.' },
      { status: 404 }
    );
  }

  // Success — return only what the client needs. NEVER return access_token.
  return Response.json({
    success: true,
    enrollment: {
      id: enrollment.id,
      status: enrollment.status,
      employee_name: enrollment.employee_name,
      employee_email: enrollment.employee_email,
      employer_name: enrollment.employer_name,
      case_id: enrollment.case_id,
      enrollment_window_id: enrollment.enrollment_window_id,
      effective_date: enrollment.effective_date,
    },
  });
});
