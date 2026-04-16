import { buildCanonicalMemberKey, transformRow, validateRow, analyzeDataQuality, detectDuplicates } from "./censusEngine";

export function buildVersionedSnapshotRows(rows = [], mapping = {}, caseId, versionId) {
  return rows.map((row, index) => {
    const normalized = transformRow(row, mapping);
    const issues = validateRow(row, mapping);
    const hasErrors = issues.some((issue) => issue.type === "error");
    const hasWarnings = issues.some((issue) => issue.type === "warning");

    return {
      ...normalized,
      census_version_id: versionId,
      case_id: caseId,
      snapshot_row_number: index + 1,
      canonical_member_key: normalized.canonical_member_key || buildCanonicalMemberKey(normalized),
      source_payload: row,
      normalized_payload: normalized,
      validation_issues: issues,
      validation_status: hasErrors ? "has_errors" : hasWarnings ? "has_warnings" : "valid",
    };
  });
}

export function buildSnapshotMetrics(rows = [], mapping = {}) {
  const duplicates = detectDuplicates(rows, mapping);
  const fieldStats = analyzeDataQuality(rows, mapping);
  const normalizedRows = rows.map((row) => transformRow(row, mapping));
  const validRows = normalizedRows.filter((row) => row.canonical_member_key);
  const eligibleRows = normalizedRows.filter((row) => row.is_eligible !== false);

  return {
    total_rows: rows.length,
    valid_identity_rows: validRows.length,
    duplicate_count: duplicates.length,
    eligible_count: eligibleRows.length,
    fieldStats,
    duplicates,
  };
}

export function buildVersionSummary({ rows = [], mapping = {}, members = [] }) {
  const metrics = buildSnapshotMetrics(rows, mapping);
  const validationErrors = members.reduce((count, member) => count + (member.validation_issues || []).filter((issue) => issue.type === "error").length, 0);
  const validationWarnings = members.reduce((count, member) => count + (member.validation_issues || []).filter((issue) => issue.type === "warning").length, 0);
  const readyMembers = members.filter((member) => member.validation_status === "valid").length;

  return {
    ...metrics,
    validation_errors: validationErrors,
    validation_warnings: validationWarnings,
    ready_member_count: readyMembers,
    blocked_member_count: members.length - readyMembers,
    status: validationErrors > 0 ? "has_issues" : "validated",
  };
}

export function buildCanonicalSnapshotReadiness({ latestVersion, members = [], cases = [], enrollments = [], renewals = [] }) {
  const validMembers = members.filter((member) => member.validation_status === "valid");
  const erroredMembers = members.filter((member) => member.validation_status === "has_errors");
  const warningMembers = members.filter((member) => member.validation_status === "has_warnings");
  const latestVersionReady = latestVersion?.status === "validated";

  return {
    latestVersion,
    summary: {
      totalMembers: members.length,
      validMembers: validMembers.length,
      erroredMembers: erroredMembers.length,
      warningMembers: warningMembers.length,
    },
    readiness: {
      quotes: latestVersionReady && erroredMembers.length === 0,
      enrollment: latestVersionReady && validMembers.length > 0,
      renewals: !!latestVersion,
      dashboard: erroredMembers.length === 0,
      cases: cases.length > 0,
    },
    downstreamCounts: {
      cases: cases.length,
      enrollments: enrollments.length,
      renewals: renewals.length,
    },
  };
}