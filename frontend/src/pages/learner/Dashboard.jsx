import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Trophy, BookOpen, Zap, ArrowRight, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import XPBar from '../../components/XPBar';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg}`}>
      <Icon size={20} className={color} />
    </div>
    <div>
      <p className="text-2xl font-bold text-text-primary dark:text-white">{value}</p>
      <p className="text-text-muted text-xs font-medium">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuthStore();

  // Auto-check streak on dashboard load (once per day via Redis TTL)
  useEffect(() => {
    api.post('/gamification/streak').catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/users/learner/progress').then(r => r.data.data),
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Welcome back, {user?.first_name}! 👋</h1>
          <p className="page-subtitle">
            {profile?.streak_days > 0
              ? `You're on a ${profile.streak_days}-day streak — keep it up!`
              : 'Start your learning journey today.'}
          </p>
        </div>
        <Link to="/generate" className="btn-primary flex items-center gap-2 text-sm">
          <Zap size={15} /> Generate Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap}      label="Total XP"   value={(profile?.xp_total || 0).toLocaleString()} color="text-brand-600"   bg="bg-brand-50 dark:bg-brand-900/30" />
        <StatCard icon={Trophy}   label="Level"      value={profile?.level || 1}                        color="text-amber-600"   bg="bg-amber-50 dark:bg-amber-900/30" />
        <StatCard icon={Flame}    label="Day Streak" value={profile?.streak_days || 0}                  color="text-orange-500"  bg="bg-orange-50 dark:bg-orange-900/30" />
        <StatCard icon={BookOpen} label="Enrolled"   value={enrollments?.length || 0}                   color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-900/30" />
      </div>

      {/* XP Progress */}
      {profile && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-text-primary dark:text-white text-sm">
                Level {profile.level} — <span className="text-brand-600">{profile.level_info?.title}</span>
              </p>
              <p className="text-text-muted text-xs mt-0.5">{profile.xp_to_next_level} XP to next level</p>
            </div>
            <span className="badge-brand">{(profile.xp_total || 0).toLocaleString()} XP</span>
          </div>
          <XPBar current={profile.xp_total} max={profile.xp_total + profile.xp_to_next_level} />
        </div>
      )}

      {/* Active Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Continue Learning</h2>
          <Link to="/courses" className="text-brand-600 text-sm hover:text-brand-700 flex items-center gap-1 font-medium">
            All courses <ArrowRight size={14} />
          </Link>
        </div>

        {enrollments?.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 6).map((e, i) => (
              <motion.div
                key={e.course_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2 }}
                className="card-hover"
              >
                <Link to={`/learn/${e.course_id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center border border-brand-100 dark:border-brand-800/50">
                      <BookOpen size={18} className="text-brand-600" />
                    </div>
                    <span className="text-xs font-semibold text-text-muted">{Math.round(e.progress_pct)}%</span>
                  </div>
                  <h3 className="font-semibold text-text-primary dark:text-white text-sm mb-2 line-clamp-2">{e.title}</h3>
                  <div className="xp-bar mt-3">
                    <div className="xp-fill" style={{ width: `${e.progress_pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                    <Clock size={11} /> {e.last_active || 'Recently enrolled'}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-14 border-dashed">
            <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-brand-500" />
            </div>
            <p className="font-semibold text-text-primary dark:text-white mb-1">No courses yet</p>
            <p className="text-text-muted text-sm mb-5">Generate your first AI-powered course to get started</p>
            <Link to="/generate" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Zap size={15} /> Generate Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
