import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Users, Calendar, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function TutorDashboard() {
  const qc = useQueryClient();

  const { data: earnings } = useQuery({
    queryKey: ['tutor-earnings'],
    queryFn: () => api.get('/tutors/earnings').then(r => r.data.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (is_available) => api.put('/tutors/availability', { is_available }),
    onSuccess: () => { toast.success('Availability updated'); qc.invalidateQueries(['tutor-earnings']); },
  });

  return (
    <div className="space-y-8 animate-slide-up">
      <h1 className="text-2xl font-bold text-white">Tutor Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-gray-400 text-sm mb-1">Total Earnings</p><p className="text-2xl font-bold text-white">${parseFloat(earnings?.total_earnings || 0).toFixed(2)}</p></div>
        <div className="card"><p className="text-gray-400 text-sm mb-1">This Month</p><p className="text-2xl font-bold text-green-400">${parseFloat(earnings?.earnings_30d || 0).toFixed(2)}</p></div>
        <div className="card"><p className="text-gray-400 text-sm mb-1">Total Sessions</p><p className="text-2xl font-bold text-white">{earnings?.total_sessions || 0}</p></div>
        <div className="card"><p className="text-gray-400 text-sm mb-1">Completed</p><p className="text-2xl font-bold text-white">{earnings?.completed_sessions || 0}</p></div>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">Availability Status</p>
          <p className="text-gray-400 text-sm">Toggle to accept new bookings</p>
        </div>
        <button onClick={() => toggleMutation.mutate(true)} className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors">
          <ToggleRight size={32} />
        </button>
      </div>
    </div>
  );
}
