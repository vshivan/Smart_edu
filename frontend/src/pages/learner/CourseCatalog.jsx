import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, BookOpen, Clock, Star, Users, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';

const difficultyStyle = {
  beginner:     'badge-green',
  intermediate: 'badge-yellow',
  advanced:     'badge-red',
};

// ── Skeleton card shown while loading ─────────────────────────────────────────
const SkeletonCard = () => (
  <div className="card animate-pulse">
    <div className="h-32 bg-slate-100 rounded-xl mb-4" />
    <div className="h-3 bg-slate-100 rounded-full w-16 mb-3" />
    <div className="h-4 bg-slate-100 rounded-full w-3/4 mb-2" />
    <div className="h-3 bg-slate-100 rounded-full w-full mb-1" />
    <div className="h-3 bg-slate-100 rounded-full w-2/3 mb-4" />
    <div className="flex justify-between">
      <div className="h-3 bg-slate-100 rounded-full w-10" />
      <div className="h-3 bg-slate-100 rounded-full w-10" />
      <div className="h-3 bg-slate-100 rounded-full w-10" />
    </div>
    <div className="mt-3 pt-3 border-t border-surface-border flex justify-between">
      <div className="h-4 bg-slate-100 rounded-full w-12" />
      <div className="h-3 bg-slate-100 rounded-full w-20" />
    </div>
  </div>
);

// ── Course card ───────────────────────────────────────────────────────────────
const CourseCard = ({ course, i }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.04 }}
    whileHover={{ y: -3, boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)' }}
    className="card-hover"
  >
    <Link to={`/courses/${course.id}`}>
      <div className="w-full h-32 bg-gradient-to-br from-brand-50 to-violet-50 rounded-xl mb-4 flex items-center justify-center border border-brand-100">
        <BookOpen size={28} className="text-brand-500" />
      </div>
      <span className={`${difficultyStyle[course.difficulty] || 'badge-gray'} mb-2`}>
        {course.difficulty}
      </span>
      <h3 className="font-semibold text-text-primary text-sm mb-1 line-clamp-2 mt-1">{course.title}</h3>
      <p className="text-text-muted text-xs mb-3 line-clamp-2">{course.description}</p>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1"><Clock size={11} /> {course.estimated_hours}h</span>
        <span className="flex items-center gap-1"><Users size={11} /> {course.total_enrolled}</span>
        <span className="flex items-center gap-1 text-amber-500">
          <Star size={11} fill="currentColor" /> {parseFloat(course.rating || 0).toFixed(1)}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
        <span className="text-brand-600 font-bold text-sm">
          {course.is_free ? 'Free' : `₹${course.price}`}
        </span>
        <span className="text-xs text-text-muted truncate max-w-[100px]">{course.creator_name}</span>
      </div>
    </Link>
  </motion.div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function CourseCatalog() {
  const [search,     setSearch]     = useState('');
  const [difficulty, setDifficulty] = useState('');

  // Debounce search so API only fires 400ms after the user stops typing
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', debouncedSearch, difficulty],
    queryFn: () =>
      api.get(`/courses?search=${encodeURIComponent(debouncedSearch)}&difficulty=${difficulty}`)
        .then(r => r.data),
  });

  const courses = data?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">Course Catalog</h1>
        <p className="text-text-muted">Explore AI-generated and tutor-created courses</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search courses..."
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="input pl-9 w-44 appearance-none"
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-16 border-dashed">
          <BookOpen size={36} className="text-text-muted mx-auto mb-3" />
          <p className="font-semibold text-text-primary mb-1">No courses found</p>
          <p className="text-text-muted text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {courses.map((c, i) => <CourseCard key={c.id} course={c} i={i} />)}
        </div>
      )}
    </div>
  );
}
