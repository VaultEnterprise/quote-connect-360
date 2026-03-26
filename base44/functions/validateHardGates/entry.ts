import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function stripUndefined(input) {
  return Object.fromEntries(Object.entries(input || {}).filter(([, value]) => value !== undefined));
}
function assertKnownKeys(input, allowedKeys, context) {
  const unknownKeys = Object.keys(stripUndefined(input)).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) throw new Error(`${context} contains unsupported keys: ${unknownKeys.join(', ')}`);
}
function assertRequiredKeys(input, requiredKeys, context) {
  const missingKeys = requiredKeys.filter((key) => {
    const value = input?.[key];
    return value === undefined || value === null || value === '';
  });
  if (missingKeys.length > 0) throw new Error(`${context} is missing required keys: ${missingKeys.join(', ')}`);
}
function validateWritePayload(input, allowedKeys, context, requiredKeys = []) {
  const payload = stripUndefined(input);
  assertKnownKeys(payload, allowedKeys, context);
  assertRequiredKeys(payload, requiredKeys, context);
  return payload;
}
function assertWarningFreeRuntime(logLines = [], context = 'runtime') {
  const patterns = [/Encountered two children with the same key/i, /aria-describedby=\{undefined\}/i, /Missing `Description`/i];
  const blocking = (logLines || []).filter((line) => patterns.some((pattern) => pattern.test(String(line))));
  if (blocking.length > 0) throw new Error(`${context} still has blocking runtime warnings`);
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const blocked = [];
    const capture = (label, fn) => {
      try {
        fn();
        blocked.push({ label, blocked: false });
      } catch (error) {
        blocked.push({ label, blocked: true, message: error.message });
      }
    };

    capture('route mismatch', () => validateWritePayload({ bogus: 'x' }, ['stageFilter', 'priorityFilter'], 'cases route params'));
    capture('schema drift', () => validateWritePayload({ title: 'ok', hacked_field: true }, ['title', 'status'], 'CaseTask write', ['title']));
    capture('import contract mismatch', () => {
      const payload = validateWritePayload({ mode: 'import', fileUrl: 'x', mapping: { hacked_field: 'Bad' } }, ['mode', 'fileUrl', 'mapping'], 'census import request', ['mode', 'fileUrl', 'mapping']);
      const unsupportedMappingKeys = Object.keys(payload.mapping || {}).filter((key) => !['first_name', 'last_name', 'email'].includes(key));
      if (unsupportedMappingKeys.length > 0) {
        throw new Error(`Unsupported census field mapping: ${unsupportedMappingKeys.join(', ')}`);
      }
    });
    capture('runtime warning gate', () => assertWarningFreeRuntime(['Warning: Missing `Description` for DialogContent']))
    capture('partial implementation smoke gap', () => {
      const touchedPages = ['Cases', 'Dashboard', 'CensusUploadModal'];
      if (!touchedPages.includes('NonexistentPage')) throw new Error('No smoke definition registered for NonexistentPage');
    });

    const passed = blocked.every((item) => item.blocked === true);
    return Response.json({ passed, blocked });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});