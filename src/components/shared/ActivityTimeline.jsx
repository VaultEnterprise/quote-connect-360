import { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { CheckCircle, Edit3, Trash2, MessageSquare, AlertCircle, Plus } from 'lucide-react';

const actionIcons = {
  create: Plus,
  update: Edit3,
  delete: Trash2,
  comment: MessageSquare,
  approve: CheckCircle,
  alert: AlertCircle,
};

export default function ActivityTimeline({ activities = [] }) {
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [activities]);

  if (!sortedActivities.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedActivities.map((activity, idx) => {
        const IconComponent = actionIcons[activity.action] || MessageSquare;
        const isLast = idx === sortedActivities.length - 1;

        return (
          <div key={activity.id || idx} className="relative pl-6">
            {/* Timeline dot */}
            <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-primary/50 border border-primary" />

            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-1 top-4 w-0.5 h-12 bg-border" />
            )}

            {/* Content */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm font-semibold">{activity.action}</p>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
                </span>
              </div>

              {activity.actor_name && (
                <p className="text-xs text-muted-foreground">
                  By <strong>{activity.actor_name}</strong>
                </p>
              )}

              {activity.detail && (
                <p className="text-sm text-foreground">{activity.detail}</p>
              )}

              {activity.old_value && activity.new_value && (
                <div className="text-xs bg-muted rounded p-2 mt-1 space-y-1">
                  <p>
                    <span className="text-muted-foreground">From:</span> <strike className="text-muted-foreground">{activity.old_value}</strike>
                  </p>
                  <p>
                    <span className="text-muted-foreground">To:</span> <strong>{activity.new_value}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}