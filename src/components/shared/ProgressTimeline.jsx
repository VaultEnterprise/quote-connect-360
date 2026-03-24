import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ProgressTimeline({ steps = [], currentStep = 0 }) {
  const timeline = useMemo(() => {
    return steps.map((step, idx) => ({
      ...step,
      status: idx < currentStep ? 'completed' : idx === currentStep ? 'current' : 'pending',
      order: idx + 1,
    }));
  }, [steps, currentStep]);

  return (
    <Card className="p-6">
      <div className="space-y-0">
        {timeline.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Connector Line */}
            {idx < timeline.length - 1 && (
              <div
                className={`absolute left-6 top-12 w-0.5 h-12 ${
                  step.status === 'completed' ? 'bg-green-400' : 'bg-muted'
                }`}
              />
            )}

            {/* Step */}
            <div className="flex gap-4 pb-8 relative z-10">
              <div className="flex flex-col items-center">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : step.status === 'current' ? (
                  <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground stroke-2" />
                )}
              </div>

              <div className="flex-1 pt-0.5">
                <p className={`text-sm font-semibold ${
                  step.status === 'completed' ? 'text-green-600' : step.status === 'current' ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                )}
                {step.date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(step.date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}