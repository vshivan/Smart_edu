import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Clock, BookOpen, Calendar } from 'lucide-react';
import api from '../../lib/api';

export default function TutorProfile() {
  const { id } = useParams();
  const { data: tutor, isLoading } = useQuery({
    queryKey: ['tutor', id],
    queryFn: () => api.get(`/tutors/${id}`).then(r => r.data.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!tutor) return <div className="text-center text-gray-400 py-20">Tutor not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-purple-600/20 border-2 border-purple-500/30 flex items-center justify-center text-3xl font-bold text-purple-400">
              {tutor.first_name?.[0]}{tutor.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{tutor.first_name} {tutor.last_name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Star size={14} fill="#f59e0b" className="text-yellow-400" /> {parseFloat(tutor.rating || 0).toFixed(1)} ({tutor.total_reviews} reviews)</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {tutor.experience_years}y exp</span>
                <span className="flex items-center gap-1"><BookOpen size={14} /> {tutor.total_sessions} sessions</span>
              </div>
              <p className="text-gray-400 mt-3 text-sm">{tutor.bio}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(tutor.skills || []).map(s => <span key={s} className="badge bg-surface border border-surface-border text-gray-300 text-xs">{s}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div className="card sticky top-24 h-fit">
          <p className="text-2xl font-bold text-white mb-1">${tutor.hourly_rate}<span className="text-gray-500 font-normal text-base">/hr</span></p>
          <button className="btn-primary w-full py-3 mt-3 flex items-center justify-center gap-2">
            <Calendar size={16} /> Book Session
          </button>
        </div>
      </div>
    </div>
  );
}
