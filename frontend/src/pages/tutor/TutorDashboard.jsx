import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, BookOpen, Calendar, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, icon: Icon, color, bg }) => (
  <div className="card">
    <div className="flex items-center justify-between mb-3">
      <p className="text-text-muted text-sm font-medium">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}>
        <Icon size={17} className={color} />
      </div>
    </div>
    <p className="text-2xl font-bold text-text-primary">{value}</p>
    {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
  </div>
);

export default function TutorDashboard() {
  const qc = useQueryClient();
  const [available, setAvailable] = useState(false);

  const { data: earnings } = useQuery({
    queryKey: ['tutor-earnings'],
    queryFn: () => api.get('/tutors/earnings').then(r => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (is_available) => api.put('/tutors/availability', { is_available }),
    onSuccess: (_, is_available) => {
      setAvailable(is_available);
      toast.success(is_available ? 'You are now available for bookings' : 'You are now unavailable');
      qc.invalidateQueries(['tutor-earnings']);
    },
  });

  const sessions = earnings?.recent_sessions || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Tutor Dashboard</h1>
          <p className="page-subtitle">Manage your sessions and earnings</p>
        </div>
        {/* Availability toggle */}
        <button
          onClick={() => toggleMutation.mutate(!available)}
          disabled={toggleMutation.isPending}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all ${
            available
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-surface-border text-text-secondary hover:border-slate-300'
          }`}
        >
          {available ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} />}
          {available ? 'Available' : 'Unavailable'}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Earnings"  value={`$${parseFloat(earnings?.total_earnings || 0).toFixed(2)}`}  icon={DollarSign}  color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="This Month"      value={`$${parseFloat(earnings?.earnings_30d || 0).toFixed(2)}`}    icon={TrendingUp}  color="text-brand-600"   bg="bg-brand-50"   sub="Last 30 days" />
        <StatCard label="Total Sessions"  value={earnings?.total_sessions || 0}                               icon={Calendar}    color="text-violet-600"  bg="bg-violet-50" />
        <StatCard label="Completed"       value={earnings?.completed_sessions || 0}                           icon={BookOpen}    color="text-amber-600"   bg="bg-amber-50" />
      </div>

      {/* Recent sessions */}
      <div className="card">
        <h2 className="section-title mb-4">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-surface-border rounded-xl">
            <Calendar size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-text-muted text-sm">No sessions yet. Toggle availability to start accepting bookings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-surface-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">{s.subject}</p>
                  <p className="text-xs text-text-muted">{new Date(s.scheduled_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge text-xs ${
                    s.status === 'completed' ? 'badge-green' :
                    s.status === 'confirmed' ? 'badge-brand' :
                    s.status === 'cancelled' ? 'badge-red' : 'badge-yellow'
                  }`}>{s.status}</span>
                  <span className="font-semibold text-text-primary text-sm">${parseFloat(s.tutor_earnings || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
