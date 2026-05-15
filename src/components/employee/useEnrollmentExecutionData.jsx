import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { buildContributionSnapshot, evaluateEmployeeEligibility } from "./enrollmentExecutionEngine";

export default function useEnrollmentExecutionData({ activeEnrollment, enrollmentWindow }) {
  const caseId = activeEnrollment?.case_id || enrollmentWindow?.case_id;

  const { data: caseRecords = [] } = useQuery({
    queryKey: ["enrollment-case", caseId],
    queryFn: () => caseId ? base44.entities.BenefitCase.filter({ id: caseId }) : Promise.resolve([]),
    enabled: !!caseId,
  });

  const caseData = caseRecords[0];

  const { data: employerRecords = [] } = useQuery({
    queryKey: ["enrollment-employer", caseData?.employer_group_id],
    queryFn: () => caseData?.employer_group_id ? base44.entities.EmployerGroup.filter({ id: caseData.employer_group_id }) : Promise.resolve([]),
    enabled: !!caseData?.employer_group_id,
  });

  const employer = employerRecords[0];

  const { data: memberRecords = [] } = useQuery({
    queryKey: ["enrollment-census-member", activeEnrollment?.employee_email, caseId],
    queryFn: () => activeEnrollment?.employee_email ? base44.entities.CensusMember.filter({ case_id: caseId, email: activeEnrollment.employee_email }, "-created_date", 1) : Promise.resolve([]),
    enabled: !!activeEnrollment?.employee_email && !!caseId,
  });

  const member = memberRecords[0];

  const { data: scenarioPlans = [] } = useQuery({
    queryKey: ["enrollment-scenario-plans", caseId],
    queryFn: async () => {
      if (!caseId) return [];
      const scenarios = await base44.entities.QuoteScenario.filter({ case_id: caseId }, "-updated_date", 20);
      const approvedScenario = scenarios.find((item) => item.approval_status === "approved") || scenarios.find((item) => item.is_recommended) || scenarios[0];
      if (!approvedScenario) return [];
      return base44.entities.ScenarioPlan.filter({ case_id: caseId, scenario_id: approvedScenario.id }, "plan_type", 100);
    },
    enabled: !!caseId,
  });

  const { data: rateTables = [] } = useQuery({
    queryKey: ["enrollment-rate-tables"],
    queryFn: () => base44.entities.PlanRateTable.list("-effective_date", 1000),
  });

  const availablePlans = useMemo(() => {
    const ratesByPlan = rateTables.reduce((acc, table) => {
      acc[table.plan_id] = acc[table.plan_id] || [];
      acc[table.plan_id].push(table);
      return acc;
    }, {});

    const enabledProducts = employer?.settings?.plans?.enabled_products || [];

    return scenarioPlans
      .filter((plan) => !enabledProducts.length || enabledProducts.includes(plan.plan_type))
      .map((plan) => {
        const latestRate = ratesByPlan[plan.plan_id]?.[0];
        const monthlyRate = latestRate?.ee_rate || latestRate?.fam_rate || 0;
        return {
          ...plan,
          id: plan.plan_id,
          monthly_rate: monthlyRate,
        };
      })
      .reduce((acc, plan) => {
        acc[plan.plan_type] = acc[plan.plan_type] || [];
        acc[plan.plan_type].push(plan);
        return acc;
      }, {});
  }, [scenarioPlans, rateTables, employer]);

  const eligibility = useMemo(() => evaluateEmployeeEligibility({ member, employer, enrollmentWindow }), [member, employer, enrollmentWindow]);

  const initialContributionSnapshot = useMemo(() => buildContributionSnapshot({
    selectedPlans: activeEnrollment?.selected_plans || [],
    coverageTier: activeEnrollment?.coverage_tier || "employee_only",
    employer,
  }), [activeEnrollment, employer]);

  return {
    caseData,
    employer,
    member,
    eligibility,
    availablePlans,
    initialContributionSnapshot,
  };
}