import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Heart, Share2 } from 'lucide-react';

export default function PlanCard({ plan, onSelect, onFavorite, onShare, isFavorited }) {
  const planTypeLabel = useMemo(() => {
    const labels = {
      medical: 'Medical',
      dental: 'Dental',
      vision: 'Vision',
      life: 'Life Insurance',
      std: 'Short-term Disability',
      ltd: 'Long-term Disability',
      voluntary: 'Voluntary',
    };
    return labels[plan.plan_type] || plan.plan_type;
  }, [plan.plan_type]);

  const networkLabel = useMemo(() => {
    const labels = {
      HMO: 'HMO',
      PPO: 'PPO',
      EPO: 'EPO',
      HDHP: 'High Deductible',
      POS: 'POS',
      indemnity: 'Indemnity',
      other: 'Other',
    };
    return labels[plan.network_type] || plan.network_type;
  }, [plan.network_type]);

  const deductibleInfo = useMemo(() => {
    if (!plan.deductible_individual && !plan.deductible_family) return null;
    return {
      individual: plan.deductible_individual?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      family: plan.deductible_family?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    };
  }, [plan]);

  const oopInfo = useMemo(() => {
    if (!plan.oop_max_individual && !plan.oop_max_family) return null;
    return {
      individual: plan.oop_max_individual?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
      family: plan.oop_max_family?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
    };
  }, [plan]);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="space-y-3 flex-1">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{plan.plan_name}</h3>
              <p className="text-xs text-muted-foreground truncate">{plan.carrier}</p>
            </div>
            {plan.status === 'archived' && (
              <Badge variant="outline" className="text-xs flex-shrink-0">Archived</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">{planTypeLabel}</Badge>
            {plan.network_type && <Badge variant="outline" className="text-xs">{networkLabel}</Badge>}
            {plan.hsa_eligible && <Badge className="bg-green-600 text-xs">HSA Eligible</Badge>}
          </div>
        </div>

        {/* Coverage Details */}
        <div className="space-y-2 pt-2 border-t">
          {deductibleInfo && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Deductible (Individual)</p>
                <p className="font-semibold">{deductibleInfo.individual}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Deductible (Family)</p>
                <p className="font-semibold">{deductibleInfo.family}</p>
              </div>
            </div>
          )}

          {oopInfo && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Out-of-Pocket Max (Ind)</p>
                <p className="font-semibold">{oopInfo.individual}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Out-of-Pocket Max (Fam)</p>
                <p className="font-semibold">{oopInfo.family}</p>
              </div>
            </div>
          )}

          {plan.copay_pcp && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">PCP Copay</p>
                <p className="font-semibold">${plan.copay_pcp}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Specialist Copay</p>
                <p className="font-semibold">${plan.copay_specialist}</p>
              </div>
            </div>
          )}
        </div>

        {/* Plan Code */}
        {plan.plan_code && (
          <div className="text-xs p-2 bg-muted rounded">
            <p className="text-muted-foreground">Plan Code: <strong>{plan.plan_code}</strong></p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t mt-3">
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onSelect?.(plan.id)}
        >
          <Info className="w-4 h-4 mr-1" />
          Select
        </Button>
        {onFavorite && (
          <Button
            size="icon"
            variant={isFavorited ? 'default' : 'outline'}
            className="h-9 w-9"
            onClick={() => onFavorite(plan.id)}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </Button>
        )}
        {onShare && (
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9"
            onClick={() => onShare(plan.id)}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}