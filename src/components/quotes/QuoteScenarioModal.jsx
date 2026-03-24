import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function QuoteScenarioModal({ open, onOpenChange, onSubmit, caseData, existingScenarios = [] }) {
  const [scenarioName, setScenarioName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(['medical']);
  const [contributionStrategy, setContributionStrategy] = useState('percentage');

  const productOptions = ['medical', 'dental', 'vision', 'life', 'std', 'ltd'];

  const handleProductToggle = (product) => {
    setSelectedProducts(prev =>
      prev.includes(product) ? prev.filter(p => p !== product) : [...prev, product]
    );
  };

  const handleSubmit = () => {
    if (!scenarioName.trim() || selectedProducts.length === 0) return;

    onSubmit?.({
      name: scenarioName,
      products_included: selectedProducts,
      contribution_strategy: contributionStrategy,
    });

    setScenarioName('');
    setSelectedProducts(['medical']);
    setContributionStrategy('percentage');
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Quote Scenario</DialogTitle>
          <DialogDescription>
            Define a new quote scenario for {caseData?.employer_name || 'this case'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scenario Name */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Scenario Name</label>
            <Input
              placeholder="e.g., Competitive Bid, Current Renewal, Conservative"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
            />
          </div>

          {/* Products */}
          <div>
            <label className="text-sm font-semibold mb-3 block">Products to Include</label>
            <div className="grid grid-cols-2 gap-3">
              {productOptions.map(product => (
                <div key={product} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedProducts.includes(product)}
                    onCheckedChange={() => handleProductToggle(product)}
                  />
                  <label className="text-sm cursor-pointer capitalize">
                    {product === 'std' ? 'Short-term Disability' : product === 'ltd' ? 'Long-term Disability' : product}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Contribution Strategy */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Contribution Strategy</label>
            <Select value={contributionStrategy} onValueChange={setContributionStrategy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage-based</SelectItem>
                <SelectItem value="flat_dollar">Flat Dollar Amount</SelectItem>
                <SelectItem value="defined_contribution">Defined Contribution</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {selectedProducts.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-900 font-semibold mb-2">SCENARIO SUMMARY</p>
              <div className="space-y-1 text-xs text-blue-900">
                <p><strong>Name:</strong> {scenarioName || '(not entered)'}</p>
                <p>
                  <strong>Products:</strong> {selectedProducts.length > 0 ? selectedProducts.join(', ').toUpperCase() : 'None'}
                </p>
                <p><strong>Strategy:</strong> {contributionStrategy.replace(/_/g, ' ')}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!scenarioName.trim() || selectedProducts.length === 0}
          >
            Create Scenario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}