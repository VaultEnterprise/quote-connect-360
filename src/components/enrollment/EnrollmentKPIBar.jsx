import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, Clock, Ban } from 'lucide-react';

export default function EnrollmentKPIBar({ enrollmentData = [] }) {
  const metrics = useMemo(() => {
    const total = enrollmentData.length || 0;
    const enrolled = enrollmentData.filter(e => e.status === 'enrolled').length;
    const pending = enrollmentData.filter(e => e.status === 'pending' || e.status === 'invited').length;
    const waived = enrollmentData.filter(e => e.status === 'waived').length;

    const enrollmentRate = total > 0 ? Math.round((enrolled / total) * 100) : 0;

    return { total, enrolled, pending, waived, enrollmentRate };
  }, [enrollmentData]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total */}
      <Card className="p-4 text-center hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Total Eligible</p>
        <p className="text-2xl font-bold">{metrics.total}</p>
      </Card>

      {/* Enrolled */}
      <Card className="p-4 text-center border-green-200 bg-green-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Enrolled</p>
        <p className="text-2xl font-bold text-green-600">{metrics.enrolled}</p>
      </Card>

      {/* Pending */}
      <Card className="p-4 text-center border-blue-200 bg-blue-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Pending</p>
        <p className="text-2xl font-bold text-blue-600">{metrics.pending}</p>
      </Card>

      {/* Waived */}
      <Card className="p-4 text-center border-gray-200 bg-gray-50 hover:shadow-md transition-shadow">
        <div className="flex justify-center mb-2">
          <Ban className="w-5 h-5 text-gray-600" />
        </div>
        <p className="text-xs text-muted-foreground mb-1">Waived</p>
        <p className="text-2xl font-bold text-gray-600">{metrics.waived}</p>
      </Card>

      {/* Enrollment Rate */}
      <Card className="p-4 col-span-2 sm:col-span-4 text-center border-purple-200 bg-purple-50">
        <p className="text-xs text-muted-foreground mb-2">Enrollment Rate</p>
        <div className="flex items-center justify-center gap-3">
          <div className="flex-1">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${metrics.enrollmentRate}%` }}
              />
            </div>
          </div>
          <Badge className="bg-purple-600">{metrics.enrollmentRate}%</Badge>
        </div>
      </Card>
    </div>
  );
}