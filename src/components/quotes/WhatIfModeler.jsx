import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function WhatIfModeler({ scenario }) {
  const [adjustments, setAdjustments] = useState({
    employeeCount: null,
    rateIncrease: 0,
    contributionShift: 0,
  });

  const basePremium = scenario.total_monthly_premium || 10000;
  const baseEmployees = scenario.plan_count || 100;

  const modeled = useMemo(() => {
    const empCount = adjustments.employeeCount !== null ? adjustments.employeeCount : baseEmployees;
    const rate = 1 + adjustments.rateIncrease / 100;
    const contribution = 50 + adjustments.contributionShift;

    const newPremium = (basePremium / baseEmployees) * empCount * rate;
    const employerCost = (newPremium * contribution) / 100;
    const employeeCost = newPremium - employerCost;

    return {
      newPremium,
      employerCost,
      employeeCost,
      employerCostPerEE: employerCost / empCount,
      employeeCostPerEE: employeeCost / empCount,
      premiumChange: ((newPremium - basePremium) / basePremium * 100).toFixed(1),
    };
  }, [adjustments, basePremium, baseEmployees]);

  const reset = () => setAdjustments({ employeeCount: null, rateIncrease: 0, contributionShift: 0 });

  return (
    <div className="space-y-4">
      {/* Input Controls */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm">Model Changes</h3>

        <div>
          <label className="text-xs font-medium block mb-2">Employee Count: {adjustments.employeeCount !== null ? adjustments.employeeCount : baseEmployees}</label>
          <Input
            type="number"
            value={adjustments.employeeCount !== null ? adjustments.employeeCount : ''}
            onChange={(e) => setAdjustments({ ...adjustments, employeeCount: parseInt(e.target.value) || null })}
            placeholder={baseEmployees}
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-2">Rate Increase: {adjustments.rateIncrease}%</label>
          <Input
            type="number"
            value={adjustments.rateIncrease}
            onChange={(e) => setAdjustments({ ...adjustments, rateIncrease: parseFloat(e.target.value) || 0 })}
            step="0.5"
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-2">Employer Contribution Shift: {adjustments.contributionShift}%</label>
          <Input
            type="number"
            value={adjustments.contributionShift}
            onChange={(e) => setAdjustments({ ...adjustments, contributionShift: parseFloat(e.target.value) || 0 })}
            step="1"
            min="-50"
            max="50"
            className="text-sm"
          />
        </div>

        <Button variant="outline" size="sm" onClick={reset} className="w-full">
          Reset
        </Button>
      </Card>

      {/* Results */}
      <Card className="p-4 space-y-3">
        <h3 className="font-semibold text-sm">Modeled Impact</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border rounded">
            <p className="text-xs text-muted-foreground">Total Premium</p>
            <p className="font-semibold">${modeled.newPremium.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <Badge variant={modeled.premiumChange > 0 ? 'destructive' : 'secondary'} className="text-xs mt-1">
              {modeled.premiumChange > 0 ? '+' : ''}{modeled.premiumChange}%
            </Badge>
          </div>

          <div className="p-3 border rounded">
            <p className="text-xs text-muted-foreground">Employer Cost</p>
            <p className="font-semibold">${modeled.employerCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground mt-1">${modeled.employerCostPerEE.toFixed(2)}/EE</p>
          </div>
        </div>

        <div className="p-3 border rounded">
          <p className="text-xs text-muted-foreground">Employee Cost</p>
          <p className="font-semibold">${modeled.employeeCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-muted-foreground mt-1">${modeled.employeeCostPerEE.toFixed(2)}/EE</p>
        </div>

        {modeled.premiumChange > 10 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Significant cost increase. Consider adjusting contribution strategy.</span>
          </div>
        )}
      </Card>
    </div>
  );
}