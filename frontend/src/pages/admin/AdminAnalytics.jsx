import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '../../lib/api';

const PERIODS = [
  { label: '7 Days',  value: '7d'  },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
];

const PIE_COLORS = ['#6366f1', '#e2e8f0'];

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
  color: '#0f172a',
  fontSize: 12,
};

const axisStyle = { fill: '#94a3b8', fontSize: 11 };

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics-full', period],
    queryFn: () => api.get(`/admin/analytics?period=${period}`).then(r => r.data.data),
  });

  const passed  = parseInt(data?.quiz_stats?.passed || 0);
  const total   = parseInt(data?.quiz_stats?.total_attempts || 0);
  const failed  = Math.max(0, total - passed);
  const pieData = [
    { name: 'Passed', value: passed },
    { name: 'Failed', value: failed },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics & Reporting</h1>
          <p className="page-subtitle">Platform performance over time</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                period === p.value
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-surface-border text-text-secondary hover:border-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Signups */}
          <div className="card">
            <h3 className="section-title mb-4">User Signups</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.signups || []}>
                <defs>
                  <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#signupGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Enrollments */}
          <div className="card">
            <h3 className="section-title mb-4">Course Enrollments</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.enrollments || []}>
                <XAxis dataKey="date" tick={axisStyle} tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quiz pass rate */}
          <div className="card">
            <h3 className="section-title mb-4">Quiz Pass Rate</h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={48} outerRadius={68}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-text-primary">
                    {parseFloat(data?.quiz_stats?.avg_score || 0).toFixed(1)}%
                  </p>
                  <p className="text-text-muted text-sm">Average Score</p>
                </div>
                <div className="space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-text-secondary text-sm">{d.name}: <strong className="text-text-primary">{d.value}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="card">
            <h3 className="section-title mb-4">Revenue ({period})</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-surface-muted rounded-xl border border-surface-border">
                <div>
                  <p className="text-text-muted text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-text-primary mt-0.5">
                    ${parseFloat(data?.revenue?.total || 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-lg">
                  💰
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div>
                  <p className="text-emerald-600 text-sm">Platform Earnings (20%)</p>
                  <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                    ${parseFloat(data?.revenue?.platform_fee || 0).toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center text-lg">
                  📈
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
