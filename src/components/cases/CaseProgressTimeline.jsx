import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = [
  { key: 'draft', label: 'Draft', order: 0 },
  { key: 'census_in_progress', label: 'Census In Progress', order: 1 },
  { key: 'census_validated', label: 'Census Validated', order: 2 },
  { key: 'ready_for_quote', label: 'Ready for Quote', order: 3 },
  { key: 'quoting', label: 'Quoting', order: 4 },
  { key: 'proposal_ready', label: 'Proposal Ready', order: 5 },
  { key: 'employer_review', label: 'Employer Review', order: 6 },
  { key: 'approved_for_enrollment', label: 'Approved for Enrollment', order: 7 },
  { key: 'enrollment_open', label: 'Enrollment Open', order: 8 },
  { key: 'enrollment_complete', label: 'Enrollment Complete', order: 9 },
  { key: 'install_in_progress', label: 'Install In Progress', order: 10 },
  { key: 'active', label: 'Active', order: 11 },
  { key: 'closed', label: 'Closed', order: 12 },
];

export default function CaseProgressTimeline({ currentStage, activities }) {
  const currentStageOrder = STAGES.find(s => s.key === currentStage)?.order ?? 0;

  return (
    <div className="space-y-6">
      {/* Stage Timeline */}
      <div className="bg-card rounded-lg p-6 border">
        <h3 className="text-sm font-semibold mb-6">Case Progress</h3>
        <div className="space-y-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = STAGES.findIndex(s => s.key === currentStage) >= idx;
            const isCurrent = stage.key === currentStage;

            return (
              <div key={stage.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div className={`w-0.5 h-12 ${isCompleted ? 'bg-green-200' : 'bg-border'}`} />
                  )}
                </div>
                <div className="pt-1.5">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {stage.label}
                  </p>
                  {isCurrent && <p className="text-xs text-primary font-semibold">Current</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Feed */}
      {activities && activities.length > 0 && (
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex gap-3 text-xs pb-3 border-b last:border-0">
                <div className="text-muted-foreground min-w-fit">
                  {format(new Date(activity.created_date || new Date()), 'MMM d, HH:mm')}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{activity.actor_name || 'System'}</p>
                  <p className="text-muted-foreground">{activity.action}: {activity.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}