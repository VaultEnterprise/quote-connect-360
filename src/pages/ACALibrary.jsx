import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import {
  Search, Shield, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronRight,
  MapPin, BookOpen, FileText, Scale, DollarSign, Users, Calendar, ExternalLink, Filter
} from "lucide-react";

// ─── Full 50-State ACA Rules Data ──────────────────────────────────────────────
const ACA_STATES = [
  { code: "AL", name: "Alabama", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. No state mandate. Medicaid not expanded." },
  { code: "AK", name: "Alaska", exchange: "federal", medicaid_expansion: true, min_wage: 11.73, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid expanded 2015. High-cost state; special premium adjustments." },
  { code: "AZ", name: "Arizona", exchange: "federal", medicaid_expansion: true, min_wage: 14.35, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. AHCCCS (Medicaid) expanded 2014." },
  { code: "AR", name: "Arkansas", exchange: "federal", medicaid_expansion: true, min_wage: 11.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Private Option Medicaid expansion." },
  { code: "CA", name: "California", exchange: "state", medicaid_expansion: true, min_wage: 16.00, state_mandate: true, esi_mandate: true, shop_available: true, notes: "Covered California (state exchange). Individual mandate since 2020 ($900+ penalty). Medi-Cal expanded. SB 1375 broker compensation rules." },
  { code: "CO", name: "Colorado", exchange: "state", medicaid_expansion: true, min_wage: 14.42, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Connect for Health Colorado. Medicaid (Health First Colorado) expanded. Public option launched 2023." },
  { code: "CT", name: "Connecticut", exchange: "state", medicaid_expansion: true, min_wage: 16.35, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Access Health CT. HUSKY Health (Medicaid) expanded. SustiNet public option study completed." },
  { code: "DE", name: "Delaware", exchange: "state_partnership", medicaid_expansion: true, min_wage: 13.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "State-based partnership with Healthcare.gov. Diamond State Health Plan expanded." },
  { code: "FL", name: "Florida", exchange: "federal", medicaid_expansion: false, min_wage: 13.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid not expanded — largest uninsured state gap. No state mandate." },
  { code: "GA", name: "Georgia", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Pathways waiver (partial Medicaid) approved 2023. No full expansion." },
  { code: "HI", name: "Hawaii", exchange: "state_partnership", medicaid_expansion: true, min_wage: 14.00, state_mandate: false, esi_mandate: true, shop_available: true, notes: "Hawaii Health Connector. Pre-ACA ESI mandate (PHCA 1974). Med-QUEST expanded. Employer must offer if ≥20 hrs/wk." },
  { code: "ID", name: "Idaho", exchange: "state", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Your Health Idaho (state exchange). Medicaid expanded 2020 via ballot initiative." },
  { code: "IL", name: "Illinois", exchange: "state", medicaid_expansion: true, min_wage: 14.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Get Covered Illinois. Medicaid (All Kids / CountyCare) expanded." },
  { code: "IN", name: "Indiana", exchange: "federal", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. HIP 2.0 (Medicaid waiver) expanded. Personal wellness account requirement." },
  { code: "IA", name: "Iowa", exchange: "state_partnership", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Iowa Health and Wellness Plan (Medicaid waiver). State-partnership exchange." },
  { code: "KS", name: "Kansas", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid not expanded. Legislature blocked expansion." },
  { code: "KY", name: "Kentucky", exchange: "state", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "kynect (state exchange relaunched 2021). Medicaid expanded — one of highest enrollment rates." },
  { code: "LA", name: "Louisiana", exchange: "federal", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid expanded 2016 via executive order." },
  { code: "ME", name: "Maine", exchange: "state_partnership", medicaid_expansion: true, min_wage: 14.15, state_mandate: false, esi_mandate: false, shop_available: true, notes: "State-based partnership. Medicaid expanded 2019 via ballot initiative." },
  { code: "MD", name: "Maryland", exchange: "state", medicaid_expansion: true, min_wage: 15.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Maryland Health Connection. Medicaid (HealthChoice) expanded. Reinsurance program lowers premiums." },
  { code: "MA", name: "Massachusetts", exchange: "state", medicaid_expansion: true, min_wage: 15.00, state_mandate: true, esi_mandate: true, shop_available: true, notes: "Massachusetts Health Connector (pre-ACA model). Individual mandate predates ACA. MassHealth expanded. Employer Fair Share contribution required." },
  { code: "MI", name: "Michigan", exchange: "state", medicaid_expansion: true, min_wage: 10.33, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Healthy Michigan Plan (Medicaid). MI Bridges/marketplace partnership. State-based exchange." },
  { code: "MN", name: "Minnesota", exchange: "state", medicaid_expansion: true, min_wage: 10.85, state_mandate: false, esi_mandate: false, shop_available: true, notes: "MNsure (state exchange). Medical Assistance/MinnesotaCare expanded. Basic Health Program (MinnesotaCare) operates below 200% FPL." },
  { code: "MS", name: "Mississippi", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid not expanded. Highest uninsured rate in nation." },
  { code: "MO", name: "Missouri", exchange: "federal", medicaid_expansion: true, min_wage: 12.30, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid expanded 2021 via ballot initiative (Amendment 2)." },
  { code: "MT", name: "Montana", exchange: "federal", medicaid_expansion: true, min_wage: 10.30, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Healthy Montana Plan (Medicaid) expanded 2016." },
  { code: "NE", name: "Nebraska", exchange: "federal", medicaid_expansion: true, min_wage: 12.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Heritage Health (Medicaid) expanded 2020 via ballot measure." },
  { code: "NV", name: "Nevada", exchange: "state", medicaid_expansion: true, min_wage: 12.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Nevada Health Link (state exchange). Medicaid expanded. Public option (SB 420) passed 2021." },
  { code: "NH", name: "New Hampshire", exchange: "state_partnership", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "NH Health Protection Program (Medicaid waiver). State-partnership exchange." },
  { code: "NJ", name: "New Jersey", exchange: "state", medicaid_expansion: true, min_wage: 15.49, state_mandate: true, esi_mandate: false, shop_available: true, notes: "Get Covered NJ (state exchange). Individual mandate since 2019. NJ FamilyCare expanded." },
  { code: "NM", name: "New Mexico", exchange: "state", medicaid_expansion: true, min_wage: 12.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "beWellnm (state exchange). Medicaid (Centennial Care) expanded. Reinsurance program active." },
  { code: "NY", name: "New York", exchange: "state", medicaid_expansion: true, min_wage: 16.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "NY State of Health (state exchange). Medicaid expanded. Essential Plan (BHP) for 138–200% FPL." },
  { code: "NC", name: "North Carolina", exchange: "federal", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid expanded December 2023." },
  { code: "ND", name: "North Dakota", exchange: "federal", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid (Sanford/Essentia contract) expanded 2014." },
  { code: "OH", name: "Ohio", exchange: "federal", medicaid_expansion: true, min_wage: 10.45, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid (Ohio Medicaid) expanded 2014." },
  { code: "OK", name: "Oklahoma", exchange: "federal", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. SoonerCare (Medicaid) expanded 2021 via ballot measure." },
  { code: "OR", name: "Oregon", exchange: "state", medicaid_expansion: true, min_wage: 14.70, state_mandate: true, esi_mandate: false, shop_available: true, notes: "OregonHealthCare.gov (state exchange). Individual mandate since 2020. Oregon Health Plan expanded." },
  { code: "PA", name: "Pennsylvania", exchange: "state", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Pennie (state exchange). Medicaid (Healthy PA) expanded. Reinsurance waiver active." },
  { code: "RI", name: "Rhode Island", exchange: "state", medicaid_expansion: true, min_wage: 14.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "HealthSource RI (state exchange). Medicaid (RIte Care) expanded." },
  { code: "SC", name: "South Carolina", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid not expanded." },
  { code: "SD", name: "South Dakota", exchange: "federal", medicaid_expansion: true, min_wage: 11.20, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid expanded 2023 via ballot initiative." },
  { code: "TN", name: "Tennessee", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid (TennCare) not expanded. Block grant proposal approved." },
  { code: "TX", name: "Texas", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid not expanded — largest uninsured population. Multiple 1115 waiver programs." },
  { code: "UT", name: "Utah", exchange: "state", medicaid_expansion: true, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Avenue H (state SHOP) + Healthcare.gov individual. Medicaid expanded 2020. Full expansion after ballot initiative." },
  { code: "VT", name: "Vermont", exchange: "state", medicaid_expansion: true, min_wage: 13.67, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Vermont Health Connect. Dr. Dynasaur / Green Mountain Care (Medicaid) expanded. All-payer ACO model." },
  { code: "VA", name: "Virginia", exchange: "state", medicaid_expansion: true, min_wage: 12.00, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Virginia's Insurance Marketplace (state exchange). Medicaid expanded 2019." },
  { code: "WA", name: "Washington", exchange: "state", medicaid_expansion: true, min_wage: 16.28, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Washington Healthplanfinder (state exchange). Apple Health (Medicaid) expanded. Cascade Care public option available." },
  { code: "WV", name: "West Virginia", exchange: "state_partnership", medicaid_expansion: true, min_wage: 8.75, state_mandate: false, esi_mandate: false, shop_available: true, notes: "State-based partnership exchange. Medicaid expanded 2014 (one of first)." },
  { code: "WI", name: "Wisconsin", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. BadgerCare Plus covers adults to 100% FPL but no full expansion. Unique partial-coverage model." },
  { code: "WY", name: "Wyoming", exchange: "federal", medicaid_expansion: false, min_wage: 7.25, state_mandate: false, esi_mandate: false, shop_available: true, notes: "Uses Healthcare.gov. Medicaid not expanded." },
];

const ACA_FEDERAL_RULES = [
  {
    category: "Employer Mandate (ESRP)",
    rules: [
      { title: "ALE Threshold", desc: "Applicable Large Employers (ALEs) = 50+ full-time equivalent employees averaged over prior calendar year.", citation: "IRC §4980H" },
      { title: "Full-Time Definition", desc: "30+ hours/week or 130+ hours/month. Part-time FTEs aggregated.", citation: "26 CFR 54.4980H" },
      { title: "Offer Requirement (4980H(a))", desc: "ALEs must offer minimum essential coverage to 95%+ of full-time employees (and dependents). Penalty: $2,970/yr × (all FT employees − 30) if any employee gets marketplace subsidy.", citation: "IRC §4980H(a)" },
      { title: "Minimum Value & Affordability (4980H(b))", desc: "Coverage must be at least 60% actuarial value AND affordable. 2026 affordability threshold: 9.02% of W-2 wages. Per-employee penalty: $4,460/yr.", citation: "IRC §4980H(b)" },
      { title: "Measurement Periods", desc: "Standard: 3–12 month measurement, 90-day admin, 6–12 month stability. Monthly for variable-hour employees.", citation: "IRS Notice 2012-58" },
      { title: "1094-C / 1095-C Reporting", desc: "ALEs must file 1094-C (transmittal) and furnish 1095-C to each full-time employee by March 1 (paper) or March 31 (electronic). Penalties: $310/return up to $3.783M.", citation: "IRC §6055, §6056" },
    ]
  },
  {
    category: "Individual Coverage Rules",
    rules: [
      { title: "Open Enrollment Period", desc: "2026: Nov 1 – Jan 15 in most states. State exchanges may extend. Late enrollments effective Feb 1.", citation: "45 CFR 155.410" },
      { title: "Special Enrollment Periods (SEPs)", desc: "Qualifying events: loss of MEC, marriage, birth, adoption, move, income change. 60-day window for most SEPs.", citation: "45 CFR 155.420" },
      { title: "Premium Tax Credits (PTCs)", desc: "Household income 100–400% FPL. Enhanced APTCs through 2025 (ARP Act): no cliff at 400%. Benchmark = second-lowest-cost Silver plan.", citation: "IRC §36B; ARP §9661" },
      { title: "Cost-Sharing Reductions (CSRs)", desc: "Income 100–250% FPL eligible for Silver plan CSRs. Federal government pays insurers directly (funding subject to ongoing litigation).", citation: "ACA §1402" },
      { title: "Minimum Essential Coverage (MEC)", desc: "Includes employer-sponsored, Medicare, Medicaid, CHIP, individual marketplace, TRICARE, VA.", citation: "IRC §5000A(f)" },
    ]
  },
  {
    category: "Plan Design Requirements",
    rules: [
      { title: "Essential Health Benefits (EHBs)", desc: "10 EHB categories required for non-grandfathered individual/small group plans: ambulatory, emergency, hospitalization, maternity, mental health/SUD, rx drugs, rehab, lab, preventive, pediatric.", citation: "ACA §1302; 45 CFR 156.110" },
      { title: "Preventive Care (§2713)", desc: "First-dollar preventive services: USPSTF A/B grade, ACIP vaccines, HRSA guidelines. No cost-sharing allowed.", citation: "ACA §2713" },
      { title: "Annual Out-of-Pocket Maximum", desc: "2026 limits: $9,450 individual / $18,900 family for non-grandfathered plans.", citation: "45 CFR 156.130" },
      { title: "Annual Deductible (Small Group)", desc: "2026 SHOP deductible limit: $5,200 individual / $10,400 family.", citation: "45 CFR 156.130(b)" },
      { title: "Metal Tiers", desc: "Bronze (60% AV), Silver (70% AV), Gold (80% AV), Platinum (90% AV). Catastrophic plans for <30 or hardship exemption.", citation: "ACA §1302(d)" },
      { title: "Dependent Coverage to Age 26", desc: "All plans must extend dependent coverage to age 26 regardless of student status, residency, or marital status.", citation: "ACA §2714; IRC §105(b)" },
      { title: "Pre-Existing Conditions", desc: "No pre-existing condition exclusions for any non-grandfathered plan. Cannot deny, limit, or charge more.", citation: "ACA §2704, §2705" },
      { title: "Lifetime / Annual Limits", desc: "No lifetime dollar limits on EHBs. Annual limits also prohibited for non-grandfathered plans.", citation: "ACA §2711" },
      { title: "Guaranteed Issue & Renewability", desc: "Insurers must accept all applicants during open/special enrollment. Cannot rescind coverage except for fraud.", citation: "ACA §2702, §2703" },
      { title: "Rating Rules (3:1 ratio)", desc: "Non-grandfathered plans: age rating max 3:1. Tobacco surcharge max 1.5:1. No gender rating.", citation: "ACA §2701" },
    ]
  },
  {
    category: "SHOP (Small Business)",
    rules: [
      { title: "SHOP Eligibility", desc: "Employers with 1–50 employees (states may expand to 100). Self-employed with no other FT employees may not qualify.", citation: "ACA §1304(b); 45 CFR 155.710" },
      { title: "Small Business Health Care Tax Credit", desc: "Up to 50% of premiums (35% for nonprofits) for employers with <25 FTEs, average wages <$58,000/yr, paying ≥50% of premiums. Must purchase through SHOP.", citation: "IRC §45R" },
      { title: "Participation Rate", desc: "Generally 70% of eligible employees must enroll (or waive with other coverage). State rules vary.", citation: "45 CFR 156.285" },
    ]
  },
  {
    category: "COBRA & Continuation",
    rules: [
      { title: "COBRA Applicability", desc: "Employers with 20+ employees on >50% of business days in prior year. Covers employees, spouses, dependents.", citation: "ERISA §601–608; IRC §4980B" },
      { title: "COBRA Duration", desc: "18 months (termination/hours reduction), 29 months (disability), 36 months (divorce, death, Medicare, dependent status loss).", citation: "ERISA §602" },
      { title: "COBRA Cost", desc: "Qualified beneficiary pays up to 102% of applicable premium (105% during disability extension). No employer subsidy required (though allowed).", citation: "ERISA §604" },
      { title: "State Mini-COBRA", desc: "Many states have mini-COBRA for employers with 2–19 employees. Coverage duration and cost vary by state.", citation: "State law (varies)" },
    ]
  },
  {
    category: "HIPAA Portability",
    rules: [
      { title: "Creditable Coverage", desc: "Prior creditable coverage reduces/eliminates pre-existing condition waiting periods (grandfathered plans). Certificate of creditable coverage required upon request.", citation: "HIPAA §701" },
      { title: "Special Enrollment Rights", desc: "Loss of other coverage, new dependent (birth/adoption/marriage) triggers 30-day SEP for group plans.", citation: "HIPAA §701(f)" },
    ]
  },
  {
    category: "W-2 / FSA / HSA Rules",
    rules: [
      { title: "W-2 Employer Cost Reporting (§6051(a)(14))", desc: "ALEs (250+ W-2s) must report aggregate cost of employer-sponsored coverage in Box 12, Code DD. Informational only.", citation: "IRC §6051(a)(14)" },
      { title: "FSA Contribution Limit", desc: "2026 Health FSA: $3,300/year. Use-it-or-lose-it with $660 rollover option or 2.5-month grace period.", citation: "IRC §125; IRS Rev. Proc." },
      { title: "HSA Contribution Limit", desc: "2026: $4,300 individual / $8,550 family. Requires HDHP: min deductible $1,650 individual / $3,300 family; max OOP $8,300 / $16,600.", citation: "IRC §223; IRS Rev. Proc. 2025-19" },
    ]
  },
];

const EXCHANGE_TYPE_LABELS = {
  state: "State Exchange",
  federal: "Federal (Healthcare.gov)",
  state_partnership: "State Partnership",
};

const EXCHANGE_COLORS = {
  state: "bg-emerald-100 text-emerald-700 border-emerald-200",
  federal: "bg-blue-100 text-blue-700 border-blue-200",
  state_partnership: "bg-purple-100 text-purple-700 border-purple-200",
};

export default function ACALibrary() {
  const [stateSearch, setStateSearch] = useState("");
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [mandateFilter, setMandateFilter] = useState("all");
  const [medicaidFilter, setMedicaidFilter] = useState("all");
  const [expandedState, setExpandedState] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [ruleSearch, setRuleSearch] = useState("");

  const filteredStates = useMemo(() => {
    return ACA_STATES.filter(s => {
      const q = stateSearch.toLowerCase();
      const searchMatch = !stateSearch || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.notes.toLowerCase().includes(q);
      const exchMatch = exchangeFilter === "all" || s.exchange === exchangeFilter;
      const mandateMatch = mandateFilter === "all" || (mandateFilter === "yes" && s.state_mandate) || (mandateFilter === "no" && !s.state_mandate);
      const medMatch = medicaidFilter === "all" || (medicaidFilter === "yes" && s.medicaid_expansion) || (medicaidFilter === "no" && !s.medicaid_expansion);
      return searchMatch && exchMatch && mandateMatch && medMatch;
    });
  }, [stateSearch, exchangeFilter, mandateFilter, medicaidFilter]);

  const filteredRules = useMemo(() => {
    if (!ruleSearch) return ACA_FEDERAL_RULES;
    const q = ruleSearch.toLowerCase();
    return ACA_FEDERAL_RULES.map(cat => ({
      ...cat,
      rules: cat.rules.filter(r => r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.citation.toLowerCase().includes(q)),
    })).filter(cat => cat.rules.length > 0);
  }, [ruleSearch]);

  const stateCount = { state: 0, federal: 0, state_partnership: 0 };
  const expandedCount = ACA_STATES.filter(s => s.medicaid_expansion).length;
  const mandateCount = ACA_STATES.filter(s => s.state_mandate).length;
  ACA_STATES.forEach(s => stateCount[s.exchange]++);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ACA Rules Library"
        description="Comprehensive Affordable Care Act reference — all 50 states + federal rules, employer mandate, plan design, and compliance guides"
        actions={
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-xs">
            Updated March 2026
          </Badge>
        }
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">50</p>
          <p className="text-xs text-muted-foreground">States Covered</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{expandedCount}</p>
          <p className="text-xs text-muted-foreground">Medicaid Expanded</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-indigo-600">{stateCount.state}</p>
          <p className="text-xs text-muted-foreground">State Exchanges</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-amber-600">{mandateCount}</p>
          <p className="text-xs text-muted-foreground">State Individual Mandates</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="states">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="states" className="gap-1 text-xs"><MapPin className="w-3 h-3" /> All 50 States</TabsTrigger>
          <TabsTrigger value="federal" className="gap-1 text-xs"><Scale className="w-3 h-3" /> Federal Rules</TabsTrigger>
          <TabsTrigger value="employer" className="gap-1 text-xs"><Users className="w-3 h-3" /> Employer Mandate</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1 text-xs"><Calendar className="w-3 h-3" /> Key Dates 2026</TabsTrigger>
        </TabsList>

        {/* ── ALL 50 STATES ──────────────────────────────────────────────── */}
        <TabsContent value="states" className="mt-5 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search states, rules, notes…" value={stateSearch} onChange={e => setStateSearch(e.target.value)} className="pl-9 h-8 text-xs" />
            </div>
            <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
              <SelectTrigger className="h-8 text-xs w-44"><SelectValue placeholder="Exchange Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exchange Types</SelectItem>
                <SelectItem value="state">State Exchange</SelectItem>
                <SelectItem value="federal">Federal (Healthcare.gov)</SelectItem>
                <SelectItem value="state_partnership">State Partnership</SelectItem>
              </SelectContent>
            </Select>
            <Select value={medicaidFilter} onValueChange={setMedicaidFilter}>
              <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Medicaid" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medicaid Status</SelectItem>
                <SelectItem value="yes">Expanded</SelectItem>
                <SelectItem value="no">Not Expanded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={mandateFilter} onValueChange={setMandateFilter}>
              <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="State Mandate" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mandate Status</SelectItem>
                <SelectItem value="yes">Has State Mandate</SelectItem>
                <SelectItem value="no">No State Mandate</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{filteredStates.length} states</span>
          </div>

          <div className="space-y-1.5">
            {filteredStates.map(s => {
              const isExpanded = expandedState === s.code;
              return (
                <Card key={s.code} className={isExpanded ? "border-primary/40" : ""}>
                  <button className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedState(isExpanded ? null : s.code)}>
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold font-mono">{s.code}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{s.name}</span>
                        <Badge className={`text-[8px] border py-0 ${EXCHANGE_COLORS[s.exchange]}`}>{EXCHANGE_TYPE_LABELS[s.exchange]}</Badge>
                        {s.medicaid_expansion
                          ? <Badge className="text-[8px] bg-emerald-100 text-emerald-700 border-emerald-200 border py-0">Medicaid ✓</Badge>
                          : <Badge className="text-[8px] bg-red-100 text-red-700 border-red-200 border py-0">Medicaid ✗</Badge>}
                        {s.state_mandate && <Badge className="text-[8px] bg-indigo-100 text-indigo-700 border-indigo-200 border py-0">State Mandate</Badge>}
                        {s.esi_mandate && <Badge className="text-[8px] bg-amber-100 text-amber-700 border-amber-200 border py-0">ESI Mandate</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                      <span className="hidden sm:block">Min wage: <strong className="text-foreground">${s.min_wage}</strong></span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <CardContent className="pt-0 pb-4 px-4 border-t border-border/50">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 mb-3">
                        <div className="p-2.5 bg-muted/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exchange Type</p>
                          <p className="text-xs font-semibold mt-0.5">{EXCHANGE_TYPE_LABELS[s.exchange]}</p>
                        </div>
                        <div className="p-2.5 bg-muted/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Medicaid Expansion</p>
                          <p className={`text-xs font-semibold mt-0.5 ${s.medicaid_expansion ? "text-emerald-600" : "text-red-600"}`}>
                            {s.medicaid_expansion ? "✓ Expanded" : "✗ Not Expanded"}
                          </p>
                        </div>
                        <div className="p-2.5 bg-muted/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">State Min Wage</p>
                          <p className="text-xs font-semibold mt-0.5">${s.min_wage}/hr</p>
                        </div>
                        <div className="p-2.5 bg-muted/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Individual Mandate</p>
                          <p className={`text-xs font-semibold mt-0.5 ${s.state_mandate ? "text-indigo-600" : "text-muted-foreground"}`}>
                            {s.state_mandate ? "✓ Yes" : "✗ No"}
                          </p>
                        </div>
                        <div className="p-2.5 bg-muted/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">ESI Mandate</p>
                          <p className={`text-xs font-semibold mt-0.5 ${s.esi_mandate ? "text-amber-600" : "text-muted-foreground"}`}>
                            {s.esi_mandate ? "✓ Yes" : "✗ No"}
                          </p>
                        </div>
                        <div className="p-2.5 bg-muted/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">SHOP Available</p>
                          <p className="text-xs font-semibold mt-0.5 text-emerald-600">✓ Yes</p>
                        </div>
                      </div>
                      <div className="bg-blue-50/50 border border-blue-100 rounded-lg px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Info className="w-3 h-3" /> State-Specific Notes
                        </p>
                        <p className="text-xs text-blue-900">{s.notes}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── FEDERAL RULES ──────────────────────────────────────────────── */}
        <TabsContent value="federal" className="mt-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search rules, citations, requirements…" value={ruleSearch} onChange={e => setRuleSearch(e.target.value)} className="pl-9 h-8 text-xs" />
          </div>

          {filteredRules.map(cat => (
            <Card key={cat.category}>
              <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}>
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">{cat.category}</span>
                  <Badge variant="outline" className="text-[9px] py-0">{cat.rules.length} rules</Badge>
                </div>
                {expandedCategory === cat.category ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {(expandedCategory === cat.category || ruleSearch) && (
                <CardContent className="pt-0 pb-3 space-y-2 border-t border-border/50">
                  {cat.rules.map(rule => (
                    <div key={rule.title} className="p-3 bg-muted/20 rounded-lg border border-border/40">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold text-foreground">{rule.title}</span>
                        <code className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 flex-shrink-0">{rule.citation}</code>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* ── EMPLOYER MANDATE QUICK REF ─────────────────────────────────── */}
        <TabsContent value="employer" className="mt-5 space-y-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">Employer Shared Responsibility Payment (ESRP) — 2026</p>
                  <p className="text-xs text-amber-800 mt-0.5">Applies to Applicable Large Employers (ALEs) with 50+ full-time equivalent employees.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "§4980H(a) — Failure to Offer", penalty: "$2,970 × (all FT − 30)", trigger: "Any FT employee gets marketplace APTC", color: "border-red-200 bg-red-50/30" },
              { title: "§4980H(b) — Unaffordable / No MV", penalty: "$4,460 per FT employee w/ APTC", trigger: "Coverage offered but not affordable or lacks minimum value", color: "border-amber-200 bg-amber-50/30" },
            ].map(p => (
              <Card key={p.title} className={p.color}>
                <CardContent className="p-4">
                  <p className="text-sm font-bold mb-1">{p.title}</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Annual Penalty (2026)</p>
                      <p className="text-lg font-bold text-foreground">{p.penalty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Triggered When</p>
                      <p className="text-xs text-muted-foreground">{p.trigger}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Affordability Safe Harbors (2026)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "W-2 Wages Safe Harbor", desc: "Employee contribution ≤ 9.02% of Box 1 W-2 wages from that employer.", recommended: true },
                { name: "Rate of Pay Safe Harbor", desc: "Employee contribution ≤ 9.02% × (hourly rate × 130 hrs) or monthly salary.", recommended: false },
                { name: "Federal Poverty Line Safe Harbor", desc: "Employee contribution ≤ 9.02% of FPL ($14,580 × 9.02% = $1,315/yr in 2026).", recommended: false },
              ].map(sh => (
                <div key={sh.name} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold">{sh.name}</p>
                      {sh.recommended && <Badge className="text-[8px] bg-emerald-100 text-emerald-700 border-emerald-200 border py-0">Most Common</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{sh.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> 1094-C / 1095-C Filing Deadlines</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { event: "Furnish 1095-C to employees", date: "March 3, 2026", type: "Employee" },
                  { event: "Paper filing with IRS (1094-C + 1095-C)", date: "March 2, 2026", type: "IRS Paper" },
                  { event: "Electronic filing with IRS (FIRE system)", date: "March 31, 2026", type: "IRS Electronic" },
                  { event: "Penalties for late/incorrect filing begin", date: "After deadlines", type: "Compliance" },
                ].map(d => (
                  <div key={d.event} className="flex items-center justify-between gap-3 p-2.5 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] py-0 flex-shrink-0">{d.type}</Badge>
                      <span className="text-xs">{d.event}</span>
                    </div>
                    <span className="text-xs font-semibold text-primary flex-shrink-0">{d.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── KEY DATES 2026 ─────────────────────────────────────────────── */}
        <TabsContent value="calendar" className="mt-5">
          <div className="space-y-2">
            {[
              { date: "Jan 1, 2026", event: "Plan year begins for calendar-year groups", category: "Plan Year", color: "bg-primary/10 border-primary/20" },
              { date: "Jan 15, 2026", event: "Marketplace OEP closes (most states). Feb 1 coverage effective.", category: "Individual", color: "bg-blue-50 border-blue-200" },
              { date: "Jan 31, 2026", event: "W-2 forms due to employees (includes Box 12 Code DD)", category: "Reporting", color: "bg-amber-50 border-amber-200" },
              { date: "Feb 1, 2026", event: "Coverage effective for Jan 15 marketplace enrollees", category: "Individual", color: "bg-blue-50 border-blue-200" },
              { date: "Mar 1, 2026", event: "CHIP/Medicaid renewal deadlines (varies by state)", category: "Medicaid", color: "bg-emerald-50 border-emerald-200" },
              { date: "Mar 3, 2026", event: "1095-C furnishing deadline to employees", category: "ACA Reporting", color: "bg-red-50 border-red-200" },
              { date: "Mar 2, 2026", event: "IRS paper filing deadline (1094-C + 1095-C)", category: "ACA Reporting", color: "bg-red-50 border-red-200" },
              { date: "Mar 31, 2026", event: "IRS electronic filing deadline (FIRE system)", category: "ACA Reporting", color: "bg-red-50 border-red-200" },
              { date: "Apr 1, 2026", event: "Q1 ESRP lookback period begins for new hires (variable-hour)", category: "Employer", color: "bg-amber-50 border-amber-200" },
              { date: "Jul 1, 2026", event: "Common plan year renewal effective date for July groups", category: "Plan Year", color: "bg-primary/10 border-primary/20" },
              { date: "Oct 15, 2026", event: "Medicare open enrollment begins (Part D, Advantage)", category: "Medicare", color: "bg-purple-50 border-purple-200" },
              { date: "Nov 1, 2026", event: "ACA Open Enrollment Period begins (2027 coverage)", category: "Individual", color: "bg-blue-50 border-blue-200" },
              { date: "Dec 15, 2026", event: "Marketplace enrollment deadline for Jan 1, 2027 coverage (most states)", category: "Individual", color: "bg-blue-50 border-blue-200" },
              { date: "Dec 31, 2026", event: "FSA use-it-or-lose-it deadline (without grace period/rollover)", category: "Benefits", color: "bg-slate-100 border-slate-200" },
            ].map(item => (
              <div key={item.date} className={`flex items-center gap-3 p-3 rounded-lg border ${item.color}`}>
                <div className="w-24 flex-shrink-0">
                  <p className="text-xs font-bold">{item.date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{item.event}</p>
                </div>
                <Badge variant="outline" className="text-[9px] py-0 flex-shrink-0">{item.category}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}