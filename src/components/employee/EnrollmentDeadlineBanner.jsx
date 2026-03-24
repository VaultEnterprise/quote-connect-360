import { useMemo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

export default function EnrollmentDeadlineBanner({ enrollmentWindow }) {
  const urgency = useMemo(() => {
    if (!enrollmentWindow?.end_date) return null;

    const today = new Date();
    const endDate = new Date(enrollmentWindow.end_date);
    const daysRemaining = differenceInDays(endDate, today);

    return {
      daysRemaining: Math.max(0, daysRemaining),
      formattedDate: format(endDate, 'MMMM d, yyyy'),
      urgent: daysRemaining <= 3,
      expired: daysRemaining < 0,
    };
  }, [enrollmentWindow?.end_date]);

  if (!urgency || urgency.expired) return null;

  if (urgency.urgent) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Enrollment closes in {urgency.daysRemaining} day{urgency.daysRemaining !== 1 ? 's' : ''}!</strong>
          {' '}Complete your selection by {urgency.formattedDate}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <Clock className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-900">
        Enrollment closes <strong>{urgency.formattedDate}</strong> ({urgency.daysRemaining} days remaining).
      </AlertDescription>
    </Alert>
  );
}