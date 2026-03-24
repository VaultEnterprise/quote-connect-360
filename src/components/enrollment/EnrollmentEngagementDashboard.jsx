import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function EnrollmentEngagementDashboard({ members }) {
  const stats = useMemo(() => {
    if (!members || members.length === 0) {
      return { invited: 0, enrolled: 0, waived: 0, pending: 0, total: 0, byDept: [] };
    }

    let invited = 0, enrolled = 0, waived = 0, pending = 0;
    const deptMap = {};

    members.forEach(m => {
      if (m.status === 'invited') invited++;
      else if (m.status === 'enrolled') enrolled++;
      else if (m.status === 'waived') waived++;
      else if (m.status === 'pending') pending++;

      const dept = m.employer_name || 'Unknown';
      if (!deptMap[dept]) deptMap[dept] = { invited: 0, enrolled: 0, waived: 0, pending: 0 };
      deptMap[dept][m.status] = (deptMap[dept][m.status] || 0) + 1;
    });

    const byDept = Object.entries(deptMap).map(([name, counts]) => ({
      name,
      invited: counts.invited || 0,
      enrolled: counts.enrolled || 0,
      waived: counts.waived || 0,
      pending: counts.pending || 0,
    })).slice(0, 8);

    return {
      invited,
      enrolled,
      waived,
      pending,
      total: members.length,
      byDept,
      enrollmentRate: Math.round((enrolled / members.length) * 100),
    };
  }, [members]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Invited</p>
          <p className="text-2xl font-bold">{stats.invited}</p>
        </Card>
        <Card className="p-4 text-center border-green-200 bg-green-50">
          <p className="text-xs text-muted-foreground mb-1">Enrolled</p>
          <p className="text-2xl font-bold text-green-600">{stats.enrolled}</p>
        </Card>
        <Card className="p-4 text-center border-yellow-200 bg-yellow-50">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4 text-center border-red-200 bg-red-50">
          <p className="text-xs text-muted-foreground mb-1">Waived</p>
          <p className="text-2xl font-bold text-red-600">{stats.waived}</p>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Enrollment Rate</p>
        <div className="space-y-2">
          <Progress value={stats.enrollmentRate} />
          <p className="text-sm text-muted-foreground text-right">{stats.enrollmentRate}% Complete</p>
        </div>
      </Card>

      {/* By Department/Location */}
      {stats.byDept.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Enrollment by Group</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byDept}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="enrolled" fill="#10b981" />
              <Bar dataKey="pending" fill="#f59e0b" />
              <Bar dataKey="waived" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}