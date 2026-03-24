import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CensusDemographicsChart({ members }) {
  const stats = useMemo(() => {
    if (!members || members.length === 0) return { ageData: [], genderData: [], coverageData: [], deptData: [] };

    // Age buckets
    const ageBuckets = { '18-29': 0, '30-39': 0, '40-49': 0, '50-59': 0, '60+': 0 };
    const genderCounts = { male: 0, female: 0, other: 0 };
    const coverageTiers = { employee_only: 0, employee_spouse: 0, employee_children: 0, family: 0 };
    const deptCounts = {};

    members.forEach(m => {
      if (m.date_of_birth) {
        const age = new Date().getFullYear() - new Date(m.date_of_birth).getFullYear();
        if (age < 30) ageBuckets['18-29']++;
        else if (age < 40) ageBuckets['30-39']++;
        else if (age < 50) ageBuckets['40-49']++;
        else if (age < 60) ageBuckets['50-59']++;
        else ageBuckets['60+']++;
      }

      if (m.gender) genderCounts[m.gender]++;
      if (m.coverage_tier) coverageTiers[m.coverage_tier]++;
      if (m.department) deptCounts[m.department] = (deptCounts[m.department] || 0) + 1;
    });

    return {
      ageData: Object.entries(ageBuckets).map(([name, value]) => ({ name, value })),
      genderData: Object.entries(genderCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).filter(d => d.value > 0),
      coverageData: Object.entries(coverageTiers).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })).filter(d => d.value > 0),
      deptData: Object.entries(deptCounts).map(([name, value]) => ({ department: name, count: value })).sort((a, b) => b.count - a.count).slice(0, 8),
    };
  }, [members]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Age Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.ageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Gender Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={stats.genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {stats.genderData.map((_, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-4">Coverage Tier Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={stats.coverageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {stats.coverageData.map((_, idx) => (
                <Cell key={idx} fill={colors[idx % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {stats.deptData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4">Top Departments</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.deptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="department" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}