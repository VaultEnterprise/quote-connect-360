export function stripUndefined(input) {
  return Object.fromEntries(Object.entries(input || {}).filter(([, value]) => value !== undefined));
}

export function assertKnownKeys(input, allowedKeys, context) {
  const unknownKeys = Object.keys(stripUndefined(input)).filter((key) => !allowedKeys.includes(key));
  if (unknownKeys.length > 0) {
    throw new Error(`${context} contains unsupported keys: ${unknownKeys.join(", ")}`);
  }
}

export function assertRequiredKeys(input, requiredKeys, context) {
  const missingKeys = requiredKeys.filter((key) => {
    const value = input?.[key];
    return value === undefined || value === null || value === "";
  });

  if (missingKeys.length > 0) {
    throw new Error(`${context} is missing required keys: ${missingKeys.join(", ")}`);
  }
}

export function validateWritePayload(input, allowedKeys, context, requiredKeys = []) {
  const payload = stripUndefined(input);
  assertKnownKeys(payload, allowedKeys, context);
  assertRequiredKeys(payload, requiredKeys, context);
  return payload;
}