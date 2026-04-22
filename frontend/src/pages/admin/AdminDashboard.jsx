import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BookOpen, DollarSign, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import api from '../../lib/api';

const MetricCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-400 text-sm">{label}</p>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </motion.div>
);

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

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>;

  const u = data?.users || {};
  const c = data?.courses || {};
  const r = data?.revenue || {};
  const e = data?.engagement || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time metrics across SmartEduLearn</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users}     label="Total Users"     value={parseInt(u.total || 0).toLocaleString()}   sub={`+${u.new_30d || 0} this month`}    color="bg-blue-600"   delay={0} />
        <MetricCard icon={UserCheck} label="Active (7d)"     value={parseInt(u.active_7d || 0).toLocaleString()} sub={`${u.tutors || 0} tutors`}          color="bg-green-600"  delay={0.1} />
        <MetricCard icon={BookOpen}  label="Total Courses"   value={parseInt(c.total || 0).toLocaleString()}   sub={`${c.ai_generated || 0} AI-generated`} color="bg-purple-600" delay={0.2} />
        <MetricCard icon={DollarSign} label="Platform Revenue" value={`$${parseFloat(r.platform_earnings || 0).toFixed(0)}`} sub="All time"           color="bg-yellow-600" delay={0.3} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Signups */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">New Signups (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics?.signups || []}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8 }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#signupGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Enrollments */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Enrollments (30d)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.enrollments || []}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{parseFloat(e.avg_completion || 0).toFixed(1)}%</p>
          <p className="text-gray-400 text-sm mt-1">Avg Completion</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{parseInt(e.total_enrollments || 0).toLocaleString()}</p>
          <p className="text-gray-400 text-sm mt-1">Total Enrollments</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{parseFloat(analytics?.quiz_stats?.avg_score || 0).toFixed(1)}%</p>
          <p className="text-gray-400 text-sm mt-1">Avg Quiz Score</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">${parseFloat(r.revenue_30d || 0).toFixed(0)}</p>
          <p className="text-gray-400 text-sm mt-1">Revenue (30d)</p>
        </div>
      </div>
    </div>
  );
}
