import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Clock, BookOpen, Calendar, Award } from 'lucide-react';
import api from '../../lib/api';

export default function TutorProfile() {
  const { id } = useParams();
  const { data: tutor, isLoading } = useQuery({
    queryKey: ['tutor', id],
    queryFn: () => api.get(`/tutors/${id}`).then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!tutor) return <div className="text-center text-text-muted py-20">Tutor not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-violet-100 border-2 border-violet-200 flex items-center justify-center text-3xl font-bold text-violet-700 shrink-0">
              {tutor.first_name?.[0]}{tutor.last_name?.[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">{tutor.first_name} {tutor.last_name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Star size={14} fill="#f59e0b" className="text-amber-400" />
                  <span className="font-semibold text-amber-600">{parseFloat(tutor.rating || 0).toFixed(1)}</span>
                  <span className="text-text-muted">({tutor.total_reviews} reviews)</span>
                </span>
                <span className="flex items-center gap-1"><Clock size={13} /> {tutor.experience_years}y experience</span>
                <span className="flex items-center gap-1"><BookOpen size={13} /> {tutor.total_sessions} sessions</span>
              </div>
              {tutor.bio && <p className="text-text-secondary mt-3 text-sm leading-relaxed">{tutor.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {(tutor.skills || []).map(s => (
                  <span key={s} className="badge-gray text-xs">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Rating',    value: parseFloat(tutor.rating || 0).toFixed(1), icon: Star,    color: 'text-amber-500 bg-amber-50' },
              { label: 'Sessions',  value: tutor.total_sessions || 0,                icon: BookOpen, color: 'text-brand-600 bg-brand-50' },
              { label: 'Experience',value: `${tutor.experience_years}y`,             icon: Award,   color: 'text-violet-600 bg-violet-50' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card text-center py-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                  <Icon size={16} />
                </div>
                <p className="text-xl font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Booking card */}
        <div className="card sticky top-24 h-fit shadow-card-md">
          <p className="text-3xl font-bold text-text-primary mb-0.5">
            ₹{tutor.hourly_rate}
            <span className="text-text-muted font-normal text-base">/hr</span>
          </p>
          <p className="text-text-muted text-xs mb-4">1-on-1 session</p>
          <button className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm">
            <Calendar size={15} /> Book a Session
          </button>
          <p className="text-xs text-text-muted text-center mt-3">Free cancellation up to 24h before</p>
        </div>
      </div>
    </div>
  );
}
