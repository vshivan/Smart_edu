import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Star, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function TutorMarketplace() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['tutors', search],
    queryFn: () => api.get(`/tutors?search=${search}`).then(r => r.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Find a Tutor</h1>
        <p className="text-gray-400">Book 1-on-1 sessions with verified expert tutors</p>
      </div>

      <div className="relative max-w-md mb-8">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search by subject or name..." />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? [...Array(6)].map((_, i) => <div key={i} className="card h-48 animate-pulse bg-surface-hover" />) :
          (data?.data || []).map((tutor, i) => (
            <motion.div key={tutor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }} className="card hover:border-brand-500/30 transition-all">
              <Link to={`/tutors/${tutor.id}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-purple-600/20 border-2 border-purple-500/30 flex items-center justify-center text-xl font-bold text-purple-400">
                    {tutor.first_name?.[0]}{tutor.last_name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{tutor.first_name} {tutor.last_name}</p>
                    <p className="text-xs text-gray-400">{tutor.experience_years}y experience</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={12} fill="#f59e0b" className="text-yellow-400" />
                      <span className="text-yellow-400 text-xs font-semibold">{parseFloat(tutor.rating || 0).toFixed(1)}</span>
                      <span className="text-gray-500 text-xs">({tutor.total_reviews})</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(tutor.skills || []).slice(0, 3).map(s => (
                    <span key={s} className="badge bg-surface text-gray-400 border border-surface-border text-xs">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">${tutor.hourly_rate}<span className="text-gray-500 font-normal text-sm">/hr</span></span>
                  <span className="badge bg-green-600/10 text-green-400 border border-green-500/20 text-xs">Available</span>
                </div>
              </Link>
            </motion.div>
          ))
        }
      </div>
    </div>
  );
}
