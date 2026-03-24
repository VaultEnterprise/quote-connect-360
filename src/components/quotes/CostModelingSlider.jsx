import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function CostModelingSlider({ totalPremium = 0, onUpdate }) {
  const [employeeHeadcount, setEmployeeHeadcount] = useState(50);
  const [rateIncrease, setRateIncrease] = useState(0);
  const [employerContribution, setEmployerContribution] = useState(80);

  useEffect(() => {
    const baseMonthly = totalPremium || 1000;
    const adjustedPremium = baseMonthly * (1 + rateIncrease / 100) * (employeeHeadcount / 50);
    const employerCost = adjustedPremium * (employerContribution / 100);
    const employeeCost = adjustedPremium - employerCost;

    onUpdate?.({
      employeeHeadcount,
      rateIncrease,
      employerContribution,
      projectedMonthlyPremium: adjustedPremium,
      employerMonthlyCost: employerCost,
      employeeMonthlyCost: employeeCost,
    });
  }, [employeeHeadcount, rateIncrease, employerContribution, totalPremium, onUpdate]);

  const projectedMonthly = (totalPremium || 1000) * (1 + rateIncrease / 100) * (employeeHeadcount / 50);
  const employerCost = projectedMonthly * (employerContribution / 100);
  const employeeCost = projectedMonthly - employerCost;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold">Employee Headcount</label>
          <Badge variant="secondary">{employeeHeadcount}</Badge>
        </div>
        <Slider
          value={[employeeHeadcount]}
          onValueChange={(value) => setEmployeeHeadcount(value[0])}
          min={10}
          max={500}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>10</span>
          <span>500</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold">Annual Rate Increase</label>
          <Badge variant="secondary">{rateIncrease.toFixed(1)}%</Badge>
        </div>
        <Slider
          value={[rateIncrease]}
          onValueChange={(value) => setRateIncrease(value[0])}
          min={-5}
          max={15}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>-5%</span>
          <span>15%</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold">Employer Contribution</label>
          <Badge variant="secondary">{employerContribution.toFixed(0)}%</Badge>
        </div>
        <Slider
          value={[employerContribution]}
          onValueChange={(value) => setEmployerContribution(value[0])}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3 p-4 bg-muted rounded-lg">
        <p className="text-xs font-semibold text-muted-foreground uppercase">Projected Monthly Costs</p>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Total Premium</span>
            <strong className="text-lg">${projectedMonthly.toFixed(0)}</strong>
          </div>

          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-muted-foreground">Employer Pays ({employerContribution}%)</span>
            <strong className="text-green-600">${employerCost.toFixed(0)}</strong>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Employees Pay ({100 - employerContribution}%)</span>
            <strong className="text-orange-600">${employeeCost.toFixed(0)}</strong>
          </div>
        </div>

        <div className="pt-2 border-t text-xs text-muted-foreground">
          <p>Annual employer cost: <strong>${(employerCost * 12).toFixed(0)}</strong></p>
        </div>
      </div>
    </Card>
  );
}