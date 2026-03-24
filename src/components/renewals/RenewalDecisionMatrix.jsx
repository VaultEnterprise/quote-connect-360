import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle } from 'lucide-react';

const DECISION_OPTIONS = [
  { key: 'renew_as_is', label: 'Renew As-Is', description: 'Accept current terms' },
  { key: 'renew_with_changes', label: 'Renew w/ Changes', description: 'Renegotiate terms' },
  { key: 'market', label: 'Market', description: 'Shop alternatives' },
  { key: 'terminate', label: 'Terminate', description: 'End coverage' },
];

export default function RenewalDecisionMatrix({ renewal, onDecisionMade }) {
  const [decision, setDecision] = useState(renewal.decision || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;
    setIsSubmitting(true);
    await onDecisionMade({ decision, notes });
    setIsSubmitting(false);
  };

  const currentOption = DECISION_OPTIONS.find(o => o.key === decision);

  return (
    <div className="space-y-4">
      {/* Current Premium Info */}
      <Card className="p-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Current Premium</p>
          <p className="font-semibold">${renewal.current_premium?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Renewal Premium</p>
          <p className="font-semibold text-orange-600">${renewal.renewal_premium?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rate Change</p>
          <Badge variant={renewal.rate_change_percent > 5 ? 'destructive' : 'secondary'}>
            {renewal.rate_change_percent > 0 ? '+' : ''}{renewal.rate_change_percent?.toFixed(1)}%
          </Badge>
        </div>
      </Card>

      {/* Recommendation */}
      {renewal.recommendation && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-700 font-medium">Platform Recommendation:</p>
          <p className="text-sm font-semibold text-blue-900 mt-1">
            {DECISION_OPTIONS.find(o => o.key === renewal.recommendation)?.label}
          </p>
        </Card>
      )}

      {/* Decision Selection */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-sm">Your Decision</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DECISION_OPTIONS.map(option => (
            <button
              key={option.key}
              onClick={() => setDecision(option.key)}
              className={`p-3 border rounded text-left transition-all ${
                decision === option.key ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'
              }`}
            >
              <div className="flex items-start gap-2">
                {decision === option.key && <CheckCircle className="w-4 h-4 text-primary mt-0.5" />}
                <div>
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {decision && (
          <div>
            <label className="text-sm font-medium block mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document your decision rationale..."
              className="w-full p-2 border rounded text-sm resize-none"
              rows="3"
            />
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!decision || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Saving...' : 'Record Decision'}
        </Button>
      </Card>
    </div>
  );
}