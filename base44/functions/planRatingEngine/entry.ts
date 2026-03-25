import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// ─── Age Band Resolver ────────────────────────────────────────────────────────
const AGE_BANDS = [
  { code: "Under25", min: 0,  max: 24 },
  { code: "25-29",   min: 25, max: 29 },
  { code: "30-34",   min: 30, max: 34 },
  { code: "35-39",   min: 35, max: 39 },
  { code: "40-44",   min: 40, max: 44 },
  { code: "45-49",   min: 45, max: 49 },
  { code: "50-54",   min: 50, max: 54 },
  { code: "55-59",   min: 55, max: 59 },
  { code: "60-64",   min: 60, max: 64 },
  { code: "65+",     min: 65, max: 999 },
];

function dobToAge(dob, asOfDate) {
  const d = new Date(dob);
  const ref = new Date(asOfDate);
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

function dobToAgeBand(dob, effectiveDate) {
  const age = dobToAge(dob, effectiveDate);
  const band = AGE_BANDS.find(b => age >= b.min && age <= b.max);
  return { age, band_code: band?.code || "65+", band };
}

// ─── Tier Normalizer ──────────────────────────────────────────────────────────
const TIER_MAP = {
  "single": "EE", "ee": "EE", "employee only": "EE", "employee": "EE",
  "ee+sp": "ES", "ee + sp": "ES", "ee+spouse": "ES", "employee+spouse": "ES",
  "employee + spouse": "ES", "ee/spouse": "ES",
  "ee+ch": "EC", "ee + ch": "EC", "ee+child": "EC", "ee+children": "EC",
  "ee + ch(ren)": "EC", "ee+ch(ren)": "EC", "employee+child": "EC",
  "employee + children": "EC", "ee/child(ren)": "EC",
  "family": "FAM", "fam": "FAM", "ee+fam": "FAM", "ee + family": "FAM",
};

function tierNormalizer(rawTier) {
  if (!rawTier) return null;
  const key = rawTier.toString().toLowerCase().trim();
  return TIER_MAP[key] || null;
}

// ─── ZIP to Area Resolver ─────────────────────────────────────────────────────
async function zipToAreaResolver(base44, zip, planId, effectiveDate) {
  const results = await base44.asServiceRole.entities.PlanZipAreaMap.filter({ zip_code: zip, is_active: true });
  // Prefer plan-specific, then global
  const planSpecific = results.find(r => r.plan_id === planId);
  const global = results.find(r => !r.plan_id);
  const match = planSpecific || global;
  if (!match) return { error: `No rating area found for ZIP ${zip}` };
  return { rating_area_code: match.rating_area_code, state_code: match.state_code, county: match.county };
}

// ─── Plan Rate Resolver ───────────────────────────────────────────────────────
async function planRateResolver(base44, { planId, rateScheduleId, ratingAreaCode, ageBandCode, tierCode, tobaccoFlag }) {
  const filters = {
    plan_id: planId,
    rating_area_code: ratingAreaCode,
    age_band_code: ageBandCode,
    tier_code: tierCode,
    is_active: true,
  };
  if (rateScheduleId) filters.rate_schedule_id = rateScheduleId;

  const rates = await base44.asServiceRole.entities.PlanRateDetail.filter(filters);

  if (!rates.length) {
    return { error: `No rate found: plan=${planId} area=${ratingAreaCode} band=${ageBandCode} tier=${tierCode}` };
  }

  // Prefer tobacco-matched row
  const matched = tobaccoFlag
    ? (rates.find(r => r.tobacco_flag === true) || rates[0])
    : (rates.find(r => !r.tobacco_flag) || rates[0]);

  return { monthly_rate: matched.monthly_rate, rate_record_id: matched.id };
}

// ─── Case Rating Engine ───────────────────────────────────────────────────────
async function caseRatingEngine(base44, { caseId, planId, rateScheduleId, effectiveDate }) {
  const members = await base44.asServiceRole.entities.CensusMember.filter({ case_id: caseId });
  if (!members.length) return { error: "No census members found for this case" };

  const memberResults = [];
  const errors = [];
  const warnings = [];
  let totalPremium = 0;
  let failedCount = 0;
  const tierBreakdown = { EE: { count: 0, premium: 0 }, ES: { count: 0, premium: 0 }, EC: { count: 0, premium: 0 }, FAM: { count: 0, premium: 0 } };
  const areaBreakdown = {};

  for (const member of members) {
    if (!member.is_eligible) continue;

    const result = { member_id: member.id, name: `${member.first_name} ${member.last_name}`, errors: [] };

    // 1. Resolve ZIP → rating area
    const zip = member.zip;
    if (!zip) { result.errors.push("Missing ZIP"); failedCount++; memberResults.push(result); continue; }
    const areaRes = await zipToAreaResolver(base44, zip, planId, effectiveDate);
    if (areaRes.error) { result.errors.push(areaRes.error); warnings.push(`${member.first_name} ${member.last_name}: ${areaRes.error}`); failedCount++; memberResults.push(result); continue; }
    result.rating_area_code = areaRes.rating_area_code;

    // 2. Resolve DOB → age band
    if (!member.date_of_birth) { result.errors.push("Missing DOB"); failedCount++; memberResults.push(result); continue; }
    const ageRes = dobToAgeBand(member.date_of_birth, effectiveDate);
    result.age = ageRes.age;
    result.age_band_code = ageRes.band_code;

    // 3. Normalize tier
    const rawTier = member.coverage_tier;
    const normalizedTier = rawTier ? tierNormalizer(rawTier.replace("_", " ")) : "EE";
    if (!normalizedTier) { result.errors.push(`Unknown tier: ${rawTier}`); failedCount++; memberResults.push(result); continue; }
    result.tier_code = normalizedTier;

    // 4. Lookup rate
    const rateRes = await planRateResolver(base44, {
      planId, rateScheduleId, ratingAreaCode: areaRes.rating_area_code,
      ageBandCode: ageRes.band_code, tierCode: normalizedTier, tobaccoFlag: false,
    });
    if (rateRes.error) { result.errors.push(rateRes.error); failedCount++; memberResults.push(result); continue; }

    result.monthly_rate = rateRes.monthly_rate;
    totalPremium += rateRes.monthly_rate;

    // Aggregate
    if (tierBreakdown[normalizedTier]) {
      tierBreakdown[normalizedTier].count++;
      tierBreakdown[normalizedTier].premium += rateRes.monthly_rate;
    }
    if (!areaBreakdown[areaRes.rating_area_code]) areaBreakdown[areaRes.rating_area_code] = { count: 0, premium: 0 };
    areaBreakdown[areaRes.rating_area_code].count++;
    areaBreakdown[areaRes.rating_area_code].premium += rateRes.monthly_rate;

    memberResults.push(result);
  }

  return {
    total_members_rated: memberResults.length - failedCount,
    total_members_failed: failedCount,
    total_monthly_premium: Math.round(totalPremium * 100) / 100,
    ee_monthly: Math.round(tierBreakdown.EE.premium * 100) / 100,
    es_monthly: Math.round(tierBreakdown.ES.premium * 100) / 100,
    ec_monthly: Math.round(tierBreakdown.EC.premium * 100) / 100,
    fam_monthly: Math.round(tierBreakdown.FAM.premium * 100) / 100,
    tier_breakdown: tierBreakdown,
    rating_area_breakdown: areaBreakdown,
    member_results: memberResults,
    errors, warnings,
    status: failedCount === memberResults.length ? "failed" : "completed",
  };
}

// ─── HTTP Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    if (action === "zipToArea") {
      const { zip, planId, effectiveDate } = body;
      if (!zip) return Response.json({ error: "zip required" }, { status: 400 });
      const result = await zipToAreaResolver(base44, zip, planId, effectiveDate || new Date().toISOString().slice(0, 10));
      return Response.json(result);
    }

    if (action === "dobToAgeBand") {
      const { dob, effectiveDate } = body;
      if (!dob) return Response.json({ error: "dob required" }, { status: 400 });
      return Response.json(dobToAgeBand(dob, effectiveDate || new Date().toISOString().slice(0, 10)));
    }

    if (action === "tierNormalize") {
      const { tier } = body;
      return Response.json({ normalized: tierNormalizer(tier), input: tier });
    }

    if (action === "rateResolve") {
      const { planId, rateScheduleId, ratingAreaCode, ageBandCode, tierCode, tobaccoFlag } = body;
      if (!planId || !ratingAreaCode || !ageBandCode || !tierCode) {
        return Response.json({ error: "planId, ratingAreaCode, ageBandCode, tierCode required" }, { status: 400 });
      }
      const result = await planRateResolver(base44, { planId, rateScheduleId, ratingAreaCode, ageBandCode, tierCode, tobaccoFlag });
      return Response.json(result);
    }

    if (action === "rateCensus") {
      const { caseId, planId, rateScheduleId, effectiveDate } = body;
      if (!caseId || !planId) return Response.json({ error: "caseId and planId required" }, { status: 400 });

      const rating_date = effectiveDate || new Date().toISOString().slice(0, 10);
      const engineResult = await caseRatingEngine(base44, { caseId, planId, rateScheduleId, effectiveDate: rating_date });

      if (engineResult.error) return Response.json({ error: engineResult.error }, { status: 400 });

      // Persist result
      const saved = await base44.entities.CaseRatedResult.create({
        case_id: caseId, plan_id: planId, rate_schedule_id: rateScheduleId,
        rating_date, rated_by: user.email, ...engineResult,
      });

      return Response.json({ ...engineResult, result_id: saved.id });
    }

    if (action === "validateRateSchedule") {
      const { rateScheduleId } = body;
      if (!rateScheduleId) return Response.json({ error: "rateScheduleId required" }, { status: 400 });

      const rates = await base44.asServiceRole.entities.PlanRateDetail.filter({ rate_schedule_id: rateScheduleId });
      const errors = [];
      const seen = new Set();

      rates.forEach((r, i) => {
        if (!r.monthly_rate || r.monthly_rate <= 0) errors.push(`Row ${i + 1}: Missing or zero monthly_rate`);
        if (!r.rating_area_code) errors.push(`Row ${i + 1}: Missing rating_area_code`);
        if (!r.age_band_code) errors.push(`Row ${i + 1}: Missing age_band_code`);
        if (!["EE","ES","EC","FAM"].includes(r.tier_code)) errors.push(`Row ${i + 1}: Invalid tier_code '${r.tier_code}'`);
        const key = `${r.rating_area_code}|${r.age_band_code}|${r.tier_code}|${r.tobacco_flag}`;
        if (seen.has(key)) errors.push(`Row ${i + 1}: Duplicate rate key ${key}`);
        seen.add(key);
      });

      const status = errors.length === 0 ? "valid" : "has_errors";
      await base44.asServiceRole.entities.PlanRateSchedule.update(rateScheduleId, {
        validation_status: status,
        validation_errors: errors.slice(0, 50),
        row_count: rates.length,
      });

      return Response.json({ status, error_count: errors.length, errors: errors.slice(0, 50), row_count: rates.length });
    }

    return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});