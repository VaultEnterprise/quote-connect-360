/**
 * Seed MGA Data Function
 * Creates sample MasterGeneralAgents, MasterGroups, BenefitCases, ActivityLogs, and related data
 * For testing MasterGeneralAgentCommand dashboard and Gate 6C report exports
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to seed data
    if (!['admin', 'platform_super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      mgas: [],
      masterGroups: [],
      cases: [],
      activities: [],
      exceptions: [],
      tasks: [],
      quotes: [],
      census: [],
      message: 'Seed complete',
    };

    // ========== 1. SEED MGAs ==========
    const mga1 = await base44.asServiceRole.entities.MasterGeneralAgent.create({
      name: 'Premier Benefits Group',
      legal_entity_name: 'Premier Benefits Group LLC',
      code: 'PBG-001',
      primary_contact_name: 'Sarah Martinez',
      primary_contact_email: 'sarah.martinez@pbg.com',
      primary_contact_phone: '(415) 555-0101',
      business_address_line1: '500 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      status: 'active',
      onboarding_status: 'activated',
      activation_date: '2025-01-15',
    });

    const mga2 = await base44.asServiceRole.entities.MasterGeneralAgent.create({
      name: 'Coast to Coast Insurance Partners',
      legal_entity_name: 'Coast to Coast Insurance Partners Inc',
      code: 'CCI-002',
      primary_contact_name: 'James Chen',
      primary_contact_email: 'james.chen@cci.com',
      primary_contact_phone: '(212) 555-0202',
      business_address_line1: '1 New York Plaza',
      city: 'New York',
      state: 'NY',
      zip: '10004',
      status: 'active',
      onboarding_status: 'activated',
      activation_date: '2025-02-20',
    });

    results.mgas.push(mga1.id, mga2.id);

    // ========== 2. SEED MASTER GROUPS ==========
    const masterGroup1 = await base44.asServiceRole.entities.MasterGroup.create({
      master_general_agent_id: mga1.id,
      mga_assigned_at: new Date().toISOString(),
      mga_assigned_by: user.email,
      ownership_status: 'assigned',
      name: 'Tech Companies West Coast',
      code: 'PBG-MG-001',
      status: 'active',
      primary_contact_name: 'Emily Rodriguez',
      primary_contact_email: 'emily@pbg.com',
    });

    const masterGroup2 = await base44.asServiceRole.entities.MasterGroup.create({
      master_general_agent_id: mga2.id,
      mga_assigned_at: new Date().toISOString(),
      mga_assigned_by: user.email,
      ownership_status: 'assigned',
      name: 'Financial Services East',
      code: 'CCI-MG-002',
      status: 'active',
      primary_contact_name: 'Michael Thompson',
      primary_contact_email: 'michael@cci.com',
    });

    results.masterGroups.push(masterGroup1.id, masterGroup2.id);

    // ========== 3. SEED EMPLOYER GROUPS & BENEFIT CASES ==========
    const employerGroup1 = await base44.asServiceRole.entities.EmployerGroup.create({
      agency_id: 'AGENCY-001',
      master_group_id: masterGroup1.id,
      master_general_agent_id: mga1.id,
      name: 'Acme Tech Solutions',
      ein: '12-3456789',
      employee_count: 250,
      eligible_count: 240,
      status: 'active',
    });

    const case1 = await base44.asServiceRole.entities.BenefitCase.create({
      agency_id: 'AGENCY-001',
      employer_group_id: employerGroup1.id,
      master_group_id: masterGroup1.id,
      master_general_agent_id: mga1.id,
      case_number: 'QC-2026-001',
      case_type: 'new_business',
      effective_date: '2026-06-01',
      stage: 'ready_for_quote',
      priority: 'high',
      assigned_to: 'broker@pbg.com',
      employer_name: 'Acme Tech Solutions',
      employee_count: 250,
      census_status: 'validated',
      quote_status: 'in_progress',
    });

    const employerGroup2 = await base44.asServiceRole.entities.EmployerGroup.create({
      agency_id: 'AGENCY-002',
      master_group_id: masterGroup2.id,
      master_general_agent_id: mga2.id,
      name: 'Global Finance Corp',
      ein: '98-7654321',
      employee_count: 500,
      eligible_count: 480,
      status: 'active',
    });

    const case2 = await base44.asServiceRole.entities.BenefitCase.create({
      agency_id: 'AGENCY-002',
      employer_group_id: employerGroup2.id,
      master_group_id: masterGroup2.id,
      master_general_agent_id: mga2.id,
      case_number: 'QC-2026-002',
      case_type: 'renewal',
      effective_date: '2026-07-01',
      stage: 'quoting',
      priority: 'normal',
      assigned_to: 'broker@cci.com',
      employer_name: 'Global Finance Corp',
      employee_count: 500,
      census_status: 'validated',
      quote_status: 'in_progress',
    });

    results.cases.push(case1.id, case2.id);

    // ========== 4. SEED ACTIVITY LOGS ==========
    const activity1 = await base44.asServiceRole.entities.ActivityLog.create({
      case_id: case1.id,
      master_general_agent_id: mga1.id,
      master_group_id: masterGroup1.id,
      actor_email: 'broker@pbg.com',
      actor_name: 'Sarah Martinez',
      actor_role: 'mga_admin',
      action: 'case_stage_advanced',
      detail: 'Moved case to ready_for_quote stage',
      entity_type: 'BenefitCase',
      entity_id: case1.id,
      new_value: 'ready_for_quote',
      outcome: 'success',
    });

    const activity2 = await base44.asServiceRole.entities.ActivityLog.create({
      case_id: case2.id,
      master_general_agent_id: mga2.id,
      master_group_id: masterGroup2.id,
      actor_email: 'broker@cci.com',
      actor_name: 'James Chen',
      actor_role: 'mga_manager',
      action: 'quote_scenario_created',
      detail: 'Created new quote scenario',
      entity_type: 'QuoteScenario',
      outcome: 'success',
    });

    results.activities.push(activity1.id, activity2.id);

    // ========== 5. SEED EXCEPTIONS ==========
    const exception1 = await base44.asServiceRole.entities.ExceptionItem.create({
      case_id: case1.id,
      master_general_agent_id: mga1.id,
      master_group_id: masterGroup1.id,
      employer_name: 'Acme Tech Solutions',
      category: 'census',
      severity: 'medium',
      status: 'triaged',
      title: 'Missing dependent information',
      description: 'Several employees missing spouse DOB',
      assigned_to: 'admin@pbg.com',
      due_by: '2026-05-18',
    });

    results.exceptions.push(exception1.id);

    // ========== 6. SEED CASE TASKS ==========
    const task1 = await base44.asServiceRole.entities.CaseTask.create({
      case_id: case1.id,
      master_general_agent_id: mga1.id,
      master_group_id: masterGroup1.id,
      title: 'Review census data',
      description: 'Validate all employee census records',
      task_type: 'review',
      status: 'in_progress',
      priority: 'high',
      assigned_to: 'broker@pbg.com',
      due_date: '2026-05-15',
      employer_name: 'Acme Tech Solutions',
    });

    results.tasks.push(task1.id);

    // ========== 7. SEED CENSUS VERSIONS (for Gate 6C testing) ==========
    const census1 = await base44.asServiceRole.entities.CensusVersion.create({
      case_id: case1.id,
      master_general_agent_id: mga1.id,
      master_group_id: masterGroup1.id,
      version_number: 1,
      file_name: 'acme-census-v1.csv',
      status: 'validated',
      total_employees: 250,
      total_dependents: 180,
      eligible_employees: 240,
      validation_errors: 0,
      validation_warnings: 2,
      uploaded_by: 'broker@pbg.com',
      validated_at: new Date().toISOString(),
    });

    results.census.push(census1.id);

    // ========== 8. SEED QUOTE SCENARIOS (for Gate 6C testing) ==========
    const quote1 = await base44.asServiceRole.entities.QuoteScenario.create({
      case_id: case1.id,
      master_general_agent_id: mga1.id,
      master_group_id: masterGroup1.id,
      name: 'Scenario A - Current Carriers',
      description: 'Renew with existing carriers',
      status: 'completed',
      census_version_id: census1.id,
      products_included: ['medical', 'dental', 'vision'],
      carriers_included: ['UnitedHealthcare', 'Cigna'],
      contribution_strategy: 'percentage',
      employer_contribution_ee: 80,
      employer_contribution_dep: 60,
      total_monthly_premium: 15000,
      employer_monthly_cost: 12000,
      employee_monthly_cost_avg: 150,
      plan_count: 5,
      is_recommended: true,
      recommendation_score: 85,
      quoted_at: new Date().toISOString(),
    });

    results.quotes.push(quote1.id);

    // ========== 9. SEED CENSUS MEMBERS (for Gate 6C testing) ==========
    const member1 = await base44.asServiceRole.entities.CensusMember.create({
      census_version_id: census1.id,
      case_id: case1.id,
      master_general_agent_id: mga1.id,
      master_group_id: masterGroup1.id,
      employee_id: 'EMP-001',
      first_name: 'John',
      last_name: 'Smith',
      date_of_birth: '1985-03-15',
      gender: 'male',
      ssn_last4: '1234',
      email: 'john.smith@acme.com',
      phone: '(555) 123-4567',
      hire_date: '2020-01-15',
      employment_status: 'active',
      employment_type: 'full_time',
      hours_per_week: 40,
      annual_salary: 95000,
      job_title: 'Software Engineer',
      department: 'Engineering',
      is_eligible: true,
      dependent_count: 2,
      coverage_tier: 'family',
      validation_status: 'valid',
    });

    results.census.push(member1.id);

    return Response.json({
      ...results,
      success: true,
      summary: `Seeded ${results.mgas.length} MGAs, ${results.masterGroups.length} Master Groups, ${results.cases.length} Benefit Cases, ${results.activities.length} Activity Logs, ${results.exceptions.length} Exceptions, ${results.tasks.length} Tasks, and test data for Gate 6C reports`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});