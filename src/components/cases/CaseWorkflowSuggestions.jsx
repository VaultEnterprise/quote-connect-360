import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronRight } from 'lucide-react';

export default function CaseWorkflowSuggestions({ caseData }) {
  const suggestions = useMemo(() => {
    const items = [];

    // Census checks
    if (caseData.census_status === 'not_started') {
      items.push({
        id: 'upload_census',
        title: 'Upload Employee Census',
        description: 'Upload the employee census file to begin qualification.',
        priority: 'high',
        action: 'Upload Census',
      });
    }

    if (caseData.census_status === 'uploaded' && !caseData.validated_at) {
      items.push({
        id: 'validate_census',
        title: 'Validate Census Data',
        description: 'Run quality checks on the census file.',
        priority: 'high',
        action: 'Start Validation',
      });
    }

    // Quote checks
    if (caseData.census_status === 'validated' && caseData.quote_status === 'not_started') {
      items.push({
        id: 'request_quotes',
        title: 'Request Quotes from Carriers',
        description: 'Send validated census to carriers for pricing.',
        priority: 'high',
        action: 'Request Quotes',
      });
    }

    // Proposal checks
    if (caseData.quote_status === 'completed' && caseData.stage === 'ready_for_quote') {
      items.push({
        id: 'create_proposal',
        title: 'Generate Proposal',
        description: 'Create and send proposal to employer.',
        priority: 'medium',
        action: 'Create Proposal',
      });
    }

    // Enrollment checks
    if (caseData.stage === 'approved_for_enrollment' && caseData.enrollment_status === 'not_started') {
      items.push({
        id: 'open_enrollment',
        title: 'Open Enrollment Window',
        description: 'Launch enrollment period for employees.',
        priority: 'high',
        action: 'Open Enrollment',
      });
    }

    // Follow-up
    if (caseData.last_activity_date) {
      const daysSinceActivity = Math.floor((Date.now() - new Date(caseData.last_activity_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceActivity > 7) {
        items.push({
          id: 'follow_up',
          title: `Follow Up (${daysSinceActivity} days idle)`,
          description: 'Check in with employer on case progress.',
          priority: 'medium',
          action: 'Send Follow-Up',
        });
      }
    }

    return items;
  }, [caseData]);

  if (suggestions.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground text-sm">
        No pending actions. Case is on track.
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {suggestions.map(suggestion => (
        <Card key={suggestion.id} className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{suggestion.title}</p>
                <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                  {suggestion.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
              <Button size="sm" variant="outline" className="gap-1">
                {suggestion.action}
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}