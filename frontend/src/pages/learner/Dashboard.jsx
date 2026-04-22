import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Trophy, BookOpen, Zap, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import XPBar from '../../components/XPBar';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuthStore();

  const { data: profile } = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api.get('/gamification/profile').then(r => r.data.data),
  });

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: () => api.get('/users/learner/progress').then(r => r.data.data),
  });

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-400 mt-1">Keep up the momentum — you're on a {profile?.streak_days || 0}-day streak!</p>
        </div>
        <Link to="/generate" className="btn-primary flex items-center gap-2">
          <Zap size={16} /> Generate Course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap}     label="Total XP"      value={profile?.xp_total || 0}      color="bg-brand-600" />
        <StatCard icon={Trophy}  label="Level"         value={profile?.level || 1}          color="bg-yellow-600" />
        <StatCard icon={Flame}   label="Day Streak"    value={profile?.streak_days || 0}    color="bg-orange-600" />
        <StatCard icon={BookOpen} label="Courses"      value={enrollments?.length || 0}     color="bg-green-600" />
      </div>

      {/* XP Progress */}
      {profile && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-white">Level {profile.level} — {profile.level_info?.title}</p>
              <p className="text-gray-400 text-sm">{profile.xp_to_next_level} XP to next level</p>
            </div>
            <span className="badge bg-brand-600/20 text-brand-400 border border-brand-500/20">
              {profile.xp_total} XP
            </span>
          </div>
          <XPBar current={profile.xp_total} max={profile.xp_total + profile.xp_to_next_level} />
        </div>
      )}

      {/* Active Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Continue Learning</h2>
          <Link to="/courses" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
            All courses <ArrowRight size={14} />
          </Link>
        </div>

        {enrollments?.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrollments.slice(0, 6).map((e) => (
              <motion.div
                key={e.course_id}
                whileHover={{ y: -2 }}
                className="card hover:border-brand-500/30 transition-all cursor-pointer"
              >
                <Link to={`/learn/${e.course_id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-brand-600/20 rounded-lg flex items-center justify-center">
                      <BookOpen size={18} className="text-brand-400" />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round(e.progress_pct)}%</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">{e.title}</h3>
                  <div className="xp-bar mt-3">
                    <div className="xp-fill" style={{ width: `${e.progress_pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock size={11} /> Last active {e.last_active || 'recently'}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <BookOpen size={40} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No courses yet. Generate your first AI course!</p>
            <Link to="/generate" className="btn-primary inline-flex items-center gap-2">
              <Zap size={16} /> Generate Course
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
