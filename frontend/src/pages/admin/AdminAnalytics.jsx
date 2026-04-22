import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api';

const PERIODS = [{ label: '7 Days', value: '7d' }, { label: '30 Days', value: '30d' }, { label: '90 Days', value: '90d' }];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', period],
    queryFn: () => api.get(`/admin/analytics?period=${period}`).then(r => r.data.data),
  });

  const pieData = data ? [
    { name: 'Passed', value: parseInt(data.quiz_stats?.passed || 0) },
    { name: 'Failed', value: parseInt(data.quiz_stats?.total_attempts || 0) - parseInt(data.quiz_stats?.passed || 0) },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics & Reporting</h1>
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${period === p.value ? 'bg-brand-600/20 border-brand-500 text-brand-400' : 'border-surface-border text-gray-400 hover:text-white'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-white mb-4">User Signups</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data?.signups || []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8 }} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#g1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Course Enrollments</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.enrollments || []}>
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Quiz Pass Rate</h3>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-bold text-white">{parseFloat(data?.quiz_stats?.avg_score || 0).toFixed(1)}%</p>
                  <p className="text-gray-400 text-sm">Average Score</p>
                </div>
                <div className="flex gap-4">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-gray-400 text-xs">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Revenue ({period})</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-surface rounded-xl">
                <span className="text-gray-400">Total Revenue</span>
                <span className="text-2xl font-bold text-white">${parseFloat(data?.revenue?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-surface rounded-xl">
                <span className="text-gray-400">Platform Fee (20%)</span>
                <span className="text-xl font-bold text-green-400">${parseFloat(data?.revenue?.platform_fee || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
