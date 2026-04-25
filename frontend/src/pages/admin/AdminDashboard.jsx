import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BookOpen, DollarSign, UserCheck, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../lib/api';

const MetricCard = ({ icon: Icon, label, value, sub, iconBg, iconColor, delay }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card">
    <div className="flex items-center justify-between mb-3">
      <p className="text-text-muted text-sm font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={17} className={iconColor} />
      </div>
    </div>
    <p className="text-3xl font-bold text-text-primary">{value}</p>
    {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
  </motion.div>
);

const chartTooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
  color: '#0f172a',
  fontSize: 12,
};

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data.data),
    refetchInterval: 60000,
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics?period=30d').then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const u = data?.users    || {};
  const c = data?.courses  || {};
  const r = data?.revenue  || {};
  const e = data?.engagement || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Real-time metrics across SmartEduLearn</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users}      label="Total Users"       value={parseInt(u.total || 0).toLocaleString()}      sub={`+${u.new_30d || 0} this month`}      iconBg="bg-blue-50"    iconColor="text-blue-600"   delay={0} />
        <MetricCard icon={UserCheck}  label="Active (7d)"       value={parseInt(u.active_7d || 0).toLocaleString()}  sub={`${u.tutors || 0} tutors`}             iconBg="bg-emerald-50" iconColor="text-emerald-600" delay={0.05} />
        <MetricCard icon={BookOpen}   label="Total Courses"     value={parseInt(c.total || 0).toLocaleString()}      sub={`${c.ai_generated || 0} AI-generated`} iconBg="bg-violet-50"  iconColor="text-violet-600" delay={0.1} />
        <MetricCard icon={DollarSign} label="Platform Revenue"  value={`$${parseFloat(r.platform_earnings || 0).toFixed(0)}`} sub="All time"                    iconBg="bg-amber-50"   iconColor="text-amber-600"  delay={0.15} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="section-title mb-4">New Signups (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics?.signups || []}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#signupGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title mb-4">Enrollments (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.enrollments || []}>
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={d => d?.slice(5)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Completion',    value: `${parseFloat(e.avg_completion || 0).toFixed(1)}%` },
          { label: 'Total Enrollments', value: parseInt(e.total_enrollments || 0).toLocaleString() },
          { label: 'Avg Quiz Score',    value: `${parseFloat(analytics?.quiz_stats?.avg_score || 0).toFixed(1)}%` },
          { label: 'Revenue (30d)',     value: `$${parseFloat(r.revenue_30d || 0).toFixed(0)}` },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-5">
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-text-muted text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
