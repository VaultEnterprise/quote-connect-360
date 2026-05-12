/**
 * MGA Analytics Trend Panel
 * components/mga/MGAAnalyticsTrendPanel.jsx
 *
 * Time-series trend visualization
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MGAAnalyticsTrendPanel() {
  // Placeholder data - in production would come from backend
  const data = [
    { day: 'Mon', cases: 12, exports: 24 },
    { day: 'Tue', cases: 19, exports: 36 },
    { day: 'Wed', cases: 15, exports: 28 },
    { day: 'Thu', cases: 22, exports: 32 },
    { day: 'Fri', cases: 18, exports: 40 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="cases" stroke="#2563eb" strokeWidth={2} />
        <Line type="monotone" dataKey="exports" stroke="#10b981" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}