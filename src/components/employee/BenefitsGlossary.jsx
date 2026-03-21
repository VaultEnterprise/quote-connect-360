import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const GLOSSARY_TERMS = [
  {
    term: "Deductible",
    definition: "The amount you must pay out of pocket before your insurance begins to share costs.",
    example: "If your deductible is $1,500, you pay the first $1,500 of eligible medical expenses."
  },
  {
    term: "Copay",
    definition: "A fixed amount you pay for a specific service or visit (e.g., doctor visit, prescription).",
    example: "A $25 copay means you pay $25 for each office visit after meeting your deductible."
  },
  {
    term: "Coinsurance",
    definition: "The percentage of costs you pay after meeting your deductible (e.g., 20%).",
    example: "If coinsurance is 20%, you pay 20% and insurance pays 80% of eligible expenses."
  },
  {
    term: "Out-of-Pocket Maximum (OOP Max)",
    definition: "The most you'll pay in a year for covered services. After reaching this, insurance pays 100%.",
    example: "With a $5,000 OOP max, after paying $5,000, the plan covers all remaining eligible costs."
  },
  {
    term: "Network",
    definition: "Providers (doctors, hospitals, pharmacies) that have agreements with your insurance plan.",
    example: "Seeing an 'in-network' doctor costs less; 'out-of-network' costs more or aren't covered."
  },
  {
    term: "Formulary",
    definition: "The list of prescription medications covered by your insurance plan.",
    example: "Your pharmacy will check the formulary to confirm your medication is covered."
  },
  {
    term: "HSA (Health Savings Account)",
    definition: "A tax-advantaged account to save money for medical expenses. Only available with certain plans.",
    example: "You contribute pre-tax money, and it rolls over year to year for future healthcare costs."
  },
  {
    term: "Prior Authorization",
    definition: "Approval your doctor must get from insurance before certain procedures or medications.",
    example: "Your doctor may need pre-approval for a specialist visit or expensive treatment."
  },
];

/**
 * BenefitsGlossary
 * Interactive FAQ modal for benefits terminology
 */
export default function BenefitsGlossary() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <CardTitle>Benefits Glossary</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {GLOSSARY_TERMS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
            className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{item.term}</p>
              </div>
              {expandedIndex === idx ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>

            {expandedIndex === idx && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <p className="text-sm text-muted-foreground">{item.definition}</p>
                <div className="p-2 rounded bg-muted/40">
                  <p className="text-xs text-muted-foreground">
                    <strong>Example:</strong> {item.example}
                  </p>
                </div>
              </div>
            )}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}