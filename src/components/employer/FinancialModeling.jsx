import React, { useState, useMemo } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function FinancialModeling({ proposal, employeeCount = 100 }) {
  const [eeContribution, setEeContribution] = useState(30);
  const [scenario, setScenario] = useState("current");

  const monthlyPremium = proposal?.total_monthly_premium || 0;
  const employerBaseCost = (monthlyPremium * (100 - eeContribution)) / 100;
  const employeeBaseCost = (monthlyPremium * eeContribution) / 100;

  const financials = useMemo(() => {
    const monthly = {
      employer: employerBaseCost,
      employee: employeeBaseCost,
      total: monthlyPremium,
    };
    const annual = {
      employer: monthly.employer * 12,
      employee: monthly.employee * 12,
      total: monthly.total * 12,
    };
    return { monthly, annual };
  }, [employerBaseCost, employeeBaseCost, monthlyPremium]);

  if (!proposal) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Financial Modeling</p>
              </div>
              <span className="text-xs text-primary font-semibold">Open calculator</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Model different contribution strategies and see budget impact.
            </p>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Financial Modeling</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contribution slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Employer Contribution %</label>
              <span className="text-lg font-bold text-primary">{100 - eeContribution}%</span>
            </div>
            <Slider
              value={[eeContribution]}
              onValueChange={val => setEeContribution(val[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Employee: {eeContribution}%</span>
              <span>Employer: {100 - eeContribution}%</span>
            </div>
          </div>

          {/* Monthly breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Monthly Costs (per {employeeCount} employees)</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-muted-foreground">Employer</p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  ${(financials.monthly.employer * employeeCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-muted-foreground">Employee Avg</p>
                <p className="text-lg font-bold text-amber-900 mt-1">
                  ${financials.monthly.employee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-muted-foreground">Total Premium</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  ${(financials.monthly.total * employeeCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Annual projection */}
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-semibold">Annual Projection</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Employer Annual Cost</p>
                <p className="font-bold text-foreground mt-0.5">
                  ${(financials.annual.employer * employeeCount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Employee Annual Cost (per emp)</p>
                <p className="font-bold text-foreground mt-0.5">
                  ${financials.annual.employee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          {/* Benchmark comparison placeholder */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Benchmark Data
            </p>
            <p className="text-xs text-blue-800 mt-2">
              Your employer cost ({(100 - eeContribution)}% contribution) is <strong>8% below</strong> industry average for your industry/region.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1">
            Save Scenario
          </Button>
          <Button className="flex-1">
            Export Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}