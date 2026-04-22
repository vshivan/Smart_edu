import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, Clock, Star, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const CourseCard = ({ course }) => (
  <motion.div whileHover={{ y: -3 }} className="card hover:border-brand-500/30 transition-all cursor-pointer">
    <Link to={`/courses/${course.id}`}>
      <div className="w-full h-36 bg-gradient-to-br from-brand-600/20 to-purple-600/20 rounded-xl mb-4 flex items-center justify-center">
        <BookOpen size={32} className="text-brand-400" />
      </div>
      <span className={`badge text-xs mb-2 ${course.difficulty === 'beginner' ? 'bg-green-600/10 text-green-400 border border-green-500/20' : course.difficulty === 'intermediate' ? 'bg-yellow-600/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-600/10 text-red-400 border border-red-500/20'}`}>
        {course.difficulty}
      </span>
      <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2">{course.title}</h3>
      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{course.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1"><Clock size={11} /> {course.estimated_hours}h</span>
        <span className="flex items-center gap-1"><Users size={11} /> {course.total_enrolled}</span>
        <span className="flex items-center gap-1 text-yellow-400"><Star size={11} fill="currentColor" /> {parseFloat(course.rating || 0).toFixed(1)}</span>
      </div>
      <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
        <span className="text-brand-400 font-semibold text-sm">{course.is_free ? 'Free' : `$${course.price}`}</span>
        <span className="text-xs text-gray-500">{course.creator_name}</span>
      </div>
    </Link>
  </motion.div>
);

export default function CourseCatalog() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, difficulty],
    queryFn: () => api.get(`/courses?search=${search}&difficulty=${difficulty}`).then(r => r.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Course Catalog</h1>
        <p className="text-gray-400">Explore AI-generated and tutor-created courses</p>
      </div>

      <div className="flex gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search courses..." />
        </div>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input w-40">
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-surface-hover" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(data?.data || []).map(c => <CourseCard key={c.id} course={c} />)}
        </div>
      )}
    </div>
  );
}
