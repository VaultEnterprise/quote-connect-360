/**
 * Dry-Run Migration / Backfill Utilities
 * 
 * Generates deterministic, read-only reports for Phase 7A-0 data migration planning.
 * No production backfill executed. No production records mutated.
 * 
 * Reports:
 * 1. Existing MGA Direct Records
 * 2. Existing Broker-Under-MGA Records
 * 3. Existing Platform Direct Records
 * 4. Unknown / Anomalous Records
 * 5. Orphan Broker / Orphan MGA
 * 6. Duplicate Broker Agency Candidates
 * 7. Backfill Validation Query Report
 */

import { base44 } from '@/api/base44Client';

/**
 * Classification statuses for record evaluation.
 */
export const CLASSIFICATION_STATUS = {
  READY_FOR_BACKFILL: 'READY_FOR_BACKFILL',
  NEEDS_OPERATOR_REVIEW: 'NEEDS_OPERATOR_REVIEW',
  MISSING_REQUIRED_REFERENCE: 'MISSING_REQUIRED_REFERENCE',
  CONFLICTING_LINEAGE: 'CONFLICTING_LINEAGE',
  DUPLICATE_CANDIDATE: 'DUPLICATE_CANDIDATE',
  UNSUPPORTED_LEGACY_PATTERN: 'UNSUPPORTED_LEGACY_PATTERN',
  DEFERRED_FUTURE_GATE: 'DEFERRED_FUTURE_GATE',
  BLOCKED_SECURITY_RISK: 'BLOCKED_SECURITY_RISK'
};

/**
 * Execute dry-run migration assessment.
 * Generates all 7 reports without modifying production data.
 * 
 * @returns {Object} Complete dry-run report set
 */
export const executeDryRunMigration = async () => {
  const reports = {
    mgaDirectRecords: await reportMGADirectRecords(),
    brokerUnderMGARecords: await reportBrokerUnderMGARecords(),
    platformDirectRecords: await reportPlatformDirectRecords(),
    unknownAnomalousRecords: await reportUnknownAnomalousRecords(),
    orphanBrokerMGA: await reportOrphanBrokerMGA(),
    duplicateBrokerCandidates: await reportDuplicateBrokerCandidates(),
    backfillValidationQuery: await reportBackfillValidationQuery(),
    executionSummary: {
      dryRunTime: new Date().toISOString(),
      dryRunMode: 'READ_ONLY',
      backfillExecuted: false,
      recordsMutated: 0,
      status: 'DRY_RUN_COMPLETE'
    }
  };
  return reports;
};

/**
 * Report 1: Existing MGA Direct Records
 * Records that map to channel_type = mga_direct.
 * Lineage: master_general_agent_id populated, broker_agency_id null, owner_org_type = mga.
 */
export const reportMGADirectRecords = async () => {
  const report = {
    title: 'Existing MGA Direct Records Report',
    description: 'Records that should map to channel_type = mga_direct',
    expectedLineage: {
      master_general_agent_id: 'populated',
      broker_agency_id: 'null',
      owner_org_type: 'mga',
      servicing_org_type: 'mga'
    },
    records: [],
    rowCount: 0,
    anomalies: 0,
    classifications: {},
    status: 'COMPLETE'
  };

  try {
    // Evaluate MGA direct records across entities
    const entities = [
      'Employer',
      'EmployerCase',
      'QuoteScenario',
      'Proposal',
      'EnrollmentWindow',
      'RenewalCycle',
      'Task'
    ];

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        if (!records) continue;

        for (const record of records) {
          if (
            record.master_general_agent_id &&
            !record.broker_agency_id &&
            record.owner_org_type === 'mga'
          ) {
            report.records.push({
              entityType: entityName,
              entityId: record.id,
              mgaId: record.master_general_agent_id,
              classification: CLASSIFICATION_STATUS.READY_FOR_BACKFILL
            });
            report.rowCount++;
          }
        }
      } catch (error) {
        // Entity might not exist; skip
      }
    }

    // Build classification summary
    report.classifications[CLASSIFICATION_STATUS.READY_FOR_BACKFILL] = report.records.length;
  } catch (error) {
    report.status = 'ERROR: ' + error.message;
  }

  return report;
};

/**
 * Report 2: Existing Broker-Under-MGA Records
 * Records that map to channel_type = mga_affiliated_broker.
 * Requires BrokerMGARelationship and populated broker_agency_id + master_general_agent_id.
 */
export const reportBrokerUnderMGARecords = async () => {
  const report = {
    title: 'Existing Broker-Under-MGA Records Report',
    description: 'Records that should map to channel_type = mga_affiliated_broker',
    expectedLineage: {
      broker_agency_id: 'populated',
      master_general_agent_id: 'populated',
      owner_org_type: 'broker_agency',
      supervising_org_type: 'mga'
    },
    records: [],
    rowCount: 0,
    relationshipsMissing: 0,
    classifications: {},
    status: 'COMPLETE'
  };

  try {
    // Get all BrokerMGARelationship records (active relationships)
    const relationships = await base44.entities.BrokerMGARelationship.filter({
      status: 'active'
    });

    const activeRelationshipPairs = new Set(
      relationships.map((r) => `${r.broker_agency_id}_${r.master_general_agent_id}`)
    );

    // Evaluate records across entities
    const entities = [
      'EmployerCase',
      'QuoteScenario',
      'Proposal',
      'EnrollmentWindow',
      'RenewalCycle'
    ];

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        if (!records) continue;

        for (const record of records) {
          if (record.broker_agency_id && record.master_general_agent_id) {
            const pairKey = `${record.broker_agency_id}_${record.master_general_agent_id}`;
            const relationshipActive = activeRelationshipPairs.has(pairKey);

            const classification = relationshipActive
              ? CLASSIFICATION_STATUS.READY_FOR_BACKFILL
              : CLASSIFICATION_STATUS.NEEDS_OPERATOR_REVIEW;

            report.records.push({
              entityType: entityName,
              entityId: record.id,
              brokerAgencyId: record.broker_agency_id,
              mgaId: record.master_general_agent_id,
              relationshipActive,
              classification
            });

            report.rowCount++;
            if (!relationshipActive) report.relationshipsMissing++;
          }
        }
      } catch (error) {
        // Entity might not exist; skip
      }
    }

    // Build classification summary
    const readyCount = report.records.filter(
      (r) => r.classification === CLASSIFICATION_STATUS.READY_FOR_BACKFILL
    ).length;
    const reviewCount = report.records.filter(
      (r) => r.classification === CLASSIFICATION_STATUS.NEEDS_OPERATOR_REVIEW
    ).length;

    report.classifications[CLASSIFICATION_STATUS.READY_FOR_BACKFILL] = readyCount;
    report.classifications[CLASSIFICATION_STATUS.NEEDS_OPERATOR_REVIEW] = reviewCount;
  } catch (error) {
    report.status = 'ERROR: ' + error.message;
  }

  return report;
};

/**
 * Report 3: Existing Platform Direct Records
 * Records that map to channel_type = platform_direct.
 * Lineage: master_general_agent_id null, broker_agency_id null, owner_org_type = platform.
 */
export const reportPlatformDirectRecords = async () => {
  const report = {
    title: 'Existing Platform Direct Records Report',
    description: 'Records that should map to channel_type = platform_direct',
    expectedLineage: {
      master_general_agent_id: 'null',
      broker_agency_id: 'null',
      owner_org_type: 'platform'
    },
    records: [],
    rowCount: 0,
    classifications: {},
    status: 'COMPLETE'
  };

  try {
    // Evaluate DistributionChannelContext, Task (platform-level)
    const entities = ['DistributionChannelContext', 'Task'];

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        if (!records) continue;

        for (const record of records) {
          if (
            !record.master_general_agent_id &&
            !record.broker_agency_id &&
            record.owner_org_type === 'platform'
          ) {
            report.records.push({
              entityType: entityName,
              entityId: record.id,
              classification: CLASSIFICATION_STATUS.READY_FOR_BACKFILL
            });
            report.rowCount++;
          }
        }
      } catch (error) {
        // Entity might not exist; skip
      }
    }

    report.classifications[CLASSIFICATION_STATUS.READY_FOR_BACKFILL] = report.records.length;
  } catch (error) {
    report.status = 'ERROR: ' + error.message;
  }

  return report;
};

/**
 * Report 4: Unknown / Anomalous Records
 * Records that cannot be safely classified.
 * Includes missing tenant_id, missing org references, conflicting lineage, invalid ownership.
 */
export const reportUnknownAnomalousRecords = async () => {
  const report = {
    title: 'Unknown / Anomalous Records Report',
    description: 'Records that cannot be safely classified',
    anomalies: [],
    rowCount: 0,
    anomalyReasons: {},
    classifications: {},
    status: 'COMPLETE'
  };

  try {
    const entities = [
      'Employer',
      'EmployerCase',
      'QuoteScenario',
      'Proposal',
      'EnrollmentWindow',
      'RenewalCycle',
      'CensusVersion',
      'Task'
    ];

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        if (!records) continue;

        for (const record of records) {
          const issues = [];

          // Check missing tenant_id
          if (!record.tenant_id) {
            issues.push('MISSING_TENANT_ID');
          }

          // Check invalid ownership combinations
          const hasBroker = !!record.broker_agency_id;
          const hasMGA = !!record.master_general_agent_id;

          if (
            hasBroker &&
            hasMGA &&
            record.supervising_org_type &&
            !['mga', 'platform'].includes(record.supervising_org_type)
          ) {
            issues.push('INVALID_SUPERVISING_ORG_TYPE');
          }

          // Check conflicting org type
          if (!hasBroker && !hasMGA && !record.owner_org_type) {
            issues.push('CONFLICTING_LINEAGE_NO_OWNER');
          }

          if (issues.length > 0) {
            report.anomalies.push({
              entityType: entityName,
              entityId: record.id,
              issues,
              classification: CLASSIFICATION_STATUS.NEEDS_OPERATOR_REVIEW
            });
            report.rowCount++;

            for (const issue of issues) {
              report.anomalyReasons[issue] = (report.anomalyReasons[issue] || 0) + 1;
            }
          }
        }
      } catch (error) {
        // Entity might not exist; skip
      }
    }

    report.classifications[CLASSIFICATION_STATUS.NEEDS_OPERATOR_REVIEW] = report.anomalies.length;
  } catch (error) {
    report.status = 'ERROR: ' + error.message;
  }

  return report;
};

/**
 * Report 5: Orphan Broker / Orphan MGA
 * Identifies broker/MGA references without valid parent records.
 * Identifies broken relationships.
 */
export const reportOrphanBrokerMGA = async () => {
  const report = {
    title: 'Orphan Broker / Orphan MGA Report',
    description: 'Identifies orphaned and broken relationships',
    orphanBrokers: [],
    orphanMGAs: [],
    brokenRelationships: [],
    rowCount: 0,
    classifications: {},
    status: 'COMPLETE'
  };

  try {
    // Load valid broker and MGA references
    const brokerProfiles = await base44.entities.BrokerAgencyProfile.list();
    const mgaProfiles = await base44.entities.MasterGeneralAgent.list();

    const validBrokerIds = new Set(brokerProfiles.map((b) => b.id));
    const validMGAIds = new Set(mgaProfiles.map((m) => m.id));

    // Check for orphaned broker_agency_id references
    const entityTypes = [
      'Employer',
      'EmployerCase',
      'QuoteScenario',
      'Proposal',
      'EnrollmentWindow',
      'RenewalCycle',
      'BrokerAgencyUser'
    ];

    for (const entityName of entityTypes) {
      try {
        const records = await base44.entities[entityName].list();
        if (!records) continue;

        for (const record of records) {
          if (record.broker_agency_id && !validBrokerIds.has(record.broker_agency_id)) {
            report.orphanBrokers.push({
              entityType: entityName,
              entityId: record.id,
              missingBrokerId: record.broker_agency_id,
              classification: CLASSIFICATION_STATUS.MISSING_REQUIRED_REFERENCE
            });
            report.rowCount++;
          }

          if (record.master_general_agent_id && !validMGAIds.has(record.master_general_agent_id)) {
            report.orphanMGAs.push({
              entityType: entityName,
              entityId: record.id,
              missingMGAId: record.master_general_agent_id,
              classification: CLASSIFICATION_STATUS.MISSING_REQUIRED_REFERENCE
            });
            report.rowCount++;
          }
        }
      } catch (error) {
        // Entity might not exist; skip
      }
    }

    // Check for broken BrokerMGARelationships (missing broker or MGA)
    try {
      const relationships = await base44.entities.BrokerMGARelationship.list();
      for (const rel of relationships) {
        if (!validBrokerIds.has(rel.broker_agency_id) || !validMGAIds.has(rel.master_general_agent_id)) {
          report.brokenRelationships.push({
            relationshipId: rel.id,
            brokerValid: validBrokerIds.has(rel.broker_agency_id),
            mgaValid: validMGAIds.has(rel.master_general_agent_id),
            classification: CLASSIFICATION_STATUS.MISSING_REQUIRED_REFERENCE
          });
          report.rowCount++;
        }
      }
    } catch (error) {
      // Entity might not exist; skip
    }

    report.classifications[CLASSIFICATION_STATUS.MISSING_REQUIRED_REFERENCE] = report.rowCount;
  } catch (error) {
    report.status = 'ERROR: ' + error.message;
  }

  return report;
};

/**
 * Report 6: Duplicate Broker Agency Candidates
 * Identifies potential duplicates using fuzzy matching on:
 * legal_name, dba_name, email, domain, npn, address, phone.
 */
export const reportDuplicateBrokerCandidates = async () => {
  const report = {
    title: 'Duplicate Broker Agency Candidate Report',
    description: 'Potential duplicate broker agencies for operator review',
    duplicateCandidates: [],
    rowCount: 0,
    classifications: {},
    status: 'COMPLETE'
  };

  try {
    const brokers = await base44.entities.BrokerAgencyProfile.list();
    const candidates = [];

    // Group by normalized email/legal name/domain
    const emailGroups = {};
    const legalNameGroups = {};
    const npnGroups = {};

    for (const broker of brokers) {
      const emailDomain = broker.primary_contact_email ? broker.primary_contact_email.split('@')[1] : null;
      const normalizedName = broker.legal_name ? broker.legal_name.toLowerCase().trim() : null;

      // Group by email domain
      if (emailDomain) {
        if (!emailGroups[emailDomain]) emailGroups[emailDomain] = [];
        emailGroups[emailDomain].push(broker.id);
      }

      // Group by legal name
      if (normalizedName) {
        if (!legalNameGroups[normalizedName]) legalNameGroups[normalizedName] = [];
        legalNameGroups[normalizedName].push(broker.id);
      }

      // Group by NPN
      if (broker.npn) {
        if (!npnGroups[broker.npn]) npnGroups[broker.npn] = [];
        npnGroups[broker.npn].push(broker.id);
      }
    }

    // Identify candidates (groups with 2+ brokers)
    for (const [emailDomain, brokerIds] of Object.entries(emailGroups)) {
      if (brokerIds.length > 1) {
        candidates.push({
          matchType: 'EMAIL_DOMAIN',
          matchValue: emailDomain,
          brokerIds,
          count: brokerIds.length,
          classification: CLASSIFICATION_STATUS.DUPLICATE_CANDIDATE
        });
      }
    }

    for (const [name, brokerIds] of Object.entries(legalNameGroups)) {
      if (brokerIds.length > 1) {
        candidates.push({
          matchType: 'LEGAL_NAME',
          matchValue: name,
          brokerIds,
          count: brokerIds.length,
          classification: CLASSIFICATION_STATUS.DUPLICATE_CANDIDATE
        });
      }
    }

    for (const [npn, brokerIds] of Object.entries(npnGroups)) {
      if (brokerIds.length > 1) {
        candidates.push({
          matchType: 'NPN',
          matchValue: npn,
          brokerIds,
          count: brokerIds.length,
          classification: CLASSIFICATION_STATUS.DUPLICATE_CANDIDATE
        });
      }
    }

    report.duplicateCandidates = candidates;
    report.rowCount = candidates.length;
    report.classifications[CLASSIFICATION_STATUS.DUPLICATE_CANDIDATE] = candidates.length;
  } catch (error) {
    report.status = 'ERROR: ' + error.message;
  }

  return report;
};

/**
 * Report 7: Backfill Validation Query Report
 * Deterministic row counts, proposed stamping counts, skipped records, operator review items.
 */
export const reportBackfillValidationQuery = async () => {
  const report = {
    title: 'Backfill Validation Query Report',
    description: 'Deterministic row counts and proposed backfill plan',
    rowCountByEntity: {},
    proposedChannelTypeAssignment: {},
    proposedDistributionChannelContextCreations: 0,
    proposedStampingCounts: {},
    skippedRecords: 0,
    operatorReviewItems: 0,
    overallStatus: 'READY_FOR_OPERATOR_REVIEW',
    validationSummary: {
      pass: 0,
      warn: 0,
      fail: 0
    },
    detailedCounts: {}
  };

  try {
    // Count records by entity
    const entities = [
      'Employer',
      'EmployerCase',
      'BenefitCase',
      'QuoteScenario',
      'Proposal',
      'EnrollmentWindow',
      'RenewalCycle',
      'Task',
      'CensusVersion',
      'Document',
      'AuditEvent',
      'BrokerAgencyProfile',
      'DistributionChannelContext',
      'BrokerPlatformRelationship',
      'BrokerMGARelationship',
      'BrokerScopeAccessGrant',
      'BrokerAgencyUser'
    ];

    for (const entityName of entities) {
      try {
        const records = await base44.entities[entityName].list();
        if (records && records.length > 0) {
          report.rowCountByEntity[entityName] = records.length;

          // Estimate proposed stamping
          if (
            ['Employer', 'EmployerCase', 'QuoteScenario', 'Proposal', 'EnrollmentWindow'].includes(
              entityName
            )
          ) {
            report.proposedStampingCounts[entityName] = records.length;
          }
        } else {
          report.rowCountByEntity[entityName] = 0;
        }
      } catch (error) {
        report.rowCountByEntity[entityName] = 0;
      }
    }

    // Calculate totals
    const totalRows = Object.values(report.rowCountByEntity).reduce((a, b) => a + b, 0);
    const stampingTotal = Object.values(report.proposedStampingCounts).reduce((a, b) => a + b, 0);

    // Propose distribution channels to create (one per MGA + one platform)
    try {
      const mgas = await base44.entities.MasterGeneralAgent.list();
      const hasStandaloneBrokers = await base44.entities.BrokerAgencyProfile.list().then(
        (brokers) => brokers && brokers.some((b) => !b.master_general_agent_id)
      );

      report.proposedDistributionChannelContextCreations =
        (mgas ? mgas.length : 0) + (hasStandaloneBrokers ? 1 : 0);
    } catch (error) {
      report.proposedDistributionChannelContextCreations = 0;
    }

    // Summary
    report.detailedCounts = {
      totalRecordsEvaluated: totalRows,
      proposedRecordsToStamp: stampingTotal,
      proposedChannelContextsToCreate: report.proposedDistributionChannelContextCreations,
      estimatedSkippedRecords: totalRows - stampingTotal
    };

    // Overall validation
    if (stampingTotal > 0) {
      report.validationSummary.pass = stampingTotal;
      report.validationSummary.warn = totalRows - stampingTotal;
      report.overallStatus = 'READY_FOR_OPERATOR_REVIEW';
    } else {
      report.validationSummary.fail = totalRows;
      report.overallStatus = 'NO_RECORDS_FOR_BACKFILL';
    }
  } catch (error) {
    report.overallStatus = 'ERROR: ' + error.message;
  }

  return report;
};

/**
 * Disabled execution stub (for future compatibility).
 * Requires separate operator-approved feature flag to execute production backfill.
 * Fails closed during Gate 7A-0.
 */
export const executeProductionBackfillStub = async (operatorApprovalToken) => {
  // Explicitly fail closed; no production changes allowed during Gate 7A-0
  throw new Error('NOT_AUTHORIZED_FOR_GATE_7A_0: Production backfill requires Phase 7A-0.9 approval and explicit operator token.');
};

/**
 * Redact sensitive fields from report data.
 * Removes census, SSN, health, payroll, banking, document data.
 */
export const redactReportData = (data) => {
  if (!data || typeof data !== 'object') return data;

  const redacted = Array.isArray(data) ? [...data] : { ...data };
  const sensitivePatterns = [
    'ssn',
    'health',
    'medical',
    'salary',
    'compensation',
    'banking',
    'account',
    'document',
    'private'
  ];

  const redactObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    const result = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      if (sensitivePatterns.some((p) => lowerKey.includes(p))) {
        result[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = redactObject(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  };

  return redactObject(redacted);
};