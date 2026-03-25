import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search } from "lucide-react";

const GLOSSARY = [
  { term: "Deductible", category: "Cost", definition: "The amount you pay for covered health care services before your insurance plan starts to pay." },
  { term: "OOP Max (Out-of-Pocket Maximum)", category: "Cost", definition: "The most you have to pay for covered services in a plan year. After you spend this amount, your plan covers 100% of costs." },
  { term: "Copay", category: "Cost", definition: "A fixed amount you pay for a covered health care service, usually at the time of service." },
  { term: "Coinsurance", category: "Cost", definition: "Your share of the costs of a covered health care service, calculated as a percentage after you've paid your deductible." },
  { term: "Premium", category: "Cost", definition: "The amount you pay to your insurance company each month for your health plan." },
  { term: "HMO (Health Maintenance Organization)", category: "Plan Type", definition: "A plan that limits coverage to doctors who work for or contract with the HMO. Out-of-network care is generally not covered except in emergencies." },
  { term: "PPO (Preferred Provider Organization)", category: "Plan Type", definition: "A plan with a network of preferred providers. You pay less when using in-network providers but can go out-of-network at higher cost." },
  { term: "EPO (Exclusive Provider Organization)", category: "Plan Type", definition: "A plan that requires using only the plan's network of doctors and hospitals, except in emergencies." },
  { term: "HDHP (High Deductible Health Plan)", category: "Plan Type", definition: "A plan with a higher deductible but lower premiums, often paired with an HSA." },
  { term: "HSA (Health Savings Account)", category: "Account", definition: "A tax-advantaged account for eligible HDHP enrollees to save money for qualified medical expenses." },
  { term: "FSA (Flexible Spending Account)", category: "Account", definition: "A tax-advantaged account for out-of-pocket healthcare costs. Funds usually must be used within the plan year." },
  { term: "In-Network", category: "Network", definition: "Doctors, hospitals, and other health care facilities that have agreed to provide services to your plan members at negotiated rates." },
  { term: "Out-of-Network", category: "Network", definition: "Providers who haven't contracted with your health plan. Using them typically costs more." },
  { term: "PCP (Primary Care Provider)", category: "Provider", definition: "A doctor who manages your overall health care and refers you to specialists when needed." },
  { term: "Referral", category: "Provider", definition: "A recommendation from your PCP to see a specialist, often required by HMO plans." },
  { term: "Formulary", category: "RX", definition: "A list of prescription drugs covered by your health plan, organized by tier." },
  { term: "Generic Drug", category: "RX", definition: "A medication that has the same active ingredients as a brand-name drug but is sold at a lower price." },
  { term: "Prior Authorization", category: "RX", definition: "Approval required from your insurance company before certain medications or procedures are covered." },
  { term: "ACA (Affordable Care Act)", category: "Regulatory", definition: "Federal law that established key health insurance requirements including essential health benefits and guaranteed issue." },
  { term: "Metal Tier", category: "Regulatory", definition: "ACA classification (Bronze/Silver/Gold/Platinum) based on how costs are split between plan and member." },
  { term: "Essential Health Benefits", category: "Regulatory", definition: "10 categories of services that ACA-compliant plans must cover, including preventive care and mental health." },
  { term: "Open Enrollment", category: "Enrollment", definition: "The annual period when employees can sign up for or change their health insurance plan." },
  { term: "Qualifying Life Event", category: "Enrollment", definition: "A change in your situation (marriage, birth, job loss) that allows you to enroll or change plans outside open enrollment." },
  { term: "COBRA", category: "Enrollment", definition: "Allows you to continue your employer's health insurance coverage after leaving your job, usually at full premium cost." },
  { term: "Preventive Care", category: "Benefits", definition: "Routine health care that includes screenings, check-ups, and patient counseling. ACA plans must cover this at 100%." },
  { term: "EOB (Explanation of Benefits)", category: "Claims", definition: "A statement from your insurer explaining what was covered for a medical service, what they paid, and what you owe." },
];

const CATEGORIES = ["All", ...new Set(GLOSSARY.map(g => g.category))];

export default function BenefitsGlossaryPanel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => GLOSSARY.filter(g =>
    (category === "All" || g.category === category) &&
    (g.term.toLowerCase().includes(search.toLowerCase()) || g.definition.toLowerCase().includes(search.toLowerCase()))
  ), [search, category]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search terms..." className="pl-8 h-8 text-sm" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${category === c ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map(g => (
          <div key={g.term} className="p-3 rounded-lg border hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-2 mb-1">
              <span className="font-semibold text-sm">{g.term}</span>
              <Badge variant="outline" className="text-xs h-4 px-1 ml-auto flex-shrink-0">{g.category}</Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{g.definition}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No terms match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}