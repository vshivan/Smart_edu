import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Star, Clock, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';

export default function TutorMarketplace() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['tutors', debouncedSearch],
    queryFn: () => api.get(`/tutors?search=${encodeURIComponent(debouncedSearch)}`).then(r => r.data),
  });

  const tutors = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Find a Tutor</h1>
        <p className="text-text-muted">Book 1-on-1 sessions with verified expert tutors</p>
      </div>

      <div className="relative max-w-md mb-8">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search by subject or name..." />
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-48 animate-pulse bg-surface-hover" />)}
        </div>
      ) : tutors.length === 0 ? (
        <div className="card text-center py-16 border-dashed">
          <BookOpen size={36} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary mb-1">No tutors found</p>
          <p className="text-text-muted text-sm">Try a different search term</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tutors.map((tutor, i) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="card-hover"
            >
              <Link to={`/tutors/${tutor.id}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-violet-100 border-2 border-violet-200 flex items-center justify-center text-xl font-bold text-violet-700">
                    {tutor.first_name?.[0]}{tutor.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{tutor.first_name} {tutor.last_name}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={11} /> {tutor.experience_years}y experience
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} fill="#f59e0b" className="text-amber-400" />
                      <span className="text-amber-600 text-xs font-semibold">{parseFloat(tutor.rating || 0).toFixed(1)}</span>
                      <span className="text-text-muted text-xs">({tutor.total_reviews})</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(tutor.skills || []).slice(0, 3).map(s => (
                    <span key={s} className="badge-gray text-xs">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                  <span className="font-bold text-text-primary">
                    ₹{tutor.hourly_rate}<span className="text-text-muted font-normal text-sm">/hr</span>
                  </span>
                  <span className="badge-green text-xs">Available</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
