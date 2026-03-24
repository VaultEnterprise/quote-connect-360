import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

export default function ContributionSlider({ scenario, onUpdate }) {
  const [eeContribution, setEeContribution] = useState(scenario.employer_contribution_ee || 50);
  const [depContribution, setDepContribution] = useState(scenario.employer_contribution_dep || 50);

  useEffect(() => {
    onUpdate({ eeContribution, depContribution });
  }, [eeContribution, depContribution, onUpdate]);

  const basePremium = scenario.total_monthly_premium || 10000;
  const employerCost = (basePremium * eeContribution) / 100;
  const employeeCost = basePremium - employerCost;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium">Employee Contribution: {eeContribution}%</label>
          <span className="text-sm text-muted-foreground">${employerCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}/month</span>
        </div>
        <Slider
          value={[eeContribution]}
          onValueChange={(v) => setEeContribution(v[0])}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium">Dependent Contribution: {depContribution}%</label>
          <span className="text-sm text-muted-foreground">${(basePremium * (depContribution / 100)).toLocaleString('en-US', { maximumFractionDigits: 2 })}/month</span>
        </div>
        <Slider
          value={[depContribution]}
          onValueChange={(v) => setDepContribution(v[0])}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>

      <div className="bg-muted p-4 rounded space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Total Premium:</span>
          <span className="font-semibold">${basePremium.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Employer Cost:</span>
          <span className="font-semibold">${employerCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-blue-600">
          <span>Employee Cost:</span>
          <span className="font-semibold">${employeeCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </Card>
  );
}