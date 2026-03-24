import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Zap,
  Pause,
  HelpCircle,
} from 'lucide-react';

const statusConfig = {
  // Common statuses
  active: { icon: CheckCircle, color: 'bg-green-100 text-green-900', label: 'Active' },
  inactive: { icon: XCircle, color: 'bg-gray-100 text-gray-900', label: 'Inactive' },
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-900', label: 'Pending' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-900', label: 'Completed' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-900', label: 'Failed' },
  warning: { icon: AlertCircle, color: 'bg-orange-100 text-orange-900', label: 'Warning' },
  error: { icon: AlertCircle, color: 'bg-red-100 text-red-900', label: 'Error' },
  success: { icon: CheckCircle, color: 'bg-green-100 text-green-900', label: 'Success' },
  paused: { icon: Pause, color: 'bg-slate-100 text-slate-900', label: 'Paused' },
  running: { icon: Zap, color: 'bg-blue-100 text-blue-900', label: 'Running' },
  unknown: { icon: HelpCircle, color: 'bg-gray-100 text-gray-900', label: 'Unknown' },

  // Case-specific
  draft: { icon: Clock, color: 'bg-slate-100 text-slate-900', label: 'Draft' },
  approved: { icon: CheckCircle, color: 'bg-green-100 text-green-900', label: 'Approved' },
  rejected: { icon: XCircle, color: 'bg-red-100 text-red-900', label: 'Rejected' },
  in_progress: { icon: Zap, color: 'bg-blue-100 text-blue-900', label: 'In Progress' },
  on_hold: { icon: Pause, color: 'bg-orange-100 text-orange-900', label: 'On Hold' },

  // Enrollment-specific
  enrolled: { icon: CheckCircle, color: 'bg-green-100 text-green-900', label: 'Enrolled' },
  waived: { icon: Clock, color: 'bg-yellow-100 text-yellow-900', label: 'Waived' },
  terminated: { icon: XCircle, color: 'bg-red-100 text-red-900', label: 'Terminated' },
  invited: { icon: Clock, color: 'bg-blue-100 text-blue-900', label: 'Invited' },
};

export default function StatusBadge({
  status,
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  customLabel,
}) {
  const config = statusConfig[status?.toLowerCase()] || statusConfig.unknown;
  const IconComponent = config.icon;
  const label = customLabel || config.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <Badge
      className={`inline-flex items-center gap-1 ${config.color} ${sizeClasses[size]} border-0 ${className}`}
    >
      {showIcon && <IconComponent className={`w-${size === 'sm' ? 3 : 4} h-${size === 'sm' ? 3 : 4}`} />}
      {label}
    </Badge>
  );
}