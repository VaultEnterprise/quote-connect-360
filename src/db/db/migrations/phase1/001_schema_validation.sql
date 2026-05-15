-- Phase 1: Schema Stamping Fields Validation
-- This file documents the expected schema state after Phase 1
-- No actual migrations are executed; this is a reference for validation

-- Validation queries for Phase 1 (post-migration)
-- Run these to verify all stamping fields are present in production database

-- Query 1: Verify Employer table has all stamping fields
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'employer' 
  AND column_name IN (
    'distribution_channel_context_id',
    'master_general_agent_id',
    'broker_agency_id',
    'owner_org_type',
    'owner_org_id',
    'servicing_org_type',
    'servicing_org_id',
    'supervising_org_type',
    'supervising_org_id',
    'created_by_user_id',
    'created_by_role',
    'visibility_scope',
    'audit_trace_id'
  );
-- Expected: 13 rows

-- Query 2: Verify CensusVersion table has all stamping fields
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'census_version' 
  AND column_name IN (
    'distribution_channel_context_id',
    'master_general_agent_id',
    'broker_agency_id',
    'owner_org_type',
    'owner_org_id',
    'servicing_org_type',
    'servicing_org_id',
    'supervising_org_type',
    'supervising_org_id',
    'created_by_user_id',
    'created_by_role',
    'visibility_scope',
    'audit_trace_id'
  );
-- Expected: 13 rows

-- Query 3: Verify BrokerEmployerRelationship table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'broker_employer_relationship';
-- Expected: 1 row

-- Query 4: Verify BrokerEmployerRelationship has required fields
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'broker_employer_relationship' 
  AND column_name IN (
    'distribution_channel_context_id',
    'broker_agency_id',
    'employer_group_id',
    'relationship_type',
    'status',
    'visibility_scope',
    'owner_org_type',
    'owner_org_id'
  );
-- Expected: 8 rows

-- Query 5: Verify visibility_scope enum values
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'employer' 
  AND constraint_name LIKE '%visibility_scope%';
-- Expected: 1+ rows for enum check constraint