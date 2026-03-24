import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Flag, Users } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function CaseListCard({ caseData, onOpen }) {
  const stageConfig = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-900' },
    census_in_progress: { label: 'Census', color: 'bg-blue-100 text-blue-900' },
    census_validated: { label: 'Validated', color: 'bg-green-100 text-green-900' },
    ready_for_quote: { label: 'Ready', color: 'bg-purple-100 text-purple-900' },
    quoting: { label: 'Quoting', color: 'bg-indigo-100 text-indigo-900' },
    proposal_ready: { label: 'Proposal', color: 'bg-pink-100 text-pink-900' },
    employer_review: { label: 'Review', color: 'bg-orange-100 text-orange-900' },
    approved_for_enrollment: { label: 'Approved', color: 'bg-emerald-100 text-emerald-900' },
    enrollment_open: { label: 'Enrolling', color: 'bg-cyan-100 text-cyan-900' },
    enrollment_complete: { label: 'Complete', color: 'bg-lime-100 text-lime-900' },
    active: { label: 'Active', color: 'bg-green-100 text-green-900' },
    closed: { label: 'Closed', color: 'bg-gray-100 text-gray-900' },
  };

  const priorityConfig = {
    low: 'bg-slate-100 text-slate-900',
    normal: 'bg-blue-100 text-blue-900',
    high: 'bg-orange-100 text-orange-900',
    urgent: 'bg-red-100 text-red-900',
  };

  const stageInfo = stageConfig[caseData.stage] || { label: caseData.stage, color: 'bg-gray-100' };

  const daysToClose = useMemo(() => {
    if (!caseData.target_close_date) return null;
    const days = differenceInDays(new Date(caseData.target_close_date), new Date());
    return {
      days: Math.abs(days),
      isOverdue: days < 0,
      isUrgent: days >= 0 && days <= 7,
    };
  }, [caseData.target_close_date]);

  const lastActivity = useMemo(() => {
    if (!caseData.last_activity_date) return null;
    const days = differenceInDays(new Date(), new Date(caseData.last_activity_date));
    return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  }, [caseData.last_activity_date]);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onOpen?.(caseData.id)}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1 truncate">{caseData.employer_name}</h3>
            <p className="text-xs text-muted-foreground">
              Case: {caseData.case_number}
            </p>
          </div>
          <Badge className={`text-xs flex-shrink-0 ${stageInfo.color}`}>
            {stageInfo.label}
          </Badge>
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-4 text-xs">
          {caseData.employee_count && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{caseData.employee_count} employees</span>
            </div>
          )}

          {caseData.assigned_to && (
            <div className="text-muted-foreground">
              Assigned: <strong>{caseData.assigned_to.split('@')[0]}</strong>
            </div>
          )}
        </div>

        {/* Badges Row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`text-xs ${priorityConfig[caseData.priority]}`}>
            {caseData.priority.toUpperCase()}
          </Badge>

          {caseData.case_type && (
            <Badge variant="outline" className="text-xs">
              {caseData.case_type.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          )}

          {daysToClose && (
            <Badge
              variant="outline"
              className={`text-xs ${
                daysToClose.isOverdue
                  ? 'bg-red-100 text-red-900'
                  : daysToClose.isUrgent
                  ? 'bg-orange-100 text-orange-900'
                  : 'bg-green-100 text-green-900'
              }`}
            >
              {daysToClose.isOverdue ? 'OVERDUE' : daysToClose.days === 0 ? 'TODAY' : `${daysToClose.days}d left`}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {lastActivity && `Last activity: ${lastActivity}`}
          </p>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onOpen?.(caseData.id);
            }}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}