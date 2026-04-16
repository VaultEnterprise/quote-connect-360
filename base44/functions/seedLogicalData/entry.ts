import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const agencySeed = {
  name: 'Northstar Benefits Advisors',
  code: 'NSB-001',
  address: '4100 MacArthur Blvd',
  city: 'Newport Beach',
  state: 'CA',
  zip: '92660',
  phone: '(949) 555-0100',
  email: 'team@northstarbenefits.example.com',
  status: 'active',
  settings: {
    region: 'West',
    market_segment: 'small_group',
  },
};

const workforceTargets = {
  redwood: { employeeCount: 52, eligibleCount: 50, totalDependents: 24, prefix: 'RWD', startNumber: 1001, domain: 'redwoodcreative.example.com', city: 'Newport Beach', state: 'CA', zip: '92660', location: 'Newport Beach HQ', departments: ['Creative', 'Client Success', 'Operations', 'Design'], titles: ['Creative Strategist', 'Account Manager', 'Designer', 'Operations Lead'] },
  sierra: { employeeCount: 74, eligibleCount: 68, totalDependents: 37, prefix: 'SIE', startNumber: 2001, domain: 'sierraprecision.example.com', city: 'Reno', state: 'NV', zip: '89502', location: 'Reno Plant', departments: ['Production', 'Finance', 'Engineering', 'Operations'], titles: ['Production Supervisor', 'Plant Analyst', 'Process Engineer', 'Operations Manager'] },
  harbor: { employeeCount: 58, eligibleCount: 54, totalDependents: 22, prefix: 'HWC', startNumber: 3001, domain: 'harborwellness.example.com', city: 'Laguna Beach', state: 'CA', zip: '92651', location: 'Laguna Beach Clinic', departments: ['Clinical', 'Care Coordination', 'Administration', 'Wellness'], titles: ['Nurse Practitioner', 'Care Coordinator', 'Clinic Manager', 'Wellness Specialist'] },
};

const firstNames = ['Jordan', 'Mia', 'Olivia', 'Priya', 'Ethan', 'Sophia', 'Noah', 'Ava', 'Lucas', 'Emma', 'Mason', 'Isabella'];
const lastNames = ['Lee', 'Gomez', 'Turner', 'Nair', 'Brooks', 'Patel', 'Foster', 'Kim', 'Reed', 'Shah', 'Ortiz', 'Carter'];
const coverageTiers = ['employee_only', 'employee_spouse', 'employee_children', 'family'];

const employeeOverrides = {
  redwood: {
    0: { first_name: 'Jordan', last_name: 'Lee', date_of_birth: '1992-04-18', gender: 'male', ssn_last4: '4102', email: 'jlee@redwoodcreative.example.com', phone: '(949) 555-1011', address: '12 Bayview Lane', city: 'Costa Mesa', zip: '92627', hire_date: '2021-02-01', annual_salary: 88000, job_title: 'Creative Director', department: 'Creative', dependent_count: 0, coverage_tier: 'employee_only' },
    1: { first_name: 'Mia', last_name: 'Gomez', date_of_birth: '1987-11-02', gender: 'female', ssn_last4: '8221', email: 'mgomez@redwoodcreative.example.com', phone: '(949) 555-1012', address: '88 Seaside Drive', city: 'Irvine', zip: '92618', hire_date: '2019-08-12', annual_salary: 102000, job_title: 'Account Strategist', department: 'Client Success', dependent_count: 3, coverage_tier: 'family', location: 'Hybrid' },
  },
  sierra: {
    0: { first_name: 'Olivia', last_name: 'Turner', date_of_birth: '1985-01-14', gender: 'female', ssn_last4: '2041', email: 'oturner@sierraprecision.example.com', phone: '(775) 555-2011', address: '510 Arrowhead Way', city: 'Reno', zip: '89511', hire_date: '2018-03-19', annual_salary: 94000, job_title: 'Plant Controller', department: 'Finance', dependent_count: 2, coverage_tier: 'family' },
  },
  harbor: {
    0: { first_name: 'Priya', last_name: 'Nair', date_of_birth: '1990-12-12', gender: 'female', ssn_last4: '4411', email: 'pnair@harborwellness.example.com', phone: '(949) 555-3011', address: '17 Temple Hills Drive', city: 'Laguna Beach', zip: '92651', hire_date: '2020-06-15', annual_salary: 99000, job_title: 'Nurse Practitioner', department: 'Clinical', dependent_count: 0, coverage_tier: 'employee_only' },
  },
};

const buildCensusMemberSeeds = (censusVersionMap, caseMap) => {
  return Object.entries(workforceTargets).flatMap(([key, config]) => {
    return Array.from({ length: config.employeeCount }, (_, index) => {
      const override = employeeOverrides[key]?.[index] || {};
      const employeeNumber = config.startNumber + index;
      const firstName = override.first_name || firstNames[index % firstNames.length];
      const lastName = override.last_name || lastNames[(index + 3) % lastNames.length];
      const dependentCount = override.dependent_count ?? (index % 5 === 0 ? 3 : index % 4 === 0 ? 2 : index % 3 === 0 ? 1 : 0);
      const coverageTier = override.coverage_tier || coverageTiers[Math.min(dependentCount, 3)];
      const month = String((index % 12) + 1).padStart(2, '0');
      const day = String((index % 28) + 1).padStart(2, '0');
      const hireMonth = String(((index + 2) % 12) + 1).padStart(2, '0');
      const hireDay = String(((index + 5) % 28) + 1).padStart(2, '0');

      return {
        census_version_id: censusVersionMap[key].id,
        case_id: caseMap[key].id,
        employee_id: `${config.prefix}-${employeeNumber}`,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: override.date_of_birth || `${1981 + (index % 16)}-${month}-${day}`,
        gender: override.gender || (index % 2 === 0 ? 'female' : 'male'),
        ssn_last4: override.ssn_last4 || String(1000 + ((index * 137) % 9000)),
        email: override.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@${config.domain}`,
        phone: override.phone || `(555) 01${String(employeeNumber).slice(-2)}-${String(10 + (index % 90)).padStart(2, '0')}`,
        address: override.address || `${100 + index} Market Street`,
        city: override.city || config.city,
        state: config.state,
        zip: override.zip || config.zip,
        hire_date: override.hire_date || `${2016 + (index % 9)}-${hireMonth}-${hireDay}`,
        employment_status: 'active',
        employment_type: 'full_time',
        hours_per_week: 40,
        annual_salary: override.annual_salary || 62000 + (index * 1750),
        job_title: override.job_title || config.titles[index % config.titles.length],
        department: override.department || config.departments[index % config.departments.length],
        location: override.location || config.location,
        class_code: 'FT',
        is_eligible: index < config.eligibleCount,
        dependent_count: dependentCount,
        coverage_tier: coverageTier,
        validation_status: 'valid',
        validation_issues: [],
      };
    });
  });
};

const employerSeeds = [
  {
    name: 'Redwood Creative Studio',
    dba_name: 'Redwood Creative',
    ein: '84-3321981',
    industry: 'Marketing & Advertising',
    sic_code: '7311',
    address: '5000 Birch Street',
    city: 'Newport Beach',
    state: 'CA',
    zip: '92660',
    phone: '(949) 555-1100',
    website: 'https://redwoodcreative.example.com',
    employee_count: workforceTargets.redwood.employeeCount,
    eligible_count: workforceTargets.redwood.eligibleCount,
    effective_date: '2026-06-01',
    renewal_date: '2027-06-01',
    status: 'prospect',
    primary_contact_name: 'Nicole Alvarez',
    primary_contact_email: 'nalvarez@redwoodcreative.example.com',
    primary_contact_phone: '(949) 555-1101',
  },
  {
    name: 'Sierra Precision Manufacturing',
    dba_name: 'Sierra Precision',
    ein: '91-4418207',
    industry: 'Manufacturing',
    sic_code: '3499',
    address: '1450 Industrial Way',
    city: 'Reno',
    state: 'NV',
    zip: '89502',
    phone: '(775) 555-2200',
    website: 'https://sierraprecision.example.com',
    employee_count: workforceTargets.sierra.employeeCount,
    eligible_count: workforceTargets.sierra.eligibleCount,
    effective_date: '2026-07-01',
    renewal_date: '2027-07-01',
    status: 'active',
    primary_contact_name: 'Marcus Hale',
    primary_contact_email: 'mhale@sierraprecision.example.com',
    primary_contact_phone: '(775) 555-2201',
  },
  {
    name: 'Harbor Wellness Clinic',
    dba_name: 'Harbor Wellness',
    ein: '77-1905142',
    industry: 'Healthcare',
    sic_code: '8011',
    address: '125 Coast Highway',
    city: 'Laguna Beach',
    state: 'CA',
    zip: '92651',
    phone: '(949) 555-3300',
    website: 'https://harborwellness.example.com',
    employee_count: workforceTargets.harbor.employeeCount,
    eligible_count: workforceTargets.harbor.eligibleCount,
    effective_date: '2026-08-01',
    renewal_date: '2027-08-01',
    status: 'active',
    primary_contact_name: 'Dr. Priya Shah',
    primary_contact_email: 'pshah@harborwellness.example.com',
    primary_contact_phone: '(949) 555-3301',
  },
];

const planSeeds = [
  {
    key: 'eliteGold',
    plan_type: 'medical',
    carrier: 'QC360',
    plan_name: 'Elite Gold',
    plan_code: 'QC-MED-ELGOLD',
    network_type: 'PPO',
    state: 'CA',
    effective_date: '2026-01-01',
    deductible_individual: 1000,
    deductible_family: 3000,
    oop_max_individual: 7800,
    oop_max_family: 15600,
    copay_pcp: 30,
    copay_specialist: 55,
    copay_er: 350,
    coinsurance: 80,
    rx_tier1: 15,
    rx_tier2: 35,
    rx_tier3: 65,
    rx_tier4: 120,
    hsa_eligible: false,
    status: 'active',
    notes: 'Recommended PPO finalist for creative and professional groups.',
  },
  {
    key: 'vaultElite',
    plan_type: 'medical',
    carrier: 'QC360',
    plan_name: 'Vault Elite',
    plan_code: 'QC-MED-VAULT',
    network_type: 'HDHP',
    state: 'CA',
    effective_date: '2026-01-01',
    deductible_individual: 3200,
    deductible_family: 6400,
    oop_max_individual: 7050,
    oop_max_family: 14100,
    copay_pcp: 0,
    copay_specialist: 0,
    copay_er: 0,
    coinsurance: 80,
    rx_tier1: 10,
    rx_tier2: 30,
    rx_tier3: 60,
    rx_tier4: 110,
    hsa_eligible: true,
    status: 'active',
    notes: 'HSA-friendly alternative for cost-conscious employers.',
  },
  {
    key: 'elitePlus',
    plan_type: 'medical',
    carrier: 'QC360',
    plan_name: 'Elite Plus',
    plan_code: 'QC-MED-ELPLUS',
    network_type: 'PPO',
    state: 'CA',
    effective_date: '2026-01-01',
    deductible_individual: 1500,
    deductible_family: 3000,
    oop_max_individual: 8000,
    oop_max_family: 16000,
    copay_pcp: 35,
    copay_specialist: 60,
    copay_er: 375,
    coinsurance: 75,
    rx_tier1: 15,
    rx_tier2: 40,
    rx_tier3: 75,
    rx_tier4: 130,
    hsa_eligible: false,
    status: 'active',
    notes: 'Low-disruption renewal option.',
  },
  {
    key: 'dentalPlus',
    plan_type: 'dental',
    carrier: 'QC360',
    plan_name: 'Dental Plus',
    plan_code: 'QC-DEN-PLUS',
    network_type: 'PPO',
    state: 'CA',
    effective_date: '2026-01-01',
    status: 'active',
    notes: 'Enhanced dental package.',
  },
  {
    key: 'visionPlus',
    plan_type: 'vision',
    carrier: 'QC360',
    plan_name: 'Vision Plus',
    plan_code: 'QC-VIS-PLUS',
    network_type: 'other',
    state: 'CA',
    effective_date: '2026-01-01',
    status: 'active',
    notes: 'Enhanced vision package.',
  },
  {
    key: 'basicLife',
    plan_type: 'life',
    carrier: 'QC360',
    plan_name: 'Basic Life Insurance',
    plan_code: 'QC-LIFE-BASIC',
    network_type: 'other',
    state: 'CA',
    effective_date: '2026-01-01',
    status: 'active',
    notes: 'Employer-paid basic life coverage.',
  },
  {
    key: 'shortTermDisability',
    plan_type: 'std',
    carrier: 'QC360',
    plan_name: 'Short-Term Disability 60%',
    plan_code: 'QC-STD-60',
    network_type: 'other',
    state: 'CA',
    effective_date: '2026-01-01',
    status: 'active',
    notes: 'Short-term disability coverage with 60% income replacement.',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const counts = { created: {}, existing: {}, updated: {} };

    const bump = (bucket, name) => {
      bucket[name] = (bucket[name] || 0) + 1;
    };

    const bumpBy = (bucket, name, amount) => {
      bucket[name] = (bucket[name] || 0) + amount;
    };

    const listEntities = async (entityName, limit = 200) => {
      return await base44.asServiceRole.entities[entityName].list('-created_date', limit);
    };

    const ensureRecord = async (entityName, cache, matcher, payload) => {
      const existing = cache.find(matcher);
      if (existing) {
        bump(counts.existing, entityName);
        return existing;
      }
      const created = await base44.asServiceRole.entities[entityName].create(payload);
      cache.unshift(created);
      bump(counts.created, entityName);
      return created;
    };

    const updateRecordIfNeeded = async (entityName, cache, record, updates) => {
      const changedFields = Object.fromEntries(
        Object.entries(updates).filter(([key, value]) => JSON.stringify(record[key]) !== JSON.stringify(value)),
      );

      if (Object.keys(changedFields).length === 0) {
        return record;
      }

      await base44.asServiceRole.entities[entityName].update(record.id, changedFields);
      const updatedRecord = { ...record, ...changedFields };
      const recordIndex = cache.findIndex((item) => item.id === record.id);
      if (recordIndex >= 0) {
        cache[recordIndex] = updatedRecord;
      }
      bump(counts.updated, entityName);
      return updatedRecord;
    };

    const [
      agencies,
      employers,
      cases,
      plans,
      scenarios,
      proposals,
      tasks,
      enrollmentWindows,
      renewalCycles,
      exceptions,
      censusVersions,
      censusMembers,
      planRates,
      planSchedules,
      planRateDetails,
      zipMaps,
      ageBandedRates,
      carrierPerformance,
      rateAlerts,
      completenessFlags,
      planUsage,
      ratedResults,
    ] = await Promise.all([
      listEntities('Agency', 50),
      listEntities('EmployerGroup', 200),
      listEntities('BenefitCase', 200),
      listEntities('BenefitPlan', 200),
      listEntities('QuoteScenario', 200),
      listEntities('Proposal', 200),
      listEntities('CaseTask', 300),
      listEntities('EnrollmentWindow', 100),
      listEntities('RenewalCycle', 100),
      listEntities('ExceptionItem', 200),
      listEntities('CensusVersion', 200),
      listEntities('CensusMember', 400),
      listEntities('PlanRateByState', 200),
      listEntities('PlanRateSchedule', 200),
      listEntities('PlanRateDetail', 400),
      listEntities('PlanZipAreaMap', 400),
      listEntities('AgeBandedRate', 200),
      listEntities('CarrierPerformance', 100),
      listEntities('RateVarianceAlert', 100),
      listEntities('DataCompletenessFlag', 100),
      listEntities('PlanUsageAnalytics', 100),
      listEntities('CaseRatedResult', 100),
    ]);

    const agency = await ensureRecord(
      'Agency',
      agencies,
      (item) => item.code === agencySeed.code,
      agencySeed,
    );

    const employerMap = {};
    for (const seed of employerSeeds) {
      const employerRecord = await ensureRecord(
        'EmployerGroup',
        employers,
        (item) => item.name === seed.name,
        { ...seed, agency_id: agency.id },
      );
      employerMap[seed.name] = await updateRecordIfNeeded('EmployerGroup', employers, employerRecord, {
        employee_count: seed.employee_count,
        eligible_count: seed.eligible_count,
      });
    }

    const caseMap = {};
    const caseSeeds = [
      {
        key: 'redwood',
        employerName: 'Redwood Creative Studio',
        case_number: 'BC-RWD-2601',
        case_type: 'new_business',
        effective_date: '2026-06-01',
        stage: 'quoting',
        priority: 'high',
        assigned_to: user.email,
        products_requested: ['medical', 'dental', 'vision'],
        notes: 'Redwood is comparing a richer PPO option against an HSA-led strategy before finalist presentations.',
        employer_name: 'Redwood Creative Studio',
        employee_count: workforceTargets.redwood.employeeCount,
        census_status: 'validated',
        quote_status: 'in_progress',
        enrollment_status: 'not_started',
        last_activity_date: '2026-03-26T03:00:00.000Z',
        target_close_date: '2026-04-18',
      },
      {
        key: 'sierra',
        employerName: 'Sierra Precision Manufacturing',
        case_number: 'BC-SIE-2601',
        case_type: 'takeover',
        effective_date: '2026-07-01',
        stage: 'enrollment_open',
        priority: 'urgent',
        assigned_to: user.email,
        products_requested: ['medical', 'dental', 'vision', 'life'],
        notes: 'Sierra is moving off a legacy carrier and is in active employee enrollment with a July 1 effective date.',
        employer_name: 'Sierra Precision Manufacturing',
        employee_count: workforceTargets.sierra.employeeCount,
        census_status: 'validated',
        quote_status: 'completed',
        enrollment_status: 'open',
        last_activity_date: '2026-03-25T22:30:00.000Z',
        target_close_date: '2026-04-05',
      },
      {
        key: 'harbor',
        employerName: 'Harbor Wellness Clinic',
        case_number: 'BC-HWC-2601',
        case_type: 'renewal',
        effective_date: '2026-08-01',
        stage: 'employer_review',
        priority: 'normal',
        assigned_to: user.email,
        products_requested: ['medical', 'life', 'std'],
        notes: 'Harbor Wellness is reviewing renewal options with a focus on minimizing disruption while controlling renewal increase.',
        employer_name: 'Harbor Wellness Clinic',
        employee_count: workforceTargets.harbor.employeeCount,
        census_status: 'validated',
        quote_status: 'completed',
        enrollment_status: 'not_started',
        last_activity_date: '2026-03-24T18:15:00.000Z',
        target_close_date: '2026-04-22',
      },
    ];

    for (const seed of caseSeeds) {
      const caseRecord = await ensureRecord(
        'BenefitCase',
        cases,
        (item) => item.case_number === seed.case_number,
        {
          ...seed,
          agency_id: agency.id,
          employer_group_id: employerMap[seed.employerName].id,
        },
      );
      caseMap[seed.key] = await updateRecordIfNeeded('BenefitCase', cases, caseRecord, {
        employee_count: seed.employee_count,
      });
    }

    const planMap = {};
    for (const seed of planSeeds) {
      planMap[seed.key] = await ensureRecord(
        'BenefitPlan',
        plans,
        (item) => item.plan_name === seed.plan_name && item.carrier === seed.carrier,
        seed,
      );
    }

    const censusVersionMap = {};
    const censusSeeds = [
      {
        key: 'redwood',
        case_id: caseMap.redwood.id,
        version_number: 1,
        file_name: 'redwood_census_q2_2026.xlsx',
        status: 'validated',
        total_employees: workforceTargets.redwood.employeeCount,
        total_dependents: workforceTargets.redwood.totalDependents,
        eligible_employees: workforceTargets.redwood.eligibleCount,
        validation_errors: 0,
        validation_warnings: 1,
        uploaded_by: user.email,
        validated_at: '2026-03-25T16:00:00.000Z',
        notes: 'Validated census for finalist quoting.',
      },
      {
        key: 'sierra',
        case_id: caseMap.sierra.id,
        version_number: 1,
        file_name: 'sierra_takeover_census_2026.xlsx',
        status: 'validated',
        total_employees: workforceTargets.sierra.employeeCount,
        total_dependents: workforceTargets.sierra.totalDependents,
        eligible_employees: workforceTargets.sierra.eligibleCount,
        validation_errors: 0,
        validation_warnings: 2,
        uploaded_by: user.email,
        validated_at: '2026-03-24T21:00:00.000Z',
        notes: 'Takeover census loaded and scrubbed for enrollment.',
      },
      {
        key: 'harbor',
        case_id: caseMap.harbor.id,
        version_number: 1,
        file_name: 'harbor_renewal_census_2026.xlsx',
        status: 'validated',
        total_employees: workforceTargets.harbor.employeeCount,
        total_dependents: workforceTargets.harbor.totalDependents,
        eligible_employees: workforceTargets.harbor.eligibleCount,
        validation_errors: 0,
        validation_warnings: 0,
        uploaded_by: user.email,
        validated_at: '2026-03-24T18:00:00.000Z',
        notes: 'Renewal census prepared for renewal modeling.',
      },
    ];

    for (const seed of censusSeeds) {
      const censusVersionRecord = await ensureRecord(
        'CensusVersion',
        censusVersions,
        (item) => item.case_id === seed.case_id && item.version_number === seed.version_number,
        seed,
      );
      censusVersionMap[seed.key] = await updateRecordIfNeeded('CensusVersion', censusVersions, censusVersionRecord, {
        total_employees: seed.total_employees,
        total_dependents: seed.total_dependents,
        eligible_employees: seed.eligible_employees,
      });
    }

    const censusMemberSeeds = buildCensusMemberSeeds(censusVersionMap, caseMap);

    const existingCensusMemberKeys = new Set(
      censusMembers.map((item) => `${item.census_version_id}:${item.employee_id}`),
    );
    const missingCensusMembers = censusMemberSeeds.filter((seed) => {
      const key = `${seed.census_version_id}:${seed.employee_id}`;
      if (existingCensusMemberKeys.has(key)) {
        bump(counts.existing, 'CensusMember');
        return false;
      }
      existingCensusMemberKeys.add(key);
      return true;
    });

    if (missingCensusMembers.length > 0) {
      for (let i = 0; i < missingCensusMembers.length; i += 25) {
        const batch = missingCensusMembers.slice(i, i + 25);
        const createdBatch = await base44.asServiceRole.entities.CensusMember.bulkCreate(batch);
        censusMembers.unshift(...createdBatch);
      }
      bumpBy(counts.created, 'CensusMember', missingCensusMembers.length);
    }

    const scenarioMap = {};
    const scenarioSeeds = [
      {
        key: 'redwoodRecommended',
        case_id: caseMap.redwood.id,
        name: 'Redwood Elite Gold 80/50',
        description: 'Balanced PPO package with strong employee experience and employer contribution stability.',
        status: 'completed',
        census_version_id: censusVersionMap.redwood.id,
        products_included: ['medical', 'dental', 'vision'],
        carriers_included: ['QC360'],
        effective_date: '2026-06-01',
        contribution_strategy: 'percentage',
        employer_contribution_ee: 80,
        employer_contribution_dep: 50,
        total_monthly_premium: 22640,
        employer_monthly_cost: 17180,
        employee_monthly_cost_avg: 188,
        plan_count: 3,
        is_recommended: true,
        recommendation_score: 92,
        confidence_level: 'high',
        disruption_score: 24,
        notes: 'Recommended finalist option for Redwood.',
        talking_points: ['Rich PPO value story for creative talent retention.', 'Stable employee payroll deductions.'],
        tags: ['finalist', 'recommended'],
        quoted_at: '2026-03-25T17:00:00.000Z',
        expires_at: '2026-04-18T23:59:00.000Z',
        rate_lock_expires_at: '2026-04-10T23:59:00.000Z',
        rate_locked_by: user.email,
        rate_locked_at: '2026-03-25T17:05:00.000Z',
        approval_status: 'approved',
        approval_requested_by: user.email,
        approval_requested_at: '2026-03-25T17:10:00.000Z',
        approval_approved_by: user.email,
        approval_approved_at: '2026-03-25T17:20:00.000Z',
        approval_notes: 'Ready for employer presentation.',
      },
      {
        key: 'redwoodHsa',
        case_id: caseMap.redwood.id,
        name: 'Redwood Vault Elite HSA 85/60',
        description: 'HSA-friendly strategy with lower premium trend and richer employer funding posture.',
        status: 'completed',
        census_version_id: censusVersionMap.redwood.id,
        products_included: ['medical', 'dental', 'vision'],
        carriers_included: ['QC360'],
        effective_date: '2026-06-01',
        contribution_strategy: 'percentage',
        employer_contribution_ee: 85,
        employer_contribution_dep: 60,
        total_monthly_premium: 20980,
        employer_monthly_cost: 16490,
        employee_monthly_cost_avg: 152,
        plan_count: 3,
        is_recommended: false,
        recommendation_score: 86,
        confidence_level: 'medium',
        disruption_score: 38,
        notes: 'Best financial efficiency option if the employer is willing to seed HSAs.',
        talking_points: ['Lowest employer trend outlook.', 'Good fit for younger workforce segments.'],
        tags: ['hsa', 'alternative'],
        quoted_at: '2026-03-25T17:00:00.000Z',
        expires_at: '2026-04-18T23:59:00.000Z',
        rate_lock_expires_at: '2026-04-10T23:59:00.000Z',
        rate_locked_by: user.email,
        rate_locked_at: '2026-03-25T17:05:00.000Z',
        approval_status: 'approved',
        approval_requested_by: user.email,
        approval_requested_at: '2026-03-25T17:10:00.000Z',
        approval_approved_by: user.email,
        approval_approved_at: '2026-03-25T17:20:00.000Z',
        approval_notes: 'Approved as alternate option.',
      },
      {
        key: 'harborRenewal',
        case_id: caseMap.harbor.id,
        name: 'Harbor Renewal Stabilization Bundle',
        description: 'Renewal package focused on keeping disruption low while absorbing moderate rate pressure.',
        status: 'completed',
        census_version_id: censusVersionMap.harbor.id,
        products_included: ['medical', 'life', 'std'],
        carriers_included: ['QC360'],
        effective_date: '2026-08-01',
        contribution_strategy: 'percentage',
        employer_contribution_ee: 82,
        employer_contribution_dep: 45,
        total_monthly_premium: 19120,
        employer_monthly_cost: 14990,
        employee_monthly_cost_avg: 211,
        plan_count: 3,
        is_recommended: true,
        recommendation_score: 90,
        confidence_level: 'high',
        disruption_score: 19,
        notes: 'Renewal recommendation that preserves current network access.',
        talking_points: ['Minimal network disruption.', 'Manageable renewal increase with contribution tune-up.'],
        tags: ['renewal', 'recommended'],
        quoted_at: '2026-03-24T19:00:00.000Z',
        expires_at: '2026-04-25T23:59:00.000Z',
        approval_status: 'approved',
        approval_requested_by: user.email,
        approval_requested_at: '2026-03-24T19:10:00.000Z',
        approval_approved_by: user.email,
        approval_approved_at: '2026-03-24T19:20:00.000Z',
        approval_notes: 'Approved for employer review.',
      },
    ];

    for (const seed of scenarioSeeds) {
      scenarioMap[seed.key] = await ensureRecord(
        'QuoteScenario',
        scenarios,
        (item) => item.case_id === seed.case_id && item.name === seed.name,
        seed,
      );
    }

    const proposalSeeds = [
      {
        case_id: caseMap.redwood.id,
        scenario_id: scenarioMap.redwoodRecommended.id,
        version: 1,
        title: 'Redwood Creative 2026 Finalist Recommendation',
        status: 'sent',
        employer_name: 'Redwood Creative Studio',
        effective_date: '2026-06-01',
        broker_name: user.full_name || 'Broker',
        broker_email: user.email,
        agency_name: agency.name,
        cover_message: 'We recommend the Elite Gold finalist package as the best blend of employee experience and cost control.',
        plan_summary: [
          { plan: 'Elite Gold', type: 'medical' },
          { plan: 'Dental Plus', type: 'dental' },
          { plan: 'Vision Plus', type: 'vision' },
        ],
        contribution_summary: { ee: 80, dep: 50 },
        total_monthly_premium: 22640,
        employer_monthly_cost: 17180,
        employee_avg_cost: 188,
        sent_at: '2026-03-25T18:00:00.000Z',
        expires_at: '2026-04-18T23:59:00.000Z',
        notes: 'Sent to Nicole Alvarez for internal review.',
      },
      {
        case_id: caseMap.harbor.id,
        scenario_id: scenarioMap.harborRenewal.id,
        version: 1,
        title: 'Harbor Wellness 2026 Renewal Recommendation',
        status: 'viewed',
        employer_name: 'Harbor Wellness Clinic',
        effective_date: '2026-08-01',
        broker_name: user.full_name || 'Broker',
        broker_email: user.email,
        agency_name: agency.name,
        cover_message: 'This renewal path keeps the current employee experience stable while limiting the increase to a manageable level.',
        plan_summary: [
          { plan: 'Elite Plus', type: 'medical' },
          { plan: 'Basic Life Insurance', type: 'life' },
          { plan: 'Short-Term Disability 60%', type: 'std' },
        ],
        contribution_summary: { ee: 82, dep: 45 },
        total_monthly_premium: 19120,
        employer_monthly_cost: 14990,
        employee_avg_cost: 211,
        sent_at: '2026-03-24T20:00:00.000Z',
        viewed_at: '2026-03-25T09:12:00.000Z',
        expires_at: '2026-04-25T23:59:00.000Z',
        notes: 'Viewed by Dr. Priya Shah and awaiting board discussion.',
      },
    ];

    for (const seed of proposalSeeds) {
      await ensureRecord(
        'Proposal',
        proposals,
        (item) => item.case_id === seed.case_id && item.title === seed.title,
        seed,
      );
    }

    const taskSeeds = [
      {
        case_id: caseMap.redwood.id,
        title: 'Finalize finalist presentation deck',
        description: 'Add Elite Gold vs Vault Elite side-by-side summary before employer meeting.',
        task_type: 'review',
        status: 'in_progress',
        priority: 'high',
        assigned_to: user.email,
        due_date: '2026-03-28',
        employer_name: 'Redwood Creative Studio',
      },
      {
        case_id: caseMap.redwood.id,
        title: 'Confirm contribution recommendation with CFO',
        description: 'Review payroll impact ranges with employer finance lead.',
        task_type: 'follow_up',
        status: 'pending',
        priority: 'normal',
        assigned_to: user.email,
        due_date: '2026-03-31',
        employer_name: 'Redwood Creative Studio',
      },
      {
        case_id: caseMap.sierra.id,
        title: 'Send day-7 enrollment reminder',
        description: 'Push reminder to employees who are still pending enrollment.',
        task_type: 'action_required',
        status: 'pending',
        priority: 'urgent',
        assigned_to: user.email,
        due_date: '2026-03-27',
        employer_name: 'Sierra Precision Manufacturing',
      },
      {
        case_id: caseMap.harbor.id,
        title: 'Prepare renewal recommendation memo',
        description: 'Summarize renewal increase drivers and recommended employer contribution changes.',
        task_type: 'review',
        status: 'pending',
        priority: 'normal',
        assigned_to: user.email,
        due_date: '2026-03-30',
        employer_name: 'Harbor Wellness Clinic',
      },
    ];

    for (const seed of taskSeeds) {
      await ensureRecord(
        'CaseTask',
        tasks,
        (item) => item.case_id === seed.case_id && item.title === seed.title,
        seed,
      );
    }

    await ensureRecord(
      'EnrollmentWindow',
      enrollmentWindows,
      (item) => item.case_id === caseMap.sierra.id,
      {
        case_id: caseMap.sierra.id,
        status: 'open',
        start_date: '2026-03-20',
        end_date: '2026-04-10',
        effective_date: '2026-07-01',
        total_eligible: 68,
        invited_count: 68,
        enrolled_count: 44,
        waived_count: 6,
        pending_count: 18,
        participation_rate: 65,
        employer_name: 'Sierra Precision Manufacturing',
        reminder_sent_at: '2026-03-25T16:00:00.000Z',
      },
    );

    await ensureRecord(
      'RenewalCycle',
      renewalCycles,
      (item) => item.case_id === caseMap.harbor.id,
      {
        case_id: caseMap.harbor.id,
        employer_group_id: employerMap['Harbor Wellness Clinic'].id,
        renewal_date: '2027-08-01',
        status: 'options_prepared',
        current_premium: 18400,
        renewal_premium: 19850,
        rate_change_percent: 7.9,
        disruption_score: 19,
        recommendation: 'renew_with_changes',
        decision: 'Pending employer selection',
        employer_name: 'Harbor Wellness Clinic',
        assigned_to: user.email,
        notes: 'Employer is reviewing two renewal paths before April board meeting.',
      },
    );

    const exceptionSeeds = [
      {
        case_id: caseMap.redwood.id,
        employer_name: 'Redwood Creative Studio',
        category: 'quote',
        severity: 'medium',
        status: 'triaged',
        title: 'Alternate HSA pricing needs CFO explanation',
        description: 'Employer CFO asked for a clearer comparison of HSA funding offsets versus premium savings.',
        suggested_action: 'Prepare side-by-side contribution and HSA seed modeling.',
        assigned_to: user.email,
        due_by: '2026-03-31',
        entity_type: 'QuoteScenario',
      },
      {
        case_id: caseMap.sierra.id,
        employer_name: 'Sierra Precision Manufacturing',
        category: 'enrollment',
        severity: 'high',
        status: 'in_progress',
        title: 'Dependent verification backlog',
        description: 'Several employees have pending spouse and child verification documents that could delay enrollment completion.',
        suggested_action: 'Send targeted reminder and review uploaded proof daily.',
        assigned_to: user.email,
        due_by: '2026-03-29',
        entity_type: 'EnrollmentWindow',
      },
      {
        case_id: caseMap.harbor.id,
        employer_name: 'Harbor Wellness Clinic',
        category: 'carrier',
        severity: 'low',
        status: 'new',
        title: 'Renewal rate clarification requested',
        description: 'Employer requested carrier explanation for the 7.9% renewal lift versus current premium.',
        suggested_action: 'Provide carrier renewal memo and peer market context.',
        assigned_to: user.email,
        due_by: '2026-04-01',
        entity_type: 'RenewalCycle',
      },
    ];

    for (const seed of exceptionSeeds) {
      await ensureRecord(
        'ExceptionItem',
        exceptions,
        (item) => item.case_id === seed.case_id && item.title === seed.title,
        seed,
      );
    }

    const eliteGoldRate = await ensureRecord(
      'PlanRateByState',
      planRates,
      (item) => item.plan_id === planMap.eliteGold.id && item.state === 'CA' && item.effective_date === '2026-01-01',
      {
        plan_id: planMap.eliteGold.id,
        state: 'CA',
        rate_type: 'composite',
        effective_date: '2026-01-01',
        expiration_date: '2026-12-31',
        lock_expiration_date: '2026-05-15',
        is_locked: false,
        ee_only: 612,
        ee_spouse: 1268,
        ee_children: 1115,
        family: 1684,
        prior_year_ee: 574,
        prior_year_es: 1198,
        prior_year_ec: 1042,
        prior_year_fam: 1580,
        regulatory_notes: 'California small group composite sample rates for Elite Gold.',
        compliance_check_date: '2026-03-20',
        validated_by: user.email,
      },
    );

    const vaultEliteRate = await ensureRecord(
      'PlanRateByState',
      planRates,
      (item) => item.plan_id === planMap.vaultElite.id && item.state === 'CA' && item.effective_date === '2026-01-01',
      {
        plan_id: planMap.vaultElite.id,
        state: 'CA',
        rate_type: 'age_banded',
        effective_date: '2026-01-01',
        expiration_date: '2026-12-31',
        lock_expiration_date: '2026-05-15',
        is_locked: true,
        ee_only: 498,
        ee_spouse: 1016,
        ee_children: 932,
        family: 1418,
        prior_year_ee: 466,
        prior_year_es: 954,
        prior_year_ec: 876,
        prior_year_fam: 1332,
        regulatory_notes: 'California small group age-banded sample rates for Vault Elite.',
        compliance_check_date: '2026-03-20',
        validated_by: user.email,
      },
    );

    const eliteGoldSchedule = await ensureRecord(
      'PlanRateSchedule',
      planSchedules,
      (item) => item.plan_id === planMap.eliteGold.id && item.schedule_name === 'Elite Gold CA Small Group 2026',
      {
        plan_id: planMap.eliteGold.id,
        schedule_name: 'Elite Gold CA Small Group 2026',
        effective_date: '2026-01-01',
        termination_date: '2026-12-31',
        rating_basis: 'composite_area_tier',
        tobacco_mode: 'none',
        state_scope: ['CA'],
        version_number: 1,
        plan_year: 2026,
        market_segment: 'small_group',
        funding_type: 'fully_insured',
        rating_model: 'composite_tier',
        tobacco_rating_flag: false,
        is_active: true,
        uploaded_by: user.email,
        row_count: 4,
        validation_status: 'valid',
        validation_errors: [],
        notes: 'Seeded composite schedule for quoting demos.',
      },
    );

    const vaultEliteSchedule = await ensureRecord(
      'PlanRateSchedule',
      planSchedules,
      (item) => item.plan_id === planMap.vaultElite.id && item.schedule_name === 'Vault Elite CA Small Group 2026',
      {
        plan_id: planMap.vaultElite.id,
        schedule_name: 'Vault Elite CA Small Group 2026',
        effective_date: '2026-01-01',
        termination_date: '2026-12-31',
        rating_basis: 'age_band_area_tier',
        tobacco_mode: 'none',
        state_scope: ['CA'],
        version_number: 1,
        plan_year: 2026,
        market_segment: 'small_group',
        funding_type: 'fully_insured',
        rating_model: 'area_age_band_tier',
        tobacco_rating_flag: false,
        is_active: true,
        uploaded_by: user.email,
        row_count: 4,
        validation_status: 'valid',
        validation_errors: [],
        notes: 'Seeded age-banded schedule for HSA comparison demos.',
      },
    );

    const rateDetailSeeds = [
      { rate_schedule_id: eliteGoldSchedule.id, plan_id: planMap.eliteGold.id, rating_area_code: 'CA001', age_band_code: '30-44', age_min: 30, age_max: 44, tier_code: 'EE', tier_label_raw: 'Employee Only', monthly_rate: 612, annual_rate: 7344 },
      { rate_schedule_id: eliteGoldSchedule.id, plan_id: planMap.eliteGold.id, rating_area_code: 'CA001', age_band_code: '30-44', age_min: 30, age_max: 44, tier_code: 'ES', tier_label_raw: 'Employee + Spouse', monthly_rate: 1268, annual_rate: 15216 },
      { rate_schedule_id: eliteGoldSchedule.id, plan_id: planMap.eliteGold.id, rating_area_code: 'CA001', age_band_code: '30-44', age_min: 30, age_max: 44, tier_code: 'FAM', tier_label_raw: 'Family', monthly_rate: 1684, annual_rate: 20208 },
      { rate_schedule_id: vaultEliteSchedule.id, plan_id: planMap.vaultElite.id, rating_area_code: 'CA001', age_band_code: '30-44', age_min: 30, age_max: 44, tier_code: 'EE', tier_label_raw: 'Employee Only', monthly_rate: 498, annual_rate: 5976 },
    ];

    for (const seed of rateDetailSeeds) {
      await ensureRecord(
        'PlanRateDetail',
        planRateDetails,
        (item) => item.rate_schedule_id === seed.rate_schedule_id && item.rating_area_code === seed.rating_area_code && item.tier_code === seed.tier_code && item.age_band_code === seed.age_band_code,
        {
          ...seed,
          tobacco_flag: false,
          effective_date: '2026-01-01',
          termination_date: '2026-12-31',
          is_active: true,
        },
      );
    }

    const zipSeeds = [
      { plan_id: planMap.eliteGold.id, zip_code: '92660', state_code: 'CA', county: 'Orange', city: 'Newport Beach', rating_area_code: 'CA001' },
      { plan_id: planMap.vaultElite.id, zip_code: '92660', state_code: 'CA', county: 'Orange', city: 'Newport Beach', rating_area_code: 'CA001' },
      { plan_id: planMap.elitePlus.id, zip_code: '92651', state_code: 'CA', county: 'Orange', city: 'Laguna Beach', rating_area_code: 'CA001' },
    ];

    for (const seed of zipSeeds) {
      await ensureRecord(
        'PlanZipAreaMap',
        zipMaps,
        (item) => item.plan_id === seed.plan_id && item.zip_code === seed.zip_code,
        {
          ...seed,
          effective_date: '2026-01-01',
          termination_date: '2026-12-31',
          is_active: true,
          source: 'carrier_provided',
        },
      );
    }

    const ageBandSeeds = [
      { plan_rate_state_id: vaultEliteRate.id, plan_id: planMap.vaultElite.id, state: 'CA', age_min: 0, age_max: 29, ee_rate: 438, es_rate: 892, ec_rate: 824, family_rate: 1238 },
      { plan_rate_state_id: vaultEliteRate.id, plan_id: planMap.vaultElite.id, state: 'CA', age_min: 30, age_max: 44, ee_rate: 498, es_rate: 1016, ec_rate: 932, family_rate: 1418 },
      { plan_rate_state_id: vaultEliteRate.id, plan_id: planMap.vaultElite.id, state: 'CA', age_min: 45, age_max: 64, ee_rate: 592, es_rate: 1188, ec_rate: 1085, family_rate: 1632 },
    ];

    for (const seed of ageBandSeeds) {
      await ensureRecord(
        'AgeBandedRate',
        ageBandedRates,
        (item) => item.plan_rate_state_id === seed.plan_rate_state_id && item.age_min === seed.age_min && item.age_max === seed.age_max,
        {
          ...seed,
          tobacco_surcharge: 0,
          effective_date: '2026-01-01',
        },
      );
    }

    const carrierSeeds = [
      {
        carrier_name: 'QC360',
        metric_period: 'past_12_months',
        total_plans_active: 7,
        total_plans_used: 6,
        win_rate: 62,
        loss_rate: 18,
        average_client_retention: 94,
        average_rate_increase: 7.4,
        complaint_count: 1,
        service_score: 92,
        account_manager: 'Emily Chen',
        account_phone: '(949) 555-4401',
        account_email: 'echen@qc360.example.com',
        notes: 'Strong demo carrier benchmark.',
      },
    ];

    for (const seed of carrierSeeds) {
      await ensureRecord(
        'CarrierPerformance',
        carrierPerformance,
        (item) => item.carrier_name === seed.carrier_name && item.metric_period === seed.metric_period,
        seed,
      );
    }

    const alertSeeds = [
      {
        plan_id: planMap.elitePlus.id,
        state: 'CA',
        alert_type: 'increase_threshold',
        variance_percent: 7.9,
        severity: 'medium',
        alert_message: 'Elite Plus renewal is approaching the internal review threshold.',
        affected_tiers: ['EE', 'ES', 'FAM'],
        is_reviewed: false,
      },
    ];

    for (const seed of alertSeeds) {
      await ensureRecord(
        'RateVarianceAlert',
        rateAlerts,
        (item) => item.plan_id === seed.plan_id && item.state === seed.state && item.alert_type === seed.alert_type,
        seed,
      );
    }

    const completenessSeeds = [
      {
        plan_id: planMap.eliteGold.id,
        missing_fields: [],
        severity: 'ok',
        completeness_score: 100,
        last_checked: '2026-03-25T15:00:00.000Z',
        can_be_quoted: true,
        notes: 'Complete demo-ready PPO plan record.',
      },
      {
        plan_id: planMap.vaultElite.id,
        missing_fields: ['rx_tier4'],
        severity: 'warning',
        completeness_score: 92,
        last_checked: '2026-03-25T15:00:00.000Z',
        can_be_quoted: true,
        notes: 'Minor documentation gap only.',
      },
    ];

    for (const seed of completenessSeeds) {
      await ensureRecord(
        'DataCompletenessFlag',
        completenessFlags,
        (item) => item.plan_id === seed.plan_id,
        seed,
      );
    }

    const usageSeeds = [
      {
        plan_id: planMap.eliteGold.id,
        period: 'month',
        period_date: '2026-03-01',
        times_used_in_scenarios: 4,
        times_selected_by_clients: 2,
        times_quoted: 5,
        case_ids: [caseMap.redwood.id, caseMap.harbor.id],
        states_usage: { CA: 5 },
        avg_client_size: 27,
        utilization_trend: 'increasing',
        adoption_rank: 1,
      },
      {
        plan_id: planMap.vaultElite.id,
        period: 'month',
        period_date: '2026-03-01',
        times_used_in_scenarios: 3,
        times_selected_by_clients: 1,
        times_quoted: 3,
        case_ids: [caseMap.redwood.id],
        states_usage: { CA: 3 },
        avg_client_size: 32,
        utilization_trend: 'stable',
        adoption_rank: 2,
      },
    ];

    for (const seed of usageSeeds) {
      await ensureRecord(
        'PlanUsageAnalytics',
        planUsage,
        (item) => item.plan_id === seed.plan_id && item.period === seed.period && item.period_date === seed.period_date,
        seed,
      );
    }

    await ensureRecord(
      'CaseRatedResult',
      ratedResults,
      (item) => item.case_id === caseMap.redwood.id && item.plan_id === planMap.eliteGold.id,
      {
        case_id: caseMap.redwood.id,
        plan_id: planMap.eliteGold.id,
        rate_schedule_id: eliteGoldSchedule.id,
        census_version_id: censusVersionMap.redwood.id,
        rating_date: '2026-03-26',
        total_members_rated: 2,
        total_members_failed: 0,
        total_monthly_premium: 2296,
        ee_monthly: 612,
        es_monthly: 0,
        ec_monthly: 0,
        fam_monthly: 1684,
        avg_age: 36,
        rating_area_breakdown: { CA001: { count: 2, premium: 2296 } },
        tier_breakdown: { EE: { count: 1, premium: 612 }, FAM: { count: 1, premium: 1684 } },
        member_results: [
          { member_name: 'Jordan Lee', tier: 'EE', monthly_rate: 612 },
          { member_name: 'Mia Gomez', tier: 'FAM', monthly_rate: 1684 },
        ],
        errors: [],
        warnings: ['Sample subset rating based on demo members only.'],
        status: 'completed',
        rated_by: user.email,
      },
    );

    const totalCreated = Object.values(counts.created).reduce((sum, value) => sum + value, 0);
    const totalExisting = Object.values(counts.existing).reduce((sum, value) => sum + value, 0);
    const totalUpdated = Object.values(counts.updated).reduce((sum, value) => sum + value, 0);

    return Response.json({
      success: true,
      message: totalCreated > 0 || totalUpdated > 0 ? 'Logical seed data added successfully.' : 'Logical seed data already exists.',
      totalCreated,
      totalExisting,
      totalUpdated,
      counts,
      seededCases: Object.values(caseMap).map((item) => ({ id: item.id, employer_name: item.employer_name, case_number: item.case_number })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});