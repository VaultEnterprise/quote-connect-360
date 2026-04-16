#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "schema.json"), "utf8"));
const WEAK_PATTERNS = [/\bfixed issue\b/i,/\bresolved bug\b/i,/\bupdated logic\b/i,/\bmade improvements\b/i,/\bcleaned up\b/i,/\bworking as expected\b/i,/\bminor refactor\b/i,/\bgeneral fix\b/i];
const SYMPTOM_PATTERNS = [/\bpage did not load\b/i,/\bbutton was broken\b/i,/\brender error\b/i,/\bapi failed\b/i,/\bnull error\b/i,/\broute issue\b/i];
function loadJson() {
  try {
    if (process.argv.length > 3) {
      console.error("Usage: node base44-validator.js [response.json]");
      process.exit(2);
    }
    const raw = process.argv[2] ? fs.readFileSync(process.argv[2], "utf8") : fs.readFileSync(0, "utf8");
    if (!raw.trim()) throw new Error("No input provided.");
    return JSON.parse(raw);
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error(`Invalid JSON: ${err.message}`);
      process.exit(1);
    }
    console.error(`Input error: ${err.message}`);
    process.exit(2);
  }
}
function hasWeakLanguage(text) { return WEAK_PATTERNS.some((p) => p.test(text || "")); }
function looksLikeSymptomNotRootCause(text) { return SYMPTOM_PATTERNS.some((p) => p.test((text || "").trim())); }
function semanticChecks(data) {
  const errors = [];
  const pr = data.page_review;
  if (pr.review_sequence === 1 && pr.page_name !== "Dashboard") errors.push("First reviewed page must be 'Dashboard'.");
  if (pr.review_status !== pr.final_status.disposition) errors.push("review_status must match final_status.disposition.");
  if (pr.final_status.disposition === "complete" && pr.final_status.remaining_issues.length > 0) errors.push("A complete disposition cannot include remaining_issues.");
  if (["partial", "failed"].includes(pr.final_status.disposition) && pr.final_status.remaining_issues.length === 0) errors.push("A partial/failed disposition must include remaining_issues.");
  const clean = pr.console_and_server_cleanliness;
  const isFullyClean = !clean.console_errors_present && !clean.network_errors_present && !clean.server_exceptions_present && !clean.silent_failures_present;
  if (isFullyClean && !/(none|clean|no active errors|no active exceptions)/i.test(clean.details)) errors.push("Cleanliness details should explicitly state no active errors/exceptions/clean state.");
  const esc = pr.enterprise_standard_confirmation;
  const falseFlags = Object.entries(esc).filter(([k, v]) => k !== "notes" && v === false).map(([k]) => k);
  if (pr.final_status.disposition === "complete" && falseFlags.length > 0) errors.push(`Disposition cannot be complete when enterprise standards are false: ${falseFlags.join(", ")}.`);
  for (const [section, items] of Object.entries(pr.dependency_map)) for (const item of items) if (!item || item.trim().length < 3) errors.push(`dependency_map.${section} contains weak/empty entry.`);
  const fpSeen = new Set();
  for (const fp of pr.failure_point_inventory) {
    if (fpSeen.has(fp.failure_id)) errors.push(`Duplicate failure_id: ${fp.failure_id}`);
    fpSeen.add(fp.failure_id);
    if (hasWeakLanguage(fp.evidence)) errors.push(`${fp.failure_id}: evidence is too vague.`);
  }
  const issueSeen = new Set();
  for (const issue of pr.issues) {
    if (issueSeen.has(issue.issue_id)) errors.push(`Duplicate issue_id: ${issue.issue_id}`);
    issueSeen.add(issue.issue_id);
    if (looksLikeSymptomNotRootCause(issue.root_cause)) errors.push(`${issue.issue_id}: root_cause appears to describe a symptom, not a technical cause.`);
    for (const field of ["root_cause", "failure_mechanism", "fix_implemented", "why_fix_is_correct", "impact"]) if (hasWeakLanguage(issue[field])) errors.push(`${issue.issue_id}: ${field} contains weak/generic language.`);
    if (issue.status === "unresolved" && pr.final_status.disposition === "complete") errors.push(`${issue.issue_id}: unresolved issue cannot exist when disposition is complete.`);
    if (["fixed", "partially_fixed"].includes(issue.status) && (!issue.validation_evidence || issue.validation_evidence.length === 0)) errors.push(`${issue.issue_id}: fixed/partially_fixed issue must include validation_evidence.`);
  }
  for (const [key, block] of Object.entries(pr.validation)) {
    if (block.reviewed !== true) errors.push(`${key}: reviewed must be true.`);
    if (!block.checks || block.checks.length < 2) errors.push(`${key}: must include at least 2 checks.`);
    for (const check of block.checks || []) if (hasWeakLanguage(check)) errors.push(`${key}: check contains weak language.`);
  }
  if (!pr.downstream_impact_analysis.regression_checks || pr.downstream_impact_analysis.regression_checks.length < 2) errors.push("downstream_impact_analysis.regression_checks must include at least 2 items.");
  const reviewedLayers = new Set(pr.failure_point_inventory.map((x) => x.layer));
  const issueLayers = new Set(pr.issues.map((x) => x.layer));
  const hasLayerOverlap = [...reviewedLayers].some((layer) => issueLayers.has(layer));
  if (pr.issues.length >= 3 && !hasLayerOverlap) errors.push("Failure points were reviewed, but issues do not map to any reviewed layer.");
  return errors;
}
function main() {
  const data = loadJson();
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(data);
  const errors = [];
  if (!valid) for (const err of validate.errors || []) errors.push(`${err.instancePath || "<root>"}: ${err.message}`);
  else errors.push(...semanticChecks(data));
  if (errors.length > 0) {
    console.log(JSON.stringify({ accepted: false, rejection_count: errors.length, reasons: errors }, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({ accepted: true, message: "Base44 response passed schema and enforcement validation." }, null, 2));
  process.exit(0);
}
main();