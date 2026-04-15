export const BLOCKING_RUNTIME_WARNING_PATTERNS = [
  /Encountered two children with the same key/i,
  /aria-describedby=\{undefined\}/i,
  /Missing `Description`/i,
];

export function getBlockingRuntimeWarnings(logLines = []) {
  return (logLines || []).filter((line) => {
    const text = String(line);
    if (/visual-edit-agent/i.test(text)) return false;
    return BLOCKING_RUNTIME_WARNING_PATTERNS.some((pattern) => pattern.test(text));
  });
}

export function assertWarningFreeRuntime(logLines = [], context = "touched flow") {
  const blockingWarnings = getBlockingRuntimeWarnings(logLines);
  if (blockingWarnings.length > 0) {
    throw new Error(`${context} still has blocking runtime warnings`);
  }
  return true;
}