import React, { useState } from "react";
import { Search, ExternalLink, FileText, Users, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const PLAN_DATA = {
  medical: {
    name: "Blue Cross Medical Plan",
    type: "PPO",
    network: "BlueCross Network",
    copays: {
      pcp: "$25",
      specialist: "$50",
      er: "$300",
    },
    examples: [
      { visit: "Routine check-up", cost: "$25 copay" },
      { visit: "Specialist visit", cost: "$50 copay" },
      { visit: "Generic prescription", cost: "$10 copay" },
    ],
    formulary: "View full drug list →",
  },
};

export default function PlanExplainerModal({ plans = [] }) {
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [networkSearch, setNetworkSearch] = useState("");

  if (!plans || plans.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          View Plan Details & Network
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan Explainer & Network Lookup</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="network">Network Search</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4 mt-4">
            <div className="space-y-2">
              {plans.map((plan, idx) => (
                <Card
                  key={idx}
                  className={`cursor-pointer transition-all ${selectedPlan === idx ? "border-primary bg-primary/5" : "hover:border-primary/50"}`}
                  onClick={() => setSelectedPlan(idx)}
                >
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm">{plan.plan_name || `Plan ${idx + 1}`}</p>
                    <p className="text-xs text-muted-foreground">{plan.network_type || "PPO"} • {plan.carrier}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Selected plan details */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Deductible (Individual)</p>
                  <p className="text-lg font-bold">${plans[selectedPlan]?.deductible_individual || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Out-of-Pocket Max</p>
                  <p className="text-lg font-bold">${plans[selectedPlan]?.oop_max_individual || "—"}</p>
                </div>
              </div>

              {/* Copays */}
              <div className="p-3 bg-white rounded-lg border">
                <p className="text-sm font-semibold mb-3">Common Copays</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Primary Care</span>
                    <span className="font-medium">${plans[selectedPlan]?.copay_pcp || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specialist</span>
                    <span className="font-medium">${plans[selectedPlan]?.copay_specialist || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Emergency Room</span>
                    <span className="font-medium">${plans[selectedPlan]?.copay_er || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Cost examples */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-3">Cost Examples</p>
                <div className="space-y-2 text-xs text-blue-800">
                  <p>💊 <strong>Routine visit:</strong> $25 copay</p>
                  <p>👨‍⚕️ <strong>Specialist visit:</strong> $50 copay + coinsurance</p>
                  <p>🏥 <strong>ER visit:</strong> $300 copay (waived if admitted)</p>
                </div>
              </div>

              {/* Formulary link */}
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <a href="#" target="_blank">
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  View Full Drug Formulary
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              </Button>
            </div>
          </TabsContent>

          {/* Network Search Tab */}
          <TabsContent value="network" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for doctors, hospitals..."
                className="pl-9"
                value={networkSearch}
                onChange={e => setNetworkSearch(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Dr. Sarah Johnson, MD</p>
                      <p className="text-xs text-muted-foreground mt-1">Internal Medicine • In-Network</p>
                      <p className="text-xs text-muted-foreground">123 Medical Plaza, City, ST 12345</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-green-600 font-medium">✓ In Network</p>
                      <p className="text-muted-foreground mt-1">(555) 123-4567</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">City Hospital</p>
                      <p className="text-xs text-muted-foreground mt-1">General Acute Care • In-Network</p>
                      <p className="text-xs text-muted-foreground">456 Hospital Way, City, ST 12345</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="text-green-600 font-medium">✓ In Network</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Can't find your provider? <Button variant="link" className="text-xs p-0 h-auto">View full network directory →</Button>
            </p>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-3 mt-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">What's the difference between copay and coinsurance?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A copay is a fixed dollar amount you pay for a service. Coinsurance is your share of the cost after your deductible is met, expressed as a percentage.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">Do I need to meet my deductible for preventive care?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No, preventive care like annual check-ups, vaccinations, and screenings are covered at 100% with no deductible required.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">What happens if I see an out-of-network doctor?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Out-of-network care is covered at a lower percentage, and you may owe more out-of-pocket. Emergency care is covered regardless of network status.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}