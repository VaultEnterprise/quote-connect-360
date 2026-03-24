import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

const MILESTONE_MAP = {
  'draft': { label: 'Case Created', icon: 'check' },
  'census_in_progress': { label: 'Census Upload', icon: 'pending' },
  'census_validated': { label: 'Census Validated', icon: 'check' },
  'ready_for_quote': { label: 'Ready for Quote', icon: 'check' },
  'quoting': { label: 'Quoting in Progress', icon: 'pending' },
  'proposal_ready': { label: 'Proposal Ready', icon: 'check' },
  'employer_review': { label: 'Employer Review', icon: 'pending' },
  'approved_for_enrollment': { label: 'Approved', icon: 'check' },
  'enrollment_open': { label: 'Enrollment Open', icon: 'check' },
  'enrollment_complete': { label: 'Enrollment Complete', icon: 'check' },
  'install_in_progress': { label: 'Installation', icon: 'pending' },
  'active': { label: 'Active', icon: 'check' },
  'closed': { label: 'Closed', icon: 'check' },
};

export default function CaseMilestoneTracker({ caseData }) {
  const milestones = useMemo(() => {
    const allStages = Object.keys(MILESTONE_MAP);
    const currentIndex = allStages.indexOf(caseData.stage);

    return allStages.map((stage, idx) => ({
      stage,
      ...MILESTONE_MAP[stage],
      status: idx < currentIndex ? 'completed' : idx === currentIndex ? 'current' : 'pending',
    }));
  }, [caseData.stage]);

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-sm mb-4">Case Milestones</h3>
      <div className="space-y-0">
        {milestones.map((milestone, idx) => (
          <div key={milestone.stage} className="relative">
            {/* Connector Line */}
            {idx < milestones.length - 1 && (
              <div
                className={`absolute left-6 top-12 w-0.5 h-8 ${
                  milestone.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                }`}
              />
            )}

            {/* Milestone */}
            <div className="flex items-start gap-4 pb-6 relative z-10">
              <div className="flex-shrink-0 flex items-center justify-center">
                {milestone.status === 'completed' && (
                  <CheckCircle className="w-6 h-6 text-green-600 bg-white rounded-full" />
                )}
                {milestone.status === 'current' && (
                  <div className="w-6 h-6 border-2 border-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}
                {milestone.status === 'pending' && (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-sm font-medium ${
                    milestone.status === 'current' ? 'text-primary' : milestone.status === 'completed' ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                    {milestone.label}
                  </p>
                  {milestone.status === 'current' && (
                    <Badge variant="outline" className="text-xs">In Progress</Badge>
                  )}
                </div>
                {milestone.status === 'pending' && idx <= milestones.findIndex(m => m.status === 'current') + 2 && (
                  <p className="text-xs text-muted-foreground">Coming up</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}